import { motion } from "framer-motion";

interface BohrModelWidgetProps {
  element?: { symbol: string; z: number; electrons: number[]; color?: string };
  className?: string;
  size?: number;
  opacity?: number;
  delay?: number;
}

const defaultElement = { symbol: "C", z: 6, electrons: [2, 4], color: "hsl(var(--primary))" };

const BohrModelWidget = ({
  element = defaultElement,
  className = "absolute right-[5%] top-[12%]",
  size = 140,
  opacity = 0.06,
  delay = 0,
}: BohrModelWidgetProps) => {
  const el = element;
  const center = size / 2;
  const shellGap = size * 0.12;
  const innerR = size * 0.13;

  return (
    <motion.div
      className={`pointer-events-none z-0 hidden md:block ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.5, duration: 1.2, type: "spring" }}
      style={{ opacity }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Orbit rings */}
        {el.electrons.map((_, i) => (
          <motion.circle
            key={`orbit-${i}`}
            cx={center}
            cy={center}
            r={innerR + i * shellGap}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={0.6}
            strokeDasharray="4 4"
            opacity={0.4}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ delay: delay + i * 0.15, duration: 0.6 }}
          />
        ))}

        {/* Nucleus glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={size * 0.05}
          fill="hsl(var(--primary))"
          opacity={0.5}
          animate={{ r: [size * 0.04, size * 0.06, size * 0.04], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <circle cx={center} cy={center} r={size * 0.025} fill="hsl(var(--primary))" opacity={0.8} />

        {/* Electrons */}
        {el.electrons.map((count, shell) =>
          Array.from({ length: Math.min(count, 6) }).map((_, eIdx) => {
            const orbitR = innerR + shell * shellGap;
            const angleOffset = (eIdx * 360) / count;
            return (
              <motion.circle
                key={`e-${shell}-${eIdx}`}
                r={size * 0.018}
                fill={el.color || "hsl(var(--primary))"}
                animate={{
                  cx: Array.from({ length: 61 }).map((_, f) => {
                    const a = ((f * 6 + angleOffset) * Math.PI) / 180;
                    return center + orbitR * Math.cos(a);
                  }),
                  cy: Array.from({ length: 61 }).map((_, f) => {
                    const a = ((f * 6 + angleOffset) * Math.PI) / 180;
                    return center + orbitR * Math.sin(a);
                  }),
                }}
                transition={{
                  duration: 4 + shell * 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            );
          })
        )}

        {/* Element label */}
        <text
          x={center}
          y={size - 6}
          textAnchor="middle"
          fill="hsl(var(--primary))"
          fontSize={size * 0.08}
          fontFamily="'JetBrains Mono', monospace"
          opacity={0.6}
        >
          {el.symbol} ({el.z})
        </text>
      </svg>
    </motion.div>
  );
};

export default BohrModelWidget;
