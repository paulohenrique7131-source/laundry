"use client";

import { useData } from "@/contexts/DataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { RefreshCw } from "lucide-react";

export default function SettingsPage() {
    const { settings, resetServiceItems } = useData();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">Ajustes</h1>

            <GlassCard>
                <h2 className="text-xl font-bold mb-4">Dados</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <p className="font-medium">Itens de Serviço</p>
                            <p className="text-sm text-slate-400">{settings.serviceItems.length} itens cadastrados</p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm("Restaurar itens padrão? Isso não apaga o histórico.")) {
                                    resetServiceItems();
                                }
                            }}
                            className="glass-button bg-transparent hover:bg-white/10 text-slate-300 flex items-center gap-2"
                        >
                            <RefreshCw size={16} /> Restaurar Padrão
                        </button>
                    </div>
                </div>
            </GlassCard>

            <GlassCard>
                <h2 className="text-xl font-bold mb-4">Sobre</h2>
                <p className="text-slate-400">Lavanderia App Premium v1.0.0</p>
                <p className="text-xs text-slate-600 mt-2">Armazenamento Local Ativo</p>
            </GlassCard>
        </div>
    );
}
