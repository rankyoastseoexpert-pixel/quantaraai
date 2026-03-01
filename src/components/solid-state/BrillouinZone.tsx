import { useState, useMemo, useRef, useEffect } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { getBrillouinZone, type LatticeType } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { FileText } from "lucide-react";

const BZ_DERIVATION = [
  {
    title: "Brillouin Zone Definition",
    content: "The first Brillouin zone (1BZ) is the Wigner-Seitz cell of the reciprocal lattice. It is the set of all k-points closer to the origin than to any other reciprocal lattice point G.",
    equation: "1BZ = { k : |k| ≤ |k − G| for all G ≠ 0 }"
  },
  {
    title: "Construction Method",
    content: "Draw perpendicular bisector planes (Bragg planes) between the origin and each reciprocal lattice point. The smallest enclosed volume is the 1st Brillouin zone. Zone boundaries satisfy the Laue/Bragg condition.",
    equation: "2k · G = |G|²  (Bragg plane condition)"
  },
  {
    title: "Square Lattice BZ",
    content: "For a 2D square lattice with spacing a: reciprocal vectors b₁ = (2π/a)x̂, b₂ = (2π/a)ŷ. The 1BZ is a square with vertices at (±π/a, ±π/a). High-symmetry points: Γ(0,0), X(π/a,0), M(π/a,π/a).",
    equation: "1BZ: −π/a ≤ kₓ ≤ π/a,  −π/a ≤ k_y ≤ π/a"
  },
  {
    title: "Hexagonal (Honeycomb) BZ",
    content: "The honeycomb lattice has a hexagonal BZ. High-symmetry points are Γ (center), K (corner — Dirac point in graphene), and M (edge midpoint). The K point is where graphene's conduction and valence bands touch.",
    equation: "K = (2π/3a)(1, 1/√3),  M = (2π/3a)(1, 0),  Γ = (0, 0)"
  },
  {
    title: "Band Structure Along Symmetry Paths",
    content: "The electronic band structure E(k) is plotted along high-symmetry paths (e.g., Γ→X→M→Γ). These paths capture all essential features: band extrema, crossings, and gap minima. The dispersion shape reveals effective masses and transport properties.",
    equation: "v_g = (1/ℏ) ∇_k E(k)  (group velocity from band slope)"
  },
  {
    title: "Tight-Binding Dispersion in BZ",
    content: "For a 2D square lattice with nearest-neighbor hopping t, the band dispersion over the full BZ is E(kₓ,k_y) = ε₀ − 2t[cos(kₓa) + cos(k_ya)]. The bandwidth is 8t. Van Hove singularities appear at saddle points (X points).",
    equation: "E(Γ) = ε₀ − 4t (minimum),  E(M) = ε₀ + 4t (maximum),  E(X) = ε₀ (saddle)"
  },
];

export default function BrillouinZone() {
  const [type, setType] = useState<LatticeType>("square");
  const [a, setA] = useState(2.5);
  const [t, setT] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bz = useMemo(() => getBrillouinZone(type, a), [type, a]);

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
        const E = -2 * t * (Math.cos(kx * a) + Math.cos(ky * a));
        pts.push({ label: i === 0 ? seg.from : "", pathDist: cumDist + frac * segLen, energy: E });
      }
      cumDist += segLen;
    }
    const lastSeg = bz.pathSegments[bz.pathSegments.length - 1];
    const lastPt = bz.symmetryPoints.find(p => p.label === lastSeg.to)!;
    pts.push({
      label: lastSeg.to, pathDist: cumDist,
      energy: -2 * t * (Math.cos(lastPt.kx * a) + Math.cos(lastPt.ky * a)),
    });
    return pts;
  }, [bz, a, t]);

  // Draw BZ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 380;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Grid
    ctx.strokeStyle = "hsla(222, 30%, 25%, 0.15)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 12; i++) {
      const p = (size / 12) * i;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }

    const allCoords = bz.vertices.flat();
    const maxVal = Math.max(...allCoords.map(Math.abs)) * 1.4;
    const scale = (size - 50) / (2 * maxVal);
    const cx = size / 2, cy = size / 2;
    const toScreen = (x: number, y: number): [number, number] => [cx + x * scale, cy - y * scale];

    // Axes
    ctx.strokeStyle = "hsla(215, 20%, 45%, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke();
    ctx.setLineDash([]);

    // BZ fill
    ctx.beginPath();
    const [sx, sy] = toScreen(bz.vertices[0][0], bz.vertices[0][1]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < bz.vertices.length; i++) {
      const [vx, vy] = toScreen(bz.vertices[i][0], bz.vertices[i][1]);
      ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    
    // Gradient fill
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 3);
    grad.addColorStop(0, "hsla(195, 100%, 50%, 0.12)");
    grad.addColorStop(1, "hsla(195, 100%, 50%, 0.02)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "hsl(195, 100%, 50%)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Symmetry path
    ctx.strokeStyle = "hsla(40, 90%, 55%, 0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
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
      // Glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 15);
      glow.addColorStop(0, "hsla(40, 90%, 55%, 0.4)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 7, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(40, 90%, 55%)";
      ctx.fill();
      ctx.strokeStyle = "hsl(40, 90%, 75%)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter";
      ctx.textAlign = "center";
      ctx.fillText(sp.label, px, py - 14);
    }

    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "12px Inter";
    ctx.textAlign = "right";
    ctx.fillText("kₓ", size - 8, cy - 8);
    ctx.textAlign = "center";
    ctx.fillText("kᵧ", cx + 14, 16);
  }, [bz]);

  // Band along path
  const bandCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = bandCanvasRef.current;
    if (!canvas || bandPath.length === 0) return;
    const w = 520, h = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const margin = { top: 20, right: 25, bottom: 45, left: 55 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;
    const dMax = Math.max(...bandPath.map(p => p.pathDist));
    const eMin = Math.min(...bandPath.map(p => p.energy));
    const eMax = Math.max(...bandPath.map(p => p.energy));
    const eRange = eMax - eMin || 1;

    const toX = (d: number) => margin.left + (d / dMax) * pw;
    const toY = (e: number) => margin.top + ph - ((e - eMin) / eRange) * ph;

    // Grid
    ctx.strokeStyle = "hsla(222, 30%, 25%, 0.25)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const y = margin.top + (ph / 6) * i;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke();
    }

    // Band area gradient
    ctx.beginPath();
    bandPath.forEach((p, i) => {
      const x = toX(p.pathDist), y = toY(p.energy);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(dMax), margin.top + ph);
    ctx.lineTo(toX(0), margin.top + ph);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + ph);
    areaGrad.addColorStop(0, "hsla(195, 100%, 50%, 0.15)");
    areaGrad.addColorStop(1, "hsla(195, 100%, 50%, 0)");
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Band curve
    ctx.beginPath();
    ctx.strokeStyle = "hsl(195, 100%, 50%)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "hsl(195, 100%, 50%)";
    ctx.shadowBlur = 6;
    bandPath.forEach((p, i) => {
      const x = toX(p.pathDist), y = toY(p.energy);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Symmetry labels
    for (const p of bandPath.filter(p => p.label)) {
      const x = toX(p.pathDist);
      ctx.beginPath();
      ctx.strokeStyle = "hsla(40, 90%, 55%, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(x, margin.top); ctx.lineTo(x, h - margin.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "hsl(40, 90%, 60%)";
      ctx.font = "bold 12px Inter";
      ctx.textAlign = "center";
      ctx.fillText(p.label, x, h - margin.bottom + 20);
    }

    // Y axis ticks
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "10px JetBrains Mono";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const e = eMin + (eRange / 6) * i;
      ctx.fillText(e.toFixed(1), margin.left - 6, toY(e) + 3);
    }
    ctx.save();
    ctx.translate(16, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "12px Inter";
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.fillText("E (eV)", 0, 0);
    ctx.restore();
  }, [bandPath]);

  const handleExportPDF = () => {
    exportChartAsPDF(`Brillouin Zone — ${type.charAt(0).toUpperCase() + type.slice(1)} Lattice`, [
      `Lattice: ${type} | a = ${a} Å | t = ${t} eV`,
      `Path: ${bz.pathSegments.map(s => s.from).join(" → ")} → ${bz.pathSegments[bz.pathSegments.length - 1].to}`,
      ...bz.symmetryPoints.map(sp => `${sp.label}: (${sp.kx.toFixed(3)}, ${sp.ky.toFixed(3)}) Å⁻¹`),
    ], "bz-vis");
  };

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
              <p key={sp.label} className="font-mono">{sp.label}: ({sp.kx.toFixed(3)}, {sp.ky.toFixed(3)}) Å⁻¹</p>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs w-full">
            <FileText size={12} /> Export PDF
          </Button>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center" id="bz-vis">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">1st Brillouin Zone (k-space)</h3>
          <canvas ref={canvasRef} style={{ width: 380, height: 380 }} className="rounded-lg" />
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">Band Structure Along Path</h3>
          <canvas ref={bandCanvasRef} style={{ width: 520, height: 320 }} className="rounded-lg" />
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            {bz.pathSegments.map(s => s.from).join(" → ")} → {bz.pathSegments[bz.pathSegments.length - 1].to}
          </p>
        </GlassCard>
      </div>

      {/* Derivation */}
      <DerivationBlock title="Brillouin Zone Theory & Derivation" steps={BZ_DERIVATION} />
    </div>
  );
}
