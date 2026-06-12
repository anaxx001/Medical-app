-- =====================================================
-- MedStudent App: Community Requests (Start a Community)
-- =====================================================
-- Stores user requests to start a new community. Requests are
-- reviewed by admins before a community is created.

-- 1. Create community_requests table
CREATE TABLE IF NOT EXISTS community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  topic TEXT NOT NULL,
  community_type TEXT NOT NULL DEFAULT 'public', -- public, restricted, private
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  CONSTRAINT community_requests_name_len CHECK (char_length(name) <= 21),
  CONSTRAINT community_requests_desc_len CHECK (char_length(description) <= 500),
  CONSTRAINT community_requests_type_chk CHECK (community_type IN ('public', 'restricted', 'private')),
  CONSTRAINT community_requests_status_chk CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_community_requests_status ON community_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_requests_requester ON community_requests(requester_id);

-- 2. Enable RLS
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view their own requests" ON community_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON community_requests;
DROP POLICY IF EXISTS "Users can create requests" ON community_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON community_requests;

-- Users can read their own requests; admins can read everything
CREATE POLICY "Users can view their own requests" ON community_requests
  FOR SELECT USING (
    auth.uid() = requester_id
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Authenticated users can submit a request for themselves
CREATE POLICY "Users can create requests" ON community_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Only admins/super_admins can review (approve/reject) requests
CREATE POLICY "Admins can update requests" ON community_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
  );

-- 4. Grant permissions
GRANT SELECT ON community_requests TO authenticated;
GRANT INSERT ON community_requests TO authenticated;
GRANT UPDATE ON community_requests TO authenticated;

-- =====================================================
-- End of migration
-- =====================================================
