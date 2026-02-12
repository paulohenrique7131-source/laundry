'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

const navItems = [
    { href: '/calculator', label: 'Calculadora', icon: '🧮' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/statistics', label: 'Estatísticas', icon: '📈' },
    { href: '/notes', label: 'Notas', icon: '📝' },
    { href: '/settings', label: 'Configurações', icon: '⚙️' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useApp();
    const { role, signOut } = useAuth();

    const handleLogout = async () => {
        onClose();
        await signOut();
        router.replace('/login');
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
            )}

            <aside className={`sidebar glass-card-static ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold text-black shadow-lg">
                            L
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight">Lavanderia</h1>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{role ?? 'Cloud'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 no-underline ${active
                                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-[var(--accent)] border border-amber-500/20 shadow-lg shadow-amber-500/5'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                                {active && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-glow" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme toggle + Logout */}
                <div className="mt-auto pt-6 border-t border-[var(--glass-border)] flex flex-col gap-1">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all duration-300"
                    >
                        <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
                        <span>{theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}</span>
                        <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-amber-500/30' : 'bg-sky-400/30'
                            }`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${theme === 'dark' ? 'left-0.5 bg-amber-400' : 'left-5 bg-sky-400'
                                }`} />
                        </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                        <span className="text-lg">🚪</span>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
