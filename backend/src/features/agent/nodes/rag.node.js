import model from "../../../services/ai.service.js";
import { searchSimilarChunks } from "../../rag/services/vector.service.js";

export async function ragNode(state, config) {
  try {
    const conversationHistory = (state.messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // 1. Rephrase the query for conversational RAG memory
    let searchQuery = state.input;
    if (state.messages && state.messages.length > 0) {
      try {
        const rephrasePrompt = `
Given the following conversation history and a follow-up question, rephrase the follow-up question into a standalone question that can be used to search a PDF.
Do not answer the question. Only output the rephrased standalone question.

Conversation History:
${conversationHistory}

Follow-up Question:
${state.input}

Standalone Question:
`;
        const rephraseResponse = await model.invoke(rephrasePrompt);
        const rephrasedText = rephraseResponse.content.trim();
        if (rephrasedText) {
          searchQuery = rephrasedText;
        }
      } catch (err) {
        console.log("Conversational RAG rephrasing failed:", err.message);
      }
    }

    // 2. Search Pinecone inside the user's namespace, filtered by current documentIds
    const chunks = await searchSimilarChunks(
      searchQuery,
      state.userId,
      state.documentIds,
      6
    );

    // Map chunk records to UI source cards
    const sources = chunks.map((chunk, index) => ({
      id: index + 1,
      title: chunk.fileName,
      content: chunk.pageContent,
      url: null, // local file
    }));

    if (config?.configurable?.onSources) {
      config.configurable.onSources(sources);
    }

    if (chunks.length === 0) {
      const fallbackMsg = "Answer not found in PDF.";
      if (config?.configurable?.onChunk) {
        config.configurable.onChunk(fallbackMsg);
      }
      return {
        ...state,
        sources: [],
        response: fallbackMsg,
      };
    }

    // 3. Format context with source tracking
    const context = chunks
      .map((chunk, index) => {
        return `[Source PDF: ${chunk.fileName}, Chunk: ${chunk.chunk || index + 1}]\n${chunk.pageContent}`;
      })
      .join("\n\n");

    const prompt = `
You are MentoAI.
Answer the user's question ONLY from the provided PDF context.

Rules:
- If answer is not found in the context, say:
"Answer not found in PDF."
- Be concise
- Be accurate
- Use context only
- Reference the Source PDF filename when answering.

Conversation History:
${conversationHistory}

PDF Context:
${context}

Current Question:
${state.input}
`;

    // 4. Stream response
    const stream = await model.stream(prompt);
    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.content || "";
      fullResponse += content;
      if (config?.configurable?.onChunk) {
        config.configurable.onChunk(content);
      }
    }

    return {
      ...state,
      sources,
      response: fullResponse,
    };
  } catch (error) {
    console.error("RAG node error:", error);
    const errorMsg = "Failed to search PDF.";
    if (config?.configurable?.onChunk) {
      config.configurable.onChunk(errorMsg);
    }
    return {
      ...state,
      sources: [],
      response: errorMsg,
    };
  }
}
