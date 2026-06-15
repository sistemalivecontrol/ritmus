import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase, type Assinatura as AssinaturaType } from '@/lib/supabase'
import { CreditCard, AlertTriangle, CheckCircle, Loader2, Star } from 'lucide-react'

export default function AssinaturaPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [assinatura, setAssinatura] = useState<AssinaturaType | null>(null)
  const [historico, setHistorico] = useState<AssinaturaType[]>([])
  const [loading, setLoading] = useState(true)
  const [pagando, setPagando] = useState(false)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    if (!user) return
    try {
      const { data: ass } = await supabase.from('assinaturas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('status', 'ativa')
        .gte('data_expiracao', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setAssinatura(ass as AssinaturaType | null)

      const { data: hist } = await supabase.from('assinaturas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
      setHistorico((hist || []) as AssinaturaType[])
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  async function assinarPlano(plano: 'mensal' | 'anual', valor: number) {
    if (!user) return
    setPagando(true)
    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('asaas-criar-cobranca', {
        body: {
          nome: user.nome || user.email,
          email: user.email,
          telefone: user.telefone || '',
          valor,
          descricao: plano === 'anual' ? 'Plano Anual' : 'Plano Mensal',
          usuario_id: user.id,
          plano,
        }
      })

      if (paymentError) throw paymentError

      if (paymentData?.success && paymentData?.payment_url) {
        showToast('Sucesso!', 'Redirecionando para o pagamento...', 'success')
        setTimeout(() => { window.location.href = paymentData.payment_url }, 1500)
      } else {
        throw new Error('Erro ao gerar link de pagamento')
      }
    } catch (err: any) {
      showToast('Erro', err.message || 'Erro ao processar pagamento', 'error')
    } finally {
      setPagando(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[var(--primary)]" /> Minha Assinatura
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Status */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin-slow text-[var(--primary)]" />
        </div>
      ) : assinatura ? (
        <div className="mb-8 p-5 rounded-xl border border-emerald-500/30 flex items-center gap-4" style={{ background: 'rgba(16,185,129,0.08)' }}>
          <CheckCircle className="w-10 h-10 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white">Assinatura Ativa</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Plano: <strong style={{ color: 'var(--primary)' }}>{assinatura.plano === 'anual' ? 'Anual' : 'Mensal'}</strong>
              {' • '}
              Expira em: <strong>{new Date(assinatura.data_expiracao || '').toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-5 rounded-xl border border-red-500/30 flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <AlertTriangle className="w-10 h-10 text-red-400 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white">Sem Assinatura Ativa</h3>
            <p className="text-sm text-[var(--text-muted)]">Voce nao possui uma assinatura ativa. Escolha um plano abaixo.</p>
          </div>
        </div>
      )}

      {/* Planos */}
      <h2 className="text-lg font-bold text-white mb-4">Planos Disponiveis</h2>
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {/* Mensal */}
        <div className="card-base p-8">
          <h3 className="text-lg font-semibold text-white mb-2">Plano Mensal</h3>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm text-[var(--text-muted)]">R$</span>
            <span className="text-4xl font-extrabold text-white">79</span>
            <span className="text-sm text-[var(--text-muted)]">,90/mes</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Acesso a todos os cursos por 1 mes</p>
          <ul className="space-y-2 mb-6">
            {['Acesso a TODOS os cursos', 'Aulas novas toda semana', 'Suporte prioritario', 'Certificado de conclusao', 'Comunidade exclusiva'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => assinarPlano('mensal', 79.90)} disabled={pagando} className="btn-ghost w-full text-center">
            {pagando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assinar Mensal'}
          </button>
        </div>

        {/* Anual - Featured */}
        <div className="card-base p-8 relative" style={{ borderColor: 'rgba(255, 107, 53, 0.5)', boxShadow: '0 0 30px rgba(255, 107, 53, 0.1)' }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}>
            <Star className="w-3 h-3 inline mr-1" /> Mais Popular
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Plano Anual</h3>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm text-[var(--text-muted)]">R$</span>
            <span className="text-4xl font-extrabold text-white">599</span>
            <span className="text-sm text-[var(--text-muted)]">,90/ano</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Economize 37% no ano</p>
          <ul className="space-y-2 mb-6">
            {['Tudo do plano mensal', '2 meses gratis', 'Materiais extras', 'Planilha de treino', 'Suporte VIP'].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => assinarPlano('anual', 599.90)} disabled={pagando} className="btn-primary w-full text-center">
            {pagando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assinar Anual'}
          </button>
        </div>
      </div>

      {/* Historico */}
      <h2 className="text-lg font-bold text-white mb-4">Historico de Pagamentos</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="pb-3 px-4">Data</th>
              <th className="pb-3 px-4">Plano</th>
              <th className="pb-3 px-4">Valor</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Expiracao</th>
            </tr>
          </thead>
          <tbody>
            {historico.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhum pagamento encontrado.</td>
              </tr>
            ) : (
              historico.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-4 text-sm">{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--primary)' }}>{h.plano === 'anual' ? 'Anual' : 'Mensal'}</td>
                  <td className="py-3 px-4 text-sm">R$ {h.valor?.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium ${h.status === 'ativa' ? 'text-emerald-400' : h.status === 'cancelada' ? 'text-red-400' : 'text-amber-400'}`}>
                      {h.status === 'ativa' ? 'Ativa' : h.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{h.data_expiracao ? new Date(h.data_expiracao).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
