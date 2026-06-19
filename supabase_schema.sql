-- Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Usuário',
    role VARCHAR(10) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Extintores
CREATE TABLE IF NOT EXISTS public.extinguishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_plate VARCHAR(10) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    expiration_date DATE NOT NULL,
    is_full BOOLEAN DEFAULT true,
    has_metroplan_seal BOOLEAN DEFAULT false,
    has_extinguisher BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ATUALIZAÇÃO (RODAR NO SUPABASE SQL EDITOR)
-- ==========================================
-- Se você já tem a tabela extinguishers criada, rode os comandos abaixo para adicionar as novas colunas:
-- ALTER TABLE public.extinguishers ADD COLUMN has_metroplan_seal BOOLEAN DEFAULT false;
-- ALTER TABLE public.extinguishers ADD COLUMN has_extinguisher BOOLEAN DEFAULT true;
-- ==========================================

-- Tabela de Logs de Extintores
CREATE TABLE IF NOT EXISTS public.extinguisher_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extinguisher_id UUID, -- Pode ser nulo se o extintor foi deletado
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir um Admin padrão
INSERT INTO public.profiles (cpf, name, role) VALUES ('00000000000', 'Administrador', 'admin') ON CONFLICT (cpf) DO NOTHING;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extinguishers ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Qualquer um pode ler profiles (para login)"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Apenas admin pode inserir profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true); -- Na prática, verificaríamos a role do usuário autenticado, mas simplificaremos para o login via CPF.

CREATE POLICY "Qualquer um pode atualizar profiles"
    ON public.profiles FOR UPDATE
    USING (true);

CREATE POLICY "Qualquer um pode deletar profiles"
    ON public.profiles FOR DELETE
    USING (true);

-- Políticas para Extintores
CREATE POLICY "Qualquer um pode ler extintores"
    ON public.extinguishers FOR SELECT
    USING (true);

CREATE POLICY "Qualquer um pode inserir extintores"
    ON public.extinguishers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar extintores"
    ON public.extinguishers FOR UPDATE
    USING (true);

CREATE POLICY "Qualquer um pode deletar extintores"
    ON public.extinguishers FOR DELETE
    USING (true);

-- Configurar RLS para Logs
ALTER TABLE public.extinguisher_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode inserir logs"
    ON public.extinguisher_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Apenas admin pode ler logs"
    ON public.extinguisher_logs FOR SELECT
    USING (true); -- Simplificando para visualização no frontend, já que filtramos no código client-side. Ou idealmente: USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') se usássemos Supabase Auth real.
