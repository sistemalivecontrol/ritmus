import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, type Curso, type ProgressoAula } from '@/lib/supabase'
import { PlayCircle, CheckCircle, Clock, Flame, BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [progresso, setProgresso] = useState<ProgressoAula[]>([])
  const [loading, setLoading] = useState(true)
  const [ultimaAula, setUltimaAula] = useState<{ curso: Curso; aulaTitulo: string; aulaId: string } | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    if (!user) return
    setLoading(true)

    try {
      // Buscar cursos disponiveis (comprados ou gratuitos)
      let cursosDisponiveis: Curso[] = []

      if (user.plano === 'free') {
        // Free: so cursos gratuitos
        const { data } = await supabase.from('cursos').select('*').eq('ativo', true).eq('gratuito', true).order('ordem')
        cursosDisponiveis = (data || []) as Curso[]
      } else if (user.plano === 'mensal' || user.plano === 'anual') {
        // Assinatura: todos os cursos
        const { data } = await supabase.from('cursos').select('*').eq('ativo', true).order('ordem')
        cursosDisponiveis = (data || []) as Curso[]
      } else if (user.plano === 'individual') {
        // Individual: curso comprado + gratuitos
        const { data: compras } = await supabase.from('compras_cursos').select('curso_id').eq('usuario_id', user.id).eq('status', 'pago')
        const idsComprados = (compras || []).map(c => c.curso_id)
        const { data: todos } = await supabase.from('cursos').select('*').eq('ativo', true).order('ordem')
        cursosDisponiveis = ((todos || []) as Curso[]).filter(c => idsComprados.includes(c.id) || c.gratuito)
      }

      // Se nenhum curso disponivel, mostrar todos os gratuitos como fallback
      if (cursosDisponiveis.length === 0) {
        const { data: freeCursos } = await supabase.from('cursos').select('*').eq('ativo', true).eq('gratuito', true).order('ordem')
        cursosDisponiveis = (freeCursos || []) as Curso[]
      }

      setCursos(cursosDisponiveis)

      // Progresso
      const { data: prog } = await supabase.from('progresso_aulas').select('*').eq('usuario_id', user.id).eq('concluida', true)
      setProgresso((prog || []) as ProgressoAula[])

      // Ultima aula assistida
      const { data: lastProg } = await supabase.from('progresso_aulas')
        .select('aula_id, curso_id, updated_at')
        .eq('usuario_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastProg) {
        const { data: cursoData } = await supabase.from('cursos').select('*').eq('id', lastProg.curso_id).single()
        const { data: aulaData } = await supabase.from('aulas').select('titulo, id').eq('id', lastProg.aula_id).single()
        if (cursoData && aulaData) {
          setUltimaAula({ curso: cursoData as Curso, aulaTitulo: aulaData.titulo, aulaId: aulaData.id })
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalAulasConcluidas = progresso.length
  const horasTreino = Math.round((totalAulasConcluidas * 30) / 60)
  const diasSeguidos = totalAulasConcluidas > 0 ? 1 : 0

  const planoLabel: Record<string, string> = {
    free: 'Plano Free',
    teste: 'Periodo de Teste',
    individual: 'Curso Individual',
    mensal: 'Plano Mensal',
    anual: 'Plano Anual',
  }

  const planoColor: Record<string, string> = {
    free: 'var(--success)',
    teste: 'var(--warning)',
    individual: 'var(--info)',
    mensal: 'var(--primary)',
    anual: 'var(--secondary)',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Ola, {user?.nome?.split(' ')[0] || 'Aluno'}!
        </h1>
        <p className="text-sm">
          <span style={{ color: planoColor[user?.plano || 'free'] }}>
            {user?.plano === 'free' && <Sparkles className="w-3.5 h-3.5 inline mr-1" />}
            {planoLabel[user?.plano || 'free']}
          </span>
          {user?.plano === 'free' && (
            <span className="text-[var(--text-muted)] ml-2">
              - <Link to="/assinatura" className="underline" style={{ color: 'var(--primary)' }}>Upgrade para acesso completo</Link>
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, value: user?.plano === 'mensal' || user?.plano === 'anual' ? '∞' : String(cursos.length), label: 'Cursos Ativos' },
          { icon: CheckCircle, value: String(totalAulasConcluidas), label: 'Aulas Concluidas' },
          { icon: Clock, value: `${horasTreino}h`, label: 'Horas de Treino' },
          { icon: Flame, value: String(diasSeguidos), label: 'Dias Seguidos' },
        ].map(stat => (
          <div key={stat.label} className="card-base p-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255, 107, 53, 0.15)' }}>
              <stat.icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Continue Watching */}
      {ultimaAula && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-[var(--primary)]" /> Continue Assistindo
          </h2>
          <Link
            to={`/aula/${ultimaAula.curso.id}?aula=${ultimaAula.aulaId}`}
            className="card-base p-4 flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0">
              <img
                src={ultimaAula.curso.thumbnail || `https://placehold.co/400x300/1A1A2E/FF6B35?text=${encodeURIComponent(ultimaAula.curso.titulo)}`}
                alt={ultimaAula.curso.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{ultimaAula.curso.titulo}</h3>
              <p className="text-sm text-[var(--text-muted)] truncate">{ultimaAula.aulaTitulo}</p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                Continuar assistindo <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Meus Cursos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" /> Meus Cursos
          </h2>
          <Link to="/cursos" className="text-sm" style={{ color: 'var(--primary)' }}>Ver todos</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
          </div>
        ) : cursos.length === 0 ? (
          <div className="card-base p-8 text-center">
            <PlayCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h3 className="font-medium text-white mb-1">Nenhum curso disponivel</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {user?.plano === 'free'
                ? 'Ainda nao ha cursos gratuitos disponiveis. Volte em breve!'
                : 'Adquira um curso ou assinatura para comecar.'}
            </p>
            {user?.plano === 'free' && (
              <Link to="/assinatura" className="btn-curso inline-flex">
                Ver Planos Pagos
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map(curso => {
              const aulasCurso = progresso.filter(p => p.curso_id === curso.id)
              const concluidas = aulasCurso.filter(p => p.concluida).length
              const total = curso.total_aulas || 1
              const pct = Math.round((concluidas / total) * 100)

              return (
                <Link
                  key={curso.id}
                  to={`/aula/${curso.id}`}
                  className="card-base overflow-hidden group cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={curso.thumbnail || `https://placehold.co/600x400/1A1A2E/FF6B35?text=${encodeURIComponent(curso.titulo)}`}
                      alt={curso.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {curso.gratuito && <div className="absolute top-2 right-2 badge-free">GRATUITO</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1 truncate">{curso.titulo}</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{curso.total_aulas} aulas • {curso.duracao_total || '0h'}</p>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FF6B35, #E55A28)' }} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{pct}% concluido</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
