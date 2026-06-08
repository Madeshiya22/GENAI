import mentoLogo from "../../../assets/mentoai_logo.png";
import ChatMessage from "./ChatMessage";
import ChatEmptyState from "./ChatEmptyState";
import WebSearchIndicator from "./WebSearchIndicator/WebSearchIndicator";
import TypingIndicator from "./TypingIndicator";

/**
 * Renders the scrollable message area of the chat.
 *
 * Responsibilities:
 *  - Show ChatEmptyState when there are no messages
 *  - Map messages to ChatMessage components
 *  - Show the web-search indicator while the AI is fetching sources
 *  - Show the typing indicator while the AI is streaming a response
 *  - Hold the invisible scroll-anchor div
 *
 * @param {{
 *   messages: any[],
 *   streaming: boolean,
 *   isSearchingWeb: boolean,
 *   messagesEndRef: React.RefObject,
 *   onSuggestionClick: (prompt: string) => void,
 * }} props
 */
const ChatMessageList = ({
  messages,
  streaming,
  isSearchingWeb,
  messagesEndRef,
  onSuggestionClick,
}) => {
  const showEmptyState = messages.length === 0 && !streaming;

  return (
    <div className="chat__messages">
      {showEmptyState ? (
        <ChatEmptyState onSuggestionClick={onSuggestionClick} />
      ) : (
        <>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </>
      )}

      {/* Web search indicator — rendered as an assistant message */}
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

      {/* Typing indicator — rendered as an assistant message while streaming */}
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
  );
};

export default ChatMessageList;
