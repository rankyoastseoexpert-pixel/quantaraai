import { memo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Loader2, Atom, Layers, Zap, Eye } from "lucide-react";
import type { SCFResult } from "@/lib/dftSolver";

interface Props {
  onRunSolver: (size: number, method: "DFT" | "Tight-Binding") => void;
  isRunning: boolean;
  result: SCFResult | null;
  selectedOrbital: number;
  onOrbitalChange: (idx: number) => void;
  isoValue: number;
  onIsoChange: (v: number) => void;
  showPositive: boolean;
  showNegative: boolean;
  onTogglePositive: (v: boolean) => void;
  onToggleNegative: (v: boolean) => void;
}

const SCFControlPanel = ({
  onRunSolver, isRunning, result,
  selectedOrbital, onOrbitalChange,
  isoValue, onIsoChange,
  showPositive, showNegative, onTogglePositive, onToggleNegative,
}: Props) => {
  const [clusterSize, setClusterSize] = useState(13);
  const [method, setMethod] = useState<"DFT" | "Tight-Binding">("Tight-Binding");

  return (
    <div className="space-y-4">
      {/* Cluster Configuration */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Atom size={14} className="text-primary" /> Cluster Configuration
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Cluster Size (atoms)</label>
            <div className="flex gap-1.5">
              {[1, 13, 27, 55].map(n => (
                <Button
                  key={n}
                  size="sm"
                  variant={clusterSize === n ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] ${clusterSize === n ? "bg-primary text-primary-foreground" : "border-border"}`}
                  onClick={() => setClusterSize(n)}
                >
                  Ag<sub>{n}</sub>
                </Button>
              ))}
            </div>
            <div className="mt-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={clusterSize}
                onChange={(e) => setClusterSize(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="bg-secondary/50 border-border font-mono text-xs h-7"
                placeholder="Custom size"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Solving Method</label>
            <div className="flex gap-1.5">
              {(["DFT", "Tight-Binding"] as const).map(m => (
                <Button
                  key={m}
                  size="sm"
                  variant={method === m ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] ${method === m ? "bg-primary text-primary-foreground" : "border-border"}`}
                  onClick={() => setMethod(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            onClick={() => onRunSolver(clusterSize, method)}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {isRunning ? "Running SCF..." : "Run Solver"}
          </Button>
        </div>
      </GlassCard>

      {/* Orbital Selection */}
      {result && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> Orbital Selection
          </h3>

          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {result.finalEnergies.map((e, i) => {
              const isHOMO = i === result.homoIndex;
              const isLUMO = i === result.lumoIndex;
              const isOccupied = i <= result.homoIndex;
              return (
                <button
                  key={i}
                  onClick={() => onOrbitalChange(i)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-mono transition-all flex items-center justify-between ${
                    selectedOrbital === i
                      ? "bg-primary/15 border border-primary/40 text-primary"
                      : "hover:bg-secondary/50 text-muted-foreground border border-transparent"
                  }`}
                >
                  <span>
                    Level {i + 1}
                    {isHOMO && <span className="ml-1 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px]">HOMO</span>}
                    {isLUMO && <span className="ml-1 px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px]">LUMO</span>}
                  </span>
                  <span className={isOccupied ? "text-emerald-400" : "text-muted-foreground/50"}>
                    {e.toFixed(3)} eV
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Visualization Controls */}
      {result && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Eye size={14} className="text-primary" /> Visualization Controls
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Isosurface value</span>
                <span className="font-mono text-primary">{isoValue.toFixed(3)}</span>
              </div>
              <Slider
                min={0.001} max={0.1} step={0.001}
                value={[isoValue]}
                onValueChange={([v]) => onIsoChange(v)}
                className="h-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Show ψ &gt; 0 (green)</span>
              <Switch checked={showPositive} onCheckedChange={onTogglePositive} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Show ψ &lt; 0 (red)</span>
              <Switch checked={showNegative} onCheckedChange={onToggleNegative} />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Results Summary */}
      {result && (
        <GlassCard>
          <h3 className="text-xs font-semibold text-foreground mb-2">Calculation Summary</h3>
          <div className="space-y-1 text-[10px]">
            {[
              ["Atoms", result.atoms.length],
              ["Electrons", result.nElectrons],
              ["SCF Iterations", result.iterations],
              ["Converged", result.converged ? "Yes ✓" : "No ✗"],
              ["E_HOMO", `${result.finalEnergies[result.homoIndex]?.toFixed(4)} eV`],
              ["E_LUMO", `${result.finalEnergies[result.lumoIndex]?.toFixed(4)} eV`],
              ["HOMO-LUMO Gap", `${result.bandGap.toFixed(4)} eV`],
              ["Fermi Energy", `${result.fermiEnergy.toFixed(4)} eV`],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default memo(SCFControlPanel);
