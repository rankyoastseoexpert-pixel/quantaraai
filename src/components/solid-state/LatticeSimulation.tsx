import { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { FileText, Hexagon, RotateCcw, Layers } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";

type CrystalType = "SC" | "BCC" | "FCC" | "HCP";

interface AtomData {
  position: [number, number, number];
  color: string;
  radius: number;
  sublattice: number;
}

interface BondData {
  from: [number, number, number];
  to: [number, number, number];
}

function generateCrystal(type: CrystalType, a: number, nx: number): { atoms: AtomData[]; bonds: BondData[]; info: Record<string, string> } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];

  const colors = ["hsl(210, 100%, 65%)", "hsl(350, 80%, 65%)", "hsl(150, 70%, 55%)", "hsl(40, 90%, 55%)"];
  const r = a * 0.18;

  switch (type) {
    case "SC":
      for (let i = -nx; i <= nx; i++)
        for (let j = -nx; j <= nx; j++)
          for (let k = -nx; k <= nx; k++)
            atoms.push({ position: [i * a, j * a, k * a], color: colors[0], radius: r, sublattice: 0 });
      break;
    case "BCC":
      for (let i = -nx; i <= nx; i++)
        for (let j = -nx; j <= nx; j++)
          for (let k = -nx; k <= nx; k++) {
            atoms.push({ position: [i * a, j * a, k * a], color: colors[0], radius: r, sublattice: 0 });
            atoms.push({ position: [(i + 0.5) * a, (j + 0.5) * a, (k + 0.5) * a], color: colors[1], radius: r * 0.9, sublattice: 1 });
          }
      break;
    case "FCC":
      for (let i = -nx; i <= nx; i++)
        for (let j = -nx; j <= nx; j++)
          for (let k = -nx; k <= nx; k++) {
            atoms.push({ position: [i * a, j * a, k * a], color: colors[0], radius: r, sublattice: 0 });
            atoms.push({ position: [(i + 0.5) * a, (j + 0.5) * a, k * a], color: colors[2], radius: r * 0.85, sublattice: 1 });
            atoms.push({ position: [(i + 0.5) * a, j * a, (k + 0.5) * a], color: colors[2], radius: r * 0.85, sublattice: 1 });
            atoms.push({ position: [i * a, (j + 0.5) * a, (k + 0.5) * a], color: colors[2], radius: r * 0.85, sublattice: 1 });
          }
      break;
    case "HCP":
      for (let i = -nx; i <= nx; i++)
        for (let j = -nx; j <= nx; j++)
          for (let k = -nx; k <= nx; k++) {
            const x = i * a + (j % 2 !== 0 ? a / 2 : 0);
            const y = j * a * Math.sqrt(3) / 2;
            const z = k * a * Math.sqrt(8 / 3);
            atoms.push({ position: [x, y, z], color: colors[0], radius: r, sublattice: 0 });
            if (k >= -nx) {
              atoms.push({
                position: [x + a / 2, y + a * Math.sqrt(3) / 6, z + a * Math.sqrt(2 / 3)],
                color: colors[3], radius: r * 0.9, sublattice: 1,
              });
            }
          }
      break;
  }

  // Generate bonds (nearest neighbors)
  const maxBondLen = type === "BCC" ? a * 0.87 * 1.1 : type === "FCC" ? a * 0.707 * 1.1 : a * 1.1;
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const [x1, y1, z1] = atoms[i].position;
      const [x2, y2, z2] = atoms[j].position;
      const d = Math.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2);
      if (d < maxBondLen && d > 0.1) {
        bonds.push({ from: atoms[i].position, to: atoms[j].position });
      }
    }
  }

  const coordNum = { SC: 6, BCC: 8, FCC: 12, HCP: 12 };
  const packing = { SC: "52.4%", BCC: "68.0%", FCC: "74.0%", HCP: "74.0%" };
  const basisAtoms = { SC: 1, BCC: 2, FCC: 4, HCP: 2 };

  return {
    atoms,
    bonds,
    info: {
      "Coordination #": String(coordNum[type]),
      "Packing Fraction": packing[type],
      "Atoms/Cell": String(basisAtoms[type]),
      "Structure": type === "SC" ? "Simple Cubic" : type === "BCC" ? "Body-Centered Cubic" : type === "FCC" ? "Face-Centered Cubic" : "Hexagonal Close-Packed",
    },
  };
}

// ─── 3D Atom ──────────────────────────────────────────────────────────
function CrystalAtom({ position, color, radius }: { position: [number, number, number]; color: string; radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 10);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.5 : 0.15}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  );
}

function CrystalBond({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  return (
    <Line
      points={[new THREE.Vector3(...from), new THREE.Vector3(...to)]}
      color="rgba(150,180,220,0.2)"
      lineWidth={1}
    />
  );
}

function CrystalScene({ atoms, bonds, showBonds, autoRotate }: {
  atoms: AtomData[]; bonds: BondData[]; showBonds: boolean; autoRotate: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {atoms.map((atom, i) => (
        <CrystalAtom key={i} position={atom.position} color={atom.color} radius={atom.radius} />
      ))}
      {showBonds && bonds.map((bond, i) => (
        <CrystalBond key={`b${i}`} from={bond.from} to={bond.to} />
      ))}
    </group>
  );
}

const LATTICE_DERIVATION = [
  { title: "Bravais Lattice", content: "An infinite set of points generated by primitive vectors.", equation: "R = n₁a₁ + n₂a₂ + n₃a₃" },
  { title: "Simple Cubic", content: "Orthogonal primitive vectors of equal magnitude. Coordination number 6.", equation: "a₁ = ax̂, a₂ = aŷ, a₃ = aẑ" },
  { title: "BCC Structure", content: "Conventional cube + body center. Coordination 8. Examples: Fe, Cr, W.", equation: "a₁ = (a/2)(−x̂+ŷ+ẑ), a₂ = (a/2)(x̂−ŷ+ẑ), a₃ = (a/2)(x̂+ŷ−ẑ)" },
  { title: "FCC Structure", content: "Conventional cube + face centers. Closest packing. Examples: Cu, Al, Au.", equation: "a₁ = (a/2)(ŷ+ẑ), a₂ = (a/2)(x̂+ẑ), a₃ = (a/2)(x̂+ŷ)" },
  { title: "Packing Fraction", content: "Volume occupied by atoms / total cell volume.", equation: "f_FCC = f_HCP = π√2/6 ≈ 74%" },
  { title: "Reciprocal Lattice", content: "b₁, b₂, b₃ satisfy a_i · b_j = 2πδ_{ij}.", equation: "b₁ = 2π(a₂ × a₃) / (a₁ · (a₂ × a₃))" },
];

const CRYSTAL_TYPES: { key: CrystalType; label: string; icon: string; desc: string }[] = [
  { key: "SC", label: "Simple Cubic", icon: "🟦", desc: "Coordination 6, Po" },
  { key: "BCC", label: "Body-Centered", icon: "🔷", desc: "Coordination 8, Fe/W" },
  { key: "FCC", label: "Face-Centered", icon: "🔶", desc: "Coordination 12, Cu/Au" },
  { key: "HCP", label: "Hexagonal CP", icon: "⬡", desc: "Coordination 12, Zn/Ti" },
];

export default function LatticeSimulation() {
  const [crystalType, setCrystalType] = useState<CrystalType>("FCC");
  const [a, setA] = useState(2.0);
  const [nx, setNx] = useState(1);
  const [showBonds, setShowBonds] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const { atoms, bonds, info } = useMemo(() => generateCrystal(crystalType, a, nx), [crystalType, a, nx]);

  return (
    <div className="space-y-4">
      {/* Crystal type selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CRYSTAL_TYPES.map((ct, i) => (
          <motion.button
            key={ct.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setCrystalType(ct.key)}
            className={`p-3 rounded-xl border text-left transition-all duration-300 ${
              crystalType === ct.key
                ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                : "bg-secondary/20 border-border/40 hover:bg-secondary/40"
            }`}
          >
            <span className="text-lg">{ct.icon}</span>
            <p className="text-xs font-semibold text-foreground mt-1">{ct.label}</p>
            <p className="text-[9px] text-muted-foreground">{ct.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Hexagon size={14} className="text-primary" /> Configuration
          </h3>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">a (Lattice Constant)</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{a.toFixed(1)} Å</span>
            </div>
            <Slider min={1} max={4} step={0.1} value={[a]} onValueChange={([v]) => setA(v)} className="h-4" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Supercell Size</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{nx}×{nx}×{nx}</span>
            </div>
            <Slider min={1} max={3} step={1} value={[nx]} onValueChange={([v]) => setNx(v)} className="h-4" />
          </div>

          <div className="space-y-2 pt-3 border-t border-border/30">
            <label className="flex items-center justify-between text-xs text-muted-foreground cursor-pointer">
              Show Bonds
              <button onClick={() => setShowBonds(!showBonds)}
                className={`w-8 h-4 rounded-full transition-colors ${showBonds ? "bg-primary" : "bg-secondary"}`}>
                <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${showBonds ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground cursor-pointer">
              Auto Rotate
              <button onClick={() => setAutoRotate(!autoRotate)}
                className={`w-8 h-4 rounded-full transition-colors ${autoRotate ? "bg-primary" : "bg-secondary"}`}>
                <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${autoRotate ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>

          {/* Structural info */}
          <div className="pt-3 border-t border-border/30 space-y-1">
            <p className="text-xs font-semibold text-foreground">Structural Properties</p>
            {Object.entries(info).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-mono text-primary">{val}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Total Atoms</span>
              <span className="font-mono text-primary">{atoms.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bonds Shown</span>
              <span className="font-mono text-primary">{bonds.length}</span>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => exportChartAsPDF(`Crystal — ${crystalType}`, [
            `Type: ${info.Structure} | a = ${a} Å`,
            `Coordination: ${info["Coordination #"]} | Packing: ${info["Packing Fraction"]}`,
          ], "crystal-3d")} className="gap-1.5 text-xs w-full">
            <FileText size={12} /> Export PDF
          </Button>
        </GlassCard>

        {/* 3D Crystal View */}
        <GlassCard className="lg:col-span-9 p-0 overflow-hidden" id="crystal-3d">
          <div className="p-3 pb-0 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RotateCcw size={12} className="text-muted-foreground animate-spin" style={{ animationDuration: "8s" }} />
                {info.Structure} Crystal
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Drag to rotate • Scroll to zoom • Click atoms to inspect</p>
            </div>
            <div className="flex items-center gap-2">
              {crystalType === "BCC" || crystalType === "FCC" || crystalType === "HCP" ? (
                <div className="flex gap-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(210,100%,65%)" }} /> Corner</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: crystalType === "BCC" ? "hsl(350,80%,65%)" : crystalType === "HCP" ? "hsl(40,90%,55%)" : "hsl(150,70%,55%)" }} /> {crystalType === "BCC" ? "Body" : "Face/Interstitial"}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="h-[520px]">
            <Canvas camera={{ position: [6, 4, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={0.8} color="#63b3ed" />
              <pointLight position={[-8, -5, 8]} intensity={0.4} color="#a78bfa" />
              <pointLight position={[0, -10, 0]} intensity={0.2} color="#f59e0b" />

              <CrystalScene atoms={atoms} bonds={bonds} showBonds={showBonds} autoRotate={autoRotate} />

              <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={20} />
            </Canvas>
          </div>
        </GlassCard>
      </div>

      <DerivationBlock title="Crystal Lattice Theory" steps={LATTICE_DERIVATION} />
    </div>
  );
}
