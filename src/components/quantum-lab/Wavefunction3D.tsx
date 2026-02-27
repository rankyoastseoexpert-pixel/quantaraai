import { memo, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import type { PlotPoint } from "@/lib/quantumSimulator";

interface Props {
  data: PlotPoint[];
  historyBuffer: PlotPoint[][];
}

const CameraController = memo(({ polar, azimuthal }: { polar: number; azimuthal: number }) => {
  const { camera } = useThree();
  useEffect(() => {
    const radius = 9;
    const phi = (polar * Math.PI) / 180;
    const theta = (azimuthal * Math.PI) / 180;
    camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
  }, [polar, azimuthal, camera]);
  return null;
});
CameraController.displayName = "CameraController";

const Surface = memo(({ data, history }: { data: PlotPoint[]; history: PlotPoint[][] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
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

    return { geometry: geo };
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
  const [polar, setPolar] = useState(35);
  const [azimuthal, setAzimuthal] = useState(45);

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
      <div className="flex gap-4 mb-2">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Polar angle</span>
            <span className="font-mono text-primary">{polar}°</span>
          </div>
          <Slider min={5} max={175} step={1} value={[polar]} onValueChange={([v]) => setPolar(v)} className="h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Azimuthal angle</span>
            <span className="font-mono text-primary">{azimuthal}°</span>
          </div>
          <Slider min={0} max={360} step={1} value={[azimuthal]} onValueChange={([v]) => setAzimuthal(v)} className="h-4" />
        </div>
      </div>
      <div className="h-[300px] rounded-lg overflow-hidden border border-border/30">
        <Canvas camera={{ position: [6, 4, 6], fov: 45 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <pointLight position={[-3, 3, -3]} intensity={0.3} color="#22d3ee" />
          <CameraController polar={polar} azimuthal={azimuthal} />
          <Surface data={data} history={historyBuffer} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <gridHelper args={[10, 20, "#333", "#222"]} position={[0, -0.1, 0]} />
        </Canvas>
      </div>
    </GlassCard>
  );
};

export default memo(Wavefunction3D);
