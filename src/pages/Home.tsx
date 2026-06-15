import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Curso } from '@/lib/supabase'
import { Play, Users, Clock, Target, FileText, CreditCard, ArrowRight, CheckCircle, Lock } from 'lucide-react'

const CURSOS_HARDCODED: Curso[] = [
  { id: 'jump-fitness', titulo: 'Jump Fitness', descricao: 'Curso completo de jump com tecnicas avancadas, coreografias e treinos de resistencia. Queime calorias se divertindo!', preco: 49.90, total_aulas: 12, duracao_total: '8h', total_alunos: 0, avaliacao: 5.0, ordem: 0, ativo: true, gratuito: false, thumbnail: null, created_at: '', updated_at: '' },
  { id: 'danca-fitness', titulo: 'Danca Fitness', descricao: 'Aulas de danca para queimar calorias e se divertir. Samba, funk, salsa e muito mais!', preco: 49.90, total_aulas: 15, duracao_total: '10h', total_alunos: 0, avaliacao: 5.0, ordem: 1, ativo: true, gratuito: false, thumbnail: null, created_at: '', updated_at: '' },
  { id: 'empina-bumbum', titulo: 'Empina Bumbum', descricao: 'Treinos especificos para fortalecimento e hipertrofia dos gluteos. Resultados em 30 dias!', preco: 49.90, total_aulas: 10, duracao_total: '6h', total_alunos: 0, avaliacao: 5.0, ordem: 2, ativo: true, gratuito: false, thumbnail: null, created_at: '', updated_at: '' },
  { id: 'funcional-total', titulo: 'Funcional Total', descricao: 'Treinamento funcional para todo o corpo, sem equipamentos. Fortaleca e defina!', preco: 39.90, total_aulas: 8, duracao_total: '5h', total_alunos: 0, avaliacao: 5.0, ordem: 3, ativo: true, gratuito: false, thumbnail: null, created_at: '', updated_at: '' },
]

function useIntersectionObserver() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, isVisible }
}

function AnimatedSection({ children, className = '', delay = '' }: { children: React.ReactNode; className?: string; delay?: string }) {
  const { ref, isVisible } = useIntersectionObserver()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={delay ? { transitionDelay: delay } : undefined}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCursos() {
      try {
        const { data, error } = await supabase.from('cursos').select('*').eq('ativo', true).order('ordem', { ascending: true })
        if (!error && data && data.length > 0) setCursos(data)
        else setCursos(CURSOS_HARDCODED)
      } catch {
        setCursos(CURSOS_HARDCODED)
      } finally {
        setLoading(false)
      }
    }
    loadCursos()
  }, [])

  const floatClass = ['animate-float', 'animate-float-delayed', 'animate-float-delayed-2']

  return (
    <div className="pt-[72px]">
      {/* Hero */}
      <section className="min-h-[calc(100vh-72px)] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,107,53,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="animate-fade-in">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6" style={{ background: 'var(--bg-elevated)', color: 'var(--primary)' }}>
                  <Target className="w-3.5 h-3.5" /> Novo
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-6 animate-slide-up">
                Transforme seu Corpo com <span className="gradient-text">Aulas Fitness Online</span>
              </h1>
              <p className="text-lg text-[var(--text-muted)] max-w-lg mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Acesse videos exclusivos de Jump, Danca, Funcional e muito mais. Treine quando quiser, onde quiser.
              </p>

              <div className="flex flex-wrap gap-8 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div><span className="text-3xl font-extrabold text-white">50+</span><p className="text-sm text-[var(--text-muted)]">Aulas</p></div>
                <div><span className="text-3xl font-extrabold text-white">10k+</span><p className="text-sm text-[var(--text-muted)]">Alunos</p></div>
                <div><span className="text-3xl font-extrabold text-white">4.9</span><p className="text-sm text-[var(--text-muted)]">Avaliacao</p></div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link to="/cadastro" className="btn-primary">Comecar Agora <ArrowRight className="w-4 h-4 ml-2" /></Link>
                <a href="#cursos" className="btn-ghost">Ver Cursos</a>
              </div>
              <p className="text-xs text-[var(--text-dark)] animate-fade-in" style={{ animationDelay: '0.5s' }}>
                Pagamento via Asaas &bull; Cancelamento a qualquer momento
              </p>
            </div>

            <div className="hidden lg:flex justify-center items-center gap-6">
              {[
                { icon: 'Jump', duration: '45 min', gradient: 'from-orange-500 to-red-500' },
                { icon: 'Danca', duration: '30 min', gradient: 'from-purple-500 to-pink-500' },
                { icon: 'Gluteos', duration: '25 min', gradient: 'from-emerald-500 to-teal-500' },
              ].map((card, i) => (
                <div key={card.icon} className={`card-base p-6 text-center w-[160px] ${floatClass[i]}`}>
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${card.gradient}`}>
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-white">{card.icon}</div>
                  <div className="text-xs text-[var(--text-muted)]">{card.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cursos */}
      <section id="cursos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--bg-elevated)', color: 'var(--primary)' }}>
              <FileText className="w-3.5 h-3.5" /> Cursos Disponiveis
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Escolha seu <span className="gradient-text">Ritmo</span></h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">Cursos completos com aulas gravadas em video. Acesso ilimitado apos a compra.</p>
          </AnimatedSection>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cursos.map(curso => (
                <div key={curso.id} className="card-base overflow-hidden cursor-pointer group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={curso.thumbnail || `https://placehold.co/600x400/1A1A2E/FF6B35?text=${encodeURIComponent(curso.titulo)}`} alt={curso.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}>
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    {curso.gratuito && <div className="absolute top-3 right-3 badge-free">GRATUITO</div>}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>{curso.total_aulas} aulas</div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-white mb-2">{curso.titulo}</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2">{curso.descricao}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {curso.duracao_total || '0h'}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {curso.total_alunos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {curso.gratuito ? <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Gratuito</span> : <span className="text-sm font-semibold text-white">R$ {curso.preco.toFixed(2).replace('.', ',')}</span>}
                      <Link to={`/cadastro?plano=individual&curso=${curso.id}`} className="btn-curso text-xs py-2 px-4">{curso.gratuito ? 'Assistir Agora' : 'Ver Curso'}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--bg-elevated)', color: 'var(--primary)' }}>
              <CreditCard className="w-3.5 h-3.5" /> Simples e Rapido
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Como <span className="gradient-text">Funciona</span></h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', icon: FileText, title: 'Crie sua Conta', desc: 'Cadastre-se em menos de 2 minutos com seu e-mail e dados basicos.' },
              { num: '2', icon: CreditCard, title: 'Escolha e Pague', desc: 'Selecione o curso desejado e pague via PIX ou Cartao pelo Asaas.' },
              { num: '3', icon: Play, title: 'Acesse as Aulas', desc: 'Liberacao automatica! Assista aos videos exclusivos na plataforma.' },
            ].map((step, i) => (
              <AnimatedSection key={step.num} delay={`${i * 150}ms`}>
                <div className="card-base p-8 text-center h-full">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}>{step.num}</div>
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                    <step.icon className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Precos */}
      <section id="precos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--bg-elevated)', color: 'var(--primary)' }}>
              <CreditCard className="w-3.5 h-3.5" /> Investimento
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos e <span className="gradient-text">Precos</span></h2>
            <p className="text-[var(--text-muted)]">Escolha o plano ideal para voce</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <AnimatedSection>
              <div className="card-base p-8 h-full flex flex-col relative">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Plano Free</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-sm text-[var(--text-muted)]">R$</span><span className="text-4xl font-extrabold text-white">0</span><span className="text-sm text-[var(--text-muted)]">,00</span></div>
                  <p className="text-sm text-[var(--text-muted)]">Acesso a cursos gratuitos</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Acesso a cursos gratuitos', 'Aulas gratuitas ilimitadas', 'Sem necessidade de cartao', 'Progresso salvo', 'Suporte por email'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}</li>
                  ))}
                </ul>
                <Link to="/cadastro?plano=free" className="btn-ghost w-full text-center border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10">
                  <span className="text-emerald-400">Comecar Gratis</span>
                </Link>
              </div>
            </AnimatedSection>

            {/* Individual */}
            <AnimatedSection delay="150ms">
              <div className="card-base p-8 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Curso Individual</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-sm text-[var(--text-muted)]">R$</span><span className="text-4xl font-extrabold text-white">49</span><span className="text-sm text-[var(--text-muted)]">,90</span></div>
                  <p className="text-sm text-[var(--text-muted)]">Acesso vitalicio a 1 curso</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Acesso vitalicio', 'Todas as aulas do curso', 'Suporte por email', 'Certificado de conclusao'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}</li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-[var(--text-dark)]"><Lock className="w-4 h-4 shrink-0 mt-0.5" /> Acesso a outros cursos</li>
                </ul>
                <Link to="/cadastro?plano=individual" className="btn-ghost w-full text-center">Escolher Curso</Link>
              </div>
            </AnimatedSection>

            {/* Mensal - Featured */}
            <AnimatedSection delay="300ms">
              <div className="card-base p-8 h-full flex flex-col relative" style={{ borderColor: 'rgba(255, 107, 53, 0.5)', boxShadow: '0 0 30px rgba(255, 107, 53, 0.1)' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}>Mais Popular</div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Plano Mensal</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-sm text-[var(--text-muted)]">R$</span><span className="text-4xl font-extrabold text-white">79</span><span className="text-sm text-[var(--text-muted)]">,90</span></div>
                  <p className="text-sm text-[var(--text-muted)]">Acesso a todos os cursos</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Acesso a TODOS os cursos', 'Aulas novas toda semana', 'Suporte prioritario', 'Certificado de conclusao', 'Comunidade exclusiva'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}</li>
                  ))}
                </ul>
                <Link to="/cadastro?plano=mensal" className="btn-primary w-full text-center">Assinar Agora</Link>
              </div>
            </AnimatedSection>

            {/* Anual */}
            <AnimatedSection delay="450ms">
              <div className="card-base p-8 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Plano Anual</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-sm text-[var(--text-muted)]">R$</span><span className="text-4xl font-extrabold text-white">599</span><span className="text-sm text-[var(--text-muted)]">,90</span></div>
                  <p className="text-sm text-[var(--text-muted)]">Economize 37% no ano</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Tudo do plano mensal', '2 meses gratis', 'Materiais extras', 'Planilha de treino', 'Suporte VIP'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}</li>
                  ))}
                </ul>
                <Link to="/cadastro?plano=anual" className="btn-ghost w-full text-center">Assinar Anual</Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  )
}
