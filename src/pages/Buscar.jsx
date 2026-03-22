import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'
import StoreCard from '../components/StoreCard'

export default function Buscar() {
  const [query, setQuery]       = useState('')
  const [products, setProducts] = useState([])
  const [stores, setStores]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(q) {
    setQuery(q)
    if (q.trim().length < 2) { setProducts([]); setStores([]); setSearched(false); return }

    setLoading(true)
    setSearched(true)

    const [{ data: prods }, { data: strs }] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .ilike('name', `%${q}%`)
        .or('stock_ilimitado.eq.true,stock.gt.0')
        .limit(20),
      supabase
        .from('usuarios')
        .select('id, nombre, nombre_tienda, descripcion_tienda, imagen_tienda')
        .eq('tipo_usuario', 'vendedor')
        .ilike('nombre_tienda', `%${q}%`)
        .limit(5),
    ])

    setProducts(prods || [])
    setStores(strs || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white pb-24 font-inter transition-colors relative">
      <div className="relative z-10 block">
        <TopNav />
      </div>

      <div className="bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl px-4 py-4 sticky top-14 z-30 border-b border-gray-200 dark:border-white/10 transition-colors">
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#121212] rounded-full py-4 px-6 transition-all focus-within:border-green-500/50 dark:focus-within:border-[#CCFF00]/50 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <span className="text-gray-400 text-lg opacity-50">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setProducts([]); setStores([]); setSearched(false) }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10 relative z-10">
        {!searched && (
          <div className="text-center py-24 text-gray-400">
            <div className="text-4xl mb-4 w-24 h-24 mx-auto flex items-center justify-center bg-gray-100 dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5">📡</div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">Busca productos o tiendas</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-[#0A0A0A] text-green-600 dark:text-[#CCFF00] text-sm px-6 py-3 rounded-full inline-block animate-pulse border border-gray-200 dark:border-[#CCFF00]/20">
              Buscando...
            </div>
          </div>
        )}

        {searched && !loading && products.length === 0 && stores.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-3xl mx-2">
            <p className="text-base font-bold text-gray-700 dark:text-white mb-2">Sin resultados</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">No encontramos nada para "{query}"</p>
          </div>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-6 flex items-center gap-2">
              Tiendas 
              <span className="text-xs bg-green-50 dark:bg-[#CCFF00]/10 border border-green-200 dark:border-[#CCFF00]/30 text-green-600 dark:text-[#CCFF00] px-2 py-0.5 rounded-full font-medium">{stores.length}</span>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide">
              {stores.map(store => <div className="snap-center" key={store.id}><StoreCard store={store} /></div>)}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-6 mt-10 flex items-center gap-2">
              Productos 
              <span className="text-xs bg-green-50 dark:bg-[#CCFF00]/10 border border-green-200 dark:border-[#CCFF00]/30 text-green-600 dark:text-[#CCFF00] px-2 py-0.5 rounded-full font-medium">{products.length}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  )
}
