-- Este script SQL é projetado para o Supabase (PostgreSQL).
-- Ele cria a tabela de tickets e configura as políticas de segurança de nível de linha (RLS).

-- 1. Criação de um tipo ENUM para o status do ticket (opcional, mas recomendado)
-- Isso garante que a coluna 'status' só possa ter valores predefinidos.
DROP TYPE IF EXISTS public.ticket_status;
CREATE TYPE public.ticket_status AS ENUM (
    'Novo',
    'Em Andamento',
    'Atrasado',
    'Concluído'
);

-- 2. Criação da tabela 'tickets'
-- Esta tabela irá armazenar todas as informações dos tickets submetidos.
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimated_response_time TEXT,
    observations TEXT,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status public.ticket_status NOT NULL DEFAULT 'Novo'::public.ticket_status,
    responsible TEXT,
    user_id TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    -- Nota: Armazenar conteúdo de arquivo em base64 diretamente no banco de dados não é o ideal para arquivos grandes.
    -- A melhor abordagem é usar o Supabase Storage e armazenar apenas o caminho/URL do arquivo aqui.
    -- No entanto, para corresponder à implementação local, esta coluna foi incluída.
    file_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT name_length_check CHECK (char_length(name) > 0),
    CONSTRAINT phone_length_check CHECK (char_length(phone) > 0)
);

-- Adiciona comentários para clareza
COMMENT ON TABLE public.tickets IS 'Armazena os tickets de suporte submetidos pelos usuários.';
COMMENT ON COLUMN public.tickets.id IS 'Identificador único para o ticket (UUID)';
COMMENT ON COLUMN public.tickets.name IS 'Nome completo da pessoa que submeteu o ticket.';
COMMENT ON COLUMN public.tickets.phone IS 'Telefone de contato do solicitante.';
COMMENT ON COLUMN public.tickets.reason IS 'O motivo principal para a abertura do ticket.';
COMMENT ON COLUMN public.tickets.estimated_response_time IS 'Estimativa de tempo de resposta com base no motivo.';
COMMENT ON COLUMN public.tickets.observations IS 'Detalhes adicionais ou observações fornecidas pelo usuário.';
COMMENT ON COLUMN public.tickets.submission_date IS 'O timestamp de quando o ticket foi submetido.';
COMMENT ON COLUMN public.tickets.status IS 'O status atual do ticket (Novo, Em Andamento, etc.).';
COMMENT ON COLUMN public.tickets.responsible IS 'A pessoa ou equipe responsável por resolver o ticket.';
COMMENT ON COLUMN public.tickets.user_id IS 'ID do usuário associado ao ticket, se aplicável.';
COMMENT ON COLUMN public.tickets.file_name IS 'O nome do arquivo anexado.';
COMMENT ON COLUMN public.tickets.file_type IS 'O tipo MIME do arquivo anexado.';
COMMENT ON COLUMN public.tickets.file_size IS 'O tamanho do arquivo anexado em bytes.';
COMMENT ON COLUMN public.tickets.file_content IS 'O conteúdo do arquivo anexado, codificado em Base64 (data URI).';
COMMENT ON COLUMN public.tickets.created_at IS 'Timestamp de quando o registro foi criado no banco de dados.';


-- 3. Habilitação da Segurança de Nível de Linha (Row Level Security - RLS)
-- ESTE É UM PASSO CRUCIAL NO SUPABASE. Sem isso, sua tabela estará inacessível por padrão via API.
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para evitar erros ao executar o script novamente
DROP POLICY IF EXISTS "Allow public creation of new tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated users to view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated users to update tickets" ON public.tickets;


-- 4. Criação das Políticas de Segurança (Policies)

-- Política para INSERÇÃO: Permite que qualquer usuário (anônimo ou autenticado) crie um novo ticket.
-- Isso é necessário para o formulário público de abertura de tickets.
CREATE POLICY "Allow public creation of new tickets"
ON public.tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política para LEITURA (SELECT): Permite que apenas usuários AUTENTICADOS vejam os tickets.
-- Isso protege o painel do gestor (dashboard), garantindo que apenas quem fez login possa ver os dados.
CREATE POLICY "Allow authenticated users to view all tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (true);

-- Política para ATUALIZAÇÃO (UPDATE): Permite que usuários AUTENTICADOS atualizem os tickets.
-- Isso permite que os gestores alterem o status, o responsável, etc., a partir do painel.
CREATE POLICY "Allow authenticated users to update tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Nota: Para uma segurança mais granular, você poderia criar políticas baseadas em roles
-- ou garantir que um usuário só possa ver/editar os tickets que ele mesmo criou,
-- comparando `user_id` com `auth.uid()`. As políticas acima são um bom ponto de partida
-- para a funcionalidade atual da aplicação.
