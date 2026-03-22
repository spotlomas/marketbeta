import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'

const BUCKET = 'tiendas'

export default function Perfil() {
  const { usuario, setUsuario, session, perfilIncompleto, setPerfilIncompleto, fetchCart } = useApp()
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    tipo_usuario:       '',
    numero_control:     '',
    edad:               '',
    curp:               '',
    escuela:            '',
    rfc:                '',
    tipo_pago:          '',
    nombre_tienda:      '',
    descripcion_tienda: '',
  })
  const [logoFile, setLogoFile]       = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState('')
  const [error, setError]             = useState('')

  useEffect(() => {
    if (usuario) {
      setForm({
        tipo_usuario:       usuario.tipo_usuario       || 'comprador',
        numero_control:     usuario.numero_control     || '',
        edad:               usuario.edad               || '',
        curp:               usuario.curp               || '',
        escuela:            usuario.escuela            || '',
        rfc:                usuario.rfc                || '',
        tipo_pago:          usuario.tipo_pago          || '',
        nombre_tienda:      usuario.nombre_tienda      || '',
        descripcion_tienda: usuario.descripcion_tienda || '',
      })
      setLogoPreview(usuario.imagen_tienda || null)
    }
  }, [usuario])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe pesar más de 5MB.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function uploadLogo() {
    if (!logoFile) return null
    const ext  = logoFile.name.split('.').pop().toLowerCase()
    const path = `${session.user.id}/logo.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (error) return null
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!form.numero_control || !form.edad) {
      setError('Número de control y edad son requeridos.')
      setSaving(false)
      return
    }
    if (form.tipo_usuario === 'vendedor' && (!form.curp || !form.escuela)) {
      setError('CURP y Escuela son obligatorios para vendedores.')
      setSaving(false)
      return
    }

    let imagen_tienda = usuario?.imagen_tienda || null
    if (logoFile) {
      const url = await uploadLogo()
      if (url) imagen_tienda = url
    }

    const { data, error: dbError } = await supabase
      .from('usuarios')
      .update({
        tipo_usuario:       form.tipo_usuario,
        numero_control:     form.numero_control.trim(),
        edad:               parseInt(form.edad),
        curp:               form.tipo_usuario === 'vendedor' ? form.curp.trim().toUpperCase() : null,
        escuela:            form.tipo_usuario === 'vendedor' ? form.escuela.trim() : null,
        rfc:                form.rfc.trim() || null,
        tipo_pago:          form.tipo_pago || null,
        nombre_tienda:      form.nombre_tienda.trim() || null,
        descripcion_tienda: form.descripcion_tienda.trim() || null,
        imagen_tienda,
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (!dbError && data) {
      setUsuario(data)
      setLogoFile(null)
      const incompleto = !data.numero_control || data.numero_control === '' || data.edad === null || data.edad === undefined
      setPerfilIncompleto(incompleto)
      if (!incompleto) await fetchCart(session.user.id)
      setSuccess(incompleto ? 'Guardado correctamente.' : 'Perfil completado. ¡Bienvenido!')
      setTimeout(() => setSuccess(''), 4000)
    } else {
      setError('Error al guardar. Por favor, intenta de nuevo.')
    }
    setSaving(false)
  }

  const esVendedor = form.tipo_usuario === 'vendedor'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-inter pb-32">
      <TopNav />

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Banner perfil incompleto */}
        {perfilIncompleto && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
            <span className="text-3xl text-orange-500">⚠️</span>
            <div>
              <p className="text-sm font-bold text-orange-800">Perfil Incompleto</p>
              <p className="text-xs font-medium text-orange-600 mt-0.5">
                Por favor, completa los campos marcados con * para continuar.
              </p>
            </div>
          </div>
        )}

        {/* User info */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {session?.user?.user_metadata?.avatar_url
              ? <img src={session.user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-2xl text-gray-400">{esVendedor ? '🏪' : '👤'}</span>
            }
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900 leading-tight">{usuario?.nombre || session?.user?.user_metadata?.full_name || 'Usuario Invitado'}</p>
            <p className="text-sm text-gray-500 font-medium">{session?.user?.email}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-xl text-gray-900 mb-2 border-b border-gray-100 pb-4">
            {perfilIncompleto ? 'Completa tu información' : 'Configuración de cuenta'}
          </h2>

          <form onSubmit={saveProfile} className="space-y-6 mt-6">

            {/* Tipo de cuenta */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">TIPO DE CUENTA</label>
              <div className="grid grid-cols-2 gap-3">
                {['comprador', 'vendedor'].map(tipo => (
                  <button key={tipo} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo_usuario: tipo }))}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm
                      ${form.tipo_usuario === tipo
                        ? 'border border-gray-900 bg-gray-900 text-white'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}>
                    <span className="text-2xl">{tipo === 'comprador' ? '🛒' : '🏪'}</span>
                    <span className="capitalize">{tipo}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  No. Control {perfilIncompleto && !form.numero_control && <span className="text-red-500">*</span>}
                </label>
                <input value={form.numero_control}
                  onChange={e => setForm(p => ({ ...p, numero_control: e.target.value }))}
                  placeholder="21XXXXXX"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all
                    ${perfilIncompleto && !form.numero_control ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-gray-400 focus:bg-white'}`} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Edad {perfilIncompleto && !form.edad && <span className="text-red-500">*</span>}
                </label>
                <input type="number" value={form.edad} min="15" max="99"
                  onChange={e => setForm(p => ({ ...p, edad: e.target.value }))}
                  placeholder="20"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all
                    ${perfilIncompleto && !form.edad ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-gray-400 focus:bg-white'}`} />
              </div>
            </div>

            {/* Campos vendedor */}
            {esVendedor && (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-5">
                <p className="font-bold text-sm text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-3">Información de Vendedor</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    CURP {perfilIncompleto && !form.curp && <span className="text-red-500">*</span>}
                  </label>
                  <input value={form.curp} maxLength={18}
                    onChange={e => setForm(p => ({ ...p, curp: e.target.value }))}
                    placeholder="Tu CURP"
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all
                      ${perfilIncompleto && !form.curp ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'}`} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Escuela {perfilIncompleto && !form.escuela && <span className="text-red-500">*</span>}
                  </label>
                  <input value={form.escuela}
                    onChange={e => setForm(p => ({ ...p, escuela: e.target.value }))}
                    placeholder="Instituto Tecnológico..."
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all
                      ${perfilIncompleto && !form.escuela ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'}`} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">RFC (Opcional)</label>
                  <input value={form.rfc} onChange={e => setForm(p => ({ ...p, rfc: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Método de Pago Preferido</label>
                  <select value={form.tipo_pago} onChange={e => setForm(p => ({ ...p, tipo_pago: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400 transition-all">
                    <option value="">Selecciona uno...</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {/* Tienda */}
                <div className="border-t border-gray-200 pt-5 mt-2">
                  <p className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-4">Perfil Público de Tienda</p>

                  <div className="flex items-center gap-5 mb-5">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo" className="w-20 h-20 object-cover rounded-2xl border border-gray-200 shadow-sm" />
                          <button type="button"
                            onClick={() => { setLogoFile(null); setLogoPreview(usuario?.imagen_tienda || null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-sm transition-colors text-xs">✕</button>
                        </>
                      ) : (
                        <div className="w-20 h-20 border border-gray-300 border-dashed bg-gray-50 rounded-2xl flex items-center justify-center text-3xl opacity-50">🏪</div>
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer inline-block text-xs font-bold uppercase tracking-wide bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full shadow-sm transition-colors">
                        {logoPreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </label>
                      <p className="text-[10px] font-medium text-gray-500 mt-2">JPG o PNG (Máx 5MB)</p>
                    </div>
                  </div>

                  <input value={form.nombre_tienda} onChange={e => setForm(p => ({ ...p, nombre_tienda: e.target.value }))}
                    placeholder="Nombre de la tienda" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 mb-4 transition-all" />

                  <textarea value={form.descripcion_tienda} onChange={e => setForm(p => ({ ...p, descripcion_tienda: e.target.value }))}
                    placeholder="Describe lo que vendes..." rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 resize-none transition-all" />
                </div>
              </div>
            )}

            {error   && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">{error}</p>}
            {success && <p className="text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">{success}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-food-500 hover:bg-food-600 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-full transition-all text-sm shadow-sm mt-4">
              {saving ? 'Guardando...' : perfilIncompleto ? 'Completar Registro' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Links vendedor */}
        {esVendedor && !perfilIncompleto && (
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-lg mt-8">
            <button onClick={() => navigate('/seller')}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-800 transition-colors border-b border-gray-800 group">
              <span className="text-sm font-bold text-brand-500">📦 Panel de Vendedor</span>
              <span className="text-gray-500 group-hover:text-brand-500 transition-colors">→</span>
            </button>
            <button onClick={() => navigate('/punto-de-venta')}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-800 transition-colors group">
              <span className="text-sm font-bold text-brand-500">🏪 Punto de Venta (POS)</span>
              <span className="text-gray-500 group-hover:text-brand-500 transition-colors">→</span>
            </button>
          </div>
        )}

        {usuario?.es_admin && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-red-50 border border-red-100 rounded-full px-6 py-4 flex items-center justify-between hover:bg-red-100 transition-colors mt-8 group shadow-sm">
            <span className="text-sm font-bold text-red-600">⚙️ Panel de Administrador</span>
            <span className="text-red-300 group-hover:text-red-600 transition-colors">→</span>
          </button>
        )}

        <button onClick={handleLogout}
          className="w-full border border-gray-200 hover:bg-gray-100 hover:text-red-600 text-gray-500 font-bold py-4 rounded-full text-sm transition-all mt-12 bg-white shadow-sm">
          Cerrar Sesión
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
