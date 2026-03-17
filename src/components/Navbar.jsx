import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { usuario, cartCount } = useApp()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="text-xl font-bold text-brand-600 tracking-tight">
            Market<span className="text-gray-800">Beta</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">
              Inicio
            </Link>

            {usuario?.tipo_usuario === 'vendedor' && (
              <Link to="/seller" className="text-sm text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">
                Mi Tienda
              </Link>
            )}

            <Link to="/mis-compras" className="text-sm text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">
              Mis Compras
            </Link>

            <Link to="/cart" className="relative text-sm text-gray-600 hover:text-brand-600 transition-colors">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-3">
              {usuario && (
                <span className="text-sm text-gray-500 hidden sm:block">
                  Hola, {usuario.nombre?.split(' ')[0]}
                </span>
              )}
              <button onClick={handleLogout}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
