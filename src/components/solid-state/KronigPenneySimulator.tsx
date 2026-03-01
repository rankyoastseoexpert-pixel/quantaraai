import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveKronigPenney } from "@/lib/solidStateEngine";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { BookOpen, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function KronigPenneySimulator() {
  const [V0, setV0] = useState(5);
  const [b, setB] = useState(1);
  const [a, setA] = useState(3);
  const [mass, setMass] = useState(1);
  const [showDerivation, setShowDerivation] = useState(false);

  const result = useMemo(() => solveKronigPenney({ V0, b, a, mass, numPoints: 150 }), [V0, b, a, mass]);

  const chartData = result.kValues.map((k, i) => {
    const point: Record<string, number> = { k: parseFloat(k.toFixed(4)) };
    result.energies.forEach((band, bi) => { point[`band${bi}`] = parseFloat(band[i].toFixed(4)); });
    return point;
  });

  const handleExport = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f1a"; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#fff"; ctx.font = "20px Inter";
    ctx.fillText("Kronig–Penney E(k) Diagram", 40, 40);
    ctx.font = "14px JetBrains Mono";
    ctx.fillText(`V₀=${V0} eV, a=${a} Å, b=${b} Å, m*=${mass} mₑ`, 40, 70);
    result.bandGaps.forEach((g, i) => {
      ctx.fillStyle = "#f87171";
      ctx.fillText(`Band gap ${i + 1}: ${g.gap.toFixed(3)} eV (${g.lower.toFixed(2)}–${g.upper.toFixed(2)} eV)`, 40, 100 + i * 25);
    });
    const link = document.createElement("a");
    link.download = "kronig-penney.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
          <SliderRow label="V₀ (Barrier Height)" value={V0} min={0.5} max={20} step={0.5} onChange={setV0} unit=" eV" />
          <SliderRow label="b (Barrier Width)" value={b} min={0.1} max={5} step={0.1} onChange={setB} unit=" Å" />
          <SliderRow label="a (Well Width)" value={a} min={0.5} max={10} step={0.1} onChange={setA} unit=" Å" />
          <SliderRow label="m* (Effective Mass)" value={mass} min={0.1} max={3} step={0.1} onChange={setMass} unit=" mₑ" />

          <div className="pt-3 border-t border-border/30 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Lattice Constant</h4>
            <p className="text-xs text-muted-foreground font-mono">d = a + b = {(a + b).toFixed(2)} Å</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDerivation(!showDerivation)} className="gap-1.5 text-xs flex-1">
              <BookOpen size={12} /> {showDerivation ? "Hide" : "Show"} Derivation
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5 text-xs">
              <Download size={12} /> PNG
            </Button>
          </div>
        </GlassCard>

        {/* E-k Diagram */}
        <GlassCard className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">E–k Dispersion Relation</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="k" type="number" domain={["auto", "auto"]}
                  label={{ value: "k (1/Å)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "E (eV)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `k = ${Number(v).toFixed(3)}`} />
                {result.energies.map((_, bi) => (
                  <Line key={bi} dataKey={`band${bi}`} stroke={BAND_COLORS[bi % BAND_COLORS.length]}
                    dot={false} strokeWidth={2} name={`Band ${bi + 1}`} />
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
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-muted-foreground">Gap {i + 1}</p>
                <p className="text-lg font-bold font-mono text-destructive">{gap.gap.toFixed(3)} <span className="text-xs">eV</span></p>
                <p className="text-[10px] text-muted-foreground font-mono">{gap.lower.toFixed(2)} – {gap.upper.toFixed(2)} eV</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Derivation */}
      <AnimatePresence>
        {showDerivation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Mathematical Derivation</h3>
              <div className="text-xs text-muted-foreground space-y-2 font-mono leading-relaxed">
                <p>For a 1D periodic potential with barrier height V₀, well width a, and barrier width b:</p>
                <div className="bg-secondary/30 p-3 rounded-lg border border-border/30">
                  <p>cos(kd) = cos(αa)·cosh(βb) − [(α² − β²)/(2αβ)]·sin(αa)·sinh(βb)</p>
                  <p className="mt-1">where α = √(2mE/ℏ²), β = √(2m(V₀−E)/ℏ²), d = a + b</p>
                </div>
                <p>Allowed energy bands occur when |cos(kd)| ≤ 1. The Bloch wavevector k ranges over the first Brillouin zone: −π/d ≤ k ≤ π/d.</p>
                <p>Band gaps appear where |f(E)| {'>'} 1, i.e., no real k satisfies the equation → forbidden energies.</p>
                <div className="bg-secondary/30 p-3 rounded-lg border border-border/30">
                  <p>For E {'>'} V₀: β → iκ where κ = √(2m(E−V₀)/ℏ²)</p>
                  <p>cos(kd) = cos(αa)·cos(κb) − [(α² + κ²)/(2ακ)]·sin(αa)·sin(κb)</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
