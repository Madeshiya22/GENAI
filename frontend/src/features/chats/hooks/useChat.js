import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  appendContentToLastMessage,
  setSourcesForLastMessage,
  removeLastMessage,
  setStreaming,
  finalizeTempChat,
  updateChatTitle,
} from "../state/chat.slice";

import {
  setSearchingWeb,
  setSources,
  clearSources,
} from "../state/webSearch.slice";

import { sendMessage, createChat } from "../services/chat.api";

let activeStreamAbortController = null;
let pendingMessageText = "";

export const useChat = () => {
  const dispatch = useDispatch();
  const { tempChatActive } = useSelector((state) => state.chat);

  const abortCurrentStream = () => {
    activeStreamAbortController?.abort();
  };

  // SEND MESSAGE (handles both temp and real chats)
  const handleSendMessage = async (chatId, userInput, attachments = []) => {
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

    // CLEAR OLD WEB SEARCH STATE
    dispatch(clearSources());

    // USER MESSAGE
    dispatch(
      addMessage({
        role: "user",
        content: trimmedMessage,
        attachments,
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
          attachments,
          signal: activeStreamAbortController.signal,

          onTitle: (title) => {
            dispatch(
              updateChatTitle({
                chatId: actualChatId,
                title,
              })
            );
          },

          onSearching: (value) => {
            dispatch(setSearchingWeb(value));
          },

          onSources: (sources) => {
            dispatch(setSources(sources));
            dispatch(setSourcesForLastMessage({ sources }));
          },
        }
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
