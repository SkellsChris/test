// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ⚠️ Vite lit uniquement les variables préfixées VITE_ via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClientPromise = null;

const loadSupabaseClient = async () => {
  if (!isSupabaseConfigured) {
    // Message explicite pour t'aider à diagnostiquer côté UI
    throw new Error(
      "Supabase n'est pas configuré. " +
      `Présence des clés → VITE_SUPABASE_URL: ${!!supabaseUrl}, VITE_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}.`
    );
  }

  if (!supabaseClientPromise) {
    // Crée le client une seule fois et renvoie toujours la même promesse
    supabaseClientPromise = Promise.resolve(
      createClient(supabaseUrl, supabaseAnonKey)
    ).catch((error) => {
      supabaseClientPromise = null;
      throw new Error(error?.message || 'Impossible de charger le client Supabase.');
    });
  }

  return supabaseClientPromise;
};

export const getSupabaseClient = () => loadSupabaseClient();

export default loadSupabaseClient;
