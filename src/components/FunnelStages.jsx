import PropTypes from 'prop-types';
import TimeFilter from './TimeFilter.jsx';

const extractGradientStops = (gradient) => {
  if (!gradient) {
    return ['#6b5bff', '#6b5bff'];
  }

  const rgbaMatches = gradient.match(/rgba?\([^)]*\)/g);
  if (rgbaMatches && rgbaMatches.length > 0) {
    const first = rgbaMatches[0];
    const last = rgbaMatches[rgbaMatches.length - 1];
    return [first, last];
  }

  const hexMatches = gradient.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
  if (hexMatches && hexMatches.length > 0) {
    const first = hexMatches[0];
    const last = hexMatches[hexMatches.length - 1];
    return [first, last];
  }

  return ['#6b5bff', '#6b5bff'];
};

const sanitizeId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const FlowConnector = ({ direction, id, colors, shadow }) => (
  <svg
    className={`funnel-flow funnel-flow--${direction}`}
    viewBox="0 0 280 80"
    preserveAspectRatio="none"
    aria-hidden="true"
    style={{ '--funnel-flow-shadow': shadow }}
  >
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={colors[0]} />
        <stop offset="100%" stopColor={colors[1]} />
      </linearGradient>
    </defs>
    <path
      className="funnel-flow__path"
      d="M0 28 C 90 4 190 4 280 28 L280 52 C190 76 90 76 0 52 Z"
      fill={`url(#${id})`}
    />
    <path
      className="funnel-flow__highlight"
      d="M0 30 C 90 8 190 8 280 30"
      fill="none"
      stroke="rgba(255, 255, 255, 0.55)"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

FlowConnector.propTypes = {
  direction: PropTypes.oneOf(['left', 'right']).isRequired,
  id: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  shadow: PropTypes.string,
};

FlowConnector.defaultProps = {
  shadow: 'rgba(107, 91, 255, 0.18)',
};

const leftStages = [
  {
    label: 'Business',
    value: '$23,987',
    gradient: 'linear-gradient(90deg, rgba(104, 96, 255, 0.85), rgba(106, 190, 255, 0.85))',
    shadow: 'rgba(96, 128, 255, 0.35)',
  },
  {
    label: 'Presentation',
    value: '$54,641',
    gradient: 'linear-gradient(90deg, rgba(106, 111, 255, 0.85), rgba(123, 210, 255, 0.8))',
    shadow: 'rgba(110, 149, 255, 0.35)',
  },
  {
    label: 'Finance',
    value: '$38,120',
    gradient: 'linear-gradient(90deg, rgba(95, 124, 255, 0.85), rgba(142, 228, 255, 0.78))',
    shadow: 'rgba(85, 144, 255, 0.3)',
  },
  {
    label: 'Development',
    value: '$33,870',
    gradient: 'linear-gradient(90deg, rgba(89, 139, 255, 0.85), rgba(162, 236, 255, 0.75))',
    shadow: 'rgba(74, 152, 255, 0.28)',
  },
];

const rightStages = [
  {
    label: 'Investments',
    value: '$76,644',
    gradient: 'linear-gradient(90deg, rgba(255, 150, 134, 0.85), rgba(255, 206, 134, 0.85))',
    shadow: 'rgba(255, 173, 134, 0.35)',
  },
  {
    label: 'Startup',
    value: '$5,752',
    gradient: 'linear-gradient(90deg, rgba(255, 143, 171, 0.85), rgba(255, 207, 176, 0.85))',
    shadow: 'rgba(255, 164, 178, 0.32)',
  },
  {
    label: 'Outsourcing',
    value: '$4,978',
    gradient: 'linear-gradient(90deg, rgba(255, 137, 200, 0.85), rgba(255, 210, 214, 0.82))',
    shadow: 'rgba(255, 162, 208, 0.32)',
  },
  {
    label: 'Main projects',
    value: '$98,642',
    gradient: 'linear-gradient(90deg, rgba(255, 133, 147, 0.85), rgba(255, 192, 147, 0.85))',
    shadow: 'rgba(255, 162, 147, 0.32)',
  },
];

const quickStats = [
  {
    label: 'Prediction',
    value: '875',
    detail: '↑ 35%',
    tone: 'positive',
  },
  {
    label: 'Pulse',
    value: '438',
    detail: 'Stable',
    tone: 'neutral',
  },
  {
    label: 'Activity',
    value: '438',
    detail: '↓ 12%',
    tone: 'negative',
  },
];

const FunnelStages = ({ timeframeOptions, activeTimeframe, onTimeframeChange }) => {
  const activeOption = timeframeOptions.find((option) => option.id === activeTimeframe);
  const timeframeName = activeOption ? activeOption.name : 'Overview';
  const timeframeLabel = activeOption ? activeOption.label : '';

  return (
    <section className="card funnel-card" aria-labelledby="funnel-title">
      <header className="funnel-card__header">
        <div className="funnel-card__header-block">
          <span className="card__eyebrow">Timeline</span>
          <TimeFilter options={timeframeOptions} activeId={activeTimeframe} onSelect={onTimeframeChange} />
        </div>
        <div className="funnel-card__header-meta" aria-live="polite">
          <span className="funnel-card__meta-label">{timeframeName}</span>
          <span className="funnel-card__meta-value">{timeframeLabel}</span>
        </div>
      </header>

      <div className="funnel-card__body">
        <div className="funnel-card__titles">
          <h2 id="funnel-title" className="funnel-card__title">
            Data visualisation
          </h2>
          <p className="funnel-card__subtitle">Track how each funnel stage contributes to your total sales.</p>
        </div>

        <div className="funnel-visualization">
          <div className="funnel-column funnel-column--left">
            {leftStages.map((stage) => {
              const gradientStops = extractGradientStops(stage.gradient);
              const gradientId = `funnel-flow-left-${sanitizeId(stage.label)}`;

              return (
                <div
                  key={stage.label}
                  className="funnel-stage funnel-stage--left"
                  style={{ '--funnel-stage-gradient': stage.gradient, '--funnel-stage-shadow': stage.shadow }}
                >
                  <span className="funnel-stage__label">{stage.label}</span>
                  <span className="funnel-stage__value">{stage.value}</span>
                  <FlowConnector direction="left" id={gradientId} colors={gradientStops} shadow={stage.shadow} />
                </div>
              );
            })}
          </div>

          <div className="funnel-center" aria-label="Total sales">
            <div className="funnel-center__ring" aria-hidden="true" />
            <span className="funnel-center__eyebrow">Total sales</span>
            <span className="funnel-center__value">204</span>
            <span className="funnel-center__amount">$73,870</span>
          </div>

          <div className="funnel-column funnel-column--right">
            {rightStages.map((stage) => {
              const gradientStops = extractGradientStops(stage.gradient);
              const gradientId = `funnel-flow-right-${sanitizeId(stage.label)}`;

              return (
                <div
                  key={stage.label}
                  className="funnel-stage funnel-stage--right"
                  style={{ '--funnel-stage-gradient': stage.gradient, '--funnel-stage-shadow': stage.shadow }}
                >
                  <span className="funnel-stage__label">{stage.label}</span>
                  <span className="funnel-stage__value">{stage.value}</span>
                  <FlowConnector direction="right" id={gradientId} colors={gradientStops} shadow={stage.shadow} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="funnel-metrics" aria-label="Key funnel metrics">
          {quickStats.map((stat) => (
            <div key={stat.label} className={`funnel-metric funnel-metric--${stat.tone}`}>
              <span className="funnel-metric__label">{stat.label}</span>
              <span className="funnel-metric__value">{stat.value}</span>
              <span className="funnel-metric__detail">{stat.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

FunnelStages.propTypes = {
  timeframeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeTimeframe: PropTypes.string.isRequired,
  onTimeframeChange: PropTypes.func.isRequired,
};

export default FunnelStages;
