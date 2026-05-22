import { API_BASE_URL } from "../../../config/config";  
export async function sendMessage(
  chatId,
  userInput,
  onChunk = () => { },
  options = {},
) {
  const {
    attachments = [],
    signal,
    onTitle,
    onSearching,
    onSources,
  } = options;
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message/${chatId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        message: userInput,
        attachments,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send message";

      try {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          errorMessage = data?.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      } catch {
        // ignore parse errors
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      return;
    }

    const decoder = new TextDecoder();

    for await (const chunk of response.body) {
      const text = decoder.decode(chunk);

      const lines = text.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.replace("data:", "");

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "title" && onTitle) {

              onTitle(data.title);

            } else if (
              data.type === "searching" &&
              onSearching
            ) {

              onSearching(data.searching ?? true);

            } else if (
              data.type === "sources" &&
              onSources
            ) {

              onSources(data.sources);

              if (onSearching) {
                onSearching(false);
              }

            } else if (data.chunk !== undefined) {

              onChunk(data.chunk);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.log(error);
    }

    throw error;
  }
}

// CREATE NEW CHAT
export async function createChat() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message/new`, {
      method: "POST",

      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// GET ALL CHATS
export async function getChats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message/all`, {
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// GET CHAT MESSAGES
export async function getMessages(chatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message/${chatId}/messages`, {
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// DELETE CHAT
export async function deleteChat(chatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message/${chatId}`, {
      method: "DELETE",
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
