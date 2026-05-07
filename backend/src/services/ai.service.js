import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent } from "langchain";
import config from "../config/config.js";

const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: config.MISTRAL_API_KEY,
});

const agent = createAgent({
  model,
  tools: [],
});

// normal response
export async function generateResponse(messages) {

  const response = await model.invoke(messages);

  return response.content;
}

// streaming response
export async function getStream(messages) {

  const stream = await agent.stream(
    {
      messages,
    },
    {
      streamMode: "messages",
    }
  );

  return stream;
}