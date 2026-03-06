import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DerivationBlock from "./DerivationBlock";
import { Download, FileText, Thermometer } from "lucide-react";
import { motion } from "framer-motion";

// ─── Physics Constants & Types ─────────────────────────────────────────
const KB = 8.617e-5; // Boltzmann constant in eV/K

type Dimension = "1D" | "2D" | "3D";
type MaterialPreset = "metal" | "semiconductor" | "insulator" | "custom";

interface MaterialConfig {
  label: string;
  bandGap: number;
  fermiLevel: number;
  description: string;
}

const MATERIAL_PRESETS: Record<MaterialPreset, MaterialConfig> = {
  metal:         { label: "Metal",         bandGap: 0,   fermiLevel: 5.0,  description: "E_F inside conduction band, zero gap" },
  semiconductor: { label: "Semiconductor", bandGap: 1.1, fermiLevel: 0.55, description: "Si-like, E_g ≈ 1.1 eV" },
  insulator:     { label: "Insulator",     bandGap: 5.5, fermiLevel: 2.75, description: "Diamond-like, E_g ≈ 5.5 eV" },
  custom:        { label: "Custom",        bandGap: 2.0, fermiLevel: 1.0,  description: "User-defined parameters" },
};

const SliderRow = ({ label, value, min, max, step, onChange, unit, color }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; color?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono px-1.5 rounded text-[11px] ${color || "text-primary bg-primary/10"}`}>
        {value < 10 ? value.toFixed(2) : value.toFixed(0)}{unit}
      </span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
);

// ─── Compute DOS ───────────────────────────────────────────────────────
function computeDOS(E: number, dim: Dimension, bandGap: number, showBandGap: boolean): { valence: number; conduction: number } {
  if (showBandGap && bandGap > 0) {
    // Split into valence band (E < 0) and conduction band (E > bandGap)
    const Ev = -E; // mirror for valence
    const Ec = E - bandGap;
    let valence = 0, conduction = 0;

    if (E <= 0) {
      const x = -E;
      if (dim === "1D") valence = x > 0.01 ? 1 / Math.sqrt(x) : 10;
      else if (dim === "2D") valence = x > 0 ? 1.0 : 0;
      else valence = Math.sqrt(x);
    }
    if (E >= bandGap) {
      const x = E - bandGap;
      if (dim === "1D") conduction = x > 0.01 ? 1 / Math.sqrt(x) : 10;
      else if (dim === "2D") conduction = x > 0 ? 1.0 : 0;
      else conduction = Math.sqrt(x);
    }
    return { valence: Math.min(valence, 10), conduction: Math.min(conduction, 10) };
  }

  // No band gap — simple free electron DOS
  if (E < 0) return { valence: 0, conduction: 0 };
  let d = 0;
  if (dim === "1D") d = E > 0.01 ? 1 / Math.sqrt(E) : 10;
  else if (dim === "2D") d = E > 0 ? 1.0 : 0;
  else d = Math.sqrt(E);
  return { valence: 0, conduction: Math.min(d, 10) };
}

function fermiDirac(E: number, Ef: number, T: number): number {
  if (T < 1) return E <= Ef ? 1 : 0;
  const x = (E - Ef) / (KB * T);
  if (x > 500) return 0;
  if (x < -500) return 1;
  return 1 / (Math.exp(x) + 1);
}

// ─── Main Canvas ───────────────────────────────────────────────────────
function DOSCanvas({
  dim, fermiLevel, temperature, bandGap, showBandGap, showOccupation, showFermiDirac
}: {
  dim: Dimension; fermiLevel: number; temperature: number; bandGap: number;
  showBandGap: boolean; showOccupation: boolean; showFermiDirac: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 520;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 75, right: 40, top: 60, bottom: 65 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    // Energy range
    const eMin = showBandGap ? -3 : -0.5;
    const eMax = showBandGap ? bandGap + 5 : 10;
    const N = 800;

    // Compute data
    const data: { E: number; dos: number; occupied: number; fd: number }[] = [];
    let maxDos = 0;
    for (let i = 0; i <= N; i++) {
      const E = eMin + (eMax - eMin) * i / N;
      const { valence, conduction } = computeDOS(E, dim, bandGap, showBandGap);
      const dos = valence + conduction;
      const fd = fermiDirac(E, fermiLevel, temperature);
      const occupied = dos * fd;
      maxDos = Math.max(maxDos, dos);
      data.push({ E, dos, occupied, fd });
    }
    maxDos = Math.max(maxDos, 1) * 1.15;

    const toX = (dos: number) => pad.left + (dos / maxDos) * plotW;
    const toY = (E: number) => pad.top + plotH - ((E - eMin) / (eMax - eMin)) * plotH;

    // ── Grid ──
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = pad.top + (plotH * i) / 10;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const x = pad.left + (plotW * i) / 8;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Band gap shading ──
    if (showBandGap && bandGap > 0) {
      const gapTop = toY(bandGap);
      const gapBot = toY(0);
      if (gapBot > gapTop) {
        ctx.fillStyle = "rgba(139, 92, 246, 0.08)";
        ctx.fillRect(pad.left, gapTop, plotW, gapBot - gapTop);
        // Gap label
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.left, gapTop); ctx.lineTo(pad.left + plotW, gapTop); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad.left, gapBot); ctx.lineTo(pad.left + plotW, gapBot); ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`E_g = ${bandGap.toFixed(2)} eV`, pad.left + plotW / 2, (gapTop + gapBot) / 2 + 4);
        // Bracket
        const bracketX = pad.left + plotW - 20;
        ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bracketX, gapTop + 2); ctx.lineTo(bracketX + 8, gapTop + 2);
        ctx.moveTo(bracketX + 4, gapTop + 2); ctx.lineTo(bracketX + 4, gapBot - 2);
        ctx.moveTo(bracketX, gapBot - 2); ctx.lineTo(bracketX + 8, gapBot - 2);
        ctx.stroke();
        // Band labels
        ctx.font = "italic 10px 'Georgia', serif";
        ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
        ctx.textAlign = "right";
        ctx.fillText("Conduction Band", pad.left + plotW - 30, gapTop - 8);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.fillText("Valence Band", pad.left + plotW - 30, gapBot + 16);
      }
    }

    // ── Occupied states (green shading) ──
    if (showOccupation) {
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(data[0].E));
      for (const d of data) {
        ctx.lineTo(toX(d.occupied), toY(d.E));
      }
      ctx.lineTo(pad.left, toY(data[data.length - 1].E));
      ctx.closePath();
      const occGrad = ctx.createLinearGradient(pad.left, 0, pad.left + plotW * 0.6, 0);
      occGrad.addColorStop(0, "rgba(34, 197, 94, 0.05)");
      occGrad.addColorStop(1, "rgba(34, 197, 94, 0.35)");
      ctx.fillStyle = occGrad;
      ctx.fill();

      // Occupied outline
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const px = toX(data[i].occupied);
        const py = toY(data[i].E);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── DOS curve (blue) ──
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(data[0].E));
    for (const d of data) {
      ctx.lineTo(toX(d.dos), toY(d.E));
    }
    ctx.lineTo(pad.left, toY(data[data.length - 1].E));
    ctx.closePath();
    const dosGrad = ctx.createLinearGradient(pad.left, 0, pad.left + plotW, 0);
    dosGrad.addColorStop(0, "rgba(59, 130, 246, 0.02)");
    dosGrad.addColorStop(1, "rgba(59, 130, 246, 0.12)");
    ctx.fillStyle = dosGrad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const px = toX(data[i].dos);
      const py = toY(data[i].E);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // ── Fermi-Dirac distribution (small inset on left) ──
    if (showFermiDirac) {
      const fdW = 45;
      const fdX = pad.left - fdW - 8;
      // f(E) curve
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const px = fdX + data[i].fd * fdW;
        const py = toY(data[i].E);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Label
      ctx.fillStyle = "rgba(251, 191, 36, 0.6)";
      ctx.font = "italic 8px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.fillText("f(E)", fdX + fdW / 2, pad.top - 5);
      ctx.fillText("0", fdX, pad.top + plotH + 12);
      ctx.fillText("1", fdX + fdW, pad.top + plotH + 12);
    }

    // ── Fermi level line (red) ──
    const fermiY = toY(fermiLevel);
    if (fermiY >= pad.top && fermiY <= pad.top + plotH) {
      ctx.setLineDash([10, 5]);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad.left, fermiY);
      ctx.lineTo(pad.left + plotW, fermiY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow + label
      ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`E_F = ${fermiLevel.toFixed(2)} eV`, pad.left + plotW + 5, fermiY + 4);

      // Triangle marker
      ctx.beginPath();
      ctx.moveTo(pad.left - 8, fermiY);
      ctx.lineTo(pad.left - 2, fermiY - 5);
      ctx.lineTo(pad.left - 2, fermiY + 5);
      ctx.fill();
    }

    // ── Axes ──
    ctx.strokeStyle = "rgba(150, 175, 210, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();
    // Arrow tips
    ctx.fillStyle = "rgba(150, 175, 210, 0.5)";
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left - 4, pad.top + 8); ctx.lineTo(pad.left + 4, pad.top + 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad.left + plotW, pad.top + plotH); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH - 4); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH + 4); ctx.fill();

    // ── Axis labels ──
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 13px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("D(E)  (Density of States)", pad.left + plotW / 2, H - 10);
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("E  (eV)", 0, 0);
    ctx.restore();

    // ── Energy tick labels ──
    ctx.fillStyle = "rgba(150, 170, 200, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    const nTicks = 8;
    for (let i = 0; i <= nTicks; i++) {
      const E = eMin + (eMax - eMin) * i / nTicks;
      const y = toY(E);
      ctx.fillText(E.toFixed(1), pad.left - 10, y + 3);
      ctx.strokeStyle = "rgba(150, 170, 200, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left - 4, y); ctx.lineTo(pad.left, y); ctx.stroke();
    }

    // ── Title ──
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Electronic Density of States — ${dim} Free Electron Model`, pad.left, 22);

    // Subtitle with formula
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "italic 12px 'Georgia', serif";
    const formulas = { "1D": "D(E) ∝ 1/√E", "2D": "D(E) = const", "3D": "D(E) ∝ √E" };
    ctx.fillText(formulas[dim], pad.left, 40);

    // Temperature
    if (temperature > 0) {
      ctx.fillStyle = "rgba(251, 191, 36, 0.6)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`T = ${temperature} K  |  k_BT = ${(KB * temperature).toFixed(4)} eV`, W - pad.right, 22);
    }

    // ── Legend ──
    let legY = pad.top + 8;
    const legX = W - pad.right - 140;
    ctx.textAlign = "left";
    ctx.font = "11px 'Inter', sans-serif";

    // DOS
    ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(legX, legY + 1.5); ctx.lineTo(legX + 16, legY + 1.5); ctx.stroke();
    ctx.fillStyle = "rgba(200, 215, 235, 0.8)";
    ctx.fillText("D(E) — DOS", legX + 22, legY + 5);
    legY += 18;

    if (showOccupation) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(legX, legY + 1.5); ctx.lineTo(legX + 16, legY + 1.5); ctx.stroke();
      ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
      ctx.fillText("Occupied", legX + 22, legY + 5);
      legY += 18;
    }

    // Fermi
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX, legY + 1.5); ctx.lineTo(legX + 16, legY + 1.5); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
    ctx.fillText("Fermi level", legX + 22, legY + 5);

  }, [dim, fermiLevel, temperature, bandGap, showBandGap, showOccupation, showFermiDirac]);

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
const DOS_DERIVATION = [
  {
    title: "1D Density of States",
    content: "For a 1D free electron gas with dispersion E = ℏ²k²/2m, the DOS is obtained by counting states in dk and converting to dE. The divergence at E → 0 is a Van Hove singularity.",
    equation: "D₁D(E) = (L/π) · (2m/ℏ²)^{1/2} · E^{-1/2}"
  },
  {
    title: "2D Density of States",
    content: "In 2D, the constant density of k-states combined with a linear E(k) relationship gives an energy-independent DOS — the hallmark of 2D electron systems (e.g., quantum wells, graphene at low energy).",
    equation: "D₂D(E) = m / (πℏ²) = constant"
  },
  {
    title: "3D Density of States",
    content: "The 3D DOS increases as √E because the volume of k-space shell grows as k², and E ∝ k² gives the square-root dependence. This is the standard result for bulk metals and semiconductors.",
    equation: "D₃D(E) = (1/2π²) · (2m/ℏ²)^{3/2} · E^{1/2}"
  },
  {
    title: "Fermi-Dirac Distribution",
    content: "At finite temperature T, electrons obey Fermi-Dirac statistics. The occupation probability f(E) determines the fraction of states at energy E that are filled. At T = 0 K, it becomes a step function.",
    equation: "f(E) = 1 / [exp((E − E_F) / k_BT) + 1]"
  },
  {
    title: "Occupied States & Carrier Density",
    content: "The density of occupied states is the product D(E)·f(E). Integrating over all energies gives the total electron density n. In semiconductors, the gap separates valence and conduction bands.",
    equation: "n = ∫ D(E) · f(E) dE"
  },
  {
    title: "Semiconductor Band Gap",
    content: "In a semiconductor, the DOS vanishes inside the band gap E_g. The valence band DOS extends below E_v = 0, and the conduction band DOS starts at E_c = E_g. The Fermi level lies within the gap.",
    equation: "D(E) = 0  for  0 < E < E_g  (forbidden gap)"
  },
];

// ─── Main Component ───────────────────────────────────────────────────
export default function DensityOfStates() {
  const [dim, setDim] = useState<Dimension>("3D");
  const [fermiLevel, setFermiLevel] = useState(5.0);
  const [temperature, setTemperature] = useState(300);
  const [bandGap, setBandGap] = useState(1.1);
  const [showBandGap, setShowBandGap] = useState(false);
  const [showOccupation, setShowOccupation] = useState(true);
  const [showFermiDirac, setShowFermiDirac] = useState(true);
  const [preset, setPreset] = useState<MaterialPreset>("metal");

  const applyPreset = (p: MaterialPreset) => {
    setPreset(p);
    const cfg = MATERIAL_PRESETS[p];
    setBandGap(cfg.bandGap);
    setFermiLevel(cfg.fermiLevel);
    setShowBandGap(cfg.bandGap > 0);
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector("#dos-main-canvas canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `dos-${dim}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Main Canvas */}
      <GlassCard className="p-5" id="dos-main-canvas">
        <DOSCanvas
          dim={dim} fermiLevel={fermiLevel} temperature={temperature}
          bandGap={bandGap} showBandGap={showBandGap}
          showOccupation={showOccupation} showFermiDirac={showFermiDirac}
        />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>

          {/* Dimension toggle */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Dimensionality</p>
            <div className="flex gap-1.5">
              {(["1D", "2D", "3D"] as const).map(d => (
                <button key={d} onClick={() => setDim(d)}
                  className={`flex-1 text-xs py-2 rounded-md border transition-all duration-200 ${
                    dim === d ? "bg-primary/15 border-primary/30 text-primary font-semibold" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >{d}</button>
              ))}
            </div>
          </div>

          {/* Fermi Level */}
          <SliderRow label="E_F (Fermi Energy)" value={fermiLevel} min={-2} max={12} step={0.05} onChange={setFermiLevel} unit=" eV" color="text-red-400 bg-red-400/10" />

          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Thermometer size={12} className="text-amber-400" />
              <span className="text-xs text-muted-foreground">Temperature</span>
            </div>
            <SliderRow label="T" value={temperature} min={0} max={3000} step={10} onChange={setTemperature} unit=" K" color="text-amber-400 bg-amber-400/10" />
            <p className="text-[9px] text-muted-foreground font-mono">k_BT = {(KB * temperature).toFixed(4)} eV</p>
          </div>

          {/* Band gap */}
          <div className="pt-3 border-t border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Band Gap</span>
              <Switch checked={showBandGap} onCheckedChange={setShowBandGap} />
            </div>
            {showBandGap && (
              <SliderRow label="E_g" value={bandGap} min={0.1} max={8} step={0.1} onChange={setBandGap} unit=" eV" color="text-purple-400 bg-purple-400/10" />
            )}
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-border/30 space-y-2">
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              Occupied states shading
              <Switch checked={showOccupation} onCheckedChange={setShowOccupation} />
            </label>
            <label className="flex items-center justify-between text-xs text-muted-foreground">
              f(E) distribution
              <Switch checked={showFermiDirac} onCheckedChange={setShowFermiDirac} />
            </label>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
          </div>
        </GlassCard>

        {/* Material Presets + Info */}
        <GlassCard className="p-5 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Material Presets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(MATERIAL_PRESETS) as [MaterialPreset, MaterialConfig][]).map(([key, cfg]) => (
              <motion.button
                key={key}
                onClick={() => applyPreset(key)}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  preset === key
                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                    : "border-border/50 hover:bg-secondary/50"
                }`}
              >
                <p className={`text-xs font-semibold ${preset === key ? "text-primary" : "text-foreground"}`}>{cfg.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{cfg.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[9px] font-mono text-muted-foreground">E_g = {cfg.bandGap}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">E_F = {cfg.fermiLevel}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* DOS formulas quick ref */}
          <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-2">DOS Formulas</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { dim: "1D", formula: "D(E) ∝ E^{−1/2}", note: "Van Hove singularity at E = 0" },
                { dim: "2D", formula: "D(E) = const", note: "Step function onset" },
                { dim: "3D", formula: "D(E) ∝ E^{1/2}", note: "Parabolic band" },
              ].map(f => (
                <div key={f.dim} className={`p-2 rounded-md border ${dim === f.dim ? "border-primary/30 bg-primary/5" : "border-transparent"}`}>
                  <p className="text-[10px] font-bold text-foreground">{f.dim}</p>
                  <p className="text-[10px] font-mono text-primary mt-0.5">{f.formula}</p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">{f.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current state summary */}
          <div className="p-3 rounded-lg bg-secondary/20 border border-border/20">
            <h4 className="text-xs font-semibold text-foreground mb-1">Current Configuration</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <p className="text-[10px] text-muted-foreground">Dimension:</p>
              <p className="text-[10px] font-mono text-primary text-right">{dim}</p>
              <p className="text-[10px] text-muted-foreground">Fermi energy:</p>
              <p className="text-[10px] font-mono text-red-400 text-right">{fermiLevel.toFixed(2)} eV</p>
              <p className="text-[10px] text-muted-foreground">Temperature:</p>
              <p className="text-[10px] font-mono text-amber-400 text-right">{temperature} K</p>
              {showBandGap && (
                <>
                  <p className="text-[10px] text-muted-foreground">Band gap:</p>
                  <p className="text-[10px] font-mono text-purple-400 text-right">{bandGap.toFixed(2)} eV</p>
                </>
              )}
              <p className="text-[10px] text-muted-foreground">k_BT:</p>
              <p className="text-[10px] font-mono text-amber-400 text-right">{(KB * temperature).toFixed(4)} eV</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <DerivationBlock title="Density of States — Mathematical Derivation" steps={DOS_DERIVATION} />
    </div>
  );
}
