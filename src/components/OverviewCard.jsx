import PropTypes from 'prop-types';

const OverviewCard = ({ data }) => (
  <section className="card overview" aria-labelledby="overview-title">
    <header className="card__header">
      <div>
        <h2 id="overview-title">{data.title}</h2>
        <p className="card__subtitle">{data.subtitle}</p>
      </div>
      <button type="button" className="pill-button">
        Details
      </button>
    </header>

    <div className="figure">
      <span className="figure__label">{data.quantity.label}</span>
      <span className="figure__value">{data.quantity.value}</span>
    </div>

    <ul className="data-table">
      {data.rows.map((row) => (
        <li key={row.label} className="data-table__row">
          <span>{row.label}</span>
          <span>{row.value}</span>
        </li>
      ))}
    </ul>

    <div className="mini-summary">
      <p className="mini-summary__title">{data.summary.label}</p>
      <p className="mini-summary__value">{data.summary.value}</p>
      <p className={`mini-summary__trend trend trend--${data.summary.trend.direction}`}>
        {data.summary.trend.text}
      </p>
    </div>
  </section>
);

OverviewCard.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    quantity: PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }).isRequired,
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ).isRequired,
    summary: PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      trend: PropTypes.shape({
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']).isRequired,
        text: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default OverviewCard;
