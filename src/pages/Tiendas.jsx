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
    <div className="min-h-screen bg-[#050505] text-white font-inter pb-24 transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#CCFF00]/10 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10 block">
        <TopNav />
      </div>

      <div className="px-4 py-8 max-w-2xl mx-auto relative z-10">
        <h1 className="font-mono text-sm tracking-widest uppercase text-white mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
          LOCAL_SELLERS_DIRECTORY
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-[#121212] border border-white/5 rounded-3xl animate-pulse h-48 shadow-[0_0_15px_rgba(0,0,0,0.5)]" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-24 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <p className="text-4xl mb-4 opacity-50">🏪</p>
            <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500">NO_SELLERS_FOUND.</p>
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
