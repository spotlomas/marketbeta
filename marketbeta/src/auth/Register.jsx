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
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (isVendedor && (!form.curp || !form.escuela)) {
      setError('CURP y Escuela son obligatorios para vendedores.')
      return
    }

    setLoading(true)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
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
        setError('Cuenta creada pero hubo un error al guardar el perfil. Contacta soporte.')
        setLoading(false)
        return
      }
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Market<span className="text-brand-600">Beta</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Crea tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-2">
                {['comprador', 'vendedor'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo_usuario: tipo }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                      ${form.tipo_usuario === tipo
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                      }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <Field label="Nombre completo" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Juan Pérez López" />

            {/* Email */}
            <Field label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu@correo.com" />

            {/* Control */}
            <Field label="Número de control" name="numero_control" value={form.numero_control} onChange={handleChange} required placeholder="21xxxxxx" />

            {/* Edad */}
            <Field label="Edad" name="edad" type="number" value={form.edad} onChange={handleChange} required placeholder="20" min="15" max="99" />

            {/* Campos de vendedor */}
            {isVendedor && (
              <>
                <Field label="CURP *" name="curp" value={form.curp} onChange={handleChange} required={isVendedor} placeholder="XXXX000000XXXXXX00" maxLength={18} />
                <Field label="Escuela *" name="escuela" value={form.escuela} onChange={handleChange} required={isVendedor} placeholder="Instituto Tecnológico..." />
                <Field label="RFC (opcional)" name="rfc" value={form.rfc} onChange={handleChange} placeholder="RFC del vendedor" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago (opcional)</label>
                  <select
                    name="tipo_pago"
                    value={form.tipo_pago}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Selecciona...</option>
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
              </>
            )}

            {/* Contraseñas */}
            <Field label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar contraseña" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required placeholder="Repite tu contraseña" />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper input component
function Field({ label, name, type = 'text', value, onChange, required, placeholder, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        {...rest}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
      />
    </div>
  )
}
