/**
 * Solid-State Physics Computation Engine
 * Kronig–Penney, Tight-Binding, Lattice, Brillouin Zone, Band Diagram
 */

// ═══════════════════════════════════════════════
// Kronig–Penney Model
// ═══════════════════════════════════════════════

export interface KPParams {
  V0: number;      // Barrier height (eV)
  b: number;       // Barrier width (Å)
  a: number;       // Well width (Å)
  mass: number;    // Effective mass (m_e units)
  numPoints: number;
}

export interface KPBandResult {
  kValues: number[];
  energies: number[][];   // bands[bandIndex][kIndex]
  bandGaps: { lower: number; upper: number; gap: number }[];
}

const HBAR2_OVER_2M = 3.81; // ℏ²/(2m_e) in eV·Å²

export function solveKronigPenney(params: KPParams): KPBandResult {
  const { V0, b, a, mass, numPoints } = params;
  const d = a + b; // lattice constant
  const prefactor = HBAR2_OVER_2M / mass;

  // Sweep energy to find allowed bands via |f(E)| <= 1
  // f(E) = cos(αa)cos(βb) - (α²+β²)/(2αβ) sin(αa)sin(βb)
  const maxE = V0 * 3 + 20;
  const dE = 0.01;
  const energySamples: number[] = [];
  const fValues: number[] = [];

  for (let E = 0.01; E < maxE; E += dE) {
    const alpha = Math.sqrt(E / prefactor);
    let f: number;
    if (E < V0) {
      const beta = Math.sqrt((V0 - E) / prefactor);
      f = Math.cos(alpha * a) * Math.cosh(beta * b) -
        ((alpha * alpha - beta * beta) / (2 * alpha * beta)) * Math.sin(alpha * a) * Math.sinh(beta * b);
    } else {
      const beta = Math.sqrt((E - V0) / prefactor);
      f = Math.cos(alpha * a) * Math.cos(beta * b) -
        ((alpha * alpha + beta * beta) / (2 * alpha * beta)) * Math.sin(alpha * a) * Math.sin(beta * b);
    }
    energySamples.push(E);
    fValues.push(f);
  }

  // Extract band edges where |f| crosses 1
  const bandEdges: number[] = [];
  for (let i = 1; i < fValues.length; i++) {
    const prev = Math.abs(fValues[i - 1]) <= 1;
    const curr = Math.abs(fValues[i]) <= 1;
    if (prev !== curr) {
      bandEdges.push((energySamples[i - 1] + energySamples[i]) / 2);
    }
  }

  // Pair edges into bands
  const bands: { min: number; max: number }[] = [];
  for (let i = 0; i < bandEdges.length - 1; i += 2) {
    bands.push({ min: bandEdges[i], max: bandEdges[i + 1] });
  }
  if (bands.length === 0 && bandEdges.length === 1) {
    bands.push({ min: bandEdges[0], max: bandEdges[0] + 1 });
  }

  // Build E(k) for each band
  const kValues: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    kValues.push(-Math.PI / d + (2 * Math.PI / d) * i / (numPoints - 1));
  }

  const energies: number[][] = [];
  for (const band of bands.slice(0, 8)) {
    const bandEnergies: number[] = [];
    for (const k of kValues) {
      // Find E in [band.min, band.max] where f(E) = cos(kd)
      const target = Math.cos(k * d);
      let bestE = (band.min + band.max) / 2;
      let lo = band.min, hi = band.max;
      for (let iter = 0; iter < 50; iter++) {
        const mid = (lo + hi) / 2;
        const alpha = Math.sqrt(mid / prefactor);
        let f: number;
        if (mid < V0) {
          const beta = Math.sqrt((V0 - mid) / prefactor);
          f = Math.cos(alpha * a) * Math.cosh(beta * b) -
            ((alpha * alpha - beta * beta) / (2 * alpha * beta)) * Math.sin(alpha * a) * Math.sinh(beta * b);
        } else {
          const beta = Math.sqrt((mid - V0) / prefactor);
          f = Math.cos(alpha * a) * Math.cos(beta * b) -
            ((alpha * alpha + beta * beta) / (2 * alpha * beta)) * Math.sin(alpha * a) * Math.sin(beta * b);
        }
        if (f > target) lo = mid; else hi = mid;
        bestE = mid;
      }
      bandEnergies.push(bestE);
    }
    energies.push(bandEnergies);
  }

  // Band gaps
  const bandGaps: { lower: number; upper: number; gap: number }[] = [];
  for (let i = 0; i < bands.length - 1; i++) {
    bandGaps.push({
      lower: bands[i].max,
      upper: bands[i + 1].min,
      gap: bands[i + 1].min - bands[i].max,
    });
  }

  return { kValues, energies, bandGaps };
}

// ═══════════════════════════════════════════════
// Tight-Binding Model
// ═══════════════════════════════════════════════

export interface TBParams {
  t: number;        // hopping parameter (eV)
  epsilon: number;  // on-site energy (eV)
  a: number;        // lattice constant
  N: number;        // number of lattice points
  dimension: "1D" | "2D";
}

export interface TBResult {
  kValues: number[];
  energies: number[];
  dos: { energy: number; density: number }[];
  freeElectron: number[];
}

export function solveTightBinding(params: TBParams): TBResult {
  const { t, epsilon, a, N } = params;
  const kValues: number[] = [];
  const energies: number[] = [];
  const freeElectron: number[] = [];

  for (let i = 0; i < N; i++) {
    const k = -Math.PI / a + (2 * Math.PI / a) * i / (N - 1);
    kValues.push(k);
    if (params.dimension === "1D") {
      energies.push(epsilon - 2 * t * Math.cos(k * a));
    } else {
      // 2D square lattice path: Γ→X→M→Γ
      energies.push(epsilon - 2 * t * (Math.cos(k * a) + Math.cos(k * a * 0.7)));
    }
    // Free electron for comparison
    freeElectron.push(HBAR2_OVER_2M * k * k);
  }

  // DOS via histogram
  const Emin = Math.min(...energies);
  const Emax = Math.max(...energies);
  const nBins = 60;
  const dE = (Emax - Emin) / nBins || 0.1;
  const bins = new Array(nBins).fill(0);
  for (const E of energies) {
    const idx = Math.min(Math.floor((E - Emin) / dE), nBins - 1);
    if (idx >= 0) bins[idx]++;
  }
  const dos = bins.map((count, i) => ({
    energy: Emin + (i + 0.5) * dE,
    density: count / (N * dE),
  }));

  return { kValues, energies, dos, freeElectron };
}

// ═══════════════════════════════════════════════
// Lattice Generation
// ═══════════════════════════════════════════════

export type LatticeType = "square" | "rectangular" | "honeycomb";

export interface LatticePoint {
  x: number;
  y: number;
  sublattice?: "A" | "B";
}

export interface LatticeResult {
  points: LatticePoint[];
  vectors: { a1: [number, number]; a2: [number, number] };
  reciprocal: { b1: [number, number]; b2: [number, number] };
  reciprocalPoints: LatticePoint[];
}

export function generateLattice(type: LatticeType, a: number, b: number, nx: number, ny: number): LatticeResult {
  const points: LatticePoint[] = [];
  let a1: [number, number], a2: [number, number];

  switch (type) {
    case "square":
      a1 = [a, 0]; a2 = [0, a];
      for (let i = -nx; i <= nx; i++)
        for (let j = -ny; j <= ny; j++)
          points.push({ x: i * a, y: j * a });
      break;
    case "rectangular":
      a1 = [a, 0]; a2 = [0, b];
      for (let i = -nx; i <= nx; i++)
        for (let j = -ny; j <= ny; j++)
          points.push({ x: i * a, y: j * b });
      break;
    case "honeycomb":
      a1 = [a, 0]; a2 = [a / 2, a * Math.sqrt(3) / 2];
      for (let i = -nx; i <= nx; i++)
        for (let j = -ny; j <= ny; j++) {
          const x = i * a1[0] + j * a2[0];
          const y = i * a1[1] + j * a2[1];
          points.push({ x, y, sublattice: "A" });
          points.push({ x: x + a / 2, y: y + a * Math.sqrt(3) / 6, sublattice: "B" });
        }
      break;
  }

  // Reciprocal vectors: b_i = 2π (a_j × ẑ) / (a1 × a2)
  const det = a1[0] * a2[1] - a1[1] * a2[0];
  const b1: [number, number] = [2 * Math.PI * a2[1] / det, -2 * Math.PI * a2[0] / det];
  const b2: [number, number] = [-2 * Math.PI * a1[1] / det, 2 * Math.PI * a1[0] / det];

  const reciprocalPoints: LatticePoint[] = [];
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++)
      reciprocalPoints.push({ x: i * b1[0] + j * b2[0], y: i * b1[1] + j * b2[1] });

  return { points, vectors: { a1, a2 }, reciprocal: { b1, b2 }, reciprocalPoints };
}

// ═══════════════════════════════════════════════
// Brillouin Zone
// ═══════════════════════════════════════════════

export interface BZPoint {
  label: string;
  kx: number;
  ky: number;
}

export function getBrillouinZone(type: LatticeType, a: number): {
  vertices: [number, number][];
  symmetryPoints: BZPoint[];
  pathSegments: { from: string; to: string; points: number }[];
} {
  const p = Math.PI / a;

  if (type === "honeycomb") {
    const s3 = Math.sqrt(3);
    const vertices: [number, number][] = [
      [0, 4 * p / (3 * s3)], [2 * p / 3, 2 * p / (3 * s3)],
      [2 * p / 3, -2 * p / (3 * s3)], [0, -4 * p / (3 * s3)],
      [-2 * p / 3, -2 * p / (3 * s3)], [-2 * p / 3, 2 * p / (3 * s3)],
    ];
    return {
      vertices,
      symmetryPoints: [
        { label: "Γ", kx: 0, ky: 0 },
        { label: "K", kx: 2 * p / 3, ky: 2 * p / (3 * s3) },
        { label: "M", kx: 2 * p / 3, ky: 0 },
      ],
      pathSegments: [
        { from: "Γ", to: "K", points: 40 },
        { from: "K", to: "M", points: 30 },
        { from: "M", to: "Γ", points: 40 },
      ],
    };
  }

  // Square/rectangular
  const vertices: [number, number][] = [
    [p, p], [p, -p], [-p, -p], [-p, p],
  ];
  return {
    vertices,
    symmetryPoints: [
      { label: "Γ", kx: 0, ky: 0 },
      { label: "X", kx: p, ky: 0 },
      { label: "M", kx: p, ky: p },
    ],
    pathSegments: [
      { from: "Γ", to: "X", points: 40 },
      { from: "X", to: "M", points: 30 },
      { from: "M", to: "Γ", points: 40 },
    ],
  };
}

// ═══════════════════════════════════════════════
// Energy Band Diagram Tool
// ═══════════════════════════════════════════════

export type MaterialType = "semiconductor" | "metal" | "insulator";

export interface BandDiagramParams {
  effectiveMass: number;
  latticeSpacing: number;
  potentialStrength: number;
  materialType: MaterialType;
  fermiLevel: number;
}

export interface BandDiagramResult {
  kValues: number[];
  conductionBand: number[];
  valenceBand: number[];
  bandGap: number;
  fermiLevel: number;
}

export function computeBandDiagram(params: BandDiagramParams): BandDiagramResult {
  const { effectiveMass, latticeSpacing, potentialStrength, materialType, fermiLevel } = params;
  const N = 200;
  const kMax = Math.PI / latticeSpacing;
  const kValues: number[] = [];
  const conductionBand: number[] = [];
  const valenceBand: number[] = [];

  // Gap determined by material type and potential
  let gap: number;
  switch (materialType) {
    case "metal": gap = 0; break;
    case "semiconductor": gap = potentialStrength * 0.5; break;
    case "insulator": gap = potentialStrength * 2; break;
  }

  for (let i = 0; i < N; i++) {
    const k = -kMax + 2 * kMax * i / (N - 1);
    kValues.push(k);
    const freeE = (HBAR2_OVER_2M / effectiveMass) * k * k;
    valenceBand.push(-gap / 2 - freeE * 0.3);
    conductionBand.push(gap / 2 + freeE);
  }

  return { kValues, conductionBand, valenceBand, bandGap: gap, fermiLevel };
}
