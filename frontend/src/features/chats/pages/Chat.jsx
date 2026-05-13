import React, { useEffect, useRef, useState } from "react";
import mentoLogo from "../../../assets/mentoai_logo.png";
import WebSearchIndicator from "../components/WebSearchIndicator/WebSearchIndicator";
import SearchSources from "../components/SearchSources/SearchSources";
import { AlertCircle, CheckCircle2, FileText, Loader2, Paperclip, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";
import { useRagChat } from "../hooks/useRagChat";
import Sidebar from "../components/Sidebar";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useAutoScroll } from "../hooks/useAutoScroll";
import TypingIndicator from "../components/TypingIndicator.jsx";
import "../../../styles/chat.scss";

const SUGGESTION_CHIPS = [
  { icon: "💡", text: "Explain a concept", prompt: "Explain how React hooks work in simple terms" },
  { icon: "🧑‍💻", text: "Help me code", prompt: "Write a function to reverse a linked list in JavaScript" },
  { icon: "📝", text: "Summarize a topic", prompt: "Summarize the key concepts of Object-Oriented Programming" },
  { icon: "🐛", text: "Debug my code", prompt: "Help me debug this code: function add(a, b) { return a - b; }" },
];

const Chat = () => {
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { handleSendMessage } = useChat();
  const {
    askUploadedPDF,
    isPDFReady,
    isUploadingPDF,
    resetPDF,
    uploadedPDF,
    uploadError,
    uploadSelectedPDF,
    uploadStatus,
  } = useRagChat();

  const { messages, activeChatId, streaming, tempChatActive } = useSelector((state) => state.chat);
  const { isSearchingWeb, sources } = useSelector((state) => state.webSearch);

  const messagesEndRef = useAutoScroll(messages);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [message]);

  // Focus textarea when chat changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeChatId, tempChatActive]);

  const handleSubmit = async (customMessage) => {
    const text = customMessage || message;
    const trimmed = text.trim();

    if (!trimmed || streaming) return;
    if (!activeChatId && !tempChatActive) return;
    if (isUploadingPDF) {
      setSendError("Please wait until the PDF finishes uploading.");
      return;
    }

    try {
      const sent = isPDFReady
        ? await askUploadedPDF(text)
        : await handleSendMessage(activeChatId, text);

      if (sent) {
        setMessage("");
        setSendError("");
      }
    } catch (error) {
      setSendError(error.message || "Unable to send message");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (event) => {
    if (sendError) setSendError("");
    setMessage(event.target.value);
  };

  const handleAttachmentClick = () => {
    if (streaming || isUploadingPDF) return;

    fileInputRef.current?.click();
  };

  const handlePDFChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSendError("");

    const uploaded = await uploadSelectedPDF(file);

    if (!uploaded) {
      textareaRef.current?.focus();
    }
  };

  const handleSuggestionClick = (prompt) => {
    setMessage(prompt);
    handleSubmit(prompt);
  };

  const showEmptyState = messages.length === 0 && !streaming;

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

      <section className="chat">
        <header className="chat__header-mobile">
          <button className="chat__menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="chat__header-title">Mento AI</span>
        </header>
        <div className="chat__messages">
          {showEmptyState ? (
            <div className="chat__empty">
              <div className="chat__empty-icon">
                <img src={mentoLogo} alt="Mento AI" className="chat__empty-logo" />
              </div>
              <h2>How can I help you today?</h2>
              <p>I'm Mento AI, your intelligent mentor. Ask me anything about coding, concepts, or problem-solving.</p>

              <div className="chat__suggestions">
                {SUGGESTION_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    className="chat__suggestion"
                    onClick={() => handleSuggestionClick(chip.prompt)}
                  >
                    <span className="chat__suggestion-icon">{chip.icon}</span>
                    <span>{chip.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  {msg.role === "user" ? (
                    <div className="message__bubble">
                      <div className="message__content">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="message__bubble">
                      <div className="message__avatar">
                        <img src={mentoLogo} alt="AI" className="message__avatar-img" />
                      </div>
                      <div className="message__content">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Web search indicator — aligned as an AI message */}
          {isSearchingWeb && (
            <div className="message assistant">
              <div className="message__bubble">
                <div className="message__avatar">
                  <img src={mentoLogo} alt="AI" className="message__avatar-img" />
                </div>
                <div className="message__content">
                  <WebSearchIndicator />
                </div>
              </div>
            </div>
          )}

          {/* Sources — aligned as an AI message */}
          {sources.length > 0 && (
            <div className="message assistant">
              <div className="message__bubble">
                <div className="message__avatar">
                  <img src={mentoLogo} alt="AI" className="message__avatar-img" />
                </div>
                <div className="message__content">
                  <SearchSources sources={sources} />
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator — aligned as an AI message */}
          {streaming && (
            <div className="message assistant">
              <div className="message__bubble">
                <div className="message__avatar">
                  <img src={mentoLogo} alt="AI" className="message__avatar-img" />
                </div>
                <div className="message__content">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

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

        <div className="chat__input">
          {(uploadedPDF || uploadError) && (
            <div className={`chat__upload-badge ${uploadStatus}`} role="status" aria-live="polite">
              <div className="chat__upload-status-icon">
                {uploadStatus === "uploading" && <Loader2 size={14} />}
                {uploadStatus === "ready" && <CheckCircle2 size={14} />}
                {uploadStatus === "error" && <AlertCircle size={14} />}
              </div>
              <div className="chat__upload-copy">
                <span>
                  {uploadStatus === "ready"
                    ? "PDF Ready"
                    : uploadStatus === "uploading"
                      ? "Uploading PDF"
                      : "PDF upload failed"}
                </span>
                <small>{uploadError || uploadedPDF?.name}</small>
              </div>
              {(uploadStatus === "ready" || uploadStatus === "error") && (
                <button
                  type="button"
                  className="chat__upload-clear"
                  onClick={resetPDF}
                  aria-label="Remove PDF"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="chat__input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="chat__file-input"
              onChange={handlePDFChange}
            />

            <button
              type="button"
              className={`chat__attach-btn ${isPDFReady ? "ready" : ""}`}
              onClick={handleAttachmentClick}
              disabled={streaming || isUploadingPDF}
              aria-label="Upload PDF"
              title="Upload PDF"
            >
              {isUploadingPDF ? (
                <Loader2 size={18} />
              ) : isPDFReady ? (
                <FileText size={18} />
              ) : (
                <Paperclip size={18} />
              )}
            </button>

            <textarea
              ref={textareaRef}
              placeholder="Message Mento AI..."
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={streaming}
            />

            <button
              className="chat__send-btn"
              onClick={() => handleSubmit()}
              disabled={streaming || isUploadingPDF || !message.trim() || (!activeChatId && !tempChatActive)}
              aria-label="Send message"
            >
              {streaming ? (
                <div className="chat__send-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <span className="chat__disclaimer">Mento AI can make mistakes. Verify important information.</span>
        </div>
      </section>
    </div>
  );
};

export default Chat;
