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
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      <div className="bg-white px-4 py-3 sticky top-14 z-30 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2.5">
          <span className="text-gray-400">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar productos o tiendas..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setProducts([]); setStores([]); setSearched(false) }}
              className="text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {!searched && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">Escribe para buscar productos o tiendas</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {searched && !loading && products.length === 0 && stores.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-sm">No encontramos resultados para "{query}"</p>
          </div>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3">🏪 Tiendas ({stores.length})</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {stores.map(store => <StoreCard key={store.id} store={store} />)}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3">📦 Productos ({products.length})</h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
