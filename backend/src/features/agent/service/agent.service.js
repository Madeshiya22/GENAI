import { mentoGraph } from "../graph/mento.graph.js";

export async function runAgent({ input, messages = [] }) {
  try {
    const result = await mentoGraph.invoke({
      input,

      messages,
    });

    return result.response;
  } catch (error) {
    console.log(error);

    throw new Error("Agent execution failed");
  }
}
