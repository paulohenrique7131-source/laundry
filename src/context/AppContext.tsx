'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initDB, getSettings, setSettings } from '@/storage/db';
import type { AppSettings, CatalogType, ServiceType } from '@/types';

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
};

const AppContext = createContext<AppCtx>({
    ready: false,
    settings: defaults,
    updateSettings: async () => { },
    theme: 'dark',
    toggleTheme: () => { },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [settings, setSettingsState] = useState<AppSettings>(defaults);

    useEffect(() => {
        (async () => {
            await initDB();
            const s = await getSettings();
            setSettingsState({ ...defaults, ...s });
            setReady(true);
        })();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }, [settings.theme]);

    const updateSettingsCtx = useCallback(async (partial: Partial<AppSettings>) => {
        const merged = { ...settings, ...partial };
        setSettingsState(merged);
        await setSettings(partial);
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
