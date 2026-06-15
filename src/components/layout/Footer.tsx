import { Link } from 'react-router-dom'
import { Dumbbell, Mail, MessageCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-6 h-6 text-[var(--primary)]" />
              <span className="text-lg font-bold gradient-text">Ritmus</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Plataforma de aulas fitness online. Treine quando quiser, onde quiser.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Links</h4>
            <div className="space-y-2">
              <Link to="/login" className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors">Login</Link>
              <Link to="/cadastro" className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors">Cadastro</Link>
              <a href="/#cursos" className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors">Cursos</a>
              <a href="/#precos" className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors">Precos</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Mail className="w-4 h-4" /> suporte@ritmus.fit
              </p>
              <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm text-[var(--text-dark)]">&copy; 2026 Ritmus. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
