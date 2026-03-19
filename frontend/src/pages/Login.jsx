import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login } from '../services/api'
import CanchaBackground from '../components/CanchaBackground'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(email, password)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/grilla')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
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
          <p className="text-white/60 mt-1">Reservá tu turno</p>
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
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              placeholder="••••••"
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 mt-2"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Entrando...' : 'Ingresar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}