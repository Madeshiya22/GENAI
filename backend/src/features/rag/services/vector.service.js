import { randomUUID } from "node:crypto";

import embeddings from "./embedding.service.js";

import { pineconeIndex } from "../config/pineCone.js";

const UPSERT_BATCH_SIZE = 100;

function chunkArray(items, size) {
  const batches = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

// CREATE VECTOR STORE
export async function createVectorStore(chunks) {
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("No chunks available to index");
    }

    const vectors = await Promise.all(
      chunks.map(async (chunk, index) => {
        const text = chunk?.pageContent?.trim();

        if (!text) {
          return null;
        }

        const embedding = await embeddings.embedQuery(text);

        return {
          id: randomUUID(),
          values: Array.from(embedding),

          metadata: {
            text,

            chunk: index + 1,
          },
        };
      }),
    );

    const records = vectors.filter(
      (vector) => vector && Array.isArray(vector.values) && vector.values.length > 0,
    );

    if (records.length === 0) {
      throw new Error("No valid vectors were generated from the PDF");
    }

    const batches = chunkArray(records, UPSERT_BATCH_SIZE);

    for (const batch of batches) {
      await pineconeIndex.upsert({
        records: batch.map((vector) => ({
          id: vector.id,

          values: vector.values,

          metadata: vector.metadata,
        })),
      });
    }

    console.log(`Indexed ${records.length} PDF chunks in Pinecone`);

    return true;
  } catch (error) {
    console.error("Pinecone upsert failed:", error);

    throw new Error("Failed to create Pinecone vectors");
  }
}

// SEARCH CHUNKS
export async function searchSimilarChunks(query) {
  try {
    const queryEmbedding = await embeddings.embedQuery(query);

    const searchResult = await pineconeIndex.query({
      vector: Array.from(queryEmbedding),

      topK: 4,

      includeMetadata: true,
    });

    return (searchResult.matches || []).map((match) => ({
      pageContent: match.metadata?.text || "",
    }));
  } catch (error) {
    console.error("Pinecone query failed:", error);

    throw new Error("Failed to search Pinecone vectors");
  }
}
