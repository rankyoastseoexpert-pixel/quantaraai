import { memo, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import type { SCFResult } from "@/lib/dftSolver";

interface Props {
  result: SCFResult;
  selectedOrbital: number;
  onOrbitalChange: (idx: number) => void;
}

const EnergyLevelDiagram = ({ result, selectedOrbital, onOrbitalChange }: Props) => {
  const { levels, yMin, yMax, fermiY } = useMemo(() => {
    const energies = result.finalEnergies;
    const min = Math.min(...energies) - 0.5;
    const max = Math.max(...energies) + 0.5;
    const range = max - min || 1;

    const lvls = energies.map((e, i) => ({
      index: i,
      energy: e,
      yPercent: ((e - min) / range) * 100,
      isOccupied: i <= result.homoIndex,
      isHOMO: i === result.homoIndex,
      isLUMO: i === result.lumoIndex,
    }));

    const fermi = ((result.fermiEnergy - min) / range) * 100;

    return { levels: lvls, yMin: min, yMax: max, fermiY: fermi };
  }, [result]);

  return (
    <GlassCard>
      <h3 className="text-xs font-semibold text-foreground mb-2">
        Energy Level Diagram
        <span className="ml-2 text-[10px] font-normal text-muted-foreground">
          {result.finalEnergies.length} levels | E_F = {result.fermiEnergy.toFixed(3)} eV
        </span>
      </h3>

      <div className="flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[9px] font-mono text-muted-foreground py-1 w-14 text-right">
          <span>{yMax.toFixed(2)}</span>
          <span>{((yMax + yMin) / 2).toFixed(2)}</span>
          <span>{yMin.toFixed(2)}</span>
        </div>

        {/* Diagram */}
        <div className="flex-1 relative h-[280px] border-l border-b border-border/50">
          {/* Fermi level dashed line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed z-10"
            style={{
              bottom: `${fermiY}%`,
              borderColor: "hsl(var(--primary))",
            }}
          >
            <span className="absolute -right-1 -top-3 text-[8px] font-mono text-primary whitespace-nowrap">
              E_F
            </span>
          </div>

          {/* Energy levels as horizontal rungs */}
          {levels.map((lvl) => (
            <button
              key={lvl.index}
              onClick={() => onOrbitalChange(lvl.index)}
              className="absolute left-4 right-4 h-[3px] rounded-full transition-all cursor-pointer group"
              style={{
                bottom: `${lvl.yPercent}%`,
                backgroundColor: selectedOrbital === lvl.index
                  ? "hsl(var(--primary))"
                  : lvl.isOccupied
                    ? "hsl(142, 71%, 45%)"
                    : "hsl(var(--muted-foreground) / 0.3)",
                boxShadow: selectedOrbital === lvl.index ? "0 0 8px hsl(var(--primary) / 0.5)" : "none",
                height: selectedOrbital === lvl.index ? "4px" : "2px",
              }}
            >
              {/* Electrons (dots) */}
              {lvl.isOccupied && (
                <>
                  <div className="absolute -top-1.5 left-1/3 w-2 h-2 rounded-full bg-foreground/70 border border-background" />
                  {lvl.index < result.homoIndex && (
                    <div className="absolute -top-1.5 left-2/3 w-2 h-2 rounded-full bg-foreground/70 border border-background" />
                  )}
                </>
              )}

              {/* Tooltip */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary border border-border rounded px-1.5 py-0.5 text-[8px] font-mono text-foreground whitespace-nowrap z-20 pointer-events-none">
                Level {lvl.index + 1}: {lvl.energy.toFixed(3)} eV
                {lvl.isHOMO && " (HOMO)"}
                {lvl.isLUMO && " (LUMO)"}
              </div>
            </button>
          ))}

          {/* HOMO/LUMO labels */}
          {levels.filter(l => l.isHOMO || l.isLUMO).map(lvl => (
            <div
              key={`label-${lvl.index}`}
              className="absolute -left-0.5 text-[7px] font-bold whitespace-nowrap"
              style={{
                bottom: `calc(${lvl.yPercent}% + 4px)`,
                color: lvl.isHOMO ? "hsl(142, 71%, 45%)" : "hsl(38, 92%, 50%)",
              }}
            >
              {lvl.isHOMO ? "HOMO" : "LUMO"}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="w-16 space-y-2 text-[8px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 rounded bg-muted-foreground/30" />
            <span className="text-muted-foreground">Virtual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 border-t border-dashed border-primary" />
            <span className="text-muted-foreground">Fermi</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-foreground/70" />
            <span className="text-muted-foreground">e⁻</span>
          </div>
        </div>
      </div>

      {/* Band gap annotation */}
      <div className="mt-2 text-center text-[10px] font-mono text-muted-foreground">
        HOMO–LUMO Gap: <span className="text-primary font-semibold">{result.bandGap.toFixed(4)} eV</span>
        {" "}({(result.bandGap * 8065.54).toFixed(0)} cm⁻¹)
      </div>
    </GlassCard>
  );
};

export default memo(EnergyLevelDiagram);
