import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";
import { setActiveChatId } from "../state/chat.slice";
import Sidebar from "../components/Sidebar";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useAutoScroll } from "../hooks/useAutoScroll";
import TypingIndicator from "../components/TypingIndicator";
import "../../../styles/Chat.scss";

const Chat = () => {
  const dispatch = useDispatch();

  const [message, setMessage] = useState("");

  const { handleSendMessage, createChat } = useChat();

  const { messages, activeChatId, streaming } = useSelector(
    (state) => state.chat,
  );

  const messagesEndRef = useAutoScroll(messages);

  // CREATE FIRST CHAT
  useEffect(() => {
    if (!activeChatId) {
      createChat();
    }
  }, []);

  const handleClick = () => {
    if (!message.trim()) return;
    handleSendMessage(activeChatId, message);
    setMessage("");
  };

  return (
    <div className="chat-layout">
      <Sidebar />

      <section className="chat">
        <div className="chat__messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <MarkdownRenderer content={msg.content} />
            </div>
          ))}

          {streaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat__input">
          <input
            type="text"
            placeholder="Ask anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button onClick={handleClick}>Send</button>
        </div>
      </section>
    </div>
  );
};

export default Chat;
