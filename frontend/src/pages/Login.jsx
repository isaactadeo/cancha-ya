// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register } from '../services/api';
import CanchaBackground from '../components/CanchaBackground';

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
      if (form.password !== form.confirm_password) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
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
      if (modo === 'login') {
        setError('Email o contraseña incorrectos');
      } else {
        setError(msg === 'el email ya está registrado' ? 'Ese email ya tiene una cuenta' : 'Error al registrarse');
      }
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
        { key: 'full_name',        label: 'Nombre completo',      type: 'text',     placeholder: 'Isaac Tadeo',  required: true },
        { key: 'phone',            label: 'Teléfono',             type: 'tel',      placeholder: '3412345678',   required: true },
        { key: 'email',            label: 'Email',                type: 'email',    placeholder: 'tu@email.com', required: true },
        { key: 'password',         label: 'Contraseña',           type: 'password', placeholder: '••••••',       required: true },
        { key: 'confirm_password', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••',       required: true },
      ]
    : [
        { key: 'email',    label: 'Email',      type: 'email',    placeholder: 'tu@email.com', required: true },
        { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••',       required: true },
      ];

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Fondo con icosaedro */}
      <CanchaBackground />

      {/* Viñeta sutil */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)',
          zIndex: -5,
        }}
      />

      {/* Card del formulario */}
      <motion.div
        className="relative z-10 w-full max-w-[360px] mx-4"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-0.5 mb-1">
                <span
                  style={{
                    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                    fontSize: '2rem',
                    letterSpacing: '0.04em',
                    color: '#ffffff',
                    lineHeight: 1,
                  }}
                >
                  CANCHA
                </span>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                    fontSize: '2rem',
                    letterSpacing: '0.04em',
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1,
                  }}
                >
                  YA
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.28)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Sistema de Reservas
              </p>
            </motion.div>

            {/* Título del modo */}
            <AnimatePresence mode="wait">
              <motion.div
                key={modo}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {modo === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                  {modo === 'login'
                    ? 'Ingresá tus credenciales para continuar'
                    : 'Completá los datos para registrarte'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Separador */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 32px' }} />

          {/* Formulario */}
          <div className="px-8 py-6">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '0.78rem',
                    color: 'rgba(252, 165, 165, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence mode="popLayout">
                  {campos.map((campo, i) => {
                    const isPass = campo.key === 'password';
                    const isConfirm = campo.key === 'confirm_password';
                    const visible = isPass ? showPass : isConfirm ? showConfirmPass : false;
                    const toggleVisible = isPass
                      ? () => setShowPass(v => !v)
                      : isConfirm
                      ? () => setShowConfirmPass(v => !v)
                      : null;
                    const mismatch = isConfirm && form.confirm_password && form.password !== form.confirm_password;

                    return (
                      <motion.div
                        key={`${modo}-${campo.key}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                      >
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '6px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {campo.label}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={(isPass || isConfirm) && visible ? 'text' : campo.type}
                            value={form[campo.key]}
                            onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                            placeholder={campo.placeholder}
                            required={campo.required}
                            minLength={(isPass || isConfirm) ? 6 : undefined}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: mismatch
                                ? 'rgba(220,38,38,0.06)'
                                : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${mismatch ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.09)'}`,
                              borderRadius: '8px',
                              padding: (isPass || isConfirm) ? '10px 52px 10px 14px' : '10px 14px',
                              color: 'rgba(255,255,255,0.85)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              transition: 'border-color 0.2s, background 0.2s',
                            }}
                            onFocus={e => {
                              e.target.style.borderColor = 'rgba(255,255,255,0.22)';
                              e.target.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onBlur={e => {
                              e.target.style.borderColor = mismatch ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.09)';
                              e.target.style.background = mismatch ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.04)';
                            }}
                          />
                          {(isPass || isConfirm) && (
                            <button
                              type="button"
                              onClick={toggleVisible}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.25)',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                padding: '4px',
                                letterSpacing: '0.04em',
                              }}
                            >
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

              {/* Botón submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '11px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: loading
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.09)',
                  color: loading ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {modo === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
                  </motion.span>
                ) : (
                  modo === 'login' ? 'Continuar' : 'Crear cuenta'
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer del card — cambio de modo */}
          <div
            style={{
              padding: '14px 32px 20px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
              {modo === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            </span>
            <button
              onClick={() => cambiarModo(modo === 'login' ? 'register' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.9)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              {modo === 'login' ? 'Registrarse' : 'Iniciá sesión'}
            </button>
          </div>
        </div>

        {/* Tagline debajo del card */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Rafaela · Santa Fe · Argentina
        </motion.p>
      </motion.div>
    </div>
  );
}