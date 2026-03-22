import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import VendorPanel from '../components/VendorPanel'

export default function Seller() {
  const { usuario, session } = useApp()
  const [orders, setOrders]           = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [tab, setTab]                 = useState('products')

  if (usuario && usuario.tipo_usuario !== 'vendedor') return <Navigate to="/" replace />

  useEffect(() => {
    if (tab === 'orders') fetchOrders()
  }, [tab])

  async function fetchOrders() {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select(`*, products(name, price), usuarios!orders_buyer_id_fkey(nombre, email)`)
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoadingOrders(false)
  }

  const ventas        = orders.filter(o => o.status === 'entregado')
  const pendientes    = orders.filter(o => o.status === 'pendiente_entrega')
  const totalIngresos = ventas.reduce((sum, o) => sum + Number(o.amount), 0)

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <h1 className="text-xl font-dot tracking-widest text-[#CCFF00] uppercase">VENDOR_DASHBOARD</h1>
          <Link to="/punto-de-venta"
            className="border border-[#CCFF00] text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(204,255,0,0.1)]">
            POS.TERMINAL
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#121212] p-2 rounded-full w-fit mb-8 border border-white/5">
          {[{ key: 'products', label: 'INVENTORY.SYS' }, { key: 'orders', label: 'SALES.LOG' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all
                ${tab === t.key ? 'bg-white text-black font-bold shadow-md' : 'text-gray-500 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && <VendorPanel />}

        {tab === 'orders' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="VERIFIED_OPS" value={ventas.length} icon="✓" />
              <StatCard label="PENDING_SYNC" value={pendientes.length} icon="⧖" />
              <StatCard label="REVENUE_STREAM" value={`$${totalIngresos.toFixed(2)}`} icon="₹" />
              <StatCard label="TOTAL_ENTRIES" value={orders.length} icon="Σ" />
            </div>

            {loadingOrders ? (
              <div className="flex animate-pulse items-center gap-3">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-brand-500">Querying transactions...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                <p className="text-4xl mb-4 font-mono font-light text-brand-500 opacity-30">NULL</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">No telemetry recorded in sales log.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-5 flex items-center justify-between gap-4 transition-all hover:border-white/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono uppercase tracking-widest text-white truncate">{order.products?.name}</p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1">{order.usuarios?.nombre || order.usuarios?.email}</p>
                      <p className="text-[#CCFF00] font-mono tracking-widest text-sm mt-3">${Number(order.amount).toFixed(2)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-5 relative overflow-hidden group hover:border-[#CCFF00]/50 transition-colors">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#CCFF00] blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none rounded-full"></div>
      <p className="text-xl text-gray-600 font-mono mb-2">{icon}</p>
      <p className="text-2xl font-dot tracking-widest text-white">{value}</p>
      <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mt-2">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente_entrega: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    entregado: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  const labels = { pendiente_entrega: 'PENDING', entregado: 'VERIFIED', cancelado: 'ABORTED' }
  return <span className={`text-[9px] font-mono tracking-widest px-3 py-1 rounded-full uppercase border flex-shrink-0 ${map[status] ?? 'bg-white/10 text-gray-500 border-white/20'}`}>{labels[status] ?? status}</span>
}
