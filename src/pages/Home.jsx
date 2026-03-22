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
    <div className="min-h-screen bg-white dark:bg-[#050505] pb-24 text-gray-900 dark:text-white font-inter transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-500/10 dark:from-[#CCFF00]/10 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10 block">
        <TopNav />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-4">
        {/* Saludo + búsqueda */}
        <div className="px-4 pt-2 pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {usuario?.nombre ? `Hola, ${usuario.nombre.split(' ')[0]}` : '¡Hola!'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">¿Qué se te antoja hoy?</p>
          <Link to="/buscar"
            className="mt-4 flex items-center gap-3 bg-gray-100 dark:bg-[#121212]/80 backdrop-blur-md rounded-2xl px-5 py-4 text-sm text-gray-400 dark:text-gray-500 hover:border-green-500/50 dark:hover:border-[#CCFF00]/50 transition-colors group border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <span className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-[#CCFF00] transition-colors text-lg">🔍</span>
            <span className="font-medium group-hover:text-gray-700 dark:group-hover:text-white transition-colors">Buscar productos o tiendas...</span>
          </Link>
        </div>

        {/* Categorías circulares */}
        {categories.length > 0 && (
          <div className="mt-4 py-4">
            <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide snap-x pb-2">
              <button onClick={() => { setActiveCategory(null); fetchProducts(null) }}
                className={`snap-start flex-shrink-0 flex flex-col items-center gap-2 min-w-[4.5rem] group`}>
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center border justify-center text-2xl transition-all
                  ${!activeCategory ? 'bg-green-600 dark:bg-[#CCFF00] border-green-600 dark:border-[#CCFF00] shadow-lg text-white dark:text-black' : 'bg-gray-100 dark:bg-[#121212] border-gray-200 dark:border-white/5 group-hover:border-green-400 dark:group-hover:border-[#CCFF00]/50 text-gray-700 dark:text-white'}`}>
                  🍔
                </div>
                <span className={`text-[10px] font-medium ${!activeCategory ? 'text-green-600 dark:text-[#CCFF00] font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>Todo</span>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat.id)}
                  className={`snap-start flex-shrink-0 flex flex-col items-center gap-2 min-w-[4.5rem] group`}>
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center border justify-center text-2xl transition-all
                    ${activeCategory === cat.id ? 'bg-green-600 dark:bg-[#CCFF00] border-green-600 dark:border-[#CCFF00] shadow-lg' : 'bg-gray-100 dark:bg-[#121212] border-gray-200 dark:border-white/5 group-hover:border-green-400 dark:group-hover:border-[#CCFF00]/50'}`}>
                    {cat.emoji}
                  </div>
                  <span className={`text-[10px] font-medium ${activeCategory === cat.id ? 'text-green-600 dark:text-[#CCFF00] font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 space-y-10 mt-6 relative z-10">

          {/* Destacados */}
          {featured.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Destacados</h2>
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)} className="text-sm font-medium text-green-600 dark:text-[#CCFF00] hover:underline">Ver todos</button>
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
                    className="flex-shrink-0 snap-center w-36 min-h-[160px] bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-green-400 dark:hover:border-[#CCFF00]/40 transition-colors group">
                    <span className="text-xl text-gray-400 group-hover:text-green-600 dark:group-hover:text-[#CCFF00] group-hover:translate-x-1 transition-all">→</span>
                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white text-center leading-relaxed">Ver<br/>más</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Tiendas */}
          {stores.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tiendas Locales</h2>
                <Link to="/tiendas" className="text-sm font-medium text-green-600 dark:text-[#CCFF00] hover:underline">Ver todas</Link>
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

          {/* Todos los productos */}
          <section className="pb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center justify-between">
              <span>{activeCat ? activeCat.name : 'Para Ti'}</span>
              {!loading && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-full">{products.length} desc.</span>}
            </h2>
            <ProductList products={products} loading={loading} />
          </section>

        </div>
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>

      {/* Modal de Destacados */}
      {showAllFeatured && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-white/10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-gray-50 dark:bg-[#0a0a0a]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Todos los Destacados</h2>
              <button onClick={() => setShowAllFeatured(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto p-5 bg-white dark:bg-[#050505]">
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
