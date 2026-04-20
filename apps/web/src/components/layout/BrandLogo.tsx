'use client';

import Image from 'next/image';
import React from 'react';

const sizeClasses = {
    sidebar: 'h-20 w-20 rounded-[1.75rem]',
    header: 'h-11 w-11 rounded-xl',
    login: 'h-24 w-24 rounded-[1.75rem]',
} as const;

type BrandLogoSize = keyof typeof sizeClasses;

export function BrandLogo({
    size = 'sidebar',
    priority = false,
    className = '',
}: {
    size?: BrandLogoSize;
    priority?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`relative shrink-0 overflow-hidden bg-white/5 shadow-[0_14px_40px_rgba(245,158,11,0.18)] ring-1 ring-white/8 ${sizeClasses[size]} ${className}`.trim()}
        >
            <Image
                src="/washly-logo.png"
                alt="Washly"
                fill
                priority={priority}
                sizes={size === 'login' ? '96px' : size === 'sidebar' ? '80px' : '44px'}
                className="object-contain p-1"
            />
        </div>
    );
}
