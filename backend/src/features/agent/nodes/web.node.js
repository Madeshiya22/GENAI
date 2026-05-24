import model, { SYSTEM_PROMPT } from "../../../services/ai.service.js";
import { searchWeb } from "../../../services/tavily.service.js";

const MAX_CONTEXT_CHARS = 1200;

function truncateText(text = "", maxLength = MAX_CONTEXT_CHARS) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
}

function normalizeSources(results = []) {
  return results
    .filter((result) => result?.url && result?.title)
    .map((result, index) => ({
      id: index + 1,
      title: result.title,
      url: result.url,
      content: result.content || result.rawContent || "",
      publishedDate: result.publishedDate || "",
      favicon: result.favicon || "",
    }));
}

function buildSearchContext(sources) {
  return sources
    .map((source) => {
      const publishedDate = source.publishedDate
        ? `Published: ${source.publishedDate}`
        : "Published: not provided";

      return `[${source.id}] ${source.title}
URL: ${source.url}
${publishedDate}
Content: ${truncateText(source.content)}`;
    })
    .join("\n\n");
}

export async function webNode(state, config) {
  try {
    if (config?.configurable?.onSearching) {
      config.configurable.onSearching(true);
    }

    const search = await searchWeb(state.input);
    const sources = normalizeSources(search.results);

    if (config?.configurable?.onSources) {
      config.configurable.onSources(sources);
    }
    if (config?.configurable?.onSearching) {
      config.configurable.onSearching(false);
    }

    if (sources.length === 0) {
      const fallbackMsg = "I could not fetch realtime web results right now. Please try again in a moment.";
      if (config?.configurable?.onChunk) {
        config.configurable.onChunk(fallbackMsg);
      }
      return {
        ...state,
        sources: [],
        response: fallbackMsg,
      };
    }

    const conversationHistory = (state.messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `
${SYSTEM_PROMPT}

You have just performed a realtime web search.
Use ONLY the web search results below to answer the user's question.
If the results disagree, mention the uncertainty.
If a specific value is unavailable in the results, say that clearly.
Include source citations like [1], [2] next to important claims.
Keep the answer concise, current, and useful.

Current Date:
${new Date().toISOString()}

User Question:
${state.input}

Optimized Search Query:
${search.query}

Tavily Direct Answer:
${search.answer || "Not provided"}

Conversation History:
${conversationHistory || "No previous conversation."}

Web Search Results:
${buildSearchContext(sources)}
`;

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
    console.error("Web node error:", error.message);
    if (config?.configurable?.onSearching) {
      config.configurable.onSearching(false);
    }

    const errorMsg = "I could not complete the realtime web search right now. Please try again in a moment.";
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
