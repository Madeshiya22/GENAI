import { randomUUID } from "node:crypto";

import embeddings from "./embedding.service.js";

import { pineconeIndex } from "../config/pineCone.js";

const UPSERT_BATCH_SIZE = 100;
const EMBEDDING_BATCH_SIZE = Number(process.env.RAG_EMBEDDING_BATCH_SIZE || 8);
const MAX_EMBEDDING_RETRIES = Number(process.env.RAG_EMBEDDING_RETRIES || 3);
const RETRY_DELAY_MS = 1000;
const DEFAULT_NAMESPACE = "__default__";

function chunkArray(items, size) {
  const batches = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getErrorStatus(error) {
  return (
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.cause?.status ||
    error?.cause?.statusCode
  );
}

function isRetryableEmbeddingError(error) {
  const status = getErrorStatus(error);

  return !status || status === 429 || status >= 500;
}

async function embedTextBatch(texts) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_EMBEDDING_RETRIES; attempt += 1) {
    try {
      return await embeddings.embedDocuments(texts);
    } catch (error) {
      lastError = error;

      if (!isRetryableEmbeddingError(error) || attempt === MAX_EMBEDDING_RETRIES) {
        break;
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
}

async function createEmbeddingRecords(chunks) {
  const records = [];
  const textItems = chunks
    .map((chunk, index) => ({
      text: chunk?.pageContent?.trim(),
      index,
    }))
    .filter((item) => item.text);

  const batches = chunkArray(textItems, EMBEDDING_BATCH_SIZE);

  for (const batch of batches) {
    const embeddingsForBatch = await embedTextBatch(
      batch.map((item) => item.text),
    );

    embeddingsForBatch.forEach((embedding, batchIndex) => {
      if (!Array.isArray(embedding) || embedding.length === 0) {
        return;
      }

      const item = batch[batchIndex];

      records.push({
        id: randomUUID(),
        values: Array.from(embedding),

        metadata: {
          text: item.text,

          chunk: item.index + 1,
        },
      });
    });
  }

  return records;
}

function getVectorIndex(namespace = DEFAULT_NAMESPACE) {
  if (!namespace || namespace === DEFAULT_NAMESPACE) {
    return pineconeIndex;
  }

  return pineconeIndex.namespace(namespace);
}

// CREATE VECTOR STORE
export async function createVectorStore(chunks, namespace = DEFAULT_NAMESPACE) {
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("No chunks available to index");
    }

    const records = await createEmbeddingRecords(chunks);

    if (records.length === 0) {
      throw new Error("No valid vectors were generated from the PDF");
    }

    const batches = chunkArray(records, UPSERT_BATCH_SIZE);
    const targetIndex = getVectorIndex(namespace);

    for (const batch of batches) {
      await targetIndex.upsert({
        records: batch.map((vector) => ({
          id: vector.id,

          values: vector.values,

          metadata: vector.metadata,
        })),
      });
    }

    console.log(
      `Indexed ${records.length} PDF chunks in Pinecone namespace ${namespace}`,
    );

    return true;
  } catch (error) {
    console.error("PDF vector indexing failed:", error);

    const uploadError = new Error(
      "Failed to index PDF content. Please try again with a smaller PDF or retry in a moment.",
    );

    uploadError.statusCode = getErrorStatus(error) === 429 ? 429 : 502;

    throw uploadError;
  }
}

// SEARCH CHUNKS
export async function searchSimilarChunks(query, namespace = DEFAULT_NAMESPACE) {
  try {
    const queryEmbedding = await embeddings.embedQuery(query);
    const targetIndex = getVectorIndex(namespace);

    const searchResult = await targetIndex.query({
      vector: Array.from(queryEmbedding),

      topK: 4,

      includeMetadata: true,
    });

    return (searchResult.matches || [])
      .filter((match) => match.metadata?.text)
      .map((match) => ({
        pageContent: match.metadata.text,
        score: match.score,
        chunk: match.metadata?.chunk,
      }));
  } catch (error) {
    console.error("Pinecone query failed:", error);

    const searchError = new Error("Failed to search this PDF.");

    searchError.statusCode = getErrorStatus(error) || 502;

    throw searchError;
  }
}
