-- ========================================================
-- Create 'others' table in Supabase for Documents & Reports
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ========================================================

CREATE TABLE IF NOT EXISTS others (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'others',
  type VARCHAR(50) DEFAULT 'other',
  doc_type VARCHAR(100) DEFAULT 'Report',
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  live_url TEXT,
  github_url TEXT,
  pdf_url TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  date VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index on user_id for fast querying
CREATE INDEX IF NOT EXISTS idx_others_user_id ON others(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE others ENABLE ROW LEVEL SECURITY;

-- Allow user to manage their own records
DROP POLICY IF EXISTS "others_owner_crud" ON others;
CREATE POLICY "others_owner_crud" ON others 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Allow public access to public documents (for public portfolio view)
DROP POLICY IF EXISTS "others_public_read" ON others;
CREATE POLICY "others_public_read" ON others 
  FOR SELECT 
  USING (is_public = true);
