import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import VendorPanel from '../components/VendorPanel'

export default function Seller() {
  const { usuario, session } = useApp()
  const [orders, setOrders]           = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [tab, setTab]                 = useState('products')

  if (usuario && usuario.tipo_usuario !== 'vendedor') {
    return <Navigate to="/" replace />
  }

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

  const ventas         = orders.filter(o => o.status === 'entregado')
  const pendientes     = orders.filter(o => o.status === 'pendiente_entrega')
  const totalIngresos  = ventas.reduce((sum, o) => sum + Number(o.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona tus productos y revisa tus ventas</p>
          </div>
          <Link
            to="/punto-de-venta"
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            🏪 Punto de Venta
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
          {[
            { key: 'products', label: '📦 Productos' },
            { key: 'orders',   label: '📋 Ventas'    },
          ].map(t => (
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
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Ventas confirmadas" value={ventas.length} icon="✅" />
              <StatCard label="Pendientes entrega" value={pendientes.length} icon="⏳" />
              <StatCard label="Ingresos totales" value={`$${totalIngresos.toFixed(2)}`} icon="💰" />
              <StatCard label="Total órdenes" value={orders.length} icon="🧾" />
            </div>

            {loadingOrders ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">Aún no tienes ventas.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprador</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{order.products?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{order.usuarios?.nombre ?? order.usuarios?.email ?? '—'}</td>
                        <td className="px-4 py-3 text-brand-600 font-bold">${Number(order.amount).toFixed(2)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente_entrega: 'bg-yellow-100 text-yellow-700',
    entregado:         'bg-green-100  text-green-700',
    cancelado:         'bg-red-100    text-red-700',
    pendiente_pago:    'bg-gray-100   text-gray-600',
  }
  const labels = {
    pendiente_entrega: 'Pendiente entrega',
    entregado:         'Entregado',
    cancelado:         'Cancelado',
    pendiente_pago:    'Pago pendiente',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}
