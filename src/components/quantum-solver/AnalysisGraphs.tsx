import { memo, useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import type { SCFResult, DOSPoint, DensityCutPoint } from "@/lib/dftSolver";
import { computeDOS, compute1DDensityCut } from "@/lib/dftSolver";

interface Props {
  result: SCFResult;
}

const AnalysisGraphs = ({ result }: Props) => {
  const [densityPlane, setDensityPlane] = useState<"XY" | "XZ" | "YZ">("XY");

  // SCF Convergence data
  const convergenceData = useMemo(() =>
    result.energyHistory.map((e, i) => ({
      iteration: i + 1,
      energy: parseFloat(e.toFixed(4)),
    })),
    [result.energyHistory]
  );

  // DOS data
  const dosData = useMemo(() => computeDOS(result.finalEnergies, 0.12), [result.finalEnergies]);

  // 1D density cut
  const densityCut = useMemo(
    () => compute1DDensityCut(result.densityGrid3D, densityPlane),
    [result.densityGrid3D, densityPlane]
  );

  return (
    <div className="space-y-4">
      {/* Panel A: SCF Convergence */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-foreground mb-1">
          Panel A: SCF Convergence
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            {result.converged ? `✓ Converged in ${result.iterations} iterations` : "✗ Not converged"}
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={convergenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="iteration" stroke="hsl(var(--muted-foreground))" fontSize={10} label={{ value: "SCF Iteration", position: "bottom", fontSize: 10 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} label={{ value: "E (eV)", angle: -90, position: "insideLeft", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
            />
            <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} name="Total Energy" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Panel B: Density of States */}
      <GlassCard>
        <h3 className="text-xs font-semibold text-foreground mb-1">
          Panel B: Density of States (DOS)
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            E_F = {result.fermiEnergy.toFixed(3)} eV | Gap = {result.bandGap.toFixed(3)} eV
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dosData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <YAxis dataKey="energy" type="number" stroke="hsl(var(--muted-foreground))" fontSize={10}
              label={{ value: "Energy (eV)", angle: -90, position: "insideLeft", fontSize: 10 }} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10}
              label={{ value: "DOS (arb. units)", position: "bottom", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
            />
            <ReferenceLine y={result.fermiEnergy} stroke="#22d3ee" strokeDasharray="5 3" label={{ value: "E_F", fill: "#22d3ee", fontSize: 10 }} />
            <Area type="monotone" dataKey="dos" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Panel C: 1D Density Cut */}
      <GlassCard>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-foreground">
            Panel C: 1D Electron Density Cut
          </h3>
          <div className="flex gap-1">
            {(["XY", "XZ", "YZ"] as const).map(p => (
              <Button
                key={p}
                size="sm"
                variant={densityPlane === p ? "default" : "outline"}
                className={`h-6 text-[10px] px-2 ${densityPlane === p ? "bg-primary text-primary-foreground" : "border-border"}`}
                onClick={() => setDensityPlane(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={densityCut}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="position" stroke="hsl(var(--muted-foreground))" fontSize={10}
              label={{ value: "Position (Å)", position: "bottom", fontSize: 10 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10}
              label={{ value: "|ψ|² (arb.)", angle: -90, position: "insideLeft", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
            />
            <Area type="monotone" dataKey="density" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} strokeWidth={1.5} name="|ψ|²" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};

export default memo(AnalysisGraphs);
