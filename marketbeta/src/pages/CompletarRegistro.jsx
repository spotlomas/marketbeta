import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

export default function CompletarRegistro() {
  const { session, setUsuario, setNeedsProfile, fetchCart } = useApp()
  const navigate = useNavigate()

  const googleName  = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || ''
  const googleEmail = session?.user?.email || ''

  const [step, setStep]   = useState(1) // 1 = elegir tipo, 2 = formulario
  const [tipo, setTipo]   = useState('')
  const [form, setForm]   = useState({
    nombre:         googleName,
    numero_control: '',
    edad:           '',
    curp:           '',
    escuela:        '',
    rfc:            '',
    tipo_pago:      '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre || !form.numero_control || !form.edad) {
      setError('Nombre, número de control y edad son obligatorios.')
      return
    }
    if (tipo === 'vendedor' && (!form.curp || !form.escuela)) {
      setError('CURP y Escuela son obligatorios para vendedores.')
      return
    }

    setSaving(true)
    setError('')

    const { data, error: dbError } = await supabase.from('usuarios').insert({
      id:             session.user.id,
      email:          googleEmail,
      nombre:         form.nombre.trim(),
      numero_control: form.numero_control.trim(),
      edad:           parseInt(form.edad),
      tipo_usuario:   tipo,
      curp:           tipo === 'vendedor' ? form.curp.trim().toUpperCase() : null,
      escuela:        tipo === 'vendedor' ? form.escuela.trim() : null,
      rfc:            form.rfc.trim() || null,
      tipo_pago:      form.tipo_pago || null,
    }).select().single()

    if (dbError) {
      setError('Error al guardar tu perfil. Intenta de nuevo.')
      setSaving(false)
      return
    }

    setUsuario(data)
    setNeedsProfile(false)
    await fetchCart(session.user.id)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Market<span className="text-brand-600">Beta</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Completa tu registro</p>
        </div>

        {/* Step 1 — Elegir tipo */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Google avatar */}
            <div className="flex flex-col items-center mb-6">
              {session?.user?.user_metadata?.avatar_url && (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-2 border-gray-200 mb-3"
                />
              )}
              <p className="font-semibold text-gray-800">{googleName}</p>
              <p className="text-sm text-gray-400">{googleEmail}</p>
            </div>

            <p className="text-sm font-medium text-gray-700 text-center mb-4">
              ¿Cómo quieres usar MarketBeta?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setTipo('comprador')}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all
                  ${tipo === 'comprador'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 hover:border-brand-300 text-gray-600'
                  }`}
              >
                <span className="text-4xl">🛒</span>
                <span className="font-semibold text-sm">Comprador</span>
                <span className="text-xs text-center text-gray-400">Explora y compra productos</span>
              </button>

              <button
                onClick={() => setTipo('vendedor')}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all
                  ${tipo === 'vendedor'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 hover:border-brand-300 text-gray-600'
                  }`}
              >
                <span className="text-4xl">🏪</span>
                <span className="font-semibold text-sm">Vendedor</span>
                <span className="text-xs text-center text-gray-400">Crea y vende tus productos</span>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!tipo}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2 — Formulario */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1"
            >
              ← Atrás
            </button>

            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">{tipo === 'vendedor' ? '🏪' : '🛒'}</span>
              <p className="font-semibold text-gray-800 capitalize">{tipo}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <Field label="Nombre completo *" name="nombre" value={form.nombre}
                onChange={handleChange} placeholder="Juan Pérez López" />

              <Field label="Número de control *" name="numero_control" value={form.numero_control}
                onChange={handleChange} placeholder="21xxxxxx" />

              <Field label="Edad *" name="edad" type="number" value={form.edad}
                onChange={handleChange} placeholder="20" min="15" max="99" />

              {tipo === 'vendedor' && (
                <>
                  <Field label="CURP *" name="curp" value={form.curp}
                    onChange={handleChange} placeholder="XXXX000000XXXXXX00" maxLength={18} />
                  <Field label="Escuela *" name="escuela" value={form.escuela}
                    onChange={handleChange} placeholder="Instituto Tecnológico..." />
                  <Field label="RFC (opcional)" name="rfc" value={form.rfc}
                    onChange={handleChange} placeholder="RFC del vendedor" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago (opcional)</label>
                    <select name="tipo_pago" value={form.tipo_pago} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">Selecciona...</option>
                      <option value="transferencia">Transferencia bancaria</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {saving ? 'Guardando...' : '¡Entrar a MarketBeta!'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} {...rest}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition" />
    </div>
  )
}
