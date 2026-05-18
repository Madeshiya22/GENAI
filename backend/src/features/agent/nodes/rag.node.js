import model from "../../../services/ai.service.js";

import { searchSimilarChunks } from "../../rag/services/vector.service.js";

export async function ragNode(state) {
  try {
    const chunks = await searchSimilarChunks(state.input);

    const context = chunks.map((chunk) => chunk.pageContent).join("\n\n");

    const conversationHistory = (state.messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `
You are MentoAI.

Answer the user's question
ONLY from the provided PDF context.

Rules:
- If answer is not found,
say:
"Answer not found in PDF."

- Be concise
- Be accurate
- Use context only

Conversation History:
${conversationHistory}

PDF Context:
${context}

Current Question:
${state.input}
`;

    const response = await model.invoke(prompt);

    return {
      ...state,

      response: response.content,
    };
  } catch (error) {
    console.log(error);

    return {
      ...state,

      response: "Failed to search PDF.",
    };
  }
}
