"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, LayoutDashboard, BarChart3, StickyNote, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
    { name: 'Calculadora', href: '/calculator', icon: Calculator },
    { name: 'Histórico', href: '/dashboard', icon: LayoutDashboard }, // Dashboard as History view
    { name: 'Estatísticas', href: '/statistics', icon: BarChart3 },
    { name: 'Notas', href: '/notes', icon: StickyNote },
    { name: 'Ajustes', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false); // Mobile state

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 right-4 z-50 p-2 glass rounded-lg text-white"
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 glass-card m-4 md:m-0 md:rounded-r-2xl md:rounded-l-none border-r border-white/10",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    <div className="mb-10 flex items-center justify-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-sm">
                            Lavanderia
                        </h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-blue-600/20 text-blue-200 shadow-lg shadow-blue-900/20 border border-blue-500/30"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon size={20} className={cn("transition-colors", isActive ? "text-blue-400" : "group-hover:text-white")} />
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && (
                                        <div className="absolute inset-0 bg-blue-400/10 blur-xl -z-10" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5 text-center text-xs text-slate-500">
                        <p>Premium v1.0</p>
                    </div>
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
