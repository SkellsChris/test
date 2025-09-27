// src/services/projects.js
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// Colonnes attendues côté UI (on sélectionne * puis on normalise)
const PROJECT_FIELDS = ['id', 'name', 'description', 'created_at'];

function normalizeProjects(rows = []) {
  return rows.map((r) => {
    const out = {};
    for (const k of PROJECT_FIELDS) out[k] = r?.[k] ?? null;
    return out;
  });
}

export const fetchProjects = async () => {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabaseClient();

  // 1) tentative avec tri
  let { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  // 2) fallback sans tri si la colonne n'existe pas
  if (error) {
    // Ex : `column projects.created_at does not exist`
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('does not exist') && msg.includes('created_at')) {
      const res = await supabase.from('projects').select('*');
      data = res.data;
      error = res.error;
    }
  }

  if (error) {
    throw new Error(error.message || 'Impossible de récupérer les projets.');
  }

  return normalizeProjects(data);
};

export const createProject = async ({ name, description, owner = null }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase n'est pas configuré. Impossible de créer le projet.");
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Le nom du projet est requis.');
  }

  const supabase = await getSupabaseClient();

  // Payload de base
  const basePayload = {
    name: name.trim(),
  };

  if (!owner) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      owner = userData?.user?.id || null;
    } catch {
      owner = null;
    }
  }

  if (owner) basePayload.owner = owner;
  if (description && String(description).trim().length > 0) {
    basePayload.description = String(description).trim();
  }

  // Première tentative : avec le payload complet
  let { data, error } = await supabase
    .from('projects')
    .insert(basePayload)
    .select('*')
    .single();

  // Si la colonne description n’existe pas, on retente sans
  if (error) {
    const msg = (error.message || '').toLowerCase();

    if (msg.includes('violates row-level security') || msg.includes('row-level security')) {
      throw new Error(
        "La sécurité RLS bloque l'insertion. Connecte-toi (Supabase Auth) ou ajuste les policies sur la table `projects` " +
        "(ex. autoriser l'insert de l'utilisateur connecté, ou temporairement autoriser tous les inserts pour tester)."
      );
    }

    if (msg.includes('does not exist') && msg.includes('description')) {
      const minimalPayload = { ...basePayload };
      delete minimalPayload.description;

      const retry = await supabase.from('projects').insert(minimalPayload).select('*').single();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    throw new Error(error.message || 'Impossible de créer le projet.');
  }

  // Normalise la sortie (garantit les champs attendus côté UI)
  return {
    id: data.id ?? null,
    name: data.name ?? null,
    description: data.description ?? null,
    created_at: data.created_at ?? null,
  };
};
