import { memo } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Crosshair, Waves } from "lucide-react";
import type { PotentialType, BoundaryCondition, InitialStateType } from "@/lib/quantumSimulator";

interface Props {
  potential: PotentialType;
  setPotential: (v: PotentialType) => void;
  bc: BoundaryCondition;
  setBc: (v: BoundaryCondition) => void;
  V0: number; setV0: (v: number) => void;
  omega: number; setOmega: (v: number) => void;
  width: number; setWidth: (v: number) => void;
  separation: number; setSeparation: (v: number) => void;
  x0: number; setX0: (v: number) => void;
  k0: number; setK0: (v: number) => void;
  sigma: number; setSigma: (v: number) => void;
  initialState: InitialStateType; setInitialState: (v: InitialStateType) => void;
  dt: number; setDt: (v: number) => void;
  gridSize: number; setGridSize: (v: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onMeasurePos: () => void;
  onMeasureMom: () => void;
  show3D: boolean;
  setShow3D: (v: boolean) => void;
  showPhase: boolean;
  setShowPhase: (v: boolean) => void;
  // Interference mode
  interferenceEnabled: boolean;
  setInterferenceEnabled: (v: boolean) => void;
  x02: number; setX02: (v: number) => void;
  k02: number; setK02: (v: number) => void;
  sigma2: number; setSigma2: (v: number) => void;
}

const potentials: { key: PotentialType; label: string }[] = [
  { key: "free", label: "Free Particle" },
  { key: "infinite_well", label: "Infinite Well" },
  { key: "harmonic", label: "Harmonic Oscillator" },
  { key: "step", label: "Step Potential" },
  { key: "double_well", label: "Double Well" },
  { key: "gaussian_barrier", label: "Gaussian Barrier" },
  { key: "morse", label: "Morse Potential" },
  { key: "coulomb", label: "Coulomb (1D)" },
];

const bcs: { key: BoundaryCondition; label: string }[] = [
  { key: "dirichlet", label: "Dirichlet" },
  { key: "absorbing", label: "Absorbing" },
  { key: "periodic", label: "Periodic" },
  { key: "neumann", label: "Neumann" },
];

const initialStates: { key: InitialStateType; label: string; desc: string }[] = [
  { key: "gaussian", label: "Gaussian", desc: "Standard wave packet" },
  { key: "coherent", label: "Coherent", desc: "HO ground state displaced" },
  { key: "cat", label: "Cat State", desc: "Two-Gaussian superposition" },
  { key: "squeezed", label: "Squeezed", desc: "Reduced Δx, increased Δp" },
  { key: "plane_wave", label: "Plane Wave", desc: "Extended momentum state" },
  { key: "eigenstate", label: "Eigenstate", desc: "Box eigenfunction" },
];

const SliderRow = memo(({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary">{value.toFixed(2)}{unit}</span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
));
SliderRow.displayName = "SliderRow";

const SimulationControls = (props: Props) => {
  return (
    <div className="space-y-3">
      {/* Playback */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Simulation</h3>
        <div className="flex gap-2 mb-3">
          <Button size="sm" onClick={props.onTogglePlay} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
            {props.playing ? <Pause size={12} /> : <Play size={12} />}
            {props.playing ? "Pause" : "Evolve"}
          </Button>
          <Button size="sm" variant="outline" onClick={props.onReset} className="border-border gap-1">
            <RotateCcw size={12} /> Reset
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={props.onMeasurePos} className="border-border gap-1 flex-1 text-[10px]">
            <Crosshair size={11} /> Measure x
          </Button>
          <Button size="sm" variant="outline" onClick={props.onMeasureMom} className="border-border gap-1 flex-1 text-[10px]">
            <Waves size={11} /> Measure p
          </Button>
        </div>
      </GlassCard>

      {/* Potential */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Potential V(x)</h3>
        <div className="grid grid-cols-2 gap-1">
          {potentials.map(p => (
            <button
              key={p.key}
              onClick={() => props.setPotential(p.key)}
              className={`text-[10px] px-2 py-1.5 rounded-md border transition-colors ${
                props.potential === p.key
                  ? "bg-primary/15 border-primary/30 text-primary font-medium"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <SliderRow label="V₀" value={props.V0} min={0} max={20} step={0.5} onChange={props.setV0} />
          <SliderRow label="ω" value={props.omega} min={0.1} max={5} step={0.1} onChange={props.setOmega} />
          <SliderRow label="Width" value={props.width} min={0.1} max={5} step={0.1} onChange={props.setWidth} />
          <SliderRow label="Separation" value={props.separation} min={0.5} max={5} step={0.1} onChange={props.setSeparation} />
        </div>
      </GlassCard>

      {/* Initial state type */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Initial State</h3>
        <div className="grid grid-cols-2 gap-1 mb-3">
          {initialStates.map(s => (
            <button
              key={s.key}
              onClick={() => props.setInitialState(s.key)}
              className={`text-left px-2 py-1.5 rounded-md border transition-colors ${
                props.initialState === s.key
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="text-[10px] font-medium">{s.label}</div>
              <div className="text-[8px] opacity-60">{s.desc}</div>
            </button>
          ))}
        </div>
        <h3 className="text-xs font-semibold text-foreground mb-2">Wave Packet Parameters</h3>
        <div className="space-y-2">
          <SliderRow label="x₀ (center)" value={props.x0} min={-8} max={8} step={0.1} onChange={props.setX0} />
          <SliderRow label="k₀ (momentum)" value={props.k0} min={-15} max={15} step={0.5} onChange={props.setK0} />
          <SliderRow label="σ (width)" value={props.sigma} min={0.1} max={3} step={0.05} onChange={props.setSigma} />
        </div>

        {/* Interference mode */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mb-2">
            <input type="checkbox" checked={props.interferenceEnabled} onChange={e => props.setInterferenceEnabled(e.target.checked)}
              className="rounded border-border" />
            <span className="font-semibold text-foreground">Interference Mode</span>
          </label>
          {props.interferenceEnabled && (
            <div className="space-y-2 pl-1">
              <p className="text-[8px] text-muted-foreground">Second wave packet (counter-propagating)</p>
              <SliderRow label="x₀'" value={props.x02} min={-8} max={8} step={0.1} onChange={props.setX02} />
              <SliderRow label="k₀'" value={props.k02} min={-15} max={15} step={0.5} onChange={props.setK02} />
              <SliderRow label="σ'" value={props.sigma2} min={0.1} max={3} step={0.05} onChange={props.setSigma2} />
            </div>
          )}
        </div>
      </GlassCard>

      {/* Solver settings */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Solver Settings</h3>
        <div className="space-y-2">
          <SliderRow label="Δt" value={props.dt} min={0.001} max={0.05} step={0.001} onChange={props.setDt} />
          <SliderRow label="Grid points" value={props.gridSize} min={128} max={512} step={64} onChange={props.setGridSize} />
        </div>
        <h3 className="text-xs font-semibold text-foreground mt-3 mb-2">Boundary Conditions</h3>
        <div className="grid grid-cols-2 gap-1">
          {bcs.map(b => (
            <button
              key={b.key}
              onClick={() => props.setBc(b.key)}
              className={`text-[10px] px-2 py-1.5 rounded-md border transition-colors ${
                props.bc === b.key
                  ? "bg-primary/15 border-primary/30 text-primary font-medium"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* View toggles */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Visualization</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={props.showPhase} onChange={e => props.setShowPhase(e.target.checked)}
              className="rounded border-border" />
            Phase color overlay
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={props.show3D} onChange={e => props.setShow3D(e.target.checked)}
              className="rounded border-border" />
            3D wavefunction view
          </label>
        </div>
      </GlassCard>
    </div>
  );
};

export default memo(SimulationControls);
