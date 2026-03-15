import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * Protege rutas que requieren sesión activa.
 * Muestra spinner mientras Supabase verifica la sesión (loading = true).
 * Si no hay sesión, redirige a /login.
 */
export default function ProtectedRoute() {
  const { session, loading } = useApp()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
