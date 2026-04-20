'use client';

import { memo } from 'react';
import type { StatisticsChartVariant } from '@laundry/domain';

interface ChartPreviewThumbProps {
  label: string;
  description: string;
  variant: StatisticsChartVariant;
  active: boolean;
  onSelect: () => void;
}

function PreviewIcon({ variant }: { variant: StatisticsChartVariant }) {
  if (variant === 'treemap') {
    return (
      <svg viewBox="0 0 160 96" className="statistics-thumb-svg" aria-hidden>
        <rect x="6" y="8" width="68" height="42" rx="10" fill="#f59e0b" opacity="0.86" />
        <rect x="78" y="8" width="76" height="24" rx="10" fill="#3b82f6" opacity="0.82" />
        <rect x="78" y="36" width="32" height="48" rx="10" fill="#14b8a6" opacity="0.8" />
        <rect x="114" y="36" width="40" height="22" rx="10" fill="#a855f7" opacity="0.76" />
        <rect x="114" y="62" width="40" height="22" rx="10" fill="#f97316" opacity="0.76" />
        <rect x="6" y="54" width="68" height="30" rx="10" fill="#22c55e" opacity="0.72" />
      </svg>
    );
  }

  if (variant === 'barVertical' || variant === 'barHorizontal' || variant === 'barStacked') {
    const vertical = variant === 'barVertical';
    const stacked = variant === 'barStacked';
    return (
      <svg viewBox="0 0 160 96" className="statistics-thumb-svg" aria-hidden>
        <defs>
          <linearGradient id="thumbBar" x1="0" x2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        {vertical ? (
          <>
            <rect x="24" y="30" width="20" height="46" rx="7" fill="url(#thumbBar)" />
            <rect x="58" y="18" width="20" height="58" rx="7" fill="url(#thumbBar)" opacity="0.92" />
            <rect x="92" y="40" width="20" height="36" rx="7" fill="url(#thumbBar)" opacity="0.8" />
            <rect x="126" y="12" width="20" height="64" rx="7" fill="url(#thumbBar)" opacity="0.7" />
            {stacked ? (
              <>
                <rect x="24" y="16" width="20" height="14" rx="7" fill="#ffffff1f" />
                <rect x="58" y="8" width="20" height="10" rx="7" fill="#ffffff1f" />
              </>
            ) : null}
          </>
        ) : (
          <>
            <rect x="24" y="16" width="98" height="14" rx="7" fill="url(#thumbBar)" />
            <rect x="24" y="40" width="120" height="14" rx="7" fill="url(#thumbBar)" opacity="0.9" />
            <rect x="24" y="64" width="76" height="14" rx="7" fill="url(#thumbBar)" opacity="0.76" />
            {stacked ? <rect x="100" y="64" width="44" height="14" rx="7" fill="#ffffff1f" /> : null}
          </>
        )}
      </svg>
    );
  }

  if (variant === 'line' || variant === 'areaLine' || variant === 'smoothLine') {
    return (
      <svg viewBox="0 0 160 96" className="statistics-thumb-svg" aria-hidden>
        {variant !== 'line' ? (
          <path d="M8 76 C30 60, 42 62, 60 48 C82 34, 102 42, 118 32 C132 24, 144 16, 152 12 L152 84 L8 84 Z" fill="#f59e0b22" />
        ) : null}
        <path
          d={variant === 'smoothLine' ? 'M8 74 C28 60, 42 64, 60 48 C82 30, 104 44, 122 26 C134 16, 144 18, 152 12' : 'M8 74 L40 62 L68 50 L100 44 L124 28 L152 14'}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 96" className="statistics-thumb-svg" aria-hidden>
      <circle cx="80" cy="48" r="32" fill="none" stroke="#3b82f6" strokeWidth="18" opacity="0.42" />
      <path d="M80 16 A32 32 0 1 1 52 68" fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}

function ChartPreviewThumbComponent({ label, description, variant, active, onSelect }: ChartPreviewThumbProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`statistics-thumb ${active ? 'statistics-thumb-active' : ''}`}
    >
      <PreviewIcon variant={variant} />
      <div className="text-left">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">{description}</p>
      </div>
    </button>
  );
}

export const ChartPreviewThumb = memo(ChartPreviewThumbComponent);
