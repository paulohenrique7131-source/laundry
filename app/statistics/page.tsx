"use client";

import { useData } from "@/contexts/DataContext";
import { GlassCard } from "@/components/ui/GlassCard";

export default function StatisticsPage() {
    const { history } = useData();

    // Placeholder for statistics logic
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">Estatísticas</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GlassCard>
                    <p className="text-slate-400">Total de Pedidos</p>
                    <p className="text-3xl font-bold">{history.length}</p>
                </GlassCard>
            </div>
            <GlassCard className="p-8 text-center">
                <p className="text-slate-500">Gráficos em desenvolvimento...</p>
            </GlassCard>
        </div>
    );
}
