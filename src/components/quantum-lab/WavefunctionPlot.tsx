import { memo, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceArea, ReferenceLine,
} from "recharts";
import type { PlotPoint } from "@/lib/quantumSimulator";
import type { ExpectationValues } from "@/lib/quantumSimulator";

interface Props {
  data: PlotPoint[];
  ev: ExpectationValues | null;
  showPhase: boolean;
  time: number;
  lastMeasurement: { x: number; type: string } | null;
}

const PhaseBar = memo(({ data }: { data: PlotPoint[] }) => {
  // Render a compact color bar showing the phase
  const step = Math.max(1, Math.floor(data.length / 100));
  return (
    <div className="flex h-3 rounded-full overflow-hidden border border-border/30 mt-2">
      {data.filter((_, i) => i % step === 0).map((p, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: p.phaseColor, opacity: Math.min(1, p.prob * 20 + 0.15) }} />
      ))}
    </div>
  );
});
PhaseBar.displayName = "PhaseBar";

const PhaseLegend = () => (
  <div className="flex items-center gap-2 mt-2">
    <span className="text-[9px] text-muted-foreground">Phase:</span>
    <div className="flex h-3 flex-1 rounded-full overflow-hidden border border-border/30">
      {Array.from({ length: 36 }, (_, i) => {
        const hue = i * 10;
        return <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${hue}, 85%, 55%)` }} />;
      })}
    </div>
    <span className="text-[9px] text-muted-foreground font-mono">−π → +π</span>
  </div>
);

const WavefunctionPlot = ({ data, ev, showPhase, time, lastMeasurement }: Props) => {
  const chartData = useMemo(() => {
    // Downsample for recharts performance
    const step = Math.max(1, Math.floor(data.length / 200));
    return data.filter((_, i) => i % step === 0);
  }, [data]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground">
          Wavefunction ψ(x, t)
        </h3>
        <span className="text-[10px] font-mono text-primary">t = {time.toFixed(3)}</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={9} tickFormatter={v => v.toFixed(1)} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--secondary))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "10px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "10px" }} />

          {/* Potential (scaled) */}
          <Line type="monotone" dataKey="potential" stroke="hsl(var(--muted-foreground))"
            strokeWidth={1} dot={false} name="V(x)" strokeDasharray="6 3" opacity={0.5} />

          {/* Probability density */}
          <Line type="monotone" dataKey="prob" stroke="#22d3ee" strokeWidth={2}
            dot={false} name="|ψ|²" />

          {/* Real part */}
          <Line type="monotone" dataKey="psi_re" stroke="hsl(var(--primary))"
            strokeWidth={1.5} dot={false} name="Re(ψ)" opacity={0.7} />

          {/* Imaginary part */}
          <Line type="monotone" dataKey="psi_im" stroke="#a78bfa"
            strokeWidth={1} dot={false} name="Im(ψ)" opacity={0.5} strokeDasharray="4 2" />

          {/* Expectation value marker */}
          {ev && (
            <ReferenceLine x={parseFloat(ev.x_mean.toFixed(2))} stroke="hsl(var(--primary))"
              strokeDasharray="3 3" strokeWidth={1.5} label={{ value: "⟨x⟩", fill: "hsl(var(--primary))", fontSize: 10 }} />
          )}

          {/* Uncertainty region */}
          {ev && ev.delta_x > 0 && (
            <ReferenceArea
              x1={parseFloat((ev.x_mean - ev.delta_x).toFixed(2))}
              x2={parseFloat((ev.x_mean + ev.delta_x).toFixed(2))}
              fill="hsl(var(--primary))"
              fillOpacity={0.08}
              strokeOpacity={0}
            />
          )}

          {/* Last measurement marker */}
          {lastMeasurement && (
            <ReferenceLine x={parseFloat(lastMeasurement.x.toFixed(2))}
              stroke="hsl(var(--destructive))" strokeWidth={2}
              label={{ value: "📍", fontSize: 14 }} />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Phase visualization */}
      {showPhase && (
        <>
          <PhaseBar data={data} />
          <PhaseLegend />
        </>
      )}
    </GlassCard>
  );
};

export default memo(WavefunctionPlot);
