import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getCanchas = () =>
  api.get('/canchas')

export const getReservasPorFecha = (fecha) =>
  api.get(`/api/reservas?fecha=${fecha}`)

export const crearReserva = (data) =>
  api.post('/api/reservas', data)

export const cancelarReserva = (id) =>
  api.delete(`/api/reservas/${id}`)

export const getMisReservas = () =>
  api.get('/api/mis-reservas')

export const register = (data) =>
  api.post('/auth/register', data)

export const getReservasAdminPorFecha = (fecha) =>
  api.get(`/api/admin/reservas?fecha=${fecha}`)

export default api

export const getCanchasAdmin = () =>
  api.get('/api/admin/canchas/all')