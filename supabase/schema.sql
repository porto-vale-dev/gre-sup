-- File: supabase/schema.sql

-- -----------------------------------------------------------------------------
-- Tickets Table and RLS Policies
-- -----------------------------------------------------------------------------

-- Create the tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimatedResponseTime TEXT NOT NULL,
    observations TEXT,
    submissionDate TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'Novo',
    responsible TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_path TEXT,
    file_name TEXT
);

-- Enable Row Level Security (RLS) for the tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policies for 'tickets' table
DROP POLICY IF EXISTS "Allow anonymous insert" ON tickets;
CREATE POLICY "Allow anonymous insert"
ON tickets
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read" ON tickets;
CREATE POLICY "Allow authenticated read"
ON tickets
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update" ON tickets;
CREATE POLICY "Allow authenticated update"
ON tickets
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- -----------------------------------------------------------------------------
-- Storage Bucket and RLS Policies
-- -----------------------------------------------------------------------------
-- These policies are for the 'storage.objects' table, which manages file metadata.
-- You must first create a bucket named 'ticket-files' via the Supabase Dashboard.

-- Policy for public uploads (e.g., from the ticket submission form)
DROP POLICY IF EXISTS "Allow public uploads to ticket-files" ON storage.objects;
CREATE POLICY "Allow public uploads to ticket-files"
ON storage.objects
FOR INSERT
TO public -- 'public' includes the 'anon' role for unauthenticated users
WITH CHECK (bucket_id = 'ticket-files');

-- Policy for authenticated users to view/download files
DROP POLICY IF EXISTS "Allow authenticated downloads from ticket-files" ON storage.objects;
CREATE POLICY "Allow authenticated downloads from ticket-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-files' AND auth.role() = 'authenticated');

-- Policy for authenticated users to update their own files
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
USING (auth.uid() = owner AND bucket_id = 'ticket-files');

-- Policy for authenticated users to delete their own files
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
USING (auth.uid() = owner AND bucket_id = 'ticket-files');
