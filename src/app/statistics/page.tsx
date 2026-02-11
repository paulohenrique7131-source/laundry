'use client';

import dynamic from 'next/dynamic';

const StatisticsClient = dynamic(() => import('@/components/statistics/StatisticsClient'), { ssr: false });

export default function StatisticsPage() {
    return <StatisticsClient />;
}
