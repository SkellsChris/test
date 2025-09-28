// src/services/keywords.js
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const normaliseKeyword = (value) => {
  if (value === undefined || value === null) return '';
  return value.toString().trim().replace(/\s+/g, ' ');
};

const toStoragePayload = (projectId, keyword) => {
  const keywordLabel = normaliseKeyword(keyword);
  if (!keywordLabel) return null;
  return {
    project_id: projectId,
    keyword: keywordLabel,
    keyword_normalized: keywordLabel.toLowerCase(),
  };
};

export const saveKeywords = async ({ projectId, keywords }) => {
  if (!projectId) throw new Error('projectId is required to save keywords.');
  if (!Array.isArray(keywords) || keywords.length === 0) return [];

  // ⚠️ appeler la fonction
  if (!isSupabaseConfigured()) return [];

  const supabase = await getSupabaseClient();

  const seen = new Set();
  const payload = [];

  keywords.forEach((entry) => {
    const keywordSource =
      typeof entry === 'string' ? entry : entry?.primaryKeyword || entry?.keyword || '';
    const prepared = toStoragePayload(projectId, keywordSource);
    if (!prepared) return;
    if (seen.has(prepared.keyword_normalized)) return;
    seen.add(prepared.keyword_normalized);
    payload.push(prepared);
  });

  if (payload.length === 0) return [];

  // ✅ méthode recommandée si vous avez UNIQUE(project_id, keyword_normalized)
  const { data, error } = await supabase
    .from('keywords')
    .insert(payload, { ignoreDuplicates: true })
    .select(); // récupère ce qui a été inséré

  // // Variante avec UPSERT (retirer ignoreDuplicates)
  // const { data, error } = await supabase
  //   .from('keywords')
  //   .upsert(payload, { onConflict: 'project_id,keyword_normalized' })
  //   .select();

  if (error) throw new Error(error.message || 'Impossible de sauvegarder les mots-clés.');

  return data ?? [];
};

export default saveKeywords;
