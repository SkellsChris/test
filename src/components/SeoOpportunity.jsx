import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  SEO_OPPORTUNITY_KEYWORDS,
  SEO_SUMMARY_METRICS,
} from '../data/seoOpportunity.js';
import QuickWinIcon from './QuickWinIcon.jsx';

const chartWidth = 960;
const chartHeight = 480;
const minRadius = 42;
const maxRadius = 110;

const formatNumber = (value) => value.toLocaleString('en-US');

const COLOR_PALETTE = [
  '#6b5bff',
  '#7c6dff',
  '#8f7bff',
  '#9d88ff',
  '#ae94ff',
  '#c59eff',
  '#d9a7ff',
  '#f3b4ff',
  '#ffc7de',
  '#ffd4aa',
];

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

const clampNumber = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (max !== undefined && value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
};

const clampPercentage = (value) => clampNumber(Number(value ?? 0), 0, 100);

const buildShortLabel = (row) => {
  const source = row.cluster || row.primaryKeyword || '';
  if (source.length <= 18) {
    return source || 'Keyword';
  }
  return `${source.slice(0, 15)}…`;
};

const computeOpportunityScore = (row) => {
  const ws = clampNumber(Number(row.ws ?? 0), 0, 100);
  const difficulty = clampNumber(Number(row.difficulty ?? 0), 0, 100);
  const fw = clampNumber(Number(row.fw ?? 1), 1, 3);
  const momentum = Math.max(0, 100 - difficulty);
  const rawScore = ws * 0.6 + momentum * 0.3 + fw * 20;
  return clampNumber(Math.round(rawScore), 10, 100);
};

const estimatePosition = (row) => {
  const ws = clampNumber(Number(row.ws ?? 0), 0, 100);
  const difficulty = clampNumber(Number(row.difficulty ?? 0), 0, 100);
  const base = 20 - ws / 5 + difficulty / 20;
  return Math.max(1, Math.round(base));
};

const selectQuickWinKeyword = (keywords) => {
  const eligible = keywords.filter((keyword) => meetsQuickWinCriteria(keyword));
  if (!eligible.length) {
    return null;
  }
  const [best] = eligible.sort((a, b) => {
    if (b.ws !== a.ws) {
      return b.ws - a.ws;
    }
    if (b.opportunity !== a.opportunity) {
      return b.opportunity - a.opportunity;
    }
    return b.volume - a.volume;
  });
  return best || null;
};

const fallbackSeoDataset = () => {
  const maxVolume = Math.max(...SEO_OPPORTUNITY_KEYWORDS.map((keyword) => keyword.volume));
  const averageOpportunity = Math.round(
    SEO_OPPORTUNITY_KEYWORDS.reduce((sum, keyword) => sum + keyword.opportunity, 0) /
      SEO_OPPORTUNITY_KEYWORDS.length
  );
  const totalProjectedTraffic = SEO_OPPORTUNITY_KEYWORDS.reduce(
    (sum, keyword) => sum + keyword.projectedTraffic,
    0
  );
  const highestOpportunityKeyword = [...SEO_OPPORTUNITY_KEYWORDS]
    .sort((a, b) => b.opportunity - a.opportunity)
    .find(Boolean);
  const quickWinKeyword = selectQuickWinKeyword(SEO_OPPORTUNITY_KEYWORDS);

  return {
    keywords: SEO_OPPORTUNITY_KEYWORDS,
    summary: SEO_SUMMARY_METRICS,
    maxVolume,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword: highestOpportunityKeyword || SEO_OPPORTUNITY_KEYWORDS[0],
    quickWinKeyword,
  };
};

const buildSeoOpportunityDataset = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return fallbackSeoDataset();
  }

  const normalised = rows
    .map((row) => {
      const volume = Number(row.volume ?? 0);
      if (!Number.isFinite(volume) || volume <= 0) {
        return null;
      }

      return {
        id: row.id,
        primaryKeyword: row.primaryKeyword,
        cluster: row.cluster || '',
        volume,
        difficulty: clampNumber(Number(row.difficulty ?? 0), 0, 100),
        fw: clampNumber(Number(row.fwValue ?? row.fw ?? 1), 0.5, 3),
        ws: clampNumber(Number(row.ws ?? 0), 0, 100),
        intent: row.intent || 'Informational',
        win: clampPercentage(row.win),
      };
    })
    .filter(Boolean);

  if (!normalised.length) {
    return fallbackSeoDataset();
  }

  const sortedByVolume = [...normalised].sort((a, b) => b.volume - a.volume);
  const limit = Math.min(sortedByVolume.length, 30);
  const selected = sortedByVolume.slice(0, limit);

  const keywords = selected.map((row, index) => {
    const opportunity = computeOpportunityScore(row);
    const projectedTraffic = Math.round((row.volume * row.win) / 100);
    const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
    const shortLabel = buildShortLabel(row);
    const currentPosition = estimatePosition(row);
    const quickWin = meetsQuickWinCriteria({ ...row, opportunity });

    return {
      id: row.id || `seo-${index}`,
      topic: row.cluster || row.primaryKeyword,
      shortLabel,
      volume: row.volume,
      difficulty: row.difficulty,
      fw: row.fw,
      ws: row.ws,
      intent: row.intent,
      opportunity,
      currentPosition,
      projectedTraffic,
      color,
      quickWin,
      x: 0,
      y: 0,
    };
  });

  const columnCount = Math.max(1, Math.ceil(Math.sqrt(keywords.length)));
  const rowCount = Math.max(1, Math.ceil(keywords.length / columnCount));
  const xSpacing = chartWidth / (columnCount + 1);
  const ySpacing = chartHeight / (rowCount + 1);

  keywords.forEach((keyword, index) => {
    const columnIndex = index % columnCount;
    const rowIndex = Math.floor(index / columnCount);
    keyword.x = Math.round(xSpacing * (columnIndex + 1));
    keyword.y = Math.round(ySpacing * (rowIndex + 1));
  });

  const maxVolume = Math.max(...keywords.map((keyword) => keyword.volume));
  const averageOpportunity = Math.round(
    keywords.reduce((sum, keyword) => sum + keyword.opportunity, 0) / keywords.length
  );
  const totalProjectedTraffic = keywords.reduce(
    (sum, keyword) => sum + keyword.projectedTraffic,
    0
  );
  const highestOpportunityKeyword = keywords.reduce((best, keyword) => {
    if (!best || keyword.opportunity > best.opportunity) {
      return keyword;
    }
    return best;
  }, null);

  const quickWinKeyword = selectQuickWinKeyword(keywords);
  const quickWinCount = keywords.filter((keyword) => keyword.quickWin).length;

  const summary = [
    {
      id: 'growth',
      label: 'Avg. opportunity score',
      value: `${averageOpportunity}`,
      delta:
        quickWinCount > 0
          ? `${quickWinCount} quick win${quickWinCount > 1 ? 's' : ''}`
          : 'No quick wins detected',
      tone: quickWinCount > 0 ? 'positive' : 'neutral',
    },
    {
      id: 'coverage',
      label: 'Keywords in sheet',
      value: `${keywords.length}`,
      delta:
        normalised.length > keywords.length
          ? `${normalised.length - keywords.length} filtered (low volume)`
          : 'All sheet keywords',
      tone: 'neutral',
    },
    {
      id: 'traffic',
      label: 'Projected lift',
      value: `${formatNumber(totalProjectedTraffic)} visits`,
      delta: 'Based on win rate',
      tone: totalProjectedTraffic > 0 ? 'positive' : 'neutral',
    },
  ];

  return {
    keywords,
    summary,
    maxVolume,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword: highestOpportunityKeyword || keywords[0],
    quickWinKeyword,
  };
};

const SeoOpportunity = ({ rows }) => {
  const {
    keywords,
    summary,
    maxVolume,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword,
    quickWinKeyword,
  } = useMemo(() => buildSeoOpportunityDataset(rows), [rows]);

  const radiusScale = useMemo(() => {
    const safeMax = maxVolume || 1;
    return (volume) => {
      const ratio = safeMax ? volume / safeMax : 0;
      return minRadius + ratio * (maxRadius - minRadius);
    };
  }, [maxVolume]);

  const renderBubbleLabel = (keyword, radius) => {
    const isCompact = radius < 70;
    return (
      <>
        <text className="seo-bubble__label" y={isCompact ? 6 : -2} textAnchor="middle">
          {keyword.shortLabel}
        </text>
        <text className="seo-bubble__meta" y={isCompact ? 24 : 20} textAnchor="middle">
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
              {keywords.map((keyword) => (
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

            {keywords.map((keyword) => {
              const radius = radiusScale(keyword.volume);
              return (
                <g key={keyword.id} transform={`translate(${keyword.x}, ${keyword.y})`} className="seo-bubble">
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
            {highestOpportunityKeyword.opportunity} with {formatNumber(highestOpportunityKeyword.volume)} monthly
            searches.
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
            {summary.map((metric) => (
              <li key={metric.id} className="seo-metric" role="listitem">
                <p className="seo-metric__label">{metric.label}</p>
                <p className="seo-metric__value">{metric.value}</p>
                <p className={`seo-metric__delta ${opportunityToneClass[metric.tone]}`}>{metric.delta}</p>
              </li>
            ))}
          </ul>

          <div className="seo-keyword-callout">
            <p className="seo-keyword-callout__label">
              <QuickWinIcon className="seo-keyword-callout__icon" />
              <span>Best quick win</span>
            </p>
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

SeoOpportunity.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      primaryKeyword: PropTypes.string.isRequired,
    })
  ),
};

SeoOpportunity.defaultProps = {
  rows: [],
};

export default SeoOpportunity;
