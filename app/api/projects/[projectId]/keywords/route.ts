// app/api/projects/[projectId]/keywords/route.ts
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '../../../../../supabaseServer';

type RouteParams = { params: { projectId?: string } };

type KeywordRow = {
  project_id: string;
  keyword: string;
  keyword_normalized: string;
};

const extractLabel = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value.toString();
  }
  if (value && typeof value === 'object') {
    const v = (value as any);
    return (v.primaryKeyword ?? v.keyword ?? '').toString();
  }
  return '';
};

const normalizeLabel = (raw: string): string =>
  raw.trim().replace(/\s+/g, ' ');

const toRow = (projectId: string, anyValue: unknown): KeywordRow | null => {
  const label = normalizeLabel(extractLabel(anyValue));
  if (!label) return null;
  return {
    project_id: projectId,
    keyword: label,
    keyword_normalized: label.toLowerCase(),
  };
};

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const projectId = params.projectId;
  if (!projectId) {
    return NextResponse.json(
      { ok: false, error: 'Missing projectId in route parameters.' },
      { status: 400 }
    );
  }

  // -------- Parse body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const input = body?.keywords;
  if (input != null && !Array.isArray(input)) {
    return NextResponse.json(
      { ok: false, error: 'The "keywords" field must be an array.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // -------- Vérifie que le projet existe
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

  // -------- Prépare les lignes
  const seen = new Set<string>();
  const rows: KeywordRow[] = [];

  for (const entry of (Array.isArray(input) ? input : [])) {
    const row = toRow(projectId, entry);
    if (!row) continue;
    if (seen.has(row.keyword_normalized)) continue;
    seen.add(row.keyword_normalized);
    rows.push(row);
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // -------- Insert (service_role) + ignore doublons
  const { data, error } = await supabase
    .from('keywords')
    .insert(rows, { ignoreDuplicates: true })
    .select('id');

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Unable to insert keywords.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
};
