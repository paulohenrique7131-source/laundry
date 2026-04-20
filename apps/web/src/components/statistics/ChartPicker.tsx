'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_STATISTICS_PREFERENCES,
  STATISTICS_FAMILY_LABELS,
  sanitizeStatisticsPreferences,
  type StatisticsChartFamily,
  type StatisticsPreferences,
} from '@laundry/domain';
import { Modal } from '@/components/ui/Modal';
import { ChartPreviewThumb } from './ChartPreviewThumb';
import { CHART_VARIANTS_BY_FAMILY } from './chart-config';

interface ChartPickerProps {
  open: boolean;
  preferences: StatisticsPreferences;
  onClose: () => void;
  onApply: (preferences: StatisticsPreferences) => void;
  onSave: (preferences: StatisticsPreferences) => void;
}

function moveOrder(order: StatisticsChartFamily[], family: StatisticsChartFamily, direction: -1 | 1) {
  const index = order.indexOf(family);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return order;
  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function ChartPicker({ open, preferences, onClose, onApply, onSave }: ChartPickerProps) {
  const [draft, setDraft] = useState<StatisticsPreferences>(preferences);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(preferences);
      setError(null);
    }
  }, [open, preferences]);

  const orderedFamilies = useMemo(() => draft.chartOrder, [draft.chartOrder]);

  const toggleFamilyVisibility = (family: StatisticsChartFamily) => {
    setDraft((current) => {
      const isVisible = current.visibleCharts.includes(family);
      const visibleCharts = isVisible
        ? current.visibleCharts.filter((value) => value !== family)
        : [...current.visibleCharts, family];
      return sanitizeStatisticsPreferences({ ...current, visibleCharts });
    });
  };

  const handleApply = (persist: boolean) => {
    if (draft.visibleCharts.length === 0) {
      setError('Selecione pelo menos um bloco para manter visível.');
      return;
    }

    const next = sanitizeStatisticsPreferences(draft);
    if (persist) onSave(next);
    else onApply(next);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Personalizar gráficos" large>
      <div className="space-y-6">
        <div className="statistics-picker-head">
          <div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Escolha quais blocos aparecem por padrão, troque o visual de cada família e ajuste a ordem sem mexer no topo atual.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm shrink-0 min-w-[148px]"
            onClick={() => {
              setDraft(DEFAULT_STATISTICS_PREFERENCES);
              setError(null);
            }}
          >
            Resetar padrão
          </button>
        </div>

        {orderedFamilies.map((family, index) => {
          const isVisible = draft.visibleCharts.includes(family);
          return (
            <section key={family} className="statistics-picker-group">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{STATISTICS_FAMILY_LABELS[family]}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Defina o visual padrão e a posição deste bloco.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-secondary btn-xs" onClick={() => setDraft((current) => ({ ...current, chartOrder: moveOrder(current.chartOrder, family, -1) }))} disabled={index === 0}>
                    Subir
                  </button>
                  <button type="button" className="btn btn-secondary btn-xs" onClick={() => setDraft((current) => ({ ...current, chartOrder: moveOrder(current.chartOrder, family, 1) }))} disabled={index === orderedFamilies.length - 1}>
                    Descer
                  </button>
                  <button type="button" className={`btn btn-xs ${isVisible ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleFamilyVisibility(family)}>
                    {isVisible ? 'Visível' : 'Oculto'}
                  </button>
                </div>
              </div>

              <div className="statistics-thumbs-grid">
                {CHART_VARIANTS_BY_FAMILY[family].map((variant) => (
                  <ChartPreviewThumb
                    key={variant.value}
                    label={variant.label}
                    description={variant.description}
                    variant={variant.value}
                    active={draft.variants[family] === variant.value}
                    onSelect={() => setDraft((current) => ({
                      ...current,
                      variants: { ...current.variants, [family]: variant.value },
                    }))}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApply(false)}>Aplicar agora</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleApply(true)}>Salvar como padrão</button>
        </div>
      </div>
    </Modal>
  );
}
