import { createSloice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  messages: [],
  activeChatId: null,
  loading: false,
  streaming: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChat: (state, action) => {
      state.chats = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      /**
       * action.payload = {
       *   role: "user" | "assistant",
       *   content: "message content",
       *   timestamp: Date.now()
       * }
       */
      state.messages.push(action.payload);
    },
    appendContentToLastMessage: (state, action) => {
      /**
       * action.payload = {
       *   chunk: "new chunk of content to be appended to the last message"
       * }
       */

      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage) {
        lastMessage.content += action.payload.chunk;
      }
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setStreaming: (state, action) => {
      state.streaming = action.payload;
    },
  },
});

export const {
  setChat,
  setMessages,
  addMessage,
  appendContentToLastMessage,
  setActiveChatId,
  setStreaming,
} = chatSlice.actions;
export default chatSlice.reducer;
