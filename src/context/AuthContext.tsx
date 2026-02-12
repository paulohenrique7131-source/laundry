'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const USER_MAP: Record<string, string> = {
    manager: 'manager@lavanderia.local',
    gov: 'gov@lavanderia.local',
};

interface AuthCtx {
    user: User | null;
    userId: string | null;
    role: string | null;
    loading: boolean;
    signIn: (userId: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
    user: null,
    userId: null,
    role: null,
    loading: true,
    signIn: async () => null,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const roleCache = useRef<Record<string, string>>({});

    const fetchRole = useCallback(async (uid: string) => {
        // Cache: only fetch role once per user ID
        if (roleCache.current[uid]) {
            setRole(roleCache.current[uid]);
            return;
        }
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', uid)
            .single();
        const r = data?.role ?? null;
        if (r) roleCache.current[uid] = r;
        setRole(r);
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setUserId(currentUser?.id ?? null);
            if (currentUser) {
                await fetchRole(currentUser.id);
            }
            if (mounted) setLoading(false);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;
                const currentUser = session?.user ?? null;

                // Only update state on meaningful events (not token refresh)
                if (event === 'TOKEN_REFRESHED') {
                    // Token refreshed silently — no UI update needed
                    return;
                }

                setUser(currentUser);
                setUserId(currentUser?.id ?? null);

                if (event === 'SIGNED_IN' && currentUser) {
                    await fetchRole(currentUser.id);
                } else if (event === 'SIGNED_OUT') {
                    setRole(null);
                    roleCache.current = {};
                }

                if (mounted) setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole]);

    const signIn = useCallback(async (uid: string, password: string): Promise<string | null> => {
        const email = USER_MAP[uid.toLowerCase()];
        if (!email) {
            return 'Usuário não encontrado. Use "manager" ou "gov".';
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return 'Credenciais incorretas. Verifique seu ID e senha.';
        }
        return null;
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserId(null);
        setRole(null);
        roleCache.current = {};
    }, []);

    return (
        <AuthContext.Provider value={{ user, userId, role, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
