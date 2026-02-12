'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { ItemsModal } from '@/components/calculator/ItemsModal';

export default function SettingsClient() {
    const { settings, updateSettings, saveSettings, theme, toggleTheme } = useApp();
    const { toast } = useToast();
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [itemsCatalog, setItemsCatalog] = useState<'services' | 'trousseau'>('services');

    // Simple dirty flag — any slider change sets it to true
    const [isDirty, setIsDirty] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const blur = settings.blurIntensity ?? 16;
    const opacity = settings.cardOpacity ?? 0.15;
    const modalMid = settings.modalOpacityMiddle ?? 0.9;
    const modalAvg = settings.modalOpacityAverage ?? 0.6;
    const modalEdge = settings.modalOpacityEdges ?? 0.2;

    // Helper: update setting AND mark dirty
    const handleSettingChange = useCallback((partial: Partial<typeof settings>) => {
        updateSettings(partial);
        setIsDirty(true);
    }, [updateSettings]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleSave = useCallback(async () => {
        await saveSettings();
        setIsDirty(false);
        toast('Configurações salvas!', 'success');
    }, [saveSettings, toast]);

    const handleDiscard = useCallback(() => {
        // Reload the page to restore from DB
        window.location.reload();
    }, []);

    function openItemsModal(type: 'services' | 'trousseau') {
        setItemsCatalog(type);
        setItemsModalOpen(true);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Configurações</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Personalize o app ao seu gosto</p>
                </div>
                {isDirty && (
                    <div className="flex gap-3 items-center animate-fade-in">
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="btn btn-secondary text-sm"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            className="text-sm px-6 py-2.5 rounded-xl font-semibold text-black bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg hover:shadow-amber-500/30 transition-all duration-300 cursor-pointer"
                        >
                            💾 Salvar Alterações
                        </button>
                    </div>
                )}
            </div>

            {/* Items section */}
            <div className="glass-card p-8">
                <h2 className="text-xl font-semibold mb-3">📦 Catálogo de Itens</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Gerencie os itens de Serviços e Enxoval do seu catálogo</p>
                <div className="flex flex-wrap gap-4">
                    <button className="btn btn-secondary" onClick={() => openItemsModal('services')}>
                        ✏️ Editar Serviços
                    </button>
                    <button className="btn btn-secondary" onClick={() => openItemsModal('trousseau')}>
                        ✏️ Editar Enxoval
                    </button>
                </div>
            </div>

            {/* Appearance section */}
            <div className="glass-card p-8">
                <h2 className="text-xl font-semibold mb-6">🎨 Aparência</h2>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Controls column */}
                    <div className="flex-1 space-y-6">
                        {/* Theme toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                            <div>
                                <p className="text-sm font-semibold">Tema</p>
                                <p className="text-xs text-[var(--text-muted)]">Alterne entre claro e escuro</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-amber-500/30' : 'bg-sky-400/30'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${theme === 'dark' ? 'left-0.5 bg-amber-400' : 'left-7 bg-sky-400'
                                    }`}>
                                    {theme === 'dark' ? '🌙' : '☀️'}
                                </div>
                            </button>
                        </div>

                        <div className="divider" />
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cards &amp; Fundos</p>

                        {/* Blur intensity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Intensidade de Blur</p>
                                <span className="text-xs text-[var(--text-muted)] tabular-nums font-mono">{blur}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="32"
                                value={blur}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    handleSettingChange({ blurIntensity: v });
                                    document.documentElement.style.setProperty('--glass-blur', `${v}px`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>

                        {/* Card opacity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Opacidade dos Cards</p>
                                <span className="text-xs text-[var(--text-muted)] tabular-nums font-mono">{(opacity * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={opacity * 100}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value) / 100;
                                    handleSettingChange({ cardOpacity: v });
                                    document.documentElement.style.setProperty('--card-opacity', `${v}`);
                                    document.documentElement.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${v})`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>

                        <div className="divider" />
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pop-ups (Modais)</p>

                        {/* Modal Middle Opacity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Opacidade Central</p>
                                <span className="text-xs text-[var(--text-muted)] tabular-nums font-mono">{(modalMid * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={modalMid * 100}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value) / 100;
                                    handleSettingChange({ modalOpacityMiddle: v });
                                    document.documentElement.style.setProperty('--modal-opacity-mid', `${v}`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>

                        {/* Modal Average Opacity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Opacidade Média</p>
                                <span className="text-xs text-[var(--text-muted)] tabular-nums font-mono">{(modalAvg * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={modalAvg * 100}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value) / 100;
                                    handleSettingChange({ modalOpacityAverage: v });
                                    document.documentElement.style.setProperty('--modal-opacity-avg', `${v}`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>

                        {/* Modal Edge Opacity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Opacidade Extremidades</p>
                                <span className="text-xs text-[var(--text-muted)] tabular-nums font-mono">{(modalEdge * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={modalEdge * 100}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value) / 100;
                                    handleSettingChange({ modalOpacityEdges: v });
                                    document.documentElement.style.setProperty('--modal-opacity-edge', `${v}`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Live Preview column */}
                    <div className="w-full lg:w-80 space-y-4">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Preview em Tempo Real</p>

                        {/* Card preview — blur on background text */}
                        <div className="relative rounded-2xl overflow-hidden min-h-[200px]">
                            {/* Background text — bright white, blur applied directly */}
                            <div
                                className="absolute inset-0 p-4 text-xs leading-relaxed pointer-events-none select-none"
                                style={{ color: 'rgba(255, 255, 255, 0.92)', filter: `blur(${blur}px)`, transition: 'filter 0.3s ease' }}
                            >
                                <p className="font-bold text-sm mb-2" style={{ color: '#f59e0b' }}>Lavanderia — Registro #4821</p>
                                <p>Camisa Social ×3 — R$ 45,00</p>
                                <p>Calça Jeans ×2 — R$ 30,00</p>
                                <p>Lençol King ×1 — R$ 28,00</p>
                                <p>Toalha de Banho ×4 — R$ 52,00</p>
                                <p className="mt-2 font-semibold">Subtotal: R$ 155,00</p>
                                <p className="font-bold" style={{ color: '#f59e0b' }}>Total (×1.5): R$ 232,50</p>
                                <p className="mt-3">Data: 12/02/2026</p>
                                <p>Tipo: Serviços — Expresso</p>
                                <p className="mt-2">Cliente: Governança • #0042</p>
                                <p>Obs: Peças urgentes p/ evento</p>
                            </div>

                            {/* Card overlay */}
                            <div className="relative z-10 rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                                style={{
                                    background: `rgba(255, 255, 255, ${opacity})`,
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">📊</div>
                                    <div>
                                        <p className="text-sm font-semibold">Resumo do Pedido</p>
                                        <p className="text-xs text-[var(--text-muted)]">Comanda #4821</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                    <span>Subtotal</span>
                                    <span className="font-semibold">R$ 155,00</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-[var(--accent)] mt-1">
                                    <span>TOTAL</span>
                                    <span>R$ 232,50</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal preview — blur on background text */}
                        <div className="relative rounded-2xl overflow-hidden min-h-[160px]">
                            {/* Background text — bright white */}
                            <div
                                className="absolute inset-0 p-3 text-xs leading-relaxed pointer-events-none select-none"
                                style={{ color: 'rgba(255, 255, 255, 0.88)', filter: `blur(${blur}px)`, transition: 'filter 0.3s ease' }}
                            >
                                <p className="font-bold" style={{ color: '#f59e0b' }}>🧮 Calculadora de Serviços</p>
                                <p className="mt-1">Fronha ×6 — R$ 18,00</p>
                                <p>Edredom Queen ×1 — R$ 65,00</p>
                                <p>Cobertor ×2 — R$ 44,00</p>
                                <p className="mt-1 font-bold" style={{ color: '#f59e0b' }}>R$ 127,00</p>
                                <p className="mt-1">Notas: 3 anotações ativas</p>
                            </div>

                            <div className="relative z-10 rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                                style={{
                                    background: `radial-gradient(circle at center, rgba(30, 30, 45, ${modalMid}) 0%, rgba(30, 30, 45, ${modalAvg}) 50%, rgba(30, 30, 45, ${modalEdge}) 100%)`,
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-gradient">Confirmar Exclusão</p>
                                    <span className="text-xs opacity-60">✕</span>
                                </div>
                                <p className="text-xs text-white/80 mb-3">Deseja realmente excluir este registro do histórico?</p>
                                <div className="flex gap-2 mt-4 justify-end">
                                    <div className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70">Cancelar</div>
                                    <div className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold">Confirmar</div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-center text-[var(--text-muted)] italic">Ajuste os sliders e veja o efeito aqui</p>
                    </div>
                </div>
            </div>

            {/* Items Modal */}
            <ItemsModal
                open={itemsModalOpen}
                onClose={() => setItemsModalOpen(false)}
                catalogType={itemsCatalog}
                onSaved={() => toast('Catálogo atualizado!', 'info')}
            />

            {/* Unsaved Changes Confirm Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
                    <div className="relative z-10 glass-card p-8 max-w-md w-full space-y-5 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">⚠️</div>
                            <div>
                                <h3 className="text-lg font-bold">Descartar alterações?</h3>
                                <p className="text-xs text-[var(--text-muted)]">Suas configurações de aparência foram modificadas</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Todas as alterações feitas nos sliders serão perdidas. Deseja continuar?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="btn btn-secondary text-sm"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleDiscard}
                                className="btn text-sm px-5 py-2 rounded-xl font-semibold text-white bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"
                            >
                                🗑️ Descartar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
