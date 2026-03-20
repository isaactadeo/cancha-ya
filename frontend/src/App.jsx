import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Grilla from './pages/Grilla'
import Admin from './pages/Admin'
import MisReservas from './pages/MisReservas'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" />
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.role === 'admin' ? children : <Navigate to="/grilla" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/grilla" element={<PrivateRoute><Grilla /></PrivateRoute>} />
        <Route path="/mis-reservas" element={<PrivateRoute><MisReservas /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminRoute><Admin /></AdminRoute></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}