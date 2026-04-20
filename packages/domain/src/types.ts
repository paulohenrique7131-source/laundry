import { z } from 'zod';

export type CatalogColumn = 'lp' | 'p' | 'single';
export type CatalogKind = 'service' | 'product';
export type CatalogType = 'services' | 'trousseau' | string;
export type ServiceType = 'Normal' | 'Expresso' | 'Urgente';
export type HistoryType = 'Serviços' | 'Enxoval' | string;
export type NoteVisibility = 'public' | 'private' | 'targeted';
export type AppTheme = 'dark' | 'light';
export type StatsRange = '7d' | '30d' | '90d' | 'custom';

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
  type: CatalogKind;
  columns: CatalogColumn[];
}

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
  date: string;
  type: HistoryType;
  serviceType: ServiceType;
  items: HistoryItemDetail[];
  subtotal: number;
  multiplier: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  authorId?: string;
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorRole?: string;
  visibility: NoteVisibility;
  recipients?: string[];
  readBy?: string[];
  relatedRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: AppTheme;
  lastCatalog: CatalogType;
  lastServiceType: ServiceType;
  dashboardDateStart?: string;
  dashboardDateEnd?: string;
  dashboardTypeFilter?: string;
  statsRange?: StatsRange;
  statsTypeFilter?: string;
  blurIntensity?: number;
  cardOpacity?: number;
  showAbout?: boolean;
  modalOpacityMiddle?: number;
  modalOpacityAverage?: number;
  modalOpacityEdges?: number;
  customCatalogs?: CatalogDefinition[];
}

export interface JobRun {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUserProfile {
  id: string;
  role: string;
  email: string;
}

const serviceTypeSchema = z.enum(['Normal', 'Expresso', 'Urgente']);
const noteVisibilitySchema = z.enum(['public', 'private', 'targeted']);
const appThemeSchema = z.enum(['dark', 'light']);
const statsRangeSchema = z.enum(['7d', '30d', '90d', 'custom']);
const catalogColumnSchema = z.enum(['lp', 'p', 'single']);
const catalogKindSchema = z.enum(['service', 'product']);

export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceLP: z.number(),
  priceP: z.number().nullable(),
});

export const trousseauItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

export const catalogDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: catalogKindSchema,
  columns: z.array(catalogColumnSchema),
});

export const calcLineServiceSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  priceLP: z.number(),
  priceP: z.number().nullable(),
  qtyLP: z.number(),
  qtyP: z.number(),
  isExtra: z.boolean().optional(),
});

export const calcLineTrousseauSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  price: z.number(),
  qty: z.number(),
  isExtra: z.boolean().optional(),
});

export const historyItemDetailSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  priceLP: z.number().optional(),
  priceP: z.number().nullable().optional(),
  price: z.number().optional(),
  qtyLP: z.number().optional(),
  qtyP: z.number().optional(),
  qty: z.number().optional(),
  lineTotal: z.number(),
});

export const historyRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.string(),
  serviceType: serviceTypeSchema,
  items: z.array(historyItemDetailSchema),
  subtotal: z.number(),
  multiplier: z.number(),
  total: z.number(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  author: z.string().optional(),
  authorId: z.string().optional(),
});

export const noteSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorRole: z.string().optional(),
  visibility: noteVisibilitySchema,
  recipients: z.array(z.string()).optional(),
  readBy: z.array(z.string()).optional(),
  relatedRecordId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const appSettingsSchema = z.object({
  theme: appThemeSchema,
  lastCatalog: z.string(),
  lastServiceType: serviceTypeSchema,
  dashboardDateStart: z.string().optional(),
  dashboardDateEnd: z.string().optional(),
  dashboardTypeFilter: z.string().optional(),
  statsRange: statsRangeSchema.optional(),
  statsTypeFilter: z.string().optional(),
  blurIntensity: z.number().optional(),
  cardOpacity: z.number().optional(),
  showAbout: z.boolean().optional(),
  modalOpacityMiddle: z.number().optional(),
  modalOpacityAverage: z.number().optional(),
  modalOpacityEdges: z.number().optional(),
  customCatalogs: z.array(catalogDefinitionSchema).optional(),
});

export const jobRunSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['pending', 'running', 'done', 'error']),
  result: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const appUserProfileSchema = z.object({
  id: z.string(),
  role: z.string(),
  email: z.string(),
});
