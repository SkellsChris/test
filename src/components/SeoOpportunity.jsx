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

const stackedChartWidth = chartWidth;
const stackedChartHeight = 360;
const stackedChartPadding = {
  top: 36,
  right: 48,
  bottom: 96,
  left: 96,
};

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
  const xPadding = Math.max(maxRadius, 80);
  const yPadding = Math.max(maxRadius, 60);
  const xRange = Math.max(chartWidth - xPadding * 2, 1);
  const yRange = Math.max(chartHeight - yPadding * 2, 1);

  if (!keywords.length) {
    return {
      keywords: [],
      maxVolume: 0,
      minVolume: 0,
      maxWs: 0,
      xPadding,
      yPadding,
      xRange,
      yRange,
    };
  }

  const volumes = keywords.map((keyword) => keyword.volume);
  const wsValues = keywords.map((keyword) => keyword.ws);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const maxWs = Math.max(...wsValues, 1);
  const volumeRange = Math.max(maxVolume - minVolume, 1);

  const positioned = keywords.map((keyword) => {
    const volumeRatio = (keyword.volume - minVolume) / volumeRange;
    const wsRatio = maxWs ? keyword.ws / maxWs : 0;
    const color = FUNNEL_STAGE_COLORS[keyword.funnelStage] || FUNNEL_STAGE_COLORS.default;

    return {
      ...keyword,
      color,
      x: Math.round(xPadding + volumeRatio * xRange),
      y: Math.round(chartHeight - yPadding - wsRatio * yRange),
    };
  });

  return {
    keywords: positioned,
    maxVolume,
    minVolume,
    maxWs,
    xPadding,
    yPadding,
    xRange,
    yRange,
  };
};

const buildDatasetFromKeywords = (keywords, { summaryOverride = null, totalCandidates = keywords.length } = {}) => {
  const {
    keywords: positionedKeywords,
    maxVolume,
    minVolume,
    maxWs,
    xPadding,
    yPadding,
    xRange,
    yRange,
  } = layoutKeywords(keywords);

  if (!positionedKeywords.length) {
    return {
      keywords: positionedKeywords,
      summary: summaryOverride || [],
      maxVolume,
      minVolume,
      maxWs,
      averageOpportunity: 0,
      totalProjectedTraffic: 0,
      highestOpportunityKeyword: null,
      quickWinKeyword: null,
      plotArea: {
        xPadding,
        yPadding,
        xRange,
        yRange,
      },
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
    minVolume,
    maxWs,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword: highestOpportunityKeyword || positionedKeywords[0],
    quickWinKeyword,
    plotArea: {
      xPadding,
      yPadding,
      xRange,
      yRange,
    },
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
    minVolume,
    maxVolume,
    maxWs,
    plotArea,
    averageOpportunity,
    totalProjectedTraffic,
    highestOpportunityKeyword,
    quickWinKeyword,
  } = useMemo(() => buildSeoOpportunityDataset(rows), [rows]);

  const { xPadding, yPadding, xRange, yRange } = plotArea;
  const chartBottom = chartHeight - yPadding;
  const chartTop = yPadding;
  const chartLeft = xPadding;
  const chartRight = xPadding + xRange;

  const stackedChartLeft = stackedChartPadding.left;
  const stackedChartRight = stackedChartWidth - stackedChartPadding.right;
  const stackedChartTop = stackedChartPadding.top;
  const stackedChartBottom = stackedChartHeight - stackedChartPadding.bottom;
  const stackedChartInnerWidth = stackedChartRight - stackedChartLeft;
  const stackedChartInnerHeight = stackedChartBottom - stackedChartTop;

  const radiusScale = useMemo(() => {
    const safeMax = maxWs || 1;
    return (ws) => {
      const ratio = safeMax ? ws / safeMax : 0;
      return minRadius + ratio * (maxRadius - minRadius);
    };
  }, [maxWs]);

  const xTicks = useMemo(() => {
    const steps = 4;
    const safeMin = Number.isFinite(minVolume) ? minVolume : 0;
    const safeMax = Number.isFinite(maxVolume) ? maxVolume : safeMin;
    const range = safeMax - safeMin;

    if (range <= 0) {
      return [
        {
          value: Math.round(safeMin),
          position: chartLeft,
        },
      ];
    }

    return Array.from({ length: steps + 1 }, (_, index) => {
      const value = safeMin + (range / steps) * index;
      const ratio = range ? (value - safeMin) / range : 0;
      return {
        value: Math.round(value),
        position: chartLeft + ratio * xRange,
      };
    });
  }, [chartLeft, maxVolume, minVolume, xRange]);

  const yTicks = useMemo(() => {
    const steps = 4;
    const safeMax = maxWs || 0;
    if (!safeMax) {
      return [
        {
          value: 0,
          position: chartBottom,
        },
      ];
    }

    return Array.from({ length: steps + 1 }, (_, index) => {
      const value = (safeMax / steps) * index;
      const ratio = safeMax ? value / safeMax : 0;
      return {
        value: Math.round(value),
        position: chartBottom - ratio * yRange,
      };
    });
  }, [chartBottom, maxWs, yRange]);

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

  const xAxisLabelY = chartBottom + 48;
  const yAxisLabelX = chartLeft - 56;
  const yAxisLabelY = chartTop + yRange / 2;

  const stackedData = useMemo(() => {
    if (!keywords.length) {
      return [];
    }

    const categoryMap = new Map();

    keywords.forEach((keyword) => {
      const categoryLabel = String(keyword.topic || keyword.shortLabel || 'Uncategorised');
      const stage = keyword.funnelStage || 'Unassigned';
      const volume = Number(keyword.volume ?? 0);

      if (!categoryMap.has(categoryLabel)) {
        categoryMap.set(categoryLabel, {
          id: `category-${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
          label: categoryLabel,
          total: 0,
          segments: new Map(),
        });
      }

      const entry = categoryMap.get(categoryLabel);
      entry.total += volume;
      const currentValue = entry.segments.get(stage) || 0;
      entry.segments.set(stage, currentValue + volume);
    });

    const orderedCategories = Array.from(categoryMap.keys()).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    );

    return orderedCategories.map((category) => {
      const entry = categoryMap.get(category);
      const orderedStages = [
        ...FUNNEL_STAGE_ORDER.filter((stage) => entry.segments.has(stage)),
        ...Array.from(entry.segments.keys()).filter((stage) => !FUNNEL_STAGE_ORDER.includes(stage)),
      ];

      return {
        id: entry.id,
        label: entry.label,
        total: entry.total,
        segments: orderedStages.map((stage) => ({
          stage,
          value: entry.segments.get(stage) || 0,
          color: FUNNEL_STAGE_COLORS[stage] || FUNNEL_STAGE_COLORS.default,
        })),
      };
    });
  }, [keywords]);

  const stackedCount = stackedData.length;

  const stackedMaxVolume = useMemo(() => {
    if (!stackedCount) {
      return 0;
    }
    return Math.max(...stackedData.map((item) => item.total));
  }, [stackedCount, stackedData]);

  const stackedTicks = useMemo(() => {
    const steps = 4;
    const safeMax = stackedMaxVolume || 0;
    if (!safeMax) {
      return [
        {
          value: 0,
          position: stackedChartBottom,
        },
      ];
    }

    return Array.from({ length: steps + 1 }, (_, index) => {
      const value = (safeMax / steps) * index;
      const ratio = safeMax ? value / safeMax : 0;
      return {
        value: Math.round(value),
        position: stackedChartBottom - ratio * stackedChartInnerHeight,
      };
    });
  }, [stackedChartBottom, stackedChartInnerHeight, stackedMaxVolume]);

  const stackedBarLayout = useMemo(() => {
    if (!stackedCount) {
      return {
        step: 0,
        width: 0,
        offset: 0,
      };
    }

    const step = stackedChartInnerWidth / stackedCount;
    const width = Math.min(52, Math.max(18, step * 0.6));
    const offset = (step - width) / 2;

    return {
      step,
      width,
      offset,
    };
  }, [stackedChartInnerWidth, stackedCount]);

  return (
    <section className="card seo-opportunity-card" aria-labelledby="seo-opportunity-title">
      <header className="card__header">
        <div>
          <p className="card__eyebrow">Keyword landscape</p>
          <h2 id="seo-opportunity-title">SEO opportunity map</h2>
          <p className="card__subtitle">
            X-axis indicates monthly search volume, Y-axis and bubble size show winning score (WS), and colour
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
        <div className="seo-opportunity__visualizations">
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

              <g className="seo-bubble-chart__grid" aria-hidden="true">
                {xTicks.map((tick, index) =>
                  index === 0 ? null : (
                    <line
                      key={`grid-x-${tick.value}-${index}`}
                      className="seo-bubble-chart__grid-line"
                      x1={tick.position}
                      y1={chartTop}
                      x2={tick.position}
                      y2={chartBottom}
                    />
                  )
                )}
                {yTicks.map((tick, index) =>
                  index === yTicks.length - 1 ? null : (
                    <line
                      key={`grid-y-${tick.value}-${index}`}
                      className="seo-bubble-chart__grid-line"
                      x1={chartLeft}
                      y1={tick.position}
                      x2={chartRight}
                      y2={tick.position}
                    />
                  )
                )}
              </g>

              <g className="seo-bubble-chart__axes" aria-hidden="true">
                <line
                  className="seo-bubble-chart__axis"
                  x1={chartLeft}
                  y1={chartBottom}
                  x2={chartRight}
                  y2={chartBottom}
                />
                <line
                  className="seo-bubble-chart__axis"
                  x1={chartLeft}
                  y1={chartTop}
                  x2={chartLeft}
                  y2={chartBottom}
                />

                {xTicks.map((tick) => (
                  <text
                    key={`tick-x-${tick.value}-${tick.position}`}
                    className="seo-bubble-chart__tick-label"
                    x={tick.position}
                    y={chartBottom + 24}
                    textAnchor="middle"
                  >
                    {formatNumber(Math.round(tick.value))}
                  </text>
                ))}

                {yTicks.map((tick) => (
                  <text
                    key={`tick-y-${tick.value}-${tick.position}`}
                    className="seo-bubble-chart__tick-label"
                    x={chartLeft - 12}
                    y={tick.position + 4}
                    textAnchor="end"
                  >
                    {Math.round(tick.value)}
                  </text>
                ))}

                <text
                  className="seo-bubble-chart__axis-label"
                  x={chartLeft + xRange / 2}
                  y={xAxisLabelY}
                  textAnchor="middle"
                >
                  Monthly search volume
                </text>
                <text
                  className="seo-bubble-chart__axis-label"
                  x={yAxisLabelX}
                  y={yAxisLabelY}
                  textAnchor="middle"
                  transform={`rotate(-90 ${yAxisLabelX} ${yAxisLabelY})`}
                >
                  Winning score (WS)
                </text>
              </g>

              {keywords.map((keyword) => {
                const radius = radiusScale(keyword.ws);
                return (
                  <g key={keyword.id} transform={`translate(${keyword.x}, ${keyword.y})`} className="seo-bubble">
                    <title>{keyword.topic || keyword.shortLabel || 'Keyword'}</title>
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

          <figure
            className="seo-stacked-chart"
            role="group"
            aria-labelledby="seo-stacked-title"
            aria-describedby="seo-stacked-caption"
          >
            <div className="seo-stacked-chart__header">
              <h3 id="seo-stacked-title">Funnel stage distribution</h3>
              <p>Compare how each category distributes search volume across the funnel stages.</p>
            </div>
            {stackedData.length ? (
              <svg
                className="seo-stacked-chart__svg"
                viewBox={`0 0 ${stackedChartWidth} ${stackedChartHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="presentation"
                aria-hidden="true"
              >
                <g className="seo-stacked-chart__axes" aria-hidden="true">
                  <line
                    className="seo-stacked-chart__axis"
                    x1={stackedChartLeft}
                    y1={stackedChartBottom}
                    x2={stackedChartRight}
                    y2={stackedChartBottom}
                  />
                  <line
                    className="seo-stacked-chart__axis"
                    x1={stackedChartLeft}
                    y1={stackedChartTop}
                    x2={stackedChartLeft}
                    y2={stackedChartBottom}
                  />

                  {stackedTicks.map((tick) => (
                    <g key={`stacked-y-${tick.value}`} transform={`translate(0, ${tick.position})`}>
                      <line
                        className="seo-stacked-chart__grid-line"
                        x1={stackedChartLeft}
                        x2={stackedChartRight}
                      />
                      <text
                        className="seo-stacked-chart__tick-label"
                        x={stackedChartLeft - 14}
                        y={4}
                        textAnchor="end"
                      >
                        {formatNumber(Math.round(tick.value))}
                      </text>
                    </g>
                  ))}

                  {stackedData.map((item, index) => {
                    const x =
                      stackedChartLeft + index * stackedBarLayout.step + stackedBarLayout.offset + stackedBarLayout.width / 2;
                    return (
                      <text
                        key={`stacked-x-${item.id}`}
                        className="seo-stacked-chart__tick-label seo-stacked-chart__tick-label--x"
                        x={x}
                        y={stackedChartBottom + 40}
                        textAnchor="middle"
                      >
                        {item.label}
                      </text>
                    );
                  })}

                  <text
                    className="seo-stacked-chart__axis-label"
                    x={stackedChartLeft + stackedChartInnerWidth / 2}
                    y={stackedChartHeight - 32}
                    textAnchor="middle"
                  >
                    Keyword categories
                  </text>
                  <text
                    className="seo-stacked-chart__axis-label"
                    x={stackedChartLeft - 56}
                    y={stackedChartTop + stackedChartInnerHeight / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 ${stackedChartLeft - 56} ${stackedChartTop + stackedChartInnerHeight / 2})`}
                  >
                    Monthly search volume
                  </text>
                </g>

                <g className="seo-stacked-chart__bars">
                  {stackedData.map((item, index) => {
                    const x = stackedChartLeft + index * stackedBarLayout.step + stackedBarLayout.offset;
                    let currentY = stackedChartBottom;
                    return (
                      <g key={item.id} transform={`translate(${x}, 0)`}>
                        <title>
                          {`${item.label} category – ${formatNumber(item.total)} total searches`}
                        </title>
                        {item.segments.map((segment) => {
                          if (!segment.value) {
                            return null;
                          }

                          const height = stackedMaxVolume
                            ? (segment.value / stackedMaxVolume) * stackedChartInnerHeight
                            : 0;
                          const y = currentY - height;
                          currentY = y;

                          return (
                            <rect
                              key={segment.stage}
                              className="seo-stacked-chart__bar"
                              x={0}
                              y={y}
                              width={stackedBarLayout.width}
                              height={height}
                              fill={segment.color}
                              rx={6}
                            >
                              <title>
                                {`${segment.stage} stage contributes ${formatNumber(segment.value)} searches for ${item.label}`}
                              </title>
                            </rect>
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <p className="seo-stacked-chart__empty">No keyword breakdown available.</p>
            )}
            <figcaption id="seo-stacked-caption" className="seo-stacked-chart__caption">
              Each stacked column represents a keyword category and breaks the search volume down by funnel stage to
              highlight audience progression.
            </figcaption>
          </figure>
        </div>

        <aside className="seo-opportunity__sidebar" aria-label="Keyword insights">
          <div className="seo-opportunity__legend">
            <span className="seo-opportunity__legend-title">Legend</span>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch seo-opportunity__legend-swatch--volume" aria-hidden="true" />
              <span>X-axis → Monthly search volume</span>
            </div>
            <div className="seo-opportunity__legend-item">
              <span className="seo-opportunity__legend-swatch seo-opportunity__legend-swatch--ws" aria-hidden="true" />
              <span>Y-axis &amp; bubble size → Winning score (WS)</span>
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
