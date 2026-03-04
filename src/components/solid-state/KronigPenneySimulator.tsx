import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveKronigPenney } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";
import { Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

const SliderRow = ({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{value.toFixed(2)}{unit}</span>
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

// Canvas-based textbook-style periodic potential diagram
function PotentialBarrierCanvas({ V0, a, b }: { V0: number; a: number; b: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = 320;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Layout
    const pad = { left: 60, right: 40, top: 50, bottom: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const d = a + b;
    const periods = 5;
    const totalX = d * periods;
    const startX = -d * Math.floor(periods / 2);

    const toX = (x: number) => pad.left + ((x - startX) / totalX) * plotW;
    const toY = (v: number) => pad.top + plotH - (v / (V0 * 1.5)) * plotH;

    // Grid lines
    ctx.strokeStyle = "rgba(100, 130, 180, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(150, 170, 200, 0.4)";
    ctx.lineWidth = 1.5;
    // x-axis at V=0
    const yZero = toY(0);
    ctx.beginPath(); ctx.moveTo(pad.left, yZero); ctx.lineTo(W - pad.right, yZero); ctx.stroke();
    // y-axis
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();

    // Draw potential barriers
    for (let p = -Math.floor(periods / 2); p < Math.ceil(periods / 2); p++) {
      const wellStart = p * d;
      const wellEnd = wellStart + a;
      const barrierEnd = wellStart + d;

      // Well region fill (subtle)
      ctx.fillStyle = "rgba(0, 200, 255, 0.06)";
      ctx.fillRect(toX(wellStart), yZero, toX(wellEnd) - toX(wellStart), 1);

      // Barrier fill
      const bx = toX(wellEnd);
      const bw = toX(barrierEnd) - toX(wellEnd);
      const by = toY(V0);
      const bh = yZero - by;

      // Gradient fill for barrier
      const grad = ctx.createLinearGradient(bx, by, bx, yZero);
      grad.addColorStop(0, "rgba(255, 80, 80, 0.35)");
      grad.addColorStop(1, "rgba(255, 80, 80, 0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      // Barrier outline
      ctx.strokeStyle = "rgba(255, 100, 100, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(wellStart), yZero);
      ctx.lineTo(toX(wellEnd), yZero);
      ctx.lineTo(toX(wellEnd), by);
      ctx.lineTo(toX(barrierEnd), by);
      ctx.lineTo(toX(barrierEnd), yZero);
      ctx.stroke();
    }

    // V₀ dashed reference line
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255, 180, 50, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(V0));
    ctx.lineTo(W - pad.right, toY(V0));
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";

    // V₀ label
    ctx.fillStyle = "rgba(255, 180, 50, 0.9)";
    ctx.fillText(`V₀ = ${V0} eV`, W - pad.right - 5, toY(V0) - 8);

    // V = 0 label
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("V = 0", pad.left - 8, yZero + 4);

    // Axis labels
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillText("x (Å)", W / 2, H - 10);
    ctx.save();
    ctx.translate(16, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("V(x) (eV)", 0, 0);
    ctx.restore();

    // Dimension arrows for 'a' and 'b' on a single period
    const refP = 0; // reference period index
    const ws = refP * d;
    const we = ws + a;
    const be = ws + d;
    const arrowY = yZero + 25;

    ctx.strokeStyle = "rgba(0, 200, 255, 0.8)";
    ctx.fillStyle = "rgba(0, 200, 255, 0.9)";
    ctx.lineWidth = 1.5;
    // 'a' arrow
    const ax1 = toX(ws), ax2 = toX(we);
    ctx.beginPath(); ctx.moveTo(ax1, arrowY); ctx.lineTo(ax2, arrowY); ctx.stroke();
    // arrow heads
    ctx.beginPath(); ctx.moveTo(ax1, arrowY - 4); ctx.lineTo(ax1, arrowY + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax2, arrowY - 4); ctx.lineTo(ax2, arrowY + 4); ctx.stroke();
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`a = ${a} Å`, (ax1 + ax2) / 2, arrowY + 16);

    // 'b' arrow
    ctx.strokeStyle = "rgba(255, 100, 100, 0.8)";
    ctx.fillStyle = "rgba(255, 100, 100, 0.9)";
    const bx1 = toX(we), bx2 = toX(be);
    ctx.beginPath(); ctx.moveTo(bx1, arrowY); ctx.lineTo(bx2, arrowY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx1, arrowY - 4); ctx.lineTo(bx1, arrowY + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx2, arrowY - 4); ctx.lineTo(bx2, arrowY + 4); ctx.stroke();
    ctx.fillText(`b = ${b} Å`, (bx1 + bx2) / 2, arrowY + 16);

    // Title
    ctx.fillStyle = "rgba(220, 230, 255, 0.9)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Kronig–Penney Periodic Potential", pad.left, 25);

    // d = a + b label
    ctx.fillStyle = "rgba(150, 170, 200, 0.6)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`d = a + b = ${(a + b).toFixed(2)} Å`, W - pad.right, 25);

  }, [V0, a, b]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

// Transcendental equation plot: f(αa) = P·sin(αa)/(αa) + cos(αa) vs αa
function TranscendentalPlotCanvas({ V0, a, b, mass }: { V0: number; a: number; b: number; mass: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = 400;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 55, right: 30, top: 45, bottom: 55 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    // P = m·V₀·b·a / (2ℏ²)
    const HBAR2_OVER_2M = 3.81;
    const P = (mass * V0 * b * a) / (2 * HBAR2_OVER_2M);

    const alphaAMax = 3 * Math.PI;
    const alphaAMin = -3 * Math.PI;
    const yMin = -3;
    const yMax = 3;

    const toX = (aa: number) => pad.left + ((aa - alphaAMin) / (alphaAMax - alphaAMin)) * plotW;
    const toY = (f: number) => pad.top + plotH - ((f - yMin) / (yMax - yMin)) * plotH;

    // Compute f(αa) values
    const N = 2000;
    const points: { aa: number; f: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const aa = alphaAMin + (alphaAMax - alphaAMin) * i / N;
      let f: number;
      if (Math.abs(aa) < 0.001) {
        f = P + 1;
      } else {
        f = P * Math.sin(aa) / aa + Math.cos(aa);
      }
      points.push({ aa, f });
    }

    // Fill allowed bands (|f| <= 1)
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      if (Math.abs(p1.f) <= 1 && Math.abs(p2.f) <= 1) {
        const x1 = toX(p1.aa), x2 = toX(p2.aa);
        const grad = ctx.createLinearGradient(x1, toY(1), x1, toY(-1));
        grad.addColorStop(0, "rgba(0, 200, 255, 0.12)");
        grad.addColorStop(0.5, "rgba(0, 200, 255, 0.06)");
        grad.addColorStop(1, "rgba(0, 200, 255, 0.12)");
        ctx.fillStyle = grad;
        ctx.fillRect(x1, toY(1), x2 - x1, toY(-1) - toY(1));
      }
    }

    // Grid at nπ
    ctx.strokeStyle = "rgba(100, 130, 180, 0.1)";
    ctx.lineWidth = 0.5;
    for (let n = -3; n <= 3; n++) {
      const x = toX(n * Math.PI);
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }
    for (let v = yMin; v <= yMax; v++) {
      const y = toY(v);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }

    // +1 and -1 dashed lines
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "rgba(255, 200, 50, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, toY(1)); ctx.lineTo(pad.left + plotW, toY(1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, toY(-1)); ctx.lineTo(pad.left + plotW, toY(-1)); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(255, 200, 50, 0.9)";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("+1", pad.left - 6, toY(1) + 4);
    ctx.fillText("−1", pad.left - 6, toY(-1) + 4);

    // Axes
    ctx.strokeStyle = "rgba(150, 170, 200, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, toY(0)); ctx.lineTo(pad.left + plotW, toY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX(0), pad.top); ctx.lineTo(toX(0), pad.top + plotH); ctx.stroke();

    // Draw f(αa) curve — color changes based on allowed/forbidden
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      if ((p1.f > yMax + 0.5 && p2.f > yMax + 0.5) || (p1.f < yMin - 0.5 && p2.f < yMin - 0.5)) continue;
      const inBand = Math.abs(p1.f) <= 1 && Math.abs(p2.f) <= 1;
      ctx.strokeStyle = inBand ? "rgba(0, 220, 255, 0.95)" : "rgba(180, 130, 255, 0.7)";
      ctx.beginPath();
      ctx.moveTo(toX(p1.aa), toY(Math.max(yMin, Math.min(yMax, p1.f))));
      ctx.lineTo(toX(p2.aa), toY(Math.max(yMin, Math.min(yMax, p2.f))));
      ctx.stroke();
    }

    // x-axis labels at nπ
    ctx.fillStyle = "rgba(150, 170, 200, 0.8)";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    const piLabels: Record<string, string> = { "-3": "−3π", "-2": "−2π", "-1": "−π", "0": "0", "1": "π", "2": "2π", "3": "3π" };
    for (let n = -3; n <= 3; n++) {
      ctx.fillText(piLabels[n.toString()] || `${n}π`, toX(n * Math.PI), pad.top + plotH + 18);
    }

    // Axis labels
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("→ αa", W / 2, H - 8);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("f(αa)", 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = "rgba(220, 230, 255, 0.9)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("P·sin(αa)/(αa) + cos(αa)  vs  αa", pad.left, 25);

    ctx.fillStyle = "rgba(0, 200, 255, 0.8)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`P = ${P.toFixed(2)}`, W - pad.right, 25);

    // Legend
    ctx.font = "11px 'Inter', sans-serif";
    const legY = pad.top + 12;
    ctx.fillStyle = "rgba(0, 220, 255, 0.3)";
    ctx.fillRect(W - pad.right - 160, legY - 8, 12, 12);
    ctx.fillStyle = "rgba(0, 220, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText("Allowed bands", W - pad.right - 144, legY + 2);
    ctx.fillStyle = "rgba(180, 130, 255, 0.4)";
    ctx.fillRect(W - pad.right - 160, legY + 10, 12, 12);
    ctx.fillStyle = "rgba(180, 130, 255, 0.9)";
    ctx.fillText("Forbidden gaps", W - pad.right - 144, legY + 20);

  }, [V0, a, b, mass]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

export default function KronigPenneySimulator() {
  const [V0, setV0] = useState(5);
  const [b, setB] = useState(1);
  const [a, setA] = useState(3);
  const [mass, setMass] = useState(1);

  const result = useMemo(() => solveKronigPenney({ V0, b, a, mass, numPoints: 200 }), [V0, b, a, mass]);

  const chartData = result.kValues.map((k, i) => {
    const point: Record<string, number> = { k: parseFloat(k.toFixed(4)) };
    result.energies.forEach((band, bi) => { point[`band${bi}`] = parseFloat(band[i].toFixed(4)); });
    return point;
  });

  const handleExportPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f1a"; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#fff"; ctx.font = "bold 22px Inter";
    ctx.fillText("Kronig–Penney E(k) Dispersion", 40, 40);
    ctx.font = "14px JetBrains Mono";
    ctx.fillStyle = "#a0afc8";
    ctx.fillText(`V₀ = ${V0} eV  |  a = ${a} Å  |  b = ${b} Å  |  m* = ${mass} mₑ  |  d = ${(a+b).toFixed(2)} Å`, 40, 70);
    result.bandGaps.forEach((g, i) => {
      ctx.fillStyle = "#f87171";
      ctx.fillText(`Band gap ${i + 1}: ${g.gap.toFixed(3)} eV  (${g.lower.toFixed(2)} – ${g.upper.toFixed(2)} eV)`, 40, 100 + i * 25);
    });
    const link = document.createElement("a");
    link.download = "kronig-penney.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleExportPDF = () => {
    exportChartAsPDF("Kronig–Penney Model — E(k) Dispersion", [
      `V₀ = ${V0} eV | a = ${a} Å | b = ${b} Å | m* = ${mass} mₑ | d = ${(a+b).toFixed(2)} Å`,
      ...result.bandGaps.map((g, i) => `Band gap ${i+1}: ${g.gap.toFixed(3)} eV (${g.lower.toFixed(2)} – ${g.upper.toFixed(2)} eV)`),
    ], "kp-chart");
  };

  return (
    <div className="space-y-4">
      {/* Transcendental Equation Plot */}
      <GlassCard className="p-5" id="kp-transcendental">
        <TranscendentalPlotCanvas V0={V0} a={a} b={b} mass={mass} />
      </GlassCard>

      {/* Potential Barrier Diagram */}
      <GlassCard className="p-5" id="kp-potential-chart">
        <PotentialBarrierCanvas V0={V0} a={a} b={b} />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
          <SliderRow label="V₀ (Barrier Height)" value={V0} min={0.5} max={20} step={0.5} onChange={setV0} unit=" eV" />
          <SliderRow label="b (Barrier Width)" value={b} min={0.1} max={5} step={0.1} onChange={setB} unit=" Å" />
          <SliderRow label="a (Well Width)" value={a} min={0.5} max={10} step={0.1} onChange={setA} unit=" Å" />
          <SliderRow label="m* (Effective Mass)" value={mass} min={0.1} max={3} step={0.1} onChange={setMass} unit=" mₑ" />

          <div className="pt-3 border-t border-border/30 space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Lattice Constant</h4>
            <p className="text-xs text-muted-foreground font-mono">d = a + b = {(a + b).toFixed(2)} Å</p>
            <p className="text-xs text-muted-foreground font-mono">1st BZ: k ∈ [−π/d, π/d]</p>
            <p className="text-xs text-muted-foreground font-mono">= [−{(Math.PI/(a+b)).toFixed(3)}, {(Math.PI/(a+b)).toFixed(3)}] Å⁻¹</p>
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