import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Play, Download, RotateCcw, ChevronRight } from "lucide-react";

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
  const [matrixSize, setMatrixSize] = useState(3);
  const [matrixValues, setMatrixValues] = useState<string[][]>(
    Array.from({ length: 3 }, () => Array(3).fill("0"))
  );

  const updateMatrix = (r: number, c: number, val: string) => {
    const copy = matrixValues.map(row => [...row]);
    copy[r][c] = val;
    setMatrixValues(copy);
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
                  placeholder="Enter equation: y = mx + c"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  className="bg-secondary/50 border-border font-mono"
                />
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
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

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6 text-center text-muted-foreground text-sm">
                Enter an equation above and click Solve to see results here.
              </div>
            </GlassCard>
          </TabsContent>

          {/* Differential */}
          <TabsContent value="differential">
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Differential Equation Solver</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {["First-order ODE", "Second-order ODE", "Legendre ODE", "Bessel ODE", "Heat Equation", "Wave Equation", "Laplace Equation"].map(t => (
                  <Button key={t} variant="outline" className="justify-start border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                    {t}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Input placeholder="Enter differential equation..." className="bg-secondary/50 border-border font-mono" />
                <Input placeholder="Boundary conditions (optional)..." className="bg-secondary/50 border-border font-mono" />
                <div className="flex gap-3">
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play size={14} /> Solve
                  </Button>
                  <Button variant="outline" className="gap-2 border-border">
                    <RotateCcw size={14} /> Reset
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6 text-center text-muted-foreground text-sm">
                Select an equation type, enter your equation, and solve.
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
                  <Button key={op} variant="outline" size="sm" className="border-border hover:bg-primary/10 hover:text-primary">
                    {op}
                  </Button>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-border/50 bg-secondary/30 p-6 text-center text-muted-foreground text-sm">
                Enter matrix values and select an operation.
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
