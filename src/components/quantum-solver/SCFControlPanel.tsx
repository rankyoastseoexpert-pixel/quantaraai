import { memo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Loader2, Atom, Layers, Zap, Eye, Settings2, Cpu } from "lucide-react";
import type { SCFResult, ElementType, SymmetryType, FunctionalType } from "@/lib/dftSolver";
import { ELEMENT_DATA } from "@/lib/dftSolver";

interface Props {
  onRunSolver: (size: number, method: "DFT" | "Tight-Binding", element: ElementType, symmetry: SymmetryType, functional: FunctionalType, latticeConst?: number) => void;
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

const ELEMENTS: ElementType[] = ["Ag", "Au", "Cu", "Al", "Pt"];

const SCFControlPanel = ({
  onRunSolver, isRunning, result,
  selectedOrbital, onOrbitalChange,
  isoValue, onIsoChange,
  showPositive, showNegative, onTogglePositive, onToggleNegative,
}: Props) => {
  const [clusterSize, setClusterSize] = useState(13);
  const [method, setMethod] = useState<"DFT" | "Tight-Binding">("Tight-Binding");
  const [element, setElement] = useState<ElementType>("Ag");
  const [symmetry, setSymmetry] = useState<SymmetryType>("FCC");
  const [functional, setFunctional] = useState<FunctionalType>("LDA");
  const [latticeConst, setLatticeConst] = useState<number>(ELEMENT_DATA["Ag"].latticeConst);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleElementChange = (el: ElementType) => {
    setElement(el);
    setLatticeConst(ELEMENT_DATA[el].latticeConst);
  };

  return (
    <div className="space-y-4">
      {/* Element & Cluster */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Atom size={14} className="text-primary" /> System Configuration
        </h3>

        <div className="space-y-3">
          {/* Element Selection */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Element</label>
            <div className="flex gap-1">
              {ELEMENTS.map(el => (
                <Button
                  key={el}
                  size="sm"
                  variant={element === el ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] ${element === el ? "bg-primary text-primary-foreground" : "border-border"}`}
                  onClick={() => handleElementChange(el)}
                >
                  {el}
                  <span className="text-[7px] ml-0.5 opacity-60">({ELEMENT_DATA[el].Z})</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Cluster Size */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Cluster Size</label>
            <div className="flex gap-1.5">
              {[1, 13, 27, 55].map(n => (
                <Button
                  key={n}
                  size="sm"
                  variant={clusterSize === n ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] ${clusterSize === n ? "bg-primary text-primary-foreground" : "border-border"}`}
                  onClick={() => setClusterSize(n)}
                >
                  {element}<sub>{n}</sub>
                </Button>
              ))}
            </div>
            <Input
              type="number" min={1} max={100} value={clusterSize}
              onChange={(e) => setClusterSize(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="bg-secondary/50 border-border font-mono text-xs h-7 mt-1.5"
              placeholder="Custom size"
            />
          </div>

          {/* Symmetry */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Symmetry Type</label>
            <div className="flex gap-1.5">
              {(["FCC", "BCC", "SC"] as SymmetryType[]).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={symmetry === s ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] ${symmetry === s ? "bg-primary text-primary-foreground" : "border-border"}`}
                  onClick={() => setSymmetry(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Method */}
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

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            <Settings2 size={12} />
            Advanced DFT Settings {showAdvanced ? "▼" : "▶"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-2 border-l-2 border-primary/20">
              {/* Functional */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">XC Functional</label>
                <div className="flex gap-1.5">
                  {(["LDA", "GGA"] as FunctionalType[]).map(f => (
                    <Button
                      key={f}
                      size="sm"
                      variant={functional === f ? "default" : "outline"}
                      className={`flex-1 h-7 text-[10px] ${functional === f ? "bg-primary text-primary-foreground" : "border-border"}`}
                      onClick={() => setFunctional(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">
                  {functional === "LDA" ? "Slater Exchange + VWN Correlation" : "PBE Gradient-Corrected"}
                </div>
              </div>

              {/* Lattice Constant */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Lattice Constant (Å)</span>
                  <span className="font-mono text-primary">{latticeConst.toFixed(2)}</span>
                </div>
                <Slider
                  min={2.0} max={4.5} step={0.01}
                  value={[latticeConst]}
                  onValueChange={([v]) => setLatticeConst(v)}
                  className="h-4"
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            onClick={() => onRunSolver(clusterSize, method, element, symmetry, functional, latticeConst)}
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
              <Slider min={0.001} max={0.1} step={0.001} value={[isoValue]} onValueChange={([v]) => onIsoChange(v)} className="h-4" />
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
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Cpu size={14} className="text-primary" /> Calculation Summary
          </h3>
          <div className="space-y-1 text-[10px]">
            {[
              ["Element", result.element],
              ["Atoms", result.atoms.length],
              ["Electrons", result.nElectrons],
              ["SCF Iterations", result.iterations],
              ["Converged", result.converged ? "Yes ✓" : "No ✗"],
              ["Total Energy", `${result.totalEnergy.toFixed(4)} eV`],
              ["E_HOMO", `${result.finalEnergies[result.homoIndex]?.toFixed(4)} eV`],
              ["E_LUMO", `${result.finalEnergies[result.lumoIndex]?.toFixed(4)} eV`],
              ["HOMO-LUMO Gap", `${result.bandGap.toFixed(4)} eV`],
              ["Fermi Energy", `${result.fermiEnergy.toFixed(4)} eV`],
              ["Dipole (Debye)", `${result.dipoleNorm.toFixed(3)}`],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-foreground">{value}</span>
              </div>
            ))}
          </div>

          {/* Dipole vector */}
          {result.dipoleNorm > 0.01 && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="text-[9px] text-muted-foreground">
                Dipole vector: ({result.dipoleMoment.map(d => d.toFixed(3)).join(", ")})
              </div>
            </div>
          )}

          {/* Forces summary */}
          {result.forces.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="text-[9px] text-muted-foreground">
                Max force: {Math.max(...result.forces.map(f => Math.sqrt(f[0]**2+f[1]**2+f[2]**2))).toFixed(4)} eV/Å
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default memo(SCFControlPanel);
