import model from "../../../services/ai.service.js";

export async function chatNode(state) {
  try {
    const formattedMessages = [
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
