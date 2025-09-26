const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const API_KEY =
  (typeof __OPEN_API_KEY__ !== 'undefined' && __OPEN_API_KEY__) ||
  env.OPEN_API_KEY ||
  env.VITE_OPEN_API_KEY ||
  '';

const API_URL =
  (typeof __OPEN_API_URL__ !== 'undefined' && __OPEN_API_URL__) ||
  env.OPEN_API_URL ||
  'https://api.openai.com/v1/chat/completions';

const API_MODEL =
  (typeof __OPEN_API_MODEL__ !== 'undefined' && __OPEN_API_MODEL__) ||
  env.OPEN_API_MODEL ||
  'gpt-4o-mini';

const INTENT_VALUES = ['Commercial', 'Transactional', 'Informational', 'Navigational'];
const FUNNEL_VALUES = ['Awareness', 'Consideration', 'Decision'];
const BATCH_SIZE = 20;

const sanitiseKeyword = (value) => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toString().trim();
};

const normaliseLabel = (value, allowed) => {
  if (!value) {
    return null;
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }
  const match = allowed.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return match || null;
};

const parseClassificationContent = (content) => {
  if (!content) {
    return [];
  }

  const trimmed = content.trim();

  const attemptParse = (payload) => {
    if (!payload) {
      return null;
    }
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items;
      }
    } catch (error) {
      return null;
    }
    return null;
  };

  const direct = attemptParse(trimmed);
  if (direct) {
    return direct;
  }

  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    const parsed = attemptParse(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return [];
};

const buildUserPrompt = (items) => {
  const keywords = items.map((item) => ({
    index: item.index,
    primary: item.primary,
    secondary: item.secondary,
  }));

  return [
    'Classify each keyword entry by determining both the search intent and funnel stage.',
    'Use only the following options for intent: Commercial, Transactional, Informational, Navigational.',
    'Use only the following options for funnel stage: Awareness, Consideration, Decision.',
    'Return a JSON array where every object contains the properties: index, intent, funnelStage.',
    'Each index must match the index provided in the payload.',
    'Payload:',
    JSON.stringify({ keywords }, null, 2),
  ].join('\n\n');
};

const requestChunkClassification = async (items, { signal } = {}) => {
  const meaningfulItems = items.filter((item) => item.primary);
  if (!meaningfulItems.length) {
    return new Map();
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: API_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a marketing analyst who classifies keywords into precise marketing intent and funnel stages.',
        },
        {
          role: 'user',
          content: buildUserPrompt(meaningfulItems),
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Intent classification request failed');
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = parseClassificationContent(content);
  const result = new Map();

  parsed.forEach((entry) => {
    const index = Number.parseInt(entry?.index, 10);
    if (!Number.isFinite(index)) {
      return;
    }
    const intent = normaliseLabel(entry?.intent, INTENT_VALUES);
    const funnelStage = normaliseLabel(entry?.funnelStage, FUNNEL_VALUES);
    if (!intent && !funnelStage) {
      return;
    }
    result.set(index, { intent, funnelStage });
  });

  return result;
};

export const hasIntentClassificationCredentials = Boolean(API_KEY);

export const classifyKeywordIntents = async (rows, options = {}) => {
  if (!hasIntentClassificationCredentials || !Array.isArray(rows) || !rows.length) {
    return rows.map((row) => ({ ...row }));
  }

  const aggregated = new Map();
  const signal = options.signal;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const chunk = rows.slice(start, start + BATCH_SIZE);
    const items = chunk.map((row, index) => ({
      index: start + index + 1,
      primary: sanitiseKeyword(row.primaryKeyword),
      secondary: sanitiseKeyword(row.secondaryKeyword),
    }));

    // eslint-disable-next-line no-await-in-loop
    const classifications = await requestChunkClassification(items, { signal });
    classifications.forEach((value, key) => {
      aggregated.set(key, value);
    });
  }

  return rows.map((row, index) => {
    const classification = aggregated.get(index + 1);
    if (!classification) {
      return { ...row };
    }

    return {
      ...row,
      intent: classification.intent || row.intent,
      funnelStage: classification.funnelStage || row.funnelStage,
    };
  });
};
