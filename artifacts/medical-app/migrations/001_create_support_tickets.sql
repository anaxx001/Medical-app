-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL CHECK (department IN ('Complaints', 'Suggestions', 'Moderator/Admin Nominations', 'Technical Feedback')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- Create index on department for filtering by department
CREATE INDEX IF NOT EXISTS idx_support_tickets_department ON support_tickets(department);

-- Create index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Create index on created_at for sorting and filtering by date
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow users to view and create their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update tickets"
  ON support_tickets
  FOR UPDATE
  USING (auth.role() = 'admin');
