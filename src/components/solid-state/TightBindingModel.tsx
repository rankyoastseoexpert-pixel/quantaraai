import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { solveTightBinding } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

const SliderRow = ({ label, value, min, max, step, onChange, unit, color }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; color?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono px-1.5 rounded text-[11px] ${color || "text-primary bg-primary/10"}`}>{value.toFixed(2)}{unit}</span>
    </div>
    <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="h-4" />
  </div>
);

const TB_DERIVATION = [
  {
    title: "Tight-Binding Hamiltonian",
    content: "The tight-binding model starts from isolated atomic orbitals |φₙ⟩ at each lattice site n. The Hamiltonian consists of on-site energy ε₀ and nearest-neighbor hopping integral t.",
    equation: "H = Σₙ ε₀ |n⟩⟨n| − t Σ_{⟨n,m⟩} (|n⟩⟨m| + |m⟩⟨n|)"
  },
  {
    title: "Bloch State Construction",
    content: "We construct Bloch states as superpositions of atomic orbitals with phase factors. For N sites with periodic boundary conditions:",
    equation: "|ψ_k⟩ = (1/√N) Σₙ e^{ikna} |φₙ⟩"
  },
  {
    title: "1D Dispersion Relation",
    content: "Acting H on |ψ_k⟩ and projecting, we obtain the energy eigenvalue. The nearest-neighbor hopping gives a cosine dispersion:",
    equation: "E(k) = ε₀ − 2t·cos(ka)"
  },
  {
    title: "2D Square Lattice Extension",
    content: "For a 2D square lattice with hopping along both axes, the dispersion becomes separable. Each direction contributes independently:",
    equation: "E(kₓ, k_y) = ε₀ − 2t·[cos(kₓa) + cos(k_ya)]"
  },
  {
    title: "Bandwidth",
    content: "The bandwidth W = E_max − E_min measures the total spread of the energy band. In 1D: W = 4t. In 2D square: W = 8t. Larger hopping t → wider bands → more delocalized electrons.",
    equation: "W₁D = 4t,  W₂D = 8t"
  },
  {
    title: "Density of States (DOS)",
    content: "The DOS g(E) counts the number of states per unit energy. In 1D, it exhibits Van Hove singularities at the band edges where the group velocity dE/dk → 0:",
    equation: "g₁D(E) = (N/π) · 1/√[(2t)² − (E − ε₀)²]  (Van Hove singularities at E = ε₀ ± 2t)"
  },
  {
    title: "Effective Mass & Comparison with Free Electron",
    content: "Near k ≈ 0, the TB band is parabolic with effective mass m* = ℏ²/(2ta²). The free electron gives E = ℏ²k²/2m. They agree near k ≈ 0 but diverge near zone boundaries where Bragg scattering flattens the TB band.",
    equation: "m* = ℏ²/(d²E/dk²)|_{k=0} = ℏ²/(2ta²)"
  },
];

// Band colors for multiple orbitals
const BAND_PALETTE = [
  { stroke: "rgba(0, 210, 255, 0.95)", fill: "rgba(0, 210, 255, 0.12)", label: "s-band" },
  { stroke: "rgba(180, 120, 255, 0.90)", fill: "rgba(180, 120, 255, 0.10)", label: "p-band" },
  { stroke: "rgba(255, 160, 60, 0.85)", fill: "rgba(255, 160, 60, 0.08)", label: "d-band" },
];

// ─── Research-grade Tight-Binding Canvas ──────────────────────────────
function TightBindingCanvas({
  t, epsilon, a, dim, showFreeElectron, numBands, t2, t3
}: {
  t: number; epsilon: number; a: number; dim: "1D" | "2D";
  showFreeElectron: boolean; numBands: number; t2: number; t3: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = 480;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 70, right: 50, top: 55, bottom: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    // k range: first Brillouin zone
    const kMax = Math.PI / a;
    const N = 500;

    // Compute bands
    const bands: { energies: number[]; color: typeof BAND_PALETTE[0]; label: string; tVal: number; epsilonVal: number }[] = [];

    // Band 1: s-band
    const e1: number[] = [];
    for (let i = 0; i <= N; i++) {
      const k = -kMax + (2 * kMax) * i / N;
      e1.push(dim === "1D" ? epsilon - 2 * t * Math.cos(k * a) : epsilon - 2 * t * (Math.cos(k * a) + Math.cos(k * a * 0.7)));
    }
    bands.push({ energies: e1, color: BAND_PALETTE[0], label: "s-band (E₀ − 2t cos ka)", tVal: t, epsilonVal: epsilon });

    // Band 2: p-band (offset)
    if (numBands >= 2) {
      const ep2 = epsilon + 2 * t + t2 * 2 + 1.5;
      const e2: number[] = [];
      for (let i = 0; i <= N; i++) {
        const k = -kMax + (2 * kMax) * i / N;
        e2.push(ep2 - 2 * t2 * Math.cos(k * a));
      }
      bands.push({ energies: e2, color: BAND_PALETTE[1], label: "p-band", tVal: t2, epsilonVal: ep2 });
    }

    // Band 3: d-band
    if (numBands >= 3) {
      const ep3 = epsilon + 4 * t + t2 * 2 + t3 * 2 + 3;
      const e3: number[] = [];
      for (let i = 0; i <= N; i++) {
        const k = -kMax + (2 * kMax) * i / N;
        e3.push(ep3 - 2 * t3 * Math.cos(k * a));
      }
      bands.push({ energies: e3, color: BAND_PALETTE[2], label: "d-band", tVal: t3, epsilonVal: ep3 });
    }

    // Free electron band
    const HBAR2_2M = 3.81;
    const freeE: number[] = [];
    for (let i = 0; i <= N; i++) {
      const k = -kMax + (2 * kMax) * i / N;
      freeE.push(HBAR2_2M * k * k);
    }

    // Compute y range
    let allE = bands.flatMap(b => b.energies);
    if (showFreeElectron) allE = allE.concat(freeE);
    const eMin = Math.min(...allE) - 0.5;
    const eMax = Math.max(...allE) + 0.5;

    const toX = (k: number) => pad.left + ((k + kMax) / (2 * kMax)) * plotW;
    const toY = (e: number) => pad.top + plotH - ((e - eMin) / (eMax - eMin)) * plotH;

    // ── Background grid ──
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#6ea8d8";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = pad.top + (plotH * i) / 10;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const x = pad.left + (plotW * i) / 8;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── BZ boundaries ──
    ctx.strokeStyle = "rgba(255, 200, 50, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    // k = -π/a
    ctx.beginPath(); ctx.moveTo(toX(-kMax), pad.top); ctx.lineTo(toX(-kMax), pad.top + plotH); ctx.stroke();
    // k = +π/a
    ctx.beginPath(); ctx.moveTo(toX(kMax), pad.top); ctx.lineTo(toX(kMax), pad.top + plotH); ctx.stroke();
    // k = 0
    ctx.strokeStyle = "rgba(150, 175, 210, 0.3)";
    ctx.beginPath(); ctx.moveTo(toX(0), pad.top); ctx.lineTo(toX(0), pad.top + plotH); ctx.stroke();
    ctx.setLineDash([]);

    // ── Axes ──
    ctx.strokeStyle = "rgba(150, 175, 210, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();
    // Arrow tips
    ctx.fillStyle = "rgba(150, 175, 210, 0.5)";
    ctx.beginPath(); ctx.moveTo(pad.left + plotW, pad.top + plotH); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH - 4); ctx.lineTo(pad.left + plotW - 8, pad.top + plotH + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left - 4, pad.top + 8); ctx.lineTo(pad.left + 4, pad.top + 8); ctx.fill();

    // ── Draw bands with shading ──
    for (const band of bands) {
      const { energies, color } = band;

      // Shading under curve (allowed states)
      const bandMin = Math.min(...energies);
      const bandMax = Math.max(...energies);
      const shadGrad = ctx.createLinearGradient(0, toY(bandMax), 0, toY(bandMin));
      shadGrad.addColorStop(0, color.fill);
      shadGrad.addColorStop(1, color.fill.replace(/[\d.]+\)$/, "0.02)"));

      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const k = -kMax + (2 * kMax) * i / N;
        const px = toX(k);
        const py = toY(energies[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      // Close along bottom of band
      for (let i = N; i >= 0; i--) {
        const k = -kMax + (2 * kMax) * i / N;
        ctx.lineTo(toX(k), toY(bandMin));
      }
      ctx.closePath();
      ctx.fillStyle = shadGrad;
      ctx.fill();

      // Band curve
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const k = -kMax + (2 * kMax) * i / N;
        const px = toX(k);
        const py = toY(energies[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Band edge markers at k=0 and k=±π/a
      const eAtZero = energies[Math.floor(N / 2)];
      const eAtEdge = energies[0]; // k = -π/a
      // Dots
      ctx.fillStyle = color.stroke;
      [toX(0), toX(-kMax), toX(kMax)].forEach((x, idx) => {
        const e = idx === 0 ? eAtZero : eAtEdge;
        ctx.beginPath(); ctx.arc(x, toY(e), 4, 0, Math.PI * 2); ctx.fill();
      });
    }

    // ── Free electron comparison ──
    if (showFreeElectron) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(255, 200, 80, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const k = -kMax + (2 * kMax) * i / N;
        const px = toX(k);
        const py = toY(freeE[i]);
        if (py < pad.top || py > pad.top + plotH) continue;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Bandwidth annotation for first band ──
    const b1Min = Math.min(...bands[0].energies);
    const b1Max = Math.max(...bands[0].energies);
    const annoX = pad.left + plotW + 8;

    // Bracket
    ctx.strokeStyle = "rgba(0, 210, 255, 0.6)";
    ctx.lineWidth = 1.5;
    const y1 = toY(b1Max), y2 = toY(b1Min);
    ctx.beginPath();
    ctx.moveTo(annoX, y1); ctx.lineTo(annoX + 10, y1);
    ctx.moveTo(annoX + 5, y1); ctx.lineTo(annoX + 5, y2);
    ctx.moveTo(annoX, y2); ctx.lineTo(annoX + 10, y2);
    ctx.stroke();
    // Label
    ctx.fillStyle = "rgba(0, 210, 255, 0.9)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("W = 4t", annoX + 14, (y1 + y2) / 2 - 5);
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0, 210, 255, 0.6)";
    ctx.fillText(`= ${(4 * t).toFixed(2)} eV`, annoX + 14, (y1 + y2) / 2 + 8);

    // Band edge values
    ctx.font = "italic 10px 'Georgia', serif";
    ctx.fillStyle = "rgba(0, 210, 255, 0.7)";
    ctx.textAlign = "right";
    ctx.fillText(`E₀ − 2t = ${b1Min.toFixed(2)}`, pad.left - 6, toY(b1Min) + 4);
    ctx.fillText(`E₀ + 2t = ${b1Max.toFixed(2)}`, pad.left - 6, toY(b1Max) + 4);

    // ── k-axis labels ──
    ctx.fillStyle = "rgba(150, 170, 200, 0.8)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    const kLabels = [
      { k: -kMax, label: "−π/a" },
      { k: 0, label: "0" },
      { k: kMax, label: "π/a" },
    ];
    kLabels.forEach(({ k, label }) => {
      ctx.fillText(label, toX(k), pad.top + plotH + 20);
    });

    // BZ boundary label
    ctx.fillStyle = "rgba(255, 200, 50, 0.6)";
    ctx.font = "italic 10px 'Georgia', serif";
    ctx.fillText("1st Brillouin Zone", toX(0), pad.top + plotH + 38);

    // BZ bracket
    ctx.strokeStyle = "rgba(255, 200, 50, 0.3)";
    ctx.lineWidth = 1;
    const bzY = pad.top + plotH + 28;
    ctx.beginPath();
    ctx.moveTo(toX(-kMax), bzY); ctx.lineTo(toX(-kMax), bzY + 5);
    ctx.moveTo(toX(-kMax), bzY); ctx.lineTo(toX(kMax), bzY);
    ctx.moveTo(toX(kMax), bzY); ctx.lineTo(toX(kMax), bzY + 5);
    ctx.stroke();

    // ── Axis labels ──
    ctx.fillStyle = "rgba(170, 190, 220, 0.8)";
    ctx.font = "italic 13px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("k  (wavevector)", pad.left + plotW / 2, H - 8);
    ctx.save();
    ctx.translate(16, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("E(k)  (eV)", 0, 0);
    ctx.restore();

    // ── Title ──
    ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Tight-Binding Approximation — 1D Periodic Lattice", pad.left, 22);

    // Subtitle: dispersion formula
    ctx.fillStyle = "rgba(170, 190, 220, 0.7)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.fillText("E(k) = ε₀ − 2t · cos(ka)", pad.left, 40);

    // ── Legend ──
    ctx.textAlign = "left";
    ctx.font = "11px 'Inter', sans-serif";
    let legY = pad.top + 10;
    bands.forEach((band, i) => {
      ctx.fillStyle = band.color.stroke;
      ctx.fillRect(W - pad.right - 140, legY + i * 18, 14, 3);
      ctx.beginPath(); ctx.arc(W - pad.right - 133, legY + i * 18 + 1.5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(200, 215, 235, 0.8)";
      ctx.fillText(band.color.label, W - pad.right - 122, legY + i * 18 + 5);
    });
    if (showFreeElectron) {
      const feY = legY + bands.length * 18;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "rgba(255, 200, 80, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W - pad.right - 140, feY + 1.5); ctx.lineTo(W - pad.right - 126, feY + 1.5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(200, 215, 235, 0.6)";
      ctx.fillText("Free electron", W - pad.right - 122, feY + 5);
    }

    // ── Hopping parameter annotation ──
    ctx.textAlign = "right";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0, 210, 255, 0.8)";
    ctx.fillText(`t = ${t.toFixed(2)} eV`, W - pad.right, 22);
    ctx.fillStyle = "rgba(150, 170, 200, 0.5)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`ε₀ = ${epsilon.toFixed(2)} eV  |  a = ${a.toFixed(2)} Å`, W - pad.right, 36);
    ctx.fillText(`m* = ${(HBAR2_2M / (2 * t * a * a)).toFixed(4)} mₑ`, W - pad.right, 48);

  }, [t, epsilon, a, dim, showFreeElectron, numBands, t2, t3]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function TightBindingModel() {
  const [t, setT] = useState(1);
  const [epsilon, setEpsilon] = useState(0);
  const [a, setA] = useState(2.5);
  const [dim, setDim] = useState<"1D" | "2D">("1D");
  const [showFreeElectron, setShowFreeElectron] = useState(true);
  const [numBands, setNumBands] = useState(1);
  const [t2, setT2] = useState(0.6);
  const [t3, setT3] = useState(0.3);

  const result = useMemo(() => solveTightBinding({ t, epsilon, a, N: 200, dimension: dim }), [t, epsilon, a, dim]);

  const dosData = result.dos.map(d => ({
    energy: parseFloat(d.energy.toFixed(3)),
    density: parseFloat(d.density.toFixed(4)),
  }));

  const bandwidth = 4 * t;
  const bandMin = epsilon - 2 * t;
  const bandMax = epsilon + 2 * t;
  const effectiveMass = 3.81 / (2 * t * a * a);

  const handleExportPNG = () => {
    const canvas = document.querySelector("#tb-main-canvas canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "tight-binding-model.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleExportPDF = () => {
    exportChartAsPDF("Tight-Binding Model — 1D Periodic Lattice", [
      `t = ${t} eV | ε₀ = ${epsilon} eV | a = ${a} Å | Bands: ${numBands}`,
      `Bandwidth W = 4t = ${bandwidth.toFixed(3)} eV`,
      `Band edges: E(k=0) = ${bandMin.toFixed(3)} eV, E(k=±π/a) = ${bandMax.toFixed(3)} eV`,
      `Effective mass m* = ${effectiveMass.toFixed(4)} mₑ`,
    ], "tb-dos-chart");
  };

  return (
    <div className="space-y-4">
      {/* Main Canvas */}
      <GlassCard className="p-5" id="tb-main-canvas">
        <TightBindingCanvas
          t={t} epsilon={epsilon} a={a} dim={dim}
          showFreeElectron={showFreeElectron} numBands={numBands}
          t2={t2} t3={t3}
        />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Parameters</h3>

          {/* Dimension toggle */}
          <div className="flex gap-2">
            {(["1D", "2D"] as const).map(d => (
              <button key={d} onClick={() => setDim(d)}
                className={`flex-1 text-xs py-2 rounded-md border transition-colors ${
                  dim === d ? "bg-primary/15 border-primary/30 text-primary font-medium" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                }`}
              >{d} Lattice</button>
            ))}
          </div>

          <SliderRow label="t (Hopping Parameter)" value={t} min={0.1} max={5} step={0.1} onChange={setT} unit=" eV" />
          <SliderRow label="ε₀ (On-site Energy)" value={epsilon} min={-5} max={5} step={0.1} onChange={setEpsilon} unit=" eV" />
          <SliderRow label="a (Lattice Constant)" value={a} min={1} max={6} step={0.1} onChange={setA} unit=" Å" />

          {/* Multi-band controls */}
          <div className="pt-3 border-t border-border/30 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Multi-Orbital Bands</h4>
            <div className="flex gap-1">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setNumBands(n)}
                  className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${
                    numBands === n ? "bg-primary/15 border-primary/30 text-primary font-medium" : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >{n} band{n > 1 ? "s" : ""}</button>
              ))}
            </div>
            {numBands >= 2 && (
              <SliderRow label="t₂ (p-band hopping)" value={t2} min={0.1} max={3} step={0.1} onChange={setT2} unit=" eV" color="text-purple-400 bg-purple-400/10" />
            )}
            {numBands >= 3 && (
              <SliderRow label="t₃ (d-band hopping)" value={t3} min={0.1} max={2} step={0.1} onChange={setT3} unit=" eV" color="text-orange-400 bg-orange-400/10" />
            )}
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-border/30 space-y-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showFreeElectron} onChange={e => setShowFreeElectron(e.target.checked)}
                className="rounded border-border accent-primary" />
              Show free electron comparison
            </label>
          </div>

          {/* Results */}
          <div className="pt-3 border-t border-border/30 space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Band Analysis</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <p className="text-[10px] text-muted-foreground">Bandwidth:</p>
              <p className="text-[10px] font-mono text-primary text-right">{bandwidth.toFixed(3)} eV</p>
              <p className="text-[10px] text-muted-foreground">E(k=0):</p>
              <p className="text-[10px] font-mono text-primary text-right">{bandMin.toFixed(3)} eV</p>
              <p className="text-[10px] text-muted-foreground">E(k=±π/a):</p>
              <p className="text-[10px] font-mono text-primary text-right">{bandMax.toFixed(3)} eV</p>
              <p className="text-[10px] text-muted-foreground">m*:</p>
              <p className="text-[10px] font-mono text-primary text-right">{effectiveMass.toFixed(4)} mₑ</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 p-2 rounded bg-secondary/30">
              E(k) = {epsilon.toFixed(1)} − {(2 * t).toFixed(1)}·cos(k·{a.toFixed(1)})
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        {/* DOS */}
        <GlassCard className="p-5 lg:col-span-2" id="tb-dos-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">Density of States — g(E)</h3>
          <p className="text-[10px] text-muted-foreground mb-2 font-mono">
            Van Hove singularities at E = ε₀ ± 2t = {bandMin.toFixed(2)}, {bandMax.toFixed(2)} eV
          </p>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dosData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <defs>
                  <linearGradient id="dosGradTB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="energy" type="number" domain={["auto", "auto"]}
                  label={{ value: "E (eV)", position: "bottom", offset: 10, style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <YAxis label={{ value: "g(E)", angle: -90, position: "insideLeft", style: { fill: "hsl(215, 20%, 55%)", fontSize: 12 } }}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                  stroke="hsl(222, 30%, 25%)" />
                <Tooltip contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(222, 30%, 25%)", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `E = ${Number(v).toFixed(3)} eV`} />
                <Bar dataKey="density" fill="url(#dosGradTB)" name="DOS" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Derivation */}
      <DerivationBlock title="Tight-Binding Model — Mathematical Derivation" steps={TB_DERIVATION} />
    </div>
  );
}
