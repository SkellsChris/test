import PropTypes from 'prop-types';

const size = 360;
const center = size / 2;
const baseRadius = 120;
const ringCount = 3;

const buildPolygon = (values, categories, maxValue) =>
  categories
    .map((category, index) => {
      const value = values[category.key] ?? 0;
      const normalized = maxValue > 0 ? value / maxValue : 0;
      const angle = (Math.PI * 2 * index) / categories.length - Math.PI / 2;
      const radius = normalized * baseRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

const RadarChart = ({ categories, datasets, centerLabel, centerValue }) => {
  const maxValue = datasets.reduce((acc, dataset) => {
    const datasetMax = Math.max(
      ...categories.map((category) => dataset.values[category.key] ?? 0)
    );
    return Math.max(acc, datasetMax);
  }, 0);

  return (
    <div className="radar-chart">
      <svg viewBox={`0 0 ${size} ${size}`} role="presentation" aria-hidden="true">
        <defs>
          <filter id="radar-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="24" stdDeviation="20" floodColor="rgba(98, 67, 255, 0.25)" />
          </filter>
        </defs>

        {[...Array(ringCount)].map((_, index) => {
          const radius = baseRadius - (index * baseRadius) / ringCount;
          return (
            <circle
              key={radius}
              cx={center}
              cy={center}
              r={radius}
              className="radar-chart__ring"
            />
          );
        })}

        {datasets.map((dataset) => (
          <polygon
            key={dataset.id}
            points={buildPolygon(dataset.values, categories, maxValue)}
            className={`radar-chart__shape radar-chart__shape--${dataset.className}`}
            filter="url(#radar-shadow)"
          />
        ))}
      </svg>

      <div className="radar-chart__center">
        <p>{centerLabel}</p>
        <p className="center-value">{centerValue}</p>
      </div>
    </div>
  );
};

RadarChart.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    })
  ).isRequired,
  datasets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      className: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.number).isRequired,
    })
  ).isRequired,
  centerLabel: PropTypes.string.isRequired,
  centerValue: PropTypes.string.isRequired,
};

export default RadarChart;
