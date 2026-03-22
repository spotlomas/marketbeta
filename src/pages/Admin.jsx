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
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-xl font-dot tracking-widest text-[#CCFF00] uppercase">ADMIN_OVERRIDE_PANEL</h1>
          <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mt-2">SYSTEM_CONTROL_ACTIVE</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="REGISTERED_NODES" value={stats.totalUsers ?? 'NULL'} icon="USR" />
          <StatCard label="ASSET_REGISTRY" value={stats.totalProducts ?? 'NULL'} icon="PKG" />
          <StatCard label="TRANSACTION_LOGS" value={stats.totalOrders ?? 'NULL'} icon="TXN" />
          <StatCard label="SYSTEM_REVENUE" value={stats.totalRevenue ? `$${(stats.totalRevenue * 0.06).toFixed(2)}` : 'NULL'} icon="REV" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#121212] p-2 rounded-full w-fit mb-8 border border-white/5">
          {[
            { key: 'users',    label: 'USR_DB'  },
            { key: 'products', label: 'PKG_DB'  },
            { key: 'orders',   label: 'TXN_LOG' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch('') }}
              className={`px-6 py-2.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all
                ${tab === t.key ? 'bg-white text-black font-bold shadow-md' : 'text-gray-500 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab !== 'orders' && (
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`QUERY_DATABASE(${tab.toUpperCase()})...`}
            className="w-full max-w-md bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-[10px] font-mono text-white placeholder-gray-700 outline-none transition-all mb-8 uppercase tracking-widest" />
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-[10px] tracking-widest uppercase text-gray-500 bg-[#121212] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-normal">IDENTIFIER</th>
                  <th className="px-6 py-4 font-normal">CONTACT</th>
                  <th className="px-6 py-4 font-normal">ACCESS_LEVEL</th>
                  <th className="px-6 py-4 font-normal">SYS_ADMIN</th>
                  <th className="px-6 py-4 font-normal">OPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs tracking-wider text-white truncate max-w-[150px]">{u.nombre}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 tracking-wider truncate max-w-[200px]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] tracking-widest px-3 py-1 rounded-full uppercase border ${u.tipo_usuario === 'vendedor' ? 'border-brand-500/30 text-brand-500 bg-brand-500/10' : 'border-white/20 text-gray-400 bg-white/5'}`}>
                        {u.tipo_usuario}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleAdmin(u.id, u.es_admin)}
                        className={`text-[9px] tracking-widest px-3 py-1 rounded-full uppercase border transition-colors ${u.es_admin ? 'border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-black' : 'border-white/20 text-gray-500 bg-transparent hover:border-white/50 hover:text-white'}`}>
                        {u.es_admin ? 'REVOKE_SUDO' : 'GRANT_SUDO'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteUser(u.id)}
                        className="text-[9px] tracking-widest text-red-500 group-hover:text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-black px-3 py-1 rounded-full transition-colors uppercase">
                        TERMINATE
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
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-[10px] tracking-widest uppercase text-gray-500 bg-[#121212] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-normal">ASSET</th>
                  <th className="px-6 py-4 font-normal">PROVIDER</th>
                  <th className="px-6 py-4 font-normal">EXCHANGE</th>
                  <th className="px-6 py-4 font-normal">RATING</th>
                  <th className="px-6 py-4 font-normal">OPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-8 h-8 object-cover rounded-lg grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all border border-white/10" />
                          : <div className="w-8 h-8 bg-[#121212] rounded-lg flex items-center justify-center text-xs opacity-50 border border-white/5">📦</div>
                        }
                        <span className="text-xs tracking-wider text-white truncate max-w-[150px]">{p.name}</span>
                        {p.featured && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest">PRIORITY</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">{p.usuarios?.nombre ?? 'NULL'}</td>
                    <td className="px-6 py-4 text-[#CCFF00] tracking-wider text-xs">${Number(p.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-500">{p.score?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => toggleFeatured(p.id, p.featured)}
                          className={`text-[9px] px-3 py-1 rounded-full border transition-colors uppercase tracking-widest
                            ${p.featured ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black' : 'text-gray-500 border-white/20 hover:border-white/50 hover:text-white'}`}>
                          {p.featured ? 'UNMARK' : 'MARK_PRIORITY'}
                        </button>
                        <button onClick={() => deleteProduct(p.id)}
                          className="text-[9px] text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-black px-3 py-1 rounded-full transition-colors uppercase tracking-widest">
                          DEL
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
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-[10px] tracking-widest uppercase text-gray-500 bg-[#121212] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-normal">TARGET_ASSET</th>
                  <th className="px-6 py-4 font-normal">BUYER_NODE</th>
                  <th className="px-6 py-4 font-normal">AMOUNT</th>
                  <th className="px-6 py-4 font-normal">SYS_STATE</th>
                  <th className="px-6 py-4 font-normal">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs text-white tracking-widest uppercase truncate max-w-[150px]">{o.products?.name ?? 'NULL'}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 tracking-widest uppercase truncate max-w-[150px]">{o.usuarios?.nombre ?? o.usuarios?.email ?? 'NULL'}</td>
                    <td className="px-6 py-4 text-[#CCFF00] tracking-widest text-xs">${Number(o.amount).toFixed(2)}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4 text-[10px] text-gray-600 tracking-widest uppercase">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
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
    entregado:         'bg-green-500/10 text-green-500 border-green-500/20',
    cancelado:         'bg-red-500/10 text-red-500 border-red-500/20',
    pendiente_pago:    'bg-white/5 text-gray-500 border-white/10',
  }
  const labels = {
    pendiente_entrega: 'PENDING_DELIVERY',
    entregado:         'VERIFIED_DELIVERED',
    cancelado:         'LOG_ABORTED',
    pendiente_pago:    'AWAITING_FUNDS',
  }
  return (
    <span className={`text-[9px] tracking-widest px-3 py-1 rounded-full border uppercase border flex-shrink-0 ${map[status] ?? 'bg-white/10 text-gray-500 border-white/20'}`}>
      {labels[status] ?? status}
    </span>
  )
}
