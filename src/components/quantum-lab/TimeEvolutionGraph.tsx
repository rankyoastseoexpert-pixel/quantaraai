import { memo } from "react";
import GlassCard from "@/components/GlassCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { TrendingUp, Zap, Shield } from "lucide-react";

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

const ChartHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
      <Icon size={9} className="text-primary" />
    </div>
    <h3 className="text-[10px] font-semibold text-foreground">{title}</h3>
  </div>
);

const TimeEvolutionGraph = ({ trajectory }: Props) => {
  if (trajectory.length < 2) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <TrendingUp size={11} className="text-primary" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">Time Evolution</h3>
        </div>
        <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground italic">
          Start simulation to track evolution…
        </div>
      </GlassCard>
    );
  }

  const step = Math.max(1, Math.floor(trajectory.length / 150));
  const data = trajectory.filter((_, i) => i % step === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <GlassCard className="p-3">
        <ChartHeader icon={TrendingUp} title="⟨x⟩ & ⟨p⟩ Trajectory" />
        <div className="rounded-lg border border-border/20 bg-background/20 p-1">
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
              <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" />
              <Legend wrapperStyle={{ fontSize: "9px" }} />
              <Line type="monotone" dataKey="x_mean" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="⟨x⟩" />
              <Line type="monotone" dataKey="p_mean" stroke="#a78bfa" strokeWidth={1} dot={false} name="⟨p⟩" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <ChartHeader icon={Zap} title="Energy ⟨Ĥ⟩" />
        <div className="rounded-lg border border-border/20 bg-background/20 p-1">
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
              <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" />
              <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="⟨E⟩" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <ChartHeader icon={Shield} title="Norm ‖ψ‖²" />
        <div className="rounded-lg border border-border/20 bg-background/20 p-1">
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="t" fontSize={8} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.toFixed(1)} />
              <YAxis fontSize={8} stroke="hsl(var(--muted-foreground))" domain={[0.98, 1.02]} />
              <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.4} />
              <Line type="monotone" dataKey="norm" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="‖ψ‖²" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

export default memo(TimeEvolutionGraph);
