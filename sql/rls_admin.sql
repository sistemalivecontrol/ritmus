-- ============================================================
-- POLÍTICAS RLS PARA ADMIN - CURSOS E AULAS
-- ============================================================

-- Remover políticas antigas de cursos
DROP POLICY IF EXISTS "Cursos públicos visíveis" ON public.cursos;
DROP POLICY IF EXISTS "Admin gerencia cursos" ON public.cursos;

-- Política para cursos: SELECT público (anon + authenticated)
CREATE POLICY "Cursos públicos visíveis" 
ON public.cursos FOR SELECT 
TO anon, authenticated 
USING (ativo = true);

-- Política para cursos: INSERT/UPDATE/DELETE apenas para admin
CREATE POLICY "Admin gerencia cursos" 
ON public.cursos FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
);

-- Remover políticas antigas de aulas
DROP POLICY IF EXISTS "Aulas públicas visíveis" ON public.aulas;
DROP POLICY IF EXISTS "Admin gerencia aulas" ON public.aulas;

-- Política para aulas: SELECT público
CREATE POLICY "Aulas públicas visíveis" 
ON public.aulas FOR SELECT 
TO anon, authenticated 
USING (ativo = true AND EXISTS (
    SELECT 1 FROM public.cursos WHERE cursos.id = aulas.curso_id AND cursos.ativo = true
));

-- Política para aulas: INSERT/UPDATE/DELETE apenas para admin
CREATE POLICY "Admin gerencia aulas" 
ON public.aulas FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
);

-- Política para usuários: admin pode ver todos
DROP POLICY IF EXISTS "Admin vê todos usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários veem próprio perfil" ON public.usuarios;

CREATE POLICY "Usuários veem próprio perfil" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (auth_id = auth.uid());

CREATE POLICY "Admin vê todos usuários" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
);
