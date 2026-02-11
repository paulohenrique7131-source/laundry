'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getNotes, addNote, updateNote, deleteNote } from '@/storage/db';
import { useToast } from '@/context/ToastContext';
import { Confirm } from '@/components/ui/Modal';
import type { Note } from '@/types';

function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Remove script tags and event handlers
    div.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
    div.querySelectorAll('*').forEach((el) => {
        const attrs = el.attributes;
        for (let i = attrs.length - 1; i >= 0; i--) {
            if (attrs[i].name.startsWith('on')) el.removeAttribute(attrs[i].name);
        }
    });
    return div.innerHTML;
}

export default function NotesClient() {
    const { toast } = useToast();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const editorRef = useRef<HTMLDivElement>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getNotes();
        setNotes(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    function execCmd(cmd: string) {
        document.execCommand(cmd, false);
        editorRef.current?.focus();
    }

    async function handleSave() {
        const content = editorRef.current?.innerHTML || '';
        if (!content.trim() || content === '<br>') {
            toast('Escreva algo antes de salvar', 'error');
            return;
        }

        const sanitized = sanitizeHTML(content);

        if (editingId) {
            const existing = notes.find((n) => n.id === editingId);
            if (existing) {
                const updated: Note = { ...existing, content: sanitized, updatedAt: new Date().toISOString() };
                await updateNote(updated);
                toast('Nota atualizada!');
            }
        } else {
            const note: Note = {
                id: uuidv4(),
                content: sanitized,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addNote(note);
            toast('Nota salva! ✨');
        }

        if (editorRef.current) editorRef.current.innerHTML = '';
        setEditingId(null);
        load();
    }

    function startEdit(note: Note) {
        setEditingId(note.id);
        if (editorRef.current) {
            editorRef.current.innerHTML = note.content;
            editorRef.current.focus();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        setEditingId(null);
        if (editorRef.current) editorRef.current.innerHTML = '';
    }

    async function confirmDelete() {
        if (deleteId) {
            await deleteNote(deleteId);
            setDeleteId(null);
            if (editingId === deleteId) cancelEdit();
            load();
            toast('Nota excluída');
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Notas</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Anotações rápidas</p>
            </div>

            {/* Editor */}
            <div className="glass-card p-5">
                <div className="flex gap-2 mb-3">
                    <button className="btn btn-ghost btn-xs font-bold" onClick={() => execCmd('bold')} title="Negrito">B</button>
                    <button className="btn btn-ghost btn-xs italic" onClick={() => execCmd('italic')} title="Itálico">I</button>
                    <button className="btn btn-ghost btn-xs underline" onClick={() => execCmd('underline')} title="Sublinhado">U</button>
                    <div className="flex-1" />
                    {editingId && (
                        <button className="btn btn-ghost btn-xs text-[var(--text-muted)]" onClick={cancelEdit}>Cancelar edição</button>
                    )}
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    className="input min-h-[120px] max-h-[300px] overflow-y-auto text-sm leading-relaxed focus:ring-0"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    suppressContentEditableWarning
                />
                <div className="flex justify-end mt-3">
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>
                        {editingId ? '✏️ Atualizar Nota' : '💾 Salvar Nota'}
                    </button>
                </div>
            </div>

            {/* Notes list */}
            {loading ? (
                <div className="flex justify-center py-10"><div className="spinner" /></div>
            ) : notes.length === 0 ? (
                <div className="glass-card p-12 text-center text-[var(--text-muted)]">
                    <p className="text-3xl mb-3">📝</p>
                    <p>Nenhuma nota ainda</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {notes.map((note) => (
                        <div key={note.id} className="glass-card p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="text-xs text-[var(--text-muted)]">
                                    {new Date(note.createdAt).toLocaleString('pt-BR')}
                                    {note.updatedAt !== note.createdAt && (
                                        <span className="ml-2">(editado {new Date(note.updatedAt).toLocaleString('pt-BR')})</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button className="btn btn-ghost btn-xs" onClick={() => startEdit(note)} title="Editar">✏️</button>
                                    <button className="btn btn-ghost btn-xs" onClick={() => setDeleteId(note.id)} title="Excluir">🗑️</button>
                                </div>
                            </div>
                            <div
                                className="text-sm leading-relaxed text-[var(--text-secondary)]"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                        </div>
                    ))}
                </div>
            )}

            <Confirm
                open={!!deleteId}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                title="Excluir Nota"
                message="Tem certeza que deseja excluir esta nota?"
                danger
                confirmText="Excluir"
            />
        </div>
    );
}
