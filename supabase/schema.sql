
-- Drop table if it exists to start fresh
DROP TABLE IF EXISTS public.tickets;

-- Create the tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    estimated_response_time VARCHAR(255),
    observations TEXT,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'Novo',
    responsible VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    file_path TEXT,
    file_name TEXT,
    solution TEXT,
    solution_files JSONB
);

-- Policies for tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.tickets;
DROP POLICY IF EXISTS "Allow individual user to insert their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated users to read all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated users to update tickets" ON public.tickets;

-- This policy allows anyone to create a ticket.
CREATE POLICY "Allow individual user to insert their own tickets" ON public.tickets FOR INSERT WITH CHECK (true);

-- Allow authenticated users (managers) to read all tickets.
CREATE POLICY "Allow authenticated users to read all tickets" ON public.tickets FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users (managers) to update tickets.
CREATE POLICY "Allow authenticated users to update tickets" ON public.tickets FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- Policies for storage (ticket-files bucket)
-- Assumes a bucket named 'ticket-files' has been created.
DROP POLICY IF EXISTS "Allow anon users to upload to public folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to read from public folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;

-- Policy for anonymous users to upload the initial ticket file.
-- The file path must start with 'public/'.
CREATE POLICY "Allow anon users to upload to public folder" 
ON storage.objects FOR INSERT TO anon 
WITH CHECK (bucket_id = 'ticket-files' AND (storage.foldername(name))[1] = 'public');

-- Policy for authenticated users (managers) to upload solution files.
-- They can upload to any folder. We use a 'solutions/' folder in the code.
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-files');

-- Policy for authenticated users (managers) to read/download any file from the bucket.
-- This is needed for the preview and download functionality.
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-files');
