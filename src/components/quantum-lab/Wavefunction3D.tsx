import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import GlassCard from "@/components/GlassCard";
import type { PlotPoint } from "@/lib/quantumSimulator";

interface Props {
  data: PlotPoint[];
  historyBuffer: PlotPoint[][];
}

const Surface = memo(({ data, history }: { data: PlotPoint[]; history: PlotPoint[][] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Build geometry from wavefunction history (x vs t surface)
  const { geometry, colors } = useMemo(() => {
    const rows = Math.min(history.length, 60);
    const cols = Math.min(data.length, 100);
    const stepC = Math.max(1, Math.floor(data.length / cols));
    const stepR = Math.max(1, Math.floor(history.length / rows));

    const positions: number[] = [];
    const colorArr: number[] = [];
    const indices: number[] = [];

    const actualCols = Math.ceil(data.length / stepC);
    const actualRows = Math.ceil(history.length / stepR);

    for (let r = 0; r < actualRows; r++) {
      const rowData = history[Math.min(r * stepR, history.length - 1)];
      for (let c = 0; c < actualCols; c++) {
        const idx = Math.min(c * stepC, rowData.length - 1);
        const p = rowData[idx];
        const xPos = (c / actualCols - 0.5) * 8;
        const zPos = (r / actualRows - 0.5) * 4;
        const yPos = p.prob * 5;
        positions.push(xPos, yPos, zPos);

        // Phase → color
        const hue = ((p.phase + Math.PI) / (2 * Math.PI));
        const color = new THREE.Color();
        color.setHSL(hue, 0.8, 0.4 + p.prob * 2);
        colorArr.push(color.r, color.g, color.b);
      }
    }

    for (let r = 0; r < actualRows - 1; r++) {
      for (let c = 0; c < actualCols - 1; c++) {
        const i = r * actualCols + c;
        indices.push(i, i + 1, i + actualCols);
        indices.push(i + 1, i + actualCols + 1, i + actualCols);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colorArr, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArr };
  }, [data, history]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.85}
        shininess={60} specular={new THREE.Color(0x444466)} />
    </mesh>
  );
});
Surface.displayName = "Surface";

const Wavefunction3D = ({ data, historyBuffer }: Props) => {
  if (historyBuffer.length < 3) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">3D |ψ(x,t)|² Surface</h3>
        <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">
          Collecting time slices… Start simulation to build surface.
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-semibold text-foreground mb-2">3D |ψ(x,t)|² Surface</h3>
      <div className="h-[300px] rounded-lg overflow-hidden border border-border/30">
        <Canvas camera={{ position: [6, 4, 6], fov: 45 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <pointLight position={[-3, 3, -3]} intensity={0.3} color="#22d3ee" />
          <Surface data={data} history={historyBuffer} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <gridHelper args={[10, 20, "#333", "#222"]} position={[0, -0.1, 0]} />
        </Canvas>
      </div>
    </GlassCard>
  );
};

export default memo(Wavefunction3D);
