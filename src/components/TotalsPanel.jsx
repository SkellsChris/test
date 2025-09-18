import PropTypes from 'prop-types';

const TotalsPanel = ({ data }) => (
  <section className="card totals-panel" aria-labelledby="totals-title">
    <header className="card__header">
      <div>
        <p className="card__eyebrow">{data.eyebrow}</p>
        <h2 id="totals-title">{data.title}</h2>
      </div>
      <p className="totals-panel__highlight">
        {data.highlight.value}{' '}
        <span className={`trend trend--${data.highlight.trend.direction}`}>
          {data.highlight.trend.text}
        </span>
      </p>
    </header>

    <ul className="earnings-list">
      {data.list.map((item) => (
        <li key={item.label} className="earnings-list__row">
          <span className="earnings-list__label">{item.label}</span>
          <span className="earnings-list__value">{item.value}</span>
          <span className={`earnings-list__trend trend trend--${item.trend.direction}`}>
            {item.trend.text}
          </span>
        </li>
      ))}
    </ul>

    <div className="totals-panel__footer">
      <p className="totals-panel__label">{data.footer.label}</p>
      <p className="totals-panel__value">{data.footer.value}</p>
      <p className={`totals-panel__change trend trend--${data.footer.trend.direction}`}>
        {data.footer.trend.text}
      </p>
    </div>
  </section>
);

TotalsPanel.propTypes = {
  data: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    highlight: PropTypes.shape({
      value: PropTypes.string.isRequired,
      trend: PropTypes.shape({
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']).isRequired,
        text: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    list: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        trend: PropTypes.shape({
          direction: PropTypes.oneOf(['positive', 'negative', 'neutral']).isRequired,
          text: PropTypes.string.isRequired,
        }).isRequired,
      })
    ).isRequired,
    footer: PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      trend: PropTypes.shape({
        direction: PropTypes.oneOf(['positive', 'negative', 'neutral']).isRequired,
        text: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default TotalsPanel;
