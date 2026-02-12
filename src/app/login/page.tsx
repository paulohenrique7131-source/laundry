'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { userId: authUserId, loading, signIn } = useAuth();
    const router = useRouter();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Load saved credentials
    useEffect(() => {
        const saved = localStorage.getItem('lav_remember');
        if (saved) {
            try {
                const { id, pwd } = JSON.parse(saved);
                setUserId(id);
                setPassword(pwd);
                setRemember(true);
            } catch { /* ignore */ }
        }
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && authUserId) {
            router.replace('/calculator');
        }
    }, [authUserId, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const err = await signIn(userId.trim(), password);
        if (err) {
            setError(err);
            setSubmitting(false);
            return;
        }

        // Save or clear remember
        if (remember) {
            localStorage.setItem('lav_remember', JSON.stringify({ id: userId.trim(), pwd: password }));
        } else {
            localStorage.removeItem('lav_remember');
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
            }}>
                <div className="spinner" />
            </div>
        );
    }

    if (authUserId) return null;

    return (
        <div className="bg-gradient-radial" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div className="glass-card-static animate-scale-in" style={{
                width: '100%',
                maxWidth: 420,
                padding: '40px 32px',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        margin: '0 auto 16px',
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--accent), #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 800,
                        margin: '0 0 4px',
                    }}>
                        <span className="text-gradient">Lavanderia</span>
                    </h1>
                    <p style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        margin: 0,
                    }}>Entre com suas credenciais</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* User ID */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>ID do Usuário</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="manager ou gov"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                            style={{ fontSize: 15 }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>Senha</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            style={{ fontSize: 15 }}
                        />
                    </div>

                    {/* Remember */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                    }}>
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            style={{
                                accentColor: 'var(--accent)',
                                width: 16,
                                height: 16,
                                cursor: 'pointer',
                            }}
                        />
                        Lembrar meus dados
                    </label>

                    {/* Error */}
                    {error && (
                        <div className="animate-fade-in" style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontSize: 13,
                            fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || !userId.trim() || !password}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: 15,
                            fontWeight: 700,
                            marginTop: 4,
                            opacity: submitting ? 0.7 : 1,
                        }}
                    >
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                Entrando...
                            </span>
                        ) : 'Entrar'}
                    </button>
                </form>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 24,
                    marginBottom: 0,
                }}>
                    Gestão profissional de lavanderia
                </p>
            </div>
        </div>
    );
}
