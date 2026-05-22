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

export async function chatNode(state) {
  try {
    const identityResponse = getIdentityResponse(state.input || "");

    if (identityResponse) {
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

    const response = await model.invoke(formattedMessages);

    return {
      ...state,

      response: response.content,
    };
  } catch (error) {
    console.log(error);

    return {
      ...state,

      response: "Failed to generate response.",
    };
  }
}
