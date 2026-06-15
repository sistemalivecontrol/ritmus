import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, type Curso } from '@/lib/supabase'
import { Play, Clock, Users, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function CursosPage() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [aulasFreeMap, setAulasFreeMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(false)
  const [cursosComprados, setCursosComprados] = useState<string[]>([])

  useEffect(() => {
    loadCursos()
  }, [user])

  async function loadCursos() {
    setLoading(true)
    try {
      // Verificar assinatura
      if (user && (user.plano === 'mensal' || user.plano === 'anual')) {
        const { data: ass } = await supabase.from('assinaturas')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('status', 'ativa')
          .gte('data_expiracao', new Date().toISOString())
          .maybeSingle()
        setAssinaturaAtiva(!!ass)
      }

      // Cursos comprados
      if (user && user.plano === 'individual') {
        const { data: compras } = await supabase.from('compras_cursos')
          .select('curso_id')
          .eq('usuario_id', user.id)
          .eq('status', 'pago')
        setCursosComprados((compras || []).map(c => c.curso_id))
      }

      // Todos os cursos
      const { data: allCursos } = await supabase.from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      setCursos((allCursos || []) as Curso[])

      // Aulas gratuitas por curso
      const { data: aulasFree } = await supabase.from('aulas')
        .select('curso_id')
        .eq('gratuito', true)
        .eq('ativo', true)
      const map: Record<string, boolean> = {}
      ;(aulasFree || []).forEach((a: any) => { map[a.curso_id] = true })
      setAulasFreeMap(map)
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  function podeAssistir(curso: Curso): boolean {
    if (curso.gratuito) return true
    if (aulasFreeMap[curso.id]) return true
    if (assinaturaAtiva) return true
    if (cursosComprados.includes(curso.id)) return true
    if (user?.plano === 'free') return false
    return false
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Play className="w-6 h-6 text-[var(--primary)]" /> Todos os Cursos
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Explore nossos cursos e comece a treinar</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin-slow text-[var(--primary)]" />
        </div>
      ) : cursos.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="text-[var(--text-muted)]">Nenhum curso disponivel. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map(curso => {
            const temAcesso = podeAssistir(curso)
            const temAulasFree = aulasFreeMap[curso.id] || false

            return (
              <div key={curso.id} className="card-base overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={curso.thumbnail || `https://placehold.co/600x400/1A1A2E/FF6B35?text=${encodeURIComponent(curso.titulo)}`}
                    alt={curso.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {temAcesso ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}>
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-8 h-8 text-white/60 mx-auto mb-1" />
                        <span className="text-xs text-white font-semibold">Bloqueado</span>
                      </div>
                    </div>
                  )}
                  {curso.gratuito && <div className="absolute top-2 right-2 badge-free">CURSO GRATUITO</div>}
                  {temAulasFree && !curso.gratuito && <div className="absolute top-2 right-2 badge-success">TEM AULAS FREE</div>}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    {curso.total_aulas} aulas
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white mb-1">{curso.titulo}</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{curso.descricao}</p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {curso.duracao_total || '0h'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {curso.total_alunos}</span>
                  </div>
                  {temAcesso ? (
                    <Link to={`/aula/${curso.id}`} className="btn-curso w-full text-center text-xs py-2">
                      {curso.gratuito ? 'Curso Gratuito' : temAulasFree ? 'Assistir Aulas Free' : 'Assistir Aulas'}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">R$ {curso.preco.toFixed(2).replace('.', ',')}</span>
                      <Link to="/assinatura" className="btn-curso text-xs py-2 px-4">
                        Comprar <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
