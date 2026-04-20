export type StatisticsTypeFilter = 'Ambos' | 'Serviços' | 'Enxoval';
export type StatisticsChartFamily = 'cost' | 'volume' | 'trend';
export type StatisticsChartVariant =
  | 'doughnut'
  | 'pie'
  | 'rose'
  | 'treemap'
  | 'barVertical'
  | 'barHorizontal'
  | 'barStacked'
  | 'line'
  | 'areaLine'
  | 'smoothLine';

export interface StatisticsFilters {
  startDate: string;
  endDate: string;
  typeFilter: StatisticsTypeFilter;
}

export interface StatisticsSummary {
  totalValue: number;
  recordCount: number;
}

export interface StatisticsDatumByCategory {
  name: string;
  value: number;
}

export interface StatisticsTrendPoint {
  date: string;
  value: number;
}

export interface StatisticsResponse {
  filters: StatisticsFilters;
  summary: StatisticsSummary;
  costByCategory: StatisticsDatumByCategory[];
  volumeByCategory: StatisticsDatumByCategory[];
  trendByDay: StatisticsTrendPoint[];
}

export interface StatisticsPreferences {
  version: 1;
  visibleCharts: StatisticsChartFamily[];
  chartOrder: StatisticsChartFamily[];
  variants: Record<StatisticsChartFamily, StatisticsChartVariant>;
}

export const STATISTICS_FAMILY_LABELS: Record<StatisticsChartFamily, string> = {
  cost: 'Custo por categoria',
  volume: 'Volume por categoria',
  trend: 'Tendência por dia',
};

export const DEFAULT_STATISTICS_PREFERENCES: StatisticsPreferences = {
  version: 1,
  visibleCharts: ['cost', 'trend'],
  chartOrder: ['cost', 'trend', 'volume'],
  variants: {
    cost: 'doughnut',
    volume: 'barVertical',
    trend: 'smoothLine',
  },
};

const ALL_CHART_VARIANTS = new Set<StatisticsChartVariant>([
  'doughnut',
  'pie',
  'rose',
  'treemap',
  'barVertical',
  'barHorizontal',
  'barStacked',
  'line',
  'areaLine',
  'smoothLine',
]);

const BOTH_VARIANTS = new Set(['ambos', 'todos']);
const SERVICE_VARIANTS = new Set(['servicos', 'serviços', 'serviÃ§os']);
const TROUSSEAU_VARIANTS = new Set(['enxoval']);

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeStatisticsTypeFilter(value?: string | null): StatisticsTypeFilter {
  if (!value) return 'Ambos';

  const normalized = normalizeText(value);
  if (BOTH_VARIANTS.has(normalized)) return 'Ambos';
  if (SERVICE_VARIANTS.has(normalized) || value === 'ServiÃ§os') return 'Serviços';
  if (TROUSSEAU_VARIANTS.has(normalized)) return 'Enxoval';
  return 'Ambos';
}

export function sanitizeStatisticsPreferences(input?: Partial<StatisticsPreferences> | null): StatisticsPreferences {
  const visibleCharts = Array.isArray(input?.visibleCharts)
    ? input.visibleCharts.filter((value): value is StatisticsChartFamily => ['cost', 'volume', 'trend'].includes(value))
    : DEFAULT_STATISTICS_PREFERENCES.visibleCharts;

  const chartOrder = Array.isArray(input?.chartOrder)
    ? input.chartOrder.filter((value): value is StatisticsChartFamily => ['cost', 'volume', 'trend'].includes(value))
    : DEFAULT_STATISTICS_PREFERENCES.chartOrder;

  const mergedOrder = Array.from(new Set([...chartOrder, 'cost', 'volume', 'trend'])) as StatisticsChartFamily[];
  const mergedVisible = visibleCharts.length > 0 ? visibleCharts : DEFAULT_STATISTICS_PREFERENCES.visibleCharts;

  const variants = Object.fromEntries(
    Object.entries({
      ...DEFAULT_STATISTICS_PREFERENCES.variants,
      ...(input?.variants ?? {}),
    }).filter((entry): entry is [StatisticsChartFamily, StatisticsChartVariant] =>
      ['cost', 'volume', 'trend'].includes(entry[0]) && ALL_CHART_VARIANTS.has(entry[1] as StatisticsChartVariant),
    ),
  ) as StatisticsPreferences['variants'];

  return {
    version: 1,
    visibleCharts: mergedVisible,
    chartOrder: mergedOrder,
    variants,
  };
}

function sortCategoryData(input: Record<string, number>): StatisticsDatumByCategory[] {
  return Object.entries(input)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
}

export function buildStatisticsResponse(
  records: HistoryRecord[],
  filters: StatisticsFilters,
): StatisticsResponse {
  const totalValue = records.reduce((sum, record) => sum + record.total, 0);
  const trendEntries = Object.entries(aggregateTrendByDay(records)).sort((left, right) => left[0].localeCompare(right[0]));

  return {
    filters,
    summary: {
      totalValue,
      recordCount: records.length,
    },
    costByCategory: sortCategoryData(aggregateCostByCategory(records)),
    volumeByCategory: sortCategoryData(aggregateVolumeByCategory(records)),
    trendByDay: trendEntries.map(([date, value]) => ({ date, value })),
  };
}
import {
  aggregateCostByCategory,
  aggregateTrendByDay,
  aggregateVolumeByCategory,
} from './calculations';
import type { HistoryRecord } from './types';
