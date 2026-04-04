import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import NotificationBell from './NotificationBell'
import { Store, Camera, Sun, Moon, User, ChevronDown } from 'lucide-react'

export default function TopNav() {
  const { usuario, cartCount, theme, toggleTheme } = useApp()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-black sticky top-0 z-40 shadow-sm border-b border-gray-100 dark:border-white/10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex flex-col flex-shrink-0 group">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-inter font-medium uppercase tracking-wide">MarketBeta</span>
          <span className="text-sm font-inter font-bold text-gray-900 dark:text-white flex items-center gap-1">
            Ubicación actual <ChevronDown className="w-3 h-3 text-green-500 dark:text-[#CCFF00] mt-0.5" />
          </span>
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {usuario?.es_admin && (
            <Link to="/admin" className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full font-inter font-bold uppercase tracking-wide transition-colors">
              Admin
            </Link>
          )}

          {usuario?.tipo_usuario === 'vendedor' && (
            <>
              <Link to="/punto-de-venta" className="text-xs bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black px-3 py-1.5 rounded-full font-inter font-bold hover:bg-green-700 dark:hover:bg-white transition-colors shadow-md flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Punto de Venta
              </Link>
              <Link to="/seller" className="text-xs flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full font-inter font-medium hidden sm:flex hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <Store className="w-3.5 h-3.5" /> Mi Tienda
              </Link>
            </>
          )}

          <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <NotificationBell />

          <button onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
