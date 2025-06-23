-- Enable Row Level Security
ALTER TABLE
  tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on tickets" ON tickets;
DROP POLICY IF EXISTS "Allow anon insert access on tickets" ON tickets;
DROP POLICY IF EXISTS "Allow individual user read access" ON tickets;
DROP POLICY IF EXISTS "Allow user update access" ON tickets;
DROP POLICY IF EXISTS "Allow user delete access" ON tickets;
DROP POLICY IF EXISTS "Allow anon file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated user file downloads" ON storage.objects;

-- Drop the table if it exists to apply new schema.
-- WARNING: This will delete all existing ticket data.
DROP TABLE IF EXISTS public.tickets;

-- Create table for tickets with snake_case naming convention
CREATE TABLE
  IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimated_response_time TEXT NOT NULL,
    observations TEXT,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'Novo'::TEXT NOT NULL,
    responsible TEXT,
    user_id UUID REFERENCES auth.users (id),
    file_path TEXT,
    file_name TEXT
  );

-- Grant usage on the schema to the anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select, insert, update, delete permissions on the tickets table
GRANT
SELECT,
INSERT,
UPDATE,
DELETE ON TABLE public.tickets TO anon,
authenticated;

-- POLICIES for tickets table
-- Allow anonymous users to create tickets
CREATE POLICY "Allow anon insert access on tickets" ON public.tickets FOR INSERT
WITH
  CHECK (TRUE);

-- Allow authenticated users (e.g., admins) to read all tickets
CREATE POLICY "Allow public read access on tickets" ON public.tickets FOR
SELECT
  USING (auth.role () = 'authenticated');

-- Allow users to update their own tickets (or all if admin)
CREATE POLICY "Allow user update access" ON public.tickets FOR
UPDATE
  USING (auth.uid () = user_id OR auth.role () = 'authenticated')
WITH
  CHECK (auth.uid () = user_id OR auth.role () = 'authenticated');

-- Allow users to delete their own tickets (or all if admin)
CREATE POLICY "Allow user delete access" ON public.tickets FOR DELETE USING (
  auth.uid () = user_id
  OR auth.role () = 'authenticated'
);

-- POLICIES for storage.objects (our ticket-files bucket)
-- Allow anonymous users to upload to the 'ticket-files' bucket
CREATE POLICY "Allow anon file uploads" ON storage.objects FOR INSERT
WITH
  CHECK (bucket_id = 'ticket-files');

-- Allow authenticated users to download files from 'ticket-files' bucket
CREATE POLICY "Allow authenticated user file downloads" ON storage.objects FOR
SELECT
  USING (
    bucket_id = 'ticket-files'
    AND auth.role () = 'authenticated'
  );