import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import type { Profile } from '../types';

interface AuthValue { user: User | null; session: Session | null; profile: Profile | null; loading: boolean; refreshProfile: () => Promise<void>; }
const AuthContext = createContext<AuthValue>({ user: null, session: null, profile: null, loading: true, refreshProfile: async () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (activeSession = session) => {
    if (!activeSession) { setProfile(null); return; }
    const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${activeSession.access_token}` } });
    if (response.ok) setProfile(await response.json());
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data?.session ?? null);
      if (data?.session) await loadProfile(data.session);
    }).catch((err) => {
      console.warn('Auth getSession error:', err);
    }).finally(() => {
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next) await loadProfile(next); else setProfile(null);
      setLoading(false);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const value = useMemo(() => ({ user: session?.user ?? null, session, profile, loading, refreshProfile: () => loadProfile(session) }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
