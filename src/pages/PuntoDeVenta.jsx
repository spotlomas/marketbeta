import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'

export default function PuntoDeVenta() {
  const { session } = useApp()
  const [orderId, setOrderId]       = useState('')
  const [order, setOrder]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [pendientes, setPendientes] = useState([])
  const [scanning, setScanning]     = useState(false)

  useEffect(() => {
    fetchPendientes()
  }, [])

  useEffect(() => {
    let scanner = null
    if (scanning) {
      scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }, false)

      scanner.render(
        (decodedText) => {
          scanner.clear()
          setScanning(false)
          setOrderId(decodedText)
          searchOrder(decodedText)
        },
        (err) => {}
      )
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [scanning])

  async function fetchPendientes() {
    const { data } = await supabase
      .from('orders')
      .select(`*, products(id, name, price, image_url, stock, stock_ilimitado), usuarios!orders_buyer_id_fkey(nombre, email)`)
      .eq('seller_id', session.user.id)
      .eq('status', 'pendiente_entrega')
      .order('created_at', { ascending: false })

    if (data) setPendientes(data)
  }

  function startScanner() {
    setScanning(true)
    setError('')
    setSuccess('')
  }
  
  function stopScanner() {
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

    const product = orderToConfirm.products
    if (product && !product.stock_ilimitado) {
      const newStock = Math.max(0, (product.stock || 0) - (orderToConfirm.quantity || 1))
      await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
    }

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
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white pb-24 transition-colors">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Punto de Venta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Escanea el QR del comprador para confirmar la entrega</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-8 mb-8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 dark:bg-[#CCFF00] rounded-full animate-pulse"></span>
            Escáner QR
          </h2>

          <div className="mb-6">
            {scanning ? (
              <div className="space-y-4">
                <style>{`
                  #qr-reader { border: 1px solid rgba(0,0,0,0.1) !important; border-radius: 1.5rem !important; overflow: hidden !important; background: #f9f9f9; }
                  .dark #qr-reader { border: 1px solid rgba(255,255,255,0.1) !important; background: #121212; }
                  #qr-reader img { display: none !important; }
                  #qr-reader__dashboard_section_csr span { color: inherit !important; }
                  #qr-reader__dashboard_section_swaplink { color: #16a34a !important; }
                  .dark #qr-reader__dashboard_section_swaplink { color: #CCFF00 !important; }
                  #qr-reader button { background: #16a34a; color: white; font-weight: bold; border-radius: 999px; border: none; padding: 8px 16px; min-width: 100px; margin: 4px; }
                  .dark #qr-reader button { background: #CCFF00; color: black; }
                  #qr-reader select { background: #f3f4f6; color: #111; padding: 4px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 8px; max-width: 100%; }
                  .dark #qr-reader select { background: #121212; color: white; border: 1px solid rgba(255,255,255,0.2); }
                `}</style>
                <div id="qr-reader" className="w-full"></div>
                <button onClick={stopScanner}
                  className="w-full border border-gray-200 dark:border-white/20 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white py-3 rounded-full text-sm font-medium transition-all">
                  Detener Escáner
                </button>
              </div>
            ) : (
              <button onClick={startScanner}
                className="w-full bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 hover:border-green-400 dark:hover:border-[#CCFF00]/50 hover:bg-green-50 dark:hover:bg-[#CCFF00]/5 text-gray-700 dark:text-white py-6 rounded-3xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-3">
                <span className="text-3xl opacity-50">📷</span>
                Abrir cámara para escanear QR
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input value={orderId} onChange={e => setOrderId(e.target.value)}
              placeholder="O ingresa el código manualmente..."
              className="flex-1 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 focus:border-green-500 dark:focus:border-[#CCFF00] rounded-xl px-5 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
              onKeyDown={e => e.key === 'Enter' && searchOrder(orderId)} />
            <button onClick={() => searchOrder(orderId)} disabled={loading}
              className="bg-gray-200 dark:bg-white/10 hover:bg-green-600 dark:hover:bg-white hover:text-white dark:hover:text-black border border-gray-200 dark:border-white/20 disabled:opacity-30 text-gray-700 dark:text-white px-6 py-3 rounded-xl text-sm font-bold transition-all">
              Buscar
            </button>
          </div>

          {error   && <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mt-4">{error}</p>}
          {success && <p className="text-sm font-bold text-white dark:text-black bg-green-600 dark:bg-[#CCFF00] rounded-xl px-4 py-3 mt-4">{success}</p>}

          {order && (
            <div className="mt-8 border border-green-300 dark:border-[#CCFF00]/30 bg-green-50 dark:bg-[#CCFF00]/5 rounded-3xl p-5 mb-2">
              <div className="flex items-center gap-4 mb-6">
                {order.products?.image_url
                  ? <img src={order.products.image_url} alt={order.products.name} className="w-16 h-16 object-cover rounded-2xl border border-gray-200 dark:border-white/10" />
                  : <div className="w-16 h-16 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-xl opacity-50">🛍️</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-700 dark:text-[#CCFF00] truncate">{order.products?.name}</p>
                  <p className="text-gray-900 dark:text-white font-bold text-sm mt-1">${Number(order.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-2 truncate">Comprador: {order.usuarios?.nombre || order.usuarios?.email}</p>
                  <p className="text-xs text-gray-500">Cantidad: {order.quantity}</p>
                </div>
              </div>
              <button onClick={() => confirmOrder(order)} disabled={loading}
                className="w-full bg-green-600 dark:bg-[#CCFF00] hover:bg-green-700 dark:hover:bg-white disabled:opacity-30 text-white dark:text-black font-bold text-sm py-4 rounded-full transition-all shadow-lg">
                {loading ? 'Confirmando...' : 'Confirmar Entrega'}
              </button>
            </div>
          )}
        </div>

        {/* Pedidos pendientes */}
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            Entregas Pendientes
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{pendientes.length}</span>
          </h2>

          {pendientes.length === 0 ? (
            <div className="border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl p-10 text-center">
              <p className="text-sm text-gray-500">No tienes entregas pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendientes.map(p => (
                <div key={p.id} className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 hover:border-green-300 dark:hover:border-[#CCFF00]/30 p-5 flex items-center gap-4 transition-all group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 flex-shrink-0">
                    {p.products?.image_url
                      ? <img src={p.products.image_url} alt={p.products.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" />
                      : <div className="w-full h-full flex items-center justify-center text-xl opacity-50">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.products?.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{p.usuarios?.nombre || p.usuarios?.email}</p>
                    <p className="text-green-600 dark:text-[#CCFF00] font-bold text-sm mt-2">${Number(p.amount).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setOrderId(p.id); searchOrder(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="text-xs font-bold border border-green-300 dark:border-[#CCFF00]/50 hover:bg-green-600 dark:hover:bg-[#CCFF00] hover:text-white dark:hover:text-black text-green-600 dark:text-[#CCFF00] px-4 py-2 rounded-full transition-all flex-shrink-0">
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
