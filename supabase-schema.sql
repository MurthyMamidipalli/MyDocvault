-- ====================================================================
-- NexusCRM – Intelligence Hub: Complete Supabase PostgreSQL Schema
-- Includes RLS policies for strict multi-user isolation & storage buckets
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  name VARCHAR(255),
  headline TEXT,
  bio TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  secondary_email VARCHAR(255),
  secondary_phone VARCHAR(50),
  location VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  pincode VARCHAR(20),
  avatar_url TEXT,
  public_profile BOOLEAN DEFAULT FALSE,
  share_slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_share_slug ON profiles(share_slug);

-- 2. EDUCATION TABLE
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  degree VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_year VARCHAR(20),
  end_year VARCHAR(20),
  grade VARCHAR(50),
  percentage VARCHAR(50),
  description TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);

-- 3. SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Technical',
  proficiency VARCHAR(50) DEFAULT 'Intermediate',
  years_of_exp INT DEFAULT 1,
  endorsements INT DEFAULT 0,
  description TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);

-- 4. CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  credential_id VARCHAR(255),
  issue_date VARCHAR(50),
  expiry_date VARCHAR(50),
  credential_url TEXT,
  description TEXT,
  file_url TEXT,
  storage_path TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- 5. EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'Full-Time',
  location VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  is_current BOOLEAN DEFAULT FALSE,
  description JSONB DEFAULT '[]'::jsonb,
  skills_used JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(user_id);

-- 6. CURRENT JOBS TABLE
CREATE TABLE IF NOT EXISTS current_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  employee_id VARCHAR(100),
  joining_date VARCHAR(50),
  location VARCHAR(255),
  employment_type VARCHAR(50) DEFAULT 'Full-Time',
  salary VARCHAR(100),
  manager VARCHAR(255),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_current_jobs_user_id ON current_jobs(user_id);

-- 7. PROJECTS TABLE (One user to many projects - NOT UNIQUE ON user_id)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'projects',
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

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 8. PRODUCTS TABLE (One user to many products - NOT UNIQUE ON user_id)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'products',
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

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- 9. RESUMES TABLE
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(100) DEFAULT 'application/pdf',
  is_primary BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- 10. PORTFOLIO LINKS TABLE
CREATE TABLE IF NOT EXISTS portfolio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_links_user_id ON portfolio_links(user_id);

-- 11. CAREER TIMELINE TABLE
CREATE TABLE IF NOT EXISTS career_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'career',
  intensity VARCHAR(20) DEFAULT 'medium',
  attachment_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_timeline_user_id ON career_timeline(user_id);

-- 12. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(255),
  relationship VARCHAR(100),
  notes TEXT,
  avatar_url TEXT,
  interactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- 13. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(50) NOT NULL,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  location VARCHAR(255),
  type VARCHAR(50) DEFAULT 'personal',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- 14. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  date VARCHAR(50),
  description TEXT,
  attachment_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- 15. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  role VARCHAR(255),
  relationship VARCHAR(100),
  text TEXT NOT NULL,
  avatar_color VARCHAR(100) DEFAULT 'bg-slate-800',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);

-- 16. DOCUMENTS TABLE (DOCUMENT VAULT - DEFAULT PRIVATE)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Personal',
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) DEFAULT 'application/pdf',
  file_size BIGINT DEFAULT 0,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  expiry_date VARCHAR(50),
  tags JSONB DEFAULT '[]'::jsonb,
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);

-- 17. DOCUMENT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Folder',
  color VARCHAR(50) DEFAULT 'emerald',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_categories_user_id ON document_categories(user_id);

-- 18. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "profiles_owner_crud" ON profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (public_profile = true);

-- 2. EDUCATION POLICIES
CREATE POLICY "education_owner_crud" ON education FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "education_public_read" ON education FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = education.user_id AND profiles.public_profile = true)
);

-- 3. SKILLS POLICIES
CREATE POLICY "skills_owner_crud" ON skills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills_public_read" ON skills FOR SELECT USING (visibility = 'public');

-- 4. CERTIFICATIONS POLICIES
CREATE POLICY "certifications_owner_crud" ON certifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "certifications_public_read" ON certifications FOR SELECT USING (visibility = 'public');

-- 5. EXPERIENCE POLICIES
CREATE POLICY "experience_owner_crud" ON experience FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "experience_public_read" ON experience FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = experience.user_id AND profiles.public_profile = true)
);

-- 6. CURRENT JOBS POLICIES
CREATE POLICY "current_jobs_owner_crud" ON current_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "current_jobs_public_read" ON current_jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = current_jobs.user_id AND profiles.public_profile = true)
);

-- 7. PROJECTS POLICIES
CREATE POLICY "projects_owner_crud" ON projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_public_read" ON projects FOR SELECT USING (is_public = true);

-- 8. PRODUCTS POLICIES
CREATE POLICY "products_owner_crud" ON products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_public = true);

-- 9. RESUMES POLICIES
CREATE POLICY "resumes_owner_crud" ON resumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_public_read" ON resumes FOR SELECT USING (is_public = true);

-- 10. PORTFOLIO LINKS POLICIES
CREATE POLICY "portfolio_links_owner_crud" ON portfolio_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolio_links_public_read" ON portfolio_links FOR SELECT USING (is_public = true);

-- 11. CAREER TIMELINE POLICIES
CREATE POLICY "career_timeline_owner_crud" ON career_timeline FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_timeline_public_read" ON career_timeline FOR SELECT USING (is_public = true);

-- 12. CONTACTS POLICIES (OWNER ONLY)
CREATE POLICY "contacts_owner_crud" ON contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. CALENDAR EVENTS POLICIES
CREATE POLICY "calendar_events_owner_crud" ON calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_public_read" ON calendar_events FOR SELECT USING (is_public = true);

-- 14. ACHIEVEMENTS POLICIES
CREATE POLICY "achievements_owner_crud" ON achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (is_public = true);

-- 15. TESTIMONIALS POLICIES
CREATE POLICY "testimonials_owner_crud" ON testimonials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT USING (is_public = true);

-- 16. DOCUMENTS POLICIES (OWNER CRUD + STRICT PUBLIC READ ONLY IF VISIBILITY = PUBLIC)
CREATE POLICY "documents_owner_crud" ON documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_public_read" ON documents FOR SELECT USING (visibility = 'public');

-- 17. DOCUMENT CATEGORIES POLICIES
CREATE POLICY "document_categories_owner_crud" ON document_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 18. NOTES POLICIES
CREATE POLICY "notes_owner_crud" ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_public_read" ON notes FOR SELECT USING (is_public = true);

-- ====================================================================
-- SUPABASE STORAGE BUCKETS SETUP INSTRUCTIONS
-- ====================================================================
-- Execute the following in Supabase Dashboard -> Storage or SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES 
-- ('documents', 'documents', true),
-- ('profile-images', 'profile-images', true),
-- ('resumes', 'resumes', true),
-- ('certificates', 'certificates', true),
-- ('projects', 'projects', true)
-- ON CONFLICT (id) DO NOTHING;
