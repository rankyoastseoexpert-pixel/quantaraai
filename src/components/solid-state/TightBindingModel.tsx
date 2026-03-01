import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveTightBinding } from "@/lib/solidStateEngine";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { Download } from "lucide-react";

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

export default function TightBindingModel() {
  const [t, setT] = useState(1);
  const [epsilon, setEpsilon] = useState(0);
  const [a, setA] = useState(2.5);
  const [dim, setDim] = useState<"1D" | "2D">("1D");

  const result = useMemo(() => solveTightBinding({ t, epsilon, a, N: 200, dimension: dim }), [t, epsilon, a, dim]);

  const dispersionData = result.kValues.map((k, i) => ({
    k: parseFloat(k.toFixed(4)),
    tightBinding: parseFloat(result.energies[i].toFixed(4)),
    freeElectron: parseFloat(result.freeElectron[i].toFixed(4)),
  }));

  const dosData = result.dos.map(d => ({
    energy: parseFloat(d.energy.toFixed(3)),
    density: parseFloat(d.density.toFixed(4)),
  }));

  const bandwidth = Math.max(...result.energies) - Math.min(...result.energies);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
          <div className="flex gap-2">
            {(["1D", "2D"] as const).map(d => (
              <button key={d} onClick={() => setDim(d)}
                className={`flex-1 text-xs py-2 rounded-md border transition-colors ${
                  dim === d ? "bg-primary/15 border-primary/30 text-primary font-medium" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                }`}
              >{d} Lattice</button>
            ))}
          </div>
          <SliderRow label="t (Hopping)" value={t} min={0.1} max={5} step={0.1} onChange={setT} unit=" eV" />
          <SliderRow label="ε₀ (On-site Energy)" value={epsilon} min={-5} max={5} step={0.1} onChange={setEpsilon} unit=" eV" />
          <SliderRow label="a (Lattice Constant)" value={a} min={1} max={6} step={0.1} onChange={setA} unit=" Å" />

          <div className="pt-3 border-t border-border/30 space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Results</h4>
            <p className="text-xs text-muted-foreground">Bandwidth: <span className="font-mono text-primary">{bandwidth.toFixed(3)} eV</span></p>
            <p className="text-xs text-muted-foreground">E(k=0): <span className="font-mono text-primary">{(dim === "1D" ? epsilon - 2 * t : epsilon - 4 * t).toFixed(3)} eV</span></p>
            <p className="text-xs text-muted-foreground">
              {dim === "1D" ? "E(k) = ε₀ − 2t·cos(ka)" : "E(k) = ε₀ − 2t·[cos(kₓa) + cos(k_ya)]"}
            </p>
          </div>
        </GlassCard>

        {/* Dispersion */}
        <GlassCard className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Energy Band Dispersion</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispersionData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="k" type="number" domain={["auto", "auto"]}
                  label={{ value: "k (1/Å)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "E (eV)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="tightBinding" stroke="hsl(195, 100%, 50%)" dot={false} strokeWidth={2} name="Tight-Binding" />
                <Line dataKey="freeElectron" stroke="hsl(40, 90%, 55%)" dot={false} strokeWidth={1.5} strokeDasharray="5 5" name="Free Electron" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* DOS */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Density of States (DOS)</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dosData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="energy" type="number" domain={["auto", "auto"]}
                label={{ value: "E (eV)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                stroke="hsl(222, 30%, 25%)" />
              <YAxis label={{ value: "g(E)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                stroke="hsl(222, 30%, 25%)" />
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="density" fill="hsl(280, 80%, 65%)" opacity={0.7} name="DOS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
