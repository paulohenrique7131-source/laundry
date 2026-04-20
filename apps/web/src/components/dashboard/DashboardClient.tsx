'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter, useSearchParams } from 'next/navigation';
import { getHistory, updateHistory, deleteHistory, clearHistory, getNotes, addNote } from '@/storage/db';
import { useToast } from '@/context/ToastContext';
import { Modal, Confirm } from '@/components/ui/Modal';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { HistoryRecord, Note } from '@/types';

type SortKey = 'date' | 'type' | 'total';
type SortDir = 'asc' | 'desc';

export default function DashboardClient() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [typeFilter, setTypeFilter] = useState<'Ambos' | 'Servi\u00E7os' | 'Enxoval'>('Ambos');

    // Sort
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Detail modal
    const [selected, setSelected] = useState<HistoryRecord | null>(null);
    const [editing, setEditing] = useState(false);
    const [editRecord, setEditRecord] = useState<HistoryRecord | null>(null);

    // Confirm delete
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [clearConfirm, setClearConfirm] = useState(false);
    const [pinningNoteId, setPinningNoteId] = useState<string | null>(null);
    const recordIdParam = searchParams.get('recordId');

    const load = useCallback(async () => {
        setLoading(true);
        const [historyData, notesData] = await Promise.all([
            getHistory(startDate || undefined, endDate || undefined, typeFilter),
            getNotes(),
        ]);
        setRecords(historyData);
        setLinkedNotes(notesData.filter((note) => Boolean(note.relatedRecordId)));
        setLoading(false);
    }, [startDate, endDate, typeFilter]);

    useEffect(() => { load(); }, [load]);

    // Sorting
    const sorted = [...records].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
        else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
        else cmp = a.total - b.total;
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const linkedNoteByRecordId = useMemo(() => {
        const map = new Map<string, Note>();
        for (const note of linkedNotes) {
            if (!note.relatedRecordId || map.has(note.relatedRecordId)) continue;
            map.set(note.relatedRecordId, note);
        }
        return map;
    }, [linkedNotes]);

    useEffect(() => {
        if (!recordIdParam || loading) return;
        const target = records.find((record) => record.id === recordIdParam);
        if (!target) return;
        setSelected(target);
        setEditing(false);
    }, [recordIdParam, records, loading]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    }

    const sortIcon = (key: SortKey) => {
        if (sortKey !== key) return '-';
        return sortDir === 'asc' ? '^' : 'v';
    };

    // Delete
    async function confirmDelete() {
        if (deleteId) {
            await deleteHistory(deleteId);
            setDeleteId(null);
            setSelected(null);
            load();
            toast('Registro excluido');
        }
    }

    // Clear
    async function handleClear() {
        await clearHistory(startDate || undefined, endDate || undefined, typeFilter);
        setClearConfirm(false);
        load();
        toast('Registros limpos');
    }

    // Edit save
    async function handleEditSave() {
        if (!editRecord) return;
        // Recalc
        const sub = editRecord.items.reduce((s, i) => s + i.lineTotal, 0);
        const mult = editRecord.type === 'Servi\u00E7os' ? ({ Normal: 1, Expresso: 1.5, Urgente: 2 }[editRecord.serviceType] || 1) : 1;
        const tot = sub * mult;
        const updated = { ...editRecord, subtotal: sub, multiplier: mult, total: tot, updatedAt: new Date().toISOString() };
        await updateHistory(updated);
        setEditing(false);
        setSelected(updated);
        setEditRecord(null);
        load();
        toast('Registro atualizado!');
    }

    async function upsertLinkedBoardNote(record: HistoryRecord, openAfter = false) {
        if (!record.notes?.trim()) {
            toast('Este registro não possui observações para fixar.', 'error');
            return;
        }

        try {
            setPinningNoteId(record.id);
            const noteId = await addNote({
                id: uuidv4(),
                content: `Referente ao registro de ${record.date} (${record.type}):\n${record.notes}`,
                authorId: record.authorId || 'unknown',
                authorRole: (record.author === 'Gerência' ? 'manager' : 'gov'),
                visibility: 'private',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                relatedRecordId: record.id,
            });

            toast(linkedNoteByRecordId.has(record.id) ? 'Nota vinculada atualizada no quadro.' : 'Nota criada no quadro!');
            await load();

            if (openAfter && noteId) {
                router.push(`/notes?noteId=${noteId}&recordId=${record.id}`);
            }
        } finally {
            setPinningNoteId(null);
        }
    }

    // Print record
    function printRecord(rec: HistoryRecord) {
        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatorio - Washly</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',sans-serif; padding:40px; background:#fff; color:#1a1a2e; }
h1 { font-size:22px; margin-bottom:4px; }
.sub { color:#666; font-size:13px; margin-bottom:20px; }
table { width:100%; border-collapse:collapse; margin-bottom:20px; }
th { background:#1a1a2e; color:#fff; padding:10px 14px; text-align:left; font-size:12px; text-transform:uppercase; }
td { padding:8px 14px; border-bottom:1px solid #eee; font-size:13px; }
.total-row { font-size:18px; font-weight:800; color:#f59e0b; border-top:2px solid #f59e0b; padding-top:10px; margin-top:10px; display:flex; justify-content:space-between; }
.btn { display:block; margin:20px auto 0; padding:10px 30px; background:#f59e0b; color:#000; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; }
@media print { .btn { display:none; } }
</style></head><body>
<h1>Relatorio de ${rec.type}</h1>
<p class="sub">Data: ${rec.date} | Tipo: ${rec.serviceType} | Criado: ${new Date(rec.createdAt).toLocaleString('pt-BR')}</p>
<table><thead><tr><th>Item</th><th>Qtd</th><th>Preco Unit.</th><th>Total</th></tr></thead>
<tbody>${rec.items.map(i => {
            if (i.priceLP !== undefined) {
                const rows: string[] = [];
                if ((i.qtyLP || 0) > 0) rows.push(`<tr><td>${i.name} (LP)</td><td>${i.qtyLP}</td><td>R$ ${(i.priceLP || 0).toFixed(2)}</td><td>R$ ${((i.priceLP || 0) * (i.qtyLP || 0)).toFixed(2)}</td></tr>`);
                if (i.priceP !== null && (i.qtyP || 0) > 0) rows.push(`<tr><td>${i.name} (P)</td><td>${i.qtyP}</td><td>R$ ${(i.priceP || 0).toFixed(2)}</td><td>R$ ${((i.priceP || 0) * (i.qtyP || 0)).toFixed(2)}</td></tr>`);
                return rows.join('');
            }
            return `<tr><td>${i.name}</td><td>${i.qty || 0}</td><td>R$ ${(i.price || 0).toFixed(2)}</td><td>R$ ${i.lineTotal.toFixed(2)}</td></tr>`;
        }).join('')}</tbody></table>
<div class="total-row"><span>TOTAL</span><span>R$ ${rec.total.toFixed(2)}</span></div>
<button class="btn" onclick="window.print()">Imprimir</button>
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    }

    // Consolidated
    function generateConsolidated() {
        if (sorted.length === 0) { toast('Nenhum registro para consolidar', 'error'); return; }
        const grandTotal = sorted.reduce((s, r) => s + r.total, 0);
        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Consolidado - Washly</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',sans-serif; padding:40px; background:#fff; color:#1a1a2e; }
h1 { font-size:22px; margin-bottom:20px; }
table { width:100%; border-collapse:collapse; margin-bottom:20px; }
th { background:#1a1a2e; color:#fff; padding:10px 14px; text-align:left; font-size:12px; text-transform:uppercase; }
td { padding:8px 14px; border-bottom:1px solid #eee; font-size:13px; }
.grand { font-size:20px; font-weight:800; color:#f59e0b; text-align:right; margin-top:20px; }
.btn { display:block; margin:20px auto 0; padding:10px 30px; background:#f59e0b; color:#000; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; }
@media print { .btn { display:none; } }
</style></head><body>
<h1>Consolidado - Washly</h1>
<p style="color:#666;margin-bottom:20px;">Periodo: ${startDate || 'Inicio'} - ${endDate || 'Fim'} | Filtro: ${typeFilter}</p>
<table><thead><tr><th>Data</th><th>Tipo</th><th>Servico</th><th>Itens</th><th>Total</th></tr></thead>
<tbody>${sorted.map(r => `<tr><td>${r.date}</td><td>${r.type}</td><td>${r.serviceType}</td><td>${r.items.length} itens</td><td>R$ ${r.total.toFixed(2)}</td></tr>`).join('')}</tbody></table>
<div class="grand">TOTAL GERAL: R$ ${grandTotal.toFixed(2)}</div>
<button class="btn" onclick="window.print()">Imprimir</button>
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    }

    // Backup PDF
    async function generateBackupPDF() {
        if (sorted.length === 0) { toast('Nenhum registro para backup', 'error'); return; }
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Washly - Backup', 14, 20);
        doc.setFontSize(10);
        doc.text(`Periodo: ${startDate || 'Inicio'} - ${endDate || 'Fim'} | Filtro: ${typeFilter}`, 14, 28);
        doc.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

        autoTable(doc, {
            startY: 42,
            head: [['Data', 'Tipo', 'Servico', 'Itens', 'Total']],
            body: sorted.map(r => [r.date, r.type, r.serviceType, `${r.items.length} itens`, `R$ ${r.total.toFixed(2)}`]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [26, 26, 46] },
        });

        const grandTotal = sorted.reduce((s, r) => s + r.total, 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = ((doc as any).lastAutoTable?.finalY as number) || 100;
        doc.setFontSize(14);
        doc.setTextColor(245, 158, 11);
        doc.text(`TOTAL: R$ ${grandTotal.toFixed(2)}`, 14, finalY + 12);

        doc.save(`backup_washly_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast('PDF gerado com sucesso!');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Historico de registros</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Periodo</label>
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onChangeStart={setStartDate}
                            onChangeEnd={setEndDate}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Tipo</label>
                        <select className="input input-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
                            <option value="Ambos">Ambos</option>
                            <option value={'Servi\u00E7os'}>Servicos</option>
                            <option value="Enxoval">Enxoval</option>
                        </select>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={load}>Buscar</button>
                </div>
            </div>

            {/* Records Table */}
            <div className="glass-card p-0 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-10"><div className="spinner" /></div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        <p className="text-3xl mb-3 font-bold">[]</p>
                        <p>Nenhum registro encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
                                        Data {sortIcon('date')}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => toggleSort('type')}>
                                        Tipo {sortIcon('type')}
                                    </th>
                                    <th>Servico</th>
                                    <th>Itens</th>
                                    <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('total')}>
                                        Total {sortIcon('total')}
                                    </th>
                                    <th className="text-center">Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((rec) => (
                                    <tr key={rec.id} className="cursor-pointer" onClick={() => { setSelected(rec); setEditing(false); }}>
                                        <td className="font-medium">{rec.date}</td>
                                        <td>
                                            <span className={`badge ${rec.type === 'Servi\u00E7os' ? 'badge-amber' : 'badge-sky'}`}>{rec.type}</span>
                                        </td>
                                        <td className="text-[var(--text-secondary)]">{rec.serviceType}</td>
                                        <td className="text-[var(--text-secondary)]">{rec.items.length} itens</td>
                                        <td className="text-right font-semibold tabular-nums text-[var(--accent)]">R$ {rec.total.toFixed(2)}</td>
                                        <td className="text-center">
                                            <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setDeleteId(rec.id); }}>
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Buttons Removed as per user request */}

            {/* Detail Modal */}
            {selected && !editing && (
                <Modal open={true} onClose={() => setSelected(null)} title={`Registro - ${selected.date}`} large>
                    <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap items-center justify-between">
                            <div className="flex gap-2">
                                <span className={`badge ${selected.type === 'Servi\u00E7os' ? 'badge-amber' : 'badge-sky'}`}>{selected.type}</span>
                                <span className="badge badge-emerald">{selected.serviceType}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-[var(--text-muted)]">ID: {selected.id.slice(0, 8)}</span>
                                {selected.author && (
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                                        Por: <span className="text-[var(--text-secondary)] font-medium">{selected.author}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notes Section */}
                        {selected.notes && (
                            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-lg relative group">
                                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Observações</p>
                                <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => {
                                        const linkedNote = linkedNoteByRecordId.get(selected.id);
                                        if (linkedNote) {
                                            router.push(`/notes?noteId=${linkedNote.id}&recordId=${selected.id}`);
                                            return;
                                        }
                                        void upsertLinkedBoardNote(selected, true);
                                    }}
                                >
                                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{selected.notes}</p>
                                </button>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        className="btn btn-secondary btn-xs"
                                        onClick={() => {
                                            const linkedNote = linkedNoteByRecordId.get(selected.id);
                                            if (linkedNote) {
                                                router.push(`/notes?noteId=${linkedNote.id}&recordId=${selected.id}`);
                                                return;
                                            }
                                            void upsertLinkedBoardNote(selected, true);
                                        }}
                                    >
                                        {linkedNoteByRecordId.has(selected.id) ? 'Abrir nota no quadro' : 'Fixar e abrir no quadro'}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-xs text-amber-500 hover:bg-amber-500/20"
                                        title="Salvar como Nota no Quadro"
                                        disabled={pinningNoteId === selected.id}
                                        onClick={() => void upsertLinkedBoardNote(selected)}
                                    >
                                        {pinningNoteId === selected.id ? 'Salvando...' : linkedNoteByRecordId.has(selected.id) ? 'Atualizar nota vinculada' : 'Fixar no quadro'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-center">Qtd</th>
                                        <th className="text-right">Preço Unit.</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected.items.map((item, idx) => (
                                        <React.Fragment key={idx}>
                                            {item.priceLP !== undefined ? (
                                                <>
                                                    {(item.qtyLP || 0) > 0 && (
                                                        <tr>
                                                            <td>{item.name} (LP)</td>
                                                            <td className="text-center">{item.qtyLP}</td>
                                                            <td className="text-right">R$ {(item.priceLP || 0).toFixed(2)}</td>
                                                            <td className="text-right">R$ {((item.priceLP || 0) * (item.qtyLP || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    )}
                                                    {item.priceP !== null && (item.qtyP || 0) > 0 && (
                                                        <tr>
                                                            <td>{item.name} (P)</td>
                                                            <td className="text-center">{item.qtyP}</td>
                                                            <td className="text-right">R$ {(item.priceP || 0).toFixed(2)}</td>
                                                            <td className="text-right">R$ {((item.priceP || 0) * (item.qtyP || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    )}
                                                </>
                                            ) : (
                                                <tr>
                                                    <td>{item.name}</td>
                                                    <td className="text-center">{item.qty}</td>
                                                    <td className="text-right">R$ {(item.price || 0).toFixed(2)}</td>
                                                    <td className="text-right">R$ {item.lineTotal.toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="summary-row total">
                            <span>TOTAL</span>
                            <span>R$ {selected.total.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => printRecord(selected)}>Imprimir</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditRecord({ ...selected }); setEditing(true); }}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(selected.id)}>Excluir</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Modal */}
            {editing && editRecord && (
                <Modal open={true} onClose={() => { setEditing(false); setEditRecord(null); }} title="Editar Registro" large>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Data</label>
                                <input className="input input-sm" type="date" value={editRecord.date} onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Tipo Serviço</label>
                                <select className="input input-sm" value={editRecord.serviceType} onChange={(e) => setEditRecord({ ...editRecord, serviceType: e.target.value as HistoryRecord['serviceType'] })}>
                                    <option value="Normal">Normal</option>
                                    <option value="Expresso">Expresso</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                            {editRecord.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 glass-card-static p-3 rounded-xl">
                                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                                    {item.priceLP !== undefined ? (
                                        <>
                                            <div className="text-center">
                                                <label className="text-[10px] text-[var(--text-muted)]">LP</label>
                                                <input className="input input-sm w-16 mt-0.5" type="number" min="0"
                                                    value={item.qtyLP || 0}
                                                    onChange={(e) => {
                                                        const items = [...editRecord.items];
                                                        const q = parseInt(e.target.value) || 0;
                                                        items[idx] = { ...items[idx], qtyLP: q, lineTotal: (items[idx].priceLP || 0) * q + (items[idx].priceP !== null ? (items[idx].priceP || 0) * (items[idx].qtyP || 0) : 0) };
                                                        setEditRecord({ ...editRecord, items });
                                                    }} />
                                            </div>
                                            {item.priceP !== null && (
                                                <div className="text-center">
                                                    <label className="text-[10px] text-[var(--text-muted)]">P</label>
                                                    <input className="input input-sm w-16 mt-0.5" type="number" min="0"
                                                        value={item.qtyP || 0}
                                                        onChange={(e) => {
                                                            const items = [...editRecord.items];
                                                            const q = parseInt(e.target.value) || 0;
                                                            items[idx] = { ...items[idx], qtyP: q, lineTotal: (items[idx].priceLP || 0) * (items[idx].qtyLP || 0) + (items[idx].priceP || 0) * q };
                                                            setEditRecord({ ...editRecord, items });
                                                        }} />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <label className="text-[10px] text-[var(--text-muted)]">Qtd</label>
                                            <input className="input input-sm w-16 mt-0.5" type="number" min="0"
                                                value={item.qty || 0}
                                                onChange={(e) => {
                                                    const items = [...editRecord.items];
                                                    const q = parseInt(e.target.value) || 0;
                                                    items[idx] = { ...items[idx], qty: q, lineTotal: (items[idx].price || 0) * q };
                                                    setEditRecord({ ...editRecord, items });
                                                }} />
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold tabular-nums w-24 text-right">R$ {item.lineTotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setEditRecord(null); }}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleEditSave}>Salvar</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete confirm */}
            <Confirm
                open={!!deleteId}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                title="Excluir Registro"
                message="Tem certeza que deseja excluir este registro? Esta acao nao pode ser desfeita."
                danger
                confirmText="Excluir"
            />

            {/* Clear confirm */}
            <Confirm
                open={clearConfirm}
                onConfirm={handleClear}
                onCancel={() => setClearConfirm(false)}
                title="Limpar Registros"
                message={`Isso vai excluir TODOS os registros do periodo filtrado (${sorted.length} registros). Esta acao e irreversivel!`}
                danger
                confirmText="Limpar Tudo"
            />
        </div>
    );
}


