import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const atomStructures = [
  { cx: "15%", cy: "25%", size: 120, electrons: 3 },
  { cx: "80%", cy: "60%", size: 90, electrons: 2 },
  { cx: "50%", cy: "85%", size: 70, electrons: 2 },
  { cx: "88%", cy: "15%", size: 60, electrons: 1 },
  { cx: "35%", cy: "45%", size: 50, electrons: 2 },
];

const energyLevels = [
  { x: "8%", y: "40%", width: 100, levels: 5 },
  { x: "75%", y: "35%", width: 80, levels: 4 },
  { x: "55%", y: "70%", width: 70, levels: 3 },
];

const scientistSilhouettes = [
  { x: "3%", y: "55%", opacity: 0.03 },
  { x: "92%", y: "75%", opacity: 0.025 },
];

const waveFunctions = [
  { x: "20%", y: "10%", width: 200 },
  { x: "60%", y: "90%", width: 180 },
];

// Floating equations - the missing piece!
const floatingEquations = [
  { text: "∇²ψ + (2m/ℏ²)(E-V)ψ = 0", x: "5%", y: "8%", size: 10 },
  { text: "F = -∇V", x: "78%", y: "12%", size: 9 },
  { text: "∮ B·dl = μ₀I", x: "62%", y: "42%", size: 8 },
  { text: "S = k_B ln Ω", x: "12%", y: "65%", size: 9 },
  { text: "∂²u/∂t² = c²∇²u", x: "82%", y: "82%", size: 8 },
  { text: "ΔxΔp ≥ ℏ/2", x: "25%", y: "35%", size: 10 },
  { text: "Ĥ|ψ⟩ = E|ψ⟩", x: "70%", y: "25%", size: 11 },
  { text: "ρ = |ψ|²", x: "42%", y: "58%", size: 9 },
  { text: "∇×E = -∂B/∂t", x: "88%", y: "50%", size: 8 },
  { text: "L = T - V", x: "15%", y: "88%", size: 10 },
  { text: "dS/dt ≥ 0", x: "55%", y: "15%", size: 8 },
  { text: "⟨ψ|φ⟩ = δₙₘ", x: "35%", y: "75%", size: 9 },
];

// Crystal/lattice structures
const crystalStructures = [
  { x: "10%", y: "18%", size: 80 },
  { x: "85%", y: "40%", size: 60 },
  { x: "45%", y: "92%", size: 50 },
];

// Feynman-style diagram paths
const feynmanDiagrams = [
  { x: "65%", y: "5%", size: 80 },
  { x: "8%", y: "78%", size: 70 },
];

const ScienceBackground = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const parallaxLayers = [y1, y2, y3];

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 overflow-hidden z-0">

      {/* ═══ Floating Equations ═══ */}
      {floatingEquations.map((eq, i) => (
        <motion.div
          key={`eq-${i}`}
          className="absolute font-mono select-none text-primary/[0.05]"
          style={{
            left: eq.x,
            top: eq.y,
            fontSize: eq.size,
            y: parallaxLayers[i % 3],
          }}
          animate={{
            y: [0, -12 - (i % 4) * 5, 0, 8 + (i % 3) * 4, 0],
            opacity: [0.03, 0.07, 0.03],
            rotate: [0, (i % 2 === 0 ? 3 : -3), 0],
          }}
          transition={{
            duration: 12 + (i % 5) * 3,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {eq.text}
        </motion.div>
      ))}

      {/* ═══ Crystal Lattice Structures ═══ */}
      {crystalStructures.map((crystal, i) => (
        <motion.svg
          key={`crystal-${i}`}
          className="absolute"
          style={{ left: crystal.x, top: crystal.y, y: parallaxLayers[(i + 1) % 3] }}
          width={crystal.size}
          height={crystal.size}
          viewBox={`0 0 ${crystal.size} ${crystal.size}`}
          opacity={0.04}
        >
          {/* Lattice nodes */}
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => {
              const cx = 10 + col * ((crystal.size - 20) / 3);
              const cy = 10 + row * ((crystal.size - 20) / 3);
              return (
                <g key={`${row}-${col}`}>
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={2.5}
                    fill="hsl(195 100% 50%)"
                    animate={{ r: [2, 3, 2], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, delay: (row + col) * 0.3, repeat: Infinity }}
                  />
                  {/* Bonds to right */}
                  {col < 3 && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + (crystal.size - 20) / 3}
                      y2={cy}
                      stroke="hsl(195 100% 50%)"
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                  )}
                  {/* Bonds down */}
                  {row < 3 && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx}
                      y2={cy + (crystal.size - 20) / 3}
                      stroke="hsl(195 100% 50%)"
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                  )}
                  {/* Diagonal bonds for 3D effect */}
                  {col < 3 && row < 3 && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + (crystal.size - 20) / 3}
                      y2={cy + (crystal.size - 20) / 3}
                      stroke="hsl(210 100% 56%)"
                      strokeWidth={0.3}
                      opacity={0.3}
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })
          )}
        </motion.svg>
      ))}

      {/* ═══ Feynman-style Diagrams ═══ */}
      {feynmanDiagrams.map((fd, i) => (
        <motion.svg
          key={`feynman-${i}`}
          className="absolute"
          style={{ left: fd.x, top: fd.y, y: parallaxLayers[i % 3] }}
          width={fd.size}
          height={fd.size}
          viewBox={`0 0 ${fd.size} ${fd.size}`}
          opacity={0.04}
        >
          {/* Incoming lines */}
          <line x1={0} y1={0} x2={fd.size / 2} y2={fd.size / 2} stroke="hsl(195 100% 50%)" strokeWidth={1} />
          <line x1={0} y1={fd.size} x2={fd.size / 2} y2={fd.size / 2} stroke="hsl(195 100% 50%)" strokeWidth={1} />
          {/* Outgoing lines */}
          <line x1={fd.size / 2} y1={fd.size / 2} x2={fd.size} y2={0} stroke="hsl(195 100% 50%)" strokeWidth={1} />
          <line x1={fd.size / 2} y1={fd.size / 2} x2={fd.size} y2={fd.size} stroke="hsl(195 100% 50%)" strokeWidth={1} />
          {/* Vertex */}
          <motion.circle
            cx={fd.size / 2}
            cy={fd.size / 2}
            r={3}
            fill="hsl(195 100% 50%)"
            animate={{ r: [3, 5, 3], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Wavy propagator (photon line) */}
          <motion.path
            d={`M${fd.size / 2},${fd.size / 2} ${Array.from({ length: 8 }).map((_, j) => {
              const t = j / 7;
              const px = fd.size / 2 + t * (fd.size / 2 - 5);
              const py = fd.size / 2 + Math.sin(j * 2.5) * 6;
              return `L${px},${py}`;
            }).join(" ")}`}
            stroke="hsl(210 100% 56%)"
            strokeWidth={0.8}
            fill="none"
            strokeDasharray="3 2"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          {/* Label */}
          <text x={fd.size / 2 + 8} y={fd.size / 2 - 8} fill="hsl(195 100% 50%)" fontSize={5} opacity={0.6} fontFamily="'JetBrains Mono', monospace">
            {i === 0 ? "γ" : "g"}
          </text>
        </motion.svg>
      ))}

      {/* ═══ Atom structures with orbiting electrons ═══ */}
      {atomStructures.map((atom, i) => (
        <motion.div
          key={`atom-${i}`}
          className="absolute"
          style={{ left: atom.cx, top: atom.cy, y: parallaxLayers[i % 3] }}
        >
          <motion.div
            className="absolute rounded-full bg-primary/[0.06]"
            style={{
              width: 8,
              height: 8,
              left: atom.size / 2 - 4,
              top: atom.size / 2 - 4,
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {Array.from({ length: atom.electrons }).map((_, j) => (
            <motion.div
              key={j}
              className="absolute border border-primary/[0.04] rounded-full"
              style={{
                width: atom.size * (0.5 + j * 0.25),
                height: atom.size * (0.5 + j * 0.25) * 0.6,
                left: (atom.size - atom.size * (0.5 + j * 0.25)) / 2,
                top: (atom.size - atom.size * (0.5 + j * 0.25) * 0.6) / 2,
                transform: `rotate(${j * 60}deg)`,
              }}
              animate={{ rotate: [j * 60, j * 60 + 360] }}
              transition={{ duration: 15 + j * 5, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-primary/15"
                style={{ top: -4, left: "50%", marginLeft: -4 }}
                animate={{ scale: [0.8, 1.3, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.5 }}
              />
            </motion.div>
          ))}
        </motion.div>
      ))}

      {/* ═══ Energy level diagrams ═══ */}
      {energyLevels.map((el, i) => (
        <motion.svg
          key={`energy-${i}`}
          className="absolute"
          style={{ left: el.x, top: el.y, y: parallaxLayers[(i + 1) % 3] }}
          width={el.width}
          height={el.levels * 20 + 20}
          viewBox={`0 0 ${el.width} ${el.levels * 20 + 20}`}
        >
          {Array.from({ length: el.levels }).map((_, j) => (
            <g key={j}>
              <motion.line
                x1={10}
                y1={j * 20 + 10}
                x2={el.width - 10}
                y2={j * 20 + 10}
                stroke="hsl(195 100% 50%)"
                strokeWidth={1}
                opacity={0.06 - j * 0.008}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: j * 0.3 + i * 1.5 }}
              />
              {j < el.levels - 1 && (
                <motion.line
                  x1={el.width / 2}
                  y1={j * 20 + 12}
                  x2={el.width / 2}
                  y2={(j + 1) * 20 + 8}
                  stroke="hsl(195 100% 50%)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                  opacity={0.04}
                  animate={{ opacity: [0.02, 0.06, 0.02] }}
                  transition={{ duration: 3, delay: j * 0.5, repeat: Infinity }}
                />
              )}
              {/* Photon emission arrow */}
              {j < el.levels - 1 && j % 2 === 0 && (
                <motion.path
                  d={`M${el.width / 2 + 10},${j * 20 + 14} Q${el.width / 2 + 20},${j * 20 + 20} ${el.width / 2 + 10},${(j + 1) * 20 + 6}`}
                  stroke="hsl(210 100% 56%)"
                  strokeWidth={0.5}
                  fill="none"
                  opacity={0.05}
                  animate={{ opacity: [0.02, 0.08, 0.02] }}
                  transition={{ duration: 4, delay: j * 0.8, repeat: Infinity }}
                />
              )}
              <text
                x={el.width - 6}
                y={j * 20 + 14}
                fill="hsl(195 100% 50%)"
                fontSize={6}
                opacity={0.05}
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace"
              >
                E{el.levels - j}
              </text>
            </g>
          ))}
        </motion.svg>
      ))}

      {/* ═══ Scientist silhouettes ═══ */}
      {scientistSilhouettes.map((s, i) => (
        <motion.svg
          key={`scientist-${i}`}
          className="absolute"
          style={{ left: s.x, top: s.y, y: parallaxLayers[i % 3] }}
          width="80"
          height="100"
          viewBox="0 0 80 100"
          opacity={s.opacity}
        >
          <path
            d={
              i === 0
                ? "M40,10 C55,10 65,25 65,40 C65,50 60,55 55,60 C50,65 45,65 45,75 L35,75 C35,65 30,65 25,60 C20,55 15,50 15,40 C15,25 25,10 40,10 Z M30,80 L50,80 L50,90 L30,90 Z"
                : "M35,10 C50,10 60,22 62,35 C64,48 55,55 50,60 L45,75 L30,75 L28,60 C22,55 15,45 18,32 C21,19 28,10 35,10 Z M28,80 L48,80 L48,90 L28,90 Z"
            }
            fill="hsl(195 100% 50%)"
            opacity={1}
          />
          <motion.text
            x={i === 0 ? 60 : 10}
            y={8}
            fill="hsl(195 100% 50%)"
            fontSize={6}
            fontFamily="'JetBrains Mono', monospace"
            opacity={0.8}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {i === 0 ? "E=mc²" : "ℏ"}
          </motion.text>
        </motion.svg>
      ))}

      {/* ═══ Probability wavefunction curves ═══ */}
      {waveFunctions.map((wf, i) => (
        <motion.svg
          key={`wf-${i}`}
          className="absolute"
          style={{ left: wf.x, top: wf.y, y: parallaxLayers[(i + 2) % 3] }}
          width={wf.width}
          height="60"
          viewBox={`0 0 ${wf.width} 60`}
        >
          <motion.path
            d={`M0,30 ${Array.from({ length: 10 }).map((_, j) => {
              const x = (j + 1) * (wf.width / 10);
              const y = 30 + Math.sin(j * 0.8) * 15 * Math.exp(-((j - 5) ** 2) / 8);
              return `L${x},${y}`;
            }).join(" ")}`}
            stroke="hsl(210 100% 56%)"
            strokeWidth={1}
            fill="none"
            opacity={0.05}
            animate={{ opacity: [0.03, 0.07, 0.03] }}
            transition={{ duration: 6, repeat: Infinity, delay: i * 2 }}
          />
        </motion.svg>
      ))}

      {/* ═══ Quantum particles ═══ */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-primary/[0.04]"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${(i * 3.37) % 95}%`,
            top: `${(i * 7.13) % 95}%`,
          }}
          animate={{
            y: [0, -20 - (i % 5) * 8, 0],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 8 + (i % 6) * 2,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ═══ Double-slit interference ═══ */}
      <motion.svg
        className="absolute"
        style={{ left: "40%", top: "50%", y: y2 }}
        width="160"
        height="80"
        viewBox="0 0 160 80"
        opacity={0.03}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.rect
            key={i}
            x={i * 11}
            y={0}
            width={6}
            height={80}
            fill="hsl(195 100% 50%)"
            opacity={Math.exp(-((i - 7) ** 2) / 8)}
            animate={{ opacity: [Math.exp(-((i - 7) ** 2) / 8) * 0.5, Math.exp(-((i - 7) ** 2) / 8), Math.exp(-((i - 7) ** 2) / 8) * 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        ))}
      </motion.svg>

      {/* ═══ Hexagonal molecular structure ═══ */}
      <motion.svg
        className="absolute"
        style={{ left: "72%", top: "68%", y: y3 }}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        opacity={0.035}
      >
        {/* Benzene ring */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 - 30) * Math.PI / 180;
          const nextAngle = ((i + 1) * 60 - 30) * Math.PI / 180;
          const cx = 50 + 30 * Math.cos(angle);
          const cy = 50 + 30 * Math.sin(angle);
          const nx = 50 + 30 * Math.cos(nextAngle);
          const ny = 50 + 30 * Math.sin(nextAngle);
          return (
            <g key={i}>
              <motion.circle
                cx={cx} cy={cy} r={2}
                fill="hsl(195 100% 50%)"
                animate={{ r: [1.5, 2.5, 1.5] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(195 100% 50%)" strokeWidth={0.7} />
            </g>
          );
        })}
        {/* Inner circle for delocalized electrons */}
        <motion.circle
          cx={50} cy={50} r={18}
          fill="none"
          stroke="hsl(210 100% 56%)"
          strokeWidth={0.5}
          strokeDasharray="3 3"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.svg>

      {/* ═══ Magnetic field lines ═══ */}
      <motion.svg
        className="absolute"
        style={{ left: "25%", top: "52%", y: y1 }}
        width="120"
        height="80"
        viewBox="0 0 120 80"
        opacity={0.03}
      >
        {[20, 30, 40].map((r, i) => (
          <motion.ellipse
            key={i}
            cx={60}
            cy={40}
            rx={r}
            ry={r * 0.5}
            fill="none"
            stroke="hsl(195 100% 50%)"
            strokeWidth={0.5}
            strokeDasharray="4 3"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 5, delay: i * 1.5, repeat: Infinity }}
          />
        ))}
        {/* Arrow indicators */}
        <motion.polygon
          points="90,40 85,37 85,43"
          fill="hsl(195 100% 50%)"
          opacity={0.5}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
};

export default ScienceBackground;
