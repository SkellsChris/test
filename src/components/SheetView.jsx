import PropTypes from 'prop-types';

import { resolveWinDisplayValue } from '../utils/quickWin.js';

const COLUMNS = [
  { key: 'primaryKeyword', label: 'Primary keyword' },
  { key: 'secondaryKeyword', label: 'Secondary keyword' },
  { key: 'volume', label: 'Volume', align: 'right', type: 'number' },
  { key: 'difficulty', label: 'Difficulty', align: 'right', type: 'number' },
  { key: 'ws', label: 'W.S.', align: 'right', type: 'number' },
  { key: 'intent', label: 'Intent' },
  { key: 'funnelStage', label: 'Funnel stage' },
  { key: 'win', label: 'Win %', align: 'right', type: 'percentage' },
  { key: 'page', label: 'Page' },
];

const formatNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toLocaleString('en-US');
  }

  return value.toString();
};

const formatPercentage = (value) => {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') {
    return '—';
  }

  const cleaned = typeof raw === 'string' ? raw.replace(/%/g, '').replace(',', '.').trim() : raw;
  const numeric = Number.parseFloat(cleaned);

  if (Number.isFinite(numeric)) {
    return `${numeric}%`;
  }

  return raw.toString();
};

const formatCellValue = (row, column) => {
  if (column.key === 'win') {
    const displayValue = resolveWinDisplayValue(row);
    return displayValue.text || '—';
  }

  const value = row?.[column.key];

  if (column.type === 'number') {
    return formatNumber(value);
  }

  if (column.type === 'percentage') {
    return formatPercentage(value);
  }

  if (value === undefined || value === null || value === '') {
    return '—';
  }

  return value;
};

const SheetView = ({ rows }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const totalVolume = safeRows.reduce((sum, row) => {
    const numeric = Number(row?.volume);
    if (!Number.isFinite(numeric)) {
      return sum;
    }
    return sum + numeric;
  }, 0);

  const averageDifficulty = safeRows.length
    ? Math.round(
        safeRows.reduce((sum, row) => {
          const numeric = Number(row?.difficulty);
          if (!Number.isFinite(numeric)) {
            return sum;
          }
          return sum + numeric;
        }, 0) / safeRows.length
      )
    : 0;

  return (
    <section className="card sheet-view-card" aria-labelledby="sheet-view-title">
      <header className="card__header sheet-view-card__header">
        <div>
          <p className="card__eyebrow">Recorded keywords</p>
          <h2 id="sheet-view-title">Keyword sheet overview</h2>
          <p className="card__subtitle">
            Review the keywords currently stored for this project. Open the sheet to edit or add new entries.
          </p>
        </div>
        <div className="sheet-view-card__summary" aria-live="polite">
          <div>
            <span className="sheet-view-card__summary-label">Total rows</span>
            <span className="sheet-view-card__summary-value">{safeRows.length}</span>
          </div>
          <div>
            <span className="sheet-view-card__summary-label">Total volume</span>
            <span className="sheet-view-card__summary-value">{formatNumber(totalVolume)}</span>
          </div>
          <div>
            <span className="sheet-view-card__summary-label">Avg. difficulty</span>
            <span className="sheet-view-card__summary-value">{safeRows.length ? averageDifficulty : '—'}</span>
          </div>
        </div>
      </header>

      <div className="sheet-view-table" role="region" aria-live="polite" aria-label="Recorded keyword rows">
        {safeRows.length ? (
          <div className="sheet-view-table__scroll">
            <table className="sheet-view-table__table">
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th key={column.key} className={column.align ? `sheet-view-table__cell--${column.align}` : ''}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeRows.map((row) => (
                  <tr key={row.id || row.primaryKeyword}>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={column.align ? `sheet-view-table__cell--${column.align}` : ''}
                      >
                        {formatCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sheet-view-table__empty">No keywords recorded yet. Add entries via the sheet to see them here.</p>
        )}
      </div>
    </section>
  );
};

SheetView.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      primaryKeyword: PropTypes.string,
    })
  ),
};

SheetView.defaultProps = {
  rows: [],
};

export default SheetView;
