import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { Download, FileText, AudioWaveform, Waves } from "lucide-react";
import { motion } from "framer-motion";

const SliderRow = ({ label, value, min, max, step, onChange, unit, color }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; color?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono px-1.5 rounded text-[11px] ${color || "text-primary bg-primary/10"}`}>{value.toFixed(2)}{unit}</span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
);

interface PhononResult {
  qValues: number[];
  acoustic: number[];
  optical: number[];
  groupVelocityAcoustic: number[];
  groupVelocityOptical: number[];
  dos: { freq: number; density: number }[];
}

function computePhononDispersion(M1: number, M2: number, k_spring: number, a: number, N: number): PhononResult {
  const qValues: number[] = [];
  const acoustic: number[] = [];
  const optical: number[] = [];
  const groupVelocityAcoustic: number[] = [];
  const groupVelocityOptical: number[] = [];

  for (let i = 0; i < N; i++) {
    const q = -Math.PI / a + (2 * Math.PI / a) * i / (N - 1);
    qValues.push(q);
    const sinTerm = Math.sin(q * a / 2);
    const sin2 = sinTerm * sinTerm;
    const sum_inv = 1 / M1 + 1 / M2;
    const discriminant = sum_inv * sum_inv - 4 * sin2 / (M1 * M2);
    const disc_safe = Math.max(discriminant, 0);
    acoustic.push(Math.sqrt(Math.max(k_spring * (sum_inv - Math.sqrt(disc_safe)), 0)));
    optical.push(Math.sqrt(Math.max(k_spring * (sum_inv + Math.sqrt(disc_safe)), 0)));
  }

  const dq = qValues.length > 2 ? qValues[1] - qValues[0] : 1;
  for (let i = 0; i < N; i++) {
    const ip = Math.min(i + 1, N - 1), im = Math.max(i - 1, 0);
    const dq2 = qValues[ip] - qValues[im] || dq;
    groupVelocityAcoustic.push((acoustic[ip] - acoustic[im]) / dq2);
    groupVelocityOptical.push((optical[ip] - optical[im]) / dq2);
  }

  const allFreqs = [...acoustic, ...optical];
  const fMax = Math.max(...allFreqs) * 1.05;
  const nBins = 80;
  const df = fMax / nBins || 0.1;
  const bins = new Array(nBins).fill(0);
  for (const f of allFreqs) {
    const idx = Math.min(Math.floor(f / df), nBins - 1);
    if (idx >= 0) bins[idx]++;
  }
  const dos = bins.map((count, i) => ({ freq: (i + 0.5) * df, density: count / (2 * N * df) }));

  return { qValues, acoustic, optical, groupVelocityAcoustic, groupVelocityOptical, dos };
}

// ─── Animated Lattice Chain Visualization ──────────────────────────────
function LatticeVibrationCanvas({ M1, M2, kSpring, a, animPhase }: {
  M1: number; M2: number; kSpring: number; a: number; animPhase: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = 120;
    const dpr = Math.max(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const nCells = 8;
    const cellWidth = (W - 40) / nCells;
    const cy = H / 2;
    const maxDisp = 12;

    // Draw spring connections and atoms
    for (let n = 0; n < nCells; n++) {
      const x1base = 20 + n * cellWidth;
      const x2base = x1base + cellWidth * 0.5;

      // Acoustic mode displacement
      const u1 = maxDisp * Math.sin(2 * Math.PI * n / nCells - animPhase * 3);
      const u2 = maxDisp * Math.sin(2 * Math.PI * (n + 0.3) / nCells - animPhase * 3);

      const x1 = x1base + u1;
      const x2 = x2base + u2;

      // Spring (zigzag)
      ctx.strokeStyle = "rgba(150,180,220,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const springSegs = 8;
      for (let s = 0; s <= springSegs; s++) {
        const frac = s / springSegs;
        const sx = x1 + (x2 - x1) * frac;
        const sy = cy + (s % 2 === 0 ? -4 : 4) * (s > 0 && s < springSegs ? 1 : 0);
        s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Atom 1 (M1)
      const r1 = 6 + (M1 / 100) * 8;
      ctx.beginPath();
      ctx.arc(x1, cy, r1, 0, 2 * Math.PI);
      const g1 = ctx.createRadialGradient(x1 - 2, cy - 2, 0, x1, cy, r1);
      g1.addColorStop(0, "hsl(210, 100%, 75%)");
      g1.addColorStop(1, "hsl(210, 100%, 50%)");
      ctx.fillStyle = g1;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Atom 2 (M2)
      if (n < nCells - 1 || true) {
        const r2 = 6 + (M2 / 100) * 8;
        ctx.beginPath();
        ctx.arc(x2, cy, r2, 0, 2 * Math.PI);
        const g2 = ctx.createRadialGradient(x2 - 2, cy - 2, 0, x2, cy, r2);
        g2.addColorStop(0, "hsl(350, 80%, 75%)");
        g2.addColorStop(1, "hsl(350, 80%, 55%)");
        ctx.fillStyle = g2;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Labels
    ctx.fillStyle = "rgba(170,190,220,0.6)";
    ctx.font = "italic 9px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Acoustic Mode — Real-Time Lattice Vibration", W / 2, H - 6);
  }, [M1, M2, kSpring, a, animPhase]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

// ─── Dispersion Canvas ─────────────────────────────────────────────────
function DispersionCanvas({ result, showVelocity, showDOS }: {
  result: PhononResult; showVelocity: boolean; showDOS: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const dosW = showDOS ? 120 : 0;
    const mainW = W - dosW;
    const H = 440;
    const dpr = Math.max(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 60, right: 15, top: 35, bottom: 50 };
    const pw = mainW - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    const qMin = Math.min(...result.qValues);
    const qMax = Math.max(...result.qValues);
    const fMax = Math.max(...result.optical) * 1.1;

    const toX = (q: number) => pad.left + ((q - qMin) / (qMax - qMin)) * pw;
    const toY = (f: number) => pad.top + ph - (f / fMax) * ph;

    // Background
    ctx.fillStyle = "rgba(59,130,246,0.01)";
    ctx.fillRect(pad.left, pad.top, pw, ph);

    // Grid
    ctx.strokeStyle = "rgba(100,140,200,0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const y = pad.top + (ph / 8) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    // Phonon gap shading
    const maxAc = Math.max(...result.acoustic);
    const minOp = Math.min(...result.optical);
    if (minOp > maxAc) {
      const gapGrad = ctx.createLinearGradient(0, toY(minOp), 0, toY(maxAc));
      gapGrad.addColorStop(0, "rgba(245,158,11,0.04)");
      gapGrad.addColorStop(0.5, "rgba(245,158,11,0.1)");
      gapGrad.addColorStop(1, "rgba(245,158,11,0.04)");
      ctx.fillStyle = gapGrad;
      ctx.fillRect(pad.left, toY(minOp), pw, toY(maxAc) - toY(minOp));
      ctx.fillStyle = "rgba(245,158,11,0.5)";
      ctx.font = "italic 9px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.fillText("phonon gap", pad.left + pw / 2, (toY(minOp) + toY(maxAc)) / 2 + 3);
    }

    // Band fills
    const drawBandFill = (data: number[], color: string) => {
      ctx.beginPath();
      ctx.moveTo(toX(qMin), pad.top + ph);
      result.qValues.forEach((q, i) => ctx.lineTo(toX(q), toY(data[i])));
      ctx.lineTo(toX(qMax), pad.top + ph);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawBandFill(result.acoustic, "rgba(34,197,94,0.06)");
    drawBandFill(result.optical, "rgba(239,68,68,0.04)");

    // Band curves with glow
    const drawCurve = (data: number[], color: string, lw: number) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      result.qValues.forEach((q, i) => {
        const x = toX(q), y = toY(data[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawCurve(result.acoustic, "hsl(150, 70%, 55%)", 3);
    drawCurve(result.optical, "hsl(350, 80%, 65%)", 3);

    // Group velocity (scaled overlay)
    if (showVelocity) {
      const vMax = Math.max(
        ...result.groupVelocityAcoustic.map(Math.abs),
        ...result.groupVelocityOptical.map(Math.abs),
      ) || 1;

      const drawVel = (data: number[], color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        result.qValues.forEach((q, i) => {
          const x = toX(q);
          const y = pad.top + ph / 2 - (data[i] / vMax) * (ph / 4);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawVel(result.groupVelocityAcoustic, "rgba(34,197,94,0.4)");
      drawVel(result.groupVelocityOptical, "rgba(239,68,68,0.4)");
    }

    // Axes & labels
    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();

    ctx.fillStyle = "rgba(170,190,220,0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("q (Å⁻¹)", pad.left + pw / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("ω (arb. units)", 0, 0);
    ctx.restore();

    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(150,170,200,0.7)";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const f = (fMax / 6) * i;
      ctx.fillText(f.toFixed(2), pad.left - 8, toY(f) + 3);
    }

    // Legend
    const lx = pad.left + 10, ly = pad.top + 10;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.strokeStyle = "hsl(150, 70%, 55%)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 16, ly); ctx.stroke();
    ctx.fillStyle = "rgba(200,230,220,0.8)"; ctx.textAlign = "left";
    ctx.fillText("Acoustic ω₋", lx + 22, ly + 3);

    ctx.strokeStyle = "hsl(350, 80%, 65%)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly + 16); ctx.lineTo(lx + 16, ly + 16); ctx.stroke();
    ctx.fillStyle = "rgba(230,200,200,0.8)";
    ctx.fillText("Optical ω₊", lx + 22, ly + 19);

    // DOS sidebar
    if (showDOS) {
      const dosX = mainW + 10;
      const dosW2 = dosW - 20;
      const maxDens = Math.max(...result.dos.map(d => d.density)) || 1;

      ctx.strokeStyle = "rgba(100,140,200,0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(dosX, pad.top); ctx.lineTo(dosX, pad.top + ph); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(dosX, pad.top + ph);
      result.dos.forEach(d => {
        const y = toY(d.freq);
        const x = dosX + (d.density / maxDens) * dosW2;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(dosX, pad.top);
      ctx.closePath();
      const dosGrad = ctx.createLinearGradient(dosX, 0, dosX + dosW2, 0);
      dosGrad.addColorStop(0, "rgba(245,158,11,0.2)");
      dosGrad.addColorStop(1, "rgba(245,158,11,0.02)");
      ctx.fillStyle = dosGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dosX, pad.top + ph);
      result.dos.forEach(d => {
        ctx.lineTo(dosX + (d.density / maxDens) * dosW2, toY(d.freq));
      });
      ctx.strokeStyle = "hsl(40, 90%, 55%)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(245,158,11,0.7)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("g(ω)", dosX + dosW2 / 2, pad.top - 5);
    }

    // Title
    ctx.fillStyle = "rgba(230,240,255,0.9)";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Phonon Dispersion — Diatomic Chain", pad.left, 18);
  }, [result, showVelocity, showDOS]);

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

const PHONON_DERIVATION = [
  { title: "Diatomic Chain EOM", content: "Alternating masses M₁, M₂ with spring constant K.", equation: "M₁ ü_n = K(v_n + v_{n-1} − 2u_n)\nM₂ v̈_n = K(u_{n+1} + u_n − 2v_n)" },
  { title: "Plane-Wave Ansatz", content: "Travelling wave solutions yield a 2×2 eigenvalue problem.", equation: "u_n = A·e^{i(qna − ωt)}" },
  { title: "Secular Equation", content: "Two solutions: acoustic (−) and optical (+) branches.", equation: "ω² = K(1/M₁ + 1/M₂) ∓ K√[(1/M₁ + 1/M₂)² − (4sin²(qa/2))/(M₁M₂)]" },
  { title: "Acoustic Branch", content: "At q → 0, ω ∝ |q| (sound waves). Both atoms move in phase.", equation: "ω_acoustic → |q|·a·√(K / 2(M₁ + M₂))" },
  { title: "Optical Branch", content: "At q = 0, finite frequency. Atoms oscillate out of phase.", equation: "ω_optical(q=0) = √[2K(1/M₁ + 1/M₂)]" },
  { title: "Phonon Gap", content: "Gap exists when M₁ ≠ M₂. Van Hove singularities at band edges.", equation: "Gap = ω_opt(π/a) − ω_ac(π/a)" },
];

const PRESETS: Record<string, { label: string; icon: string; M1: number; M2: number; K: number; a: number }> = {
  sige: { label: "Si–Ge", icon: "🔷", M1: 28, M2: 73, K: 12, a: 3.8 },
  nacl: { label: "NaCl", icon: "🧂", M1: 23, M2: 35, K: 8, a: 2.8 },
  gaas: { label: "GaAs", icon: "🟣", M1: 70, M2: 75, K: 15, a: 4.0 },
  diamond: { label: "C–C", icon: "💎", M1: 12, M2: 12, K: 40, a: 1.5 },
};

export default function PhononDispersion() {
  const [M1, setM1] = useState(28);
  const [M2, setM2] = useState(12);
  const [kSpring, setKSpring] = useState(10);
  const [latticeA, setLatticeA] = useState(3);
  const [showDOS, setShowDOS] = useState(true);
  const [showVelocity, setShowVelocity] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    let raf: number;
    let t = 0;
    const animate = () => { t += 0.016; setAnimPhase(t); raf = requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const N = 200;
  const result = useMemo(() => computePhononDispersion(M1, M2, kSpring, latticeA, N), [M1, M2, kSpring, latticeA]);

  const omegaMaxAcoustic = Math.max(...result.acoustic);
  const omegaMinOptical = Math.min(...result.optical);
  const omegaMaxOptical = Math.max(...result.optical);
  const phononGap = omegaMinOptical - omegaMaxAcoustic;

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setM1(p.M1); setM2(p.M2); setKSpring(p.K); setLatticeA(p.a);
    setActivePreset(key);
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(PRESETS).map(([key, p], i) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => applyPreset(key)}
            className={`p-3 rounded-xl border text-left transition-all duration-300 ${
              activePreset === key
                ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                : "bg-secondary/20 border-border/40 hover:bg-secondary/40"
            }`}
          >
            <span className="text-lg">{p.icon}</span>
            <p className="text-xs font-semibold text-foreground mt-1">{p.label}</p>
            <p className="text-[9px] text-muted-foreground">M₁={p.M1} M₂={p.M2}</p>
          </motion.button>
        ))}
      </div>

      {/* Lattice animation */}
      <GlassCard className="p-4">
        <LatticeVibrationCanvas M1={M1} M2={M2} kSpring={kSpring} a={latticeA} animPhase={animPhase} />
        <div className="flex gap-4 mt-2 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(210,100%,60%)" }} /> M₁ = {M1} amu</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(350,80%,60%)" }} /> M₂ = {M2} amu</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AudioWaveform size={14} className="text-primary" /> Parameters
          </h3>
          <SliderRow label="M₁ (Mass 1)" value={M1} min={1} max={100} step={1} onChange={v => { setM1(v); setActivePreset(null); }} unit=" amu" />
          <SliderRow label="M₂ (Mass 2)" value={M2} min={1} max={100} step={1} onChange={v => { setM2(v); setActivePreset(null); }} unit=" amu" color="text-red-400 bg-red-400/10" />
          <SliderRow label="K (Spring)" value={kSpring} min={1} max={50} step={0.5} onChange={v => { setKSpring(v); setActivePreset(null); }} unit="" />
          <SliderRow label="a (Lattice)" value={latticeA} min={1} max={8} step={0.1} onChange={v => { setLatticeA(v); setActivePreset(null); }} unit=" Å" />

          <div className="pt-3 border-t border-border/30 space-y-1">
            <p className="text-xs font-semibold text-foreground">Computed</p>
            <p className="text-xs text-muted-foreground font-mono">μ = {((M1*M2)/(M1+M2)).toFixed(2)} amu</p>
            <p className="text-xs text-muted-foreground font-mono">ω_opt(0) = {result.optical[Math.floor(N/2)]?.toFixed(3)}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => setShowDOS(!showDOS)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showDOS ? "bg-primary/15 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/50"}`}>
              DOS
            </button>
            <button onClick={() => setShowVelocity(!showVelocity)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showVelocity ? "bg-primary/15 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/50"}`}>
              v_g
            </button>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const c = document.querySelector("#phonon-canvas canvas") as HTMLCanvasElement;
              if (!c) return;
              const l = document.createElement("a");
              l.download = "phonon.png"; l.href = c.toDataURL(); l.click();
            }} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportChartAsPDF("Phonon Dispersion", [
              `M₁=${M1} M₂=${M2} K=${kSpring} a=${latticeA}`,
            ], "phonon-canvas")} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        {/* Main dispersion canvas */}
        <GlassCard className="p-5 lg:col-span-9" id="phonon-canvas">
          <DispersionCanvas result={result} showVelocity={showVelocity} showDOS={showDOS} />
        </GlassCard>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "ω_max (Acoustic)", value: omegaMaxAcoustic.toFixed(3), icon: "🔊", color: "text-green-400" },
          { label: "ω_max (Optical)", value: omegaMaxOptical.toFixed(3), icon: "✨", color: "text-red-400" },
          { label: "Phonon Gap", value: phononGap > 0 ? phononGap.toFixed(3) : "None", icon: "📊", color: phononGap > 0 ? "text-amber-400" : "text-muted-foreground" },
          { label: "Mass Ratio", value: (Math.max(M1,M2)/Math.min(M1,M2)).toFixed(2), icon: "⚖️", color: "text-foreground" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 text-center">
              <span className="text-lg">{item.icon}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
              <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <DerivationBlock title="Phonon Dispersion Derivation" steps={PHONON_DERIVATION} />
    </div>
  );
}
