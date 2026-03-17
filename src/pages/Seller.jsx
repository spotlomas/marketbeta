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
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Mi Tienda</h1>
          <Link to="/punto-de-venta"
            className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors">
            🏪 Punto de Venta
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[{ key: 'products', label: '📦 Productos' }, { key: 'orders', label: '📋 Ventas' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && <VendorPanel />}

        {tab === 'orders' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Confirmadas" value={ventas.length} icon="✅" />
              <StatCard label="Pendientes" value={pendientes.length} icon="⏳" />
              <StatCard label="Ingresos" value={`$${totalIngresos.toFixed(2)}`} icon="💰" />
              <StatCard label="Total" value={orders.length} icon="🧾" />
            </div>

            {loadingOrders ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">Aún no tienes ventas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{order.products?.name}</p>
                      <p className="text-xs text-gray-500">{order.usuarios?.nombre || order.usuarios?.email}</p>
                      <p className="text-brand-600 font-bold text-sm">${Number(order.amount).toFixed(2)}</p>
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
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <p className="text-xl">{icon}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente_entrega: 'bg-yellow-100 text-yellow-700',
    entregado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  }
  const labels = { pendiente_entrega: 'Pendiente', entregado: 'Entregado', cancelado: 'Cancelado' }
  return <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{labels[status] ?? status}</span>
}
