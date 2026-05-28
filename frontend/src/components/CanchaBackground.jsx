// src/components/CanchaBackground.jsx
import { useLocation } from 'react-router-dom';
import FondoFutbolAnimado from './FondoFutbolAnimado';

export default function CanchaBackground() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/' || pathname === '/login';

  if (isLogin) return <FondoFutbolAnimado />;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -20,
        background: '#050e0a',
      }}
    >
      {/* Gradiente radial muy sutil — da profundidad sin distraer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,200,80,0.045) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Línea de acento superior */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.18) 40%, rgba(74,222,128,0.18) 60%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}