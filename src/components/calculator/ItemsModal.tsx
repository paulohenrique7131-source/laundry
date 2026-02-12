'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { getConfig, setConfig } from '@/storage/db';
import { DEFAULT_C1_ITEMS } from '@/data/defaults';
import type { ServiceItem, TrousseauItem, CatalogType } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogType: CatalogType;
    onSaved: () => void;
}

export function ItemsModal({ open, onClose, catalogType, onSaved }: Props) {
    const { toast } = useToast();
    const [tab, setTab] = useState<CatalogType>(catalogType);
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [trousseauItems, setTrousseauItems] = useState<TrousseauItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setTab(catalogType);
            loadItems();
        }
    }, [open, catalogType]);

    async function loadItems() {
        setLoading(true);
        const c1 = await getConfig('c1_items') as ServiceItem[];
        const c2 = await getConfig('c2_items') as TrousseauItem[];
        setServiceItems(c1);
        setTrousseauItems(c2);
        setLoading(false);
    }

    // Service item handlers
    function updateSvc(idx: number, field: keyof ServiceItem, value: string | number | null) {
        setServiceItems((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    }

    function addSvcItem() {
        const id = 'svc_' + Date.now().toString(36);
        setServiceItems((prev) => [...prev, { id, name: '', priceLP: 0, priceP: null }]);
    }

    function removeSvcItem(idx: number) {
        setServiceItems((prev) => prev.filter((_, i) => i !== idx));
    }

    // Trousseau item handlers
    function updateTrs(idx: number, field: keyof TrousseauItem, value: string | number) {
        setTrousseauItems((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    }

    function addTrsItem() {
        const id = 'trs_' + Date.now().toString(36);
        setTrousseauItems((prev) => [...prev, { id, name: '', price: 0 }]);
    }

    function removeTrsItem(idx: number) {
        setTrousseauItems((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSave() {
        // Validate
        if (tab === 'services') {
            const invalid = serviceItems.some((i) => !i.name.trim());
            if (invalid) { toast('Nome obrigatório para todos os itens', 'error'); return; }
            await setConfig('c1_items', serviceItems);
        } else {
            const invalid = trousseauItems.some((i) => !i.name.trim());
            if (invalid) { toast('Nome obrigatório para todos os itens', 'error'); return; }
            await setConfig('c2_items', trousseauItems);
        }
        toast('Itens salvos com sucesso!');
        onSaved();
        onClose();
    }

    async function restoreDefaults() {
        await setConfig('c1_items', DEFAULT_C1_ITEMS);
        setServiceItems([...DEFAULT_C1_ITEMS]);
        toast('Serviços restaurados ao padrão', 'info');
    }

    function exportJSON() {
        const data = tab === 'services' ? serviceItems : trousseauItems;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catalogo_${tab}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('JSON exportado!');
    }

    function importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!Array.isArray(data)) throw new Error('Invalid');
                if (tab === 'services') {
                    setServiceItems(data as ServiceItem[]);
                } else {
                    setTrousseauItems(data as TrousseauItem[]);
                }
                toast('Dados importados! Clique em Salvar para confirmar.', 'info');
            } catch {
                toast('Arquivo inválido', 'error');
            }
        };
        input.click();
    }

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title="Modificar Itens" large>
            {/* Tab switch */}
            <div className="pill-switch glass-card-static mb-5">
                <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>
                    Serviços
                </button>
                <button className={tab === 'trousseau' ? 'active' : ''} onClick={() => setTab('trousseau')}>
                    Enxoval
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="spinner" /></div>
            ) : tab === 'services' ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {/* Column headers */}
                    <div className="grid gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1"
                        style={{ gridTemplateColumns: '1fr 90px 90px 28px' }}>
                        <span>Nome do Item</span>
                        <span className="text-center">Preço LP</span>
                        <span className="text-center">Preço P</span>
                        <span></span>
                    </div>
                    {serviceItems.map((item, idx) => (
                        <div key={item.id} className="grid gap-2 items-center animate-fade-in"
                            style={{ gridTemplateColumns: '1fr 90px 90px 28px' }}>
                            <input
                                className="input input-sm"
                                placeholder="Nome do item"
                                value={item.name}
                                onChange={(e) => updateSvc(idx, 'name', e.target.value)}
                            />
                            <input
                                className="input input-sm text-center"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.priceLP || ''}
                                onChange={(e) => updateSvc(idx, 'priceLP', parseFloat(e.target.value) || 0)}
                            />
                            <input
                                className="input input-sm text-center"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Vazio = sem"
                                value={item.priceP ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    updateSvc(idx, 'priceP', v === '' ? null : parseFloat(v) || 0);
                                }}
                            />
                            <button className="btn btn-ghost btn-xs text-red-400 !p-1" onClick={() => removeSvcItem(idx)}>✕</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {/* Column headers */}
                    <div className="grid gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1"
                        style={{ gridTemplateColumns: '1fr 100px 28px' }}>
                        <span>Nome do Item</span>
                        <span className="text-center">Preço</span>
                        <span></span>
                    </div>
                    {trousseauItems.map((item, idx) => (
                        <div key={item.id} className="grid gap-2 items-center animate-fade-in"
                            style={{ gridTemplateColumns: '1fr 100px 28px' }}>
                            <input
                                className="input input-sm"
                                placeholder="Nome do item"
                                value={item.name}
                                onChange={(e) => updateTrs(idx, 'name', e.target.value)}
                            />
                            <input
                                className="input input-sm text-center"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.price || ''}
                                onChange={(e) => updateTrs(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                            <button className="btn btn-ghost btn-xs text-red-400 !p-1" onClick={() => removeTrsItem(idx)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--glass-border)]">
                <button className="btn btn-secondary btn-sm" onClick={tab === 'services' ? addSvcItem : addTrsItem}>
                    + Adicionar Item
                </button>
                {tab === 'services' && (
                    <button className="btn btn-ghost btn-sm" onClick={restoreDefaults}>
                        ↺ Restaurar padrão
                    </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={exportJSON}>
                    ⬇ Exportar JSON
                </button>
                <button className="btn btn-ghost btn-sm" onClick={importJSON}>
                    ⬆ Importar JSON
                </button>
                <div className="flex-1" />
                <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>Salvar alterações</button>
            </div>
        </Modal>
    );
}
