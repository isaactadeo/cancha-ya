import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Grilla from './pages/Grilla'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/grilla" element={
          <PrivateRoute>
            <Grilla />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}