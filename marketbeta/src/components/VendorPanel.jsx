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
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe pesar más de 5MB.'); return }
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
      if (error) { setError('Error al guardar. Intenta de nuevo.'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error) { setError('Error al crear el producto. Intenta de nuevo.'); setSaving(false); return }
      productId = data.id
    }

    if (imageFile) {
      const imageUrl = await uploadImage(productId)
      if (imageUrl) await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId)
    }

    setSuccess(editing ? 'Producto actualizado.' : 'Producto publicado.')
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
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return
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

  const inputBase = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border bg-gray-100 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border-gray-200 dark:border-white/10 focus:border-green-500 dark:focus:border-[#CCFF00]/50 hover:border-gray-300 dark:hover:border-white/30"

  return (
    <div className="space-y-12">
      {/* Editor */}
      <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
          {editing ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Nombre *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Nombre del producto"
                className={inputBase} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Precio *</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price}
                onChange={handleChange} required placeholder="0.00"
                className={inputBase} />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className={`${inputBase} appearance-none`}>
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe tu producto..." rows={3}
              className={`${inputBase} resize-none`} />
          </div>

          {/* Stock */}
          <div className="bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/10 p-5 rounded-2xl">
            <label className="block text-xs font-medium text-green-600 dark:text-[#CCFF00] mb-4 border-b border-gray-200 dark:border-white/5 pb-2">Inventario</label>
            <label className="flex items-center gap-3 cursor-pointer select-none mb-4 group">
              <input type="checkbox" name="stock_ilimitado" checked={form.stock_ilimitado} onChange={handleChange}
                className="w-4 h-4 accent-green-600 dark:accent-[#CCFF00] bg-transparent" />
              <span className="text-sm text-gray-700 dark:text-white group-hover:text-green-600 dark:group-hover:text-[#CCFF00] transition-colors">Stock ilimitado</span>
            </label>
            {!form.stock_ilimitado && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Unidades disponibles</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                  placeholder="0"
                  className={`${inputBase} bg-white dark:bg-black`} />
              </div>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-3">Imagen del producto</label>
            <div className="flex items-center gap-5">
              {imagePreview ? (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-2xl border border-gray-200 dark:border-white/10" />
                  <button type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-[10px] transition-colors">✕</button>
                </div>
              ) : (
                <div className="w-24 h-24 border border-gray-300 dark:border-white/10 border-dashed rounded-2xl flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-[#121212] flex-shrink-0 opacity-50">📷</div>
              )}
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer inline-block text-xs font-medium border border-green-400 dark:border-[#CCFF00]/50 hover:bg-green-50 dark:hover:bg-[#CCFF00]/10 text-green-600 dark:text-[#CCFF00] px-4 py-2 rounded-full transition-all">
                  {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                </label>
                <p className="text-[10px] text-gray-400 mt-2">JPG, PNG, WEBP — máx 5MB</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none border border-green-200 dark:border-[#CCFF00]/20 bg-green-50 dark:bg-[#CCFF00]/5 p-4 rounded-xl group hover:bg-green-100 dark:hover:bg-[#CCFF00]/10 transition-colors">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 accent-green-600 dark:accent-[#CCFF00]" />
            <span className="text-sm text-green-600 dark:text-[#CCFF00] font-medium">Marcar como destacado</span>
          </label>

          {error   && <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          {success && <p className="text-sm font-medium text-black dark:text-black bg-green-500 dark:bg-[#CCFF00] border border-green-400 rounded-xl px-4 py-3 font-bold">{success}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button type="submit" disabled={saving}
              className="flex-1 bg-green-600 dark:bg-[#CCFF00] hover:bg-green-700 dark:hover:bg-white disabled:opacity-30 text-white dark:text-black text-sm font-bold px-6 py-4 rounded-full transition-all shadow-lg">
              {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Publicar Producto'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit}
                className="flex-[0.5] text-gray-500 text-sm font-medium px-6 py-4 rounded-full border border-gray-200 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/50 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#121212]">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de productos */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          Mis Productos <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{products.length}</span>
        </h2>
        {loading ? (
          <div className="flex animate-pulse items-center gap-3">
            <p className="text-sm text-gray-400">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl p-10 text-center">
             <p className="text-sm text-gray-500">No tienes productos publicados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(p => (
              <div key={p.id} className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 p-5 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-2xl flex-shrink-0" />
                      : <div className="w-14 h-14 bg-gray-100 dark:bg-[#121212] rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border border-gray-200 dark:border-white/5 opacity-50">🛍️</div>
                    }
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                        {p.featured && <span className="text-[9px] border border-yellow-400 dark:border-yellow-500 text-yellow-500 px-1.5 py-0.5 rounded font-medium">Destacado</span>}
                        {p.categories && <span className="text-[9px] bg-gray-100 dark:bg-white/10 text-gray-500 px-1.5 py-0.5 rounded">{p.categories.emoji} {p.categories.name}</span>}
                      </div>
                      <p className="text-green-600 dark:text-[#CCFF00] font-bold text-sm">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="text-xs font-medium text-gray-600 dark:text-white hover:text-white dark:hover:text-black border border-gray-200 dark:border-white/20 hover:bg-gray-800 dark:hover:bg-white px-4 py-1.5 rounded-full transition-colors w-full">Editar</button>
                    <button onClick={() => deleteProduct(p.id, p.image_url)} className="text-xs font-medium text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-500 hover:text-white dark:hover:text-black px-4 py-1.5 rounded-full transition-colors w-full">Eliminar</button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-white/5 pt-4">
                  <span className="text-xs text-gray-500">Inventario:</span>
                  {p.stock_ilimitado ? (
                    <span className="text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 px-3 py-1 rounded-full border border-green-200 dark:border-green-500/20">Ilimitado</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))} className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-[#121212] hover:bg-green-500 dark:hover:bg-[#CCFF00] hover:text-white dark:hover:text-black border border-gray-200 dark:border-white/10 rounded-full text-sm transition-colors">−</button>
                      <span className={`text-sm font-bold w-6 text-center ${p.stock === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{p.stock}</span>
                      <button onClick={() => updateStock(p.id, p.stock + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-[#121212] hover:bg-green-500 dark:hover:bg-[#CCFF00] hover:text-white dark:hover:text-black border border-gray-200 dark:border-white/10 rounded-full text-sm transition-colors">+</button>
                      {p.stock === 0 && <span className="text-xs text-red-500 ml-2 animate-pulse font-medium">Agotado</span>}
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
