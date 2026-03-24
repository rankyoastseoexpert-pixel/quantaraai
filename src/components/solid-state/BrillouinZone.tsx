import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { getBrillouinZone, type LatticeType } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { FileText, RotateCcw, Compass, Atom } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";

// ─── 3D Brillouin Zone Prism ───────────────────────────────────────────
function BZPrism({ vertices, height = 0.6 }: { vertices: [number, number][]; height?: number }) {
  const scale = 0.8;
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.04;
    }
  });

  const { topFaceGeo, bottomFaceGeo, sideGeos } = useMemo(() => {
    const pts = vertices.map(v => [v[0] * scale, v[1] * scale] as [number, number]);
    const halfH = height / 2;

    // Top face
    const topShape = new THREE.Shape();
    topShape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) topShape.lineTo(pts[i][0], pts[i][1]);
    topShape.closePath();

    // Bottom face (same shape)
    const bottomShape = topShape.clone();

    // Side faces (quads as triangles)
    const sides: THREE.BufferGeometry[] = [];
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const verts = new Float32Array([
        pts[i][0], pts[i][1], -halfH,
        pts[j][0], pts[j][1], -halfH,
        pts[j][0], pts[j][1], halfH,
        pts[i][0], pts[i][1], -halfH,
        pts[j][0], pts[j][1], halfH,
        pts[i][0], pts[i][1], halfH,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      sides.push(geo);
    }

    return {
      topFaceGeo: new THREE.ShapeGeometry(topShape),
      bottomFaceGeo: new THREE.ShapeGeometry(bottomShape),
      sideGeos: sides,
    };
  }, [vertices, height]);

  const halfH = height / 2;

  // Colors for different faces
  const topColor = "#22d3ee";    // cyan
  const bottomColor = "#818cf8"; // indigo
  const sideColors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#6366f1", "#0ea5e9", "#a78bfa"];

  return (
    <group ref={groupRef}>
      {/* Top face */}
      <mesh geometry={topFaceGeo} position={[0, 0, halfH]}>
        <meshStandardMaterial color={topColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Bottom face */}
      <mesh geometry={bottomFaceGeo} position={[0, 0, -halfH]}>
        <meshStandardMaterial color={bottomColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Side faces */}
      {sideGeos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial
            color={sideColors[i % sideColors.length]}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Top edges */}
      <BZEdges3D vertices={vertices} z={halfH} color="#22d3ee" />
      {/* Bottom edges */}
      <BZEdges3D vertices={vertices} z={-halfH} color="#818cf8" />
      {/* Vertical edges */}
      {vertices.map((v, i) => {
        const s = scale;
        return (
          <Line
            key={`vert-${i}`}
            points={[
              new THREE.Vector3(v[0] * s, v[1] * s, -halfH),
              new THREE.Vector3(v[0] * s, v[1] * s, halfH),
            ]}
            color="#6366f1"
            lineWidth={1.5}
            transparent
            opacity={0.4}
          />
        );
      })}
    </group>
  );
}

function BZEdges3D({ vertices, z, color }: { vertices: [number, number][]; z: number; color: string }) {
  const scale = 0.8;
  const [pulse, setPulse] = useState(0);

  useFrame((_, delta) => {
    setPulse(prev => prev + delta * 2);
  });

  const points = useMemo(() => {
    const pts = vertices.map(v => new THREE.Vector3(v[0] * scale, v[1] * scale, z));
    pts.push(pts[0].clone());
    return pts;
  }, [vertices, z]);

  const opacity = 0.5 + 0.3 * Math.sin(pulse);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2.5}
      transparent
      opacity={opacity}
    />
  );
}

function SymmetryPoint({ position, label, color = "#f59e0b" }: { position: [number, number, number]; label: string; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.5 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.5 : 0.5} />
      </mesh>
      <Text
        position={[0, 0.18, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {label}
      </Text>
    </group>
  );
}

function SymmetryPath({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    setProgress(prev => Math.min(prev + delta * 0.8, 1));
  });

  const pts = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, progress);
    return [a, mid];
  }, [from, to, progress]);

  return (
    <Line
      points={pts}
      color="hsl(40, 90%, 55%)"
      lineWidth={2}
      dashed
      dashSize={0.05}
      gapSize={0.03}
      transparent
      opacity={0.7}
    />
  );
}

function GridPlane() {
  return (
    <gridHelper
      args={[6, 20, "rgba(100,140,200,0.08)", "rgba(100,140,200,0.04)"]}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.32]}
    />
  );
}

function AxesLabels() {
  return (
    <group>
      <Line points={[new THREE.Vector3(-3, 0, 0), new THREE.Vector3(3, 0, 0)]} color="rgba(150,180,220,0.3)" lineWidth={1} />
      <Line points={[new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 3, 0)]} color="rgba(150,180,220,0.3)" lineWidth={1} />
      <Line points={[new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1)]} color="rgba(150,180,220,0.2)" lineWidth={1} />
      <Text position={[3.2, 0, 0]} fontSize={0.12} color="rgba(150,180,220,0.6)" anchorX="left">kₓ</Text>
      <Text position={[0, 3.2, 0]} fontSize={0.12} color="rgba(150,180,220,0.6)" anchorY="bottom">kᵧ</Text>
      <Text position={[0, 0, 1.2]} fontSize={0.1} color="rgba(150,180,220,0.4)" anchorX="center">kz</Text>
    </group>
  );
}

// ─── Band Canvas ──────────────────────────────────────────────────────
function BandCanvas({ bandPath, pathSegments }: {
  bandPath: { label: string; pathDist: number; energy: number }[];
  pathSegments: { from: string; to: string; points: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || bandPath.length === 0) return;

    const W = container.clientWidth;
    const H = 380;
    const dpr = Math.max(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 30, right: 30, bottom: 50, left: 60 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;
    const dMax = Math.max(...bandPath.map(p => p.pathDist));
    const eMin = Math.min(...bandPath.map(p => p.energy));
    const eMax = Math.max(...bandPath.map(p => p.energy));
    const eRange = eMax - eMin || 1;

    const toX = (d: number) => pad.left + (d / dMax) * pw;
    const toY = (e: number) => pad.top + ph - ((e - eMin) / eRange) * ph;

    const bg = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
    bg.addColorStop(0, "rgba(59,130,246,0.02)");
    bg.addColorStop(1, "rgba(139,92,246,0.02)");
    ctx.fillStyle = bg;
    ctx.fillRect(pad.left, pad.top, pw, ph);

    ctx.strokeStyle = "rgba(100,140,200,0.08)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const y = pad.top + (ph / 8) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    ctx.beginPath();
    bandPath.forEach((p, i) => {
      const x = toX(p.pathDist), y = toY(p.energy);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(dMax), pad.top + ph);
    ctx.lineTo(toX(0), pad.top + ph);
    ctx.closePath();
    const aGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
    aGrad.addColorStop(0, "rgba(59,130,246,0.18)");
    aGrad.addColorStop(1, "rgba(59,130,246,0.01)");
    ctx.fillStyle = aGrad;
    ctx.fill();

    ctx.shadowColor = "rgba(59,130,246,0.6)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.strokeStyle = "hsl(210, 100%, 65%)";
    ctx.lineWidth = 3;
    bandPath.forEach((p, i) => {
      const x = toX(p.pathDist), y = toY(p.energy);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (const p of bandPath.filter(p => p.label)) {
      const x = toX(p.pathDist);
      ctx.strokeStyle = "rgba(245,158,11,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "hsl(40, 90%, 60%)";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.label, x, H - pad.bottom + 22);
    }

    ctx.fillStyle = "rgba(170,190,220,0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const e = eMin + (eRange / 6) * i;
      ctx.fillText(e.toFixed(1), pad.left - 8, toY(e) + 3);
    }

    ctx.fillStyle = "rgba(170,190,220,0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Symmetry Path", pad.left + pw / 2, H - 6);
    ctx.save();
    ctx.translate(14, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("E(k) (eV)", 0, 0);
    ctx.restore();

    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();
  }, [bandPath]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

const BZ_DERIVATION = [
  { title: "Brillouin Zone Definition", content: "The first Brillouin zone (1BZ) is the Wigner-Seitz cell of the reciprocal lattice. It is the set of all k-points closer to the origin than to any other reciprocal lattice point G.", equation: "1BZ = { k : |k| ≤ |k − G| for all G ≠ 0 }" },
  { title: "Construction Method", content: "Draw perpendicular bisector planes (Bragg planes) between the origin and each reciprocal lattice point. The smallest enclosed volume is the 1st Brillouin zone.", equation: "2k · G = |G|²  (Bragg plane condition)" },
  { title: "Square Lattice BZ", content: "For a 2D square lattice with spacing a: reciprocal vectors b₁ = (2π/a)x̂, b₂ = (2π/a)ŷ. The 1BZ is a square.", equation: "1BZ: −π/a ≤ kₓ ≤ π/a,  −π/a ≤ k_y ≤ π/a" },
  { title: "Hexagonal BZ", content: "The honeycomb lattice has a hexagonal BZ. K point is where graphene's conduction and valence bands touch.", equation: "K = (2π/3a)(1, 1/√3),  M = (2π/3a)(1, 0)" },
  { title: "Band Structure Along Paths", content: "E(k) is plotted along high-symmetry paths capturing band extrema, crossings, and gap minima.", equation: "v_g = (1/ℏ) ∇_k E(k)  (group velocity)" },
  { title: "Tight-Binding Dispersion", content: "For 2D square lattice with nearest-neighbor hopping t: bandwidth is 8t. Van Hove singularities at saddle points.", equation: "E(k) = ε₀ − 2t[cos(kₓa) + cos(k_ya)]" },
];

export default function BrillouinZone() {
  const [type, setType] = useState<LatticeType>("square");
  const [a, setA] = useState(2.5);
  const [t, setT] = useState(1);

  const bz = useMemo(() => getBrillouinZone(type, a), [type, a]);

  const bandPath = useMemo(() => {
    const pts: { label: string; pathDist: number; energy: number }[] = [];
    let cumDist = 0;
    for (const seg of bz.pathSegments) {
      const from = bz.symmetryPoints.find(p => p.label === seg.from)!;
      const to = bz.symmetryPoints.find(p => p.label === seg.to)!;
      const segLen = Math.sqrt((to.kx - from.kx) ** 2 + (to.ky - from.ky) ** 2);
      for (let i = 0; i < seg.points; i++) {
        const frac = i / (seg.points - 1);
        const kx = from.kx + frac * (to.kx - from.kx);
        const ky = from.ky + frac * (to.ky - from.ky);
        const E = -2 * t * (Math.cos(kx * a) + Math.cos(ky * a));
        pts.push({ label: i === 0 ? seg.from : "", pathDist: cumDist + frac * segLen, energy: E });
      }
      cumDist += segLen;
    }
    const lastSeg = bz.pathSegments[bz.pathSegments.length - 1];
    const lastPt = bz.symmetryPoints.find(p => p.label === lastSeg.to)!;
    pts.push({
      label: lastSeg.to, pathDist: cumDist,
      energy: -2 * t * (Math.cos(lastPt.kx * a) + Math.cos(lastPt.ky * a)),
    });
    return pts;
  }, [bz, a, t]);

  const scale3D = 0.8;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass size={14} className="text-primary" /> Configuration
          </h3>
          <div className="space-y-1">
            {(["square", "honeycomb"] as const).map(lt => (
              <button key={lt} onClick={() => setType(lt)}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-all duration-300 ${
                  type === lt
                    ? "bg-primary/15 border-primary/30 text-primary font-medium shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "border-border/50 text-muted-foreground hover:bg-secondary/50 hover:border-border"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Atom size={12} />
                  {lt.charAt(0).toUpperCase() + lt.slice(1)}
                  {lt === "honeycomb" && <span className="text-[9px] opacity-60">(Graphene)</span>}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">a (Lattice Constant)</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{a.toFixed(1)} Å</span>
            </div>
            <Slider min={1} max={5} step={0.1} value={[a]} onValueChange={([v]) => setA(v)} className="h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">t (Hopping)</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{t.toFixed(1)} eV</span>
            </div>
            <Slider min={0.1} max={3} step={0.1} value={[t]} onValueChange={([v]) => setT(v)} className="h-4" />
          </div>

          <div className="pt-3 border-t border-border/30 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">High-Symmetry Points</p>
            {bz.symmetryPoints.map(sp => (
              <motion.div
                key={sp.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold flex items-center justify-center">{sp.label}</span>
                ({sp.kx.toFixed(3)}, {sp.ky.toFixed(3)}) Å⁻¹
              </motion.div>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={() => exportChartAsPDF(`BZ — ${type}`, [
            `Lattice: ${type} | a = ${a} Å | t = ${t} eV`,
            `Path: ${bz.pathSegments.map(s => s.from).join(" → ")} → ${bz.pathSegments[bz.pathSegments.length - 1].to}`,
          ], "bz-3d")} className="gap-1.5 text-xs w-full">
            <FileText size={12} /> Export PDF
          </Button>
        </GlassCard>

        {/* 3D Brillouin Zone */}
        <GlassCard className="lg:col-span-5 p-0 overflow-hidden" id="bz-3d">
          <div className="p-3 pb-0">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <RotateCcw size={12} className="text-muted-foreground animate-spin" style={{ animationDuration: "8s" }} />
              1st Brillouin Zone — 3D View
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Drag to rotate • Scroll to zoom</p>
          </div>
          <div className="h-[440px]">
            <Canvas camera={{ position: [2, 1.5, 3], fov: 50 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[5, 5, 5]} intensity={0.8} color="#63b3ed" />
              <pointLight position={[-5, -3, 3]} intensity={0.4} color="#a78bfa" />
              <pointLight position={[0, 0, -5]} intensity={0.3} color="#22d3ee" />

              <GridPlane />
              <AxesLabels />
              <BZPrism vertices={bz.vertices} height={0.6} />

              {/* Symmetry points on top face */}
              {bz.symmetryPoints.map(sp => (
                <SymmetryPoint
                  key={sp.label}
                  position={[sp.kx * scale3D, sp.ky * scale3D, 0.3]}
                  label={sp.label}
                />
              ))}

              {/* Symmetry paths */}
              {bz.pathSegments.map((seg, i) => {
                const from = bz.symmetryPoints.find(p => p.label === seg.from)!;
                const to = bz.symmetryPoints.find(p => p.label === seg.to)!;
                return (
                  <SymmetryPath
                    key={i}
                    from={[from.kx * scale3D, from.ky * scale3D, 0.31]}
                    to={[to.kx * scale3D, to.ky * scale3D, 0.31]}
                  />
                );
              })}

              <OrbitControls enablePan={false} enableDamping dampingFactor={0.05} minDistance={2} maxDistance={8} />
            </Canvas>
          </div>
        </GlassCard>

        {/* Band Structure */}
        <GlassCard className="lg:col-span-4 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">E(k) Along Symmetry Path</h3>
          <p className="text-[10px] text-muted-foreground mb-3 font-mono">
            {bz.pathSegments.map(s => s.from).join(" → ")} → {bz.pathSegments[bz.pathSegments.length - 1].to}
          </p>
          <BandCanvas bandPath={bandPath} pathSegments={bz.pathSegments} />
        </GlassCard>
      </div>

      <DerivationBlock title="Brillouin Zone Theory & Derivation" steps={BZ_DERIVATION} />
    </div>
  );
}
