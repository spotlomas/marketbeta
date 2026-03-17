import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'
import StoreCard from '../components/StoreCard'
import ProductList from '../components/ProductList'

export default function Home() {
  const { usuario } = useApp()
  const [categories, setCategories]         = useState([])
  const [featured, setFeatured]             = useState([])
  const [stores, setStores]                 = useState([])
  const [products, setProducts]             = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading]               = useState(true)
  const [showAllFeatured, setShowAllFeatured] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchFeatured(), fetchStores(), fetchProducts(null)])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').eq('active', true).order('position')
    if (data) setCategories(data)
  }

  async function fetchFeatured() {
    const { data } = await supabase
      .from('products').select('*')
      .eq('featured', true)
      .or('stock_ilimitado.eq.true,stock.gt.0')
      .order('featured_position', { ascending: true, nullsFirst: false })
      .order('score', { ascending: false })
    if (data) setFeatured(data)
  }

  async function fetchStores() {
    const { data } = await supabase
      .from('usuarios').select('id, nombre, nombre_tienda, descripcion_tienda, imagen_tienda')
      .eq('tipo_usuario', 'vendedor')
    if (data) setStores(data)
  }

  async function fetchProducts(categoryId) {
    let query = supabase.from('products').select('*')
      .or('stock_ilimitado.eq.true,stock.gt.0')
      .order('score', { ascending: false })
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data } = await query
    if (data) setProducts(data)
  }

  async function selectCategory(catId) {
    const next = activeCategory === catId ? null : catId
    setActiveCategory(next)
    fetchProducts(next)
  }

  const activeCat = categories.find(c => c.id === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      {/* Max width container - centered on desktop, full on mobile */}
      <div className="max-w-2xl mx-auto">

        {/* Greeting + search */}
        <div className="bg-white px-4 pt-4 pb-3">
          <p className="text-xs text-gray-400">Bienvenido 👋</p>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">
            {usuario?.nombre?.split(' ')[0] || 'Hola'}
          </h1>
          <Link
            to="/buscar"
            className="mt-3 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <span>🔍</span>
            <span>Buscar productos o tiendas...</span>
          </Link>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="bg-white mt-2 py-3 border-b border-gray-100">
            <div
              className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
            >
              <button
                onClick={() => { setActiveCategory(null); fetchProducts(null) }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium transition-colors min-w-[56px]
                  ${!activeCategory ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <span className="text-xl">🍽️</span>
                <span>Todo</span>
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium transition-colors min-w-[64px]
                    ${activeCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 space-y-6 mt-4">

          {/* Featured */}
          {featured.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-base">⭐ Destacados</h2>
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)} className="text-xs text-brand-600 font-medium">
                    Ver más →
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {featured.slice(0, 8).map(product => (
                  <ProductCard key={product.id} product={product} horizontal />
                ))}
                {featured.length > 3 && (
                  <button
                    onClick={() => setShowAllFeatured(true)}
                    className="flex-shrink-0 w-32 min-h-[160px] bg-brand-50 border-2 border-dashed border-brand-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-brand-600 hover:bg-brand-100 transition-colors"
                  >
                    <span className="text-2xl">→</span>
                    <span className="text-xs font-medium text-center">Ver todos</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Stores */}
          {stores.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-base">🏪 Tiendas</h2>
                <Link to="/tiendas" className="text-xs text-brand-600 font-medium">Ver todas →</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {stores.map(store => <StoreCard key={store.id} store={store} />)}
              </div>
            </section>
          )}

          {/* All products */}
          <section>
            <h2 className="font-bold text-gray-900 text-base mb-3">
              {activeCat ? `${activeCat.emoji} ${activeCat.name}` : '🔥 Todos los productos'}
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">({products.length})</span>
              )}
            </h2>
            <ProductList products={products} loading={loading} />
          </section>

        </div>
      </div>

      <BottomNav />

      {/* All Featured Modal */}
      {showAllFeatured && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-900">⭐ Todos los destacados</h2>
              <button onClick={() => setShowAllFeatured(false)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 items-stretch">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
