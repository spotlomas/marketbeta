import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function BottomNav() {
  const { cartCount, usuario } = useApp()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/',            icon: '🏠', label: 'INICIO'    },
    { to: '/buscar',      icon: '🔍', label: 'BUSCAR'    },
    { to: '/cart',        icon: '🛒', label: 'CARRITO', badge: cartCount },
    { to: '/mis-compras', icon: '📦', label: 'COMPRAS'   },
    { to: '/perfil',      icon: '👤', label: 'PERFIL'    },
  ]

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-50 safe-bottom">
      <nav className="bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between h-16 px-4">
          {tabs.map(tab => {
            const active = pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors
                  ${active ? 'text-brand-500' : 'text-gray-500 hover:text-white'}`}
              >
                <span className="text-lg leading-none relative">
                  {tab.icon}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-black font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="text-[9px] font-mono tracking-wider leading-none">
                    {tab.label}
                  </span>
                )}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
