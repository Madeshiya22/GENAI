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

export async function webNode(state) {
  try {
    const search = await searchWeb(state.input);
    const sources = normalizeSources(search.results);

    if (sources.length === 0) {
      return {
        ...state,

        sources: [],

        response:
          "I could not fetch realtime web results right now. Please try again in a moment.",
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

    const response = await model.invoke(prompt);

    return {
      ...state,

      sources,

      response: response.content,
    };
  } catch (error) {
    console.log("Web node error:", error.message);

  return {
    ...state,

    response:
      "WEB SEARCH NODE WORKING",
  };
}