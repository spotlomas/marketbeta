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

  // Llenar el form cuando el usuario cargue
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
    if (file.size > 5 * 1024 * 1024) { setError('IMAGE MAY NOT EXCEED 5MB.'); return }
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
      setError('CONTROL NUMBER AND AGE REQUIRED.')
      setSaving(false)
      return
    }
    if (form.tipo_usuario === 'vendedor' && (!form.curp || !form.escuela)) {
      setError('CURP AND ESCUELA REQUIRED FOR VENDOR MODULE.')
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
      setSuccess(incompleto ? 'SAVED.' : 'PROFILE COMPLETE. FULL ACCESS GRANTED.')
      setTimeout(() => setSuccess(''), 4000)
    } else {
      setError('FATAL ERROR. PLEASE RETRY.')
    }
    setSaving(false)
  }

  const esVendedor = form.tipo_usuario === 'vendedor'

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <TopNav />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Banner perfil incompleto */}
        {perfilIncompleto && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-5 flex gap-4 items-center">
            <span className="text-3xl text-yellow-500 animate-pulse">⚠️</span>
            <div>
              <p className="font-mono text-xs font-bold text-yellow-500 uppercase tracking-widest">Profile Incomplete</p>
              <p className="text-[10px] text-yellow-500/70 mt-1 font-mono uppercase tracking-widest">
                Missing *parameters required to enable transaction module.
              </p>
            </div>
          </div>
        )}

        {/* User info — no editable */}
        <div className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 blur-[80px] opacity-10 pointer-events-none rounded-full"></div>
          
          <div className="flex items-center gap-5 relative">
            <div className="w-16 h-16 bg-[#151515] rounded-full border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {session?.user?.user_metadata?.avatar_url
                ? <img src={session.user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover grayscale" />
                : <span className="text-2xl opacity-50">{esVendedor ? '🏪' : '👤'}</span>
              }
            </div>
            <div>
              <p className="font-dot text-lg text-white tracking-widest uppercase">{usuario?.nombre || session?.user?.user_metadata?.full_name || 'UNDEFINED_USER'}</p>
              <p className="text-xs text-brand-500 font-mono tracking-widest">{session?.user?.email}</p>
              <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase tracking-widest">IDENTIFICATION STATIC</p>
            </div>
          </div>
        </div>

        {/* Formulario SIEMPRE visible */}
        <div className="bg-[#0a0a0a] rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl">
          <h2 className="font-dot text-xl tracking-widest text-brand-500 mb-2 border-b border-white/10 pb-4">
            {perfilIncompleto ? 'INITIALIZE_PROFILE' : 'SYSTEM_CONFIG'}
          </h2>
          {perfilIncompleto && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-6 mt-4">Required fields indicated by *</p>
          )}

          <form onSubmit={saveProfile} className="space-y-6 mt-6">

            {/* Tipo de cuenta */}
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-3">ACCOUNT MODULE</label>
              <div className="grid grid-cols-2 gap-3">
                {['comprador', 'vendedor'].map(tipo => (
                  <button key={tipo} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo_usuario: tipo }))}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all
                      ${form.tipo_usuario === tipo
                        ? 'border border-brand-500 bg-brand-500 text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.1)]'
                        : 'border border-white/10 hover:border-white/30 text-gray-500 bg-[#121212]'
                      }`}>
                    <span className="text-2xl">{tipo === 'comprador' ? '🛒' : '🏪'}</span> {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Número de control */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">
                  CONTROL NUMBER {perfilIncompleto && !form.numero_control && <span className="text-red-500">*</span>}
                </label>
                <input value={form.numero_control}
                  onChange={e => setForm(p => ({ ...p, numero_control: e.target.value }))}
                  placeholder="21XXXXXX"
                  className={`w-full bg-[#121212] border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all
                    ${perfilIncompleto && !form.numero_control ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 hover:border-white/30 focus:border-brand-500'}`} />
              </div>

              {/* Edad */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">
                  AGE {perfilIncompleto && !form.edad && <span className="text-red-500">*</span>}
                </label>
                <input type="number" value={form.edad} min="15" max="99"
                  onChange={e => setForm(p => ({ ...p, edad: e.target.value }))}
                  placeholder="20"
                  className={`w-full bg-[#121212] border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all
                    ${perfilIncompleto && !form.edad ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 hover:border-white/30 focus:border-brand-500'}`} />
              </div>
            </div>

            {/* Campos vendedor */}
            {esVendedor && (
              <div className="bg-[#050505] p-5 rounded-3xl border border-brand-500/20 space-y-5">
                <p className="font-dot text-brand-500 uppercase tracking-widest border-b border-brand-500/20 pb-2">VENDOR.EXTENSION</p>
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">
                    CURP {perfilIncompleto && !form.curp && <span className="text-red-500">*</span>}
                  </label>
                  <input value={form.curp} maxLength={18}
                    onChange={e => setForm(p => ({ ...p, curp: e.target.value }))}
                    placeholder="XXXX..."
                    className={`w-full bg-[#121212] border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all
                      ${perfilIncompleto && !form.curp ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 hover:border-white/30 focus:border-brand-500'}`} />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">
                    SCHOOL_NODE {perfilIncompleto && !form.escuela && <span className="text-red-500">*</span>}
                  </label>
                  <input value={form.escuela}
                    onChange={e => setForm(p => ({ ...p, escuela: e.target.value }))}
                    placeholder="TECH INST..."
                    className={`w-full bg-[#121212] border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none transition-all
                      ${perfilIncompleto && !form.escuela ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 hover:border-white/30 focus:border-brand-500'}`} />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">RFC (OPTIONAL)</label>
                  <input value={form.rfc} onChange={e => setForm(p => ({ ...p, rfc: e.target.value }))}
                    placeholder="RFC-XXXX"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none hover:border-white/30 focus:border-brand-500 transition-all" />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-2">PAYMENT_METHOD</label>
                  <select value={form.tipo_pago} onChange={e => setForm(p => ({ ...p, tipo_pago: e.target.value }))}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none hover:border-white/30 focus:border-brand-500 transition-all appearance-none">
                    <option value="">SELECT...</option>
                    <option value="transferencia">BANK TRANSFER</option>
                    <option value="efectivo">CASH</option>
                    <option value="paypal">PAYPAL</option>
                  </select>
                </div>

                {/* Tienda */}
                <div className="border-t border-brand-500/20 pt-5">
                  <p className="font-dot text-brand-500 tracking-widest uppercase mb-4">STOREFRONT.CONFIG</p>

                  <div className="flex items-center gap-5 mb-5">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo" className="w-20 h-20 object-cover rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all" />
                          <button type="button"
                            onClick={() => { setLogoFile(null); setLogoPreview(usuario?.imagen_tienda || null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-black rounded-full w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold">✕</button>
                        </>
                      ) : (
                        <div className="w-20 h-20 border border-white/10 border-dashed rounded-2xl flex items-center justify-center text-3xl opacity-30 bg-[#121212]">🏪</div>
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer inline-block text-[10px] font-mono uppercase tracking-widest border border-brand-500/50 hover:bg-brand-500/10 text-brand-500 px-4 py-2 rounded-full transition-colors">
                        {logoPreview ? 'REPLACE MEDIA' : 'UPLOAD MEDIA'}
                      </label>
                      <p className="text-[9px] font-mono text-gray-600 mt-2 uppercase tracking-widest">JPG, PNG — MAX 5MB</p>
                    </div>
                  </div>

                  <input value={form.nombre_tienda} onChange={e => setForm(p => ({ ...p, nombre_tienda: e.target.value }))}
                    placeholder="STORE NAME" className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none hover:border-white/30 focus:border-brand-500 mb-4 transition-all" />

                  <textarea value={form.descripcion_tienda} onChange={e => setForm(p => ({ ...p, descripcion_tienda: e.target.value }))}
                    placeholder="STORE DESCRIPTION / MANIFESTO..." rows={3}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 outline-none hover:border-white/30 focus:border-brand-500 resize-none transition-all" />
                </div>
              </div>
            )}

            {error   && <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">{error}</p>}
            {success && <p className="text-[10px] font-mono tracking-widest uppercase text-black bg-brand-500 border border-brand-400 rounded-xl px-4 py-3 text-center font-bold">{success}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 text-black font-mono font-bold tracking-widest py-4 rounded-full transition-all text-[11px] uppercase mt-4">
              {saving ? 'UPDATING_RECORD...' : perfilIncompleto ? 'COMPLETE_INITIALIZATION' : 'COMMIT_CHANGES'}
            </button>
          </form>
        </div>

        {/* Links vendedor */}
        {esVendedor && !perfilIncompleto && (
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden shadow-lg mt-8">
            <button onClick={() => navigate('/seller')}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors border-b border-white/5 group">
              <span className="text-xs font-mono tracking-widest text-[#CCFF00] uppercase font-bold">📦 DASHBOARD.VENDOR</span>
              <span className="text-gray-600 group-hover:text-[#CCFF00] font-mono">→</span>
            </button>
            <button onClick={() => navigate('/punto-de-venta')}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors group">
              <span className="text-xs font-mono tracking-widest text-[#CCFF00] uppercase font-bold">🏪 POS.TERMINAL</span>
              <span className="text-gray-600 group-hover:text-[#CCFF00] font-mono">→</span>
            </button>
          </div>
        )}

        {usuario?.es_admin && (
          <button onClick={() => navigate('/admin')}
            className="w-full bg-red-500/10 border border-red-500/30 rounded-full px-6 py-4 flex items-center justify-between hover:bg-red-500/20 transition-colors mt-8 group">
            <span className="text-xs font-mono tracking-widest text-red-500 uppercase font-bold">⚙️ ADMIN.OVERRIDE</span>
            <span className="text-red-500/50 group-hover:text-red-500 font-mono">→</span>
          </button>
        )}

        <button onClick={handleLogout}
          className="w-full border border-white/20 hover:border-white/50 text-gray-400 hover:text-white font-mono uppercase tracking-widest py-4 rounded-full text-[10px] transition-all mt-12 bg-[#050505]">
          TERMINATE_SESSION
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
