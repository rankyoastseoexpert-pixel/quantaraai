import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Download, Atom } from "lucide-react";

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

const QuantumSolver = () => {
  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

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
                    onClick={() => { setActivePreset(p.name); setInput(p.eq); }}
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
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="min-h-[300px]">
              <h2 className="text-sm font-semibold text-foreground mb-3">Visualization</h2>
              <div className="rounded-lg border border-border/50 bg-secondary/20 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Atom className="h-12 w-12 text-primary/30 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Select a preset or enter an equation to visualize</p>
                </div>
              </div>
            </GlassCard>

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
