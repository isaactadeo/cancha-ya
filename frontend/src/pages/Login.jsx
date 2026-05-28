// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { login, register } from '../services/api';
import CanchaBackground from '../components/CanchaBackground';
import FuturisticBall from '../components/FuturisticBall';

export default function Login() {
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [triggerBallSpin, setTriggerBallSpin] = useState(false);
  const ballControls = useAnimation();
  const navigate = useNavigate();
  const controlsRef = useRef();

  useEffect(() => {
    ballControls.start({
      y: [0, -22, 0, -10, 0],
      rotate: [0, -8, 8, -4, 0],
      transition: { duration: 1.5, ease: 'easeOut', delay: 0.4 },
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación de contraseñas en registro
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
    setTriggerBallSpin(true);

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
      setTimeout(() => setTriggerBallSpin(false), 600);
    }
  };

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setForm({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  };

  const inputClass = `
    w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5
    text-white placeholder-white/25 text-sm
    focus:outline-none focus:border-green-400/60 focus:bg-white/10
    transition-all duration-300
  `;

  const campos = modo === 'register'
    ? [
        { key: 'full_name',        label: 'Nombre completo', type: 'text',     placeholder: 'Isaac Tadeo',  required: true  },
        { key: 'phone',            label: 'Teléfono',         type: 'tel',      placeholder: '3412345678',   required: true  },
        { key: 'email',            label: 'Email',            type: 'email',    placeholder: 'tu@email.com', required: true  },
        { key: 'password',         label: 'Contraseña',       type: 'password', placeholder: '••••••',       required: true  },
        { key: 'confirm_password', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••',   required: true  },
      ]
    : [
        { key: 'email',    label: 'Email',      type: 'email',    placeholder: 'tu@email.com', required: true },
        { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••',       required: true },
      ];

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      <CanchaBackground />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.58)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 32px 64px rgba(0,0,0,0.55), 0 0 80px rgba(74,222,128,0.05)',
          }}
        >
          {/* Header */}
          <div className="pt-8 pb-4 px-8 text-center relative">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent" />
            <motion.div animate={ballControls} className="flex justify-center mb-4">
              <div className="w-36 h-36">
                <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} gl={{ antialias: true, alpha: true }}>
                  <FuturisticBall triggerSpin={triggerBallSpin} onSpinComplete={() => setTriggerBallSpin(false)} />
                  <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} rotateSpeed={0.55} enableTouchRotate={true} />
                </Canvas>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="logo-text text-5xl mb-1">Cancha<span>YA</span></h1>
              <motion.p className="text-white/40 text-xs tracking-[0.2em] uppercase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Sistema de Reservas
              </motion.p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="px-8 mb-6">
            <motion.div className="flex bg-white/5 rounded-2xl p-1 border border-white/8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {['login', 'register'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => cambiarModo(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative ${modo === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  {modo === tab && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/20 border border-green-400/30 rounded-xl"
                      layoutId="tab-active"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab === 'login' ? 'Ingresar' : 'Registrarse'}</span>
                </button>
              ))}
            </motion.div>
          </div>

          {/* Formulario */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-2xl mb-4 text-xs text-center"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
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

                    // Resaltar campo confirm si no coincide
                    const mismatch = isConfirm && form.confirm_password && form.password !== form.confirm_password;

                    return (
                      <motion.div
                        key={`${modo}-${campo.key}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ delay: i * 0.07, duration: 0.3 }}
                      >
                        <label className="block text-xs text-white/50 mb-1.5 ml-1 tracking-wide">
                          {campo.label}
                        </label>
                        <div className="relative">
                          <input
                            type={(isPass || isConfirm) && visible ? 'text' : campo.type}
                            value={form[campo.key]}
                            onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                            className={`${inputClass} ${mismatch ? 'border-red-400/50' : ''}`}
                            placeholder={campo.placeholder}
                            required={campo.required}
                            minLength={(isPass || isConfirm) ? 6 : undefined}
                          />
                          {(isPass || isConfirm) && (
                            <button
                              type="button"
                              onClick={toggleVisible}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition text-xs"
                            >
                              {visible ? 'ocultar' : 'ver'}
                            </button>
                          )}
                        </div>
                        {mismatch && (
                          <p className="text-red-400 text-xs mt-1 ml-1">Las contraseñas no coinciden</p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3.5 rounded-2xl font-semibold text-sm relative overflow-hidden group disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 32px rgba(34,197,94,0.45)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative text-white">
                  {loading ? (
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      {modo === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
                    </motion.span>
                  ) : (
                    modo === 'login' ? 'Ingresar' : 'Crear cuenta'
                  )}
                </span>
              </motion.button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/20 text-xs">{modo === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <button
                type="button"
                onClick={() => cambiarModo(modo === 'login' ? 'register' : 'login')}
                className="w-full py-2.5 rounded-2xl text-sm text-white/50 hover:text-green-400 border border-white/8 hover:border-green-400/30 transition-all duration-300"
              >
                {modo === 'login' ? 'Registrarse gratis' : 'Iniciar sesión'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-8 py-4 text-center">
            <p className="text-white/15 text-xs tracking-widest uppercase">CanchaYA · Rafaela, Santa Fe</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}