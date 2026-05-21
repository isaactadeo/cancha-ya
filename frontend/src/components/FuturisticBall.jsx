// src/components/FuturisticBall.jsx
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Construye la geometría exacta de un icosaedro truncado
// ─────────────────────────────────────────────────────────────
function buildTruncatedIcosahedron(radius = 1.25) {
  const φ = (1 + Math.sqrt(5)) / 2;

  const rawVerts = [];
  const perms3 = (a, b, c) => {
    [[a,b,c],[b,c,a],[c,a,b]].forEach(([x,y,z]) => {
      for (const sx of [1,-1]) for (const sy of [1,-1]) for (const sz of [1,-1])
        rawVerts.push(new THREE.Vector3(x*sx, y*sy, z*sz));
    });
  };
  perms3(0, 1, 3*φ);
  perms3(1, 2+φ, 2*φ);
  perms3(2, 1+2*φ, φ);

  const seen = new Map();
  const verts = [];
  rawVerts.forEach(v => {
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    if (!seen.has(key)) { seen.set(key, verts.length); verts.push(v.clone().normalize()); }
  });

  const N = verts.length;
  let minDist = Infinity;
  for (let i = 0; i < N; i++)
    for (let j = i+1; j < N; j++) {
      const d = verts[i].distanceTo(verts[j]);
      if (d > 0.001 && d < minDist) minDist = d;
    }
  const edgeLen = minDist * 1.08;

  const adj = Array.from({ length: N }, () => []);
  for (let i = 0; i < N; i++)
    for (let j = i+1; j < N; j++)
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
      for (let nj = ni+1; nj < nb.length; nj++) {
        const a = nb[ni], b = nb[nj];
        if (!adj[a].includes(b)) continue;
        const n = new THREE.Vector3().crossVectors(
          verts[a].clone().sub(verts[i]),
          verts[b].clone().sub(verts[i])
        ).normalize();
        const d = n.dot(verts[i]);
        const onPlane = verts.map((v,idx) => idx).filter(idx =>
          Math.abs(n.dot(verts[idx]) - d) < 0.0015
        );
        if (onPlane.length !== 5 && onPlane.length !== 6) continue;
        const key = [...onPlane].sort((a,b)=>a-b).join(',');
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

    const inset = 0.038;
    const lift = 0.013;
    const pts = fv.map(i => verts[i].clone().lerp(center, inset).addScaledVector(normal, lift));
    const apex = center.clone().addScaledVector(normal, lift);

    const positions = [];
    const normals_ = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i+1) % pts.length];
      positions.push(apex.x, apex.y, apex.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      for (let j = 0; j < 3; j++) {
        normals_.push(normal.x, normal.y, normal.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals_, 3));
    geo.scale(radius, radius, radius);

    // COLORES PUROS: blanco y negro con buena reflectividad
    const mat = new THREE.MeshStandardMaterial({
      color: isPentagon ? 0x000000 : 0xffffff,
      roughness: isPentagon ? 0.28 : 0.18,
metalness: 0.02,
      emissive: isPentagon ? 0x000000 : 0x333333,
      emissiveIntensity: isPentagon ? 0 : 0.05,
    });

    groups.push({ geo, mat });
  });

  const edgeSet = new Set();
  const edges = [];
  for (let i = 0; i < N; i++) {
    adj[i].forEach(j => {
      const key = Math.min(i,j)+'-'+Math.max(i,j);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([i, j]);
      }
    });
  }

  return { groups, edges, verts, radius };
}

// ─────────────────────────────────────────────────────────────
// Componente React Three Fiber
// ─────────────────────────────────────────────────────────────
const FuturisticBall = ({ 
  onSpinComplete, 
  triggerSpin, 
  intensidadBrillo = 0.5,
  escala = 1.0,
  posicionY = 0 
}) => {
  const groupRef = useRef();
  const spinRef = useRef(false);

  const { groups, edges, verts, radius } = useMemo(
    () => buildTruncatedIcosahedron(1.25),
    []
  );

  const edgeMat = useMemo(() =>
  new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.4, metalness: 0.15 }),
  []);

  useEffect(() => {
    if (!triggerSpin) return;
    spinRef.current = true;
    let count = 0;
    const iv = setInterval(() => {
      if (!groupRef.current) return;
      groupRef.current.rotation.y += 0.22;
      groupRef.current.rotation.x += 0.15;
      count++;
      if (count >= 12) {
        clearInterval(iv);
        spinRef.current = false;
        if (onSpinComplete) onSpinComplete();
      }
    }, 35);
    return () => clearInterval(iv);
  }, [triggerSpin, onSpinComplete]);

  useFrame(() => {
    if (!groupRef.current || spinRef.current) return;
    groupRef.current.rotation.y += 0.004;
    groupRef.current.rotation.x += 0.001;
  });

  return (
    <group position={[0, posicionY, 0]} scale={[escala, escala, escala]}>
      {/* Luces mejoradas para que se vean bien los colores */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 6]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-3, -2, 4]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 2, 3]} intensity={intensidadBrillo} color="#ffffff" />
      <pointLight position={[1.5, -1, 2]} intensity={0.3} color="#ffffff" />

     

      <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.12} floatingRange={[-0.04, 0.04]}>
        <group ref={groupRef}>
          

          {/* Caras del icosaedro truncado */}
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
                <cylinderGeometry args={[0.01, 0.01, len, 4, 1]} />
              </mesh>
            );
          })}

          {/* Highlight especular */}
          <mesh>
            <sphereGeometry args={[radius * 1.002, 48, 48]} />
            <meshPhongMaterial
              transparent opacity={0.1}
              specular={0xffffff} 
              shininess={150}
              side={THREE.FrontSide}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default FuturisticBall;