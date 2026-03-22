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
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <TopNav />
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="font-dot text-xl tracking-widest text-brand-500 mb-6 uppercase border-b border-white/10 pb-4">
          VENDOR_DIRECTORY
        </h1>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-[#121212] border border-white/5 rounded-3xl animate-pulse h-48" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-24 text-gray-500 border border-white/5 bg-[#0a0a0a] rounded-3xl">
            <p className="text-4xl mb-4 font-mono font-light text-brand-500 opacity-30">NULL</p>
            <p className="text-[10px] font-mono uppercase tracking-widest">No vendors actively broadcasting</p>
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
