import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import NotificationBell from './NotificationBell'

export default function TopNav() {
  const { usuario, cartCount, theme, toggleTheme } = useApp()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 sticky top-0 z-40 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo / Location */}
        <Link to="/" className="flex flex-col flex-shrink-0 group">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-inter font-medium uppercase tracking-wide group-hover:text-food-500 transition-colors">Entregar ahora</span>
          <span className="text-sm font-inter font-bold text-gray-900 dark:text-white flex items-center gap-1">
            Ubicación actual <span className="text-food-500 text-xs mt-0.5">▼</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {usuario?.es_admin && (
            <Link to="/admin" className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full font-inter font-bold uppercase tracking-wide transition-colors">
              Admin
            </Link>
          )}

          {usuario?.tipo_usuario === 'vendedor' && (
            <Link to="/seller" className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full font-inter font-medium hidden sm:block hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Mi Tienda
            </Link>
          )}

          <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <NotificationBell />

          <button onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            <span className="text-sm leading-none">👤</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
