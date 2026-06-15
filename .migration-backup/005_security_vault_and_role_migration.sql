-- ============================================================
-- Migration: Security Vault support + role hierarchy cleanup
-- ============================================================

-- 1. identity_reveal_logs
-- Records every de-anonymization action taken by a super_admin.
CREATE TABLE IF NOT EXISTS identity_reveal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_message UUID REFERENCES encrypted_message_audits(id) ON DELETE SET NULL,
  reason        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS idx_identity_reveal_logs_admin_id
  ON identity_reveal_logs (admin_id);

CREATE INDEX IF NOT EXISTS idx_identity_reveal_logs_created_at
  ON identity_reveal_logs (created_at DESC);

-- 2. community_requests — add stated_purpose if it doesn't exist
ALTER TABLE community_requests
  ADD COLUMN IF NOT EXISTS stated_purpose TEXT;

-- Backfill: copy existing justification into stated_purpose
UPDATE community_requests
  SET stated_purpose = justification
  WHERE stated_purpose IS NULL AND justification IS NOT NULL;

-- 3. reports — ensure incident dashboard columns exist
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS originating_community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS violation_category TEXT,
  ADD COLUMN IF NOT EXISTS content_preview TEXT;

-- 4. vault_access_logs — ensure it exists
CREATE TABLE IF NOT EXISTS vault_access_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  justification TEXT NOT NULL,
  accessed_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_access_logs_admin_id
  ON vault_access_logs (admin_id);

-- 5. encrypted_message_audits — ensure expected columns exist
ALTER TABLE encrypted_message_audits
  ADD COLUMN IF NOT EXISTS flagged_keyword     TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_message   TEXT,
  ADD COLUMN IF NOT EXISTS sender_id           UUID,
  ADD COLUMN IF NOT EXISTS sender_username     TEXT,
  ADD COLUMN IF NOT EXISTS recipient_id        UUID,
  ADD COLUMN IF NOT EXISTS recipient_username  TEXT,
  ADD COLUMN IF NOT EXISTS is_anonymous        BOOLEAN DEFAULT false;

-- 6. Add app_admin to the role enum (if not already present)
-- NOTE: Postgres enums require this syntax.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'app_admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'app_admin' AFTER 'admin';
  END IF;
END$$;

-- 7. RLS policies for new tables (super_admin only)
ALTER TABLE identity_reveal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_only_identity_reveal"
  ON identity_reveal_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin')
    )
  );

ALTER TABLE vault_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_only_vault_access"
  ON vault_access_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin')
    )
  );
