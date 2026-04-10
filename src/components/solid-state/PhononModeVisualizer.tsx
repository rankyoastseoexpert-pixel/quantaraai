import { useState, useRef, useEffect, useCallback, memo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  M1: number;
  M2: number;
  kSpring: number;
  latticeA: number;
}

type ModeType = "acoustic" | "optical";

const PhononModeVisualizer = memo(({ M1, M2, kSpring, latticeA }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [mode, setMode] = useState<ModeType>("acoustic");
  const [qIndex, setQIndex] = useState(3); // mode number 1-8
  const [amplitude, setAmplitude] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);

  const nCells = 10;
  const nAtoms = nCells * 2;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = 320;
    const dpr = Math.max(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const t = timeRef.current;
    const q = (qIndex * Math.PI) / (nCells * latticeA);

    // Compute frequencies
    const sinTerm = Math.sin(q * latticeA / 2);
    const sin2 = sinTerm * sinTerm;
    const sumInv = 1 / M1 + 1 / M2;
    const disc = Math.max(sumInv * sumInv - 4 * sin2 / (M1 * M2), 0);
    const omegaAc = Math.sqrt(Math.max(kSpring * (sumInv - Math.sqrt(disc)), 0));
    const omegaOp = Math.sqrt(Math.max(kSpring * (sumInv + Math.sqrt(disc)), 0));
    const omega = mode === "acoustic" ? omegaAc : omegaOp;

    // Amplitude ratio for eigenvector
    const eps = mode === "acoustic" ? 1 : -M1 / M2;

    const padX = 40;
    const padY = 50;
    const usableW = W - 2 * padX;
    const cy = H / 2;
    const maxDisp = amplitude * 25;

    // Equilibrium positions
    const spacing = usableW / (nAtoms - 1);

    // --- Background decorations ---
    // Horizontal equilibrium line
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(120, 150, 200, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, cy);
    ctx.lineTo(W - padX, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Standing wave envelope
    ctx.beginPath();
    ctx.strokeStyle = "rgba(100, 180, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let px = 0; px < usableW; px++) {
      const xPos = padX + px;
      const frac = px / usableW;
      const envY = maxDisp * Math.sin(qIndex * Math.PI * frac);
      if (px === 0) { ctx.moveTo(xPos, cy - envY); } else { ctx.lineTo(xPos, cy - envY); }
    }
    ctx.stroke();
    ctx.beginPath();
    for (let px = 0; px < usableW; px++) {
      const xPos = padX + px;
      const frac = px / usableW;
      const envY = maxDisp * Math.sin(qIndex * Math.PI * frac);
      if (px === 0) { ctx.moveTo(xPos, cy + envY); } else { ctx.lineTo(xPos, cy + envY); }
    }
    ctx.stroke();

    // Compute displacements
    const positions: { x: number; y: number; isM1: boolean; eqX: number }[] = [];
    for (let i = 0; i < nAtoms; i++) {
      const isM1 = i % 2 === 0;
      const cellIdx = Math.floor(i / 2);
      const eqX = padX + i * spacing;

      const phase = q * (cellIdx * latticeA + (isM1 ? 0 : latticeA / 2));
      const amp = isM1 ? 1 : eps;
      const disp = maxDisp * amp * Math.cos(phase - omega * t * speed);

      positions.push({ x: eqX, y: cy + disp, isM1, eqX });
    }

    // Draw springs between atoms
    for (let i = 0; i < nAtoms - 1; i++) {
      const p1 = positions[i];
      const p2 = positions[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const stretch = dist / spacing;

      // Color spring by compression/stretch
      const stretchColor = stretch > 1.05
        ? `rgba(239, 68, 68, ${Math.min(0.6, (stretch - 1) * 3)})`
        : stretch < 0.95
        ? `rgba(34, 197, 94, ${Math.min(0.6, (1 - stretch) * 3)})`
        : "rgba(150, 180, 220, 0.25)";

      // Draw zigzag spring
      ctx.beginPath();
      ctx.strokeStyle = stretchColor;
      ctx.lineWidth = 1.5;
      const segs = 12;
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const zigAmp = 4 * (1 / Math.max(stretch, 0.5));
      for (let s = 0; s <= segs; s++) {
        const frac = s / segs;
        const sx = p1.x + dx * frac;
        const sy = p1.y + dy * frac;
        const zig = (s > 0 && s < segs) ? ((s % 2 === 0 ? 1 : -1) * zigAmp) : 0;
        const fx = sx + perpX * zig;
        const fy = sy + perpY * zig;
        s === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    }

    // Draw displacement arrows (faint)
    for (const p of positions) {
      const dy = p.y - cy;
      if (Math.abs(dy) > 2) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(200, 220, 255, ${Math.min(0.3, Math.abs(dy) / 30)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.moveTo(p.x, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw atoms
    for (const p of positions) {
      const r = p.isM1 ? 8 + (M1 / 100) * 6 : 8 + (M2 / 100) * 6;
      const dy = Math.abs(p.y - cy);
      const glow = Math.min(1, dy / 20);

      // Glow
      if (glow > 0.1) {
        ctx.beginPath();
        const glowColor = p.isM1 ? `rgba(96, 165, 250, ${glow * 0.3})` : `rgba(251, 113, 133, ${glow * 0.3})`;
        ctx.arc(p.x, p.y, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = glowColor;
        ctx.fill();
      }

      // Atom body
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      const grad = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 0, p.x, p.y, r);
      if (p.isM1) {
        grad.addColorStop(0, "hsl(210, 100%, 78%)");
        grad.addColorStop(1, "hsl(210, 90%, 55%)");
      } else {
        grad.addColorStop(0, "hsl(350, 85%, 78%)");
        grad.addColorStop(1, "hsl(350, 75%, 55%)");
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Atom label
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `bold ${r > 10 ? 8 : 7}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.isM1 ? "M₁" : "M₂", p.x, p.y);
    }

    // Motion trail (ghosting of previous positions)
    ctx.globalAlpha = 0.04;
    for (let trail = 1; trail <= 4; trail++) {
      const tt = t - trail * 0.15;
      for (let i = 0; i < nAtoms; i++) {
        const isM1 = i % 2 === 0;
        const cellIdx = Math.floor(i / 2);
        const eqX = padX + i * spacing;
        const phase = q * (cellIdx * latticeA + (isM1 ? 0 : latticeA / 2));
        const amp = isM1 ? 1 : eps;
        const disp = maxDisp * amp * Math.cos(phase - omega * tt * speed);
        const r = isM1 ? 5 : 5;
        ctx.beginPath();
        ctx.arc(eqX, cy + disp, r, 0, 2 * Math.PI);
        ctx.fillStyle = isM1 ? "hsl(210, 80%, 60%)" : "hsl(350, 70%, 60%)";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Title & info
    ctx.fillStyle = "rgba(220, 235, 255, 0.9)";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${mode === "acoustic" ? "Acoustic" : "Optical"} Normal Mode — q = ${qIndex}π/${nCells}a`, padX, 22);

    ctx.fillStyle = "rgba(170, 195, 230, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`ω = ${omega.toFixed(4)}  |  λ = ${(2 * Math.PI / (q || 0.001)).toFixed(2)} Å  |  T = ${omega > 0 ? (2 * Math.PI / omega).toFixed(2) : "∞"}`, padX, 38);

    // Phase indicator
    const phaseAngle = (omega * t * speed) % (2 * Math.PI);
    const indicatorX = W - padX - 20;
    const indicatorY = 25;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(150, 180, 220, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(indicatorX, indicatorY);
    ctx.lineTo(indicatorX + 8 * Math.cos(-phaseAngle + Math.PI / 2), indicatorY - 8 * Math.sin(-phaseAngle + Math.PI / 2));
    ctx.strokeStyle = "hsl(210, 90%, 65%)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Legend
    ctx.fillStyle = "rgba(160, 180, 210, 0.6)";
    ctx.font = "9px 'Inter', sans-serif";
    ctx.textAlign = "center";
    const legendY = H - 12;
    ctx.fillText(
      mode === "acoustic"
        ? "Atoms oscillate in-phase — sound wave propagation"
        : "Adjacent atoms oscillate out-of-phase — infrared active",
      W / 2,
      legendY
    );
  }, [M1, M2, kSpring, latticeA, mode, qIndex, amplitude, speed, nCells, nAtoms]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const tick = () => {
      timeRef.current += 0.03;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, draw]);

  // Draw on parameter change when paused
  useEffect(() => {
    if (!playing) draw();
  }, [playing, draw]);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <motion.span
            animate={{ rotate: playing ? 360 : 0 }}
            transition={{ duration: 2, repeat: playing ? Infinity : 0, ease: "linear" }}
            className="text-primary"
          >
            ◎
          </motion.span>
          Phonon Normal Mode Visualizer
        </h3>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => { timeRef.current = 0; draw(); }}
          >
            <RotateCcw size={12} />
          </Button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-3">
        {(["acoustic", "optical"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-300 ${
              mode === m
                ? m === "acoustic"
                  ? "bg-green-500/15 border-green-500/40 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                  : "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                : "border-border/40 text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            {m === "acoustic" ? "🔊 Acoustic" : "✨ Optical"}
            <span className="block text-[9px] opacity-60 mt-0.5 font-normal">
              {m === "acoustic" ? "In-phase motion" : "Out-of-phase motion"}
            </span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full mb-3">
        <canvas ref={canvasRef} className="w-full rounded-lg border border-border/20" />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Mode Number (q)</span>
            <span className="font-mono text-primary">{qIndex}</span>
          </div>
          <Slider min={1} max={nCells - 1} step={1} value={[qIndex]} onValueChange={([v]) => setQIndex(v)} className="h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Amplitude</span>
            <span className="font-mono text-primary">{amplitude.toFixed(2)}</span>
          </div>
          <Slider min={0.1} max={1.5} step={0.05} value={[amplitude]} onValueChange={([v]) => setAmplitude(v)} className="h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Speed</span>
            <span className="font-mono text-primary">{speed.toFixed(1)}×</span>
          </div>
          <Slider min={0.1} max={3.0} step={0.1} value={[speed]} onValueChange={([v]) => setSpeed(v)} className="h-4" />
        </div>
      </div>

      {/* Physics info */}
      <div className="mt-3 rounded-lg border border-border/30 bg-background/50 p-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {mode === "acoustic" ? (
            <>
              <strong className="text-green-400">Acoustic mode:</strong> Adjacent atoms move in the same direction.
              At long wavelengths (small q), this corresponds to sound waves with ω ∝ |q|.
              The group velocity v<sub>g</sub> = ∂ω/∂q gives the speed of sound in the crystal.
            </>
          ) : (
            <>
              <strong className="text-red-400">Optical mode:</strong> Adjacent atoms move in opposite directions.
              These modes can couple to electromagnetic radiation (infrared absorption).
              At q = 0, ω<sub>opt</sub> = √[2K(1/M₁ + 1/M₂)] — finite frequency even at zone center.
            </>
          )}
        </p>
      </div>
    </GlassCard>
  );
});

PhononModeVisualizer.displayName = "PhononModeVisualizer";
export default PhononModeVisualizer;
