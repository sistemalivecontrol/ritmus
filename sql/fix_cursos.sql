-- Adicionar updated_at na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_cursos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cursos_updated_at ON public.cursos;
CREATE TRIGGER update_cursos_updated_at 
BEFORE UPDATE ON public.cursos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_cursos();
