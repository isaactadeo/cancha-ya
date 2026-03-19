import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCanchas, getReservasPorFecha, crearReserva } from '../services/api'
import Modal from '../components/Modal'

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
]

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
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    getCanchas().then(r => setCanchas(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    getReservasPorFecha(formatFecha(fecha))
      .then(r => setReservas(r.data || []))
      .catch(() => setReservas([]))
  }, [fecha])

  const estaOcupado = (canchaId, hora) => {
    const [h] = hora.split(':')
    return reservas.some(r => {
      const start = new Date(r.start_time)
      return r.court_id === canchaId && start.getUTCHours() === parseInt(h)
    })
  }

  const handleCelda = (cancha, hora) => {
    if (estaOcupado(cancha.id, hora)) return
    setSelected({ cancha, slot: { hora } })
  }

  const handleConfirmar = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const [h] = selected.slot.hora.split(':')
      const startTime = `${formatFecha(fecha)}T${h.padStart(2, '0')}:00:00`
      await crearReserva({
        court_id: selected.cancha.id,
        start_time: startTime,
        duration: 60,
      })
      setMensaje('Reserva confirmada!')
      setSelected(null)
      getReservasPorFecha(formatFecha(fecha))
        .then(r => setReservas(r.data || []))
    } catch (e) {
      setMensaje(e.response?.data?.error || 'Error al reservar')
    } finally {
      setLoading(false)
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-600">CanchaYa</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.full_name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Salir
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setFecha(f => addDays(f, -1))}
            className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-700">
            {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button
            onClick={() => setFecha(f => addDays(f, 1))}
            className="px-3 py-1 bg-white border rounded-lg hover:bg-gray-50"
          >
            →
          </button>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${mensaje.includes('Error') || mensaje.includes('error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {mensaje}
          </div>
        )}

        {/* Leyenda */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-gray-600">Ocupado</span>
          </div>
        </div>

        {/* Grilla */}
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-gray-500 font-medium w-20">Hora</th>
                {canchas.map(c => (
                  <th key={c.id} className="p-3 text-center text-gray-700 font-semibold">
                    <div>{c.name}</div>
                    <div className="text-xs text-gray-400 font-normal">${c.price_per_hour}/h</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map(hora => (
                <tr key={hora} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-medium">{hora}</td>
                  {canchas.map(cancha => {
                    const ocupado = estaOcupado(cancha.id, hora)
                    return (
                      <td key={cancha.id} className="p-2 text-center">
                        <button
                          onClick={() => handleCelda(cancha, hora)}
                          disabled={ocupado || loading}
                          className={`w-full py-2 rounded-lg text-xs font-medium transition
                            ${ocupado
                              ? 'bg-red-100 text-red-500 cursor-not-allowed border border-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 cursor-pointer'
                            }`}
                        >
                          {ocupado ? 'Ocupado' : 'Libre'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        cancha={selected?.cancha}
        slot={selected?.slot}
        onConfirm={handleConfirmar}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}