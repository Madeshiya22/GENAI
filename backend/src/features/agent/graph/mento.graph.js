import { StateGraph, END } from "@langchain/langgraph";

import { agentState } from "../state/agent.state.js";

import { routerNode } from "../nodes/router.node.js";

import { chatNode } from "../nodes/chat.node.js";

import { ragNode } from "../nodes/rag.node.js";

import { webNode } from "../nodes/web.node.js";

// CREATE GRAPH
const graph = new StateGraph({ channels: agentState });

// ADD NODES
graph.addNode("router", routerNode);

graph.addNode("chat", chatNode);

graph.addNode("rag", ragNode);

graph.addNode("web", webNode);

// ENTRY POINT
graph.setEntryPoint("router");

// ROUTE LOGIC
graph.addConditionalEdges(
  "router",

  (state) => {
    return state.route;
  },

  {
    CHAT: "chat",

    RAG: "rag",

    WEB: "web",
  },
);

// FINISH
graph.addEdge("chat", END);

graph.addEdge("rag", END);

graph.addEdge("web", END);

// COMPILE GRAPH
export const mentoGraph = graph.compile();

