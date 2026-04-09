import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MATERIALS_DB, type MaterialData } from "@/lib/materialsDatabase";
import { solveKronigPenney } from "@/lib/solidStateEngine";
import { Database, ArrowLeftRight } from "lucide-react";

const BAND_COLORS_A = ["hsl(195, 100%, 50%)", "hsl(280, 80%, 65%)", "hsl(150, 70%, 50%)", "hsl(40, 90%, 55%)"];
const BAND_COLORS_B = ["hsl(350, 80%, 60%)", "hsl(30, 85%, 55%)", "hsl(210, 90%, 65%)", "hsl(120, 60%, 55%)"];

const HBAR2_OVER_2M = 3.81;

function ComparisonCanvas({ matA, matB }: { matA: MaterialData; matB: MaterialData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resultA = useMemo(() => solveKronigPenney({ V0: matA.kpV0, a: matA.kpWellWidth, b: matA.kpBarrierWidth, mass: matA.effectiveMassElectron || 0.5, numPoints: 150 }), [matA]);
  const resultB = useMemo(() => solveKronigPenney({ V0: matB.kpV0, a: matB.kpWellWidth, b: matB.kpBarrierWidth, mass: matB.effectiveMassElectron || 0.5, numPoints: 150 }), [matB]);

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

    const midX = W / 2;
    const pad = { top: 50, bottom: 50, left: 55, right: 15 };

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(8, 12, 28, 0.95)");
    bg.addColorStop(1, "rgba(5, 8, 20, 0.95)");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.fill();

    // Title
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Side-by-Side Band Structure Comparison", midX, 22);
    ctx.font = "11px 'Georgia', serif";
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.fillText(`${matA.name} (${matA.formula}) vs ${matB.name} (${matB.formula})`, midX, 40);

    // Draw two panels
    const panels = [
      { result: resultA, mat: matA, colors: BAND_COLORS_A, x0: pad.left, x1: midX - 10 },
      { result: resultB, mat: matB, colors: BAND_COLORS_B, x0: midX + 10, x1: W - pad.right },
    ];

    // Find global energy range
    let eMin = Infinity, eMax = -Infinity;
    for (const p of panels) {
      for (const band of p.result.energies) {
        for (const e of band) {
          if (e < eMin) eMin = e;
          if (e > eMax) eMax = e;
        }
      }
    }
    const eRange = eMax - eMin || 1;
    eMin -= eRange * 0.05;
    eMax += eRange * 0.05;

    for (const panel of panels) {
      const pw = panel.x1 - panel.x0;
      const toX = (i: number) => panel.x0 + (i / (panel.result.kValues.length - 1)) * pw;
      const toY = (e: number) => pad.top + (H - pad.top - pad.bottom) * (1 - (e - eMin) / (eMax - eMin));

      // Panel background
      ctx.fillStyle = "rgba(15, 20, 40, 0.5)";
      ctx.beginPath(); ctx.roundRect(panel.x0 - 5, pad.top - 5, pw + 10, H - pad.top - pad.bottom + 10, 8); ctx.fill();

      // Grid
      ctx.strokeStyle = "rgba(100, 140, 200, 0.08)";
      ctx.lineWidth = 0.5;
      for (let g = 0; g <= 6; g++) {
        const y = pad.top + (H - pad.top - pad.bottom) * g / 6;
        ctx.beginPath(); ctx.moveTo(panel.x0, y); ctx.lineTo(panel.x1, y); ctx.stroke();
      }

      // Draw bands
      for (let bi = 0; bi < panel.result.energies.length && bi < 4; bi++) {
        const band = panel.result.energies[bi];
        ctx.strokeStyle = panel.colors[bi];
        ctx.lineWidth = 2.5;
        ctx.shadowColor = panel.colors[bi];
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i < band.length; i++) {
          const x = toX(i), y = toY(band[i]);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Material label
      ctx.fillStyle = panel.colors[0];
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${panel.mat.icon} ${panel.mat.name}`, panel.x0 + pw / 2, H - pad.bottom + 18);
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
      ctx.fillText(`Eg = ${panel.mat.bandGap} eV (${panel.mat.bandGapType})`, panel.x0 + pw / 2, H - pad.bottom + 32);

      // Band gap annotation
      if (panel.result.bandGaps.length > 0) {
        const gap = panel.result.bandGaps[0];
        const y1 = toY(gap.upper), y2 = toY(gap.lower);
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
        ctx.fillRect(panel.x0, y1, pw, y2 - y1);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panel.x0, y1); ctx.lineTo(panel.x1, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(panel.x0, y2); ctx.lineTo(panel.x1, y2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Δ=${gap.gap.toFixed(3)} eV`, panel.x0 + 4, (y1 + y2) / 2 + 3);
      }
    }

    // Divider
    ctx.strokeStyle = "rgba(150, 175, 210, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(midX, pad.top); ctx.lineTo(midX, H - pad.bottom); ctx.stroke();
    ctx.setLineDash([]);

    // Y-axis labels
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    for (let g = 0; g <= 6; g++) {
      const e = eMin + (eMax - eMin) * (1 - g / 6);
      const y = pad.top + (H - pad.top - pad.bottom) * g / 6;
      ctx.fillText(e.toFixed(1), pad.left - 5, y + 3);
    }
    ctx.save();
    ctx.translate(12, pad.top + (H - pad.top - pad.bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("E (eV)", 0, 0);
    ctx.restore();
  }, [matA, matB, resultA, resultB]);

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

export default function BandComparisonPanel() {
  const [matAKey, setMatAKey] = useState("si");
  const [matBKey, setMatBKey] = useState("gaas");

  const matA = MATERIALS_DB.find(m => m.key === matAKey) || MATERIALS_DB[0];
  const matB = MATERIALS_DB.find(m => m.key === matBKey) || MATERIALS_DB[2];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <ArrowLeftRight size={14} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Side-by-Side Band Comparison</h3>
          <p className="text-[10px] text-muted-foreground">Compare band structures of two materials simultaneously</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1"><Database size={10} /> Material A</p>
          <Select value={matAKey} onValueChange={setMatAKey}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATERIALS_DB.map(m => (
                <SelectItem key={m.key} value={m.key} className="text-xs">
                  {m.icon} {m.name} — Eg = {m.bandGap} eV
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1"><Database size={10} /> Material B</p>
          <Select value={matBKey} onValueChange={setMatBKey}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATERIALS_DB.map(m => (
                <SelectItem key={m.key} value={m.key} className="text-xs">
                  {m.icon} {m.name} — Eg = {m.bandGap} eV
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ComparisonCanvas matA={matA} matB={matB} />

      {/* Comparison Table */}
      <div className="mt-4 rounded-xl border border-border/30 bg-background/50 p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Property Comparison</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-left py-1.5 pr-3">Property</th>
                <th className="text-center py-1.5 px-3" style={{ color: BAND_COLORS_A[0] }}>{matA.icon} {matA.formula}</th>
                <th className="text-center py-1.5 px-3" style={{ color: BAND_COLORS_B[0] }}>{matB.icon} {matB.formula}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["Band Gap (eV)", matA.bandGap.toFixed(3), matB.bandGap.toFixed(3)],
                ["Gap Type", matA.bandGapType, matB.bandGapType],
                ["Lattice (Å)", matA.latticeConstant.toFixed(3), matB.latticeConstant.toFixed(3)],
                ["m*_e (m₀)", matA.effectiveMassElectron.toFixed(3), matB.effectiveMassElectron.toFixed(3)],
                ["m*_h (m₀)", matA.effectiveMassHole.toFixed(3), matB.effectiveMassHole.toFixed(3)],
                ["ε_r", matA.dielectricConstant.toFixed(1), matB.dielectricConstant.toFixed(1)],
                ["Structure", matA.latticeType, matB.latticeType],
              ].map(([prop, a, b]) => (
                <tr key={prop} className="border-b border-border/10">
                  <td className="py-1.5 pr-3 text-foreground font-semibold">{prop}</td>
                  <td className="text-center py-1.5 px-3">{a}</td>
                  <td className="text-center py-1.5 px-3">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}
