import PropTypes from 'prop-types';

const TimeFilter = ({ options, activeId, onSelect }) => (
  <div className="time-filter" role="tablist" aria-label="Timeframe selection">
    {options.map((option) => {
      const isActive = option.id === activeId;
      return (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`time-filter__button${isActive ? ' time-filter__button--active' : ''}`}
          onClick={() => onSelect(option.id)}
        >
          <span className="sr-only">{option.name}</span>
          {option.label}
        </button>
      );
    })}
  </div>
);

TimeFilter.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default TimeFilter;
