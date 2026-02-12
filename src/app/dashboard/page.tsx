'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';

const DashboardClient = dynamic(() => import('@/components/dashboard/DashboardClient'), { ssr: false });

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardClient />
        </AuthGuard>
    );
}
