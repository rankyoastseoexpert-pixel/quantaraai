import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const elements = [
  { symbol: "H", z: 1, mass: "1.008", cat: "nonmetal", config: "1s¹" },
  { symbol: "He", z: 2, mass: "4.003", cat: "noble gas", config: "1s²" },
  { symbol: "Li", z: 3, mass: "6.941", cat: "alkali metal", config: "[He] 2s¹" },
  { symbol: "Be", z: 4, mass: "9.012", cat: "alkaline earth", config: "[He] 2s²" },
  { symbol: "B", z: 5, mass: "10.81", cat: "metalloid", config: "[He] 2s²2p¹" },
  { symbol: "C", z: 6, mass: "12.01", cat: "nonmetal", config: "[He] 2s²2p²" },
  { symbol: "N", z: 7, mass: "14.01", cat: "nonmetal", config: "[He] 2s²2p³" },
  { symbol: "O", z: 8, mass: "16.00", cat: "nonmetal", config: "[He] 2s²2p⁴" },
  { symbol: "F", z: 9, mass: "19.00", cat: "halogen", config: "[He] 2s²2p⁵" },
  { symbol: "Ne", z: 10, mass: "20.18", cat: "noble gas", config: "[He] 2s²2p⁶" },
];

const catColors: Record<string, string> = {
  "nonmetal": "border-primary/40 bg-primary/10",
  "noble gas": "border-purple-400/40 bg-purple-400/10",
  "alkali metal": "border-red-400/40 bg-red-400/10",
  "alkaline earth": "border-orange-400/40 bg-orange-400/10",
  "metalloid": "border-teal-400/40 bg-teal-400/10",
  "halogen": "border-yellow-400/40 bg-yellow-400/10",
};

const PeriodicTableCard = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered !== null ? elements[hovered] : null;

  return (
    <motion.div
      className="absolute left-[3%] top-[18%] z-10 hidden lg:block"
      initial={{ opacity: 0, scale: 0.8, x: -40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 1.4, duration: 0.8, type: "spring" }}
    >
      <div className="w-[200px] rounded-2xl border border-primary/15 bg-background/40 backdrop-blur-xl p-3 shadow-[0_0_40px_hsl(var(--primary)/0.08)]">
        <p className="text-[9px] font-mono text-primary/60 uppercase tracking-widest mb-2 text-center">
          Periodic Table
        </p>

        {/* Mini grid */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          {elements.map((el, i) => (
            <motion.button
              key={el.symbol}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`relative aspect-square rounded-md border text-center flex flex-col items-center justify-center transition-all duration-200 ${
                catColors[el.cat] || "border-primary/20 bg-primary/5"
              } ${hovered === i ? "scale-110 shadow-[0_0_12px_hsl(var(--primary)/0.3)] z-10" : ""}`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-[7px] text-muted-foreground/60 leading-none">{el.z}</span>
              <span className="text-[11px] font-bold text-foreground font-mono leading-tight">{el.symbol}</span>
            </motion.button>
          ))}
        </div>

        {/* Info panel */}
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.symbol}
              className="rounded-lg border border-primary/10 bg-primary/5 p-2 text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-lg font-bold text-primary font-mono">{active.symbol}</span>
              <p className="text-[9px] text-muted-foreground">{active.mass} u · {active.cat}</p>
              <p className="text-[8px] text-primary/60 font-mono">{active.config}</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              className="text-[8px] text-muted-foreground/40 text-center py-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Hover an element
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PeriodicTableCard;
