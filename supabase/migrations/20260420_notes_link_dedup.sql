WITH ranked_linked_notes AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, related_record_id
      ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC
    ) AS duplicate_rank
  FROM public.notes
  WHERE related_record_id IS NOT NULL
    AND content NOT LIKE '[[history-note]]%'
)
DELETE FROM public.notes n
USING ranked_linked_notes r
WHERE n.id = r.id
  AND r.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_user_related_record_unique
  ON public.notes (user_id, related_record_id)
  WHERE related_record_id IS NOT NULL
    AND content NOT LIKE '[[history-note]]%';
