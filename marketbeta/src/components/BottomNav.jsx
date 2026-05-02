import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Home, Search, ShoppingCart, Receipt, User } from 'lucide-react'

export default function BottomNav() {
  const { cartCount, usuario } = useApp()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/',            icon: <Home className="w-5 h-5" />, label: 'Inicio'    },
    { to: '/buscar',      icon: <Search className="w-5 h-5" />, label: 'Buscar'    },
    { to: '/cart',        icon: <ShoppingCart className="w-5 h-5" />, label: 'Carrito', badge: cartCount },
    { to: '/mis-compras', icon: <Receipt className="w-5 h-5" />, label: 'Órdenes'   },
    { to: '/perfil',      icon: <User className="w-5 h-5" />, label: 'Perfil'    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 h-16 transition-colors">
      <nav className="max-w-3xl mx-auto h-full px-2 sm:px-6">
        <div className="flex items-center justify-between h-full">
          {tabs.map(tab => {
            const active = pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors
                  ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <span className="text-xl relative mb-0.5">
                  <span className={`block transition-transform ${active ? 'scale-110 drop-shadow-md' : 'opacity-60'}`}>
                    {tab.icon}
                  </span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black font-bold text-[9px] rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none border border-white dark:border-black">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-inter tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute bottom-1 w-1 h-1 bg-green-600 dark:bg-[#CCFF00] rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
