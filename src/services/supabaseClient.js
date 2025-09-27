const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClientPromise = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const loadSupabaseClient = async () => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase n'est pas configuré. Vérifiez les variables d'environnement.");
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = import(/* @vite-ignore */ '@supabase/supabase-js')
      .then((module) => {
        if (!module || typeof module.createClient !== 'function') {
          throw new Error('Module Supabase indisponible.');
        }
        return module.createClient(supabaseUrl, supabaseAnonKey);
      })
      .catch((error) => {
        supabaseClientPromise = null;
        throw new Error(error?.message || 'Impossible de charger le client Supabase.');
      });
  }

  return supabaseClientPromise;
};

export const getSupabaseClient = () => loadSupabaseClient();

export default loadSupabaseClient;
