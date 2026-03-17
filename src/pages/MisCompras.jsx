import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'

export default function MisCompras() {
  const { session } = useApp()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchOrders()

    // Actualizar cada 10 segundos para reflejar confirmaciones del vendedor
    const interval = setInterval(fetchOrders, 10000)

    // Suscripción realtime a cambios en orders
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
      // Si hay una orden seleccionada, actualizarla también
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis compras</h1>
          <p className="text-gray-500 text-sm mt-1">Se actualiza automáticamente cuando el vendedor confirma la entrega</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🛍️</p>
            <p className="text-sm">Aún no has realizado compras.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  ⏳ Pendientes de entrega ({pendientes.length})
                </h2>
                <div className="space-y-3">
                  {pendientes.map(order => (
                    <OrderCard key={order.id} order={order} onShowQR={() => setSelected(order)} />
                  ))}
                </div>
              </section>
            )}

            {entregadas.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  ✅ Entregadas ({entregadas.length})
                </h2>
                <div className="space-y-3">
                  {entregadas.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* QR Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Código QR</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {selected.status === 'entregado' ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-green-700 text-lg">¡Entrega confirmada!</p>
                <p className="text-sm text-gray-500 mt-1">{selected.products?.name}</p>
                {selected.confirmed_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Confirmado el {new Date(selected.confirmed_at).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-4 text-center">{selected.products?.name}</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selected.id)}`}
                  alt="QR"
                  className="w-52 h-52 rounded-xl"
                />
                <p className="text-xs text-gray-400 mt-3 text-center">Muestra este código al vendedor para confirmar tu entrega</p>
                <p className="text-xs font-mono text-gray-300 mt-1">{selected.id.slice(0, 16)}...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onShowQR }) {
  const statusMap = {
    pendiente_entrega: { label: 'Pendiente entrega', color: 'bg-yellow-100 text-yellow-700' },
    entregado:         { label: 'Entregado',         color: 'bg-green-100 text-green-700'  },
    cancelado:         { label: 'Cancelado',         color: 'bg-red-100 text-red-700'      },
  }
  const status = statusMap[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products?.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{order.products?.name}</p>
        <p className="text-brand-600 font-bold text-sm">${Number(order.amount).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
          <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
      {order.status === 'pendiente_entrega' && onShowQR && (
        <button onClick={onShowQR}
          className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
          Ver QR
        </button>
      )}
      {order.status === 'entregado' && <span className="text-2xl">✅</span>}
    </div>
  )
}
