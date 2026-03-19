import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { computeBandDiagram, type MaterialType } from "@/lib/solidStateEngine";
import { exportChartAsPDF } from "@/lib/pdfExport";
import DerivationBlock from "./DerivationBlock";
import { Download, FileText, Layers, Zap, Activity } from "lucide-react";
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

type BandModel = "nearly-free" | "tight-binding" | "k·p";

const MATERIAL_PRESETS: Record<string, { label: string; desc: string; icon: string; mass: number; a: number; V: number; type: MaterialType; Ef: number }> = {
  silicon: { label: "Silicon", desc: "Indirect gap 1.12 eV", icon: "🔷", mass: 0.26, a: 5.43, V: 2.2, type: "semiconductor", Ef: 0 },
  gaas: { label: "GaAs", desc: "Direct gap 1.42 eV", icon: "🟣", mass: 0.067, a: 5.65, V: 2.8, type: "semiconductor", Ef: 0 },
  copper: { label: "Copper", desc: "Free-electron metal", icon: "🟠", mass: 1.0, a: 3.61, V: 1.0, type: "metal", Ef: 0 },
  diamond: { label: "Diamond", desc: "Wide gap 5.5 eV", icon: "💎", mass: 0.2, a: 3.57, V: 5.5, type: "insulator", Ef: 0 },
};

const MATERIAL_INFO: Record<MaterialType, { label: string; desc: string; gradient: string }> = {
  semiconductor: { label: "Semiconductor", desc: "0.5–3 eV gap", gradient: "from-blue-500/20 to-cyan-500/20" },
  metal: { label: "Metal", desc: "No gap", gradient: "from-amber-500/20 to-orange-500/20" },
  insulator: { label: "Insulator", desc: "> 4 eV gap", gradient: "from-rose-500/20 to-pink-500/20" },
};

const BAND_DERIVATION = [
  { title: "Nearly Free Electron Model", content: "Starting from free electrons, a weak periodic potential opens band gaps at zone boundaries via perturbation theory.", equation: "E±(k) = (E⁰_k + E⁰_{k-G})/2 ± √[(E⁰_k − E⁰_{k-G})²/4 + |V_G|²]" },
  { title: "Band Gap at Zone Boundary", content: "At k = π/a, degenerate states split by 2|V_G|. This is the origin of band gaps.", equation: "E_gap = 2|V_G|" },
  { title: "Effective Mass", content: "Near band extrema, E(k) ≈ parabolic. Curvature gives m*.", equation: "1/m* = (1/ℏ²) · d²E/dk²" },
  { title: "Band Classification", content: "VB = highest filled band. CB = lowest empty. Gap determines material type.", equation: "E_g = E_CB(min) − E_VB(max)" },
  { title: "Fermi Level", content: "E_F is chemical potential at T = 0. Position determines transport.", equation: "f(E) = 1 / [exp((E − E_F)/k_BT) + 1]" },
  { title: "Semiconductor Types", content: "Direct gap: efficient light emission. Indirect: requires phonon.", equation: "n = N_C · exp(−(E_C − E_F)/k_BT)" },
];

function BandCanvas({ result, fermiLevel, materialType }: {
  result: ReturnType<typeof computeBandDiagram>; fermiLevel: number; materialType: MaterialType;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = 480;
    const dpr = Math.max(window.devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pad = { left: 65, right: 35, top: 40, bottom: 55 };
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;

    const allE = [...result.conductionBand, ...result.valenceBand];
    const eMin = Math.min(...allE, fermiLevel) - 1;
    const eMax = Math.max(...allE, fermiLevel) + 1;
    const kMin = Math.min(...result.kValues);
    const kMax = Math.max(...result.kValues);

    const toX = (k: number) => pad.left + ((k - kMin) / (kMax - kMin)) * pw;
    const toY = (e: number) => pad.top + ph - ((e - eMin) / (eMax - eMin)) * ph;

    // Background
    const bg = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
    bg.addColorStop(0, "rgba(59,130,246,0.015)");
    bg.addColorStop(0.5, "rgba(0,0,0,0)");
    bg.addColorStop(1, "rgba(139,92,246,0.015)");
    ctx.fillStyle = bg;
    ctx.fillRect(pad.left, pad.top, pw, ph);

    // Grid
    ctx.strokeStyle = "rgba(100,140,200,0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = pad.top + (ph / 10) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    // Band gap shading
    if (result.bandGap > 0) {
      const gapTop = toY(Math.min(...result.conductionBand));
      const gapBot = toY(Math.max(...result.valenceBand));
      const gapGrad = ctx.createLinearGradient(0, gapTop, 0, gapBot);
      gapGrad.addColorStop(0, "rgba(239,68,68,0.06)");
      gapGrad.addColorStop(0.5, "rgba(239,68,68,0.12)");
      gapGrad.addColorStop(1, "rgba(239,68,68,0.06)");
      ctx.fillStyle = gapGrad;
      ctx.fillRect(pad.left, gapTop, pw, gapBot - gapTop);

      // Gap label
      ctx.fillStyle = "rgba(239,68,68,0.6)";
      ctx.font = "italic 10px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.fillText(`E_g = ${result.bandGap.toFixed(2)} eV`, pad.left + pw / 2, (gapTop + gapBot) / 2 + 3);
    }

    // Conduction band fill
    ctx.beginPath();
    result.kValues.forEach((k, i) => {
      const x = toX(k), y = toY(result.conductionBand[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(kMax), pad.top);
    ctx.lineTo(toX(kMin), pad.top);
    ctx.closePath();
    ctx.fillStyle = "rgba(59,130,246,0.06)";
    ctx.fill();

    // Valence band fill
    ctx.beginPath();
    result.kValues.forEach((k, i) => {
      const x = toX(k), y = toY(result.valenceBand[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(kMax), pad.top + ph);
    ctx.lineTo(toX(kMin), pad.top + ph);
    ctx.closePath();
    ctx.fillStyle = "rgba(168,85,247,0.06)";
    ctx.fill();

    // Band curves with glow
    const drawBand = (data: number[], color: string, label: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      result.kValues.forEach((k, i) => {
        const x = toX(k), y = toY(data[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawBand(result.conductionBand, "hsl(210, 100%, 65%)", "CB");
    drawBand(result.valenceBand, "hsl(280, 80%, 70%)", "VB");

    // Fermi level
    const efY = toY(fermiLevel);
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = "rgba(245,158,11,0.8)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(245,158,11,0.4)";
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(pad.left, efY); ctx.lineTo(pad.left + pw, efY); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(245,158,11,0.9)";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`E_F = ${fermiLevel.toFixed(1)} eV`, pad.left + pw - 4, efY - 8);

    // Axes
    ctx.strokeStyle = "rgba(150,175,210,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(170,190,220,0.8)";
    ctx.font = "italic 12px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.fillText("k (Å⁻¹)", pad.left + pw / 2, H - 8);
    ctx.save();
    ctx.translate(14, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Energy E (eV)", 0, 0);
    ctx.restore();

    // Y ticks
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(150,170,200,0.7)";
    ctx.textAlign = "right";
    for (let i = 0; i <= 8; i++) {
      const e = eMin + ((eMax - eMin) / 8) * i;
      ctx.fillText(e.toFixed(1), pad.left - 8, toY(e) + 3);
    }

    // Legend
    const lx = pad.left + 12;
    const ly = pad.top + 14;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.strokeStyle = "hsl(210, 100%, 65%)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
    ctx.fillStyle = "rgba(200,220,255,0.8)"; ctx.textAlign = "left";
    ctx.fillText("Conduction Band", lx + 24, ly + 3);

    ctx.strokeStyle = "hsl(280, 80%, 70%)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly + 16); ctx.lineTo(lx + 18, ly + 16); ctx.stroke();
    ctx.fillText("Valence Band", lx + 24, ly + 19);
  }, [result, fermiLevel, materialType]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
}

export default function BandDiagramTool() {
  const [effectiveMass, setEffectiveMass] = useState(0.5);
  const [latticeSpacing, setLatticeSpacing] = useState(3);
  const [potentialStrength, setPotentialStrength] = useState(3);
  const [materialType, setMaterialType] = useState<MaterialType>("semiconductor");
  const [fermiLevel, setFermiLevel] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const result = useMemo(() => computeBandDiagram({
    effectiveMass, latticeSpacing, potentialStrength, materialType, fermiLevel,
  }), [effectiveMass, latticeSpacing, potentialStrength, materialType, fermiLevel]);

  const applyPreset = (key: string) => {
    const p = MATERIAL_PRESETS[key];
    setEffectiveMass(p.mass);
    setLatticeSpacing(p.a);
    setPotentialStrength(p.V);
    setMaterialType(p.type);
    setFermiLevel(p.Ef);
    setActivePreset(key);
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector("#band-canvas-container canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "band-diagram.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Material Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(MATERIAL_PRESETS).map(([key, p], i) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => applyPreset(key)}
            className={`p-3 rounded-xl border text-left transition-all duration-300 ${
              activePreset === key
                ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                : "bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-border"
            }`}
          >
            <span className="text-lg">{p.icon}</span>
            <p className="text-xs font-semibold text-foreground mt-1">{p.label}</p>
            <p className="text-[9px] text-muted-foreground">{p.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <GlassCard className="p-5 space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers size={14} className="text-primary" /> Material Type
          </h3>
          <div className="space-y-1">
            {(Object.entries(MATERIAL_INFO) as [MaterialType, typeof MATERIAL_INFO[MaterialType]][]).map(([key, info]) => (
              <button key={key} onClick={() => { setMaterialType(key); setActivePreset(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-300 ${
                  materialType === key
                    ? `bg-gradient-to-r ${info.gradient} border-primary/30 shadow-sm`
                    : "border-border/50 hover:bg-secondary/50"
                }`}
              >
                <span className={`text-xs font-medium ${materialType === key ? "text-primary" : "text-foreground"}`}>{info.label}</span>
                <p className="text-[10px] text-muted-foreground">{info.desc}</p>
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground pt-2 flex items-center gap-2">
            <Activity size={14} className="text-primary" /> Parameters
          </h3>
          <SliderRow label="m* (Effective Mass)" value={effectiveMass} min={0.01} max={2} step={0.01} onChange={v => { setEffectiveMass(v); setActivePreset(null); }} unit=" mₑ" />
          <SliderRow label="a (Lattice Spacing)" value={latticeSpacing} min={1} max={8} step={0.1} onChange={v => { setLatticeSpacing(v); setActivePreset(null); }} unit=" Å" />
          <SliderRow label="V (Potential)" value={potentialStrength} min={0.5} max={10} step={0.1} onChange={v => { setPotentialStrength(v); setActivePreset(null); }} unit=" eV" />
          <SliderRow label="E_F (Fermi Level)" value={fermiLevel} min={-5} max={5} step={0.1} onChange={setFermiLevel} unit=" eV" color="text-amber-400 bg-amber-400/10" />

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPNG} className="gap-1.5 text-xs flex-1">
              <Download size={12} /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportChartAsPDF(`Band Diagram — ${MATERIAL_INFO[materialType].label}`, [
              `Band Gap: ${result.bandGap.toFixed(3)} eV | m* = ${effectiveMass} mₑ`,
            ], "band-canvas-container")} className="gap-1.5 text-xs flex-1">
              <FileText size={12} /> PDF
            </Button>
          </div>
        </GlassCard>

        {/* Band Diagram Canvas */}
        <GlassCard className="p-5 lg:col-span-9" id="band-canvas-container">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              Energy Band Diagram
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">
              {MATERIAL_INFO[materialType].label} • E_g = {result.bandGap.toFixed(2)} eV
            </span>
          </div>
          <BandCanvas result={result} fermiLevel={fermiLevel} materialType={materialType} />
        </GlassCard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Band Gap", value: result.bandGap.toFixed(3), unit: "eV", icon: "⚡", color: "text-primary" },
          { label: "Fermi Level", value: fermiLevel.toFixed(2), unit: "eV", icon: "📍", color: "text-amber-400" },
          { label: "Eff. Mass", value: effectiveMass.toFixed(3), unit: "mₑ", icon: "⚛️", color: "text-purple-400" },
          { label: "Material", value: MATERIAL_INFO[materialType].label, unit: "", icon: "🔬", color: "text-foreground" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 text-center">
              <span className="text-lg">{item.icon}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
              <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.unit}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <DerivationBlock title="Energy Band Theory Derivation" steps={BAND_DERIVATION} />
    </div>
  );
}
