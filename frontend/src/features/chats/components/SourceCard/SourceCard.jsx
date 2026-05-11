import "../../../../styles/SourceCard.scss";

const SourceCard = ({ source }) => {

  const domain = source?.url
    ? new URL(source.url).hostname
    : "Unknown Source";

  return (
    <a
      href={source?.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card"
    >

      <div className="source-card__top">

        <div className="source-card__favicon">
          🌐
        </div>

        <div className="source-card__meta">

          <h4 className="source-card__title">
            {source?.title || "Untitled"}
          </h4>

          <span className="source-card__domain">
            {domain}
          </span>

        </div>

      </div>

      <p className="source-card__content">
        {source?.content?.slice(0, 180) || "No preview available."}
      </p>

    </a>
  );
};

export default SourceCard;