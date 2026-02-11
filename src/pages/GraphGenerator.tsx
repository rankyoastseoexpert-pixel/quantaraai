import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Download, BarChart3, ZoomIn, ZoomOut, Grid3X3 } from "lucide-react";

const graphPresets = [
  { name: "Gaussian", eq: "e^(-x²/2)" },
  { name: "Harmonic Oscillator ψₙ", eq: "Hₙ(x)e^(-x²/2)" },
  { name: "Particle in a Box ψₙ", eq: "√(2/L)sin(nπx/L)" },
  { name: "Free Particle", eq: "e^(ikx)" },
  { name: "Wave Packet", eq: "e^(ikx)e^(-x²/2σ²)" },
  { name: "Exponential Decay", eq: "e^(-λt)" },
  { name: "Bessel Function", eq: "Jₙ(x)" },
];

const quantumModes = [
  { name: "Particle in a Box", options: ["ψₙ(x)", "|ψₙ(x)|²", "Energy Levels"] },
  { name: "Harmonic Oscillator", options: ["Potential Curve", "Wavefunction Overlay", "Energy Ladder"] },
  { name: "TDSE Animation", options: ["Animated |Ψ(x,t)|²", "Potential Overlay"] },
];

const GraphGenerator = () => {
  const [funcInput, setFuncInput] = useState("");

  return (
    <PageLayout>
      <div className="container px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Scientific <span className="text-gradient">Graph Generator</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Generate publication-ready scientific graphs with custom functions and presets.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-4">
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Function Input</h2>
              <div className="flex gap-2">
                <Input
                  value={funcInput}
                  onChange={(e) => setFuncInput(e.target.value)}
                  placeholder="f(x) = ..."
                  className="bg-secondary/50 border-border font-mono text-sm"
                />
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play size={14} />
                </Button>
              </div>
              {funcInput && (
                <div className="mt-3 p-2 rounded-md bg-secondary/30 border border-border/50 font-mono text-sm text-primary text-center">
                  {funcInput}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Presets</h2>
              <div className="space-y-1.5">
                {graphPresets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setFuncInput(p.eq)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-secondary/70 text-muted-foreground transition-colors border border-transparent hover:border-border/50"
                  >
                    <span className="text-foreground font-medium">{p.name}</span>
                    <span className="block font-mono text-primary/70 mt-0.5">{p.eq}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Graph Modes</h2>
              {quantumModes.map(m => (
                <div key={m.name} className="mb-3">
                  <div className="text-xs font-medium text-foreground mb-1.5">{m.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.options.map(opt => (
                      <Button key={opt} variant="outline" size="sm" className="text-xs h-7 border-border hover:bg-primary/10 hover:text-primary">
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>

          {/* Graph area */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Graph Output</h2>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border"><ZoomIn size={12} /></Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border"><ZoomOut size={12} /></Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border"><Grid3X3 size={12} /></Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-secondary/20 h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-primary/30 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Enter a function or select a preset to generate a graph</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Export</h2>
              <div className="flex flex-wrap gap-2">
                {["SVG", "PNG", "JPG", "XLSX"].map(fmt => (
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

export default GraphGenerator;
