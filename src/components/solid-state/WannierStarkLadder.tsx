import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

const HBAR2_OVER_2M = 3.81;

function WannierStarkCanvas({ V0, a, b, electricField }: {
  V0: number; a: number; b: number; electricField: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 400;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const d = a + b;
    const numSites = 12;
    const pad = { top: 50, bottom: 55, left: 60, right: 40 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    // Energy parameters
    const eFd = electricField * d; // Wannier-Stark splitting ΔE = eFd
    const E0 = V0 * 0.3; // base energy of first band
    const bandwidth = V0 * 0.4;

    // Coordinate transforms
    const centerSite = Math.floor(numSites / 2);
    const toX = (site: number) => pad.left + ((site + 0.5) / numSites) * pw;
    const maxE = E0 + eFd * (numSites / 2) + bandwidth;
    const minE = E0 - eFd * (numSites / 2) - bandwidth * 0.5;
    const eRange = maxE - minE || 1;
    const toY = (e: number) => pad.top + ph * (1 - (e - minE) / eRange);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(5, 8, 25, 0.95)");
    bg.addColorStop(1, "rgba(8, 12, 30, 0.95)");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.fill();

    // Title
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Wannier–Stark Ladder", W / 2, 22);
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "italic 11px 'Georgia', serif";
    ctx.fillText(`ΔE = eFd = ${eFd.toFixed(3)} eV  •  Equally spaced energy levels under applied field`, W / 2, 40);

    // Grid
    ctx.strokeStyle = "rgba(100, 140, 200, 0.06)";
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 8; g++) {
      const y = pad.top + ph * g / 8;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    // Draw tilted potential envelope
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255, 200, 50, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(E0 - eFd * centerSite));
    ctx.lineTo(toX(numSites - 1), toY(E0 + eFd * (numSites - 1 - centerSite)));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Wannier-Stark levels
    for (let n = 0; n < numSites; n++) {
      const E_n = E0 + eFd * (n - centerSite);
      const x = toX(n);
      const y = toY(E_n);
      const levelW = pw / numSites * 0.7;

      // Level line with glow
      const hue = 195 + (n - centerSite) * 15;
      const color = `hsl(${hue}, 80%, 60%)`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - levelW / 2, y);
      ctx.lineTo(x + levelW / 2, y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Site index
      ctx.fillStyle = "rgba(170, 190, 220, 0.6)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`n=${n - centerSite}`, x, pad.top + ph + 14);

      // Energy label
      ctx.fillStyle = color;
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${E_n.toFixed(2)}`, x + levelW / 2 + 4, y + 3);

      // Localized wavefunction (Wannier function envelope)
      ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 0.5)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sigma = d * 0.8 / (1 + electricField * 0.5);
      for (let ix = -25; ix <= 25; ix++) {
        const dx = ix * pw / (numSites * 25);
        const xp = x + dx;
        const gaussAmp = Math.exp(-(dx * dx) / (2 * (sigma * pw / (numSites * d)) ** 2));
        const waveAmp = gaussAmp * Math.cos(8 * dx / (pw / numSites));
        const yp = y - waveAmp * 12;
        ix === -25 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
      }
      ctx.stroke();
    }

    // Draw spacing arrows between adjacent levels
    for (let n = 0; n < numSites - 1; n++) {
      const E_n = E0 + eFd * (n - centerSite);
      const E_n1 = E0 + eFd * (n + 1 - centerSite);
      const x = (toX(n) + toX(n + 1)) / 2;
      const y1 = toY(E_n);
      const y2 = toY(E_n1);

      if (n === centerSite) {
        ctx.strokeStyle = "rgba(255, 200, 50, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 4, y2 + 6); ctx.moveTo(x, y2); ctx.lineTo(x + 4, y2 + 6); ctx.stroke();
        ctx.fillStyle = "rgba(255, 200, 50, 0.9)";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`ΔE = ${eFd.toFixed(3)} eV`, x + 8, (y1 + y2) / 2 + 3);
      }
    }

    // Axes
    ctx.strokeStyle = "rgba(150, 175, 210, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let g = 0; g <= 6; g++) {
      const e = minE + eRange * (1 - g / 6);
      ctx.fillText(e.toFixed(1), pad.left - 5, pad.top + ph * g / 6 + 3);
    }

    // Axis labels
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("Lattice Site", pad.left + pw / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Energy (eV)", 0, 0);
    ctx.restore();

    // Info box
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath(); ctx.roundRect(W - pad.right - 160, pad.top + 5, 155, 55, 6); ctx.fill();
    ctx.fillStyle = "rgba(255, 200, 50, 0.9)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`F = ${electricField.toFixed(2)} V/Å`, W - pad.right - 152, pad.top + 18);
    ctx.fillText(`d = ${d.toFixed(2)} Å`, W - pad.right - 152, pad.top + 30);
    ctx.fillText(`eFd = ${eFd.toFixed(4)} eV`, W - pad.right - 152, pad.top + 42);
    ctx.fillText(`Localization ∝ 1/F`, W - pad.right - 152, pad.top + 54);

  }, [V0, a, b, electricField]);

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

export default function WannierStarkLadder({ V0, a, b }: { V0: number; a: number; b: number }) {
  const [electricField, setElectricField] = useState(0.5);
  const d = a + b;
  const eFd = electricField * d;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Zap size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Wannier–Stark Ladder</h3>
          <p className="text-[10px] text-muted-foreground">Energy levels split into equally spaced rungs under applied electric field</p>
        </div>
      </div>

      <WannierStarkCanvas V0={V0} a={a} b={b} electricField={electricField} />

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Electric Field F</span>
            <span className="font-mono text-amber-400 bg-amber-400/10 px-1.5 rounded text-[11px]">{electricField.toFixed(2)} V/Å</span>
          </div>
          <Slider min={0.05} max={2.0} step={0.05} value={[electricField]} onValueChange={([v]) => setElectricField(v)} className="h-4" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">Level Spacing</p>
            <p className="text-sm font-bold font-mono text-amber-400">{eFd.toFixed(4)} eV</p>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">Bloch Period</p>
            <p className="text-sm font-bold font-mono text-primary">{eFd > 0.001 ? (2 * Math.PI / (electricField * d * 0.5)).toFixed(2) : "∞"} s</p>
          </div>
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">Localization</p>
            <p className="text-sm font-bold font-mono text-emerald-400">{(V0 * 0.4 / eFd).toFixed(1)} sites</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/15 bg-primary/5 p-3 space-y-1.5 text-[10px] text-muted-foreground"
        >
          <p className="font-semibold text-foreground text-[11px]">📖 Wannier–Stark Effect</p>
          <p>• Under a uniform electric field F, Bloch bands break into discrete levels</p>
          <p>• Energy spacing: <span className="text-primary font-mono">Eₙ = E₀ + neFd</span> (equally spaced ladder)</p>
          <p>• Wavefunctions become localized — no longer extended Bloch states</p>
          <p>• Localization length ≈ Δ/(eF) where Δ is the bandwidth</p>
          <p>• At high fields: localization → single-site confinement</p>
          <p>• Optical transitions between rungs give Bloch oscillation frequency ω_B = eFd/ℏ</p>
        </motion.div>
      </div>
    </GlassCard>
  );
}
