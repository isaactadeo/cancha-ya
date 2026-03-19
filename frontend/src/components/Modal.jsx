export default function Modal({ cancha, slot, onConfirm, onClose }) {
  if (!slot) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Confirmar reserva</h2>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p><span className="font-medium">Cancha:</span> {cancha?.name}</p>
          <p><span className="font-medium">Horario:</span> {slot.hora}</p>
          <p><span className="font-medium">Precio estimado:</span> ${cancha?.price_per_hour}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}