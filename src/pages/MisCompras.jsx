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
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-10 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-dot tracking-widest text-[#CCFF00]">PURCHASE_LEDGER</h1>
          <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase mt-2">Dynamic syncing enabled: Awaiting vendor confirmations</p>
        </div>

        {loading ? (
          <div className="flex animate-pulse items-center gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-500">Querying transactions...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 text-gray-600 border border-white/5 rounded-3xl bg-[#0a0a0a]">
            <p className="text-4xl mb-4 font-mono font-light text-brand-500 opacity-50">NULL</p>
            <p className="text-[10px] uppercase font-mono tracking-widest">No transactions recorded in ledger</p>
          </div>
        ) : (
          <div className="space-y-12">
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-[11px] font-mono text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Pending Finalization ({pendientes.length})
                </h2>
                <div className="space-y-4">
                  {pendientes.map(order => (
                    <OrderCard key={order.id} order={order} onShowQR={() => setSelected(order)} />
                  ))}
                </div>
              </section>
            )}

            {entregadas.length > 0 && (
              <section className="opacity-70">
                <h2 className="text-[11px] font-mono text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  Fulfilled Operations ({entregadas.length})
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

      {/* QR Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00] blur-[80px] opacity-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-6 relative">
              <h2 className="font-dot text-lg tracking-widest text-[#CCFF00]">AUTH_KEY</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white font-mono transition-colors">✕</button>
            </div>

            {selected.status === 'entregado' ? (
              <div className="text-center py-8 relative">
                <div className="text-6xl mb-4 text-[#CCFF00]">✓</div>
                <p className="font-mono font-bold tracking-widest uppercase text-green-500 text-sm">Transfer Verified</p>
                <p className="text-xs text-white uppercase font-mono tracking-widest mt-2">{selected.products?.name}</p>
                {selected.confirmed_at && (
                  <p className="text-[9px] text-gray-500 mt-4 font-mono tracking-widest uppercase">
                    TS_CONFIRMED: {new Date(selected.confirmed_at).toISOString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center relative">
                <p className="text-[10px] text-white uppercase tracking-widest font-mono mb-6 text-center">{selected.products?.name}</p>
                <div className="bg-[#CCFF00] p-3 rounded-2xl relative">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selected.id)}&color=000000&bgcolor=CCFF00`}
                     alt="QR"
                     className="w-52 h-52 mix-blend-multiply"
                   />
                </div>
                <p className="text-[9px] text-brand-500 mt-6 text-center font-mono uppercase tracking-widest">
                  Present to vendor scanner for handshake
                </p>
                <p className="text-[10px] font-mono text-gray-600 mt-2 bg-white/5 py-1 px-3 rounded-full border border-white/10">ID: {selected.id.slice(0, 16)}...</p>
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
    <div className={`bg-[#0a0a0a] rounded-3xl border border-white/5 p-4 flex items-center gap-4 transition-all ${isPending ? 'hover:border-brand-500/30' : ''}`}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#151515] flex-shrink-0 border border-white/5">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products?.name} className="w-full h-full object-cover grayscale opacity-80" />
          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white truncate">{order.products?.name}</p>
        <p className="text-[#CCFF00] font-mono tracking-widest text-sm mt-1">${Number(order.amount).toFixed(2)}</p>
        <div className="flex items-center gap-3 mt-2">
          {isPending 
            ? <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-widest">PENDING</span>
            : <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest">FULFILLED</span>
          }
          <span className="text-[9px] font-mono text-gray-600 tracking-widest">{new Date(order.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
      {isPending && onShowQR && (
        <button onClick={onShowQR}
          className="text-[10px] uppercase font-mono font-bold tracking-widest bg-[#CCFF00] hover:bg-brand-400 text-black px-4 py-2 rounded-full transition-colors flex-shrink-0 shadow-[0_0_10px_rgba(204,255,0,0.1)]">
          SHOW_QR
        </button>
      )}
      {!isPending && <span className="text-xl text-gray-600">✓</span>}
    </div>
  )
}
