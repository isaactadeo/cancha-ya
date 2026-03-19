import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function Modal({ cancha, slot, onConfirm, onClose, loading }) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    setConfirmed(true)
    await onConfirm()
    setTimeout(() => setConfirmed(false), 1500)
  }

  if (!slot) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass rounded-2xl p-8 w-full max-w-sm shadow-2xl text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {confirmed ? (
            <div className="text-center py-4">
              <div className="text-6xl mb-4 ball-bounce">⚽</div>
              <p className="text-xl font-bold text-green-300">¡Reserva confirmada!</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-6 text-white">Confirmar reserva</h2>
              <div className="space-y-3 text-sm mb-8">
                <div className="flex justify-between">
                  <span className="text-white/60">Cancha</span>
                  <span className="font-medium">{cancha?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Horario</span>
                  <span className="font-medium">{slot.hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Duración</span>
                  <span className="font-medium">60 min</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-3">
                  <span className="text-white/60">Precio</span>
                  <span className="font-bold text-green-300">${cancha?.price_per_hour}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-white/30 text-white/80 hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition disabled:opacity-50"
                >
                  {loading ? '...' : 'Confirmar'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}