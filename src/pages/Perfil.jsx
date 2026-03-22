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

  const inputBase = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border bg-gray-100 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
  const inputNormal = `${inputBase} border-gray-200 dark:border-white/5 focus:border-green-500 dark:focus:border-[#CCFF00]/50`
  const inputError  = `${inputBase} border-red-300 dark:border-red-500/50 focus:border-red-500 bg-red-50 dark:bg-red-950/10`

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-inter pb-32 transition-colors relative">
      <div className="relative z-10">
        <TopNav />
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-8 relative z-10">

        {/* Banner perfil incompleto */}
        {perfilIncompleto && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-3xl p-5 flex gap-5 items-center">
            <span className="text-3xl text-orange-500 animate-pulse">⚠️</span>
            <div>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Perfil incompleto</p>
              <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                Completa tus datos para poder comprar
              </p>
            </div>
          </div>
        )}

        {/* Info del usuario */}
        <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-[2rem] p-6 border border-gray-200 dark:border-white/5 flex items-center gap-5">
          <div className="w-20 h-20 bg-gray-100 dark:bg-[#121212] rounded-[1.5rem] border border-green-200 dark:border-[#CCFF00]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {session?.user?.user_metadata?.avatar_url
              ? <img src={session.user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-3xl text-gray-400 opacity-50">{esVendedor ? '🏪' : '👤'}</span>
            }
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900 dark:text-white">{usuario?.nombre || session?.user?.user_metadata?.full_name || 'Usuario'}</p>
            <p className="text-xs text-gray-400 mt-1 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-white/5 px-3 py-1 rounded w-fit">{session?.user?.email}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-[2rem] p-6 md:p-8 border border-gray-200 dark:border-white/5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-white/10 pb-4">
            {perfilIncompleto ? 'Completa tu Perfil' : 'Ajustes de Cuenta'}
          </h2>

          <form onSubmit={saveProfile} className="space-y-6 mt-6">

            {/* Tipo de cuenta */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-3">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                {['comprador', 'vendedor'].map(tipo => (
                  <button key={tipo} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo_usuario: tipo }))}
                    className={`flex flex-col items-center justify-center gap-3 py-5 rounded-[1.5rem] text-xs font-medium transition-all
                      ${form.tipo_usuario === tipo
                        ? 'border border-green-500 dark:border-[#CCFF00] bg-green-50 dark:bg-[#CCFF00]/10 text-green-600 dark:text-[#CCFF00]'
                        : 'border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-[#121212] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}>
                    <span className="text-3xl opacity-80">{tipo === 'comprador' ? '🛒' : '🏪'}</span>
                    <span className="mt-1">{tipo === 'comprador' ? 'Comprador' : 'Vendedor'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                  <span>No. de Control</span>
                  {perfilIncompleto && !form.numero_control && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                </label>
                <input value={form.numero_control}
                  onChange={e => setForm(p => ({ ...p, numero_control: e.target.value }))}
                  placeholder="21XXXXXX"
                  className={perfilIncompleto && !form.numero_control ? inputError : inputNormal} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                  <span>Edad</span>
                  {perfilIncompleto && !form.edad && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                </label>
                <input type="number" value={form.edad} min="15" max="99"
                  onChange={e => setForm(p => ({ ...p, edad: e.target.value }))}
                  placeholder="20"
                  className={perfilIncompleto && !form.edad ? inputError : inputNormal} />
              </div>
            </div>

            {/* Campos vendedor */}
            {esVendedor && (
              <div className="bg-gray-100 dark:bg-[#121212] p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 space-y-6">
                <p className="text-sm font-bold text-green-600 dark:text-[#CCFF00] border-b border-gray-200 dark:border-white/5 pb-3">Datos de Vendedor</p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                    <span>CURP</span>
                    {perfilIncompleto && !form.curp && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                  </label>
                  <input value={form.curp} maxLength={18}
                    onChange={e => setForm(p => ({ ...p, curp: e.target.value }))}
                    placeholder="Ingresa tu CURP"
                    className={`${perfilIncompleto && !form.curp ? inputError : inputNormal} uppercase`} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center justify-between">
                    <span>Escuela</span>
                    {perfilIncompleto && !form.escuela && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                  </label>
                  <input value={form.escuela}
                    onChange={e => setForm(p => ({ ...p, escuela: e.target.value }))}
                    placeholder="Nombre de tu escuela"
                    className={perfilIncompleto && !form.escuela ? inputError : inputNormal} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">RFC (Opcional)</label>
                  <input value={form.rfc} onChange={e => setForm(p => ({ ...p, rfc: e.target.value }))}
                    placeholder="Opcional"
                    className={inputNormal} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Método de Pago</label>
                  <select value={form.tipo_pago} onChange={e => setForm(p => ({ ...p, tipo_pago: e.target.value }))}
                    className={`${inputNormal} appearance-none`}>
                    <option value="">Seleccionar...</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {/* Tienda */}
                <div className="border-t border-gray-200 dark:border-white/5 pt-6 mt-2">
                  <p className="text-sm font-bold text-green-600 dark:text-[#CCFF00] mb-6">Mi Tienda</p>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {logoPreview ? (
                        <>
                          <div className="w-full h-full bg-white dark:bg-[#121212] rounded-[2rem] shadow-md overflow-hidden">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-[2rem]" />
                          </div>
                          <button type="button"
                            onClick={() => { setLogoFile(null); setLogoPreview(usuario?.imagen_tienda || null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="absolute -top-3 -right-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md transition-colors text-sm">✕</button>
                        </>
                      ) : (
                        <div className="w-full h-full border border-gray-300 dark:border-white/10 border-dashed bg-gray-50 dark:bg-[#050505] rounded-[2rem] flex items-center justify-center text-3xl opacity-30">🏪</div>
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer inline-block text-xs font-medium bg-gray-200 dark:bg-[#1a1a1a] hover:bg-green-50 dark:hover:bg-[#CCFF00]/10 border border-gray-300 dark:border-white/5 hover:border-green-300 dark:hover:border-[#CCFF00]/30 text-gray-700 dark:text-white px-5 py-3 rounded-full transition-colors">
                        {logoPreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </label>
                      <p className="text-[10px] text-gray-400 mt-3">JPG/PNG (máx 5MB)</p>
                    </div>
                  </div>

                  <input value={form.nombre_tienda} onChange={e => setForm(p => ({ ...p, nombre_tienda: e.target.value }))}
                    placeholder="Nombre de la tienda" className={`${inputNormal} mb-4`} />

                  <textarea value={form.descripcion_tienda} onChange={e => setForm(p => ({ ...p, descripcion_tienda: e.target.value }))}
                    placeholder="Descripción de la tienda..." rows={3}
                    className={`${inputNormal} resize-none`} />
                </div>
              </div>
            )}

            {error   && <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-4 text-center">{error}</p>}
            {success && <p className="text-sm font-medium text-green-600 dark:text-[#CCFF00] bg-green-50 dark:bg-[#CCFF00]/10 border border-green-200 dark:border-[#CCFF00]/30 rounded-xl px-4 py-4 text-center">{success}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-green-600 dark:bg-[#CCFF00] hover:bg-green-700 dark:hover:bg-[#b3ff00] disabled:opacity-30 text-white dark:text-black font-bold py-4 rounded-full transition-all text-sm shadow-lg mt-8">
              {saving ? 'Guardando...' : perfilIncompleto ? 'Completar Perfil' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Links vendedor */}
        {esVendedor && !perfilIncompleto && (
          <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden mt-10">
            <button onClick={() => navigate('/seller')}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-gray-100 dark:hover:bg-[#121212] transition-colors border-b border-gray-200 dark:border-white/5 group">
              <span className="text-sm font-bold text-green-600 dark:text-[#CCFF00] flex items-center gap-3">
                 <span className="text-xl">📦</span> Panel de Vendedor
              </span>
              <span className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-[#CCFF00] transition-colors">→</span>
            </button>
            <button onClick={() => navigate('/punto-de-venta')}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-gray-100 dark:hover:bg-[#121212] transition-colors group">
              <span className="text-sm font-bold text-green-600 dark:text-[#CCFF00] flex items-center gap-3">
                 <span className="text-xl">🏪</span> Punto de Venta
              </span>
              <span className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-[#CCFF00] transition-colors">→</span>
            </button>
          </div>
        )}

        {usuario?.es_admin && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-full px-8 py-5 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors mt-10 group">
            <span className="text-sm font-bold text-red-500">⚙️ Panel de Administrador</span>
            <span className="text-red-300 group-hover:text-red-500 transition-colors">→</span>
          </button>
        )}

        <button onClick={handleLogout}
          className="w-full border border-gray-200 dark:border-white/10 hover:border-red-300 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/5 text-gray-400 hover:text-red-500 font-bold py-5 rounded-full text-sm transition-all mt-16 bg-gray-50 dark:bg-[#0A0A0A]">
          Cerrar Sesión
        </button>
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  )
}
