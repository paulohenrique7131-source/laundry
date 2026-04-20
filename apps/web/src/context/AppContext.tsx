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

function coerceDarkTheme(settings: AppSettings): AppSettings {
    return { ...settings, theme: 'dark' };
}

const AppContext = createContext<AppCtx>({
    ready: false,
    settings: defaults,
    updateSettings: () => {},
    saveSettings: async () => {},
    theme: 'dark',
    toggleTheme: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { userId, loading: authLoading } = useAuth();
    const [ready, setReady] = useState(false);
    const [settings, setSettingsState] = useState<AppSettings>(defaults);
    const loadedForUser = useRef<string | null>(null);

    const withTimeout = useCallback(async <T,>(promise: PromiseLike<T>, fallback: T, timeoutMs = 8000): Promise<T> => {
        let timer: ReturnType<typeof setTimeout> | null = null;

        try {
            return await Promise.race([
                promise,
                new Promise<T>((resolve) => {
                    timer = setTimeout(() => resolve(fallback), timeoutMs);
                }),
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!userId) {
            setSettingsState(defaults);
            setReady(true);
            loadedForUser.current = null;
            return;
        }

        if (loadedForUser.current === userId) return;

        let cancelled = false;
        void (async () => {
            try {
                const s = await withTimeout(getSettings(), defaults);
                if (cancelled) return;
                const current = coerceDarkTheme({ ...defaults, ...s });
                setSettingsState(current);
                loadedForUser.current = userId;

                document.documentElement.style.setProperty('--glass-blur', `${current.blurIntensity}px`);
                document.documentElement.style.setProperty('--card-opacity', `${current.cardOpacity}`);
                document.documentElement.style.setProperty('--modal-opacity-mid', `${current.modalOpacityMiddle}`);
                document.documentElement.style.setProperty('--modal-opacity-avg', `${current.modalOpacityAverage}`);
                document.documentElement.style.setProperty('--modal-opacity-edge', `${current.modalOpacityEdges}`);
            } catch {
                if (!cancelled) setSettingsState(defaults);
            } finally {
                if (!cancelled) setReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, authLoading, withTimeout]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
    }, [settings.theme]);

    const updateSettings = useCallback((partial: Partial<AppSettings>) => {
        setSettingsState((prev) => coerceDarkTheme({ ...prev, ...partial }));
    }, []);

    const saveSettings = useCallback(async () => {
        try {
            await setSettings(coerceDarkTheme(settings));
        } catch {
            // Silently fail if the user is not authenticated.
        }
    }, [settings]);

    const toggleTheme = useCallback(() => {
        setSettingsState((prev) => coerceDarkTheme(prev));
        setSettings({ theme: 'dark' }).catch(() => {});
    }, []);

    return (
        <AppContext.Provider value={{ ready, settings, updateSettings, saveSettings, theme: 'dark', toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
