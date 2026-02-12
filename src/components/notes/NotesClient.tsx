import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { getNotes, addNote, updateNote, deleteNote, getUsers, markNoteAsRead } from '@/storage/db';
import { useToast } from '@/context/ToastContext';
import { Modal, Confirm } from '@/components/ui/Modal';
import type { Note } from '@/types';

export default function NotesClient() {
    const { user, userId, role } = useAuth();
    const { toast } = useToast();
    const [notes, setNotes] = useState<Note[]>([]);
    const [users, setUsers] = useState<{ id: string; role: string; email: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filter, setFilter] = useState<'all' | 'mine' | 'received'>('all');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [newContent, setNewContent] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private' | 'targeted'>('private');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

    // Delete
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const [notesData, usersData] = await Promise.all([getNotes(), getUsers()]);
        setNotes(notesData);
        setUsers(usersData);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Filter logic
    const filteredNotes = notes.filter((note) => {
        if (filter === 'mine') return note.authorId === userId;
        if (filter === 'received') return note.recipients?.includes(userId || '');
        return true;
    });

    const handleSave = async () => {
        if (!newContent.trim()) {
            toast('A nota não pode ficar vazia', 'error');
            return;
        }

        if (editingNote) {
            // Only allow updating content if author
            if (editingNote.authorId !== userId) {
                toast('Você só pode editar suas próprias notas', 'error');
                return;
            }
            await updateNote({
                ...editingNote,
                content: newContent,
                visibility,
                recipients: visibility === 'targeted' ? selectedRecipients : [],
                updatedAt: new Date().toISOString(),
            });
            toast('Nota atualizada');
        } else {
            if (!userId) return;
            const newNote: Note = {
                id: uuidv4(),
                content: newContent,
                authorId: userId,
                authorRole: role || undefined,
                visibility: visibility,
                recipients: visibility === 'targeted' ? selectedRecipients : [],
                readBy: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addNote(newNote);
            toast('Nota criada');
        }

        setIsModalOpen(false);
        setEditingNote(null);
        setNewContent('');
        setVisibility('private');
        setSelectedRecipients([]);
        load();
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteNote(deleteId);
            setDeleteId(null);
            load();
            toast('Nota excluída');
        }
    };

    const handleMarkRead = async (note: Note) => {
        if (!userId) return;
        await markNoteAsRead(note.id);
        toast('Marcado como lido');
        load(); // Refresh to update UI
    }

    const openEdit = (note: Note) => {
        if (note.authorId !== userId) return;
        setEditingNote(note);
        setNewContent(note.content);
        setVisibility(note.visibility as any);
        setSelectedRecipients(note.recipients || []);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingNote(null);
        setNewContent('');
        setVisibility('private');
        setSelectedRecipients([]);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Quadro de Avisos</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Comunicados, anotações e mensagens</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    + Nova Nota
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-2 flex gap-2 w-fit">
                {(['all', 'mine', 'received'] as const).map((f) => (
                    <button
                        key={f}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-[var(--accent)] text-white shadow-lg' : 'hover:bg-white/5 text-[var(--text-secondary)]'}`}
                        onClick={() => setFilter(f)}
                    >
                        {{ all: 'Todas', mine: 'Minhas', received: 'Recebidas' }[f]}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner" /></div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="text-3xl mb-3">📝</p>
                    <p>Nenhuma nota encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map((note) => {
                        const isUnread = note.recipients?.includes(userId || '') && !note.readBy?.includes(userId || '');
                        const isMine = note.authorId === userId;
                        const readCount = note.readBy?.length || 0;
                        const recipientsCount = note.recipients?.length || 0;

                        return (
                            <div key={note.id} className={`glass-card p-5 flex flex-col h-full relative group transition-all duration-300 ${isUnread ? 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse-slow' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${note.visibility === 'public' ? 'bg-emerald-500' : (note.visibility === 'targeted' ? 'bg-indigo-500' : 'bg-amber-500')}`} />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            {note.visibility === 'public' ? 'Público' : (note.visibility === 'targeted' ? 'Mensagem' : 'Privado')}
                                        </span>
                                        {isUnread && <span className="badge badge-red ml-1">Nova</span>}
                                    </div>
                                    {isMine && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-white/10 rounded" onClick={() => openEdit(note)}>✏️</button>
                                            <button className="p-1 hover:bg-red-500/20 text-red-400 rounded" onClick={() => setDeleteId(note.id)}>🗑️</button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-[var(--text-primary)] whitespace-pre-wrap flex-1 mb-4">{note.content}</p>

                                {/* Message Stats / Actions */}
                                {note.visibility === 'targeted' && (
                                    <div className="mb-3 pt-3 border-t border-[var(--glass-border)]">
                                        {isMine ? (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Lido por <span className="text-[var(--text-primary)] font-medium">{readCount}</span> de {recipientsCount}
                                            </p>
                                        ) : (
                                            isUnread ? (
                                                <button className="btn btn-primary btn-xs w-full" onClick={() => handleMarkRead(note)}>
                                                    ✅ Marcar como lido
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1 text-xs text-emerald-500 font-medium">
                                                    <span>✓✓</span> Lido
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mt-auto">
                                    <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                                    {note.authorRole && (
                                        <div className="flex flex-col items-end">
                                            <span className="badge badge-sky">{note.authorRole === 'manager' ? 'Gerência' : 'Governança'}</span>
                                            {!isMine && <span className="text-[10px] mt-0.5">por {note.authorRole}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNote ? 'Editar Nota' : 'Nova Nota'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Conteúdo</label>
                        <textarea
                            className="input w-full min-h-[120px] resize-y"
                            placeholder="Escreva sua mensagem..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Visibilidade</label>
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === 'private'}
                                    onChange={() => setVisibility('private')}
                                    className="accent-[var(--accent)]"
                                />
                                <span className="text-sm">Privado</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === 'public'}
                                    onChange={() => setVisibility('public')}
                                    className="accent-[var(--accent)]"
                                />
                                <span className="text-sm">Público</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === 'targeted'}
                                    onChange={() => setVisibility('targeted')}
                                    className="accent-[var(--accent)]"
                                />
                                <span className="text-sm">Mensagem Direta</span>
                            </label>
                        </div>

                        {/* Recipient Selection */}
                        {visibility === 'targeted' && (
                            <div className="bg-[var(--glass-bg)] p-3 rounded-lg border border-[var(--glass-border)] animate-fade-in">
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Destinatários:</label>
                                <div className="space-y-2 max-h-[100px] overflow-y-auto">
                                    {users.filter(u => u.id !== userId).map(u => (
                                        <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipients.includes(u.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRecipients(prev => [...prev, u.id]);
                                                    else setSelectedRecipients(prev => prev.filter(id => id !== u.id));
                                                }}
                                                className="checkbox checkbox-xs"
                                            />
                                            <span className="text-sm">{u.email} ({u.role})</span>
                                        </label>
                                    ))}
                                    {users.filter(u => u.id !== userId).length === 0 && (
                                        <p className="text-xs text-[var(--text-muted)] italic">Nenhum outro usuário encontrado.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>Salvar</button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <Confirm
                open={!!deleteId}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                title="Excluir Nota"
                message="Tem certeza que deseja excluir esta nota?"
                danger
            />
        </div>
    );
}
