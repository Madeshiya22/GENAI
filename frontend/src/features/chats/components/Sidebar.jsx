import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setChats,
  setMessages,
  setActiveChatId,
  clearChatState,
} from "../state/chat.slice";
import { createChat, getChats, getMessages } from "../services/chat.api";
import { clearUser } from "../../auth/state/auth.slice";
import { logoutUser } from "../../auth/services/auth.api";
import "../../../styles/Sidebar.scss";

const Sidebar = () => {
  const dispatch = useDispatch();
  const {chats,activeChatId} = useSelector((state) => state.chat);

  // INITIALIZE CHATS
  useEffect(() => {
    initializeChats();
  }, []);

  // LOAD ALL CHATS
  async function initializeChats() {
    const data = await getChats();
    dispatch(setChats(data.chats));

    // AUTO LOAD LATEST CHAT
    if (data?.chats?.length > 0) {
      const latestChat = data.chats[0];
      dispatch(setActiveChatId(latestChat._id));
      const messagesData = await getMessages(latestChat._id);
      dispatch(setMessages(messagesData.messages));
    }
  }

  // FETCH CHATS
  async function fetchChats() {
    const data = await getChats();

    dispatch(setChats(data.chats));
  }

  // CREATE NEW CHAT
  async function handleNewChat() {
    const data = await createChat();

    dispatch(setActiveChatId(data.chat._id));

    dispatch(setMessages([]));

    await fetchChats();
  }

  // OPEN OLD CHAT
  async function handleOpenChat(chatId) {
    if (chatId === activeChatId) return;

    dispatch(setActiveChatId(chatId));

    const data = await getMessages(chatId);

    dispatch(setMessages(data.messages));
  }

  // LOGOUT
  async function handleLogout() {
    await logoutUser();

    dispatch(clearUser());

    dispatch(clearChatState());
  }

  return (
    <aside className="sidebar">
      <button className="sidebar__new-chat" onClick={handleNewChat}>
        + New Chat
      </button>

      <div className="sidebar__chats">
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`
              sidebar__chat
              ${activeChatId === chat._id ? "active" : ""}
            `}
            onClick={() => handleOpenChat(chat._id)}
          >
            {chat.title}
          </div>
        ))}
      </div>

      <button className="sidebar__logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
