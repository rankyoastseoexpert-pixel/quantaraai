import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Download, Atom } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const quantumPresets = [
  { name: "Particle in a Box", eq: "ψₙ(x) = √(2/L) sin(nπx/L)" },
  { name: "Harmonic Oscillator", eq: "ψₙ(x) = Hₙ(x) e^{-x²/2}" },
  { name: "Free Particle", eq: "ψ(x) = Ae^{ikx}" },
  { name: "Finite Well", eq: "V(x) = -V₀ for |x| < a" },
  { name: "Step Potential", eq: "V(x) = V₀ θ(x)" },
  { name: "Delta Potential", eq: "V(x) = -αδ(x)" },
  { name: "Spin-½ System", eq: "σ = (σₓ, σᵧ, σ_z)" },
  { name: "Two-Level System", eq: "H = ε σ_z + Δ σₓ" },
];

const symbols = ["ℏ", "ω", "ψ", "∇", "i", "∂", "Ĥ", "⟨", "⟩", "σ", "†", "⊗"];

// Generate quantum data for presets
function generateQuantumData(preset: string, n: number = 1) {
  const points: { x: number; psi: number; prob: number; potential?: number }[] = [];
  const L = 1;
  const N = 200;

  switch (preset) {
    case "Particle in a Box":
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * L;
        const psi = Math.sqrt(2 / L) * Math.sin(n * Math.PI * x / L);
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)) });
      }
      break;
    case "Harmonic Oscillator": {
      // Hermite-Gaussian functions
      for (let i = 0; i <= N; i++) {
        const x = -4 + (8 * i / N);
        let hermite: number;
        switch (n) {
          case 1: hermite = 1; break;
          case 2: hermite = 2 * x; break;
          case 3: hermite = 4 * x * x - 2; break;
          default: hermite = 8 * x * x * x - 12 * x;
        }
        const psi = hermite * Math.exp(-x * x / 2);
        const potential = 0.5 * x * x;
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)), potential: parseFloat(potential.toFixed(4)) });
      }
      break;
    }
    case "Free Particle":
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const k = n;
        const psi = Math.cos(k * x); // Real part of e^(ikx)
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: 1 }); // |e^ikx|^2 = 1
      }
      break;
    case "Step Potential": {
      const V0 = 2;
      const E = 1.5;
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const potential = x >= 0 ? V0 : 0;
        let psi: number;
        if (x < 0) {
          psi = Math.cos(Math.sqrt(2 * E) * x);
        } else {
          const kappa = Math.sqrt(2 * Math.abs(V0 - E));
          psi = Math.exp(-kappa * x);
        }
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)), potential: parseFloat(potential.toFixed(4)) });
      }
      break;
    }
    case "Delta Potential":
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const psi = Math.exp(-Math.abs(x));
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)) });
      }
      break;
    case "Finite Well": {
      const a = 2;
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const potential = Math.abs(x) < a ? -3 : 0;
        let psi: number;
        if (Math.abs(x) < a) {
          psi = Math.cos(n * Math.PI * x / (2 * a));
        } else {
          psi = Math.cos(n * Math.PI / 2) * Math.exp(-Math.abs(x - (x > 0 ? a : -a)));
        }
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)), potential: parseFloat(potential.toFixed(4)) });
      }
      break;
    }
    default:
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const psi = Math.exp(-x * x / 2) * Math.cos(3 * x);
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: parseFloat((psi * psi).toFixed(6)) });
      }
  }
  return points;
}

function getEnergyLevels(preset: string): string[] {
  switch (preset) {
    case "Particle in a Box":
      return ["E₁ = π²ℏ²/(2mL²)", "E₂ = 4π²ℏ²/(2mL²)", "E₃ = 9π²ℏ²/(2mL²)", "Eₙ = n²π²ℏ²/(2mL²)"];
    case "Harmonic Oscillator":
      return ["E₀ = ½ℏω", "E₁ = 3/2 ℏω", "E₂ = 5/2 ℏω", "Eₙ = (n+½)ℏω"];
    case "Free Particle":
      return ["E = ℏ²k²/(2m)", "Continuous spectrum", "No bound states"];
    default:
      return ["Select a preset to see energy levels"];
  }
}

const QuantumSolver = () => {
  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [quantumN, setQuantumN] = useState(1);

  const graphData = useMemo(() => {
    if (!activePreset) return null;
    return generateQuantumData(activePreset, quantumN);
  }, [activePreset, quantumN]);

  const energyLevels = useMemo(() => {
    if (!activePreset) return [];
    return getEnergyLevels(activePreset);
  }, [activePreset]);

  const hasPotential = graphData?.some(d => d.potential !== undefined);

  return (
    <PageLayout>
      <div className="container px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Quantum <span className="text-gradient">Solver</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Solve quantum systems with wavefunctions, probability densities, and time evolution.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Editor */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Equation Editor</h2>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter quantum equation (LaTeX supported)..."
                className="w-full h-32 bg-secondary/50 border border-border rounded-lg p-3 font-mono text-sm text-foreground resize-none focus:outline-none focus:border-primary/50"
              />

              {/* Symbol palette */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {symbols.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(prev => prev + s)}
                    className="h-8 w-8 rounded-md bg-secondary/70 border border-border text-primary font-mono text-sm hover:bg-primary/15 hover:border-primary/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play size={12} /> Solve
                </Button>
                <Button size="sm" variant="outline" className="border-border">Derive</Button>
                <Button size="sm" variant="outline" className="border-border">Explain</Button>
              </div>
            </GlassCard>

            {/* Presets */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Presets</h2>
              <div className="space-y-2">
                {quantumPresets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => { setActivePreset(p.name); setInput(p.eq); setQuantumN(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      activePreset === p.name
                        ? "bg-primary/15 border border-primary/30 text-primary"
                        : "hover:bg-secondary/70 text-muted-foreground border border-transparent"
                    }`}
                  >
                    <div className="font-medium text-foreground text-xs">{p.name}</div>
                    <div className="font-mono text-xs mt-0.5 opacity-70">{p.eq}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Quantum number selector */}
            {activePreset && (
              <GlassCard>
                <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Number n</h2>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <Button
                      key={n}
                      size="sm"
                      variant={quantumN === n ? "default" : "outline"}
                      onClick={() => setQuantumN(n)}
                      className={quantumN === n ? "bg-primary text-primary-foreground" : "border-border"}
                    >
                      n={n}
                    </Button>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="min-h-[300px]">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Wavefunction ψ(x) {activePreset && `— ${activePreset} (n=${quantumN})`}
              </h2>
              {graphData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="psi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="ψ(x)" />
                    <Line type="monotone" dataKey="prob" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="|ψ|²" strokeDasharray="4 2" />
                    {hasPotential && <Line type="monotone" dataKey="potential" stroke="#f59e0b" strokeWidth={1} dot={false} name="V(x)" strokeDasharray="6 3" />}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="rounded-lg border border-border/50 bg-secondary/20 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Atom className="h-12 w-12 text-primary/30 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">Select a preset or enter an equation to visualize</p>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Energy Levels */}
            {energyLevels.length > 0 && activePreset && (
              <GlassCard>
                <h2 className="text-sm font-semibold text-foreground mb-3">Energy Levels</h2>
                <div className="space-y-1.5">
                  {energyLevels.map((e, i) => (
                    <div key={i} className="text-sm font-mono text-primary/90 px-3 py-1.5 rounded bg-primary/5 border border-primary/10">
                      {e}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* TDSE Controls */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">TDSE Simulation Controls</h2>
              <div className="flex items-center gap-3 mb-4">
                <Button
                  size="sm"
                  onClick={() => setPlaying(!playing)}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {playing ? <Pause size={12} /> : <Play size={12} />}
                  {playing ? "Pause" : "Play"}
                </Button>
                <Button size="sm" variant="outline" className="border-border">
                  <SkipForward size={12} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Time", id: "time" },
                  { label: "Speed", id: "speed" },
                  { label: "Grid Size", id: "grid" },
                  { label: "dt", id: "dt" },
                ].map(ctrl => (
                  <div key={ctrl.id}>
                    <label className="text-xs text-muted-foreground mb-1 block">{ctrl.label}</label>
                    <Input className="bg-secondary/50 border-border font-mono text-sm h-8" placeholder="0" />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Export */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Export</h2>
              <div className="flex flex-wrap gap-2">
                {["SVG", "PNG", "JSON", "PDF"].map(fmt => (
                  <Button key={fmt} variant="outline" size="sm" className="gap-1.5 border-border hover:bg-primary/10 hover:text-primary">
                    <Download size={12} /> {fmt}
                  </Button>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default QuantumSolver;
