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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-mono transition-colors">
      <p className="font-bold text-xl text-white mb-2 tracking-widest uppercase">STORE_NOT_FOUND</p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500">The requested seller profile does not exist or has been terminated.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 font-inter transition-colors">
      <TopNav />

      {/* Store header */}
      <div className="relative overflow-hidden bg-[#0A0A0A] border-b border-white/10">
        <div className="h-44 relative overflow-hidden bg-[#121212]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#0A0A0A]/50 to-transparent z-10 pointer-events-none"></div>
          {store?.imagen_tienda && (
            <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover absolute inset-0 mix-blend-screen opacity-50" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-20 max-w-3xl mx-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border-2 border-[#121212] flex items-center justify-center text-4xl mb-4 overflow-hidden relative shadow-[0_0_30px_rgba(204,255,0,0.1)] bg-[#121212]">
            {store?.imagen_tienda ? (
              <img src={store.imagen_tienda} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="opacity-50">🏪</span>
            )}
          </div>
          <h1 className="text-2xl font-mono tracking-widest uppercase text-[#CCFF00]">
            {store?.nombre_tienda || store?.nombre}
          </h1>
          {store?.descripcion_tienda && (
            <p className="text-[10px] text-gray-400 mt-2 font-mono tracking-widest uppercase leading-relaxed max-w-lg">{store.descripcion_tienda}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-5 text-[9px] font-mono font-bold tracking-widest text-white uppercase">
            {avgRating ? (
              <div className="bg-[#121212] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5">
                <span className="text-[#CCFF00]">★</span>
                <span>{avgRating} ({reviews.length})</span>
              </div>
            ) : (
              <div className="bg-[#121212] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5">
                <span className="text-gray-500">★</span>
                <span>NEW_RELEASE</span>
              </div>
            )}
            <div className="bg-[#121212] px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5">
              <span>{products.length} INSTANCES</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12 relative z-10">

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
            <h2 className="font-mono text-sm tracking-widest uppercase text-white flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"></span>
               PRODUCT_CATALOG
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#121212] border border-white/5 rounded-3xl animate-pulse h-48 shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-[#0A0A0A] border border-white/5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
               <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500">SELLER_HAS_NO_ACTIVE_LISTINGS.</p>
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
            <h2 className="font-mono text-sm tracking-widest uppercase text-white mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
              USER_TELEMETRY 
              <span className="text-[9px] bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] px-2 py-0.5 rounded font-bold">{reviews.length} LOGS</span>
            </h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#0A0A0A] rounded-2xl p-5 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#CCFF00] truncate max-w-[60%]">{r.usuarios?.nombre || 'ANON_USER'}</p>
                    <div className="flex gap-0.5 bg-[#121212] px-2 py-1 rounded-full border border-white/5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-[10px] ${s <= r.rating ? 'text-[#CCFF00]' : 'text-gray-700'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-300 font-inter leading-relaxed mt-2">{r.comment}</p>}
                  <p className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mt-4">TIMESTAMP: {new Date(r.created_at).toISOString().split('T')[0]}</p>
                </div>
              ))}
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
