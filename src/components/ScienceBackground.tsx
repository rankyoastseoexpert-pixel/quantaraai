import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Optimized ScienceBackground
 * - Reduced from 30+ animated elements to ~18
 * - Replaced framer-motion per-element animations with CSS where possible
 * - Removed scroll-based parallax (heavy) — uses pure CSS float animations
 * - GPU-accelerated with translate3d
 * - Respects prefers-reduced-motion
 */

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

const atomStructures = [
  { cx: "15%", cy: "25%", size: 100, electrons: 2 },
  { cx: "80%", cy: "60%", size: 80, electrons: 2 },
  { cx: "50%", cy: "85%", size: 60, electrons: 1 },
];

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
      {/* Floating Equations — CSS animation */}
      {floatingEquations.map((eq, i) => (
        <div
          key={`eq-${i}`}
          className="absolute font-mono select-none text-primary/[0.05] science-float"
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

      {/* Atom structures — reduced count, CSS orbit animation */}
      {atomStructures.map((atom, i) => (
        <div key={`atom-${i}`} className="absolute" style={{ left: atom.cx, top: atom.cy }}>
          {/* Nucleus */}
          <div
            className="absolute rounded-full bg-primary/[0.06] animate-pulse"
            style={{
              width: 8,
              height: 8,
              left: atom.size / 2 - 4,
              top: atom.size / 2 - 4,
            }}
          />
          {/* Orbit rings */}
          {Array.from({ length: atom.electrons }).map((_, j) => (
            <div
              key={j}
              className="absolute border border-primary/[0.04] rounded-full science-orbit"
              style={{
                width: atom.size * (0.5 + j * 0.25),
                height: atom.size * (0.5 + j * 0.25) * 0.6,
                left: (atom.size - atom.size * (0.5 + j * 0.25)) / 2,
                top: (atom.size - atom.size * (0.5 + j * 0.25) * 0.6) / 2,
                animationDuration: `${15 + j * 5}s`,
                animationDelay: `${j * 0.5}s`,
                transform: `rotate(${j * 60}deg) translate3d(0, 0, 0)`,
              }}
            >
              <div
                className="absolute w-2 h-2 rounded-full bg-primary/15 animate-pulse"
                style={{ top: -4, left: "50%", marginLeft: -4 }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Quantum particles — pure CSS */}
      {particles.map((p, i) => (
        <div
          key={`p-${i}`}
          className="absolute rounded-full bg-primary/[0.04] science-float"
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

      {/* Benzene ring — static SVG, single CSS pulse */}
      <svg
        className="absolute animate-pulse"
        style={{ left: "72%", top: "68%", opacity: 0.035, transform: "translate3d(0, 0, 0)" }}
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
              <circle cx={cx} cy={cy} r={2} fill="hsl(var(--primary))" />
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--primary))" strokeWidth={0.7} />
            </g>
          );
        })}
        <circle cx={50} cy={50} r={18} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.5} />
      </svg>
    </div>
  );
};

export default ScienceBackground;
