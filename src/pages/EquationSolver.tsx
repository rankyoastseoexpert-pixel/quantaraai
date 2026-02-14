import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Play, RotateCcw, ChevronRight } from "lucide-react";
import * as math from "mathjs";
import LinearSolverGraph from "@/components/LinearSolverGraph";
import PhysicsPresets from "@/components/PhysicsPresets";
import PhysicsBackground from "@/components/PhysicsBackground";
import ScienceBackground from "@/components/ScienceBackground";
import AnimatedSteps from "@/components/AnimatedSteps";

const diffPresets = [
  { name: "Legendre Equation", eq: "(1-x²)y'' - 2xy' + l(l+1)y = 0" },
  { name: "Bessel Equation", eq: "x²y'' + xy' + (x²-n²)y = 0" },
  { name: "Heat Equation", eq: "∂u/∂t = α∇²u" },
  { name: "Wave Equation", eq: "∂²u/∂t² = c²∇²u" },
  { name: "Laplace Equation", eq: "∇²u = 0" },
  { name: "Helmholtz Equation", eq: "∇²f + k²f = 0" },
];

const integralPresets = [
  { name: "Definite Integral", eq: "∫₀¹ x² dx = 1/3" },
  { name: "Gaussian Integral", eq: "∫₋∞^∞ e^(-x²) dx = √π" },
  { name: "Trigonometric", eq: "∫₀^π sin(x) dx = 2" },
  { name: "Integration by Parts", eq: "∫ u dv = uv - ∫ v du" },
  { name: "Fourier Transform", eq: "F(k) = ∫ f(x) e^(-2πikx) dx" },
  { name: "Laplace Transform", eq: "F(s) = ∫₀^∞ f(t) e^(-st) dt" },
];

const matrixOps = ["Determinant", "Inverse", "Eigenvalues", "Diagonalization", "Hermitian Check", "Unitary Check", "Matrix Exp"];

const solutions: Record<string, { equation: string; steps: string[]; solution: string; explanation: string }> = {
  "First-order ODE": {
    equation: "y' + P(x)y = Q(x)",
    steps: [
      "Identify the form y' + P(x)y = Q(x) — Linear First-Order ODE",
      "Calculate integrating factor: μ(x) = e^(∫P(x)dx)",
      "Multiply both sides by μ(x): μ(x)y' + μ(x)P(x)y = μ(x)Q(x)",
      "Left side becomes d/dx[μ(x)·y] — exact derivative",
      "Integrate both sides: μ(x)·y = ∫μ(x)Q(x)dx + C",
      "Solve for y: y = (1/μ(x))·[∫μ(x)Q(x)dx + C]",
    ],
    solution: "y(x) = e^(-∫P(x)dx) · [∫Q(x)·e^(∫P(x)dx)dx + C]",
    explanation: "First-order linear ODEs are solved using the integrating factor method. This exponential factor transforms the equation into an exact derivative, allowing direct integration to find the general solution.",
  },
  "Second-order ODE": {
    equation: "y'' + py' + qy = 0 (Homogeneous, constant coefficients)",
    steps: [
      "Assume solution form y = e^(rx)",
      "Calculate derivatives: y' = re^(rx), y'' = r²e^(rx)",
      "Substitute into ODE: r²e^(rx) + pre^(rx) + qe^(rx) = 0",
      "Factor out e^(rx) ≠ 0: r² + pr + q = 0 — characteristic equation",
      "Apply quadratic formula: r = (-p ± √(p²-4q))/2",
      "Case 1 — Distinct real roots (r₁ ≠ r₂): y = C₁e^(r₁x) + C₂e^(r₂x)",
      "Case 2 — Repeated root (r₁ = r₂ = r): y = (C₁ + C₂x)e^(rx)",
      "Case 3 — Complex roots (α ± βi): y = e^(αx)[C₁cos(βx) + C₂sin(βx)]",
    ],
    solution: "y(x) = C₁e^(r₁x) + C₂e^(r₂x), where r₁,r₂ are roots of r² + pr + q = 0",
    explanation: "Second-order linear ODEs with constant coefficients reduce to an algebraic characteristic equation. The discriminant determines whether solutions are exponential, polynomial-exponential, or oscillatory.",
  },
  "Legendre ODE": {
    equation: "(1-x²)y'' - 2xy' + l(l+1)y = 0",
    steps: [
      "Recognize as Legendre's equation with parameter l",
      "Singular points at x = ±1 — use Frobenius/series method",
      "Assume power series: y = Σ aₖxᵏ",
      "Substitute and match coefficients to get recurrence relation",
      "For integer l, series terminates → Legendre polynomials Pₗ(x)",
      "P₀(x) = 1, P₁(x) = x, P₂(x) = (3x²-1)/2, P₃(x) = (5x³-3x)/2",
      "Second solution Qₗ(x) is Legendre function of second kind (singular at x=±1)",
    ],
    solution: "y(x) = C₁Pₗ(x) + C₂Qₗ(x), where Pₗ are Legendre polynomials",
    explanation: "Legendre's equation appears when solving Laplace's equation in spherical coordinates. Legendre polynomials form a complete orthogonal set on [-1,1] and are fundamental in multipole expansions and angular momentum theory.",
  },
  "Bessel ODE": {
    equation: "x²y'' + xy' + (x²-n²)y = 0",
    steps: [
      "Recognize as Bessel's equation of order n",
      "Regular singular point at x = 0 — apply Frobenius method",
      "Try series y = x^s Σ aₖxᵏ → indicial equation gives s = ±n",
      "First solution: Jₙ(x) = Σ (-1)ᵏ(x/2)^(n+2k) / [k! Γ(n+k+1)]",
      "Second solution: Yₙ(x) — Bessel function of second kind (singular at x=0)",
      "Both Jₙ and Yₙ are oscillatory for large x with decaying amplitude",
      "General solution: y(x) = C₁Jₙ(x) + C₂Yₙ(x)",
    ],
    solution: "y(x) = C₁Jₙ(x) + C₂Yₙ(x), where Jₙ, Yₙ are Bessel functions",
    explanation: "Bessel's equation arises in cylindrical coordinate problems — vibrating membranes, wave propagation in fibers, heat conduction in cylinders. Bessel functions oscillate and decay, analogous to damped sinusoids.",
  },
  "Heat Equation": {
    equation: "∂u/∂t = α∇²u",
    steps: [
      "Use separation of variables: u(x,t) = X(x)·T(t)",
      "Substitute: X·T' = α·X''·T → divide by αXT",
      "T'/(αT) = X''/X = -λ (separation constant)",
      "Spatial ODE: X'' + λX = 0 → X = A sin(√λ x) + B cos(√λ x)",
      "Temporal ODE: T' + αλT = 0 → T = Ce^(-αλt) — exponential decay!",
      "Boundary conditions (e.g. X(0)=X(L)=0) quantize λₙ = (nπ/L)²",
      "General solution: u(x,t) = Σ Bₙ sin(nπx/L) e^(-α(nπ/L)²t)",
    ],
    solution: "u(x,t) = Σ Bₙ sin(nπx/L) exp(-α(nπ/L)²t)",
    explanation: "The heat equation models diffusion processes. Higher-frequency modes decay exponentially faster, so any initial temperature profile smooths toward equilibrium. The thermal diffusivity α controls the rate.",
  },
  "Wave Equation": {
    equation: "∂²u/∂t² = c²∇²u",
    steps: [
      "Use separation of variables: u(x,t) = X(x)·T(t)",
      "Substitute: X·T'' = c²X''·T → T''/(c²T) = X''/X = -λ",
      "Spatial: X'' + λX = 0 → X = A sin(√λ x) + B cos(√λ x)",
      "Temporal: T'' + c²λT = 0 → T = C cos(ωt) + D sin(ωt), ω = c√λ",
      "Standing wave: uₙ = sin(nπx/L)·[Aₙcos(ωₙt) + Bₙsin(ωₙt)]",
      "D'Alembert's general solution: u(x,t) = f(x-ct) + g(x+ct)",
      "f and g represent right- and left-traveling waves at speed c",
    ],
    solution: "u(x,t) = f(x-ct) + g(x+ct)",
    explanation: "The wave equation describes vibrating strings, sound, and electromagnetic waves. Unlike heat, wave solutions preserve shape — energy propagates without dissipation at speed c.",
  },
  "Laplace Equation": {
    equation: "∇²u = 0",
    steps: [
      "In 2D Cartesian: ∂²u/∂x² + ∂²u/∂y² = 0",
      "Separation: u(x,y) = X(x)·Y(y) → X''/X = -Y''/Y = λ",
      "If λ > 0: X oscillates, Y grows/decays exponentially",
      "X = A sin(√λ x) + B cos(√λ x)",
      "Y = C sinh(√λ y) + D cosh(√λ y)",
      "Boundary conditions fix eigenvalues λₙ = (nπ/L)²",
      "u(x,y) = Σ [Aₙcosh(nπy/L) + Bₙsinh(nπy/L)]sin(nπx/L)",
    ],
    solution: "u(x,y) = Σ [Aₙcosh(nπy/L) + Bₙsinh(nπy/L)]sin(nπx/L)",
    explanation: "Laplace's equation governs steady-state heat, electrostatics, and potential flow. Solutions (harmonic functions) satisfy the mean value property — the value at any point equals the average over surrounding points.",
  },
};

const EquationSolver = () => {
  const [equation, setEquation] = useState("");
  const [linearResult, setLinearResult] = useState<string | null>(null);
  const [linearSteps, setLinearSteps] = useState<string[]>([]);
  const [linearGraph, setLinearGraph] = useState<{ m: number; c: number } | null>(null);
  const [matrixSize, setMatrixSize] = useState(3);
  const [matrixValues, setMatrixValues] = useState<string[][]>(
    Array.from({ length: 3 }, () => Array(3).fill("0"))
  );
  const [matrixResult, setMatrixResult] = useState<string | null>(null);
  const [diffEqInput, setDiffEqInput] = useState("");
  const [selectedDiffType, setSelectedDiffType] = useState<string | null>(null);
  const [diffSolution, setDiffSolution] = useState<typeof solutions[string] | null>(null);

  const updateMatrix = (r: number, c: number, val: string) => {
    const copy = matrixValues.map(row => [...row]);
    copy[r][c] = val;
    setMatrixValues(copy);
  };

  const solveLinear = () => {
    try {
      const steps: string[] = [];
      const eq = equation.trim();
      setLinearGraph(null);
      
      if (!eq) { setLinearResult("Please enter an equation."); return; }

      if (eq.includes("=")) {
        const [left, right] = eq.split("=").map(s => s.trim());
        steps.push(`Given: ${left} = ${right}`);
        
        const vars = eq.match(/[a-zA-Z]/g);
        const uniqueVars = [...new Set(vars || [])].filter(v => !["e", "E"].includes(v));
        
        if (uniqueVars.length === 1) {
          const variable = uniqueVars[0];
          steps.push(`Solving for ${variable}...`);
          steps.push(`Rearranging: ${left} - (${right}) = 0`);
          
          const expr = `${left} - (${right})`;
          const node = math.parse(expr);
          const simplified = math.simplify(node);
          steps.push(`Simplified: ${simplified.toString()} = 0`);
          
          const f = (val: number) => {
            const scope: Record<string, number> = {};
            scope[variable] = val;
            return simplified.evaluate(scope) as number;
          };
          
          let x = 0;
          for (let i = 0; i < 100; i++) {
            const fx = f(x);
            if (Math.abs(fx) < 1e-12) break;
            const dfx = (f(x + 1e-8) - fx) / 1e-8;
            if (Math.abs(dfx) < 1e-15) { x += 0.1; continue; }
            x = x - fx / dfx;
          }
          
          const rounded = Math.abs(x) < 1e-10 ? 0 : parseFloat(x.toFixed(8));
          steps.push(`${variable} = ${rounded}`);
          setLinearResult(`${variable} = ${rounded}`);

          try {
            const f0 = (() => { const s: Record<string, number> = {}; s[variable] = 0; return math.evaluate(right, s) as number; })();
            const f1 = (() => { const s: Record<string, number> = {}; s[variable] = 1; return math.evaluate(right, s) as number; })();
            const f2 = (() => { const s: Record<string, number> = {}; s[variable] = 2; return math.evaluate(right, s) as number; })();
            const m1 = f1 - f0;
            const m2 = f2 - f1;
            if (Math.abs(m1 - m2) < 1e-8) {
              steps.push(`Slope (m) = ${parseFloat(m1.toFixed(6))}`);
              steps.push(`y-intercept (c) = ${parseFloat(f0.toFixed(6))}`);
              steps.push(`To find c: set ${variable} = 0 → y = ${parseFloat(f0.toFixed(6))}`);
              setLinearGraph({ m: parseFloat(m1.toFixed(6)), c: parseFloat(f0.toFixed(6)) });
            }
          } catch {}
        } else if (uniqueVars.length === 0) {
          const leftVal = math.evaluate(left);
          const rightVal = math.evaluate(right);
          steps.push(`Left side = ${leftVal}`);
          steps.push(`Right side = ${rightVal}`);
          const equal = Math.abs(Number(leftVal) - Number(rightVal)) < 1e-10;
          setLinearResult(equal ? "✓ Equation is TRUE" : "✗ Equation is FALSE");
        } else if (uniqueVars.length === 2) {
          steps.push(`Variables: ${uniqueVars.join(", ")}`);
          const yVar = uniqueVars.find(v => v === "y") || uniqueVars[0];
          const xVar = uniqueVars.find(v => v !== yVar) || uniqueVars[1];
          steps.push(`Treating ${yVar} as dependent, ${xVar} as independent`);
          
          try {
            const expr = `${left} - (${right})`;
            const simplified = math.simplify(math.parse(expr));
            const evalAt = (xVal: number) => {
              const s: Record<string, number> = {};
              s[xVar] = xVal;
              s[yVar] = 0;
              const atZero = simplified.evaluate(s) as number;
              s[yVar] = 1;
              const atOne = simplified.evaluate(s) as number;
              const dyCoeff = atOne - atZero;
              return dyCoeff !== 0 ? -atZero / dyCoeff : 0;
            };
            const y0 = evalAt(0);
            const y1 = evalAt(1);
            const y2 = evalAt(2);
            const m = y1 - y0;
            if (Math.abs((y2 - y1) - m) < 1e-8) {
              steps.push(`${yVar} = ${m}${xVar}${y0 >= 0 ? " + " : " - "}${Math.abs(y0)}`);
              steps.push(`Slope (m) = ${parseFloat(m.toFixed(6))}`);
              steps.push(`${yVar}-intercept (c) = ${parseFloat(y0.toFixed(6))}`);
              steps.push(`To find c: set ${xVar} = 0 → c = ${parseFloat(y0.toFixed(6))}`);
              setLinearResult(`${yVar} = ${parseFloat(m.toFixed(6))}·${xVar} + ${parseFloat(y0.toFixed(6))}`);
              setLinearGraph({ m: parseFloat(m.toFixed(6)), c: parseFloat(y0.toFixed(6)) });
            } else {
              setLinearResult(`${simplified.toString()} = 0`);
            }
          } catch {
            const expr = `${left} - (${right})`;
            const simplified = math.simplify(math.parse(expr));
            setLinearResult(`${simplified.toString()} = 0`);
          }
        } else {
          steps.push(`Multiple variables: ${uniqueVars.join(", ")}`);
          const expr = `${left} - (${right})`;
          const simplified = math.simplify(math.parse(expr));
          setLinearResult(`${simplified.toString()} = 0`);
        }
      } else {
        steps.push(`Evaluating: ${eq}`);
        const result = math.evaluate(eq);
        steps.push(`= ${result}`);
        setLinearResult(`Result: ${result}`);
      }
      
      setLinearSteps(steps);
    } catch (err: any) {
      setLinearResult(`Error: ${err.message}`);
      setLinearSteps([]);
    }
  };

  const solveMatrix = (op: string) => {
    try {
      const nums = matrixValues.map(row => row.map(v => {
        const n = parseFloat(v);
        if (isNaN(n)) throw new Error(`Invalid number: "${v}"`);
        return n;
      }));
      const M = math.matrix(nums);

      let result = "";
      switch (op) {
        case "Determinant":
          result = `det(A) = ${math.det(M)}`;
          break;
        case "Inverse":
          result = `A⁻¹ = \n${math.format(math.inv(M), { precision: 4 })}`;
          break;
        case "Eigenvalues": {
          const eig = math.eigs(M);
          result = `Eigenvalues: ${math.format((eig as any).values, { precision: 4 })}`;
          break;
        }
        case "Diagonalization": {
          const eig = math.eigs(M);
          result = `Eigenvalues: ${math.format((eig as any).values, { precision: 4 })}\nEigenvectors:\n${math.format((eig as any).vectors, { precision: 4 })}`;
          break;
        }
        case "Hermitian Check": {
          const t = math.transpose(M);
          const isHermitian = math.deepEqual(M, t);
          result = isHermitian ? "✓ Matrix is Hermitian (symmetric)" : "✗ Matrix is NOT Hermitian";
          break;
        }
        case "Unitary Check": {
          const t = math.transpose(M);
          const product = math.multiply(M, t);
          const identity = math.identity(matrixSize) as math.Matrix;
          const diff = math.subtract(product, identity) as math.Matrix;
          const norm = math.norm(diff) as number;
          result = norm < 1e-6 ? "✓ Matrix is Unitary (orthogonal)" : `✗ Matrix is NOT Unitary (‖MMᵀ - I‖ = ${norm.toFixed(6)})`;
          break;
        }
        case "Matrix Exp":
          result = `e^A = \n${math.format(math.expm(M), { precision: 4 })}`;
          break;
        default:
          result = "Operation not implemented.";
      }
      setMatrixResult(result);
    } catch (err: any) {
      setMatrixResult(`Error: ${err.message}`);
    }
  };

  const solveDiff = () => {
    if (!selectedDiffType) {
      setDiffSolution(null);
      return;
    }
    const sol = solutions[selectedDiffType];
    if (!sol) {
      setDiffSolution(null);
      return;
    }
    // Trigger re-render of AnimatedSteps with new key
    setDiffSolution(null);
    setTimeout(() => setDiffSolution(sol), 50);
  };

  return (
    <PageLayout>
      <ScienceBackground />
      <div className="relative container px-4 py-12">
        <PhysicsBackground />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Equation <span className="text-gradient">Solver</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Solve linear, differential, and matrix equations with animated step-by-step solutions.
          </p>
        </motion.div>

        <Tabs defaultValue="linear" className="space-y-6 relative z-10">
          <TabsList className="glass-card !p-1 !rounded-xl border-glass-border/30">
            <TabsTrigger value="linear" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Linear</TabsTrigger>
            <TabsTrigger value="differential" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Differential</TabsTrigger>
            <TabsTrigger value="matrix" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Matrix</TabsTrigger>
            <TabsTrigger value="presets" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Presets</TabsTrigger>
          </TabsList>

          {/* Linear */}
          <TabsContent value="linear">
            <GlassCard glow>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Linear Equation Solver</h2>
              <div className="flex gap-3 mb-6">
                <Input
                  placeholder="e.g. 2*x + 3 = 7  or  3*x^2 - 12 = 0"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  className="bg-secondary/50 border-border font-mono"
                  onKeyDown={(e) => e.key === "Enter" && solveLinear()}
                />
                <Button onClick={solveLinear} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play size={14} /> Solve
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {["Solve for any variable", "Step-by-step solution", "Plot result"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChevronRight size={14} className="text-primary" /> {f}
                  </div>
                ))}
              </div>

              <div className="mt-6 glass-card !p-6">
                {linearResult ? (
                  <div className="space-y-2">
                    {linearSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="text-sm text-muted-foreground font-mono"
                      >
                        <span className="text-primary/50 mr-2">Step {i + 1}:</span> {step}
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: linearSteps.length * 0.15 }}
                      className="mt-4 pt-4 border-t border-border/50 text-lg font-mono font-bold text-primary"
                    >
                      {linearResult}
                    </motion.div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Enter an equation above and click Solve to see results here.
                  </p>
                )}
              </div>
              {linearGraph && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Graph: y = {linearGraph.m}x + {linearGraph.c}</h3>
                  <LinearSolverGraph m={linearGraph.m} c={linearGraph.c} />
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Differential */}
          <TabsContent value="differential">
            <GlassCard glow>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Differential Equation Solver</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {Object.keys(solutions).map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className={`w-full justify-start border-border transition-all duration-300 ${
                        selectedDiffType === t
                          ? "bg-primary/15 border-primary/40 text-primary glow-border"
                          : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      }`}
                      onClick={() => { setSelectedDiffType(t); setDiffSolution(null); }}
                    >
                      {t}
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  value={diffEqInput}
                  onChange={(e) => setDiffEqInput(e.target.value)}
                  placeholder="Enter differential equation..."
                  className="bg-secondary/50 border-border font-mono"
                />
                <Input placeholder="Boundary conditions (optional)..." className="bg-secondary/50 border-border font-mono" />
                <div className="flex gap-3">
                  <Button onClick={solveDiff} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play size={14} /> Solve
                  </Button>
                  <Button variant="outline" className="gap-2 border-border" onClick={() => { setDiffSolution(null); setSelectedDiffType(null); setDiffEqInput(""); }}>
                    <RotateCcw size={14} /> Reset
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                {diffSolution ? (
                  <AnimatedSteps
                    equation={diffSolution.equation}
                    steps={diffSolution.steps}
                    solution={diffSolution.solution}
                    explanation={diffSolution.explanation}
                  />
                ) : (
                  <div className="glass-card !p-6">
                    <p className="text-center text-muted-foreground text-sm">
                      Select an equation type and click Solve to see animated derivation.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Matrix */}
          <TabsContent value="matrix">
            <GlassCard glow>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Matrix Solver</h2>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-muted-foreground">Size:</span>
                {[2, 3, 4].map(n => (
                  <Button
                    key={n}
                    variant={matrixSize === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setMatrixSize(n);
                      setMatrixValues(Array.from({ length: n }, () => Array(n).fill("0")));
                      setMatrixResult(null);
                    }}
                    className={matrixSize === n ? "bg-primary text-primary-foreground" : "border-border"}
                  >
                    {n}×{n}
                  </Button>
                ))}
              </div>

              <div className="inline-grid gap-1 mb-6" style={{ gridTemplateColumns: `repeat(${matrixSize}, 60px)` }}>
                {matrixValues.map((row, r) =>
                  row.map((val, c) => (
                    <Input
                      key={`${r}-${c}`}
                      value={val}
                      onChange={(e) => updateMatrix(r, c, e.target.value)}
                      className="h-10 w-[60px] text-center font-mono text-sm bg-secondary/50 border-border"
                    />
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {matrixOps.map(op => (
                  <Button key={op} variant="outline" size="sm" className="border-border hover:bg-primary/10 hover:text-primary" onClick={() => solveMatrix(op)}>
                    {op}
                  </Button>
                ))}
              </div>

              <div className="mt-6 glass-card !p-6">
                {matrixResult ? (
                  <motion.pre
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-mono text-primary whitespace-pre-wrap"
                  >
                    {matrixResult}
                  </motion.pre>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Enter matrix values and select an operation.
                  </p>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Presets */}
          <TabsContent value="presets">
            <GlassCard glow className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Differential Equation Presets</h2>
              <p className="text-sm text-muted-foreground mb-4">Classic differential equation templates</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {diffPresets.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <GlassCard hover className="cursor-pointer !p-4" onClick={() => { setSelectedDiffType(p.name.replace(" Equation", " ODE").replace("Heat ODE", "Heat Equation").replace("Wave ODE", "Wave Equation").replace("Laplace ODE", "Laplace Equation").replace("Helmholtz ODE", "Helmholtz Equation")); setDiffEqInput(p.eq); }}>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
                      <p className="font-mono text-primary text-xs">{p.eq}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <GlassCard glow className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Integral Presets</h2>
              <p className="text-sm text-muted-foreground mb-4">Common integral formulas and transforms</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {integralPresets.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <GlassCard hover className="cursor-pointer !p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
                      <p className="font-mono text-primary text-xs">{p.eq}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <h2 className="text-lg font-semibold text-foreground mb-4">
              Physics <span className="text-gradient">Linear Equations</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              All these equations follow the y = mx + c form. Select one to see the mapping, explanation, and graph.
            </p>
            <PhysicsPresets />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default EquationSolver;
