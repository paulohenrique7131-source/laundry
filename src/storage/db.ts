import { supabase } from '@/lib/supabase';
import type { ServiceItem, TrousseauItem, HistoryRecord, HistoryItemDetail, Note, AppSettings, JobRun } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ====== HELPERS ======
let cachedUserId: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserId(): Promise<string> {
    // Return cached ID if still valid
    if (cachedUserId && Date.now() < cacheExpiry) return cachedUserId;

    // Fast path: getSession reads from local memory (instant)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        cachedUserId = session.user.id;
        cacheExpiry = Date.now() + CACHE_TTL;
        return cachedUserId;
    }

    // Slow fallback: getUser makes a network request (only if session missing)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        cachedUserId = user.id;
        cacheExpiry = Date.now() + CACHE_TTL;
        return cachedUserId;
    }

    cachedUserId = null;
    throw new Error('Not authenticated');
}

// Clear cache on sign-out
supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
        cachedUserId = null;
        cacheExpiry = 0;
    }
});

// ====== CONFIG ======
export async function getConfig(docId: string): Promise<ServiceItem[] | TrousseauItem[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('config')
        .select('items')
        .eq('user_id', userId)
        .eq('doc_id', docId)
        .single();

    if (error || !data) return [];
    return data.items as ServiceItem[] | TrousseauItem[];
}

export async function setConfig(docId: string, items: ServiceItem[] | TrousseauItem[]) {
    const userId = await getUserId();
    await supabase
        .from('config')
        .upsert(
            { user_id: userId, doc_id: docId, items },
            { onConflict: 'user_id,doc_id' }
        );
}

// ====== HISTORY ======
// ====== HISTORY ======
export async function getHistory(
    startDate?: string,
    endDate?: string,
    typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval'
): Promise<HistoryRecord[]> {
    const userId = await getUserId();
    let query = supabase
        .from('history')
        .select('*, history_items(*)')
        //.eq('user_id', userId) // history might be shared? Start with user specific
        .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (typeFilter && typeFilter !== 'Ambos') query = query.eq('type', typeFilter);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        date: row.date as string,
        type: row.type as 'Serviços' | 'Enxoval',
        serviceType: row.service_type as HistoryRecord['serviceType'],
        subtotal: Number(row.subtotal),
        multiplier: Number(row.multiplier),
        total: Number(row.total),
        createdAt: row.created_at as string,
        updatedAt: (row.updated_at as string) || undefined,
        notes: (row.notes as string) || undefined,
        author: (row.author as string) || undefined,
        authorId: (row.author_id as string) || undefined,
        items: ((row.history_items as Record<string, unknown>[]) || []).map((item: Record<string, unknown>) => ({
            itemId: item.item_id as string,
            name: item.name as string,
            priceLP: item.price_lp != null ? Number(item.price_lp) : undefined,
            priceP: item.price_p != null ? Number(item.price_p) : undefined,
            price: item.price != null ? Number(item.price) : undefined,
            qtyLP: item.qty_lp != null ? Number(item.qty_lp) : undefined,
            qtyP: item.qty_p != null ? Number(item.qty_p) : undefined,
            qty: item.qty != null ? Number(item.qty) : undefined,
            lineTotal: Number(item.line_total),
        })),
    }));
}

export async function addHistory(record: HistoryRecord) {
    const userId = await getUserId();

    const { error: histError } = await supabase
        .from('history')
        .insert({
            id: record.id,
            user_id: userId,
            date: record.date,
            type: record.type,
            service_type: record.serviceType,
            subtotal: record.subtotal,
            multiplier: record.multiplier,
            total: record.total,
            notes: record.notes || null,
            author: record.author || null,
            author_id: record.authorId || userId,
            created_at: record.createdAt,
            updated_at: record.updatedAt || null,
        });

    if (histError) throw histError;

    if (record.items.length > 0) {
        const rows = record.items.map((item: HistoryItemDetail) => ({
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

        const { error: itemsError } = await supabase
            .from('history_items')
            .insert(rows);

        if (itemsError) throw itemsError;
    }
}

export async function updateHistory(record: HistoryRecord) {
    const userId = await getUserId();

    await supabase
        .from('history')
        .update({
            date: record.date,
            type: record.type,
            service_type: record.serviceType,
            subtotal: record.subtotal,
            multiplier: record.multiplier,
            total: record.total,
            notes: record.notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', record.id)
        .eq('user_id', userId);

    // Replace items: delete old, insert new
    await supabase
        .from('history_items')
        .delete()
        .eq('history_id', record.id);

    if (record.items.length > 0) {
        const rows = record.items.map((item: HistoryItemDetail) => ({
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

        await supabase.from('history_items').insert(rows);
    }
}

export async function deleteHistory(id: string) {
    const userId = await getUserId();
    await supabase
        .from('history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
}

export async function clearHistory(startDate?: string, endDate?: string, typeFilter?: 'Ambos' | 'Serviços' | 'Enxoval') {
    const records = await getHistory(startDate, endDate, typeFilter);
    const ids = records.map((r) => r.id);
    if (ids.length === 0) return;

    const userId = await getUserId();
    await supabase
        .from('history')
        .delete()
        .eq('user_id', userId)
        .in('id', ids);
}

// ====== USERS ======
const ROLE_EMAIL_MAP: Record<string, string> = {
    manager: 'manager@lavanderia.local',
    gov: 'gov@lavanderia.local',
};

export async function getUsers(): Promise<{ id: string; role: string; email: string }[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role');

    if (error || !data) return [];

    return data.map((profile: { id: string; role: string }) => ({
        id: profile.id,
        role: profile.role,
        email: ROLE_EMAIL_MAP[profile.role] || `${profile.role}@lavanderia.local`,
    }));
}

// ====== NOTES ======
export async function getNotes(): Promise<Note[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`user_id.eq.${userId},visibility.eq.public,recipients.cs.{${userId}}`) // My notes OR public OR sent to me
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        content: row.content as string,
        authorId: row.user_id as string,
        authorRole: (row.author_role as string) || undefined,
        visibility: (row.visibility as 'public' | 'private' | 'targeted') || 'private',
        recipients: (row.recipients as string[]) || [],
        readBy: (row.read_by as string[]) || [],
        relatedRecordId: (row.related_record_id as string) || undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    }));
}

export async function addNote(note: Note) {
    const userId = await getUserId();
    await supabase.from('notes').insert({
        id: note.id,
        user_id: userId,
        content: note.content,
        author_role: note.authorRole,
        visibility: note.visibility,
        recipients: note.recipients,
        read_by: note.readBy,
        related_record_id: note.relatedRecordId,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
    });
}

export async function updateNote(note: Note) {
    const userId = await getUserId();
    // Only the owner can update content/visibility/recipients
    await supabase
        .from('notes')
        .update({
            content: note.content,
            visibility: note.visibility,
            recipients: note.recipients,
            updated_at: new Date().toISOString(),
        })
        .eq('id', note.id)
        .eq('user_id', userId); // Owner-only guard
}

export async function markNoteAsRead(noteId: string) {
    const userId = await getUserId();
    // Append userId to read_by array (Supabase supports array_append via RPC or manual merge)
    const { data } = await supabase
        .from('notes')
        .select('read_by')
        .eq('id', noteId)
        .single();

    const currentReadBy: string[] = (data?.read_by as string[]) || [];

    if (!currentReadBy.includes(userId)) {
        await supabase
            .from('notes')
            .update({ read_by: [...currentReadBy, userId] })
            .eq('id', noteId);
    }
}


export async function deleteNote(id: string) {
    const userId = await getUserId();
    await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
}

// ====== SETTINGS ======
export async function getSettings(): Promise<AppSettings> {
    const defaults: AppSettings = {
        theme: 'dark',
        lastCatalog: 'services',
        lastServiceType: 'Normal',
        blurIntensity: 16,
        cardOpacity: 0.15,
        showAbout: true,
        modalOpacityMiddle: 0.9,
        modalOpacityAverage: 0.6,
        modalOpacityEdges: 0.2,
    };

    try {
        const userId = await getUserId();
        const { data } = await supabase
            .from('settings')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (data?.data) {
            return { ...defaults, ...(data.data as Partial<AppSettings>) };
        }
    } catch {
        // Not authenticated or no settings yet
    }

    return defaults;
}

export async function setSettings(partial: Partial<AppSettings>) {
    const userId = await getUserId();
    const current = await getSettings();
    const merged = { ...current, ...partial };

    await supabase
        .from('settings')
        .upsert(
            { user_id: userId, data: merged },
            { onConflict: 'user_id' }
        );
}

// ====== JOB RUNS ======
export async function getJobRuns(): Promise<JobRun[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('job_runs')
        .select('*')
        .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        status: row.status as JobRun['status'],
        result: (row.result as string) || undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    }));
}

export async function setJobRun(job: JobRun) {
    const userId = await getUserId();
    await supabase.from('job_runs').upsert({
        id: job.id,
        user_id: userId,
        name: job.name,
        status: job.status,
        result: job.result || null,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
    });
}
