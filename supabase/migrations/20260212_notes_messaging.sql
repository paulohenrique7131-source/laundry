-- ============================================================
-- Migration: Notas Avançadas e Mensagens (Etapas 6-8)
-- Data: 2026-02-12
-- Status: APPLIED ✅
-- ============================================================

-- 1. Notas: colunas de mensagens
ALTER TABLE notes ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author_role text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS recipients text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS read_by text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS related_record_id uuid;

-- 2. Histórico: colunas de autoria
ALTER TABLE history ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE history ADD COLUMN IF NOT EXISTS author_id uuid;

-- 3. Profiles: leitura pública para seletor de destinatários
DROP POLICY IF EXISTS profiles_read_all ON profiles;
CREATE POLICY profiles_read_all ON profiles FOR SELECT USING (true);

-- 4. Notas: destinatários podem ler
DROP POLICY IF EXISTS notes_read_targeted ON notes;
CREATE POLICY notes_read_targeted ON notes FOR SELECT USING (auth.uid()::text = ANY(recipients));

-- 5. Notas: destinatários podem atualizar read_by
DROP POLICY IF EXISTS notes_update_read_by ON notes;
CREATE POLICY notes_update_read_by ON notes FOR UPDATE USING (auth.uid()::text = ANY(recipients));
