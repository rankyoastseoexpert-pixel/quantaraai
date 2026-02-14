import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlassCard from "@/components/GlassCard";

interface Element {
  z: number;
  symbol: string;
  name: string;
  mass: string;
  cat: string;
  config: string;
  shells: number[];
  quantumNumbers: string;
  row: number;
  col: number;
}

const elements: Element[] = [
  { z: 1, symbol: "H", name: "Hydrogen", mass: "1.008", cat: "nonmetal", config: "1s¹", shells: [1], quantumNumbers: "n=1, l=0, ml=0, ms=+½", row: 1, col: 1 },
  { z: 2, symbol: "He", name: "Helium", mass: "4.003", cat: "noble-gas", config: "1s²", shells: [2], quantumNumbers: "n=1, l=0, ml=0, ms=-½", row: 1, col: 18 },
  { z: 3, symbol: "Li", name: "Lithium", mass: "6.941", cat: "alkali", config: "[He] 2s¹", shells: [2, 1], quantumNumbers: "n=2, l=0, ml=0, ms=+½", row: 2, col: 1 },
  { z: 4, symbol: "Be", name: "Beryllium", mass: "9.012", cat: "alkaline", config: "[He] 2s²", shells: [2, 2], quantumNumbers: "n=2, l=0, ml=0, ms=-½", row: 2, col: 2 },
  { z: 5, symbol: "B", name: "Boron", mass: "10.81", cat: "metalloid", config: "[He] 2s²2p¹", shells: [2, 3], quantumNumbers: "n=2, l=1, ml=-1, ms=+½", row: 2, col: 13 },
  { z: 6, symbol: "C", name: "Carbon", mass: "12.01", cat: "nonmetal", config: "[He] 2s²2p²", shells: [2, 4], quantumNumbers: "n=2, l=1, ml=0, ms=+½", row: 2, col: 14 },
  { z: 7, symbol: "N", name: "Nitrogen", mass: "14.01", cat: "nonmetal", config: "[He] 2s²2p³", shells: [2, 5], quantumNumbers: "n=2, l=1, ml=1, ms=+½", row: 2, col: 15 },
  { z: 8, symbol: "O", name: "Oxygen", mass: "16.00", cat: "nonmetal", config: "[He] 2s²2p⁴", shells: [2, 6], quantumNumbers: "n=2, l=1, ml=-1, ms=-½", row: 2, col: 16 },
  { z: 9, symbol: "F", name: "Fluorine", mass: "19.00", cat: "halogen", config: "[He] 2s²2p⁵", shells: [2, 7], quantumNumbers: "n=2, l=1, ml=0, ms=-½", row: 2, col: 17 },
  { z: 10, symbol: "Ne", name: "Neon", mass: "20.18", cat: "noble-gas", config: "[He] 2s²2p⁶", shells: [2, 8], quantumNumbers: "n=2, l=1, ml=1, ms=-½", row: 2, col: 18 },
  { z: 11, symbol: "Na", name: "Sodium", mass: "22.99", cat: "alkali", config: "[Ne] 3s¹", shells: [2, 8, 1], quantumNumbers: "n=3, l=0, ml=0, ms=+½", row: 3, col: 1 },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: "24.31", cat: "alkaline", config: "[Ne] 3s²", shells: [2, 8, 2], quantumNumbers: "n=3, l=0, ml=0, ms=-½", row: 3, col: 2 },
  { z: 13, symbol: "Al", name: "Aluminium", mass: "26.98", cat: "post-transition", config: "[Ne] 3s²3p¹", shells: [2, 8, 3], quantumNumbers: "n=3, l=1, ml=-1, ms=+½", row: 3, col: 13 },
  { z: 14, symbol: "Si", name: "Silicon", mass: "28.09", cat: "metalloid", config: "[Ne] 3s²3p²", shells: [2, 8, 4], quantumNumbers: "n=3, l=1, ml=0, ms=+½", row: 3, col: 14 },
  { z: 15, symbol: "P", name: "Phosphorus", mass: "30.97", cat: "nonmetal", config: "[Ne] 3s²3p³", shells: [2, 8, 5], quantumNumbers: "n=3, l=1, ml=1, ms=+½", row: 3, col: 15 },
  { z: 16, symbol: "S", name: "Sulfur", mass: "32.07", cat: "nonmetal", config: "[Ne] 3s²3p⁴", shells: [2, 8, 6], quantumNumbers: "n=3, l=1, ml=-1, ms=-½", row: 3, col: 16 },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: "35.45", cat: "halogen", config: "[Ne] 3s²3p⁵", shells: [2, 8, 7], quantumNumbers: "n=3, l=1, ml=0, ms=-½", row: 3, col: 17 },
  { z: 18, symbol: "Ar", name: "Argon", mass: "39.95", cat: "noble-gas", config: "[Ne] 3s²3p⁶", shells: [2, 8, 8], quantumNumbers: "n=3, l=1, ml=1, ms=-½", row: 3, col: 18 },
  { z: 19, symbol: "K", name: "Potassium", mass: "39.10", cat: "alkali", config: "[Ar] 4s¹", shells: [2, 8, 8, 1], quantumNumbers: "n=4, l=0, ml=0, ms=+½", row: 4, col: 1 },
  { z: 20, symbol: "Ca", name: "Calcium", mass: "40.08", cat: "alkaline", config: "[Ar] 4s²", shells: [2, 8, 8, 2], quantumNumbers: "n=4, l=0, ml=0, ms=-½", row: 4, col: 2 },
  { z: 26, symbol: "Fe", name: "Iron", mass: "55.85", cat: "transition", config: "[Ar] 3d⁶4s²", shells: [2, 8, 14, 2], quantumNumbers: "n=3, l=2, ml=2, ms=-½", row: 4, col: 8 },
  { z: 29, symbol: "Cu", name: "Copper", mass: "63.55", cat: "transition", config: "[Ar] 3d¹⁰4s¹", shells: [2, 8, 18, 1], quantumNumbers: "n=3, l=2, ml=2, ms=-½", row: 4, col: 11 },
  { z: 30, symbol: "Zn", name: "Zinc", mass: "65.38", cat: "transition", config: "[Ar] 3d¹⁰4s²", shells: [2, 8, 18, 2], quantumNumbers: "n=3, l=2, ml=2, ms=-½", row: 4, col: 12 },
  { z: 35, symbol: "Br", name: "Bromine", mass: "79.90", cat: "halogen", config: "[Ar] 3d¹⁰4s²4p⁵", shells: [2, 8, 18, 7], quantumNumbers: "n=4, l=1, ml=0, ms=-½", row: 4, col: 17 },
  { z: 36, symbol: "Kr", name: "Krypton", mass: "83.80", cat: "noble-gas", config: "[Ar] 3d¹⁰4s²4p⁶", shells: [2, 8, 18, 8], quantumNumbers: "n=4, l=1, ml=1, ms=-½", row: 4, col: 18 },
  { z: 47, symbol: "Ag", name: "Silver", mass: "107.87", cat: "transition", config: "[Kr] 4d¹⁰5s¹", shells: [2, 8, 18, 18, 1], quantumNumbers: "n=4, l=2, ml=2, ms=-½", row: 5, col: 11 },
  { z: 79, symbol: "Au", name: "Gold", mass: "196.97", cat: "transition", config: "[Xe] 4f¹⁴5d¹⁰6s¹", shells: [2, 8, 18, 32, 18, 1], quantumNumbers: "n=5, l=2, ml=2, ms=-½", row: 6, col: 11 },
  { z: 92, symbol: "U", name: "Uranium", mass: "238.03", cat: "actinide", config: "[Rn] 5f³6d¹7s²", shells: [2, 8, 18, 32, 21, 9, 2], quantumNumbers: "n=5, l=3, ml=3, ms=+½", row: 9, col: 6 },
];

const catColorMap: Record<string, { bg: string; border: string; text: string }> = {
  "nonmetal": { bg: "bg-primary/15", border: "border-primary/30", text: "text-primary" },
  "noble-gas": { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400" },
  "alkali": { bg: "bg-destructive/15", border: "border-destructive/30", text: "text-destructive" },
  "alkaline": { bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-400" },
  "metalloid": { bg: "bg-teal-500/15", border: "border-teal-500/30", text: "text-teal-400" },
  "halogen": { bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-400" },
  "transition": { bg: "bg-accent/15", border: "border-accent/30", text: "text-accent" },
  "post-transition": { bg: "bg-blue-400/15", border: "border-blue-400/30", text: "text-blue-400" },
  "actinide": { bg: "bg-pink-500/15", border: "border-pink-500/30", text: "text-pink-400" },
};

const ElectronShellDiagram = ({ shells }: { shells: number[] }) => {
  const size = 160;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Nucleus */}
      <circle cx={center} cy={center} r={8} fill="hsl(var(--primary))" opacity={0.6} />
      <circle cx={center} cy={center} r={4} fill="hsl(var(--primary))" />

      {shells.map((count, i) => {
        const r = 18 + i * 14;
        return (
          <g key={i}>
            {/* Orbit ring */}
            <circle cx={center} cy={center} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
            {/* Electrons */}
            {Array.from({ length: Math.min(count, 8) }).map((_, j) => {
              const angle = (j * 360 / Math.min(count, 8)) * Math.PI / 180;
              return (
                <circle
                  key={j}
                  cx={center + r * Math.cos(angle)}
                  cy={center + r * Math.sin(angle)}
                  r={2.5}
                  fill="hsl(var(--primary))"
                  opacity={0.8}
                />
              );
            })}
            {/* Shell label */}
            <text x={center + r + 5} y={center - 2} fill="hsl(var(--primary))" fontSize={7} fontFamily="'JetBrains Mono', monospace" opacity={0.5}>
              {count}e⁻
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const InteractivePeriodicTable = () => {
  const [search, setSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);

  const filtered = useMemo(() => {
    if (!search) return elements;
    const q = search.toLowerCase();
    return elements.filter(
      (e) =>
        e.symbol.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        String(e.z).includes(q) ||
        e.cat.toLowerCase().includes(q)
    );
  }, [search]);

  const handleElementClick = (el: Element) => {
    setSelectedElement(el);
    setIsOpen(true);
  };

  return (
    <section className="relative py-24">
      <div className="container px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Interactive <span className="text-gradient">Periodic Table</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            Explore atomic structures, electron configurations, and quantum numbers.
          </p>

          {/* Search */}
          <div className="relative max-w-xs mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search element, symbol, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-[10px]">
            {Object.entries(catColorMap).map(([cat, colors]) => (
              <span key={cat} className={`px-2 py-0.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text} capitalize`}>
                {cat.replace("-", " ")}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Hover info */}
        <AnimatePresence>
          {hoveredElement && (
            <motion.div
              className="fixed top-4 right-4 z-50 hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              <GlassCard className="p-4 w-56">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-primary font-mono">{hoveredElement.symbol}</span>
                  <span className="text-xs text-muted-foreground">{hoveredElement.z}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{hoveredElement.name}</p>
                <p className="text-[10px] text-muted-foreground">{hoveredElement.mass} u · {hoveredElement.cat.replace("-", " ")}</p>
                <p className="text-[10px] text-primary/70 font-mono mt-1">{hoveredElement.config}</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elements grid */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.015 } } }}
        >
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 lg:grid-cols-18 gap-1">
            {filtered.map((el) => {
              const colors = catColorMap[el.cat] || catColorMap.nonmetal;
              return (
                <motion.button
                  key={el.symbol}
                  onClick={() => handleElementClick(el)}
                  onMouseEnter={() => setHoveredElement(el)}
                  onMouseLeave={() => setHoveredElement(null)}
                  className={`relative aspect-square rounded-lg border ${colors.bg} ${colors.border} flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] cursor-pointer group`}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-[7px] sm:text-[8px] text-muted-foreground/60 leading-none">{el.z}</span>
                  <span className={`text-[11px] sm:text-sm font-bold font-mono leading-tight ${colors.text}`}>{el.symbol}</span>
                  <span className="text-[6px] text-muted-foreground/50 leading-none hidden sm:block">{el.mass}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Element detail modal */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md bg-card border-border/50">
            {selectedElement && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-primary font-mono">{selectedElement.symbol}</span>
                    <span className="text-lg text-foreground">{selectedElement.name}</span>
                    <span className="text-sm text-muted-foreground">Z = {selectedElement.z}</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Basic info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atomic Mass</p>
                      <p className="font-mono text-foreground">{selectedElement.mass} u</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</p>
                      <p className={`capitalize ${catColorMap[selectedElement.cat]?.text || "text-foreground"}`}>
                        {selectedElement.cat.replace("-", " ")}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Electron Configuration</p>
                      <p className="font-mono text-primary text-sm">{selectedElement.config}</p>
                    </div>
                  </div>

                  {/* Electron shell diagram */}
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Electron Shell Diagram</p>
                    <ElectronShellDiagram shells={selectedElement.shells} />
                    <p className="text-center text-[10px] text-muted-foreground mt-2 font-mono">
                      [{selectedElement.shells.join(", ")}]
                    </p>
                  </div>

                  {/* Quantum numbers */}
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Example Quantum Numbers (last electron)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedElement.quantumNumbers.split(", ").map((qn) => {
                        const [label, value] = qn.split("=");
                        return (
                          <div key={label} className="text-center rounded-lg border border-primary/20 bg-primary/5 p-2">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm font-bold text-primary font-mono">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default InteractivePeriodicTable;
