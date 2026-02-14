import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import ScienceBackground from "@/components/ScienceBackground";
import QuantumDerivationView from "@/components/QuantumDerivationView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Download, Atom, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  derivationDatabase,
  detectEquationAdvanced,
  operators,
  diffRules,
  type FullDerivation,
} from "@/lib/quantumEngine";

// ── Visualization presets (unchanged) ──
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

// Expanded symbol palette — full operator support
const symbolGroups = [
  {
    label: "Math",
    symbols: ["+", "−", "×", "÷", "^", "=", "≈", "≠", "≤", "≥", "±"],
  },
  {
    label: "Calculus",
    symbols: ["∂", "d/dx", "∇", "∇²", "∫", "Σ", "lim", "∞", "→"],
  },
  {
    label: "Quantum",
    symbols: ["ℏ", "ψ", "ω", "Ĥ", "p̂", "x̂", "L̂", "Ŝ", "Â", "⟨", "⟩", "|", "†", "⊗"],
  },
  {
    label: "Greek",
    symbols: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "π", "σ", "φ", "χ"],
  },
];

// Equation presets for the solver — maps to derivation database keys
const equationPresets = [
  { key: "tdse", name: "Time-Dependent Schrödinger (TDSE)", eq: "iℏ ∂ψ/∂t = Ĥψ" },
  { key: "tise", name: "Time-Independent Schrödinger (TISE)", eq: "Ĥψ = Eψ" },
  { key: "harmonic_oscillator", name: "Quantum Harmonic Oscillator", eq: "Ĥ = p̂²/(2m) + ½mω²x̂²" },
  { key: "hydrogen_atom", name: "Hydrogen Atom", eq: "[-ℏ²/(2μ)∇² - e²/(4πε₀r)]ψ = Eψ" },
  { key: "angular_momentum", name: "Angular Momentum Operator", eq: "L̂ = r̂ × p̂" },
  { key: "expectation", name: "Expectation Value", eq: "⟨Â⟩ = ∫ ψ* Â ψ dx" },
  { key: "momentum", name: "Momentum Operator", eq: "p̂ = -iℏ d/dx" },
  { key: "planck", name: "Planck Relation", eq: "E = hf = ℏω" },
  { key: "debroglie", name: "de Broglie Relation", eq: "λ = h/p = ℏk" },
  { key: "probability_current", name: "Probability Current", eq: "J = (ℏ/m) Im(ψ* ∂ψ/∂x)" },
];

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
        const psi = Math.cos(k * x);
        points.push({ x: parseFloat(x.toFixed(4)), psi: parseFloat(psi.toFixed(6)), prob: 1 });
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
  const [derivation, setDerivation] = useState<FullDerivation | null>(null);
  const [showOperatorRef, setShowOperatorRef] = useState(false);
  const [showRulesRef, setShowRulesRef] = useState(false);

  const graphData = useMemo(() => {
    if (!activePreset) return null;
    return generateQuantumData(activePreset, quantumN);
  }, [activePreset, quantumN]);

  const energyLevels = useMemo(() => {
    if (!activePreset) return [];
    return getEnergyLevels(activePreset);
  }, [activePreset]);

  const hasPotential = graphData?.some(d => d.potential !== undefined);

  const handleSolve = () => {
    const detected = detectEquationAdvanced(input);
    if (detected && derivationDatabase[detected]) {
      // Clear first, then set after a tick to force re-render of animation
      setDerivation(null);
      setTimeout(() => setDerivation(derivationDatabase[detected]()), 50);
    } else {
      setDerivation({
        title: "Equation Not Recognized",
        equation: input || "(empty)",
        operatorForm: "—",
        differentialForm: "—",
        steps: [{
          rule: "Detection Failed",
          formula: "No matching equation pattern found",
          action: "Try entering one of the supported equations or use a preset below",
          result: "Supported: TDSE, TISE, Harmonic Oscillator, Hydrogen Atom, Angular Momentum, Expectation Value, Momentum, Planck, de Broglie, Probability Current",
        }],
        finalAnswer: "Please select a preset or enter a recognized quantum equation",
        physicalMeaning: "",
        method: "",
        notes: [],
      });
    }
  };

  const handleDerive = () => handleSolve(); // Same as solve — full derivation
  
  const handleExplain = () => {
    const detected = detectEquationAdvanced(input);
    if (detected && derivationDatabase[detected]) {
      const d = derivationDatabase[detected]();
      // Show only the highlighted (key) steps for a quicker explanation
      const keySteps = d.steps.filter(s => s.highlight);
      setDerivation(null);
      setTimeout(() => setDerivation({
        ...d,
        title: `Quick Explanation: ${d.title.split("—")[0].trim()}`,
        steps: keySteps.length > 0 ? keySteps : d.steps.slice(0, 3),
      }), 50);
    } else {
      handleSolve();
    }
  };

  const loadPreset = (key: string) => {
    const preset = equationPresets.find(p => p.key === key);
    if (preset) {
      setInput(preset.eq);
    }
  };

  return (
    <PageLayout>
      <ScienceBackground />
      <div className="container px-4 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Quantum <span className="text-gradient">Solver</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Research-grade step-by-step symbolic derivation engine with full operator support.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ═══ Left: Editor ═══ */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Equation Editor</h2>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter quantum equation (e.g. iℏ ∂ψ/∂t = Ĥψ, Ĥψ = Eψ, ½mω²x², L̂ = r̂ × p̂)..."
                className="w-full h-32 bg-secondary/50 border border-border rounded-lg p-3 font-mono text-sm text-foreground resize-none focus:outline-none focus:border-primary/50"
              />

              {/* Symbol palette — grouped */}
              <div className="mt-3 space-y-2">
                {symbolGroups.map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{group.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.symbols.map(s => (
                        <button
                          key={s}
                          onClick={() => setInput(prev => prev + s)}
                          className="h-7 min-w-[28px] px-1.5 rounded-md bg-secondary/70 border border-border text-primary font-mono text-xs hover:bg-primary/15 hover:border-primary/30 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSolve}>
                  <Play size={12} /> Solve
                </Button>
                <Button size="sm" variant="outline" className="border-border" onClick={handleDerive}>Derive</Button>
                <Button size="sm" variant="outline" className="border-border gap-1.5" onClick={handleExplain}>
                  <BookOpen size={12} /> Explain
                </Button>
              </div>
            </GlassCard>

            {/* Equation Presets */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Equation Presets</h2>
              <div className="space-y-1">
                {equationPresets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => loadPreset(preset.key)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-secondary/70 text-muted-foreground border border-transparent hover:border-border/50"
                  >
                    <div className="font-medium text-foreground text-xs">{preset.name}</div>
                    <div className="font-mono text-[10px] mt-0.5 text-primary/70">{preset.eq}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Operator Reference */}
            <GlassCard>
              <button
                onClick={() => setShowOperatorRef(!showOperatorRef)}
                className="w-full text-left text-sm font-semibold text-foreground flex items-center justify-between"
              >
                Operator Reference
                <span className="text-xs text-primary">{showOperatorRef ? "▼" : "▶"}</span>
              </button>
              {showOperatorRef && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  {Object.values(operators).map(op => (
                    <div key={op.symbol} className="text-xs border border-border/30 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-primary font-bold">{op.symbol}</span>
                        <span className="text-foreground font-medium">{op.name}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{op.differentialForm}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </GlassCard>

            {/* Differentiation Rules Reference */}
            <GlassCard>
              <button
                onClick={() => setShowRulesRef(!showRulesRef)}
                className="w-full text-left text-sm font-semibold text-foreground flex items-center justify-between"
              >
                Differentiation Rules
                <span className="text-xs text-primary">{showRulesRef ? "▼" : "▶"}</span>
              </button>
              {showRulesRef && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  {Object.values(diffRules).map(rule => (
                    <div key={rule.name} className="text-xs border border-border/30 rounded-lg p-2">
                      <div className="font-medium text-foreground mb-0.5">{rule.name}</div>
                      <div className="font-mono text-[10px] text-primary/70">{rule.formula}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </GlassCard>

            {/* Visualization Presets */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Visualization Presets</h2>
              <div className="space-y-2">
                {quantumPresets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => { setActivePreset(p.name); setQuantumN(1); }}
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

          {/* ═══ Right: Output ═══ */}
          <div className="lg:col-span-3 space-y-4">
            {/* Derivation Output — the main upgrade */}
            {derivation && (
              <QuantumDerivationView derivation={derivation} />
            )}

            {/* Graph */}
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
                    <p className="text-sm text-muted-foreground">Select a visualization preset to see the wavefunction</p>
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
                <Button size="sm" onClick={() => setPlaying(!playing)} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  {playing ? <Pause size={12} /> : <Play size={12} />}
                  {playing ? "Pause" : "Play"}
                </Button>
                <Button size="sm" variant="outline" className="border-border">
                  <SkipForward size={12} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Time", id: "time" }, { label: "Speed", id: "speed" }, { label: "Grid Size", id: "grid" }, { label: "dt", id: "dt" }].map(ctrl => (
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
