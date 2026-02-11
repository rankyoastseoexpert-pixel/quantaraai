import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Play, Download, RotateCcw, ChevronRight } from "lucide-react";
import * as math from "mathjs";

const presets = [
  { name: "Schrödinger (TDSE)", eq: "iℏ ∂Ψ/∂t = ĤΨ" },
  { name: "Schrödinger (TISE)", eq: "Ĥψ = Eψ" },
  { name: "Legendre Equation", eq: "(1-x²)y'' - 2xy' + l(l+1)y = 0" },
  { name: "Bessel Equation", eq: "x²y'' + xy' + (x²-n²)y = 0" },
  { name: "Heat Equation", eq: "∂u/∂t = α∇²u" },
  { name: "Wave Equation", eq: "∂²u/∂t² = c²∇²u" },
];

const matrixOps = ["Determinant", "Inverse", "Eigenvalues", "Diagonalization", "Hermitian Check", "Unitary Check", "Matrix Exp"];

const EquationSolver = () => {
  const [equation, setEquation] = useState("");
  const [linearResult, setLinearResult] = useState<string | null>(null);
  const [linearSteps, setLinearSteps] = useState<string[]>([]);
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
      
      if (!eq) { setLinearResult("Please enter an equation."); return; }

      // Try to solve equation like "2*x + 3 = 7"
      if (eq.includes("=")) {
        const [left, right] = eq.split("=").map(s => s.trim());
        steps.push(`Given: ${left} = ${right}`);
        
        // Try to find the variable
        const vars = eq.match(/[a-zA-Z]/g);
        const uniqueVars = [...new Set(vars || [])].filter(v => !["e", "E"].includes(v));
        
        if (uniqueVars.length === 1) {
          const variable = uniqueVars[0];
          steps.push(`Solving for ${variable}...`);
          steps.push(`Rearranging: ${left} - (${right}) = 0`);
          
          const expr = `${left} - (${right})`;
          // Use mathjs to simplify and solve
          const node = math.parse(expr);
          const simplified = math.simplify(node);
          steps.push(`Simplified: ${simplified.toString()} = 0`);
          
          // Numerical solve using mathjs
          const f = (val: number) => {
            const scope: Record<string, number> = {};
            scope[variable] = val;
            return simplified.evaluate(scope) as number;
          };
          
          // Simple Newton's method
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
        } else if (uniqueVars.length === 0) {
          // Check equality
          const leftVal = math.evaluate(left);
          const rightVal = math.evaluate(right);
          steps.push(`Left side = ${leftVal}`);
          steps.push(`Right side = ${rightVal}`);
          const equal = Math.abs(Number(leftVal) - Number(rightVal)) < 1e-10;
          setLinearResult(equal ? "✓ Equation is TRUE" : "✗ Equation is FALSE");
        } else {
          steps.push(`Multiple variables detected: ${uniqueVars.join(", ")}`);
          steps.push("Express one variable in terms of others:");
          const expr = `${left} - (${right})`;
          const simplified = math.simplify(math.parse(expr));
          setLinearResult(`${simplified.toString()} = 0`);
        }
      } else {
        // Just evaluate expression
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
    // Provide analytical solutions for known types
    const solutions: Record<string, string> = {
      "First-order ODE": "General solution: y' = f(x,y)\nFor y' = ay: y(x) = Ce^(ax)\nFor y' + P(x)y = Q(x): y = e^(-∫P dx)[∫Q·e^(∫P dx) dx + C]",
      "Second-order ODE": "General solution: y'' + py' + qy = 0\nCharacteristic equation: r² + pr + q = 0\nSolution: y = C₁e^(r₁x) + C₂e^(r₂x)",
      "Legendre ODE": "(1-x²)y'' - 2xy' + l(l+1)y = 0\nSolutions: Legendre polynomials Pₗ(x)\nP₀=1, P₁=x, P₂=(3x²-1)/2, P₃=(5x³-3x)/2",
      "Bessel ODE": "x²y'' + xy' + (x²-n²)y = 0\nSolutions: Bessel functions Jₙ(x), Yₙ(x)\nJ₀(0) = 1, Y₀ diverges at x=0",
      "Heat Equation": "∂u/∂t = α∇²u\nSolution (1D): u(x,t) = Σ Bₙ sin(nπx/L) e^(-α(nπ/L)²t)\nBₙ = (2/L)∫₀ᴸ f(x)sin(nπx/L)dx",
      "Wave Equation": "∂²u/∂t² = c²∇²u\nD'Alembert solution: u(x,t) = f(x-ct) + g(x+ct)\nStanding waves: u = sin(nπx/L)cos(nπct/L)",
      "Laplace Equation": "∇²u = 0\nSolution (2D rectangular): u(x,y) = Σ(Aₙcosh(nπy/L) + Bₙsinh(nπy/L))sin(nπx/L)"
    };
    setDiffResult(solutions[selectedDiffType] || "Solution method not available for this type.");
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
            <div className="grid sm:grid-cols-2 gap-4">
              {presets.map(p => (
                <GlassCard key={p.name} hover className="cursor-pointer">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{p.name}</h3>
                  <p className="font-mono text-primary text-sm">{p.eq}</p>
                </GlassCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default EquationSolver;
