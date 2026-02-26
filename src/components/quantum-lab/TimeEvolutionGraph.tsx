import { memo } from "react";
import GlassCard from "@/components/GlassCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

interface TrajectoryPoint {
  t: number;
  x_mean: number;
  p_mean: number;
  delta_x: number;
  energy: number;
  norm: number;
}

interface Props {
  trajectory: TrajectoryPoint[];
}

const TimeEvolutionGraph = ({ trajectory }: Props) => {
  if (trajectory.length < 2) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2">Time Evolution</h3>
        <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
          Start simulation to track evolution…
        </div>
      </GlassCard>
    );
  }

  // Downsample for performance
  const step = Math.max(1, Math.floor(trajectory.length / 150));
  const data = trajectory.filter((_, i) => i % step === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Expectation trajectory */}
      <GlassCard className="p-4">
        <h3 className="text-[10px] font-semibold text-foreground mb-1">⟨x⟩ & ⟨p⟩ Trajectory</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
            <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" />
            <Legend wrapperStyle={{ fontSize: "9px" }} />
            <Line type="monotone" dataKey="x_mean" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="⟨x⟩" />
            <Line type="monotone" dataKey="p_mean" stroke="#a78bfa" strokeWidth={1} dot={false} name="⟨p⟩" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Energy */}
      <GlassCard className="p-4">
        <h3 className="text-[10px] font-semibold text-foreground mb-1">Energy ⟨Ĥ⟩</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
            <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" />
            <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="⟨E⟩" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Norm conservation */}
      <GlassCard className="p-4">
        <h3 className="text-[10px] font-semibold text-foreground mb-1">Norm ‖ψ‖²</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
            <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" domain={[0.98, 1.02]} />
            <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.5} />
            <Line type="monotone" dataKey="norm" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="‖ψ‖²" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};

export default memo(TimeEvolutionGraph);
