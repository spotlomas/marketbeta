import { useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

const emptyForm = { name: '', price: '', description: '', featured: false }
const BUCKET = 'productos'

export default function VendorPanel() {
  const { session } = useApp()
  const [products, setProducts]         = useState([])
  const [form, setForm]                 = useState(emptyForm)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [editing, setEditing]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const fileInputRef = useRef()

  useEffect(() => { fetchMyProducts() }, [])

  async function fetchMyProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })
    if (!error) setProducts(data)
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
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Sube la imagen y devuelve la URL pública
  async function uploadImage(productId) {
    if (!imageFile) return null

    const ext = imageFile.name.split('.').pop().toLowerCase()
    const path = `${session.user.id}/${productId}.${ext}`

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, imageFile, { upsert: true, contentType: imageFile.type })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    // Obtener URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    console.log('Image URL:', data.publicUrl)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      name:        form.name.trim(),
      price:       parseFloat(form.price),
      description: form.description.trim() || null,
      featured:    form.featured,
      seller_id:   session.user.id,
    }

    let productId = editing

    if (editing) {
      // --- EDITAR producto existente ---
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editing)

      if (updateError) {
        setError('Error al actualizar el producto.')
        setSaving(false)
        return
      }

      // Si hay imagen nueva, subirla y actualizar URL
      if (imageFile) {
        const imageUrl = await uploadImage(editing)
        if (imageUrl) {
          await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', editing)
        }
      }

    } else {
      // --- CREAR producto nuevo ---
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) {
        setError('Error al crear el producto.')
        setSaving(false)
        return
      }

      productId = newProduct.id

      // Si hay imagen, subirla y guardar URL en el mismo producto
      if (imageFile) {
        const imageUrl = await uploadImage(productId)
        if (imageUrl) {
          const { error: imgError } = await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', productId)

          if (imgError) {
            console.error('Error saving image_url:', imgError)
          }
        }
      }
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
      name:        product.name,
      price:       product.price,
      description: product.description || '',
      featured:    product.featured || false,
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

  return (
    <div className="space-y-8">

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {editing ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                name="name" value={form.name} onChange={handleChange} required
                placeholder="Ej: Calcetines de colores"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                name="price" type="number" step="0.01" min="0" value={form.price}
                onChange={handleChange} required placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Describe tu producto..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del producto</label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >✕</button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-2xl">
                  📷
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-block text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </label>
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG o WEBP — máx 5MB</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange}
              className="w-4 h-4 accent-brand-600" />
            <span className="text-sm text-gray-700">Destacar producto en Home</span>
          </label>

          {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

          <div className="flex gap-3">
            <button
              type="submit" disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Publicar producto'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit}
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
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
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🛍️</div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      {p.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0">⭐ Destacado</span>}
                    </div>
                    <p className="text-brand-600 font-bold text-sm mt-0.5">${Number(p.price).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)}
                    className="text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                    Editar
                  </button>
                  <button onClick={() => deleteProduct(p.id, p.image_url)}
                    className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
