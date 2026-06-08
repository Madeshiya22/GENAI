import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  messages: [],
  activeChatId: null,
  loading: false,
  streaming: false,
  tempChatActive: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    appendContentToLastMessage: (state, action) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage) {
        lastMessage.content += action.payload.chunk;
      }
    },
    setSourcesForLastMessage: (state, action) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage) {
        lastMessage.sources = action.payload.sources;
      }
    },
    removeLastMessage: (state) => {
      state.messages.pop();
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setStreaming: (state, action) => {
      state.streaming = action.payload;
    },
    clearChatState: (state) => {
      state.chats = [];
      state.messages = [];
      state.activeChatId = null;
      state.loading = false;
      state.streaming = false;
      state.tempChatActive = false;
    },
    removeChat: (state, action) => {
      state.chats = state.chats.filter((chat) => chat._id !== action.payload);
    },

    // Update a chat's title in the sidebar list (real-time)
    updateChatTitle: (state, action) => {
      const { chatId, title } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) {
        chat.title = title;
      }
    },

    // Start a temporary new chat (no backend call)
    startTempChat: (state) => {
      state.tempChatActive = true;
      state.activeChatId = null;
      state.messages = [];
    },

    // Discard temp chat without saving (user navigated away without sending)
    discardTempChat: (state) => {
      state.tempChatActive = false;
      // activeChatId and messages will be set by the subsequent setActiveChatId/setMessages calls
    },

    // Convert temp chat to real chat after first message
    finalizeTempChat: (state, action) => {
      const { chat } = action.payload;
      state.tempChatActive = false;
      state.activeChatId = chat._id;
      state.chats.unshift(chat);
    },
  },
});

export const {
  setChats,
  setMessages,
  addMessage,
  appendContentToLastMessage,
  setSourcesForLastMessage,
  removeLastMessage,
  setActiveChatId,
  setStreaming,
  clearChatState,
  removeChat,
  updateChatTitle,
  startTempChat,
  discardTempChat,
  finalizeTempChat,
} = chatSlice.actions;
export default chatSlice.reducer;
