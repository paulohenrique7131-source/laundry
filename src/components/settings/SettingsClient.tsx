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

    function openItemsModal(type: 'services' | 'trousseau') {
        setItemsCatalog(type);
        setItemsModalOpen(true);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Personalize o app</p>
            </div>

            {/* Items section */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">📦 Catálogo de Itens</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Gerencie os itens de Serviços e Enxoval</p>
                <div className="flex flex-wrap gap-3">
                    <button className="btn btn-secondary" onClick={() => openItemsModal('services')}>
                        ✏️ Editar Serviços
                    </button>
                    <button className="btn btn-secondary" onClick={() => openItemsModal('trousseau')}>
                        ✏️ Editar Enxoval
                    </button>
                </div>
            </div>

            {/* Theme section */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">🎨 Aparência</h2>

                <div className="space-y-5">
                    {/* Theme toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Tema</p>
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

                    {/* Blur intensity */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Intensidade de Blur</p>
                            <span className="text-xs text-[var(--text-muted)] tabular-nums">{blur}px</span>
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
                            <span className="text-xs text-[var(--text-muted)] tabular-nums">{(opacity * 100).toFixed(0)}%</span>
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
                </div>
            </div>

            {/* About */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">ℹ️ Sobre</h2>
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <p><strong>Lavanderia (Local)</strong> v1.0.0</p>
                    <p>App offline para gestão de lavanderia.</p>
                    <p>Dados armazenados localmente via IndexedDB.</p>
                    <p className="text-[var(--text-muted)] text-xs mt-4">Desenvolvido com Next.js, TypeScript, Tailwind, Chart.js e Dexie.</p>
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
