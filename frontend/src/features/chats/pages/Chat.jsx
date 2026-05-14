import { useEffect, useRef, useState } from "react";
import mentoLogo from "../../../assets/mentoai_logo.png";
import WebSearchIndicator from "../components/WebSearchIndicator/WebSearchIndicator";
import SearchSources from "../components/SearchSources/SearchSources";
import { Loader2, Paperclip } from "lucide-react";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";
import { useRagChat } from "../hooks/useRagChat";
import Sidebar from "../components/Sidebar";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useAutoScroll } from "../hooks/useAutoScroll";
import TypingIndicator from "../components/TypingIndicator.jsx";
import AttachmentDropzone from "../components/attachments/AttachmentDropzone";
import AttachmentPreview from "../components/attachments/AttachmentPreview";
import MessageAttachmentRenderer from "../components/attachments/MessageAttachmentRenderer";
import "../../../styles/chat.scss";

const SUGGESTION_CHIPS = [
  { icon: "💡", text: "Explain a concept", prompt: "Explain how React hooks work in simple terms" },
  { icon: "🧑‍💻", text: "Help me code", prompt: "Write a function to reverse a linked list in JavaScript" },
  { icon: "📝", text: "Summarize a topic", prompt: "Summarize the key concepts of Object-Oriented Programming" },
  { icon: "🐛", text: "Debug my code", prompt: "Help me debug this code: function add(a, b) { return a - b; }" },
];

const ACCEPTED_ATTACHMENT_TYPES = "application/pdf,image/*,.pdf";
const ATTACHMENT_INPUT_ID = "chat-attachment-input";

function getAttachmentKind(file) {
  if (!file) return null;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

function createAttachment(file) {
  const kind = getAttachmentKind(file);

  if (!kind) return null;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    kind,
    name: file.name || (kind === "image" ? "Pasted image" : "Attached PDF"),
    size: file.size,
    mimeType: file.type,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : "",
    status: kind === "pdf" ? "uploading" : "ready",
  };
}

function toMessageAttachment(attachment) {
  return {
    id: attachment.id,
    kind: attachment.kind,
    name: attachment.name,
    size: attachment.size,
    mimeType: attachment.mimeType,
    previewUrl: attachment.previewUrl,
    status: attachment.status,
  };
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const textareaRef = useRef(null);
  const dragDepthRef = useRef(0);
  const objectUrlsRef = useRef([]);

  const { handleSendMessage } = useChat();
  const {
    askUploadedPDF,
    isPDFReady,
    isUploadingPDF,
    resetPDF,
    uploadSelectedPDF,
  } = useRagChat();

  const { messages, activeChatId, streaming, tempChatActive } = useSelector((state) => state.chat);
  const { isSearchingWeb, sources } = useSelector((state) => state.webSearch);

  const messagesEndRef = useAutoScroll(messages);
  const hasUploadingAttachments = pendingAttachments.some(
    (attachment) => attachment.status === "uploading",
  );
  const hasAttachmentErrors = pendingAttachments.some(
    (attachment) => attachment.status === "error",
  );
  const hasReadyPDF = pendingAttachments.some(
    (attachment) => attachment.kind === "pdf" && attachment.status === "ready",
  );

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

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addFiles = (files) => {
    const incomingFiles = Array.from(files || []);
    const attachments = incomingFiles
      .map(createAttachment)
      .filter(Boolean);

    if (!attachments.length) {
      if (incomingFiles.length) {
        setSendError("Only PDF and image attachments are supported.");
      }

      return 0;
    }

    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        objectUrlsRef.current.push(attachment.previewUrl);
      }
    });

    setSendError("");
    setPendingAttachments((current) => [...current, ...attachments]);

    attachments
      .filter((attachment) => attachment.kind === "pdf")
      .forEach(async (attachment) => {
        const uploaded = await uploadSelectedPDF(attachment.file);

        setPendingAttachments((current) =>
          current.map((item) =>
            item.id === attachment.id
              ? {
                  ...item,
                  status: uploaded ? "ready" : "error",
                  error: uploaded ? "" : "PDF upload failed",
                }
              : item,
          ),
        );
      });

    textareaRef.current?.focus();
    return attachments.length;
  };

  const removeAttachment = (attachmentId) => {
    setPendingAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === attachmentId);
      const next = current.filter((attachment) => attachment.id !== attachmentId);

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== removed.previewUrl);
      }

      if (!next.some((attachment) => attachment.kind === "pdf")) {
        resetPDF();
      }

      return next;
    });
  };

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

    const attachmentsForMessage = pendingAttachments
      .filter((attachment) => attachment.status === "ready")
      .map(toMessageAttachment);
    const pendingSnapshot = pendingAttachments;
    const shouldUseRag = hasReadyPDF && isPDFReady;

    setMessage("");
    setPendingAttachments([]);
    setSendError("");

    try {
      const sent = shouldUseRag
        ? await askUploadedPDF(text, attachmentsForMessage)
        : await handleSendMessage(activeChatId, text, attachmentsForMessage);

      if (sent) {
        if (hasReadyPDF) {
          resetPDF();
        }
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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    addFiles(files);
  };

  const handlePaste = (event) => {
    const clipboardFiles = Array.from(event.clipboardData?.files || []);
    const itemFiles = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const files = clipboardFiles.length ? clipboardFiles : itemFiles;
    const addedCount = addFiles(files);

    if (addedCount > 0) {
      event.preventDefault();
    }
  };

  const handleDragEnter = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  };

  const handleDragOver = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  };

  const handleDrop = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    addFiles(event.dataTransfer.files);
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
                      <div className="message__content">
                        <MessageAttachmentRenderer attachments={msg.attachments} />
                        {msg.content && <div className="message__text">{msg.content}</div>}
                      </div>
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
          <div className={`chat__input-wrapper ${pendingAttachments.length ? "has-attachments" : ""}`}>
            <input
              id={ATTACHMENT_INPUT_ID}
              type="file"
              accept={ACCEPTED_ATTACHMENT_TYPES}
              className="chat__file-input"
              multiple
              disabled={streaming}
              onChange={handleFileChange}
            />

            <AttachmentPreview
              attachments={pendingAttachments}
              onRemove={removeAttachment}
            />

            <div className="chat__composer-row">
              <label
                htmlFor={ATTACHMENT_INPUT_ID}
                className={`chat__attach-btn ${pendingAttachments.length ? "ready" : ""}`}
                aria-disabled={streaming}
                aria-label="Attach files"
                title="Attach files"
                tabIndex={streaming ? -1 : 0}
                onClick={(event) => {
                  if (streaming) event.preventDefault();
                }}
                onKeyDown={(event) => {
                  if (streaming) return;

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    document.getElementById(ATTACHMENT_INPUT_ID)?.click();
                  }
                }}
              >
                {hasUploadingAttachments ? <Loader2 size={18} /> : <Paperclip size={18} />}
              </label>

              <textarea
                ref={textareaRef}
                placeholder="Message Mento AI..."
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={1}
                disabled={streaming}
              />

              <button
                className="chat__send-btn"
                onClick={() => handleSubmit()}
                disabled={
                  streaming ||
                  hasUploadingAttachments ||
                  hasAttachmentErrors ||
                  !message.trim() ||
                  (!activeChatId && !tempChatActive)
                }
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
          </div>
          <span className="chat__disclaimer">Mento AI can make mistakes. Verify important information.</span>
        </div>
      </section>
    </div>
  );
};

export default Chat;
