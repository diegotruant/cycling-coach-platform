-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policies for workouts table
CREATE POLICY "Users can insert their own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

-- Create storage bucket 'workout-files'
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-files', 'workout-files', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow upload if path starts with user_id
CREATE POLICY "Users can upload their own workout files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow select if path starts with user_id
CREATE POLICY "Users can read their own workout files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workout-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
