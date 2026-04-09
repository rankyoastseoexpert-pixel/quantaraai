import { useState, useCallback, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import ScienceBackground from "@/components/ScienceBackground";
import QuantumDerivationView from "@/components/QuantumDerivationView";
import LaTeXEquationEditor from "@/components/LaTeXEquationEditor";
import OrbitalViewer3D from "@/components/quantum-solver/OrbitalViewer3D";
import AnalysisGraphs from "@/components/quantum-solver/AnalysisGraphs";
import AdvancedVisualizations from "@/components/quantum-solver/AdvancedVisualizations";
import SCFControlPanel from "@/components/quantum-solver/SCFControlPanel";
import DensityHeatmap from "@/components/quantum-solver/DensityHeatmap";
import EnergyLevelDiagram from "@/components/quantum-solver/EnergyLevelDiagram";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Play, BookOpen, Atom, FlaskConical, Download, Vibrate, MapPin } from "lucide-react";
import {
  derivationDatabase,
  detectEquationAdvanced,
  operators,
  diffRules,
  type FullDerivation,
} from "@/lib/quantumEngine";
import {
  runSCFSolver, generateOrbitalGrid,
  optimizeGeometry, computeVibrationalModes,
  type SCFResult, type ElementType, type SymmetryType, type FunctionalType, type VibrationalMode,
  ELEMENT_DATA,
} from "@/lib/dftSolver";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Visualization presets ──
const quantumPresets = [
  { name: "Particle in a Box", eq: "ψₙ(x) = √(2/L) sin(nπx/L)" },
  { name: "Harmonic Oscillator", eq: "ψₙ(x) = Hₙ(x) e^{-x²/2}" },
  { name: "Free Particle", eq: "ψ(x) = Ae^{ikx}" },
  { name: "Finite Well", eq: "V(x) = -V₀ for |x| < a" },
  { name: "Step Potential", eq: "V(x) = V₀ θ(x)" },
  { name: "Delta Potential", eq: "V(x) = -αδ(x)" },
];

const equationPresets = [
  { key: "tdse", name: "Time-Dependent Schrödinger (TDSE)", eq: "iℏ ∂ψ/∂t = Ĥψ" },
  { key: "tise", name: "Time-Independent Schrödinger (TISE)", eq: "Ĥψ = Eψ" },
  { key: "harmonic_oscillator", name: "Quantum Harmonic Oscillator", eq: "Ĥ = p̂²/(2m) + ½mω²x̂²" },
  { key: "hydrogen_atom", name: "Hydrogen Atom", eq: "[-ℏ²/(2μ)∇² - e²/(4πε₀r)]ψ = Eψ" },
  { key: "angular_momentum", name: "Angular Momentum", eq: "L̂ = r̂ × p̂" },
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
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6) });
      }
      break;
    case "Harmonic Oscillator":
      for (let i = 0; i <= N; i++) {
        const x = -4 + (8 * i / N);
        let hermite: number;
        switch (n) { case 1: hermite = 1; break; case 2: hermite = 2 * x; break; case 3: hermite = 4 * x * x - 2; break; default: hermite = 8 * x * x * x - 12 * x; }
        const psi = hermite * Math.exp(-x * x / 2);
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6), potential: +(0.5 * x * x).toFixed(4) });
      }
      break;
    case "Free Particle":
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const psi = Math.cos(n * x);
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: 1 });
      }
      break;
    case "Step Potential": {
      const V0 = 2, E = 1.5;
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const pot = x >= 0 ? V0 : 0;
        const psi = x < 0 ? Math.cos(Math.sqrt(2 * E) * x) : Math.exp(-Math.sqrt(2 * Math.abs(V0 - E)) * x);
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6), potential: +pot.toFixed(4) });
      }
      break;
    }
    case "Delta Potential":
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const psi = Math.exp(-Math.abs(x));
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6) });
      }
      break;
    case "Finite Well": {
      const a = 2;
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const pot = Math.abs(x) < a ? -3 : 0;
        const psi = Math.abs(x) < a ? Math.cos(n * Math.PI * x / (2 * a)) : Math.cos(n * Math.PI / 2) * Math.exp(-Math.abs(x - (x > 0 ? a : -a)));
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6), potential: +pot.toFixed(4) });
      }
      break;
    }
    default:
      for (let i = 0; i <= N; i++) {
        const x = -5 + (10 * i / N);
        const psi = Math.exp(-x * x / 2) * Math.cos(3 * x);
        points.push({ x: +x.toFixed(4), psi: +psi.toFixed(6), prob: +(psi * psi).toFixed(6) });
      }
  }
  return points;
}

const QuantumSolver = () => {
  // ── Symbolic solver state ──
  const [input, setInput] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [quantumN, setQuantumN] = useState(1);
  const [derivation, setDerivation] = useState<FullDerivation | null>(null);
  const [showOperatorRef, setShowOperatorRef] = useState(false);
  const [showRulesRef, setShowRulesRef] = useState(false);

  // ── DFT/SCF solver state ──
  const [scfResult, setScfResult] = useState<SCFResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedOrbital, setSelectedOrbital] = useState(0);
  const [isoValue, setIsoValue] = useState(0.02);
  const [showPositive, setShowPositive] = useState(true);
  const [showNegative, setShowNegative] = useState(true);
  const [orbitalGrid, setOrbitalGrid] = useState<number[][][] | null>(null);
  const [vibModes, setVibModes] = useState<VibrationalMode[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<{ energyHistory: number[]; converged: boolean } | null>(null);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState("scf");

  const graphData = useMemo(() => activePreset ? generateQuantumData(activePreset, quantumN) : null, [activePreset, quantumN]);
  const hasPotential = graphData?.some(d => d.potential !== undefined);

  const handleSolve = useCallback(() => {
    const detected = detectEquationAdvanced(input);
    if (detected && derivationDatabase[detected]) {
      setDerivation(null);
      setTimeout(() => setDerivation(derivationDatabase[detected]()), 50);
    } else {
      setDerivation({
        title: "Equation Not Recognized",
        equation: input || "(empty)",
        operatorForm: "—", differentialForm: "—",
        steps: [{ rule: "Detection Failed", formula: "No matching pattern", action: "Try a preset below", result: "Supported: TDSE, TISE, Harmonic Oscillator, Hydrogen, Angular Momentum..." }],
        finalAnswer: "Please select a preset or enter a recognized equation",
        physicalMeaning: "", method: "", notes: [],
      });
    }
  }, [input]);

  const handleRunSCF = useCallback((
    size: number,
    method: "DFT" | "Tight-Binding",
    element: ElementType,
    symmetry: SymmetryType,
    functional: FunctionalType,
    latticeConst?: number
  ) => {
    setIsRunning(true);
    setScfResult(null);
    setOrbitalGrid(null);
    setVibModes([]);
    setOptResult(null);

    setTimeout(() => {
      try {
        const result = runSCFSolver(size, method, element, symmetry, functional, latticeConst);
        setScfResult(result);
        setSelectedOrbital(result.homoIndex);
        const grid = generateOrbitalGrid(result.atoms, result.finalOrbitals, result.homoIndex, 24, element);
        setOrbitalGrid(grid);

        // Compute vibrational modes
        const modes = computeVibrationalModes(result.atoms, result.convergedDensity, element);
        setVibModes(modes);
      } catch (err) {
        console.error("SCF solver error:", err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, []);

  const handleOrbitalChange = useCallback((idx: number) => {
    setSelectedOrbital(idx);
    if (scfResult) {
      const grid = generateOrbitalGrid(scfResult.atoms, scfResult.finalOrbitals, idx, 24, scfResult.element);
      setOrbitalGrid(grid);
    }
  }, [scfResult]);

  const handleOptimize = useCallback(() => {
    if (!scfResult) return;
    setIsOptimizing(true);
    setTimeout(() => {
      try {
        const opt = optimizeGeometry(scfResult.atoms, scfResult.element, "Tight-Binding", "LDA", 20);
        setOptResult({ energyHistory: opt.energyHistory, converged: opt.converged });
      } catch (err) {
        console.error("Optimization error:", err);
      } finally {
        setIsOptimizing(false);
      }
    }, 50);
  }, [scfResult]);

  const loadPreset = (key: string) => {
    const preset = equationPresets.find(p => p.key === key);
    if (preset) setInput(preset.eq);
  };

  return (
    <PageLayout>
      <ScienceBackground />
      <div className="container px-4 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Quantum <span className="text-gradient">Solver</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Multi-element DFT/Tight-Binding SCF solver with 3D orbital visualization, density heatmaps, and geometry optimization.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-secondary/50 border border-border/30">
            <TabsTrigger value="scf" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FlaskConical size={14} /> DFT / SCF Solver
            </TabsTrigger>
            <TabsTrigger value="symbolic" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Atom size={14} /> Symbolic Derivations
            </TabsTrigger>
          </TabsList>

          {/* ════════ TAB: SCF SOLVER ════════ */}
          <TabsContent value="scf" className="mt-4">
            <div className="grid lg:grid-cols-4 gap-4">
              {/* Side Panel */}
              <div className="lg:col-span-1">
                <SCFControlPanel
                  onRunSolver={handleRunSCF}
                  isRunning={isRunning}
                  result={scfResult}
                  selectedOrbital={selectedOrbital}
                  onOrbitalChange={handleOrbitalChange}
                  isoValue={isoValue}
                  onIsoChange={setIsoValue}
                  showPositive={showPositive}
                  showNegative={showNegative}
                  onTogglePositive={setShowPositive}
                  onToggleNegative={setShowNegative}
                />
              </div>

              {/* Main Visualization */}
              <div className="lg:col-span-3 space-y-4">
                <GlassCard>
                  <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Atom size={14} className="text-primary" />
                    3D Molecular Orbital Viewer
                    {scfResult && (
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                        {scfResult.element}<sub>{scfResult.atoms.length}</sub> — Orbital {selectedOrbital + 1}
                        {selectedOrbital === scfResult.homoIndex ? " (HOMO)" : selectedOrbital === scfResult.lumoIndex ? " (LUMO)" : ""}
                      </span>
                    )}
                  </h3>
                  <OrbitalViewer3D
                    atoms={scfResult?.atoms || [{ x: 0, y: 0, z: 0, element: "Ag" }]}
                    orbitalGrid={orbitalGrid}
                    selectedOrbital={selectedOrbital}
                    showPositive={showPositive}
                    showNegative={showNegative}
                    isoValue={isoValue}
                  />
                </GlassCard>

                {/* 2D Density Heatmap + Energy Level Diagram side by side */}
                {scfResult && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <DensityHeatmap result={scfResult} />
                    <EnergyLevelDiagram
                      result={scfResult}
                      selectedOrbital={selectedOrbital}
                      onOrbitalChange={handleOrbitalChange}
                    />
                  </div>
                )}

                {scfResult && <AnalysisGraphs result={scfResult} />}

                {scfResult && <AdvancedVisualizations result={scfResult} />}

                {/* Vibrational Modes & Geometry Optimization */}
                {scfResult && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Vibrational Modes */}
                    <GlassCard>
                      <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Vibrate size={14} className="text-primary" />
                        Vibrational Modes
                      </h3>
                      {vibModes.length > 0 ? (
                        <div className="space-y-1">
                          {vibModes.map((mode, i) => (
                            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono bg-secondary/30 border border-border/20">
                              <span className="text-foreground">Mode {i + 1}</span>
                              <span className="text-primary">{mode.frequency.toFixed(1)} cm⁻¹</span>
                              <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/60 rounded-full"
                                  style={{ width: `${Math.min(100, mode.frequency / 5)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Run solver to compute modes</p>
                      )}
                    </GlassCard>

                    {/* Geometry Optimization */}
                    <GlassCard>
                      <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary" />
                        Geometry Optimization
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 border-border mb-3 h-8 text-[10px]"
                        onClick={handleOptimize}
                        disabled={isOptimizing || !scfResult}
                      >
                        {isOptimizing ? "Optimizing..." : "Run Gradient Descent"}
                      </Button>
                      {optResult && (
                        <div className="space-y-2">
                          <div className="text-[10px] text-muted-foreground">
                            {optResult.converged ? "✓ Converged" : "✗ Not converged"} ({optResult.energyHistory.length} steps)
                          </div>
                          <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={optResult.energyHistory.map((e, i) => ({ step: i + 1, energy: e }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="step" fontSize={8} stroke="hsl(var(--muted-foreground))" />
                              <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" />
                              <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </GlassCard>
                  </div>
                )}

                {!scfResult && !isRunning && (
                  <GlassCard className="py-12">
                    <div className="text-center">
                      <FlaskConical className="h-16 w-16 text-primary/20 mx-auto mb-4" strokeWidth={1} />
                      <h3 className="text-sm font-semibold text-foreground mb-2">Multi-Element Quantum Cluster Solver</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                        Select an element (Ag, Au, Cu, Al, Pt, Fe, Ti, Ni, Si, C, N, O), configure the cluster geometry, and run the SCF solver.
                        Features LDA/GGA functionals, Pulay mixing, 3D orbitals, density heatmaps, and vibrational analysis.
                      </p>
                      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-[10px]">
                       {[
                          ["12 Elements", "Ag, Au, Cu, Al, Pt, Fe..."],
                          ["LDA & GGA", "Slater + VWN / PBE"],
                          ["3D Orbitals", "|ψ|² volumetric cloud"],
                          ["Density Heatmap", "2D cross-section view"],
                          ["Energy Levels", "Interactive ladder diagram"],
                          ["Vibrations", "Normal mode frequencies"],
                        ].map(([t, d]) => (
                          <div key={t} className="p-2 rounded border border-border/30 bg-secondary/20">
                            <div className="font-semibold text-foreground">{t}</div>
                            <div className="text-muted-foreground mt-0.5">{d}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ════════ TAB: SYMBOLIC DERIVATIONS ════════ */}
          <TabsContent value="symbolic" className="mt-4">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left: Editor */}
              <div className="lg:col-span-2 space-y-4">
                <GlassCard>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Equation Editor</h2>
                  <LaTeXEquationEditor
                    value={input}
                    onChange={setInput}
                    placeholder="Enter quantum equation (e.g. iℏ ∂ψ/∂t = Ĥψ)..."
                  />
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSolve}>
                      <Play size={12} /> Solve
                    </Button>
                    <Button size="sm" variant="outline" className="border-border gap-1.5" onClick={() => {
                      const detected = detectEquationAdvanced(input);
                      if (detected && derivationDatabase[detected]) {
                        const d = derivationDatabase[detected]();
                        const keySteps = d.steps.filter(s => s.highlight);
                        setDerivation(null);
                        setTimeout(() => setDerivation({ ...d, title: `Quick Explanation: ${d.title.split("—")[0].trim()}`, steps: keySteps.length > 0 ? keySteps : d.steps.slice(0, 3) }), 50);
                      } else handleSolve();
                    }}>
                      <BookOpen size={12} /> Explain
                    </Button>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Equation Presets</h2>
                  <div className="space-y-1">
                    {equationPresets.map((preset) => (
                      <button key={preset.key} onClick={() => loadPreset(preset.key)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-secondary/70 text-muted-foreground border border-transparent hover:border-border/50">
                        <div className="font-medium text-foreground text-xs">{preset.name}</div>
                        <div className="font-mono text-[10px] mt-0.5 text-primary/70">{preset.eq}</div>
                      </button>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <button onClick={() => setShowOperatorRef(!showOperatorRef)} className="w-full text-left text-sm font-semibold text-foreground flex items-center justify-between">
                    Operator Reference <span className="text-xs text-primary">{showOperatorRef ? "▼" : "▶"}</span>
                  </button>
                  {showOperatorRef && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
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

                <GlassCard>
                  <button onClick={() => setShowRulesRef(!showRulesRef)} className="w-full text-left text-sm font-semibold text-foreground flex items-center justify-between">
                    Differentiation Rules <span className="text-xs text-primary">{showRulesRef ? "▼" : "▶"}</span>
                  </button>
                  {showRulesRef && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
                      {Object.values(diffRules).map(rule => (
                        <div key={rule.name} className="text-xs border border-border/30 rounded-lg p-2">
                          <div className="font-medium text-foreground mb-0.5">{rule.name}</div>
                          <div className="font-mono text-[10px] text-primary/70">{rule.formula}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </GlassCard>

                <GlassCard>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Visualization Presets</h2>
                  <div className="space-y-2">
                    {quantumPresets.map(p => (
                      <button key={p.name} onClick={() => { setActivePreset(p.name); setQuantumN(1); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activePreset === p.name ? "bg-primary/15 border border-primary/30 text-primary" : "hover:bg-secondary/70 text-muted-foreground border border-transparent"}`}>
                        <div className="font-medium text-foreground text-xs">{p.name}</div>
                        <div className="font-mono text-xs mt-0.5 opacity-70">{p.eq}</div>
                      </button>
                    ))}
                  </div>
                </GlassCard>

                {activePreset && (
                  <GlassCard>
                    <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Number n</h2>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <Button key={n} size="sm" variant={quantumN === n ? "default" : "outline"} onClick={() => setQuantumN(n)}
                          className={quantumN === n ? "bg-primary text-primary-foreground" : "border-border"}>
                          n={n}
                        </Button>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Right: Output */}
              <div className="lg:col-span-3 space-y-4">
                {derivation && <QuantumDerivationView derivation={derivation} />}

                <GlassCard className="min-h-[300px]" id="quantum-graph-area">
                  <h2 className="text-sm font-semibold text-foreground mb-3">
                    Wavefunction ψ(x) {activePreset && `— ${activePreset} (n=${quantumN})`}
                  </h2>
                  {graphData ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
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

                <GlassCard>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Export</h2>
                  <div className="flex flex-wrap gap-2">
                    {["PNG", "JPG", "PDF"].map(fmt => (
                      <Button key={fmt} variant="outline" size="sm" className="gap-1.5 border-border hover:bg-primary/10 hover:text-primary"
                        onClick={() => {
                          if (fmt === "JPG" || fmt === "PNG") {
                            import("@/lib/imageExport").then(({ exportContainerAsImage }) => {
                              exportContainerAsImage("#quantum-graph-area", fmt === "JPG" ? "jpeg" : "png", "quantum-graph");
                            });
                          }
                        }}>
                        <Download size={12} /> {fmt}
                      </Button>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default QuantumSolver;
