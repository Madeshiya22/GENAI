import model, { SYSTEM_PROMPT } from "../../../services/ai.service.js";

function getIdentityResponse(input) {
  const normalizedInput = input.trim().toLowerCase();

  if (
    /^(who|what)\s+(are|r)\s+you\??$/.test(normalizedInput) ||
    /^(what'?s|what is)\s+your\s+name\??$/.test(normalizedInput)
  ) {
    return "I am MENTO AI, your AI mentor assistant.";
  }

  if (/^who\s+(created|made|built)\s+you\??$/.test(normalizedInput)) {
    return "MENTO AI was created by Rahul Madeshiya.";
  }

  return null;
}

export async function chatNode(state, config) {
  try {
    const identityResponse = getIdentityResponse(state.input || "");

    if (identityResponse) {
      if (config?.configurable?.onChunk) {
        config.configurable.onChunk(identityResponse);
      }
      return {
        ...state,
        response: identityResponse,
      };
    }

    const formattedMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...(state.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: state.input,
      },
    ];

    const stream = await model.stream(formattedMessages);
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
      response: fullResponse,
    };
  } catch (error) {
    console.error(error);
    return {
      ...state,
      response: "Failed to generate response.",
    };
  }
}
