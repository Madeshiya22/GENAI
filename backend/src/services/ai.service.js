import { chatMistralAI } from "@langchain/mistralai";
import { config } from "../config/config.js";

const model = new chatMistralAI({
  model: "mistral-medium-latest",
  apiKey: config.MISTRAL_API_KEY,
});

export async function generateResponse(messages, onChunk) {
  try {
    const stream = await model.stream(messages); // streaming starts here

    for await (const chunk of stream) {
      onChunk(chunk.content); // Log each chunk as it arrives
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}
