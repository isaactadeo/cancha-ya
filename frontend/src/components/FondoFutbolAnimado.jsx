import { useEffect, useRef } from 'react';

// La cancha ocupa este % del canvas
const CAMPO = { x0: 5, y0: 8, x1: 95, y1: 92 };

// Color fijo verde neón — sin rainbow
const NEON      = '#00e87a';
const NEON_GLOW = '#00ff87';

const FORMACION = {
  A: [
    { id: 0, rol: 'arquero',   color1: '#fb923c', color2: '#ea580c', base: { x: 7,  y: 50 } },
    { id: 1, rol: 'defensa',   color1: '#f87171', color2: '#dc2626', base: { x: 20, y: 32 } },
    { id: 2, rol: 'defensa',   color1: '#f87171', color2: '#dc2626', base: { x: 20, y: 68 } },
    { id: 3, rol: 'medio',     color1: '#ef4444', color2: '#b91c1c', base: { x: 38, y: 50 } },
    { id: 4, rol: 'delantero', color1: '#dc2626', color2: '#991b1b', base: { x: 58, y: 50 } },
  ],
  B: [
    { id: 5, rol: 'arquero',   color1: '#cb38f8', color2: '#c7026e', base: { x: 93, y: 50 } },
    { id: 6, rol: 'defensa',   color1: '#60a5fa', color2: '#2563eb', base: { x: 80, y: 32 } },
    { id: 7, rol: 'defensa',   color1: '#60a5fa', color2: '#2563eb', base: { x: 80, y: 68 } },
    { id: 8, rol: 'medio',     color1: '#3b82f6', color2: '#1d4ed8', base: { x: 62, y: 50 } },
    { id: 9, rol: 'delantero', color1: '#2563eb', color2: '#1e3a8a', base: { x: 42, y: 50 } },
  ]
};

const EST = { POS: 'pos', PASE: 'pase', REMATE: 'remate', GOL: 'gol', REINICIO: 'reinicio' };

function crearJugadores() {
  return ['A','B'].flatMap(eq =>
    FORMACION[eq].map(p => ({
      ...p, equipo: eq,
      x: p.base.x, y: p.base.y,
      tOffset: Math.random() * Math.PI * 2,
    }))
  );
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function moverHacia(obj, dest, vel, dt) {
  const d = dist(obj, dest);
  if (d < 0.3) { obj.x = dest.x; obj.y = dest.y; return true; }
  const paso = Math.min(vel * dt, d);
  obj.x += (dest.x - obj.x) / d * paso;
  obj.y += (dest.y - obj.y) / d * paso;
  return d <= vel * dt + 0.1;
}

function jugMasCercano(lista, punto, equipo) {
  let mejor = null, dMin = Infinity;
  lista.filter(j => j.equipo === equipo).forEach(j => {
    const d = dist(j, punto); if (d < dMin) { dMin = d; mejor = j; }
  });
  return { j: mejor, d: dMin };
}

export default function FondoFutbolAnimado() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  const S = useRef({
    jugadores:  crearJugadores(),
    pelota:     { x: 50, y: 50, rot: 0 },
    estado:     EST.POS,
    posesion:   'A',
    poseedor:   0,
    objetivo:   null,
    velPelota:  0,
    timerAcc:   0,
    timerEst:   0,
    t:          0,
    particulas: [],
    trail:      [],
    golEquipo:  null,
    shake:      0,
    flash:      0,
    shockwave:  null,
    slowMo:     1.0,
    slowMoTimer: 0,
    netShake:   0,
    ambientParticles: [],
    gridOffset: 0,
  });

  useEffect(() => {
    const ambient = [];
    for (let i = 0; i < 180; i++) {
      ambient.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        radius: 1 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 2,
        alpha: 0.2 + Math.random() * 0.5,
        color: `hsl(${Math.random() * 40 + 130}, 80%, 60%)`, // sólo verdes
      });
    }
    S.current.ambientParticles = ambient;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    const tick = (ts) => {
      let dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (S.current.slowMoTimer > 0) {
        dt *= S.current.slowMo;
        S.current.slowMoTimer -= dt;
        if (S.current.slowMoTimer <= 0) S.current.slowMo = 1.0;
      }

      update(dt);
      draw(canvas);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  function update(dt) {
    const s = S.current;
    s.t        += dt;
    s.timerAcc += dt;
    s.timerEst += dt;
    s.gridOffset += dt * 25;

    s.shake    = Math.max(0, s.shake    - dt * 8);
    s.flash    = Math.max(0, s.flash    - dt * 2.5);
    s.netShake = Math.max(0, s.netShake - dt * 5);

    if (s.shockwave) {
      s.shockwave.radio += dt * 180;
      s.shockwave.alpha -= dt * 2.8;
      if (s.shockwave.alpha <= 0) s.shockwave = null;
    }

    s.particulas = s.particulas.filter(p => p.vida > 0);
    s.particulas.forEach(p => {
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.vy += (p.tipo === 'confeti' ? 10 : 18) * dt;
      p.vida -= dt * (p.tipo === 'confeti' ? 0.9 : 1.4);
      if (p.rot !== undefined) p.rot += p.rotVel * dt;
    });

    s.ambientParticles.forEach(p => {
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      if (p.x < -5) p.x = 105;
      if (p.x > 105) p.x = -5;
      if (p.y < -5) p.y = 105;
      if (p.y > 105) p.y = -5;
      p.alpha = 0.2 + Math.sin(s.t * 0.5 + p.x * 0.1) * 0.3;
    });

    s.trail.push({ x: s.pelota.x, y: s.pelota.y });
    if (s.trail.length > 15) s.trail.shift();

    if (s.estado === EST.POS) {
      moverJugadores(dt);
      const pos = s.jugadores.find(j => j.id === s.poseedor);
      if (pos) {
        s.pelota.x += (pos.x - s.pelota.x) * 0.25;
        s.pelota.y += (pos.y - s.pelota.y) * 0.25;
      }
      if (s.timerAcc > 1.2 + Math.random() * 1.4) { s.timerAcc = 0; decidir(); }
    }

    else if (s.estado === EST.PASE || s.estado === EST.REMATE) {
      moverJugadores(dt);
      s.pelota.rot += (s.estado === EST.REMATE ? 28 : 16) * dt;
      const llegó = moverHacia(s.pelota, s.objetivo, s.velPelota, dt);
      if (llegó) {
        if (s.estado === EST.REMATE) {
          const gol = esGol(s.pelota);
          if (gol) {
            s.estado    = EST.GOL;
            s.golEquipo = gol;
            s.timerEst  = 0;
            s.flash     = 0.9;
            s.shake     = 14;
            s.netShake  = 1.2;
            s.shockwave = { x: s.pelota.x, y: s.pelota.y, radio: 4, alpha: 1 };
            s.slowMo    = 0.28;
            s.slowMoTimer = 0.6;
            emitirGolPremium(s.pelota.x, s.pelota.y, gol);
          } else {
            cambiarPosesion(s);
          }
        } else {
          const { j: rival, d } = jugMasCercano(s.jugadores, s.pelota, s.posesion === 'A' ? 'B' : 'A');
          if (rival && d < 6 && Math.random() < 0.15) {
            s.posesion = s.posesion === 'A' ? 'B' : 'A';
            s.poseedor = rival.id;
          } else {
            const { j: rec } = jugMasCercano(s.jugadores, s.pelota, s.posesion);
            if (rec) s.poseedor = rec.id;
          }
          s.estado = EST.POS; s.objetivo = null;
        }
      }
    }

    else if (s.estado === EST.GOL) {
      s.jugadores.filter(j => j.equipo === s.golEquipo).forEach(j =>
        moverHacia(j, { x: 48 + Math.random()*4, y: 48 + Math.random()*4 }, 22, dt)
      );
      if (Math.random() < 0.3) emitirConfetiAleatorio();
      if (s.timerEst > 2.4) { s.estado = EST.REINICIO; s.timerEst = 0; }
    }

    else if (s.estado === EST.REINICIO) {
      let todos = true;
      s.jugadores.forEach(j => { if (!moverHacia(j, j.base, 22, dt)) todos = false; });
      moverHacia(s.pelota, { x: 50, y: 50 }, 35, dt);
      if (todos && s.timerEst > 0.8) {
        s.pelota    = { x: 50, y: 50, rot: 0 };
        s.trail     = [];
        s.posesion  = s.golEquipo === 'A' ? 'B' : 'A';
        const { j } = jugMasCercano(s.jugadores, { x: 50, y: 50 }, s.posesion);
        s.poseedor  = j ? j.id : s.jugadores.find(x => x.equipo === s.posesion).id;
        s.golEquipo = null;
        s.estado    = EST.POS;
        s.timerAcc  = 1.5;
      }
    }
  }

  function moverJugadores(dt) {
    const s = S.current;
    s.jugadores.forEach(j => {
      if (j.id === s.poseedor) {
        const dirX = j.equipo === 'A' ? 1 : -1;
        const tx = clamp(j.base.x + dirX * 10, 10, 90);
        const ty = j.base.y + Math.sin(s.t * 1.1 + j.tOffset) * 5;
        moverHacia(j, { x: tx, y: clamp(ty, 12, 88) }, 11, dt);
        return;
      }
      if (j.rol === 'arquero') {
        const ty = j.base.y + Math.sin(s.t * 0.7 + j.tOffset) * 9;
        moverHacia(j, { x: j.base.x, y: clamp(ty, 28, 72) }, 7, dt);
        return;
      }
      const tienePosesion = j.equipo === s.posesion;
      const dirX  = j.equipo === 'A' ? 1 : -1;
      const shift = tienePosesion ? dirX * 7 : dirX * -4;
      const ox = clamp(j.base.x + shift + Math.sin(s.t * 0.6 + j.tOffset) * 3, 8, 92);
      const oy = clamp(j.base.y + Math.cos(s.t * 0.85 + j.tOffset * 1.2) * 5, 10, 90);
      moverHacia(j, { x: ox, y: oy }, 9, dt);
    });
  }

  function decidir() {
    const s = S.current;
    const pos = s.jugadores.find(j => j.id === s.poseedor);
    if (!pos) return;

    const dl      = s.jugadores.find(j => j.equipo === s.posesion && j.rol === 'delantero');
    const enArea  = s.posesion === 'A' ? pos.x > 67 : pos.x < 33;
    const dlEnArea = dl && (s.posesion === 'A' ? dl.x > 64 : dl.x < 36);

    if ((enArea || dlEnArea) && Math.random() < 0.55) {
      const tirador = enArea ? pos : dl;
      const arcoX   = s.posesion === 'A' ? 95.5 : 4.5;
      const arcoY   = 43 + Math.random() * 14;
      s.pelota.x  = tirador.x; s.pelota.y = tirador.y;
      s.objetivo  = { x: arcoX, y: arcoY };
      s.velPelota = 68 + Math.random() * 18;
      s.estado    = EST.REMATE;
      s.poseedor  = tirador.id;
      emitirChispas(tirador.x, tirador.y);
      return;
    }

    const comp = s.jugadores
      .filter(j => j.equipo === s.posesion && j.id !== s.poseedor && j.rol !== 'arquero')
      .sort((a, b) => s.posesion === 'A' ? b.x - a.x : a.x - b.x);

    if (comp.length) {
      const rec   = comp[Math.floor(Math.random() * Math.min(2, comp.length))];
      s.objetivo  = { x: rec.x, y: rec.y };
      s.velPelota = 45 + Math.random() * 15;
      s.estado    = EST.PASE;
      s.poseedor  = rec.id;
      emitirEstela(s.pelota.x, s.pelota.y);
    }
  }

  function esGol(p) {
    if (p.x <= 5.2 && p.y > 41 && p.y < 59) return 'B';
    if (p.x >= 94.8 && p.y > 41 && p.y < 59) return 'A';
    return null;
  }

  function cambiarPosesion(s) {
    s.posesion  = s.posesion === 'A' ? 'B' : 'A';
    const arq   = s.jugadores.find(j => j.equipo === s.posesion && j.rol === 'arquero');
    s.poseedor  = arq ? arq.id : s.jugadores.find(j => j.equipo === s.posesion).id;
    s.pelota.x  = arq ? arq.x : (s.posesion === 'A' ? 7 : 93);
    s.pelota.y  = 50;
    s.estado    = EST.POS; s.objetivo = null; s.timerAcc = 0.5;
  }

  // ── Partículas ────────────────────────────────────────
  function emitirChispas(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 25;
      S.current.particulas.push({
        x, y, tipo: 'chispa',
        vx: Math.cos(a)*v, vy: Math.sin(a)*v - 8,
        vida: 0.6, color: NEON, r: 2 + Math.random() * 3,
        rot: 0, rotVel: 0,
      });
    }
  }

  function emitirEstela(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, v = 12 + Math.random() * 18;
      S.current.particulas.push({
        x, y, tipo: 'estela',
        vx: Math.cos(a)*v, vy: Math.sin(a)*v,
        vida: 0.4, color: NEON_GLOW, r: 1.5,
        rot: 0, rotVel: 0,
      });
    }
  }

  // Gol: confeti verde/blanco/dorado + chispas, sin rainbow
  function emitirGolPremium(x, y, equipo) {
    const s = S.current;
    const teamColor = equipo === 'A' ? '#f87171' : '#60a5fa';

    // Confeti en verde, blanco, dorado y color del equipo
    const palette = [NEON, '#ffffff', '#fbbf24', teamColor];
    for (let i = 0; i < 65; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 28 + Math.random() * 48;
      s.particulas.push({
        x, y, tipo: 'confeti',
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 14,
        vida: 1.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        r: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        rotVel: (Math.random() - 0.5) * 12,
      });
    }

    // Chispas verdes rápidas
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 45 + Math.random() * 65;
      s.particulas.push({
        x, y, tipo: 'chispa',
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10,
        vida: 1.0, color: NEON_GLOW, r: 2,
        rot: 0, rotVel: 0,
      });
    }
  }

  function emitirConfetiAleatorio() {
    const s = S.current;
    const palette = [NEON, '#ffffff', '#fbbf24'];
    for (let i = 0; i < 4; i++) {
      const x = 20 + Math.random() * 60;
      const y = 20 + Math.random() * 60;
      s.particulas.push({
        x, y, tipo: 'confeti',
        vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 30 - 15,
        vida: 0.85,
        color: palette[Math.floor(Math.random() * palette.length)],
        r: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotVel: (Math.random() - 0.5) * 10,
      });
    }
  }

  // ── Draw ─────────────────────────────────────────────
  function draw(canvas) {
    const ctx = canvas.getContext('2d');
    const CW = canvas.width, CH = canvas.height;
    const s  = S.current;

    if (s.shake > 0.1) {
      const intensity = s.shake * 1.8;
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    const px = v => (v / 100) * CW;
    const py = v => (v / 100) * CH;
    const pr = v => (v / 100) * Math.min(CW, CH);

    ctx.clearRect(0, 0, CW, CH);

    // Fondo
    const gradBg = ctx.createLinearGradient(0, 0, CW, CH);
    gradBg.addColorStop(0, '#061a1a');
    gradBg.addColorStop(1, '#020c0c');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, CW, CH);

    // Grid holográfico (color fijo verde)
    const gridSpacing = pr(8);
    const offset = s.gridOffset % gridSpacing;
    ctx.lineWidth = pr(0.2);
    for (let x = offset; x < CW; x += gridSpacing) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,232,122,0.18)`;
      ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke();
    }
    for (let y = offset; y < CH; y += gridSpacing) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,232,122,0.18)`;
      ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
    }

    // Césped con franjas
    const gradField = ctx.createLinearGradient(0, 0, CW, CH);
    gradField.addColorStop(0, 'rgba(0,30,20,0.8)');
    gradField.addColorStop(1, 'rgba(0,15,10,0.9)');
    ctx.fillStyle = gradField;
    ctx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `rgba(0,255,100,${0.025 + Math.sin(s.t * 1.5 + i) * 0.015})`;
      ctx.fillRect(0, i * (CH / 12), CW, CH / 12);
    }

    // ── Líneas del campo (verde fijo) ──
    const cx0 = px(CAMPO.x0), cy0 = py(CAMPO.y0);
    const cw  = px(CAMPO.x1) - cx0, ch = py(CAMPO.y1) - cy0;
    const cx1 = cx0 + cw;
    const midX = CW / 2, midY = CH / 2;

    ctx.shadowBlur  = 8;
    ctx.shadowColor = NEON_GLOW;
    ctx.lineWidth   = Math.max(2, pr(0.45));
    ctx.strokeStyle = NEON;

    // Borde exterior
    ctx.strokeRect(cx0, cy0, cw, ch);
    // Línea central
    ctx.beginPath(); ctx.moveTo(midX, cy0); ctx.lineTo(midX, cy0 + ch); ctx.stroke();
    // Círculo central
    ctx.beginPath(); ctx.arc(midX, midY, pr(9.5), 0, Math.PI*2); ctx.stroke();
    // Punto central
    ctx.fillStyle = NEON;
    ctx.beginPath(); ctx.arc(midX, midY, pr(0.8), 0, Math.PI*2); ctx.fill();

    // Áreas grandes
    const agW = cw * 0.17, agH = ch * 0.44, agY = midY - agH/2;
    ctx.strokeRect(cx0,       agY, agW,  agH);
    ctx.strokeRect(cx1 - agW, agY, agW,  agH);
    // Áreas chicas
    const acW = cw * 0.08, acH = ch * 0.26, acY = midY - acH/2;
    ctx.strokeRect(cx0,       acY, acW, acH);
    ctx.strokeRect(cx1 - acW, acY, acW, acH);

    // Arcos — con netShake independiente para cada arco
    const arcoH = ch * 0.18, arcoY = midY - arcoH/2;
    const arcoProf = cw * 0.025;
    ctx.lineWidth   = Math.max(2.5, pr(0.5));
    ctx.strokeStyle = NEON;
    ctx.shadowBlur  = 10;

    if (s.netShake > 0) {
      const shakeAmt = Math.sin(s.t * 50) * s.netShake * 2;
      // Arco izquierdo sacudiéndose
      ctx.save(); ctx.translate(shakeAmt, 0);
      ctx.strokeRect(cx0 - arcoProf, arcoY, arcoProf, arcoH);
      ctx.restore();
      // Arco derecho sacudiéndose en sentido opuesto
      ctx.save(); ctx.translate(-shakeAmt, 0);
      ctx.strokeRect(cx1, arcoY, arcoProf, arcoH);
      ctx.restore();
    } else {
      ctx.strokeRect(cx0 - arcoProf, arcoY, arcoProf, arcoH);
      ctx.strokeRect(cx1,            arcoY, arcoProf, arcoH);
    }

    ctx.shadowBlur = 0;

    // ── Shockwave (onda de gol) ──
    if (s.shockwave) {
      const sw = s.shockwave;
      const rPx = pr(sw.radio);
      ctx.globalAlpha = Math.max(0, Math.min(0.9, sw.alpha));
      // anillo interior blanco
      ctx.beginPath(); ctx.arc(px(sw.x), py(sw.y), rPx, 0, Math.PI*2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = pr(1.2);
      ctx.shadowBlur  = 18; ctx.shadowColor = NEON_GLOW;
      ctx.stroke();
      // anillo exterior verde
      ctx.beginPath(); ctx.arc(px(sw.x), py(sw.y), rPx * 1.35, 0, Math.PI*2);
      ctx.strokeStyle = NEON;
      ctx.lineWidth   = pr(0.6);
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    // ── Partículas ambientales ──
    s.ambientParticles.forEach(p => {
      ctx.globalAlpha = p.alpha * 0.55;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), pr(p.radius * 0.15), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Estela de la pelota ──
    if (s.estado === EST.PASE || s.estado === EST.REMATE) {
      for (let i = 0; i < s.trail.length; i++) {
        const p     = s.trail[i];
        const ratio = i / s.trail.length;
        ctx.globalAlpha = ratio * 0.65;
        ctx.fillStyle   = NEON;
        ctx.shadowBlur  = 8; ctx.shadowColor = NEON_GLOW;
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), pr(1.0) * ratio, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    // ── Partículas de eventos ──
    s.particulas.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.vida);
      if (p.tipo === 'confeti') {
        ctx.save();
        ctx.translate(px(p.x), py(p.y));
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r/1.5);
        ctx.restore();
      } else {
        ctx.fillStyle  = p.color;
        ctx.shadowBlur = 5; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(px(p.x), py(p.y), p.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    ctx.globalAlpha = 1;

    // ── Jugadores ──
    const JR = pr(1.7);
    s.jugadores.forEach(j => {
      const jx = px(j.x), jy = py(j.y);
      const esPoseedor = j.id === s.poseedor;

      // Sombra
      ctx.shadowBlur  = 8;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.fillStyle   = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(jx, jy + JR*0.7, JR*0.9, JR*0.4, 0, 0, Math.PI*2); ctx.fill();

      // Cuerpo
      const gradJug = ctx.createRadialGradient(jx - JR*0.3, jy - JR*0.3, JR*0.2, jx, jy, JR);
      gradJug.addColorStop(0, j.color1);
      gradJug.addColorStop(1, j.color2);
      ctx.fillStyle = gradJug;
      ctx.beginPath(); ctx.arc(jx, jy, JR, 0, Math.PI*2); ctx.fill();

      // Reflejo especular
      ctx.fillStyle = 'rgba(255,255,200,0.4)';
      ctx.beginPath(); ctx.arc(jx - JR*0.3, jy - JR*0.3, JR*0.5, 0, Math.PI*2); ctx.fill();

      // Anillo del poseedor (verde fijo)
      if (esPoseedor) {
        ctx.strokeStyle = NEON;
        ctx.lineWidth   = pr(0.35);
        ctx.shadowBlur  = 14; ctx.shadowColor = NEON_GLOW;
        ctx.beginPath(); ctx.arc(jx, jy, JR*1.28, 0, Math.PI*2); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    });

    // ── Pelota ──
    const bx = px(s.pelota.x), by = py(s.pelota.y);
    const BR = pr(1.2);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(s.pelota.rot);
    ctx.shadowBlur  = 12; ctx.shadowColor = NEON_GLOW;
    const gradBall = ctx.createRadialGradient(-BR*0.2, -BR*0.2, BR*0.2, 0, 0, BR);
    gradBall.addColorStop(0, '#fff8e0');
    gradBall.addColorStop(0.6, '#e0e0e0');
    gradBall.addColorStop(1, '#a0a0a0');
    ctx.fillStyle = gradBall;
    ctx.beginPath(); ctx.arc(0, 0, BR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = BR * 0.12;
    for (let i = 0; i < 5; i++) {
      const a = (i/5)*Math.PI*2 - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*BR*0.45, Math.sin(a)*BR*0.45);
      ctx.lineTo(Math.cos(a)*BR*0.9,  Math.sin(a)*BR*0.9);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i/5)*Math.PI*2 - Math.PI/2;
      i === 0
        ? ctx.moveTo(Math.cos(a)*BR*0.45, Math.sin(a)*BR*0.45)
        : ctx.lineTo(Math.cos(a)*BR*0.45, Math.sin(a)*BR*0.45);
    }
    ctx.fill();
    // reflejo
    const specGr = ctx.createRadialGradient(-BR*0.3, -BR*0.3, 0, 0, 0, BR*0.7);
    specGr.addColorStop(0, 'rgba(255,255,255,0.55)');
    specGr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = specGr;
    ctx.beginPath(); ctx.arc(0, 0, BR, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // ── Flash de gol (verde) ──
    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(0,255,135,${s.flash * 0.45})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // ── Texto GOL limpio ──
    if (s.estado === EST.GOL) {
      const progress  = Math.min(1, s.timerEst * 2.8);
      const fadeOut   = s.timerEst > 2.0 ? Math.max(0, 1 - (s.timerEst - 2.0) * 3) : 1;
      const al        = progress * fadeOut;

      if (al > 0.01) {
        ctx.fillStyle = `rgba(0,0,0,${al * 0.52})`;
        ctx.fillRect(0, 0, CW, CH);

        // Entrada elástica suave (sin shake lateral)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const scale   = 0.6 + 0.4 * easeOut;

        ctx.save();
        ctx.translate(CW/2, CH/2);
        ctx.scale(scale, scale);
        ctx.globalAlpha  = al;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        // Líneas decorativas
        ctx.strokeStyle = NEON;
        ctx.lineWidth   = pr(0.2);
        ctx.shadowBlur  = 12; ctx.shadowColor = NEON_GLOW;
        const lW = pr(20);
        ctx.beginPath(); ctx.moveTo(-lW, -pr(9)); ctx.lineTo(lW, -pr(9)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-lW,  pr(7)); ctx.lineTo(lW,  pr(7)); ctx.stroke();

        // GOAL
        ctx.shadowBlur  = 28; ctx.shadowColor = NEON_GLOW;
        ctx.fillStyle   = '#ffffff';
        ctx.font        = `900 ${pr(13)}px "Orbitron","Impact",monospace`;
        ctx.fillText('G O A L', 0, -pr(2));

        ctx.strokeStyle = NEON;
        ctx.lineWidth   = pr(0.45);
        ctx.strokeText('G O A L', 0, -pr(2));

        // Subtexto equipo
        const teamColor = s.golEquipo === 'A' ? '#f87171' : '#60a5fa';
        ctx.shadowBlur  = 10; ctx.shadowColor = teamColor;
        ctx.fillStyle   = teamColor;
        ctx.font        = `700 ${pr(4)}px "Orbitron",monospace`;
        ctx.fillText(`EQUIPO  ${s.golEquipo}`, 0, pr(4.5));

        ctx.restore();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }
    }

    // Viñeta
    const vigGrad = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, Math.max(CW,CH)/1.8);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CW, CH);

    if (s.shake > 0.1) ctx.restore();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -20, background: '#010a0a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,255,100,0.06) 100%)',
      }} />
    </div>
  );
}