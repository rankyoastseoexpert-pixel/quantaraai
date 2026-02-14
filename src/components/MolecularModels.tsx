import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef, Suspense, lazy, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";

/* ═══ Atom sphere helper ═══ */
const AtomSphere = ({ position, color, size = 0.3 }: { position: [number, number, number]; color: string; size?: number }) => {
  const ref = useRef<THREE.Mesh>(null!);
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} emissive={color} emissiveIntensity={0.1} />
    </mesh>
  );
};

/* ═══ Bond cylinder ═══ */
const Bond = ({ start, end, color = "#888" }: { start: [number, number, number]; end: [number, number, number]; color?: string }) => {
  const ref = useRef<THREE.Mesh>(null!);
  const s = useMemo(() => new THREE.Vector3(...start), [start]);
  const e = useMemo(() => new THREE.Vector3(...end), [end]);
  const mid = useMemo(() => s.clone().add(e).multiplyScalar(0.5), [s, e]);
  const len = useMemo(() => s.distanceTo(e), [s, e]);
  const dir = useMemo(() => e.clone().sub(s).normalize(), [s, e]);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.copy(mid);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      ref.current.quaternion.copy(q);
    }
  }, [mid, dir]);

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.04, 0.04, len, 8]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
};

/* ═══ Water Molecule (H₂O) ═══ */
const WaterMolecule = () => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.rotation.x += delta * 0.05;
  });

  // 104.5° bond angle
  const angle = (104.5 * Math.PI) / 180;
  const bondLen = 0.8;
  const h1: [number, number, number] = [bondLen * Math.sin(angle / 2), bondLen * Math.cos(angle / 2), 0];
  const h2: [number, number, number] = [-bondLen * Math.sin(angle / 2), bondLen * Math.cos(angle / 2), 0];
  const o: [number, number, number] = [0, 0, 0];

  return (
    <group ref={groupRef}>
      <AtomSphere position={o} color="#ff4444" size={0.35} />
      <AtomSphere position={h1} color="#ffffff" size={0.22} />
      <AtomSphere position={h2} color="#ffffff" size={0.22} />
      <Bond start={o} end={h1} color="#aaa" />
      <Bond start={o} end={h2} color="#aaa" />
    </group>
  );
};

/* ═══ Methane Molecule (CH₄) ═══ */
const MethaneMolecule = () => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.12;
    groupRef.current.rotation.z += delta * 0.04;
  });

  // Tetrahedral positions
  const d = 0.7;
  const positions: [number, number, number][] = [
    [d, d, d],
    [d, -d, -d],
    [-d, d, -d],
    [-d, -d, d],
  ];
  const center: [number, number, number] = [0, 0, 0];

  return (
    <group ref={groupRef}>
      <AtomSphere position={center} color="#333333" size={0.3} />
      {positions.map((pos, i) => (
        <group key={i}>
          <AtomSphere position={pos} color="#ffffff" size={0.2} />
          <Bond start={center} end={pos} color="#666" />
        </group>
      ))}
    </group>
  );
};

/* ═══ Crystal Lattice ═══ */
const CrystalLattice = () => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.rotation.x += delta * 0.03;
  });

  const nodes: [number, number, number][] = [];
  const bonds: Array<{ start: [number, number, number]; end: [number, number, number] }> = [];
  const spacing = 0.6;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const pos: [number, number, number] = [x * spacing, y * spacing, z * spacing];
        nodes.push(pos);
        // Bonds to adjacent nodes
        if (x < 1) bonds.push({ start: pos, end: [(x + 1) * spacing, y * spacing, z * spacing] });
        if (y < 1) bonds.push({ start: pos, end: [x * spacing, (y + 1) * spacing, z * spacing] });
        if (z < 1) bonds.push({ start: pos, end: [x * spacing, y * spacing, (z + 1) * spacing] });
      }
    }
  }

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={`n-${i}`} position={pos}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#66ccff" emissive="#0088ff" emissiveIntensity={0.3} transparent opacity={0.8} />
        </mesh>
      ))}
      {bonds.map((b, i) => (
        <Bond key={`b-${i}`} start={b.start} end={b.end} color="#4488cc" />
      ))}
      {/* Semi-transparent cube container */}
      <mesh>
        <boxGeometry args={[spacing * 2.2, spacing * 2.2, spacing * 2.2]} />
        <meshStandardMaterial color="#2266aa" transparent opacity={0.05} wireframe />
      </mesh>
    </group>
  );
};

/* ═══ HCP Magnesium Lattice ═══ */
const MgLattice = () => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
  });

  const nodes: [number, number, number][] = [];
  const a = 0.5;
  // Hexagonal layers
  for (let layer = -1; layer <= 1; layer++) {
    const offset = layer % 2 === 0 ? 0 : a * 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      nodes.push([a * Math.cos(angle) + offset * 0.3, layer * 0.6, a * Math.sin(angle)]);
    }
    nodes.push([offset * 0.3, layer * 0.6, 0]);
  }

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#aaddcc" metalness={0.6} roughness={0.2} emissive="#448866" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
};

/* ═══ Scene wrapper with visibility check ═══ */
const MoleculeScene = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Check reduced motion
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div ref={ref} className={`pointer-events-none ${className}`} style={{ willChange: "transform" }}>
      {isVisible && !prefersReduced && (
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          style={{ background: "transparent" }}
          frameloop={isVisible ? "always" : "never"}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 3]} intensity={0.6} color="#66ccff" />
          <pointLight position={[-3, -2, 2]} intensity={0.3} color="#4488ff" />
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
              {children}
            </Float>
          </Suspense>
        </Canvas>
      )}
    </div>
  );
};

/* ═══ Exported positioned molecules for landing page ═══ */
export const FloatingMolecule = ({ type, className }: { type: "water" | "methane" | "crystal" | "mg"; className?: string }) => {
  const molecules = {
    water: <WaterMolecule />,
    methane: <MethaneMolecule />,
    crystal: <CrystalLattice />,
    mg: <MgLattice />,
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
    >
      <MoleculeScene className="w-full h-full opacity-30">
        {molecules[type]}
      </MoleculeScene>
    </motion.div>
  );
};

export default FloatingMolecule;
