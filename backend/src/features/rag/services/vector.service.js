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

async function createEmbeddingRecords(chunks, documentId, fileName) {
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
          documentId,
          fileName,
        },
      });
    });
  }

  return records;
}

function getVectorIndex(userId) {
  if (!userId) {
    return pineconeIndex.namespace(DEFAULT_NAMESPACE);
  }
  return pineconeIndex.namespace(`user_${userId}`);
}

// CREATE VECTOR STORE
export async function createVectorStore(chunks, documentId, userId, fileName) {
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("No chunks available to index");
    }

    const records = await createEmbeddingRecords(chunks, documentId, fileName);

    if (records.length === 0) {
      throw new Error("No valid vectors were generated from the PDF");
    }

    const batches = chunkArray(records, UPSERT_BATCH_SIZE);
    const targetIndex = getVectorIndex(userId);

    for (const batch of batches) {
      await targetIndex.upsert({
        records: batch.map((vector) => ({
          id: vector.id,
          values: vector.values,
          metadata: vector.metadata,
        }))
      });
    }

    console.log(
      `Indexed ${records.length} PDF chunks in Pinecone namespace user_${userId || DEFAULT_NAMESPACE}`
    );

    return true;
  } catch (error) {
    console.error("PDF vector indexing failed:", error);
    const uploadError = new Error(
      "Failed to index PDF content. Please try again with a smaller PDF or retry in a moment."
    );
    uploadError.statusCode = getErrorStatus(error) === 429 ? 429 : 502;
    throw uploadError;
  }
}

// SEARCH CHUNKS
export async function searchSimilarChunks(query, userId, documentIds = [], topK = 6) {
  try {
    const queryEmbedding = await embeddings.embedQuery(query);
    const targetIndex = getVectorIndex(userId);

    const queryOptions = {
      vector: Array.from(queryEmbedding),
      topK: topK,
      includeMetadata: true,
    };

    // If specific document IDs are specified, filter chunks to only those files
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      queryOptions.filter = {
        documentId: { $in: documentIds },
      };
    }

    const searchResult = await targetIndex.query(queryOptions);

    return (searchResult.matches || [])
      .filter((match) => match.metadata?.text && (match.score === undefined || match.score >= 0.3))
      .map((match) => ({
        pageContent: match.metadata.text,
        score: match.score,
        chunk: match.metadata?.chunk,
        documentId: match.metadata?.documentId,
        fileName: match.metadata?.fileName || "Unknown Document",
      }));
  } catch (error) {
    console.error("Pinecone query failed:", error);
    const searchError = new Error("Failed to search this PDF.");
    searchError.statusCode = getErrorStatus(error) || 502;
    throw searchError;
  }
}

// DELETE DOCUMENT VECTORS
export async function deleteDocumentVectors(documentId, userId) {
  try {
    const targetIndex = getVectorIndex(userId);
    await targetIndex.deleteMany({
      filter: {
        documentId: { $eq: documentId },
      },
    });
    console.log(`Deleted Pinecone vectors for doc: ${documentId} in user_${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete vectors for document ${documentId}:`, error);
    return false;
  }
}
