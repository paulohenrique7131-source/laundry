import { cn } from '@/lib/utils'; // We need to create lib/utils for clsx/tailwind-merge

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6",
                hoverEffect && "transition-transform hover:scale-[1.01] hover:bg-slate-800/50 cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
