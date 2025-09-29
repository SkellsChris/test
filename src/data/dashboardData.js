import { KEYWORD_SHEET_ROWS } from './keywordSheet.js';
import { SEO_OPPORTUNITY_KEYWORDS } from './seoOpportunity.js';

const STAGES = [
  { id: 'awareness', stage: 'Awareness', label: 'Sensibilisation' },
  { id: 'consideration', stage: 'Consideration', label: 'Considération' },
  { id: 'decision', stage: 'Decision', label: 'Décision' },
];

const STAGE_TREND_DIRECTION = {
  Awareness: 'neutral',
  Consideration: 'positive',
  Decision: 'positive',
};

const STAGE_FALLBACK_LABEL = 'Non défini';

const formatInteger = (value) =>
  new Intl.NumberFormat('fr-FR').format(Number.isFinite(value) ? Math.round(value) : 0);

const formatDecimal = (value, fractionDigits = 1) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0);

const formatPercent = (value) => `${formatDecimal(value, 1)} %`;

const sumBy = (items, selector) =>
  items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);

const stageMetrics = STAGES.reduce(
  (acc, { stage }) => {
    acc.counts[stage] = 0;
    acc.volumes[stage] = 0;
    return acc;
  },
  { counts: {}, volumes: {} }
);

KEYWORD_SHEET_ROWS.forEach((row) => {
  const safeStage = STAGES.some((definition) => definition.stage === row.funnelStage)
    ? row.funnelStage
    : STAGES[0].stage;

  stageMetrics.counts[safeStage] += 1;
  stageMetrics.volumes[safeStage] += Number(row.volume) || 0;
});

const pipelineTotalVolume = sumBy(KEYWORD_SHEET_ROWS, (row) => row.volume);
const totalKeywords = KEYWORD_SHEET_ROWS.length;
const transactionalKeywords = KEYWORD_SHEET_ROWS.filter((row) =>
  ['Commercial', 'Transactional'].includes(row.intent)
).length;
const uniqueClusters = new Map();

KEYWORD_SHEET_ROWS.forEach((row) => {
  const clusterName = (row.cluster || row.primaryKeyword || '').trim() || 'Cluster sans nom';

  if (!uniqueClusters.has(clusterName)) {
    uniqueClusters.set(clusterName, {
      name: clusterName,
      totalVolume: 0,
      keywordCount: 0,
      stageVolumes: new Map(),
    });
  }

  const cluster = uniqueClusters.get(clusterName);
  cluster.totalVolume += Number(row.volume) || 0;
  cluster.keywordCount += 1;

  const stage = STAGES.find((definition) => definition.stage === row.funnelStage)?.stage || STAGES[0].stage;
  cluster.stageVolumes.set(stage, (cluster.stageVolumes.get(stage) || 0) + (Number(row.volume) || 0));
});

const clusterSummaries = Array.from(uniqueClusters.values())
  .map((cluster) => {
    const stageEntries = Array.from(cluster.stageVolumes.entries());
    if (!stageEntries.length) {
      return { ...cluster, dominantStage: null };
    }

    const [dominantStage] = stageEntries.sort((a, b) => b[1] - a[1]);
    return { ...cluster, dominantStage: dominantStage?.[0] || null };
  })
  .sort((a, b) => b.totalVolume - a.totalVolume);

const seoStageVolumes = STAGES.reduce((acc, { stage }) => {
  acc[stage] = 0;
  return acc;
}, {});

SEO_OPPORTUNITY_KEYWORDS.forEach((keyword) => {
  const stage = STAGES.find((definition) => definition.stage === keyword.funnelStage)?.stage || STAGES[0].stage;
  seoStageVolumes[stage] += Number(keyword.volume) || 0;
});

const totalProjectedTraffic = sumBy(SEO_OPPORTUNITY_KEYWORDS, (keyword) => keyword.projectedTraffic);
const averageOpportunity =
  SEO_OPPORTUNITY_KEYWORDS.length > 0
    ? sumBy(SEO_OPPORTUNITY_KEYWORDS, (keyword) => keyword.opportunity) / SEO_OPPORTUNITY_KEYWORDS.length
    : 0;
const averageCurrentPosition =
  SEO_OPPORTUNITY_KEYWORDS.length > 0
    ? sumBy(SEO_OPPORTUNITY_KEYWORDS, (keyword) => keyword.currentPosition) /
      SEO_OPPORTUNITY_KEYWORDS.length
    : 0;

const quickWins = SEO_OPPORTUNITY_KEYWORDS.filter(
  (keyword) => Number(keyword.opportunity) >= 85 && Number(keyword.currentPosition) > 3
);
const quickWinShare =
  SEO_OPPORTUNITY_KEYWORDS.length > 0 ? (quickWins.length / SEO_OPPORTUNITY_KEYWORDS.length) * 100 : 0;

const overviewData = {
  title: 'Vue d\'ensemble SEO',
  subtitle: 'Synthèse croisée du pipeline mots-clés et des opportunités.',
  quantity: {
    label: 'Mots-clés actifs',
    value: formatInteger(totalKeywords),
  },
  rows: [
    {
      label: 'Sensibilisation (pipeline)',
      value: `${formatInteger(stageMetrics.counts.Awareness || 0)} mots-clés`,
    },
    {
      label: 'Considération (pipeline)',
      value: `${formatInteger(stageMetrics.counts.Consideration || 0)} mots-clés`,
    },
    {
      label: 'Décision (pipeline)',
      value: `${formatInteger(stageMetrics.counts.Decision || 0)} mots-clés`,
    },
    {
      label: 'Intent commercial / transactionnel',
      value: `${formatInteger(transactionalKeywords)} mots-clés`,
    },
    {
      label: 'Opportunités ≥ 85',
      value: `${formatInteger(quickWins.length)} sujets`,
    },
    {
      label: 'Trafic projeté (SEO)',
      value: `${formatInteger(totalProjectedTraffic)} visites`,
    },
  ],
  summary: {
    label: 'Score moyen des opportunités',
    value: `${formatDecimal(averageOpportunity, 1)} / 100`,
    trend: {
      direction: quickWinShare > 0 ? 'positive' : 'neutral',
      text: `${formatPercent(quickWinShare)} à fort potentiel · Position moyenne #${formatDecimal(
        averageCurrentPosition,
        1
      )}`,
    },
  },
};

const performanceData = {
  eyebrow: 'Comparaison pipeline vs opportunités',
  title: 'Volume par étape du tunnel',
  centerLabel: 'Volume cumulé pipeline',
  centerValue: `${formatInteger(pipelineTotalVolume)} recherches`,
  categories: STAGES.map(({ id, label, stage }) => ({
    key: id,
    label,
    amount: `${formatInteger(stageMetrics.volumes[stage] || 0)} recherches · ${formatInteger(
      seoStageVolumes[stage] || 0
    )} opp.`,
  })),
  datasets: [
    {
      id: 'pipeline',
      label: 'Pipeline',
      total: `${formatInteger(totalKeywords)} mots-clés`,
      className: 'primary',
      values: STAGES.reduce((acc, { id, stage }) => {
        acc[id] = stageMetrics.volumes[stage] || 0;
        return acc;
      }, {}),
    },
    {
      id: 'seo-opportunity',
      label: 'Opportunités',
      total: `${formatInteger(SEO_OPPORTUNITY_KEYWORDS.length)} sujets`,
      className: 'secondary',
      values: STAGES.reduce((acc, { id, stage }) => {
        acc[id] = seoStageVolumes[stage] || 0;
        return acc;
      }, {}),
    },
  ],
};

const topCluster = clusterSummaries[0] || null;
const topClusterStageLabel = topCluster?.dominantStage
  ? STAGES.find((definition) => definition.stage === topCluster.dominantStage)?.label || STAGE_FALLBACK_LABEL
  : STAGE_FALLBACK_LABEL;
const topClusterTrendDirection = topCluster?.dominantStage
  ? STAGE_TREND_DIRECTION[topCluster.dominantStage] || 'neutral'
  : 'neutral';

const totalsData = {
  eyebrow: 'Synthèse clusters',
  title: 'Clusters à prioriser',
  highlight: {
    value: topCluster ? `${formatInteger(topCluster.totalVolume)} recherches` : '0 recherche',
    trend: {
      direction: topClusterTrendDirection,
      text: topCluster ? `${topClusterStageLabel} dominant` : STAGE_FALLBACK_LABEL,
    },
  },
  list: clusterSummaries.slice(0, 6).map((cluster) => {
    const dominantStageLabel = cluster.dominantStage
      ? STAGES.find((definition) => definition.stage === cluster.dominantStage)?.label || STAGE_FALLBACK_LABEL
      : STAGE_FALLBACK_LABEL;

    const trendDirection = cluster.dominantStage
      ? STAGE_TREND_DIRECTION[cluster.dominantStage] || 'neutral'
      : 'neutral';

    return {
      label: cluster.name,
      value: `${formatInteger(cluster.totalVolume)} recherches`,
      trend: {
        direction: trendDirection,
        text: `${formatInteger(cluster.keywordCount)} mots-clés · ${dominantStageLabel}`,
      },
    };
  }),
  footer: {
    label: 'Trafic projeté (SEO)',
    value: `${formatInteger(totalProjectedTraffic)} visites`,
    trend: {
      direction: quickWinShare > 0 ? 'positive' : 'neutral',
      text: `${formatPercent(quickWinShare)} des opportunités sont prioritaires`,
    },
  },
};

export const TIMEFRAME_OPTIONS = [{ id: 'TY', label: 'Vue globale', name: 'Vue globale' }];

export const DASHBOARD_DATA = {
  TY: {
    overview: overviewData,
    performance: performanceData,
    totals: totalsData,
  },
};
