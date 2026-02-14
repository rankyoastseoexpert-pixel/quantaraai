import { motion } from "framer-motion";
import { useRef, useMemo } from "react";
import BohrModelWidget from "./BohrModelWidget";
import PeriodicTableCard from "./PeriodicTableCard";

/**
 * Optimized scientific background decorations.
 * - Reduced element count for performance
 * - CSS will-change only on animated elements
 * - prefers-reduced-motion support built in
 * - No scroll-based parallax (moved to CSS transforms for GPU acceleration)
 */

const bohrModels = [
  { className: "absolute right-[4%] top-[8%]", element: { symbol: "C", z: 6, electrons: [2, 4], color: "hsl(var(--primary))" }, size: 130, opacity: 0.06, delay: 0 },
  { className: "absolute left-[6%] top-[38%]", element: { symbol: "He", z: 2, electrons: [2], color: "hsl(var(--primary))" }, size: 80, opacity: 0.035, delay: 0.8 },
  { className: "absolute right-[3%] top-[52%]", element: { symbol: "Li", z: 3, electrons: [2, 1], color: "hsl(var(--primary))" }, size: 90, opacity: 0.04, delay: 1 },
  { className: "absolute left-[4%] top-[68%]", element: { symbol: "Fe", z: 26, electrons: [2, 8, 14, 2], color: "hsl(var(--primary))" }, size: 140, opacity: 0.035, delay: 1.2 },
  { className: "absolute right-[10%] top-[82%]", element: { symbol: "N", z: 7, electrons: [2, 5], color: "hsl(var(--primary))" }, size: 100, opacity: 0.04, delay: 1.4 },
];

const periodicTables = [
  { className: "absolute left-[2%] top-[14%]", opacity: 0.05, delay: 0.2, size: "md" as const },
  { className: "absolute right-[5%] top-[42%]", opacity: 0.035, delay: 0.9, size: "sm" as const },
];

// Simplified DNA using CSS animation instead of framer-motion per-node
const DnaHelix = ({ x, y, height, delay }: { x: string; y: string; height: number; delay: number }) => {
  const points = useMemo(() => {
    const pts: Array<{ x1: number; x2: number; y: number }> = [];
    for (let j = 0; j < Math.floor(height / 14); j++) {
      const phase = j * 0.8;
      pts.push({
        x1: 20 + Math.sin(phase) * 14,
        x2: 20 - Math.sin(phase) * 14,
        y: j * 14,
      });
    }
    return pts;
  }, [height]);

  return (
    <motion.svg
      className="absolute hidden md:block"
      style={{ left: x, top: y, willChange: "transform, opacity" }}
      width="40"
      height={height}
      viewBox={`0 0 40 ${height}`}
      opacity={0.04}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.04 }}
      transition={{ delay, duration: 1 }}
    >
      {points.map((p, j) => (
        <g key={j}>
          <circle cx={p.x1} cy={p.y} r={1.5} fill="hsl(var(--primary))" className="animate-pulse" />
          <circle cx={p.x2} cy={p.y} r={1.5} fill="hsl(var(--primary))" className="animate-pulse" style={{ animationDelay: `${j * 0.1}s` }} />
          {j % 2 === 0 && (
            <line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="hsl(var(--primary))" strokeWidth={0.4} opacity={0.5} strokeDasharray="2 2" />
          )}
          {j > 0 && (
            <>
              <line x1={points[j - 1].x1} y1={points[j - 1].y} x2={p.x1} y2={p.y} stroke="hsl(var(--primary))" strokeWidth={0.4} opacity={0.3} />
              <line x1={points[j - 1].x2} y1={points[j - 1].y} x2={p.x2} y2={p.y} stroke="hsl(var(--primary))" strokeWidth={0.4} opacity={0.3} />
            </>
          )}
        </g>
      ))}
    </motion.svg>
  );
};

// Lightweight wave packet using CSS animation
const WavePacket = ({ x, y, width, delay }: { x: string; y: string; width: number; delay: number }) => {
  const d = useMemo(() => {
    const segments = Array.from({ length: 20 }).map((_, j) => {
      const px = (j + 1) * (width / 20);
      const envelope = Math.exp(-((j - 10) ** 2) / 18);
      const py = 25 + Math.sin(j * 1.2) * 18 * envelope;
      return `L${px},${py}`;
    }).join(" ");
    return `M0,25 ${segments}`;
  }, [width]);

  return (
    <motion.svg
      className="absolute hidden md:block"
      style={{ left: x, top: y }}
      width={width}
      height="50"
      viewBox={`0 0 ${width} 50`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.04 }}
      transition={{ delay, duration: 1 }}
    >
      <path d={d} stroke="hsl(var(--primary))" strokeWidth={1} fill="none" className="animate-pulse" />
    </motion.svg>
  );
};

// Orbital lobe using pure SVG + CSS
const OrbitalDiagram = ({ x, y, size, type, delay }: { x: string; y: string; size: number; type: string; delay: number }) => (
  <motion.svg
    className="absolute hidden md:block"
    style={{ left: x, top: y }}
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.04 }}
    transition={{ delay, duration: 1 }}
  >
    {type === "p" ? (
      <>
        <ellipse cx={size / 2} cy={size * 0.3} rx={size * 0.15} ry={size * 0.25} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.8} className="animate-pulse" />
        <ellipse cx={size / 2} cy={size * 0.7} rx={size * 0.15} ry={size * 0.25} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.8} strokeDasharray="3 2" className="animate-pulse" />
        <circle cx={size / 2} cy={size / 2} r={2} fill="hsl(var(--primary))" opacity={0.6} />
        <text x={size / 2 + 6} y={size / 2 + 3} fill="hsl(var(--primary))" fontSize={6} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>p</text>
      </>
    ) : (
      <>
        {[0, 90].map((rot) => (
          <g key={rot} transform={`rotate(${rot} ${size / 2} ${size / 2})`}>
            <ellipse cx={size / 2} cy={size * 0.25} rx={size * 0.1} ry={size * 0.2} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.7} className="animate-pulse" />
            <ellipse cx={size / 2} cy={size * 0.75} rx={size * 0.1} ry={size * 0.2} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.7} strokeDasharray="2 2" className="animate-pulse" />
          </g>
        ))}
        <circle cx={size / 2} cy={size / 2} r={2} fill="hsl(var(--primary))" opacity={0.6} />
        <text x={size / 2 + 6} y={size / 2 + 3} fill="hsl(var(--primary))" fontSize={6} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>d</text>
      </>
    )}
  </motion.svg>
);

const FloatingScientificModels = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 motion-reduce:hidden">
      {/* Bohr Models */}
      {bohrModels.map((bm, i) => (
        <BohrModelWidget key={`bohr-${i}`} className={bm.className} element={bm.element} size={bm.size} opacity={bm.opacity} delay={bm.delay} />
      ))}

      {/* Periodic Table Grids */}
      {periodicTables.map((pt, i) => (
        <PeriodicTableCard key={`pt-${i}`} className={pt.className} opacity={pt.opacity} delay={pt.delay} size={pt.size} />
      ))}

      {/* DNA Helices - reduced to 2 */}
      <DnaHelix x="92%" y="20%" height={180} delay={0.4} />
      <DnaHelix x="5%" y="55%" height={150} delay={1.0} />

      {/* Wave Packets - reduced to 2 */}
      <WavePacket x="15%" y="30%" width={160} delay={0.6} />
      <WavePacket x="70%" y="75%" width={130} delay={1.1} />

      {/* Orbital Diagrams - reduced to 2 */}
      <OrbitalDiagram x="78%" y="8%" size={80} type="p" delay={0.3} />
      <OrbitalDiagram x="20%" y="60%" size={60} type="d" delay={1.2} />

      {/* Spectral Lines - pure CSS animation */}
      <svg
        className="absolute hidden md:block animate-pulse"
        style={{ left: "45%", top: "35%", opacity: 0.035 }}
        width="60"
        height="100"
        viewBox="0 0 60 100"
      >
        {[
          { x: 10, color: "hsl(0 80% 55%)", w: 2 },
          { x: 20, color: "hsl(var(--primary))", w: 1.5 },
          { x: 35, color: "hsl(210 100% 56%)", w: 2 },
          { x: 50, color: "hsl(270 80% 60%)", w: 1.5 },
        ].map((line, i) => (
          <line key={i} x1={line.x} y1={0} x2={line.x} y2={100} stroke={line.color} strokeWidth={line.w} opacity={0.5} />
        ))}
        <text x={30} y={98} textAnchor="middle" fill="hsl(var(--primary))" fontSize={5} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>
          Hα Hβ Hγ
        </text>
      </svg>
    </div>
  );
};

export default FloatingScientificModels;
