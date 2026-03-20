import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../services/api'
import CanchaBackground from '../components/CanchaBackground'

const COLORS = ['#4ade80', '#86efac', '#22c55e', '#16a34a']

function formatFecha(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 text-sm text-white shadow-xl">
        <p className="text-white/60 mb-1">{label}</p>
        <p className="font-bold text-green-300">${payload[0].value.toLocaleString()}</p>
        <p className="text-white/50">{payload[1]?.value} reservas</p>
      </div>
    )
  }
  return null
}

const CustomTooltipPie = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 text-sm text-white shadow-xl">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-green-300">{payload[0].value} reservas</p>
      </div>
    )
  }
  return null
}

export default function Reportes() {
  const [ingresos, setIngresos] = useState([])
  const [ocupacion, setOcupacion] = useState([])
  const [desde, setDesde] = useState(formatFecha(addDays(new Date(), -30)))
  const [hasta, setHasta] = useState(formatFecha(new Date()))
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    setLoading(true)
    try {
      const [ingRes, ocuRes] = await Promise.all([
        api.get(`/api/admin/reportes/ingresos?desde=${desde}&hasta=${hasta}`),
        api.get(`/api/admin/reportes/ocupacion?desde=${desde}&hasta=${hasta}`)
      ])
      setIngresos((ingRes.data || []).map(r => ({
        ...r,
        fecha: new Date(r.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
      })))
      setOcupacion(ocuRes.data || [])
    } catch {
      setIngresos([])
      setOcupacion([])
    } finally {
      setLoading(false)
    }
  }

  const totalIngresos = ingresos.reduce((sum, r) => sum + r.total, 0)
  const totalReservas = ingresos.reduce((sum, r) => sum + r.cantidad, 0)

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
          <span className="text-xs bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/grilla')} className="nav-btn">Ver grilla</button>
          <button onClick={() => navigate('/admin')} className="nav-btn nav-btn-admin">Panel admin</button>
          <span className="text-sm text-white/50 px-2">{user.full_name}</span>
          <button onClick={logout} className="nav-btn nav-btn-danger">Salir</button>
        </div>
      </motion.div>

      <div className="p-6 max-w-5xl mx-auto">

        {/* Filtros */}
        <motion.div
          className="glass-dark rounded-2xl p-5 mb-6 flex flex-wrap items-end gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <label className="block text-xs text-white/50 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition"
            />
          </div>
          <button
            onClick={cargar}
            disabled={loading}
            className="bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Aplicar'}
          </button>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Ingresos totales', value: `$${totalIngresos.toLocaleString()}`, color: 'text-green-300' },
            { label: 'Reservas totales', value: totalReservas, color: 'text-white' },
            { label: 'Promedio por reserva', value: totalReservas > 0 ? `$${Math.round(totalIngresos / totalReservas).toLocaleString()}` : '$0', color: 'text-yellow-300' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              className="glass-dark rounded-2xl p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`text-3xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-white/40">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Gráfico de barras */}
        <motion.div
          className="glass-dark rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-base font-semibold text-yellow-300 mb-6">Ingresos por día</h3>
          {ingresos.length === 0 ? (
            <div className="text-center text-white/30 py-12">Sin datos para el período</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ingresos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="total" fill="#4ade80" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cantidad" fill="rgba(134,239,172,0.3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Gráfico de torta */}
        <motion.div
          className="glass-dark rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-base font-semibold text-yellow-300 mb-6">Ocupación por cancha</h3>
          {ocupacion.filter(o => o.total_reservas > 0).length === 0 ? (
            <div className="text-center text-white/30 py-12">Sin datos para el período</div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={ocupacion.filter(o => o.total_reservas > 0)}
                    dataKey="total_reservas"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {ocupacion.filter(o => o.total_reservas > 0).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}