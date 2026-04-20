'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNotes } from '@/storage/db';
import { BrandLogo } from '@/components/layout/BrandLogo';

const navItems = [
    { href: '/calculator', label: 'Calculadora', icon: '🧮' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/statistics', label: 'Estatisticas', icon: '📈' },
    { href: '/notes', label: 'Notas', icon: '📝' },
    { href: '/settings', label: 'Configuracoes', icon: '⚙️' },
];

const ROLE_LABELS: Record<string, string> = {
    gov: 'Governanca',
    manager: 'Gerencia',
};

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { role, userId, signOut } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const checkUnread = async () => {
            const notes = await getNotes();
            const count = notes.filter((n) => n.recipients?.includes(userId) && !n.readBy?.includes(userId)).length;
            setUnreadCount(count);
        };
        void checkUnread();
        const interval = setInterval(() => {
            void checkUnread();
        }, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const handleLogout = async () => {
        onClose();
        await signOut();
        router.replace('/login');
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}

            <aside className={`sidebar glass-card-static ${isOpen ? 'open' : ''}`}>
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-4">
                        <BrandLogo size="sidebar" />
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold tracking-tight text-gradient">Washly</h1>
                            <p className="truncate text-xs text-[var(--text-muted)]">{role ? ROLE_LABELS[role] ?? role : 'Cloud'}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium no-underline transition-all duration-300 animate-stagger-in ${active
                                    ? 'border border-amber-500/20 bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-[var(--accent)] shadow-lg shadow-amber-500/5'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <span className={`text-lg transition-transform duration-300 ${active ? 'nav-link-icon-active scale-110' : ''}`}>{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                                {item.href === '/notes' && unreadCount > 0 && (
                                    <span className="badge badge-red ml-auto animate-pulse">{unreadCount}</span>
                                )}
                                {active && item.href !== '/notes' && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] nav-link-active-dot" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto flex flex-col gap-1 border-t border-[var(--glass-border)] pt-6">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400/80 transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <span className="text-lg">🚪</span>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
