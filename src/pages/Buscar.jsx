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
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <TopNav />

      <div className="bg-[#050505]/80 backdrop-blur-xl px-4 py-4 sticky top-14 z-30 border-b border-white/10">
        <div className="flex items-center gap-3 bg-[#121212] border border-white/10 rounded-full py-3 px-5 transition-all focus-within:border-brand-500 shadow-[0_0_20px_transparent] focus-within:shadow-[0_0_15px_rgba(204,255,0,0.1)]">
          <span className="text-brand-500 animate-pulse">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="ENTER SEARCH PARAMS..."
            className="flex-1 bg-transparent text-sm font-mono tracking-widest uppercase text-white placeholder-gray-600 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setProducts([]); setStores([]); setSearched(false) }}
              className="text-gray-500 hover:text-brand-500 font-mono transition-colors">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {!searched && (
          <div className="text-center py-24 text-gray-600">
            <div className="text-4xl mb-4 font-mono font-light border border-white/10 rounded-full w-24 h-24 mx-auto flex items-center justify-center bg-[#0a0a0a]">SYS</div>
            <p className="text-[10px] font-mono tracking-widest uppercase">INPUT REQUIRES AT LEAST 2 CHARACTERS</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="border border-brand-500/20 bg-brand-500/5 text-brand-500 font-mono text-[10px] uppercase tracking-widest px-6 py-2 rounded-full inline-block animate-pulse">SEARCHING_DATABASE_INDEX...</div>
          </div>
        )}

        {searched && !loading && products.length === 0 && stores.length === 0 && (
          <div className="text-center py-20 text-gray-500 border border-white/5 bg-[#0a0a0a] rounded-3xl mx-2">
            <p className="font-dot text-2xl text-red-500 mb-2">404_NOT_FOUND</p>
            <p className="text-[10px] font-mono uppercase tracking-widest">NO ENTRIES MATCHING [{query}]</p>
          </div>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="font-dot text-lg border-b border-white/10 pb-2 mb-4 tracking-widest">STORES.LISTING <span className="text-[10px] text-brand-500 font-mono">({stores.length})</span></h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
              {stores.map(store => <div className="snap-center" key={store.id}><StoreCard store={store} /></div>)}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="font-dot text-lg border-b border-white/10 pb-2 mb-4 tracking-widest mt-8">PRODUCTS.DATA <span className="text-[10px] text-brand-500 font-mono">({products.length})</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
