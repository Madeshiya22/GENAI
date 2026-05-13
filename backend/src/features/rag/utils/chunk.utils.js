import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkText(text) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,

      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([text]);

    return chunks;
  } catch (error) {
    console.log(error);

    throw new Error("Failed to chunk text");
  }
}
