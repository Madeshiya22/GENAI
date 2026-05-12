import React, { useEffect, useRef, useState } from "react";
import mentoLogo from "../../../assets/mentoai_logo.png";
import { useDispatch, useSelector } from "react-redux";
import {
  setChats,
  setMessages,
  setActiveChatId,
  removeChat,
  clearChatState,
  startTempChat,
} from "../state/chat.slice";
import {
  createChat,
  deleteChat,
  getChats,
  getMessages,
} from "../services/chat.api";
import { clearUser } from "../../auth/state/auth.slice";
import { logoutUser } from "../../auth/services/auth.api";
import { useChat } from "../hooks/useChat";
import DeleteChatDialog from "../components/DeleteChatDialog";
import "../../../styles/sidebar.scss";

const Sidebar = ({ onChatSelect }) => {
  const dispatch = useDispatch();
  const { chats, activeChatId, streaming, messages, tempChatActive } =
    useSelector((state) => state.chat);
  const { abortCurrentStream } = useChat();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const snapshotRef = useRef(null);

  // INITIALIZE CHATS
  useEffect(() => {
    initializeChats();
  }, []);

  // LOAD ALL CHATS
  async function initializeChats() {
    try {
      const data = await getChats();
      const fetchedChats = data?.chats || [];

      if (fetchedChats.length > 0) {
        dispatch(setChats(fetchedChats));
        const latestChat = fetchedChats[0];
        dispatch(setActiveChatId(latestChat._id));
        const messagesData = await getMessages(latestChat._id);
        dispatch(setMessages(messagesData?.messages || []));
      } else {
        // No chats exist — start with temp chat
        dispatch(startTempChat());
      }
    } catch (error) {
      console.log("Failed to initialize chats:", error);
      dispatch(startTempChat());
    }
  }

  // FETCH CHATS (refresh list)
  async function fetchChats() {
    const data = await getChats();
    dispatch(setChats(data?.chats || []));
  }

  // SMART NEW CHAT — only creates temp, no API call
  function handleNewChat() {
    if (tempChatActive) return; // Already in temp chat, do nothing
    if (streaming) return; // Don't interrupt streaming

    dispatch(startTempChat());
    if (onChatSelect) onChatSelect();
  }

  // OPEN EXISTING CHAT
  async function handleOpenChat(chatId) {
    if (chatId === activeChatId) return;
    if (streaming) return;

    dispatch(setActiveChatId(chatId));
    dispatch(setMessages([]));

    const data = await getMessages(chatId);
    dispatch(setMessages(data?.messages || []));
    if (onChatSelect) onChatSelect();
  }

  function handleAskDelete(chat, event) {
    event.stopPropagation();
    setDeleteError("");
    setDeleteTarget(chat);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleteLoading) {
      return;
    }

    const targetChatId = deleteTarget._id;
    const previousState = {
      chats,
      activeChatId,
      messages,
    };

    snapshotRef.current = previousState;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const remainingChats = chats.filter((chat) => chat._id !== targetChatId);
      const nextActiveChat =
        activeChatId === targetChatId ? remainingChats[0] || null : null;

      if (activeChatId === targetChatId && streaming) {
        abortCurrentStream();
      }

      dispatch(removeChat(targetChatId));

      if (activeChatId === targetChatId) {
        if (nextActiveChat) {
          dispatch(setActiveChatId(nextActiveChat._id));
          const nextMessages = await getMessages(nextActiveChat._id);
          dispatch(setMessages(nextMessages?.messages || []));
        } else {
          dispatch(startTempChat());
        }
      }

      const response = await deleteChat(targetChatId);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete chat");
      }

      await fetchChats();
      setDeleteTarget(null);
    } catch (error) {
      const snapshot = snapshotRef.current;

      if (snapshot) {
        dispatch(setChats(snapshot.chats));
        dispatch(setActiveChatId(snapshot.activeChatId));
        dispatch(setMessages(snapshot.messages));
      }

      setDeleteError(error.message || "Unable to delete chat");
    } finally {
      setDeleteLoading(false);
    }
  }

  // LOGOUT
  async function handleLogout() {
    await logoutUser();
    dispatch(clearUser());
    dispatch(clearChatState());
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={mentoLogo} alt="Mento AI" className="sidebar__brand-logo" />
        <span className="sidebar__brand-name">MENTO AI</span>
      </div>

      <button
        className="sidebar__new-chat"
        onClick={handleNewChat}
        disabled={tempChatActive || streaming}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Chat
      </button>

      <div className="sidebar__chats">
        {/* Temp chat entry */}
        {tempChatActive && (
          <div className="sidebar__chat active temp">
            <svg className="sidebar__chat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="sidebar__chat-title">New Chat</span>
          </div>
        )}

        {/* Existing chats */}
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`sidebar__chat ${activeChatId === chat._id ? "active" : ""}`}
            onClick={() => handleOpenChat(chat._id)}
          >
            <svg className="sidebar__chat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="sidebar__chat-title">{chat.title}</span>

            <button
              type="button"
              className="sidebar__delete-chat"
              onClick={(event) => handleAskDelete(chat, event)}
              aria-label={`Delete ${chat.title}`}
              disabled={deleteLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <DeleteChatDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title || "this chat"}
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <button className="sidebar__logout" onClick={handleLogout}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
