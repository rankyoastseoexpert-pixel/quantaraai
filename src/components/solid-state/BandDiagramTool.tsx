import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { computeBandDiagram, type MaterialType } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, Area, ComposedChart } from "recharts";
import { Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

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

const BAND_DERIVATION = [
  {
    title: "Nearly Free Electron Model",
    content: "Starting from free electrons E = ℏ²k²/2m, we add a weak periodic potential V(x) = ΣG V_G e^{iGx}. Perturbation theory at zone boundaries (k = nπ/a) lifts the degeneracy, opening band gaps.",
    equation: "E±(k) = (E⁰_k + E⁰_{k-G})/2 ± √[(E⁰_k − E⁰_{k-G})²/4 + |V_G|²]"
  },
  {
    title: "Band Gap at Zone Boundary",
    content: "At k = π/a (zone boundary), free electron states k and k − G are degenerate. The periodic potential lifts this degeneracy by 2|V_G|. This is the origin of band gaps in crystalline solids.",
    equation: "E_gap = 2|V_G|  (gap opened by G-th Fourier component of V)"
  },
  {
    title: "Effective Mass Approximation",
    content: "Near band extrema, E(k) is approximately parabolic. The curvature defines an effective mass m* that governs electron dynamics in the crystal. Lighter m* → higher mobility → better conductor.",
    equation: "1/m* = (1/ℏ²) · d²E/dk²  |  F = m* · a  (Newton's law with m*)"
  },
  {
    title: "Conduction & Valence Bands",
    content: "The highest filled band is the valence band (VB). The lowest empty band is the conduction band (CB). The energy gap E_g between them determines the material type: metal (E_g = 0), semiconductor (E_g ~ 0.5–3 eV), insulator (E_g > 4 eV).",
    equation: "E_g = E_CB(min) − E_VB(max)"
  },
  {
    title: "Fermi Level Position",
    content: "The Fermi level E_F is the chemical potential at T = 0. In intrinsic semiconductors, E_F lies near mid-gap. In metals, E_F is within a band. The Fermi-Dirac distribution governs occupation:",
    equation: "f(E) = 1 / [exp((E − E_F)/k_BT) + 1]"
  },
  {
    title: "Semiconductor Classification",
    content: "Direct gap: VB maximum and CB minimum at same k (e.g., GaAs — efficient light emission). Indirect gap: at different k (e.g., Si — requires phonon for optical transition). Doping shifts E_F toward CB (n-type) or VB (p-type).",
    equation: "n = N_C · exp(−(E_C − E_F)/k_BT)  (electron concentration)"
  },
];

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

  const handleExportPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f1a"; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#fff"; ctx.font = "bold 22px Inter";
    ctx.fillText(`Band Diagram — ${MATERIAL_INFO[materialType].label}`, 40, 40);
    ctx.font = "14px JetBrains Mono";
    ctx.fillStyle = "#a0afc8";
    ctx.fillText(`Band Gap: ${result.bandGap.toFixed(3)} eV | Fermi Level: ${fermiLevel.toFixed(2)} eV | m* = ${effectiveMass} mₑ`, 40, 70);
    const link = document.createElement("a");
    link.download = "band-diagram.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleExportPDF = () => {
    exportChartAsPDF(`Band Diagram — ${MATERIAL_INFO[materialType].label}`, [
      `Material: ${MATERIAL_INFO[materialType].label} | Band Gap: ${result.bandGap.toFixed(3)} eV`,
      `m* = ${effectiveMass} mₑ | a = ${latticeSpacing} Å | V = ${potentialStrength} eV | E_F = ${fermiLevel} eV`,
    ], "band-chart");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2" id="band-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">Energy Band Diagram</h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  <linearGradient id="condGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="valGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="k" type="number" domain={["auto", "auto"]}
                  label={{ value: "k (Å⁻¹)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "E (eV)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `k = ${Number(v).toFixed(4)} Å⁻¹`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="conduction" fill="url(#condGrad)" stroke="none" />
                <Area dataKey="valence" fill="url(#valGrad)" stroke="none" />
                <Line dataKey="conduction" stroke="hsl(195, 100%, 50%)" dot={false} strokeWidth={2.5} name="Conduction Band" animationDuration={800} />
                <Line dataKey="valence" stroke="hsl(280, 80%, 65%)" dot={false} strokeWidth={2.5} name="Valence Band" animationDuration={800} />
                <ReferenceLine y={fermiLevel} stroke="hsl(40, 90%, 55%)" strokeDasharray="8 4" strokeWidth={2}
                  label={{ value: "E_F", position: "right", fill: "hsl(40, 90%, 55%)", fontSize: 12, fontWeight: "bold" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Band Gap", value: result.bandGap.toFixed(3), unit: "eV", color: "text-primary" },
          { label: "Fermi Level", value: fermiLevel.toFixed(2), unit: "eV", color: "text-accent" },
          { label: "Material", value: MATERIAL_INFO[materialType].label, unit: MATERIAL_INFO[materialType].desc, color: "text-foreground" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.unit}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Derivation */}
      <DerivationBlock title="Energy Band Theory Derivation" steps={BAND_DERIVATION} />
    </div>
  );
}
