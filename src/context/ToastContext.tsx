'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastData {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastCtx {
    toasts: ToastData[];
    toast: (message: string, type?: ToastData['type']) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastCtx>({
    toasts: [],
    toast: () => { },
    dismiss: () => { },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastData['type'] = 'success') => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => dismiss(id), 4000);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            {/* Toast renderer */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto animate-slide-up glass-card px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all duration-300 ${t.type === 'success' ? 'border-emerald-500/30 text-emerald-300' :
                                t.type === 'error' ? 'border-red-500/30 text-red-300' :
                                    t.type === 'warning' ? 'border-amber-500/30 text-amber-300' :
                                        'border-sky-500/30 text-sky-300'
                            }`}
                        onClick={() => dismiss(t.id)}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
