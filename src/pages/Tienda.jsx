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
    <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center text-gray-500 transition-colors">
      <p className="font-bold text-xl text-gray-900 dark:text-white mb-2">Tienda no encontrada</p>
      <p className="text-sm text-gray-500">Esta tienda no existe o fue eliminada.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white pb-24 font-inter transition-colors">
      <TopNav />

      {/* Cabecera de la tienda */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-white/10">
        <div className="h-44 relative overflow-hidden bg-gray-100 dark:bg-[#121212]">
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#050505] via-white/50 dark:via-[#0A0A0A]/50 to-transparent z-10 pointer-events-none"></div>
          {store?.imagen_tienda && (
            <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover absolute inset-0 opacity-60 dark:opacity-50 dark:mix-blend-screen" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-20 max-w-3xl mx-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border-2 border-white dark:border-[#121212] flex items-center justify-center text-4xl mb-4 overflow-hidden relative shadow-lg bg-gray-100 dark:bg-[#121212]">
            {store?.imagen_tienda ? (
              <img src={store.imagen_tienda} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="opacity-50">🏪</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {store?.nombre_tienda || store?.nombre}
          </h1>
          {store?.descripcion_tienda && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-lg">{store.descripcion_tienda}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
            {avgRating ? (
              <div className="bg-gray-100 dark:bg-[#121212] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200 dark:border-white/5">
                <span className="text-yellow-500 dark:text-[#CCFF00]">★</span>
                <span className="text-gray-700 dark:text-white font-medium">{avgRating} ({reviews.length})</span>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-[#121212] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200 dark:border-white/5">
                <span className="text-gray-400">★</span>
                <span className="text-gray-500">Nuevo</span>
              </div>
            )}
            <div className="bg-gray-100 dark:bg-[#121212] px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
              <span className="text-gray-700 dark:text-white font-medium">{products.length} productos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12 relative z-10">

        {/* Productos */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-white/10 pb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Productos</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-3xl animate-pulse h-48" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-3xl">
               <p className="text-sm text-gray-500">Esta tienda aún no tiene productos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Reseñas */}
        {reviews.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-3 flex items-center gap-2">
              Reseñas 
              <span className="text-xs bg-green-50 dark:bg-[#CCFF00]/10 border border-green-200 dark:border-[#CCFF00]/30 text-green-600 dark:text-[#CCFF00] px-2 py-0.5 rounded-full font-medium">{reviews.length}</span>
            </h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-gray-50 dark:bg-[#0A0A0A] rounded-2xl p-5 border border-gray-200 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[60%]">{r.usuarios?.nombre || 'Anónimo'}</p>
                    <div className="flex gap-0.5 bg-gray-100 dark:bg-[#121212] px-2 py-1 rounded-full border border-gray-200 dark:border-white/5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-[10px] ${s <= r.rating ? 'text-yellow-500 dark:text-[#CCFF00]' : 'text-gray-300 dark:text-gray-700'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">{r.comment}</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">{new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
