// src/components/CanchaBackground.jsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Misma geometría del icosaedro truncado del FuturisticBall
// ─────────────────────────────────────────────────────────────
function buildTruncatedIcosahedron(radius = 1) {
  const φ = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [];
  const perms3 = (a, b, c) => {
    [[a, b, c], [b, c, a], [c, a, b]].forEach(([x, y, z]) => {
      for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1])
        rawVerts.push(new THREE.Vector3(x * sx, y * sy, z * sz));
    });
  };
  perms3(0, 1, 3 * φ);
  perms3(1, 2 + φ, 2 * φ);
  perms3(2, 1 + 2 * φ, φ);

  const seen = new Map();
  const verts = [];
  rawVerts.forEach(v => {
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    if (!seen.has(key)) { seen.set(key, verts.length); verts.push(v.clone().normalize()); }
  });

  const N = verts.length;
  let minDist = Infinity;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const d = verts[i].distanceTo(verts[j]);
      if (d > 0.001 && d < minDist) minDist = d;
    }
  const edgeLen = minDist * 1.08;

  const adj = Array.from({ length: N }, () => []);
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      if (verts[i].distanceTo(verts[j]) < edgeLen) {
        adj[i].push(j); adj[j].push(i);
      }

  function orderFace(indices) {
    const center = new THREE.Vector3();
    indices.forEach(i => center.add(verts[i]));
    center.divideScalar(indices.length);
    const normal = center.clone().normalize();
    const ref = verts[indices[0]].clone().sub(center).normalize();
    return [...indices].sort((a, b) => {
      const va = verts[a].clone().sub(center).normalize();
      const vb = verts[b].clone().sub(center).normalize();
      const ca = new THREE.Vector3().crossVectors(ref, va);
      const cb = new THREE.Vector3().crossVectors(ref, vb);
      return Math.atan2(ca.dot(normal), ref.dot(va)) - Math.atan2(cb.dot(normal), ref.dot(vb));
    });
  }

  const facesSet = new Set();
  const faces = [];
  for (let i = 0; i < N; i++) {
    const nb = adj[i];
    for (let ni = 0; ni < nb.length; ni++) {
      for (let nj = ni + 1; nj < nb.length; nj++) {
        const a = nb[ni], b = nb[nj];
        if (!adj[a].includes(b)) continue;
        const n = new THREE.Vector3().crossVectors(
          verts[a].clone().sub(verts[i]),
          verts[b].clone().sub(verts[i])
        ).normalize();
        const d = n.dot(verts[i]);
        const onPlane = verts.map((v, idx) => idx).filter(idx =>
          Math.abs(n.dot(verts[idx]) - d) < 0.0015
        );
        if (onPlane.length !== 5 && onPlane.length !== 6) continue;
        const key = [...onPlane].sort((a, b) => a - b).join(',');
        if (!facesSet.has(key)) {
          facesSet.add(key);
          faces.push({ verts: orderFace(onPlane), isPentagon: onPlane.length === 5 });
        }
      }
    }
  }

  const groups = [];
  faces.forEach(({ verts: fv, isPentagon }) => {
    const center = new THREE.Vector3();
    fv.forEach(i => center.add(verts[i]));
    center.divideScalar(fv.length);
    const normal = center.clone().normalize();
    const inset = 0.038, lift = 0.013;
    const pts = fv.map(i => verts[i].clone().lerp(center, inset).addScaledVector(normal, lift));
    const apex = center.clone().addScaledVector(normal, lift);

    const positions = [], normals_ = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      positions.push(apex.x, apex.y, apex.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      for (let j = 0; j < 3; j++) normals_.push(normal.x, normal.y, normal.z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals_, 3));
    geo.scale(radius, radius, radius);

    const mat = new THREE.MeshStandardMaterial({
      color: isPentagon ? 0x111111 : 0x1a1a1a,
      roughness: isPentagon ? 0.6 : 0.4,
      metalness: 0.3,
      emissive: isPentagon ? 0x000000 : 0x0a0a0a,
      emissiveIntensity: isPentagon ? 0 : 0.1,
    });

    groups.push({ geo, mat });
  });

  const edgeSet = new Set();
  const edges = [];
  for (let i = 0; i < N; i++) {
    adj[i].forEach(j => {
      const key = Math.min(i, j) + '-' + Math.max(i, j);
      if (!edgeSet.has(key)) { edgeSet.add(key); edges.push([i, j]); }
    });
  }

  return { groups, edges, verts, radius };
}

// ─────────────────────────────────────────────────────────────
// El icosaedro que gira — versión fondo (grande, oscuro, sutil)
// ─────────────────────────────────────────────────────────────
function BackgroundBall({ isLogin }) {
  const groupRef = useRef();
  const { groups, edges, verts, radius } = useMemo(() => buildTruncatedIcosahedron(1), []);

  const edgeMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.2,
    }), []);

  // En login: gira más rápido y está centrado
  // En otras páginas: gira muy lento, desplazado
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    if (isLogin) {
      groupRef.current.rotation.y = t * 0.12;
      groupRef.current.rotation.x = t * 0.05;
    } else {
      groupRef.current.rotation.y = t * 0.06;
      groupRef.current.rotation.x = t * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Caras */}
      {groups.map(({ geo, mat }, idx) => (
        <mesh key={idx} geometry={geo} material={mat} />
      ))}

      {/* Aristas */}
      {edges.map(([i, j], idx) => {
        const a = verts[i].clone().multiplyScalar(radius);
        const b = verts[j].clone().multiplyScalar(radius);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const nrm = mid.clone().normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        return (
          <mesh
            key={`e${idx}`}
            position={mid.clone().addScaledVector(nrm, 0.01)}
            quaternion={q}
            material={edgeMat}
          >
            <cylinderGeometry args={[0.006, 0.006, len, 4, 1]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({ isLogin }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 6]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-4, -3, -2]} intensity={0.2} color="#aaaaff" />
      <pointLight position={[3, 3, 4]} intensity={0.4} color="#ffffff" />
      <BackgroundBall isLogin={isLogin} />
    </>
  );
}

export default function CanchaBackground() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/' || pathname === '/login';

  // En login: enorme, centrado, protagonista
  // En otras páginas: grande pero discreto, esquina derecha
  const canvasStyle = isLogin
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        pointerEvents: 'none',
      }
    : {
        position: 'fixed',
        top: '-10%',
        right: '-15%',
        width: '65vw',
        height: '65vw',
        maxWidth: '700px',
        maxHeight: '700px',
        zIndex: -10,
        pointerEvents: 'none',
        opacity: 0.35,
      };

  const cameraProps = isLogin
    ? { position: [0, 0, 5.5], fov: 42 }
    : { position: [0, 0, 2.8], fov: 55 };

  // Escala del icosaedro
  const scale = isLogin ? 1.1 : 1.4;

  return (
    <>
      {/* Fondo base negro */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -20,
          background: '#080808',
        }}
      />

      {/* Gradiente radial sutil */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -15,
          background: isLogin
            ? 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.015) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Línea de acento superior (solo en páginas internas) */}
      {!isLogin && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            zIndex: -14,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.08) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Canvas Three.js */}
      <div style={canvasStyle}>
        <Canvas
          camera={cameraProps}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <group scale={[scale, scale, scale]}>
            <Scene isLogin={isLogin} />
          </group>
        </Canvas>
      </div>
    </>
  );
}