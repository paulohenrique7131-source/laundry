'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
import type { EChartsOption } from 'echarts';

const EChartRenderer = dynamic(() => import('./EChartRenderer'), {
  ssr: false,
  loading: () => <div className="statistics-chart-surface animate-pulse" />,
});

interface ChartCardProps {
  title: string;
  subtitle: string;
  option: EChartsOption;
  hasData: boolean;
  emptyMessage: string;
}

function ChartCardComponent({ title, subtitle, option, hasData, emptyMessage }: ChartCardProps) {
  return (
    <section className="glass-card p-6 flex flex-col gap-4 min-h-[360px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{title}</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-2">{subtitle}</h3>
        </div>
      </div>

      {hasData ? (
        <div className="statistics-chart-surface" data-statistics-chart>
          <EChartRenderer option={option} />
        </div>
      ) : (
        <div className="statistics-chart-empty">
          <span className="text-2xl">\u25cc</span>
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

export const ChartCard = memo(ChartCardComponent);
