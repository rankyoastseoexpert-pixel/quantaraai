import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DerivationBlock from "./DerivationBlock";
import { Download, Thermometer, Flame, Zap, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";

// ─── Constants ─────────────────────────────────────────────────────────
const KB = 8.617e-5;

const SliderRow = ({ label, value, min, max, step, onChange, unit, color }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; color?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono px-1.5 rounded text-[11px] ${color || "text-primary bg-primary/10"}`}>
        {value < 100 ? value.toFixed(2) : value.toFixed(0)}{unit}
      </span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
);

function fermiDirac(E: number, Ef: number, T: number): number {
  if (T < 1) return E <= Ef ? 1 : 0;
  const x = (E - Ef) / (KB * T);
  if (x > 500) return 0;
  if (x < -500) return 1;
  return 1 / (Math.exp(x) + 1);
}
function dos3D(E: number, Ef: number): number { return E < 0 ? 0 : Math.sqrt(E / Ef); }
function computeSpecificHeat(Ef: number, T: number): number { return Ef <= 0 ? 0 : (Math.PI ** 2 / 2) * (KB * T / Ef); }
function chemicalPotential(Ef: number, T: number): number {
  if (Ef <= 0 || T < 1) return Ef;
  const r = KB * T / Ef;
  return Ef * (1 - (Math.PI ** 2 / 12) * r * r);
}
function totalEnergy(Ef: number, T: number): number {
  if (Ef <= 0 || T < 1) return 0;
  const r = KB * T / Ef;
  return (5 * Math.PI ** 2 / 12) * r * r;
}

// ─── 3D Fermi Sphere ──────────────────────────────────────────────────
function FermiSphere({ fermiLevel, temperature }: { fermiLevel: number; temperature: number }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const kF = Math.sqrt(fermiLevel) * 0.5; // Normalized Fermi radius
  const thermalWidth = KB * temperature * 10; // Exaggerated for visibility

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
    if (glowRef.current) {
      const pulse = 1 + 0.03 * Math.sin(state.clock.elapsedTime * 2);
      glowRef.current.scale.setScalar(pulse);
    }
  });

  // Generate electron dots
  const electrons = useMemo(() => {
    const pts: { pos: [number, number, number]; occupied: boolean }[] = [];
    const n = 400;
    for (let i = 0; i < n; i++) {
      const r = Math.random() * kF * 1.6;
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      const energy = r * r / (kF * kF) * fermiLevel;
      const occ = fermiDirac(energy, fermiLevel, temperature) > Math.random();
      pts.push({ pos: [x, y, z], occupied: occ });
    }
    return pts;
  }, [kF, fermiLevel, temperature]);

  return (
    <group ref={groupRef}>
      {/* Fermi surface (transparent sphere) */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[kF, 48, 48]} />
        <meshStandardMaterial
          color="hsl(210, 100%, 60%)"
          transparent
          opacity={0.08}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe */}
      <mesh>
        <sphereGeometry args={[kF, 24, 24]} />
        <meshStandardMaterial
          color="hsl(210, 100%, 70%)"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* Glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[kF * 1.02, 32, 32]} />
        <meshStandardMaterial
          color="hsl(210, 100%, 60%)"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Thermal broadening ring */}
      {temperature > 50 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[kF, thermalWidth * 0.5, 16, 64]} />
          <meshStandardMaterial
            color="hsl(40, 90%, 55%)"
            transparent
            opacity={0.15 + 0.1 * Math.sin(Date.now() * 0.003)}
            emissive="hsl(40, 90%, 55%)"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Electron dots */}
      {electrons.map((e, i) => (
        <mesh key={i} position={e.pos}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial
            color={e.occupied ? "hsl(150, 70%, 60%)" : "hsl(350, 80%, 60%)"}
            emissive={e.occupied ? "hsl(150, 70%, 60%)" : "hsl(350, 80%, 60%)"}
            emissiveIntensity={0.4}
            transparent
            opacity={e.occupied ? 0.8 : 0.3}
          />
        </mesh>
      ))}

      {/* Axes */}
      {[
        { dir: [2, 0, 0] as [number, number, number], label: "kₓ" },
        { dir: [0, 2, 0] as [number, number, number], label: "kᵧ" },
        { dir: [0, 0, 2] as [number, number, number], label: "k_z" },
      ].map(({ dir, label }) => (
        <group key={label}>
          <mesh position={[dir[0] * 0.5, dir[1] * 0.5, dir[2] * 0.5]}>
            <cylinderGeometry args={[0.005, 0.005, Math.sqrt(dir[0]**2+dir[1]**2+dir[2]**2), 4]} />
            <meshStandardMaterial color="rgba(150,180,220,0.3)" transparent opacity={0.3} />
          </mesh>
          <Text position={[dir[0] * 1.1, dir[1] * 1.1, dir[2] * 1.1]} fontSize={0.1} color="rgba(150,180,220,0.6)">
            {label}
          </Text>
        </group>
      ))}
    </group>
  );
}

// ─── Canvas: Fermi-Dirac Broadening ───────────────────────────────────
function SommerfeldCanvas({
  fermiLevel, temperatures, showDOS, showOccupied, showDerivative, animPhase,
}: {
  fermiLevel: number; temperatures: number[]; showDOS: boolean; showOccupied: boolean; showDerivative: boolean; animPhase: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 420;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 60, right: 140, top: 40, bottom: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const Ef = fermiLevel;
    const eMax = Ef * 2.2;
    const N = 500;

    const toX = (E: number) => pad.left + (E / eMax) * plotW;
    const toY = (v: number) => pad.top + plotH - (v / 1.05) * plotH;

    // Background
    const bg = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    bg.addColorStop(0, "rgba(59,130,246,0.01)");
    bg.addColorStop(1, "rgba(139,92,246,0.01)");
    ctx.fillStyle = bg;
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    // Grid
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const x = pad.left + (plotW * i) / 8;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
      const y = pad.top + (plotH * i) / 8;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // DOS
    if (showDOS) {
      ctx.beginPath();
      ctx.moveTo(toX(0), pad.top + plotH);
      for (let i = 0; i <= N; i++) {
        const E = eMax * i / N;
        ctx.lineTo(toX(E), toY(dos3D(E, Ef) / 1.6));
      }
      ctx.lineTo(toX(eMax), pad.top + plotH);
      ctx.closePath();
      const dg = ctx.createLinearGradient(pad.left, pad.top, pad.left, pad.top + plotH);
      dg.addColorStop(0, "rgba(99,102,241,0.1)");
      dg.addColorStop(1, "rgba(99,102,241,0.02)");
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const E = eMax * i / N;
        i === 0 ? ctx.moveTo(toX(E), toY(dos3D(E, Ef) / 1.6)) : ctx.lineTo(toX(E), toY(dos3D(E, Ef) / 1.6));
      }
      ctx.strokeStyle = "rgba(99,102,241,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Occupied states
    if (showOccupied && temperatures.length > 0) {
      const T = temperatures[0];
      ctx.beginPath();
      ctx.moveTo(toX(0), pad.top + plotH);
      for (let i = 0; i <= N; i++) {
        const E = eMax * i / N;
        ctx.lineTo(toX(E), toY(dos3D(E, Ef) * fermiDirac(E, Ef, T) / 1.6));
      }
      ctx.lineTo(toX(eMax), pad.top + plotH);
      ctx.closePath();
      const og = ctx.createLinearGradient(pad.left, pad.top, pad.left, pad.top + plotH);
      og.addColorStop(0, "rgba(34,197,94,0.2)");
      og.addColorStop(1, "rgba(34,197,94,0.04)");
      ctx.fillStyle = og;
      ctx.fill();
    }

    // f(E) curves
    const colors = [
      "rgba(59,130,246,0.9)", "rgba(34,197,94,0.85)",
      "rgba(251,191,36,0.85)", "rgba(239,68,68,0.85)", "rgba(168,85,247,0.85)"
    ];
    temperatures.forEach((T, idx) => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const E = eMax * i / N;
        const f = fermiDirac(E, Ef, T);
        const y = toY(f);
        i === 0 ? ctx.moveTo(toX(E), y) : ctx.lineTo(toX(E), y);
      }
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = T === 0 ? 3 : 2.2;
      ctx.stroke();
    });

    // Derivative
    if (showDerivative) {
      temperatures.forEach((T, idx) => {
        if (T < 10) return;
        const kbt = KB * T;
        const peak = 1 / (4 * kbt);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const E = eMax * i / N;
          const x = (E - Ef) / kbt;
          let d = 0;
          if (Math.abs(x) < 500) { const ex = Math.exp(x); d = ex / (kbt * (1+ex)**2); }
          i === 0 ? ctx.moveTo(toX(E), toY(d / (peak * 3))) : ctx.lineTo(toX(E), toY(d / (peak * 3)));
        }
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Fermi level
    const efX = toX(Ef);
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "rgba(239,68,68,0.8)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(239,68,68,0.3)";
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(efX, pad.top); ctx.lineTo(efX, pad.top + plotH); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(239,68,68,0.9)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`E_F = ${Ef.toFixed(1)} eV`, efX, pad.top - 8);

    // Thermal window
    if (temperatures.length > 0 && temperatures[0] > 10) {
      const kbt = KB * temperatures[0];
      const bL = toX(Ef - 2 * kbt), bR = toX(Ef + 2 * kbt);
      const pulse = 0.2 + 0.15 * Math.sin(animPhase * 3);
      ctx.fillStyle = `rgba(251,191,36,${pulse})`;
      ctx.fillRect(bL, toY(0.5) - 5, bR - bL, 10);
      ctx.fillStyle = "rgba(251,191,36,0.7)";
      ctx.font = "italic 8px 'Georgia', serif";
      ctx.fillText(`~4k_BT`, (bL + bR) / 2, toY(0.5) + 20);
    }

    // Axes
    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

    ctx.fillStyle = "rgba(170,190,220,0.8)";
    ctx.font = "italic 11px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Energy E (eV)", pad.left + plotW / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("f(E) / D(E)", 0, 0);
    ctx.restore();

    // Y ticks
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(150,170,200,0.6)";
    ctx.textAlign = "right";
    [0, 0.5, 1.0].forEach(v => {
      ctx.fillText(v.toFixed(1), pad.left - 6, toY(v) + 3);
    });

    // Legend
    const lx = pad.left + plotW + 14;
    let ly = pad.top + 8;
    ctx.textAlign = "left";
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(230,240,255,0.8)";
    ctx.fillText("Legend", lx, ly);
    ly += 16;
    temperatures.forEach((T, idx) => {
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(T === 0 ? "T = 0 K" : `T = ${T} K`, lx + 20, ly + 3);
      ly += 14;
    });
  }, [fermiLevel, temperatures, showDOS, showOccupied, showDerivative, animPhase]);

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

// ─── Specific Heat Canvas ─────────────────────────────────────────────
function SpecificHeatCanvas({ fermiLevel, maxTemp }: { fermiLevel: number; maxTemp: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 260;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 55, right: 25, top: 40, bottom: 45 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const Ef = fermiLevel;
    const N = 300;
    const thetaD = 400;
    let maxC = 0;
    const data: { T: number; cel: number; clat: number }[] = [];

    for (let i = 0; i <= N; i++) {
      const T = (maxTemp * i) / N;
      const cel = computeSpecificHeat(Ef, T);
      const tR = T / thetaD;
      const debye = 3 * Math.min(1, 7.78 * tR * tR * tR);
      maxC = Math.max(maxC, cel * 50, debye);
      data.push({ T, cel, clat: debye });
    }
    maxC = Math.max(maxC * 1.15, 0.1);

    const toX = (T: number) => pad.left + (T / maxTemp) * plotW;
    const toY = (c: number) => pad.top + plotH - (c / maxC) * plotH;

    // Lattice
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top + plotH);
    data.forEach(d => ctx.lineTo(toX(d.T), toY(d.clat)));
    ctx.lineTo(toX(maxTemp), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(59,130,246,0.06)";
    ctx.fill();
    ctx.beginPath();
    data.forEach((d, i) => i === 0 ? ctx.moveTo(toX(d.T), toY(d.clat)) : ctx.lineTo(toX(d.T), toY(d.clat)));
    ctx.strokeStyle = "rgba(59,130,246,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Electronic (×50)
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top + plotH);
    data.forEach(d => ctx.lineTo(toX(d.T), toY(d.cel * 50)));
    ctx.lineTo(toX(maxTemp), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(239,68,68,0.06)";
    ctx.fill();
    ctx.beginPath();
    data.forEach((d, i) => i === 0 ? ctx.moveTo(toX(d.T), toY(d.cel * 50)) : ctx.lineTo(toX(d.T), toY(d.cel * 50)));
    ctx.strokeStyle = "rgba(239,68,68,0.9)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dulong-Petit
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(150,175,210,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, toY(3)); ctx.lineTo(pad.left + plotW, toY(3)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(150,175,210,0.4)";
    ctx.font = "italic 8px 'Georgia', serif";
    ctx.textAlign = "right";
    ctx.fillText("3Nk_B", pad.left + plotW, toY(3) - 4);

    // Axes
    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

    ctx.fillStyle = "rgba(170,190,220,0.7)";
    ctx.font = "italic 10px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("T (K)", pad.left + plotW / 2, H - 6);
    ctx.save(); ctx.translate(12, pad.top + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("C / Nk_B", 0, 0); ctx.restore();

    // Title
    ctx.fillStyle = "rgba(230,240,255,0.9)";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("C_el (×50 red) vs C_lat (blue)", pad.left, 18);

    // Legend
    const lx = pad.left + plotW - 120;
    ctx.strokeStyle = "rgba(239,68,68,0.9)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lx, pad.top + 10); ctx.lineTo(lx + 14, pad.top + 10); ctx.stroke();
    ctx.fillStyle = "rgba(239,68,68,0.8)"; ctx.font = "9px 'JetBrains Mono', monospace"; ctx.textAlign = "left";
    ctx.fillText("C_el ×50", lx + 18, pad.top + 13);
    ctx.strokeStyle = "rgba(59,130,246,0.6)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, pad.top + 24); ctx.lineTo(lx + 14, pad.top + 24); ctx.stroke();
    ctx.fillStyle = "rgba(59,130,246,0.6)";
    ctx.fillText("C_lat", lx + 18, pad.top + 27);
  }, [fermiLevel, maxTemp]);

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

const SOMMERFELD_DERIVATION = [
  { title: "Fermi-Dirac Distribution", content: "Occupation probability at temperature T.", equation: "f(E) = 1 / [exp((E − E_F) / k_BT) + 1]" },
  { title: "Thermal Broadening", content: "−df/dE is bell-shaped centered at E_F, width ~4k_BT.", equation: "−df/dE = (1/4k_BT) · sech²((E − E_F) / 2k_BT)" },
  { title: "Sommerfeld Expansion", content: "Integral expansion valid when k_BT ≪ E_F.", equation: "∫φ(E)f(E)dE = ∫₀^μ φdE + (π²/6)(k_BT)² φ'(μ) + ..." },
  { title: "Chemical Potential", content: "μ(T) shifts downward from E_F with temperature.", equation: "μ(T) = E_F [1 − (π²/12)(k_BT/E_F)²]" },
  { title: "Electronic Specific Heat", content: "Linear-T specific heat with Sommerfeld coefficient γ.", equation: "C_el = γT,  γ = (π²/3) k_B² D(E_F)" },
  { title: "C/T vs T² Analysis", content: "Standard experimental method: intercept gives γ, slope gives β.", equation: "C/T = γ + βT²" },
  { title: "Effective Mass Enhancement", content: "Measured γ reveals many-body m* enhancement.", equation: "γ_measured / γ_free = m* / m_e" },
];

export default function SommerfeldExpansion() {
  const [fermiLevel, setFermiLevel] = useState(5.0);
  const [temperatures, setTemperatures] = useState([0, 300, 1000, 3000]);
  const [tempSlider, setTempSlider] = useState(300);
  const [showDOS, setShowDOS] = useState(true);
  const [showOccupied, setShowOccupied] = useState(true);
  const [showDerivative, setShowDerivative] = useState(true);
  const [maxTempHeat, setMaxTempHeat] = useState(1000);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    let raf: number;
    let t = 0;
    const anim = () => { t += 0.016; setAnimPhase(t); raf = requestAnimationFrame(anim); };
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const ts = [0];
    if (tempSlider > 0) ts.push(tempSlider);
    if (tempSlider > 500) ts.push(Math.round(tempSlider * 2.5));
    if (tempSlider > 1000) ts.push(Math.round(tempSlider * 5));
    setTemperatures(ts);
  }, [tempSlider]);

  const mu = chemicalPotential(fermiLevel, tempSlider);
  const cel = computeSpecificHeat(fermiLevel, tempSlider);
  const deltaU = totalEnergy(fermiLevel, tempSlider);
  const gamma = fermiLevel > 0 ? (Math.PI ** 2 / 2) * KB / fermiLevel : 0;
  const tF = fermiLevel / KB;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Fermi Sphere */}
        <GlassCard className="lg:col-span-5 p-0 overflow-hidden">
          <div className="p-3 pb-0">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <RotateCcw size={12} className="text-muted-foreground animate-spin" style={{ animationDuration: "8s" }} />
              Fermi Sphere in k-Space
            </h3>
            <p className="text-[10px] text-muted-foreground">Green = occupied • Red = unoccupied • Gold ring = thermal broadening</p>
          </div>
          <div className="h-[380px]">
            <Canvas camera={{ position: [3, 2.5, 3], fov: 50 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[5, 5, 5]} intensity={0.8} color="#63b3ed" />
              <pointLight position={[-5, -3, 3]} intensity={0.4} color="#a78bfa" />
              <FermiSphere fermiLevel={fermiLevel} temperature={tempSlider} />
              <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
            </Canvas>
          </div>
        </GlassCard>

        {/* f(E) Canvas */}
        <GlassCard className="lg:col-span-7 p-4">
          <SommerfeldCanvas
            fermiLevel={fermiLevel}
            temperatures={temperatures}
            showDOS={showDOS}
            showOccupied={showOccupied}
            showDerivative={showDerivative}
            animPhase={animPhase}
          />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Parameters
          </h3>
          <SliderRow label="E_F (Fermi Energy)" value={fermiLevel} min={1} max={12} step={0.1} onChange={setFermiLevel} unit=" eV" color="text-red-400 bg-red-400/10" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Thermometer size={12} className="text-amber-400" />
              <span className="text-xs text-muted-foreground">Temperature</span>
            </div>
            <SliderRow label="T" value={tempSlider} min={0} max={5000} step={10} onChange={setTempSlider} unit=" K" color="text-amber-400 bg-amber-400/10" />
            <p className="text-[9px] text-muted-foreground font-mono">k_BT = {(KB * tempSlider).toFixed(4)} eV</p>
          </div>

          <div className="pt-3 border-t border-border/30 space-y-2">
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              D(E) background <Switch checked={showDOS} onCheckedChange={setShowDOS} />
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              Occupied states <Switch checked={showOccupied} onCheckedChange={setShowOccupied} />
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              −df/dE derivative <Switch checked={showDerivative} onCheckedChange={setShowDerivative} />
            </label>
          </div>

          <div className="pt-3 border-t border-border/30">
            <SliderRow label="C(T) Max Temp" value={maxTempHeat} min={100} max={5000} step={50} onChange={setMaxTempHeat} unit=" K" color="text-blue-400 bg-blue-400/10" />
          </div>

          <Button size="sm" variant="outline" onClick={() => {
            const c = document.querySelector("#sommerfeld-heat canvas") as HTMLCanvasElement;
            if (!c) return;
            const l = document.createElement("a");
            l.download = "sommerfeld.png"; l.href = c.toDataURL(); l.click();
          }} className="gap-1.5 text-xs w-full">
            <Download size={12} /> Export PNG
          </Button>
        </GlassCard>

        {/* Quantities + Specific Heat */}
        <div className="lg:col-span-9 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Chemical Potential", value: mu.toFixed(4), unit: "eV", note: "μ(T)", color: "text-primary" },
              { label: "Shift Δμ", value: ((mu - fermiLevel) * 1000).toFixed(2), unit: "meV", note: "μ − E_F", color: "text-purple-400" },
              { label: "C_el / Nk_B", value: cel.toExponential(3), unit: "", note: "= γT/Nk_B", color: "text-red-400" },
              { label: "Sommerfeld γ", value: (gamma * 1e6).toFixed(3), unit: "μeV/K", note: "per electron", color: "text-amber-400" },
              { label: "Fermi Temp", value: tF.toFixed(0), unit: "K", note: "T_F = E_F/k_B", color: "text-blue-400" },
              { label: "ΔU/U₀", value: (deltaU * 100).toFixed(4), unit: "%", note: "energy increase", color: "text-green-400" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
                <div className="flex justify-between items-baseline mt-0.5">
                  <p className="text-[8px] text-muted-foreground">{item.note}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{item.unit}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Validity */}
          <div className={`p-3 rounded-lg border text-xs ${
            KB * tempSlider / fermiLevel < 0.1
              ? "bg-green-500/5 border-green-500/20 text-green-400"
              : KB * tempSlider / fermiLevel < 0.3
                ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
                : "bg-red-500/5 border-red-500/20 text-red-400"
          }`}>
            <span className="font-semibold">Expansion validity: </span>
            k_BT/E_F = {(KB * tempSlider / fermiLevel).toFixed(4)}
            {KB * tempSlider / fermiLevel < 0.1 && " — Excellent (degenerate regime)"}
            {KB * tempSlider / fermiLevel >= 0.1 && KB * tempSlider / fermiLevel < 0.3 && " — Fair"}
            {KB * tempSlider / fermiLevel >= 0.3 && " — Poor (expansion breaks down)"}
          </div>

          <GlassCard className="p-4" id="sommerfeld-heat">
            <SpecificHeatCanvas fermiLevel={fermiLevel} maxTemp={maxTempHeat} />
          </GlassCard>
        </div>
      </div>

      <DerivationBlock title="Sommerfeld Expansion — Complete Derivation" steps={SOMMERFELD_DERIVATION} />
    </div>
  );
}
