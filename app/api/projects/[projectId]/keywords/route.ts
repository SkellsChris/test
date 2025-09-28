import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '../../../../../supabaseServer';

type RouteParams = {
  params: {
    projectId?: string;
  };
};

type KeywordPayload = {
  project_id: string;
  keyword: string;
  keyword_normalized: string;
};

type NormalizedKeyword = Omit<KeywordPayload, 'project_id'>;

const normalizeKeyword = (value: unknown): NormalizedKeyword | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const keyword = value
    .toString()
    .trim()
    .replace(/\s+/g, ' ');

  if (!keyword) {
    return null;
  }

  return {
    keyword,
    keyword_normalized: keyword.toLowerCase(),
  };
};

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json({ ok: false, error: 'Missing projectId in route parameters.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const keywordsInput = (body as { keywords?: unknown }).keywords;
  if (keywordsInput != null && !Array.isArray(keywordsInput)) {
    return NextResponse.json({ ok: false, error: 'The "keywords" field must be an array.' }, { status: 400 });
  }

  const rawKeywords = Array.isArray(keywordsInput) ? keywordsInput : [];

  const supabase = getSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json(
      { ok: false, error: projectError.message || 'Unable to verify project existence.' },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const seen = new Set<string>();
  const rows: KeywordPayload[] = [];

  for (const entry of rawKeywords) {
    const normalized = normalizeKeyword(entry);
    if (!normalized) continue;

    if (seen.has(normalized.keyword_normalized)) continue;
    seen.add(normalized.keyword_normalized);

    rows.push({
      project_id: projectId,
      ...normalized,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const { data, error } = await supabase
    .from('keywords')
    .insert(rows, { ignoreDuplicates: true })
    .select('id');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Unable to insert keywords.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
};
