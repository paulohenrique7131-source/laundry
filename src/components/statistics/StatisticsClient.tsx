'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { getHistory } from '@/storage/db';
import { useToast } from '@/context/ToastContext';
import type { HistoryRecord } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const COLORS = [
    '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#e11d48', '#6366f1',
    '#eab308', '#22c55e', '#a855f7', '#f43f5e',
];

type Range = '7d' | '30d' | '90d' | 'custom';

export default function StatisticsClient() {
    const { toast } = useToast();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [range, setRange] = useState<Range>('30d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [typeFilter, setTypeFilter] = useState<'Ambos' | 'Serviços' | 'Enxoval'>('Ambos');

    const chartRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    const getDateRange = useCallback((): { start: string; end: string } => {
        const end = new Date().toISOString().slice(0, 10);
        if (range === 'custom') return { start: customStart, end: customEnd || end };
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const s = new Date();
        s.setDate(s.getDate() - days);
        return { start: s.toISOString().slice(0, 10), end };
    }, [range, customStart, customEnd]);

    const load = useCallback(async () => {
        const { start, end } = getDateRange();
        const data = await getHistory(start, end, typeFilter);
        setRecords(data);
    }, [getDateRange, typeFilter]);

    useEffect(() => { load(); }, [load]);

    // Compute cost by category
    const costByCategory = records.reduce<Record<string, number>>((acc, r) => {
        r.items.forEach((item) => {
            acc[item.name] = (acc[item.name] || 0) + (item.lineTotal || 0);
        });
        return acc;
    }, {});

    // Volume by category
    const volumeByCategory = records.reduce<Record<string, number>>((acc, r) => {
        r.items.forEach((item) => {
            const qty = (item.qtyLP || 0) + (item.qtyP || 0) + (item.qty || 0);
            acc[item.name] = (acc[item.name] || 0) + qty;
        });
        return acc;
    }, {});

    // Trend by day
    const trendByDay = records.reduce<Record<string, number>>((acc, r) => {
        acc[r.date] = (acc[r.date] || 0) + (r.total || 0);
        return acc;
    }, {});
    const trendDates = Object.keys(trendByDay).sort();

    const totalValue = records.reduce((s, r) => s + r.total, 0);
    const costLabels = Object.keys(costByCategory);
    const costValues = Object.values(costByCategory);
    const volLabels = Object.keys(volumeByCategory);
    const volValues = Object.values(volumeByCategory);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(255,255,255,0.7)',
                    font: { family: 'Inter', size: 11 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(26,26,46,0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
            },
        },
    };

    function printReport() {
        const canvases = document.querySelectorAll<HTMLCanvasElement>('.stats-chart canvas');
        const images = Array.from(canvases).map((c) => c.toDataURL('image/png'));

        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Estatísticas - Lavanderia</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',sans-serif; padding:40px; background:#fff; color:#1a1a2e; }
h1 { font-size:22px; margin-bottom:4px; }
.sub { color:#666; font-size:13px; margin-bottom:30px; }
.chart-container { margin-bottom:30px; page-break-inside:avoid; }
.chart-container h2 { font-size:16px; margin-bottom:10px; }
img { max-width:100%; height:auto; }
.total { font-size:20px; font-weight:800; color:#f59e0b; margin-top:20px; }
.btn { display:block; margin:20px auto 0; padding:10px 30px; background:#f59e0b; color:#000; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
@media print { .btn { display:none; } }
</style></head><body>
<h1>📊 Relatório de Estatísticas</h1>
<p class="sub">Período: ${getDateRange().start || 'Início'} — ${getDateRange().end} | Filtro: ${typeFilter}</p>
${images.map((src, i) => `<div class="chart-container"><h2>${['Custo por Categoria', 'Volume por Categoria', 'Tendência Diária'][i] || ''}</h2><img src="${src}" /></div>`).join('')}
<div class="total">Valor total das peças: R$ ${totalValue.toFixed(2)}</div>
<button class="btn" onclick="window.print()">🖨️ Imprimir</button>
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Estatísticas</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Análise de custos e volumes</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="pill-switch glass-card-static">
                        {(['7d', '30d', '90d', 'custom'] as Range[]).map((r) => (
                            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
                                {r === 'custom' ? 'Custom' : r}
                            </button>
                        ))}
                    </div>
                    {range === 'custom' && (
                        <>
                            <input className="input input-sm w-auto" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                            <input className="input input-sm w-auto" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                        </>
                    )}
                    <div className="pill-switch glass-card-static">
                        {(['Ambos', 'Serviços', 'Enxoval'] as const).map((t) => (
                            <button key={t} className={typeFilter === t ? 'active' : ''} onClick={() => setTypeFilter(t)}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Total value */}
            <div className="glass-card p-6">
                <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-1">Valor total das peças no período</p>
                <p className="text-3xl font-bold text-gradient">R$ {totalValue.toFixed(2)}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{records.length} registro(s) encontrado(s)</p>
            </div>

            {/* Charts */}
            {records.length === 0 ? (
                <div className="glass-card p-12 text-center text-[var(--text-muted)]">
                    <p className="text-3xl mb-3">📈</p>
                    <p>Nenhum dado para exibir no período selecionado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doughnut: cost by category */}
                    <div className="glass-card p-6 stats-chart">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Custo por Categoria</h3>
                        <div style={{ height: 320 }}>
                            <Doughnut
                                data={{
                                    labels: costLabels,
                                    datasets: [{
                                        data: costValues,
                                        backgroundColor: COLORS.slice(0, costLabels.length),
                                        borderWidth: 0,
                                    }],
                                }}
                                options={{
                                    ...chartOptions,
                                    cutout: '60%',
                                    plugins: {
                                        ...chartOptions.plugins,
                                        legend: { ...chartOptions.plugins.legend, position: 'right' as const },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* Bar: volume by category */}
                    <div className="glass-card p-6 stats-chart">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Volume por Categoria</h3>
                        <div style={{ height: 320 }}>
                            <Bar
                                data={{
                                    labels: volLabels,
                                    datasets: [{
                                        label: 'Quantidade',
                                        data: volValues,
                                        backgroundColor: COLORS.slice(0, volLabels.length).map(c => c + '80'),
                                        borderColor: COLORS.slice(0, volLabels.length),
                                        borderWidth: 1,
                                        borderRadius: 6,
                                    }],
                                }}
                                options={{
                                    ...chartOptions,
                                    plugins: { ...chartOptions.plugins, legend: { display: false } },
                                    scales: {
                                        x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                        y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* Line: trend */}
                    <div className="glass-card p-6 lg:col-span-2 stats-chart">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Tendência Diária</h3>
                        <div style={{ height: 280 }}>
                            <Line
                                data={{
                                    labels: trendDates,
                                    datasets: [{
                                        label: 'Total (R$)',
                                        data: trendDates.map((d) => trendByDay[d]),
                                        borderColor: '#f59e0b',
                                        backgroundColor: 'rgba(245,158,11,0.1)',
                                        fill: true,
                                        tension: 0.4,
                                        pointBackgroundColor: '#f59e0b',
                                        pointBorderColor: '#f59e0b',
                                        pointRadius: 4,
                                    }],
                                }}
                                options={{
                                    ...chartOptions,
                                    plugins: { ...chartOptions.plugins, legend: { display: false } },
                                    scales: {
                                        x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                        y: { ticks: { color: 'rgba(255,255,255,0.5)', callback: (v) => `R$ ${v}` }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Print */}
            <div className="flex gap-3">
                <button className="btn btn-primary btn-sm" onClick={printReport} disabled={records.length === 0}>
                    🖨️ Imprimir Relatório
                </button>
            </div>
        </div>
    );
}
