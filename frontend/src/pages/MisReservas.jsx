import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMisReservas, cancelarReserva } from '../services/api'
import CanchaBackground from '../components/CanchaBackground'

function estadoColor(status) {
  if (status === 'reservada') return 'bg-green-500/20 border-green-400/40 text-green-300'
  if (status === 'cancelada') return 'bg-red-500/20 border-red-400/40 text-red-300'
  if (status === 'jugada') return 'bg-blue-500/20 border-blue-400/40 text-blue-300'
  return ''
}

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

function formatHora(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

export default function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    cargar()
  }, [])

  const cargar = () => {
    setLoading(true)
    getMisReservas()
      .then(r => setReservas(r.data || []))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await cancelarReserva(id)
      setMensaje('Reserva cancelada')
      setTimeout(() => setMensaje(''), 3000)
      cargar()
    } catch (e) {
      setMensaje(e.response?.data?.error || 'Error al cancelar')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  const puedeCancel = (res) => {
    return res.status === 'reservada' && new Date() < new Date(res.start_time)
  }

  return (
    <div className="min-h-screen text-white">
      <CanchaBackground />

      {/* Header */}
      <motion.div
        className="header-glass px-6 py-3 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="logo-text">Cancha<span>YA</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/grilla')} className="nav-btn">
            Ver grilla
          </button>
          <span className="text-sm text-white/50 px-2">{user.full_name}</span>
          <button onClick={logout} className="nav-btn nav-btn-danger">
            Salir
          </button>
        </div>
      </motion.div>

      <div className="p-6 max-w-2xl mx-auto">
        <motion.h2
          className="text-xl font-semibold mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Mis reservas
        </motion.h2>

        <AnimatePresence>
          {mensaje && (
            <motion.div
              className={`mb-4 p-3 rounded-xl text-sm font-medium text-center ${
                mensaje.includes('Error') || mensaje.includes('error')
                  ? 'bg-red-500/20 border border-red-400/40 text-red-200'
                  : 'bg-green-500/20 border border-green-400/40 text-green-200'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center text-white/40 py-12">Cargando...</div>
        ) : reservas.length === 0 ? (
          <motion.div
            className="glass-dark rounded-2xl p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-3">📅</div>
            <p className="text-white/50">No tenés reservas todavía</p>
            <button
              onClick={() => navigate('/grilla')}
              className="mt-4 text-sm text-green-400 hover:text-green-300 transition"
            >
              Reservar ahora →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {reservas.map((res, i) => (
              <motion.div
                key={res.id}
                className="glass-dark rounded-2xl p-5 flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white capitalize">
                    {formatFecha(res.start_time)}
                  </div>
                  <div className="text-sm text-white/50">
                    {formatHora(res.start_time)} — {formatHora(res.end_time)}
                  </div>
                  <div className="text-sm text-green-300 font-medium">
                    ${res.total_price.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full border ${estadoColor(res.status)}`}>
                    {res.status}
                  </span>
                  {puedeCancel(res) && (
                    <button
                      onClick={() => handleCancelar(res.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30 transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}