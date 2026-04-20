'use client';

import { memo } from 'react';
import type { StatsRange, StatisticsTypeFilter } from '@laundry/domain';

interface StatisticsFiltersHeaderProps {
  range: StatsRange;
  customStart: string;
  customEnd: string;
  typeFilter: StatisticsTypeFilter;
  onRangeChange: (value: StatsRange) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onTypeFilterChange: (value: StatisticsTypeFilter) => void;
}

function StatisticsFiltersHeaderComponent({
  range,
  customStart,
  customEnd,
  typeFilter,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
  onTypeFilterChange,
}: StatisticsFiltersHeaderProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="pill-switch glass-card-static">
          {(['7d', '30d', '90d', 'custom'] as StatsRange[]).map((value) => (
            <button key={value} className={range === value ? 'active' : ''} onClick={() => onRangeChange(value)}>
              {value === 'custom' ? 'Custom' : value}
            </button>
          ))}
        </div>

        {range === 'custom' ? (
          <>
            <input className="input input-sm w-auto" type="date" value={customStart} onChange={(event) => onCustomStartChange(event.target.value)} />
            <input className="input input-sm w-auto" type="date" value={customEnd} onChange={(event) => onCustomEndChange(event.target.value)} />
          </>
        ) : null}

        <div className="pill-switch glass-card-static">
          {(['Ambos', 'Serviços', 'Enxoval'] as StatisticsTypeFilter[]).map((value) => (
            <button key={value} className={typeFilter === value ? 'active' : ''} onClick={() => onTypeFilterChange(value)}>
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const StatisticsFiltersHeader = memo(StatisticsFiltersHeaderComponent);
