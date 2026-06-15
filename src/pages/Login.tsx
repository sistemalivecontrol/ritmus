import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Dumbbell, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)
    if (result.error) {
      showToast('Erro', result.error, 'error')
    } else {
      showToast('Sucesso!', 'Bem-vindo de volta!', 'success')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-[72px]" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[420px]">
        <div className="card-base p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="w-7 h-7 text-[var(--primary)]" />
              <span className="text-xl font-bold gradient-text">Ritmus</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta!</h1>
            <p className="text-sm text-[var(--text-muted)]">Acesse suas aulas e continue treinando</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="input-base"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-[var(--primary)]" />
                Lembrar-me
              </label>
              <Link to="/recuperar-senha" className="text-xs" style={{ color: 'var(--primary)' }}>
                Esqueceu a senha?
              </Link>
            </div>
            <button type="submit" disabled={loading} className="btn-submit flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Ainda nao tem conta? <Link to="/cadastro" className="font-medium" style={{ color: 'var(--primary)' }}>Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
