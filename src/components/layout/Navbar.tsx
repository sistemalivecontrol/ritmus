import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, Dumbbell } from 'lucide-react'

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => location.pathname === path

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b"
      style={{
        background: scrolled ? 'rgba(10, 10, 15, 0.95)' : 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="w-7 h-7 text-[var(--primary)]" />
          <span className="text-xl font-bold gradient-text">Ritmus</span>
        </Link>

        {!minimal && (
          <>
            <div className="hidden md:flex items-center gap-8">
              <a href="/#cursos" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">Cursos</a>
              <a href="/#como-funciona" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">Como Funciona</a>
              <a href="/#precos" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">Precos</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <>
                  <Link to="/dashboard" className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
                    Meu Painel
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">
                    Entrar
                  </Link>
                  <Link to="/cadastro" className="btn-primary text-sm py-2.5 px-6">
                    Comecar Agora
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        )}

        {minimal && (
          <Link to="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">
            Voltar ao inicio
          </Link>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && !minimal && (
        <div className="md:hidden border-t px-4 py-4 space-y-3" style={{ background: 'rgba(10, 10, 15, 0.98)', borderColor: 'var(--border)' }}>
          <a href="/#cursos" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--text-muted)] hover:text-white">Cursos</a>
          <a href="/#como-funciona" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--text-muted)] hover:text-white">Como Funciona</a>
          <a href="/#precos" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--text-muted)] hover:text-white">Precos</a>
          {session ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--primary)]">Meu Painel</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-sm font-medium text-[var(--text-muted)]">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--text-muted)]">Entrar</Link>
              <Link to="/cadastro" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--primary)]">Comecar Agora</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
