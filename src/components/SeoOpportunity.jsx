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

const FUNNEL_STAGE_COLORS = {
  Awareness: '#0ea5e9',
  Consideration: '#a855f7',
  Decision: '#ef4444',
  default: '#6366f1',
};

const FUNNEL_STAGE_ORDER = ['Awareness', 'Consideration', 'Decision'];

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

const layoutKeywords = (keywords) => {
  if (!keywords.length) {
    return {
      keywords: [],
      maxVolume: 0,
      maxWs: 0,
    };
  }

  const volumes = keywords.map((keyword) => keyword.volume);
  const wsValues = keywords.map((keyword) => keyword.ws);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const maxWs = Math.max(...wsValues, 1);

  const xPadding = Math.max(maxRadius, 80);
  const yPadding = Math.max(maxRadius, 60);
  const xRange = Math.max(chartWidth - xPadding * 2, 1);
  const yRange = Math.max(chartHeight - yPadding * 2, 1);
  const volumeRange = Math.max(maxVolume - minVolume, 1);

  const positioned = keywords.map((keyword) => {
    const wsRatio = maxWs ? keyword.ws / maxWs : 0;
    const volumeRatio = (keyword.volume - minVolume) / volumeRange;
    const color = FUNNEL_STAGE_COLORS[keyword.funnelStage] || FUNNEL_STAGE_COLORS.default;

    return {
      ...keyword,
      color,
      x: Math.round(xPadding + wsRatio * xRange),
      y: Math.round(chartHeight - yPadding - volumeRatio * yRange),
    };
  });

  return {
    keywords: positioned,
    maxVolume,
    maxWs,
  };
};

const buildDatasetFromKeywords = (keywords, { summaryOverride = null, totalCandidates = keywords.length } = {}) => {
  const { keywords: positionedKeywords, maxVolume, maxWs } = layoutKeywords(keywords);

  if (!positionedKeywords.length) {
    return {
      keywords: positionedKeywords,
      summary: summaryOverride || [],
      maxVolume,
      maxWs,
      averageOpportunity: 0,
      totalProjectedTraffic: 0,
      highestOpportunityKeyword: null,
      quickWinKeyword: null,
    };
  }

  const averageOpportunity = Math.round(
    positionedKeywords.reduce((sum, keyword) => sum + keyword.opportunity, 0) / positionedKeywords.length
  );
  const totalProjectedTraffic = positionedKeywords.reduce(
    (sum, keyword) => sum + keyword.projectedTraffic,
    0
  );
  const highestOpportunityKeyword = positionedKeywords.reduce((best, keyword) => {
    if (!best || keyword.opportunity > best.opportunity) {
      return keyword;
    }
    return best;
  }, null);

  const quickWinKeyword = selectQuickWinKeyword(positionedKeywords);
  const quickWinCount = positionedKeywords.filter((keyword) => keyword.quickWin).length;

  const summary =
    summaryOverride ||
    [
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
        value: `${positionedKeywords.length}`,
        delta:
          totalCandidates > positionedKeywords.length
            ? `${totalCandidates - positionedKeywords.length} filtered (lower volume)`
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
    keywords: positionedKeywords,
    summary,
    maxVolume,
    maxWs,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword: highestOpportunityKeyword || positionedKeywords[0],
    quickWinKeyword,
  };
};

const fallbackSeoDataset = () => {
  const keywords = SEO_OPPORTUNITY_KEYWORDS.map((keyword, index) => {
    const volume = clampNumber(Number(keyword.volume ?? 0), 0, Number.MAX_SAFE_INTEGER);
    const ws = clampNumber(Number(keyword.ws ?? 0), 0, 100);
    const difficulty = clampNumber(Number(keyword.difficulty ?? 0), 0, 100);
    const fw = clampNumber(Number(keyword.fw ?? 1), 0.5, 3);
    const intent = keyword.intent || 'Informational';
    const funnelStage = keyword.funnelStage || 'Awareness';
    const opportunity = clampNumber(Number(keyword.opportunity ?? computeOpportunityScore(keyword)), 10, 100);
    const currentPosition = Number.isFinite(keyword.currentPosition)
      ? keyword.currentPosition
      : estimatePosition({ ws, difficulty });
    const winRate = volume > 0 ? clampPercentage((keyword.projectedTraffic / volume) * 100) : 0;
    const quickWin = meetsQuickWinCriteria({ ws, difficulty, fw, intent, opportunity });

    return {
      id: keyword.id || `seo-fallback-${index}`,
      topic: keyword.topic,
      shortLabel: keyword.shortLabel || buildShortLabel(keyword),
      volume,
      difficulty,
      fw,
      ws,
      intent,
      funnelStage,
      opportunity,
      currentPosition,
      projectedTraffic: clampNumber(Number(keyword.projectedTraffic ?? 0), 0, Number.MAX_SAFE_INTEGER),
      win: winRate,
      quickWin,
    };
  });

  return buildDatasetFromKeywords(keywords, {
    summaryOverride: SEO_SUMMARY_METRICS,
    totalCandidates: keywords.length,
  });
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
        funnelStage: row.funnelStage || 'Awareness',
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
      funnelStage: row.funnelStage,
      opportunity,
      currentPosition,
      projectedTraffic,
      quickWin,
    };
  });

  return buildDatasetFromKeywords(keywords, {
    totalCandidates: normalised.length,
  });
};

const SeoOpportunity = ({ rows }) => {
  const {
    keywords,
    summary,
    maxWs,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword,
    quickWinKeyword,
  } = useMemo(() => buildSeoOpportunityDataset(rows), [rows]);

  const radiusScale = useMemo(() => {
    const safeMax = maxWs || 1;
    return (ws) => {
      const ratio = safeMax ? ws / safeMax : 0;
      return minRadius + ratio * (maxRadius - minRadius);
    };
  }, [maxWs]);

  const stageLegend = useMemo(
    () =>
      FUNNEL_STAGE_ORDER.map((stage) => ({
        stage,
        color: FUNNEL_STAGE_COLORS[stage] || FUNNEL_STAGE_COLORS.default,
      })),
    []
  );

  const captionKeyword = highestOpportunityKeyword || keywords[0];

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
            X-axis and bubble size show winning score (WS), Y-axis indicates monthly search volume, and colour
            represents the funnel stage.
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
              const radius = radiusScale(keyword.ws);
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
            {captionKeyword ? (
              <>
                Highlighted keyword &ldquo;{captionKeyword.shortLabel}&rdquo; offers the highest opportunity score at{' '}
                {captionKeyword.opportunity} with {formatNumber(captionKeyword.volume)} monthly searches.
              </>
            ) : (
              'No keyword data available.'
            )}
          </figcaption>
        </figure>

        <aside className="seo-opportunity__sidebar" aria-label="Keyword insights">
          <div className="seo-opportunity__legend">
            <span className="seo-opportunity__legend-title">Legend</span>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch seo-opportunity__legend-swatch--ws" aria-hidden="true" />
              <span>X-axis &amp; bubble size → Winning score (WS)</span>
            </div>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch seo-opportunity__legend-swatch--volume" aria-hidden="true" />
              <span>Y-axis → Monthly search volume</span>
            </div>
            <div className="seo-opportunity__legend-item seo-opportunity__legend-item--stages">
              <span className="seo-opportunity__legend-item-label">Colour → Funnel stage</span>
              <div className="seo-opportunity__legend-stage-list" role="list">
                {stageLegend.map(({ stage, color }) => (
                  <span key={stage} className="seo-opportunity__legend-stage" role="listitem">
                    <span
                      className="seo-opportunity__legend-stage-swatch"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span>{stage}</span>
                  </span>
                ))}
              </div>
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
