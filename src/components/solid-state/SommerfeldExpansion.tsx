import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DerivationBlock from "./DerivationBlock";
import { Download, Thermometer, Flame, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ─────────────────────────────────────────────────────────
const KB = 8.617e-5; // eV/K
const KB_SI = 1.381e-23; // J/K
const NA = 6.022e23;

type Dimension = "1D" | "2D" | "3D";

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

// ─── Physics Computations ──────────────────────────────────────────────
function fermiDirac(E: number, Ef: number, T: number): number {
  if (T < 1) return E <= Ef ? 1 : 0;
  const x = (E - Ef) / (KB * T);
  if (x > 500) return 0;
  if (x < -500) return 1;
  return 1 / (Math.exp(x) + 1);
}

function dos3D(E: number, Ef: number): number {
  if (E < 0) return 0;
  // Normalized so D(Ef) ≈ 1
  return Math.sqrt(E / Ef);
}

function computeSpecificHeat(Ef: number, T: number): number {
  // Sommerfeld: C_el = γT = (π²/3) · D(E_F) · k_B² · T
  // For free electron gas: γ = π²k_B²/(2E_F) per electron
  // C_el/nk_B = (π²/2)(k_BT/E_F)
  if (Ef <= 0) return 0;
  return (Math.PI * Math.PI / 2) * (KB * T / Ef);
}

function chemicalPotential(Ef: number, T: number): number {
  // μ(T) ≈ E_F [1 - (π²/12)(k_BT/E_F)²]
  if (Ef <= 0 || T < 1) return Ef;
  const ratio = KB * T / Ef;
  return Ef * (1 - (Math.PI * Math.PI / 12) * ratio * ratio);
}

function totalEnergy(Ef: number, T: number): number {
  // U(T) ≈ U_0 + (π²/4)(k_BT)² · D(E_F)
  // Normalized: ΔU/U_0 = (5π²/12)(k_BT/E_F)²
  if (Ef <= 0 || T < 1) return 0;
  const ratio = KB * T / Ef;
  return (5 * Math.PI * Math.PI / 12) * ratio * ratio;
}

// ─── Main Canvas: Fermi-Dirac Broadening ───────────────────────────────
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
    const H = 560;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 70, right: 180, top: 55, bottom: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const Ef = fermiLevel;
    const eMin = 0;
    const eMax = Ef * 2.2;
    const N = 600;

    const toX = (E: number) => pad.left + ((E - eMin) / (eMax - eMin)) * plotW;
    const toY = (v: number, range: number) => pad.top + plotH - (v / range) * plotH;

    // ── Subtle background gradient ──
    const bgGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    bgGrad.addColorStop(0, "rgba(59, 130, 246, 0.015)");
    bgGrad.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    bgGrad.addColorStop(1, "rgba(139, 92, 246, 0.01)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(pad.left, pad.top, plotW, plotH);

    // ── Grid ──
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = pad.left + (plotW * i) / 10;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const y = pad.top + (plotH * i) / 8;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── DOS background (3D: √E) ──
    if (showDOS) {
      ctx.beginPath();
      ctx.moveTo(toX(eMin), pad.top + plotH);
      for (let i = 0; i <= N; i++) {
        const E = eMin + (eMax - eMin) * i / N;
        const d = dos3D(E, Ef);
        ctx.lineTo(toX(E), toY(d, 1.6));
      }
      ctx.lineTo(toX(eMax), pad.top + plotH);
      ctx.closePath();
      const dosGrad = ctx.createLinearGradient(pad.left, pad.top, pad.left, pad.top + plotH);
      dosGrad.addColorStop(0, "rgba(99, 102, 241, 0.12)");
      dosGrad.addColorStop(1, "rgba(99, 102, 241, 0.03)");
      ctx.fillStyle = dosGrad;
      ctx.fill();

      // DOS curve
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const E = eMin + (eMax - eMin) * i / N;
        const d = dos3D(E, Ef);
        if (i === 0) ctx.moveTo(toX(E), toY(d, 1.6)); else ctx.lineTo(toX(E), toY(d, 1.6));
      }
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
      ctx.font = "italic 10px 'Georgia', serif";
      ctx.textAlign = "left";
      ctx.fillText("D(E) ∝ √E", toX(eMax * 0.8), toY(dos3D(eMax * 0.8, Ef), 1.6) - 8);
    }

    // ── Color palette for temperature curves ──
    const tempColors = [
      { main: "rgba(59, 130, 246, 0.95)", fill: "rgba(59, 130, 246, 0.08)", label: "T = 0 K (step)" },
      { main: "rgba(34, 197, 94, 0.9)", fill: "rgba(34, 197, 94, 0.06)", label: "" },
      { main: "rgba(251, 191, 36, 0.9)", fill: "rgba(251, 191, 36, 0.06)", label: "" },
      { main: "rgba(239, 68, 68, 0.9)", fill: "rgba(239, 68, 68, 0.06)", label: "" },
      { main: "rgba(168, 85, 247, 0.9)", fill: "rgba(168, 85, 247, 0.06)", label: "" },
    ];

    // ── Draw occupied states shading for primary temperature ──
    if (showOccupied && temperatures.length > 0) {
      const T = temperatures[0];
      ctx.beginPath();
      ctx.moveTo(toX(eMin), pad.top + plotH);
      for (let i = 0; i <= N; i++) {
        const E = eMin + (eMax - eMin) * i / N;
        const d = dos3D(E, Ef);
        const f = fermiDirac(E, Ef, T);
        ctx.lineTo(toX(E), toY(d * f, 1.6));
      }
      ctx.lineTo(toX(eMax), pad.top + plotH);
      ctx.closePath();
      const occGrad = ctx.createLinearGradient(pad.left, pad.top, pad.left, pad.top + plotH);
      occGrad.addColorStop(0, "rgba(34, 197, 94, 0.25)");
      occGrad.addColorStop(1, "rgba(34, 197, 94, 0.05)");
      ctx.fillStyle = occGrad;
      ctx.fill();
    }

    // ── Fermi-Dirac curves at multiple temperatures ──
    temperatures.forEach((T, idx) => {
      const col = tempColors[Math.min(idx, tempColors.length - 1)];

      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const E = eMin + (eMax - eMin) * i / N;
        const f = fermiDirac(E, Ef, T);
        const y = toY(f, 1.05);
        if (i === 0) ctx.moveTo(toX(E), y); else ctx.lineTo(toX(E), y);
      }
      ctx.strokeStyle = col.main;
      ctx.lineWidth = T === 0 ? 3 : 2.2;
      if (T === 0) {
        ctx.setLineDash([]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ── -df/dE derivative curves (thermal broadening kernel) ──
    if (showDerivative) {
      temperatures.forEach((T, idx) => {
        if (T < 10) return;
        const col = tempColors[Math.min(idx, tempColors.length - 1)];
        const kbt = KB * T;
        const maxDeriv = 1 / (4 * kbt); // peak value at E = Ef

        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const E = eMin + (eMax - eMin) * i / N;
          const x = (E - Ef) / kbt;
          let deriv = 0;
          if (Math.abs(x) < 500) {
            const ex = Math.exp(x);
            deriv = ex / (kbt * (1 + ex) * (1 + ex));
          }
          const normDeriv = deriv / (maxDeriv * 3); // normalize to ~0.33 of plot height
          const y = toY(normDeriv, 1.05);
          if (i === 0) ctx.moveTo(toX(E), y); else ctx.lineTo(toX(E), y);
        }
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shade under derivative
        ctx.beginPath();
        ctx.moveTo(toX(eMin), pad.top + plotH);
        for (let i = 0; i <= N; i++) {
          const E = eMin + (eMax - eMin) * i / N;
          const x = (E - Ef) / kbt;
          let deriv = 0;
          if (Math.abs(x) < 500) {
            const ex = Math.exp(x);
            deriv = ex / (kbt * (1 + ex) * (1 + ex));
          }
          const normDeriv = deriv / (maxDeriv * 3);
          ctx.lineTo(toX(E), toY(normDeriv, 1.05));
        }
        ctx.lineTo(toX(eMax), pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = col.fill;
        ctx.fill();
      });
    }

    // ── Fermi level vertical line ──
    const efX = toX(Ef);
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(efX, pad.top);
    ctx.lineTo(efX, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ef label
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`E_F = ${Ef.toFixed(1)} eV`, efX, pad.top - 8);

    // f = 0.5 marker
    const halfY = toY(0.5, 1.05);
    ctx.beginPath();
    ctx.arc(efX, halfY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Thermal broadening annotation (animated pulse) ──
    if (temperatures.length > 0 && temperatures[0] > 10) {
      const kbt = KB * temperatures[0];
      const broadL = toX(Ef - 2 * kbt);
      const broadR = toX(Ef + 2 * kbt);
      const pulse = 0.3 + 0.15 * Math.sin(animPhase * 3);

      ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`;
      ctx.fillRect(broadL, halfY - 6, broadR - broadL, 12);

      // Bracket
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(broadL, halfY + 15); ctx.lineTo(broadL, halfY + 20);
      ctx.moveTo(broadL, halfY + 20); ctx.lineTo(broadR, halfY + 20);
      ctx.moveTo(broadR, halfY + 15); ctx.lineTo(broadR, halfY + 20);
      ctx.stroke();

      ctx.fillStyle = "rgba(251, 191, 36, 0.8)";
      ctx.font = "italic 9px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.fillText(`~4k_BT ≈ ${(4 * kbt * 1000).toFixed(1)} meV`, (broadL + broadR) / 2, halfY + 32);
    }

    // ── Axes ──
    ctx.strokeStyle = "rgba(150, 175, 210, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();
    // Arrows
    ctx.fillStyle = "rgba(150, 175, 210, 0.6)";
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left - 4, pad.top + 8); ctx.lineTo(pad.left + 4, pad.top + 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad.left + plotW, pad.top + plotH); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH - 4); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH + 4); ctx.fill();

    // Axis labels
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 13px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Energy E (eV)", pad.left + plotW / 2, H - 8);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("f(E) / D(E)", 0, 0);
    ctx.restore();

    // Y-axis ticks (0, 0.5, 1)
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    [0, 0.25, 0.5, 0.75, 1.0].forEach(v => {
      const y = toY(v, 1.05);
      ctx.fillText(v.toFixed(2), pad.left - 8, y + 3);
      ctx.strokeStyle = "rgba(150, 170, 200, 0.12)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left - 3, y); ctx.lineTo(pad.left, y); ctx.stroke();
    });

    // X-axis ticks
    ctx.textAlign = "center";
    const nXticks = 8;
    for (let i = 0; i <= nXticks; i++) {
      const E = eMin + (eMax - eMin) * i / nXticks;
      const x = toX(E);
      ctx.fillText(E.toFixed(1), x, pad.top + plotH + 16);
      ctx.beginPath(); ctx.moveTo(x, pad.top + plotH); ctx.lineTo(x, pad.top + plotH + 4); ctx.stroke();
    }

    // ── Legend ──
    const legX = pad.left + plotW + 16;
    let legY = pad.top + 10;
    ctx.textAlign = "left";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(230, 240, 255, 0.9)";
    ctx.fillText("Legend", legX, legY);
    legY += 18;

    temperatures.forEach((T, idx) => {
      const col = tempColors[Math.min(idx, tempColors.length - 1)];
      ctx.strokeStyle = col.main;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + 18, legY); ctx.stroke();
      ctx.fillStyle = col.main;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(T === 0 ? "T = 0 K" : `T = ${T} K`, legX + 24, legY + 3);
      legY += 16;
    });

    legY += 6;
    if (showDerivative) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + 18, legY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(200, 215, 235, 0.7)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("−df/dE", legX + 24, legY + 3);
      legY += 16;
    }

    if (showDOS) {
      ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + 18, legY); ctx.stroke();
      ctx.fillStyle = "rgba(99, 102, 241, 0.6)";
      ctx.fillText("D(E) ∝ √E", legX + 24, legY + 3);
      legY += 16;
    }

    if (showOccupied) {
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      ctx.fillRect(legX, legY - 5, 18, 10);
      ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("Occupied", legX + 24, legY + 3);
    }

    // ── Title ──
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Sommerfeld Expansion — Fermi-Dirac Thermal Broadening", pad.left, 22);

    ctx.fillStyle = "rgba(170, 190, 220, 0.6)";
    ctx.font = "italic 11px 'Georgia', serif";
    ctx.fillText("f(E) = 1 / [exp((E − E_F) / k_BT) + 1]", pad.left, 40);

  }, [fermiLevel, temperatures, showDOS, showOccupied, showDerivative, animPhase]);

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

// ─── Specific Heat Canvas ──────────────────────────────────────────────
function SpecificHeatCanvas({ fermiLevel, maxTemp }: { fermiLevel: number; maxTemp: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 300;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 65, right: 30, top: 45, bottom: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const Ef = fermiLevel;
    const N = 400;

    // Compute C_el and Debye C_lat
    let maxC = 0;
    const data: { T: number; cel: number; clat: number; ctot: number }[] = [];
    const thetaD = 400; // Debye temperature (K)

    for (let i = 0; i <= N; i++) {
      const T = (maxTemp * i) / N;
      const cel = computeSpecificHeat(Ef, T); // C_el / nk_B
      // Debye lattice: C_lat ≈ 3(T/θ_D)³ for T << θ_D, → 3 for T >> θ_D
      const tRatio = T / thetaD;
      const clat = 3 * (tRatio < 1 ? 12 * Math.PI * Math.PI * Math.PI * Math.PI / 5 * tRatio * tRatio * tRatio / (4 * Math.PI * Math.PI * Math.PI * Math.PI / 5) : 1);
      // Simplified: clat ≈ 3 * min(1, (T/θ_D)³ * 234.4/(5*...) ) — use simpler Debye interpolation
      const debye = 3 * Math.min(1, 7.78 * tRatio * tRatio * tRatio);
      const ctot = cel + debye;
      maxC = Math.max(maxC, ctot, cel);
      data.push({ T, cel, clat: debye, ctot });
    }
    maxC = Math.max(maxC * 1.15, 0.1);

    const toX = (T: number) => pad.left + (T / maxTemp) * plotW;
    const toY = (c: number) => pad.top + plotH - (c / maxC) * plotH;

    // Grid
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const y = pad.top + (plotH * i) / 6;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Lattice specific heat (blue area)
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top + plotH);
    data.forEach(d => ctx.lineTo(toX(d.T), toY(d.clat)));
    ctx.lineTo(toX(maxTemp), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
    ctx.fill();
    ctx.beginPath();
    data.forEach((d, i) => { if (i === 0) ctx.moveTo(toX(d.T), toY(d.clat)); else ctx.lineTo(toX(d.T), toY(d.clat)); });
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Electronic specific heat (red, amplified for visibility)
    const celScale = 50; // amplify to make visible
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top + plotH);
    data.forEach(d => ctx.lineTo(toX(d.T), toY(d.cel * celScale)));
    ctx.lineTo(toX(maxTemp), pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.fill();
    ctx.beginPath();
    data.forEach((d, i) => { if (i === 0) ctx.moveTo(toX(d.T), toY(d.cel * celScale)); else ctx.lineTo(toX(d.T), toY(d.cel * celScale)); });
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dulong-Petit limit
    const dpY = toY(3);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(150, 175, 210, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, dpY); ctx.lineTo(pad.left + plotW, dpY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(150, 175, 210, 0.5)";
    ctx.font = "italic 9px 'Georgia', serif";
    ctx.textAlign = "right";
    ctx.fillText("3Nk_B (Dulong–Petit)", pad.left + plotW, dpY - 5);

    // Axes
    ctx.strokeStyle = "rgba(150, 175, 210, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Temperature T (K)", pad.left + plotW / 2, H - 6);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("C / Nk_B", 0, 0);
    ctx.restore();

    // X ticks
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const T = (maxTemp * i) / 5;
      ctx.fillText(T.toFixed(0), toX(T), pad.top + plotH + 16);
    }

    // Title
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Electronic vs. Lattice Specific Heat", pad.left, 20);
    ctx.fillStyle = "rgba(170, 190, 220, 0.6)";
    ctx.font = "italic 10px 'Georgia', serif";
    ctx.fillText("C_el = γT (×50 magnified)  |  C_lat ~ Debye model", pad.left, 35);

    // Legend
    const lx = pad.left + plotW - 140;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lx, pad.top + 12); ctx.lineTo(lx + 16, pad.top + 12); ctx.stroke();
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("C_el (×50)", lx + 22, pad.top + 15);

    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lx, pad.top + 28); ctx.lineTo(lx + 16, pad.top + 28); ctx.stroke();
    ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
    ctx.fillText("C_lat (Debye)", lx + 22, pad.top + 31);

  }, [fermiLevel, maxTemp]);

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

// ─── Derivation ────────────────────────────────────────────────────────
const SOMMERFELD_DERIVATION = [
  {
    title: "Fermi-Dirac Distribution",
    content: "At temperature T, the probability that a quantum state at energy E is occupied by an electron is given by the Fermi-Dirac distribution. At T = 0 it becomes a sharp step function at E_F.",
    equation: "f(E) = 1 / [exp((E − E_F) / k_BT) + 1]"
  },
  {
    title: "Thermal Broadening Window",
    content: "The derivative −df/dE is a symmetric bell-shaped function centered at E_F with width ~4k_BT. Only electrons within this energy window contribute to thermal properties — this is the key insight of Sommerfeld theory.",
    equation: "−df/dE = (1/4k_BT) · sech²((E − E_F) / 2k_BT)"
  },
  {
    title: "Sommerfeld Expansion",
    content: "For any smooth function φ(E), the integral ∫φ(E)f(E)dE can be expanded in powers of (k_BT/E_F)². This is valid when k_BT ≪ E_F (degenerate electron gas), which holds for metals at all accessible temperatures.",
    equation: "∫₀^∞ φ(E)f(E)dE = ∫₀^μ φ(E)dE + (π²/6)(k_BT)² φ'(μ) + (7π⁴/360)(k_BT)⁴ φ'''(μ) + ..."
  },
  {
    title: "Chemical Potential Shift",
    content: "The chemical potential μ(T) shifts downward from E_F as temperature increases. For a 3D free electron gas with D(E) ∝ √E, particle number conservation gives:",
    equation: "μ(T) = E_F [1 − (π²/12)(k_BT / E_F)²] + O(T⁴)"
  },
  {
    title: "Electronic Energy & Specific Heat",
    content: "Applying the Sommerfeld expansion to total energy U = ∫E·D(E)·f(E)dE gives the celebrated linear-T electronic specific heat. The coefficient γ (Sommerfeld coefficient) is directly related to D(E_F).",
    equation: "C_el = γT  where  γ = (π²/3) k_B² D(E_F) = (π²/2)(Nk_B / T_F)"
  },
  {
    title: "Comparison with Lattice Contribution",
    content: "At low T, lattice specific heat goes as T³ (Debye model) while electronic goes as T. Total: C = γT + βT³. Plotting C/T vs T² gives a straight line with intercept γ and slope β — the standard experimental method.",
    equation: "C/T = γ + βT²  where  β = (12/5)π⁴ Nk_B / Θ_D³"
  },
  {
    title: "Sommerfeld Coefficient & Effective Mass",
    content: "Comparing measured γ with free-electron prediction reveals the many-body enhancement factor γ_meas/γ_free = m*/m_e. Heavy fermion systems can have m* > 100 m_e, leading to enormous γ values.",
    equation: "γ_measured / γ_free = m* / m_e  (effective mass enhancement)"
  },
];

// ─── Main Component ───────────────────────────────────────────────────
export default function SommerfeldExpansion() {
  const [fermiLevel, setFermiLevel] = useState(5.0);
  const [temperatures, setTemperatures] = useState([0, 300, 1000, 3000]);
  const [tempSlider, setTempSlider] = useState(300);
  const [showDOS, setShowDOS] = useState(true);
  const [showOccupied, setShowOccupied] = useState(true);
  const [showDerivative, setShowDerivative] = useState(true);
  const [maxTempHeat, setMaxTempHeat] = useState(1000);
  const [animPhase, setAnimPhase] = useState(0);

  // Smooth animation for pulsing elements
  useEffect(() => {
    let raf: number;
    let t = 0;
    const animate = () => {
      t += 0.016;
      setAnimPhase(t);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Update temperature array when slider changes
  useEffect(() => {
    const newTemps = [0];
    if (tempSlider > 0) newTemps.push(tempSlider);
    if (tempSlider > 500) newTemps.push(Math.round(tempSlider * 2.5));
    if (tempSlider > 1000) newTemps.push(Math.round(tempSlider * 5));
    setTemperatures(newTemps);
  }, [tempSlider]);

  const mu = chemicalPotential(fermiLevel, tempSlider);
  const cel = computeSpecificHeat(fermiLevel, tempSlider);
  const deltaU = totalEnergy(fermiLevel, tempSlider);
  const gamma = fermiLevel > 0 ? (Math.PI * Math.PI / 2) * KB / fermiLevel : 0;
  const tF = fermiLevel / KB;

  const handleExportPNG = () => {
    const canvas = document.querySelector("#sommerfeld-canvas canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "sommerfeld-expansion.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Main Fermi-Dirac Broadening Canvas */}
      <GlassCard className="p-5" id="sommerfeld-canvas">
        <SommerfeldCanvas
          fermiLevel={fermiLevel}
          temperatures={temperatures}
          showDOS={showDOS}
          showOccupied={showOccupied}
          showDerivative={showDerivative}
          animPhase={animPhase}
        />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            Parameters
          </h3>

          <SliderRow label="E_F (Fermi Energy)" value={fermiLevel} min={1} max={12} step={0.1} onChange={setFermiLevel} unit=" eV" color="text-red-400 bg-red-400/10" />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Thermometer size={12} className="text-amber-400" />
              <span className="text-xs text-muted-foreground">Temperature</span>
            </div>
            <SliderRow label="T" value={tempSlider} min={0} max={5000} step={10} onChange={setTempSlider} unit=" K" color="text-amber-400 bg-amber-400/10" />
            <p className="text-[9px] text-muted-foreground font-mono">k_BT = {(KB * tempSlider).toFixed(4)} eV | k_BT/E_F = {(KB * tempSlider / fermiLevel).toFixed(4)}</p>
          </div>

          <div className="pt-3 border-t border-border/30 space-y-2">
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              D(E) background
              <Switch checked={showDOS} onCheckedChange={setShowDOS} />
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              Occupied states
              <Switch checked={showOccupied} onCheckedChange={setShowOccupied} />
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              −df/dE derivative
              <Switch checked={showDerivative} onCheckedChange={setShowDerivative} />
            </label>
          </div>

          <div className="pt-3 border-t border-border/30">
            <SliderRow label="C(T) Max Temp" value={maxTempHeat} min={100} max={5000} step={50} onChange={setMaxTempHeat} unit=" K" color="text-blue-400 bg-blue-400/10" />
          </div>

          <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs w-full">
            <Download size={12} /> Export PNG
          </Button>
        </GlassCard>

        {/* Computed Quantities */}
        <GlassCard className="p-5 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Flame size={14} className="text-amber-400" />
            Sommerfeld Thermodynamic Quantities
          </h3>

          {/* Key results grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Chemical Potential", value: mu.toFixed(4), unit: "eV", note: "μ(T)", color: "text-primary" },
              { label: "Shift Δμ", value: ((mu - fermiLevel) * 1000).toFixed(2), unit: "meV", note: "μ − E_F", color: "text-purple-400" },
              { label: "C_el / Nk_B", value: cel.toExponential(3), unit: "", note: "= γT/Nk_B", color: "text-red-400" },
              { label: "Sommerfeld γ", value: (gamma * 1e6).toFixed(3), unit: "μeV/K", note: "per electron", color: "text-amber-400" },
              { label: "Fermi Temp", value: tF.toFixed(0), unit: "K", note: "T_F = E_F/k_B", color: "text-blue-400" },
              { label: "ΔU/U₀", value: (deltaU * 100).toFixed(4), unit: "%", note: "energy increase", color: "text-green-400" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                className="p-3 rounded-lg bg-secondary/30 border border-border/30"
              >
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
                <div className="flex justify-between items-baseline mt-0.5">
                  <p className="text-[8px] text-muted-foreground">{item.note}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{item.unit}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Validity check */}
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
            {KB * tempSlider / fermiLevel >= 0.1 && KB * tempSlider / fermiLevel < 0.3 && " — Fair (higher-order terms needed)"}
            {KB * tempSlider / fermiLevel >= 0.3 && " — Poor (expansion breaks down)"}
          </div>
        </GlassCard>
      </div>

      {/* Specific Heat Canvas */}
      <GlassCard className="p-5">
        <SpecificHeatCanvas fermiLevel={fermiLevel} maxTemp={maxTempHeat} />
      </GlassCard>

      <DerivationBlock title="Sommerfeld Expansion — Complete Derivation" steps={SOMMERFELD_DERIVATION} />
    </div>
  );
}
