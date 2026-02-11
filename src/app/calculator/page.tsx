'use client';

import dynamic from 'next/dynamic';

const CalculatorClient = dynamic(() => import('@/components/calculator/CalculatorClient'), { ssr: false });

export default function CalculatorPage() {
    return <CalculatorClient />;
}
