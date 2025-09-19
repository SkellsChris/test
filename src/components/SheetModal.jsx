import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const ROW_HEIGHT = 60;
const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INTENT_OPTIONS = ['Informational', 'Commercial', 'Transactional'];
const FUNNEL_OPTIONS = ['Awareness', 'Consideration', 'Decision'];
const FW_OPTIONS = ['Low', 'Medium', 'High'];
const FW_VALUE_BY_LABEL = {
  Low: 1.0,
  Medium: 1.5,
  High: 2.0,
};
const FUNNEL_STAGE_TO_FW_LABEL = {
  Awareness: 'Low',
  Consideration: 'Medium',
  Decision: 'High',
};
const DEFAULT_FUNNEL_STAGE = 'Awareness';
const DEFAULT_FW_LABEL = FUNNEL_STAGE_TO_FW_LABEL[DEFAULT_FUNNEL_STAGE];
const DEFAULT_FW_VALUE = FW_VALUE_BY_LABEL[DEFAULT_FW_LABEL];
const COLUMN_DEFS = [
  { key: 'primaryKeyword', label: 'Primary Keywords', type: 'text' },
  { key: 'secondaryKeyword', label: 'Secondary Keywords', type: 'text' },
  { key: 'volume', label: 'Volume (Vol.)', type: 'number' },
  { key: 'difficulty', label: 'Difficulty (Dif.)', type: 'number' },
  { key: 'cpc', label: 'CPC ($)', type: 'currency' },
  { key: 'intent', label: 'Intent', type: 'intent' },
  { key: 'funnelStage', label: 'Funnel Stage', type: 'funnel' },
  { key: 'fw', label: 'F.W.', type: 'enum', options: FW_OPTIONS, editable: false },
  { key: 'ws', label: 'W.S.', type: 'number', editable: false },
  { key: 'win', label: 'Win.', type: 'number' },
  { key: 'page', label: 'Page', type: 'text' },
];

const SCHEMA_FIELDS = [
  { key: 'primaryKeyword', label: 'Primary Keywords', required: true },
  { key: 'secondaryKeyword', label: 'Secondary Keywords', required: false },
  { key: 'volume', label: 'Volume', required: false },
  { key: 'difficulty', label: 'Difficulty', required: false },
  { key: 'cpc', label: 'CPC', required: false },
  { key: 'intent', label: 'Intent', required: false },
  { key: 'funnelStage', label: 'Funnel Stage', required: false },
  { key: 'fw', label: 'F.W.', required: false },
  { key: 'ws', label: 'W.S.', required: false },
  { key: 'win', label: 'Win %', required: false },
  { key: 'page', label: 'Page', required: false },
];

const INTENT_BADGES = {
  Informational: 'intent--informational',
  Commercial: 'intent--commercial',
  Transactional: 'intent--transactional',
};

const FUNNEL_BADGES = {
  Awareness: 'funnel--awareness',
  Consideration: 'funnel--consideration',
  Decision: 'funnel--decision',
};

const DEFAULT_ROW = {
  primaryKeyword: '',
  secondaryKeyword: '',
  volume: 0,
  difficulty: 0,
  cpc: 0,
  intent: 'Informational',
  funnelStage: DEFAULT_FUNNEL_STAGE,
  fw: DEFAULT_FW_LABEL,
  fwValue: DEFAULT_FW_VALUE,
  ws: 0,
  win: '',
  page: 'Landing – Service',
};

const INTENT_REGEX = [
  { matcher: /(price|cost|tarif|combien)/i, value: 'Transactional' },
  {
    matcher: /(best|compare|vs|review|photos|before after|témoignage)/i,
    value: 'Commercial',
  },
];

const FUNNEL_BY_INTENT = {
  Transactional: 'Decision',
  Commercial: 'Consideration',
  Informational: 'Awareness',
};

const createId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `row-${Date.now()}-${counter}`;
  };
})();

const clampNumber = (value, min, max) => {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return min;
  }
  const result = Math.max(min, max !== undefined ? Math.min(value, max) : value);
  return Number.isFinite(result) ? result : min;
};

const normaliseKeyword = (value) => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toString().trim().replace(/\s+/g, ' ');
};

const buildKeywordKey = (primary, secondary) =>
  `${normaliseKeyword(primary).toLowerCase()}::${normaliseKeyword(secondary).toLowerCase()}`;

const normaliseEnum = (value, options, fallback) => {
  if (!value) {
    return fallback;
  }
  const normalised = value.toString().trim();
  const match = options.find((option) => option.toLowerCase() === normalised.toLowerCase());
  return match || fallback;
};

const inferIntent = (primary, secondary) => {
  const source = `${primary || ''} ${secondary || ''}`;
  const matched = INTENT_REGEX.find(({ matcher }) => matcher.test(source));
  if (matched) {
    return matched.value;
  }
  return 'Informational';
};

const inferFunnel = (intent) => FUNNEL_BY_INTENT[intent] || DEFAULT_FUNNEL_STAGE;

const parseFwNumeric = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }
  const normalised = trimmed.replace(',', '.');
  const numeric = Number.parseFloat(normalised);
  return Number.isNaN(numeric) ? null : numeric;
};

const sanitiseNumericInput = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/[^0-9,.-]/g, '');
  if (!cleaned) {
    return null;
  }

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      const normalised = cleaned.replace(/\./g, '').replace(',', '.');
      const numeric = Number.parseFloat(normalised);
      return Number.isNaN(numeric) ? null : numeric;
    }
    const normalised = cleaned.replace(/,/g, '');
    const numeric = Number.parseFloat(normalised);
    return Number.isNaN(numeric) ? null : numeric;
  }

  if (hasComma) {
    const lastComma = cleaned.lastIndexOf(',');
    const digitsAfter = cleaned.length - lastComma - 1;
    const normalised =
      digitsAfter === 3 && cleaned.length > 4
        ? cleaned.replace(/,/g, '')
        : cleaned.replace(',', '.');
    const numeric = Number.parseFloat(normalised);
    return Number.isNaN(numeric) ? null : numeric;
  }

  if (hasDot) {
    const lastDot = cleaned.lastIndexOf('.');
    const digitsAfter = cleaned.length - lastDot - 1;
    const normalised =
      digitsAfter === 3 && cleaned.length > 4 ? cleaned.replace(/\./g, '') : cleaned;
    const numeric = Number.parseFloat(normalised);
    return Number.isNaN(numeric) ? null : numeric;
  }

  const numeric = Number.parseFloat(cleaned);
  return Number.isNaN(numeric) ? null : numeric;
};

const parseIntegerLike = (value) => {
  const numeric = sanitiseNumericInput(value);
  if (numeric === null) {
    return null;
  }
  const integer = Math.round(numeric);
  return Number.isFinite(integer) ? integer : null;
};

const resolveFunnelWeight = (stage, rawFw) => {
  const mappedLabel = FUNNEL_STAGE_TO_FW_LABEL[stage];
  if (mappedLabel && FW_VALUE_BY_LABEL[mappedLabel] !== undefined) {
    return { label: mappedLabel, value: FW_VALUE_BY_LABEL[mappedLabel] };
  }

  if (rawFw !== undefined && rawFw !== null && rawFw !== '') {
    const enumMatch = normaliseEnum(rawFw, FW_OPTIONS, '');
    if (enumMatch) {
      const value = FW_VALUE_BY_LABEL[enumMatch];
      if (value !== undefined) {
        return { label: enumMatch, value };
      }
    }

    const numericValue = parseFwNumeric(rawFw);
    if (numericValue !== null) {
      const matchedEntry = Object.entries(FW_VALUE_BY_LABEL).find(([, weightValue]) =>
        Math.abs(weightValue - numericValue) < 0.001
      );
      if (matchedEntry) {
        const [label, value] = matchedEntry;
        return { label, value };
      }
    }
  }

  return { label: DEFAULT_FW_LABEL, value: DEFAULT_FW_VALUE };
};

const resolveFwNumericValue = (label, explicitValue) => {
  if (explicitValue !== undefined && explicitValue !== null) {
    return explicitValue;
  }
  if (label && FW_VALUE_BY_LABEL[label] !== undefined) {
    return FW_VALUE_BY_LABEL[label];
  }
  return null;
};

const getFwNumericValue = (row) => {
  if (!row) {
    return null;
  }
  return resolveFwNumericValue(row.fw, row.fwValue);
};

const getFwDisplayValue = (row) => {
  const numeric = getFwNumericValue(row);
  return numeric !== null ? numeric.toFixed(1) : '';
};

const computeWsScore = (row) => {
  if (!row) {
    return 0;
  }

  const volume = Number.isFinite(row.volume) ? row.volume : 0;
  const cpc = Number.isFinite(row.cpc) ? row.cpc : 0;
  const difficulty = Number.isFinite(row.difficulty) ? row.difficulty : 0;
  const fwNumeric = getFwNumericValue(row);
  const effectiveFw = Number.isFinite(fwNumeric) && fwNumeric > 0 ? fwNumeric : 1;

  if (volume <= 0 || cpc <= 0) {
    return 0;
  }

  const denominator = Math.max(difficulty, 1);
  const rawScore = (volume * cpc * effectiveFw) / denominator;

  if (!Number.isFinite(rawScore)) {
    return 0;
  }

  return Number.parseFloat(rawScore.toFixed(2));
};

const applyWsScoreToRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return Array.isArray(rows) ? rows.map((row) => ({ ...row, ws: 0 })) : [];
  }
  return rows.map((row) => ({ ...row, ws: computeWsScore(row) }));
};

const parseWin = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const numeric = parseFloat(value);
  if (Number.isNaN(numeric)) {
    return '';
  }
  return clampNumber(Math.round(numeric), 0, 100);
};

const normaliseRow = (raw, { id, autoEnrich = true } = {}) => {
  const primaryKeyword = normaliseKeyword(raw.primaryKeyword);
  if (!primaryKeyword) {
    return null;
  }

  const secondaryKeyword = normaliseKeyword(raw.secondaryKeyword);

  const intentCandidate = normaliseEnum(raw.intent, INTENT_OPTIONS, '');
  const resolvedIntent = intentCandidate || inferIntent(primaryKeyword, secondaryKeyword);
  const resolvedFunnel = normaliseEnum(raw.funnelStage, FUNNEL_OPTIONS, '') || inferFunnel(resolvedIntent);

  const { label: resolvedFw, value: resolvedFwValue } = resolveFunnelWeight(resolvedFunnel, raw.fw);

  const row = {
    ...DEFAULT_ROW,
    primaryKeyword,
    secondaryKeyword,
    intent: resolvedIntent,
    funnelStage: resolvedFunnel,
    fw: resolvedFw,
    fwValue: resolvedFwValue,
    win: parseWin(raw.win),
    page: raw.page ? raw.page.toString().trim() : DEFAULT_ROW.page,
  };

  if (autoEnrich) {
    const parsedVolume = parseIntegerLike(raw.volume);
    const parsedDifficulty = parseIntegerLike(raw.difficulty);
    const parsedCpc = sanitiseNumericInput(raw.cpc);
    row.volume = clampNumber(parsedVolume === null ? 0 : parsedVolume, 0);
    row.difficulty = clampNumber(parsedDifficulty === null ? 0 : parsedDifficulty, 0, 100);
    row.cpc = parsedCpc === null ? 0 : Math.max(0, parsedCpc);
  } else {
    row.volume = 0;
    row.difficulty = 0;
    row.cpc = 0;
  }

  row.id = raw.id || id || createId();

  return row;
};

const prepareTableRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }
  const normalised = rows.map((row) => normaliseRow(row)).filter(Boolean);
  return applyWsScoreToRows(normalised);
};

const detectSeparator = (sample, fallback = ',') => {
  if (!sample) {
    return fallback;
  }
  const candidates = ['\\t', ',', ';', '|'];
  let bestSeparator = fallback;
  let bestCount = 0;
  candidates.forEach((candidate) => {
    const separator = candidate === '\\t' ? '\t' : candidate;
    const count = sample.split(separator).length;
    if (count > bestCount) {
      bestCount = count;
      bestSeparator = separator;
    }
  });
  return bestCount > 1 ? bestSeparator : fallback;
};

const splitLine = (line, separator) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === separator) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseDelimitedText = (text, { autoDetect = true, skipHeader = false } = {}) => {
  if (!text) {
    return { rows: [], headers: [] };
  }

  const normalisedText = text.replace(/\r\n?/g, '\n');
  const lines = normalisedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], headers: [] };
  }

  const separator = autoDetect ? detectSeparator(lines[0]) : ',';
  const entries = lines.map((line) => splitLine(line, separator === '\\t' ? '\t' : separator));

  if (skipHeader && entries.length > 0) {
    const [, ...rest] = entries;
    return { rows: rest, headers: entries[0] };
  }

  return { rows: entries, headers: [] };
};

const toCsv = (rows) => {
  const header = COLUMN_DEFS.map((column) => column.label);
  const escapeCell = (value) => {
    if (value === undefined || value === null) {
      return '';
    }
    const stringValue = value.toString();
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rowsData = rows.map((row) =>
    COLUMN_DEFS.map((column) => {
      const cellValue = row[column.key];
      if (column.type === 'currency') {
        return escapeCell(row.cpc.toFixed(2));
      }
      if (column.key === 'ws' && Number.isFinite(row.ws)) {
        return escapeCell(row.ws.toFixed(2));
      }
      if (column.key === 'fw') {
        return escapeCell(getFwDisplayValue(row));
      }
      if (column.key === 'win' && cellValue !== '' && cellValue !== null && cellValue !== undefined) {
        return escapeCell(`${cellValue}`);
      }
      return escapeCell(cellValue ?? '');
    }).join(',')
  );

  return [header.join(','), ...rowsData].join('\n');
};

const isLikelyNumeric = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return false;
  }
  const normalised = trimmed.replace(/\s+/g, '').replace(',', '.');
  return normalised !== '' && Number.isFinite(Number(normalised));
};

const formatCellValue = (column, row) => {
  const value = row[column.key];
  if (column.key === 'ws' && typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (column.type === 'currency') {
    return `$${Number(value || 0).toFixed(2)}`;
  }
  if (column.type === 'number' && typeof value === 'number') {
    return value.toLocaleString();
  }
  if (column.key === 'fw') {
    return getFwDisplayValue(row);
  }
  if (column.key === 'win' && value !== '' && value !== null && value !== undefined) {
    return `${value}%`;
  }
  return value ?? '';
};

const SheetModal = ({ open, onClose, rows }) => {
  const [tableRows, setTableRows] = useState(() => prepareTableRows(rows));
  const updateTableRows = useCallback(
    (updater) => {
      setTableRows((previous) => {
        const next = typeof updater === 'function' ? updater(previous) : updater;
        if (!Array.isArray(next)) {
          return previous;
        }
        return applyWsScoreToRows(next);
      });
    },
    [setTableRows]
  );
  const [intentFilter, setIntentFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState(() =>
    COLUMN_DEFS.reduce((accumulator, column) => ({ ...accumulator, [column.key]: '' }), {})
  );
  const [sortConfig, setSortConfig] = useState({ key: 'volume', direction: 'desc' });
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isPastePanelOpen, setPastePanelOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pastePreview, setPastePreview] = useState([]);
  const [pasteOptions, setPasteOptions] = useState({
    detectSeparator: true,
    skipHeader: false,
    dedupe: true,
    autoEnrich: true,
  });
  const [importMapping, setImportMapping] = useState(null);
  const [importError, setImportError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [virtualRange, setVirtualRange] = useState({ start: 0, end: 0 });
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const tableScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const editingInputRef = useRef(null);

  const setToast = useCallback((message) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    setTableRows(prepareTableRows(rows));
  }, [rows]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [intentFilter, stageFilter, debouncedSearch, columnFilters]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = setTimeout(() => setToastMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!editingCell) {
      setEditingValue('');
      return;
    }

    const column = COLUMN_DEFS.find((item) => item.key === editingCell.columnKey);
    const row = tableRows.find((item) => item.id === editingCell.rowId);

    if (!column || !row) {
      setEditingCell(null);
      setEditingValue('');
      return;
    }

    let value = row[column.key];
    if (column.type === 'currency') {
      value = Number(row.cpc || 0).toFixed(2);
    }
    setEditingValue(value === undefined || value === null ? '' : value.toString());
  }, [editingCell, tableRows]);

  useEffect(() => {
    if (editingCell && editingInputRef.current) {
      editingInputRef.current.focus();
      if (editingInputRef.current.select) {
        editingInputRef.current.select();
      }
    }
  }, [editingCell]);

  const copySelectedRows = useCallback(() => {
    if (!selectedIds.size) {
      return;
    }

    const selectedRows = tableRows.filter((row) => selectedIds.has(row.id));
    if (!selectedRows.length) {
      return;
    }

    const csv = toCsv(selectedRows);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(csv)
        .then(() => setToast(`${selectedRows.length} row(s) copied to clipboard`))
        .catch(() => setToast('Unable to copy to clipboard'));
    }
  }, [selectedIds, tableRows, setToast]);

  const openPastePanelFromClipboard = useCallback(() => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setPastePanelOpen(true);
      return;
    }

    navigator.clipboard
      .readText()
      .then((clipboardText) => {
        if (clipboardText) {
          setPasteText(clipboardText);
        }
        setPastePanelOpen(true);
      })
      .catch(() => {
        setPastePanelOpen(true);
      });
  }, []);

  const missingRequiredImportFields = useMemo(() => {
    if (!importMapping) {
      return [];
    }
    return SCHEMA_FIELDS.filter((field) => field.required && !importMapping.mapping[field.key]);
  }, [importMapping]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedRows();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        openPastePanelFromClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, copySelectedRows, openPastePanelFromClipboard]);

  const uniqueIntents = useMemo(
    () => ['All', ...Array.from(new Set(tableRows.map((row) => row.intent))).sort()],
    [tableRows]
  );

  const uniqueStages = useMemo(
    () => ['All', ...Array.from(new Set(tableRows.map((row) => row.funnelStage))).sort()],
    [tableRows]
  );

  const filteredRows = useMemo(() => {
    return tableRows.filter((row) => {
      const matchesIntent = intentFilter === 'All' || row.intent === intentFilter;
      const matchesStage = stageFilter === 'All' || row.funnelStage === stageFilter;

      const matchesSearch = !debouncedSearch
        ? true
        : COLUMN_DEFS.some((column) => {
            if (column.key === 'fw') {
              const displayValue = getFwDisplayValue(row);
              if (!displayValue) {
                return false;
              }
              return displayValue.toString().toLowerCase().includes(debouncedSearch);
            }
            const value = row[column.key];
            if (value === undefined || value === null) {
              return false;
            }
            return value
              .toString()
              .toLowerCase()
              .includes(debouncedSearch);
          });

      if (!matchesIntent || !matchesStage || !matchesSearch) {
        return false;
      }

      return COLUMN_DEFS.every((column) => {
        const filterValue = columnFilters[column.key];
        if (!filterValue) {
          return true;
        }
        if (column.key === 'fw') {
          const displayValue = getFwDisplayValue(row);
          if (!displayValue) {
            return false;
          }
          return displayValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        }
        const value = row[column.key];
        if (value === undefined || value === null) {
          return false;
        }
        return value.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [tableRows, intentFilter, stageFilter, debouncedSearch, columnFilters]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;
      if (key === 'fw') {
        const valueANum = a.fwValue ?? FW_VALUE_BY_LABEL[a.fw] ?? 0;
        const valueBNum = b.fwValue ?? FW_VALUE_BY_LABEL[b.fw] ?? 0;
        if (valueANum !== valueBNum) {
          return (valueANum - valueBNum) * multiplier;
        }
        const labelA = a.fw ?? '';
        const labelB = b.fw ?? '';
        return labelA.toString().localeCompare(labelB.toString()) * multiplier;
      }
      const valueA = a[key];
      const valueB = b[key];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * multiplier;
      }

      return valueA.toString().localeCompare(valueB.toString()) * multiplier;
    });
    return sorted;
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages) || 1);
  }, [totalPages]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      sortedRows.forEach((row) => {
        if (!previous.has(row.id)) {
          return;
        }
        next.add(row.id);
      });
      [...next].forEach((id) => {
        if (!sortedRows.some((row) => row.id === id)) {
          next.delete(id);
        }
      });
      return next;
    });
  }, [sortedRows]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, currentPage, pageSize]);

  const visibleRows = useMemo(() => {
    const startIndex = Math.max(0, Math.min(pageRows.length, virtualRange.start));
    const endIndex = Math.max(startIndex, Math.min(pageRows.length, virtualRange.end));
    const paddingTop = startIndex * ROW_HEIGHT;
    const paddingBottom = Math.max(0, pageRows.length - endIndex) * ROW_HEIGHT;
    const items = pageRows.slice(startIndex, endIndex);
    return { paddingTop, paddingBottom, items };
  }, [pageRows, virtualRange]);

  const allVisibleSelected = useMemo(() => {
    if (!pageRows.length) {
      return false;
    }
    return pageRows.every((row) => selectedIds.has(row.id));
  }, [pageRows, selectedIds]);

  useEffect(() => {
    const element = tableScrollRef.current;
    if (!element) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, clientHeight } = element;
      const start = Math.floor(scrollTop / ROW_HEIGHT);
      const visibleCount = Math.ceil(clientHeight / ROW_HEIGHT) + 4;
      setVirtualRange({ start, end: start + visibleCount });
    };

    handleScroll();
    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [pageRows.length, pageSize, currentPage]);

  useEffect(() => {
    const element = tableScrollRef.current;
    if (element) {
      element.scrollTop = 0;
    }
  }, [currentPage, pageSize, intentFilter, stageFilter, debouncedSearch, columnFilters]);

  const handleSort = (key) => {
    setSortConfig((previous) => {
      if (previous.key === key) {
        return { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'volume' ? 'desc' : 'asc' };
    });
  };

  const toggleRowSelection = (rowId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const toggleAllVisibleRows = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) {
        pageRows.forEach((row) => next.delete(row.id));
      } else {
        pageRows.forEach((row) => next.add(row.id));
      }
      return next;
    });
  };

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  const commitEditing = useCallback(
    (rawValue) => {
      if (!editingCell) {
        return;
      }

      const column = COLUMN_DEFS.find((item) => item.key === editingCell.columnKey);
      if (!column) {
        cancelEditing();
        return;
      }

      updateTableRows((previous) =>
        previous.map((row) => {
          if (row.id !== editingCell.rowId) {
            return row;
          }

          const next = { ...row };
          switch (column.type) {
            case 'currency': {
              const numeric = sanitiseNumericInput(rawValue);
              next.cpc = numeric === null ? 0 : Math.max(0, numeric);
              break;
            }
            case 'number': {
              if (rawValue === '' || rawValue === null) {
                if (column.key === 'win') {
                  next.win = '';
                } else {
                  next[column.key] = 0;
                }
                break;
              }
              const parsed = parseIntegerLike(rawValue);
              if (parsed === null) {
                break;
              }
              if (column.key === 'difficulty') {
                next.difficulty = clampNumber(parsed, 0, 100);
              } else if (column.key === 'volume') {
                next.volume = clampNumber(parsed, 0);
              } else if (column.key === 'win') {
                next.win = clampNumber(parsed, 0, 100);
              } else {
                next[column.key] = clampNumber(parsed, 0);
              }
              break;
            }
            case 'intent': {
              const intentValue = normaliseEnum(rawValue, INTENT_OPTIONS, next.intent);
              next.intent = intentValue;
              next.funnelStage = inferFunnel(intentValue);
              {
                const { label, value } = resolveFunnelWeight(next.funnelStage);
                next.fw = label;
                next.fwValue = value;
              }
              break;
            }
            case 'funnel': {
              next.funnelStage = normaliseEnum(rawValue, FUNNEL_OPTIONS, next.funnelStage);
              {
                const { label, value } = resolveFunnelWeight(next.funnelStage);
                next.fw = label;
                next.fwValue = value;
              }
              break;
            }
            case 'enum': {
              const normalisedEnum = normaliseEnum(rawValue, column.options || [], next[column.key]);
              if (column.key === 'fw') {
                const { label, value } = resolveFunnelWeight(next.funnelStage, normalisedEnum);
                next.fw = label;
                next.fwValue = value;
              } else {
                next[column.key] = normalisedEnum;
              }
              break;
            }
            default: {
              if (column.key === 'primaryKeyword' || column.key === 'secondaryKeyword') {
                const nextValue = normaliseKeyword(rawValue);
                if (column.key === 'primaryKeyword' && !nextValue) {
                  return next;
                }
                next[column.key] = nextValue;
              } else {
                next[column.key] = rawValue ? rawValue.toString().trim() : '';
              }
            }
          }
          return next;
        })
      );

      cancelEditing();
    },
    [editingCell, cancelEditing, updateTableRows]
  );

  const handleCellDoubleClick = useCallback((rowId, columnKey) => {
    const column = COLUMN_DEFS.find((item) => item.key === columnKey);
    if (column?.editable === false) {
      return;
    }
    setEditingCell({ rowId, columnKey });
  }, []);

  const handleBulkDelete = () => {
    if (!selectedIds.size) {
      return;
    }
    updateTableRows((previous) => previous.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());
    setToast(`${selectedIds.size} row(s) deleted`);
  };

  const handlePageChange = (direction) => {
    setCurrentPage((previous) => {
      if (direction === 'prev') {
        return Math.max(1, previous - 1);
      }
      if (direction === 'next') {
        return Math.min(totalPages, previous + 1);
      }
      return previous;
    });
  };

  const commitRows = (incomingRows, { dedupe }) => {
    if (!incomingRows.length) {
      setToast('No new keywords detected');
      return;
    }

    updateTableRows((previous) => {
      const existingKeys = new Set(previous.map((row) => buildKeywordKey(row.primaryKeyword, row.secondaryKeyword)));
      const additions = [];

      incomingRows.forEach((rawRow) => {
        const shouldEnrich = rawRow.autoEnrich !== undefined ? rawRow.autoEnrich : true;
        const normalised = normaliseRow(rawRow, { autoEnrich: shouldEnrich });
        if (!normalised) {
          return;
        }

        const key = buildKeywordKey(normalised.primaryKeyword, normalised.secondaryKeyword);
        if (dedupe && existingKeys.has(key)) {
          return;
        }
        existingKeys.add(key);
        additions.push(normalised);
      });

      if (!additions.length) {
        setToast('No unique keywords were added');
        return previous;
      }

      setToast(`${additions.length} keyword${additions.length > 1 ? 's' : ''} added`);
      return [...previous, ...additions];
    });
  };

  const prepareRecordsForIngestion = (records, options) => {
    const { dedupe, autoEnrich } = options;
    const prepared = records
      .map((record) => {
        if (!record || record.length === 0) {
          return null;
        }

        const cells = record.map((cell) => (cell === undefined || cell === null ? '' : cell.toString().trim()));
        const [primary = '', second = '', third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, eleventh] = cells;

        const treatSecondAsMetric = isLikelyNumeric(second);

        if (treatSecondAsMetric) {
          return {
            primaryKeyword: primary,
            secondaryKeyword: '',
            volume: second,
            difficulty: third,
            cpc: fourth,
            intent: fifth,
            funnelStage: sixth,
            fw: seventh,
            ws: eighth,
            win: ninth,
            page: tenth,
            autoEnrich,
          };
        }

        return {
          primaryKeyword: primary,
          secondaryKeyword: second,
          volume: third,
          difficulty: fourth,
          cpc: fifth,
          intent: sixth,
          funnelStage: seventh,
          fw: eighth,
          ws: ninth,
          win: tenth,
          page: eleventh,
          autoEnrich,
        };
      })
      .filter((row) => row && normaliseKeyword(row.primaryKeyword));

    const deduped = [];
    const seen = new Set();
    prepared.forEach((row) => {
      const key = buildKeywordKey(row.primaryKeyword, row.secondaryKeyword);
      if (dedupe && seen.has(key)) {
        return;
      }
      seen.add(key);
      deduped.push(row);
    });

    return deduped;
  };

  const parsePastedRecords = useCallback(() => {
    if (!pasteText.trim()) {
      return [];
    }

    const { rows: records } = parseDelimitedText(pasteText, {
      autoDetect: pasteOptions.detectSeparator,
      skipHeader: pasteOptions.skipHeader,
    });

    return prepareRecordsForIngestion(records, pasteOptions);
  }, [
    pasteText,
    pasteOptions.detectSeparator,
    pasteOptions.skipHeader,
    pasteOptions.dedupe,
    pasteOptions.autoEnrich,
  ]);

  useEffect(() => {
    if (!isPastePanelOpen) {
      return;
    }

    const prepared = parsePastedRecords();
    setPastePreview(prepared.slice(0, 20));
  }, [isPastePanelOpen, parsePastedRecords]);

  const handlePastePreview = () => {
    const prepared = parsePastedRecords();
    setPastePreview(prepared.slice(0, 20));
    if (!prepared.length) {
      setToast('Nothing to preview');
    }
  };

  const handlePasteAdd = () => {
    const prepared = parsePastedRecords();
    commitRows(prepared, { dedupe: pasteOptions.dedupe });
    setPastePanelOpen(false);
    setPastePreview([]);
    setPasteText('');
  };

  const handleExportCsv = () => {
    if (!sortedRows.length) {
      setToast('No rows to export');
      return;
    }
    const csv = toCsv(sortedRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campaign-keywords.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast('Export started');
  };

  const handleDownloadTemplate = () => {
    const template = [
      'primary,secondary,volume,difficulty,cpc,intent,funnel,fw,ws,win,page',
      'seo reporting dashboard,seo report template,2400,36,12.4,Transactional,Decision,High,Yes,84,/resources/seo-reporting-dashboard',
      'content strategy framework,marketing content plan,1900,42,9.85,Informational,Awareness,Medium,Yes,63,/blog/content-strategy-framework',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keyword-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast('Template downloaded');
  };

  const handleImportFile = async (event) => {
    const { files } = event.target;
    if (!files || !files.length) {
      return;
    }

    const file = files[0];
    event.target.value = '';
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'xlsx') {
      setImportError('XLSX parsing is unavailable in this offline preview. Please upload CSV instead.');
      return;
    }

    try {
      const text = await file.text();
      const { rows: entries, headers } = parseDelimitedText(text, { autoDetect: true, skipHeader: true });
      if (!entries.length) {
        setImportError('No data found in file');
        return;
      }

      const effectiveHeaders = headers.length ? headers : SCHEMA_FIELDS.map((field) => field.label);
      const mapping = {};
      SCHEMA_FIELDS.forEach((field) => {
        const match = effectiveHeaders.find((header) => header.toLowerCase() === field.label.toLowerCase());
        if (match) {
          mapping[field.key] = match;
        }
      });

      setImportMapping({
        fileName: file.name,
        headers: effectiveHeaders,
        rows: entries,
        mapping,
      });
      setImportError('');
    } catch (error) {
      setImportError('Unable to read file');
    }
  };

  const closeImportMapping = () => {
    setImportMapping(null);
  };

  const confirmImportMapping = () => {
    if (!importMapping) {
      return;
    }

    const columnIndex = {};
    importMapping.headers.forEach((header, index) => {
      columnIndex[header] = index;
    });

    const prepared = importMapping.rows.map((row) => {
      const result = {};
      SCHEMA_FIELDS.forEach((field) => {
        const header = importMapping.mapping[field.key];
        if (header !== undefined && header !== null) {
          const index = columnIndex[header];
          result[field.key] = index !== undefined ? row[index] : '';
        } else {
          result[field.key] = '';
        }
      });
      return result;
    });

    commitRows(prepared, { dedupe: true });
    setImportMapping(null);
  };

  const handleColumnMappingChange = (fieldKey, header) => {
    setImportMapping((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        mapping: {
          ...previous.mapping,
          [fieldKey]: header || undefined,
        },
      };
    });
  };

  const renderBadge = (value, type) => {
    if (!value) {
      return '—';
    }
    if (type === 'intent') {
      return <span className={`sheet-badge ${INTENT_BADGES[value] || ''}`}>{value}</span>;
    }
    if (type === 'funnel') {
      return <span className={`sheet-badge ${FUNNEL_BADGES[value] || ''}`}>{value}</span>;
    }
    return value;
  };

  if (!open) {
    return null;
  }

  const renderEditableCell = (column, row) => {
    if (!editingCell || editingCell.rowId !== row.id || editingCell.columnKey !== column.key) {
      return null;
    }

    if (column.type === 'enum' || column.type === 'intent' || column.type === 'funnel') {
      const options =
        column.type === 'intent'
          ? INTENT_OPTIONS
          : column.type === 'funnel'
          ? FUNNEL_OPTIONS
          : column.options || [];

      return (
        <select
          ref={editingInputRef}
          className="sheet-table__input"
          value={editingValue}
          onChange={(event) => {
            const { value } = event.target;
            setEditingValue(value);
            commitEditing(value);
          }}
          onBlur={cancelEditing}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    const inputType = column.type === 'currency' || column.type === 'number' ? 'number' : 'text';
    const step = column.type === 'currency' ? '0.01' : column.type === 'number' ? '1' : undefined;

    return (
      <input
        ref={editingInputRef}
        type={inputType}
        step={step}
        className="sheet-table__input"
        value={editingValue}
        onChange={(event) => setEditingValue(event.target.value)}
        onBlur={() => commitEditing(editingValue)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitEditing(editingValue);
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditing();
          }
        }}
      />
    );
  };

  const columnFilterControl = (column) => {
    if (column.key === 'fw') {
      const options = [''].concat(
        FW_OPTIONS.map((option) => {
          const numeric = FW_VALUE_BY_LABEL[option];
          return numeric !== undefined && numeric !== null ? numeric.toFixed(1) : '';
        }).filter(Boolean)
      );
      return (
        <select
          value={columnFilters[column.key]}
          onChange={(event) =>
            setColumnFilters((previous) => ({
              ...previous,
              [column.key]: event.target.value,
            }))
          }
        >
          {options.map((option) => (
            <option key={option || 'all'} value={option}>
              {option || 'All'}
            </option>
          ))}
        </select>
      );
    }
    if (column.type === 'intent' || column.type === 'funnel' || column.type === 'enum') {
      const options =
        column.type === 'intent'
          ? [''].concat(INTENT_OPTIONS)
          : column.type === 'funnel'
          ? [''].concat(FUNNEL_OPTIONS)
          : [''].concat(column.options || []);
      return (
        <select
          value={columnFilters[column.key]}
          onChange={(event) =>
            setColumnFilters((previous) => ({
              ...previous,
              [column.key]: event.target.value,
            }))
          }
        >
          {options.map((option) => (
            <option key={option || 'all'} value={option}>
              {option || 'All'}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={columnFilters[column.key]}
        onChange={(event) =>
          setColumnFilters((previous) => ({
            ...previous,
            [column.key]: event.target.value,
          }))
        }
        placeholder="Filter"
      />
    );
  };

  return (
    <div className="sheet-modal" role="dialog" aria-modal="true" aria-labelledby="sheet-modal-title">
      <button type="button" className="sheet-modal__backdrop" onClick={onClose} aria-label="Close keyword sheet overlay" />
      <div className="sheet-modal__container" role="document">
        <header className="sheet-modal__topbar">
          <div className="sheet-modal__headline">
            <div className="sheet-modal__title-block">
              <p className="sheet-modal__eyebrow">Keyword performance</p>
              <h2 id="sheet-modal-title">Campaign sheet</h2>
            </div>
            <button type="button" className="sheet-modal__close" onClick={onClose} aria-label="Close keyword sheet">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="sheet-toolbar" role="region" aria-label="Keyword filters and actions">
            <div className="sheet-toolbar__group">
              <div className="sheet-field">
                <label htmlFor="sheet-intent-filter">Intent</label>
                <select
                  id="sheet-intent-filter"
                  value={intentFilter}
                  onChange={(event) => setIntentFilter(event.target.value)}
                >
                  {uniqueIntents.map((intentOption) => (
                    <option key={intentOption} value={intentOption}>
                      {intentOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sheet-field">
                <label htmlFor="sheet-stage-filter">Funnel Stage</label>
                <select
                  id="sheet-stage-filter"
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                >
                  {uniqueStages.map((stageOption) => (
                    <option key={stageOption} value={stageOption}>
                      {stageOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sheet-field sheet-field--search">
                <label htmlFor="sheet-search">Search</label>
                <input
                  id="sheet-search"
                  type="search"
                  placeholder="Search keywords or metrics"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              {selectedIds.size > 0 && (
                <button type="button" className="button button--danger" onClick={handleBulkDelete}>
                  Delete selected
                </button>
              )}
            </div>

            <div className="sheet-toolbar__actions">
              <button type="button" className="button button--primary" onClick={() => setPastePanelOpen(true)}>
                Paste keywords
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Import file
              </button>
              <button type="button" className="button button--link" onClick={handleDownloadTemplate}>
                Download template
              </button>
              <button type="button" className="button button--ghost" onClick={handleExportCsv}>
                Export CSV
              </button>
            </div>
          </div>

        </header>

        <div className="sheet-modal__main">

          <div className="sheet-table-wrapper">
            <div className="sheet-table-scroll" ref={tableScrollRef}>
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th className="sheet-table__select-header">
                      <input
                        type="checkbox"
                        aria-label="Select all visible rows"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisibleRows}
                      />
                    </th>
                    {COLUMN_DEFS.map((column) => {
                      const isSorted = sortConfig.key === column.key;
                      const ariaSort = isSorted
                        ? sortConfig.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none';
                      return (
                        <th key={column.key} aria-sort={ariaSort}>
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
                  <tr className="sheet-table__filters">
                    <th className="sheet-table__select-header" aria-hidden="true" />
                    {COLUMN_DEFS.map((column) => (
                      <th key={`${column.key}-filter`}>{columnFilterControl(column)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMN_DEFS.length + 1} className="sheet-table__cell sheet-table__cell--empty">
                        <p>No keywords match the current filters.</p>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => setPastePanelOpen(true)}
                        >
                          Paste keywords
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {visibleRows.paddingTop > 0 && (
                        <tr className="sheet-table__spacer" style={{ height: `${visibleRows.paddingTop}px` }} aria-hidden="true">
                          <td colSpan={COLUMN_DEFS.length + 1} />
                        </tr>
                      )}
                      {visibleRows.items.map((row) => (
                        <tr key={row.id} className={selectedIds.has(row.id) ? 'sheet-table__row--selected' : ''}>
                          <td className="sheet-table__cell sheet-table__cell--checkbox">
                            <input
                              type="checkbox"
                              aria-label={`Select ${row.primaryKeyword}`}
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleRowSelection(row.id)}
                            />
                          </td>
                          {COLUMN_DEFS.map((column) => {
                            const isEditing =
                              editingCell &&
                              editingCell.rowId === row.id &&
                              editingCell.columnKey === column.key;
                            const displayContent =
                              column.type === 'intent' || column.type === 'funnel'
                                ? renderBadge(row[column.key], column.type)
                                : formatCellValue(column, row);

                            const cellClasses = ['sheet-table__cell'];
                            if (isEditing) {
                              cellClasses.push('sheet-table__cell--editing');
                            }
                            if (column.type === 'number' || column.type === 'currency') {
                              cellClasses.push('sheet-table__cell--numeric');
                            }

                            return (
                              <td
                                key={`${row.id}-${column.key}`}
                                className={cellClasses.join(' ')}
                                onDoubleClick={() => handleCellDoubleClick(row.id, column.key)}
                              >
                                <div className="sheet-table__cell-content">{displayContent}</div>
                                {isEditing && (
                                  <div className="sheet-table__cell-editor">{renderEditableCell(column, row)}</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {visibleRows.paddingBottom > 0 && (
                        <tr className="sheet-table__spacer" style={{ height: `${visibleRows.paddingBottom}px` }} aria-hidden="true">
                          <td colSpan={COLUMN_DEFS.length + 1} />
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="sheet-modal__footer">
            <div className="sheet-modal__footer-left">
              <strong>{selectedIds.size}</strong> selected
            </div>
            <div className="sheet-modal__footer-center">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => handlePageChange('prev')}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="sheet-modal__pagination-label">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => handlePageChange('next')}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <div className="sheet-modal__page-size">
                <label htmlFor="sheet-page-size">Rows</label>
                <select
                  id="sheet-page-size"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sheet-modal__footer-right">
              <button type="button" className="button button--secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </footer>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={handleImportFile}
        />

        {toastMessage && <div className="sheet-toast" role="status">{toastMessage}</div>}

        {isPastePanelOpen && (
          <aside className="sheet-side-panel" aria-label="Paste keywords">
            <div className="sheet-side-panel__header">
              <h3>Paste keywords</h3>
              <button type="button" onClick={() => setPastePanelOpen(false)} aria-label="Close paste panel">
                &times;
              </button>
            </div>
            <div className="sheet-side-panel__body">
              <label className="sheet-side-panel__label" htmlFor="sheet-paste-textarea">
                Paste one keyword per line, or two columns separated by comma/tab: primary&lt;TAB&gt;secondary.
              </label>
              <textarea
                id="sheet-paste-textarea"
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="Paste one keyword per line, or two columns separated by comma/tab: primary&lt;TAB&gt;secondary."
              />

              <div className="sheet-side-panel__options">
                <label>
                  <input
                    type="checkbox"
                    checked={pasteOptions.detectSeparator}
                    onChange={(event) =>
                      setPasteOptions((previous) => ({
                        ...previous,
                        detectSeparator: event.target.checked,
                      }))
                    }
                  />
                  Detect separator automatically (tab, comma, semicolon, pipe)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={pasteOptions.skipHeader}
                    onChange={(event) =>
                      setPasteOptions((previous) => ({
                        ...previous,
                        skipHeader: event.target.checked,
                      }))
                    }
                  />
                  First line contains headers (skip when true)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={pasteOptions.dedupe}
                    onChange={(event) =>
                      setPasteOptions((previous) => ({
                        ...previous,
                        dedupe: event.target.checked,
                      }))
                    }
                  />
                  Deduplicate keywords (primary+secondary pairs)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={pasteOptions.autoEnrich}
                    onChange={(event) =>
                      setPasteOptions((previous) => ({
                        ...previous,
                        autoEnrich: event.target.checked,
                      }))
                    }
                  />
                  Auto-enrich metrics (if disabled, set 0 or empty)
                </label>
              </div>

              <div className="sheet-side-panel__actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    setPasteText('');
                    setPastePreview([]);
                  }}
                >
                  Clear
                </button>
                <div className="sheet-side-panel__primary-actions">
                  <button type="button" className="button button--secondary" onClick={handlePastePreview}>
                    Preview
                  </button>
                  <button type="button" className="button button--primary" onClick={handlePasteAdd}>
                    Add to table
                  </button>
                </div>
              </div>

              {pastePreview.length > 0 && (
                <div className="sheet-side-panel__preview">
                  <h4>Preview ({pastePreview.length} row{pastePreview.length > 1 ? 's' : ''})</h4>
                  <ul>
                    {pastePreview.map((row, index) => (
                      <li key={`${row.primaryKeyword}-${row.secondaryKeyword}-${index}`}>
                        <strong>{row.primaryKeyword}</strong>
                        {row.secondaryKeyword ? ` · ${row.secondaryKeyword}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}

        {importMapping && (
          <div className="sheet-import" role="dialog" aria-modal="true">
            <div className="sheet-import__content">
              <div className="sheet-import__header">
                <h3>Map columns</h3>
                <p>{importMapping.fileName}</p>
              </div>
              <div className="sheet-import__grid">
                {SCHEMA_FIELDS.map((field) => (
                  <div key={field.key} className="sheet-import__row">
                    <div>
                      <strong>{field.label}</strong>
                      {field.required && <span className="sheet-import__required">Required</span>}
                    </div>
                    <select
                      value={importMapping.mapping[field.key] || ''}
                      onChange={(event) => handleColumnMappingChange(field.key, event.target.value)}
                    >
                      <option value="">Use default</option>
                      {importMapping.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {missingRequiredImportFields.length > 0 && (
                <p className="sheet-import__warning">
                  Missing required fields:{' '}
                  {missingRequiredImportFields.map((field) => field.label).join(', ')}. Defaults will be applied.
                </p>
              )}
              <div className="sheet-import__actions">
                <button type="button" className="button button--ghost" onClick={closeImportMapping}>
                  Cancel
                </button>
                <button type="button" className="button button--primary" onClick={confirmImportMapping}>
                  Add {importMapping.rows.length} rows
                </button>
              </div>
            </div>
          </div>
        )}

        {importError && <div className="sheet-inline-error">{importError}</div>}
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
      secondaryKeyword: PropTypes.string,
      volume: PropTypes.number,
      difficulty: PropTypes.number,
      cpc: PropTypes.number,
      intent: PropTypes.string,
      funnelStage: PropTypes.string,
      fw: PropTypes.string,
      fwValue: PropTypes.number,
      ws: PropTypes.number,
      win: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      page: PropTypes.string,
    })
  ).isRequired,
};

export default SheetModal;
