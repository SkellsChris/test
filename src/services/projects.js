import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const PROJECT_COLUMNS = 'id, name, description, created_at';

export const fetchProjects = async () => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from('projects').select(PROJECT_COLUMNS).order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(error.message || 'Impossible de récupérer les projets.');
  }

  return data ?? [];
};

export const createProject = async ({ name, description }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase n'est pas configuré. Impossible de créer le projet.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description })
    .select(PROJECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message || 'Impossible de créer le projet.');
  }

  return data;
};
