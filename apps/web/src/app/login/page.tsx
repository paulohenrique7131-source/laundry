'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/layout/BrandLogo';

export default function LoginPage() {
    const { userId: authUserId, loading, signIn } = useAuth();
    const router = useRouter();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('lav_remember');
        if (saved) {
            try {
                const { id, pwd } = JSON.parse(saved);
                setUserId(id);
                setPassword(pwd);
                setRemember(true);
            } catch {
                // ignore invalid remembered credentials
            }
        }
    }, []);

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

        if (remember) {
            localStorage.setItem('lav_remember', JSON.stringify({ id: userId.trim(), pwd: password }));
        } else {
            localStorage.removeItem('lav_remember');
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary)',
                }}
            >
                <div className="spinner" />
            </div>
        );
    }

    if (authUserId) return null;

    return (
        <div
            className="bg-gradient-radial"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                className="glass-card-static animate-scale-in"
                style={{
                    width: '100%',
                    maxWidth: 420,
                    padding: '40px 32px',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            width: 96,
                            height: 96,
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <BrandLogo size="login" priority />
                    </div>
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 800,
                            margin: '0 0 4px',
                        }}
                    >
                        <span className="text-gradient">Washly</span>
                    </h1>
                    <p
                        style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            margin: 0,
                        }}
                    >
                        Entre com suas credenciais
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            ID do usuario
                        </label>
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

                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Senha
                        </label>
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

                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            style={{ width: 16, height: 16 }}
                        />
                        Lembrar minhas credenciais
                    </label>

                    {error && (
                        <div
                            style={{
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ marginTop: 4, minHeight: 46, fontSize: 15, fontWeight: 700 }}
                    >
                        {submitting ? 'Entrando...' : 'Entrar na Washly'}
                    </button>
                </form>

                <p
                    style={{
                        margin: '24px 0 0',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                    }}
                >
                    Gestao profissional da Washly
                </p>
            </div>
        </div>
    );
}
