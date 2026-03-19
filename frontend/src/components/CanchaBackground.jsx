export default function CanchaBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Fondo verde césped */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #1a5c2a 0%, #2d7a3a 30%, #1e6b2e 60%, #164d22 100%)'
      }} />

      {/* Rayas del césped */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute inset-y-0" style={{
          left: `${i * 8.33}%`,
          width: '8.33%',
          background: i % 2 === 0
            ? 'rgba(0,0,0,0.06)'
            : 'rgba(255,255,255,0.03)',
        }} />
      ))}

      {/* SVG cancha de fútbol */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Borde cancha */}
        <rect x="50" y="50" width="900" height="500" fill="none" stroke="white" strokeWidth="3"/>

        {/* Línea del medio */}
        <line x1="500" y1="50" x2="500" y2="550" stroke="white" strokeWidth="2"/>

        {/* Círculo central */}
        <circle cx="500" cy="300" r="80" fill="none" stroke="white" strokeWidth="2"/>
        <circle cx="500" cy="300" r="4" fill="white"/>

        {/* Área grande izquierda */}
        <rect x="50" y="175" width="150" height="250" fill="none" stroke="white" strokeWidth="2"/>
        {/* Área chica izquierda */}
        <rect x="50" y="225" width="55" height="150" fill="none" stroke="white" strokeWidth="2"/>
        {/* Arco izquierdo */}
        <rect x="25" y="255" width="25" height="90" fill="none" stroke="white" strokeWidth="2"/>
        {/* Semicírculo área izquierda */}
        <path d="M200 225 A80 80 0 0 1 200 375" fill="none" stroke="white" strokeWidth="2"/>

        {/* Área grande derecha */}
        <rect x="800" y="175" width="150" height="250" fill="none" stroke="white" strokeWidth="2"/>
        {/* Área chica derecha */}
        <rect x="895" y="225" width="55" height="150" fill="none" stroke="white" strokeWidth="2"/>
        {/* Arco derecho */}
        <rect x="950" y="255" width="25" height="90" fill="none" stroke="white" strokeWidth="2"/>
        {/* Semicírculo área derecha */}
        <path d="M800 225 A80 80 0 0 0 800 375" fill="none" stroke="white" strokeWidth="2"/>

        {/* Punto penal izquierdo */}
        <circle cx="130" cy="300" r="4" fill="white"/>
        {/* Punto penal derecho */}
        <circle cx="870" cy="300" r="4" fill="white"/>

        {/* Corners */}
        <path d="M50 70 A20 20 0 0 1 70 50" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M930 50 A20 20 0 0 1 950 70" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M950 530 A20 20 0 0 1 930 550" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M70 550 A20 20 0 0 1 50 530" fill="none" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  )
}