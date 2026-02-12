import { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

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

const AnimatedLine = (props: any) => {
  const { points, ...rest } = props;
  if (!points || points.length === 0) return null;

  const d = points.reduce((path: string, point: any, i: number) => {
    return path + `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`;
  }, "");

  const pathLength = 2000;

  return (
    <motion.path
      d={d}
      fill="none"
      strokeWidth={rest.strokeWidth || 2.5}
      stroke={rest.stroke || "#3b82f6"}
      initial={{ strokeDasharray: pathLength, strokeDashoffset: pathLength }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
  );
};

const LinearSolverGraph = ({ m, c, xLabel = "x", yLabel = "y" }: LinearSolverGraphProps) => {
  const data = useMemo(() => generateLinearData(m, c), [m, c]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, [m, c]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
        <span>Slope (m) = <span className="text-primary font-bold">{m}</span></span>
        <span>Intercept (c) = <span className="text-primary font-bold">{c}</span></span>
        <span>θ = <span className="text-primary font-bold">{(Math.atan(m) * 180 / Math.PI).toFixed(1)}°</span></span>
      </div>
      <div className="glass-card !p-2 overflow-hidden">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18% / 0.5)" />
            <XAxis dataKey="x" stroke="hsl(215 20% 55%)" fontSize={10} label={{ value: xLabel, position: "bottom", offset: 0, fill: "hsl(215 20% 55%)", fontSize: 11 }} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={10} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "hsl(215 20% 55%)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 40% 10%)",
                border: "1px solid hsl(222 30% 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210 40% 94%)",
                backdropFilter: "blur(12px)",
              }}
            />
            <Legend />
            <ReferenceLine x={0} stroke="hsl(222 30% 25%)" strokeWidth={1} />
            <ReferenceLine y={0} stroke="hsl(222 30% 25%)" strokeWidth={1} />
            <ReferenceLine y={c} stroke="hsl(38 92% 50%)" strokeDasharray="6 3" strokeWidth={1} label={{ value: `c=${c}`, fill: "hsl(38 92% 50%)", fontSize: 10 }} />
            <Line
              type="linear"
              dataKey="y"
              stroke="hsl(210 100% 55%)"
              strokeWidth={2.5}
              dot={false}
              name={`${yLabel} = ${m}${xLabel} + ${c}`}
              activeDot={{ r: 4, fill: "hsl(210 100% 55%)", stroke: "hsl(0 0% 100%)", strokeWidth: 2 }}
              // @ts-ignore
              shape={<AnimatedLine />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default LinearSolverGraph;
