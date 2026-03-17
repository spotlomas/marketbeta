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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
      <p>Tienda no encontrada.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      {/* Store header */}
      <div className="bg-white">
        <div className="h-36 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
          {store?.imagen_tienda && (
            <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover opacity-80" />
          )}
        </div>
        <div className="px-4 pb-4 -mt-6">
          <div className="w-16 h-16 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-3xl mb-3">
            🏪
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {store?.nombre_tienda || store?.nombre}
          </h1>
          {store?.descripcion_tienda && (
            <p className="text-sm text-gray-500 mt-1">{store.descripcion_tienda}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            {avgRating && (
              <span className="text-sm text-yellow-500 font-medium">⭐ {avgRating}</span>
            )}
            <span className="text-sm text-gray-400">{products.length} productos</span>
            <span className="text-sm text-gray-400">{reviews.length} reseñas</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Products */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3">Productos</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl animate-pulse h-48" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Esta tienda no tiene productos disponibles.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3">Reseñas ({reviews.length})</h2>
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800">{r.usuarios?.nombre || 'Comprador'}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-sm ${s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500">{r.comment}</p>}
                  <p className="text-xs text-gray-300 mt-1">{new Date(r.created_at).toLocaleDateString('es-MX')}</p>
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
