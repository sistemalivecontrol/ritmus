import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, PlayCircle, CreditCard, Settings, LogOut, Dumbbell, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function SidebarLayout() {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    { path: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
    { path: '/cursos', label: 'Meus Cursos', icon: PlayCircle },
    { path: '/assinatura', label: 'Assinatura', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Dumbbell className="w-6 h-6 text-[var(--primary)]" />
            <span className="text-lg font-bold gradient-text">Ritmus</span>
          </Link>

          <div className="flex items-center gap-3 mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #E55A28)' }}
            >
              {(user?.nome || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nome || 'Aluno'}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                }`}
                style={isActive(item.path) ? { background: 'rgba(255, 107, 53, 0.1)' } : {}}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin')
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                }`}
                style={isActive('/admin') ? { background: 'rgba(255, 107, 53, 0.1)' } : {}}
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}

            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
