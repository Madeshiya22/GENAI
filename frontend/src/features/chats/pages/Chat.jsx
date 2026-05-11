import React, { useEffect, useRef, useState } from "react";
import WebSearchIndicator from "../components/WebSearchIndicator/WebSearchIndicator";
import SearchSources from "../components/SearchSources/SearchSources";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";
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
  const textareaRef = useRef(null);

  const { handleSendMessage } = useChat();

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

    try {
      const sent = await handleSendMessage(activeChatId, text);
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

  const handleSuggestionClick = (prompt) => {
    setMessage(prompt);
    handleSubmit(prompt);
  };

  const showEmptyState = messages.length === 0 && !streaming;

  return (
    <div className="chat-layout">
      <Sidebar />

      <section className="chat">
        <div className="chat__messages">
          {showEmptyState ? (
            <div className="chat__empty">
              <div className="chat__empty-icon">✦</div>
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
                      <div className="message__avatar">✦</div>
                      <div className="message__content">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          
          {isSearchingWeb && (
            <WebSearchIndicator />
          )}

          {sources.length > 0 && (
            <SearchSources sources={sources} />
          )}

          {streaming && <TypingIndicator />}

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
          <div className="chat__input-wrapper">
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
              disabled={streaming || !message.trim() || (!activeChatId && !tempChatActive)}
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
