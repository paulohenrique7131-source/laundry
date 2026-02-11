'use client';

import React from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    large?: boolean;
}

export function Modal({ open, onClose, title, children, large }: ModalProps) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`modal-content glass-card-static p-6 ${large ? 'modal-content-lg' : ''}`}>
                {title && (
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gradient">{title}</h2>
                        <button
                            onClick={onClose}
                            className="btn-ghost btn-icon rounded-full text-lg hover:text-[var(--accent)]"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

// Confirm dialog
interface ConfirmProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
}

export function Confirm({ open, onConfirm, onCancel, title, message, confirmText = 'Confirmar', danger }: ConfirmProps) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="modal-content glass-card-static p-6" style={{ maxWidth: 420 }}>
                {title && <h3 className="text-lg font-bold mb-3">{title}</h3>}
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
                    <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
