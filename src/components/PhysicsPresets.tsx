import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, Download, BookOpen, Atom, Zap, Flame, Waves as WavesIcon, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  type PhysicsEquation,
  type PhysicsDomain,
  physicsEquations,
  getAllDomains,
  getEquationsByDomain,
  domainColors,
  domainIcons,
} from "@/lib/physicsEquations";
import { exportContainerAsImage } from "@/lib/imageExport";

const domainLucideIcons: Record<PhysicsDomain, React.ReactNode> = {
  "Kinematics": <RotateCcw size={14} />,
  "Waves": <WavesIcon size={14} />,
  "Simple Harmonic Motion": <RotateCcw size={14} />,
  "Electromagnetism": <Zap size={14} />,
  "Thermodynamics": <Flame size={14} />,
  "Quantum Mechanics": <Atom size={14} />,
};

const PhysicsPresets = () => {
  const [activeDomain, setActiveDomain] = useState<PhysicsDomain>("Kinematics");
  const [activeEq, setActiveEq] = useState<PhysicsEquation | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});
  const [showDerivation, setShowDerivation] = useState(false);

  const domains = getAllDomains();
  const equations = getEquationsByDomain(activeDomain);

  const selectEquation = (eq: PhysicsEquation) => {
    setActiveEq(eq);
    setShowDerivation(false);
    const defaults: Record<string, number> = {};
    eq.parameters.forEach(p => { defaults[p.symbol] = p.default; });
    setParams(defaults);
  };

  const graphData = useMemo(() => {
    if (!activeEq) return [];
    const { xVar } = activeEq;
    const points = 200;
    const step = (xVar.max - xVar.min) / points;
    const data: { x: number; y: number }[] = [];
    for (let i = 0; i <= points; i++) {
      const x = xVar.min + i * step;
      const y = activeEq.compute(x, params);
      if (isFinite(y) && !isNaN(y)) {
        data.push({ x: parseFloat(x.toPrecision(6)), y: parseFloat(y.toPrecision(6)) });
      }
    }
    return data;
  }, [activeEq, params]);

  return (
    <div className="space-y-6">
      {/* Domain tabs */}
      <div className="flex flex-wrap gap-2">
        {domains.map(d => (
          <Button
            key={d}
            size="sm"
            variant={activeDomain === d ? "default" : "outline"}
            className={`gap-1.5 text-xs ${activeDomain === d ? "bg-primary text-primary-foreground" : "border-border hover:bg-primary/10 hover:text-primary"}`}
            onClick={() => { setActiveDomain(d); setActiveEq(null); }}
          >
            <span>{domainIcons[d]}</span> {d}
          </Button>
        ))}
      </div>

      {/* Equation cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {equations.map((eq, i) => (
          <motion.div key={eq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard
              hover
              className={`cursor-pointer transition-all h-full ${activeEq?.id === eq.id ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
              onClick={() => selectEquation(eq)}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">{eq.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{eq.domain}</span>
              </div>
              <p className="font-mono text-primary text-sm mb-2">{eq.equation}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{eq.explanation.slice(0, 120)}...</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Active equation detail */}
      <AnimatePresence mode="wait">
        {activeEq && (
          <motion.div key={activeEq.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard glow>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    {domainIcons[activeEq.domain]} {activeEq.domain}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">{activeEq.name}</h2>
                </div>
                <div className="flex gap-2">
                  {["PNG", "JPG"].map(fmt => (
                    <Button key={fmt} variant="outline" size="sm" className="gap-1 text-[10px] h-7 border-border hover:bg-primary/10"
                      onClick={() => exportContainerAsImage("#physics-graph-area", fmt === "JPG" ? "jpeg" : "png", `${activeEq.id}-graph`)}
                    >
                      <Download size={10} /> {fmt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Equation */}
              <div className="font-mono text-lg text-primary mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                {activeEq.equation}
              </div>

              {/* Parameters */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {activeEq.parameters.map(p => (
                  <div key={p.symbol} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{p.name} <span className="font-mono text-primary">({p.symbol})</span></span>
                      <span className="font-mono text-foreground">{params[p.symbol]?.toPrecision(4)} {p.unit}</span>
                    </div>
                    <Slider
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={[params[p.symbol] ?? p.default]}
                      onValueChange={([v]) => setParams(prev => ({ ...prev, [p.symbol]: v }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Graph */}
              <div id="physics-graph-area" className="bg-background/50 rounded-xl p-4 border border-border/30 mb-6">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={graphData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      label={{ value: activeEq.xVar.label, position: "bottom", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      label={{ value: activeEq.yVar.label, angle: -90, position: "insideLeft", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke={domainColors[activeEq.domain]}
                      strokeWidth={2.5}
                      dot={false}
                      animationDuration={600}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" opacity={0.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Key Points */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-primary" /> Key Relationships
                </h3>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {activeEq.keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight size={12} className="text-primary mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Explanation */}
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 mb-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Physical Explanation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeEq.explanation}</p>
              </div>

              {/* Derivation Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 w-full mb-3"
                onClick={() => setShowDerivation(v => !v)}
              >
                <BookOpen size={13} /> {showDerivation ? "Hide" : "Show"} Step-by-Step Derivation
              </Button>

              <AnimatePresence>
                {showDerivation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-lg bg-card/50 border border-primary/20 space-y-2">
                      <h3 className="text-sm font-bold text-foreground mb-3">
                        Derivation of {activeEq.equation}
                      </h3>
                      {activeEq.derivation.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-2.5"
                        >
                          <span className="text-[10px] font-mono text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-muted-foreground font-mono leading-relaxed">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhysicsPresets;
