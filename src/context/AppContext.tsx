'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getSettings, setSettings } from '@/storage/db';
import { useAuth } from '@/context/AuthContext';
import type { AppSettings } from '@/types';

interface AppCtx {
    ready: boolean;
    settings: AppSettings;
    updateSettings: (partial: Partial<AppSettings>) => void;
    saveSettings: () => Promise<void>;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const defaults: AppSettings = {
    theme: 'dark',
    lastCatalog: 'services',
    lastServiceType: 'Normal',
    blurIntensity: 16,
    cardOpacity: 0.15,
    showAbout: true,
    modalOpacityMiddle: 0.9,
    modalOpacityAverage: 0.6,
    modalOpacityEdges: 0.2,
    customCatalogs: [],
};

const AppContext = createContext<AppCtx>({
    ready: false,
    settings: defaults,
    updateSettings: () => { },
    saveSettings: async () => { },
    theme: 'dark',
    toggleTheme: () => { },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { userId, loading: authLoading } = useAuth();
    const [ready, setReady] = useState(false);
    const [settings, setSettingsState] = useState<AppSettings>(defaults);
    const loadedForUser = useRef<string | null>(null);

    // Load settings ONCE per user ID (stable string, not object reference)
    useEffect(() => {
        if (authLoading) return;

        if (!userId) {
            setSettingsState(defaults);
            setReady(true);
            loadedForUser.current = null;
            return;
        }

        // Skip if already loaded for this user
        if (loadedForUser.current === userId) return;

        let cancelled = false;
        (async () => {
            try {
                const s = await getSettings();
                if (cancelled) return;
                const current = { ...defaults, ...s };
                setSettingsState(current);
                loadedForUser.current = userId;

                // Apply CSS variables
                document.documentElement.style.setProperty('--glass-blur', `${current.blurIntensity}px`);
                document.documentElement.style.setProperty('--card-opacity', `${current.cardOpacity}`);
                document.documentElement.style.setProperty('--modal-opacity-mid', `${current.modalOpacityMiddle}`);
                document.documentElement.style.setProperty('--modal-opacity-avg', `${current.modalOpacityAverage}`);
                document.documentElement.style.setProperty('--modal-opacity-edge', `${current.modalOpacityEdges}`);
            } catch {
                // Auth might have expired — use defaults
                if (!cancelled) setSettingsState(defaults);
            }
            if (!cancelled) setReady(true);
        })();

        return () => { cancelled = true; };
    }, [userId, authLoading]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }, [settings.theme]);

    // Local-only update (no network call — for real-time slider preview)
    const updateSettings = useCallback((partial: Partial<AppSettings>) => {
        setSettingsState(prev => ({ ...prev, ...partial }));
    }, []);

    // Persist to Supabase (called explicitly by save button)
    const saveSettings = useCallback(async () => {
        try {
            await setSettings(settings);
        } catch {
            // Silently fail — user might not be authenticated
        }
    }, [settings]);

    const toggleTheme = useCallback(() => {
        const next = settings.theme === 'dark' ? 'light' : 'dark';
        setSettingsState(prev => ({ ...prev, theme: next }));
        // Theme is saved immediately (not deferred)
        setSettings({ theme: next }).catch(() => { });
    }, [settings.theme]);

    return (
        <AppContext.Provider value={{ ready, settings, updateSettings, saveSettings, theme: settings.theme, toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
