'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_STATISTICS_PREFERENCES,
  sanitizeStatisticsPreferences,
  type StatisticsPreferences,
} from '@laundry/domain';

const STORAGE_KEY = 'laundry.statistics.preferences.v2';

function readStoredPreferences(): StatisticsPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_STATISTICS_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATISTICS_PREFERENCES;
    return sanitizeStatisticsPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_STATISTICS_PREFERENCES;
  }
}

export function useStatisticsPreferences() {
  const [preferences, setPreferences] = useState<StatisticsPreferences>(DEFAULT_STATISTICS_PREFERENCES);

  useEffect(() => {
    setPreferences(readStoredPreferences());
  }, []);

  const applyPreferences = useCallback((next: StatisticsPreferences) => {
    setPreferences(sanitizeStatisticsPreferences(next));
  }, []);

  const savePreferences = useCallback((next: StatisticsPreferences) => {
    const sanitized = sanitizeStatisticsPreferences(next);
    setPreferences(sanitized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }
  }, []);

  const resetStoredPreferences = useCallback(() => {
    setPreferences(DEFAULT_STATISTICS_PREFERENCES);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return useMemo(() => ({
    preferences,
    applyPreferences,
    savePreferences,
    resetStoredPreferences,
  }), [applyPreferences, preferences, resetStoredPreferences, savePreferences]);
}
