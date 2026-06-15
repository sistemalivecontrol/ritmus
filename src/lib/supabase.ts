import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Usuario = {
  id: string
  auth_id: string | null
  nome: string
  email: string
  telefone: string | null
  plano: 'free' | 'teste' | 'individual' | 'mensal' | 'anual'
  status: 'pendente' | 'ativo' | 'bloqueado' | 'cancelado'
  nivel_acesso: 'admin' | 'usuario'
  created_at: string
  updated_at: string
}

export type Curso = {
  id: string
  titulo: string
  descricao: string | null
  thumbnail: string | null
  preco: number
  total_aulas: number
  duracao_total: string | null
  total_alunos: number
  avaliacao: number
  ordem: number
  ativo: boolean
  gratuito: boolean
  created_at: string
  updated_at: string
}

export type Aula = {
  id: string
  curso_id: string
  titulo: string
  descricao: string | null
  video_url: string | null
  duracao: string | null
  ordem: number
  ativo: boolean
  gratuito: boolean
  created_at: string
}

export type ProgressoAula = {
  id: string
  usuario_id: string
  aula_id: string
  curso_id: string
  concluida: boolean
  created_at: string
  updated_at: string
}

export type Assinatura = {
  id: string
  usuario_id: string
  plano: 'mensal' | 'anual'
  valor: number
  status: 'pendente' | 'ativa' | 'cancelada' | 'expirada'
  data_expiracao: string | null
  asaas_payment_id: string | null
  created_at: string
}

export type CompraCurso = {
  id: string
  usuario_id: string
  curso_id: string
  valor: number
  status: 'pendente' | 'pago' | 'cancelado' | 'reembolsado'
  asaas_payment_id: string | null
  created_at: string
}
