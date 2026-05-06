import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  chats: [],
  tempChat: {
    messages: [],
  },
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats(state, action) {
      state.chats = action.payload ?? []
    },
    appendMessage(state, action) {
      const activeChat = state.chats[state.chats.length - 1]

      if (!activeChat) {
        state.chats.push({ messages: [action.payload] })
        return
      }

      if (!Array.isArray(activeChat.messages)) {
        activeChat.messages = []
      }

      activeChat.messages.push(action.payload)
    },
    appendTempMessage(state, action) {
      if (!Array.isArray(state.tempChat.messages)) {
        state.tempChat.messages = []
      }

      state.tempChat.messages.push(action.payload)
    },
    appendTempMessageContent(state, action) {
      const { index, content } = action.payload ?? {}

      if (typeof index !== 'number' || !Array.isArray(state.tempChat.messages)) {
        return
      }

      const targetMessage = state.tempChat.messages[index]

      if (!targetMessage) {
        return
      }

      targetMessage.content = `${targetMessage.content ?? ''}${content ?? ''}`
    },
    setTempChat(state, action) {
      const incomingChat = action.payload?.chat ?? action.payload ?? {}

      state.tempChat = {
        ...state.tempChat,
        ...incomingChat,
        messages: incomingChat.messages ?? state.tempChat.messages ?? [],
      }
    },
    setChatFromTempChat(state) {
      if (!state.tempChat) {
        return
      }

      state.chats.push({ ...state.tempChat })
      state.tempChat = {
        messages: [],
      }
    },
  },
})

export const {
  setChats,
  appendMessage,
  appendTempMessage,
  appendTempMessageContent,
  setTempChat,
  setChatFromTempChat,
} = chatSlice.actions

export default chatSlice.reducer