import type { CatalogDefinition, CatalogType, ServiceItem, TrousseauItem } from './types';

export const DEFAULT_SERVICE_ITEMS: ServiceItem[] = [
  { id: 'agasalho', name: 'Agasalho de lã', priceLP: 45, priceP: 20 },
  { id: 'bermuda', name: 'Bermuda', priceLP: 25, priceP: 12 },
  { id: 'blazer', name: 'Blazer', priceLP: 50, priceP: 31 },
  { id: 'blusa', name: 'Blusa', priceLP: 30, priceP: 16 },
  { id: 'blusafina', name: 'Blusa Fina', priceLP: 30, priceP: 18 },
  { id: 'calca', name: 'Calça', priceLP: 25, priceP: 17 },
  { id: 'calcasocial', name: 'Calça Social', priceLP: 28, priceP: 18 },
  { id: 'camisa', name: 'Camisa', priceLP: 25, priceP: 17 },
  { id: 'camisapolo', name: 'Camisa Polo', priceLP: 25, priceP: 15 },
  { id: 'camisasocial', name: 'Camisa Social', priceLP: 30, priceP: 17 },
  { id: 'camiseta', name: 'Camiseta', priceLP: 25, priceP: 15 },
  { id: 'camisola', name: 'Camisola', priceLP: 30, priceP: 17 },
  { id: 'casaco', name: 'Casaco', priceLP: 50, priceP: 34 },
  { id: 'cueca', name: 'Cueca/Calcinha', priceLP: 12, priceP: null },
  { id: 'gravata', name: 'Gravata', priceLP: 20, priceP: 12 },
  { id: 'malha', name: 'Malha', priceLP: 28, priceP: 24.2 },
  { id: 'meias', name: 'Meias', priceLP: 12, priceP: null },
  { id: 'moletonblusa', name: 'Moletom (blusa)', priceLP: 38, priceP: 19.8 },
  { id: 'moletoncalca', name: 'Moletom (calça)', priceLP: 38, priceP: 19.8 },
  { id: 'paleto', name: 'Paletó', priceLP: 45, priceP: 42 },
  { id: 'pijama', name: 'Pijama', priceLP: 22, priceP: 18 },
  { id: 'robe', name: 'Robe', priceLP: 25, priceP: 20 },
  { id: 'roupao', name: 'Roupão', priceLP: 30, priceP: 20 },
  { id: 'saia', name: 'Saia', priceLP: 25, priceP: 19 },
  { id: 'saiafina', name: 'Saia Fina', priceLP: 25, priceP: 19 },
  { id: 'shorts', name: 'Shorts', priceLP: 25, priceP: 12 },
  { id: 'smoking', name: 'Smoking', priceLP: 60, priceP: 50 },
  { id: 'sobretudo', name: 'Sobretudo', priceLP: 70, priceP: 60 },
  { id: 'sutia', name: 'Sutiã', priceLP: 14, priceP: null },
  { id: 'tenis', name: 'Tênis', priceLP: 70, priceP: null },
  { id: 'terno', name: 'Terno', priceLP: 45, priceP: 42 },
  { id: 'vestido', name: 'Vestido', priceLP: 35, priceP: 30 },
  { id: 'vestidofino', name: 'Vestido Fino', priceLP: 50, priceP: null },
];

export const DEFAULT_TROUSSEAU_ITEMS: TrousseauItem[] = [
  { id: 'lencol', name: 'Lençol', price: 18 },
  { id: 'fronha', name: 'Fronha', price: 8 },
  { id: 'toalhabanho', name: 'Toalha de banho', price: 12 },
  { id: 'toalharosto', name: 'Toalha de rosto', price: 7 },
  { id: 'edredom', name: 'Edredom', price: 35 },
  { id: 'cobertor', name: 'Cobertor', price: 30 },
];

export const MULTIPLIERS: Record<string, number> = {
  Normal: 1,
  Expresso: 1.5,
  Urgente: 2,
};

export function getCatalogStorageKey(catalog: CatalogType): string {
  if (catalog === 'services') return 'c1_items';
  if (catalog === 'trousseau') return 'c2_items';
  return `cat_${catalog}_items`;
}

export function getCatalogTitle(catalog: CatalogType, customCatalogs: CatalogDefinition[] = []): string {
  if (catalog === 'services') return 'Serviços';
  if (catalog === 'trousseau') return 'Enxoval';
  return customCatalogs.find((entry) => entry.id === catalog)?.name ?? 'Catálogo';
}

export function isServiceCatalog(catalog: CatalogType, customCatalogs: CatalogDefinition[] = []): boolean {
  if (catalog === 'services') return true;
  if (catalog === 'trousseau') return false;
  return customCatalogs.find((entry) => entry.id === catalog)?.type === 'service';
}

export function getCatalogDefinition(
  catalog: CatalogType,
  customCatalogs: CatalogDefinition[] = [],
): CatalogDefinition | null {
  if (catalog === 'services') {
    return { id: 'services', name: 'Serviços', type: 'service', columns: ['lp', 'p'] };
  }
  if (catalog === 'trousseau') {
    return { id: 'trousseau', name: 'Enxoval', type: 'product', columns: ['single'] };
  }
  return customCatalogs.find((entry) => entry.id === catalog) ?? null;
}
