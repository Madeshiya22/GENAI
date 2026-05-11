import { tavily } from "@tavily/core";
import  config  from "../config/config.js";

const tvly = tavily({
  apiKey: config.TAVILY_API_KEY,
});

export async function searchWeb(query) {

  try {

    const response = await tvly.search(query, {
      maxResults: 5,
    });

    return response.results;

  } catch (error) {

    console.log("Tavily Error:", error.message);

    return [];
  }
}