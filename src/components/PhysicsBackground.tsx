import { motion } from "framer-motion";

const symbols = [
  { text: "∂²/∂x²", x: "8%", y: "12%", size: "text-lg" },
  { text: "∇²", x: "82%", y: "8%", size: "text-2xl" },
  { text: "∫∫", x: "70%", y: "75%", size: "text-xl" },
  { text: "Σ", x: "15%", y: "70%", size: "text-3xl" },
  { text: "∂ψ/∂t", x: "90%", y: "40%", size: "text-sm" },
  { text: "λ", x: "45%", y: "5%", size: "text-2xl" },
  { text: "∮", x: "5%", y: "45%", size: "text-2xl" },
  { text: "ℏ", x: "55%", y: "85%", size: "text-xl" },
  { text: "θ", x: "30%", y: "90%", size: "text-lg" },
  { text: "∞", x: "78%", y: "55%", size: "text-2xl" },
  { text: "dx/dt", x: "25%", y: "25%", size: "text-sm" },
  { text: "ε₀", x: "60%", y: "30%", size: "text-lg" },
  { text: "μ₀", x: "40%", y: "60%", size: "text-lg" },
  { text: "π", x: "88%", y: "20%", size: "text-2xl" },
  { text: "Δ", x: "50%", y: "45%", size: "text-xl" },
  { text: "≈", x: "18%", y: "55%", size: "text-lg" },
  { text: "√", x: "72%", y: "15%", size: "text-xl" },
  { text: "⟨ψ|", x: "35%", y: "78%", size: "text-sm" },
];

const orbits = [
  { cx: "20%", cy: "30%", r: 60 },
  { cx: "75%", cy: "65%", r: 45 },
  { cx: "50%", cy: "15%", r: 35 },
];

const PhysicsBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Floating symbols */}
      {symbols.map((s, i) => (
        <motion.span
          key={i}
          className={`absolute font-mono ${s.size} text-primary/[0.06] select-none`}
          style={{ left: s.x, top: s.y }}
          animate={{
            y: [0, -15 - (i % 3) * 8, 0, 10 + (i % 4) * 5, 0],
            x: [0, (i % 2 === 0 ? 8 : -8), 0],
            opacity: [0.04, 0.1, 0.04],
            rotate: [0, (i % 2 === 0 ? 5 : -5), 0],
          }}
          transition={{
            duration: 10 + (i % 5) * 2,
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {s.text}
        </motion.span>
      ))}

      {/* Orbit circles */}
      {orbits.map((o, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute rounded-full border border-primary/[0.04]"
          style={{
            left: o.cx,
            top: o.cy,
            width: o.r * 2,
            height: o.r * 2,
            marginLeft: -o.r,
            marginTop: -o.r,
          }}
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-primary/10"
            style={{ top: -4, left: "50%", marginLeft: -4 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          left: "10%",
          top: "20%",
          background: "radial-gradient(circle, hsl(210 100% 55% / 0.03) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          right: "15%",
          bottom: "25%",
          background: "radial-gradient(circle, hsl(200 100% 60% / 0.04) 0%, transparent 70%)",
        }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid lines with glow */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <defs>
          <pattern id="physics-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="hsl(210 100% 55%)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#physics-grid)" />
      </svg>
    </div>
  );
};

export default PhysicsBackground;
