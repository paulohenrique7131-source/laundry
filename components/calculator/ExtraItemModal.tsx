"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ServiceItem } from '@/types';

interface ExtraItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: ServiceItem) => void;
    type: 'servicos' | 'enxoval';
}

export function ExtraItemModal({ isOpen, onClose, onConfirm, type }: ExtraItemModalProps) {
    const [name, setName] = useState('');
    const [priceLP, setPriceLP] = useState('');
    const [priceP, setPriceP] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !priceLP) return;

        const newItem: ServiceItem = {
            id: `extra_${Date.now()}`,
            name,
            priceLP: parseFloat(priceLP),
            priceP: priceP ? parseFloat(priceP) : null,
            category: 'extra'
        };

        onConfirm(newItem);
        setName('');
        setPriceLP('');
        setPriceP('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-md relative animate-slide-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6">Adicionar Item Extra</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nome do Item</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full glass-input"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Preço LP</label>
                            <input
                                type="number"
                                step="0.01"
                                value={priceLP}
                                onChange={e => setPriceLP(e.target.value)}
                                className="w-full glass-input"
                                required
                            />
                        </div>
                        {type === 'servicos' && (
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Preço P (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={priceP}
                                    onChange={e => setPriceP(e.target.value)}
                                    className="w-full glass-input"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="glass-button bg-transparent hover:bg-white/10"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="glass-button bg-blue-600 hover:bg-blue-500"
                        >
                            Adicionar
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
