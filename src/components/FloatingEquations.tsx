import { motion } from "framer-motion";

const equations = [
  { text: "iℏ∂ₜΨ = ĤΨ", x: "10%", y: "15%", delay: 0, duration: 8 },
  { text: "Ĥψ = Eψ", x: "75%", y: "20%", delay: 1.5, duration: 10 },
  { text: "∇²u = 0", x: "60%", y: "70%", delay: 3, duration: 9 },
  { text: "ψₙ(x) = √(2/L) sin(nπx/L)", x: "20%", y: "80%", delay: 2, duration: 11 },
  { text: "⟨ψ|Ĥ|ψ⟩", x: "85%", y: "50%", delay: 4, duration: 7 },
  { text: "∂²ψ/∂x²", x: "40%", y: "10%", delay: 1, duration: 12 },
  { text: "Σₙ cₙ|n⟩", x: "5%", y: "50%", delay: 5, duration: 9 },
  { text: "e^{-iHt/ℏ}", x: "50%", y: "40%", delay: 2.5, duration: 10 },
  { text: "[x̂, p̂] = iℏ", x: "30%", y: "60%", delay: 3.5, duration: 8 },
  { text: "ℏω(n+½)", x: "70%", y: "85%", delay: 0.5, duration: 11 },
];

const FloatingEquations = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {equations.map((eq, i) => (
        <motion.span
          key={i}
          className="absolute font-mono text-sm text-primary/20 select-none"
          style={{ left: eq.x, top: eq.y }}
          animate={{
            y: [0, -25, 0, 20, 0],
            opacity: [0.15, 0.35, 0.15, 0.3, 0.15],
            rotate: [0, 3, -2, 1, 0],
          }}
          transition={{
            duration: eq.duration,
            delay: eq.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {eq.text}
        </motion.span>
      ))}
    </div>
  );
};

export default FloatingEquations;
