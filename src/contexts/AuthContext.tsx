import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase, type Usuario } from '@/lib/supabase'

interface AuthContextType {
  user: Usuario | null
  session: boolean
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (nome: string, email: string, telefone: string, password: string, plano: string, cursoId?: string) => Promise<{ error?: string; userId?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [session, setSession] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchUser = useCallback(async (authId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (!error && data) {
      setUser(data as Usuario)
      setIsAdmin(data.nivel_acesso === 'admin')
      return data as Usuario
    }
    return null
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (s?.user) {
        setSession(true)
        await fetchUser(s.user.id)
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        setSession(true)
        fetchUser(s.user.id)
      } else {
        setSession(false)
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const u = await fetchUser(data.user.id)
      if (u && u.status === 'bloqueado') {
        await supabase.auth.signOut()
        setSession(false)
        setUser(null)
        return { error: 'Sua conta esta bloqueada. Entre em contato com o suporte.' }
      }
    }
    return {}
  }

  const register = async (nome: string, email: string, telefone: string, password: string, plano: string, cursoId?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ nome, email, telefone, senha: password, plano, curso_id: cursoId })
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar conta')
      }

      // Se plano for free, faz login automatico
      if (plano === 'free') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginError) {
          await fetchUser(result.user_id)
        }
      }

      return { userId: result.user_id }
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar conta' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(false)
    setUser(null)
    setIsAdmin(false)
  }

  const refreshUser = async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) {
      await fetchUser(s.user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
