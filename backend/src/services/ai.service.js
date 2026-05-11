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

// AI-BASED WEB SEARCH DETECTION
export async function shouldSearchWeb(message) {

  try {

    const prompt = `
Determine whether this user query requires realtime web search.

User Query:
"${message}"

Rules:
- Answer ONLY with YES or NO
- Use YES for:
  - latest news
  - current events
  - live scores
  - weather
  - stock prices
  - realtime updates
  - recent information
  - trending topics

Examples:
"latest AI news" -> YES
"weather today" -> YES
"Who won yesterday IPL match?" -> YES
"What is React?" -> NO
"Explain recursion" -> NO

Answer:
`;

    const response = await model.invoke(prompt);

    return response.content
      .trim()
      .toUpperCase()
      .includes("YES");

  } catch (error) {

    console.log(
      "Web detection error:",
      error.message
    );

    return false;
  }
}

// STREAMING RESPONSE
export async function getStream(messages) {

  const stream = await agent.stream(
    {
      messages,
    },
    {
      streamMode: "messages",
    },
  );

  return stream;
}

// GENERATE CHAT TITLE
export async function generateTitle(message) {

  const prompt = `
Generate a very short chat title 
for this message.

Message:
${message}

Rules:
- maximum 5 words
- no quotes
- no special characters
- concise
`;

  const response = await model.invoke(prompt);

  return response.content.trim();
}
