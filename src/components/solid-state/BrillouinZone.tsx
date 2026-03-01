import { useState, useMemo, useRef, useEffect } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { getBrillouinZone, solveTightBinding, type LatticeType } from "@/lib/solidStateEngine";

export default function BrillouinZone() {
  const [type, setType] = useState<LatticeType>("square");
  const [a, setA] = useState(2.5);
  const [t, setT] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bz = useMemo(() => getBrillouinZone(type, a), [type, a]);

  // Band along symmetry path
  const bandPath = useMemo(() => {
    const pts: { label: string; pathDist: number; energy: number }[] = [];
    let cumDist = 0;
    for (const seg of bz.pathSegments) {
      const from = bz.symmetryPoints.find(p => p.label === seg.from)!;
      const to = bz.symmetryPoints.find(p => p.label === seg.to)!;
      const segLen = Math.sqrt((to.kx - from.kx) ** 2 + (to.ky - from.ky) ** 2);
      for (let i = 0; i < seg.points; i++) {
        const frac = i / (seg.points - 1);
        const kx = from.kx + frac * (to.kx - from.kx);
        const ky = from.ky + frac * (to.ky - from.ky);
        // TB dispersion in 2D
        const E = -2 * t * (Math.cos(kx * a) + Math.cos(ky * a));
        pts.push({ label: i === 0 ? seg.from : "", pathDist: cumDist + frac * segLen, energy: E });
      }
      cumDist += segLen;
    }
    // Last point label
    const lastSeg = bz.pathSegments[bz.pathSegments.length - 1];
    pts.push({
      label: lastSeg.to,
      pathDist: cumDist,
      energy: -2 * t * (Math.cos(bz.symmetryPoints.find(p => p.label === lastSeg.to)!.kx * a) +
        Math.cos(bz.symmetryPoints.find(p => p.label === lastSeg.to)!.ky * a)),
    });
    return pts;
  }, [bz, a, t]);

  // Draw BZ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 350;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Background grid
    ctx.strokeStyle = "hsla(222, 30%, 25%, 0.2)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const p = (size / 10) * i;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }

    const allCoords = bz.vertices.flat();
    const maxVal = Math.max(...allCoords.map(Math.abs)) * 1.4;
    const scale = (size - 40) / (2 * maxVal);
    const cx = size / 2, cy = size / 2;
    const toScreen = (x: number, y: number): [number, number] => [cx + x * scale, cy - y * scale];

    // Axes
    ctx.strokeStyle = "hsla(215, 20%, 45%, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke();
    ctx.setLineDash([]);

    // BZ polygon
    ctx.beginPath();
    const [sx, sy] = toScreen(bz.vertices[0][0], bz.vertices[0][1]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < bz.vertices.length; i++) {
      const [vx, vy] = toScreen(bz.vertices[i][0], bz.vertices[i][1]);
      ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = "hsla(195, 100%, 50%, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "hsl(195, 100%, 50%)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Symmetry path
    ctx.strokeStyle = "hsla(40, 90%, 55%, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    for (const seg of bz.pathSegments) {
      const from = bz.symmetryPoints.find(p => p.label === seg.from)!;
      const to = bz.symmetryPoints.find(p => p.label === seg.to)!;
      const [fx, fy] = toScreen(from.kx, from.ky);
      const [tx, ty] = toScreen(to.kx, to.ky);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Symmetry points
    for (const sp of bz.symmetryPoints) {
      const [px, py] = toScreen(sp.kx, sp.ky);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(40, 90%, 55%)";
      ctx.fill();
      ctx.strokeStyle = "hsl(40, 90%, 75%)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Inter";
      ctx.textAlign = "center";
      ctx.fillText(sp.label, px, py - 12);
    }

    // Axis labels
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "11px Inter";
    ctx.textAlign = "right";
    ctx.fillText("kₓ", size - 5, cy - 5);
    ctx.textAlign = "center";
    ctx.fillText("kᵧ", cx + 12, 14);
  }, [bz]);

  // Band along path chart (canvas)
  const bandCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = bandCanvasRef.current;
    if (!canvas || bandPath.length === 0) return;
    const w = 500, h = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;
    const dMax = Math.max(...bandPath.map(p => p.pathDist));
    const eMin = Math.min(...bandPath.map(p => p.energy));
    const eMax = Math.max(...bandPath.map(p => p.energy));
    const eRange = eMax - eMin || 1;

    const toX = (d: number) => margin.left + (d / dMax) * pw;
    const toY = (e: number) => margin.top + ph - ((e - eMin) / eRange) * ph;

    // Grid
    ctx.strokeStyle = "hsla(222, 30%, 25%, 0.3)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (ph / 5) * i;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
    }

    // Band curve
    ctx.beginPath();
    ctx.strokeStyle = "hsl(195, 100%, 50%)";
    ctx.lineWidth = 2;
    bandPath.forEach((p, i) => {
      const x = toX(p.pathDist), y = toY(p.energy);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Symmetry labels
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "11px Inter";
    ctx.textAlign = "center";
    for (const p of bandPath.filter(p => p.label)) {
      const x = toX(p.pathDist);
      ctx.beginPath();
      ctx.strokeStyle = "hsla(40, 90%, 55%, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.moveTo(x, margin.top); ctx.lineTo(x, h - margin.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(p.label, x, h - margin.bottom + 18);
    }

    // Y axis
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "10px JetBrains Mono";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const e = eMin + (eRange / 5) * i;
      const y = toY(e);
      ctx.fillText(e.toFixed(1), margin.left - 5, y + 3);
    }
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "11px Inter";
    ctx.fillText("E (eV)", 0, 0);
    ctx.restore();
  }, [bandPath]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
          <div className="space-y-1">
            {(["square", "honeycomb"] as const).map(lt => (
              <button key={lt} onClick={() => setType(lt)}
                className={`w-full text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                  type === lt ? "bg-primary/15 border-primary/30 text-primary font-medium" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                }`}
              >{lt.charAt(0).toUpperCase() + lt.slice(1)}</button>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">a (Lattice Constant)</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{a.toFixed(1)} Å</span>
            </div>
            <Slider min={1} max={5} step={0.1} value={[a]} onValueChange={([v]) => setA(v)} className="h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">t (Hopping)</span>
              <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{t.toFixed(1)} eV</span>
            </div>
            <Slider min={0.1} max={3} step={0.1} value={[t]} onValueChange={([v]) => setT(v)} className="h-4" />
          </div>

          <div className="pt-3 border-t border-border/30 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">High-Symmetry Points</p>
            {bz.symmetryPoints.map(sp => (
              <p key={sp.label} className="font-mono">{sp.label}: ({sp.kx.toFixed(3)}, {sp.ky.toFixed(3)})</p>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">1st Brillouin Zone (k-space)</h3>
          <canvas ref={canvasRef} style={{ width: 350, height: 350 }} className="rounded-lg" />
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">Band Structure Along Path</h3>
          <canvas ref={bandCanvasRef} style={{ width: 500, height: 300 }} className="rounded-lg" />
          <p className="text-[10px] text-muted-foreground mt-2">
            Path: {bz.pathSegments.map(s => s.from).join(" → ")} → {bz.pathSegments[bz.pathSegments.length - 1].to}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
