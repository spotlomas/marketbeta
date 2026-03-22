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
    <div className="min-h-screen bg-[#050505] text-white pb-24 font-inter transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#CCFF00]/10 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10 block">
        <TopNav />
      </div>

      <div className="bg-[#050505]/90 backdrop-blur-xl px-4 py-4 sticky top-14 z-30 border-b border-white/10 transition-colors">
        <div className="flex items-center gap-3 bg-[#121212] rounded-full py-4 px-6 transition-all focus-within:border-[#CCFF00]/50 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <span className="text-gray-500 text-lg opacity-50">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="SEARCH_QUERY..."
            className="flex-1 bg-transparent text-xs font-mono tracking-widest uppercase text-white placeholder-gray-600 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setProducts([]); setStores([]); setSearched(false) }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-[#CCFF00]/20 font-bold transition-colors text-xs border border-transparent hover:border-[#CCFF00]/50">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10 relative z-10">
        {!searched && (
          <div className="text-center py-24 text-gray-500">
            <div className="text-4xl mb-4 w-24 h-24 mx-auto flex items-center justify-center bg-[#0A0A0A] rounded-3xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">📡</div>
            <p className="text-[10px] font-mono tracking-widest uppercase mt-6 opacity-50">AWAITING_INPUT_SIGNAL...</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="bg-[#0A0A0A] text-[#CCFF00] font-mono text-[10px] uppercase tracking-widest px-6 py-3 rounded-full inline-block animate-pulse border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
              SCANNING_DATABASE...
            </div>
          </div>
        )}

        {searched && !loading && products.length === 0 && stores.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-[#0A0A0A] border border-white/5 rounded-3xl mx-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <p className="font-mono text-sm tracking-widest text-[#CCFF00] uppercase mb-3">ZERO_MATCHES</p>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">NOTHING FOUND FOR "{query}"</p>
          </div>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="font-mono text-sm tracking-widest uppercase text-white border-b border-white/10 pb-3 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"></span>
              SELLERS 
              <span className="text-[9px] bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] px-2 py-0.5 rounded font-bold">{stores.length}</span>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide">
              {stores.map(store => <div className="snap-center" key={store.id}><StoreCard store={store} /></div>)}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="font-mono text-sm tracking-widest uppercase text-white border-b border-white/10 pb-3 mb-6 mt-10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"></span>
              ITEMS 
              <span className="text-[9px] bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] px-2 py-0.5 rounded font-bold">{products.length}</span>
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
