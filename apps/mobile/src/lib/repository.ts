import { createLaundryRepository } from '@laundry/data';
import { supabase } from './supabase';

const baseRepository = createLaundryRepository(supabase, { throwOnReadError: true });
const REQUEST_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, message = 'A operação demorou demais. Verifique a conexão e tente novamente.') {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const repository = {
  ...baseRepository,
  getConfig: (docId: string) => withTimeout(baseRepository.getConfig(docId)),
  setConfig: (docId: string, items: Parameters<typeof baseRepository.setConfig>[1]) => withTimeout(baseRepository.setConfig(docId, items)),
  getHistory: (...args: Parameters<typeof baseRepository.getHistory>) => withTimeout(baseRepository.getHistory(...args)),
  addHistory: (record: Parameters<typeof baseRepository.addHistory>[0]) => withTimeout(baseRepository.addHistory(record)),
  updateHistory: (record: Parameters<typeof baseRepository.updateHistory>[0]) => withTimeout(baseRepository.updateHistory(record)),
  deleteHistory: (id: string) => withTimeout(baseRepository.deleteHistory(id)),
  clearHistory: (...args: Parameters<typeof baseRepository.clearHistory>) => withTimeout(baseRepository.clearHistory(...args)),
  getUsers: () => withTimeout(baseRepository.getUsers()),
  getNotes: () => withTimeout(baseRepository.getNotes()),
  addNote: (note: Parameters<typeof baseRepository.addNote>[0]) => withTimeout(baseRepository.addNote(note)),
  updateNote: (note: Parameters<typeof baseRepository.updateNote>[0]) => withTimeout(baseRepository.updateNote(note)),
  markNoteAsRead: (id: string) => withTimeout(baseRepository.markNoteAsRead(id)),
  markRead: (id: string) => withTimeout(baseRepository.markRead(id)),
  deleteNote: (id: string) => withTimeout(baseRepository.deleteNote(id)),
  getSettings: () => withTimeout(baseRepository.getSettings()),
  setSettings: (partial: Parameters<typeof baseRepository.setSettings>[0]) => withTimeout(baseRepository.setSettings(partial)),
  getJobRuns: () => withTimeout(baseRepository.getJobRuns()),
  setJobRun: (job: Parameters<typeof baseRepository.setJobRun>[0]) => withTimeout(baseRepository.setJobRun(job)),
};
