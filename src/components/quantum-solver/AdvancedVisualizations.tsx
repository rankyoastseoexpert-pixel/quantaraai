import { memo, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SCFResult, Atom3D, ElementType } from "@/lib/dftSolver";
import { generateChargeDensityGrid, generateDensityDifferenceGrid, generateESPGrid, generateOrbitalGrid, ELEMENT_DATA } from "@/lib/dftSolver";
import { Atom, Layers, Zap, Activity } from "lucide-react";

// ─── Point Cloud Renderer ───
const VolumetricCloud = memo(({ grid, atoms, isoValue, colorMode, element }: {
  grid: number[][][]; atoms: Atom3D[]; isoValue: number;
  colorMode: "charge" | "orbital" | "difference" | "esp";
  element: ElementType;
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const a of atoms) {
      minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
      minZ = Math.min(minZ, a.z); maxZ = Math.max(maxZ, a.z);
    }
    const pad = 3.0;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad; minZ -= pad; maxZ += pad;

    const size = grid.length;
    const positions: number[] = [];
    const colors: number[] = [];

    for (let ix = 0; ix < size; ix++) {
      const x = minX + (ix / (size - 1)) * (maxX - minX);
      for (let iy = 0; iy < size; iy++) {
        const y = minY + (iy / (size - 1)) * (maxY - minY);
        for (let iz = 0; iz < size; iz++) {
          const z = minZ + (iz / (size - 1)) * (maxZ - minZ);
          const val = grid[ix][iy][iz];

          if (colorMode === "charge") {
            if (val > isoValue) {
              positions.push(x, y, z);
              const t = Math.min(1, (val - isoValue) * 10);
              // Blue to cyan gradient for charge density
              colors.push(0.1 + t * 0.2, 0.3 + t * 0.5, 0.8 + t * 0.2);
            }
          } else if (colorMode === "difference") {
            if (Math.abs(val) > isoValue * 0.5) {
              positions.push(x, y, z);
              const t = Math.min(1, Math.abs(val) / (isoValue * 5));
              if (val > 0) {
                // Accumulation: blue
                colors.push(0.1, 0.3 * t, 0.9 * t);
              } else {
                // Depletion: red
                colors.push(0.9 * t, 0.15 * t, 0.1);
              }
            }
          } else if (colorMode === "esp") {
            if (Math.abs(val) > isoValue * 2) {
              positions.push(x, y, z);
              const t = Math.min(1, Math.abs(val) / (isoValue * 20));
              if (val < 0) {
                // Nucleophilic: red
                colors.push(0.9 * t, 0.15, 0.15);
              } else {
                // Electrophilic: blue
                colors.push(0.15, 0.15, 0.9 * t);
              }
            }
          } else {
            // Orbital mode
            if (val > isoValue) {
              positions.push(x, y, z);
              const t = Math.min(1, (val - isoValue) * 8);
              colors.push(0.2 * t, 0.7 * t, 0.3 * t);
            } else if (val < -isoValue) {
              positions.push(x, y, z);
              const t = Math.min(1, (-val - isoValue) * 8);
              colors.push(0.7 * t, 0.15 * t, 0.15);
            }
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [grid, isoValue, colorMode, atoms]);

  useFrame(() => {
    if (pointsRef.current) pointsRef.current.rotation.y += 0.002;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={colorMode === "esp" ? 0.18 : 0.14}
        vertexColors
        transparent
        opacity={colorMode === "charge" ? 0.7 : 0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});
VolumetricCloud.displayName = "VolumetricCloud";

// ─── Atom spheres ───
const AtomSpheres3D = memo(({ atoms, element }: { atoms: Atom3D[]; element: ElementType }) => {
  const params = ELEMENT_DATA[element];
  return (
    <>
      {atoms.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <sphereGeometry args={[params.covalentRadius * 0.4, 20, 20]} />
          <meshStandardMaterial color={params.color} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </>
  );
});
AtomSpheres3D.displayName = "AtomSpheres3D";

// ─── Bonds ───
const Bonds3D = memo(({ atoms, element }: { atoms: Atom3D[]; element: ElementType }) => {
  const cutoff = ELEMENT_DATA[element].cutoff;
  const bonds = useMemo(() => {
    const result: JSX.Element[] = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dx = atoms[i].x - atoms[j].x;
        const dy = atoms[i].y - atoms[j].y;
        const dz = atoms[i].z - atoms[j].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < cutoff) {
          const mid = new THREE.Vector3((atoms[i].x + atoms[j].x) / 2, (atoms[i].y + atoms[j].y) / 2, (atoms[i].z + atoms[j].z) / 2);
          const dir = new THREE.Vector3(dx, dy, dz).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          result.push(
            <mesh key={`${i}-${j}`} position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.03, 0.03, d, 6]} />
              <meshStandardMaterial color="hsl(210, 10%, 50%)" metalness={0.4} roughness={0.5} transparent opacity={0.35} />
            </mesh>
          );
        }
      }
    }
    return result;
  }, [atoms, cutoff]);
  return <>{bonds}</>;
});
Bonds3D.displayName = "Bonds3D";

// ─── 3D Scene ───
const Scene3D = memo(({ grid, atoms, isoValue, colorMode, element }: {
  grid: number[][][]; atoms: Atom3D[]; isoValue: number;
  colorMode: "charge" | "orbital" | "difference" | "esp";
  element: ElementType;
}) => (
  <div className="h-[380px] rounded-lg overflow-hidden border border-border/30 bg-background/50">
    <Canvas camera={{ position: [8, 6, 8], fov: 50 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#22d3ee" />
      <pointLight position={[5, -3, 5]} intensity={0.2} color="#a78bfa" />
      <AtomSpheres3D atoms={atoms} element={element} />
      <Bonds3D atoms={atoms} element={element} />
      <VolumetricCloud grid={grid} atoms={atoms} isoValue={isoValue} colorMode={colorMode} element={element} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      <gridHelper args={[20, 20, "#333", "#222"]} position={[0, -4, 0]} />
    </Canvas>
  </div>
));
Scene3D.displayName = "Scene3D";

// ─── Main Component ───
interface Props {
  result: SCFResult;
}

const AdvancedVisualizations = ({ result }: Props) => {
  const [activeViz, setActiveViz] = useState<"charge" | "homo-lumo" | "difference" | "esp">("charge");
  const [isoValue, setIsoValue] = useState(0.015);
  const [selectedMO, setSelectedMO] = useState<"homo" | "lumo" | "homo-1" | "lumo+1">("homo");

  const chargeGrid = useMemo(() =>
    generateChargeDensityGrid(result.atoms, result.finalOrbitals, result.nElectrons, result.element, 24),
    [result]
  );

  const diffGrid = useMemo(() =>
    generateDensityDifferenceGrid(result.atoms, result.finalOrbitals, result.nElectrons, result.element, 24),
    [result]
  );

  const espGrid = useMemo(() =>
    generateESPGrid(result.atoms, result.finalOrbitals, result.nElectrons, result.element, 24),
    [result]
  );

  const moOrbitalIndex = useMemo(() => {
    switch (selectedMO) {
      case "homo": return result.homoIndex;
      case "lumo": return result.lumoIndex;
      case "homo-1": return Math.max(0, result.homoIndex - 1);
      case "lumo+1": return Math.min(result.finalOrbitals.length - 1, result.lumoIndex + 1);
    }
  }, [selectedMO, result]);

  const moGrid = useMemo(() =>
    generateOrbitalGrid(result.atoms, result.finalOrbitals, moOrbitalIndex, 24, result.element),
    [result, moOrbitalIndex]
  );

  const currentGrid = useMemo(() => {
    switch (activeViz) {
      case "charge": return chargeGrid;
      case "homo-lumo": return moGrid;
      case "difference": return diffGrid;
      case "esp": return espGrid;
    }
  }, [activeViz, chargeGrid, moGrid, diffGrid, espGrid]);

  const colorMode = useMemo(() => {
    switch (activeViz) {
      case "charge": return "charge" as const;
      case "homo-lumo": return "orbital" as const;
      case "difference": return "difference" as const;
      case "esp": return "esp" as const;
    }
  }, [activeViz]);

  const vizTabs = [
    { key: "charge", label: "Charge Density", icon: <Atom size={12} />, desc: "Total electron density ρ(r) = Σ|ψᵢ(r)|²" },
    { key: "homo-lumo", label: "HOMO/LUMO", icon: <Layers size={12} />, desc: "Frontier molecular orbital isosurfaces" },
    { key: "difference", label: "Δρ Map", icon: <Zap size={12} />, desc: "Density difference ρ_total − Σρ_atoms" },
    { key: "esp", label: "ESP", icon: <Activity size={12} />, desc: "Electrostatic potential on isodensity" },
  ];

  return (
    <GlassCard>
      <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Atom size={14} className="text-primary" />
        Advanced 3D Visualizations
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {result.element}<sub>{result.atoms.length}</sub>
        </span>
      </h3>

      <Tabs value={activeViz} onValueChange={(v) => setActiveViz(v as any)}>
        <TabsList className="bg-secondary/50 border border-border/30 h-8">
          {vizTabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              {tab.icon} {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {vizTabs.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="mt-2">
            <p className="text-[10px] text-muted-foreground mb-2">{tab.desc}</p>
          </TabsContent>
        ))}
      </Tabs>

      {/* MO selector for HOMO/LUMO tab */}
      {activeViz === "homo-lumo" && (
        <div className="flex gap-1.5 mb-2 mt-2">
          {(["homo-1", "homo", "lumo", "lumo+1"] as const).map(mo => (
            <Button
              key={mo}
              size="sm"
              variant={selectedMO === mo ? "default" : "outline"}
              className={`flex-1 h-6 text-[9px] ${selectedMO === mo ? "bg-primary text-primary-foreground" : "border-border"}`}
              onClick={() => setSelectedMO(mo)}
            >
              {mo.toUpperCase()}
              <span className="ml-0.5 text-[7px] opacity-60">
                ({result.finalEnergies[
                  mo === "homo" ? result.homoIndex :
                  mo === "lumo" ? result.lumoIndex :
                  mo === "homo-1" ? Math.max(0, result.homoIndex - 1) :
                  Math.min(result.finalOrbitals.length - 1, result.lumoIndex + 1)
                ]?.toFixed(2)} eV)
              </span>
            </Button>
          ))}
        </div>
      )}

      <Scene3D
        grid={currentGrid}
        atoms={result.atoms}
        isoValue={isoValue}
        colorMode={colorMode}
        element={result.element}
      />

      {/* Controls */}
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Isosurface Value</span>
          <span className="font-mono text-primary">{isoValue.toFixed(4)}</span>
        </div>
        <Slider min={0.001} max={0.08} step={0.001} value={[isoValue]} onValueChange={([v]) => setIsoValue(v)} className="h-4" />
      </div>

      {/* Color Legend */}
      <div className="mt-3 rounded-lg border border-border/30 bg-background/50 p-2.5">
        <p className="text-[9px] font-semibold text-foreground mb-1.5">Color Legend</p>
        {activeViz === "charge" && (
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> High density</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan-400" /> Low density</span>
          </div>
        )}
        {activeViz === "homo-lumo" && (
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> ψ &gt; 0 (bonding)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> ψ &lt; 0 (antibonding)</span>
          </div>
        )}
        {activeViz === "difference" && (
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600" /> Charge accumulation</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600" /> Charge depletion</span>
          </div>
        )}
        {activeViz === "esp" && (
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Nucleophilic (V &lt; 0)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> Electrophilic (V &gt; 0)</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default memo(AdvancedVisualizations);
