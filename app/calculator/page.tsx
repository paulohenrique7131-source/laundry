import { CalculatorClient } from '@/components/calculator/CalculatorClient';

export default function CalculatorPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-md">Calculadora</h1>
                    <p className="text-slate-400">Gerencie pedidos de Serviços e Enxoval</p>
                </div>
            </div>

            <CalculatorClient />
        </div>
    );
}
