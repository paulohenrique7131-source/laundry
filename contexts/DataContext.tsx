"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, HistoryRecord, AppNote, ServiceItem, EnxovalItem } from '@/types';
import { StorageService, STORAGE_KEYS } from '@/lib/storage';
import { DEFAULT_SERVICES } from '@/lib/default-data';

interface DataContextType {
    settings: AppSettings;
    history: HistoryRecord[];
    notes: AppNote[];
    isLoading: boolean;
    addHistoryRecord: (record: HistoryRecord) => void;
    deleteHistoryRecord: (id: string) => void;
    clearHistory: (startDate?: Date, endDate?: Date) => void; // Optional range for clearing
    addNote: (note: AppNote) => void;
    deleteNote: (id: string) => void;
    updateSettings: (newSettings: AppSettings) => void;
    resetServiceItems: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>({
        serviceItems: [],
        enxovalItems: [],
        theme: 'dark',
    });
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [notes, setNotes] = useState<AppNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        const loadedSettings = StorageService.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, {
            serviceItems: DEFAULT_SERVICES,
            enxovalItems: [],
            theme: 'dark'
        });

        // Ensure default services are present if storage was empty or partial
        if (!loadedSettings.serviceItems || loadedSettings.serviceItems.length === 0) {
            loadedSettings.serviceItems = DEFAULT_SERVICES;
        }

        const loadedHistory = StorageService.getItem<HistoryRecord[]>(STORAGE_KEYS.HISTORY, []);
        const loadedNotes = StorageService.getItem<AppNote[]>(STORAGE_KEYS.NOTES, []);

        setSettings(loadedSettings);
        setHistory(loadedHistory);
        setNotes(loadedNotes);
        setIsLoading(false);
    }, []);

    // Persist changes
    useEffect(() => {
        if (!isLoading) {
            StorageService.setItem(STORAGE_KEYS.SETTINGS, settings);
        }
    }, [settings, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            StorageService.setItem(STORAGE_KEYS.HISTORY, history);
        }
    }, [history, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            StorageService.setItem(STORAGE_KEYS.NOTES, notes);
        }
    }, [notes, isLoading]);

    const addHistoryRecord = (record: HistoryRecord) => {
        setHistory(prev => [record, ...prev]);
    };

    const deleteHistoryRecord = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const clearHistory = (startDate?: Date, endDate?: Date) => {
        if (!startDate && !endDate) {
            setHistory([]);
            return;
        }
        // If range provided, filter out the ones in range. 
        // Implementation pending detailed consolidation logic, for now simple clear.
        setHistory([]);
    };

    const addNote = (note: AppNote) => {
        setNotes(prev => [note, ...prev]);
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(item => item.id !== id));
    };

    const updateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
    };

    const resetServiceItems = () => {
        setSettings(prev => ({ ...prev, serviceItems: DEFAULT_SERVICES }));
    };

    return (
        <DataContext.Provider value={{
            settings,
            history,
            notes,
            isLoading,
            addHistoryRecord,
            deleteHistoryRecord,
            clearHistory,
            addNote,
            deleteNote,
            updateSettings,
            resetServiceItems
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
