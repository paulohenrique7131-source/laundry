"use client";

import { useState } from 'react';
import { useData } from "@/contexts/DataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Plus, Trash2 } from "lucide-react";

export default function NotesPage() {
    const { notes, addNote, deleteNote } = useData();
    const [newNote, setNewNote] = useState('');

    const handleAdd = () => {
        if (!newNote.trim()) return;
        addNote({
            id: crypto.randomUUID(),
            content: newNote,
            createdAt: Date.now()
        });
        setNewNote('');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">Notas</h1>

            <GlassCard>
                <div className="flex gap-4">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Escreva uma nova nota..."
                        className="w-full glass-input min-h-[100px] resize-none"
                    />
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleAdd} className="glass-button flex items-center gap-2">
                        <Plus size={18} /> Adicionar Nota
                    </button>
                </div>
            </GlassCard>

            <div className="grid gap-4">
                {notes.map(note => (
                    <GlassCard key={note.id} className="relative group">
                        <div className="whitespace-pre-wrap text-slate-300">{note.content}</div>
                        <div className="mt-4 text-xs text-slate-500">
                            {new Date(note.createdAt).toLocaleString()}
                        </div>
                        <button
                            onClick={() => deleteNote(note.id)}
                            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>
                    </GlassCard>
                ))}
                {notes.length === 0 && (
                    <p className="text-center text-slate-500 py-8">Nenhuma nota encontrada.</p>
                )}
            </div>
        </div>
    );
}
