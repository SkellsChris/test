import { useId, useMemo } from 'react';
import PropTypes from 'prop-types';

const sanitizeId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const BASE_FONT_SIZE_PX = 16;
const LABEL_FONT_SIZE_PX = BASE_FONT_SIZE_PX * 0.95;
const VALUE_FONT_SIZE_PX = BASE_FONT_SIZE_PX * 0.85;
const AVERAGE_CHAR_WIDTH = 0.58;
const LABEL_HORIZONTAL_PADDING = 28;

const estimateTextWidth = (text, fontSizePx) => text.length * fontSizePx * AVERAGE_CHAR_WIDTH;

const estimateNodeLabelWidth = (node, valueFormatter) => {
  const labelWidth = estimateTextWidth(node.label || '', LABEL_FONT_SIZE_PX);
  const formattedValue = valueFormatter ? valueFormatter(node.value) : node.value;
  const valueWidth = estimateTextWidth(String(formattedValue ?? ''), VALUE_FONT_SIZE_PX);

  return Math.max(labelWidth, valueWidth);
};

const computeSankeyLayout = (nodes, links, width, height, nodeWidth, nodeGap, margin) => {
  const sources = nodes.filter((node) => node.side === 'left');
  const targets = nodes.filter((node) => node.side === 'right');
  const totalValue = sources.reduce((sum, node) => sum + node.value, 0);

  if (!nodes.length || !links.length || totalValue <= 0) {
    return { nodes: [], links: [] };
  }

  const availableLeftHeight = height - margin.top - margin.bottom - nodeGap * Math.max(sources.length - 1, 0);
  const availableRightHeight = height - margin.top - margin.bottom - nodeGap * Math.max(targets.length - 1, 0);
  const scale = Math.min(availableLeftHeight / totalValue, availableRightHeight / totalValue);

  const positionColumn = (columnNodes, side) => {
    if (!columnNodes.length) {
      return [];
    }

    const x0 = side === 'left' ? margin.left : width - margin.right - nodeWidth;
    const x1 = x0 + nodeWidth;
    const totalHeight = columnNodes.reduce((sum, node) => sum + node.value * scale, 0);
    const totalGap = nodeGap * Math.max(columnNodes.length - 1, 0);
    const extraSpace = height - margin.top - margin.bottom - totalHeight - totalGap;
    let currentY = margin.top + (extraSpace > 0 ? extraSpace / 2 : 0);

    return columnNodes.map((node) => {
      const nodeHeight = node.value * scale;
      const positioned = {
        ...node,
        x0,
        x1,
        y0: currentY,
        y1: currentY + nodeHeight,
        height: nodeHeight,
      };
      currentY = positioned.y1 + nodeGap;
      return positioned;
    });
  };

  const positionedSources = positionColumn(sources, 'left');
  const positionedTargets = positionColumn(targets, 'right');
  const positionedNodes = [...positionedSources, ...positionedTargets];
  const nodeById = new Map(positionedNodes.map((node) => [node.id, node]));
  const sourceOffsets = Object.create(null);
  const targetOffsets = Object.create(null);

  const positionedLinks = links
    .map((link, index) => {
      const sourceNode = nodeById.get(link.source);
      const targetNode = nodeById.get(link.target);

      if (!sourceNode || !targetNode || link.value <= 0) {
        return null;
      }

      const linkHeight = link.value * scale;
      const sourceOffset = sourceOffsets[link.source] || 0;
      const targetOffset = targetOffsets[link.target] || 0;
      const sourceY0 = sourceNode.y0 + sourceOffset;
      const sourceY1 = sourceY0 + linkHeight;
      const targetY0 = targetNode.y0 + targetOffset;
      const targetY1 = targetY0 + linkHeight;

      sourceOffsets[link.source] = sourceOffset + linkHeight;
      targetOffsets[link.target] = targetOffset + linkHeight;

      const sourceX = sourceNode.x1;
      const targetX = targetNode.x0;
      const midpointX = sourceX + (targetX - sourceX) * 0.5;

      const path = [
        `M ${sourceX} ${sourceY0}`,
        `C ${midpointX} ${sourceY0}, ${midpointX} ${targetY0}, ${targetX} ${targetY0}`,
        `L ${targetX} ${targetY1}`,
        `C ${midpointX} ${targetY1}, ${midpointX} ${sourceY1}, ${sourceX} ${sourceY1}`,
        'Z',
      ].join(' ');

      return {
        ...link,
        index,
        path,
        sourceX,
        targetX,
        sourceNode,
        targetNode,
        value: link.value,
        gradientId: `link-gradient-${sanitizeId(`${link.source}-${link.target}-${index}`)}`,
      };
    })
    .filter(Boolean);

  return { nodes: positionedNodes, links: positionedLinks };
};

const SankeyChart = ({
  nodes,
  links,
  valueFormatter,
  title,
  description,
  width,
  height,
  nodeWidth,
  nodeGap,
  margin,
}) => {
  const { resolvedWidth, resolvedMargin } = useMemo(() => {
    const baseMargin = {
      top: margin.top ?? 0,
      right: margin.right ?? 0,
      bottom: margin.bottom ?? 0,
      left: margin.left ?? 0,
    };

    if (!nodes.length) {
      return { resolvedWidth: width, resolvedMargin: baseMargin };
    }

    const leftNodes = nodes.filter((node) => node.side === 'left');
    const rightNodes = nodes.filter((node) => node.side === 'right');

    const maxLeftLabelWidth = leftNodes.reduce(
      (maxWidth, node) => Math.max(maxWidth, estimateNodeLabelWidth(node, valueFormatter)),
      0
    );
    const maxRightLabelWidth = rightNodes.reduce(
      (maxWidth, node) => Math.max(maxWidth, estimateNodeLabelWidth(node, valueFormatter)),
      0
    );

    const resolvedMarginLeft = Math.max(
      baseMargin.left,
      Math.ceil(maxLeftLabelWidth) + LABEL_HORIZONTAL_PADDING
    );
    const resolvedMarginRight = Math.max(
      baseMargin.right,
      Math.ceil(maxRightLabelWidth) + LABEL_HORIZONTAL_PADDING
    );

    const resolvedWidthValue =
      width + (resolvedMarginLeft - baseMargin.left) + (resolvedMarginRight - baseMargin.right);

    return {
      resolvedWidth: resolvedWidthValue,
      resolvedMargin: {
        ...baseMargin,
        left: resolvedMarginLeft,
        right: resolvedMarginRight,
      },
    };
  }, [nodes, margin, width, valueFormatter]);

  const layout = useMemo(
    () =>
      computeSankeyLayout(nodes, links, resolvedWidth, height, nodeWidth, nodeGap, resolvedMargin),
    [nodes, links, resolvedWidth, height, nodeWidth, nodeGap, resolvedMargin]
  );
  const titleId = useId();
  const descriptionId = description ? `${titleId}-desc` : undefined;

  return (
    <svg
      className="sankey-chart"
      viewBox={`0 0 ${resolvedWidth} ${height}`}
      role="img"
      aria-labelledby={descriptionId ? `${titleId} ${descriptionId}` : titleId}
    >
      <title id={titleId}>{title}</title>
      {description ? <desc id={descriptionId}>{description}</desc> : null}

      <defs>
        {layout.nodes.map((node) => (
          <linearGradient
            key={node.id}
            id={`node-gradient-${sanitizeId(node.id)}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={node.colors[0]} />
            <stop offset="100%" stopColor={node.colors[1]} />
          </linearGradient>
        ))}

        {layout.links.map((link) => (
          <linearGradient
            key={link.gradientId}
            id={link.gradientId}
            gradientUnits="userSpaceOnUse"
            x1={link.sourceX}
            x2={link.targetX}
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor={link.sourceNode.colors[0]} stopOpacity="0.85" />
            <stop
              offset="100%"
              stopColor={link.targetNode.colors[1] || link.targetNode.colors[0]}
              stopOpacity="0.75"
            />
          </linearGradient>
        ))}
      </defs>

      <g className="sankey-chart__links" fill="none">
        {layout.links.map((link) => (
          <path key={link.gradientId} d={link.path} fill={`url(#${link.gradientId})`} className="sankey-chart__link">
            <title>
              {`${link.source} to ${link.target}: ${valueFormatter(link.value)}`}
            </title>
          </path>
        ))}
      </g>

      <g className="sankey-chart__nodes">
        {layout.nodes.map((node) => {
          const labelX = node.side === 'left' ? node.x0 - 18 : node.x1 + 18;
          const textAnchor = node.side === 'left' ? 'end' : 'start';
          const labelY = (node.y0 + node.y1) / 2 - 6;

          return (
            <g key={node.id} className="sankey-chart__node">
              <rect
                x={node.x0}
                y={node.y0}
                width={node.x1 - node.x0}
                height={node.y1 - node.y0}
                rx={14}
                ry={14}
                fill={`url(#node-gradient-${sanitizeId(node.id)})`}
                className="sankey-chart__node-rect"
                style={{ filter: `drop-shadow(0 18px 36px ${node.shadow})` }}
              >
                <title>{`${node.label}: ${valueFormatter(node.value)}`}</title>
              </rect>
              <text x={labelX} y={labelY} textAnchor={textAnchor} className="sankey-node__text">
                <tspan x={labelX} className="sankey-node__label">
                  {node.label}
                </tspan>
                <tspan x={labelX} dy="1.3em" className="sankey-node__value">
                  {valueFormatter(node.value)}
                </tspan>
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

SankeyChart.propTypes = {
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      side: PropTypes.oneOf(['left', 'right']).isRequired,
      value: PropTypes.number.isRequired,
      colors: PropTypes.arrayOf(PropTypes.string).isRequired,
      shadow: PropTypes.string,
    })
  ).isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string.isRequired,
      target: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  valueFormatter: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  nodeWidth: PropTypes.number,
  nodeGap: PropTypes.number,
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
};

SankeyChart.defaultProps = {
  valueFormatter: (value) => value.toLocaleString('en-US'),
  title: 'Sankey diagram',
  description: undefined,
  width: 780,
  height: 420,
  nodeWidth: 26,
  nodeGap: 32,
  margin: { top: 12, right: 96, bottom: 12, left: 96 },
};

export default SankeyChart;
