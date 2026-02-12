'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';

const CalculatorClient = dynamic(() => import('@/components/calculator/CalculatorClient'), { ssr: false });

export default function CalculatorPage() {
    return (
        <AuthGuard>
            <CalculatorClient />
        </AuthGuard>
    );
}
