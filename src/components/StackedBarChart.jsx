import PropTypes from 'prop-types';

const chartWidth = 560;
const chartHeight = 320;
const padding = {
  top: 32,
  right: 48,
  bottom: 80,
  left: 80,
};

const createTicks = (maxValue, count, bottom, innerHeight) => {
  if (maxValue <= 0 || !Number.isFinite(maxValue)) {
    return [{ value: 0, position: bottom, label: '0' }];
  }

  const step = maxValue / count;
  return Array.from({ length: count + 1 }, (_, index) => {
    const value = step * index;
    const ratio = value / maxValue;
    const position = bottom - ratio * innerHeight;
    return {
      value,
      position,
      label: Math.round(value).toLocaleString('en-US'),
    };
  });
};

const StackedBarChart = ({ categories, datasets, centerLabel, centerValue }) => {
  const totals = categories.map((category) =>
    datasets.reduce((sum, dataset) => sum + (dataset.values[category.key] ?? 0), 0)
  );

  const maxTotal = totals.length ? Math.max(...totals) : 0;
  const left = padding.left;
  const right = chartWidth - padding.right;
  const top = padding.top;
  const bottom = chartHeight - padding.bottom;
  const innerWidth = right - left;
  const innerHeight = bottom - top;
  const categoryCount = categories.length;
  const step = categoryCount ? innerWidth / categoryCount : 0;
  const barWidth = step ? Math.min(64, step * 0.6) : 0;
  const offset = step ? (step - barWidth) / 2 : 0;

  const ticks = createTicks(maxTotal, 4, bottom, innerHeight);

  return (
    <div className="stacked-chart" role="img" aria-label="Stacked bar chart showing dataset distribution by category">
      <svg
        className="stacked-chart__svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        aria-hidden="true"
        focusable="false"
      >
        <g className="stacked-chart__axes">
          <line x1={left} y1={bottom} x2={right} y2={bottom} />
          <line x1={left} y1={top} x2={left} y2={bottom} />
        </g>

        <g className="stacked-chart__grid">
          {ticks.map((tick) => (
            <g key={`tick-${tick.value}`} transform={`translate(0, ${tick.position})`}>
              <line x1={left} x2={right} />
              <text x={left - 16} y={4}>{tick.label}</text>
            </g>
          ))}
        </g>

        <g className="stacked-chart__bars">
          {categories.map((category, index) => {
            const x = left + index * step + offset;
            let currentY = bottom;
            const segments = datasets.map((dataset) => {
              const value = dataset.values[category.key] ?? 0;
              const height = maxTotal ? (value / maxTotal) * innerHeight : 0;
              const y = currentY - height;
              currentY -= height;

              return (
                <rect
                  key={`${dataset.id}-${category.key}`}
                  className={`stacked-chart__bar stacked-chart__bar--${dataset.className}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 0)}
                >
                  <title>{`${dataset.label} – ${category.label}: ${value.toLocaleString('en-US')}`}</title>
                </rect>
              );
            });

            return (
              <g key={category.key}>
                {segments}
                <text
                  className="stacked-chart__tick-label"
                  x={x + barWidth / 2}
                  y={bottom + 32}
                >
                  {category.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="stacked-chart__summary" aria-hidden="true">
        <p>{centerLabel}</p>
        <p className="stacked-chart__total">{centerValue}</p>
      </div>
    </div>
  );
};

StackedBarChart.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  datasets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      className: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.number).isRequired,
    })
  ).isRequired,
  centerLabel: PropTypes.string.isRequired,
  centerValue: PropTypes.string.isRequired,
};

export default StackedBarChart;
