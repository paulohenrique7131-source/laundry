'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { ItemsModal } from '@/components/calculator/ItemsModal';
import { v4 as uuidv4 } from 'uuid';
import type { CatalogDefinition } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function SettingsClient() {
    const { settings, updateSettings, saveSettings } = useApp();
    const { signOut, user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'appearance' | 'tables' | 'account'>('appearance');
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [itemsCatalog, setItemsCatalog] = useState<string>('services');

    // Custom Catalog State
    const [newCatalogName, setNewCatalogName] = useState('');
    const [newCatalogType, setNewCatalogType] = useState<'service' | 'product'>('product');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPass, setLoadingPass] = useState(false);

    // Simple dirty flag â€” any slider change sets it to true
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
        toast('Configuracoes salvas!', 'success');
    }, [saveSettings, toast]);

    const handleDiscard = useCallback(() => {
        // Reload the page to restore from DB
        window.location.reload();
    }, []);

    const handleAddCatalog = () => {
        if (!newCatalogName.trim()) return;

        const newCat: CatalogDefinition = {
            id: uuidv4(),
            name: newCatalogName,
            type: newCatalogType,
            columns: newCatalogType === 'service' ? ['lp', 'p'] : ['single']
        };

        const currentCustom = settings.customCatalogs || [];
        const newSettings = { customCatalogs: [...currentCustom, newCat] };
        updateSettings(newSettings);
        setNewCatalogName('');
        toast('Catalogo criado. Lembre-se de salvar.', 'success');
    };

    const handleRemoveCatalog = (id: string) => {
        const currentCustom = settings.customCatalogs || [];
        updateSettings({ customCatalogs: currentCustom.filter(c => c.id !== id) });
        toast('Catalogo removido. Lembre-se de salvar.', 'info');
    };

    function openItemsModal(type: string) {
        setItemsCatalog(type);
        setItemsModalOpen(true);
    }

    const handleUpdatePassword = async () => {
        if (!newPassword) return;
        if (newPassword.length < 6) {
            toast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast('As senhas nao conferem', 'error');
            return;
        }

        setLoadingPass(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setLoadingPass(false);

        if (error) {
            console.error(error);
            toast('Erro ao atualizar: ' + error.message, 'error');
        } else {
            toast('Senha atualizada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        toast('Saiu da conta', 'info');
        window.location.href = '/login'; // Force redirect
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Configuracoes</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Personalize o app ao seu gosto</p>
                </div>
                {isDirty && activeTab === 'appearance' && (
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
                            Salvar alteracoes
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl w-max border border-[var(--glass-border)]">
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'appearance' ? 'bg-[var(--glass-hover)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    Aparencia
                </button>
                <button
                    onClick={() => setActiveTab('tables')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'tables' ? 'bg-[var(--glass-hover)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    Tabelas e valores
                </button>
                <button
                    onClick={() => setActiveTab('account')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'account' ? 'bg-[var(--glass-hover)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    Conta
                </button>
            </div>

            {/* TAB: Appearance */}
            {activeTab === 'appearance' && (
                <div className="glass-card p-8 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-6">Personalizacao visual</h2>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Controls column */}
                        <div className="flex-1 space-y-6">
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

                        </div>

                        {/* Live Preview column */}
                        <div className="w-full lg:w-80 space-y-4">
                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Preview em tempo real</p>

                            {/* Card preview â€” blur on background text */}
                            <div className="relative rounded-2xl overflow-hidden min-h-[200px]">
                                {/* Background text â€” bright white, blur applied directly */}
                                <div
                                    className="absolute inset-0 p-4 text-xs leading-relaxed pointer-events-none select-none"
                                    style={{ color: 'rgba(255, 255, 255, 0.92)', filter: `blur(${blur}px)`, transition: 'filter 0.3s ease' }}
                                >
                                    <p className="font-bold text-sm mb-2" style={{ color: '#f59e0b' }}>Washly - Registro #4821</p>
                                    <p>Camisa Social x3 - R$ 45,00</p>
                                    <p>Calca Jeans x2 - R$ 30,00</p>
                                    <p>Lencol King x1 - R$ 28,00</p>
                                    <p>Toalha de Banho x4 - R$ 52,00</p>
                                    <p className="mt-2 font-semibold">Subtotal: R$ 155,00</p>
                                    <p className="font-bold" style={{ color: '#f59e0b' }}>Total (x1.5): R$ 232,50</p>
                                    <p className="mt-3">Data: 12/02/2026</p>
                                    <p>Tipo: Servicos - Expresso</p>
                                    <p className="mt-2">Cliente: Governanca - #0042</p>
                                    <p>Obs: Pecas urgentes p/ evento</p>
                                </div>

                                {/* Card overlay */}
                                <div className="relative z-10 rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                                    style={{
                                        background: `rgba(255, 255, 255, ${opacity})`,
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm font-bold">W</div>
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

                            {/* Modal preview â€” blur on background text */}
                            <div className="relative rounded-2xl overflow-hidden min-h-[160px]">
                                {/* Background text â€” bright white */}
                                <div
                                    className="absolute inset-0 p-3 text-xs leading-relaxed pointer-events-none select-none"
                                    style={{ color: 'rgba(255, 255, 255, 0.88)', filter: `blur(${blur}px)`, transition: 'filter 0.3s ease' }}
                                >
                                    <p className="font-bold" style={{ color: '#f59e0b' }}>Calculadora de Servicos</p>
                                    <p className="mt-1">Fronha x6 - R$ 18,00</p>
                                    <p>Edredom Queen x1 - R$ 65,00</p>
                                    <p>Cobertor x2 - R$ 44,00</p>
                                    <p className="mt-1 font-bold" style={{ color: '#f59e0b' }}>R$ 127,00</p>
                                    <p className="mt-1">Notas: 3 anotacoes ativas</p>
                                </div>

                                <div className="relative z-10 rounded-2xl p-5 border border-[var(--glass-border)] transition-all duration-300"
                                    style={{
                                        background: `radial-gradient(circle at center, rgba(30, 30, 45, ${modalMid}) 0%, rgba(30, 30, 45, ${modalAvg}) 50%, rgba(30, 30, 45, ${modalEdge}) 100%)`,
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-gradient">Confirmar exclusao</p>
                                        <span className="text-xs opacity-60">x</span>
                                    </div>
                                    <p className="text-xs text-white/80 mb-3">Deseja realmente excluir este registro do historico?</p>
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
            )}

            {/* TAB: Tables & Values */}
            {activeTab === 'tables' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="glass-card p-8">
                        <h2 className="text-xl font-semibold mb-3">Catalogos padrao</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">Estes sao os catalogos basicos do sistema. Voce pode editar os itens e precos.</p>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn btn-secondary" onClick={() => openItemsModal('services')}>
                                Editar Servicos (Washly)
                            </button>
                            <button className="btn btn-secondary" onClick={() => openItemsModal('trousseau')}>
                                Editar Enxoval
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-8 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500/50 to-orange-600/50"></div>
                        <h2 className="text-xl font-semibold mb-3">Catalogos personalizados</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">Crie tabelas para outros setores (Restaurante, Frigobar, etc).</p>

                        <div className="space-y-4">
                            {/* List existing */}
                            {settings.customCatalogs?.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--glass-border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--glass-hover)] flex items-center justify-center text-xl">
                                            {cat.type === 'service' ? 'SV' : 'CT'}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{cat.name}</h3>
                                            <p className="text-xs text-[var(--text-muted)] capitalize">{cat.type === 'service' ? 'Servico (LP/P)' : 'Produto (Preco unico)'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-secondary" onClick={() => openItemsModal(cat.id)}>
                                            Editar itens
                                        </button>
                                        <button className="btn btn-sm btn-ghost text-red-400 hover:bg-red-400/10" onClick={() => handleRemoveCatalog(cat.id)}>
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add New */}
                            <div className="p-4 border-2 border-dashed border-[var(--glass-border)] rounded-xl flex flex-col md:flex-row gap-4 items-end md:items-center">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Nome do catalogo</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: Frigobar, Restaurante..."
                                        value={newCatalogName}
                                        onChange={(e) => setNewCatalogName(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-auto">
                                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Tipo</label>
                                    <select
                                        className="input min-w-[140px]"
                                        value={newCatalogType}
                                        onChange={(e: any) => setNewCatalogType(e.target.value)}
                                    >
                                        <option value="product">Produto Simples</option>
                                        <option value="service" >Servico (LP/P)</option>
                                    </select>
                                </div>
                                <button
                                    className="btn btn-primary whitespace-nowrap w-full md:w-auto"
                                    onClick={handleAddCatalog}
                                    disabled={!newCatalogName.trim()}
                                >
                                    + Criar Tabela
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Account */}
            {activeTab === 'account' && (
                <div className="glass-card p-8 flex flex-col items-center animate-fade-in max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-6 text-3xl">
                        W
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Gerenciamento de Conta</h2>
                    <p className="text-[var(--text-secondary)] mb-8">
                        Logado como: <strong className="text-[var(--text-primary)]">{user?.email}</strong>
                    </p>

                    <div className="w-full max-w-sm space-y-4 mb-8">
                        <div className="text-left">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Nova Senha</label>
                            <input
                                type="password"
                                className="input"
                                placeholder=""
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="text-left">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Confirmar Senha</label>
                            <input
                                type="password"
                                className="input"
                                placeholder=""
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary w-full"
                            onClick={handleUpdatePassword}
                            disabled={loadingPass || !newPassword}
                        >
                            {loadingPass ? 'Atualizando...' : 'Alterar Senha'}
                        </button>
                    </div>

                    <div className="w-full h-px bg-[var(--glass-border)] mb-8"></div>

                    <div className="w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-3 text-left">Acoes da sessao</h3>
                        <button
                            className="btn btn-secondary w-full text-red-400 hover:bg-red-400/10 border-red-400/20"
                            onClick={handleSignOut}
                        >
                            Sair da conta
                        </button>
                    </div>
                </div>
            )}

            {/* Items Modal */}
            <ItemsModal
                open={itemsModalOpen}
                onClose={() => setItemsModalOpen(false)}
                catalogType={itemsCatalog}
                onSaved={() => toast('Catalogo atualizado.', 'info')}
            />

            {/* Unsaved Changes Confirm Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
                    <div className="relative z-10 glass-card p-8 max-w-md w-full space-y-5 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg font-bold">!</div>
                            <div>
                                <h3 className="text-lg font-bold">Descartar alteracoes?</h3>
                                <p className="text-xs text-[var(--text-muted)]">Suas configuracoes de aparencia foram modificadas</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Todas as alteracoes feitas nos sliders serao perdidas. Deseja continuar?
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
                                Descartar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
