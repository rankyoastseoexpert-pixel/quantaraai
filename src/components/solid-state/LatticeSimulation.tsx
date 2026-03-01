import { useState, useMemo, useRef, useEffect } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { generateLattice, type LatticeType } from "@/lib/solidStateEngine";

const SliderRow = ({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary bg-primary/10 px-1.5 rounded text-[11px]">{value.toFixed(1)}{unit}</span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
);

const LatticeCanvas = ({ points, vectors, width, height, title, isReciprocal }: {
  points: { x: number; y: number; sublattice?: string }[];
  vectors: { a1: [number, number]; a2: [number, number] };
  width: number; height: number; title: string; isReciprocal?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Compute scale
    const allX = points.map(p => p.x);
    const allY = points.map(p => p.y);
    const rangeX = Math.max(...allX) - Math.min(...allX) || 1;
    const rangeY = Math.max(...allY) - Math.min(...allY) || 1;
    const scale = Math.min((width - 60) / rangeX, (height - 60) / rangeY);
    const cx = width / 2, cy = height / 2;
    const ox = (Math.max(...allX) + Math.min(...allX)) / 2;
    const oy = (Math.max(...allY) + Math.min(...allY)) / 2;
    const toScreen = (x: number, y: number): [number, number] => [
      cx + (x - ox) * scale,
      cy - (y - oy) * scale,
    ];

    // Grid
    ctx.strokeStyle = "hsla(222, 30%, 25%, 0.3)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(width, x); ctx.stroke();
    }

    // Lattice vectors from origin
    const [ox0, oy0] = toScreen(0, 0);
    const drawArrow = (dx: number, dy: number, color: string, label: string) => {
      const [tx, ty] = toScreen(dx, dy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox0, oy0); ctx.lineTo(tx, ty); ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(oy0 - ty, tx - ox0);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 10 * Math.cos(angle - 0.3), ty + 10 * Math.sin(angle - 0.3));
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 10 * Math.cos(angle + 0.3), ty + 10 * Math.sin(angle + 0.3));
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "bold 12px Inter";
      ctx.fillText(label, tx + 5, ty - 5);
    };
    drawArrow(vectors.a1[0], vectors.a1[1], "hsl(40, 90%, 55%)", isReciprocal ? "b₁" : "a₁");
    drawArrow(vectors.a2[0], vectors.a2[1], "hsl(150, 70%, 50%)", isReciprocal ? "b₂" : "a₂");

    // Points
    for (const p of points) {
      const [px, py] = toScreen(p.x, p.y);
      if (px < -10 || px > width + 10 || py < -10 || py > height + 10) continue;
      ctx.beginPath();
      ctx.arc(px, py, isReciprocal ? 3 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = p.sublattice === "B" ? "hsl(350, 80%, 60%)" : isReciprocal ? "hsl(280, 80%, 65%)" : "hsl(195, 100%, 50%)";
      ctx.fill();
      ctx.strokeStyle = "hsla(0, 0%, 100%, 0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = "hsl(215, 20%, 55%)";
    ctx.font = "11px Inter";
    ctx.fillText(title, 10, 16);
  }, [points, vectors, width, height, title, isReciprocal]);

  return <canvas ref={canvasRef} style={{ width, height }} className="rounded-lg" />;
};

export default function LatticeSimulation() {
  const [type, setType] = useState<LatticeType>("square");
  const [a, setA] = useState(2.5);
  const [b, setB] = useState(3.5);
  const [nx, setNx] = useState(4);

  const result = useMemo(() => generateLattice(type, a, b, nx, nx), [type, a, b, nx]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Lattice Type</h3>
          <div className="space-y-1">
            {(["square", "rectangular", "honeycomb"] as const).map(lt => (
              <button key={lt} onClick={() => setType(lt)}
                className={`w-full text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                  type === lt ? "bg-primary/15 border-primary/30 text-primary font-medium" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                }`}
              >{lt.charAt(0).toUpperCase() + lt.slice(1)}{lt === "honeycomb" ? " (Graphene)" : ""}</button>
            ))}
          </div>
          <SliderRow label="a (Lattice Constant)" value={a} min={1} max={5} step={0.1} onChange={setA} unit=" Å" />
          {type === "rectangular" && (
            <SliderRow label="b (Second Constant)" value={b} min={1} max={6} step={0.1} onChange={setB} unit=" Å" />
          )}
          <SliderRow label="Grid Size" value={nx} min={2} max={8} step={1} onChange={setNx} />

          <div className="pt-3 border-t border-border/30 text-xs text-muted-foreground space-y-1">
            <p>a₁ = ({result.vectors.a1.map(v => v.toFixed(2)).join(", ")})</p>
            <p>a₂ = ({result.vectors.a2.map(v => v.toFixed(2)).join(", ")})</p>
            <p className="mt-2 font-semibold text-foreground">Reciprocal:</p>
            <p>b₁ = ({result.reciprocal.b1.map(v => v.toFixed(2)).join(", ")})</p>
            <p>b₂ = ({result.reciprocal.b2.map(v => v.toFixed(2)).join(", ")})</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 lg:col-span-1.5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">Real-Space Lattice</h3>
          <LatticeCanvas points={result.points} vectors={result.vectors} width={350} height={350} title="Real Space" />
          {type === "honeycomb" && (
            <div className="flex gap-4 mt-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Sublattice A</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(350, 80%, 60%)" }} /> Sublattice B</span>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 lg:col-span-1.5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-foreground mb-2 self-start">Reciprocal Lattice</h3>
          <LatticeCanvas points={result.reciprocalPoints} vectors={{ a1: result.reciprocal.b1, a2: result.reciprocal.b2 }} width={350} height={350} title="Reciprocal Space (k-space)" isReciprocal />
        </GlassCard>
      </div>
    </div>
  );
}
