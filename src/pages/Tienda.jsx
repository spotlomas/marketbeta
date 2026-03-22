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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-500 font-inter">
      <p className="font-bold text-2xl text-gray-900 mb-2">Tienda no encontrada</p>
      <p className="text-sm">El comercio que buscas no existe o fue eliminado.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24 font-inter">
      <TopNav />

      {/* Store header */}
      <div className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
        <div className="h-44 relative overflow-hidden bg-gray-200">
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          {store?.imagen_tienda && (
            <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover absolute inset-0 mix-blend-multiply" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-20 max-w-3xl mx-auto">
          <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 shadow-lg flex items-center justify-center text-4xl mb-4 overflow-hidden relative">
            {store?.imagen_tienda ? (
              <img src={store.imagen_tienda} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="opacity-50">🏪</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {store?.nombre_tienda || store?.nombre}
          </h1>
          {store?.descripcion_tienda && (
            <p className="text-sm text-gray-500 mt-2 font-medium max-w-lg">{store.descripcion_tienda}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold text-gray-700">
            {avgRating ? (
              <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="text-food-500">★</span>
                <span>{avgRating} ({reviews.length})</span>
              </div>
            ) : (
              <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="text-gray-400">★</span>
                <span>Nuevo</span>
              </div>
            )}
            <div className="bg-gray-100 px-3 py-1.5 rounded-full">
              <span>{products.length} productos</span>
            </div>
            <div className="bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-gray-500">Envíos 25-40 min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12">

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
            <h2 className="font-bold text-xl tracking-tight text-gray-900">Menú</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-3xl animate-pulse h-48" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 border border-gray-100 rounded-3xl">
              <p className="text-sm font-medium text-gray-500">La tienda no ha publicado artículos aún.</p>
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
            <h2 className="font-bold text-xl tracking-tight text-gray-900 mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
              Reseñas 
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{reviews.length}</span>
            </h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">{r.usuarios?.nombre || 'Usuario Anónimo'}</p>
                    <div className="flex gap-0.5 bg-gray-50 px-2 py-1 rounded-full">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-[10px] ${s <= r.rating ? 'text-food-500' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-4 font-medium">{new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
