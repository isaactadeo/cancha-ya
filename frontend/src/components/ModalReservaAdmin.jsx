import { motion, AnimatePresence } from 'framer-motion'

export default function ModalReservaAdmin({ reserva, onClose }) {
  if (!reserva) return null

  function formatFecha(iso) {
    return new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
    })
  }

  function formatHora(iso) {
    return new Date(iso).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass rounded-2xl p-8 w-full max-w-sm shadow-2xl text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-yellow-300">Detalle de reserva</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="glass-dark rounded-xl p-4 space-y-3">
  <p className="text-xs text-white/40 uppercase tracking-wider">Cliente</p>
  <p className="font-semibold text-white text-lg">{reserva.user_name}</p>
  <div className="flex justify-between text-sm">
    <span className="text-white/60">Email</span>
    <span>{reserva.user_email}</span>
  </div>
  {reserva.user_phone && (
    <div className="flex justify-between text-sm">
      <span className="text-white/60">Teléfono</span>
      <span>{reserva.user_phone}</span>
    </div>
  )}
</div>

            <div className="glass-dark rounded-xl p-4 space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">Reserva</p>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Fecha</span>
                <span className="capitalize">{formatFecha(reserva.start_time)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Horario</span>
                <span>{formatHora(reserva.start_time)} — {formatHora(reserva.end_time)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Cancha ID</span>
                <span>#{reserva.court_id}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-white/60">Total</span>
                <span className="font-bold text-green-300">${reserva.total_price.toLocaleString()}</span>
              </div>
            </div>

            <div className="glass-dark rounded-xl p-4 space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wider">Estado</p>
              <span className={`text-sm px-3 py-1 rounded-full border inline-block ${
                reserva.status === 'reservada'
                  ? 'bg-green-500/20 border-green-400/40 text-green-300'
                  : reserva.status === 'cancelada'
                  ? 'bg-red-500/20 border-red-400/40 text-red-300'
                  : 'bg-blue-500/20 border-blue-400/40 text-blue-300'
              }`}>
                {reserva.status}
              </span>
            </div>

            <div className="glass-dark rounded-xl p-3">
              <p className="text-xs text-white/30 break-all">ID: {reserva.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition text-sm"
          >
            Cerrar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}