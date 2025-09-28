const FW_VALUE_BY_LABEL = {
  Low: 1.0,
  Medium: 1.5,
  High: 2.0,
};

const QUICK_WIN_RULES = {
  minWs: 20,
  maxDifficulty: 20,
  minFw: 1.5,
  allowedIntents: new Set(['Commercial', 'Transactional']),
};

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolveFwNumericValue = (label, explicitValue) => {
  const explicitNumeric = toFiniteNumber(explicitValue);
  if (explicitNumeric !== null) {
    return explicitNumeric;
  }

  if (label && Object.prototype.hasOwnProperty.call(FW_VALUE_BY_LABEL, label)) {
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

const meetsQuickWinCriteria = (row) => {
  if (!row) {
    return false;
  }

  const ws = Number(row.ws ?? 0);
  const difficulty = Number(row.difficulty ?? 0);
  const fwNumeric = Number(getFwNumericValue(row) ?? 0);
  const intent = row.intent || '';

  return (
    ws > QUICK_WIN_RULES.minWs &&
    difficulty <= QUICK_WIN_RULES.maxDifficulty &&
    fwNumeric >= QUICK_WIN_RULES.minFw &&
    QUICK_WIN_RULES.allowedIntents.has(intent)
  );
};

const resolveWinDisplayValue = (row, { includePercentSymbol = true } = {}) => {
  if (!row) {
    return { text: '', quickWin: false, numeric: null };
  }

  const isQuickWin = row.quickWin ?? meetsQuickWinCriteria(row);
  if (isQuickWin) {
    return { text: 'Quick win', quickWin: true, numeric: null };
  }

  const rawValue = row.win;
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return { text: '', quickWin: false, numeric: null };
  }

  const numericValue =
    typeof rawValue === 'number' && Number.isFinite(rawValue)
      ? rawValue
      : (() => {
          const parsed = Number.parseFloat(rawValue);
          return Number.isFinite(parsed) ? parsed : null;
        })();

  const baseText = numericValue !== null ? numericValue.toString() : rawValue.toString();
  const text = includePercentSymbol ? `${baseText}%` : baseText;

  return { text, quickWin: false, numeric: numericValue };
};

const getWinSortValue = (row) => {
  if (!row) {
    return Number.NEGATIVE_INFINITY;
  }

  const isQuickWin = row.quickWin ?? meetsQuickWinCriteria(row);
  if (isQuickWin) {
    return Number.POSITIVE_INFINITY;
  }

  const rawValue = row.win;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

export {
  FW_VALUE_BY_LABEL,
  QUICK_WIN_RULES,
  resolveFwNumericValue,
  getFwNumericValue,
  meetsQuickWinCriteria,
  resolveWinDisplayValue,
  getWinSortValue,
};
