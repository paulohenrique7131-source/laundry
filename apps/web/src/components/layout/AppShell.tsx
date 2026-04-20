'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

export function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { userId, loading: authLoading } = useAuth();
    const { ready: appReady } = useApp();
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (isLoginPage) return;
        if (authLoading) return;
        if (!userId) {
            router.replace('/login');
        }
    }, [authLoading, isLoginPage, router, userId]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!authLoading && !userId) {
        return null;
    }

    if (authLoading || !appReady) {
        return (
            <div className="bg-gradient-radial min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="bg-gradient-radial min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="glass-card-static fixed top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 md:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="btn-ghost btn-icon text-lg"
                    aria-label="Abrir menu"
                >
                    ☰
                </button>
                <BrandLogo size="header" />
                <span className="text-base font-bold text-gradient">Washly</span>
            </div>

            <main className="main-content md:pt-0 pt-16">
                <div key={pathname} className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
