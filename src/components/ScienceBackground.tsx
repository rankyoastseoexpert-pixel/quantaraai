import { motion } from "framer-motion";
import { useMemo } from "react";

const floatingEquations = [
  { text: "∇²ψ + (2m/ℏ²)(E-V)ψ = 0", x: "5%", y: "8%", size: 10 },
  { text: "∮ B·dl = μ₀I", x: "62%", y: "42%", size: 8 },
  { text: "ΔxΔp ≥ ℏ/2", x: "25%", y: "35%", size: 10 },
  { text: "Ĥ|ψ⟩ = E|ψ⟩", x: "70%", y: "25%", size: 11 },
  { text: "ρ = |ψ|²", x: "42%", y: "58%", size: 9 },
  { text: "∇×E = -∂B/∂t", x: "88%", y: "50%", size: 8 },
  { text: "L = T - V", x: "15%", y: "88%", size: 10 },
  { text: "dS/dt ≥ 0", x: "55%", y: "15%", size: 8 },
];

// More visible atom structures
const atomStructures = [
  { cx: "15%", cy: "25%", size: 120, electrons: 3 },
  { cx: "80%", cy: "60%", size: 100, electrons: 3 },
  { cx: "50%", cy: "85%", size: 75, electrons: 2 },
  { cx: "88%", cy: "18%", size: 85, electrons: 2 },
  { cx: "35%", cy: "70%", size: 65, electrons: 2 },
];

// Crystal lattice node positions for a simple cubic grid
const CrystalLattice = ({ x, y, size, opacity, delay }: { x: string; y: string; size: number; opacity: number; delay: number }) => {
  const cols = 5;
  const rows = 5;
  const spacing = size / (cols - 1);
  const nodes: { cx: number; cy: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({ cx: c * spacing, cy: r * spacing });
    }
  }

  return (
    <motion.svg
      className="absolute hidden md:block"
      style={{ left: x, top: y }}
      width={size + 10}
      height={size + 10}
      viewBox={`-5 -5 ${size + 10} ${size + 10}`}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ delay, duration: 2 }}
    >
      {/* Horizontal bonds */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols - 1 }).map((__, c) => (
          <line
            key={`h-${r}-${c}`}
            x1={c * spacing} y1={r * spacing}
            x2={(c + 1) * spacing} y2={r * spacing}
            stroke="hsl(var(--primary))"
            strokeWidth={0.6}
            opacity={0.5}
          />
        ))
      )}
      {/* Vertical bonds */}
      {Array.from({ length: rows - 1 }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <line
            key={`v-${r}-${c}`}
            x1={c * spacing} y1={r * spacing}
            x2={c * spacing} y2={(r + 1) * spacing}
            stroke="hsl(var(--primary))"
            strokeWidth={0.6}
            opacity={0.5}
          />
        ))
      )}
      {/* Diagonal bonds for 3D feel */}
      {Array.from({ length: rows - 1 }).map((_, r) =>
        Array.from({ length: cols - 1 }).map((__, c) => (
          <line
            key={`d-${r}-${c}`}
            x1={c * spacing} y1={r * spacing}
            x2={(c + 1) * spacing} y2={(r + 1) * spacing}
            stroke="hsl(var(--primary))"
            strokeWidth={0.3}
            opacity={0.2}
            strokeDasharray="2 3"
          />
        ))
      )}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <circle
          key={`n-${i}`}
          cx={n.cx}
          cy={n.cy}
          r={2.5}
          fill="hsl(var(--primary))"
          opacity={0.8}
          className="animate-pulse"
          style={{ animationDelay: `${i * 0.1}s`, animationDuration: "3s" }}
        />
      ))}
    </motion.svg>
  );
};

// Hexagonal crystal (HCP-like)
const HexCrystal = ({ x, y, size, opacity, delay }: { x: string; y: string; size: number; opacity: number; delay: number }) => {
  const R = size / 2;
  const hexPoints = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i * 60 - 30) * Math.PI / 180;
    return { x: R + R * Math.cos(angle), y: R + R * Math.sin(angle) };
  });
  const centerRing = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i * 60 - 30) * Math.PI / 180;
    return { x: R + (R * 0.5) * Math.cos(angle), y: R + (R * 0.5) * Math.sin(angle) };
  });

  return (
    <motion.svg
      className="absolute hidden md:block"
      style={{ left: x, top: y }}
      width={size + 6} height={size + 6}
      viewBox={`-3 -3 ${size + 6} ${size + 6}`}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ delay, duration: 2 }}
    >
      {/* Outer hex edges */}
      {hexPoints.map((p, i) => {
        const next = hexPoints[(i + 1) % 6];
        return <line key={`he-${i}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="hsl(var(--primary))" strokeWidth={0.8} opacity={0.6} />;
      })}
      {/* Spokes to center */}
      {hexPoints.map((p, i) => (
        <line key={`hs-${i}`} x1={p.x} y1={p.y} x2={R} y2={R} stroke="hsl(var(--primary))" strokeWidth={0.4} opacity={0.3} strokeDasharray="2 2" />
      ))}
      {/* Inner ring connections */}
      {centerRing.map((p, i) => {
        const next = centerRing[(i + 1) % 6];
        return <line key={`ic-${i}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="hsl(var(--primary))" strokeWidth={0.5} opacity={0.35} />;
      })}
      {/* Outer nodes */}
      {hexPoints.map((p, i) => (
        <circle key={`hn-${i}`} cx={p.x} cy={p.y} r={2.5} fill="hsl(var(--primary))" opacity={0.9} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s`, animationDuration: "4s" }} />
      ))}
      {/* Inner ring nodes */}
      {centerRing.map((p, i) => (
        <circle key={`in-${i}`} cx={p.x} cy={p.y} r={1.8} fill="hsl(var(--primary))" opacity={0.6} className="animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.3}s`, animationDuration: "3.5s" }} />
      ))}
      {/* Center node */}
      <circle cx={R} cy={R} r={3} fill="hsl(var(--primary))" opacity={1} className="animate-pulse" />
    </motion.svg>
  );
};

const ScienceBackground = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }).map((_, i) => ({
        left: `${(i * 6.7) % 95}%`,
        top: `${(i * 13.3) % 95}%`,
        size: 2 + (i % 3),
        delay: `${i * 0.4}s`,
        duration: `${8 + (i % 4) * 2}s`,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 motion-reduce:hidden">
      {/* Floating Equations */}
      {floatingEquations.map((eq, i) => (
        <div
          key={`eq-${i}`}
          className="absolute font-mono select-none text-primary/[0.07] science-float"
          style={{
            left: eq.x,
            top: eq.y,
            fontSize: eq.size,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${12 + (i % 4) * 3}s`,
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {eq.text}
        </div>
      ))}

      {/* Atom shell structures — more visible */}
      {atomStructures.map((atom, i) => (
        <div key={`atom-${i}`} className="absolute" style={{ left: atom.cx, top: atom.cy }}>
          {/* Nucleus glow */}
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              width: 10,
              height: 10,
              left: atom.size / 2 - 5,
              top: atom.size / 2 - 5,
              background: "hsl(var(--primary) / 0.35)",
              boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
            }}
          />
          {/* Orbit shells — visible but transparent */}
          {Array.from({ length: atom.electrons }).map((_, j) => (
            <div
              key={j}
              className="absolute rounded-full science-orbit"
              style={{
                border: `1px solid hsl(var(--primary) / ${0.18 - j * 0.03})`,
                width: atom.size * (0.45 + j * 0.22),
                height: atom.size * (0.45 + j * 0.22) * 0.58,
                left: (atom.size - atom.size * (0.45 + j * 0.22)) / 2,
                top: (atom.size - atom.size * (0.45 + j * 0.22) * 0.58) / 2,
                animationDuration: `${14 + j * 5}s`,
                animationDelay: `${j * 0.4}s`,
                transform: `rotate(${j * 55}deg) translate3d(0, 0, 0)`,
                boxShadow: `0 0 4px hsl(var(--primary) / 0.1)`,
              }}
            >
              {/* Electron dot */}
              <div
                className="absolute rounded-full animate-pulse"
                style={{
                  width: 4,
                  height: 4,
                  top: -2,
                  left: "50%",
                  marginLeft: -2,
                  background: "hsl(var(--primary) / 0.55)",
                  boxShadow: "0 0 6px hsl(var(--primary) / 0.5)",
                }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Crystal Lattices */}
      <CrystalLattice x="58%" y="5%"  size={80}  opacity={0.18} delay={0.5} />
      <CrystalLattice x="2%"  y="55%" size={70}  opacity={0.15} delay={1.2} />
      <CrystalLattice x="82%" y="72%" size={90}  opacity={0.16} delay={0.8} />

      {/* Hexagonal Crystals */}
      <HexCrystal x="6%"  y="72%" size={70} opacity={0.18} delay={0.6} />
      <HexCrystal x="88%" y="32%" size={60} opacity={0.16} delay={1.0} />
      <HexCrystal x="44%" y="78%" size={50} opacity={0.14} delay={1.5} />

      {/* Quantum particles */}
      {particles.map((p, i) => (
        <div
          key={`p-${i}`}
          className="absolute rounded-full bg-primary/[0.06] science-float"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: "translate3d(0, 0, 0)",
          }}
        />
      ))}

      {/* Benzene ring */}
      <svg
        className="absolute animate-pulse"
        style={{ left: "72%", top: "68%", opacity: 0.07, transform: "translate3d(0, 0, 0)" }}
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 - 30) * Math.PI / 180;
          const nextAngle = ((i + 1) * 60 - 30) * Math.PI / 180;
          const cx = 50 + 30 * Math.cos(angle);
          const cy = 50 + 30 * Math.sin(angle);
          const nx = 50 + 30 * Math.cos(nextAngle);
          const ny = 50 + 30 * Math.sin(nextAngle);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={2.5} fill="hsl(var(--primary))" />
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--primary))" strokeWidth={0.8} />
            </g>
          );
        })}
        <circle cx={50} cy={50} r={18} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.6} strokeDasharray="3 3" opacity={0.6} />
      </svg>
    </div>
  );
};

export default ScienceBackground;
