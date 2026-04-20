-- Non-destructive audit for the Laundry statistics pipeline.
-- Run this in the Supabase SQL editor before and after applying
-- 20260419_statistics_v2_api.sql.

-- 1. Table columns: history
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'history'
order by ordinal_position;

-- 2. Table columns: history_items
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'history_items'
order by ordinal_position;

-- 3. Relevant constraints for history_items
select
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public'
  and c.conrelid = 'public.history_items'::regclass
order by conname;

-- 4. Orphan rows in history_items
select count(*) as orphan_history_items
from public.history_items hi
left join public.history h on h.id = hi.history_id
where h.id is null;

-- 5. Relevant indexes
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and (
    (tablename = 'history' and indexdef ilike '%date%')
    or (tablename = 'history' and indexdef ilike '%type%')
    or (tablename = 'history' and indexdef ilike '%user_id%')
    or (tablename = 'history_items' and indexdef ilike '%history_id%')
  )
order by tablename, indexname;

-- 6. Check whether history.notes exists
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'history'
    and column_name = 'notes'
) as history_notes_exists;

-- 7. Check whether the aggregated RPC exists
select exists (
  select 1
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_statistics_aggregates'
) as statistics_rpc_exists;

-- 8. Quick sample of populated notes in history
select
  id,
  date,
  type,
  notes
from public.history
where notes is not null
order by created_at desc nulls last
limit 10;

-- 9. Quick sample of fallback note rows that may still exist in notes
select
  id,
  related_record_id,
  left(content, 120) as content_preview,
  created_at,
  updated_at
from public.notes
where content like '[[history-note]]%'
order by updated_at desc nulls last
limit 20;

-- 10. Manual aggregate spot-check query.
-- Replace dates/type as needed.
with filtered_history as (
  select
    h.id,
    h.date,
    h.total
  from public.history h
  where h.user_id = auth.uid()
    and h.date >= date '2026-04-01'
    and h.date <= date '2026-04-19'
    and ('Ambos' = 'Ambos' or h.type = 'Ambos')
),
filtered_items as (
  select
    hi.name,
    hi.line_total,
    coalesce(hi.qty_lp, 0) + coalesce(hi.qty_p, 0) + coalesce(hi.qty, 0) as volume
  from public.history_items hi
  join filtered_history fh on fh.id = hi.history_id
)
select jsonb_build_object(
  'summary', jsonb_build_object(
    'totalValue', coalesce((select sum(total) from filtered_history), 0),
    'recordCount', coalesce((select count(*) from filtered_history), 0)
  ),
  'costByCategory', coalesce((
    select jsonb_agg(jsonb_build_object('name', name, 'value', value))
    from (
      select name, sum(line_total)::numeric as value
      from filtered_items
      group by name
      order by sum(line_total) desc, name asc
    ) cost_rows
  ), '[]'::jsonb),
  'volumeByCategory', coalesce((
    select jsonb_agg(jsonb_build_object('name', name, 'value', value))
    from (
      select name, sum(volume)::numeric as value
      from filtered_items
      group by name
      order by sum(volume) desc, name asc
    ) volume_rows
  ), '[]'::jsonb),
  'trendByDay', coalesce((
    select jsonb_agg(jsonb_build_object('date', date, 'value', value) order by date asc)
    from (
      select date, sum(total)::numeric as value
      from filtered_history
      group by date
      order by date asc
    ) trend_rows
  ), '[]'::jsonb)
) as manual_statistics_payload;
