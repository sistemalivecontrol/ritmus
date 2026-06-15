import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase, type Curso } from '@/lib/supabase'
import { Dumbbell, Loader2, ArrowLeft } from 'lucide-react'

const CURSOS_DISPONIVEIS: Curso[] = [
  { id: 'jump-fitness', titulo: 'Jump Fitness', descricao: '', thumbnail: null, preco: 49.90, total_aulas: 12, duracao_total: '8h', total_alunos: 0, avaliacao: 5.0, ordem: 0, ativo: true, gratuito: false, created_at: '', updated_at: '' },
  { id: 'danca-fitness', titulo: 'Danca Fitness', descricao: '', thumbnail: null, preco: 49.90, total_aulas: 15, duracao_total: '10h', total_alunos: 0, avaliacao: 5.0, ordem: 1, ativo: true, gratuito: false, created_at: '', updated_at: '' },
  { id: 'empina-bumbum', titulo: 'Empina Bumbum', descricao: '', thumbnail: null, preco: 49.90, total_aulas: 10, duracao_total: '6h', total_alunos: 0, avaliacao: 5.0, ordem: 2, ativo: true, gratuito: false, created_at: '', updated_at: '' },
  { id: 'funcional-total', titulo: 'Funcional Total', descricao: '', thumbnail: null, preco: 39.90, total_aulas: 8, duracao_total: '5h', total_alunos: 0, avaliacao: 5.0, ordem: 3, ativo: true, gratuito: false, created_at: '', updated_at: '' },
]

export default function Cadastro() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const planoUrl = searchParams.get('plano') || ''
  const cursoUrl = searchParams.get('curso') || ''

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [plano, setPlano] = useState(planoUrl)
  const [cursoId, setCursoId] = useState(cursoUrl)
  const [termos, setTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cursos, setCursos] = useState<Curso[]>(CURSOS_DISPONIVEIS)

  const { register } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    async function loadCursos() {
      try {
        const { data, error } = await supabase.from('cursos').select('id, titulo, preco').eq('ativo', true).order('ordem')
        if (!error && data && data.length > 0) {
          setCursos(data as Curso[])
        }
      } catch { /* use fallback */ }
    }
    loadCursos()
  }, [])

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
    v = v.replace(/(\d{5})(\d)/, '$1-$2')
    setTelefone(v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termos) {
      showToast('Atenção', 'Aceite os termos de uso para continuar.', 'warning')
      return
    }
    if (plano === 'individual' && !cursoId) {
      showToast('Atenção', 'Selecione um curso.', 'warning')
      return
    }

    setLoading(true)
    const result = await register(nome, email, telefone.replace(/\D/g, ''), senha, plano, cursoId || undefined)
    setLoading(false)

    if (result.error) {
      showToast('Erro', result.error, 'error')
      return
    }

    // Se plano for free, redireciona para dashboard (ja logado)
    if (plano === 'free') {
      showToast('Sucesso!', 'Conta criada! Bem-vindo ao Ritmus Free!', 'success')
      navigate('/dashboard')
      return
    }

    // Se plano pago, tenta criar cobranca Asaas
    try {
      const valor = plano === 'individual' ? 49.90 : plano === 'mensal' ? 79.90 : 599.90
      const descricao = plano === 'individual' ? 'Curso Individual' : plano === 'mensal' ? 'Plano Mensal' : 'Plano Anual'

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('asaas-criar-cobranca', {
        body: {
          nome, email,
          telefone: telefone.replace(/\D/g, ''),
          valor, descricao,
          usuario_id: result.userId,
          plano,
          curso_id: cursoId || null,
        }
      })

      if (!paymentError && paymentData?.success && paymentData?.payment_url) {
        showToast('Sucesso!', 'Redirecionando para o pagamento...', 'success')
        setTimeout(() => { window.location.href = paymentData.payment_url }, 1500)
      } else {
        throw new Error('Erro ao gerar link de pagamento')
      }
    } catch {
      showToast('Conta criada!', 'Sua conta foi criada! Faca login para continuar.', 'warning')
      navigate('/login')
    }
  }

  const isFree = plano === 'free'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 pt-[88px]" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[460px]">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao inicio
        </Link>

        <div className="card-base p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="w-7 h-7 text-[var(--primary)]" />
              <span className="text-xl font-bold gradient-text">Ritmus</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {isFree ? 'Comece gratuitamente hoje' : 'Comece sua jornada fitness hoje'}
            </p>
          </div>

          {isFree && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p className="text-sm text-emerald-400 font-medium text-center">Voce escolheu o Plano Free!</p>
              <p className="text-xs text-[var(--text-muted)] text-center mt-1">Acesse cursos gratuitos sem pagar nada.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Nome Completo *</label>
              <input type="text" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">E-mail *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">WhatsApp *</label>
              <input type="tel" required value={telefone} onChange={handlePhoneInput} placeholder="(00) 00000-0000" maxLength={15} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Senha *</label>
              <input type="password" required minLength={6} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Minimo 6 caracteres" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Plano *</label>
              <select required value={plano} onChange={e => setPlano(e.target.value)} className="input-base">
                <option value="">Selecione um plano</option>
                <option value="free">Plano Free - R$ 0,00</option>
                <option value="individual">Curso Individual - R$ 49,90</option>
                <option value="mensal">Plano Mensal - R$ 79,90/mes</option>
                <option value="anual">Plano Anual - R$ 599,90/ano</option>
              </select>
            </div>

            {plano === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Curso Desejado *</label>
                <select required value={cursoId} onChange={e => setCursoId(e.target.value)} className="input-base">
                  <option value="">Selecione o curso</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.titulo} - R$ {c.preco.toFixed(2).replace('.', ',')}</option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required checked={termos} onChange={e => setTermos(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[var(--primary)]" />
              <span className="text-xs text-[var(--text-muted)]">
                Li e aceito os <a href="#" className="underline" style={{ color: 'var(--primary)' }}>Termos de Uso</a> e <a href="#" className="underline" style={{ color: 'var(--primary)' }}>Politica de Privacidade</a>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-submit flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isFree ? 'Criar Conta Gratis' : 'Criar Conta e Pagar')}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Ja tem uma conta? <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
