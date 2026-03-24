import { useState } from "react";
import LaTeXEquationEditor from "@/components/LaTeXEquationEditor";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, ChevronRight, Plus, Trash2, BookOpen, FlaskConical, Download } from "lucide-react";
import * as math from "mathjs";
import LinearSolverGraph from "@/components/LinearSolverGraph";
import PhysicsPresets from "@/components/PhysicsPresets";
import PhysicsBackground from "@/components/PhysicsBackground";
import ScienceBackground from "@/components/ScienceBackground";
import AnimatedSteps from "@/components/AnimatedSteps";
import DerivativeStepsView from "@/components/DerivativeStepsView";
import { solveDerivative, derivativePresets, type DerivativeResult } from "@/lib/derivativeEngine";
import { extractVariables, extractVariablesFromSystem, describeSystem } from "@/lib/variableDetector";

const diffPresets = [
  { name: "First-order ODE", eq: "y' + P(x)y = Q(x)", key: "First-order ODE" },
  { name: "Second-order ODE", eq: "y'' + py' + qy = 0", key: "Second-order ODE" },
  { name: "Legendre Equation", eq: "(1-x²)y'' - 2xy' + l(l+1)y = 0", key: "Legendre ODE" },
  { name: "Bessel Equation", eq: "x²y'' + xy' + (x²-n²)y = 0", key: "Bessel ODE" },
  { name: "Heat Equation", eq: "∂u/∂t = α∇²u", key: "Heat Equation" },
  { name: "Wave Equation", eq: "∂²u/∂t² = c²∇²u", key: "Wave Equation" },
  { name: "Laplace Equation", eq: "∇²u = 0", key: "Laplace Equation" },
  { name: "Helmholtz Equation", eq: "∇²f + k²f = 0", key: "Helmholtz Equation" },
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
  "Helmholtz Equation": {
    equation: "∇²f + k²f = 0",
    steps: [
      "Recognize as the Helmholtz equation with wave number k",
      "In 1D Cartesian: d²f/dx² + k²f = 0",
      "Characteristic equation: r² + k² = 0 → r = ±ik",
      "General solution: f(x) = A e^(ikx) + B e^(-ikx)",
      "Using Euler's formula: f(x) = C cos(kx) + D sin(kx)",
      "In 3D, separate variables: f = X(x)Y(y)Z(z)",
      "Each factor satisfies its own oscillatory ODE with k² split among axes",
    ],
    solution: "f(x) = C cos(kx) + D sin(kx)  [1D case]",
    explanation: "The Helmholtz equation arises from separating the time-independent wave equation. Solutions are standing waves. It governs resonance in cavities, diffraction, and quantum mechanics (time-independent Schrödinger equation).",
  },
};

interface CustomEquation {
  id: string;
  name: string;
  equation: string;
  steps: string[];
  solution: string;
  explanation: string;
}

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

  // Derivative calculator state
  const [derivInput, setDerivInput] = useState("");
  const [derivResult, setDerivResult] = useState<DerivativeResult | null>(null);
  const [derivError, setDerivError] = useState<string | null>(null);

  // System of linear equations
  const [systemEqs, setSystemEqs] = useState<string[]>(["", ""]);
  const [systemResult, setSystemResult] = useState<string | null>(null);
  const [systemSteps, setSystemSteps] = useState<string[]>([]);

  // Custom equations
  const [customEquations, setCustomEquations] = useState<CustomEquation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEq, setCustomEq] = useState("");
  const [customSolution, setCustomSolution] = useState("");
  const [customExplanation, setCustomExplanation] = useState("");
  const [customStepsRaw, setCustomStepsRaw] = useState("");

  const handleSolveDerivative = () => {
    setDerivError(null);
    setDerivResult(null);
    const input = derivInput.trim();
    if (!input) { setDerivError("Please enter an expression to differentiate."); return; }
    try {
      const result = solveDerivative(input);
      setDerivResult(result);
    } catch (e: any) {
      setDerivError(`Could not parse expression: ${e.message}`);
    }
  };

  const addCustomEquation = () => {
    if (!customName.trim() || !customEq.trim()) return;
    const steps = customStepsRaw.split("\n").map(s => s.trim()).filter(Boolean);
    const newEq: CustomEquation = {
      id: Date.now().toString(),
      name: customName.trim(),
      equation: customEq.trim(),
      steps: steps.length > 0 ? steps : [`Given: ${customEq.trim()}`, "Apply appropriate method", "Solve for the unknown function"],
      solution: customSolution.trim() || "Solution depends on boundary conditions",
      explanation: customExplanation.trim() || "User-defined equation.",
    };
    setCustomEquations(prev => [...prev, newEq]);
    setCustomName(""); setCustomEq(""); setCustomSolution(""); setCustomExplanation(""); setCustomStepsRaw("");
    setShowAddForm(false);
  };

  const removeCustomEquation = (id: string) => {
    setCustomEquations(prev => prev.filter(e => e.id !== id));
    if (selectedDiffType === id) { setSelectedDiffType(null); setDiffSolution(null); }
  };

  const solveCustomDiff = (eq: CustomEquation) => {
    setSelectedDiffType(eq.id);
    setDiffSolution(null);
    setDiffEqInput(eq.equation);
    setTimeout(() => setDiffSolution({ equation: eq.equation, steps: eq.steps, solution: eq.solution, explanation: eq.explanation }), 50);
  };

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
        steps.push(`━━━ Step 1: Identify the equation ━━━`);
        steps.push(`Given equation: ${left} = ${right}`);
        
        const uniqueVars = extractVariables(eq);
        
        if (uniqueVars.length === 1) {
          const variable = uniqueVars[0];
          
          steps.push(`This is a single-variable equation in "${variable}".`);
          
          steps.push(``);
          steps.push(`━━━ Step 2: Move all terms to one side ━━━`);
          steps.push(`${left} − (${right}) = 0`);
          
          const expr = `${left} - (${right})`;
          const node = math.parse(expr);
          const simplified = math.simplify(node);
          const simplifiedStr = simplified.toString();
          steps.push(`Simplify: ${simplifiedStr} = 0`);
          
          steps.push(``);
          steps.push(`━━━ Step 3: Solve for ${variable} ━━━`);
          
          // Check if it's linear: f(x) = ax + b
          const f = (val: number) => {
            const scope: Record<string, number> = {};
            scope[variable] = val;
            return simplified.evaluate(scope) as number;
          };
          
          const f0 = f(0);
          const f1 = f(1);
          const f2 = f(2);
          const isLinear = Math.abs((f2 - f1) - (f1 - f0)) < 1e-8;
          
          if (isLinear) {
            const a = f1 - f0; // coefficient of variable
            const b = f0;      // constant term
            steps.push(`Identify coefficients: ${a !== 0 ? `${a.toFixed(4)}·${variable}` : ""}${b >= 0 ? ` + ${b.toFixed(4)}` : ` − ${Math.abs(b).toFixed(4)}`} = 0`);
            if (a !== 0) {
              steps.push(`Move constant to RHS: ${a.toFixed(4)}·${variable} = ${(-b).toFixed(4)}`);
              steps.push(`Divide both sides by ${a.toFixed(4)}:`);
              const solution = -b / a;
              const rounded = Math.abs(solution) < 1e-10 ? 0 : parseFloat(solution.toFixed(8));
              steps.push(`${variable} = ${(-b).toFixed(4)} / ${a.toFixed(4)}`);
              steps.push(`${variable} = ${rounded}`);
              
              steps.push(``);
              steps.push(`━━━ Step 4: Verify the solution ━━━`);
              steps.push(`Substitute ${variable} = ${rounded} back into original equation:`);
              const scope: Record<string, number> = {};
              scope[variable] = rounded;
              const lhsVal = math.evaluate(left, scope) as number;
              const rhsVal = math.evaluate(right, scope) as number;
              steps.push(`LHS = ${left} = ${parseFloat(lhsVal.toFixed(6))}`);
              steps.push(`RHS = ${right} = ${parseFloat(rhsVal.toFixed(6))}`);
              steps.push(`LHS ${Math.abs(lhsVal - rhsVal) < 1e-6 ? "=" : "≠"} RHS ✓`);
              
              steps.push(``);
              steps.push(`━━━ Step 5: Plot as y = mx + c ━━━`);
              // Plot the RHS as a function if it contains the variable, else plot LHS
              const plotExpr = right.match(/[a-zA-Z]/) ? right : left;
              const p0 = (() => { const s: Record<string, number> = {}; s[variable] = 0; return math.evaluate(plotExpr, s) as number; })();
              const p1 = (() => { const s: Record<string, number> = {}; s[variable] = 1; return math.evaluate(plotExpr, s) as number; })();
              const slope = parseFloat((p1 - p0).toFixed(6));
              const intercept = parseFloat(p0.toFixed(6));
              steps.push(`Plotting: y = ${plotExpr}`);
              steps.push(`Slope (m) = ${slope}`);
              steps.push(`y-intercept (c) = ${intercept}`);
              steps.push(`So: y = ${slope}·${variable} + ${intercept}`);
              setLinearGraph({ m: slope, c: intercept });
              
              setLinearResult(`${variable} = ${rounded}`);
            } else {
              setLinearResult(Math.abs(b) < 1e-10 ? "✓ Identity — true for all values" : "✗ No solution — contradiction");
            }
          } else {
            // Non-linear — use Newton's method
            steps.push(`This is a non-linear equation. Using iterative method:`);
            let x = 0;
            for (let i = 0; i < 100; i++) {
              const fx = f(x);
              if (Math.abs(fx) < 1e-12) break;
              const dfx = (f(x + 1e-8) - fx) / 1e-8;
              if (Math.abs(dfx) < 1e-15) { x += 0.1; continue; }
              x = x - fx / dfx;
            }
            const rounded = Math.abs(x) < 1e-10 ? 0 : parseFloat(x.toFixed(8));
            steps.push(`Newton-Raphson converges to: ${variable} = ${rounded}`);
            
            steps.push(``);
            steps.push(`━━━ Step 4: Verify ━━━`);
            const scope: Record<string, number> = {};
            scope[variable] = rounded;
            try {
              const lhsVal = math.evaluate(left, scope) as number;
              const rhsVal = math.evaluate(right, scope) as number;
              steps.push(`LHS = ${parseFloat(lhsVal.toFixed(6))}, RHS = ${parseFloat(rhsVal.toFixed(6))} ${Math.abs(lhsVal - rhsVal) < 1e-4 ? "✓" : "≈"}`);
            } catch {}
            
            setLinearResult(`${variable} = ${rounded}`);
          }
        } else if (uniqueVars.length === 0) {
          steps.push(`No variables — evaluating both sides numerically.`);
          const leftVal = math.evaluate(left);
          const rightVal = math.evaluate(right);
          steps.push(``);
          steps.push(`━━━ Step 2: Evaluate ━━━`);
          steps.push(`LHS = ${left} = ${leftVal}`);
          steps.push(`RHS = ${right} = ${rightVal}`);
          const equal = Math.abs(Number(leftVal) - Number(rightVal)) < 1e-10;
          steps.push(equal ? `LHS = RHS ✓` : `LHS ≠ RHS ✗`);
          setLinearResult(equal ? "✓ Equation is TRUE" : "✗ Equation is FALSE");
        } else if (uniqueVars.length === 2) {
          const yVar = uniqueVars.find(v => v === "y") || uniqueVars[0];
          const xVar = uniqueVars.find(v => v !== yVar) || uniqueVars[1];
          steps.push(`Two variables: ${xVar} (independent), ${yVar} (dependent).`);
          
          steps.push(``);
          steps.push(`━━━ Step 2: Rearrange for ${yVar} ━━━`);
          
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
              const mR = parseFloat(m.toFixed(6));
              const cR = parseFloat(y0.toFixed(6));
              steps.push(`${yVar} = ${mR}·${xVar} ${cR >= 0 ? `+ ${cR}` : `− ${Math.abs(cR)}`}`);
              
              steps.push(``);
              steps.push(`━━━ Step 3: Identify slope and intercept ━━━`);
              steps.push(`Slope (m) = ${mR}`);
              steps.push(`${yVar}-intercept (c) = ${cR}`);
              steps.push(`When ${xVar} = 0: ${yVar} = ${cR}`);
              steps.push(`When ${xVar} = 1: ${yVar} = ${parseFloat(y1.toFixed(6))}`);
              steps.push(`When ${xVar} = 2: ${yVar} = ${parseFloat(y2.toFixed(6))}`);
              
              steps.push(``);
              steps.push(`━━━ Step 4: Table of values ━━━`);
              steps.push(`  ${xVar}  |  ${yVar}`);
              steps.push(`─────┼──────`);
              for (let xv = -2; xv <= 3; xv++) {
                const yv = mR * xv + cR;
                steps.push(`  ${xv.toString().padStart(2)}  |  ${yv.toFixed(2)}`);
              }
              
              setLinearResult(`${yVar} = ${mR}·${xVar} + ${cR}`);
              setLinearGraph({ m: mR, c: cR });
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
          steps.push(`Use the System of Equations solver below for multi-variable systems.`);
          const expr = `${left} - (${right})`;
          const simplified = math.simplify(math.parse(expr));
          setLinearResult(`${simplified.toString()} = 0`);
        }
      } else {
        steps.push(`━━━ Evaluate Expression ━━━`);
        steps.push(`Expression: ${eq}`);
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

  // ── System of linear equations solver ──
  const solveSystem = () => {
    try {
      const steps: string[] = [];
      const eqs = systemEqs.map(e => e.trim()).filter(Boolean);
      if (eqs.length < 2) {
        setSystemResult("Add at least 2 equations.");
        setSystemSteps([]);
        return;
      }

      steps.push("━━━ Step 1: Parse Equations ━━━");
      // Extract all variables
      const parsed: { left: string; right: string }[] = [];
      for (const eq of eqs) {
        if (!eq.includes("=")) {
          setSystemResult(`Error: "${eq}" must contain '='.`);
          setSystemSteps([]);
          return;
        }
        const [l, r] = eq.split("=").map(s => s.trim());
        parsed.push({ left: l, right: r });
      }
      const vars = extractVariablesFromSystem(eqs);
      const systemDesc = describeSystem(eqs.length, vars);
      steps.push(`Equations: ${eqs.length}`);
      eqs.forEach((eq, i) => steps.push(`  (${i + 1})  ${eq}`));
      steps.push(systemDesc);

      if (vars.length === 0) {
        setSystemResult("No variables found.");
        setSystemSteps(steps);
        return;
      }

      // Build coefficient matrix and constants vector
      steps.push("");
      steps.push("━━━ Step 2: Build Augmented Matrix [A|b] ━━━");
      steps.push("Move everything to LHS: aᵢxᵢ + ... = constant");

      const n = vars.length;
      const m = eqs.length;
      const A: number[][] = [];
      const b: number[] = [];

      for (let i = 0; i < m; i++) {
        const { left, right } = parsed[i];
        const expr = `${left} - (${right})`;
        const node = math.simplify(math.parse(expr));
        // Extract coefficients by evaluating at unit vectors
        const row: number[] = [];
        const base: Record<string, number> = {};
        vars.forEach(v => (base[v] = 0));
        const constant = -(node.evaluate({ ...base }) as number);
        for (let j = 0; j < n; j++) {
          const probe = { ...base };
          probe[vars[j]] = 1;
          const val = node.evaluate(probe) as number;
          row.push(val + constant); // coefficient of vars[j]
        }
        A.push(row);
        b.push(constant);
      }

      // Display augmented matrix
      const header = `  [ ${vars.map(v => v.padStart(6)).join("  ")}  |  b ]`;
      steps.push(header);
      for (let i = 0; i < m; i++) {
        const rowStr = A[i].map(v => v.toFixed(3).padStart(6)).join("  ");
        steps.push(`  [ ${rowStr}  | ${b[i].toFixed(3).padStart(6)} ]`);
      }

      // Gaussian elimination with partial pivoting
      steps.push("");
      steps.push("━━━ Step 3: Gaussian Elimination ━━━");

      const aug = A.map((row, i) => [...row, b[i]]);
      const rows = aug.length;
      const cols = n;

      for (let col = 0; col < Math.min(rows, cols); col++) {
        // Partial pivoting
        let maxRow = col;
        let maxVal = Math.abs(aug[col]?.[col] ?? 0);
        for (let r = col + 1; r < rows; r++) {
          if (Math.abs(aug[r][col]) > maxVal) {
            maxVal = Math.abs(aug[r][col]);
            maxRow = r;
          }
        }
        if (maxRow !== col && col < rows) {
          [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
          steps.push(`Swap R${col + 1} ↔ R${maxRow + 1} (pivot)`);
        }

        if (col >= rows || Math.abs(aug[col][col]) < 1e-12) continue;

        // Scale pivot row
        const pivot = aug[col][col];
        if (Math.abs(pivot - 1) > 1e-12) {
          for (let j = col; j <= cols; j++) aug[col][j] /= pivot;
          steps.push(`R${col + 1} → R${col + 1} / ${pivot.toFixed(4)}`);
        }

        // Eliminate below and above (full Gauss-Jordan)
        for (let r = 0; r < rows; r++) {
          if (r === col) continue;
          const factor = aug[r][col];
          if (Math.abs(factor) < 1e-12) continue;
          for (let j = col; j <= cols; j++) {
            aug[r][j] -= factor * aug[col][j];
          }
          steps.push(`R${r + 1} → R${r + 1} − (${factor.toFixed(4)})·R${col + 1}`);
        }
      }

      // Show reduced row echelon form
      steps.push("");
      steps.push("━━━ Step 4: Reduced Row Echelon Form ━━━");
      for (let i = 0; i < rows; i++) {
        const rowStr = aug[i].slice(0, cols).map(v => (Math.abs(v) < 1e-10 ? 0 : v).toFixed(3).padStart(6)).join("  ");
        const bVal = Math.abs(aug[i][cols]) < 1e-10 ? 0 : aug[i][cols];
        steps.push(`  [ ${rowStr}  | ${bVal.toFixed(3).padStart(6)} ]`);
      }

      // Extract solution
      steps.push("");
      steps.push("━━━ Step 5: Extract Solution ━━━");
      const solution: Record<string, number> = {};
      let inconsistent = false;
      let underdetermined = false;

      for (let i = 0; i < rows; i++) {
        const allZero = aug[i].slice(0, cols).every(v => Math.abs(v) < 1e-10);
        if (allZero && Math.abs(aug[i][cols]) > 1e-10) {
          inconsistent = true;
          break;
        }
      }

      if (inconsistent) {
        steps.push("❌ System is INCONSISTENT — no solution exists.");
        setSystemResult("No solution — inconsistent system.");
        setSystemSteps(steps);
        return;
      }

      // Check rank
      let rank = 0;
      for (let i = 0; i < rows; i++) {
        if (!aug[i].slice(0, cols).every(v => Math.abs(v) < 1e-10)) rank++;
      }
      if (rank < cols) underdetermined = true;

      if (underdetermined) {
        steps.push(`Rank = ${rank} < ${cols} variables → infinitely many solutions.`);
        steps.push("Free variables exist. Showing a particular solution (free vars = 0):");
      }

      for (let i = 0; i < Math.min(rank, cols); i++) {
        // Find pivot column
        let pivotCol = -1;
        for (let j = 0; j < cols; j++) {
          if (Math.abs(aug[i][j] - 1) < 1e-10) {
            pivotCol = j;
            break;
          }
        }
        if (pivotCol >= 0) {
          const val = Math.abs(aug[i][cols]) < 1e-10 ? 0 : parseFloat(aug[i][cols].toFixed(6));
          solution[vars[pivotCol]] = val;
          steps.push(`${vars[pivotCol]} = ${val}`);
        }
      }

      // Verification step
      steps.push("");
      steps.push("━━━ Step 6: Verification ━━━");
      for (let i = 0; i < eqs.length; i++) {
        const { left, right } = parsed[i];
        try {
          const scope: Record<string, number> = {};
          vars.forEach(v => (scope[v] = solution[v] ?? 0));
          const lVal = math.evaluate(left, scope) as number;
          const rVal = math.evaluate(right, scope) as number;
          const match = Math.abs(lVal - rVal) < 1e-6;
          steps.push(`  (${i + 1}) ${left} = ${right}`);
          steps.push(`       LHS = ${lVal.toFixed(6)}, RHS = ${rVal.toFixed(6)} → ${match ? "✓" : "✗"}`);
        } catch {
          steps.push(`  (${i + 1}) Could not verify.`);
        }
      }

      const resultStr = vars.map(v => `${v} = ${solution[v] ?? "free"}`).join(",  ");
      setSystemResult(resultStr);
      setSystemSteps(steps);
    } catch (err: any) {
      setSystemResult(`Error: ${err.message}`);
      setSystemSteps([]);
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
    if (!selectedDiffType) { setDiffSolution(null); return; }
    // Check built-in solutions first
    const sol = solutions[selectedDiffType];
    if (sol) {
      setDiffSolution(null);
      setTimeout(() => setDiffSolution(sol), 50);
      return;
    }
    // Check custom equations
    const custom = customEquations.find(e => e.id === selectedDiffType);
    if (custom) {
      setDiffSolution(null);
      setTimeout(() => setDiffSolution({ equation: custom.equation, steps: custom.steps, solution: custom.solution, explanation: custom.explanation }), 50);
    }
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
          <TabsList className="glass-card !p-1 !rounded-xl border-glass-border/30 flex-wrap h-auto gap-1">
            <TabsTrigger value="linear" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Linear</TabsTrigger>
            <TabsTrigger value="derivative" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary flex items-center gap-1">
              <FlaskConical size={12} /> Derivative
            </TabsTrigger>
            <TabsTrigger value="differential" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Differential</TabsTrigger>
            <TabsTrigger value="matrix" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Matrix</TabsTrigger>
            <TabsTrigger value="presets" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Presets</TabsTrigger>
          </TabsList>

          {/* Linear */}
          <TabsContent value="linear">
            <GlassCard glow id="equation-solver-area">
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
                  <div className="space-y-1">
                    {linearSteps.map((step, i) => {
                      const isHeader = step.includes("━━━");
                      const isEmpty = step === "";
                      const isCheck = step.includes("✓");
                      const isTable = step.includes("─") || step.includes("|");
                      return isEmpty ? (
                        <div key={i} className="h-2" />
                      ) : (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`text-xs font-mono ${
                            isHeader
                              ? "text-primary font-bold mt-2 mb-1 text-sm"
                              : isCheck
                              ? "text-emerald-400"
                              : isTable
                              ? "text-muted-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step}
                        </motion.div>
                      );
                    })}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: linearSteps.length * 0.04 }}
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

            {/* System of Linear Equations */}
            <GlassCard glow className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">System of Linear Equations</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSystemEqs(prev => [...prev, ""])}
                    className="gap-1 text-xs"
                  >
                    <Plus size={12} /> Add Equation
                  </Button>
                  <Button size="sm" onClick={solveSystem} className="gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play size={12} /> Solve System
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Enter multiple equations (e.g. <code className="text-primary/80">2*x + 3*y = 7</code>). Solved via Gaussian elimination with full step-by-step breakdown.
              </p>

              <div className="space-y-2 mb-4">
                {systemEqs.map((eq, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground font-mono w-6 text-right">({i + 1})</span>
                    <Input
                      placeholder={i === 0 ? "e.g. 2*x + 3*y = 7" : i === 1 ? "e.g. x - y = 1" : `Equation ${i + 1}`}
                      value={eq}
                      onChange={(e) => {
                        const copy = [...systemEqs];
                        copy[i] = e.target.value;
                        setSystemEqs(copy);
                      }}
                      className="bg-secondary/50 border-border font-mono text-sm"
                      onKeyDown={(e) => e.key === "Enter" && solveSystem()}
                    />
                    {systemEqs.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setSystemEqs(prev => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: "2×2 System", eqs: ["2*x + 3*y = 7", "x - y = 1"] },
                  { label: "3×3 System", eqs: ["x + y + z = 6", "2*x - y + z = 3", "x + 2*y - z = 2"] },
                  { label: "4×4 System", eqs: ["a + b + c + d = 10", "2*a - b + c = 4", "a + 3*b - d = 5", "b + 2*c + d = 7"] },
                  { label: "Dependent System", eqs: ["x + y = 3", "2*x + 2*y = 6"] },
                ].map(preset => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    onClick={() => { setSystemEqs(preset.eqs); setSystemResult(null); setSystemSteps([]); }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Results */}
              <div className="glass-card !p-5">
                {systemSteps.length > 0 ? (
                  <div className="space-y-1">
                    {systemSteps.map((step, i) => {
                      const isHeader = step.includes("━━━");
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`text-xs font-mono ${
                            isHeader
                              ? "text-primary font-bold mt-3 mb-1"
                              : step.includes("✓")
                              ? "text-emerald-400"
                              : step.includes("✗") || step.includes("❌")
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step}
                        </motion.div>
                      );
                    })}
                    {systemResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: systemSteps.length * 0.03 }}
                        className="mt-4 pt-4 border-t border-border/50 text-base font-mono font-bold text-primary"
                      >
                        {systemResult}
                      </motion.div>
                    )}
                  </div>
                ) : systemResult ? (
                  <p className="text-sm text-muted-foreground">{systemResult}</p>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Add equations above and click Solve System for step-by-step Gaussian elimination.
                  </p>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Derivative Calculator */}
          <TabsContent value="derivative">
            <GlassCard glow>
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical size={16} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Derivative Calculator</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Symbolic differentiation using direct rules only — Power, Trig, Exponential, Log, Product, Quotient, Chain.
                <span className="text-amber-400 ml-1">No integration. No ODE solving.</span>
              </p>

              {/* Presets */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen size={11} className="text-primary" /> Example Expressions
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {derivativePresets.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { setDerivInput(p.expr); setDerivResult(null); setDerivError(null); }}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all duration-200 ${
                        derivInput === p.expr
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/40 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <span className="font-semibold block text-foreground/80">{p.label}</span>
                      <span className="font-mono text-[10px]">{p.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Input with LaTeX Editor */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Expression <span className="text-primary font-mono">f(x)</span> — the solver computes d/dx(f(x)). Supports any variable (x, t, r, θ, etc.)
                  </label>
                  <LaTeXEquationEditor
                    value={derivInput}
                    onChange={(val) => { setDerivInput(val); setDerivResult(null); setDerivError(null); }}
                    placeholder="e.g. x^3 + sin(x)  or  t^2 * e^(t)"
                  />
                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleSolveDerivative} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                      <Play size={14} /> Differentiate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-border text-muted-foreground"
                      onClick={() => { setDerivInput(""); setDerivResult(null); setDerivError(null); }}
                    >
                      <RotateCcw size={13} /> Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {derivError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive"
                  >
                    {derivError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <div className="mt-6">
                <AnimatePresence mode="wait">
                  {derivResult ? (
                    <motion.div key={derivResult.input} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <DerivativeStepsView result={derivResult} />
                    </motion.div>
                  ) : !derivError ? (
                    <div className="glass-card !p-6">
                      <p className="text-center text-muted-foreground text-sm">
                        Enter an expression or select an example above, then click <span className="text-primary font-semibold">Differentiate</span>.
                      </p>
                    </div>
                  ) : null}
                </AnimatePresence>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Differential */}
          <TabsContent value="differential">
            <GlassCard glow>
              <h2 className="text-lg font-semibold mb-1 text-foreground">Differential Equation Solver</h2>
              <p className="text-xs text-muted-foreground mb-4">Select a built-in type or add your own equation below.</p>

              {/* Built-in presets */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen size={11} className="text-primary" /> Built-in Equations
                </p>
                <div className="grid sm:grid-cols-2 gap-2 mb-4">
                  {Object.keys(solutions).map((t, i) => (
                    <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Button
                        variant="outline"
                        className={`w-full justify-start border-border transition-all duration-300 text-sm ${
                          selectedDiffType === t
                            ? "bg-primary/15 border-primary/40 text-primary glow-border"
                            : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        }`}
                        onClick={() => { setSelectedDiffType(t); setDiffSolution(null); setDiffEqInput(solutions[t].equation); }}
                      >
                        {t}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Custom equations */}
              {customEquations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus size={11} className="text-primary" /> My Equations
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <AnimatePresence>
                      {customEquations.map((eq) => (
                        <motion.div
                          key={eq.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <div className={`flex items-center gap-1 rounded-md border transition-all ${
                            selectedDiffType === eq.id
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-secondary/30 hover:border-primary/30"
                          }`}>
                            <button
                              className="flex-1 text-left px-3 py-2 text-sm font-medium truncate"
                              onClick={() => solveCustomDiff(eq)}
                            >
                              <span className={selectedDiffType === eq.id ? "text-primary" : "text-foreground"}>{eq.name}</span>
                              <span className="block font-mono text-xs text-muted-foreground truncate">{eq.equation}</span>
                            </button>
                            <button
                              onClick={() => removeCustomEquation(eq.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Add custom equation toggle */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/10 w-full"
                  onClick={() => setShowAddForm(v => !v)}
                >
                  <Plus size={13} /> {showAddForm ? "Cancel" : "Add My Own Equation"}
                </Button>

                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                        <p className="text-xs font-semibold text-primary">New Equation</p>
                        <Input
                          placeholder="Name (e.g. Schrödinger Equation)"
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          className="bg-background/60 border-border font-mono text-sm"
                        />
                        <Input
                          placeholder="Equation (e.g. iℏ ∂ψ/∂t = Ĥψ)"
                          value={customEq}
                          onChange={e => setCustomEq(e.target.value)}
                          className="bg-background/60 border-border font-mono text-sm"
                        />
                        <Input
                          placeholder="Final solution (e.g. ψ(x,t) = ...)"
                          value={customSolution}
                          onChange={e => setCustomSolution(e.target.value)}
                          className="bg-background/60 border-border font-mono text-sm"
                        />
                        <Textarea
                          placeholder={"Steps (one per line):\nStep 1: Identify the operator...\nStep 2: Expand Hamiltonian..."}
                          value={customStepsRaw}
                          onChange={e => setCustomStepsRaw(e.target.value)}
                          className="bg-background/60 border-border font-mono text-xs min-h-[90px]"
                        />
                        <Textarea
                          placeholder="Explanation / physical meaning..."
                          value={customExplanation}
                          onChange={e => setCustomExplanation(e.target.value)}
                          className="bg-background/60 border-border text-xs min-h-[60px]"
                        />
                        <Button
                          onClick={addCustomEquation}
                          disabled={!customName.trim() || !customEq.trim()}
                          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                          size="sm"
                        >
                          <Plus size={13} /> Add Equation
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input & solve */}
              <div className="space-y-3">
                <Input
                  value={diffEqInput}
                  onChange={(e) => setDiffEqInput(e.target.value)}
                  placeholder="Enter or edit differential equation..."
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
                    <GlassCard hover className="cursor-pointer !p-4" onClick={() => { setSelectedDiffType(p.key); setDiffEqInput(p.eq); }}>
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
