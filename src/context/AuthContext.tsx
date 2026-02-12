'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const USER_MAP: Record<string, string> = {
    manager: 'manager@lavanderia.local',
    gov: 'gov@lavanderia.local',
};

interface AuthCtx {
    user: User | null;
    role: string | null;
    loading: boolean;
    signIn: (userId: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
    user: null,
    role: null,
    loading: true,
    signIn: async () => null,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRole = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', uid)
            .single();
        setRole(data?.role ?? null);
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                await fetchRole(currentUser.id);
            }
            setLoading(false);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    await fetchRole(currentUser.id);
                } else {
                    setRole(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [fetchRole]);

    const signIn = useCallback(async (userId: string, password: string): Promise<string | null> => {
        const email = USER_MAP[userId.toLowerCase()];
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
        setRole(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
