import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, ComposedChart, Area } from "recharts";
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

interface PhononResult {
  qValues: number[];
  acoustic: number[];
  optical: number[];
  groupVelocityAcoustic: number[];
  groupVelocityOptical: number[];
  dos: { freq: number; density: number }[];
}

function computePhononDispersion(
  M1: number, M2: number, k_spring: number, a: number, N: number
): PhononResult {
  const qValues: number[] = [];
  const acoustic: number[] = [];
  const optical: number[] = [];
  const groupVelocityAcoustic: number[] = [];
  const groupVelocityOptical: number[] = [];

  const mu = (M1 * M2) / (M1 + M2); // reduced mass

  for (let i = 0; i < N; i++) {
    const q = -Math.PI / a + (2 * Math.PI / a) * i / (N - 1);
    qValues.push(q);

    const sinTerm = Math.sin(q * a / 2);
    const sin2 = sinTerm * sinTerm;

    // Diatomic chain: ω² = k(1/M1 + 1/M2) ∓ k√((1/M1+1/M2)² - 4sin²(qa/2)/(M1·M2))
    const sum_inv = 1 / M1 + 1 / M2;
    const discriminant = sum_inv * sum_inv - 4 * sin2 / (M1 * M2);
    const disc_safe = Math.max(discriminant, 0);

    const omega2_acoustic = k_spring * (sum_inv - Math.sqrt(disc_safe));
    const omega2_optical = k_spring * (sum_inv + Math.sqrt(disc_safe));

    acoustic.push(Math.sqrt(Math.max(omega2_acoustic, 0)));
    optical.push(Math.sqrt(Math.max(omega2_optical, 0)));
  }

  // Group velocity dω/dq via finite differences
  const dq = qValues.length > 2 ? qValues[1] - qValues[0] : 1;
  for (let i = 0; i < N; i++) {
    const ip = Math.min(i + 1, N - 1);
    const im = Math.max(i - 1, 0);
    const dq2 = qValues[ip] - qValues[im] || dq;
    groupVelocityAcoustic.push((acoustic[ip] - acoustic[im]) / dq2);
    groupVelocityOptical.push((optical[ip] - optical[im]) / dq2);
  }

  // DOS via histogram of all frequencies
  const allFreqs = [...acoustic, ...optical];
  const fMax = Math.max(...allFreqs) * 1.05;
  const nBins = 80;
  const df = fMax / nBins || 0.1;
  const bins = new Array(nBins).fill(0);
  for (const f of allFreqs) {
    const idx = Math.min(Math.floor(f / df), nBins - 1);
    if (idx >= 0) bins[idx]++;
  }
  const dos = bins.map((count, i) => ({
    freq: (i + 0.5) * df,
    density: count / (2 * N * df),
  }));

  return { qValues, acoustic, optical, groupVelocityAcoustic, groupVelocityOptical, dos };
}

const PHONON_DERIVATION = [
  {
    title: "Equations of Motion for Diatomic Chain",
    content: "Consider a 1D chain with alternating masses M₁ and M₂ connected by springs of constant K. Let u_n and v_n be displacements of the two sublattices in the n-th unit cell.",
    equation: "M₁ ü_n = K(v_n + v_{n-1} − 2u_n)\nM₂ v̈_n = K(u_{n+1} + u_n − 2v_n)"
  },
  {
    title: "Plane-Wave Ansatz",
    content: "Assume travelling wave solutions u_n = A·exp[i(qna − ωt)] and v_n = B·exp[i(qna − ωt)]. Substituting into the equations of motion yields a 2×2 eigenvalue problem.",
    equation: "u_n = A·e^{i(qna − ωt)},  v_n = B·e^{i(qna − ωt)}"
  },
  {
    title: "Secular (Characteristic) Equation",
    content: "The eigenvalue condition gives a quadratic in ω². The two solutions correspond to the acoustic (−) and optical (+) branches. The discriminant depends on sin²(qa/2).",
    equation: "ω² = K(1/M₁ + 1/M₂) ∓ K√[(1/M₁ + 1/M₂)² − (4 sin²(qa/2))/(M₁M₂)]"
  },
  {
    title: "Acoustic Branch (ω₋)",
    content: "At long wavelengths (q → 0), ω ∝ |q| (linear dispersion, like sound waves). Both atoms move in phase (A ≈ B). The slope gives the speed of sound: v_s = a√(K/2M) for M₁ = M₂ = M.",
    equation: "ω_acoustic → |q|·a·√(K / 2(M₁ + M₂))  as q → 0"
  },
  {
    title: "Optical Branch (ω₊)",
    content: "At q = 0, the optical frequency is finite: ω_opt = √(2K·(1/M₁ + 1/M₂)). Atoms in the unit cell oscillate out of phase (A = −(M₂/M₁)B). This mode couples to electromagnetic radiation in ionic crystals.",
    equation: "ω_optical(q=0) = √[2K(1/M₁ + 1/M₂)]"
  },
  {
    title: "Phonon Gap & Density of States",
    content: "A frequency gap exists between max(acoustic) and min(optical) when M₁ ≠ M₂. The gap width increases with mass ratio. The phonon DOS g(ω) shows Van Hove singularities at band edges due to vanishing group velocity.",
    equation: "Gap = ω_opt(π/a) − ω_ac(π/a) = √(2K/M₂) − √(2K/M₁)  (M₁ > M₂)"
  },
];

export default function PhononDispersion() {
  const [M1, setM1] = useState(28); // amu (e.g. Si)
  const [M2, setM2] = useState(12); // amu (e.g. C)
  const [kSpring, setKSpring] = useState(10); // spring constant (arb.)
  const [latticeA, setLatticeA] = useState(3); // Å
  const [showDOS, setShowDOS] = useState(true);

  const N = 200;
  const result = useMemo(() => computePhononDispersion(M1, M2, kSpring, latticeA, N), [M1, M2, kSpring, latticeA]);

  const dispersionData = result.qValues.map((q, i) => ({
    q: parseFloat(q.toFixed(4)),
    acoustic: parseFloat(result.acoustic[i].toFixed(4)),
    optical: parseFloat(result.optical[i].toFixed(4)),
    vg_acoustic: parseFloat(result.groupVelocityAcoustic[i].toFixed(4)),
    vg_optical: parseFloat(result.groupVelocityOptical[i].toFixed(4)),
  }));

  const dosData = result.dos.map(d => ({
    freq: parseFloat(d.freq.toFixed(4)),
    density: parseFloat(d.density.toFixed(6)),
  }));

  const omegaMaxAcoustic = Math.max(...result.acoustic);
  const omegaMinOptical = Math.min(...result.optical);
  const omegaMaxOptical = Math.max(...result.optical);
  const phononGap = omegaMinOptical - omegaMaxAcoustic;

  const handleExportPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f1a"; ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#fff"; ctx.font = "bold 22px Inter";
    ctx.fillText("Phonon Dispersion — Diatomic Chain", 40, 40);
    ctx.font = "14px JetBrains Mono"; ctx.fillStyle = "#a0afc8";
    ctx.fillText(`M₁ = ${M1} amu | M₂ = ${M2} amu | K = ${kSpring} | a = ${latticeA} Å`, 40, 70);
    ctx.fillText(`Phonon gap: ${phononGap.toFixed(3)} (arb. units)`, 40, 95);
    const link = document.createElement("a");
    link.download = "phonon-dispersion.png"; link.href = canvas.toDataURL(); link.click();
  };

  const handleExportPDF = () => {
    exportChartAsPDF("Phonon Dispersion — Diatomic Chain", [
      `M₁ = ${M1} amu | M₂ = ${M2} amu | K = ${kSpring} | a = ${latticeA} Å`,
      `ω_max(acoustic) = ${omegaMaxAcoustic.toFixed(3)} | ω_max(optical) = ${omegaMaxOptical.toFixed(3)}`,
      `Phonon gap: ${phononGap.toFixed(3)} (arb. units)`,
    ], "phonon-chart");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
          <SliderRow label="M₁ (Mass 1)" value={M1} min={1} max={100} step={1} onChange={setM1} unit=" amu" />
          <SliderRow label="M₂ (Mass 2)" value={M2} min={1} max={100} step={1} onChange={setM2} unit=" amu" />
          <SliderRow label="K (Spring Constant)" value={kSpring} min={1} max={50} step={0.5} onChange={setKSpring} unit="" />
          <SliderRow label="a (Lattice Constant)" value={latticeA} min={1} max={8} step={0.1} onChange={setLatticeA} unit=" Å" />

          <div className="pt-3 border-t border-border/30 space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Computed Values</h4>
            <p className="text-xs text-muted-foreground font-mono">μ = {((M1*M2)/(M1+M2)).toFixed(2)} amu (reduced mass)</p>
            <p className="text-xs text-muted-foreground font-mono">ω_opt(q=0) = {result.optical[Math.floor(N/2)]?.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground font-mono">v_sound ≈ {(result.acoustic[Math.floor(N/2)+1] / (result.qValues[Math.floor(N/2)+1] || 1)).toFixed(3)} Å·ω/q</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setShowDOS(!showDOS)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${showDOS ? "bg-primary/15 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/50"}`}>
              {showDOS ? "Hide" : "Show"} DOS
            </button>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        {/* Dispersion chart */}
        <GlassCard className="p-5 lg:col-span-2" id="phonon-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">ω(q) Dispersion Relation</h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dispersionData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  <linearGradient id="acGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(150, 70%, 50%)" stopOpacity={0} />
                    <stop offset="100%" stopColor="hsl(150, 70%, 50%)" stopOpacity={0.12} />
                  </linearGradient>
                  <linearGradient id="opGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(350, 80%, 60%)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="hsl(350, 80%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="q" type="number" domain={["auto", "auto"]}
                  label={{ value: "q (Å⁻¹)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "ω (arb.)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `q = ${Number(v).toFixed(4)} Å⁻¹`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="acoustic" fill="url(#acGrad)" stroke="none" />
                <Area dataKey="optical" fill="url(#opGrad)" stroke="none" />
                <Line dataKey="acoustic" stroke="hsl(150, 70%, 50%)" dot={false} strokeWidth={2.5} name="Acoustic" animationDuration={800} />
                <Line dataKey="optical" stroke="hsl(350, 80%, 60%)" dot={false} strokeWidth={2.5} name="Optical" animationDuration={800} />
                <ReferenceLine x={0} stroke="hsl(215, 20%, 35%)" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Group velocity chart */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Group Velocity v_g = dω/dq</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dispersionData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="q" type="number" domain={["auto", "auto"]}
                label={{ value: "q (Å⁻¹)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
              <YAxis label={{ value: "v_g (Å·ω)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
              <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="vg_acoustic" stroke="hsl(150, 70%, 50%)" dot={false} strokeWidth={1.5} name="Acoustic v_g" />
              <Line dataKey="vg_optical" stroke="hsl(350, 80%, 60%)" dot={false} strokeWidth={1.5} name="Optical v_g" />
              <ReferenceLine y={0} stroke="hsl(215, 20%, 35%)" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* DOS */}
      {showDOS && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Phonon Density of States g(ω)</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dosData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  <linearGradient id="dosPhononGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(40, 90%, 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(40, 90%, 55%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="freq" type="number" domain={["auto", "auto"]}
                  label={{ value: "ω (arb.)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "g(ω)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }} />
                <Area dataKey="density" fill="url(#dosPhononGrad)" stroke="hsl(40, 90%, 55%)" strokeWidth={2} name="g(ω)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "ω_max (Acoustic)", value: omegaMaxAcoustic.toFixed(3), color: "text-primary" },
          { label: "ω_max (Optical)", value: omegaMaxOptical.toFixed(3), color: "text-destructive" },
          { label: "Phonon Gap", value: phononGap > 0 ? phononGap.toFixed(3) : "None", color: phononGap > 0 ? "text-accent" : "text-muted-foreground" },
          { label: "Mass Ratio", value: (Math.max(M1,M2)/Math.min(M1,M2)).toFixed(2), color: "text-foreground" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <DerivationBlock title="Phonon Dispersion — Diatomic Chain Derivation" steps={PHONON_DERIVATION} />
    </div>
  );
}
