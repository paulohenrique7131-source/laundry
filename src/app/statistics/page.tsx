'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';

const StatisticsClient = dynamic(() => import('@/components/statistics/StatisticsClient'), { ssr: false });

export default function StatisticsPage() {
    return (
        <AuthGuard>
            <StatisticsClient />
        </AuthGuard>
    );
}
