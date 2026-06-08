import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { useChat } from "../hooks/useChat";
import { useRagChat } from "../hooks/useRagChat";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useAttachments } from "../hooks/useAttachments";

import Sidebar from "../components/Sidebar";
import AttachmentDropzone from "../components/attachments/AttachmentDropzone";
import ChatMessageList from "../components/ChatMessageList";
import ChatComposer from "../components/ChatComposer";

import "../../../styles/chat.scss";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const textareaRef = useRef(null);

  // ─── Redux state ───────────────────────────────────────────────────────────
  const { messages, activeChatId, streaming, tempChatActive } = useSelector(
    (state) => state.chat,
  );
  const { isSearchingWeb } = useSelector((state) => state.webSearch);

  // ─── Hooks ─────────────────────────────────────────────────────────────────
  const { handleSendMessage } = useChat();
  const {
    askUploadedPDF,
    isPDFReady,
    isUploadingPDF,
    resetPDF,
    uploadSelectedPDF,
  } = useRagChat();

  const messagesEndRef = useAutoScroll(messages);

  const {
    pendingAttachments,
    isDraggingFiles,
    hasUploadingAttachments,
    hasAttachmentErrors,
    hasReadyPDF,
    addFiles,
    removeAttachment,
    getReadyAttachments,
    clearAttachments,
    setPendingAttachments,
    handleFileChange,
    handlePaste,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useAttachments({
    uploadSelectedPDF,
    resetPDF,
    onError: setSendError,
    onClearError: () => setSendError(""),
    textareaRef,
  });

  // ─── Textarea auto-resize ──────────────────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [message]);

  // Focus textarea whenever the active chat changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeChatId, tempChatActive]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (customMessage) => {
    const text = customMessage || message;
    const trimmed = text.trim();

    if (!trimmed || streaming) return;
    if (!activeChatId && !tempChatActive) return;
    if (hasUploadingAttachments || isUploadingPDF) {
      setSendError("Please wait until attachments finish uploading.");
      return;
    }
    if (hasAttachmentErrors) {
      setSendError("Remove failed attachments before sending.");
      return;
    }

    const attachmentsForMessage = getReadyAttachments();
    const pendingSnapshot = pendingAttachments;
    const shouldUseRag = hasReadyPDF && isPDFReady;

    setMessage("");
    clearAttachments();
    setSendError("");

    try {
      const sent = shouldUseRag
        ? await askUploadedPDF(text, attachmentsForMessage)
        : await handleSendMessage(activeChatId, text, attachmentsForMessage);

      if (sent) {
        if (hasReadyPDF) resetPDF();
      } else {
        setMessage(text);
        setPendingAttachments(pendingSnapshot);
      }
    } catch (error) {
      setMessage(text);
      setPendingAttachments(pendingSnapshot);
      setSendError(error.message || "Unable to send message");
    }
  };

  const handleSuggestionClick = (prompt) => {
    setMessage(prompt);
    handleSubmit(prompt);
  };

  const handleMessageChange = (event) => {
    if (sendError) setSendError("");
    setMessage(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="chat-layout">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`sidebar-container ${isSidebarOpen ? "open" : ""}`}>
        <Sidebar
          onChatSelect={() => setIsSidebarOpen(false)}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <section
        className={`chat ${isDraggingFiles ? "is-dragging" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AttachmentDropzone active={isDraggingFiles} />

        <header className="chat__header-mobile">
          <button className="chat__menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="chat__header-title">Mento AI</span>
        </header>

        <ChatMessageList
          messages={messages}
          streaming={streaming}
          isSearchingWeb={isSearchingWeb}
          messagesEndRef={messagesEndRef}
          onSuggestionClick={handleSuggestionClick}
        />

        {sendError && (
          <div className="chat__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {sendError}
          </div>
        )}

        <ChatComposer
          message={message}
          streaming={streaming}
          pendingAttachments={pendingAttachments}
          hasUploadingAttachments={hasUploadingAttachments}
          hasAttachmentErrors={hasAttachmentErrors}
          activeChatId={activeChatId}
          tempChatActive={tempChatActive}
          textareaRef={textareaRef}
          onMessageChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFileChange={handleFileChange}
          onRemoveAttachment={removeAttachment}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
};

export default Chat;
