'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { userId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (userId) {
      router.replace('/calculator');
    } else {
      router.replace('/login');
    }
  }, [userId, loading, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" />
    </div>
  );
}
