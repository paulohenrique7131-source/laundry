import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNotes, addNote, updateNote, deleteNote, getUsers, markNoteAsRead } from '@/storage/db';
import { useToast } from '@/context/ToastContext';
import { Modal, Confirm } from '@/components/ui/Modal';
import type { Note } from '@/types';

function noteTimestamp(note: Note) {
    const value = note.updatedAt || note.createdAt;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function previewContent(content: string, maxLength = 160) {
    const normalized = content.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default function NotesClient() {
    const { userId, role } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [notes, setNotes] = useState<Note[]>([]);
    const [users, setUsers] = useState<{ id: string; role: string; email: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<'all' | 'mine' | 'received'>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [newContent, setNewContent] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private' | 'targeted'>('private');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const focusedNoteId = searchParams.get('noteId');

    const load = useCallback(async () => {
        setLoading(true);
        const [notesData, usersData] = await Promise.all([getNotes(), getUsers()]);
        setNotes(notesData);
        setUsers(usersData);
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredNotes = useMemo(() => notes.filter((note) => {
        if (filter === 'mine') return note.authorId === userId;
        if (filter === 'received') return note.recipients?.includes(userId || '');
        return true;
    }), [filter, notes, userId]);

    const linkedNotes = useMemo(
        () => filteredNotes.filter((note) => note.relatedRecordId).sort((a, b) => noteTimestamp(b) - noteTimestamp(a)),
        [filteredNotes],
    );
    const standaloneNotes = useMemo(
        () => filteredNotes.filter((note) => !note.relatedRecordId).sort((a, b) => noteTimestamp(b) - noteTimestamp(a)),
        [filteredNotes],
    );

    const updateSearchParams = useCallback((nextNoteId?: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextNoteId) params.set('noteId', nextNoteId);
        else params.delete('noteId');

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    useEffect(() => {
        if (!focusedNoteId || loading) return;
        const match = notes.find((note) => note.id === focusedNoteId);
        if (!match) return;
        setSelectedNote(match);
        setFilter('all');

        const element = document.getElementById(`note-card-${focusedNoteId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [focusedNoteId, loading, notes]);

    const handleSave = async () => {
        if (!newContent.trim()) {
            toast('A nota não pode ficar vazia', 'error');
            return;
        }

        if (editingNote) {
            if (editingNote.authorId !== userId) {
                toast('Você só pode editar suas próprias notas', 'error');
                return;
            }

            const updatedNote: Note = {
                ...editingNote,
                content: newContent,
                visibility,
                recipients: visibility === 'targeted' ? selectedRecipients : [],
                updatedAt: new Date().toISOString(),
            };
            await updateNote(updatedNote);
            setSelectedNote(updatedNote);
            toast('Nota atualizada');
        } else {
            if (!userId) return;
            const newNote: Note = {
                id: uuidv4(),
                content: newContent,
                authorId: userId,
                authorRole: role || undefined,
                visibility,
                recipients: visibility === 'targeted' ? selectedRecipients : [],
                readBy: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const createdId = await addNote(newNote);
            toast('Nota criada');
            updateSearchParams(createdId);
        }

        setIsModalOpen(false);
        setEditingNote(null);
        setNewContent('');
        setVisibility('private');
        setSelectedRecipients([]);
        await load();
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        await deleteNote(deleteId);
        if (selectedNote?.id === deleteId) {
            setSelectedNote(null);
            updateSearchParams(null);
        }
        setDeleteId(null);
        await load();
        toast('Nota excluída');
    };

    const handleMarkRead = async (note: Note) => {
        if (!userId) return;
        await markNoteAsRead(note.id);
        toast('Marcado como lido');
        await load();
    };

    const openEdit = (note: Note) => {
        if (note.authorId !== userId) return;
        setSelectedNote(null);
        setEditingNote(note);
        setNewContent(note.content);
        setVisibility(note.visibility);
        setSelectedRecipients(note.recipients || []);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setSelectedNote(null);
        setEditingNote(null);
        setNewContent('');
        setVisibility('private');
        setSelectedRecipients([]);
        setIsModalOpen(true);
    };

    const openNoteDetail = (note: Note) => {
        setSelectedNote(note);
        updateSearchParams(note.id);
    };

    const closeNoteDetail = () => {
        setSelectedNote(null);
        updateSearchParams(null);
    };

    const renderNotesSection = (title: string, subtitle: string, items: Note[]) => {
        if (items.length === 0) return null;

        return (
            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
                    </div>
                    <span className="badge badge-sky">{items.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((note) => {
                        const isUnread = note.recipients?.includes(userId || '') && !note.readBy?.includes(userId || '');
                        const isMine = note.authorId === userId;
                        const readCount = note.readBy?.length || 0;
                        const recipientsCount = note.recipients?.length || 0;
                        const isFocused = focusedNoteId === note.id;

                        return (
                            <div
                                id={`note-card-${note.id}`}
                                key={note.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openNoteDetail(note)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openNoteDetail(note);
                                    }
                                }}
                                className={`glass-card p-5 flex flex-col h-full relative group transition-all duration-300 text-left ${isUnread ? 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse-slow' : ''} ${isFocused ? 'ring-2 ring-[var(--accent)] shadow-[0_0_24px_rgba(245,158,11,0.22)]' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className={`w-2 h-2 rounded-full ${note.visibility === 'public' ? 'bg-emerald-500' : (note.visibility === 'targeted' ? 'bg-indigo-500' : 'bg-amber-500')}`} />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            {note.visibility === 'public' ? 'Público' : (note.visibility === 'targeted' ? 'Mensagem' : 'Privado')}
                                        </span>
                                        {note.relatedRecordId ? <span className="badge badge-amber">Planilha vinculada</span> : null}
                                        {isUnread ? <span className="badge badge-red ml-1">Nova</span> : null}
                                    </div>
                                    {isMine ? (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-white/10 rounded" type="button" onClick={(event) => { event.stopPropagation(); openEdit(note); }}>✏️</button>
                                            <button className="p-1 hover:bg-red-500/20 text-red-400 rounded" type="button" onClick={(event) => { event.stopPropagation(); setDeleteId(note.id); }}>🗑️</button>
                                        </div>
                                    ) : null}
                                </div>

                                <p className="text-[var(--text-primary)] whitespace-pre-wrap flex-1 mb-4">{previewContent(note.content)}</p>

                                {note.visibility === 'targeted' ? (
                                    <div className="mb-3 pt-3 border-t border-[var(--glass-border)]">
                                        {isMine ? (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Lido por <span className="text-[var(--text-primary)] font-medium">{readCount}</span> de {recipientsCount}
                                            </p>
                                        ) : isUnread ? (
                                            <button className="btn btn-primary btn-xs w-full" type="button" onClick={(event) => { event.stopPropagation(); void handleMarkRead(note); }}>
                                                ✅ Marcar como lido
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1 text-xs text-emerald-500 font-medium">
                                                <span>✓✓</span> Lido
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mt-auto">
                                    <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                                    {note.authorRole ? (
                                        <div className="flex flex-col items-end">
                                            <span className="badge badge-sky">{note.authorRole === 'manager' ? 'Gerência' : 'Governança'}</span>
                                            {!isMine ? <span className="text-[10px] mt-0.5">por {note.authorRole}</span> : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
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

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner" /></div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="text-3xl mb-3">📝</p>
                    <p>Nenhuma nota encontrada</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {renderNotesSection('Notas vinculadas a planilhas', 'Notas criadas a partir do histórico ou associadas a registros.', linkedNotes)}
                    {renderNotesSection('Outras notas', 'Anotações gerais e mensagens do quadro.', standaloneNotes)}
                </div>
            )}

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
                                <input type="radio" name="visibility" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="accent-[var(--accent)]" />
                                <span className="text-sm">Privado</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="visibility" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="accent-[var(--accent)]" />
                                <span className="text-sm">Público</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="visibility" checked={visibility === 'targeted'} onChange={() => setVisibility('targeted')} className="accent-[var(--accent)]" />
                                <span className="text-sm">Mensagem Direta</span>
                            </label>
                        </div>

                        {visibility === 'targeted' ? (
                            <div className="bg-[var(--glass-bg)] p-3 rounded-lg border border-[var(--glass-border)] animate-fade-in">
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Destinatários:</label>
                                <div className="space-y-2 max-h-[100px] overflow-y-auto">
                                    {users.filter((u) => u.id !== userId).map((u) => (
                                        <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipients.includes(u.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRecipients((prev) => [...prev, u.id]);
                                                    else setSelectedRecipients((prev) => prev.filter((id) => id !== u.id));
                                                }}
                                                className="checkbox checkbox-xs"
                                            />
                                            <span className="text-sm">{u.email} ({u.role})</span>
                                        </label>
                                    ))}
                                    {users.filter((u) => u.id !== userId).length === 0 ? (
                                        <p className="text-xs text-[var(--text-muted)] italic">Nenhum outro usuário encontrado.</p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={() => void handleSave()}>Salvar</button>
                    </div>
                </div>
            </Modal>

            <Modal open={!!selectedNote} onClose={closeNoteDetail} title="Detalhes da Nota">
                {selectedNote ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-sky">{selectedNote.authorRole === 'manager' ? 'Gerência' : selectedNote.authorRole === 'gov' ? 'Governança' : 'Nota'}</span>
                            <span className="badge badge-amber">{selectedNote.visibility === 'public' ? 'Público' : selectedNote.visibility === 'targeted' ? 'Mensagem' : 'Privado'}</span>
                            {selectedNote.relatedRecordId ? <span className="badge badge-emerald">Planilha vinculada</span> : null}
                        </div>

                        <div className="glass-card-static p-4 rounded-xl border border-[var(--glass-border)]">
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] space-y-1">
                            <p>Criada em {new Date(selectedNote.createdAt).toLocaleString('pt-BR')}</p>
                            <p>Atualizada em {new Date(selectedNote.updatedAt).toLocaleString('pt-BR')}</p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            {selectedNote.relatedRecordId ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/dashboard?recordId=${selectedNote.relatedRecordId}&noteId=${selectedNote.id}`)}>
                                    Abrir planilha vinculada
                                </button>
                            ) : null}
                            {selectedNote.authorId === userId ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selectedNote)}>
                                    Editar
                                </button>
                            ) : null}
                            {selectedNote.authorId === userId ? (
                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(selectedNote.id)}>
                                    Excluir
                                </button>
                            ) : null}
                            <button className="btn btn-primary btn-sm" onClick={closeNoteDetail}>Fechar</button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Confirm
                open={!!deleteId}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteId(null)}
                title="Excluir Nota"
                message="Tem certeza que deseja excluir esta nota?"
                danger
            />
        </div>
    );
}
