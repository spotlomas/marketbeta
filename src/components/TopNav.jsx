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
    <nav className="bg-[#050505]/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-xl font-dot text-brand-500 tracking-wider flex-shrink-0 flex items-center gap-2">
          <span className="text-white">MARKET</span>BETA
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {usuario?.es_admin && (
            <Link to="/admin" className="text-xs bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1 rounded-full font-mono uppercase tracking-widest">
              Admin
            </Link>
          )}

          {usuario?.tipo_usuario === 'vendedor' && (
            <Link to="/seller" className="text-xs bg-brand-500/10 border border-brand-500/30 text-brand-500 px-3 py-1 rounded-full font-mono uppercase tracking-widest hidden sm:block">
              Mi Tienda
            </Link>
          )}

          <NotificationBell />

          <button onClick={handleLogout}
            className="text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
