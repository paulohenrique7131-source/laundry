ALTER TABLE public.history
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.history h
SET notes = SUBSTRING(n.content FROM CHAR_LENGTH('[[history-note]]') + 1)
FROM public.notes n
WHERE h.id = n.related_record_id
  AND h.notes IS NULL
  AND n.content LIKE '[[history-note]]%';

CREATE INDEX IF NOT EXISTS idx_history_user_date_desc
  ON public.history (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_history_user_type_date_desc
  ON public.history (user_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_history_items_history_id
  ON public.history_items (history_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'history_items_history_id_fkey'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.history_items hi
      LEFT JOIN public.history h ON h.id = hi.history_id
      WHERE h.id IS NULL
    ) THEN
      ALTER TABLE public.history_items
        ADD CONSTRAINT history_items_history_id_fkey
        FOREIGN KEY (history_id)
        REFERENCES public.history (id)
        ON DELETE CASCADE;
    ELSE
      RAISE NOTICE 'Skipping history_items_history_id_fkey because orphan rows exist in public.history_items';
    END IF;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.get_statistics_aggregates(
  start_date date,
  end_date date,
  type_filter text DEFAULT 'Ambos'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized_type text := COALESCE(NULLIF(type_filter, ''), 'Ambos');
  result jsonb;
BEGIN
  WITH filtered_history AS (
    SELECT
      h.id,
      h.date,
      h.total
    FROM public.history h
    WHERE h.user_id = auth.uid()
      AND (start_date IS NULL OR h.date >= start_date)
      AND (end_date IS NULL OR h.date <= end_date)
      AND (
        normalized_type = 'Ambos'
        OR h.type = normalized_type
      )
  ),
  filtered_items AS (
    SELECT
      hi.name,
      hi.line_total,
      COALESCE(hi.qty_lp, 0) + COALESCE(hi.qty_p, 0) + COALESCE(hi.qty, 0) AS volume
    FROM public.history_items hi
    INNER JOIN filtered_history fh ON fh.id = hi.history_id
  ),
  cost_by_category AS (
    SELECT
      fi.name,
      SUM(fi.line_total)::numeric AS value
    FROM filtered_items fi
    GROUP BY fi.name
    ORDER BY SUM(fi.line_total) DESC, fi.name ASC
  ),
  volume_by_category AS (
    SELECT
      fi.name,
      SUM(fi.volume)::numeric AS value
    FROM filtered_items fi
    GROUP BY fi.name
    ORDER BY SUM(fi.volume) DESC, fi.name ASC
  ),
  trend_by_day AS (
    SELECT
      fh.date,
      SUM(fh.total)::numeric AS value
    FROM filtered_history fh
    GROUP BY fh.date
    ORDER BY fh.date ASC
  ),
  summary AS (
    SELECT
      COALESCE(SUM(fh.total), 0)::numeric AS total_value,
      COUNT(*)::int AS record_count
    FROM filtered_history fh
  )
  SELECT jsonb_build_object(
    'filters', jsonb_build_object(
      'startDate', start_date,
      'endDate', end_date,
      'typeFilter', normalized_type
    ),
    'summary', jsonb_build_object(
      'totalValue', COALESCE((SELECT total_value FROM summary), 0),
      'recordCount', COALESCE((SELECT record_count FROM summary), 0)
    ),
    'costByCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', c.name, 'value', c.value))
      FROM cost_by_category c
    ), '[]'::jsonb),
    'volumeByCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', v.name, 'value', v.value))
      FROM volume_by_category v
    ), '[]'::jsonb),
    'trendByDay', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('date', t.date, 'value', t.value) ORDER BY t.date ASC)
      FROM trend_by_day t
    ), '[]'::jsonb)
  ) INTO result;

  RETURN COALESCE(result, jsonb_build_object(
    'filters', jsonb_build_object(
      'startDate', start_date,
      'endDate', end_date,
      'typeFilter', normalized_type
    ),
    'summary', jsonb_build_object('totalValue', 0, 'recordCount', 0),
    'costByCategory', '[]'::jsonb,
    'volumeByCategory', '[]'::jsonb,
    'trendByDay', '[]'::jsonb
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_statistics_aggregates(date, date, text) TO authenticated;
