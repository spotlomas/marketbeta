import { useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

const emptyForm = { name: '', price: '', description: '', featured: false, stock: '', stock_ilimitado: true, category_id: '' }
const BUCKET = 'productos'

export default function VendorPanel() {
  const { session } = useApp()
  const [products, setProducts]         = useState([])
  const [categories, setCategories]     = useState([])
  const [form, setForm]                 = useState(emptyForm)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [editing, setEditing]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const fileInputRef = useRef()

  useEffect(() => { fetchMyProducts(); fetchCategories() }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').eq('active', true).order('position')
    if (data) setCategories(data)
  }

  async function fetchMyProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, emoji)')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: val }))
    setError('')
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('IMAGE MAY NOT EXCEED 5MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(productId) {
    if (!imageFile) return null
    const ext = imageFile.name.split('.').pop().toLowerCase()
    const path = `${session.user.id}/${productId}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, imageFile, { upsert: true, contentType: imageFile.type })
    if (error) return null
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      name:            form.name.trim(),
      price:           parseFloat(form.price),
      description:     form.description.trim() || null,
      featured:        form.featured,
      seller_id:       session.user.id,
      stock:           form.stock_ilimitado ? 0 : parseInt(form.stock) || 0,
      stock_ilimitado: form.stock_ilimitado,
      category_id:     form.category_id || null,
    }

    let productId = editing

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing)
      if (error) { setError('SYNC ERROR. PLEASE RETRY.'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error) { setError('ALLOCATION ERROR. PLEASE RETRY.'); setSaving(false); return }
      productId = data.id
    }

    if (imageFile) {
      const imageUrl = await uploadImage(productId)
      if (imageUrl) await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId)
    }

    setSuccess(editing ? 'ASSET UPDATED.' : 'ASSET DEPLOYED.')
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setEditing(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await fetchMyProducts()
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  function startEdit(product) {
    setEditing(product.id)
    setForm({
      name:            product.name,
      price:           product.price,
      description:     product.description || '',
      featured:        product.featured || false,
      stock:           product.stock || 0,
      stock_ilimitado: product.stock_ilimitado ?? true,
      category_id:     product.category_id || '',
    })
    setImagePreview(product.image_url || null)
    setImageFile(null)
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteProduct(id, imageUrl) {
    if (!confirm('INITIATE DELETE SEQUENCE?')) return
    if (imageUrl) {
      const parts = imageUrl.split(`/${BUCKET}/`)
      if (parts[1]) await supabase.storage.from(BUCKET).remove([parts[1]])
    }
    await supabase.from('products').delete().eq('id', id)
    fetchMyProducts()
  }

  async function updateStock(id, newStock) {
    await supabase.from('products').update({ stock: parseInt(newStock) || 0 }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: parseInt(newStock) || 0 } : p))
  }

  return (
    <div className="space-y-12">
      {/* Editor Section */}
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 md:p-8">
        <h2 className="text-xl font-dot tracking-widest text-[#CCFF00] uppercase mb-6 border-b border-white/10 pb-4">
          {editing ? 'MODIFY_ASSET' : 'DEPLOY_NEW_ASSET'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">IDENTIFIER *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Item designation"
                className="w-full bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">EXCHANGE_VALUE *</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price}
                onChange={handleChange} required placeholder="0.00"
                className="w-full bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all" />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">NODE_CATEGORY</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-sm font-mono text-white outline-none appearance-none transition-all">
              <option value="">UNCATEGORIZED</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">ASSET_MANIFEST</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Detailed specifications..." rows={3}
              className="w-full bg-[#121212] border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none resize-none transition-all" />
          </div>

          {/* Stock */}
          <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-brand-500 mb-4 border-b border-brand-500/20 pb-2">SUPPLY_CHAIN_PARAMETERS</label>
            <label className="flex items-center gap-3 cursor-pointer select-none mb-4 group">
              <input type="checkbox" name="stock_ilimitado" checked={form.stock_ilimitado} onChange={handleChange}
                className="w-4 h-4 accent-[#CCFF00] bg-transparent border-white/30" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white group-hover:text-brand-500 transition-colors">INFINITE_SUPPLY</span>
            </label>
            {!form.stock_ilimitado && (
              <div className="animate-[fade-in_0.2s_ease-out]">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">AVAILABLE_UNITS</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-black border border-white/10 hover:border-white/30 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all" />
              </div>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-3">VISUAL_ASSET</label>
            <div className="flex items-center gap-5">
              {imagePreview ? (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all" />
                  <button type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-mono transition-colors">✕</button>
                </div>
              ) : (
                <div className="w-24 h-24 border border-white/10 border-dashed rounded-2xl flex items-center justify-center text-gray-500 bg-[#121212] flex-shrink-0 opacity-50">📷</div>
              )}
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer inline-block text-[10px] font-mono tracking-widest uppercase border border-brand-500 hover:bg-brand-500 text-brand-500 hover:text-black hover:font-bold px-4 py-2 rounded-full transition-all">
                  {imagePreview ? 'REPLACE MEDIA' : 'UPLOAD MEDIA'}
                </label>
                <p className="text-[9px] text-gray-600 mt-2 font-mono uppercase tracking-widest">JPG, PNG, WEBP — MAX 5MB</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none border border-brand-500/20 bg-brand-500/5 p-4 rounded-xl group hover:bg-brand-500/10 transition-colors">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 accent-[#CCFF00]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-500">TAG: PRIORITY_FEATURED</span>
          </label>

          {error   && <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          {success && <p className="text-[10px] font-mono tracking-widest uppercase text-black font-bold bg-[#CCFF00] border border-brand-400 rounded-xl px-4 py-3">{success}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#CCFF00] hover:bg-brand-400 disabled:bg-white/10 disabled:text-gray-500 text-black text-[11px] font-mono font-bold tracking-widest uppercase px-6 py-4 rounded-full transition-colors shadow-[0_0_15px_rgba(204,255,0,0.15)] disabled:shadow-none">
              {saving ? 'PROCESSING...' : editing ? 'COMMIT_CHANGES' : 'EXECUTE_PUBLISH'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit}
                className="flex-[0.5] text-gray-400 text-[11px] font-mono tracking-widest uppercase px-6 py-4 rounded-full border border-white/20 hover:border-white/50 hover:text-white transition-colors bg-[#121212]">
                ABORT
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product list */}
      <div>
        <h2 className="text-xl font-dot tracking-widest text-white uppercase mb-6 flex items-center gap-3">
          ACTIVE_INVENTORY <span className="text-[10px] font-mono text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">{products.length}</span>
        </h2>
        {loading ? (
          <div className="flex animate-pulse items-center gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-brand-500">Querying registry...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-10 text-center">
             <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500">Inventory registry empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(p => (
              <div key={p.id} className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-2xl flex-shrink-0 grayscale opacity-80" />
                      : <div className="w-14 h-14 bg-[#121212] rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border border-white/5 opacity-50">🛍️</div>
                    }
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-white truncate">{p.name}</p>
                        {p.featured && <span className="text-[8px] border border-yellow-500 text-yellow-500 px-1.5 py-0.5 rounded uppercase tracking-widest">FEATURED</span>}
                        {p.categories && <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{p.categories.emoji} {p.categories.name}</span>}
                      </div>
                      <p className="text-[#CCFF00] font-mono tracking-widest text-sm">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="text-[9px] font-mono text-white hover:text-black border border-white/20 hover:bg-white hover:border-white px-4 py-1.5 rounded-full uppercase tracking-widest transition-colors w-full">EDIT</button>
                    <button onClick={() => deleteProduct(p.id, p.image_url)} className="text-[9px] font-mono text-red-500 hover:text-black border border-red-500/30 hover:bg-red-500 hover:border-red-500 px-4 py-1.5 rounded-full uppercase tracking-widest transition-colors w-full">DEL</button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">INVENTORY_STATE:</span>
                  {p.stock_ilimitado ? (
                    <span className="text-[9px] font-mono tracking-widest uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">INFINITE_OVR</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))} className="w-6 h-6 flex items-center justify-center bg-[#121212] hover:bg-brand-500 hover:text-black border border-white/10 rounded-full font-mono text-sm transition-colors">−</button>
                      <span className={`text-xs font-mono w-6 text-center tracking-widest ${p.stock === 0 ? 'text-red-500' : 'text-white'}`}>{p.stock}</span>
                      <button onClick={() => updateStock(p.id, p.stock + 1)} className="w-6 h-6 flex items-center justify-center bg-[#121212] hover:bg-brand-500 hover:text-black border border-white/10 rounded-full font-mono text-sm transition-colors">+</button>
                      {p.stock === 0 && <span className="text-[9px] font-mono tracking-widest uppercase text-red-500 ml-2 animate-pulse">DEPLETED</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
