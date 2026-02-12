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

export interface CatalogDefinition {
    id: string;
    name: string;
    type: 'service' | 'product'; // service = multipliers enabled, product = simple qty * price
    columns: ('lp' | 'p' | 'single')[]; // Configuration of price columns
}

export type CatalogType = 'services' | 'trousseau' | string;

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
    type: string;
    serviceType: ServiceType;
    items: HistoryItemDetail[];
    subtotal: number;
    multiplier: number;
    total: number;
    notes?: string;
    createdAt: string; // ISO
    updatedAt?: string;
    author?: string; // e.g. "Manager", "Gov", "João"
    authorId?: string;
}

// ====== NOTES & MESSAGES ======
export interface Note {
    id: string;
    content: string;
    authorId: string;
    authorRole?: string; // "manager" | "gov"
    visibility: 'public' | 'private' | 'targeted';
    recipients?: string[]; // IDs of users who can see this if targeted
    readBy?: string[];
    relatedRecordId?: string; // link to a history record
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
    dashboardTypeFilter?: string;
    statsRange?: '7d' | '30d' | '90d' | 'custom';
    statsTypeFilter?: string;
    blurIntensity?: number;
    cardOpacity?: number;
    showAbout?: boolean;
    modalOpacityMiddle?: number;
    modalOpacityAverage?: number;
    modalOpacityEdges?: number;
    customCatalogs?: CatalogDefinition[];
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
