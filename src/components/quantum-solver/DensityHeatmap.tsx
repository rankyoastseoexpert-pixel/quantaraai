import { memo, useMemo, useRef, useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { SCFResult } from "@/lib/dftSolver";
import { compute2DDensitySlice } from "@/lib/dftSolver";

interface Props {
  result: SCFResult;
}

// Viridis colormap (sampled)
const VIRIDIS: [number, number, number][] = [
  [68, 1, 84], [72, 35, 116], [64, 67, 135], [52, 94, 141],
  [41, 120, 142], [32, 144, 140], [34, 167, 132], [68, 190, 112],
  [121, 209, 81], [189, 222, 38], [253, 231, 37],
];

function viridisColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = clamped * (VIRIDIS.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, VIRIDIS.length - 1);
  const f = idx - lo;
  const r = Math.round(VIRIDIS[lo][0] * (1 - f) + VIRIDIS[hi][0] * f);
  const g = Math.round(VIRIDIS[lo][1] * (1 - f) + VIRIDIS[hi][1] * f);
  const b = Math.round(VIRIDIS[lo][2] * (1 - f) + VIRIDIS[hi][2] * f);
  return `rgb(${r},${g},${b})`;
}

const DensityHeatmap = ({ result }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plane, setPlane] = useState<"XY" | "XZ" | "YZ">("XY");
  const [sliceIdx, setSliceIdx] = useState(12);
  const gridSize = result.densityGrid3D.length;

  const sliceData = useMemo(
    () => compute2DDensitySlice(result.densityGrid3D, result.atoms, plane, sliceIdx),
    [result.densityGrid3D, result.atoms, plane, sliceIdx]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sliceData) return;

    const size = sliceData.grid.length;
    const scale = 2; // render at 2x for sharpness
    canvas.width = size * scale;
    canvas.height = size * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxVal = sliceData.maxVal || 1e-6;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const t = sliceData.grid[i][j] / maxVal;
        ctx.fillStyle = viridisColor(t);
        ctx.fillRect(i * scale, (size - 1 - j) * scale, scale, scale);
      }
    }

    // Draw atom positions projected onto slice
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    const [xMin, xMax] = sliceData.xRange;
    const [yMin, yMax] = sliceData.yRange;

    for (const atom of result.atoms) {
      let ax: number, ay: number;
      if (plane === "XY") { ax = atom.x; ay = atom.y; }
      else if (plane === "XZ") { ax = atom.x; ay = atom.z; }
      else { ax = atom.y; ay = atom.z; }

      const px = ((ax - xMin) / (xMax - xMin)) * size * scale;
      const py = (1 - (ay - yMin) / (yMax - yMin)) * size * scale;

      ctx.beginPath();
      ctx.arc(px, py, 3 * scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
    }
  }, [sliceData, result.atoms, plane]);

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground">
          2D Electron Density |ψ(x,y)|²
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">Viridis colormap</span>
        </h3>
        <div className="flex gap-1">
          {(["XY", "XZ", "YZ"] as const).map(p => (
            <Button
              key={p}
              size="sm"
              variant={plane === p ? "default" : "outline"}
              className={`h-6 text-[10px] px-2 ${plane === p ? "bg-primary text-primary-foreground" : "border-border"}`}
              onClick={() => setPlane(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full aspect-square rounded-lg border border-border/30"
            style={{ imageRendering: "pixelated" }}
          />
          {/* Colorbar */}
          <div className="absolute right-2 top-2 bottom-2 w-4 rounded overflow-hidden border border-white/20">
            <div className="h-full w-full" style={{
              background: `linear-gradient(to top, ${VIRIDIS.map((c, i) =>
                `rgb(${c[0]},${c[1]},${c[2]}) ${(i / (VIRIDIS.length - 1)) * 100}%`
              ).join(", ")})`
            }} />
          </div>
          <div className="absolute right-8 top-1 text-[8px] text-white/70 font-mono">max</div>
          <div className="absolute right-8 bottom-1 text-[8px] text-white/70 font-mono">0</div>

          {/* Axis labels */}
          <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
            {plane === "XY" ? "x (Å)" : plane === "XZ" ? "x (Å)" : "y (Å)"}
          </div>
          <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-muted-foreground">
            {plane === "XY" ? "y (Å)" : plane === "XZ" ? "z (Å)" : "z (Å)"}
          </div>
        </div>

        <div className="w-24 space-y-3">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Slice position</div>
            <Slider
              min={0}
              max={gridSize - 1}
              step={1}
              value={[sliceIdx]}
              onValueChange={([v]) => setSliceIdx(v)}
              orientation="vertical"
              className="h-32"
            />
            <div className="text-[10px] font-mono text-primary mt-1">{sliceIdx}/{gridSize - 1}</div>
          </div>
          <div className="text-[9px] text-muted-foreground space-y-1">
            <div>Max: {sliceData.maxVal.toExponential(2)}</div>
            <div>Grid: {gridSize}³</div>
            <div>Plane: {plane}</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default memo(DensityHeatmap);
