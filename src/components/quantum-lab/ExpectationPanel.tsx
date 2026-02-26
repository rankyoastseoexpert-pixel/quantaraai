import { memo } from "react";
import GlassCard from "@/components/GlassCard";
import type { ExpectationValues, MeasurementRecord, EducationalContent } from "@/lib/quantumSimulator";

interface Props {
  ev: ExpectationValues | null;
  measurements: MeasurementRecord[];
  education: EducationalContent;
  normHistory: number[];
  energyHistory: number[];
}

const Stat = ({ label, value, unit, warn }: { label: string; value: number; unit?: string; warn?: boolean }) => (
  <div className={`flex justify-between text-xs px-2 py-1 rounded ${warn ? "bg-destructive/10" : "bg-secondary/30"}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono ${warn ? "text-destructive" : "text-primary"}`}>{value.toFixed(4)}{unit}</span>
  </div>
);

const ExpectationPanel = ({ ev, measurements, education, normHistory, energyHistory }: Props) => {
  const normDeviation = ev ? Math.abs(ev.norm - 1) : 0;
  const heisenbergSatisfied = ev ? ev.heisenberg >= 0.49 : true; // ℏ/2 = 0.5

  return (
    <div className="space-y-3">
      {/* Expectation values */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Expectation Values</h3>
        {ev ? (
          <div className="space-y-1">
            <Stat label="⟨x⟩" value={ev.x_mean} />
            <Stat label="⟨p⟩" value={ev.p_mean} />
            <Stat label="⟨E⟩" value={ev.energy} unit=" ℏω" />
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Start simulation to see values</p>
        )}
      </GlassCard>

      {/* Uncertainty */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Uncertainty Principle</h3>
        {ev ? (
          <div className="space-y-1">
            <Stat label="Δx" value={ev.delta_x} />
            <Stat label="Δp" value={ev.delta_p} />
            <Stat label="ΔxΔp" value={ev.heisenberg} warn={!heisenbergSatisfied} />
            <div className={`text-[10px] mt-1 px-2 py-1 rounded ${heisenbergSatisfied ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {heisenbergSatisfied ? "✓ ΔxΔp ≥ ℏ/2 satisfied" : "⚠ Heisenberg violation — increase grid resolution"}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Waiting for data…</p>
        )}
      </GlassCard>

      {/* Solver diagnostics */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Solver Diagnostics</h3>
        {ev ? (
          <div className="space-y-1">
            <Stat label="‖ψ‖²" value={ev.norm} warn={normDeviation > 0.01} />
            <div className={`text-[10px] px-2 py-1 rounded ${normDeviation < 0.001 ? "bg-primary/10 text-primary" : normDeviation < 0.01 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
              {normDeviation < 0.001 ? "✓ Norm conserved" : normDeviation < 0.01 ? "~ Norm drift detected" : "⚠ Norm not conserved"}
            </div>
            <Stat label="Stability" value={normDeviation < 0.01 ? 1 : 0} />
          </div>
        ) : null}
      </GlassCard>

      {/* Measurement log */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Measurement History</h3>
        {measurements.length > 0 ? (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {measurements.slice(-10).reverse().map((m, i) => (
              <div key={i} className="text-[10px] font-mono flex justify-between px-2 py-1 rounded bg-secondary/30">
                <span className="text-muted-foreground">t={m.time.toFixed(3)}</span>
                <span className="text-primary">
                  {m.type === "position" ? `x = ${m.position.toFixed(3)}` : `p = ${m.position.toFixed(3)}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">No measurements yet. Click "Measure x" or "Measure p".</p>
        )}
      </GlassCard>

      {/* Educational */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Physics Insight</h3>
        <div className="space-y-2 text-[10px]">
          <div>
            <span className="text-muted-foreground block mb-0.5">Schrödinger Equation</span>
            <span className="font-mono text-primary text-[9px]">{education.equation}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Hamiltonian</span>
            <span className="font-mono text-primary text-[9px]">{education.operatorDesc}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Boundary Conditions</span>
            <span className="text-foreground">{education.boundaryDesc}</span>
          </div>
          <div className="mt-1 px-2 py-1.5 rounded bg-primary/5 border border-primary/10 text-foreground">
            💡 {education.physicsHint}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default memo(ExpectationPanel);
