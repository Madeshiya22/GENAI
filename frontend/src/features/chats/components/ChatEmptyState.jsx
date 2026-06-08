import mentoLogo from "../../../assets/mentoai_logo.png";
import { SUGGESTION_CHIPS } from "../constants/chat.constants";

/**
 * Shown when a chat has no messages yet.
 * Renders the welcome screen and suggestion chip buttons.
 *
 * @param {{ onSuggestionClick: (prompt: string) => void }} props
 */
const ChatEmptyState = ({ onSuggestionClick }) => {
  return (
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
            onClick={() => onSuggestionClick(chip.prompt)}
          >
            <span className="chat__suggestion-icon">{chip.icon}</span>
            <span>{chip.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatEmptyState;
