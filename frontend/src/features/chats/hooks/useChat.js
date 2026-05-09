import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  appendContentToLastMessage,
  removeLastMessage,
  setStreaming,
  finalizeTempChat,
  updateChatTitle,
} from "../state/chat.slice";

import { sendMessage, createChat } from "../services/chat.api";

let activeStreamAbortController = null;
let pendingMessageText = "";

export const useChat = () => {
  const dispatch = useDispatch();
  const { activeChatId, tempChatActive } = useSelector((state) => state.chat);

  const abortCurrentStream = () => {
    activeStreamAbortController?.abort();
  };

  // SEND MESSAGE (handles both temp and real chats)
  const handleSendMessage = async (chatId, userInput) => {
    const trimmedMessage = userInput.trim();

    if (!trimmedMessage) {
      return false;
    }

    if (pendingMessageText === trimmedMessage) {
      return false;
    }

    pendingMessageText = trimmedMessage;

    let actualChatId = chatId;

    // If temp chat, create real chat on backend first
    if (!actualChatId && tempChatActive) {
      try {
        const data = await createChat();
        actualChatId = data.chat._id;
        dispatch(finalizeTempChat({ chat: data.chat }));
      } catch (error) {
        pendingMessageText = "";
        throw error;
      }
    }

    if (!actualChatId) {
      pendingMessageText = "";
      return false;
    }

    activeStreamAbortController = new AbortController();

    // USER MESSAGE
    dispatch(
      addMessage({
        role: "user",
        content: trimmedMessage,
        timestamp: Date.now(),
      }),
    );

    // EMPTY AI MESSAGE
    dispatch(
      addMessage({
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }),
    );

    // START STREAMING
    dispatch(setStreaming(true));

    // STREAM RESPONSE
    try {
      await sendMessage(
        actualChatId,
        trimmedMessage,
        (chunk) => {
          dispatch(appendContentToLastMessage({ chunk }));
        },
        {
          signal: activeStreamAbortController.signal,
          onTitle: (title) => {
            dispatch(updateChatTitle({ chatId: actualChatId, title }));
          },
        },
      );

      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        dispatch(removeLastMessage());
        dispatch(removeLastMessage());
        throw error;
      }

      return false;
    } finally {
      // END STREAMING
      dispatch(setStreaming(false));
      pendingMessageText = "";
      activeStreamAbortController = null;
    }
  };

  return {
    handleSendMessage,
    abortCurrentStream,
  };
};
