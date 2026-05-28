import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCanchas, getReservasPorFecha, getReservasAdminPorFecha, crearReserva } from '../services/api'
import Modal from '../components/Modal'
import CanchaBackground from '../components/CanchaBackground'
import ModalReservaAdmin from '../components/ModalReservaAdmin'

const HORARIOS = [
  '08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00',
  '20:00','21:00','22:00','23:00'
]

const TIPOS_CANCHA = ['Todos', '5', '7', '11']

const LABELS_TIPO = {
  'Todos': 'Todas',
  '5': 'Fútbol 5',
  '7': 'Fútbol 7',
  '11': 'Fútbol 11',
}

function formatFecha(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function Grilla() {
  const [canchas, setCanchas] = useState([])
  const [reservas, setReservas] = useState([])
  const [fecha, setFecha] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)

  // ── Nuevos estados de filtro ──────────────────────────────────────────────
  const [filtroDia, setFiltroDia] = useState('hoy')        // 'hoy' | 'mañana' | 'pasado'
  const [filtroTipo, setFiltroTipo] = useState('Todos')    // 'Todos' | '5' | '7' | '11'
  // ─────────────────────────────────────────────────────────────────────────

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  // Canchas filtradas por tipo
  const canchasFiltradas = filtroTipo === 'Todos'
    ? canchas
    : canchas.filter(c => String(c.type) === filtroTipo)

  // Cuando cambia el dropdown de día rápido, actualizamos la fecha
  useEffect(() => {
    const hoy = new Date()
    if (filtroDia === 'hoy')     setFecha(hoy)
    if (filtroDia === 'mañana')  setFecha(addDays(hoy, 1))
    if (filtroDia === 'pasado')  setFecha(addDays(hoy, 2))
  }, [filtroDia])

  useEffect(() => {
    getCanchas().then(r => setCanchas(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchReservas = isAdmin
      ? getReservasAdminPorFecha(formatFecha(fecha))
      : getReservasPorFecha(formatFecha(fecha))

    fetchReservas
      .then(r => setReservas(r.data || []))
      .catch(() => setReservas([]))
  }, [fecha])

  const getReserva = (canchaId, hora) => {
    const [h] = hora.split(':')
    return reservas.find(r => {
      const start = new Date(r.start_time)
      return r.court_id === canchaId && start.getUTCHours() === parseInt(h)
    })
  }

  const handleCelda = (cancha, hora) => {
    const reserva = getReserva(cancha.id, hora)
    if (reserva) {
      if (isAdmin) setReservaSeleccionada(reserva)
      return
    }
    setSelected({ cancha, slot: { hora } })
  }

  const handleConfirmar = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const [h] = selected.slot.hora.split(':')
      const startTime = `${formatFecha(fecha)}T${h.padStart(2, '0')}:00:00`
      await crearReserva({ court_id: selected.cancha.id, start_time: startTime, duration: 60 })
      setMensaje('¡Reserva confirmada!')
      setTimeout(() => {
        setSelected(null)
        setMensaje('')
        const fetch = isAdmin
          ? getReservasAdminPorFecha(formatFecha(fecha))
          : getReservasPorFecha(formatFecha(fecha))
        fetch.then(r => setReservas(r.data || []))
      }, 1500)
    } catch (e) {
      setMensaje(e.response?.data?.error || 'Error al reservar')
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-white">
      <CanchaBackground />

      <motion.div
        className="header-glass px-6 py-3 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="logo-text">Cancha<span>YA</span></span>
          {isAdmin && (
            <span className="text-xs bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="nav-btn nav-btn-admin">
              Panel admin
            </button>
          )}
          <button onClick={() => navigate('/mis-reservas')} className="nav-btn">
            Mis reservas
          </button>
          <span className="text-sm text-white/50 px-2">{user.full_name}</span>
          <button onClick={logout} className="nav-btn nav-btn-danger">
            Salir
          </button>
        </div>
      </motion.div>

      <div className="p-6">

        {/* ── Barra de filtros ─────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap items-center gap-3 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Dropdown fecha rápida */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-medium">Día</span>
            <div className="flex glass rounded-xl overflow-hidden">
              {[
                { key: 'hoy',    label: 'Hoy' },
                { key: 'mañana', label: 'Mañana' },
                { key: 'pasado', label: 'Pasado' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroDia(key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${
                    filtroDia === key
                      ? 'bg-green-500/30 text-green-300 border-b-2 border-green-400'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-white/10" />

          {/* Filtro tipo de cancha */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-medium">Tipo</span>
            <div className="flex glass rounded-xl overflow-hidden">
              {TIPOS_CANCHA.map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${
                    filtroTipo === tipo
                      ? 'bg-green-500/30 text-green-300 border-b-2 border-green-400'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  {LABELS_TIPO[tipo]}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de resultados */}
          {filtroTipo !== 'Todos' && (
            <motion.span
              className="text-xs text-white/40 ml-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {canchasFiltradas.length === 0
                ? 'Sin canchas para ese tipo'
                : `${canchasFiltradas.length} cancha${canchasFiltradas.length > 1 ? 's' : ''}`}
            </motion.span>
          )}
        </motion.div>
        {/* ─────────────────────────────────────────────────────────────────── */}

        {/* Navegación de fecha manual (flechas) */}
        <motion.div
          className="flex items-center gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => {
              setFecha(f => addDays(f, -1))
              setFiltroDia('')   // al navegar manualmente, deseleccionamos el atajo
            }}
            className="glass px-4 py-2 rounded-xl hover:bg-white/20 transition"
          >←</button>
          <h2 className="text-lg font-semibold capitalize">
            {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button
            onClick={() => {
              setFecha(f => addDays(f, 1))
              setFiltroDia('')
            }}
            className="glass px-4 py-2 rounded-xl hover:bg-white/20 transition"
          >→</button>
        </motion.div>

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

        <div className="flex gap-4 mb-4 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded cell-libre"></div>
            Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded cell-ocupado"></div>
            Ocupado
          </div>
        </div>

        {/* Tabla — usa canchasFiltradas */}
        <motion.div
          className="glass-dark rounded-2xl overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {canchasFiltradas.length === 0 ? (
            <div className="py-16 text-center text-white/40 text-sm">
              No hay canchas para el filtro seleccionado.
            </div>
          ) : (() => {
            const COL_HORA = 72
            const COL_CANCHA = 160
            const tableW = COL_HORA + COL_CANCHA * canchasFiltradas.length
            return (
              <table
                className="text-sm"
                style={{
                  width: '100%',
                  minWidth: `${tableW}px`,
                  tableLayout: 'fixed',
                }}
              >
                <colgroup>
                  <col style={{ width: `${COL_HORA}px`, minWidth: `${COL_HORA}px`, maxWidth: `${COL_HORA}px` }} />
                  {canchasFiltradas.map(c => (
                    <col key={c.id} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 text-left text-white/50 font-medium">Hora</th>
                    {canchasFiltradas.map(c => (
                      <th key={c.id} className="p-3 text-center">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-xs text-white/40">
                          Fútbol {c.type} · ${c.price_per_hour}/h
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORARIOS.map((hora, i) => (
                    <motion.tr
                      key={hora}
                      className="border-b border-white/5 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                    >
                      <td className="p-3 text-white/50 font-medium">{hora}</td>
                      {canchasFiltradas.map(cancha => {
                        const reserva = getReserva(cancha.id, hora)
                        return (
                          <td key={cancha.id} className="p-2 text-center">
                            <button
                              onClick={() => handleCelda(cancha, hora)}
                              disabled={!!reserva && !isAdmin}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-medium ${
                                reserva ? 'cell-ocupado text-red-300' : 'cell-libre text-green-300 cursor-pointer'
                              }`}
                            >
                              {reserva
                                ? isAdmin
                                  ? reserva.user_name || `${reserva.user_id.slice(0, 6)}...`
                                  : 'Ocupado'
                                : 'Libre'
                              }
                            </button>
                          </td>
                        )
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )
          })()}
        </motion.div>

        {isAdmin && (
          <motion.div
            className="mt-6 glass-dark rounded-2xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-yellow-300">Panel Admin</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{reservas.length}</div>
                <div className="text-xs text-white/50 mt-1">Reservas hoy</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-green-300">
                  ${reservas.reduce((sum, r) => sum + r.total_price, 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/50 mt-1">Ingresos del día</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{canchas.length}</div>
                <div className="text-xs text-white/50 mt-1">Canchas activas</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Modal
        cancha={selected?.cancha}
        slot={selected?.slot}
        onConfirm={handleConfirmar}
        onClose={() => setSelected(null)}
        loading={loading}
      />

      <ModalReservaAdmin
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
      />
    </div>
  )
} 