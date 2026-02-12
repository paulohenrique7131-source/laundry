'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { getConfig, addHistory } from '@/storage/db';
import { MULTIPLIERS } from '@/data/defaults';
import { ItemsModal } from '@/components/calculator/ItemsModal';
import { Modal, Confirm } from '@/components/ui/Modal';
import type {
    ServiceItem, TrousseauItem, CatalogType, ServiceType,
    CalcLineService, CalcLineTrousseau, HistoryRecord, HistoryItemDetail
} from '@/types';

function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="qty-control">
            <button onClick={() => onChange(Math.max(0, value - 1))} aria-label="Diminuir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <button onClick={() => onChange(value + 1)} aria-label="Aumentar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    );
}

export default function CalculatorClient() {
    const { settings, updateSettings } = useApp();
    const { toast } = useToast();

    const [catalog, setCatalog] = useState<CatalogType>(settings.lastCatalog || 'services');
    const [serviceType, setServiceType] = useState<ServiceType>(settings.lastServiceType || 'Normal');

    // Catalog items
    const [svcItems, setSvcItems] = useState<ServiceItem[]>([]);
    const [trsItems, setTrsItems] = useState<TrousseauItem[]>([]);

    // Quantity state
    const [svcLines, setSvcLines] = useState<Map<string, { qtyLP: number; qtyP: number }>>(new Map());
    const [trsLines, setTrsLines] = useState<Map<string, number>>(new Map());

    // Extra items (temporary)
    const [extraSvc, setExtraSvc] = useState<CalcLineService[]>([]);
    const [extraTrs, setExtraTrs] = useState<CalcLineTrousseau[]>([]);

    // Modals
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [extraModalOpen, setExtraModalOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveDate, setSaveDate] = useState(new Date().toISOString().slice(0, 10));
    const [confirmNewOpen, setConfirmNewOpen] = useState(false);

    // Extra form
    const [extraName, setExtraName] = useState('');
    const [extraPriceLP, setExtraPriceLP] = useState('');
    const [extraPriceP, setExtraPriceP] = useState('');
    const [extraPrice, setExtraPrice] = useState('');
    const [makePermanent, setMakePermanent] = useState(false);

    // Load catalog items
    const loadItems = useCallback(async () => {
        const c1 = await getConfig('c1_items') as ServiceItem[];
        const c2 = await getConfig('c2_items') as TrousseauItem[];
        setSvcItems(c1);
        setTrsItems(c2);
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    // Update settings when catalog changes
    useEffect(() => {
        updateSettings({ lastCatalog: catalog, lastServiceType: serviceType });
    }, [catalog, serviceType]);

    // ===== CALCULATIONS =====
    const multiplier = catalog === 'services' ? (MULTIPLIERS[serviceType] || 1) : 1;

    const svcSubtotal = useMemo(() => {
        let total = 0;
        svcItems.forEach((item) => {
            const line = svcLines.get(item.id);
            if (line) {
                total += item.priceLP * (line.qtyLP || 0);
                if (item.priceP !== null) total += item.priceP * (line.qtyP || 0);
            }
        });
        extraSvc.forEach((ex) => {
            total += ex.priceLP * ex.qtyLP;
            if (ex.priceP !== null) total += ex.priceP * ex.qtyP;
        });
        return total;
    }, [svcItems, svcLines, extraSvc]);

    const trsSubtotal = useMemo(() => {
        let total = 0;
        trsItems.forEach((item) => {
            const qty = trsLines.get(item.id) || 0;
            total += item.price * qty;
        });
        extraTrs.forEach((ex) => {
            total += ex.price * ex.qty;
        });
        return total;
    }, [trsItems, trsLines, extraTrs]);

    const subtotal = catalog === 'services' ? svcSubtotal : trsSubtotal;
    const additionalAmount = catalog === 'services' && multiplier > 1 ? subtotal * (multiplier - 1) : 0;
    const total = subtotal + additionalAmount;

    // ===== HANDLERS =====
    function updateSvcQty(itemId: string, field: 'qtyLP' | 'qtyP', value: number) {
        setSvcLines((prev) => {
            const n = new Map(prev);
            const current = n.get(itemId) || { qtyLP: 0, qtyP: 0 };
            n.set(itemId, { ...current, [field]: value });
            return n;
        });
    }

    function updateTrsQty(itemId: string, value: number) {
        setTrsLines((prev) => {
            const n = new Map(prev);
            n.set(itemId, value);
            return n;
        });
    }

    function handleNewSheet() {
        setConfirmNewOpen(true);
    }

    function confirmNewSheet() {
        setSvcLines(new Map());
        setTrsLines(new Map());
        setExtraSvc([]);
        setExtraTrs([]);
        setServiceType('Normal');
        setConfirmNewOpen(false);
        toast('Nova planilha criada', 'info');
    }

    async function handleAddExtra() {
        if (!extraName.trim()) { toast('Nome obrigat├│rio', 'error'); return; }

        if (catalog === 'services') {
            const newExtra: CalcLineService = {
                itemId: 'extra_' + Date.now().toString(36),
                name: extraName,
                priceLP: parseFloat(extraPriceLP) || 0,
                priceP: extraPriceP === '' ? null : parseFloat(extraPriceP) || 0,
                qtyLP: 1,
                qtyP: 0,
                isExtra: true,
            };
            setExtraSvc((prev) => [...prev, newExtra]);

            if (makePermanent) {
                const item: ServiceItem = {
                    id: newExtra.itemId,
                    name: newExtra.name,
                    priceLP: newExtra.priceLP,
                    priceP: newExtra.priceP,
                };
                const current = [...svcItems, item];
                setSvcItems(current);
                await import('@/storage/db').then(({ setConfig }) => setConfig('c1_items', current));
            }
        } else {
            const newExtra: CalcLineTrousseau = {
                itemId: 'extra_' + Date.now().toString(36),
                name: extraName,
                price: parseFloat(extraPrice) || 0,
                qty: 1,
                isExtra: true,
            };
            setExtraTrs((prev) => [...prev, newExtra]);

            if (makePermanent) {
                const item: TrousseauItem = {
                    id: newExtra.itemId,
                    name: newExtra.name,
                    price: newExtra.price,
                };
                const current = [...trsItems, item];
                setTrsItems(current);
                await import('@/storage/db').then(({ setConfig }) => setConfig('c2_items', current));
            }
        }

        setExtraModalOpen(false);
        setExtraName('');
        setExtraPriceLP('');
        setExtraPriceP('');
        setExtraPrice('');
        setMakePermanent(false);
        toast(makePermanent ? 'Item adicionado e salvo no cat├ílogo!' : 'Item extra adicionado!');
    }

    async function handleSave() {
        const items: HistoryItemDetail[] = [];

        if (catalog === 'services') {
            svcItems.forEach((item) => {
                const line = svcLines.get(item.id);
                if (line && (line.qtyLP > 0 || line.qtyP > 0)) {
                    items.push({
                        itemId: item.id,
                        name: item.name,
                        priceLP: item.priceLP,
                        priceP: item.priceP,
                        qtyLP: line.qtyLP,
                        qtyP: line.qtyP,
                        lineTotal: item.priceLP * line.qtyLP + (item.priceP !== null ? item.priceP * line.qtyP : 0),
                    });
                }
            });
            extraSvc.forEach((ex) => {
                if (ex.qtyLP > 0 || ex.qtyP > 0) {
                    items.push({
                        itemId: ex.itemId,
                        name: ex.name,
                        priceLP: ex.priceLP,
                        priceP: ex.priceP,
                        qtyLP: ex.qtyLP,
                        qtyP: ex.qtyP,
                        lineTotal: ex.priceLP * ex.qtyLP + (ex.priceP !== null ? ex.priceP * ex.qtyP : 0),
                    });
                }
            });
        } else {
            trsItems.forEach((item) => {
                const qty = trsLines.get(item.id) || 0;
                if (qty > 0) {
                    items.push({
                        itemId: item.id,
                        name: item.name,
                        price: item.price,
                        qty,
                        lineTotal: item.price * qty,
                    });
                }
            });
            extraTrs.forEach((ex) => {
                if (ex.qty > 0) {
                    items.push({
                        itemId: ex.itemId,
                        name: ex.name,
                        price: ex.price,
                        qty: ex.qty,
                        lineTotal: ex.price * ex.qty,
                    });
                }
            });
        }

        if (items.length === 0) {
            toast('Nenhum item com quantidade', 'error');
            return;
        }

        const record: HistoryRecord = {
            id: uuidv4(),
            date: saveDate,
            type: catalog === 'services' ? 'Servi├ºos' : 'Enxoval',
            serviceType: catalog === 'services' ? serviceType : 'Normal',
            items,
            subtotal,
            multiplier,
            total,
            createdAt: new Date().toISOString(),
        };

        await addHistory(record);
        setSaveModalOpen(false);

        // Reset
        setSvcLines(new Map());
        setTrsLines(new Map());
        setExtraSvc([]);
        setExtraTrs([]);
        setServiceType('Normal');
        toast('Registro salvo com sucesso! Ô£¿');
    }

    function generateComanda() {
        const items: { name: string; qty: string; unitPrice: string; total: string }[] = [];

        if (catalog === 'services') {
            svcItems.forEach((item) => {
                const line = svcLines.get(item.id);
                if (line) {
                    if (line.qtyLP > 0) {
                        items.push({
                            name: `${item.name} (LP)`,
                            qty: String(line.qtyLP),
                            unitPrice: `R$ ${item.priceLP.toFixed(2)}`,
                            total: `R$ ${(item.priceLP * line.qtyLP).toFixed(2)}`,
                        });
                    }
                    if (item.priceP !== null && line.qtyP > 0) {
                        items.push({
                            name: `${item.name} (P)`,
                            qty: String(line.qtyP),
                            unitPrice: `R$ ${item.priceP.toFixed(2)}`,
                            total: `R$ ${(item.priceP * line.qtyP).toFixed(2)}`,
                        });
                    }
                }
            });
            extraSvc.forEach((ex) => {
                if (ex.qtyLP > 0) {
                    items.push({
                        name: `${ex.name} (LP)`,
                        qty: String(ex.qtyLP),
                        unitPrice: `R$ ${ex.priceLP.toFixed(2)}`,
                        total: `R$ ${(ex.priceLP * ex.qtyLP).toFixed(2)}`,
                    });
                }
                if (ex.priceP !== null && ex.qtyP > 0) {
                    items.push({
                        name: `${ex.name} (P)`,
                        qty: String(ex.qtyP),
                        unitPrice: `R$ ${ex.priceP.toFixed(2)}`,
                        total: `R$ ${(ex.priceP * ex.qtyP).toFixed(2)}`,
                    });
                }
            });
        } else {
            trsItems.forEach((item) => {
                const qty = trsLines.get(item.id) || 0;
                if (qty > 0) {
                    items.push({
                        name: item.name,
                        qty: String(qty),
                        unitPrice: `R$ ${item.price.toFixed(2)}`,
                        total: `R$ ${(item.price * qty).toFixed(2)}`,
                    });
                }
            });
            extraTrs.forEach((ex) => {
                if (ex.qty > 0) {
                    items.push({
                        name: ex.name,
                        qty: String(ex.qty),
                        unitPrice: `R$ ${ex.price.toFixed(2)}`,
                        total: `R$ ${(ex.price * ex.qty).toFixed(2)}`,
                    });
                }
            });
        }

        if (items.length === 0) {
            toast('Nenhum item com quantidade para a comanda', 'error');
            return;
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Comanda - Lavanderia</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #1a1a2e; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; }
.header h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 4px; }
.header p { color: #666; font-size: 14px; }
.meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #555; }
.meta span { background: #f5f5f0; padding: 6px 14px; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th { background: #1a1a2e; color: #f5f5f0; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
td { padding: 10px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
tr:nth-child(even) td { background: #fafafa; }
.totals { margin-top: 10px; border-top: 2px solid #1a1a2e; padding-top: 15px; }
.totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
.totals .row.grand { font-size: 22px; font-weight: 800; color: #f59e0b; border-top: 2px solid #f59e0b; padding-top: 12px; margin-top: 8px; }
.print-btn { display: block; margin: 30px auto 0; padding: 12px 40px; background: #f59e0b; color: #000; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; }
@media print { .print-btn { display: none; } }
</style></head><body>
<div class="header"><h1>­ƒº║ Lavanderia</h1><p>Comanda de ${catalog === 'services' ? 'Servi├ºos' : 'Enxoval'}</p></div>
<div class="meta">
<span>­ƒôà ${dateStr} ÔÇö ${timeStr}</span>
<span>­ƒÅÀ´©Å ${catalog === 'services' ? `Tipo: ${serviceType}` : 'Enxoval'}</span>
</div>
<table><thead><tr><th>Item</th><th>Qtd</th><th>Pre├ºo Unit.</th><th>Total</th></tr></thead>
<tbody>${items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unitPrice}</td><td>${i.total}</td></tr>`).join('')}</tbody></table>
<div class="totals">
<div class="row"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span></div>
${additionalAmount > 0 ? `<div class="row"><span>Adicional ${serviceType} (${((multiplier - 1) * 100).toFixed(0)}%)</span><span>R$ ${additionalAmount.toFixed(2)}</span></div>` : ''}
<div class="row grand"><span>TOTAL</span><span>R$ ${total.toFixed(2)}</span></div>
</div>
<button class="print-btn" onclick="window.print()">­ƒû¿´©Å Imprimir / Salvar como PDF</button>
</body></html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    }

    // Check if any items have quantities
    const hasItems = catalog === 'services'
        ? [...svcLines.values()].some((l) => l.qtyLP > 0 || l.qtyP > 0) || extraSvc.some((e) => e.qtyLP > 0 || e.qtyP > 0)
        : [...trsLines.values()].some((q) => q > 0) || extraTrs.some((e) => e.qty > 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Calculadora</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Calcule o valor dos servi├ºos de lavanderia</p>
                </div>
            </div>

            {/* Catalog & Service Type selectors */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="pill-switch glass-card-static">
                    <button className={catalog === 'services' ? 'active' : ''} onClick={() => setCatalog('services')}>
                        Servi├ºos
                    </button>
                    <button className={catalog === 'trousseau' ? 'active' : ''} onClick={() => setCatalog('trousseau')}>
                        Enxoval
                    </button>
                </div>

                {catalog === 'services' && (
                    <div className="pill-switch glass-card-static">
                        {(['Normal', 'Expresso', 'Urgente'] as ServiceType[]).map((st) => (
                            <button
                                key={st}
                                className={serviceType === st ? 'active' : ''}
                                onClick={() => setServiceType(st)}
                            >
                                {st}
                                {st !== 'Normal' && (
                                    <span className="ml-1 text-xs opacity-70">
                                        {st === 'Expresso' ? '├ù1.5' : '├ù2.0'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content Area: Table + Actions */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    {/* Items Table */}
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        {catalog === 'services' ? (
                                            <>
                                                <th className="text-center">Pre├ºo LP</th>
                                                <th className="text-center">Qtd LP</th>
                                                <th className="text-center">Pre├ºo P</th>
                                                <th className="text-center">Qtd P</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="text-center">Pre├ºo</th>
                                                <th className="text-center">Qtd</th>
                                            </>
                                        )}
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {catalog === 'services' ? (
                                        <>
                                            {svcItems.map((item) => {
                                                const line = svcLines.get(item.id) || { qtyLP: 0, qtyP: 0 };
                                                const lineTotal = item.priceLP * line.qtyLP + (item.priceP !== null ? item.priceP * line.qtyP : 0);
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="font-medium">{item.name}</td>
                                                        <td className="text-center text-sm text-[var(--text-secondary)]">R$ {item.priceLP.toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <QtyControl value={line.qtyLP} onChange={(v) => updateSvcQty(item.id, 'qtyLP', v)} />
                                                        </td>
                                                        <td className="text-center text-sm text-[var(--text-secondary)]">
                                                            {item.priceP !== null ? `R$ ${item.priceP.toFixed(2)}` : 'ÔÇö'}
                                                        </td>
                                                        <td className="text-center">
                                                            {item.priceP !== null ? (
                                                                <QtyControl value={line.qtyP} onChange={(v) => updateSvcQty(item.id, 'qtyP', v)} />
                                                            ) : (
                                                                <span className="text-[var(--text-muted)]">ÔÇö</span>
                                                            )}
                                                        </td>
                                                        <td className="text-right font-semibold tabular-nums">
                                                            {lineTotal > 0 ? `R$ ${lineTotal.toFixed(2)}` : 'ÔÇö'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {extraSvc.map((ex, idx) => {
                                                const lineTotal = ex.priceLP * ex.qtyLP + (ex.priceP !== null ? ex.priceP * ex.qtyP : 0);
                                                return (
                                                    <tr key={ex.itemId} className="bg-amber-500/5">
                                                        <td className="font-medium">
                                                            {ex.name}
                                                            <span className="badge badge-amber ml-2">Extra</span>
                                                        </td>
                                                        <td className="text-center text-sm">R$ {ex.priceLP.toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <QtyControl
                                                                value={ex.qtyLP}
                                                                onChange={(v) => {
                                                                    setExtraSvc((prev) => {
                                                                        const copy = [...prev];
                                                                        copy[idx] = { ...copy[idx], qtyLP: v };
                                                                        return copy;
                                                                    });
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="text-center text-sm">{ex.priceP !== null ? `R$ ${ex.priceP.toFixed(2)}` : 'ÔÇö'}</td>
                                                        <td className="text-center">
                                                            {ex.priceP !== null ? (
                                                                <QtyControl
                                                                    value={ex.qtyP}
                                                                    onChange={(v) => {
                                                                        setExtraSvc((prev) => {
                                                                            const copy = [...prev];
                                                                            copy[idx] = { ...copy[idx], qtyP: v };
                                                                            return copy;
                                                                        });
                                                                    }}
                                                                />
                                                            ) : 'ÔÇö'}
                                                        </td>
                                                        <td className="text-right font-semibold tabular-nums">
                                                            {lineTotal > 0 ? `R$ ${lineTotal.toFixed(2)}` : 'ÔÇö'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <>
                                            {trsItems.map((item) => {
                                                const qty = trsLines.get(item.id) || 0;
                                                const lineTotal = item.price * qty;
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="font-medium">{item.name}</td>
                                                        <td className="text-center text-sm text-[var(--text-secondary)]">R$ {item.price.toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <QtyControl value={qty} onChange={(v) => updateTrsQty(item.id, v)} />
                                                        </td>
                                                        <td className="text-right font-semibold tabular-nums">
                                                            {lineTotal > 0 ? `R$ ${lineTotal.toFixed(2)}` : 'ÔÇö'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {extraTrs.map((ex, idx) => {
                                                const lineTotal = ex.price * ex.qty;
                                                return (
                                                    <tr key={ex.itemId} className="bg-amber-500/5">
                                                        <td className="font-medium">
                                                            {ex.name}
                                                            <span className="badge badge-amber ml-2">Extra</span>
                                                        </td>
                                                        <td className="text-center text-sm">R$ {ex.price.toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <QtyControl
                                                                value={ex.qty}
                                                                onChange={(v) => {
                                                                    setExtraTrs((prev) => {
                                                                        const copy = [...prev];
                                                                        copy[idx] = { ...copy[idx], qty: v };
                                                                        return copy;
                                                                    });
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="text-right font-semibold tabular-nums">
                                                            {lineTotal > 0 ? `R$ ${lineTotal.toFixed(2)}` : 'ÔÇö'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Vertical Sidebar / Summary - Sticky */}
                <div className="w-full lg:w-80 lg:sticky lg:top-8 lg:self-start space-y-6">
                    {/* Summary Card */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Resumo</h3>
                        <div className="summary-row">
                            <span className="text-[var(--text-secondary)]">Subtotal</span>
                            <span className="font-semibold tabular-nums">R$ {subtotal.toFixed(2)}</span>
                        </div>
                        {catalog === 'services' && additionalAmount > 0 && (
                            <div className="summary-row">
                                <span className="text-[var(--text-secondary)]">
                                    Adicional {serviceType}
                                    <span className="badge badge-amber ml-2">{((multiplier - 1) * 100).toFixed(0)}%</span>
                                </span>
                                <span className="font-semibold tabular-nums text-amber-400">+ R$ {additionalAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>TOTAL</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Action buttons list */}
                    <div className="flex flex-col gap-3">
                        <button className="btn btn-primary w-full" onClick={() => { setSaveDate(new Date().toISOString().slice(0, 10)); setSaveModalOpen(true); }} disabled={!hasItems}>
                            ­ƒÆ¥ Salvar no Hist├│rico
                        </button>
                        <button className="btn btn-secondary w-full" onClick={generateComanda} disabled={!hasItems}>
                            ­ƒû¿´©Å Gerar Comanda (PDF)
                        </button>
                        <div className="h-px bg-[var(--glass-border)] my-1"></div>
                        <button className="btn btn-secondary w-full text-left justify-start" onClick={() => setExtraModalOpen(true)}>
                            Ô×ò Adicionar Item Extra
                        </button>
                        <button className="btn btn-secondary w-full text-left justify-start" onClick={() => setItemsModalOpen(true)}>
                            Ô£Å´©Å Modificar Cat├ílogo
                        </button>
                        <button className="btn btn-secondary w-full text-red-400 hover:bg-red-400/10" onClick={handleNewSheet}>
                            ­ƒôï Limpar Planilha
                        </button>
                    </div>
                </div>
            </div>

            {/* Items Modal */}
            <ItemsModal
                open={itemsModalOpen}
                onClose={() => setItemsModalOpen(false)}
                catalogType={catalog}
                onSaved={loadItems}
            />

            {/* Extra Item Modal */}
            <Modal open={extraModalOpen} onClose={() => setExtraModalOpen(false)} title="Adicionar Item Extra">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Nome</label>
                        <input className="input" value={extraName} onChange={(e) => setExtraName(e.target.value)} placeholder="Nome do item" />
                    </div>
                    {catalog === 'services' ? (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Pre├ºo LP</label>
                                <input className="input" type="number" min="0" step="0.01" value={extraPriceLP} onChange={(e) => setExtraPriceLP(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Pre├ºo P (opcional)</label>
                                <input className="input" type="number" min="0" step="0.01" value={extraPriceP} onChange={(e) => setExtraPriceP(e.target.value)} placeholder="Vazio = sem P" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Pre├ºo</label>
                            <input className="input" type="number" min="0" step="0.01" value={extraPrice} onChange={(e) => setExtraPrice(e.target.value)} />
                        </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={makePermanent}
                            onChange={(e) => setMakePermanent(e.target.checked)}
                            className="w-4 h-4 accent-[var(--accent)]"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">Tornar permanente (salvar no cat├ílogo)</span>
                    </label>
                    <div className="flex gap-3 justify-end pt-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setExtraModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={handleAddExtra}>Adicionar</button>
                    </div>
                </div>
            </Modal>

            {/* Save Modal */}
            <Modal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Salvar no Hist├│rico">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Data</label>
                        <input className="input" type="date" value={saveDate} onChange={(e) => setSaveDate(e.target.value)} />
                    </div>
                    <div className="glass-card-static p-4 rounded-xl">
                        <div className="summary-row">
                            <span>Tipo</span>
                            <span className="badge badge-amber">{catalog === 'services' ? 'Servi├ºos' : 'Enxoval'}</span>
                        </div>
                        {catalog === 'services' && (
                            <div className="summary-row">
                                <span>Servi├ºo</span>
                                <span className="badge badge-sky">{serviceType}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>TOTAL</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setSaveModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>Confirmar e Salvar</button>
                    </div>
                </div>
            </Modal>

            {/* Confirm New Sheet */}
            <Confirm
                open={confirmNewOpen}
                onConfirm={confirmNewSheet}
                onCancel={() => setConfirmNewOpen(false)}
                title="Nova Planilha"
                message="Isso vai zerar todas as quantidades e remover itens extras. Deseja continuar?"
            />
        </div>
    );
}
