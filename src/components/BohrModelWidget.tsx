import { motion } from "framer-motion";
import { useState } from "react";

const elements = [
  { symbol: "H", name: "Hydrogen", z: 1, mass: "1.008", electrons: [1], color: "hsl(var(--primary))" },
  { symbol: "He", name: "Helium", z: 2, mass: "4.003", electrons: [2], color: "hsl(195 100% 60%)" },
  { symbol: "Li", name: "Lithium", z: 3, mass: "6.941", electrons: [2, 1], color: "hsl(210 100% 56%)" },
  { symbol: "C", name: "Carbon", z: 6, mass: "12.011", electrons: [2, 4], color: "hsl(195 80% 50%)" },
  { symbol: "O", name: "Oxygen", z: 8, mass: "15.999", electrons: [2, 6], color: "hsl(200 100% 55%)" },
  { symbol: "Fe", name: "Iron", z: 26, mass: "55.845", electrons: [2, 8, 14, 2], color: "hsl(210 80% 50%)" },
];

const BohrModelWidget = () => {
  const [activeIdx, setActiveIdx] = useState(3); // Carbon default
  const el = elements[activeIdx];

  return (
    <motion.div
      className="absolute right-[5%] top-[12%] z-10 hidden lg:block"
      initial={{ opacity: 0, scale: 0.8, x: 40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
    >
      <div className="relative w-[220px] h-[280px] rounded-2xl border border-primary/15 bg-background/40 backdrop-blur-xl p-4 shadow-[0_0_40px_hsl(var(--primary)/0.08)]">
        {/* Element selector pills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {elements.map((e, i) => (
            <button
              key={e.symbol}
              onClick={() => setActiveIdx(i)}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                i === activeIdx
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground/60 hover:text-primary/80 border border-transparent"
              }`}
            >
              {e.symbol}
            </button>
          ))}
        </div>

        {/* Bohr model SVG */}
        <div className="relative flex items-center justify-center h-[150px]">
          <svg width="150" height="150" viewBox="0 0 150 150" className="absolute">
            {/* Orbit rings */}
            {el.electrons.map((_, i) => (
              <motion.circle
                key={`orbit-${i}`}
                cx={75}
                cy={75}
                r={20 + i * 18}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={0.5}
                strokeDasharray="3 3"
                opacity={0.2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              />
            ))}

            {/* Nucleus */}
            <motion.circle
              cx={75}
              cy={75}
              r={6}
              fill="hsl(var(--primary))"
              opacity={0.3}
              animate={{ r: [5, 7, 5], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <circle cx={75} cy={75} r={3} fill="hsl(var(--primary))" opacity={0.6} />

            {/* Electrons */}
            {el.electrons.map((count, shell) =>
              Array.from({ length: count }).map((_, eIdx) => {
                const orbitR = 20 + shell * 18;
                const angleOffset = (eIdx * 360) / count;
                return (
                  <motion.circle
                    key={`e-${shell}-${eIdx}`}
                    cx={75}
                    cy={75}
                    r={2.5}
                    fill={el.color}
                    filter="url(#electronGlow)"
                    animate={{
                      cx: Array.from({ length: 61 }).map((_, f) => {
                        const a = ((f * 6 + angleOffset) * Math.PI) / 180;
                        return 75 + orbitR * Math.cos(a);
                      }),
                      cy: Array.from({ length: 61 }).map((_, f) => {
                        const a = ((f * 6 + angleOffset) * Math.PI) / 180;
                        return 75 + orbitR * Math.sin(a);
                      }),
                    }}
                    transition={{
                      duration: 3 + shell * 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                );
              })
            )}

            <defs>
              <filter id="electronGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Element info */}
        <motion.div
          key={el.symbol}
          className="text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-primary font-mono">{el.symbol}</span>
            <span className="text-[10px] text-muted-foreground">{el.z}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{el.name} · {el.mass} u</p>
          <p className="text-[8px] text-primary/50 font-mono mt-0.5">
            [{el.electrons.join(", ")}]
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BohrModelWidget;
