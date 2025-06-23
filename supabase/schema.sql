-- Apaga a tabela existente se ela existir, para garantir um início limpo.
-- Isso é útil durante o desenvolvimento, mas pode ser perigoso em produção se você tiver dados.
DROP TABLE IF EXISTS public.tickets CASCADE;

-- Cria a tabela de tickets
CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    submissionDate timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    reason text NOT NULL,
    estimatedResponseTime text,
    observations text,
    status text DEFAULT 'Novo'::text,
    responsible text,
    user_id uuid REFERENCES auth.users(id),
    file_path text,
    file_name text
);

-- Ativa a Segurança em Nível de Linha (RLS) para a tabela de tickets.
-- Isso é crucial para a segurança, garantindo que as políticas abaixo sejam aplicadas.
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Apaga políticas antigas para garantir que as novas sejam aplicadas corretamente.
DROP POLICY IF EXISTS "Permitir acesso de leitura para usuários autenticados" ON public.tickets;
DROP POLICY IF EXISTS "Permitir inserção para todos os usuários (anon e auth)" ON public.tickets;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.tickets;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON public.tickets;

-- Define as políticas de acesso para a tabela de tickets
CREATE POLICY "Permitir acesso de leitura para usuários autenticados" ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para todos os usuários (anon e auth)" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para usuários autenticados" ON public.tickets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.tickets FOR DELETE USING (auth.role() = 'authenticated');


-- Políticas para o Armazenamento (Storage)
-- Apaga políticas antigas para o bucket 'ticket-files'
DROP POLICY IF EXISTS "Permitir SELECT público para todos os usuários" ON storage.objects;
DROP POLICY IF EXISTS "Permitir INSERT para usuários anônimos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON storage.objects;

-- Define as políticas de acesso para o bucket 'ticket-files'
CREATE POLICY "Permitir SELECT público para todos os usuários" ON storage.objects FOR SELECT USING (bucket_id = 'ticket-files');
CREATE POLICY "Permitir INSERT para usuários anônimos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'ticket-files' AND auth.role() = 'anon' );
CREATE POLICY "Permitir UPDATE para usuários autenticados" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'ticket-files');
CREATE POLICY "Permitir DELETE para usuários autenticados" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'ticket-files');
