import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function BottomNav() {
  const { cartCount, usuario } = useApp()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/',            icon: '🏠', label: 'Inicio'    },
    { to: '/buscar',      icon: '🔍', label: 'Buscar'    },
    { to: '/cart',        icon: '🛒', label: 'Carrito', badge: cartCount },
    { to: '/mis-compras', icon: '📦', label: 'Compras'   },
    { to: '/perfil',      icon: '👤', label: 'Perfil'    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(tab => {
          const active = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors
                ${active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="text-xl leading-none relative">
                {tab.icon}
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>
              <span className={`text-xs leading-none ${active ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
