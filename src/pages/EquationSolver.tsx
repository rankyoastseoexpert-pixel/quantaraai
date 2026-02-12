import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Play, Download, RotateCcw, ChevronRight } from "lucide-react";
import * as math from "mathjs";
import LinearSolverGraph from "@/components/LinearSolverGraph";
import PhysicsPresets from "@/components/PhysicsPresets";

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
  const [diffResult, setDiffResult] = useState<string | null>(null);
  const [selectedDiffType, setSelectedDiffType] = useState<string | null>(null);

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

          // Try to detect y=mx+c pattern for graphing
          try {
            const f0 = (() => { const s: Record<string, number> = {}; s[variable] = 0; return math.evaluate(right, s) as number; })();
            const f1 = (() => { const s: Record<string, number> = {}; s[variable] = 1; return math.evaluate(right, s) as number; })();
            // Check linearity
            const f2 = (() => { const s: Record<string, number> = {}; s[variable] = 2; return math.evaluate(right, s) as number; })();
            const m1 = f1 - f0;
            const m2 = f2 - f1;
            if (Math.abs(m1 - m2) < 1e-8) {
              // It's linear! Plot it as y = mx + c
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
          // Two-variable linear equation — plot as y = f(x)
          steps.push(`Variables: ${uniqueVars.join(", ")}`);
          const yVar = uniqueVars.find(v => v === "y") || uniqueVars[0];
          const xVar = uniqueVars.find(v => v !== yVar) || uniqueVars[1];
          steps.push(`Treating ${yVar} as dependent, ${xVar} as independent`);
          
          // Try to evaluate as linear
          try {
            const expr = `${left} - (${right})`;
            const simplified = math.simplify(math.parse(expr));
            // Evaluate at two points to get slope
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
          const values = (eig as any).values;
          result = `Eigenvalues: ${math.format(values, { precision: 4 })}`;
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
        case "Matrix Exp": {
          result = `e^A = \n${math.format(math.expm(M), { precision: 4 })}`;
          break;
        }
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
      setDiffResult("Please select an equation type first.");
      return;
    }

    const solutions: Record<string, { equation: string; steps: string[]; solution: string; explanation: string }> = {
      "First-order ODE": {
        equation: "y' + P(x)y = Q(x)",
        steps: [
          "Step 1: Identify the form y' + P(x)y = Q(x) (Linear First-Order ODE)",
          "Step 2: Calculate integrating factor: μ(x) = e^(∫P(x)dx)",
          "Step 3: Multiply both sides by μ(x): μ(x)y' + μ(x)P(x)y = μ(x)Q(x)",
          "Step 4: Left side becomes d/dx[μ(x)y]",
          "Step 5: Integrate both sides: μ(x)y = ∫μ(x)Q(x)dx + C",
          "Step 6: Solve for y: y = (1/μ(x))[∫μ(x)Q(x)dx + C]"
        ],
        solution: "y(x) = e^(-∫P(x)dx) · [∫Q(x)·e^(∫P(x)dx)dx + C]",
        explanation: "First-order linear ODEs are solved using the integrating factor method. This exponential factor transforms the equation into an exact derivative form, allowing direct integration."
      },
      "Second-order ODE": {
        equation: "y'' + py' + qy = 0 (Homogeneous, constant coefficients)",
        steps: [
          "Step 1: Assume solution form y = e^(rx)",
          "Step 2: Calculate derivatives: y' = re^(rx), y'' = r²e^(rx)",
          "Step 3: Substitute into ODE: r²e^(rx) + pre^(rx) + qe^(rx) = 0",
          "Step 4: Factor out e^(rx): e^(rx)[r² + pr + q] = 0",
          "Step 5: Solve characteristic equation: r² + pr + q = 0",
          "Step 6: Using quadratic formula: r = (-p ± √(p²-4q))/2",
          "Step 7: Case 1 (r₁ ≠ r₂): y = C₁e^(r₁x) + C₂e^(r₂x)",
          "Step 8: Case 2 (r₁ = r₂): y = (C₁ + C₂x)e^(r₁x)"
        ],
        solution: "y(x) = C₁e^(r₁x) + C₂e^(r₂x), where r₁,r₂ are roots of r² + pr + q = 0",
        explanation: "Second-order linear ODEs with constant coefficients are solved by assuming exponential solutions. The characteristic equation determines the form of the general solution."
      },
      "Legendre ODE": {
        equation: "(1-x²)y'' - 2xy' + l(l+1)y = 0",
        steps: [
          "Step 1: Recognize as Legendre's equation with parameter l",
          "Step 2: This is a regular singular point ODE at x = ±1",
          "Step 3: Solutions are Legendre polynomials Pₗ(x) and Qₗ(x)",
          "Step 4: Compute first few polynomials:",
          "       P₀(x) = 1",
          "       P₁(x) = x",
          "       P₂(x) = (3x² - 1)/2",
          "       P₃(x) = (5x³ - 3x)/2",
          "Step 5: General solution: y(x) = C₁Pₗ(x) + C₂Qₗ(x)"
        ],
        solution: "y(x) = C₁Pₗ(x) + C₂Qₗ(x), where Pₗ are Legendre polynomials",
        explanation: "Legendre's equation appears in solving Laplace's equation in spherical coordinates. Legendre polynomials are orthogonal and widely used in physics and engineering."
      },
      "Bessel ODE": {
        equation: "x²y'' + xy' + (x²-n²)y = 0",
        steps: [
          "Step 1: Recognize as Bessel's equation of order n",
          "Step 2: Regular singular point at x = 0",
          "Step 3: Try Frobenius series: y = x^s Σ aₖx^k",
          "Step 4: Indicial equation gives s = ±n",
          "Step 5: First linearly independent solution: Jₙ(x) (Bessel function of first kind)",
          "Step 6: Second solution: Yₙ(x) (Bessel function of second kind, unbounded at x=0)",
          "Step 7: General solution: y(x) = C₁Jₙ(x) + C₂Yₙ(x)"
        ],
        solution: "y(x) = C₁Jₙ(x) + C₂Yₙ(x), where Jₙ, Yₙ are Bessel functions",
        explanation: "Bessel's equation appears in cylindrical coordinate problems. Bessel functions oscillate and decay, fundamental in vibrations, wave propagation, and heat conduction in cylinders."
      },
      "Heat Equation": {
        equation: "∂u/∂t = α∇²u (Heat conduction)",
        steps: [
          "Step 1: Use separation of variables: u(x,t) = X(x)T(t)",
          "Step 2: Substitute into PDE: X(x)T'(t) = αX''(x)T(t)",
          "Step 3: Divide by αX(x)T(t): (1/α)·(T'/T) = X''/X = -λ (separation constant)",
          "Step 4: Spatial equation: X'' + λX = 0 → X(x) = A sin(√λ x) + B cos(√λ x)",
          "Step 5: Temporal equation: T' + αλT = 0 → T(t) = Ce^(-αλt)",
          "Step 6: Apply boundary conditions to find λₙ and coefficients",
          "Step 7: Sum over all modes: u(x,t) = Σ Bₙ sin(nπx/L) e^(-α(nπ/L)²t)"
        ],
        solution: "u(x,t) = Σ Bₙ sin(nπx/L) exp(-α(nπ/L)²t), where Bₙ = (2/L)∫₀ᴸ f(x)sin(nπx/L)dx",
        explanation: "The heat equation models temperature diffusion. Solutions show how initial temperature distribution spreads and smooths over time, with exponential decay of higher-frequency modes."
      },
      "Wave Equation": {
        equation: "∂²u/∂t² = c²∇²u (Wave propagation)",
        steps: [
          "Step 1: Use separation of variables: u(x,t) = X(x)T(t)",
          "Step 2: Substitute: X(x)T''(t) = c²X''(x)T(t)",
          "Step 3: Separate: T''/c²T = X''/X = -λ",
          "Step 4: Spatial: X'' + λX = 0 → X(x) = A sin(√λ x) + B cos(√λ x)",
          "Step 5: Temporal: T'' + c²λT = 0 → T(t) = C cos(ωt) + D sin(ωt), ω = c√λ",
          "Step 6: Standing wave solution: u(x,t) = sin(nπx/L)cos(nπct/L + φ)",
          "Step 7: D'Alembert's general solution: u(x,t) = f(x-ct) + g(x+ct)"
        ],
        solution: "u(x,t) = f(x-ct) + g(x+ct), or u = Σ[Aₙcos(nπct/L) + Bₙsin(nπct/L)]sin(nπx/L)",
        explanation: "The wave equation describes vibrating strings, sound waves, and electromagnetic waves. Solutions are superpositions of left and right-traveling waves with no damping."
      },
      "Laplace Equation": {
        equation: "∇²u = 0 (Steady-state, no time dependence)",
        steps: [
          "Step 1: In 2D Cartesian: ∂²u/∂x² + ∂²u/∂y² = 0",
          "Step 2: Use separation: u(x,y) = X(x)Y(y)",
          "Step 3: Separate: X''/X = -Y''/Y = λ",
          "Step 4: Spatial solutions: X(x) = A sin(√λ x) + B cos(√λ x)",
          "Step 5: Y-equation: Y'' - λY = 0 → Y(y) = C sinh(√λ y) + D cosh(√λ y)",
          "Step 6: Apply boundary conditions to find λₙ",
          "Step 7: General solution (rectangular domain):",
          "       u(x,y) = Σ[Aₙcosh(nπy/L) + Bₙsinh(nπy/L)]sin(nπx/L)"
        ],
        solution: "u(x,y) = Σ[Aₙcosh(nπy/L) + Bₙsinh(nπy/L)]sin(nπx/L)",
        explanation: "Laplace's equation governs steady-state heat, electrostatics, and fluid flow. Solutions are harmonic functions with no sources/sinks and represent equilibrium states."
      }
    };

    const selected = solutions[selectedDiffType];
    if (!selected) {
      setDiffResult("Solution method not available for this type.");
      return;
    }

    const output = `
📋 EQUATION: ${selected.equation}

${selected.steps.map(s => s).join("\n")}

✅ FINAL ANSWER:
${selected.solution}

💡 EXPLANATION:
${selected.explanation}
    `.trim();

    setDiffResult(output);
  };

  return (
    <PageLayout>
      <div className="container px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Equation <span className="text-gradient">Solver</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Solve linear, differential, and matrix equations with step-by-step solutions.
          </p>
        </motion.div>

        <Tabs defaultValue="linear" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-xl">
            <TabsTrigger value="linear" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Linear</TabsTrigger>
            <TabsTrigger value="differential" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Differential</TabsTrigger>
            <TabsTrigger value="matrix" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Matrix</TabsTrigger>
            <TabsTrigger value="presets" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Presets</TabsTrigger>
          </TabsList>

          {/* Linear */}
          <TabsContent value="linear">
            <GlassCard>
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

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6">
                {linearResult ? (
                  <div className="space-y-2">
                    {linearSteps.map((step, i) => (
                      <div key={i} className="text-sm text-muted-foreground font-mono">
                        <span className="text-primary/50 mr-2">Step {i + 1}:</span> {step}
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border/50 text-lg font-mono font-bold text-primary">
                      {linearResult}
                    </div>
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
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Differential Equation Solver</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {["First-order ODE", "Second-order ODE", "Legendre ODE", "Bessel ODE", "Heat Equation", "Wave Equation", "Laplace Equation"].map(t => (
                  <Button
                    key={t}
                    variant="outline"
                    className={`justify-start border-border ${selectedDiffType === t ? "bg-primary/15 border-primary/30 text-primary" : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"}`}
                    onClick={() => setSelectedDiffType(t)}
                  >
                    {t}
                  </Button>
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
                  <Button variant="outline" className="gap-2 border-border" onClick={() => { setDiffResult(null); setSelectedDiffType(null); setDiffEqInput(""); }}>
                    <RotateCcw size={14} /> Reset
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6">
                {diffResult ? (
                  <pre className="text-sm font-mono text-primary whitespace-pre-wrap">{diffResult}</pre>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Select an equation type, enter your equation, and solve.
                  </p>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Matrix */}
          <TabsContent value="matrix">
            <GlassCard>
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

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6">
                {matrixResult ? (
                  <pre className="text-sm font-mono text-primary whitespace-pre-wrap">{matrixResult}</pre>
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
            <GlassCard className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Differential Equation Presets</h2>
              <p className="text-sm text-muted-foreground mb-4">Classic differential equation templates</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {diffPresets.map(p => (
                  <GlassCard key={p.name} hover className="cursor-pointer !p-4" onClick={() => { setSelectedDiffType(p.name.replace(" Equation", "")); setDiffEqInput(p.eq); }}>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
                    <p className="font-mono text-primary text-xs">{p.eq}</p>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Integral Presets</h2>
              <p className="text-sm text-muted-foreground mb-4">Common integral formulas and transforms</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {integralPresets.map(p => (
                  <GlassCard key={p.name} hover className="cursor-pointer !p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
                    <p className="font-mono text-primary text-xs">{p.eq}</p>
                  </GlassCard>
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
