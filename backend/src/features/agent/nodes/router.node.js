import model from "../../../services/ai.service.js";

export async function routerNode(state) {
  try {
    const conversationHistory = (state.messages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `
You are an intelligent AI router.

Your job:
decide which route should
handle the user request.

Available routes:

1. WEB
Use for:
- latest news
- realtime info
- current events
- weather
- live scores
- trending topics
- stock/crypto prices
- recent updates

2. RAG
Use for:
- PDF questions
- uploaded document questions
- questions about marksheets
- questions referencing uploaded files
- follow-up document questions

3. CHAT
Use for:
- coding help
- explanations
- normal conversation
- general AI chat
- mentoring

Rules:
- Reply ONLY with:
WEB
RAG
CHAT

- No explanations
- No extra text

Conversation History:
${conversationHistory}

Current User Message:
${state.input}
`;

    const response = await model.invoke(prompt);

    const route = response.content.trim().toUpperCase();

    // FALLBACK SAFETY
    if (!["WEB", "RAG", "CHAT"].includes(route)) {
      return {
        ...state,

        route: "CHAT",
      };
    }

    return {
      ...state,

      route,
    };
  } catch (error) {
    console.log(error);

    return {
      ...state,

      route: "CHAT",
    };
  }
}
