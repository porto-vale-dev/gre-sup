-- This script is idempotent. It will drop and recreate objects.
-- WARNING: Running this script will delete all existing data in the 'tickets' table.

-- Drop existing objects to avoid conflicts
DROP TYPE IF EXISTS public.ticket_status CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;

-- Create a type for the ticket status
CREATE TYPE public.ticket_status AS ENUM ('Novo', 'Em Andamento', 'Atrasado', 'Concluído');

-- Create the tickets table with corrected column names (snake_case)
CREATE TABLE public.tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    submission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    name CHARACTER VARYING NOT NULL,
    phone CHARACTER VARYING NOT NULL,
    reason TEXT NOT NULL,
    estimated_response_time CHARACTER VARYING,
    observations TEXT,
    status public.ticket_status NOT NULL DEFAULT 'Novo'::public.ticket_status,
    responsible CHARACTER VARYING,
    file_path TEXT,
    file_name CHARACTER VARYING,
    user_id UUID,
    CONSTRAINT tickets_pkey PRIMARY KEY (id),
    CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe before creating new ones
DROP POLICY IF EXISTS "Allow insert for anonymous users" ON public.tickets;
DROP POLICY IF EXISTS "Allow read access for authenticated users" on public.tickets;
DROP POLICY IF EXISTS "Allow update for authenticated users" on public.tickets;

-- Create RLS policies for the tickets table
CREATE POLICY "Allow insert for anonymous users" ON public.tickets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow read access for authenticated users" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated users" ON public.tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- Storage Policies for the 'ticket-files' bucket
-- These should already be in place, but we include them for completeness.

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous upload to ticket-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage ticket-files" ON storage.objects;

-- Allow anonymous users to UPLOAD files into the 'public' folder.
CREATE POLICY "Allow anonymous upload to ticket-files"
ON storage.objects FOR INSERT TO anon
WITH CHECK ( bucket_id = 'ticket-files' AND (storage.foldername(name))[1] = 'public' );

-- Allow authenticated users (admins/managers) to do everything.
CREATE POLICY "Allow authenticated users to manage ticket-files"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'ticket-files' );