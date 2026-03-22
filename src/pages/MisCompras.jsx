import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'

export default function MisCompras() {
  const { session } = useApp()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchOrders()

    const interval = setInterval(fetchOrders, 10000)

    const channel = supabase
      .channel('mis-compras')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `buyer_id=eq.${session.user.id}`,
      }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
      if (selected) {
        const updated = data.find(o => o.id === selected.id)
        if (updated) setSelected(updated)
      }
    }
    setLoading(false)
  }

  const pendientes = orders.filter(o => o.status === 'pendiente_entrega')
  const entregadas = orders.filter(o => o.status === 'entregado')

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-inter pb-24 transition-colors relative">
      <div className="relative z-10">
        <TopNav />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mis Compras</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Historial de pedidos activos y completados</p>
        </div>

        {loading ? (
          <div className="flex animate-pulse items-center gap-3">
            <p className="text-sm text-gray-400">Cargando...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-3xl">
            <p className="text-5xl mb-6 opacity-20">🧾</p>
            <p className="text-sm text-gray-500">Aún no tienes compras</p>
          </div>
        ) : (
          <div className="space-y-10">
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-orange-500 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Pendientes ({pendientes.length})
                </h2>
                <div className="space-y-4">
                  {pendientes.map(order => (
                    <OrderCard key={order.id} order={order} onShowQR={() => setSelected(order)} />
                  ))}
                </div>
              </section>
            )}

            {entregadas.length > 0 && (
              <section className={pendientes.length > 0 ? "opacity-70 transition-all hover:opacity-100" : ""}>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#CCFF00]"></span>
                  Entregados ({entregadas.length})
                </h2>
                <div className="space-y-4">
                  {entregadas.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <div className="relative z-20">
        <BottomNav />
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 dark:bg-[#050505]/90 backdrop-blur-md flex items-end sm:items-center justify-center z-50 px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-8 w-full max-w-sm shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative border-b border-gray-200 dark:border-white/10 pb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Código QR</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">✕</button>
            </div>

            {selected.status === 'entregado' ? (
              <div className="text-center py-8 relative">
                <div className="w-20 h-20 mx-auto bg-green-50 dark:bg-[#CCFF00]/10 text-green-600 dark:text-[#CCFF00] rounded-full flex items-center justify-center text-4xl mb-6 border border-green-200 dark:border-[#CCFF00]/30">✓</div>
                <p className="font-bold text-gray-900 dark:text-white text-base">Entregado</p>
                <p className="text-sm text-gray-500 line-clamp-1 mt-2">{selected.products?.name}</p>
                {selected.confirmed_at && (
                  <p className="text-xs text-gray-400 mt-6">
                    {new Date(selected.confirmed_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center relative py-2">
                <p className="text-sm text-green-600 dark:text-[#CCFF00] font-bold mb-6 text-center line-clamp-2">{selected.products?.name}</p>
                <div className="p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-md bg-white dark:bg-[#050505] mb-8">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selected.id)}&color=000000&bgcolor=ffffff`}
                     alt="QR"
                     className="w-48 h-48 rounded-xl"
                   />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-white text-center">
                  Muestra este QR al vendedor
                </p>
                <p className="text-xs text-gray-400 mt-4 bg-gray-100 dark:bg-[#050505] border border-gray-200 dark:border-white/10 py-2 px-6 rounded-full">{selected.id.slice(0, 8)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onShowQR }) {
  const isPending = order.status === 'pendiente_entrega'
  
  return (
    <div className={`bg-gray-50 dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200 dark:border-white/5 p-4 flex items-center gap-5 transition-all ${isPending ? 'hover:border-gray-300 dark:hover:border-white/20' : ''}`}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#121212] flex-shrink-0 border border-gray-200 dark:border-white/5">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products?.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{order.products?.name}</p>
        <p className="text-green-600 dark:text-[#CCFF00] text-sm font-bold mt-1">${Number(order.amount).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          {isPending 
            ? <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-900/50">Pendiente</span>
            : <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800">Entregado</span>
          }
          <span className="text-xs text-gray-400 dark:text-gray-600">{new Date(order.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
      {isPending && onShowQR && (
        <button onClick={onShowQR}
          className="text-xs font-bold bg-green-50 dark:bg-[#CCFF00]/10 text-green-600 dark:text-[#CCFF00] border border-green-200 dark:border-[#CCFF00]/30 hover:bg-green-100 dark:hover:bg-[#CCFF00]/20 px-4 py-3 rounded-full transition-colors flex-shrink-0">
          Ver QR
        </button>
      )}
      {!isPending && <span className="text-xl text-green-600 dark:text-[#CCFF00] mr-2">✓</span>}
    </div>
  )
}
