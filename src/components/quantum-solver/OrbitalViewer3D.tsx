import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Atom3D } from "@/lib/dftSolver";

interface Props {
  atoms: Atom3D[];
  orbitalGrid: number[][][] | null;
  selectedOrbital: number;
  showPositive: boolean;
  showNegative: boolean;
  isoValue: number;
}

// ─── Silver Atom Spheres ───
const AtomSpheres = memo(({ atoms }: { atoms: Atom3D[] }) => {
  const meshes = useMemo(() => {
    return atoms.map((a, i) => (
      <mesh key={i} position={[a.x, a.y, a.z]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color="hsl(210, 15%, 75%)"
          metalness={0.9}
          roughness={0.15}
          envMapIntensity={0.8}
        />
      </mesh>
    ));
  }, [atoms]);
  return <>{meshes}</>;
});
AtomSpheres.displayName = "AtomSpheres";

// ─── Bonds ───
const Bonds = memo(({ atoms }: { atoms: Atom3D[] }) => {
  const bonds = useMemo(() => {
    const result: JSX.Element[] = [];
    const cutoff = 3.2;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dx = atoms[i].x - atoms[j].x;
        const dy = atoms[i].y - atoms[j].y;
        const dz = atoms[i].z - atoms[j].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < cutoff) {
          const mid = new THREE.Vector3(
            (atoms[i].x + atoms[j].x) / 2,
            (atoms[i].y + atoms[j].y) / 2,
            (atoms[i].z + atoms[j].z) / 2
          );
          const dir = new THREE.Vector3(dx, dy, dz).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), dir
          );
          result.push(
            <mesh key={`${i}-${j}`} position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.04, 0.04, d, 8]} />
              <meshStandardMaterial color="hsl(210, 10%, 50%)" metalness={0.5} roughness={0.5} transparent opacity={0.4} />
            </mesh>
          );
        }
      }
    }
    return result;
  }, [atoms]);
  return <>{bonds}</>;
});
Bonds.displayName = "Bonds";

// ─── Isosurface Point Cloud (volumetric orbital visualization) ───
const OrbitalCloud = memo(({ grid, isoValue, showPositive, showNegative, atoms }: {
  grid: number[][][];
  isoValue: number;
  showPositive: boolean;
  showNegative: boolean;
  atoms: Atom3D[];
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry } = useMemo(() => {
    // Bounding box from atoms
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const a of atoms) {
      minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
      minZ = Math.min(minZ, a.z); maxZ = Math.max(maxZ, a.z);
    }
    const pad = 3.0;
    minX -= pad; maxX += pad;
    minY -= pad; maxY += pad;
    minZ -= pad; maxZ += pad;

    const size = grid.length;
    const positions: number[] = [];
    const colors: number[] = [];

    const posColor = new THREE.Color("hsl(150, 70%, 50%)"); // green for +
    const negColor = new THREE.Color("hsl(0, 70%, 55%)");   // red for -

    for (let ix = 0; ix < size; ix++) {
      const x = minX + (ix / (size - 1)) * (maxX - minX);
      for (let iy = 0; iy < size; iy++) {
        const y = minY + (iy / (size - 1)) * (maxY - minY);
        for (let iz = 0; iz < size; iz++) {
          const z = minZ + (iz / (size - 1)) * (maxZ - minZ);
          const val = grid[ix][iy][iz];

          if (showPositive && val > isoValue) {
            positions.push(x, y, z);
            const intensity = Math.min(1, (val - isoValue) * 8);
            colors.push(
              posColor.r * intensity,
              posColor.g * intensity,
              posColor.b * intensity
            );
          } else if (showNegative && val < -isoValue) {
            positions.push(x, y, z);
            const intensity = Math.min(1, (-val - isoValue) * 8);
            colors.push(
              negColor.r * intensity,
              negColor.g * intensity,
              negColor.b * intensity
            );
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return { geometry: geo };
  }, [grid, isoValue, showPositive, showNegative, atoms]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.003;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.15} vertexColors transparent opacity={0.65} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
});
OrbitalCloud.displayName = "OrbitalCloud";

// ─── Rotation wrapper ───
const RotatingGroup = memo(({ children }: { children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.002;
  });
  return <group ref={ref}>{children}</group>;
});
RotatingGroup.displayName = "RotatingGroup";

// ─── Main Component ───
const OrbitalViewer3D = ({ atoms, orbitalGrid, selectedOrbital, showPositive, showNegative, isoValue }: Props) => {
  return (
    <div className="h-[400px] rounded-lg overflow-hidden border border-border/30 bg-background/50">
      <Canvas camera={{ position: [8, 6, 8], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#22d3ee" />
        <pointLight position={[5, -3, 5]} intensity={0.2} color="#a78bfa" />

        <RotatingGroup>
          <AtomSpheres atoms={atoms} />
          <Bonds atoms={atoms} />
        </RotatingGroup>

        {orbitalGrid && (
          <OrbitalCloud
            grid={orbitalGrid}
            isoValue={isoValue}
            showPositive={showPositive}
            showNegative={showNegative}
            atoms={atoms}
          />
        )}

        <OrbitControls enableDamping dampingFactor={0.05} />
        <gridHelper args={[20, 20, "#333", "#222"]} position={[0, -4, 0]} />
      </Canvas>
    </div>
  );
};

export default memo(OrbitalViewer3D);
