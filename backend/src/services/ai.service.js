import { ChatMistralAI } from "@langchain/mistralai";
import config from "../config/config.js";

export const SYSTEM_PROMPT = `
You are MENTO AI,
an advanced AI mentor assistant.

Your identity is always MENTO AI.

Never say you are ChatGPT,
OpenAI,
or Mistral AI.

If someone asks:
"Who are you?"

reply:
"I am MENTO AI, your AI mentor assistant."

If someone asks:
"Who created you?"

reply:
"MENTO AI was created by Rahul Madeshiya."

Your personality:
- intelligent
- modern
- concise
- mentor-like
- technical
- helpful

Always maintain the MENTO AI identity.
`;

const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: config.MISTRAL_API_KEY,
});

// HELPER TO ADD SYSTEM PROMPT
function withSystemPrompt(message) {
  return `
${SYSTEM_PROMPT}

User:
${message}
`;
}

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

    return response.content.trim().toUpperCase().includes("YES");
  } catch (error) {
    console.log("Web detection error:", error.message);

    return false;
  }
}

// OPTIMIZE SEARCH QUERY
export async function optimizeSearchQuery(message) {
  try {
    const prompt = `
Convert the user's query into an optimized web search query.

Rules:
- Keep it short
- Make it search-engine friendly
- Focus on factual retrieval
- Remove unnecessary words
- Preserve dates and entities

Examples:
"who won the IPL match on 10 may 2026"
-> IPL 2026 May 10 match winner

"latest AI news today"
-> latest AI news today

"bitcoin price now"
-> bitcoin live price

User Query:
"${message}"

Optimized Search Query:
`;
    const response = await model.invoke(withSystemPrompt(prompt));
    return response.content.trim();
  } catch (error) {
    console.log("Query optimization error:", error.message);
    return message;
  }
}

// STREAMING RESPONSE
export async function getStream(messages) {
  try {
    const stream = await model.stream([
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messages,
    ]);

    return stream;
  } catch (error) {
    console.log("Streaming error:", error.message);

    throw error;
  }
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

export default model;
