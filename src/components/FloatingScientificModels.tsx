import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import BohrModelWidget from "./BohrModelWidget";
import PeriodicTableCard from "./PeriodicTableCard";

/**
 * Scattered scientific background decorations across the full page.
 * All elements are pointer-events-none, low opacity, and purely decorative.
 */

const bohrModels = [
  // Hero area
  { className: "absolute right-[4%] top-[8%]", element: { symbol: "C", z: 6, electrons: [2, 4], color: "hsl(var(--primary))" }, size: 130, opacity: 0.06, delay: 0 },
  { className: "absolute left-[2%] top-[5%]", element: { symbol: "H", z: 1, electrons: [1], color: "hsl(var(--primary))" }, size: 70, opacity: 0.04, delay: 0.3 },
  // Stats / workflow area
  { className: "absolute right-[8%] top-[28%]", element: { symbol: "O", z: 8, electrons: [2, 6], color: "hsl(var(--primary))" }, size: 100, opacity: 0.04, delay: 0.5 },
  { className: "absolute left-[6%] top-[38%]", element: { symbol: "He", z: 2, electrons: [2], color: "hsl(var(--primary))" }, size: 80, opacity: 0.035, delay: 0.8 },
  // Features area
  { className: "absolute right-[3%] top-[52%]", element: { symbol: "Li", z: 3, electrons: [2, 1], color: "hsl(var(--primary))" }, size: 90, opacity: 0.04, delay: 1 },
  { className: "absolute left-[4%] top-[68%]", element: { symbol: "Fe", z: 26, electrons: [2, 8, 14, 2], color: "hsl(var(--primary))" }, size: 160, opacity: 0.035, delay: 1.2 },
  // Demo / CTA area
  { className: "absolute right-[10%] top-[78%]", element: { symbol: "N", z: 7, electrons: [2, 5], color: "hsl(var(--primary))" }, size: 110, opacity: 0.04, delay: 1.4 },
  { className: "absolute left-[12%] top-[88%]", element: { symbol: "Ne", z: 10, electrons: [2, 8], color: "hsl(var(--primary))" }, size: 120, opacity: 0.03, delay: 1.6 },
];

const periodicTables = [
  { className: "absolute left-[2%] top-[14%]", opacity: 0.05, delay: 0.2, size: "md" as const },
  { className: "absolute right-[5%] top-[42%]", opacity: 0.035, delay: 0.9, size: "sm" as const },
  { className: "absolute left-[8%] top-[75%]", opacity: 0.04, delay: 1.3, size: "sm" as const },
];

// DNA Helix positions
const dnaHelices = [
  { x: "92%", y: "20%", height: 200, delay: 0.4 },
  { x: "5%", y: "48%", height: 160, delay: 1.0 },
  { x: "88%", y: "65%", height: 140, delay: 1.5 },
];

// Wave packets
const wavePackets = [
  { x: "15%", y: "30%", width: 180, delay: 0.6 },
  { x: "70%", y: "55%", width: 150, delay: 1.1 },
  { x: "30%", y: "82%", width: 120, delay: 1.7 },
];

// Orbital diagrams (p, d orbitals)
const orbitalDiagrams = [
  { x: "78%", y: "8%", size: 80, type: "p", delay: 0.3 },
  { x: "20%", y: "58%", size: 60, type: "d", delay: 1.2 },
  { x: "65%", y: "88%", size: 70, type: "p", delay: 1.8 },
];

const FloatingScientificModels = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -260]);
  const layers = [y1, y2, y3];

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* ═══ Bohr Models ═══ */}
      {bohrModels.map((bm, i) => (
        <motion.div key={`bohr-${i}`} style={{ y: layers[i % 3] }}>
          <BohrModelWidget
            className={bm.className}
            element={bm.element}
            size={bm.size}
            opacity={bm.opacity}
            delay={bm.delay}
          />
        </motion.div>
      ))}

      {/* ═══ Periodic Table Grids ═══ */}
      {periodicTables.map((pt, i) => (
        <motion.div key={`pt-${i}`} style={{ y: layers[(i + 1) % 3] }}>
          <PeriodicTableCard
            className={pt.className}
            opacity={pt.opacity}
            delay={pt.delay}
            size={pt.size}
          />
        </motion.div>
      ))}

      {/* ═══ DNA Helices ═══ */}
      {dnaHelices.map((dna, i) => (
        <motion.svg
          key={`dna-${i}`}
          className="absolute hidden md:block"
          style={{ left: dna.x, top: dna.y, y: layers[(i + 2) % 3] }}
          width="40"
          height={dna.height}
          viewBox={`0 0 40 ${dna.height}`}
          opacity={0.04}
        >
          {Array.from({ length: Math.floor(dna.height / 12) }).map((_, j) => {
            const yPos = j * 12;
            const phase = j * 0.8;
            const x1 = 20 + Math.sin(phase) * 14;
            const x2 = 20 - Math.sin(phase) * 14;
            return (
              <g key={j}>
                <motion.circle
                  cx={x1} cy={yPos} r={1.5}
                  fill="hsl(var(--primary))"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, delay: dna.delay + j * 0.1, repeat: Infinity }}
                />
                <motion.circle
                  cx={x2} cy={yPos} r={1.5}
                  fill="hsl(var(--primary))"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, delay: dna.delay + j * 0.1 + 0.5, repeat: Infinity }}
                />
                {/* Rungs */}
                {j % 2 === 0 && (
                  <line
                    x1={x1} y1={yPos} x2={x2} y2={yPos}
                    stroke="hsl(var(--primary))"
                    strokeWidth={0.4}
                    opacity={0.5}
                    strokeDasharray="2 2"
                  />
                )}
                {/* Backbone curves */}
                {j > 0 && (
                  <>
                    <line
                      x1={20 + Math.sin((j - 1) * 0.8) * 14}
                      y1={(j - 1) * 12}
                      x2={x1}
                      y2={yPos}
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.4}
                      opacity={0.3}
                    />
                    <line
                      x1={20 - Math.sin((j - 1) * 0.8) * 14}
                      y1={(j - 1) * 12}
                      x2={x2}
                      y2={yPos}
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.4}
                      opacity={0.3}
                    />
                  </>
                )}
              </g>
            );
          })}
        </motion.svg>
      ))}

      {/* ═══ Wave Packets ═══ */}
      {wavePackets.map((wp, i) => (
        <motion.svg
          key={`wp-${i}`}
          className="absolute hidden md:block"
          style={{ left: wp.x, top: wp.y, y: layers[i % 3] }}
          width={wp.width}
          height="50"
          viewBox={`0 0 ${wp.width} 50`}
          opacity={0.04}
        >
          <motion.path
            d={`M0,25 ${Array.from({ length: 20 }).map((_, j) => {
              const x = (j + 1) * (wp.width / 20);
              const envelope = Math.exp(-((j - 10) ** 2) / 18);
              const y = 25 + Math.sin(j * 1.2) * 18 * envelope;
              return `L${x},${y}`;
            }).join(" ")}`}
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            fill="none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, delay: wp.delay, repeat: Infinity }}
          />
          {/* Envelope */}
          <path
            d={`M0,25 ${Array.from({ length: 20 }).map((_, j) => {
              const x = (j + 1) * (wp.width / 20);
              const envelope = Math.exp(-((j - 10) ** 2) / 18);
              return `L${x},${25 - 18 * envelope}`;
            }).join(" ")}`}
            stroke="hsl(var(--primary))"
            strokeWidth={0.4}
            fill="none"
            opacity={0.3}
            strokeDasharray="3 3"
          />
        </motion.svg>
      ))}

      {/* ═══ Orbital Diagrams (p/d orbital lobes) ═══ */}
      {orbitalDiagrams.map((orb, i) => (
        <motion.svg
          key={`orbital-${i}`}
          className="absolute hidden md:block"
          style={{ left: orb.x, top: orb.y, y: layers[(i + 1) % 3] }}
          width={orb.size}
          height={orb.size}
          viewBox={`0 0 ${orb.size} ${orb.size}`}
          opacity={0.04}
        >
          {orb.type === "p" ? (
            <>
              {/* p-orbital: two lobes */}
              <motion.ellipse
                cx={orb.size / 2}
                cy={orb.size * 0.3}
                rx={orb.size * 0.15}
                ry={orb.size * 0.25}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={0.8}
                animate={{ ry: [orb.size * 0.23, orb.size * 0.27, orb.size * 0.23] }}
                transition={{ duration: 4, delay: orb.delay, repeat: Infinity }}
              />
              <motion.ellipse
                cx={orb.size / 2}
                cy={orb.size * 0.7}
                rx={orb.size * 0.15}
                ry={orb.size * 0.25}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={0.8}
                strokeDasharray="3 2"
                animate={{ ry: [orb.size * 0.23, orb.size * 0.27, orb.size * 0.23] }}
                transition={{ duration: 4, delay: orb.delay + 0.5, repeat: Infinity }}
              />
              <circle cx={orb.size / 2} cy={orb.size / 2} r={2} fill="hsl(var(--primary))" opacity={0.6} />
              <text x={orb.size / 2 + 6} y={orb.size / 2 + 3} fill="hsl(var(--primary))" fontSize={6} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>
                p
              </text>
            </>
          ) : (
            <>
              {/* d-orbital: four lobes (cloverleaf) */}
              {[0, 90].map((rot) => (
                <g key={rot} transform={`rotate(${rot} ${orb.size / 2} ${orb.size / 2})`}>
                  <motion.ellipse
                    cx={orb.size / 2}
                    cy={orb.size * 0.25}
                    rx={orb.size * 0.1}
                    ry={orb.size * 0.2}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={0.7}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, delay: orb.delay + rot * 0.01, repeat: Infinity }}
                  />
                  <motion.ellipse
                    cx={orb.size / 2}
                    cy={orb.size * 0.75}
                    rx={orb.size * 0.1}
                    ry={orb.size * 0.2}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={0.7}
                    strokeDasharray="2 2"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, delay: orb.delay + rot * 0.01 + 0.3, repeat: Infinity }}
                  />
                </g>
              ))}
              <circle cx={orb.size / 2} cy={orb.size / 2} r={2} fill="hsl(var(--primary))" opacity={0.6} />
              <text x={orb.size / 2 + 6} y={orb.size / 2 + 3} fill="hsl(var(--primary))" fontSize={6} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>
                d
              </text>
            </>
          )}
        </motion.svg>
      ))}

      {/* ═══ Spectral Lines ═══ */}
      <motion.svg
        className="absolute hidden md:block"
        style={{ left: "45%", top: "35%", y: y2 }}
        width="60"
        height="100"
        viewBox="0 0 60 100"
        opacity={0.035}
      >
        {[
          { x: 10, color: "hsl(0 80% 55%)", w: 2 },
          { x: 20, color: "hsl(var(--primary))", w: 1.5 },
          { x: 28, color: "hsl(var(--primary))", w: 1 },
          { x: 35, color: "hsl(210 100% 56%)", w: 2 },
          { x: 42, color: "hsl(210 100% 56%)", w: 1 },
          { x: 50, color: "hsl(270 80% 60%)", w: 1.5 },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x} y1={0} x2={line.x} y2={100}
            stroke={line.color}
            strokeWidth={line.w}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, delay: i * 0.4, repeat: Infinity }}
          />
        ))}
        <text x={30} y={98} textAnchor="middle" fill="hsl(var(--primary))" fontSize={5} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>
          Hα Hβ Hγ
        </text>
      </motion.svg>
    </div>
  );
};

export default FloatingScientificModels;
