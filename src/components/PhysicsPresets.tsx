import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import LinearSolverGraph from "@/components/LinearSolverGraph";
import { ChevronRight } from "lucide-react";

export interface PhysicsPreset {
  name: string;
  equation: string;
  mapping: { y: string; x: string; m: string; c: string };
  mDefault: number;
  cDefault: number;
  xLabel: string;
  yLabel: string;
  explanation: string[];
}

export const physicsPresets: PhysicsPreset[] = [
  {
    name: "y = mx + c (General)",
    equation: "y = mx + c",
    mapping: { y: "y", x: "x", m: "m (slope)", c: "c (y-intercept)" },
    mDefault: 2,
    cDefault: 3,
    xLabel: "x",
    yLabel: "y",
    explanation: [
      "General linear equation form",
      "m is the slope (gradient) — rate of change of y w.r.t. x",
      "c is the y-intercept — value of y when x = 0",
      "To find c: set x = 0 → c = y₀",
      "To find m: m = (y₂ - y₁) / (x₂ - x₁)",
      "Angle with x-axis: θ = arctan(m)",
    ],
  },
  {
    name: "First Equation of Motion",
    equation: "v = u + at",
    mapping: { y: "v (velocity)", x: "t (time)", m: "a (acceleration)", c: "u (initial velocity)" },
    mDefault: 9.8,
    cDefault: 5,
    xLabel: "t (s)",
    yLabel: "v (m/s)",
    explanation: [
      "v = u + at → linear in time t",
      "Compare: y → v, x → t, m → a, c → u",
      "Slope = acceleration (a)",
      "y-intercept = initial velocity (u)",
      "Plot of v vs t gives a straight line",
      "Area under graph = displacement",
    ],
  },
  {
    name: "Ohm's Law",
    equation: "V = IR",
    mapping: { y: "V (voltage)", x: "I (current)", m: "R (resistance)", c: "0" },
    mDefault: 5,
    cDefault: 0,
    xLabel: "I (A)",
    yLabel: "V (V)",
    explanation: [
      "V = IR → linear with constant R",
      "Compare: y → V, x → I, m → R, c → 0",
      "Slope = Resistance (R)",
      "Line passes through origin (c = 0)",
      "Valid for ohmic conductors only",
      "Steeper line = higher resistance",
    ],
  },
  {
    name: "Hooke's Law",
    equation: "F = kx",
    mapping: { y: "F (force)", x: "x (extension)", m: "k (spring constant)", c: "0" },
    mDefault: 50,
    cDefault: 0,
    xLabel: "x (m)",
    yLabel: "F (N)",
    explanation: [
      "F = kx → linear for elastic region",
      "Compare: y → F, x → x, m → k, c → 0",
      "Slope = spring constant k (N/m)",
      "Passes through origin",
      "Valid only within elastic limit",
      "Beyond elastic limit: non-linear (plastic deformation)",
    ],
  },
  {
    name: "Work Done (Constant Force)",
    equation: "W = Fs",
    mapping: { y: "W (work)", x: "s (displacement)", m: "F (force)", c: "0" },
    mDefault: 10,
    cDefault: 0,
    xLabel: "s (m)",
    yLabel: "W (J)",
    explanation: [
      "W = Fs → linear when F is constant",
      "Compare: y → W, x → s, m → F, c → 0",
      "Slope = applied force (F)",
      "Line through origin",
      "Only valid for constant force along displacement",
    ],
  },
  {
    name: "Linear Thermal Expansion",
    equation: "L = L₀ + αL₀T",
    mapping: { y: "L (length)", x: "T (temperature)", m: "αL₀", c: "L₀ (initial length)" },
    mDefault: 0.002,
    cDefault: 1,
    xLabel: "T (°C)",
    yLabel: "L (m)",
    explanation: [
      "L = L₀(1 + αT) = αL₀·T + L₀",
      "Compare: y → L, x → T, m → αL₀, c → L₀",
      "Slope = αL₀ (expansion coefficient × initial length)",
      "y-intercept = initial length L₀ at T = 0",
      "α is the coefficient of linear expansion",
    ],
  },
  {
    name: "Electric Potential (Uniform Field)",
    equation: "V = Ed",
    mapping: { y: "V (potential)", x: "d (distance)", m: "E (field strength)", c: "0" },
    mDefault: 100,
    cDefault: 0,
    xLabel: "d (m)",
    yLabel: "V (V)",
    explanation: [
      "V = Ed → linear in uniform field",
      "Compare: y → V, x → d, m → E, c → 0",
      "Slope = electric field strength E (V/m)",
      "Through origin for uniform field",
      "Only valid in uniform (constant) electric fields",
    ],
  },
  {
    name: "Momentum",
    equation: "p = mv",
    mapping: { y: "p (momentum)", x: "v (velocity)", m: "m (mass)", c: "0" },
    mDefault: 5,
    cDefault: 0,
    xLabel: "v (m/s)",
    yLabel: "p (kg·m/s)",
    explanation: [
      "p = mv → linear when mass is constant",
      "Compare: y → p, x → v, m → mass, c → 0",
      "Slope = mass of object (kg)",
      "Line through origin",
      "Steeper line = heavier object",
    ],
  },
];

const PhysicsPresets = () => {
  const [activePreset, setActivePreset] = useState<PhysicsPreset | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-3">
        {physicsPresets.map((p) => (
          <GlassCard
            key={p.name}
            hover
            className={`cursor-pointer transition-all ${activePreset?.name === p.name ? "ring-1 ring-primary/40" : ""}`}
            onClick={() => setActivePreset(p)}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
            <p className="font-mono text-primary text-sm mb-2">{p.equation}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>y → {p.mapping.y}</div>
              <div>m → {p.mapping.m}</div>
              <div>c → {p.mapping.c}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {activePreset && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-foreground mb-1">{activePreset.name}</h2>
          <p className="font-mono text-primary text-base mb-4">{activePreset.equation}</p>

          {/* Mapping table */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            {Object.entries(activePreset.mapping).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 font-mono">
                <span className="text-muted-foreground">{key} →</span>
                <span className="text-primary">{val}</span>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="space-y-1.5 mb-6">
            {activePreset.explanation.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Graph */}
          <LinearSolverGraph
            m={activePreset.mDefault}
            c={activePreset.cDefault}
            xLabel={activePreset.xLabel}
            yLabel={activePreset.yLabel}
          />
        </GlassCard>
      )}
    </div>
  );
};

export default PhysicsPresets;
