// ====== ITEM TYPES ======
export interface ServiceItem {
    id: string;
    name: string;
    priceLP: number;
    priceP: number | null;
}

export interface TrousseauItem {
    id: string;
    name: string;
    price: number;
}

export type CatalogType = 'services' | 'trousseau';

// ====== CALCULATOR STATE ======
export type ServiceType = 'Normal' | 'Expresso' | 'Urgente';

export interface CalcLineService {
    itemId: string;
    name: string;
    priceLP: number;
    priceP: number | null;
    qtyLP: number;
    qtyP: number;
    isExtra?: boolean;
}

export interface CalcLineTrousseau {
    itemId: string;
    name: string;
    price: number;
    qty: number;
    isExtra?: boolean;
}

// ====== HISTORY ======
export interface HistoryItemDetail {
    itemId: string;
    name: string;
    priceLP?: number;
    priceP?: number | null;
    price?: number;
    qtyLP?: number;
    qtyP?: number;
    qty?: number;
    lineTotal: number;
}

export interface HistoryRecord {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'Serviços' | 'Enxoval';
    serviceType: ServiceType;
    items: HistoryItemDetail[];
    subtotal: number;
    multiplier: number;
    total: number;
    createdAt: string; // ISO
    updatedAt?: string;
}

// ====== NOTES ======
export interface Note {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// ====== SETTINGS ======
export interface AppSettings {
    theme: 'dark' | 'light';
    lastCatalog: CatalogType;
    lastServiceType: ServiceType;
    dashboardDateStart?: string;
    dashboardDateEnd?: string;
    dashboardTypeFilter?: 'Ambos' | 'Serviços' | 'Enxoval';
    statsRange?: '7d' | '30d' | '90d' | 'custom';
    statsTypeFilter?: 'Ambos' | 'Serviços' | 'Enxoval';
    blurIntensity?: number;
    cardOpacity?: number;
}

// ====== JOB RUNS (future) ======
export interface JobRun {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'done' | 'error';
    result?: string;
    createdAt: string;
    updatedAt: string;
}
