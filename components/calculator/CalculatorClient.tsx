"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Minus, Calculator, Save, Trash2, Printer, PlusCircle } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { ServiceItem, EnxovalItem, OrderItem, ServiceType } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { clsx } from "clsx";
import { ExtraItemModal } from "./ExtraItemModal";

export function CalculatorClient() {
    const { settings, addHistoryRecord } = useData();
    const [activeTab, setActiveTab] = useState<'servicos' | 'enxoval'>('servicos');
    const [serviceType, setServiceType] = useState<ServiceType>('normal');
    const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

    // Local state for quantities. Map<itemId, {lp: number, p: number}>
    const [quantities, setQuantities] = useState<Record<string, { lp: number; p: number }>>({});

    // Temporary extra items
    const [extras, setExtras] = useState<ServiceItem[]>([]);

    // Initialize quantities when items change or on mount
    // We don't reset on tab change to keep state if user switches back and forth

    const currentItems = useMemo(() => {
        if (activeTab === 'servicos') {
            return [...settings.serviceItems, ...extras.filter(e => !e.category || e.category === 'extra')];
        } else {
            // Logic for Enxoval items (mocked for now as we started empty)
            return settings.enxovalItems;
        }
    }, [activeTab, settings.serviceItems, settings.enxovalItems, extras]);

    const handleQuantityChange = (id: string, type: 'lp' | 'p', delta: number) => {
        setQuantities(prev => {
            const current = prev[id] || { lp: 0, p: 0 };
            const newValue = Math.max(0, current[type] + delta);

            if (newValue === 0 && current[type === 'lp' ? 'p' : 'lp'] === 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [id]: { ...current, [type]: newValue }
            };
        });
    };

    const handleManualInput = (id: string, type: 'lp' | 'p', value: string) => {
        const num = parseInt(value) || 0;
        setQuantities(prev => {
            const current = prev[id] || { lp: 0, p: 0 };
            return {
                ...prev,
                [id]: { ...current, [type]: Math.max(0, num) }
            };
        });
    };

    const totals = useMemo(() => {
        let subtotal = 0;
        const itemsList: OrderItem[] = [];

        const allServiceItems = [...settings.serviceItems, ...extras];
        const allEnxovalItems = settings.enxovalItems as EnxovalItem[];

        // Helper to process items
        const processItem = (item: ServiceItem | EnxovalItem, isService: boolean) => {
            const q = quantities[item.id];
            if (q && (q.lp > 0 || q.p > 0)) {
                // Normalize price access
                const priceLP = 'priceLP' in item ? item.priceLP : item.price;
                const priceP = 'priceP' in item ? item.priceP : null;

                const totalItem = (priceLP * q.lp) + ((priceP || 0) * (q.p || 0));
                subtotal += totalItem;

                itemsList.push({
                    itemId: item.id,
                    name: item.name,
                    quantityLP: q.lp,
                    quantityP: q.p || 0,
                    unitPriceLP: priceLP,
                    unitPriceP: priceP,
                    total: totalItem
                });
            }
        };

        allServiceItems.forEach(item => processItem(item, true));
        allEnxovalItems.forEach(item => processItem(item, false));

        // Separate subtotals for multiplier logic
        let serviceSubtotal = 0;
        let enxovalSubtotal = 0;

        itemsList.forEach(orderItem => {
            const isService = allServiceItems.some(i => i.id === orderItem.itemId);
            if (isService) {
                serviceSubtotal += orderItem.total;
            } else {
                enxovalSubtotal += orderItem.total;
            }
        });

        let multiplier = 1;
        if (activeTab === 'servicos') {
            if (serviceType === 'expresso') multiplier = 1.5;
            if (serviceType === 'urgente') multiplier = 2.0;
        }

        const serviceTotal = serviceSubtotal * multiplier;
        const total = serviceTotal + enxovalSubtotal;

        return {
            subtotal: serviceSubtotal + enxovalSubtotal,
            multiplier,
            displayTotal: total,
            itemsList
        };
    }, [quantities, settings.serviceItems, settings.enxovalItems, extras, serviceType, activeTab]);

    const handleReset = () => {
        if (confirm("Deseja limpar todos os dados da planilha atual?")) {
            setQuantities({});
            setExtras([]);
            setServiceType('normal');
        }
    };

    const handleSave = () => {
        if (totals.itemsList.length === 0) {
            alert("A planilha está vazia.");
            return;
        }

        const record = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: activeTab === 'servicos' ? 'servicos' : 'enxoval', // Basic logic, or 'ambos' if mixed?
            // Prompt says "Switch Tipo de lista". Usually a laundry order is either Clothes or Bedding (Enxoval).
            // Let's assume the user selects the type for the order mostly by the tab they are in, OR we detect.
            serviceType: serviceType,
            items: totals.itemsList,
            subtotal: totals.subtotal,
            total: totals.displayTotal,
            createdAt: Date.now()
        };

        addHistoryRecord(record);
        alert("Pedido salvo com sucesso!");
        setQuantities({});
        setExtras([]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Controls */}
                <GlassCard className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-800/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('servicos')}
                            className={clsx(
                                "px-6 py-2 rounded-md transition-all font-medium",
                                activeTab === 'servicos' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Serviços
                        </button>
                        <button
                            onClick={() => setActiveTab('enxoval')}
                            className={clsx(
                                "px-6 py-2 rounded-md transition-all font-medium",
                                activeTab === 'enxoval' ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Enxoval
                        </button>
                    </div>

                    {activeTab === 'servicos' && (
                        <select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value as ServiceType)}
                            className="glass-input bg-slate-800 text-white border-white/10"
                        >
                            <option value="normal">Normal (1.0x)</option>
                            <option value="expresso">Expresso (1.5x)</option>
                            <option value="urgente">Urgente (2.0x)</option>
                        </select>
                    )}
                </GlassCard>

                {/* List */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-slate-300">
                                <tr>
                                    <th className="p-4 font-semibold">Item</th>
                                    <th className="p-4 font-semibold text-center w-32">LP</th>
                                    {activeTab === 'servicos' && (
                                        <th className="p-4 font-semibold text-center w-32">P</th>
                                    )}
                                    <th className="p-4 font-semibold text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {currentItems.map((item) => {
                                    const q = quantities[item.id] || { lp: 0, p: 0 };

                                    // Access price correctly based on type
                                    const priceLP = 'priceLP' in item ? item.priceLP : item.price;
                                    const priceP = 'priceP' in item ? item.priceP : null;

                                    const rowTotal = (priceLP * q.lp) + ((priceP || 0) * (q.p || 0));

                                    return (
                                        <tr key={item.id} className={clsx("hover:bg-white/5 transition-colors", (q.lp > 0 || q.p > 0) && "bg-blue-500/5")}>
                                            <td className="p-4">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    LP: R$ {priceLP.toFixed(2)}
                                                    {priceP && ` | P: R$ ${priceP.toFixed(2)}`}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, 'lp', -1)}
                                                        className="p-1 hover:bg-white/10 rounded-full text-red-400 opacity-50 hover:opacity-100"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={q.lp || ''}
                                                        onChange={(e) => handleManualInput(item.id, 'lp', e.target.value)}
                                                        className="w-12 text-center bg-transparent border-b border-white/20 focus:border-blue-500 outline-none"
                                                        placeholder="0"
                                                    />
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, 'lp', 1)}
                                                        className="p-1 hover:bg-white/10 rounded-full text-green-400 hover:bg-green-400/10"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            {activeTab === 'servicos' && (
                                                <td className="p-4 text-center">
                                                    {priceP !== null ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, 'p', -1)}
                                                                className="p-1 hover:bg-white/10 rounded-full text-red-400 opacity-50 hover:opacity-100"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={q.p || ''}
                                                                onChange={(e) => handleManualInput(item.id, 'p', e.target.value)}
                                                                className="w-12 text-center bg-transparent border-b border-white/20 focus:border-blue-500 outline-none"
                                                                placeholder="0"
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, 'p', 1)}
                                                                className="p-1 hover:bg-white/10 rounded-full text-green-400 hover:bg-green-400/10"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="p-4 text-right font-medium font-mono text-slate-300">
                                                {rowTotal > 0 ? `R$ ${rowTotal.toFixed(2)}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {currentItems.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum item encontrado nesta lista.
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <GlassCard className="sticky top-6 space-y-6">
                    <h2 className="text-xl font-bold border-b border-white/10 pb-4">Resumo</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-slate-400">
                            <span>Itens</span>
                            <span>{totals.itemsList.length}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Subtotal</span>
                            <span>R$ {totals.subtotal.toFixed(2)}</span>
                        </div>
                        {activeTab === 'servicos' && serviceType !== 'normal' && (
                            <div className="flex justify-between text-yellow-400">
                                <span>Adicional ({serviceType})</span>
                                <span>+ R$ {(totals.displayTotal - totals.subtotal).toFixed(2)}</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <span className="text-lg">Total</span>
                            <span className="text-3xl font-bold text-blue-400">R$ {totals.displayTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid gap-3 pt-4">
                        <button onClick={handleSave} className="glass-button w-full flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600">
                            <Save size={18} /> Salvar Pedido
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="glass-button bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center gap-2">
                                <Printer size={18} /> Imprimir
                            </button>
                            <button onClick={handleReset} className="glass-button bg-red-900/30 hover:bg-red-800/50 flex items-center justify-center gap-2 text-red-200">
                                <Trash2 size={18} /> Limpar
                            </button>
                        </div>
                    </div>
                </GlassCard>


                {/* Extra Item Button */}
                <button
                    onClick={() => setIsExtraModalOpen(true)}
                    className="w-full glass p-4 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:bg-white/10 transition-colors border-dashed"
                >
                    <PlusCircle size={20} /> Adicionar Item Extra
                </button>
            </div>

            <ExtraItemModal
                isOpen={isExtraModalOpen}
                onClose={() => setIsExtraModalOpen(false)}
                onConfirm={(item) => setExtras(prev => [...prev, item])}
                type={activeTab}
            />
        </div>
    );
}
