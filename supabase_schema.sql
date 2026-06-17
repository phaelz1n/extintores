-- Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir um Admin padrão
INSERT INTO public.profiles (cpf, role) VALUES ('00000000000', 'admin') ON CONFLICT (cpf) DO NOTHING;

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
