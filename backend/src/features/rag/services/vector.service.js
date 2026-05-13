import { MemoryVectorStore } from "langchain/vectorstores/memory";

import { MistralAIEmbeddings } from "@langchain/mistralai";

import config from "../../../config/config.js";

const embeddings = new MistralAIEmbeddings({
  model: "mistral-embed",

  apiKey: config.MISTRAL_API_KEY,
});

export let vectorStore = null;

export async function createVectorStore(chunks) {
  try {
    vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

    return vectorStore;
  } catch (error) {
    console.log(error);

    throw new Error("Failed to create vector store");
  }
}

// SEARCH RELEVANT CHUNKS
export async function searchSimilarChunks(query) {
  try {
    if (!vectorStore) {
      throw new Error("Vector store not initialized");
    }

    const results = await vectorStore.similaritySearch(query, 4);

    return results;
  } catch (error) {
    console.log(error);

    throw new Error("Failed to search chunks");
  }
}
