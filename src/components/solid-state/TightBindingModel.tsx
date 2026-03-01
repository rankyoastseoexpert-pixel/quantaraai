import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveTightBinding } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
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

const TB_DERIVATION = [
  {
    title: "Tight-Binding Hamiltonian",
    content: "The tight-binding model starts from isolated atomic orbitals |φₙ⟩ at each lattice site n. The Hamiltonian consists of on-site energy ε₀ and nearest-neighbor hopping integral t.",
    equation: "H = Σₙ ε₀ |n⟩⟨n| − t Σ_{⟨n,m⟩} (|n⟩⟨m| + |m⟩⟨n|)"
  },
  {
    title: "Bloch State Construction",
    content: "We construct Bloch states as superpositions of atomic orbitals with phase factors. For N sites with periodic boundary conditions:",
    equation: "|ψ_k⟩ = (1/√N) Σₙ e^{ikna} |φₙ⟩"
  },
  {
    title: "1D Dispersion Relation",
    content: "Acting H on |ψ_k⟩ and projecting, we obtain the energy eigenvalue. The nearest-neighbor hopping gives a cosine dispersion:",
    equation: "E(k) = ε₀ − 2t·cos(ka)"
  },
  {
    title: "2D Square Lattice Extension",
    content: "For a 2D square lattice with hopping along both axes, the dispersion becomes separable. Each direction contributes independently:",
    equation: "E(kₓ, k_y) = ε₀ − 2t·[cos(kₓa) + cos(k_ya)]"
  },
  {
    title: "Bandwidth",
    content: "The bandwidth W = E_max − E_min measures the total spread of the energy band. In 1D: W = 4t. In 2D square: W = 8t. Larger hopping t → wider bands → more delocalized electrons.",
    equation: "W₁D = 4t,  W₂D = 8t"
  },
  {
    title: "Density of States (DOS)",
    content: "The DOS g(E) counts the number of states per unit energy. In 1D, it exhibits Van Hove singularities at the band edges where the group velocity dE/dk → 0:",
    equation: "g₁D(E) = (N/π) · 1/√[(2t)² − (E − ε₀)²]  (Van Hove singularities at E = ε₀ ± 2t)"
  },
  {
    title: "Comparison with Free Electron Model",
    content: "The free electron gives E = ℏ²k²/2m (parabolic). Tight-binding gives cosine bands. They agree near k ≈ 0 (effective mass approximation) but diverge near zone boundaries where Bragg scattering flattens the TB band.",
    equation: "m* = ℏ²/(d²E/dk²)|_{k=0} = ℏ²/(2ta²)  (effective mass)"
  },
];

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

  const handleExportPDF = () => {
    exportChartAsPDF("Tight-Binding Model — Energy Dispersion & DOS", [
      `Dimension: ${dim} | t = ${t} eV | ε₀ = ${epsilon} eV | a = ${a} Å`,
      `Bandwidth: ${bandwidth.toFixed(3)} eV | E(k=0) = ${(dim === "1D" ? epsilon - 2*t : epsilon - 4*t).toFixed(3)} eV`,
    ], "tb-chart");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <p className="text-xs text-muted-foreground">m* ≈ <span className="font-mono text-primary">{(3.81 / (2 * t * a * a)).toFixed(4)} mₑ</span></p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {dim === "1D" ? "E(k) = ε₀ − 2t·cos(ka)" : "E(k) = ε₀ − 2t·[cos(kₓa) + cos(k_ya)]"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> Export PDF
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2" id="tb-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">Energy Band Dispersion</h3>
          <div className="h-[370px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispersionData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  <linearGradient id="tbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0} />
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
                <Line dataKey="tightBinding" stroke="hsl(195, 100%, 50%)" dot={false} strokeWidth={2.5} name="Tight-Binding" animationDuration={800} />
                <Line dataKey="freeElectron" stroke="hsl(40, 90%, 55%)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" name="Free Electron" animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* DOS */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Density of States (DOS)</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dosData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              <defs>
                <linearGradient id="dosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="energy" type="number" domain={["auto", "auto"]}
                label={{ value: "E (eV)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                stroke="hsl(222, 30%, 25%)" />
              <YAxis label={{ value: "g(E)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                stroke="hsl(222, 30%, 25%)" />
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                labelFormatter={(v) => `E = ${Number(v).toFixed(3)} eV`} />
              <Bar dataKey="density" fill="url(#dosGrad)" name="DOS" animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Derivation */}
      <DerivationBlock title="Tight-Binding Model Derivation" steps={TB_DERIVATION} />
    </div>
  );
}
