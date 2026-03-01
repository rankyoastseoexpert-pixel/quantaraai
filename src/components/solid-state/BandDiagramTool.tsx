import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { computeBandDiagram, type MaterialType } from "@/lib/solidStateEngine";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";
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

const MATERIAL_INFO: Record<MaterialType, { label: string; desc: string; color: string }> = {
  semiconductor: { label: "Semiconductor", desc: "Small band gap (0.5–3 eV)", color: "hsl(195, 100%, 50%)" },
  metal: { label: "Metal", desc: "No band gap, overlapping bands", color: "hsl(40, 90%, 55%)" },
  insulator: { label: "Insulator", desc: "Large band gap (> 4 eV)", color: "hsl(350, 80%, 60%)" },
};

export default function BandDiagramTool() {
  const [effectiveMass, setEffectiveMass] = useState(0.5);
  const [latticeSpacing, setLatticeSpacing] = useState(3);
  const [potentialStrength, setPotentialStrength] = useState(3);
  const [materialType, setMaterialType] = useState<MaterialType>("semiconductor");
  const [fermiLevel, setFermiLevel] = useState(0);

  const result = useMemo(() => computeBandDiagram({
    effectiveMass, latticeSpacing, potentialStrength, materialType, fermiLevel,
  }), [effectiveMass, latticeSpacing, potentialStrength, materialType, fermiLevel]);

  const chartData = result.kValues.map((k, i) => ({
    k: parseFloat(k.toFixed(4)),
    conduction: parseFloat(result.conductionBand[i].toFixed(4)),
    valence: parseFloat(result.valenceBand[i].toFixed(4)),
  }));

  const handleExport = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f1a"; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#fff"; ctx.font = "20px Inter";
    ctx.fillText(`Band Diagram — ${MATERIAL_INFO[materialType].label}`, 40, 40);
    ctx.font = "14px JetBrains Mono";
    ctx.fillText(`Band Gap: ${result.bandGap.toFixed(3)} eV | Fermi Level: ${fermiLevel.toFixed(2)} eV`, 40, 70);
    const link = document.createElement("a");
    link.download = "band-diagram.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Material Type</h3>
          <div className="space-y-1">
            {(Object.entries(MATERIAL_INFO) as [MaterialType, typeof MATERIAL_INFO[MaterialType]][]).map(([key, info]) => (
              <button key={key} onClick={() => setMaterialType(key)}
                className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                  materialType === key ? "bg-primary/15 border-primary/30" : "border-border/50 hover:bg-secondary/50"
                }`}
              >
                <span className={`text-xs font-medium ${materialType === key ? "text-primary" : "text-foreground"}`}>{info.label}</span>
                <p className="text-[10px] text-muted-foreground">{info.desc}</p>
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground pt-2">Parameters</h3>
          <SliderRow label="m* (Effective Mass)" value={effectiveMass} min={0.01} max={2} step={0.01} onChange={setEffectiveMass} unit=" mₑ" />
          <SliderRow label="a (Lattice Spacing)" value={latticeSpacing} min={1} max={8} step={0.1} onChange={setLatticeSpacing} unit=" Å" />
          <SliderRow label="V (Potential Strength)" value={potentialStrength} min={0.5} max={10} step={0.1} onChange={setPotentialStrength} unit=" eV" />
          <SliderRow label="E_F (Fermi Level)" value={fermiLevel} min={-5} max={5} step={0.1} onChange={setFermiLevel} unit=" eV" />

          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5 text-xs w-full">
            <Download size={12} /> Export PNG
          </Button>
        </GlassCard>

        {/* Band Diagram */}
        <GlassCard className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Energy Band Diagram</h3>
          <div className="h-[420px]">
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
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="conduction" stroke="hsl(195, 100%, 50%)" dot={false} strokeWidth={2.5} name="Conduction Band" />
                <Line dataKey="valence" stroke="hsl(280, 80%, 65%)" dot={false} strokeWidth={2.5} name="Valence Band" />
                <ReferenceLine y={fermiLevel} stroke="hsl(40, 90%, 55%)" strokeDasharray="8 4" strokeWidth={2}
                  label={{ value: "E_F", position: "right", fill: "hsl(40, 90%, 55%)", fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Results summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Band Gap</p>
          <p className="text-2xl font-bold font-mono text-primary">{result.bandGap.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">eV</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Fermi Level</p>
          <p className="text-2xl font-bold font-mono text-accent">{fermiLevel.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">eV</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Material</p>
          <p className="text-2xl font-bold text-foreground">{MATERIAL_INFO[materialType].label}</p>
          <p className="text-xs text-muted-foreground">{MATERIAL_INFO[materialType].desc}</p>
        </GlassCard>
      </div>
    </div>
  );
}
