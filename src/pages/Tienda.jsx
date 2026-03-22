import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'

export default function Tienda() {
  const { id } = useParams()
  const [store, setStore]       = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchStore()
    fetchProducts()
    fetchReviews()
  }, [id])

  async function fetchStore() {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, nombre_tienda, descripcion_tienda, imagen_tienda')
      .eq('id', id)
      .single()
    if (data) setStore(data)
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', id)
      .or('stock_ilimitado.eq.true,stock.gt.0')
      .order('score', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, usuarios!reviews_buyer_id_fkey(nombre)')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setReviews(data)
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (!store && !loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500">
      <p className="font-dot text-2xl text-red-500 mb-2">404_NOT_FOUND</p>
      <p className="font-mono text-[10px] tracking-widest uppercase">Target entity disconnected.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <TopNav />

      {/* Store header */}
      <div className="bg-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-brand-500/20 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-[#050505]/40 backdrop-blur-sm z-10"></div>
          {store?.imagen_tienda && (
            <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover grayscale opacity-50 absolute inset-0 mix-blend-overlay" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-10 relative z-20">
          <div className="w-20 h-20 bg-[#121212] rounded-3xl border border-white/10 shadow-xl flex items-center justify-center text-3xl mb-4 overflow-hidden relative group">
            <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors"></div>
            {store?.imagen_tienda ? (
              <img src={store.imagen_tienda} alt="logo" className="w-full h-full object-cover grayscale" />
            ) : (
              <span className="opacity-50">🏪</span>
            )}
          </div>
          <h1 className="text-2xl font-dot tracking-widest text-[#CCFF00] uppercase">
            {store?.nombre_tienda || store?.nombre}
          </h1>
          {store?.descripcion_tienda && (
            <p className="font-mono text-xs text-gray-400 mt-2 tracking-wider leading-relaxed">{store.descripcion_tienda}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] uppercase font-mono tracking-widest bg-[#151515] w-fit px-4 py-2 rounded-full border border-white/5">
            {avgRating ? (
              <span className="text-yellow-500 font-bold border-r border-white/10 pr-3">⭐ {avgRating}</span>
            ) : (
              <span className="text-gray-600 border-r border-white/10 pr-3">NO_RATINGS</span>
            )}
            <span className="text-white font-bold border-r border-white/10 pr-3">{products.length} <span className="text-gray-500 font-normal">ITEMS</span></span>
            <span className="text-white font-bold">{reviews.length} <span className="text-gray-500 font-normal">LOGS</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12">

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="font-dot text-lg tracking-widest text-white uppercase">INVENTORY.DATA</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#121212] border border-white/5 rounded-3xl animate-pulse h-48" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 border border-white/5 rounded-3xl bg-[#0a0a0a]">
              <p className="text-[10px] font-mono tracking-widest uppercase text-gray-600">No telemetry found for this vendor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="font-dot text-lg tracking-widest text-gray-400 uppercase mb-6 border-b border-white/10 pb-4">FEEDBACK.LOGS <span className="text-[10px] font-mono text-brand-500">[{reviews.length}]</span></h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#0a0a0a] rounded-3xl p-5 border border-white/10 transition-all hover:border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-brand-500">{r.usuarios?.nombre || 'ANONYMOUS_BUYER'}</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xs ${s <= r.rating ? 'text-yellow-500' : 'text-gray-800'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs font-mono tracking-wider text-gray-400 mt-2 bg-white/5 p-3 rounded-xl border border-white/5">{r.comment}</p>}
                  <p className="text-[9px] font-mono text-gray-600 mt-3 tracking-widest uppercase">TS: {new Date(r.created_at).toISOString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
