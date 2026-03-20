import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { login, register } from '../services/api'
import CanchaBackground from '../components/CanchaBackground'

export default function Login() {
  const [modo, setModo] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let res
      if (modo === 'login') {
        res = await login(form.email, form.password)
      } else {
        res = await register(form)
      }
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/grilla')
    } catch {
      setError(modo === 'login' ? 'Email o contraseña incorrectos' : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const cambiarModo = (nuevo) => {
    setModo(nuevo)
    setError('')
    setForm({ full_name: '', email: '', phone: '', password: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <CanchaBackground />

      <motion.div
        className="glass rounded-3xl p-10 w-full max-w-md shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            ⚽
          </motion.div>
          <h1 className="text-4xl font-bold text-white">CanchaYa</h1>
          <p className="text-white/60 mt-1">
            {modo === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-6">
          <button
            onClick={() => cambiarModo('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              modo === 'login' ? 'bg-green-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => cambiarModo('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              modo === 'register' ? 'bg-green-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <motion.div
            className="bg-red-500/20 border border-red-400/40 text-red-200 p-3 rounded-xl mb-4 text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {modo === 'register' && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-sm text-white/70 mb-1">Nombre completo</label>
                  <input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
                    placeholder="Isaac Tadeo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
                    placeholder="3412345678"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              placeholder="••••••"
              required
              minLength={6}
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 mt-2"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? '...' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}