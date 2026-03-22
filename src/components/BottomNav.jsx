import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function BottomNav() {
  const { cartCount, usuario } = useApp()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/',            icon: '🏠', label: 'Inicio'    },
    { to: '/buscar',      icon: '🔍', label: 'Buscar'    },
    { to: '/cart',        icon: '🛒', label: 'Carrito', badge: cartCount },
    { to: '/mis-compras', icon: '🧾', label: 'Órdenes'   },
    { to: '/perfil',      icon: '👤', label: 'Perfil'    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-white border-t border-gray-100 h-16">
      <nav className="max-w-3xl mx-auto h-full px-2 sm:px-6">
        <div className="flex items-center justify-between h-full">
          {tabs.map(tab => {
            const active = pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors
                  ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="text-xl relative mb-0.5">
                  <span className={`block transition-transform ${active ? 'scale-110 drop-shadow-md' : 'grayscale opacity-60'}`}>
                    {tab.icon}
                  </span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-food-500 text-white font-bold text-[9px] rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none border border-white">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-inter tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute bottom-1 w-1 h-1 bg-food-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
