import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_SETTINGS,
  USER_MAP,
  mergeAppSettings,
  type AppSettings,
  type AppUserProfile,
  type HistoryItemDetail,
  type HistoryRecord,
  type JobRun,
  type Note,
  type ServiceItem,
  type TrousseauItem,
} from '@laundry/domain';

type CatalogItems = ServiceItem[] | TrousseauItem[];

interface EnvPair {
  url: string;
  key: string;
}

function envValue(...names: string[]): string | undefined {
  const staticEnvMap: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: globalThis?.process?.env?.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: globalThis?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: globalThis?.process?.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_SUPABASE_URL: globalThis?.process?.env?.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: globalThis?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: globalThis?.process?.env?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  for (const name of names) {
    const value = staticEnvMap[name];
    if (value) return value;
  }
  return undefined;
}

export function resolveSupabasePublicEnv(): EnvPair {
  const url = envValue('NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');
  const key = envValue(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );

  if (!url || !key) {
    throw new Error('Supabase public environment variables are missing.');
  }

  return { url, key };
}

function hasMissingHistoryNotesColumn(error: unknown): boolean {
  const message = String(
    (error as { message?: string; details?: string; hint?: string } | undefined)?.message ??
    (error as { details?: string } | undefined)?.details ??
    (error as { hint?: string } | undefined)?.hint ??
    '',
  ).toLowerCase();

  return message.includes('history.notes') || (message.includes('column') && message.includes('notes'));
}

function mapHistoryItem(row: Record<string, unknown>): HistoryItemDetail {
  return {
    itemId: row.item_id as string,
    name: row.name as string,
    priceLP: row.price_lp != null ? Number(row.price_lp) : undefined,
    priceP: row.price_p != null ? Number(row.price_p) : undefined,
    price: row.price != null ? Number(row.price) : undefined,
    qtyLP: row.qty_lp != null ? Number(row.qty_lp) : undefined,
    qtyP: row.qty_p != null ? Number(row.qty_p) : undefined,
    qty: row.qty != null ? Number(row.qty) : undefined,
    lineTotal: Number(row.line_total ?? 0),
  };
}

function mapHistoryRecord(row: Record<string, unknown>): HistoryRecord {
  return {
    id: row.id as string,
    date: row.date as string,
    type: row.type as string,
    serviceType: row.service_type as HistoryRecord['serviceType'],
    items: ((row.history_items as Record<string, unknown>[]) ?? []).map(mapHistoryItem),
    subtotal: Number(row.subtotal ?? 0),
    multiplier: Number(row.multiplier ?? 1),
    total: Number(row.total ?? 0),
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || undefined,
    author: (row.author as string) || undefined,
    authorId: (row.author_id as string) || undefined,
  };
}

export function createLaundryRepository(
  supabase: SupabaseClient,
  options?: {
    throwOnReadError?: boolean;
  },
) {
  const throwOnReadError = options?.throwOnReadError ?? false;
  let cachedUserId: string | null = null;
  let cacheExpiry = 0;
  const cacheTtl = 5 * 60 * 1000;

  const resetUserCache = () => {
    cachedUserId = null;
    cacheExpiry = 0;
  };

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      resetUserCache();
    }
  });

  async function getUserId(): Promise<string> {
    if (cachedUserId && Date.now() < cacheExpiry) {
      return cachedUserId;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user;
    if (sessionUser) {
      cachedUserId = sessionUser.id;
      cacheExpiry = Date.now() + cacheTtl;
      return cachedUserId;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      cachedUserId = user.id;
      cacheExpiry = Date.now() + cacheTtl;
      return cachedUserId;
    }

    resetUserCache();
    throw new Error('Not authenticated');
  }

  async function getConfig(docId: string): Promise<CatalogItems> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('config')
      .select('items')
      .eq('user_id', userId)
      .eq('doc_id', docId)
      .maybeSingle();

    if (error) {
      if (throwOnReadError) throw error;
      return [];
    }

    if (!data?.items) {
      return [];
    }

    return data.items as CatalogItems;
  }

  async function setConfig(docId: string, items: CatalogItems) {
    const userId = await getUserId();
    const { error } = await supabase
      .from('config')
      .upsert({ user_id: userId, doc_id: docId, items }, { onConflict: 'user_id,doc_id' });

    if (error) throw error;
  }

  async function getHistory(
    startDate?: string,
    endDate?: string,
    typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval',
  ): Promise<HistoryRecord[]> {
    let query = supabase
      .from('history')
      .select('*, history_items(*)')
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (typeFilter && typeFilter !== 'Ambos') query = query.eq('type', typeFilter);

    const { data, error } = await query;
    if (error) {
      if (throwOnReadError) throw error;
      return [];
    }

    if (!data) {
      return [];
    }

    return (data as Record<string, unknown>[]).map(mapHistoryRecord);
  }

  async function insertHistoryRow(record: HistoryRecord, includeNotes: boolean) {
    return supabase.from('history').insert({
      id: record.id,
      user_id: await getUserId(),
      date: record.date,
      type: record.type,
      service_type: record.serviceType,
      subtotal: record.subtotal,
      multiplier: record.multiplier,
      total: record.total,
      ...(includeNotes ? { notes: record.notes || null } : {}),
      author: record.author || null,
      author_id: record.authorId || (await getUserId()),
      created_at: record.createdAt,
      updated_at: record.updatedAt || null,
    });
  }

  async function addHistory(record: HistoryRecord) {
    const { error: historyError } = await insertHistoryRow(record, true);
    if (historyError) {
      if (!hasMissingHistoryNotesColumn(historyError)) throw historyError;
      const { error: fallbackError } = await insertHistoryRow(record, false);
      if (fallbackError) throw fallbackError;
    }

    if (record.items.length === 0) return;

    const rows = record.items.map((item) => ({
      id: uuidv4(),
      history_id: record.id,
      item_id: item.itemId,
      name: item.name,
      price_lp: item.priceLP ?? null,
      price_p: item.priceP ?? null,
      price: item.price ?? null,
      qty_lp: item.qtyLP ?? 0,
      qty_p: item.qtyP ?? 0,
      qty: item.qty ?? 0,
      line_total: item.lineTotal,
    }));

    const { error: itemsError } = await supabase.from('history_items').insert(rows);
    if (itemsError) throw itemsError;
  }

  async function updateHistory(record: HistoryRecord) {
    const userId = await getUserId();
    const payload = {
      date: record.date,
      type: record.type,
      service_type: record.serviceType,
      subtotal: record.subtotal,
      multiplier: record.multiplier,
      total: record.total,
      notes: record.notes || null,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from('history').update(payload).eq('id', record.id).eq('user_id', userId);
    if (error && hasMissingHistoryNotesColumn(error)) {
      ({ error } = await supabase.from('history').update({
        date: record.date,
        type: record.type,
        service_type: record.serviceType,
        subtotal: record.subtotal,
        multiplier: record.multiplier,
        total: record.total,
        updated_at: new Date().toISOString(),
      }).eq('id', record.id).eq('user_id', userId));
    }
    if (error) throw error;

    const { error: deleteError } = await supabase.from('history_items').delete().eq('history_id', record.id);
    if (deleteError) throw deleteError;

    if (record.items.length === 0) return;

    const rows = record.items.map((item) => ({
      id: uuidv4(),
      history_id: record.id,
      item_id: item.itemId,
      name: item.name,
      price_lp: item.priceLP ?? null,
      price_p: item.priceP ?? null,
      price: item.price ?? null,
      qty_lp: item.qtyLP ?? 0,
      qty_p: item.qtyP ?? 0,
      qty: item.qty ?? 0,
      line_total: item.lineTotal,
    }));

    const { error: insertError } = await supabase.from('history_items').insert(rows);
    if (insertError) throw insertError;
  }

  async function deleteHistory(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('history').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }

  async function clearHistory(startDate?: string, endDate?: string, typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval') {
    const records = await getHistory(startDate, endDate, typeFilter);
    const ids = records.map((record) => record.id);
    if (ids.length === 0) return;
    const userId = await getUserId();
    const { error } = await supabase.from('history').delete().eq('user_id', userId).in('id', ids);
    if (error) throw error;
  }

  async function getUsers(): Promise<AppUserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('id, role');
    if (error) {
      if (throwOnReadError) throw error;
      return [];
    }
    if (!data) return [];

    return data.map((profile: { id: string; role: string }) => ({
      id: profile.id,
      role: profile.role,
      email: USER_MAP[profile.role as keyof typeof USER_MAP] || `${profile.role}@lavanderia.local`,
    }));
  }

  async function getNotes(): Promise<Note[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .or(`user_id.eq.${userId},visibility.eq.public,recipients.cs.{${userId}}`)
      .order('created_at', { ascending: false });

    if (error) {
      if (throwOnReadError) throw error;
      return [];
    }
    if (!data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      content: row.content as string,
      authorId: row.user_id as string,
      authorRole: (row.author_role as string) || undefined,
      visibility: (row.visibility as Note['visibility']) || 'private',
      recipients: (row.recipients as string[]) || [],
      readBy: (row.read_by as string[]) || [],
      relatedRecordId: (row.related_record_id as string) || undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  }

  async function addNote(note: Note) {
    const userId = await getUserId();
    const { error } = await supabase.from('notes').insert({
      id: note.id,
      user_id: userId,
      content: note.content,
      author_role: note.authorRole,
      visibility: note.visibility,
      recipients: note.recipients ?? [],
      read_by: note.readBy ?? [],
      related_record_id: note.relatedRecordId ?? null,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });
    if (error) throw error;
  }

  async function updateNote(note: Note) {
    const userId = await getUserId();
    const { error } = await supabase
      .from('notes')
      .update({
        content: note.content,
        visibility: note.visibility,
        recipients: note.visibility === 'targeted' ? note.recipients ?? [] : [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', note.id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async function markNoteAsRead(noteId: string) {
    const userId = await getUserId();
    const { data, error } = await supabase.from('notes').select('read_by').eq('id', noteId).single();
    if (error) throw error;

    const readBy = ((data?.read_by as string[]) ?? []);
    if (readBy.includes(userId)) return;

    const { error: updateError } = await supabase.from('notes').update({ read_by: [...readBy, userId] }).eq('id', noteId);
    if (updateError) throw updateError;
  }

  async function deleteNote(id: string) {
    const userId = await getUserId();
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }

  async function getSettings(): Promise<AppSettings> {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase.from('settings').select('data').eq('user_id', userId).maybeSingle();
      if (error) {
        if (throwOnReadError) throw error;
        return DEFAULT_SETTINGS;
      }
      if (!data?.data) {
        return DEFAULT_SETTINGS;
      }
      return mergeAppSettings(data.data as Partial<AppSettings>);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async function setSettings(partial: Partial<AppSettings>) {
    const userId = await getUserId();
    const current = await getSettings();
    const data = mergeAppSettings({ ...current, ...partial });
    const { error } = await supabase.from('settings').upsert({ user_id: userId, data }, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async function getJobRuns(): Promise<JobRun[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from('job_runs').select('*').eq('user_id', userId);
    if (error) {
      if (throwOnReadError) throw error;
      return [];
    }
    if (!data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      status: row.status as JobRun['status'],
      result: (row.result as string) || undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  }

  async function setJobRun(job: JobRun) {
    const userId = await getUserId();
    const { error } = await supabase.from('job_runs').upsert({
      id: job.id,
      user_id: userId,
      name: job.name,
      status: job.status,
      result: job.result || null,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
    });
    if (error) throw error;
  }

  return {
    getConfig,
    setConfig,
    getHistory,
    addHistory,
    updateHistory,
    deleteHistory,
    clearHistory,
    getUsers,
    getNotes,
    addNote,
    updateNote,
    markNoteAsRead,
    markRead: markNoteAsRead,
    deleteNote,
    getSettings,
    setSettings,
    getJobRuns,
    setJobRun,
    resetUserCache,
  };
}
