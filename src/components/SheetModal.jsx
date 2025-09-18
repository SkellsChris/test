import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const COLUMNS = [
  { key: 'primaryKeyword', label: 'Primary Keywords', sortable: true },
  { key: 'secondaryKeyword', label: 'Secondary Keywords', sortable: true },
  { key: 'volume', label: 'Volume (Vol.)', sortable: true, isNumeric: true },
  { key: 'difficulty', label: 'Difficulty (Dif.)', sortable: true, isNumeric: true },
  { key: 'cpc', label: 'CPC ($)', sortable: true, isNumeric: true },
  { key: 'intent', label: 'Intent', sortable: true },
  { key: 'funnelStage', label: 'Funnel Stage', sortable: true },
  { key: 'fw', label: 'F.W.', sortable: true },
  { key: 'ws', label: 'W.S.', sortable: true },
  { key: 'win', label: 'Win.', sortable: true, isNumeric: true },
  { key: 'page', label: 'Page', sortable: true },
];

const SheetModal = ({ open, onClose, rows }) => {
  const [intentFilter, setIntentFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'volume', direction: 'desc' });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    return undefined;
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setIntentFilter('All');
      setStageFilter('All');
      setSortConfig({ key: 'volume', direction: 'desc' });
    }
  }, [open]);

  const uniqueIntents = useMemo(
    () => ['All', ...Array.from(new Set(rows.map((row) => row.intent)))],
    [rows]
  );

  const uniqueStages = useMemo(
    () => ['All', ...Array.from(new Set(rows.map((row) => row.funnelStage)))],
    [rows]
  );

  const sortedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const matchesIntent = intentFilter === 'All' || row.intent === intentFilter;
      const matchesStage = stageFilter === 'All' || row.funnelStage === stageFilter;
      return matchesIntent && matchesStage;
    });

    const sorted = [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      const directionMultiplier = direction === 'asc' ? 1 : -1;
      const valueA = a[key];
      const valueB = b[key];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * directionMultiplier;
      }

      return String(valueA).localeCompare(String(valueB)) * directionMultiplier;
    });

    return sorted;
  }, [rows, intentFilter, stageFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const formatValue = (columnKey, value) => {
    if (columnKey === 'volume' || columnKey === 'difficulty') {
      return value.toLocaleString();
    }

    if (columnKey === 'cpc') {
      return `$${value.toFixed(2)}`;
    }

    if (columnKey === 'win') {
      return `${value}%`;
    }

    return value;
  };

  if (!open) {
    return null;
  }

  return (
    <div className="sheet-modal" role="dialog" aria-modal="true" aria-labelledby="sheet-modal-title">
      <button type="button" className="sheet-modal__overlay" onClick={onClose} aria-label="Close keyword sheet overlay" />
      <div className="sheet-modal__dialog" role="document">
        <header className="sheet-modal__header">
          <div>
            <p className="sheet-modal__eyebrow">Keyword performance</p>
            <h2 id="sheet-modal-title">Campaign sheet</h2>
          </div>
          <button type="button" className="sheet-modal__close" onClick={onClose} aria-label="Close keyword sheet">
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        <div className="sheet-controls">
          <div className="sheet-filter">
            <label className="sheet-filter__label" htmlFor="sheet-intent-filter">
              Intent
            </label>
            <select
              id="sheet-intent-filter"
              value={intentFilter}
              onChange={(event) => setIntentFilter(event.target.value)}
              className="sheet-filter__select"
            >
              {uniqueIntents.map((intentOption) => (
                <option key={intentOption} value={intentOption}>
                  {intentOption}
                </option>
              ))}
            </select>
          </div>

          <div className="sheet-filter">
            <label className="sheet-filter__label" htmlFor="sheet-stage-filter">
              Funnel Stage
            </label>
            <select
              id="sheet-stage-filter"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="sheet-filter__select"
            >
              {uniqueStages.map((stageOption) => (
                <option key={stageOption} value={stageOption}>
                  {stageOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sheet-table-wrapper">
          <table className="sheet-table">
            <thead>
              <tr>
                {COLUMNS.map((column) => {
                  const isSorted = sortConfig.key === column.key;
                  const ariaSort = isSorted ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none';

                  return (
                    <th key={column.key} aria-sort={ariaSort} className={column.isNumeric ? 'sheet-table__cell--numeric' : ''}>
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className={`sheet-table__sort ${isSorted ? 'sheet-table__sort--active' : ''}`}
                      >
                        <span>{column.label}</span>
                        <span className="sheet-table__sort-icon" aria-hidden="true">
                          {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▾'}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="sheet-table__cell sheet-table__cell--empty">
                    No keywords match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr key={`${row.primaryKeyword}-${row.secondaryKeyword}`}>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={column.isNumeric ? 'sheet-table__cell sheet-table__cell--numeric' : 'sheet-table__cell'}
                      >
                        {formatValue(column.key, row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

SheetModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      primaryKeyword: PropTypes.string.isRequired,
      secondaryKeyword: PropTypes.string.isRequired,
      volume: PropTypes.number.isRequired,
      difficulty: PropTypes.number.isRequired,
      cpc: PropTypes.number.isRequired,
      intent: PropTypes.string.isRequired,
      funnelStage: PropTypes.string.isRequired,
      fw: PropTypes.string.isRequired,
      ws: PropTypes.string.isRequired,
      win: PropTypes.number.isRequired,
      page: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default SheetModal;
