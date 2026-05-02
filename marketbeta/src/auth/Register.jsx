import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const initialForm = {
  email: '', password: '', confirmPassword: '',
  nombre: '', numero_control: '', edad: '',
  tipo_usuario: 'comprador',
  curp: '', escuela: '', rfc: '', tipo_pago: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(initialForm)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const isVendedor = form.tipo_usuario === 'vendedor'

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('PASSWORD MISMATCH.')
      return
    }
    if (form.password.length < 6) {
      setError('PASSWORD TOO SHORT.')
      return
    }
    if (isVendedor && (!form.curp || !form.escuela)) {
      setError('CURP AND ESCUELA ARE REQUIRED FOR VENDORS.')
      return
    }

    setLoading(true)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    })

    if (authError) {
      setError(authError.message.toUpperCase())
      setLoading(false)
      return
    }

    // 2. Insertar perfil en tabla usuarios
    const uid = authData.user?.id
    if (uid) {
      const { error: dbError } = await supabase.from('usuarios').insert({
        id: uid,
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        numero_control: form.numero_control.trim(),
        edad: parseInt(form.edad),
        tipo_usuario: form.tipo_usuario,
        curp: isVendedor ? form.curp.trim().toUpperCase() : null,
        escuela: isVendedor ? form.escuela.trim() : null,
        rfc: form.rfc.trim() || null,
        tipo_pago: form.tipo_pago || null,
      })

      if (dbError) {
        setError('PROFILE CREATION FAILED. AWAIT RESOLUTION.')
        setLoading(false)
        return
      }
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-x-0 top-0 h-96 bg-brand-500/[0.02] bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

      <div className="w-full max-w-lg z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-dot text-brand-500 tracking-widest flex justify-center items-center gap-2">
            <span className="text-white">MARKET</span>BETA
          </h1>
          <p className="text-gray-500 mt-3 font-mono text-xs uppercase tracking-widest">Initialization Sequence</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tipo de usuario */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-3">ACCOUNT TYPE</label>
              <div className="grid grid-cols-2 gap-3">
                {['comprador', 'vendedor'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo_usuario: tipo }))}
                    className={`py-3 rounded-full text-xs font-mono uppercase tracking-widest transition-all
                      ${form.tipo_usuario === tipo
                        ? 'bg-brand-500 text-black shadow-[0_0_15px_rgba(204,255,0,0.2)] border border-brand-500'
                        : 'bg-transparent text-gray-500 border border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 border-t border-white/5 pt-6">
              {/* Nombre */}
              <Field label="FULL NAME" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="SYSTEM USER" />

              {/* Email */}
              <Field label="EMAIL ADDRESS" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="USER@DOMAIN.COM" />

              <div className="grid grid-cols-2 gap-4">
                {/* Control */}
                <Field label="CONTROL NUMBER" name="numero_control" value={form.numero_control} onChange={handleChange} required placeholder="21XXXXXX" />

                {/* Edad */}
                <Field label="AGE" name="edad" type="number" value={form.edad} onChange={handleChange} required placeholder="20" min="15" max="99" />
              </div>

              {/* Campos de vendedor */}
              {isVendedor && (
                <div className="bg-[#121212] p-4 rounded-2xl border border-brand-500/20 space-y-4">
                  <h3 className="text-brand-500 font-dot tracking-widest text-sm mb-2 border-b border-brand-500/20 pb-2">VENDOR CONFIGURATION</h3>
                  <Field label="CURP *" name="curp" value={form.curp} onChange={handleChange} required={isVendedor} placeholder="XXXX..." maxLength={18} />
                  <Field label="SCHOOL EXTENSION *" name="escuela" value={form.escuela} onChange={handleChange} required={isVendedor} placeholder="TECH INST..." />
                  <Field label="RFC (OPTIONAL)" name="rfc" value={form.rfc} onChange={handleChange} placeholder="RFC-XXXX" />
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">PAYMENT MODULE</label>
                    <select
                      name="tipo_pago"
                      value={form.tipo_pago}
                      onChange={handleChange}
                      className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono transition-all appearance-none"
                    >
                      <option value="">SELECT...</option>
                      <option value="transferencia">BANK TRANSFER</option>
                      <option value="efectivo">CASH</option>
                      <option value="paypal">PAYPAL</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Contraseñas */}
              <Field label="PASSWORD" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="MIN 6 CHARACTERS" />
              <Field label="CONFIRM PASSWORD" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required placeholder="REPEAT PASSWORD" />
            </div>

            {error && (
              <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 text-black font-mono font-bold tracking-widest py-4 rounded-full transition-all text-sm uppercase mt-6 focus:outline-none focus:ring-4 ring-brand-500/30"
            >
              {loading ? 'INITIALIZING...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-center text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-8">
            ALREADY DEPLOYED?{' '}
            <Link to="/login" className="text-brand-500 hover:text-white transition-colors">
              AUTHENTICATE HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder, ...rest }) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        {...rest}
        className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono transition-all"
      />
    </div>
  )
}
