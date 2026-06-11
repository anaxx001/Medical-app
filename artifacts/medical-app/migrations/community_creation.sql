-- =====================================================
-- MedStudent App: Community Creation System
-- =====================================================

-- 1. Add user_created and creator_id columns to communities table
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS user_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 2. Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- member, moderator, admin
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- 3. Enable RLS on community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for community_members
DROP POLICY IF EXISTS "Anyone can view community members" ON community_members;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Moderators can manage members" ON community_members;

CREATE POLICY "Anyone can view community members" ON community_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join communities" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can manage members" ON community_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM community_members 
      WHERE community_id = communities.id AND role IN ('moderator', 'admin')
    )
  );

-- 5. RLS Policies for communities table updates
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
DROP POLICY IF EXISTS "Users can create communities" ON communities;
DROP POLICY IF EXISTS "Creators can edit communities" ON communities;
DROP POLICY IF EXISTS "Admins can delete communities" ON communities;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communities" ON communities
  FOR SELECT USING (true);

CREATE POLICY "Users can create communities" ON communities
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id OR creator_id IS NULL
  );

CREATE POLICY "Creators can edit communities" ON communities
  FOR UPDATE USING (
    auth.uid() = creator_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can delete communities" ON communities
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
  );

-- 6. Grant permissions
GRANT SELECT ON community_members TO authenticated;
GRANT INSERT ON community_members TO authenticated;
GRANT UPDATE ON community_members TO authenticated;

-- =====================================================
-- End of migration
-- =====================================================
