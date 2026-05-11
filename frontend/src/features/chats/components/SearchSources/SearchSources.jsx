import SourceCard from "../SourceCard/SourceCard";
import "../../../../styles/SearchSources.scss";

const SearchSources = ({ sources = [] }) => {

  if (!sources.length) {
    return null;
  }

  return (
    <div className="search-sources">

      <div className="search-sources__header">

        <div className="search-sources__icon">
          🌐
        </div>

        <h3>
          Top Sources
        </h3>

      </div>

      <div className="search-sources__list">

        {sources.map((source, index) => (

          <SourceCard
            key={index}
            source={source}
          />

        ))}

      </div>

    </div>
  );
};

export default SearchSources;