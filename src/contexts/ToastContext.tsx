import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

interface Toast {
  id: number
  title: string
  message: string
  type: 'success' | 'error' | 'warning'
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning') => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 rounded-xl min-w-[320px] max-w-[400px] animate-fade-in"
            style={{
              background: 'var(--bg-elevated)',
              borderLeft: `4px solid ${toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--warning)'}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderLeftWidth: 4,
            }}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white">{toast.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
