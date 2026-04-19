import { MULTIPLIERS } from './catalog';
import { resolveAuthorLabel } from './auth';
import type {
  CalcLineService,
  CalcLineTrousseau,
  HistoryItemDetail,
  HistoryRecord,
  ServiceItem,
  ServiceType,
  TrousseauItem,
} from './types';

export type ServiceQuantityMap =
  | Map<string, { qtyLP: number; qtyP: number }>
  | Record<string, { qtyLP: number; qtyP: number }>;
export type ProductQuantityMap = Map<string, number> | Record<string, number>;

function readServiceQuantities(source: ServiceQuantityMap, itemId: string): { qtyLP: number; qtyP: number } {
  if (source instanceof Map) {
    return source.get(itemId) ?? { qtyLP: 0, qtyP: 0 };
  }
  return source[itemId] ?? { qtyLP: 0, qtyP: 0 };
}

function readProductQuantity(source: ProductQuantityMap, itemId: string): number {
  if (source instanceof Map) {
    return source.get(itemId) ?? 0;
  }
  return source[itemId] ?? 0;
}

export function calculateServiceLineTotal(
  priceLP: number,
  qtyLP: number,
  priceP: number | null | undefined,
  qtyP: number,
): number {
  return priceLP * qtyLP + (priceP != null ? priceP * qtyP : 0);
}

export function calculateProductLineTotal(price: number, qty: number): number {
  return price * qty;
}

export function buildServiceHistoryItems(
  items: ServiceItem[],
  quantities: ServiceQuantityMap,
  extras: CalcLineService[] = [],
): HistoryItemDetail[] {
  const rows: HistoryItemDetail[] = [];

  for (const item of items) {
    const line = readServiceQuantities(quantities, item.id);
    if (line.qtyLP > 0 || line.qtyP > 0) {
      rows.push({
        itemId: item.id,
        name: item.name,
        priceLP: item.priceLP,
        priceP: item.priceP,
        qtyLP: line.qtyLP,
        qtyP: line.qtyP,
        lineTotal: calculateServiceLineTotal(item.priceLP, line.qtyLP, item.priceP, line.qtyP),
      });
    }
  }

  for (const extra of extras) {
    if (extra.qtyLP > 0 || extra.qtyP > 0) {
      rows.push({
        itemId: extra.itemId,
        name: extra.name,
        priceLP: extra.priceLP,
        priceP: extra.priceP,
        qtyLP: extra.qtyLP,
        qtyP: extra.qtyP,
        lineTotal: calculateServiceLineTotal(extra.priceLP, extra.qtyLP, extra.priceP, extra.qtyP),
      });
    }
  }

  return rows;
}

export function buildProductHistoryItems(
  items: TrousseauItem[],
  quantities: ProductQuantityMap,
  extras: CalcLineTrousseau[] = [],
): HistoryItemDetail[] {
  const rows: HistoryItemDetail[] = [];

  for (const item of items) {
    const qty = readProductQuantity(quantities, item.id);
    if (qty > 0) {
      rows.push({
        itemId: item.id,
        name: item.name,
        price: item.price,
        qty,
        lineTotal: calculateProductLineTotal(item.price, qty),
      });
    }
  }

  for (const extra of extras) {
    if (extra.qty > 0) {
      rows.push({
        itemId: extra.itemId,
        name: extra.name,
        price: extra.price,
        qty: extra.qty,
        lineTotal: calculateProductLineTotal(extra.price, extra.qty),
      });
    }
  }

  return rows;
}

export function calculateSubtotal(items: HistoryItemDetail[]): number {
  return items.reduce((sum, item) => sum + item.lineTotal, 0);
}

export function getServiceMultiplier(serviceType: ServiceType, enabled = true): number {
  if (!enabled) return 1;
  return MULTIPLIERS[serviceType] ?? 1;
}

export function calculateTotal(subtotal: number, multiplier: number): number {
  return subtotal * multiplier;
}

export function normalizeHistoryItem(item: HistoryItemDetail): HistoryItemDetail {
  if (item.priceLP !== undefined) {
    return {
      ...item,
      lineTotal: calculateServiceLineTotal(item.priceLP, item.qtyLP ?? 0, item.priceP, item.qtyP ?? 0),
    };
  }

  return {
    ...item,
    lineTotal: calculateProductLineTotal(item.price ?? 0, item.qty ?? 0),
  };
}

export function recalculateHistoryRecord(record: HistoryRecord): HistoryRecord {
  const items = record.items.map(normalizeHistoryItem);
  const subtotal = calculateSubtotal(items);
  const multiplier = record.type === 'Serviços'
    ? getServiceMultiplier(record.serviceType, true)
    : record.multiplier || 1;

  return {
    ...record,
    items,
    subtotal,
    multiplier,
    total: calculateTotal(subtotal, multiplier),
    updatedAt: new Date().toISOString(),
  };
}

export function createHistoryRecord(params: {
  id: string;
  date: string;
  type: string;
  serviceType: ServiceType;
  items: HistoryItemDetail[];
  notes?: string;
  role?: string | null;
  authorId?: string | null;
  useMultiplier?: boolean;
}): HistoryRecord {
  const subtotal = calculateSubtotal(params.items);
  const multiplier = getServiceMultiplier(params.serviceType, params.useMultiplier ?? params.type === 'Serviços');

  return {
    id: params.id,
    date: params.date,
    type: params.type,
    serviceType: params.serviceType,
    items: params.items,
    subtotal,
    multiplier,
    total: calculateTotal(subtotal, multiplier),
    notes: params.notes,
    createdAt: new Date().toISOString(),
    author: resolveAuthorLabel(params.role),
    authorId: params.authorId ?? undefined,
  };
}

export function aggregateCostByCategory(records: HistoryRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((acc, record) => {
    for (const item of record.items) {
      acc[item.name] = (acc[item.name] ?? 0) + item.lineTotal;
    }
    return acc;
  }, {});
}

export function aggregateVolumeByCategory(records: HistoryRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((acc, record) => {
    for (const item of record.items) {
      const qty = (item.qtyLP ?? 0) + (item.qtyP ?? 0) + (item.qty ?? 0);
      acc[item.name] = (acc[item.name] ?? 0) + qty;
    }
    return acc;
  }, {});
}

export function aggregateTrendByDay(records: HistoryRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((acc, record) => {
    acc[record.date] = (acc[record.date] ?? 0) + record.total;
    return acc;
  }, {});
}
