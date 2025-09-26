import { useMemo } from 'react';
import {
  SEO_OPPORTUNITY_KEYWORDS,
  SEO_SUMMARY_METRICS,
} from '../data/seoOpportunity.js';

const chartWidth = 960;
const chartHeight = 480;
const minRadius = 42;
const maxRadius = 110;

const formatNumber = (value) => value.toLocaleString('en-US');

const QUICK_WIN_RULES = {
  minWs: 20,
  maxDifficulty: 20,
  minFw: 1.5,
  allowedIntents: new Set(['Commercial', 'Transactional']),
};

const meetsQuickWinCriteria = (keyword) => {
  if (!keyword) {
    return false;
  }

  const ws = Number(keyword.ws ?? 0);
  const difficulty = Number(keyword.difficulty ?? 0);
  const fw = Number(keyword.fw ?? 0);
  const intent = keyword.intent || '';

  return (
    ws > QUICK_WIN_RULES.minWs &&
    difficulty <= QUICK_WIN_RULES.maxDifficulty &&
    fw >= QUICK_WIN_RULES.minFw &&
    QUICK_WIN_RULES.allowedIntents.has(intent)
  );
};

const opportunityToneClass = {
  positive: 'seo-metric__delta--positive',
  negative: 'seo-metric__delta--negative',
  neutral: 'seo-metric__delta--neutral',
};

const SeoOpportunity = () => {
  const maxVolume = useMemo(
    () => Math.max(...SEO_OPPORTUNITY_KEYWORDS.map((keyword) => keyword.volume)),
    []
  );

  const averageOpportunity = useMemo(() => {
    const total = SEO_OPPORTUNITY_KEYWORDS.reduce((sum, keyword) => sum + keyword.opportunity, 0);
    return Math.round(total / SEO_OPPORTUNITY_KEYWORDS.length);
  }, []);

  const highestOpportunityKeyword = useMemo(() => {
    return (
      [...SEO_OPPORTUNITY_KEYWORDS].sort((a, b) => b.opportunity - a.opportunity)[0] ??
      SEO_OPPORTUNITY_KEYWORDS[0]
    );
  }, []);

  const quickWinKeyword = useMemo(() => {
    const eligible = SEO_OPPORTUNITY_KEYWORDS.filter((keyword) => meetsQuickWinCriteria(keyword));

    if (!eligible.length) {
      return null;
    }

    const [bestQuickWin] = eligible.sort((a, b) => {
      if (b.ws !== a.ws) {
        return b.ws - a.ws;
      }
      if (b.opportunity !== a.opportunity) {
        return b.opportunity - a.opportunity;
      }
      return b.volume - a.volume;
    });

    return bestQuickWin;
  }, []);

  const totalProjectedTraffic = useMemo(
    () =>
      SEO_OPPORTUNITY_KEYWORDS.reduce((sum, keyword) => sum + keyword.projectedTraffic, 0),
    []
  );

  const radiusScale = (volume) => {
    const ratio = volume / maxVolume;
    return minRadius + ratio * (maxRadius - minRadius);
  };

  const renderBubbleLabel = (keyword, radius) => {
    const isCompact = radius < 70;
    return (
      <>
        <text className="seo-bubble__label" y={isCompact ? 6 : -2} textAnchor="middle">
          {keyword.shortLabel}
        </text>
        <text
          className="seo-bubble__meta"
          y={isCompact ? 24 : 20}
          textAnchor="middle"
        >
          {formatNumber(keyword.volume)} searches
        </text>
      </>
    );
  };

  return (
    <section className="card seo-opportunity-card" aria-labelledby="seo-opportunity-title">
      <header className="card__header">
        <div>
          <p className="card__eyebrow">Keyword landscape</p>
          <h2 id="seo-opportunity-title">SEO opportunity map</h2>
          <p className="card__subtitle">
            Bubble size represents monthly search volume. Colour intensity highlights higher opportunity
            scores.
          </p>
        </div>
        <div className="seo-opportunity__summary" aria-live="polite">
          <div>
            <p className="seo-opportunity__summary-label">Average opportunity</p>
            <p className="seo-opportunity__summary-value">{averageOpportunity}</p>
          </div>
          <div>
            <p className="seo-opportunity__summary-label">Projected lift</p>
            <p className="seo-opportunity__summary-value">{formatNumber(totalProjectedTraffic)} visits</p>
          </div>
        </div>
      </header>

      <div className="seo-opportunity__content">
        <figure
          className="seo-bubble-chart"
          role="group"
          aria-labelledby="seo-opportunity-title"
          aria-describedby="seo-bubble-caption"
        >
          <svg
            className="seo-bubble-chart__svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              {SEO_OPPORTUNITY_KEYWORDS.map((keyword) => (
                <radialGradient
                  key={keyword.id}
                  id={`bubble-gradient-${keyword.id}`}
                  cx="50%"
                  cy="45%"
                  r="70%"
                >
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
                  <stop offset="65%" stopColor={`${keyword.color}cc`} />
                  <stop offset="100%" stopColor={`${keyword.color}ff`} />
                </radialGradient>
              ))}
            </defs>

            {SEO_OPPORTUNITY_KEYWORDS.map((keyword) => {
              const radius = radiusScale(keyword.volume);
              return (
                <g
                  key={keyword.id}
                  transform={`translate(${keyword.x}, ${keyword.y})`}
                  className="seo-bubble"
                >
                  <circle
                    className="seo-bubble__circle"
                    r={radius}
                    fill={`url(#bubble-gradient-${keyword.id})`}
                    stroke={`${keyword.color}66`}
                    strokeWidth="2"
                  />
                  {renderBubbleLabel(keyword, radius)}
                </g>
              );
            })}
          </svg>
          <figcaption id="seo-bubble-caption" className="seo-bubble-chart__caption">
            Highlighted keyword &ldquo;{highestOpportunityKeyword.shortLabel}&rdquo; offers the highest opportunity score at{' '}
            {highestOpportunityKeyword.opportunity} with{' '}
            {formatNumber(highestOpportunityKeyword.volume)} monthly searches.
          </figcaption>
        </figure>

        <aside className="seo-opportunity__sidebar" aria-label="Keyword insights">
          <div className="seo-opportunity__legend">
            <span className="seo-opportunity__legend-title">Legend</span>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch" aria-hidden="true" />
              <span>Bubble size → search volume</span>
            </div>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch seo-opportunity__legend-swatch--intense" aria-hidden="true" />
              <span>Deeper colour → higher opportunity</span>
            </div>
          </div>

          <ul className="seo-metrics" role="list">
            {SEO_SUMMARY_METRICS.map((metric) => (
              <li key={metric.id} className="seo-metric" role="listitem">
                <p className="seo-metric__label">{metric.label}</p>
                <p className="seo-metric__value">{metric.value}</p>
                <p className={`seo-metric__delta ${opportunityToneClass[metric.tone]}`}>
                  {metric.delta}
                </p>
              </li>
            ))}
          </ul>

          <div className="seo-keyword-callout">
            <p className="seo-keyword-callout__label">Best quick win</p>
            {quickWinKeyword ? (
              <>
                <p className="seo-keyword-callout__keyword">{quickWinKeyword.topic}</p>
                <p className="seo-keyword-callout__meta">
                  Position {quickWinKeyword.currentPosition} · Difficulty {quickWinKeyword.difficulty} · W.S.{' '}
                  {quickWinKeyword.ws} · F.W. {quickWinKeyword.fw.toFixed(1)} · Intent {quickWinKeyword.intent}
                </p>
              </>
            ) : (
              <p className="seo-keyword-callout__meta">
                No keywords currently meet the quick win criteria (W.S. &gt; 20, Difficulty ≤ 20, F.W. ≥ 1.5, Intent
                Commercial or Transactional).
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default SeoOpportunity;
