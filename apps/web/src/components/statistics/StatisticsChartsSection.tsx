'use client';

import { useMemo, useState } from 'react';
import type { StatisticsChartFamily, StatisticsPreferences, StatisticsResponse } from '@laundry/domain';
import { ChartCard } from './ChartCard';
import { ChartPicker } from './ChartPicker';
import { buildChartOption, getChartCardCopy } from './chart-config';

interface StatisticsChartsSectionProps {
  data: StatisticsResponse | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  preferences: StatisticsPreferences;
  onApplyPreferences: (preferences: StatisticsPreferences) => void;
  onSavePreferences: (preferences: StatisticsPreferences) => void;
  onReload: () => void;
  onPrint: (visibleCharts: StatisticsChartFamily[]) => void;
}

const EMPTY_MESSAGES: Record<StatisticsChartFamily, string> = {
  cost: 'Sem custo agregado para o filtro atual.',
  volume: 'Sem volume agregado para o filtro atual.',
  trend: 'Sem tendência diária para o filtro atual.',
};

export function StatisticsChartsSection({
  data,
  error,
  isLoading,
  isRefreshing,
  preferences,
  onApplyPreferences,
  onSavePreferences,
  onReload,
  onPrint,
}: StatisticsChartsSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleCharts = useMemo(() => {
    const visibleSet = new Set(preferences.visibleCharts);
    return preferences.chartOrder.filter((family) => visibleSet.has(family));
  }, [preferences.chartOrder, preferences.visibleCharts]);

  const hasAnySeries = Boolean(
    data && (data.costByCategory.length > 0 || data.volumeByCategory.length > 0 || data.trendByDay.length > 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)] uppercase tracking-[0.24em]">Painel analítico</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPickerOpen(true)}>
            Personalizar gráficos
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReload}>
            Atualizar dados
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onPrint(visibleCharts)} disabled={!hasAnySeries}>
            Imprimir relatório
          </button>
        </div>
      </div>

      {error ? (
        <div className="statistics-inline-alert">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Falha ao atualizar os gráficos</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReload}>Tentar novamente</button>
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="statistics-charts-grid">
          {visibleCharts.map((family) => (
            <div key={family} className="glass-card p-6 min-h-[360px] animate-pulse" />
          ))}
        </div>
      ) : !hasAnySeries ? (
        <div className="glass-card p-12 text-center text-[var(--text-muted)]">
          <p className="text-3xl mb-3">\ud83d\udcc8</p>
          <p>Nenhum dado para exibir no período selecionado.</p>
        </div>
      ) : (
        <div className="statistics-charts-grid">
          {visibleCharts.map((family) => {
            const variant = preferences.variants[family];
            const copy = getChartCardCopy(family, variant);
            const hasData = family === 'cost'
              ? (data?.costByCategory.length ?? 0) > 0
              : family === 'volume'
                ? (data?.volumeByCategory.length ?? 0) > 0
                : (data?.trendByDay.length ?? 0) > 0;

            return (
              <ChartCard
                key={family}
                title={copy.title}
                subtitle={copy.subtitle}
                option={buildChartOption(family, variant, data!)}
                hasData={hasData}
                emptyMessage={EMPTY_MESSAGES[family]}
              />
            );
          })}
        </div>
      )}

      {isRefreshing ? <p className="text-xs text-[var(--text-muted)]">Atualizando os gráficos sem desmontar a tela...</p> : null}

      <ChartPicker
        open={pickerOpen}
        preferences={preferences}
        onClose={() => setPickerOpen(false)}
        onApply={onApplyPreferences}
        onSave={onSavePreferences}
      />
    </div>
  );
}
