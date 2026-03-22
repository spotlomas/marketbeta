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
    <div className="min-h-screen bg-[#050505] text-white font-inter pb-24 transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#CCFF00]/5 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        <TopNav />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 border-b border-white/10 pb-5">
          <h1 className="text-xl font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
            ORDER_HISTORY
          </h1>
          <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mt-2">TRANSACTION_RECORDS_AND_ACTIVE_ORDERS</p>
        </div>

        {loading ? (
          <div className="flex animate-pulse items-center gap-3">
            <div className="w-2 h-2 bg-[#CCFF00] rounded-full"></div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#CCFF00]">LOADING_RECORDS...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-[#0A0A0A] border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-3xl">
            <p className="text-5xl mb-6 opacity-20">🧾</p>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500">NO_ORDERS_FOUND</p>
          </div>
        ) : (
          <div className="space-y-10">
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  IN_PROGRESS_QUEUED ({pendientes.length})
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
                <h2 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]"></span>
                  ARCHIVED_DELIVERED ({entregadas.length})
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
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md flex items-end sm:items-center justify-center z-50 px-0 sm:px-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_40px_rgba(204,255,0,0.1)] relative overflow-hidden">
             {/* glowing orb background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative border-b border-white/10 pb-4">
              <h2 className="font-mono text-sm tracking-widest text-[#CCFF00] uppercase">VERIFICATION_CODE</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0A0A0A] border border-white/10 text-gray-400 hover:text-white hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/20 transition-all">✕</button>
            </div>

            {selected.status === 'entregado' ? (
              <div className="text-center py-8 relative">
                <div className="w-20 h-20 mx-auto bg-[#CCFF00]/10 text-[#CCFF00] rounded-full flex items-center justify-center text-4xl mb-6 border border-[#CCFF00]/30 shadow-[0_0_20px_rgba(204,255,0,0.2)]">✓</div>
                <p className="font-mono font-bold tracking-widest uppercase text-white text-sm">FULFILLED_SUCCESSFULLY</p>
                <p className="text-xs text-gray-400 font-inter line-clamp-1 mt-2">{selected.products?.name}</p>
                {selected.confirmed_at && (
                  <p className="text-[9px] text-gray-500 mt-6 font-mono tracking-widest uppercase">
                    TS: {new Date(selected.confirmed_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center relative py-2">
                <p className="text-[10px] text-[#CCFF00] font-mono font-bold uppercase tracking-widest mb-6 text-center line-clamp-2">{selected.products?.name}</p>
                <div className="p-4 rounded-3xl border border-white/5 shadow-[0_0_30px_rgba(204,255,0,0.1)] bg-[#050505] mb-8">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selected.id)}&color=000000&bgcolor=ffffff`}
                     alt="QR"
                     className="w-48 h-48 rounded-xl opacity-90"
                   />
                </div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-white text-center uppercase">
                  PRESENT_QR_TO_MERCHANT
                </p>
                <p className="text-[9px] text-gray-500 mt-4 bg-[#050505] border border-white/10 py-2 px-6 rounded-full font-mono tracking-widest uppercase shadow-sm">UID_{selected.id.slice(0, 8)}</p>
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
    <div className={`bg-[#0A0A0A] rounded-[2rem] border border-white/5 p-4 flex items-center gap-5 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isPending ? 'hover:border-white/20' : ''}`}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#121212] flex-shrink-0 border border-white/5">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products?.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate">{order.products?.name}</p>
        <p className="text-[#CCFF00] font-mono tracking-widest text-[10px] font-bold mt-1 uppercase">${Number(order.amount).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          {isPending 
            ? <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-orange-950/30 text-orange-400 border-orange-900/50 uppercase tracking-widest">PENDING_QUEUE</span>
            : <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-gray-900 text-gray-400 border-gray-800 uppercase tracking-widest">COMPLETED_TX</span>
          }
          <span className="text-[8px] font-mono font-bold tracking-widest text-gray-600 uppercase">{new Date(order.created_at).toLocaleDateString('es-MX')}</span>
        </div>
      </div>
      {isPending && onShowQR && (
        <button onClick={onShowQR}
          className="text-[9px] font-mono font-bold tracking-widest uppercase bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 hover:bg-[#CCFF00]/20 px-4 py-3 rounded-full transition-colors flex-shrink-0">
          VIEW_QR
        </button>
      )}
      {!isPending && <span className="text-xl text-[#CCFF00] mr-2">✓</span>}
    </div>
  )
}
