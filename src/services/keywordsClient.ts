import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must be defined to use the Supabase client.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined to use the Supabase client.');
}

let browserClient: SupabaseClient | null = null;

const getBrowserClient = (): SupabaseClient => {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
};

export type KeywordRecord = {
  id: string;
  keyword: string;
  created_at: string;
};

export const saveKeywordsViaAPI = async (projectId: string, keywords: unknown[]): Promise<number> => {
  if (!projectId) {
    throw new Error('projectId is required to save keywords.');
  }

  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/keywords`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keywords }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok: boolean; error?: string; inserted?: number }
    | null;

  if (!response.ok || !payload?.ok) {
    const errorMessage = payload?.error || 'Unable to save keywords via API.';
    throw new Error(errorMessage);
  }

  return payload.inserted ?? 0;
};

export const fetchKeywords = async (projectId: string): Promise<KeywordRecord[]> => {
  if (!projectId) {
    throw new Error('projectId is required to fetch keywords.');
  }

  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('keywords')
    .select('id, keyword, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to fetch keywords.');
  }

  return data ?? [];
};
