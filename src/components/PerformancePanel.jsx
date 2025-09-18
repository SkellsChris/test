import PropTypes from 'prop-types';
import RadarChart from './RadarChart.jsx';

const PerformancePanel = ({ data }) => (
  <section className="card radar-panel" aria-labelledby="performance-title">
    <header className="card__header">
      <div>
        <p className="card__eyebrow">{data.eyebrow}</p>
        <h2 id="performance-title">{data.title}</h2>
      </div>
      <div className="radar-legend">
        <span className="legend-bullet legend-bullet--primary" aria-hidden="true" />
        <span>{`${data.datasets[0].label} ${data.datasets[0].total}`}</span>
        <span className="legend-bullet legend-bullet--secondary" aria-hidden="true" />
        <span>{`${data.datasets[1].label} ${data.datasets[1].total}`}</span>
      </div>
    </header>

    <RadarChart
      categories={data.categories}
      datasets={data.datasets}
      centerLabel={data.centerLabel}
      centerValue={data.centerValue}
    />

    <div className="metric-grid">
      {data.categories.map((category) => (
        <div key={category.key} className="metric">
          <h3>{category.label}</h3>
          <p>{category.amount}</p>
        </div>
      ))}
    </div>
  </section>
);

PerformancePanel.propTypes = {
  data: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    centerLabel: PropTypes.string.isRequired,
    centerValue: PropTypes.string.isRequired,
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        amount: PropTypes.string.isRequired,
      })
    ).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        total: PropTypes.string.isRequired,
        className: PropTypes.string.isRequired,
        values: PropTypes.objectOf(PropTypes.number).isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default PerformancePanel;
