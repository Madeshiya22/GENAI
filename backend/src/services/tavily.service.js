import { tavily } from "@tavily/core";
import config from "../config/config.js";

const tvly = tavily({
  apiKey: config.TAVILY_API_KEY,
});

function getSearchTopic(query) {
  const normalizedQuery = query.toLowerCase();

  if (/\b(stock|stocks|share price|market cap|crypto|bitcoin|ethereum|price)\b/.test(normalizedQuery)) {
    return "finance";
  }

  if (/\b(news|latest|breaking|headline|headlines|today|current|recent|update|updates)\b/.test(normalizedQuery)) {
    return "news";
  }

  return "general";
}

export async function searchWeb(query) {
  try {
    const topic = getSearchTopic(query);
    const searchOptions = {
      searchDepth: "advanced",
      topic: topic,
      maxResults: 5,
      includeAnswer: "advanced",
      includeRawContent: "text",
      includeFavicon: true,
    };

    if (topic === "news") {
      searchOptions.timeRange = "week";
    }

    const response = await tvly.search(query, searchOptions);

    return {
      answer: response.answer || "",
      results: response.results || [],
      query: response.query || query,
    };

  } catch (error) {

    console.log("Tavily Error:", error.message);

    return {
      answer: "",
      results: [],
      query,
    };
  }
}
