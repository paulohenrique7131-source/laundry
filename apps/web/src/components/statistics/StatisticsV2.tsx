'use client';

import { useCallback, useMemo, useState } from 'react';
import { STATISTICS_FAMILY_LABELS, type StatsRange, type StatisticsChartFamily, type StatisticsTypeFilter } from '@laundry/domain';
import { useToast } from '@/context/ToastContext';
import { StatisticsChartsSection } from './StatisticsChartsSection';
import { StatisticsFiltersHeader } from './StatisticsFiltersHeader';
import { StatisticsSummaryCard } from './StatisticsSummaryCard';
import { useStatisticsData } from './useStatisticsData';
import { useStatisticsPreferences } from './useStatisticsPreferences';

function formatDateRange(range: { startDate: string; endDate: string }, typeFilter: StatisticsTypeFilter) {
  return `${range.startDate} \u2014 ${range.endDate} | Filtro: ${typeFilter}`;
}

export function StatisticsV2() {
  const { toast } = useToast();
  const [range, setRange] = useState<StatsRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState<StatisticsTypeFilter>('Ambos');
  const { preferences, applyPreferences, savePreferences } = useStatisticsPreferences();

  const getDateRange = useCallback(() => {
    const endDate = new Date().toISOString().slice(0, 10);
    if (range === 'custom') {
      const resolvedEnd = customEnd || endDate;
      return {
        startDate: customStart || resolvedEnd,
        endDate: resolvedEnd,
      };
    }

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const start = new Date();
    start.setDate(start.getDate() - days);

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate,
    };
  }, [customEnd, customStart, range]);

  const filters = useMemo(() => {
    const dateRange = getDateRange();
    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      typeFilter,
    };
  }, [getDateRange, typeFilter]);

  const { data, error, isLoading, isPending, isRefreshing, reload } = useStatisticsData(filters);

  const handlePrint = useCallback((visibleCharts: StatisticsChartFamily[]) => {
    const canvases = document.querySelectorAll<HTMLCanvasElement>('[data-statistics-chart] canvas');
    const images = Array.from(canvases).map((canvas) => canvas.toDataURL('image/png'));

    if (images.length === 0) {
      toast('Nenhum gráfico disponível para imprimir.', 'error');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
                <title>Estatísticas V2 - Washly</title>
<style>
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #12131a; padding: 40px; }
h1 { font-size: 24px; margin-bottom: 4px; }
p.sub { color: #596175; margin-bottom: 24px; }
.chart { margin-bottom: 28px; page-break-inside: avoid; }
.chart h2 { font-size: 16px; margin-bottom: 10px; }
img { max-width: 100%; border-radius: 18px; border: 1px solid rgba(0,0,0,0.08); }
.summary { margin-top: 24px; font-size: 18px; font-weight: 700; color: #d97706; }
button { margin-top: 16px; padding: 10px 24px; border: none; border-radius: 10px; background: #111827; color: #fff; cursor: pointer; }
@media print { button { display: none; } }
</style>
</head>
<body>
  <h1>Estatísticas V2</h1>
  <p class="sub">${formatDateRange(filters, typeFilter)}</p>
  ${images.map((src, index) => `<div class="chart"><h2>${STATISTICS_FAMILY_LABELS[visibleCharts[index] ?? 'cost']}</h2><img src="${src}" alt="Gráfico ${index + 1}" /></div>`).join('')}
  <p class="summary">Valor total: R$ ${(data?.summary.totalValue ?? 0).toFixed(2)} | Registros: ${data?.summary.recordCount ?? 0}</p>
  <button onclick="window.print()">Imprimir</button>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('Não foi possível abrir a janela de impressão.', 'error');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
  }, [data?.summary.recordCount, data?.summary.totalValue, filters, toast, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Análise de custos e volumes</p>
      </div>

      <StatisticsFiltersHeader
        range={range}
        customStart={customStart}
        customEnd={customEnd}
        typeFilter={typeFilter}
        onRangeChange={setRange}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onTypeFilterChange={setTypeFilter}
      />

      <StatisticsSummaryCard
        totalValue={data?.summary.totalValue ?? 0}
        recordCount={data?.summary.recordCount ?? 0}
        isRefreshing={isRefreshing || isPending}
      />

      <StatisticsChartsSection
        data={data}
        error={error}
        isLoading={isLoading}
        isRefreshing={isRefreshing || isPending}
        preferences={preferences}
        onApplyPreferences={(next) => {
          applyPreferences(next);
          toast('Visual dos gráficos aplicado.');
        }}
        onSavePreferences={(next) => {
          savePreferences(next);
          toast('Preferências salvas como padrão.');
        }}
        onReload={() => {
          reload();
          toast('Atualizando estatísticas...');
        }}
        onPrint={handlePrint}
      />
    </div>
  );
}
