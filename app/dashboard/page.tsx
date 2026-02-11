"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trash2, FileText } from "lucide-react";
import { clsx } from 'clsx';
import { HistoryRecord } from "@/types";

export default function DashboardPage() {
    const { history, deleteHistoryRecord } = useData();
    const [filterType, setFilterType] = useState<'all' | 'servicos' | 'enxoval'>('all');

    const filteredHistory = history.filter(record =>
        filterType === 'all' ? true : record.type === filterType
    ).sort((a, b) => b.createdAt - a.createdAt);

    const formatCurrency = (val: number) => `R$ ${val.toFixed(2)}`;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Histórico</h1>

                <div className="flex bg-slate-800/50 p-1 rounded-lg">
                    <button
                        onClick={() => setFilterType('all')}
                        className={clsx("px-4 py-1.5 rounded-md text-sm transition-colors", filterType === 'all' ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white")}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('servicos')}
                        className={clsx("px-4 py-1.5 rounded-md text-sm transition-colors", filterType === 'servicos' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >
                        Serviços
                    </button>
                    <button
                        onClick={() => setFilterType('enxoval')}
                        className={clsx("px-4 py-1.5 rounded-md text-sm transition-colors", filterType === 'enxoval' ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white")}
                    >
                        Enxoval
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredHistory.map((record) => (
                    <GlassCard key={record.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                    record.type === 'servicos' ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                                )}>
                                    {record.type}
                                </span>
                                <span className="text-sm text-slate-400">
                                    {new Date(record.date).toLocaleDateString()}
                                </span>
                                {record.serviceType !== 'normal' && (
                                    <span className="text-xs text-yellow-400 border border-yellow-400/30 px-1.5 rounded">
                                        {record.serviceType}
                                    </span>
                                )}
                            </div>
                            <div className="font-medium text-lg">
                                {record.items.length} itens - Total: <span className="text-green-400">{formatCurrency(record.total)}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {record.items.map(i => i.name).join(", ")}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300" title="Ver Detalhes">
                                <FileText size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("Excluir este registro permanentemente?")) {
                                        deleteHistoryRecord(record.id);
                                    }
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400" title="Excluir"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {filteredHistory.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Nenhum registro encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
