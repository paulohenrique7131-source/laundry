'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    // On login page, render children without sidebar/shell
    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="bg-gradient-radial min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20 glass-card-static px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="btn-ghost btn-icon text-lg"
                >
                    ☰
                </button>
                <span className="text-sm font-bold text-gradient">Lavanderia</span>
            </div>

            <main className="main-content md:pt-0 pt-16">
                <div className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
