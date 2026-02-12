-- ============================================================
-- Migration: Notas Avançadas e Mensagens (Etapas 6-8)
-- Data: 2026-02-12
-- Descrição: Adiciona colunas para suporte a notas com:
--   - Visibilidade (public/private/targeted)
--   - Destinatários (array de UUIDs)
--   - Status de leitura (array de UUIDs)
--   - Vínculo com registros de histórico
--   - Autoria nos registros de histórico
-- ============================================================

-- 1. Notas: colunas de visibilidade e mensagens
ALTER TABLE notes ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author_role text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS recipients text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS read_by text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS related_record_id uuid;

-- 2. Histórico: colunas de autoria
ALTER TABLE history ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE history ADD COLUMN IF NOT EXISTS author_id uuid;

-- 3. RLS: permitir que destinatários leiam notas direcionadas a eles
-- Nota: Ajuste conforme sua política de RLS existente.
-- Exemplo de política permissiva para leitura:
DO $$
BEGIN
    -- Política: qualquer usuário pode ler notas públicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'notes_read_public' AND tablename = 'notes'
    ) THEN
        CREATE POLICY notes_read_public ON notes
            FOR SELECT USING (visibility = 'public');
    END IF;

    -- Política: destinatários podem ler notas direcionadas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'notes_read_targeted' AND tablename = 'notes'
    ) THEN
        CREATE POLICY notes_read_targeted ON notes
            FOR SELECT USING (auth.uid()::text = ANY(recipients));
    END IF;

    -- Política: destinatários podem atualizar read_by
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'notes_update_read_by' AND tablename = 'notes'
    ) THEN
        CREATE POLICY notes_update_read_by ON notes
            FOR UPDATE USING (auth.uid()::text = ANY(recipients));
    END IF;
END $$;

-- 4. Profiles: permitir leitura pública para lista de usuários no seletor
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'profiles_read_all' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY profiles_read_all ON profiles
            FOR SELECT USING (true);
    END IF;
END $$;
