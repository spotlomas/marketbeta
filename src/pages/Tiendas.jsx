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
    <div className="min-h-screen bg-white text-gray-900 font-inter pb-24">
      <TopNav />
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="font-bold text-2xl tracking-tight text-gray-900 mb-6">
          Directorio de Tiendas
        </h1>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 border border-gray-200 rounded-3xl animate-pulse h-48" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-24 text-gray-500 bg-gray-50 border border-gray-100 rounded-3xl">
            <p className="text-4xl mb-4 opacity-50">🏪</p>
            <p className="text-sm font-medium">Aún no hay tiendas locales disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
