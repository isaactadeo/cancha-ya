import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCanchas } from '../services/api'
import api from '../services/api'
import CanchaBackground from '../components/CanchaBackground'

export default function Admin() {
  const [canchas, setCanchas] = useState([])
  const [form, setForm] = useState({ name: '', type: '5', price_per_hour: '', is_active: true })
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (user.role !== 'admin') navigate('/grilla')
    cargarCanchas()
  }, [])

  const cargarCanchas = () => {
    getCanchas().then(r => setCanchas(r.data)).catch(() => {})
  }

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form, price_per_hour: parseFloat(form.price_per_hour) }
      if (editando) {
        await api.put(`/api/admin/canchas/${editando}`, data)
        mostrarMensaje('Cancha actualizada')
      } else {
        await api.post('/api/admin/canchas', data)
        mostrarMensaje('Cancha creada')
      }
      setForm({ name: '', type: '5', price_per_hour: '', is_active: true })
      setEditando(null)
      cargarCanchas()
    } catch (e) {
      mostrarMensaje(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (cancha) => {
    setEditando(cancha.id)
    setForm({
      name: cancha.name,
      type: cancha.type,
      price_per_hour: cancha.price_per_hour,
      is_active: cancha.is_active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminár esta cancha?')) return
    try {
      await api.delete(`/api/admin/canchas/${id}`)
      mostrarMensaje('Cancha eliminada')
      cargarCanchas()
    } catch {
      mostrarMensaje('Error al eliminar')
    }
  }

  const handleToggleActiva = async (cancha) => {
    try {
      await api.put(`/api/admin/canchas/${cancha.id}`, {
        ...cancha,
        is_active: !cancha.is_active,
      })
      cargarCanchas()
    } catch {
      mostrarMensaje('Error al actualizar')
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-white">
      <CanchaBackground />

      {/* Header */}
      <motion.div
        className="glass-dark px-6 py-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <h1 className="text-2xl font-bold text-white">CanchaYa</h1>
          <span className="text-xs bg-yellow-500/30 border border-yellow-400/40 text-yellow-300 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/grilla')}
            className="text-sm text-white/60 hover:text-white transition"
          >
            Ver grilla
          </button>
          <span className="text-sm text-white/70">{user.full_name}</span>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 transition">
            Salir
          </button>
        </div>
      </motion.div>

      <div className="p-6 max-w-4xl mx-auto">

        {/* Mensaje */}
        <AnimatePresence>
          {mensaje && (
            <motion.div
              className="mb-4 p-3 rounded-xl text-sm font-medium text-center bg-green-500/20 border border-green-400/40 text-green-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        <motion.div
          className="glass-dark rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold mb-4 text-yellow-300">
            {editando ? 'Editar cancha' : 'Nueva cancha'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-white/60 mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
                placeholder="Ej: Cancha 1 Techada"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-400 transition"
              >
                <option value="5" className="bg-gray-800">Fútbol 5</option>
                <option value="7" className="bg-gray-800">Fútbol 7</option>
                <option value="11" className="bg-gray-800">Fútbol 11</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Precio por hora</label>
              <input
                type="number"
                value={form.price_per_hour}
                onChange={e => setForm({ ...form, price_per_hour: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
                placeholder="5000"
                required
                min="0"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-white/60">Activa</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex gap-3">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white py-2 rounded-xl font-semibold transition disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                {loading ? '...' : editando ? 'Guardar cambios' : 'Crear cancha'}
              </motion.button>
              {editando && (
                <button
                  type="button"
                  onClick={() => { setEditando(null); setForm({ name: '', type: '5', price_per_hour: '', is_active: true }) }}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Lista de canchas */}
        <motion.div
          className="glass-dark rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-4 text-yellow-300">Canchas registradas</h2>
          <div className="space-y-3">
            {canchas.length === 0 && (
              <p className="text-white/40 text-sm text-center py-4">No hay canchas registradas</p>
            )}
            {canchas.map(cancha => (
              <motion.div
                key={cancha.id}
                className="glass rounded-xl p-4 flex items-center justify-between"
                layout
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${cancha.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <div className="font-medium text-white">{cancha.name}</div>
                    <div className="text-xs text-white/40">
                      Fútbol {cancha.type} · ${cancha.price_per_hour}/h
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActiva(cancha)}
                    className={`text-xs px-3 py-1 rounded-lg transition ${
                      cancha.is_active
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        : 'bg-white/10 text-white/40 hover:bg-white/20'
                    }`}
                  >
                    {cancha.is_active ? 'Activa' : 'Inactiva'}
                  </button>
                  <button
                    onClick={() => handleEditar(cancha)}
                    className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(cancha.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}