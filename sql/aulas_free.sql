-- Adicionar campo gratuito na tabela aulas
ALTER TABLE public.aulas 
ADD COLUMN IF NOT EXISTS gratuito BOOLEAN DEFAULT false;

-- Atualizar aulas existentes (opcional)
-- UPDATE public.aulas SET gratuito = false WHERE gratuito IS NULL;
