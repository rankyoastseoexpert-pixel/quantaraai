import { memo, useState, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { BarChart3, Play, Trash2, Atom } from "lucide-react";
import type { SimState } from "@/lib/quantumSimulator";

interface EnsembleBin {
  binCenter: number;
  count: number;
  freq: number;
}

interface EnsembleResult {
  positionSamples: number[];
  momentumSamples: number[];
  posHistogram: EnsembleBin[];
  momHistogram: EnsembleBin[];
  meanX: number;
  stdX: number;
  meanP: number;
  stdP: number;
}

interface Props {
  simState: React.RefObject<SimState | null>;
  initSim: () => SimState;
}

function samplePosition(psi: [number, number][], x: Float64Array, dx: number): number {
  const N = psi.length;
  let total = 0;
  for (let i = 0; i < N; i++) total += (psi[i][0] ** 2 + psi[i][1] ** 2) * dx;
  const r = Math.random() * total;
  let cum = 0;
  for (let i = 0; i < N; i++) {
    cum += (psi[i][0] ** 2 + psi[i][1] ** 2) * dx;
    if (cum >= r) return x[i];
  }
  return x[N - 1];
}

function sampleMomentum(psi: [number, number][], x: Float64Array, dx: number, N: number): number {
  const dk = (2 * Math.PI) / (N * dx);
  const kMin = -(N / 2) * dk;
  const probK = new Float64Array(N);
  let totalK = 0;
  for (let j = 0; j < N; j++) {
    const k = kMin + j * dk;
    let re = 0, im = 0;
    for (let i = 0; i < N; i++) {
      const phase = -k * x[i];
      re += psi[i][0] * Math.cos(phase) - psi[i][1] * Math.sin(phase);
      im += psi[i][0] * Math.sin(phase) + psi[i][1] * Math.cos(phase);
    }
    probK[j] = (re * re + im * im) * dx / (2 * Math.PI) * dk;
    totalK += probK[j];
  }
  const r = Math.random() * totalK;
  let cum = 0;
  for (let j = 0; j < N; j++) {
    cum += probK[j];
    if (cum >= r) return kMin + j * dk;
  }
  return 0;
}

function buildHistogram(samples: number[], bins: number): EnsembleBin[] {
  if (samples.length === 0) return [];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  for (const s of samples) {
    const idx = Math.min(bins - 1, Math.floor((s - min) / binWidth));
    counts[idx]++;
  }
  return counts.map((c, i) => ({
    binCenter: min + (i + 0.5) * binWidth,
    count: c,
    freq: c / samples.length,
  }));
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

const EnsemblePanel = ({ simState, initSim }: Props) => {
  const [numTrials, setNumTrials] = useState(100);
  const [result, setResult] = useState<EnsembleResult | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"position" | "momentum">("position");

  const runEnsemble = useCallback(() => {
    setRunning(true);
    // Use setTimeout to not block the UI
    setTimeout(() => {
      const posSamples: number[] = [];
      const momSamples: number[] = [];

      for (let trial = 0; trial < numTrials; trial++) {
        // Re-initialize a fresh simulation for each trial
        const sim = initSim();
        posSamples.push(samplePosition(sim.psi, sim.x, sim.dx));
        momSamples.push(sampleMomentum(sim.psi, sim.x, sim.dx, sim.N));
      }

      const bins = Math.min(40, Math.max(15, Math.floor(Math.sqrt(numTrials))));
      setResult({
        positionSamples: posSamples,
        momentumSamples: momSamples,
        posHistogram: buildHistogram(posSamples, bins),
        momHistogram: buildHistogram(momSamples, bins),
        meanX: mean(posSamples),
        stdX: std(posSamples),
        meanP: mean(momSamples),
        stdP: std(momSamples),
      });
      setRunning(false);
    }, 50);
  }, [numTrials, initSim]);

  const histogram = activeTab === "position" ? result?.posHistogram : result?.momHistogram;
  const stats = activeTab === "position"
    ? { mean: result?.meanX, std: result?.stdX, label: "x", unit: "" }
    : { mean: result?.meanP, std: result?.stdP, label: "p", unit: " ℏ/a₀" };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
          <BarChart3 size={13} className="text-primary" />
        </div>
        <h3 className="text-xs font-semibold text-foreground">Ensemble Averaging</h3>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-3">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Measurements</span>
            <span className="font-mono text-primary">{numTrials}</span>
          </div>
          <Slider min={10} max={500} step={10} value={[numTrials]}
            onValueChange={([v]) => setNumTrials(v)} className="h-4" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={runEnsemble} disabled={running}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 text-[10px]">
            {running ? (
              <><Atom size={11} className="animate-spin" /> Running…</>
            ) : (
              <><Play size={11} /> Run Ensemble</>
            )}
          </Button>
          {result && (
            <Button size="sm" variant="outline" onClick={() => setResult(null)}
              className="border-border text-[10px] gap-1">
              <Trash2 size={11} /> Clear
            </Button>
          )}
        </div>
      </div>

      {result && (
        <>
          {/* Tab toggle */}
          <div className="flex gap-1 mb-3">
            {(["position", "momentum"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 text-[10px] py-1.5 rounded-md border transition-all font-medium ${
                  activeTab === tab
                    ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                }`}>
                {tab === "position" ? "Position x" : "Momentum p"}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="rounded-lg bg-secondary/40 p-2 text-center">
              <div className="text-[8px] text-muted-foreground mb-0.5">N</div>
              <div className="text-xs font-mono text-foreground font-semibold">{numTrials}</div>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-center border border-primary/20">
              <div className="text-[8px] text-muted-foreground mb-0.5">⟨{stats.label}⟩</div>
              <div className="text-xs font-mono text-primary font-semibold">{stats.mean?.toFixed(3)}</div>
            </div>
            <div className="rounded-lg bg-secondary/40 p-2 text-center">
              <div className="text-[8px] text-muted-foreground mb-0.5">σ_{stats.label}</div>
              <div className="text-xs font-mono text-foreground font-semibold">{stats.std?.toFixed(3)}</div>
            </div>
          </div>

          {/* Histogram */}
          {histogram && histogram.length > 0 && (
            <div className="rounded-lg border border-border/30 bg-background/30 p-2">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={histogram} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="binCenter" fontSize={8} stroke="hsl(var(--muted-foreground))"
                    tickFormatter={v => v.toFixed(1)} />
                  <YAxis dataKey="freq" fontSize={8} stroke="hsl(var(--muted-foreground))"
                    tickFormatter={v => (v * 100).toFixed(0) + "%"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "10px",
                    }}
                    formatter={(value: number) => [(value * 100).toFixed(1) + "%", "Frequency"]}
                    labelFormatter={(v: number) => `${stats.label} = ${v.toFixed(3)}`}
                  />
                  {stats.mean !== undefined && (
                    <ReferenceLine x={stats.mean} stroke="hsl(var(--primary))"
                      strokeDasharray="3 3" strokeWidth={1.5} />
                  )}
                  <Bar dataKey="freq" radius={[2, 2, 0, 0]}>
                    {histogram.map((_, i) => (
                      <Cell key={i} fill={`hsl(${activeTab === "position" ? "195" : "260"} 80% ${45 + (i % 3) * 5}%)`} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Heisenberg product */}
          {result.stdX > 0 && result.stdP > 0 && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-[10px]">
              <span className="text-muted-foreground">σₓ · σₚ = </span>
              <span className="font-mono text-primary font-semibold">
                {(result.stdX * result.stdP).toFixed(4)}
              </span>
              <span className="text-muted-foreground ml-1">
                {result.stdX * result.stdP >= 0.49 ? "✓ ≥ ℏ/2" : "⚠ < ℏ/2 (finite sampling)"}
              </span>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};

export default memo(EnsemblePanel);
