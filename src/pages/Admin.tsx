import { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { supabase, type Curso, type Aula, type Usuario, type Assinatura } from '@/lib/supabase'
import { Settings, BookOpen, PlayCircle, Users, CreditCard, Plus, X, Edit, Trash2, Loader2 } from 'lucide-react'

type Tab = 'cursos' | 'aulas' | 'alunos' | 'assinaturas'

export default function AdminPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('cursos')
  const [stats, setStats] = useState({ cursos: 0, aulas: 0, alunos: 0, faturamento: 0 })
  const [cursos, setCursos] = useState<Curso[]>([])
  const [aulas, setAulas] = useState<(Aula & { cursos?: { titulo: string } })[]>([])
  const [alunos, setAlunos] = useState<Usuario[]>([])
  const [assinaturas, setAssinaturas] = useState<(Assinatura & { usuarios?: { nome: string; email: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCurso, setModalCurso] = useState(false)
  const [modalAula, setModalAula] = useState(false)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  const [aulaFilterCurso, setAulaFilterCurso] = useState('')

  // Form curso
  const [cursoForm, setCursoForm] = useState({
    titulo: '', descricao: '', preco: '49.90', ordem: '0', duracao: '', total_aulas: '0',
    thumbnail: '', ativo: true, gratuito: false,
  })

  // Form aula
  const [aulaForm, setAulaForm] = useState({
    curso_id: '', titulo: '', descricao: '', video_url: '', duracao: '', ordem: '1', ativo: true, gratuito: false,
  })

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      // Stats
      const { count: cCount } = await supabase.from('cursos').select('*', { count: 'exact', head: true })
      const { count: aCount } = await supabase.from('aulas').select('*', { count: 'exact', head: true })
      const { count: uCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true })

      const { data: pagos } = await supabase.from('assinaturas').select('valor').eq('status', 'ativa')
      const { data: comprasPagas } = await supabase.from('compras_cursos').select('valor').eq('status', 'pago')
      let total = 0
      ;(pagos || []).forEach((p: any) => total += p.valor || 0)
      ;(comprasPagas || []).forEach((c: any) => total += c.valor || 0)

      setStats({ cursos: cCount || 0, aulas: aCount || 0, alunos: uCount || 0, faturamento: total })

      // Cursos
      const { data: cData } = await supabase.from('cursos').select('*').order('ordem')
      setCursos((cData || []) as Curso[])

      // Alunos
      const { data: uData } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
      setAlunos((uData || []) as Usuario[])

      // Assinaturas
      const { data: assData } = await supabase.from('assinaturas').select('*, usuarios(nome, email)').order('created_at', { ascending: false })
      setAssinaturas((assData || []) as any)

      await loadAulas()
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAulas() {
    let query = supabase.from('aulas').select('*, cursos(titulo)').order('ordem')
    if (aulaFilterCurso) query = query.eq('curso_id', aulaFilterCurso) as any
    const { data } = await query
    setAulas((data || []) as any)
  }

  useEffect(() => { loadAulas() }, [aulaFilterCurso])

  async function salvarCurso(e: React.FormEvent) {
    e.preventDefault()
    try {
      const body = {
        action: editingCurso ? 'update_curso' : 'insert_curso',
        ...(editingCurso ? { id: editingCurso.id } : {}),
        data: {
          titulo: cursoForm.titulo,
          descricao: cursoForm.descricao,
          preco: parseFloat(cursoForm.preco),
          total_aulas: parseInt(cursoForm.total_aulas),
          duracao_total: cursoForm.duracao,
          ordem: parseInt(cursoForm.ordem),
          thumbnail: cursoForm.thumbnail,
          ativo: cursoForm.ativo,
          gratuito: cursoForm.gratuito,
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-admin-cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)

      showToast('Sucesso!', editingCurso ? 'Curso atualizado!' : 'Curso cadastrado!', 'success')
      setModalCurso(false)
      setEditingCurso(null)
      resetCursoForm()
      await loadAll()
    } catch (err: any) {
      showToast('Erro', err.message, 'error')
    }
  }

  async function salvarAula(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-admin-cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          action: 'insert_aula',
          data: {
            curso_id: aulaForm.curso_id,
            titulo: aulaForm.titulo,
            descricao: aulaForm.descricao,
            video_url: aulaForm.video_url,
            duracao: aulaForm.duracao,
            ordem: parseInt(aulaForm.ordem),
            ativo: aulaForm.ativo,
            gratuito: aulaForm.gratuito,
          }
        })
      })

      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)

      showToast('Sucesso!', 'Aula cadastrada!', 'success')
      setModalAula(false)
      resetAulaForm()
      await loadAulas()
      await loadAll()
    } catch (err: any) {
      showToast('Erro', err.message, 'error')
    }
  }

  async function excluirCurso(id: string) {
    if (!confirm('Tem certeza? Todas as aulas serao excluidas tambem.')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-admin-cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'delete_curso', id })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      showToast('Sucesso!', 'Curso excluido', 'success')
      await loadAll()
    } catch (err: any) {
      showToast('Erro', err.message, 'error')
    }
  }

  async function excluirAula(id: string) {
    if (!confirm('Tem certeza?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-admin-cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'delete_aula', id })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      showToast('Sucesso!', 'Aula excluida', 'success')
      await loadAulas()
      await loadAll()
    } catch (err: any) {
      showToast('Erro', err.message, 'error')
    }
  }

  async function toggleAdmin(id: string, current: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ritmus-admin-cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'update_usuario', id, data: { nivel_acesso: current === 'admin' ? 'usuario' : 'admin' } })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      showToast('Sucesso!', 'Permissao atualizada', 'success')
      await loadAll()
    } catch (err: any) {
      showToast('Erro', err.message, 'error')
    }
  }

  function resetCursoForm() {
    setCursoForm({ titulo: '', descricao: '', preco: '49.90', ordem: '0', duracao: '', total_aulas: '0', thumbnail: '', ativo: true, gratuito: false })
  }

  function resetAulaForm() {
    setAulaForm({ curso_id: '', titulo: '', descricao: '', video_url: '', duracao: '', ordem: '1', ativo: true, gratuito: false })
  }

  function openEditCurso(c: Curso) {
    setEditingCurso(c)
    setCursoForm({
      titulo: c.titulo, descricao: c.descricao || '', preco: String(c.preco), ordem: String(c.ordem),
      duracao: c.duracao_total || '', total_aulas: String(c.total_aulas), thumbnail: c.thumbnail || '',
      ativo: c.ativo, gratuito: c.gratuito,
    })
    setModalCurso(true)
  }

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'cursos', label: 'Cursos', icon: BookOpen },
    { key: 'aulas', label: 'Aulas', icon: PlayCircle },
    { key: 'alunos', label: 'Alunos', icon: Users },
    { key: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin-slow text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--primary)]" /> Painel Administrativo
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF6B35, #F7C948)' }}>ADMIN</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Gerencie cursos, aulas, alunos e assinaturas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, value: stats.cursos, label: 'Total Cursos' },
          { icon: PlayCircle, value: stats.aulas, label: 'Total Aulas' },
          { icon: Users, value: stats.alunos, label: 'Total Alunos' },
          { icon: CreditCard, value: `R$ ${stats.faturamento.toFixed(2).replace('.', ',')}`, label: 'Faturamento' },
        ].map(s => (
          <div key={s.label} className="card-base p-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,107,53,0.15)' }}>
              <s.icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
            style={activeTab === t.key ? { background: 'rgba(255,107,53,0.1)' } : {}}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Cursos */}
      {activeTab === 'cursos' && (
        <div>
          <button onClick={() => { setEditingCurso(null); resetCursoForm(); setModalCurso(true); }} className="btn-primary mb-4 text-sm py-2.5 px-5">
            <Plus className="w-4 h-4 mr-1" /> Novo Curso
          </button>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-3 px-4">Titulo</th>
                  <th className="pb-3 px-4">Preco</th>
                  <th className="pb-3 px-4">Aulas</th>
                  <th className="pb-3 px-4">Alunos</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white">{c.titulo}</strong>
                        {c.gratuito && <span className="badge-free text-[10px] px-2">FREE</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">R$ {c.preco?.toFixed(2).replace('.', ',')}</td>
                    <td className="py-3 px-4 text-sm">{c.total_aulas}</td>
                    <td className="py-3 px-4 text-sm">{c.total_alunos}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${c.ativo ? 'text-emerald-400' : 'text-red-400'}`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditCurso(c)} className="p-1.5 rounded-lg text-[var(--info)] hover:bg-white/5 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => excluirCurso(c.id)} className="p-1.5 rounded-lg text-[var(--danger)] hover:bg-white/5 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Aulas */}
      {activeTab === 'aulas' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Filtrar por Curso</label>
              <select value={aulaFilterCurso} onChange={e => setAulaFilterCurso(e.target.value)} className="input-base text-sm py-2">
                <option value="">Todos os cursos</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
              </select>
            </div>
            <button onClick={() => { resetAulaForm(); setModalAula(true); }} className="btn-primary text-sm py-2.5 px-5">
              <Plus className="w-4 h-4 mr-1" /> Nova Aula
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-3 px-4">Ordem</th>
                  <th className="pb-3 px-4">Titulo</th>
                  <th className="pb-3 px-4">Curso</th>
                  <th className="pb-3 px-4">Duracao</th>
                  <th className="pb-3 px-4">Video</th>
                  <th className="pb-3 px-4">Free</th>
                  <th className="pb-3 px-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {aulas.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-sm">{a.ordem}</td>
                    <td className="py-3 px-4"><strong className="text-sm text-white">{a.titulo}</strong></td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{a.cursos?.titulo || '-'}</td>
                    <td className="py-3 px-4 text-sm">{a.duracao || '-'}</td>
                    <td className="py-3 px-4">
                      {a.video_url ? (
                        <a href={a.video_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: 'var(--primary)' }}>Ver video ↗</a>
                      ) : (
                        <span className="text-xs text-[var(--text-dark)]">Sem video</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {a.gratuito && <span className="badge-success text-[10px] px-2">FREE</span>}
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => excluirAula(a.id)} className="p-1.5 rounded-lg text-[var(--danger)] hover:bg-white/5 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Alunos */}
      {activeTab === 'alunos' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="pb-3 px-4">Nome</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4">Plano</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Cadastro</th>
                <th className="pb-3 px-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4"><strong className="text-sm text-white">{a.nome}</strong></td>
                  <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{a.email}</td>
                  <td className="py-3 px-4"><span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{a.plano}</span></td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium ${a.status === 'ativo' ? 'text-emerald-400' : 'text-amber-400'}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleAdmin(a.id, a.nivel_acesso)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: a.nivel_acesso === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(255,107,53,0.1)',
                        color: a.nivel_acesso === 'admin' ? '#8B5CF6' : '#FF6B35',
                      }}
                    >
                      {a.nivel_acesso === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Assinaturas */}
      {activeTab === 'assinaturas' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="pb-3 px-4">Aluno</th>
                <th className="pb-3 px-4">Plano</th>
                <th className="pb-3 px-4">Valor</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Expiracao</th>
              </tr>
            </thead>
            <tbody>
              {assinaturas.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <strong className="text-sm text-white">{a.usuarios?.nome || '-'}</strong>
                    <br /><small className="text-[var(--text-muted)]">{a.usuarios?.email || ''}</small>
                  </td>
                  <td className="py-3 px-4"><span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{a.plano}</span></td>
                  <td className="py-3 px-4 text-sm">R$ {a.valor?.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium ${a.status === 'ativa' ? 'text-emerald-400' : 'text-amber-400'}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{a.data_expiracao ? new Date(a.data_expiracao).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Curso */}
      {modalCurso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card-base w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => { setModalCurso(false); setEditingCurso(null); }} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              {editingCurso ? 'Editar Curso' : 'Cadastrar Curso'}
            </h2>
            <form onSubmit={salvarCurso} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Titulo *</label>
                <input type="text" required value={cursoForm.titulo} onChange={e => setCursoForm({ ...cursoForm, titulo: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Descricao</label>
                <textarea rows={3} value={cursoForm.descricao} onChange={e => setCursoForm({ ...cursoForm, descricao: e.target.value })} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Preco (R$) *</label>
                  <input type="number" step="0.01" required value={cursoForm.preco} onChange={e => setCursoForm({ ...cursoForm, preco: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Ordem</label>
                  <input type="number" value={cursoForm.ordem} onChange={e => setCursoForm({ ...cursoForm, ordem: e.target.value })} className="input-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Duracao Total</label>
                  <input type="text" value={cursoForm.duracao} onChange={e => setCursoForm({ ...cursoForm, duracao: e.target.value })} placeholder="Ex: 8h" className="input-base" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Total Aulas</label>
                  <input type="number" value={cursoForm.total_aulas} onChange={e => setCursoForm({ ...cursoForm, total_aulas: e.target.value })} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Thumbnail (URL)</label>
                <input type="url" value={cursoForm.thumbnail} onChange={e => setCursoForm({ ...cursoForm, thumbnail: e.target.value })} placeholder="https://..." className="input-base" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cursoForm.ativo} onChange={e => setCursoForm({ ...cursoForm, ativo: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm text-[var(--text-muted)]">Curso ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cursoForm.gratuito} onChange={e => setCursoForm({ ...cursoForm, gratuito: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium text-emerald-400">Curso Gratuito (Free)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-submit flex-1">{editingCurso ? 'Atualizar' : 'Salvar'}</button>
                <button type="button" onClick={() => { setModalCurso(false); setEditingCurso(null); }} className="btn-ghost px-6">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aula */}
      {modalAula && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card-base w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setModalAula(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[var(--primary)]" /> Cadastrar Aula
            </h2>
            <form onSubmit={salvarAula} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Curso *</label>
                <select required value={aulaForm.curso_id} onChange={e => setAulaForm({ ...aulaForm, curso_id: e.target.value })} className="input-base">
                  <option value="">Selecione o curso</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Titulo da Aula *</label>
                <input type="text" required value={aulaForm.titulo} onChange={e => setAulaForm({ ...aulaForm, titulo: e.target.value })} placeholder="Ex: Aula 1 - Introducao" className="input-base" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Descricao</label>
                <textarea rows={2} value={aulaForm.descricao} onChange={e => setAulaForm({ ...aulaForm, descricao: e.target.value })} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">URL do Video (YouTube) *</label>
                  <input type="url" required value={aulaForm.video_url} onChange={e => setAulaForm({ ...aulaForm, video_url: e.target.value })} placeholder="https://youtube.com/..." className="input-base" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Duracao</label>
                  <input type="text" value={aulaForm.duracao} onChange={e => setAulaForm({ ...aulaForm, duracao: e.target.value })} placeholder="Ex: 30:00" className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Ordem</label>
                <input type="number" value={aulaForm.ordem} onChange={e => setAulaForm({ ...aulaForm, ordem: e.target.value })} className="input-base" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={aulaForm.ativo} onChange={e => setAulaForm({ ...aulaForm, ativo: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm text-[var(--text-muted)]">Aula ativa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={aulaForm.gratuito} onChange={e => setAulaForm({ ...aulaForm, gratuito: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium text-emerald-400">Aula Gratuita (Free)</span>
                </label>
              </div>
              <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <span className="text-[var(--text-muted)]">
                  <strong className="text-white">Dica:</strong> No YouTube, configure o video como <strong>"Nao listado"</strong> (Unlisted) e permita incorporacao. NAO use "Privado" pois nao permite embed.
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-submit flex-1">Salvar</button>
                <button type="button" onClick={() => setModalAula(false)} className="btn-ghost px-6">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
