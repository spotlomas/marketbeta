import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'

export default function Admin() {
  const { usuario } = useApp()
  const [tab, setTab]           = useState('users')
  const [users, setUsers]       = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders]     = useState([])
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  if (usuario && !usuario.es_admin) return <Navigate to="/" replace />

  useEffect(() => {
    fetchStats()
    if (tab === 'users')    fetchUsers()
    if (tab === 'products') fetchProducts()
    if (tab === 'orders')   fetchOrders()
  }, [tab])

  async function fetchStats() {
    const [{ count: totalUsers }, { count: totalProducts }, { count: totalOrders }] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ])
    const { data: revenue } = await supabase.from('orders').select('amount').eq('status', 'entregado')
    const totalRevenue = revenue?.reduce((s, o) => s + Number(o.amount), 0) || 0
    setStats({ totalUsers, totalProducts, totalOrders, totalRevenue })
  }

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, usuarios!products_seller_id_fkey(nombre)').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, products(name), usuarios!orders_buyer_id_fkey(nombre, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setOrders(data)
    setLoading(false)
  }

  async function deleteUser(id) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    await supabase.from('usuarios').delete().eq('id', id)
    fetchUsers()
  }

  async function toggleAdmin(id, currentValue) {
    await supabase.from('usuarios').update({ es_admin: !currentValue }).eq('id', id)
    fetchUsers()
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  async function toggleFeatured(id, current) {
    await supabase.from('products').update({ featured: !current }).eq('id', id)
    fetchProducts()
  }

  const filteredUsers    = users.filter(u => u.nombre?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Panel de Administración</h1>
          <p className="text-gray-500 text-sm mt-1">Control total de la plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Usuarios" value={stats.totalUsers ?? '—'} icon="👥" />
          <StatCard label="Productos" value={stats.totalProducts ?? '—'} icon="📦" />
          <StatCard label="Órdenes" value={stats.totalOrders ?? '—'} icon="🧾" />
          <StatCard label="Ingresos plataforma" value={stats.totalRevenue ? `$${(stats.totalRevenue * 0.06).toFixed(2)}` : '—'} icon="💰" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: 'users',    label: '👥 Usuarios'  },
            { key: 'products', label: '📦 Productos'  },
            { key: 'orders',   label: '🧾 Órdenes'    },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab !== 'orders' && (
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Buscar ${tab === 'users' ? 'usuario' : 'producto'}...`}
            className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4" />
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.tipo_usuario === 'vendedor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.tipo_usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAdmin(u.id, u.es_admin)}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${u.es_admin ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {u.es_admin ? '✅ Admin' : 'No admin'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteUser(u.id)}
                        className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-2 py-1 rounded-lg transition-colors">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-8 h-8 object-cover rounded" />
                          : <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">🛍️</div>
                        }
                        <span className="font-medium text-gray-800">{p.name}</span>
                        {p.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">⭐</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.usuarios?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-600 font-bold">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.score?.toFixed(2) ?? '0'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleFeatured(p.id, p.featured)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors
                            ${p.featured ? 'text-yellow-600 border-yellow-200 hover:bg-yellow-50' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {p.featured ? 'Quitar ⭐' : 'Destacar'}
                        </button>
                        <button onClick={() => deleteProduct(p.id)}
                          className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-2 py-1 rounded-lg transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
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
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.products?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.usuarios?.nombre ?? o.usuarios?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-600 font-bold">${Number(o.amount).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    entregado:         'bg-green-100 text-green-700',
    cancelado:         'bg-red-100 text-red-700',
    pendiente_pago:    'bg-gray-100 text-gray-600',
  }
  const labels = {
    pendiente_entrega: 'Pendiente',
    entregado:         'Entregado',
    cancelado:         'Cancelado',
    pendiente_pago:    'Sin pagar',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}
