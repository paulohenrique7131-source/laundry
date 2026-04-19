import type { Note } from './types';

export type NoteFilter = 'all' | 'mine' | 'received';

export function filterNotes(notes: Note[], filter: NoteFilter, currentUserId?: string | null): Note[] {
  if (filter === 'mine') {
    return notes.filter((note) => note.authorId === currentUserId);
  }
  if (filter === 'received') {
    return notes.filter((note) => note.recipients?.includes(currentUserId ?? ''));
  }
  return notes;
}

export function isUnreadTargetedNote(note: Note, currentUserId?: string | null): boolean {
  if (!currentUserId) return false;
  return Boolean(note.recipients?.includes(currentUserId) && !note.readBy?.includes(currentUserId));
}

export function getUnreadNotesCount(notes: Note[], currentUserId?: string | null): number {
  return notes.filter((note) => isUnreadTargetedNote(note, currentUserId)).length;
}

export function canEditNote(note: Note, currentUserId?: string | null): boolean {
  return Boolean(currentUserId && note.authorId === currentUserId);
}
