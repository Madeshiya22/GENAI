import { useDispatch } from "react-redux";

import {
  addMessage,
  appendContentToLastMessage,
  setActiveChatId,
  setStreaming,
} from "../state/chat.slice";

import { sendMessage } from "../services/chat.api";

export const useChat = () => {
  const dispatch = useDispatch();

  // CREATE CHAT
  const createChat = async () => {
    const response = await fetch("/api/chat/message/new", {
      method: "POST",

      credentials: "include",
    });

    const data = await response.json();

    dispatch(setActiveChatId(data.chatId));
  };

  // SEND MESSAGE
  const handleSendMessage = async (chatId, userInput) => {
    // USER MESSAGE
    dispatch(
      addMessage({
        role: "user",
        content: userInput,
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
    await sendMessage(chatId, userInput, (chunk) => {
        dispatch(appendContentToLastMessage({ chunk }),
        );
      },
    );

    // END STREAMING
    dispatch(setStreaming(false));
  };

  return {
    createChat,

    handleSendMessage,
  };
};
