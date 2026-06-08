import { useCallback, useEffect, useRef, useState } from "react";
import mentoLogo from "../../../assets/mentoai_logo.png";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import {
  setChats,
  setMessages,
  setActiveChatId,
  removeChat,
  clearChatState,
  startTempChat,
  discardTempChat,
} from "../state/chat.slice";
import {
  deleteChat,
  getChats,
  getMessages,
} from "../services/chat.api";
import { clearUser } from "../../auth/state/auth.slice";
import { logoutUser } from "../../auth/services/auth.api";
import { useChat } from "../hooks/useChat";
import DeleteChatDialog from "../components/DeleteChatDialog";
import SidebarUserMenu from "./SidebarUserMenu";
import ThemeToggle from "./ThemeToggle";
import "../../../styles/sidebar.scss";

const Sidebar = ({ onChatSelect, onClose }) => {
  const dispatch = useDispatch();
  const { chats, activeChatId, streaming, messages, tempChatActive } =
    useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { abortCurrentStream } = useChat();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const snapshotRef = useRef(null);

  const initializeChats = useCallback(async () => {
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
  }, [dispatch]);

  useEffect(() => {
    initializeChats();
  }, [initializeChats]);

  const fetchChats = useCallback(async () => {
    const data = await getChats();
    dispatch(setChats(data?.chats || []));
  }, [dispatch]);

  // SMART NEW CHAT — only creates temp, no API call
  function handleNewChat() {
    if (streaming) return; // Don't interrupt streaming

    // If already in a temp chat, just ensure it's active (no-op if already there)
    if (tempChatActive) return;

    dispatch(startTempChat());
    if (onChatSelect) onChatSelect();
  }

  // OPEN EXISTING CHAT
  async function handleOpenChat(chatId) {
    if (streaming) return;

    // Capture before dispatch (Redux state in closure is snapshot at render time)
    const wasTempChat = tempChatActive;

    // Auto-discard any empty temp chat before switching to an existing chat
    if (wasTempChat) {
      dispatch(discardTempChat());
    }

    // Already on this chat and not coming from a temp state — nothing to do
    if (chatId === activeChatId && !wasTempChat) return;

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
      <button className="sidebar__close-btn" onClick={onClose} aria-label="Close sidebar">
        <X size={20} />
      </button>

      <div className="sidebar__brand">
        <img src={mentoLogo} alt="Mento AI" className="sidebar__brand-logo" />
        <span className="sidebar__brand-name">MENTO AI</span>
      </div>

      <button
        className="sidebar__new-chat"
        onClick={handleNewChat}
        disabled={streaming}
      >
        <Plus size={16} />
        New Chat
      </button>

      <div className="sidebar__chats">
        {/* Temp chat entry */}
        {tempChatActive && (
          <div className="sidebar__chat active temp">
            <MessageSquare className="sidebar__chat-icon" size={16} />
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
            <MessageSquare className="sidebar__chat-icon" size={16} />
            <span className="sidebar__chat-title">{chat.title}</span>

            <button
              type="button"
              className="sidebar__delete-chat"
              onClick={(event) => handleAskDelete(chat, event)}
              aria-label={`Delete ${chat.title}`}
              disabled={deleteLoading}
            >
              <Trash2 size={14} />
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

      <div className="sidebar__footer">
        <ThemeToggle />
        <SidebarUserMenu user={user} onLogout={handleLogout} />
      </div>
    </aside>
  );
};

export default Sidebar;
