// src/services/keywords.js
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const normaliseKeyword = (v) => (v == null ? '' : v.toString().trim().replace(/\s+/g, ' '));

const toStoragePayload = (projectId, keyword) => {
  const label = normaliseKeyword(keyword);
  if (!label) return null;
  return {
    project_id: projectId,
    keyword: label,
    keyword_normalized: label.toLowerCase(),
  };
};

/**
 * Insert des mots-clés pour un projet en évitant les doublons
 * (nécessite l'index UNIQUE (project_id, keyword_normalized) côté DB).
 */
export const saveKeywords = async ({ projectId, keywords }) => {
  if (!projectId) throw new Error('projectId is required to save keywords.');
  if (!Array.isArray(keywords) || keywords.length === 0) return [];
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabaseClient();

  const seen = new Set();
  const payload = [];

  for (const entry of keywords) {
    const src =
      typeof entry === 'string' ? entry : entry?.primaryKeyword || entry?.keyword || '';
    const row = toStoragePayload(projectId, src);
    if (!row) continue;
    if (seen.has(row.keyword_normalized)) continue;
    seen.add(row.keyword_normalized);
    payload.push(row);
  }

  if (payload.length === 0) return [];

  const { data, error } = await supabase
    .from('keywords')
    .insert(payload, { ignoreDuplicates: true }) // utilise l'index UNIQUE
    .select();

  if (error) throw new Error(error.message || 'Impossible de sauvegarder les mots-clés.');
  return data ?? [];
};

/**
 * Lecture des mots-clés d’un projet (à appeler au montage / après insert).
 */
export const getKeywords = async (projectId) => {
  if (!projectId || !isSupabaseConfigured) return [];
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('keywords')
    .select('id, keyword, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Lecture des mots-clés impossible.');
  return data ?? [];
};

/**
 * Suppression d’un mot-clé par id.
 */
export const removeKeyword = async (id) => {
  if (!id || !isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('keywords').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Suppression du mot-clé impossible.');
};

export default saveKeywords;
