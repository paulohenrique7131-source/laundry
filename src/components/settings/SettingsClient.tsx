'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { ItemsModal } from '@/components/calculator/ItemsModal';

export default function SettingsClient() {
    const { settings, updateSettings, theme, toggleTheme } = useApp();
    const { toast } = useToast();
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [itemsCatalog, setItemsCatalog] = useState<'services' | 'trousseau'>('services');

    const blur = settings.blurIntensity ?? 16;
    const opacity = settings.cardOpacity ?? 0.15;
    const modalMid = settings.modalOpacityMiddle ?? 0.9;
    const modalAvg = settings.modalOpacityAverage ?? 0.6;
    const modalEdge = settings.modalOpacityEdges ?? 0.2;

    function openItemsModal(type: 'services' | 'trousseau') {
        setItemsCatalog(type);
        setItemsModalOpen(true);
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Personalize o app ao seu gosto</p>
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
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cards & Fundos</p>

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
                                    updateSettings({ blurIntensity: v });
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
                                    updateSettings({ cardOpacity: v });
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
                                    updateSettings({ modalOpacityMiddle: v });
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
                                    updateSettings({ modalOpacityAverage: v });
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
                                    updateSettings({ modalOpacityEdges: v });
                                    document.documentElement.style.setProperty('--modal-opacity-edge', `${v}`);
                                }}
                                className="w-full accent-[var(--accent)] h-1.5 rounded-full appearance-none bg-[var(--glass-border)] cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Live Preview column */}
                    <div className="w-full lg:w-80 space-y-4">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Preview em Tempo Real</p>

                        {/* Card preview */}
                        <div className="rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                            style={{
                                background: `rgba(255, 255, 255, ${opacity})`,
                                backdropFilter: `blur(${blur}px)`,
                                WebkitBackdropFilter: `blur(${blur}px)`,
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">📊</div>
                                <div>
                                    <p className="text-sm font-semibold">Exemplo de Card</p>
                                    <p className="text-xs text-[var(--text-muted)]">Blur: {blur}px • Opac: {(opacity * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                <span>Subtotal</span>
                                <span className="font-semibold">R$ 150,00</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-[var(--accent)] mt-1">
                                <span>TOTAL</span>
                                <span>R$ 225,00</span>
                            </div>
                        </div>

                        {/* Modal preview */}
                        <div className="rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                            style={{
                                background: `radial-gradient(circle at center, rgba(30, 30, 45, ${modalMid}) 0%, rgba(30, 30, 45, ${modalAvg}) 50%, rgba(30, 30, 45, ${modalEdge}) 100%)`,
                                backdropFilter: `blur(${blur}px)`,
                                WebkitBackdropFilter: `blur(${blur}px)`,
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-gradient">Exemplo de Pop-up</p>
                                <span className="text-xs opacity-60">✕</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 rounded bg-white/10 w-full" />
                                <div className="h-3 rounded bg-white/10 w-3/4" />
                                <div className="h-3 rounded bg-white/10 w-1/2" />
                            </div>
                            <div className="flex gap-2 mt-4 justify-end">
                                <div className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-[var(--text-secondary)]">Cancelar</div>
                                <div className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold">Salvar</div>
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
        </div>
    );
}
