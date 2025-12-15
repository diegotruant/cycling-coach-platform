CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policy to allow read access? Usually strict for coaches.
-- For now, we rely on server-side logic (getCoachByEmail) so RLS on this table for public access is not needed/should be private.
