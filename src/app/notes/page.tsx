'use client';

import dynamic from 'next/dynamic';

const NotesClient = dynamic(() => import('@/components/notes/NotesClient'), { ssr: false });

export default function NotesPage() {
    return <NotesClient />;
}
