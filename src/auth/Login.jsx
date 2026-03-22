import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setError('Error al conectar con Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      {/* Decorative Grids */}
      <div className="absolute inset-x-0 top-0 h-96 bg-brand-500/[0.02] bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

      <div className="w-full max-w-sm z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-dot text-brand-500 tracking-widest flex justify-center items-center gap-2">
            <span className="text-white">MARKET</span>BETA
          </h1>
          <p className="text-gray-500 mt-3 font-mono text-xs uppercase tracking-widest">Connect to network</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-brand-500 hover:text-white disabled:opacity-50 text-gray-400 font-mono py-3 rounded-full transition-all text-xs uppercase tracking-widest mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {googleLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 opacity-30">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white" />
            <span className="text-[10px] font-mono text-white tracking-widest">OR</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="USER@DOMAIN.COM"
                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-[#151515] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono transition-all"
              />
            </div>

            {error && (
              <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 focus:ring-4 ring-brand-500/30 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 text-black font-mono font-bold tracking-widest py-3.5 mt-2 rounded-full transition-all text-sm uppercase"
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>

          <p className="text-center text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-8">
            NO ACCOUNT?{' '}
            <Link to="/register" className="text-brand-500 hover:text-white transition-colors">
              REGISTER HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
