import Dexie, { type EntityTable } from 'dexie';
import type { ServiceItem, TrousseauItem, HistoryRecord, Note, AppSettings, JobRun } from '@/types';
import { DEFAULT_C1_ITEMS, DEFAULT_C2_ITEMS } from '@/data/defaults';

// Config document wrapper
export interface ConfigDoc {
    id: string; // 'c1_items' | 'c2_items'
    items: ServiceItem[] | TrousseauItem[];
}

export interface SettingsDoc {
    id: string; // 'main'
    data: AppSettings;
}

export interface JobRunDoc {
    id: string;
    data: JobRun;
}

class LavanderiaDB extends Dexie {
    config!: EntityTable<ConfigDoc, 'id'>;
    history!: EntityTable<HistoryRecord, 'id'>;
    notes!: EntityTable<Note, 'id'>;
    settings!: EntityTable<SettingsDoc, 'id'>;
    jobRuns!: EntityTable<JobRunDoc, 'id'>;

    constructor() {
        super('LavanderiaDB');

        this.version(1).stores({
            config: 'id',
            history: 'id, date, type, serviceType, createdAt',
            notes: 'id, createdAt, updatedAt',
            settings: 'id',
            jobRuns: 'id',
        });
    }
}

export const db = new LavanderiaDB();

// ====== INITIALIZATION ======
export async function initDB() {
    const c1 = await db.config.get('c1_items');
    if (!c1) {
        await db.config.put({ id: 'c1_items', items: DEFAULT_C1_ITEMS });
    }
    const c2 = await db.config.get('c2_items');
    if (!c2) {
        await db.config.put({ id: 'c2_items', items: DEFAULT_C2_ITEMS });
    }
    const s = await db.settings.get('main');
    if (!s) {
        await db.settings.put({
            id: 'main',
            data: {
                theme: 'dark',
                lastCatalog: 'services',
                lastServiceType: 'Normal',
            },
        });
    }
}

// ====== CONFIG ======
export async function getConfig(docId: string) {
    const doc = await db.config.get(docId);
    return doc?.items ?? [];
}

export async function setConfig(docId: string, items: ServiceItem[] | TrousseauItem[]) {
    await db.config.put({ id: docId, items });
}

// ====== HISTORY ======
export async function getHistory(
    startDate?: string,
    endDate?: string,
    typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval'
): Promise<HistoryRecord[]> {
    let collection = db.history.orderBy('date');

    const all = await collection.reverse().toArray();

    return all.filter((r) => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (typeFilter && typeFilter !== 'Ambos' && r.type !== typeFilter) return false;
        return true;
    });
}

export async function addHistory(record: HistoryRecord) {
    await db.history.add(record);
}

export async function updateHistory(record: HistoryRecord) {
    await db.history.put(record);
}

export async function deleteHistory(id: string) {
    await db.history.delete(id);
}

export async function clearHistory(startDate?: string, endDate?: string, typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval') {
    const records = await getHistory(startDate, endDate, typeFilter);
    const ids = records.map((r) => r.id);
    await db.history.bulkDelete(ids);
}

// ====== NOTES ======
export async function getNotes(): Promise<Note[]> {
    return db.notes.orderBy('createdAt').reverse().toArray();
}

export async function addNote(note: Note) {
    await db.notes.add(note);
}

export async function updateNote(note: Note) {
    await db.notes.put(note);
}

export async function deleteNote(id: string) {
    await db.notes.delete(id);
}

// ====== SETTINGS ======
export async function getSettings(): Promise<AppSettings> {
    const doc = await db.settings.get('main');
    return doc?.data ?? { theme: 'dark', lastCatalog: 'services', lastServiceType: 'Normal' };
}

export async function setSettings(data: Partial<AppSettings>) {
    const current = await getSettings();
    await db.settings.put({ id: 'main', data: { ...current, ...data } });
}

// ====== JOB RUNS ======
export async function getJobRuns(): Promise<JobRun[]> {
    const docs = await db.jobRuns.toArray();
    return docs.map((d) => d.data);
}

export async function setJobRun(job: JobRun) {
    await db.jobRuns.put({ id: job.id, data: job });
}
