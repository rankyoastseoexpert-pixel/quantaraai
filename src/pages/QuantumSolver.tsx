import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import ScienceBackground from "@/components/ScienceBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Download, Atom, BookOpen, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Quantum equation knowledge base ──
interface QuantumEquationInfo {
  name: string;
  equation: string;
  explanation: string[];
  solution: string[];
  physicalMeaning: string;
  solutionMethod: string;
}

const quantumKnowledge: Record<string, QuantumEquationInfo> = {
  tdse: {
    name: "Time-Dependent Schrödinger Equation (TDSE)",
    equation: "iℏ ∂ψ/∂t = Ĥψ",
    explanation: [
      "This is the fundamental equation of quantum mechanics describing how quantum states evolve in time.",
      "iℏ is the imaginary unit (i) multiplied by the reduced Planck constant (ℏ = h/2π ≈ 1.055 × 10⁻³⁴ J·s).",
      "∂ψ/∂t is the partial time derivative of the wavefunction ψ(x,t).",
      "Ĥ is the Hamiltonian operator: Ĥ = -ℏ²/(2m) ∂²/∂x² + V(x) (kinetic + potential energy).",
      "ψ(x,t) is the wavefunction — its square modulus |ψ|² gives the probability density of finding the particle.",
      "The equation is first-order in time and linear in ψ — superposition principle holds.",
      "For a free particle (V=0): ψ(x,t) = Ae^(i(kx - ωt)) where E = ℏω and p = ℏk.",
    ],
    solution: [
      "General method: Separation of variables ψ(x,t) = φ(x)·T(t)",
      "Time part: T(t) = e^(-iEt/ℏ)",
      "Spatial part satisfies TISE: Ĥφ = Eφ",
      "General solution: ψ(x,t) = Σ cₙ φₙ(x) e^(-iEₙt/ℏ)",
      "For particle in a box: ψₙ(x,t) = √(2/L) sin(nπx/L) e^(-iEₙt/ℏ)",
      "where Eₙ = n²π²ℏ²/(2mL²)",
      "Probability density: |ψ(x,t)|² — may oscillate in time for superposition states",
      "Expectation values: ⟨x⟩ = ∫ ψ* x ψ dx, ⟨p⟩ = ∫ ψ* (-iℏ∂/∂x) ψ dx",
    ],
    physicalMeaning: "Governs the time evolution of all non-relativistic quantum systems. It is the quantum analog of Newton's second law.",
    solutionMethod: "Separation of variables → TISE for spatial part, exponential decay for time part.",
  },
  tise: {
    name: "Time-Independent Schrödinger Equation (TISE)",
    equation: "Ĥψ = Eψ  →  -ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ",
    explanation: [
      "This is an eigenvalue equation: the Hamiltonian operator Ĥ acts on ψ to give energy E times ψ.",
      "Ĥ = -ℏ²/(2m) d²/dx² + V(x) is the Hamiltonian (kinetic + potential energy operator).",
      "ψ(x) is the stationary state wavefunction — does not depend on time.",
      "E is the energy eigenvalue — only specific discrete values are allowed (quantization).",
      "This is a second-order linear ODE in ψ.",
      "Boundary conditions determine allowed energy levels (e.g., ψ → 0 at walls).",
      "The linearity means: if ψ₁ and ψ₂ are solutions, then aψ₁ + bψ₂ is also a solution.",
    ],
    solution: [
      "Particle in a box (V=0 inside, ∞ outside):",
      "  ψₙ(x) = √(2/L) sin(nπx/L), n = 1, 2, 3, ...",
      "  Eₙ = n²π²ℏ²/(2mL²)",
      "Harmonic oscillator (V = ½mω²x²):",
      "  ψₙ(x) = Hₙ(αx) e^(-α²x²/2), α = √(mω/ℏ)",
      "  Eₙ = (n + ½)ℏω",
      "Free particle (V = 0):",
      "  ψ(x) = Ae^(ikx) + Be^(-ikx), E = ℏ²k²/(2m)",
      "  Continuous energy spectrum (no quantization)",
    ],
    physicalMeaning: "Determines the allowed stationary states and energy levels of a quantum system. It is the eigenvalue equation for energy.",
    solutionMethod: "Solve the ODE with appropriate boundary conditions. Method depends on V(x): analytic for simple potentials, numerical for complex ones.",
  },
  expectation: {
    name: "Expectation Value",
    equation: "⟨A⟩ = ∫ ψ* Â ψ dx",
    explanation: [
      "The expectation value ⟨A⟩ gives the average result of measuring observable A in state ψ.",
      "ψ* is the complex conjugate of the wavefunction.",
      "Â is the quantum operator corresponding to observable A.",
      "The integral is over all space (or the relevant domain).",
      "Linearity: Â(aψ₁ + bψ₂) = aÂψ₁ + bÂψ₂",
      "For position: ⟨x⟩ = ∫ ψ* x ψ dx",
      "For momentum: ⟨p⟩ = ∫ ψ* (-iℏ d/dx) ψ dx",
      "For energy: ⟨H⟩ = ∫ ψ* Ĥ ψ dx = E (for energy eigenstates)",
    ],
    solution: [
      "For particle in a box (n=1):",
      "  ⟨x⟩ = L/2 (particle most likely at center)",
      "  ⟨x²⟩ = L²/3 - L²/(2n²π²)",
      "  ⟨p⟩ = 0 (equal probability of moving left/right)",
      "  ⟨p²⟩ = n²π²ℏ²/L²",
      "  ⟨H⟩ = Eₙ = n²π²ℏ²/(2mL²)",
      "Uncertainty: Δx·Δp ≥ ℏ/2 (Heisenberg)",
    ],
    physicalMeaning: "Connects quantum theory to measurable quantities. The average of many identical measurements on identically prepared systems.",
    solutionMethod: "Evaluate the integral ∫ψ*Âψ dx directly, or use ladder operators / matrix methods.",
  },
  momentum: {
    name: "Momentum Operator",
    equation: "p̂ = -iℏ d/dx",
    explanation: [
      "The momentum operator in position representation is p̂ = -iℏ d/dx.",
      "It acts linearly: p̂(aψ₁ + bψ₂) = a p̂ψ₁ + b p̂ψ₂",
      "Eigenstates of p̂: p̂ψ = pψ → ψ(x) = Ae^(ipx/ℏ) (plane waves)",
      "Eigenvalue p can be any real number → continuous spectrum.",
      "Commutation relation: [x̂, p̂] = iℏ (fundamental to uncertainty principle)",
      "In 3D: p̂ = -iℏ∇ (gradient operator)",
    ],
    solution: [
      "Eigenvalue equation: -iℏ dψ/dx = pψ",
      "Solution: ψₚ(x) = (1/√2πℏ) e^(ipx/ℏ)",
      "These are not normalizable → use wave packets",
      "⟨p⟩ for particle in box: ⟨p⟩ = 0 (symmetric)",
      "⟨p²⟩ for particle in box: ⟨p²⟩ = n²π²ℏ²/L²",
      "Kinetic energy: T̂ = p̂²/(2m) = -ℏ²/(2m) d²/dx²",
    ],
    physicalMeaning: "Generates spatial translations. Its eigenvalues give the linear momentum of a particle.",
    solutionMethod: "Solve -iℏ dψ/dx = pψ to get plane wave eigenstates.",
  },
  planck: {
    name: "Planck Energy–Frequency Relation",
    equation: "E = hf = ℏω",
    explanation: [
      "Energy of a photon is proportional to its frequency f.",
      "h = 6.626 × 10⁻³⁴ J·s is Planck's constant.",
      "ℏ = h/(2π) is the reduced Planck constant.",
      "ω = 2πf is the angular frequency.",
      "This is linear in f: compare with y = mx where m = h, c = 0.",
      "This relation was the birth of quantum theory (Max Planck, 1900).",
      "It implies energy is quantized in units of hf.",
    ],
    solution: [
      "E = hf is already solved — it's a direct proportionality.",
      "For visible light (f ≈ 5×10¹⁴ Hz): E ≈ 3.3 × 10⁻¹⁹ J ≈ 2.07 eV",
      "For X-rays (f ≈ 10¹⁸ Hz): E ≈ 4.1 keV",
      "Photoelectric effect: Eₖ = hf - φ (work function)",
      "Graphically: slope = h, y-intercept = -φ",
    ],
    physicalMeaning: "Connects wave nature (frequency) to particle nature (energy) of light. Foundation of wave-particle duality.",
    solutionMethod: "Direct proportionality — no differential equation to solve.",
  },
  debroglie: {
    name: "de Broglie Relation",
    equation: "p = h/λ = ℏk",
    explanation: [
      "Every particle with momentum p has an associated wavelength λ = h/p.",
      "k = 2π/λ is the wave number.",
      "In the form p = ℏk, this is linear in k.",
      "Compare with y = mx: y → p, x → k, m → ℏ, c → 0.",
      "This extends wave-particle duality to matter (not just photons).",
      "Confirmed by electron diffraction experiments (Davisson-Germer, 1927).",
    ],
    solution: [
      "λ = h/p = h/(mv) for massive particles",
      "For electron at 100 eV: λ ≈ 0.123 nm (comparable to atomic spacing)",
      "For baseball (0.145 kg, 40 m/s): λ ≈ 1.1 × 10⁻³⁴ m (undetectable)",
      "Free particle wavefunction: ψ = Ae^(ikx) where k = p/ℏ",
    ],
    physicalMeaning: "Assigns a wavelength to all matter, explaining quantum interference and diffraction of particles.",
    solutionMethod: "Direct relation — λ = h/p. Use for calculating matter wave properties.",
  },
  probability_current: {
    name: "Probability Current (1D)",
    equation: "J = (ℏ/m) Im(ψ* ∂ψ/∂x)",
    explanation: [
      "J(x,t) is the probability current density — rate of probability flow per unit area.",
      "Built from linear operators acting on ψ.",
      "Satisfies continuity equation: ∂|ψ|²/∂t + ∂J/∂x = 0",
      "This ensures conservation of total probability.",
      "For a plane wave ψ = Ae^(ikx): J = |A|²ℏk/m = |A|²v",
      "For a standing wave: J = 0 (no net probability flow).",
    ],
    solution: [
      "Plane wave ψ = Ae^(i(kx-ωt)):",
      "  J = |A|² ℏk/m = |A|² p/m = |A|² v",
      "Reflected + transmitted wave at step potential:",
      "  J_incident = |A|²ℏk₁/m",
      "  J_reflected = |B|²ℏk₁/m",
      "  J_transmitted = |C|²ℏk₂/m",
      "  Reflection coefficient: R = |B/A|²",
      "  Transmission coefficient: T = (k₂/k₁)|C/A|²",
    ],
    physicalMeaning: "Describes how probability 'flows' through space, analogous to electric current density in electromagnetism.",
    solutionMethod: "Direct computation from ψ. Use to find reflection/transmission coefficients at potential barriers.",
  },
};

// Match user input to known equations
function detectEquation(input: string): string | null {
  const lower = input.toLowerCase().replace(/\s+/g, "");
  if (lower.includes("iℏ") && (lower.includes("∂ψ/∂t") || lower.includes("∂†") || lower.includes("∂ψ/∂"))) return "tdse";
  if (lower.includes("ĥψ=eψ") || lower.includes("ĥψ") || (lower.includes("tise") || lower.includes("time-independent"))) return "tise";
  if (lower.includes("⟨a⟩") || lower.includes("expectation") || lower.includes("ψ*â")) return "expectation";
  if (lower.includes("p̂") || lower.includes("p^") || (lower.includes("momentum") && lower.includes("operator"))) return "momentum";
  if (lower.includes("e=hf") || lower.includes("planck") || lower.includes("ℏω")) return "planck";
  if (lower.includes("debroglie") || lower.includes("h/λ") || lower.includes("ℏk")) return "debroglie";
  if (lower.includes("probability current") || lower.includes("ℑ(ψ")) return "probability_current";
  // Fallback pattern matching
  if (lower.includes("iℏ∂") || lower.includes("iℏ")) return "tdse";
  if (lower.includes("ĥ") && lower.includes("ψ")) return "tise";
  return null;
}

// ── Quantum presets for visualization ──
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
  const [solveResult, setSolveResult] = useState<string[] | null>(null);
  const [explainResult, setExplainResult] = useState<string[] | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [resultPhysical, setResultPhysical] = useState("");
  const [resultMethod, setResultMethod] = useState("");

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
    const detected = detectEquation(input);
    if (detected && quantumKnowledge[detected]) {
      const info = quantumKnowledge[detected];
      setResultTitle(info.name);
      setSolveResult(info.solution);
      setExplainResult(null);
      setResultPhysical(info.physicalMeaning);
      setResultMethod(info.solutionMethod);
    } else {
      setResultTitle("Equation Not Recognized");
      setSolveResult(["Could not identify the quantum equation. Try one of these formats:", 
        "• iℏ ∂ψ/∂t = Ĥψ (TDSE)",
        "• Ĥψ = Eψ (TISE)", 
        "• ⟨A⟩ = ∫ ψ* Â ψ dx (Expectation Value)",
        "• p̂ = -iℏ d/dx (Momentum Operator)",
        "• E = hf (Planck Relation)",
        "• p = ℏk (de Broglie Relation)",
        "• J = (ℏ/m) Im(ψ* ∂ψ/∂x) (Probability Current)"]);
      setExplainResult(null);
      setResultPhysical("");
      setResultMethod("");
    }
  };

  const handleExplain = () => {
    const detected = detectEquation(input);
    if (detected && quantumKnowledge[detected]) {
      const info = quantumKnowledge[detected];
      setResultTitle(info.name);
      setExplainResult(info.explanation);
      setSolveResult(null);
      setResultPhysical(info.physicalMeaning);
      setResultMethod(info.solutionMethod);
    } else {
      setResultTitle("Equation Not Recognized");
      setExplainResult(["Could not identify the equation. Enter a recognized quantum equation or select a preset below."]);
      setSolveResult(null);
      setResultPhysical("");
      setResultMethod("");
    }
  };

  const handleDerive = () => {
    const detected = detectEquation(input);
    if (detected && quantumKnowledge[detected]) {
      const info = quantumKnowledge[detected];
      setResultTitle(`Derivation: ${info.name}`);
      setSolveResult(null);
      setExplainResult([
        `Starting from: ${info.equation}`,
        "",
        ...info.explanation,
        "",
        "── Solution Steps ──",
        ...info.solution,
      ]);
      setResultPhysical(info.physicalMeaning);
      setResultMethod(info.solutionMethod);
    } else {
      handleExplain();
    }
  };

  const loadEquationPreset = (key: string) => {
    const info = quantumKnowledge[key];
    if (info) {
      setInput(info.equation);
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
                placeholder="Enter quantum equation (e.g. iℏ∂ψ/∂t = Ĥψ)..."
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
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSolve}>
                  <Play size={12} /> Solve
                </Button>
                <Button size="sm" variant="outline" className="border-border" onClick={handleDerive}>Derive</Button>
                <Button size="sm" variant="outline" className="border-border gap-1.5" onClick={handleExplain}>
                  <BookOpen size={12} /> Explain
                </Button>
              </div>
            </GlassCard>

            {/* Equation Presets (for solver) */}
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Equation Presets</h2>
              <div className="space-y-1.5">
                {Object.entries(quantumKnowledge).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => loadEquationPreset(key)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-secondary/70 text-muted-foreground border border-transparent hover:border-border/50"
                  >
                    <div className="font-medium text-foreground text-xs">{info.name}</div>
                    <div className="font-mono text-xs mt-0.5 text-primary/70">{info.equation}</div>
                  </button>
                ))}
              </div>
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

          {/* Right: Output */}
          <div className="lg:col-span-3 space-y-4">
            {/* Solve/Explain output */}
            {(solveResult || explainResult) && (
              <GlassCard>
                <h2 className="text-sm font-semibold text-foreground mb-3">{resultTitle}</h2>
                <div className="space-y-2 mb-4">
                  {(solveResult || explainResult)?.map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {line === "" ? <div className="h-2" /> : (
                        <>
                          {!line.startsWith("──") && !line.startsWith("•") && !line.startsWith("Could") && (
                            <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                          )}
                          <span className={`font-mono ${line.startsWith("──") ? "text-primary font-bold" : line.startsWith("  ") ? "text-primary/80 pl-4" : "text-muted-foreground"}`}>
                            {line}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {resultPhysical && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xs font-semibold text-primary mb-1">Physical Meaning</div>
                    <p className="text-xs text-muted-foreground">{resultPhysical}</p>
                  </div>
                )}
                {resultMethod && (
                  <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">Solution Method</div>
                    <p className="text-xs text-muted-foreground font-mono">{resultMethod}</p>
                  </div>
                )}
              </GlassCard>
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
