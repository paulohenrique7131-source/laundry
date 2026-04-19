-- Align history payload with the current web/mobile product surface.
-- The dashboard and calculator already read/write `history.notes`.

ALTER TABLE history ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN history.notes IS 'Optional calculator notes saved with each history record.';
