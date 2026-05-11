import "../../../../styles/WebSearchIndicator.scss";

const WebSearchIndicator = () => {
  return (
    <div className="web-search-indicator">

      <div className="web-search-indicator__pulse"></div>

      <div className="web-search-indicator__content">

        <span className="web-search-indicator__text">
          Searching the web
        </span>

        <div className="web-search-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>

    </div>
  );
};

export default WebSearchIndicator;