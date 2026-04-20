import { createLaundryRepository } from '@laundry/data';
import { supabase } from '@/lib/supabase';

const repository = createLaundryRepository(supabase);

export const getConfig = repository.getConfig;
export const setConfig = repository.setConfig;
export const getHistory = repository.getHistory;
export const addHistory = repository.addHistory;
export const updateHistory = repository.updateHistory;
export const deleteHistory = repository.deleteHistory;
export const clearHistory = repository.clearHistory;
export const getUsers = repository.getUsers;
export const getNotes = repository.getNotes;
export const addNote = repository.addNote;
export const updateNote = repository.updateNote;
export const markNoteAsRead = repository.markNoteAsRead;
export const deleteNote = repository.deleteNote;
export const getSettings = repository.getSettings;
export const setSettings = repository.setSettings;
export const getJobRuns = repository.getJobRuns;
export const setJobRun = repository.setJobRun;
