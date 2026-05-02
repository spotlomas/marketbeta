import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import StoreCard from '../components/StoreCard'

export default function Tiendas() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('id, nombre, nombre_tienda, descripcion_tienda, imagen_tienda')
      .eq('tipo_usuario', 'vendedor')
      .then(({ data }) => {
        if (data) setStores(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-inter pb-24 transition-colors relative">
      <div className="relative z-10 block">
        <TopNav />
      </div>

      <div className="px-4 py-8 max-w-2xl mx-auto relative z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
          Tiendas Locales
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-3xl animate-pulse h-48" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl">
            <p className="text-4xl mb-4 opacity-50">🏪</p>
            <p className="text-sm text-gray-500">No hay tiendas disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  )
}
