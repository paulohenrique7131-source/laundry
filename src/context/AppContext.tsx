'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSettings, setSettings } from '@/storage/db';
import { useAuth } from '@/context/AuthContext';
import type { AppSettings } from '@/types';

interface AppCtx {
    ready: boolean;
    settings: AppSettings;
    updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
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
};

const AppContext = createContext<AppCtx>({
    ready: false,
    settings: defaults,
    updateSettings: async () => { },
    theme: 'dark',
    toggleTheme: () => { },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [ready, setReady] = useState(false);
    const [settings, setSettingsState] = useState<AppSettings>(defaults);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setSettingsState(defaults);
            setReady(true);
            return;
        }

        (async () => {
            const s = await getSettings();
            setSettingsState({ ...defaults, ...s });
            setReady(true);

            // Apply CSS variables
            const current = { ...defaults, ...s };
            document.documentElement.style.setProperty('--glass-blur', `${current.blurIntensity}px`);
            document.documentElement.style.setProperty('--card-opacity', `${current.cardOpacity}`);
            document.documentElement.style.setProperty('--modal-opacity-mid', `${current.modalOpacityMiddle}`);
            document.documentElement.style.setProperty('--modal-opacity-avg', `${current.modalOpacityAverage}`);
            document.documentElement.style.setProperty('--modal-opacity-edge', `${current.modalOpacityEdges}`);
        })();
    }, [user, authLoading]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }, [settings.theme]);

    const updateSettingsCtx = useCallback(async (partial: Partial<AppSettings>) => {
        const merged = { ...settings, ...partial };
        setSettingsState(merged);
        try {
            await setSettings(partial);
        } catch {
            // User might not be authenticated yet (on login page)
        }
    }, [settings]);

    const toggleTheme = useCallback(() => {
        const next = settings.theme === 'dark' ? 'light' : 'dark';
        updateSettingsCtx({ theme: next });
    }, [settings.theme, updateSettingsCtx]);

    return (
        <AppContext.Provider value={{ ready, settings, updateSettings: updateSettingsCtx, theme: settings.theme, toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
