/**
 * Materials Database for Solid-State Physics Simulations
 * Contains experimentally measured properties for common materials.
 */

export interface MaterialData {
  key: string;
  name: string;
  formula: string;
  icon: string;
  category: "semiconductor" | "semimetal" | "insulator";
  // Crystal structure
  latticeConstant: number;     // Å
  latticeType: "diamond" | "zinc-blende" | "honeycomb";
  // Electronic properties
  bandGap: number;             // eV (at 300K)
  bandGapType: "indirect" | "direct" | "zero";
  effectiveMassElectron: number;  // in units of m_e
  effectiveMassHole: number;      // in units of m_e
  // KP model mapping
  kpV0: number;                // effective barrier height (eV)
  kpWellWidth: number;         // well width a (Å)
  kpBarrierWidth: number;      // barrier width b (Å)
  // Additional
  dielectricConstant: number;
  description: string;
  color: string;               // for UI
}

export const MATERIALS_DB: MaterialData[] = [
  {
    key: "si",
    name: "Silicon",
    formula: "Si",
    icon: "🔷",
    category: "semiconductor",
    latticeConstant: 5.431,
    latticeType: "diamond",
    bandGap: 1.12,
    bandGapType: "indirect",
    effectiveMassElectron: 0.26,
    effectiveMassHole: 0.386,
    kpV0: 4.0,
    kpWellWidth: 3.5,
    kpBarrierWidth: 1.93,
    dielectricConstant: 11.7,
    description: "Most widely used semiconductor. Indirect bandgap of 1.12 eV. Diamond cubic crystal structure with sp³ bonding.",
    color: "#3b82f6",
  },
  {
    key: "ge",
    name: "Germanium",
    formula: "Ge",
    icon: "🟤",
    category: "semiconductor",
    latticeConstant: 5.658,
    latticeType: "diamond",
    bandGap: 0.66,
    bandGapType: "indirect",
    effectiveMassElectron: 0.12,
    effectiveMassHole: 0.33,
    kpV0: 3.2,
    kpWellWidth: 3.8,
    kpBarrierWidth: 1.86,
    dielectricConstant: 16.0,
    description: "Early transistor material. Smaller bandgap than Si (0.66 eV). Higher electron mobility makes it useful for high-speed devices.",
    color: "#a855f7",
  },
  {
    key: "gaas",
    name: "Gallium Arsenide",
    formula: "GaAs",
    icon: "🟣",
    category: "semiconductor",
    latticeConstant: 5.653,
    latticeType: "zinc-blende",
    bandGap: 1.42,
    bandGapType: "direct",
    effectiveMassElectron: 0.067,
    effectiveMassHole: 0.45,
    kpV0: 5.0,
    kpWellWidth: 3.6,
    kpBarrierWidth: 2.05,
    dielectricConstant: 12.9,
    description: "Direct bandgap semiconductor (1.42 eV). Ideal for optoelectronics: LEDs, laser diodes, and solar cells. Zinc-blende structure.",
    color: "#ec4899",
  },
  {
    key: "graphene",
    name: "Graphene",
    formula: "C (2D)",
    icon: "⬡",
    category: "semimetal",
    latticeConstant: 2.46,
    latticeType: "honeycomb",
    bandGap: 0.0,
    bandGapType: "zero",
    effectiveMassElectron: 0.0,
    effectiveMassHole: 0.0,
    kpV0: 2.0,
    kpWellWidth: 1.6,
    kpBarrierWidth: 0.86,
    dielectricConstant: 2.4,
    description: "Zero-gap semimetal with linear dispersion at Dirac points (K, K'). Massless Dirac fermions with Fermi velocity vF ≈ 10⁶ m/s.",
    color: "#10b981",
  },
];

export function getMaterial(key: string): MaterialData | undefined {
  return MATERIALS_DB.find(m => m.key === key);
}
