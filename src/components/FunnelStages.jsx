import { useMemo } from 'react';
import PropTypes from 'prop-types';
import SankeyChart from './SankeyChart.jsx';
import { KEYWORD_SHEET_ROWS } from '../data/keywordSheet.js';

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

const CLUSTER_PALETTE = [
  {
    gradient: 'linear-gradient(90deg, rgba(104, 96, 255, 0.85), rgba(106, 190, 255, 0.85))',
    shadow: 'rgba(96, 128, 255, 0.35)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(106, 111, 255, 0.85), rgba(123, 210, 255, 0.8))',
    shadow: 'rgba(110, 149, 255, 0.35)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(95, 124, 255, 0.85), rgba(142, 228, 255, 0.78))',
    shadow: 'rgba(85, 144, 255, 0.3)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(89, 139, 255, 0.85), rgba(162, 236, 255, 0.75))',
    shadow: 'rgba(74, 152, 255, 0.28)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(255, 150, 134, 0.85), rgba(255, 206, 134, 0.85))',
    shadow: 'rgba(255, 173, 134, 0.35)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(255, 143, 171, 0.85), rgba(255, 207, 176, 0.85))',
    shadow: 'rgba(255, 164, 178, 0.32)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(255, 137, 200, 0.85), rgba(255, 210, 214, 0.82))',
    shadow: 'rgba(255, 162, 208, 0.32)',
  },
  {
    gradient: 'linear-gradient(90deg, rgba(255, 133, 147, 0.85), rgba(255, 192, 147, 0.85))',
    shadow: 'rgba(255, 162, 147, 0.32)',
  },
];

const FUNNEL_STAGE_STYLES = {
  Awareness: {
    gradient: 'linear-gradient(90deg, rgba(90, 205, 250, 0.85), rgba(126, 229, 255, 0.85))',
    shadow: 'rgba(90, 205, 250, 0.32)',
  },
  Consideration: {
    gradient: 'linear-gradient(90deg, rgba(255, 196, 110, 0.85), rgba(255, 221, 160, 0.85))',
    shadow: 'rgba(255, 196, 110, 0.32)',
  },
  Decision: {
    gradient: 'linear-gradient(90deg, rgba(255, 149, 182, 0.85), rgba(255, 182, 210, 0.85))',
    shadow: 'rgba(255, 149, 182, 0.32)',
  },
};

const FUNNEL_STAGE_ORDER = ['Awareness', 'Consideration', 'Decision'];

const formatVolume = (value) => value.toLocaleString('fr-FR');

const safeVolume = (value) => {
  if (value === undefined || value === null) {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

const assignClusterStyle = (index) => CLUSTER_PALETTE[index % CLUSTER_PALETTE.length];

const buildFunnelDataset = (rows) => {
  const clusterEntries = new Map();

  rows.forEach((row) => {
    const primaryKeyword = row.primaryKeyword ? row.primaryKeyword.trim() : '';
    const stage = row.funnelStage ? row.funnelStage.trim() : '';
    const volume = safeVolume(row.volume);

    if (!primaryKeyword || !FUNNEL_STAGE_ORDER.includes(stage) || volume <= 0) {
      return;
    }

    if (!clusterEntries.has(primaryKeyword)) {
      clusterEntries.set(primaryKeyword, {
        cluster: primaryKeyword,
        totalVolume: 0,
        stageVolumes: new Map(FUNNEL_STAGE_ORDER.map((name) => [name, 0])),
      });
    }

    const entry = clusterEntries.get(primaryKeyword);
    entry.stageVolumes.set(stage, (entry.stageVolumes.get(stage) || 0) + volume);
    entry.totalVolume += volume;
  });

  const clusterStageTable = Array.from(clusterEntries.values())
    .map((entry) => {
      const row = { cluster: entry.cluster, totalVolume: entry.totalVolume };
      FUNNEL_STAGE_ORDER.forEach((stage) => {
        row[stage] = entry.stageVolumes.get(stage) || 0;
      });
      return row;
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);

  const clusterDefinitions = clusterStageTable.map((clusterRow, index) => {
    const style = assignClusterStyle(index);
    return {
      id: clusterRow.cluster,
      label: clusterRow.cluster,
      side: 'left',
      gradient: style.gradient,
      shadow: style.shadow,
    };
  });

  const stageTotals = new Map(FUNNEL_STAGE_ORDER.map((stage) => [stage, 0]));

  const stageDefinitions = FUNNEL_STAGE_ORDER.map((stage) => {
    const style = FUNNEL_STAGE_STYLES[stage];
    return {
      id: stage,
      label: stage,
      side: 'right',
      gradient: style.gradient,
      shadow: style.shadow,
    };
  });

  const sankeyLinks = [];
  const clusterTotals = new Map();

  clusterStageTable.forEach((clusterRow) => {
    clusterTotals.set(clusterRow.cluster, clusterRow.totalVolume);

    FUNNEL_STAGE_ORDER.forEach((stage) => {
      const stageValue = clusterRow[stage];
      if (stageValue > 0) {
        sankeyLinks.push({ source: clusterRow.cluster, target: stage, value: stageValue });
        stageTotals.set(stage, (stageTotals.get(stage) || 0) + stageValue);
      }
    });
  });

  const definitions = [...clusterDefinitions, ...stageDefinitions];
  const nodes = computeSankeyNodes(definitions, sankeyLinks);

  return {
    nodes,
    links: sankeyLinks,
    clusterTotals,
    stageTotals,
    clusterStageTable,
  };
};

const computeQuickStats = (clusterTotals, stageTotals) => {
  const totalVolume = Array.from(clusterTotals.values()).reduce((sum, value) => sum + value, 0);

  if (!totalVolume) {
    return [
      { label: 'Volume total', value: '0', detail: 'Aucun volume renseigné', tone: 'neutral' },
      { label: 'Clusters analysés', value: '0', detail: 'Aucun cluster détecté', tone: 'neutral' },
      { label: 'Stage dominant', value: '—', detail: 'Données insuffisantes', tone: 'neutral' },
    ];
  }

  const clusterCount = clusterTotals.size;
  const [leadingStage, leadingValue] = Array.from(stageTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .find((entry) => entry[1] > 0) || ['—', 0];

  const leadingShare = leadingValue ? Math.round((leadingValue / totalVolume) * 100) : 0;

  return [
    {
      label: 'Volume total',
      value: formatVolume(totalVolume),
      detail: 'Somme des volumes enregistrés',
      tone: 'positive',
    },
    {
      label: 'Clusters analysés',
      value: clusterCount.toString(),
      detail: 'Groupes de mots-clés uniques',
      tone: 'neutral',
    },
    {
      label: 'Stage dominant',
      value: leadingStage,
      detail: leadingValue ? `${leadingShare}% du volume` : 'Répartition égale',
      tone: 'neutral',
    },
  ];
};

const buildStageKeywordHighlights = (rows, limit = 5) => {
  const stageBuckets = new Map(FUNNEL_STAGE_ORDER.map((stage) => [stage, []]));

  rows.forEach((row) => {
    const stage = row.funnelStage ? row.funnelStage.trim() : '';

    if (!stageBuckets.has(stage)) {
      return;
    }

    stageBuckets.get(stage).push({
      id: row.id,
      primaryKeyword: row.primaryKeyword,
      cluster: row.cluster,
      volume: safeVolume(row.volume),
    });
  });

  stageBuckets.forEach((keywords, stage) => {
    const sorted = keywords
      .filter((keyword) => keyword.primaryKeyword && keyword.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    stageBuckets.set(stage, sorted);
  });

  return stageBuckets;
};

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

const FunnelStages = ({ rows }) => {
  const {
    nodes: sankeyNodes,
    links: sankeyLinks,
    clusterTotals,
    stageTotals,
    clusterStageTable,
  } = useMemo(() => buildFunnelDataset(rows && rows.length > 0 ? rows : KEYWORD_SHEET_ROWS), [rows]);

  const quickStats = useMemo(() => computeQuickStats(clusterTotals, stageTotals), [clusterTotals, stageTotals]);

  const leftNodes = useMemo(() => sankeyNodes.filter((node) => node.side === 'left'), [sankeyNodes]);
  const rightNodes = useMemo(() => sankeyNodes.filter((node) => node.side === 'right'), [sankeyNodes]);
  const sankeyHeight = useMemo(() => {
    const baseHeight = 420;
    const baselineNodeCount = 8;
    const extraHeightPerNode = 42;

    const maxNodeCount = Math.max(leftNodes.length, rightNodes.length);

    if (maxNodeCount <= baselineNodeCount) {
      return baseHeight;
    }

    return baseHeight + (maxNodeCount - baselineNodeCount) * extraHeightPerNode;
  }, [leftNodes.length, rightNodes.length]);
  const stageKeywordHighlights = useMemo(
    () => buildStageKeywordHighlights(rows && rows.length > 0 ? rows : KEYWORD_SHEET_ROWS),
    [rows]
  );

  return (
    <section className="card funnel-card" aria-labelledby="funnel-title">
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
            valueFormatter={formatVolume}
            title="Répartition des volumes par stage"
            description="Flux des volumes de recherche entre les clusters de mots-clés et les étapes du funnel."
            height={sankeyHeight}
          />
        </div>

        <div className="funnel-cluster-table" aria-label="Synthèse des volumes par mots-clés">
          <table className="funnel-table">
            <caption className="visually-hidden">Répartition des volumes par cluster et par étape du funnel</caption>
            <thead>
              <tr>
                <th scope="col">Primary keyword</th>
                <th scope="col">Volume total</th>
                {FUNNEL_STAGE_ORDER.map((stage) => (
                  <th key={stage} scope="col">
                    {stage}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clusterStageTable.length ? (
                clusterStageTable.map((clusterRow) => (
                  <tr key={clusterRow.cluster}>
                    <th scope="row">{clusterRow.cluster}</th>
                    <td>{formatVolume(clusterRow.totalVolume)}</td>
                    {FUNNEL_STAGE_ORDER.map((stage) => (
                      <td key={stage}>{formatVolume(clusterRow[stage])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={FUNNEL_STAGE_ORDER.length + 2} className="funnel-table__empty">
                    Aucun volume disponible pour les mots-clés sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <span className="funnel-stage-card__value">{formatVolume(node.value)}</span>
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
                <span className="funnel-stage-card__value">{formatVolume(node.value)}</span>
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

        <div className="funnel-stage-keywords" aria-label="Top keywords by funnel stage">
          {FUNNEL_STAGE_ORDER.map((stage) => {
            const keywords = stageKeywordHighlights.get(stage) || [];

            return (
              <div key={stage} className="funnel-keyword-column">
                <span className="funnel-keyword-column__title">{stage}</span>
                <ul className="funnel-keyword-list" role="list">
                  {keywords.length ? (
                    keywords.map((keyword) => (
                      <li key={keyword.id} className="funnel-keyword-item" role="listitem">
                        <span className="funnel-keyword-item__keyword">{keyword.primaryKeyword}</span>
                        <span className="funnel-keyword-item__cluster">{keyword.cluster}</span>
                        <span className="funnel-keyword-item__volume">{formatVolume(keyword.volume)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="funnel-keyword-item funnel-keyword-item--empty" role="listitem">
                      <span className="funnel-keyword-item__empty">Aucun mot-clé disponible</span>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

FunnelStages.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      primaryKeyword: PropTypes.string.isRequired,
    })
  ),
};

FunnelStages.defaultProps = {
  rows: KEYWORD_SHEET_ROWS,
};

export default FunnelStages;
