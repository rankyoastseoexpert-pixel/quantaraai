import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Info, Layers } from "lucide-react";
import type { PotentialType } from "@/lib/quantumSimulator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EnergyLevel {
  n: number;
  energy: number;
  label: string;
  degeneracy?: number;
}

interface Props {
  potential: PotentialType;
  V0: number;
  omega: number;
  width: number;
  currentEnergy: number | null;
  maxLevels?: number;
}

function computeEigenvalues(
  potential: PotentialType,
  V0: number,
  omega: number,
  width: number,
  maxLevels: number
): { levels: EnergyLevel[]; formula: string; description: string } | null {
  switch (potential) {
    case "infinite_well": {
      const L = width || 6;
      const levels: EnergyLevel[] = [];
      for (let n = 1; n <= maxLevels; n++) {
        const E = (n * n * Math.PI * Math.PI) / (2 * L * L); // ℏ=m=1
        levels.push({ n, energy: E, label: `n=${n}` });
      }
      return {
        levels,
        formula: "Eₙ = n²π²ℏ² / (2mL²)",
        description: "Particle in a box with hard walls. Energy grows quadratically with quantum number n.",
      };
    }
    case "harmonic": {
      const w = omega || 1;
      const levels: EnergyLevel[] = [];
      for (let n = 0; n < maxLevels; n++) {
        const E = w * (n + 0.5);
        levels.push({ n, energy: E, label: `n=${n}` });
      }
      return {
        levels,
        formula: "Eₙ = (n + ½)ℏω",
        description: "Equally spaced energy ladder. The ground state has zero-point energy ½ℏω.",
      };
    }
    case "morse": {
      const D = V0 || 5;
      const a = width || 2;
      const w_e = a * Math.sqrt(2 * D); // ℏ=m=1
      const levels: EnergyLevel[] = [];
      for (let n = 0; n < maxLevels; n++) {
        const E_n = w_e * (n + 0.5) - (w_e * (n + 0.5)) ** 2 / (4 * D);
        if (E_n >= 0) break; // only bound states (relative to dissociation)
        levels.push({ n, energy: E_n + D, label: `n=${n}` }); // shift so ground ≈ 0
      }
      if (levels.length === 0) {
        // fallback: at least show a few levels
        for (let n = 0; n < Math.min(maxLevels, 5); n++) {
          const E_n = w_e * (n + 0.5) - (w_e * (n + 0.5)) ** 2 / (4 * D);
          levels.push({ n, energy: E_n + D, label: `n=${n}` });
        }
      }
      return {
        levels,
        formula: "Eₙ = ℏωₑ(n+½) − [ℏωₑ(n+½)]²/(4D)",
        description: "Anharmonic oscillator with finite bound states. Spacing decreases with n.",
      };
    }
    case "double_well": {
      // Approximate: two slightly split harmonic levels
      const w_approx = Math.sqrt(8 * V0) / (separation || 2);
      const tunnel_split = 0.3 * Math.exp(-V0 * 0.5);
      const levels: EnergyLevel[] = [];
      for (let n = 0; n < Math.min(maxLevels, 8); n++) {
        const base = w_approx * (Math.floor(n / 2) + 0.5);
        const split = n % 2 === 0 ? -tunnel_split * (n + 1) : tunnel_split * (n + 1);
        levels.push({
          n,
          energy: base + split,
          label: n % 2 === 0 ? `${Math.floor(n / 2)}⁺` : `${Math.floor(n / 2)}⁻`,
        });
      }
      return {
        levels,
        formula: "Eₙ± ≈ ℏω(n+½) ± Δₙ/2",
        description: "Tunneling splits each level into symmetric (+) and antisymmetric (−) pairs.",
      };
    }
    case "coulomb": {
      const Z = V0 || 5;
      const levels: EnergyLevel[] = [];
      for (let n = 1; n <= maxLevels; n++) {
        const E = -(Z * Z) / (2 * n * n); // hydrogen-like
        levels.push({ n, energy: E, label: `n=${n}`, degeneracy: n });
      }
      return {
        levels,
        formula: "Eₙ = −Z²e⁴m / (2ℏ²n²)",
        description: "Hydrogen-like spectrum. Levels converge toward the ionization threshold E=0.",
      };
    }
    default:
      return null;
  }
}

// Needed for double_well — pull separation from parent via a default
const separation = 2;

const EnergySpectrumPanel = memo(({
  potential,
  V0,
  omega,
  width,
  currentEnergy,
  maxLevels = 12,
}: Props) => {
  const spectrum = useMemo(
    () => computeEigenvalues(potential, V0, omega, width, maxLevels),
    [potential, V0, omega, width, maxLevels]
  );

  if (!spectrum || spectrum.levels.length === 0) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Energy Spectrum
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic">
          No analytical eigenvalues for {potential.replace("_", " ")} potential.
          Try infinite well, harmonic, morse, double well, or coulomb.
        </p>
      </div>
    );
  }

  const { levels, formula, description } = spectrum;
  const minE = Math.min(...levels.map((l) => l.energy));
  const maxE = Math.max(...levels.map((l) => l.energy));
  const range = maxE - minE || 1;

  // Find closest level to current energy
  const closestIdx =
    currentEnergy != null
      ? levels.reduce(
          (best, l, i) =>
            Math.abs(l.energy - currentEnergy!) < Math.abs(levels[best].energy - currentEnergy!)
              ? i
              : best,
          0
        )
      : -1;

  // Color palette for energy levels
  const levelColor = (i: number, total: number) => {
    const hue = 200 + (i / Math.max(total - 1, 1)) * 140; // blue → magenta
    return `hsl(${hue}, 80%, 60%)`;
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
            <Layers size={12} className="text-primary" />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase text-foreground">
            Energy Spectrum
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[220px] text-[10px]">
            {description}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Formula */}
      <div className="text-[10px] px-2 py-1.5 rounded-md bg-secondary/60 border border-border font-mono text-center text-foreground/80 tracking-wide">
        {formula}
      </div>

      {/* Energy ladder visualization */}
      <div className="relative h-[220px] flex">
        {/* Axis */}
        <div className="w-8 relative flex flex-col justify-between py-1 text-[8px] text-muted-foreground">
          <span>{maxE.toFixed(2)}</span>
          <span className="text-[7px]">E</span>
          <span>{minE.toFixed(2)}</span>
        </div>

        {/* Ladder */}
        <div className="flex-1 relative border-l border-border/40 ml-1">
          {levels.map((level, i) => {
            const yPercent = 100 - ((level.energy - minE) / range) * 90 - 5; // 5-95% range
            const isActive = i === closestIdx;
            const color = levelColor(i, levels.length);

            return (
              <motion.div
                key={level.n}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                className="absolute left-0 right-0 flex items-center group"
                style={{ top: `${yPercent}%` }}
              >
                {/* Level line */}
                <div
                  className="h-[2px] flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: isActive
                      ? `linear-gradient(90deg, ${color}, ${color}88 70%, transparent)`
                      : `linear-gradient(90deg, ${color}99, ${color}33 70%, transparent)`,
                    boxShadow: isActive ? `0 0 8px ${color}66` : "none",
                    height: isActive ? "3px" : "2px",
                  }}
                />

                {/* Label */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute right-1 flex items-center gap-1 cursor-default"
                      style={{ transform: "translateY(-50%)" }}
                    >
                      <span
                        className="text-[9px] font-bold transition-all"
                        style={{
                          color: isActive ? color : `${color}aa`,
                          textShadow: isActive ? `0 0 6px ${color}44` : "none",
                        }}
                      >
                        {level.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="energy-marker"
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[10px]">
                    <div className="space-y-0.5">
                      <div className="font-semibold">Level {level.label}</div>
                      <div>E = {level.energy.toFixed(4)}</div>
                      {level.degeneracy && <div>Degeneracy: {level.degeneracy}</div>}
                      {i > 0 && (
                        <div className="text-muted-foreground">
                          ΔE = {(level.energy - levels[i - 1].energy).toFixed(4)}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Transition arrow for adjacent levels */}
                {isActive && i > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="absolute left-2 text-[7px] text-muted-foreground whitespace-nowrap"
                    style={{ transform: "translateY(10px)" }}
                  >
                    ΔE = {(level.energy - levels[i - 1].energy).toFixed(3)}
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Current energy marker line */}
          {currentEnergy != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-0 right-0 flex items-center pointer-events-none"
              style={{
                top: `${100 - ((Math.min(Math.max(currentEnergy, minE), maxE) - minE) / range) * 90 - 5}%`,
              }}
            >
              <div className="h-[1px] flex-1 border-t border-dashed border-primary/50" />
              <span className="text-[8px] ml-1 text-primary font-mono">
                ⟨E⟩
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Current energy readout */}
      {currentEnergy != null && (
        <div className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
          <span className="text-muted-foreground">Current ⟨E⟩</span>
          <span className="font-mono font-bold text-primary">
            {currentEnergy.toFixed(4)}
          </span>
        </div>
      )}

      {/* Level count */}
      <div className="text-[9px] text-muted-foreground text-center">
        {levels.length} bound state{levels.length !== 1 ? "s" : ""} shown
      </div>
    </div>
  );
});

EnergySpectrumPanel.displayName = "EnergySpectrumPanel";
export default EnergySpectrumPanel;
