import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { solveKronigPenney } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import { MATERIALS_DB, type MaterialData } from "@/lib/materialsDatabase";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";
import { Download, FileText, Play, Pause, Calculator, Database, Beaker } from "lucide-react";
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

// ─── f(E) vs E Plot ─────────────────────────────────────────────────────
function FofEPlot({ V0, a, b, mass, energy }: { V0: number; a: number; b: number; mass: number; energy: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 340;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 35, right: 40, bottom: 50, left: 65 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;
    const Emax = V0 * 2.5;
    const numPts = 600;
    const fRange = 4; // show f from -fRange to +fRange

    const toX = (E: number) => pad.left + (E / Emax) * pw;
    const toY = (f: number) => pad.top + ph / 2 - (f / fRange) * (ph / 2);

    // Background
    ctx.fillStyle = "rgba(10,15,30,0.3)";
    ctx.fillRect(pad.left, pad.top, pw, ph);

    // Allowed band region (-1 to 1)
    const y1 = toY(1), y2 = toY(-1);
    const bandGrad = ctx.createLinearGradient(0, y1, 0, y2);
    bandGrad.addColorStop(0, "rgba(34,197,94,0.12)");
    bandGrad.addColorStop(0.5, "rgba(34,197,94,0.06)");
    bandGrad.addColorStop(1, "rgba(34,197,94,0.12)");
    ctx.fillStyle = bandGrad;
    ctx.fillRect(pad.left, y1, pw, y2 - y1);

    // +1 and -1 lines
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(34,197,94,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, y1); ctx.lineTo(pad.left + pw, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, y2); ctx.lineTo(pad.left + pw, y2); ctx.stroke();
    ctx.setLineDash([]);

    // Labels for ±1
    ctx.fillStyle = "rgba(34,197,94,0.8)";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("+1", pad.left - 8, y1 + 4);
    ctx.fillText("−1", pad.left - 8, y2 + 4);
    ctx.fillText("ALLOWED", pad.left + 50, (y1 + y2) / 2 + 3);

    // Zero line
    ctx.strokeStyle = "rgba(150,175,210,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, toY(0)); ctx.lineTo(pad.left + pw, toY(0)); ctx.stroke();

    // Compute f(E) curve
    const points: { E: number; f: number }[] = [];
    for (let i = 0; i < numPts; i++) {
      const E = (i / numPts) * Emax + 0.01;
      const alpha = Math.sqrt(E / (HBAR2_OVER_2M / mass));
      let f: number;
      if (E < V0) {
        const beta = Math.sqrt((V0 - E) / (HBAR2_OVER_2M / mass));
        f = Math.cos(alpha * a) * Math.cosh(beta * b) - ((alpha ** 2 - beta ** 2) / (2 * alpha * beta)) * Math.sin(alpha * a) * Math.sinh(beta * b);
      } else {
        const kappa = Math.sqrt((E - V0) / (HBAR2_OVER_2M / mass));
        if (kappa < 0.001) { f = Math.cos(alpha * a); }
        else { f = Math.cos(alpha * a) * Math.cos(kappa * b) - ((alpha ** 2 + kappa ** 2) / (2 * alpha * kappa)) * Math.sin(alpha * a) * Math.sin(kappa * b); }
      }
      points.push({ E, f: Math.max(-fRange, Math.min(fRange, f)) });
    }

    // Color the curve by allowed/forbidden
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i];
      const inBand = Math.abs(p0.f) <= 1 && Math.abs(p1.f) <= 1;
      ctx.strokeStyle = inBand ? "rgba(34,197,94,0.9)" : "rgba(239,68,68,0.7)";
      ctx.lineWidth = inBand ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(toX(p0.E), toY(p0.f));
      ctx.lineTo(toX(p1.E), toY(p1.f));
      ctx.stroke();
    }

    // Shade allowed E ranges at bottom
    let inBand = false;
    let bandStart = 0;
    let bandNum = 1;
    for (let i = 0; i < points.length; i++) {
      const isAllowed = Math.abs(points[i].f) <= 1;
      if (isAllowed && !inBand) { bandStart = points[i].E; inBand = true; }
      if (!isAllowed && inBand) {
        // Draw band marker
        const x1 = toX(bandStart), x2 = toX(points[i - 1].E);
        ctx.fillStyle = "rgba(34,197,94,0.15)";
        ctx.fillRect(x1, pad.top, x2 - x1, ph);
        // Band label at top
        ctx.fillStyle = "rgba(34,197,94,0.7)";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Band ${bandNum}`, (x1 + x2) / 2, pad.top + 12);
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = "rgba(34,197,94,0.5)";
        ctx.fillText(`${bandStart.toFixed(1)}–${points[i - 1].E.toFixed(1)} eV`, (x1 + x2) / 2, pad.top + 22);
        bandNum++;
        inBand = false;
      }
    }
    if (inBand) {
      const x1 = toX(bandStart), x2 = toX(points[points.length - 1].E);
      ctx.fillStyle = "rgba(34,197,94,0.15)";
      ctx.fillRect(x1, pad.top, x2 - x1, ph);
      ctx.fillStyle = "rgba(34,197,94,0.7)";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Band ${bandNum}`, (x1 + x2) / 2, pad.top + 12);
    }

    // V0 line
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = "rgba(255,180,50,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(toX(V0), pad.top); ctx.lineTo(toX(V0), pad.top + ph); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,180,50,0.7)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`V₀=${V0}`, toX(V0), pad.top + ph + 12);

    // Current energy marker
    const eX = toX(energy);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(50,255,150,0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(eX, pad.top); ctx.lineTo(eX, pad.top + ph); ctx.stroke();
    ctx.setLineDash([]);
    // Dot on curve
    const nearIdx = Math.round((energy / Emax) * numPts);
    if (nearIdx >= 0 && nearIdx < points.length) {
      const py = toY(points[nearIdx].f);
      ctx.beginPath(); ctx.arc(eX, py, 5, 0, Math.PI * 2); ctx.fillStyle = "rgba(50,255,150,0.9)"; ctx.fill();
      ctx.beginPath(); ctx.arc(eX, py, 8, 0, Math.PI * 2); ctx.strokeStyle = "rgba(50,255,150,0.3)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(50,255,150,0.9)";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`E=${energy.toFixed(1)}, f=${points[nearIdx].f.toFixed(3)}`, eX + 12, py - 4);
    }

    // Axes
    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();

    // X axis ticks
    ctx.fillStyle = "rgba(170,190,220,0.7)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    for (let e = 0; e <= Emax; e += Math.ceil(Emax / 8)) {
      ctx.fillText(e.toFixed(0), toX(e), pad.top + ph + 14);
    }

    // Labels
    ctx.fillStyle = "rgba(170,190,220,0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("E (eV)", pad.left + pw / 2, H - 6);
    ctx.save();
    ctx.translate(14, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("f(E) = cos(kd)", 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = "rgba(230,240,255,0.9)";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("f(E) vs Energy — Allowed Band Map", pad.left, 20);
  }, [V0, a, b, mass, energy]);

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

  // Equation calculator state
  const [sinVal, setSinVal] = useState("");
  const [cosVal, setCosVal] = useState("");
  const [eqAlpha, setEqAlpha] = useState("");
  const [eqBeta, setEqBeta] = useState("");

  const equationResult = useMemo(() => {
    const alpha = eqAlpha ? parseFloat(eqAlpha) : Math.sqrt(Math.max(energy, 0.01) / (HBAR2_OVER_2M / mass));
    const beta = energy < V0 ? Math.sqrt((V0 - energy) / (HBAR2_OVER_2M / mass)) : Math.sqrt((energy - V0) / (HBAR2_OVER_2M / mass));
    const d = a + b;
    const sinA = sinVal ? parseFloat(sinVal) : Math.sin(alpha * a);
    const cosA = cosVal ? parseFloat(cosVal) : Math.cos(alpha * a);

    let f: number;
    if (energy < V0) {
      const sinhBb = Math.sinh(beta * b);
      const coshBb = Math.cosh(beta * b);
      f = cosA * coshBb - ((alpha * alpha - beta * beta) / (2 * alpha * beta)) * sinA * sinhBb;
    } else {
      const sinBb = Math.sin(beta * b);
      const cosBb = Math.cos(beta * b);
      f = cosA * cosBb - ((alpha * alpha + beta * beta) / (2 * alpha * beta)) * sinA * sinBb;
    }

    const allowed = Math.abs(f) <= 1;
    const kd = allowed ? Math.acos(Math.max(-1, Math.min(1, f))) : NaN;

    return { alpha, beta, f, allowed, kd, d, sinA: sinVal ? parseFloat(sinVal) : sinA, cosA: cosVal ? parseFloat(cosVal) : cosA };
  }, [sinVal, cosVal, eqAlpha, eqBeta, energy, V0, a, b, mass]);

  return (
    <div className="space-y-4">
      {/* Main Interactive Visualization */}
      <GlassCard className="p-5" id="kp-main-canvas">
        <KronigPenneyCanvas V0={V0} a={a} b={b} mass={mass} energy={energy} animating={animating} timeRef={timeRef} />
      </GlassCard>

      {/* Equation Calculator */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Calculator size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Kronig–Penney Transcendental Equation</h3>
            <p className="text-[10px] text-muted-foreground">Modify parameters and run to update the visualization</p>
          </div>
        </div>

        {/* Full Equation Display */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
            {energy < V0 ? "Below-Barrier (E < V₀) — Tunneling Regime" : "Above-Barrier (E > V₀) — Propagating Regime"}
          </p>
          <div className="text-center py-3">
            <p className="text-base font-mono text-foreground leading-loose tracking-wide">
              {energy < V0
                ? "cos(kd) = cos(αa) · cosh(βb) − [(α² − β²) / (2αβ)] · sin(αa) · sinh(βb)"
                : "cos(kd) = cos(αa) · cos(κb) − [(α² + κ²) / (2ακ)] · sin(αa) · sin(κb)"}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-[11px] font-mono text-muted-foreground border-t border-border/30 pt-3 mt-2">
            <span>α = √(2mE / ℏ²)</span>
            <span>{energy < V0 ? "β = √(2m(V₀−E) / ℏ²)" : "κ = √(2m(E−V₀) / ℏ²)"}</span>
            <span>d = a + b</span>
            <span>Allowed bands: |f(E)| ≤ 1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Input Values */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-foreground">Input Parameters</p>
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">sin(αa)</label>
                  <Input
                    type="number" step="0.001" placeholder={Math.sin(equationResult.alpha * a).toFixed(4)}
                    value={sinVal} onChange={e => setSinVal(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">cos(αa)</label>
                  <Input
                    type="number" step="0.001" placeholder={Math.cos(equationResult.alpha * a).toFixed(4)}
                    value={cosVal} onChange={e => setCosVal(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">α (Å⁻¹)</label>
                  <Input
                    type="number" step="0.01" placeholder={equationResult.alpha.toFixed(4)}
                    value={eqAlpha} onChange={e => setEqAlpha(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">{energy < V0 ? "β" : "κ"} (Å⁻¹)</label>
                  <Input
                    type="number" step="0.01" placeholder={equationResult.beta.toFixed(4)}
                    value={eqBeta} onChange={e => setEqBeta(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-8"
                  onClick={() => {
                    // Apply custom values to the main visualization
                    if (eqAlpha) {
                      const customAlpha = parseFloat(eqAlpha);
                      const newE = customAlpha * customAlpha * (HBAR2_OVER_2M / mass);
                      if (newE > 0 && newE < V0 * 3) setEnergy(parseFloat(newE.toFixed(2)));
                    }
                  }}
                >
                  <Play size={11} /> Run Visualization
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => { setSinVal(""); setCosVal(""); setEqAlpha(""); setEqBeta(""); }}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Computed Results */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-foreground">Evaluation Result</p>
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5">
                  <p className="text-[9px] text-muted-foreground">f(E) = cos(kd)</p>
                  <p className="text-lg font-bold font-mono text-primary">{equationResult.f.toFixed(6)}</p>
                </div>
                <div className={`rounded-md p-2.5 border ${equationResult.allowed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <p className="text-[9px] text-muted-foreground">|f(E)| ≤ 1 ?</p>
                  <p className={`text-lg font-bold ${equationResult.allowed ? "text-emerald-400" : "text-destructive"}`}>
                    {equationResult.allowed ? "✓ Allowed" : "✗ Forbidden"}
                  </p>
                </div>
              </div>

              {equationResult.allowed && (
                <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2.5">
                  <p className="text-[9px] text-muted-foreground">Bloch wavevector k</p>
                  <p className="text-sm font-bold font-mono text-amber-400">
                    k = {(equationResult.kd / equationResult.d).toFixed(4)} Å⁻¹
                    <span className="text-[10px] text-muted-foreground ml-2">(kd = {equationResult.kd.toFixed(4)})</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-computed Reference */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-foreground">Current System Values</p>
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-2">
              <div className="space-y-1.5 text-[11px] font-mono text-muted-foreground">
                <div className="flex justify-between"><span>α</span><span className="text-foreground">{equationResult.alpha.toFixed(4)} Å⁻¹</span></div>
                <div className="flex justify-between"><span>{energy < V0 ? "β" : "κ"}</span><span className="text-foreground">{equationResult.beta.toFixed(4)} Å⁻¹</span></div>
                <div className="flex justify-between"><span>sin(αa)</span><span className="text-foreground">{Math.sin(equationResult.alpha * a).toFixed(4)}</span></div>
                <div className="flex justify-between"><span>cos(αa)</span><span className="text-foreground">{Math.cos(equationResult.alpha * a).toFixed(4)}</span></div>
                <div className="flex justify-between"><span>d = a + b</span><span className="text-foreground">{equationResult.d.toFixed(2)} Å</span></div>
                <div className="flex justify-between"><span>E</span><span className="text-foreground">{energy.toFixed(2)} eV</span></div>
                <div className="flex justify-between"><span>V₀</span><span className="text-foreground">{V0.toFixed(2)} eV</span></div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Step-by-Step Worked Examples */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Calculator size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Worked Example: Finding Allowed Bands</h3>
            <p className="text-[10px] text-muted-foreground">Step-by-step solution at specific k-points using current parameters</p>
          </div>
        </div>

        {(() => {
          const d = a + b;
          const alpha = Math.sqrt(Math.max(energy, 0.01) / (HBAR2_OVER_2M / mass));
          const beta_val = energy < V0 ? Math.sqrt((V0 - energy) / (HBAR2_OVER_2M / mass)) : Math.sqrt((energy - V0) / (HBAR2_OVER_2M / mass));
          const sinAa = Math.sin(alpha * a);
          const cosAa = Math.cos(alpha * a);
          let fE: number;
          if (energy < V0) {
            fE = cosAa * Math.cosh(beta_val * b) - ((alpha ** 2 - beta_val ** 2) / (2 * alpha * beta_val)) * sinAa * Math.sinh(beta_val * b);
          } else {
            fE = cosAa * Math.cos(beta_val * b) - ((alpha ** 2 + beta_val ** 2) / (2 * alpha * beta_val)) * sinAa * Math.sin(beta_val * b);
          }
          const allowed = Math.abs(fE) <= 1;
          const kVal = allowed ? Math.acos(Math.max(-1, Math.min(1, fE))) / d : NaN;

          const steps = [
            {
              title: "Step 1 — Compute wave parameters",
              content: `Given E = ${energy.toFixed(2)} eV, V₀ = ${V0.toFixed(2)} eV, m* = ${mass} mₑ, a = ${a} Å, b = ${b} Å`,
              math: `α = √(2m*E / ℏ²) = √(${energy.toFixed(2)} / ${(HBAR2_OVER_2M / mass).toFixed(3)}) = ${alpha.toFixed(4)} Å⁻¹`,
            },
            {
              title: `Step 2 — Compute ${energy < V0 ? "decay" : "propagation"} constant`,
              content: energy < V0 ? `Since E < V₀, we're in the tunneling regime` : `Since E > V₀, we're in the propagating regime`,
              math: energy < V0
                ? `β = √(2m*(V₀−E) / ℏ²) = √(${(V0 - energy).toFixed(2)} / ${(HBAR2_OVER_2M / mass).toFixed(3)}) = ${beta_val.toFixed(4)} Å⁻¹`
                : `κ = √(2m*(E−V₀) / ℏ²) = √(${(energy - V0).toFixed(2)} / ${(HBAR2_OVER_2M / mass).toFixed(3)}) = ${beta_val.toFixed(4)} Å⁻¹`,
            },
            {
              title: "Step 3 — Evaluate trigonometric / hyperbolic terms",
              content: "Plug α and " + (energy < V0 ? "β" : "κ") + " into the equation components",
              math: energy < V0
                ? `sin(αa) = sin(${(alpha * a).toFixed(3)}) = ${sinAa.toFixed(6)}\ncos(αa) = cos(${(alpha * a).toFixed(3)}) = ${cosAa.toFixed(6)}\nsinh(βb) = sinh(${(beta_val * b).toFixed(3)}) = ${Math.sinh(beta_val * b).toFixed(6)}\ncosh(βb) = cosh(${(beta_val * b).toFixed(3)}) = ${Math.cosh(beta_val * b).toFixed(6)}`
                : `sin(αa) = sin(${(alpha * a).toFixed(3)}) = ${sinAa.toFixed(6)}\ncos(αa) = cos(${(alpha * a).toFixed(3)}) = ${cosAa.toFixed(6)}\nsin(κb) = sin(${(beta_val * b).toFixed(3)}) = ${Math.sin(beta_val * b).toFixed(6)}\ncos(κb) = cos(${(beta_val * b).toFixed(3)}) = ${Math.cos(beta_val * b).toFixed(6)}`,
            },
            {
              title: "Step 4 — Compute the prefactor",
              content: "The coupling term between well and barrier wave parameters",
              math: energy < V0
                ? `(α² − β²) / (2αβ) = (${(alpha ** 2).toFixed(4)} − ${(beta_val ** 2).toFixed(4)}) / (2 × ${alpha.toFixed(4)} × ${beta_val.toFixed(4)}) = ${((alpha ** 2 - beta_val ** 2) / (2 * alpha * beta_val)).toFixed(6)}`
                : `(α² + κ²) / (2ακ) = (${(alpha ** 2).toFixed(4)} + ${(beta_val ** 2).toFixed(4)}) / (2 × ${alpha.toFixed(4)} × ${beta_val.toFixed(4)}) = ${((alpha ** 2 + beta_val ** 2) / (2 * alpha * beta_val)).toFixed(6)}`,
            },
            {
              title: "Step 5 — Evaluate f(E) = cos(kd)",
              content: "Combine all terms to get the transcendental equation value",
              math: `f(E) = ${fE.toFixed(6)}    →    |f(E)| = ${Math.abs(fE).toFixed(6)}`,
            },
            {
              title: "Step 6 — Band determination",
              content: allowed
                ? `Since |f(E)| ≤ 1, this energy lies in an ALLOWED band. We can solve for k.`
                : `Since |f(E)| > 1, this energy lies in a FORBIDDEN gap. No propagating Bloch states exist.`,
              math: allowed
                ? `k = arccos(f(E)) / d = arccos(${fE.toFixed(4)}) / ${d.toFixed(2)} = ${kVal!.toFixed(6)} Å⁻¹`
                : `cos(kd) = ${fE.toFixed(4)} → No real k exists (band gap)`,
            },
          ];

          return (
            <div className="space-y-2">
              {steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border/30 bg-background/50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.content}</p>
                      <pre className="text-[11px] font-mono text-primary/90 bg-primary/5 rounded-md p-2 mt-1.5 whitespace-pre-wrap overflow-x-auto">{s.math}</pre>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Final verdict */}
              <div className={`rounded-xl p-4 border-2 mt-3 ${allowed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                <p className={`text-sm font-bold ${allowed ? "text-emerald-400" : "text-destructive"}`}>
                  {allowed ? "✓ E = " + energy.toFixed(2) + " eV is in an ALLOWED band" : "✗ E = " + energy.toFixed(2) + " eV is in a FORBIDDEN gap"}
                </p>
                {allowed && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Bloch wavevector: k = {kVal!.toFixed(6)} Å⁻¹ (within 1st BZ: [−{(Math.PI / d).toFixed(3)}, {(Math.PI / d).toFixed(3)}])
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </GlassCard>

      {/* Interactive f(E) vs E Plot */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">f(E) vs E — Band Structure Map</h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          Allowed bands exist where |f(E)| ≤ 1 (shaded green). Forbidden gaps where |f(E)| &gt; 1 (shaded red). Current energy E = {energy.toFixed(2)} eV marked.
        </p>
        <FofEPlot V0={V0} a={a} b={b} mass={mass} energy={energy} />
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
