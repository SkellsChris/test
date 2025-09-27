import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    const initialise = async () => {
      if (!isSupabaseConfigured) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = await getSupabaseClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (isMounted) {
          if (!error) {
            setUser(session?.user ?? null);
          } else {
            setUser(null);
          }
          setLoading(false);
        }

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!isMounted) {
            return;
          }
          setUser(nextSession?.user ?? null);
          setLoading(false);
        });

        authSubscription = data?.subscription ?? null;
      } catch (_error) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initialise();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré.");
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message || 'Identifiants invalides.');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      return;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || 'Impossible de se déconnecter.');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
    }),
    [loading, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }
  return context;
};

export default AuthContext;
