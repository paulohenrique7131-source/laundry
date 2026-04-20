'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { resolveAuthEmail } from '@laundry/domain';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  userId: string | null;
  role: string | null;
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  userId: null,
  role: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => undefined,
  updatePassword: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const roleCache = useRef<Record<string, string>>({});

  const fetchRole = useCallback(async (uid: string) => {
    if (roleCache.current[uid]) {
      setRole(roleCache.current[uid]);
      return;
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', uid).single();
    const nextRole = data?.role ?? null;
    if (nextRole) {
      roleCache.current[uid] = nextRole;
    }
    setRole(nextRole);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setUserId(data.session?.user?.id ?? null);
      if (data.session?.user?.id) {
        await fetchRole(data.session.user.id);
      }
      if (mounted) setLoading(false);
    };

    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      if (event === 'TOKEN_REFRESHED') return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setUserId(nextSession?.user?.id ?? null);
      if (event === 'SIGNED_OUT') {
        roleCache.current = {};
        setRole(null);
      } else if (nextSession?.user?.id) {
        await fetchRole(nextSession.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signIn = useCallback(async (userIdInput: string, password: string) => {
    const email = resolveAuthEmail(userIdInput);
    if (!email) {
      return 'Usuário não encontrado. Use manager ou gov.';
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return `Credenciais incorretas (${error.message})`;
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserId(null);
    setRole(null);
    roleCache.current = {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    userId,
    role,
    loading,
    signIn,
    signOut,
    updatePassword,
  }), [loading, role, session, signIn, signOut, updatePassword, user, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
