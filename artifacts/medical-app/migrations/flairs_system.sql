-- =====================================================
-- MedStudent App: Communities, Flairs, and Posts Update
-- =====================================================

-- 1. Ensure posts table has flair column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flair TEXT;

-- 2. Create community_flairs table
CREATE TABLE IF NOT EXISTS community_flairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_universal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(community_id, name)
);

-- 3. Insert/Update communities (replace if exists)
INSERT INTO communities (name, slug, icon, description) VALUES
  ('Anatomy', 'anatomy', '🧠', 'Histology, embryology, neuroanatomy, and more'),
  ('Physiology', 'physiology', '⚗️', 'Cardiovascular, respiratory, renal, and GI systems'),
  ('Biochemistry', 'biochemistry', '🔬', 'Metabolism, molecular biology, and enzymology'),
  ('Pathology & Microbiology', 'pathology-micro', '🦠', 'General pathology, bacteriology, and virology'),
  ('Pharmacology', 'pharmacology', '💊', 'Chemotherapy and clinical pharmacology'),
  ('Radiography', 'radiography', '🔭', 'Radiographic positioning and imaging'),
  ('Nursing', 'nursing', '💉', 'Medical-surgical, pediatric, and psychiatric nursing'),
  ('Medicine', 'medicine', '🩺', 'Internal medicine, surgery, and specialties'),
  ('General Discussion', 'general-discussion', '💬', 'Study tips, career advice, and campus life'),
  ('Announcements', 'announcements', '📢', 'Important announcements and updates')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- 4. Get community IDs for flair insertion
WITH community_ids AS (
  SELECT id, slug FROM communities WHERE slug IN (
    'anatomy', 'physiology', 'biochemistry', 'pathology-micro', 'pharmacology',
    'radiography', 'nursing', 'medicine', 'general-discussion', 'announcements'
  )
)

-- 5. Insert universal flairs (available in ALL communities)
INSERT INTO community_flairs (community_id, name, is_universal)
SELECT cid.id, flair_name, TRUE
FROM community_ids cid,
LATERAL (VALUES ('Question'), ('Resource'), ('Discussion'), ('Case Study'), ('Textbook Recommendation')) AS flairs(flair_name)
ON CONFLICT (community_id, name) DO NOTHING;

-- 6. Insert community-specific flairs
-- Anatomy flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'anatomy'), 'Histology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'anatomy'), 'Embryology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'anatomy'), 'Neuroanatomy', FALSE),
  ((SELECT id FROM communities WHERE slug = 'anatomy'), 'Gross Anatomy', FALSE),
  ((SELECT id FROM communities WHERE slug = 'anatomy'), 'Radiological Anatomy', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Physiology flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Cardiovascular', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Respiratory', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Renal', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'GI', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Endocrine', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Neurophysiology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'physiology'), 'Reproductive', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Biochemistry flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'biochemistry'), 'Metabolism', FALSE),
  ((SELECT id FROM communities WHERE slug = 'biochemistry'), 'Molecular Biology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'biochemistry'), 'Enzymology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'biochemistry'), 'Nutrition', FALSE),
  ((SELECT id FROM communities WHERE slug = 'biochemistry'), 'Clinical Biochemistry', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Pathology & Microbiology flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'General Pathology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'Systemic Pathology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'Bacteriology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'Virology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'Parasitology', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pathology-micro'), 'Mycology', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Pharmacology flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'pharmacology'), 'Chemotherapy', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pharmacology'), 'CNS Drugs', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pharmacology'), 'Cardiovascular Drugs', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pharmacology'), 'Autonomic', FALSE),
  ((SELECT id FROM communities WHERE slug = 'pharmacology'), 'Clinical Pharmacology', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Radiography flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Radiographic Positioning', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Radiation Physics', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Image Processing', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'CT & MRI', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Radiotherapy', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Nuclear Medicine', FALSE),
  ((SELECT id FROM communities WHERE slug = 'radiography'), 'Ultrasound', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Nursing flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Medical-Surgical', FALSE),
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Pediatric', FALSE),
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Obstetric', FALSE),
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Psychiatric', FALSE),
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Community Health', FALSE),
  ((SELECT id FROM communities WHERE slug = 'nursing'), 'Perioperative', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- Medicine flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Internal Medicine', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Surgery', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Paediatrics', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Obs & Gynae', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Psychiatry', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'ENT', FALSE),
  ((SELECT id FROM communities WHERE slug = 'medicine'), 'Ophthalmology', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- General Discussion flairs
INSERT INTO community_flairs (community_id, name, is_universal) VALUES
  ((SELECT id FROM communities WHERE slug = 'general-discussion'), 'Study Tips', FALSE),
  ((SELECT id FROM communities WHERE slug = 'general-discussion'), 'Career Advice', FALSE),
  ((SELECT id FROM communities WHERE slug = 'general-discussion'), 'NYSC', FALSE),
  ((SELECT id FROM communities WHERE slug = 'general-discussion'), 'Exams & Results', FALSE),
  ((SELECT id FROM communities WHERE slug = 'general-discussion'), 'Campus Life', FALSE)
ON CONFLICT (community_id, name) DO NOTHING;

-- 7. Row Level Security Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view flairs" ON community_flairs;
DROP POLICY IF EXISTS "Only admins can insert flairs" ON community_flairs;
DROP POLICY IF EXISTS "Only admins can delete flairs" ON community_flairs;

-- Enable RLS
ALTER TABLE community_flairs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can READ all flairs
CREATE POLICY "Anyone can view flairs" ON community_flairs
  FOR SELECT USING (true);

-- Policy: Only admins/super_admins can INSERT
CREATE POLICY "Only admins can insert flairs" ON community_flairs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only admins/super_admins can DELETE
CREATE POLICY "Only admins can delete flairs" ON community_flairs
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- 8. Grant appropriate permissions
GRANT SELECT ON community_flairs TO authenticated;
GRANT INSERT ON community_flairs TO authenticated;
GRANT DELETE ON community_flairs TO authenticated;

-- =====================================================
-- End of migration
-- =====================================================
