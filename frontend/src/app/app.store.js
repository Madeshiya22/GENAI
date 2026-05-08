import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../features/chats/state/chat.slice";
import authReducer from "../features/auth/state/auth.slice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    
    auth: authReducer,
  },
});
