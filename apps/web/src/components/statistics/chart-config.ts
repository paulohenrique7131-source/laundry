import type { EChartsOption } from 'echarts';
import {
  STATISTICS_FAMILY_LABELS,
  type StatisticsChartFamily,
  type StatisticsChartVariant,
  type StatisticsDatumByCategory,
  type StatisticsResponse,
  type StatisticsTrendPoint,
} from '@laundry/domain';

export interface ChartVariantDefinition {
  value: StatisticsChartVariant;
  label: string;
  description: string;
}

export const CHART_VARIANTS_BY_FAMILY: Record<StatisticsChartFamily, ChartVariantDefinition[]> = {
  cost: [
    { value: 'doughnut', label: 'Doughnut', description: 'Distribui\u00e7\u00e3o circular com centro vazado' },
    { value: 'pie', label: 'Pie', description: 'Pizza cl\u00e1ssica para leitura r\u00e1pida' },
    { value: 'rose', label: 'Rose', description: 'Nightingale para dar destaque a varia\u00e7\u00f5es' },
    { value: 'treemap', label: 'Treemap', description: 'Blocos proporcionais para comparar peso por item' },
  ],
  volume: [
    { value: 'barVertical', label: 'Bar vertical', description: 'Comparativo direto por categoria' },
    { value: 'barHorizontal', label: 'Bar horizontal', description: 'Melhor para listas com nomes longos' },
    { value: 'barStacked', label: 'Bar empilhado', description: 'Leitura com refer\u00eancia de participa\u00e7\u00e3o' },
  ],
  trend: [
    { value: 'line', label: 'Line', description: 'Linha objetiva por dia' },
    { value: 'areaLine', label: '\u00c1rea', description: 'Linha com preenchimento para refor\u00e7ar volume' },
    { value: 'smoothLine', label: 'Smooth line', description: 'Curva suave para leitura premium' },
  ],
};

const PALETTE = ['#f59e0b', '#3b82f6', '#14b8a6', '#a855f7', '#f97316', '#22c55e', '#ec4899', '#eab308'];
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_MUTED = 'rgba(255,255,255,0.62)';
const GRID_COLOR = 'rgba(255,255,255,0.08)';
const SURFACE_COLOR = 'rgba(255,255,255,0.08)';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

function commonOption(): Pick<EChartsOption, 'animationDuration' | 'animationDurationUpdate' | 'animationEasing' | 'textStyle' | 'tooltip'> {
  return {
    animationDuration: 320,
    animationDurationUpdate: 280,
    animationEasing: 'cubicOut',
    textStyle: { color: TEXT_PRIMARY, fontFamily: 'Inter, system-ui, sans-serif' },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 10, 16, 0.96)',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      textStyle: { color: TEXT_PRIMARY },
      confine: true,
    },
  };
}

function buildLegend(data: StatisticsDatumByCategory[]) {
  return {
    bottom: 0,
    left: 'center',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: TEXT_MUTED, fontSize: 11 },
    data: data.map((item) => item.name),
  } as const;
}

function buildCostOption(variant: StatisticsChartVariant, data: StatisticsDatumByCategory[]): EChartsOption {
  const base = commonOption();
  const seriesData = data.map((item, index) => ({
    ...item,
    itemStyle: { color: PALETTE[index % PALETTE.length] },
  }));

  if (variant === 'treemap') {
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: ((params: unknown) => {
          const point = Array.isArray(params) ? params[0] : params as { name?: string; value?: unknown };
          return `${point?.name ?? ''}<br/>${formatCurrency(Number(point?.value ?? 0))}`;
        }) as never,
      },
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { color: TEXT_PRIMARY, fontSize: 12 },
        upperLabel: { show: false },
        itemStyle: { gapWidth: 6, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 14 },
        color: PALETTE,
        data: seriesData,
      }],
    } as EChartsOption;
  }

  return {
    ...base,
    legend: buildLegend(data),
    series: [{
      type: 'pie',
      radius: variant === 'doughnut' ? ['48%', '72%'] : variant === 'rose' ? [24, 92] : ['0%', '72%'],
      center: ['50%', '44%'],
      roseType: variant === 'rose' ? 'area' : undefined,
      padAngle: 2,
      itemStyle: { borderRadius: 10, borderColor: SURFACE_COLOR, borderWidth: 2 },
      label: { color: TEXT_MUTED, formatter: '{b|{b}}\n{c|{d}%}', rich: { b: { color: TEXT_PRIMARY, fontSize: 11, fontWeight: 600 }, c: { color: TEXT_MUTED, fontSize: 10 } } },
      labelLine: { lineStyle: { color: GRID_COLOR } },
      emphasis: { scale: true, scaleSize: 4 },
      universalTransition: true,
      data: seriesData,
    }],
  } as EChartsOption;
}

function buildAxes(horizontal = false) {
  return horizontal
    ? {
        xAxis: { type: 'value', axisLabel: { color: TEXT_MUTED }, splitLine: { lineStyle: { color: GRID_COLOR } } },
        yAxis: { type: 'category', axisLabel: { color: TEXT_PRIMARY, width: 120, overflow: 'truncate' }, axisLine: { show: false } },
      } as const
    : {
        xAxis: { type: 'category', axisLabel: { color: TEXT_MUTED, interval: 0, rotate: 18 }, axisLine: { lineStyle: { color: GRID_COLOR } } },
        yAxis: { type: 'value', axisLabel: { color: TEXT_MUTED }, splitLine: { lineStyle: { color: GRID_COLOR } } },
      } as const;
}

function buildVolumeOption(variant: StatisticsChartVariant, data: StatisticsDatumByCategory[]): EChartsOption {
  const base = commonOption();
  const labels = data.map((item) => item.name);
  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values, 0);
  const isHorizontal = variant === 'barHorizontal';

  if (variant === 'barStacked') {
    return {
      ...base,
      grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        ...base.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      xAxis: { type: 'value', axisLabel: { color: TEXT_MUTED }, splitLine: { lineStyle: { color: GRID_COLOR } } },
      yAxis: { type: 'category', axisLabel: { color: TEXT_PRIMARY }, data: labels },
      series: [
        {
          type: 'bar',
          stack: 'volume',
          data: values,
          barWidth: 18,
          itemStyle: { color: PALETTE[0], borderRadius: [0, 8, 8, 0] },
          emphasis: { focus: 'series' },
          universalTransition: true,
        },
        {
          type: 'bar',
          stack: 'volume',
          silent: true,
          data: values.map((value) => Math.max(maxValue - value, 0)),
          itemStyle: { color: 'rgba(255,255,255,0.08)', borderRadius: [0, 8, 8, 0] },
        },
      ],
    } as EChartsOption;
  }

  return {
    ...base,
    grid: { left: 8, right: 8, top: 12, bottom: 24, containLabel: true },
    tooltip: {
      ...base.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    ...buildAxes(isHorizontal),
    ...(isHorizontal ? { yAxis: { ...buildAxes(true).yAxis, data: labels } } : { xAxis: { ...buildAxes(false).xAxis, data: labels } }),
    series: [{
      type: 'bar',
      data: values,
      barWidth: isHorizontal ? 16 : 22,
      itemStyle: {
        color: PALETTE[1],
        borderRadius: isHorizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
      },
      emphasis: { focus: 'series' },
      universalTransition: true,
    }],
  } as EChartsOption;
}

function buildTrendOption(variant: StatisticsChartVariant, data: StatisticsTrendPoint[]): EChartsOption {
  const base = commonOption();
  return {
    ...base,
    grid: { left: 8, right: 12, top: 16, bottom: 24, containLabel: true },
    tooltip: {
      ...base.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: ((params: unknown) => {
        const points = Array.isArray(params) ? params as Array<{ axisValue?: string; value?: unknown }> : [];
        const point = points[0];
        return `${point.axisValue}<br/>${formatCurrency(Number(point.value ?? 0))}`;
      }) as never,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((point) => point.date),
      axisLabel: { color: TEXT_MUTED },
      axisLine: { lineStyle: { color: GRID_COLOR } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: TEXT_MUTED, formatter: (value: number) => `R$ ${value}` },
      splitLine: { lineStyle: { color: GRID_COLOR } },
    },
    series: [{
      type: 'line',
      data: data.map((point) => point.value),
      smooth: variant === 'smoothLine',
      symbol: 'circle',
      symbolSize: 7,
      showSymbol: data.length <= 18,
      lineStyle: { width: 3, color: PALETTE[0] },
      itemStyle: { color: PALETTE[0] },
      areaStyle: variant === 'areaLine' || variant === 'smoothLine'
        ? { color: 'rgba(245, 158, 11, 0.14)' }
        : undefined,
      universalTransition: true,
    }],
  } as unknown as EChartsOption;
}

export function buildChartOption(
  family: StatisticsChartFamily,
  variant: StatisticsChartVariant,
  response: StatisticsResponse,
): EChartsOption {
  if (family === 'cost') {
    return buildCostOption(variant, response.costByCategory);
  }
  if (family === 'volume') {
    return buildVolumeOption(variant, response.volumeByCategory);
  }
  return buildTrendOption(variant, response.trendByDay);
}

export function getChartCardCopy(family: StatisticsChartFamily, variant: StatisticsChartVariant) {
  const currentVariant = CHART_VARIANTS_BY_FAMILY[family].find((item) => item.value === variant);
  return {
    title: STATISTICS_FAMILY_LABELS[family],
    subtitle: currentVariant?.label ?? variant,
  };
}
