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
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <TopNav />

      <div className="max-w-2xl mx-auto">
        {/* Decorative Grid Top */}
        <div className="absolute inset-x-0 top-14 h-64 bg-brand-500/[0.015] bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>

        {/* Greeting + search */}
        <div className="px-4 pt-6 pb-4">
          <p className="text-[10px] font-mono tracking-widest text-brand-500 uppercase">SYS_GREETING</p>
          <h1 className="text-3xl font-dot tracking-widest text-white leading-tight mt-1 uppercase">
            {usuario?.nombre?.split(' ')[0] || 'GUEST_USER'}
          </h1>
          <Link to="/buscar"
            className="mt-5 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-gray-400 hover:bg-white/10 hover:border-brand-500/50 hover:text-white transition-all group backdrop-blur-sm">
            <span className="text-brand-500 group-hover:scale-110 transition-transform">🔍</span>
            <span className="font-mono tracking-widest text-xs">SEARCH SYSTEM...</span>
          </Link>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-2 py-4">
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x">
              <button onClick={() => { setActiveCategory(null); fetchProducts(null) }}
                className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all border min-w-fit
                  ${!activeCategory ? 'bg-brand-500 text-black border-brand-500 shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}>
                <span className="text-sm">⚡</span>
                <span>ALL</span>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat.id)}
                  className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all border min-w-fit
                    ${activeCategory === cat.id ? 'bg-brand-500 text-black border-brand-500 shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}>
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 space-y-10 mt-6 relative z-10">

          {/* Featured */}
          {featured.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-4 border-b border-white/10 pb-2">
                <h2 className="font-dot text-lg tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div> FEATURED</h2>
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)} className="text-[10px] font-mono tracking-widest uppercase text-brand-500 hover:text-white transition-colors">VIEW_ALL [→]</button>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
                {featured.slice(0, 8).map(product => (
                  <div key={product.id} className="snap-center">
                    <ProductCard product={product} horizontal />
                  </div>
                ))}
                {featured.length > 3 && (
                  <button onClick={() => setShowAllFeatured(true)}
                    className="flex-shrink-0 snap-center w-36 min-h-[160px] bg-transparent border border-white/20 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-brand-500 hover:bg-brand-500/5 transition-all group">
                    <span className="text-2xl text-white/30 group-hover:text-brand-500 group-hover:translate-x-1 transition-all">→</span>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 group-hover:text-brand-500 text-center">ACCESS<br/>DIRECTORY</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Stores */}
          {stores.length > 0 && !activeCategory && (
            <section>
              <div className="flex items-end justify-between mb-4 border-b border-white/10 pb-2">
                <h2 className="font-dot text-lg tracking-widest">STORES.DIR</h2>
                <Link to="/tiendas" className="text-[10px] font-mono tracking-widest uppercase text-brand-500 hover:text-white transition-colors">LISTING [→]</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
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
            <h2 className="font-dot text-lg tracking-widest mb-6 border-b border-white/10 pb-2">
              <span className="text-brand-500">{(activeCat ? `${activeCat.emoji}_${activeCat.name}` : 'GLOBAL_INDEX').toUpperCase()}</span>
              {!loading && <span className="ml-3 text-[10px] font-mono text-gray-500">[{products.length} ENTRIES]</span>}
            </h2>
            <ProductList products={products} loading={loading} />
          </section>

        </div>
      </div>

      <BottomNav />

      {/* All Featured Modal */}
      {showAllFeatured && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0 bg-[#050505]">
              <h2 className="font-dot text-xl tracking-widest text-brand-500">FEATURED.ALL</h2>
              <button onClick={() => setShowAllFeatured(false)} className="text-gray-500 hover:text-brand-500 font-mono tracking-widest text-xs px-3 py-1 border border-transparent hover:border-brand-500/30 rounded-full transition-all">[ ESC ]</button>
            </div>
            <div className="overflow-y-auto p-5 bg-[#0a0a0a]">
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
