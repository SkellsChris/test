import { useMemo } from 'react';
import PropTypes from 'prop-types';
import TimeFilter from './TimeFilter.jsx';
import SankeyChart from './SankeyChart.jsx';

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

const stageDefinitions = [
  {
    id: 'Business',
    label: 'Business',
    side: 'left',
    gradient: 'linear-gradient(90deg, rgba(104, 96, 255, 0.85), rgba(106, 190, 255, 0.85))',
    shadow: 'rgba(96, 128, 255, 0.35)',
  },
  {
    id: 'Presentation',
    label: 'Presentation',
    side: 'left',
    gradient: 'linear-gradient(90deg, rgba(106, 111, 255, 0.85), rgba(123, 210, 255, 0.8))',
    shadow: 'rgba(110, 149, 255, 0.35)',
  },
  {
    id: 'Finance',
    label: 'Finance',
    side: 'left',
    gradient: 'linear-gradient(90deg, rgba(95, 124, 255, 0.85), rgba(142, 228, 255, 0.78))',
    shadow: 'rgba(85, 144, 255, 0.3)',
  },
  {
    id: 'Development',
    label: 'Development',
    side: 'left',
    gradient: 'linear-gradient(90deg, rgba(89, 139, 255, 0.85), rgba(162, 236, 255, 0.75))',
    shadow: 'rgba(74, 152, 255, 0.28)',
  },
  {
    id: 'Investments',
    label: 'Investments',
    side: 'right',
    gradient: 'linear-gradient(90deg, rgba(255, 150, 134, 0.85), rgba(255, 206, 134, 0.85))',
    shadow: 'rgba(255, 173, 134, 0.35)',
  },
  {
    id: 'Startup',
    label: 'Startup',
    side: 'right',
    gradient: 'linear-gradient(90deg, rgba(255, 143, 171, 0.85), rgba(255, 207, 176, 0.85))',
    shadow: 'rgba(255, 164, 178, 0.32)',
  },
  {
    id: 'Outsourcing',
    label: 'Outsourcing',
    side: 'right',
    gradient: 'linear-gradient(90deg, rgba(255, 137, 200, 0.85), rgba(255, 210, 214, 0.82))',
    shadow: 'rgba(255, 162, 208, 0.32)',
  },
  {
    id: 'Main projects',
    label: 'Main projects',
    side: 'right',
    gradient: 'linear-gradient(90deg, rgba(255, 133, 147, 0.85), rgba(255, 192, 147, 0.85))',
    shadow: 'rgba(255, 162, 147, 0.32)',
  },
];

const sankeyLinks = [
  { source: 'Business', target: 'Investments', value: 9000 },
  { source: 'Business', target: 'Startup', value: 4000 },
  { source: 'Business', target: 'Outsourcing', value: 6000 },
  { source: 'Business', target: 'Main projects', value: 4987 },
  { source: 'Presentation', target: 'Investments', value: 28000 },
  { source: 'Presentation', target: 'Startup', value: 7000 },
  { source: 'Presentation', target: 'Outsourcing', value: 10000 },
  { source: 'Presentation', target: 'Main projects', value: 9641 },
  { source: 'Finance', target: 'Investments', value: 17000 },
  { source: 'Finance', target: 'Startup', value: 2000 },
  { source: 'Finance', target: 'Outsourcing', value: 9000 },
  { source: 'Finance', target: 'Main projects', value: 10120 },
  { source: 'Development', target: 'Investments', value: 7500 },
  { source: 'Development', target: 'Startup', value: 2870 },
  { source: 'Development', target: 'Outsourcing', value: 8500 },
  { source: 'Development', target: 'Main projects', value: 15000 },
];

const formatCurrency = (value) => `$${value.toLocaleString('en-US')}`;

const computeSankeyNodes = (definitions, links) => {
  const sourceTotals = new Map();
  const targetTotals = new Map();

  links.forEach((link) => {
    sourceTotals.set(link.source, (sourceTotals.get(link.source) || 0) + link.value);
    targetTotals.set(link.target, (targetTotals.get(link.target) || 0) + link.value);
  });

  return definitions.map((definition) => {
    const value =
      definition.side === 'left'
        ? sourceTotals.get(definition.id) || 0
        : targetTotals.get(definition.id) || 0;

    return {
      ...definition,
      value,
      colors: extractGradientStops(definition.gradient),
    };
  });
};

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

  const sankeyNodes = useMemo(() => computeSankeyNodes(stageDefinitions, sankeyLinks), []);

  const leftNodes = useMemo(() => sankeyNodes.filter((node) => node.side === 'left'), [sankeyNodes]);
  const rightNodes = useMemo(() => sankeyNodes.filter((node) => node.side === 'right'), [sankeyNodes]);

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

        <div className="funnel-visualization" role="region" aria-label="Revenue funnel sankey diagram">
          <SankeyChart
            nodes={sankeyNodes}
            links={sankeyLinks}
            valueFormatter={formatCurrency}
            title="Revenue funnel"
            description="Flow of funds between acquisition stages and revenue destinations."
          />
        </div>

        <div className="funnel-stage-summary" aria-label="Funnel stage totals">
          <div className="funnel-stage-group" role="list">
            <span className="funnel-stage-group__title">Sources</span>
            {leftNodes.map((node) => (
              <div
                key={node.id}
                role="listitem"
                className="funnel-stage-card"
                style={{
                  '--stage-card-shadow': node.shadow,
                  background: node.gradient,
                }}
              >
                <span className="funnel-stage-card__label">{node.label}</span>
                <span className="funnel-stage-card__value">{formatCurrency(node.value)}</span>
              </div>
            ))}
          </div>

          <div className="funnel-stage-group" role="list">
            <span className="funnel-stage-group__title">Destinations</span>
            {rightNodes.map((node) => (
              <div
                key={node.id}
                role="listitem"
                className="funnel-stage-card"
                style={{
                  '--stage-card-shadow': node.shadow,
                  background: node.gradient,
                }}
              >
                <span className="funnel-stage-card__label">{node.label}</span>
                <span className="funnel-stage-card__value">{formatCurrency(node.value)}</span>
              </div>
            ))}
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
