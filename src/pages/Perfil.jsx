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
    <div className="min-h-screen bg-[#050505] text-white font-inter pb-32 transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#CCFF00]/10 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        <TopNav />
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-8 relative z-10">

        {/* Banner perfil incompleto */}
        {perfilIncompleto && (
          <div className="bg-orange-950/30 border border-orange-900/50 rounded-3xl p-5 flex gap-5 items-center shadow-[0_0_20px_rgba(255,165,0,0.1)]">
            <span className="text-3xl text-orange-500 animate-pulse">⚠️</span>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#CCFF00]">INCOMPLETE_USER_PROFILE</p>
              <p className="text-[9px] font-mono tracking-widest text-orange-400 mt-1 uppercase">
                REQUIRED_DATA_MISSING_FOR_OPERATION
              </p>
            </div>
          </div>
        )}

        {/* User info */}
        <div className="bg-[#0A0A0A] rounded-[2rem] p-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-5">
          <div className="w-20 h-20 bg-[#121212] rounded-[1.5rem] border border-[#CCFF00]/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
            {session?.user?.user_metadata?.avatar_url
              ? <img src={session.user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-3xl text-gray-500 opacity-50">{esVendedor ? '🏪' : '👤'}</span>
            }
          </div>
          <div>
            <p className="font-mono font-bold text-lg tracking-wider text-white uppercase">{usuario?.nombre || session?.user?.user_metadata?.full_name || 'GUEST_USER'}</p>
            <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mt-1 opacity-70 border bg-[#121212] border-white/5 px-3 py-1 rounded w-fit">{session?.user?.email}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-[#0A0A0A] rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h2 className="font-mono text-[11px] text-[#CCFF00] uppercase tracking-widest mb-2 border-b border-white/10 pb-4">
            {perfilIncompleto ? 'SYSTEM_CONFIGURATION_REQUIREMENT' : 'ACCOUNT_PREFERENCES'}
          </h2>

          <form onSubmit={saveProfile} className="space-y-6 mt-6">

            {/* Tipo de cuenta */}
            <div>
              <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">USER_CLASS</label>
              <div className="grid grid-cols-2 gap-3">
                {['comprador', 'vendedor'].map(tipo => (
                  <button key={tipo} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo_usuario: tipo }))}
                    className={`flex flex-col items-center justify-center gap-3 py-5 rounded-[1.5rem] text-[10px] font-mono uppercase tracking-widest transition-all
                      ${form.tipo_usuario === tipo
                        ? 'border border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.1)]'
                        : 'border border-white/5 bg-[#121212] hover:bg-[#1a1a1a] text-gray-500 hover:text-white'
                      }`}>
                    <span className="text-3xl opacity-80">{tipo === 'comprador' ? '🛒' : '🏪'}</span>
                    <span className="mt-1">{tipo === 'comprador' ? 'BUYER' : 'MERCHANT'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                  <span>ID_CONTROL</span>
                  {perfilIncompleto && !form.numero_control && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                </label>
                <input value={form.numero_control}
                  onChange={e => setForm(p => ({ ...p, numero_control: e.target.value }))}
                  placeholder="21XXXXXX"
                  className={`w-full bg-[#121212] rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none transition-all uppercase tracking-widest border
                    ${perfilIncompleto && !form.numero_control ? 'border-red-500/50 focus:border-red-500 bg-red-950/10' : 'border-white/5 focus:border-[#CCFF00]/50'}`} />
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                  <span>AGE_PARAM</span>
                  {perfilIncompleto && !form.edad && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                </label>
                <input type="number" value={form.edad} min="15" max="99"
                  onChange={e => setForm(p => ({ ...p, edad: e.target.value }))}
                  placeholder="20"
                  className={`w-full bg-[#121212] rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none transition-all uppercase tracking-widest border
                    ${perfilIncompleto && !form.edad ? 'border-red-500/50 focus:border-red-500 bg-red-950/10' : 'border-white/5 focus:border-[#CCFF00]/50'}`} />
              </div>
            </div>

            {/* Campos vendedor */}
            {esVendedor && (
              <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5 space-y-6">
                <p className="font-mono font-bold text-[10px] text-[#CCFF00] uppercase tracking-[0.2em] border-b border-white/5 pb-3">MERCHANT_REGISTRY</p>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                    <span>GOV_ID (CURP)</span>
                    {perfilIncompleto && !form.curp && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                  </label>
                  <input value={form.curp} maxLength={18}
                    onChange={e => setForm(p => ({ ...p, curp: e.target.value }))}
                    placeholder="ENTER_CURP"
                    className={`w-full bg-[#050505] rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none transition-all uppercase tracking-widest border
                      ${perfilIncompleto && !form.curp ? 'border-red-500/50 focus:border-red-500 bg-red-950/10' : 'border-white/5 focus:border-[#CCFF00]/50'}`} />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                    <span>ACADEMIC_INSTITUTION</span>
                    {perfilIncompleto && !form.escuela && <span className="text-red-500 animate-pulse text-lg leading-none">*</span>}
                  </label>
                  <input value={form.escuela}
                    onChange={e => setForm(p => ({ ...p, escuela: e.target.value }))}
                    placeholder="INSTITUTE_NAME"
                    className={`w-full bg-[#050505] rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none transition-all uppercase tracking-widest border
                      ${perfilIncompleto && !form.escuela ? 'border-red-500/50 focus:border-red-500 bg-red-950/10' : 'border-white/5 focus:border-[#CCFF00]/50'}`} />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">FISCAL_ID_RFC (OPTIONAL)</label>
                  <input value={form.rfc} onChange={e => setForm(p => ({ ...p, rfc: e.target.value }))}
                    placeholder="OPTIONAL"
                    className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none focus:border-[#CCFF00]/50 transition-all uppercase tracking-widest" />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">PAYMENT_GATEWAY</label>
                  <select value={form.tipo_pago} onChange={e => setForm(p => ({ ...p, tipo_pago: e.target.value }))}
                    className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-mono text-white outline-none focus:border-[#CCFF00]/50 transition-all uppercase tracking-widest appearance-none">
                    <option value="">SELECT_METHOD...</option>
                    <option value="transferencia">BANK_TRANSFER</option>
                    <option value="efectivo">CASH_ON_DELIVERY</option>
                    <option value="paypal">PAYPAL</option>
                  </select>
                </div>

                {/* Tienda */}
                <div className="border-t border-white/5 pt-6 mt-2">
                  <p className="font-mono font-bold text-[10px] text-[#CCFF00] uppercase tracking-[0.2em] mb-6">PUBLIC_STOREFRONT</p>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {logoPreview ? (
                        <>
                          <div className="w-full h-full bg-white p-2 rounded-[2rem] shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-[1.5rem]" />
                          </div>
                          <button type="button"
                            onClick={() => { setLogoFile(null); setLogoPreview(usuario?.imagen_tienda || null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="absolute -top-3 -right-3 bg-[#0A0A0A] border border-[#CCFF00]/50 text-gray-400 hover:text-[#CCFF00] rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg transition-colors text-sm">✕</button>
                        </>
                      ) : (
                        <div className="w-full h-full border border-white/10 border-dashed bg-[#050505] rounded-[2rem] flex items-center justify-center text-3xl opacity-30">🏪</div>
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer inline-block text-[9px] font-mono font-bold uppercase tracking-widest bg-[#1a1a1a] hover:bg-[#CCFF00]/10 border border-white/5 hover:border-[#CCFF00]/30 text-white px-5 py-3 rounded-full transition-colors focus:ring">
                        {logoPreview ? 'UPDATE_IMAGE' : 'UPLOAD_IMAGE'}
                      </label>
                      <p className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mt-3">JPG/PNG (MAX 5MB)</p>
                    </div>
                  </div>

                  <input value={form.nombre_tienda} onChange={e => setForm(p => ({ ...p, nombre_tienda: e.target.value }))}
                    placeholder="STORE_NAME" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none focus:border-[#CCFF00]/50 mb-4 transition-all uppercase tracking-widest" />

                  <textarea value={form.descripcion_tienda} onChange={e => setForm(p => ({ ...p, descripcion_tienda: e.target.value }))}
                    placeholder="STORE_DESCRIPTION..." rows={3}
                    className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder-gray-700 outline-none focus:border-[#CCFF00]/50 resize-none transition-all uppercase tracking-widest" />
                </div>
              </div>
            )}

            {error   && <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 bg-red-950/20 border border-red-900/50 rounded-xl px-4 py-4 text-center">{error}</p>}
            {success && <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl px-4 py-4 text-center">{success}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-[#CCFF00] hover:bg-[#b3ff00] disabled:opacity-30 disabled:hover:bg-[#CCFF00] text-black font-mono font-bold py-4 rounded-full transition-all text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.2)] mt-8">
              {saving ? 'UPDATING...' : perfilIncompleto ? 'FINALIZE_REGISTRY' : 'SAVE_PREFERENCES'}
            </button>
          </form>
        </div>

        {/* Links vendedor */}
        {esVendedor && !perfilIncompleto && (
          <div className="bg-[#0A0A0A] rounded-[2rem] border border-white/5 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] mt-10">
            <button onClick={() => navigate('/seller')}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-[#121212] transition-colors border-b border-white/5 group">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-3">
                 <span className="text-xl">📦</span> MERCHANT_CONSOLE
              </span>
              <span className="text-gray-600 group-hover:text-[#CCFF00] transition-colors">→</span>
            </button>
            <button onClick={() => navigate('/punto-de-venta')}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-[#121212] transition-colors group">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-3">
                 <span className="text-xl">🏪</span> POS_TERMINAL
              </span>
              <span className="text-gray-600 group-hover:text-[#CCFF00] transition-colors">→</span>
            </button>
          </div>
        )}

        {usuario?.es_admin && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-red-950/10 border border-red-900/30 rounded-full px-8 py-5 flex items-center justify-between hover:bg-red-950/30 transition-colors mt-10 group shadow-sm">
            <span className="text-[11px] font-mono font-bold text-red-500 uppercase tracking-widest">⚙️ SYSADMIN_PANEL</span>
            <span className="text-red-800 group-hover:text-red-500 transition-colors">→</span>
          </button>
        )}

        <button onClick={handleLogout}
          className="w-full border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-gray-500 hover:text-red-500 font-mono font-bold py-5 rounded-full text-[11px] tracking-widest uppercase transition-all mt-16 bg-[#0A0A0A] shadow-sm">
          TERMINATE_SESSION
        </button>
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  )
}
