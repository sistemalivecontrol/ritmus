-- Adicionar campo nivel_acesso na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT DEFAULT 'usuario' 
CHECK (nivel_acesso IN ('admin', 'usuario'));

-- Atualizar usuário existente para admin (substitua pelo email do admin)
-- UPDATE public.usuarios SET nivel_acesso = 'admin' WHERE email = 'marcobet@gmail.com';

-- Política RLS para admin ver todos os usuários
DROP POLICY IF EXISTS "Admin vê todos usuários" ON public.usuarios;
CREATE POLICY "Admin vê todos usuários" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.auth_id = auth.uid() AND u.nivel_acesso = 'admin'
  )
);

-- Política para usuários comuns (mantém a anterior)
DROP POLICY IF EXISTS "Usuários veem próprio perfil" ON public.usuarios;
CREATE POLICY "Usuários veem próprio perfil" 
ON public.usuarios FOR ALL 
TO authenticated 
USING (auth_id = auth.uid());
