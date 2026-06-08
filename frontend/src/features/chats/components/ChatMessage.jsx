import mentoLogo from "../../../assets/mentoai_logo.png";
import MarkdownRenderer from "./MarkdownRenderer";
import SearchSources from "./SearchSources/SearchSources";
import MessageAttachmentRenderer from "./attachments/MessageAttachmentRenderer";

/**
 * Renders a single chat message bubble.
 * Handles both "user" and "assistant" roles with the appropriate layout.
 *
 * @param {{ message: { role: string, content: string, attachments?: any[], sources?: any[] } }} props
 */
const ChatMessage = ({ message }) => {
  if (message.role === "user") {
    return (
      <div className="message user">
        <div className="message__bubble">
          <div className="message__content">
            <MessageAttachmentRenderer attachments={message.attachments} />
            {message.content && (
              <div className="message__text">{message.content}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message assistant">
      <div className="message__bubble">
        <div className="message__avatar">
          <img src={mentoLogo} alt="AI" className="message__avatar-img" />
        </div>
        <div className="message__content">
          <MarkdownRenderer content={message.content} />
          {message.sources && message.sources.length > 0 && (
            <SearchSources sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
