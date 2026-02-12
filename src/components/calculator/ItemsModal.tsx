'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { useApp } from '@/context/AppContext';
import { getConfig, setConfig } from '@/storage/db';
import { DEFAULT_C1_ITEMS } from '@/data/defaults';
import type { ServiceItem, TrousseauItem } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogType: string;
    onSaved: () => void;
}

// Unified item type for internal state
type EditableItem = {
    id: string;
    name: string;
    price: number; // Used for Single Price OR LP
    priceP?: number | null; // Used for Service P
}

export function ItemsModal({ open, onClose, catalogType, onSaved }: Props) {
    const { settings } = useApp();
    const { toast } = useToast();
    const [items, setItems] = useState<EditableItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Determine catalog configuration based on ID
    const config = useMemo(() => {
        if (catalogType === 'services') {
            return { type: 'service', key: 'c1_items', title: 'Serviços' };
        }
        if (catalogType === 'trousseau') {
            return { type: 'single', key: 'c2_items', title: 'Enxoval' };
        }
        // Custom catalog
        const custom = settings.customCatalogs?.find(c => c.id === catalogType);
        if (custom) {
            const type = custom.type === 'service' ? 'service' : 'single';
            return { type, key: `cat_${catalogType}_items`, title: custom.name };
        }
        return { type: 'single', key: `cat_${catalogType}_items`, title: 'Catálogo' };
    }, [catalogType, settings.customCatalogs]);

    useEffect(() => {
        if (open) loadItems();
    }, [open, config.key]);

    async function loadItems() {
        setLoading(true);
        try {
            const data = await getConfig(config.key) as any[];
            // Map to uniform EditableItem structure
            const mapped = (data || []).map(i => ({
                id: i.id,
                name: i.name,
                price: i.priceLP ?? i.price ?? 0,
                priceP: i.priceP
            }));
            setItems(mapped);
        } catch (e) {
            console.error(e);
            setItems([]);
        }
        setLoading(false);
    }

    function updateItem(idx: number, field: keyof EditableItem, value: any) {
        setItems(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    }

    function addItem() {
        setItems(prev => [...prev, {
            id: `item_${Date.now().toString(36)}`,
            name: '',
            price: 0,
            priceP: config.type === 'service' ? null : undefined
        }]);
    }

    function removeItem(idx: number) {
        setItems(prev => prev.filter((_, i) => i !== idx));
    }

    async function handleSave() {
        if (items.some(i => !i.name.trim())) {
            toast('Nome obrigatório para todos os itens', 'error');
            return;
        }

        // Map back to storage format
        let toSave;
        if (config.type === 'service') {
            toSave = items.map(i => ({ id: i.id, name: i.name, priceLP: i.price, priceP: i.priceP } as ServiceItem));
        } else {
            toSave = items.map(i => ({ id: i.id, name: i.name, price: i.price } as TrousseauItem));
        }

        await setConfig(config.key, toSave);
        toast('Itens salvos com sucesso!');
        onSaved();
        onClose();
    }

    async function restoreDefaults() {
        if (config.key !== 'c1_items') {
            toast('Apenas o catálogo de Serviços tem padrão', 'error');
            return;
        }
        await setConfig('c1_items', DEFAULT_C1_ITEMS);
        setItems(DEFAULT_C1_ITEMS.map(i => ({
            id: i.id,
            name: i.name,
            price: i.priceLP,
            priceP: i.priceP
        })));
        toast('Serviços restaurados ao padrão', 'info');
    }

    function exportJSON() {
        // Map current state to clean JSON
        const data = items.map(i => {
            if (config.type === 'service') {
                return { id: i.id, name: i.name, priceLP: i.price, priceP: i.priceP };
            } else {
                return { id: i.id, name: i.name, price: i.price };
            }
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catalogo_${config.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
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

                // Auto-detect format and map
                const mapped = data.map((i: any) => ({
                    id: i.id || `import_${Math.random().toString(36).substr(2, 9)}`,
                    name: i.name || '',
                    price: i.priceLP ?? i.price ?? 0,
                    priceP: i.priceP
                }));

                setItems(mapped);
                toast('Dados importados! Clique em Salvar para confirmar.', 'info');
            } catch {
                toast('Arquivo inválido', 'error');
            }
        };
        input.click();
    }

    if (!open) return null;

    const isService = config.type === 'service';

    return (
        <Modal open={open} onClose={onClose} title={`Modificar: ${config.title}`} large>

            {loading ? (
                <div className="flex justify-center py-10"><div className="spinner" /></div>
            ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {/* Column headers */}
                    <div className="grid gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1"
                        style={{ gridTemplateColumns: isService ? '1fr 90px 90px 28px' : '1fr 100px 28px' }}>
                        <span>Nome do Item</span>
                        <span className="text-center">{isService ? 'Preço LP' : 'Preço'}</span>
                        {isService && <span className="text-center">Preço P</span>}
                        <span></span>
                    </div>

                    {items.map((item, idx) => (
                        <div key={item.id} className="grid gap-2 items-center animate-fade-in"
                            style={{ gridTemplateColumns: isService ? '1fr 90px 90px 28px' : '1fr 100px 28px' }}>
                            <input
                                className="input input-sm"
                                placeholder="Nome do item"
                                value={item.name}
                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            />
                            <input
                                className="input input-sm text-center"
                                type="number"
                                min="0" step="0.01"
                                placeholder="0.00"
                                value={item.price || ''}
                                onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                            {isService && (
                                <input
                                    className="input input-sm text-center"
                                    type="number"
                                    min="0" step="0.01"
                                    placeholder="Vazio = sem"
                                    value={item.priceP ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        updateItem(idx, 'priceP', v === '' ? null : parseFloat(v) || 0);
                                    }}
                                />
                            )}
                            <button
                                className="btn btn-ghost btn-xs text-red-400 !p-1 hover:bg-red-400/10 rounded-full"
                                onClick={() => removeItem(idx)}
                                title="Remover item"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-8 text-[var(--text-muted)] italic border border-dashed border-[var(--glass-border)] rounded-xl">
                            Nenhum item neste catálogo. Adicione um novo item abaixo.
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--glass-border)]">
                <button className="btn btn-secondary btn-sm" onClick={addItem}>
                    + Adicionar Item
                </button>
                {config.key === 'c1_items' && (
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
