'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, mergeAppSettings, type AppSettings } from '@laundry/domain';
import { themeByName, type LaundryTheme } from '@laundry/theme';
import { getLocalSettings, mergeWithLocalSettings, setLocalSettings } from '@/lib/localSettings';
import { repository } from '@/lib/repository';
import { useAuth } from './AuthProvider';

interface AppContextValue {
  ready: boolean;
  settings: AppSettings;
  theme: LaundryTheme;
  updateSettings: (partial: Partial<AppSettings>) => void;
  saveSettings: (partial?: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({
  ready: false,
  settings: DEFAULT_SETTINGS,
  theme: themeByName.dark,
  updateSettings: () => undefined,
  saveSettings: async () => undefined,
  toggleTheme: async () => undefined,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userId, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const localReady = useRef(false);
  const loadedForUser = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLocal = async () => {
      const localSettings = await getLocalSettings();
      if (cancelled) return;
      setSettings((current) => mergeWithLocalSettings(current, localSettings));
      localReady.current = true;
      setReady(true);
    };

    void loadLocal();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!localReady.current || authLoading) return;

    if (!userId) {
      setSettings((current) => mergeWithLocalSettings(DEFAULT_SETTINGS, current));
      loadedForUser.current = null;
      setReady(true);
      return;
    }

    if (loadedForUser.current === userId) return;

    let cancelled = false;
    const load = async () => {
      try {
        const nextSettings = await repository.getSettings();
        if (cancelled) return;
        setSettings((current) => mergeWithLocalSettings({ ...current, ...nextSettings }, current));
      } catch {
        if (cancelled) return;
      }
      if (cancelled) return;
      loadedForUser.current = userId;
      setReady(true);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((current) => mergeAppSettings({ ...current, ...partial }));
  }, []);

  const saveSettings = useCallback(async (partial?: Partial<AppSettings>) => {
    const nextSettings = mergeAppSettings({ ...settings, ...(partial ?? {}) });
    setSettings(nextSettings);
    await setLocalSettings(nextSettings);

    if (partial?.customCatalogs !== undefined) {
      await repository.setSettings({ customCatalogs: nextSettings.customCatalogs });
    }
  }, [settings]);

  const toggleTheme = useCallback(async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const nextSettings = mergeAppSettings({ ...settings, theme: nextTheme });
    setSettings(nextSettings);
    await setLocalSettings({ theme: nextTheme });
  }, [settings]);

  const value = useMemo(() => ({
    ready,
    settings,
    theme: themeByName[settings.theme ?? 'dark'],
    updateSettings,
    saveSettings,
    toggleTheme,
  }), [ready, saveSettings, settings, toggleTheme, updateSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
