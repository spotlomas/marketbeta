import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import NotificationBell from './NotificationBell'

export default function TopNav() {
  const { usuario, cartCount } = useApp()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-lg font-bold text-brand-600 tracking-tight flex-shrink-0">
          Market<span className="text-gray-800">Beta</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {usuario?.es_admin && (
            <Link to="/admin" className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-medium">
              Admin
            </Link>
          )}

          {usuario?.tipo_usuario === 'vendedor' && (
            <Link to="/seller" className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-lg font-medium hidden sm:block">
              Mi Tienda
            </Link>
          )}

          <NotificationBell />

          <button onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
