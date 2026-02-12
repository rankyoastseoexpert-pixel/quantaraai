import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

interface LinearSolverGraphProps {
  m: number;
  c: number;
  xLabel?: string;
  yLabel?: string;
}

function generateLinearData(m: number, c: number, xMin = -10, xMax = 10, points = 200) {
  const data: { x: number; y: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = xMin + (xMax - xMin) * (i / points);
    const y = m * x + c;
    data.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(6)) });
  }
  return data;
}

const LinearSolverGraph = ({ m, c, xLabel = "x", yLabel = "y" }: LinearSolverGraphProps) => {
  const data = useMemo(() => generateLinearData(m, c), [m, c]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
        <span>Slope (m) = <span className="text-primary font-bold">{m}</span></span>
        <span>Intercept (c) = <span className="text-primary font-bold">{c}</span></span>
        <span>θ = <span className="text-primary font-bold">{(Math.atan(m) * 180 / Math.PI).toFixed(1)}°</span></span>
      </div>
      <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0a0e1a]">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" stroke="#94a3b8" fontSize={10} label={{ value: xLabel, position: "bottom", offset: 0, fill: "#94a3b8", fontSize: 11 }} />
            <YAxis stroke="#94a3b8" fontSize={10} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0" }}
            />
            <Legend />
            <ReferenceLine x={0} stroke="#475569" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
            {/* Y-intercept point highlight */}
            <ReferenceLine y={c} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1} label={{ value: `c=${c}`, fill: "#f59e0b", fontSize: 10 }} />
            <Line type="linear" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} name={`${yLabel} = ${m}${xLabel} + ${c}`} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LinearSolverGraph;
