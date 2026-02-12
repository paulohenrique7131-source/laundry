'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';

const SettingsClient = dynamic(() => import('@/components/settings/SettingsClient'), { ssr: false });

export default function SettingsPage() {
    return (
        <AuthGuard>
            <SettingsClient />
        </AuthGuard>
    );
}
