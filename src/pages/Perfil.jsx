import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'

const BUCKET = 'tiendas'

export default function Perfil() {
  const { usuario, setUsuario, session } = useApp()
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    nombre_tienda:      usuario?.nombre_tienda || '',
    descripcion_tienda: usuario?.descripcion_tienda || '',
  })
  const [logoFile, setLogoFile]       = useState(null)
  const [logoPreview, setLogoPreview] = useState(usuario?.imagen_tienda || null)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState('')
  const [error, setError]             = useState('')

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede pesar más de 5MB.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function uploadLogo() {
    if (!logoFile) return null
    const ext  = logoFile.name.split('.').pop().toLowerCase()
    const path = `${session.user.id}/logo.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })

    if (error) return null

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function saveStoreInfo(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    let imagen_tienda = usuario?.imagen_tienda || null

    if (logoFile) {
      const url = await uploadLogo()
      if (url) imagen_tienda = url
      else { setError('Error al subir la imagen.'); setSaving(false); return }
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update({
        nombre_tienda:      form.nombre_tienda.trim() || null,
        descripcion_tienda: form.descripcion_tienda.trim() || null,
        imagen_tienda,
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (!error && data) {
      setUsuario(data)
      setLogoFile(null)
      setSuccess('¡Guardado correctamente!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Error al guardar.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNav />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* User info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              {usuario?.tipo_usuario === 'vendedor' ? '🏪' : '👤'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{usuario?.nombre}</p>
              <p className="text-sm text-gray-500">{usuario?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                ${usuario?.tipo_usuario === 'vendedor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {usuario?.tipo_usuario}
              </span>
            </div>
          </div>
        </div>

        {/* Store info for sellers */}
        {usuario?.tipo_usuario === 'vendedor' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">🏪 Información de tu tienda</h2>

            <form onSubmit={saveStoreInfo} className="space-y-4">

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la tienda</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-20 h-20 object-cover rounded-2xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null)
                            setLogoPreview(usuario?.imagen_tienda || null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >✕</button>
                      </>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-3xl bg-gray-50">
                        🏪
                      </div>
                    )}
                  </div>

                  {/* Upload button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-block text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                    >
                      {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1.5">JPG, PNG o WEBP — máx 5MB</p>
                  </div>
                </div>
              </div>

              {/* Store name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda</label>
                <input
                  value={form.nombre_tienda}
                  onChange={e => setForm(p => ({ ...p, nombre_tienda: e.target.value }))}
                  placeholder="Ej: Tacos El Güero"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion_tienda}
                  onChange={e => setForm(p => ({ ...p, descripcion_tienda: e.target.value }))}
                  placeholder="Describe tu tienda en pocas palabras..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        )}

        {/* Seller quick links */}
        {usuario?.tipo_usuario === 'vendedor' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button onClick={() => navigate('/seller')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <span className="text-sm font-medium text-gray-800">📦 Mi Tienda</span>
              <span className="text-gray-400">→</span>
            </button>
            <button onClick={() => navigate('/punto-de-venta')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-800">🏪 Punto de Venta</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        )}

        {/* Admin link */}
        {usuario?.es_admin && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-red-100 transition-colors">
            <span className="text-sm font-medium text-red-700">⚙️ Panel Admin</span>
            <span className="text-red-400">→</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-2xl text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
