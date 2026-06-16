-- Adicionar campo gratuito na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS gratuito BOOLEAN DEFAULT false;

-- Atualizar cursos existentes (opcional)
-- UPDATE public.cursos SET gratuito = false WHERE gratuito IS NULL;
