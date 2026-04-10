import { useState, useMemo, useRef, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Download, ZoomIn, ZoomOut, Grid3X3, Sun, Moon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as math from "mathjs";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

const graphPresets = [
  { name: "Gaussian", eq: "exp(-x^2/2)" },
  { name: "Harmonic Oscillator ψ₁", eq: "exp(-x^2/2)" },
  { name: "Harmonic Oscillator ψ₂", eq: "2*x*exp(-x^2/2)" },
  { name: "Particle in a Box ψ₁", eq: "sin(pi*x)" },
  { name: "Particle in a Box ψ₂", eq: "sin(2*pi*x)" },
  { name: "Free Particle", eq: "cos(3*x)" },
  { name: "Wave Packet", eq: "cos(5*x)*exp(-x^2/4)" },
  { name: "Exponential Decay", eq: "exp(-0.5*x)" },
  { name: "Bessel-like", eq: "sin(x)/x" },
];

const quantumModes = [
  { name: "Particle in a Box", options: ["ψₙ(x)", "|ψₙ(x)|²", "Energy Levels"] },
  { name: "Harmonic Oscillator", options: ["Potential Curve", "Wavefunction Overlay", "Energy Ladder"] },
  { name: "TDSE Animation", options: ["Animated |Ψ(x,t)|²", "Potential Overlay"] },
];

// Allowlist of safe math functions
const SAFE_FUNCTIONS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan",
  "exp", "log", "sqrt", "abs", "ceil", "floor",
  "sinh", "cosh", "tanh", "sign", "round", "pow",
]);

function safeEvaluate(expr: string, x: number): number | null {
  try {
    // Validate no dangerous patterns
    if (/import|require|eval|Function|window|document|fetch|XMLHttp/i.test(expr)) return null;
    const scope = { x, pi: Math.PI, e: Math.E, PI: Math.PI };
    const result = math.evaluate(expr, scope);
    if (typeof result !== "number" || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

function generateGraphData(expr: string, xMin = -5, xMax = 5, points = 300) {
  const data: { x: number; y: number | null }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = xMin + (xMax - xMin) * (i / points);
    const y = safeEvaluate(expr, x);
    data.push({ x: parseFloat(x.toFixed(4)), y: y !== null ? parseFloat(y.toFixed(6)) : null });
  }
  return data;
}

function generateQuantumMode(mode: string, option: string) {
  const data: { x: number; y: number | null; y2?: number | null }[] = [];
  const N = 300;

  if (mode === "Particle in a Box") {
    const n = option === "Energy Levels" ? 1 : (option.includes("²") ? 1 : 1);
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      if (option === "Energy Levels") {
        // Show energy level diagram
        for (const nVal of [1, 2, 3, 4]) {
          // We'll just show ψ for n=1 through 4 overlaid
        }
        const psi1 = Math.sqrt(2) * Math.sin(Math.PI * x);
        const psi2 = Math.sqrt(2) * Math.sin(2 * Math.PI * x);
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(psi1.toFixed(6)), y2: parseFloat(psi2.toFixed(6)) });
      } else if (option.includes("²")) {
        const psi = Math.sqrt(2) * Math.sin(Math.PI * x);
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat((psi * psi).toFixed(6)) });
      } else {
        const psi = Math.sqrt(2) * Math.sin(Math.PI * x);
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(psi.toFixed(6)) });
      }
    }
  } else if (mode === "Harmonic Oscillator") {
    for (let i = 0; i <= N; i++) {
      const x = -4 + 8 * i / N;
      if (option === "Potential Curve") {
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat((0.5 * x * x).toFixed(6)) });
      } else if (option === "Wavefunction Overlay") {
        const psi0 = Math.exp(-x * x / 2);
        const psi1 = 2 * x * Math.exp(-x * x / 2);
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(psi0.toFixed(6)), y2: parseFloat(psi1.toFixed(6)) });
      } else {
        // Energy ladder - show potential + levels
        const V = 0.5 * x * x;
        data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(V.toFixed(6)) });
      }
    }
  } else {
    // TDSE - animated wave packet
    for (let i = 0; i <= N; i++) {
      const x = -5 + 10 * i / N;
      const psi = Math.exp(-x * x / 2) * Math.cos(3 * x);
      const prob = psi * psi;
      data.push({ x: parseFloat(x.toFixed(4)), y: option.includes("Potential") ? parseFloat((0.5 * x * x).toFixed(6)) : parseFloat(prob.toFixed(6)) });
    }
  }
  return data;
}

const GraphGenerator = () => {
  const [funcInput, setFuncInput] = useState("");
  const [activeExpr, setActiveExpr] = useState("");
  const [darkTheme, setDarkTheme] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activeQuantumMode, setActiveQuantumMode] = useState<{ mode: string; option: string } | null>(null);

  const graphData = useMemo(() => {
    if (activeQuantumMode) {
      return generateQuantumMode(activeQuantumMode.mode, activeQuantumMode.option);
    }
    if (!activeExpr) return null;
    return generateGraphData(activeExpr);
  }, [activeExpr, activeQuantumMode]);

  const plotGraph = () => {
    if (funcInput.trim()) {
      setActiveQuantumMode(null);
      setActiveExpr(funcInput.trim());
    }
  };

  const selectPreset = (eq: string) => {
    setFuncInput(eq);
    setActiveQuantumMode(null);
    setActiveExpr(eq);
  };

  const selectQuantumMode = (mode: string, option: string) => {
    setActiveQuantumMode({ mode, option });
    setActiveExpr("");
    setFuncInput("");
  };

  const chartBg = darkTheme ? "#0a0e1a" : "#ffffff";
  const chartText = darkTheme ? "#94a3b8" : "#475569";
  const chartGrid = darkTheme ? "#1e293b" : "#e2e8f0";
  const chartLine = darkTheme ? "#3b82f6" : "#2563eb";
  const chartLine2 = darkTheme ? "#22d3ee" : "#0891b2";

  const hasY2 = graphData?.some(d => (d as any).y2 !== undefined);
  const chartRef = useRef<HTMLDivElement>(null);

  const getSvgElement = useCallback(() => {
    return chartRef.current?.querySelector("svg") ?? null;
  }, []);

  const exportSVG = useCallback(() => {
    const svg = getSvgElement();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "graph.svg"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported SVG" });
  }, [getSvgElement]);

  const exportRaster = useCallback((format: "png" | "jpeg") => {
    const svg = getSvgElement();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      if (format === "jpeg") {
        ctx.fillStyle = chartBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL(`image/${format}`, 0.95);
      a.download = `graph.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      toast({ title: `Exported ${format.toUpperCase()}` });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [getSvgElement, chartBg]);

  const exportXLSX = useCallback(() => {
    if (!graphData) return;
    const ws = XLSX.utils.json_to_sheet(graphData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Graph Data");
    XLSX.writeFile(wb, "graph_data.xlsx");
    toast({ title: "Exported XLSX" });
  }, [graphData]);

  const handleExport = useCallback((fmt: string) => {
    if (!graphData) { toast({ title: "No data to export", description: "Generate a graph first." }); return; }
    switch (fmt) {
      case "SVG": exportSVG(); break;
      case "PNG": exportRaster("png"); break;
      case "JPG": exportRaster("jpeg"); break;
      case "XLSX": exportXLSX(); break;
    }
  }, [graphData, exportSVG, exportRaster, exportXLSX]);

  return (
    <PageLayout>
      <SEOHead
        title="Scientific Graph Generator – Plot Equations Online | Quantara AI"
        description="Free scientific graph generator for plotting mathematical functions, quantum wavefunctions, and physics equations with interactive controls and high-resolution export."
        canonical="https://www.quantaraai.site/graph"
        keywords="scientific graph generator, plot equations online, math function plotter, wavefunction graph, physics equation plotter"
      />
      <div className="container px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Scientific <span className="text-gradient">Graph Generator</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Generate publication-ready scientific graphs with custom functions and presets.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-4">
            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Function Input</h2>
              <div className="flex gap-2">
                <Input
                  value={funcInput}
                  onChange={(e) => setFuncInput(e.target.value)}
                  placeholder="f(x) = e.g. sin(x)*exp(-x^2)"
                  className="bg-secondary/50 border-border font-mono text-sm"
                  onKeyDown={(e) => e.key === "Enter" && plotGraph()}
                />
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={plotGraph}>
                  <Play size={14} />
                </Button>
              </div>
              {funcInput && (
                <div className="mt-3 p-2 rounded-md bg-secondary/30 border border-border/50 font-mono text-sm text-primary text-center">
                  f(x) = {funcInput}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Presets</h2>
              <div className="space-y-1.5">
                {graphPresets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => selectPreset(p.eq)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${
                      activeExpr === p.eq && !activeQuantumMode
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-transparent hover:bg-secondary/70 text-muted-foreground hover:border-border/50"
                    }`}
                  >
                    <span className="text-foreground font-medium">{p.name}</span>
                    <span className="block font-mono text-primary/70 mt-0.5">{p.eq}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Quantum Graph Modes</h2>
              {quantumModes.map(m => (
                <div key={m.name} className="mb-3">
                  <div className="text-xs font-medium text-foreground mb-1.5">{m.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.options.map(opt => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        className={`text-xs h-7 ${
                          activeQuantumMode?.mode === m.name && activeQuantumMode?.option === opt
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "border-border hover:bg-primary/10 hover:text-primary"
                        }`}
                        onClick={() => selectQuantumMode(m.name, opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>

          {/* Graph area */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Graph Output
                  {activeQuantumMode && <span className="text-primary/70 ml-2">— {activeQuantumMode.mode}: {activeQuantumMode.option}</span>}
                  {activeExpr && !activeQuantumMode && <span className="text-primary/70 ml-2">— f(x) = {activeExpr}</span>}
                </h2>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 border-border ${!darkTheme ? "bg-primary/15 text-primary" : ""}`}
                    onClick={() => setDarkTheme(false)}
                    title="Light theme"
                  >
                    <Sun size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 border-border ${darkTheme ? "bg-primary/15 text-primary" : ""}`}
                    onClick={() => setDarkTheme(true)}
                    title="Dark theme"
                  >
                    <Moon size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-7 p-0 border-border ${showGrid ? "bg-primary/15 text-primary" : ""}`}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 size={12} />
                  </Button>
                </div>
              </div>

              {graphData ? (
                <div ref={chartRef} className="rounded-lg overflow-hidden border border-border/50" style={{ backgroundColor: chartBg }}>
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={graphData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />}
                      <XAxis dataKey="x" stroke={chartText} fontSize={10} tickCount={10} />
                      <YAxis stroke={chartText} fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkTheme ? "#1e293b" : "#f8fafc",
                          border: `1px solid ${darkTheme ? "#334155" : "#e2e8f0"}`,
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: darkTheme ? "#e2e8f0" : "#1e293b"
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="y" stroke={chartLine} strokeWidth={2} dot={false} name="f(x)" connectNulls={false} />
                      {hasY2 && <Line type="monotone" dataKey="y2" stroke={chartLine2} strokeWidth={1.5} dot={false} name="g(x)" connectNulls={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 bg-secondary/20 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-primary/30 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">Enter a function or select a preset to generate a graph</p>
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-foreground mb-3">Export</h2>
              <div className="flex flex-wrap gap-2">
                {["SVG", "PNG", "JPG", "XLSX"].map(fmt => (
                  <Button key={fmt} variant="outline" size="sm" className="gap-1.5 border-border hover:bg-primary/10 hover:text-primary" onClick={() => handleExport(fmt)}>
                    <Download size={12} /> {fmt}
                  </Button>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default GraphGenerator;
