import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import VendorPanel from '../components/VendorPanel'
import DeliverySettings from '../components/DeliverySettings'
import { Camera, CheckCircle, Clock, DollarSign, ListOrdered, ClipboardList } from 'lucide-react'

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
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white pb-24 transition-colors">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Vendedor</h1>
          <Link to="/punto-de-venta"
            className="bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black hover:bg-green-700 dark:hover:bg-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg flex items-center gap-2">
            <Camera className="w-4 h-4" /> Punto de Venta
          </Link>
        </div>

        {/* Pestañas */}
        <div className="flex gap-2 bg-gray-100 dark:bg-[#121212] p-2 rounded-full w-full sm:w-fit mb-8 border border-gray-200 dark:border-white/5 overflow-x-auto scrollbar-hide">
          {[
            { key: 'products', label: 'Mis Productos' }, 
            { key: 'orders', label: 'Mis Ventas' },
            { key: 'delivery', label: 'Lugares' }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex-shrink-0
                ${tab === t.key ? 'bg-white dark:bg-white text-black font-bold shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && <VendorPanel />}
        {tab === 'delivery' && <DeliverySettings session={session} />}

        {tab === 'orders' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Entregados" value={ventas.length} icon={<CheckCircle className="w-6 h-6 text-green-500" />} />
              <StatCard label="Pendientes" value={pendientes.length} icon={<Clock className="w-6 h-6 text-orange-500" />} />
              <StatCard label="Ingresos" value={`$${totalIngresos.toFixed(2)}`} icon={<DollarSign className="w-6 h-6 text-[#CCFF00]" />} />
              <StatCard label="Total Pedidos" value={orders.length} icon={<ListOrdered className="w-6 h-6 text-blue-500" />} />
            </div>

            {loadingOrders ? (
              <div className="flex animate-pulse items-center gap-3">
                <p className="text-sm text-gray-400">Cargando ventas...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl">
                <div className="mb-4 flex justify-center"><ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-700" /></div>
                <p className="text-sm text-gray-500">Aún no tienes ventas registradas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 p-5 flex items-center justify-between gap-4 transition-all hover:border-gray-300 dark:hover:border-white/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.products?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.usuarios?.nombre || order.usuarios?.email}</p>
                      <p className="text-green-600 dark:text-[#CCFF00] font-bold text-sm mt-2">${Number(order.amount).toFixed(2)}</p>
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
    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 p-5 relative overflow-hidden group hover:border-green-400 dark:hover:border-[#CCFF00]/50 transition-colors">
      <div className="mb-3">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente_entrega: 'bg-orange-50 dark:bg-yellow-500/10 text-orange-500 dark:text-yellow-500 border-orange-200 dark:border-yellow-500/20',
    entregado: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20',
    cancelado: 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20',
  }
  const labels = { pendiente_entrega: 'Pendiente', entregado: 'Entregado', cancelado: 'Cancelado' }
  return <span className={`text-xs font-medium px-3 py-1 rounded-full border flex-shrink-0 ${map[status] ?? 'bg-gray-100 dark:bg-white/10 text-gray-500 border-gray-200 dark:border-white/20'}`}>{labels[status] ?? status}</span>
}
