'use client';

import { memo } from 'react';

interface StatisticsSummaryCardProps {
  totalValue: number;
  recordCount: number;
  isRefreshing: boolean;
}

function StatisticsSummaryCardComponent({ totalValue, recordCount, isRefreshing }: StatisticsSummaryCardProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
      <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-1">Valor total das peças no período</p>
          <p className="text-3xl font-bold text-gradient">R$ {totalValue.toFixed(2)}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{recordCount} registro(s) encontrado(s)</p>
        </div>
        <span className={`statistics-live-pill ${isRefreshing ? 'statistics-live-pill-active' : ''}`}>
          {isRefreshing ? 'Atualizando' : 'Atualizado'}
        </span>
      </div>
    </div>
  );
}

export const StatisticsSummaryCard = memo(StatisticsSummaryCardComponent);
