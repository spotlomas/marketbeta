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
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />
      <div className="px-4 py-4">
        <h1 className="font-bold text-xl text-gray-900 mb-4">🏪 Todas las tiendas</h1>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl animate-pulse h-44" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-sm">No hay tiendas disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stores.map(store => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
