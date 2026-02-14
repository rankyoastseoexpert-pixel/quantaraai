import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const atomStructures = [
  { cx: "15%", cy: "25%", size: 120, electrons: 3 },
  { cx: "80%", cy: "60%", size: 90, electrons: 2 },
  { cx: "50%", cy: "85%", size: 70, electrons: 2 },
  { cx: "88%", cy: "15%", size: 60, electrons: 1 },
];

const energyLevels = [
  { x: "8%", y: "40%", width: 100, levels: 5 },
  { x: "75%", y: "35%", width: 80, levels: 4 },
];

const scientistSilhouettes = [
  // Einstein-like profile
  { x: "3%", y: "55%", opacity: 0.03 },
  // Bohr-like profile
  { x: "92%", y: "75%", opacity: 0.025 },
];

const waveFunctions = [
  { x: "20%", y: "10%", width: 200 },
  { x: "60%", y: "90%", width: 180 },
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
      {/* Atom structures with orbiting electrons */}
      {atomStructures.map((atom, i) => (
        <motion.div
          key={`atom-${i}`}
          className="absolute"
          style={{ left: atom.cx, top: atom.cy, y: parallaxLayers[i % 3] }}
        >
          {/* Nucleus */}
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
          {/* Electron orbits */}
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

      {/* Energy level diagrams */}
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
              {/* Transition arrow */}
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
              {/* Energy label */}
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

      {/* Scientist silhouettes (abstract head outlines) */}
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
          {/* Abstract scientist head profile */}
          <path
            d={
              i === 0
                ? "M40,10 C55,10 65,25 65,40 C65,50 60,55 55,60 C50,65 45,65 45,75 L35,75 C35,65 30,65 25,60 C20,55 15,50 15,40 C15,25 25,10 40,10 Z M30,80 L50,80 L50,90 L30,90 Z"
                : "M35,10 C50,10 60,22 62,35 C64,48 55,55 50,60 L45,75 L30,75 L28,60 C22,55 15,45 18,32 C21,19 28,10 35,10 Z M28,80 L48,80 L48,90 L28,90 Z"
            }
            fill="hsl(195 100% 50%)"
            opacity={1}
          />
          {/* Thought bubble / equation */}
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

      {/* Probability wavefunction curves */}
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

      {/* Scattered dots (quantum particles) */}
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

      {/* Double-slit interference pattern hint */}
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
    </div>
  );
};

export default ScienceBackground;
