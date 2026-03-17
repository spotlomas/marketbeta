import { useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'

export default function PuntoDeVenta() {
  const { session } = useApp()
  const [orderId, setOrderId]       = useState('')
  const [order, setOrder]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [pendientes, setPendientes] = useState([])
  const [scanning, setScanning]     = useState(false)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    fetchPendientes()
    return () => stopCamera()
  }, [])

  async function fetchPendientes() {
    const { data } = await supabase
      .from('orders')
      .select(`*, products(id, name, price, image_url, stock, stock_ilimitado), usuarios!orders_buyer_id_fkey(nombre, email)`)
      .eq('seller_id', session.user.id)
      .eq('status', 'pendiente_entrega')
      .order('created_at', { ascending: false })

    if (data) setPendientes(data)
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setScanning(true)
      setError('')
    } catch {
      setError('No se pudo acceder a la cámara. Usa la búsqueda manual.')
    }
  }

  function stopCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setScanning(false)
  }

  async function searchOrder(id) {
    if (!id.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')
    setOrder(null)

    const { data, error } = await supabase
      .from('orders')
      .select(`*, products(id, name, price, image_url, stock, stock_ilimitado), usuarios!orders_buyer_id_fkey(nombre, email)`)
      .eq('id', id.trim())
      .eq('seller_id', session.user.id)
      .single()

    if (error || !data) {
      setError('Orden no encontrada o no pertenece a tu tienda.')
    } else if (data.status === 'entregado') {
      setError('Esta orden ya fue entregada anteriormente.')
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  async function confirmOrder(orderToConfirm) {
    setLoading(true)
    setError('')

    // 1. Marcar orden como entregada
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'entregado', confirmed_at: new Date().toISOString() })
      .eq('id', orderToConfirm.id)
      .eq('seller_id', session.user.id)

    if (orderError) {
      setError('Error al confirmar la orden.')
      setLoading(false)
      return
    }

    // 2. Descontar stock
    const product = orderToConfirm.products
    if (product && !product.stock_ilimitado) {
      const newStock = Math.max(0, (product.stock || 0) - (orderToConfirm.quantity || 1))
      await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
    }

    // 3. Actualizar sales_count y score del producto
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', orderToConfirm.product_id)
      .eq('status', 'entregado')

    const salesCount = count || 0

    const { data: productData } = await supabase
      .from('products')
      .select('avg_rating')
      .eq('id', orderToConfirm.product_id)
      .single()

    const avgRating = productData?.avg_rating || 0
    const score = (salesCount * 0.6) + (avgRating * 0.4) * Math.log10(salesCount + 1)

    await supabase.from('products').update({
      sales_count: salesCount,
      score: parseFloat(score.toFixed(4)),
    }).eq('id', orderToConfirm.product_id)

    // 4. Enviar notificación al comprador para calificar
    await supabase.from('notifications').insert({
      user_id: orderToConfirm.buyer_id,
      type:    'review_request',
      title:   '⭐ ¿Cómo estuvo tu compra?',
      message: `Califica "${product?.name}" y ayuda a otros compradores.`,
      data:    { order_id: orderToConfirm.id, product_id: orderToConfirm.product_id },
      read:    false,
    })

    setSuccess('✅ ¡Orden confirmada! Se notificó al comprador para calificar.')
    setOrder(null)
    setOrderId('')
    fetchPendientes()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="text-gray-500 text-sm mt-1">Confirma entregas y el comprador recibirá una notificación para calificar</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Confirmar entrega</h2>

          <div className="mb-4">
            {scanning ? (
              <div className="space-y-3">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-brand-400 rounded-xl opacity-70" />
                  </div>
                </div>
                <button onClick={stopCamera}
                  className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm transition-colors">
                  Detener cámara
                </button>
              </div>
            ) : (
              <button onClick={startCamera}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                📷 Escanear QR con cámara
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input value={orderId} onChange={e => setOrderId(e.target.value)}
              placeholder="O pega el ID de la orden aquí..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={e => e.key === 'Enter' && searchOrder(orderId)} />
            <button onClick={() => searchOrder(orderId)} disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Buscar
            </button>
          </div>

          {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">{success}</p>}

          {order && (
            <div className="mt-4 border border-brand-200 bg-brand-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                {order.products?.image_url
                  ? <img src={order.products.image_url} alt={order.products.name} className="w-14 h-14 object-cover rounded-lg" />
                  : <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center text-2xl">🛍️</div>
                }
                <div>
                  <p className="font-semibold text-gray-800">{order.products?.name}</p>
                  <p className="text-brand-600 font-bold">${Number(order.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Comprador: {order.usuarios?.nombre || order.usuarios?.email}</p>
                  <p className="text-xs text-gray-500">Cantidad: {order.quantity}</p>
                </div>
              </div>
              <button onClick={() => confirmOrder(order)} disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {loading ? 'Confirmando...' : '✅ Confirmar entrega'}
              </button>
            </div>
          )}
        </div>

        {/* Pendientes */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Pendientes de entrega
            {pendientes.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{pendientes.length}</span>
            )}
          </h2>

          {pendientes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tienes órdenes pendientes. 🎉</p>
          ) : (
            <div className="space-y-3">
              {pendientes.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.products?.image_url
                      ? <img src={p.products.image_url} alt={p.products.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.products?.name}</p>
                    <p className="text-xs text-gray-500">{p.usuarios?.nombre || p.usuarios?.email}</p>
                    <p className="text-brand-600 font-bold text-sm">${Number(p.amount).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setOrderId(p.id); searchOrder(p.id) }}
                    className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    Confirmar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
