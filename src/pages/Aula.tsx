import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase, type Curso, type Aula as AulaType, type ProgressoAula } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, CheckCircle, Lock, Loader2, Check } from 'lucide-react'

function extrairVideoId(url: string): string | null {
  if (!url) return null
  let match = url.match(/[?&]v=([^&]+)/)
  if (match) return match[1]
  match = url.match(/youtu\.be\/([^?&]+)/)
  if (match) return match[1]
  match = url.match(/embed\/([^?&]+)/)
  if (match) return match[1]
  match = url.match(/shorts\/([^?&]+)/)
  if (match) return match[1]
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(p => p)
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart.length >= 10) return lastPart
    }
  } catch { /* ignore */ }
  return null
}

export default function AulaPage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const [searchParams] = useSearchParams()
  const aulaParam = searchParams.get('aula')
  const { user } = useAuth()
  const { showToast } = useToast()

  const [curso, setCurso] = useState<Curso | null>(null)
  const [aulas, setAulas] = useState<AulaType[]>([])
  const [aulaAtual, setAulaAtual] = useState(0)
  const [progresso, setProgresso] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [temAcesso, setTemAcesso] = useState(false)

  useEffect(() => {
    if (cursoId) loadData()
  }, [cursoId, user])

  async function loadData() {
    if (!cursoId) return
    setLoading(true)

    try {
      // Curso
      const { data: cursoData } = await supabase.from('cursos').select('*').eq('id', cursoId).single()
      if (!cursoData) { showToast('Erro', 'Curso nao encontrado', 'error'); setLoading(false); return }
      setCurso(cursoData as Curso)

      // Aulas
      const { data: aulasData } = await supabase.from('aulas')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      const listaAulas = (aulasData || []) as AulaType[]
      setAulas(listaAulas)

      // Verificar acesso
      let acesso = false
      if (cursoData.gratuito) {
        acesso = true
      } else if (user) {
        // Verificar assinatura
        if (user.plano === 'mensal' || user.plano === 'anual') {
          const { data: ass } = await supabase.from('assinaturas')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('status', 'ativa')
            .gte('data_expiracao', new Date().toISOString())
            .maybeSingle()
          if (ass) acesso = true
        }
        // Verificar compra
        if (!acesso && user.plano === 'individual') {
          const { data: compra } = await supabase.from('compras_cursos')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('curso_id', cursoId)
            .eq('status', 'pago')
            .maybeSingle()
          if (compra) acesso = true
        }
      }
      setTemAcesso(acesso)

      // Progresso
      if (user) {
        const { data: progData } = await supabase.from('progresso_aulas')
          .select('*')
          .eq('usuario_id', user.id)
        const map: Record<string, boolean> = {}
        ;(progData || []).forEach((p: ProgressoAula) => { map[p.aula_id] = p.concluida })
        setProgresso(map)
      }

      // Selecionar aula
      if (aulaParam) {
        const idx = listaAulas.findIndex(a => a.id === aulaParam)
        if (idx >= 0) setAulaAtual(idx)
      } else {
        const idx = listaAulas.findIndex(a => !progresso[a.id])
        setAulaAtual(idx >= 0 ? idx : 0)
      }

    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const aula = aulas[aulaAtual]
  const isAulaFree = aula?.gratuito || curso?.gratuito || false
  const podeVer = temAcesso || isAulaFree

  async function marcarConcluida() {
    if (!user || !aula || !curso) {
      showToast('Atenção', 'Faca login para marcar aula como concluida', 'warning')
      return
    }
    try {
      const { data: existing } = await supabase.from('progresso_aulas')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('aula_id', aula.id)
        .maybeSingle()

      if (existing) {
        await supabase.from('progresso_aulas').update({ concluida: true, updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('progresso_aulas').insert({
          usuario_id: user.id,
          aula_id: aula.id,
          curso_id: curso.id,
          concluida: true,
        })
      }

      setProgresso(prev => ({ ...prev, [aula.id]: true }))
      showToast('Parabens!', 'Aula marcada como concluida!', 'success')

      // Avancar automaticamente
      if (aulaAtual < aulas.length - 1) {
        setTimeout(() => setAulaAtual(prev => prev + 1), 1500)
      }
    } catch (err) {
      showToast('Erro', 'Erro ao marcar aula', 'error')
    }
  }

  async function registrarVisualizacao(aulaId: string) {
    if (!user || !curso) return
    try {
      const { data: existing } = await supabase.from('progresso_aulas')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('aula_id', aulaId)
        .maybeSingle()

      if (existing) {
        await supabase.from('progresso_aulas').update({ updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('progresso_aulas').insert({
          usuario_id: user.id, aula_id: aulaId, curso_id: curso.id, concluida: false,
        })
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (aula && user) registrarVisualizacao(aula.id)
  }, [aulaAtual])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin-slow text-[var(--primary)]" />
      </div>
    )
  }

  if (!curso) return null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/cursos" className="text-sm flex items-center gap-1 mb-3 transition-colors" style={{ color: 'var(--primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Voltar aos Cursos
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{curso.titulo}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{curso.descricao}</p>
      </div>

      {/* Aviso bloqueado */}
      {!podeVer && (
        <div className="mb-6 p-5 rounded-xl border border-red-500/30 flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <Lock className="w-8 h-8 text-red-400 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Acesso Bloqueado</h3>
            <p className="text-sm text-[var(--text-muted)]">Voce nao tem acesso a este curso. Adquira uma assinatura ou compre o curso.</p>
          </div>
          <Link to="/assinatura" className="btn-curso shrink-0 text-xs">Ver Precos</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Video Player + Info */}
        <div>
          {podeVer && aula ? (
            <>
              <div className="rounded-xl overflow-hidden aspect-video bg-black mb-4" style={{ border: '1px solid var(--border)' }}>
                {aula.video_url ? (
                  (() => {
                    const videoId = extrairVideoId(aula.video_url)
                    const isShorts = aula.video_url.includes('/shorts/')
                    if (isShorts) {
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                          <span className="text-4xl mb-3">📱</span>
                          <p className="text-white mb-2">Este video e um YouTube Shorts</p>
                          <p className="text-sm text-[var(--text-muted)] mb-4">Os Shorts nao podem ser incorporados diretamente.</p>
                          <a href={aula.video_url} target="_blank" rel="noreferrer" className="btn-curso">Assistir no YouTube</a>
                        </div>
                      )
                    }
                    if (videoId) {
                      return (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={aula.titulo}
                          className="w-full h-full"
                        />
                      )
                    }
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                        <span className="text-4xl mb-3">⚠️</span>
                        <p className="text-white mb-2">URL do video invalida</p>
                        <a href={aula.video_url} target="_blank" rel="noreferrer" className="btn-curso">Abrir Link</a>
                      </div>
                    )
                  })()
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                    <span className="text-4xl mb-3">🎬</span>
                    <p className="text-[var(--text-muted)]">Video em breve</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-white">Aula {aulaAtual + 1}: {aula.titulo}</h2>
                  {aula.gratuito && <span className="badge-success">GRATUITO</span>}
                  {curso.gratuito && <span className="badge-free">CURSO GRATUITO</span>}
                </div>
                <p className="text-sm text-[var(--text-muted)]">{aula.descricao}</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => setAulaAtual(prev => prev - 1)}
                    disabled={aulaAtual === 0}
                    className="btn-ghost text-xs py-2 px-4 disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                  </button>
                  {user && (
                    <button onClick={marcarConcluida} className="btn-curso text-xs py-2 px-4">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Marcar como Concluida
                    </button>
                  )}
                  <button
                    onClick={() => setAulaAtual(prev => prev + 1)}
                    disabled={aulaAtual === aulas.length - 1}
                    className="btn-ghost text-xs py-2 px-4 disabled:opacity-40"
                  >
                    Proxima <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl aspect-video flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <Lock className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Conteudo bloqueado</p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Aulas */}
        <div>
          <h3 className="font-semibold text-white mb-3">Aulas do Curso</h3>
          <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {aulas.map((a, idx) => {
              const isActive = idx === aulaAtual
              const concluida = progresso[a.id]
              const isFree = a.gratuito || curso.gratuito

              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (isFree || temAcesso) setAulaAtual(idx)
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'text-white'
                      : concluida
                        ? 'text-[var(--text-muted)] hover:bg-white/5'
                        : 'text-[var(--text-muted)] hover:bg-white/5'
                  }`}
                  style={isActive ? { background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.2)' } : { border: '1px solid transparent' }}
                  disabled={!isFree && !temAcesso}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: concluida ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: concluida || isActive ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {concluida ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>{a.titulo}</div>
                    <div className="text-xs text-[var(--text-dark)] flex items-center gap-2">
                      {a.duracao || '0:00'}
                      {isFree && <span className="text-emerald-400 font-medium">FREE</span>}
                      {!isFree && !temAcesso && <Lock className="w-3 h-3 inline" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
