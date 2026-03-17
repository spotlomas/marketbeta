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
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede pesar más de 5MB.'); return }
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
      if (error) { setError('Error al actualizar.'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error) { setError('Error al crear el producto.'); setSaving(false); return }
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
    if (!confirm('¿Eliminar este producto?')) return
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
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {editing ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Ej: Tacos de pastor"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price}
                onChange={handleChange} required placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe tu producto..." rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inventario</label>
            <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
              <input type="checkbox" name="stock_ilimitado" checked={form.stock_ilimitado} onChange={handleChange}
                className="w-4 h-4 accent-brand-600" />
              <span className="text-sm text-gray-700">Stock ilimitado</span>
            </label>
            {!form.stock_ilimitado && (
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                placeholder="Cantidad disponible"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del producto</label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                  <button type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-2xl">📷</div>
              )}
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer inline-block text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                  {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </label>
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG o WEBP — máx 5MB</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm text-gray-700">Marcar como destacado</span>
          </label>

          {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Publicar'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit}
                className="text-sm text-gray-600 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mis productos</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-400">Aún no tienes productos publicados.</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🛍️</div>
                    }
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        {p.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0">⭐</span>}
                        {p.categories && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{p.categories.emoji} {p.categories.name}</span>}
                      </div>
                      <p className="text-brand-600 font-bold text-sm">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">Editar</button>
                    <button onClick={() => deleteProduct(p.id, p.image_url)} className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">Eliminar</button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">Stock:</span>
                  {p.stock_ilimitado ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ilimitado</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))} className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs">−</button>
                      <span className={`text-sm font-medium w-8 text-center ${p.stock === 0 ? 'text-red-600' : 'text-gray-800'}`}>{p.stock}</span>
                      <button onClick={() => updateStock(p.id, p.stock + 1)} className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs">+</button>
                      {p.stock === 0 && <span className="text-xs text-red-500">Sin stock</span>}
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
