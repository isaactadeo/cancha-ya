// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register } from '../services/api';
import CanchaBackground from '../components/CanchaBackground';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '11px 14px',
  color: 'rgba(255,255,255,0.88)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.18s',
  fontFamily: 'inherit',
};

export default function Login() {
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (modo === 'register') {
      if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden'); return; }
      if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    }
    setLoading(true);
    try {
      let res;
      if (modo === 'login') {
        res = await login(form.email, form.password);
      } else {
        const { confirm_password, ...registerData } = form;
        res = await register(registerData);
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/grilla');
    } catch (err) {
      const msg = err.response?.data?.error;
      if (modo === 'login') setError('Email o contraseña incorrectos');
      else setError(msg === 'el email ya está registrado' ? 'Ese email ya tiene una cuenta' : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setForm({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  };

  const campos = modo === 'register'
    ? [
        { key: 'full_name',        label: 'Nombre completo',      type: 'text',     placeholder: 'Isaac Tadeo'   },
        { key: 'phone',            label: 'Teléfono',             type: 'tel',      placeholder: '3412345678'    },
        { key: 'email',            label: 'Email',                type: 'email',    placeholder: 'tu@email.com'  },
        { key: 'password',         label: 'Contraseña',           type: 'password', placeholder: '••••••'        },
        { key: 'confirm_password', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••'        },
      ]
    : [
        { key: 'email',    label: 'Email',      type: 'email',    placeholder: 'tu@email.com' },
        { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••'       },
      ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <CanchaBackground />

      {/* El formulario flota sobre el canvas — pointer-events solo sobre el form */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '360px',
          margin: '0 16px',
          pointerEvents: 'none', // deja pasar el mouse al canvas debajo
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
              <span style={{
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: '2.2rem',
                letterSpacing: '0.05em',
                color: '#ffffff',
                lineHeight: 1,
              }}>CANCHA</span>
              <span style={{
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: '2.2rem',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.28)',
                lineHeight: 1,
              }}>YA</span>
            </div>
            <p style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0,
            }}>Sistema de Reservas</p>
          </div>

          {/* Título */}
          <AnimatePresence mode="wait">
            <motion.div
              key={modo}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{ marginBottom: '28px' }}
            >
              <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
                {modo === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>
                {modo === 'login' ? 'Ingresá tus credenciales para continuar' : 'Completá los datos para registrarte'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '0.8rem',
                  color: 'rgba(252,165,165,0.9)',
                  textAlign: 'center',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Campos */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <AnimatePresence mode="popLayout">
                {campos.map((campo, i) => {
                  const isPass = campo.key === 'password';
                  const isConfirm = campo.key === 'confirm_password';
                  const visible = isPass ? showPass : isConfirm ? showConfirmPass : false;
                  const toggleVisible = isPass
                    ? () => setShowPass(v => !v)
                    : isConfirm ? () => setShowConfirmPass(v => !v) : null;
                  const mismatch = isConfirm && form.confirm_password && form.password !== form.confirm_password;

                  return (
                    <motion.div
                      key={`${modo}-${campo.key}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.22 }}
                    >
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.38)',
                        marginBottom: '7px',
                        letterSpacing: '0.03em',
                      }}>
                        {campo.label}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={(isPass || isConfirm) && visible ? 'text' : campo.type}
                          value={form[campo.key]}
                          onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                          placeholder={campo.placeholder}
                          required
                          minLength={(isPass || isConfirm) ? 6 : undefined}
                          style={{
                            ...inputStyle,
                            borderColor: mismatch ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)',
                            paddingRight: (isPass || isConfirm) ? '52px' : '14px',
                          }}
                          onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.28)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                          onBlur={e => { e.target.style.borderColor = mismatch ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                        />
                        {(isPass || isConfirm) && (
                          <button type="button" onClick={toggleVisible} style={{
                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)',
                            fontSize: '0.68rem', cursor: 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit',
                          }}>
                            {visible ? 'ocultar' : 'ver'}
                          </button>
                        )}
                      </div>
                      {mismatch && (
                        <p style={{ color: 'rgba(252,165,165,0.8)', fontSize: '0.72rem', marginTop: '4px', marginLeft: '2px' }}>
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.985 }}
              style={{
                width: '100%',
                marginTop: '22px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.88)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? (
                <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  {modo === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
                </motion.span>
              ) : (
                modo === 'login' ? 'Continuar' : 'Crear cuenta'
              )}
            </motion.button>
          </form>

          {/* Cambio de modo */}
          <div style={{
            marginTop: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.22)' }}>
              {modo === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            </span>
            <button
              onClick={() => cambiarModo(modo === 'login' ? 'register' : 'login')}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 500,
                cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.88)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
            >
              {modo === 'login' ? 'Registrarse' : 'Iniciá sesión'}
            </button>
          </div>

          {/* Tagline */}
          <p style={{
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.1)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            Rafaela · Santa Fe · Argentina
          </p>
        </div>
      </motion.div>
    </div>
  );
}