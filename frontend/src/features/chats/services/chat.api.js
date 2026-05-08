export async function sendMessage(chatId, userInput, onChunk = () => {}) {
  try {
    const response = await fetch(`/api/chat/message/message/${chatId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userInput,
      }),
    });

    const decoder = new TextDecoder();

    for await (const chunk of response.body) {
      const text = decoder.decode(chunk);

      const lines = text.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.replace("data:", "");

          const data = JSON.parse(jsonStr);

          onChunk(data.chunk);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

// CREATE NEW CHAT
export async function createChat() {
  try {
    const response = await fetch("/api/chat/message/new", {
      method: "POST",

      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
  }
}

// GET ALL CHATS
export async function getChats() {
  try {
    const response = await fetch("/api/chat/message/all", {
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
  }
}

// GET CHAT MESSAGES
export async function getMessages(chatId) {
  try {
    const response = await fetch(`/api/chat/message/${chatId}/messages`, {
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
  }
}
