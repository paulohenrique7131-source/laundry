'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';

const NotesClient = dynamic(() => import('@/components/notes/NotesClient'), { ssr: false });

export default function NotesPage() {
    return (
        <AuthGuard>
            <NotesClient />
        </AuthGuard>
    );
}
