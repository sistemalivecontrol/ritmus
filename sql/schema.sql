-- ============================================================
-- RITMUS - PLATAFORMA DE VÍDEOS FITNESS (CORRIGIDO)
-- ============================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    plano TEXT DEFAULT 'teste' CHECK (plano IN ('teste', 'individual', 'mensal', 'anual')),
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'bloqueado', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    thumbnail TEXT,
    preco DECIMAL(10,2) DEFAULT 49.90,
    total_aulas INTEGER DEFAULT 0,
    duracao_total TEXT,
    total_alunos INTEGER DEFAULT 0,
    avaliacao DECIMAL(2,1) DEFAULT 5.0,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Aulas
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    video_url TEXT,
    duracao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    plano TEXT NOT NULL CHECK (plano IN ('mensal', 'anual')),
    valor DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativa', 'cancelada', 'expirada')),
    data_expiracao TIMESTAMPTZ,
    asaas_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Compras de Cursos (Individual)
CREATE TABLE IF NOT EXISTS public.compras_cursos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
    asaas_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Progresso das Aulas
CREATE TABLE IF NOT EXISTS public.progresso_aulas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, aula_id)
);

-- Tabela de Configurações do Asaas
CREATE TABLE IF NOT EXISTS public.config_asaas (
    id INTEGER PRIMARY KEY DEFAULT 1,
    api_key TEXT,
    ambiente TEXT DEFAULT 'sandbox' CHECK (ambiente IN ('sandbox', 'producao')),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- POLÍTICAS RLS (CORRIGIDAS)
-- ============================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_aulas ENABLE ROW LEVEL SECURITY;

-- USUÁRIOS: cada um vê apenas seu próprio perfil
CREATE POLICY "Usuários veem próprio perfil" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (auth_id = auth.uid());

-- CURSOS: PÚBLICOS - qualquer um pode ver (anon + authenticated)
DROP POLICY IF EXISTS "Cursos públicos visíveis" ON public.cursos;
CREATE POLICY "Cursos públicos visíveis" 
ON public.cursos FOR SELECT 
TO anon, authenticated 
USING (ativo = true);

-- AULAS: PÚBLICAS - qualquer um pode ver aulas de cursos ativos
DROP POLICY IF EXISTS "Aulas públicas visíveis" ON public.aulas;
CREATE POLICY "Aulas públicas visíveis" 
ON public.aulas FOR SELECT 
TO anon, authenticated 
USING (ativo = true AND EXISTS (
    SELECT 1 FROM public.cursos WHERE cursos.id = aulas.curso_id AND cursos.ativo = true
));

-- ASSINATURAS: usuário vê apenas as suas
CREATE POLICY "Usuários veem próprias assinaturas" 
ON public.assinaturas FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = usuario_id AND auth_id = auth.uid()));

-- COMPRAS: usuário vê apenas as suas
CREATE POLICY "Usuários veem próprias compras" 
ON public.compras_cursos FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = usuario_id AND auth_id = auth.uid()));

-- PROGRESSO: usuário gerencia apenas o seu
CREATE POLICY "Usuários gerenciam próprio progresso" 
ON public.progresso_aulas FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = usuario_id AND auth_id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at 
BEFORE UPDATE ON public.usuarios 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CURSOS DE EXEMPLO
-- ============================================================
INSERT INTO public.cursos (titulo, descricao, preco, total_aulas, duracao_total, ordem) VALUES
    ('Jump Fitness', 'Curso completo de jump com técnicas avançadas, coreografias e treinos de resistência. Queime calorias se divertindo!', 49.90, 12, '8h', 1),
    ('Dança Fitness', 'Aulas de dança para queimar calorias e se divertir. Samba, funk, salsa e muito mais!', 49.90, 15, '10h', 2),
    ('Empina Bumbum', 'Treinos específicos para fortalecimento e hipertrofia dos glúteos. Resultados em 30 dias!', 49.90, 10, '6h', 3),
    ('Funcional Total', 'Treinamento funcional para todo o corpo, sem equipamentos. Fortaleça e defina!', 39.90, 8, '5h', 4)
ON CONFLICT DO NOTHING;
