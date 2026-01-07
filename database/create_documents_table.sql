c-- Create the athlete_documents table
CREATE TABLE IF NOT EXISTS athlete_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'MEDICAL_CERTIFICATE', 'QUESTIONNAIRE', etc.
    file_url TEXT,
    storage_path TEXT, -- Path in Supabase Storage bucket
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UPLOADED', 'VERIFIED', 'EXPIRED', 'REJECTED')),
    expiration_date DATE,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_athlete_documents_athlete_id ON athlete_documents(athlete_id);

-- Enable RLS
ALTER TABLE athlete_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role (Backend) has full access
CREATE POLICY "Service Role can do everything on athlete_documents"
ON athlete_documents
USING (true)
WITH CHECK (true);

-- Policy: Athletes can view their own documents (if authenticated via Supabase Auth)
-- Note: Currently we use a custom auth/session system, so the backend (Service Role) handles most requests.
-- If you use Supabase Auth later, you would add:
-- CREATE POLICY "Athletes can view own documents" ON athlete_documents
-- FOR SELECT USING (auth.uid()::text = athlete_id);
