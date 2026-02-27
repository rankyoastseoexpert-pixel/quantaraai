import { memo } from "react";
import GlassCard from "@/components/GlassCard";
import { Activity, ShieldCheck, Gauge, History, BookOpen } from "lucide-react";
import type { ExpectationValues, MeasurementRecord, EducationalContent } from "@/lib/quantumSimulator";

interface Props {
  ev: ExpectationValues | null;
  measurements: MeasurementRecord[];
  education: EducationalContent;
  normHistory: number[];
  energyHistory: number[];
}

const Stat = ({ label, value, unit, warn, accent }: {
  label: string; value: number; unit?: string; warn?: boolean; accent?: boolean;
}) => (
  <div className={`flex justify-between items-center text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
    warn ? "bg-destructive/10 border border-destructive/20" :
    accent ? "bg-primary/10 border border-primary/20" :
    "bg-secondary/30"
  }`}>
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono font-semibold ${
      warn ? "text-destructive" : accent ? "text-primary" : "text-foreground"
    }`}>
      {value.toFixed(4)}{unit}
    </span>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-2.5">
    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
      <Icon size={11} className="text-primary" />
    </div>
    <h3 className="text-xs font-semibold text-foreground">{title}</h3>
  </div>
);

const ExpectationPanel = ({ ev, measurements, education, normHistory, energyHistory }: Props) => {
  const normDeviation = ev ? Math.abs(ev.norm - 1) : 0;
  const heisenbergSatisfied = ev ? ev.heisenberg >= 0.49 : true;

  return (
    <div className="space-y-3">
      {/* Expectation values */}
      <GlassCard className="p-4">
        <SectionHeader icon={Activity} title="Expectation Values" />
        {ev ? (
          <div className="space-y-1.5">
            <Stat label="⟨x⟩" value={ev.x_mean} accent />
            <Stat label="⟨p⟩" value={ev.p_mean} accent />
            <Stat label="⟨E⟩" value={ev.energy} unit=" ℏω" />
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">Start simulation to see values</p>
        )}
      </GlassCard>

      {/* Uncertainty */}
      <GlassCard className="p-4">
        <SectionHeader icon={ShieldCheck} title="Uncertainty Principle" />
        {ev ? (
          <div className="space-y-1.5">
            <Stat label="Δx" value={ev.delta_x} />
            <Stat label="Δp" value={ev.delta_p} />
            <Stat label="ΔxΔp" value={ev.heisenberg} warn={!heisenbergSatisfied} accent={heisenbergSatisfied} />
            <div className={`text-[10px] mt-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
              heisenbergSatisfied
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {heisenbergSatisfied ? "✓ ΔxΔp ≥ ℏ/2 satisfied" : "⚠ Heisenberg violation — increase grid"}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">Waiting for data…</p>
        )}
      </GlassCard>

      {/* Solver diagnostics */}
      <GlassCard className="p-4">
        <SectionHeader icon={Gauge} title="Solver Diagnostics" />
        {ev ? (
          <div className="space-y-1.5">
            <Stat label="‖ψ‖²" value={ev.norm} warn={normDeviation > 0.01} accent={normDeviation < 0.001} />
            <div className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium ${
              normDeviation < 0.001
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : normDeviation < 0.01
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {normDeviation < 0.001 ? "✓ Norm conserved" : normDeviation < 0.01 ? "~ Norm drift detected" : "⚠ Norm not conserved"}
            </div>
          </div>
        ) : null}
      </GlassCard>

      {/* Measurement log */}
      <GlassCard className="p-4">
        <SectionHeader icon={History} title="Measurement History" />
        {measurements.length > 0 ? (
          <div className="max-h-36 overflow-y-auto space-y-1">
            {measurements.slice(-10).reverse().map((m, i) => (
              <div key={i} className="text-[10px] font-mono flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-secondary/30 border border-border/20">
                <span className="text-muted-foreground">t={m.time.toFixed(3)}</span>
                <span className={m.type === "position" ? "text-primary font-semibold" : "text-purple-400 font-semibold"}>
                  {m.type === "position" ? `x = ${m.position.toFixed(3)}` : `p = ${m.position.toFixed(3)}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">No measurements yet. Click "Measure x" or "Measure p".</p>
        )}
      </GlassCard>

      {/* Educational */}
      <GlassCard className="p-4">
        <SectionHeader icon={BookOpen} title="Physics Insight" />
        <div className="space-y-2.5 text-[10px]">
          <div className="rounded-lg bg-secondary/30 px-2.5 py-2">
            <span className="text-muted-foreground block mb-0.5 text-[9px] uppercase tracking-wider">Schrödinger Equation</span>
            <span className="font-mono text-primary text-[9px] leading-relaxed">{education.equation}</span>
          </div>
          <div className="rounded-lg bg-secondary/30 px-2.5 py-2">
            <span className="text-muted-foreground block mb-0.5 text-[9px] uppercase tracking-wider">Hamiltonian</span>
            <span className="font-mono text-primary text-[9px]">{education.operatorDesc}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5 text-[9px] uppercase tracking-wider">Boundary</span>
            <span className="text-foreground">{education.boundaryDesc}</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/15 text-foreground leading-relaxed">
            💡 {education.physicsHint}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default memo(ExpectationPanel);
