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
    <div className="min-h-screen bg-white text-gray-900 font-inter pb-24">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Pedidos</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Historial de compras y pedidos activos</p>
        </div>

        {loading ? (
          <div className="flex animate-pulse items-center gap-2">
            <div className="w-2 h-2 bg-food-500 rounded-full"></div>
            <p className="text-sm font-medium text-food-500">Cargando historial...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 border border-gray-100 rounded-3xl">
            <p className="text-5xl mb-4 opacity-40">🧾</p>
            <p className="text-sm font-semibold text-gray-500">Aún no tienes pedidos registrados</p>
          </div>
        ) : (
          <div className="space-y-10">
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  En Curso ({pendientes.length})
                </h2>
                <div className="space-y-4">
                  {pendientes.map(order => (
                    <OrderCard key={order.id} order={order} onShowQR={() => setSelected(order)} />
                  ))}
                </div>
              </section>
            )}

            {entregadas.length > 0 && (
              <section className={pendientes.length > 0 ? "opacity-90" : ""}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="text-lg leading-none">✓</span>
                  Completados ({entregadas.length})
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
      <BottomNav />

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative border-b border-gray-100 pb-4">
              <h2 className="font-bold text-xl tracking-tight text-gray-900">Código de Recolección</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
            </div>

            {selected.status === 'entregado' ? (
              <div className="text-center py-8 relative">
                <div className="w-20 h-20 mx-auto bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4">✓</div>
                <p className="font-bold text-gray-900 text-xl">Pedido Entregado</p>
                <p className="text-gray-500 text-sm font-medium mt-1">{selected.products?.name}</p>
                {selected.confirmed_at && (
                  <p className="text-xs text-gray-400 mt-4 font-medium">
                    Entregado el: {new Date(selected.confirmed_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center relative py-2">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-6 text-center line-clamp-2">{selected.products?.name}</p>
                <div className="p-4 rounded-2xl border border-gray-200 shadow-sm bg-white mb-6">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selected.id)}&color=000000&bgcolor=ffffff`}
                     alt="QR"
                     className="w-48 h-48"
                   />
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center">
                  Muestra este código al vendedor
                </p>
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 py-1.5 px-4 rounded-full border border-gray-200 font-mono">ID: {selected.id.slice(0, 8).toUpperCase()}</p>
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
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all shadow-sm ${isPending ? 'hover:shadow-md' : ''}`}>
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products?.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-base truncate">{order.products?.name}</p>
        <p className="text-food-600 font-bold text-sm mt-0.5">${Number(order.amount).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {isPending 
            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">Pendiente</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">Completado</span>
          }
          <span className="text-[10px] font-medium text-gray-400">{new Date(order.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
      {isPending && onShowQR && (
        <button onClick={onShowQR}
          className="text-xs font-bold bg-food-50 text-food-600 hover:bg-food-100 hover:text-food-700 px-4 py-2.5 rounded-full transition-colors flex-shrink-0">
          Ver QR
        </button>
      )}
      {!isPending && <span className="text-xl text-green-500 mr-2">✓</span>}
    </div>
  )
}
