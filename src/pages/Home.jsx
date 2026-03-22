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
    <div className="min-h-screen bg-white pb-24 text-gray-900 font-inter">
      <TopNav />

      <div className="max-w-2xl mx-auto">
        {/* Greeting + search */}
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {usuario?.nombre ? `¡Hola, ${usuario.nombre.split(' ')[0]}!` : '¡Hola, invitado!'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">¿Qué se te antoja hoy?</p>
          <Link to="/buscar"
            className="mt-5 flex items-center gap-3 bg-gray-100 rounded-full px-5 py-3.5 text-sm text-gray-500 hover:bg-gray-200 transition-colors group">
            <span className="text-gray-400 group-hover:text-gray-600 transition-colors text-lg">🔍</span>
            <span className="font-medium">Busca comida, tiendas o productos...</span>
          </Link>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-2 py-4">
            <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide snap-x pb-2">
              <button onClick={() => { setActiveCategory(null); fetchProducts(null) }}
                className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-w-fit shadow-sm
                  ${!activeCategory ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                <span className="text-base">🍔</span>
                <span>Todo</span>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat.id)}
                  className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-w-fit shadow-sm
                    ${activeCategory === cat.id ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                  <span className="text-base">{cat.emoji}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 space-y-10 mt-2 relative z-10">

          {/* Featured */}
          {featured.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-bold text-xl tracking-tight text-gray-900">Destacados</h2>
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)} className="text-sm font-medium text-food-500 hover:text-food-600 transition-colors">Ver todos</button>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x -mx-4 px-4">
                {featured.slice(0, 8).map(product => (
                  <div key={product.id} className="snap-center">
                    <ProductCard product={product} horizontal />
                  </div>
                ))}
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)}
                    className="flex-shrink-0 snap-center w-36 min-h-[160px] bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors group">
                    <span className="text-2xl text-gray-400 group-hover:text-food-500 group-hover:translate-x-1 transition-all">→</span>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-food-600 text-center">Ver más<br/>productos</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Stores */}
          {stores.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-bold text-xl tracking-tight text-gray-900">Tiendas Locales</h2>
                <Link to="/tiendas" className="text-sm font-medium text-food-500 hover:text-food-600 transition-colors">Ver todas</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x -mx-4 px-4">
                {stores.map(store => (
                  <div key={store.id} className="snap-center">
                    <StoreCard store={store} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All products */}
          <section className="pb-8">
            <h2 className="font-bold text-xl tracking-tight text-gray-900 mb-6 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>{activeCat ? `${activeCat.emoji} ${activeCat.name}` : 'Para Ti'}</span>
              {!loading && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{products.length} desc.</span>}
            </h2>
            <ProductList products={products} loading={loading} />
          </section>

        </div>
      </div>

      <BottomNav />

      {/* All Featured Modal */}
      {showAllFeatured && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
              <h2 className="font-bold text-xl tracking-tight text-gray-900">Todos los Destacados</h2>
              <button onClick={() => setShowAllFeatured(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto p-5 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 items-stretch">
                {featured.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
