import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
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
          // Success
          scanner.clear()
          setScanning(false)
          setOrderId(decodedText)
          searchOrder(decodedText)
        },
        (err) => {
          // Ignore frequent errors during scan
        }
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
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-xl font-dot tracking-widest text-[#CCFF00] uppercase">POS_TERMINAL</h1>
          <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mt-2">DELIVERY_CONFIRMATION_SYSTEM</p>
        </div>

        <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 md:p-8 mb-8">
          <h2 className="text-xs font-mono tracking-widest text-white uppercase mb-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
            SCAN_INTERFACE
          </h2>

          <div className="mb-6">
            {scanning ? (
              <div className="space-y-4">
                <style>{`
                  #qr-reader { border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 1.5rem !important; overflow: hidden !important; background: #121212; }
                  #qr-reader img { display: none !important; }
                  #qr-reader__dashboard_section_csr span { color: white !important; font-family: monospace; }
                  #qr-reader__dashboard_section_swaplink { color: #CCFF00 !important; font-family: monospace; text-transform: uppercase; }
                  #qr-reader button { background: #CCFF00; color: black; font-family: monospace; font-weight: bold; border-radius: 999px; border: none; padding: 8px 16px; min-width: 100px; margin: 4px; }
                  #qr-reader select { background: #121212; color: white; padding: 4px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; margin-bottom: 8px; max-width: 100%; }
                `}</style>
                <div id="qr-reader" className="w-full"></div>
                <button onClick={stopScanner}
                  className="w-full border border-white/20 text-gray-400 hover:text-white hover:border-white hover:bg-white/5 py-3 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all">
                  TERMINATE_SENSOR
                </button>
              </div>
            ) : (
              <button onClick={startScanner}
                className="w-full bg-[#121212] border border-white/10 hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/5 text-white py-6 rounded-3xl text-[11px] font-mono uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-3">
                <span className="text-3xl opacity-50">📷</span>
                INITIALIZE_OPTICAL_SENSOR
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <input value={orderId} onChange={e => setOrderId(e.target.value)}
              placeholder="MANUAL_ID_ENTRY..."
              className="flex-1 bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-5 py-3 text-xs font-mono text-white placeholder-gray-700 outline-none transition-all uppercase tracking-widest"
              onKeyDown={e => e.key === 'Enter' && searchOrder(orderId)} />
            <button onClick={() => searchOrder(orderId)} disabled={loading}
              className="bg-white/10 hover:bg-white hover:text-black border border-white/20 disabled:bg-white/5 disabled:text-gray-600 disabled:border-white/5 text-white px-6 py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all font-bold">
              EXEC_QUERY
            </button>
          </div>

          {error   && <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-4">{error}</p>}
          {success && <p className="text-[10px] font-mono tracking-widest uppercase text-black font-bold bg-[#CCFF00] border border-[#CCFF00]/50 rounded-xl px-4 py-3 mt-4 animate-[fade-in_0.3s_ease-out]">{success}</p>}

          {order && (
            <div className="mt-8 border border-[#CCFF00]/30 bg-[#CCFF00]/5 rounded-3xl p-5 mb-2 animate-[fade-in_0.3s_ease-out]">
              <div className="flex items-center gap-4 mb-6">
                {order.products?.image_url
                  ? <img src={order.products.image_url} alt={order.products.name} className="w-16 h-16 object-cover rounded-2xl border border-white/10" />
                  : <div className="w-16 h-16 bg-[#121212] border border-white/10 rounded-2xl flex items-center justify-center text-xl opacity-50">🛍️</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs uppercase tracking-widest text-[#CCFF00] truncate">{order.products?.name}</p>
                  <p className="text-white font-mono tracking-widest text-sm mt-1 mb-2">${Number(order.amount).toFixed(2)}</p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest truncate">TARGET: {order.usuarios?.nombre || order.usuarios?.email}</p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Q_AMT: {order.quantity}</p>
                </div>
              </div>
              <button onClick={() => confirmOrder(order)} disabled={loading}
                className="w-full bg-[#CCFF00] hover:bg-brand-400 disabled:bg-white/10 disabled:text-gray-600 text-black font-mono font-bold tracking-widest text-[11px] uppercase py-4 rounded-full transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:shadow-none">
                {loading ? 'PROCESSING_TX...' : 'VERIFY_HANDOFF'}
              </button>
            </div>
          )}
        </div>

        {/* Pendientes */}
        <div>
          <h2 className="text-sm font-dot tracking-widest text-white uppercase mb-6 flex items-center gap-3">
            PENDING_DELIVERIES
            <span className="text-[10px] font-mono bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{pendientes.length}</span>
          </h2>

          {pendientes.length === 0 ? (
            <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-10 text-center">
              <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500">NO_PENDING_TASKS</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendientes.map(p => (
                <div key={p.id} className="bg-[#0a0a0a] rounded-3xl border border-white/5 hover:border-[#CCFF00]/30 p-5 flex items-center gap-4 transition-all group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#121212] border border-white/10 flex-shrink-0">
                    {p.products?.image_url
                      ? <img src={p.products.image_url} alt={p.products.name} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      : <div className="w-full h-full flex items-center justify-center text-xl opacity-50">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono uppercase tracking-widest text-white truncate">{p.products?.name}</p>
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest truncate mt-1">{p.usuarios?.nombre || p.usuarios?.email}</p>
                    <p className="text-[#CCFF00] font-mono tracking-widest text-sm mt-2">${Number(p.amount).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setOrderId(p.id); searchOrder(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="text-[9px] font-mono border border-[#CCFF00]/50 hover:bg-[#CCFF00] hover:text-black text-[#CCFF00] px-4 py-2 rounded-full uppercase tracking-widest transition-all flex-shrink-0">
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="h-20"></div>
    </div>
  )
}
