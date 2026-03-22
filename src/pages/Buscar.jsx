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
    <div className="min-h-screen bg-white text-gray-900 pb-24 font-inter">
      <TopNav />

      <div className="bg-white/90 backdrop-blur-xl px-4 py-4 sticky top-14 z-30 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full py-3.5 px-5 transition-all focus-within:bg-gray-200 focus-within:shadow-sm">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Busca comida, tiendas, productos..."
            className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setProducts([]); setStores([]); setSearched(false) }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 font-bold transition-colors text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {!searched && (
          <div className="text-center py-24 text-gray-500">
            <div className="text-4xl mb-4 w-24 h-24 mx-auto flex items-center justify-center bg-gray-50 rounded-full border border-gray-100">🍽️</div>
            <p className="text-sm font-medium">Ingresa al menos 2 caracteres para buscar</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="bg-gray-50 text-gray-500 font-medium text-sm px-6 py-2 rounded-full inline-block animate-pulse border border-gray-100">Buscando...</div>
          </div>
        )}

        {searched && !loading && products.length === 0 && stores.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-gray-50 border border-gray-100 rounded-3xl mx-2">
            <p className="font-bold text-2xl text-gray-900 mb-2">No hay resultados</p>
            <p className="text-sm">No encontramos nada para "{query}"</p>
          </div>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="font-bold text-xl tracking-tight text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              Tiendas <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{stores.length}</span>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide">
              {stores.map(store => <div className="snap-center" key={store.id}><StoreCard store={store} /></div>)}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="font-bold text-xl tracking-tight text-gray-900 border-b border-gray-100 pb-3 mb-4 mt-8 flex items-center gap-2">
              Productos <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{products.length}</span>
            </h2>
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
