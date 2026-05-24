import { mentoGraph } from "../graph/mento.graph.js";

export async function runAgent({ input, messages = [], userId, documentIds = [] }, config = {}) {
  try {
    const result = await mentoGraph.invoke({
      input,
      messages,
      userId,
      documentIds,
    }, config);

    return {
      response: result.response,
      route: result.route,
      sources: result.sources || [],
    };
  } catch (error) {
    console.log(error);
    throw new Error("Agent execution failed");
  }
}
