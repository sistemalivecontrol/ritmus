import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SidebarLayout from '@/components/layout/SidebarLayout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import Dashboard from '@/pages/Dashboard'
import Cursos from '@/pages/Cursos'
import Aula from '@/pages/Aula'
import Assinatura from '@/pages/Assinatura'
import Admin from '@/pages/Admin'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/login" element={<><Navbar minimal /><Login /></>} />
          <Route path="/cadastro" element={<><Navbar minimal /><Cadastro /></>} />

          {/* Protected routes with sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<SidebarLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/aula/:cursoId" element={<Aula />} />
              <Route path="/assinatura" element={<Assinatura />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route element={<SidebarLayout />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
