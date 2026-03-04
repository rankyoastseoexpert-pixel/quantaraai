import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveKronigPenney } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";
import { Download, FileText, Play, Pause } from "lucide-react";
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

const BAND_COLORS = [
  "hsl(195, 100%, 50%)", "hsl(280, 80%, 65%)", "hsl(150, 70%, 50%)",
  "hsl(40, 90%, 55%)", "hsl(350, 80%, 60%)", "hsl(210, 90%, 65%)",
  "hsl(120, 60%, 55%)", "hsl(30, 85%, 55%)",
];

const KP_DERIVATION = [
  {
    title: "Schrödinger Equation in Periodic Potential",
    content: "For a 1D periodic potential V(x) with period d = a + b, we solve the time-independent Schrödinger equation in each region. In the well (0 < x < a), V = 0; in the barrier (a < x < d), V = V₀.",
    equation: "−(ℏ²/2m) d²ψ/dx² + V(x)ψ = Eψ"
  },
  {
    title: "Solutions in Each Region",
    content: "In the well region (E > 0): ψ = Ae^{iαx} + Be^{−iαx} with α = √(2mE/ℏ²). In the barrier region (E < V₀): ψ = Ce^{βx} + De^{−βx} with β = √(2m(V₀−E)/ℏ²).",
    equation: "α = √(2mE/ℏ²),  β = √(2m(V₀−E)/ℏ²)"
  },
  {
    title: "Bloch's Theorem Application",
    content: "By Bloch's theorem, ψ(x + d) = e^{ikd}ψ(x). Applying boundary conditions (continuity of ψ and dψ/dx) at x = 0 and x = a, and using Bloch periodicity, we obtain the secular equation.",
    equation: "ψ_k(x) = e^{ikx} u_k(x),  u_k(x + d) = u_k(x)"
  },
  {
    title: "Kronig–Penney Transcendental Equation (E < V₀)",
    content: "The allowed energies satisfy this transcendental equation. Solutions exist only when |RHS| ≤ 1, defining the allowed energy bands. Gaps appear where |f(E)| > 1.",
    equation: "cos(kd) = cos(αa)·cosh(βb) − [(α² − β²)/(2αβ)]·sin(αa)·sinh(βb)"
  },
  {
    title: "Above-Barrier Case (E > V₀)",
    content: "When E exceeds V₀, the barrier region becomes oscillatory: β → iκ where κ = √(2m(E−V₀)/ℏ²). The transcendental equation transforms accordingly.",
    equation: "cos(kd) = cos(αa)·cos(κb) − [(α² + κ²)/(2ακ)]·sin(αa)·sin(κb)"
  },
  {
    title: "Band Structure & Forbidden Gaps",
    content: "Allowed energy bands correspond to ranges of E where |f(E)| ≤ 1. The Bloch wavevector k spans the first Brillouin zone: −π/d ≤ k ≤ π/d. Band gaps arise at zone boundaries where Bragg reflection occurs.",
    equation: "E_gap ∝ 2|V_G| at k = nπ/d  (Bragg condition)"
  },
];

const HBAR2_OVER_2M = 3.81; // eV·Å²

// ─── Research-Grade KP Canvas ──────────────────────────────────────────
function KronigPenneyCanvas({
  V0, a, b, mass, energy, animating, timeRef
}: {
  V0: number; a: number; b: number; mass: number; energy: number;
  animating: boolean; timeRef: React.MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 2; // min 2x for high DPI
    const W = container.clientWidth;
    const H = 520;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // ── Layout ──
    const pad = { left: 65, right: 45, top: 55, bottom: 70 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const d = a + b;
    const numCells = 6;
    const totalX = d * numCells;
    const startX = -d * (numCells / 2);
    const vMax = Math.max(V0 * 1.6, energy * 1.3, 2);

    const toX = (x: number) => pad.left + ((x - startX) / totalX) * plotW;
    const toY = (v: number) => pad.top + plotH - (v / vMax) * plotH;
    const t = timeRef.current;

    // ── Background subtle grid ──
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let gx = startX; gx <= startX + totalX; gx += d / 4) {
      ctx.beginPath(); ctx.moveTo(toX(gx), pad.top); ctx.lineTo(toX(gx), pad.top + plotH); ctx.stroke();
    }
    for (let gy = 0; gy <= vMax; gy += vMax / 8) {
      ctx.beginPath(); ctx.moveTo(pad.left, toY(gy)); ctx.lineTo(pad.left + plotW, toY(gy)); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Allowed / Forbidden band shading ──
    for (let p = 0; p < numCells; p++) {
      const cellStart = startX + p * d;
      // Well = allowed (subtle cyan)
      const wx1 = toX(cellStart), wx2 = toX(cellStart + a);
      const wellGrad = ctx.createLinearGradient(wx1, pad.top, wx1, pad.top + plotH);
      wellGrad.addColorStop(0, "rgba(0, 180, 255, 0.04)");
      wellGrad.addColorStop(0.5, "rgba(0, 180, 255, 0.08)");
      wellGrad.addColorStop(1, "rgba(0, 180, 255, 0.04)");
      ctx.fillStyle = wellGrad;
      ctx.fillRect(wx1, pad.top, wx2 - wx1, plotH);

      // Barrier = forbidden (subtle red)
      const bx1 = toX(cellStart + a), bx2 = toX(cellStart + d);
      const barGrad = ctx.createLinearGradient(bx1, pad.top, bx1, pad.top + plotH);
      barGrad.addColorStop(0, "rgba(255, 60, 60, 0.03)");
      barGrad.addColorStop(0.5, "rgba(255, 60, 60, 0.06)");
      barGrad.addColorStop(1, "rgba(255, 60, 60, 0.03)");
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx1, pad.top, bx2 - bx1, plotH);
    }

    // ── Axes ──
    ctx.strokeStyle = "rgba(150, 175, 210, 0.4)";
    ctx.lineWidth = 1.5;
    const yZero = toY(0);
    ctx.beginPath(); ctx.moveTo(pad.left, yZero); ctx.lineTo(pad.left + plotW, yZero); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();
    // Arrow tips
    ctx.fillStyle = "rgba(150, 175, 210, 0.5)";
    ctx.beginPath(); ctx.moveTo(pad.left + plotW, yZero); ctx.lineTo(pad.left + plotW - 8, yZero - 4); ctx.lineTo(pad.left + plotW - 8, yZero + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left - 4, pad.top + 8); ctx.lineTo(pad.left + 4, pad.top + 8); ctx.fill();

    // ── Draw periodic potential V(x) ──
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    for (let p = 0; p < numCells; p++) {
      const cellStart = startX + p * d;

      // Barrier gradient fill
      const bx = toX(cellStart + a);
      const bw = toX(cellStart + d) - bx;
      const by = toY(V0);
      const bh = yZero - by;
      const barrierGrad = ctx.createLinearGradient(bx, by, bx, yZero);
      barrierGrad.addColorStop(0, "rgba(255, 85, 85, 0.40)");
      barrierGrad.addColorStop(0.6, "rgba(255, 85, 85, 0.15)");
      barrierGrad.addColorStop(1, "rgba(255, 85, 85, 0.05)");
      ctx.fillStyle = barrierGrad;
      ctx.fillRect(bx, by, bw, bh);

      // Outline
      ctx.strokeStyle = "rgba(255, 100, 100, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toX(cellStart), yZero);
      ctx.lineTo(toX(cellStart + a), yZero);
      ctx.lineTo(toX(cellStart + a), by);
      ctx.lineTo(toX(cellStart + d), by);
      ctx.lineTo(toX(cellStart + d), yZero);
      ctx.stroke();
    }

    // ── V₀ reference line ──
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255, 180, 50, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, toY(V0)); ctx.lineTo(pad.left + plotW, toY(V0)); ctx.stroke();
    ctx.setLineDash([]);

    // ── Energy level E ──
    const yE = toY(energy);
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = "rgba(50, 255, 150, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, yE); ctx.lineTo(pad.left + plotW, yE); ctx.stroke();
    ctx.setLineDash([]);

    // ── Bloch wavefunction ψ_k(x) = u_k(x)·e^{ikx} ──
    const alpha = Math.sqrt(Math.max(energy, 0.01) / (HBAR2_OVER_2M / mass));
    const k_bloch = alpha * 0.6; // Bloch wavevector
    const isTunneling = energy < V0;
    const beta = isTunneling ? Math.sqrt((V0 - energy) / (HBAR2_OVER_2M / mass)) : 0;
    const kappa = !isTunneling ? Math.sqrt((energy - V0) / (HBAR2_OVER_2M / mass)) : 0;

    // Amplitude scaling
    const ampScale = plotH * 0.12;
    const step = 0.02;

    // Draw filled wavefunction
    ctx.beginPath();
    let firstPoint = true;
    for (let x = startX; x <= startX + totalX; x += step) {
      // Determine which cell and region
      const cellPos = ((x - startX) % d + d) % d;
      const inWell = cellPos < a;

      let psi: number;
      if (inWell) {
        // Oscillatory in well: sin(αx)
        psi = Math.sin(alpha * cellPos) * Math.cos(k_bloch * x - t * 2);
      } else {
        // In barrier
        const barrierPos = cellPos - a;
        if (isTunneling) {
          // Exponential decay (tunneling)
          const decay = Math.exp(-beta * barrierPos) * 0.7 + Math.exp(-beta * (b - barrierPos)) * 0.3;
          psi = decay * Math.sin(alpha * a) * Math.cos(k_bloch * x - t * 2);
        } else {
          // Oscillatory above barrier
          psi = Math.sin(kappa * barrierPos + alpha * a) * Math.cos(k_bloch * x - t * 2) * 0.8;
        }
      }

      // Bloch envelope modulation
      const envelope = 0.7 + 0.3 * Math.cos(k_bloch * x * 0.3);
      psi *= envelope;

      const px = toX(x);
      const py = yE - psi * ampScale;
      if (firstPoint) { ctx.moveTo(px, py); firstPoint = false; }
      else ctx.lineTo(px, py);
    }

    // Fill under curve
    const psiGrad = ctx.createLinearGradient(0, yE - ampScale, 0, yE + ampScale);
    psiGrad.addColorStop(0, "rgba(0, 200, 255, 0.15)");
    psiGrad.addColorStop(0.5, "rgba(0, 200, 255, 0.02)");
    psiGrad.addColorStop(1, "rgba(120, 80, 255, 0.15)");

    // Close path for fill
    const savePath = new Path2D();
    firstPoint = true;
    for (let x = startX; x <= startX + totalX; x += step) {
      const cellPos = ((x - startX) % d + d) % d;
      const inWell = cellPos < a;
      let psi: number;
      if (inWell) {
        psi = Math.sin(alpha * cellPos) * Math.cos(k_bloch * x - t * 2);
      } else {
        const barrierPos = cellPos - a;
        if (isTunneling) {
          const decay = Math.exp(-beta * barrierPos) * 0.7 + Math.exp(-beta * (b - barrierPos)) * 0.3;
          psi = decay * Math.sin(alpha * a) * Math.cos(k_bloch * x - t * 2);
        } else {
          psi = Math.sin(kappa * barrierPos + alpha * a) * Math.cos(k_bloch * x - t * 2) * 0.8;
        }
      }
      const envelope = 0.7 + 0.3 * Math.cos(k_bloch * x * 0.3);
      psi *= envelope;
      const px = toX(x);
      const py = yE - psi * ampScale;
      if (firstPoint) { savePath.moveTo(px, py); firstPoint = false; }
      else savePath.lineTo(px, py);
    }

    // Stroke wavefunction
    ctx.strokeStyle = isTunneling ? "rgba(0, 220, 255, 0.9)" : "rgba(100, 255, 200, 0.9)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke(savePath);

    // ── Tunneling indicators ──
    if (isTunneling && energy > 0) {
      for (let p = 0; p < numCells; p++) {
        const cellStart = startX + p * d;
        const bx1 = toX(cellStart + a);
        const bx2 = toX(cellStart + d);
        const midBx = (bx1 + bx2) / 2;
        // Small tunneling arrow
        ctx.strokeStyle = "rgba(255, 200, 50, 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(bx1 + 3, yE);
        ctx.lineTo(bx2 - 3, yE);
        ctx.stroke();
        ctx.setLineDash([]);
        // Arrow tip
        ctx.fillStyle = "rgba(255, 200, 50, 0.6)";
        ctx.beginPath();
        ctx.moveTo(bx2 - 3, yE);
        ctx.lineTo(bx2 - 9, yE - 3);
        ctx.lineTo(bx2 - 9, yE + 3);
        ctx.fill();
      }
    }

    // ── Dimension arrows (on central cell) ──
    const centralCell = Math.floor(numCells / 2);
    const cellS = startX + centralCell * d;
    const arrowY = yZero + 22;

    // 'a' dimension
    ctx.strokeStyle = "rgba(0, 200, 255, 0.7)";
    ctx.fillStyle = "rgba(0, 200, 255, 0.85)";
    ctx.lineWidth = 1.2;
    const aX1 = toX(cellS), aX2 = toX(cellS + a);
    drawDimArrow(ctx, aX1, aX2, arrowY, `a = ${a} Å`);

    // 'b' dimension
    ctx.strokeStyle = "rgba(255, 100, 100, 0.7)";
    ctx.fillStyle = "rgba(255, 100, 100, 0.85)";
    const bX1 = toX(cellS + a), bX2 = toX(cellS + d);
    drawDimArrow(ctx, bX1, bX2, arrowY, `b = ${b} Å`);

    // 'd' dimension (below)
    ctx.strokeStyle = "rgba(180, 160, 255, 0.5)";
    ctx.fillStyle = "rgba(180, 160, 255, 0.7)";
    drawDimArrow(ctx, aX1, bX2, arrowY + 22, `d = ${(a + b).toFixed(2)} Å`);

    // ── Labels (LaTeX-style) ──
    ctx.textAlign = "right";
    // V₀
    ctx.fillStyle = "rgba(255, 180, 50, 0.9)";
    ctx.font = "italic 13px 'Georgia', 'Times New Roman', serif";
    ctx.fillText(`V₀ = ${V0} eV`, pad.left + plotW, toY(V0) - 8);
    // E
    ctx.fillStyle = "rgba(50, 255, 150, 0.9)";
    ctx.fillText(`E = ${energy.toFixed(2)} eV`, pad.left + plotW, yE - 8);
    // V = 0
    ctx.fillStyle = "rgba(150, 170, 200, 0.6)";
    ctx.font = "italic 12px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText("V = 0", pad.left + 4, yZero - 6);

    // ── Axis labels ──
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 13px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText("x  (Å)", pad.left + plotW / 2, H - 12);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("V(x), ψₖ(x)  (eV)", 0, 0);
    ctx.restore();

    // ── Title ──
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Kronig–Penney Model — 1D Periodic Lattice Potential", pad.left, 22);

    // Subtitle
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "italic 12px 'Georgia', 'Times New Roman', serif";
    ctx.fillText("ψₖ(x) = uₖ(x)·eⁱᵏˣ    (Bloch wavefunction)", pad.left, 40);

    // Status badge
    ctx.textAlign = "right";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    if (isTunneling) {
      ctx.fillStyle = "rgba(255, 200, 50, 0.9)";
      ctx.fillText("⚡ TUNNELING", pad.left + plotW, 22);
      ctx.fillStyle = "rgba(255, 200, 50, 0.6)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(`κ = ${beta.toFixed(3)} Å⁻¹`, pad.left + plotW, 36);
    } else {
      ctx.fillStyle = "rgba(100, 255, 200, 0.9)";
      ctx.fillText("◈ PROPAGATING", pad.left + plotW, 22);
      ctx.fillStyle = "rgba(100, 255, 200, 0.6)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(`E > V₀`, pad.left + plotW, 36);
    }

    // Physics info
    ctx.textAlign = "right";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(150, 170, 200, 0.5)";
    ctx.fillText(`α = ${alpha.toFixed(3)} Å⁻¹  |  k = ${k_bloch.toFixed(3)} Å⁻¹`, pad.left + plotW, H - 18);

  }, [V0, a, b, mass, energy, timeRef]);

  useEffect(() => {
    const animate = () => {
      if (animating) {
        timeRef.current += 0.03;
      }
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, animating, timeRef]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

function drawDimArrow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, label: string) {
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4); ctx.stroke();
  // Arrow heads
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + 5, y - 3); ctx.lineTo(x1 + 5, y + 3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 5, y - 3); ctx.lineTo(x2 - 5, y + 3); ctx.fill();
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, (x1 + x2) / 2, y + 14);
}

// ─── Main Component ────────────────────────────────────────────────────
export default function KronigPenneySimulator() {
  const [V0, setV0] = useState(5);
  const [b, setB] = useState(1);
  const [a, setA] = useState(3);
  const [mass, setMass] = useState(1);
  const [energy, setEnergy] = useState(2.5);
  const [animating, setAnimating] = useState(true);
  const timeRef = useRef(0);

  const result = useMemo(() => solveKronigPenney({ V0, b, a, mass, numPoints: 200 }), [V0, b, a, mass]);

  const chartData = result.kValues.map((k, i) => {
    const point: Record<string, number> = { k: parseFloat(k.toFixed(4)) };
    result.energies.forEach((band, bi) => { point[`band${bi}`] = parseFloat(band[i].toFixed(4)); });
    return point;
  });

  const isTunneling = energy < V0;

  const handleExportPNG = () => {
    const canvas = document.querySelector("#kp-main-canvas canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "kronig-penney-model.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleExportPDF = () => {
    exportChartAsPDF("Kronig–Penney Model — 1D Periodic Lattice Potential", [
      `V₀ = ${V0} eV | a = ${a} Å | b = ${b} Å | m* = ${mass} mₑ | E = ${energy} eV`,
      `d = ${(a + b).toFixed(2)} Å | ${isTunneling ? "Tunneling regime (E < V₀)" : "Propagating regime (E > V₀)"}`,
      ...result.bandGaps.map((g, i) => `Band gap ${i + 1}: ${g.gap.toFixed(3)} eV (${g.lower.toFixed(2)} – ${g.upper.toFixed(2)} eV)`),
    ], "kp-chart");
  };

  return (
    <div className="space-y-4">
      {/* Main Interactive Visualization */}
      <GlassCard className="p-5" id="kp-main-canvas">
        <KronigPenneyCanvas V0={V0} a={a} b={b} mass={mass} energy={energy} animating={animating} timeRef={timeRef} />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
            <Button
              size="sm"
              variant={animating ? "default" : "outline"}
              onClick={() => setAnimating(!animating)}
              className="gap-1.5 text-xs h-7"
            >
              {animating ? <Pause size={11} /> : <Play size={11} />}
              {animating ? "Pause" : "Animate"}
            </Button>
          </div>

          <SliderRow label="V₀ (Barrier Height)" value={V0} min={0.5} max={20} step={0.5} onChange={setV0} unit=" eV" color="text-red-400 bg-red-400/10" />
          <SliderRow label="b (Barrier Width)" value={b} min={0.1} max={5} step={0.1} onChange={setB} unit=" Å" color="text-red-400 bg-red-400/10" />
          <SliderRow label="a (Well Width)" value={a} min={0.5} max={10} step={0.1} onChange={setA} unit=" Å" />
          <SliderRow label="E (Particle Energy)" value={energy} min={0.1} max={V0 * 2} step={0.1} onChange={setEnergy} unit=" eV" color="text-green-400 bg-green-400/10" />
          <SliderRow label="m* (Effective Mass)" value={mass} min={0.1} max={3} step={0.1} onChange={setMass} unit=" mₑ" />

          {/* Status */}
          <div className={`rounded-lg p-3 border ${isTunneling ? "border-yellow-500/20 bg-yellow-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <p className={`text-xs font-semibold ${isTunneling ? "text-yellow-400" : "text-emerald-400"}`}>
              {isTunneling ? "⚡ Tunneling Regime" : "◈ Propagating Regime"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              {isTunneling
                ? `E < V₀ → exponential decay in barriers (κ = ${Math.sqrt((V0 - energy) / (HBAR2_OVER_2M / mass)).toFixed(3)} Å⁻¹)`
                : `E > V₀ → oscillatory in all regions`}
            </p>
          </div>

          <div className="pt-3 border-t border-border/30 space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Lattice Info</h4>
            <p className="text-xs text-muted-foreground font-mono">d = a + b = {(a + b).toFixed(2)} Å</p>
            <p className="text-xs text-muted-foreground font-mono">α = {Math.sqrt(Math.max(energy, 0.01) / (HBAR2_OVER_2M / mass)).toFixed(3)} Å⁻¹</p>
            <p className="text-xs text-muted-foreground font-mono">1st BZ: [−{(Math.PI / (a + b)).toFixed(3)}, {(Math.PI / (a + b)).toFixed(3)}] Å⁻¹</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        {/* E-k Dispersion */}
        <GlassCard className="p-5 lg:col-span-2" id="kp-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">E–k Dispersion Relation</h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  {BAND_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`kpGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="k" type="number" domain={["auto", "auto"]}
                  label={{ value: "k (Å⁻¹)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "E (eV)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `k = ${Number(v).toFixed(4)} Å⁻¹`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {result.energies.map((_, bi) => (
                  <Line key={bi} dataKey={`band${bi}`} stroke={BAND_COLORS[bi % BAND_COLORS.length]}
                    dot={false} strokeWidth={2.5} name={`Band ${bi + 1}`} animationDuration={800} />
                ))}
                <ReferenceLine x={0} stroke="hsl(215, 20%, 35%)" strokeDasharray="5 5" />
                <ReferenceLine y={energy} stroke="rgba(50, 255, 150, 0.5)" strokeDasharray="4 4" label={{ value: `E = ${energy}`, fill: "rgba(50, 255, 150, 0.7)", fontSize: 10, position: "right" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Band Gaps */}
      {result.bandGaps.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Band Gaps</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.bandGaps.slice(0, 6).map((gap, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-muted-foreground">Gap {i + 1}</p>
                <p className="text-lg font-bold font-mono text-destructive">{gap.gap.toFixed(3)} <span className="text-xs">eV</span></p>
                <p className="text-[10px] text-muted-foreground font-mono">{gap.lower.toFixed(2)} – {gap.upper.toFixed(2)} eV</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Derivation */}
      <DerivationBlock title="Kronig–Penney Mathematical Derivation" steps={KP_DERIVATION} />
    </div>
  );
}
