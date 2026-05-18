import "../../../styles/TypingIndicator.scss";

const TypingIndicator = () => {
  return (
    <div className="typing">
      <div className="typing__avatar">✦</div>
      <div className="typing__dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default TypingIndicator;
