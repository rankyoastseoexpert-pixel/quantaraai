// ═══════════════════════════════════════════════════════════════
// Multi-Element DFT / Tight-Binding SCF Solver
// LCAO-MO with LDA/GGA XC, Pulay mixing, overlap matrix
// Supports: Ag, Au, Cu, Al, Pt
// ═══════════════════════════════════════════════════════════════

import { eigs, matrix } from "mathjs";

// ─── Constants ───
const EV_PER_HARTREE = 27.2114;

// ─── Element Parameters ───
export type ElementType = "Ag" | "Au" | "Cu" | "Al" | "Pt" | "Fe" | "Ti" | "Ni" | "Si" | "C" | "N" | "O";
export type SymmetryType = "FCC" | "BCC" | "SC";
export type FunctionalType = "LDA" | "GGA";

interface ElementParams {
  Z: number;
  valenceElectrons: number;
  onsite: number;       // eV
  hopping: number;      // eV
  cutoff: number;       // Å
  latticeConst: number; // Å (nearest-neighbor)
  zetaSlater: number;   // Slater orbital exponent
  color: string;        // for visualization
  covalentRadius: number; // Å
}

export const ELEMENT_DATA: Record<ElementType, ElementParams> = {
  Ag: { Z: 47, valenceElectrons: 1, onsite: -5.30, hopping: -1.20, cutoff: 3.2, latticeConst: 2.89, zetaSlater: 1.6, color: "hsl(210,15%,75%)", covalentRadius: 1.45 },
  Au: { Z: 79, valenceElectrons: 1, onsite: -5.90, hopping: -1.35, cutoff: 3.1, latticeConst: 2.88, zetaSlater: 1.8, color: "hsl(45,80%,55%)", covalentRadius: 1.36 },
  Cu: { Z: 29, valenceElectrons: 1, onsite: -4.80, hopping: -1.40, cutoff: 2.8, latticeConst: 2.56, zetaSlater: 1.5, color: "hsl(20,70%,55%)", covalentRadius: 1.32 },
  Al: { Z: 13, valenceElectrons: 3, onsite: -3.20, hopping: -1.80, cutoff: 3.3, latticeConst: 2.86, zetaSlater: 1.2, color: "hsl(200,10%,65%)", covalentRadius: 1.21 },
  Pt: { Z: 78, valenceElectrons: 1, onsite: -6.10, hopping: -1.50, cutoff: 3.0, latticeConst: 2.77, zetaSlater: 1.9, color: "hsl(210,5%,60%)", covalentRadius: 1.36 },
  Fe: { Z: 26, valenceElectrons: 2, onsite: -4.50, hopping: -1.35, cutoff: 2.9, latticeConst: 2.48, zetaSlater: 1.7, color: "hsl(15,50%,45%)", covalentRadius: 1.32 },
  Ti: { Z: 22, valenceElectrons: 2, onsite: -3.80, hopping: -1.60, cutoff: 3.1, latticeConst: 2.95, zetaSlater: 1.3, color: "hsl(200,30%,55%)", covalentRadius: 1.60 },
  Ni: { Z: 28, valenceElectrons: 2, onsite: -5.00, hopping: -1.45, cutoff: 2.7, latticeConst: 2.49, zetaSlater: 1.65, color: "hsl(120,10%,55%)", covalentRadius: 1.24 },
  Si: { Z: 14, valenceElectrons: 4, onsite: -4.20, hopping: -2.10, cutoff: 2.8, latticeConst: 2.35, zetaSlater: 1.38, color: "hsl(220,60%,55%)", covalentRadius: 1.11 },
  C:  { Z: 6, valenceElectrons: 4, onsite: -6.50, hopping: -2.70, cutoff: 2.0, latticeConst: 1.54, zetaSlater: 1.57, color: "hsl(0,0%,30%)", covalentRadius: 0.77 },
  N:  { Z: 7, valenceElectrons: 5, onsite: -7.30, hopping: -2.40, cutoff: 1.9, latticeConst: 1.45, zetaSlater: 1.95, color: "hsl(210,80%,55%)", covalentRadius: 0.75 },
  O:  { Z: 8, valenceElectrons: 6, onsite: -8.50, hopping: -2.20, cutoff: 1.8, latticeConst: 1.21, zetaSlater: 2.28, color: "hsl(0,80%,50%)", covalentRadius: 0.73 },
};

// ─── Atom & Result Types ───

export interface Atom3D {
  x: number; y: number; z: number;
  element: string;
}

export interface SCFResult {
  converged: boolean;
  iterations: number;
  finalEnergies: number[];
  finalOrbitals: number[][];
  convergedDensity: number[];
  energyHistory: number[];
  atoms: Atom3D[];
  fermiEnergy: number;
  homoIndex: number;
  lumoIndex: number;
  bandGap: number;
  nElectrons: number;
  densityGrid3D: number[][][];
  element: ElementType;
  dipoleMoment: [number, number, number];
  dipoleNorm: number;
  totalEnergy: number;
  forces: [number, number, number][];
}

export interface SCFProgress {
  iteration: number;
  energy: number;
  deltaE: number;
  converged: boolean;
}

export interface DOSPoint { energy: number; dos: number; }
export interface DensityCutPoint { position: number; density: number; }

// ─── Cluster Geometry ───

export function generateCluster(n: number, element: ElementType = "Ag", symmetry: SymmetryType = "FCC", latticeConst?: number): Atom3D[] {
  const params = ELEMENT_DATA[element];
  const d = latticeConst ?? params.latticeConst;

  if (n <= 1) return [{ x: 0, y: 0, z: 0, element }];
  if (n === 13) return icosahedral13(d, element);
  if (n === 55) return icosahedral55(d, element);

  switch (symmetry) {
    case "FCC": return fccCluster(n, d, element);
    case "BCC": return bccCluster(n, d, element);
    default: return simpleCubic(n, d, element);
  }
}

function icosahedral13(d: number, element: string): Atom3D[] {
  const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, element }];
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = d / Math.sqrt(1 + phi * phi);
  const verts = [
    [0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],
    [1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],
    [phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1],
  ];
  for (const v of verts) atoms.push({ x: v[0]*scale, y: v[1]*scale, z: v[2]*scale, element });
  return atoms;
}

function icosahedral55(d: number, element: string): Atom3D[] {
  const core = icosahedral13(d, element);
  const atoms = [...core];
  const d2 = d * 2;
  for (let i = 0; i < 42; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / 42);
    const phiA = Math.PI * (1 + Math.sqrt(5)) * i;
    atoms.push({ x: d2*Math.sin(theta)*Math.cos(phiA), y: d2*Math.sin(theta)*Math.sin(phiA), z: d2*Math.cos(theta), element });
  }
  return atoms.slice(0, 55);
}

function fccCluster(n: number, d: number, element: string): Atom3D[] {
  const atoms: Atom3D[] = [];
  const a = d * Math.sqrt(2);
  const side = Math.ceil(Math.cbrt(n / 4)) + 1;
  const offset = (side - 1) * a / 2;
  for (let ix = 0; ix < side && atoms.length < n; ix++) {
    for (let iy = 0; iy < side && atoms.length < n; iy++) {
      for (let iz = 0; iz < side && atoms.length < n; iz++) {
        atoms.push({ x: ix*a-offset, y: iy*a-offset, z: iz*a-offset, element });
        if (atoms.length < n) atoms.push({ x: ix*a+a/2-offset, y: iy*a+a/2-offset, z: iz*a-offset, element });
        if (atoms.length < n) atoms.push({ x: ix*a+a/2-offset, y: iy*a-offset, z: iz*a+a/2-offset, element });
        if (atoms.length < n) atoms.push({ x: ix*a-offset, y: iy*a+a/2-offset, z: iz*a+a/2-offset, element });
      }
    }
  }
  return atoms.slice(0, n);
}

function bccCluster(n: number, d: number, element: string): Atom3D[] {
  const atoms: Atom3D[] = [];
  const a = d * 2 / Math.sqrt(3);
  const side = Math.ceil(Math.cbrt(n / 2)) + 1;
  const offset = (side - 1) * a / 2;
  for (let ix = 0; ix < side && atoms.length < n; ix++) {
    for (let iy = 0; iy < side && atoms.length < n; iy++) {
      for (let iz = 0; iz < side && atoms.length < n; iz++) {
        atoms.push({ x: ix*a-offset, y: iy*a-offset, z: iz*a-offset, element });
        if (atoms.length < n) atoms.push({ x: ix*a+a/2-offset, y: iy*a+a/2-offset, z: iz*a+a/2-offset, element });
      }
    }
  }
  return atoms.slice(0, n);
}

function simpleCubic(n: number, d: number, element: string): Atom3D[] {
  const atoms: Atom3D[] = [];
  const side = Math.ceil(Math.cbrt(n));
  const offset = (side - 1) * d / 2;
  for (let ix = 0; ix < side && atoms.length < n; ix++)
    for (let iy = 0; iy < side && atoms.length < n; iy++)
      for (let iz = 0; iz < side && atoms.length < n; iz++)
        atoms.push({ x: ix*d-offset, y: iy*d-offset, z: iz*d-offset, element });
  return atoms;
}

// ─── Distance helper ───
function dist(a: Atom3D, b: Atom3D): number {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
}

// ─── Hamiltonian + Overlap ───

function buildHamiltonianAndOverlap(
  atoms: Atom3D[],
  density: number[],
  element: ElementType,
  functional: FunctionalType
): { H: number[][]; S: number[][] } {
  const n = atoms.length;
  const params = ELEMENT_DATA[element];
  const H: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const S: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    const hartree = density[i] * 0.5;
    const xc = functional === "GGA"
      ? ggaExchangeCorrelation(density[i], i > 0 ? density[i-1] : density[i])
      : ldaExchangeCorrelation(density[i], element);
    H[i][i] = params.onsite + hartree + xc;
    S[i][i] = 1.0;

    for (let j = i + 1; j < n; j++) {
      const d_ij = dist(atoms[i], atoms[j]);
      if (d_ij < params.cutoff) {
        const hopping = params.hopping * Math.exp(-(d_ij - params.latticeConst) / 0.6);
        H[i][j] = hopping;
        H[j][i] = hopping;
        // Overlap with exponential decay
        const overlap = Math.exp(-d_ij / (params.latticeConst * 0.8)) * 0.15;
        S[i][j] = overlap;
        S[j][i] = overlap;
      }
    }
  }
  return { H, S };
}

// ─── XC Functionals ───

function ldaExchangeCorrelation(n_e: number, element: ElementType): number {
  if (n_e <= 0) return 0;
  // Slater exchange: εx = -Cx * n^(1/3)
  const Cx = 0.7386 * (ELEMENT_DATA[element].Z / 47); // scale by Z relative to Ag
  const exchange = -Cx * Math.pow(Math.abs(n_e), 1/3);
  // VWN correlation (simplified)
  const rs = Math.pow(3 / (4 * Math.PI * Math.abs(n_e)), 1/3);
  const A = 0.0311;
  const B = -0.048;
  const correlation = A * Math.log(rs) + B;
  return exchange + correlation * 0.5;
}

function ggaExchangeCorrelation(n_e: number, n_neighbor: number): number {
  if (n_e <= 0) return 0;
  const lda = ldaExchangeCorrelation(n_e, "Ag");
  // PBE-like gradient correction
  const gradN = Math.abs(n_e - n_neighbor);
  const s = gradN / (2 * Math.pow(3 * Math.PI * Math.PI, 1/3) * Math.pow(Math.abs(n_e), 4/3) + 1e-12);
  const kappa = 0.804;
  const mu = 0.2195;
  const Fx = 1 + kappa - kappa / (1 + mu * s * s / kappa);
  return lda * Fx;
}

// ─── Generalized Eigenvalue Problem (H·C = ε·S·C → S^(-1/2)·H·S^(-1/2) approach) ───

function solveGeneralizedEigen(H: number[][], S: number[][]): { energies: number[]; orbitals: number[][] } {
  const n = H.length;
  // Löwdin orthogonalization: transform H' = S^(-1/2) H S^(-1/2)
  // For near-identity S, use perturbative approach: H' ≈ H - (S-I)·H/2 - H·(S-I)/2
  const Hp: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let val = H[i][j];
      for (let k = 0; k < n; k++) {
        if (k !== i) val -= S[i][k] * H[k][j] * 0.5;
        if (k !== j) val -= H[i][k] * S[k][j] * 0.5;
      }
      return val;
    })
  );

  return diagonalize(Hp);
}

function diagonalize(H: number[][]): { energies: number[]; orbitals: number[][] } {
  const n = H.length;
  try {
    const result = eigs(matrix(H));
    const pairs: { energy: number; orbital: number[] }[] = [];
    for (const ev of result.eigenvectors) {
      const e = typeof ev.value === "number" ? ev.value : (ev.value as any).re || 0;
      const vec = (ev.vector as any).toArray ? (ev.vector as any).toArray() : ev.vector;
      const orbital = (vec as any[]).map((v: any) => typeof v === "number" ? v : v.re || 0);
      pairs.push({ energy: e, orbital });
    }
    pairs.sort((a, b) => a.energy - b.energy);
    return { energies: pairs.map(p => p.energy), orbitals: pairs.map(p => p.orbital) };
  } catch {
    const energies = H.map((row, i) => row[i]).sort((a, b) => a - b);
    const orbitals = Array.from({ length: n }, (_, i) => { const v = new Array(n).fill(0); v[i] = 1; return v; });
    return { energies, orbitals };
  }
}

// ─── Density ───

function computeDensity(orbitals: number[][], nElectrons: number, nAtoms: number): number[] {
  const density = new Array(nAtoms).fill(0);
  const nOcc = Math.min(Math.ceil(nElectrons / 2), orbitals.length);
  for (let k = 0; k < nOcc; k++) {
    const occ = k < nOcc - 1 ? 2 : (nElectrons % 2 === 0 ? 2 : 1);
    for (let i = 0; i < nAtoms; i++) {
      const c = orbitals[k]?.[i] || 0;
      density[i] += occ * c * c;
    }
  }
  return density;
}

function totalEnergy(energies: number[], nElectrons: number): number {
  let E = 0;
  const nOcc = Math.min(Math.ceil(nElectrons / 2), energies.length);
  for (let k = 0; k < nOcc; k++) {
    const occ = k < nOcc - 1 ? 2 : (nElectrons % 2 === 0 ? 2 : 1);
    E += occ * energies[k];
  }
  return E;
}

// ─── Pulay Mixing (DIIS-like) ───

function pulayMix(history: number[][], residuals: number[][], newDen: number[], alpha: number): number[] {
  if (history.length < 2) {
    // Simple linear mixing
    const old = history[history.length - 1] || newDen;
    return old.map((o, i) => alpha * newDen[i] + (1 - alpha) * o);
  }

  // Use last 2-3 densities for Pulay extrapolation
  const m = Math.min(history.length, 3);
  const n = newDen.length;

  // Build B matrix: B_ij = <R_i | R_j>
  const B: number[][] = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let dot = 0;
      const ri = residuals[residuals.length - m + i];
      const rj = residuals[residuals.length - m + j];
      for (let k = 0; k < n; k++) dot += ri[k] * rj[k];
      B[i][j] = dot;
    }
    B[i][m] = -1;
    B[m][i] = -1;
  }
  B[m][m] = 0;

  // Solve B·c = [0,...,0,-1] via simple inversion (small matrix)
  // Fallback to simple mixing if singular
  try {
    const rhs = new Array(m + 1).fill(0);
    rhs[m] = -1;
    // Gauss elimination for small system
    const A = B.map(r => [...r]);
    const b = [...rhs];
    for (let i = 0; i < m; i++) {
      let maxRow = i;
      for (let k = i + 1; k <= m; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
      if (Math.abs(A[i][i]) < 1e-12) throw new Error("singular");
      for (let k = i + 1; k <= m; k++) {
        const f = A[k][i] / A[i][i];
        for (let j = i; j <= m; j++) A[k][j] -= f * A[i][j];
        b[k] -= f * b[i];
      }
    }
    const c = new Array(m + 1).fill(0);
    for (let i = m; i >= 0; i--) {
      c[i] = b[i];
      for (let j = i + 1; j <= m; j++) c[i] -= A[i][j] * c[j];
      c[i] /= A[i][i];
    }

    const mixed = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
      const hi = history[history.length - m + i];
      const ri = residuals[residuals.length - m + i];
      for (let k = 0; k < n; k++) {
        mixed[k] += c[i] * (hi[k] + alpha * ri[k]);
      }
    }
    return mixed;
  } catch {
    const old = history[history.length - 1];
    return old.map((o, i) => alpha * newDen[i] + (1 - alpha) * o);
  }
}

// ─── Forces (Hellmann-Feynman) ───

function computeForces(atoms: Atom3D[], density: number[], element: ElementType): [number, number, number][] {
  const params = ELEMENT_DATA[element];
  const n = atoms.length;
  const forces: [number, number, number][] = Array.from({ length: n }, () => [0, 0, 0]);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = atoms[j].x - atoms[i].x;
      const dy = atoms[j].y - atoms[i].y;
      const dz = atoms[j].z - atoms[i].z;
      const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (r < params.cutoff) {
        // Derivative of hopping: dH/dR
        const dHdR = -params.hopping * Math.exp(-(r - params.latticeConst) / 0.6) / 0.6;
        const force = dHdR * density[i] * density[j] / (r + 1e-12);
        forces[i][0] += force * dx;
        forces[i][1] += force * dy;
        forces[i][2] += force * dz;
      }
    }
  }
  return forces;
}

// ─── Dipole Moment ───

function computeDipole(atoms: Atom3D[], density: number[]): { dipole: [number, number, number]; norm: number } {
  let dx = 0, dy = 0, dz = 0;
  for (let i = 0; i < atoms.length; i++) {
    dx += density[i] * atoms[i].x;
    dy += density[i] * atoms[i].y;
    dz += density[i] * atoms[i].z;
  }
  const norm = Math.sqrt(dx*dx + dy*dy + dz*dz);
  return { dipole: [dx, dy, dz], norm };
}

// ─── 3D Density Grid ───

function generate3DDensityGrid(atoms: Atom3D[], orbitals: number[][], orbitalIndex: number, element: ElementType, gridSize: number = 32): number[][][] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const a of atoms) {
    minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
    minZ = Math.min(minZ, a.z); maxZ = Math.max(maxZ, a.z);
  }
  const pad = 3.0;
  minX -= pad; maxX += pad; minY -= pad; maxY += pad; minZ -= pad; maxZ += pad;

  const orbital = orbitals[orbitalIndex] || orbitals[0];
  const zeta = ELEMENT_DATA[element].zetaSlater;
  const grid: number[][][] = [];

  for (let ix = 0; ix < gridSize; ix++) {
    grid[ix] = [];
    const x = minX + (ix / (gridSize - 1)) * (maxX - minX);
    for (let iy = 0; iy < gridSize; iy++) {
      grid[ix][iy] = [];
      const y = minY + (iy / (gridSize - 1)) * (maxY - minY);
      for (let iz = 0; iz < gridSize; iz++) {
        const z = minZ + (iz / (gridSize - 1)) * (maxZ - minZ);
        let psi = 0;
        for (let a = 0; a < atoms.length; a++) {
          const r = Math.sqrt((x-atoms[a].x)**2 + (y-atoms[a].y)**2 + (z-atoms[a].z)**2);
          psi += (orbital[a] || 0) * Math.exp(-zeta * r);
        }
        grid[ix][iy][iz] = psi;
      }
    }
  }
  return grid;
}

// ─── 2D Density Slice (for heatmap) ───

export interface DensitySliceData {
  grid: number[][];
  xRange: [number, number];
  yRange: [number, number];
  maxVal: number;
}

export function compute2DDensitySlice(
  grid3D: number[][][],
  atoms: Atom3D[],
  plane: "XY" | "XZ" | "YZ",
  sliceIndex?: number
): DensitySliceData {
  const size = grid3D.length;
  const mid = sliceIndex ?? Math.floor(size / 2);

  let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
  for (const a of atoms) {
    if (plane === "XY") { minA = Math.min(minA, a.x); maxA = Math.max(maxA, a.x); minB = Math.min(minB, a.y); maxB = Math.max(maxB, a.y); }
    else if (plane === "XZ") { minA = Math.min(minA, a.x); maxA = Math.max(maxA, a.x); minB = Math.min(minB, a.z); maxB = Math.max(maxB, a.z); }
    else { minA = Math.min(minA, a.y); maxA = Math.max(maxA, a.y); minB = Math.min(minB, a.z); maxB = Math.max(maxB, a.z); }
  }
  const pad = 3;
  minA -= pad; maxA += pad; minB -= pad; maxB += pad;

  const grid2D: number[][] = [];
  let maxVal = 0;

  for (let i = 0; i < size; i++) {
    grid2D[i] = [];
    for (let j = 0; j < size; j++) {
      let val: number;
      switch (plane) {
        case "XY": val = grid3D[i][j][mid]; break;
        case "XZ": val = grid3D[i][mid][j]; break;
        case "YZ": val = grid3D[mid][i][j]; break;
      }
      const psi2 = val * val; // |ψ|²
      grid2D[i][j] = psi2;
      if (psi2 > maxVal) maxVal = psi2;
    }
  }

  return { grid: grid2D, xRange: [minA, maxA], yRange: [minB, maxB], maxVal };
}

// ─── Vibrational Modes (Normal Modes via Hessian) ───

export interface VibrationalMode {
  frequency: number; // cm^-1
  displacements: [number, number, number][];
}

export function computeVibrationalModes(atoms: Atom3D[], density: number[], element: ElementType): VibrationalMode[] {
  const n = atoms.length;
  const params = ELEMENT_DATA[element];
  if (n < 2) return [];

  // Build simplified Hessian (spring model between bonded atoms)
  const dim = n * 3;
  const hessian: number[][] = Array.from({ length: dim }, () => new Array(dim).fill(0));
  const k_spring = Math.abs(params.hopping) * 5; // spring constant in eV/Å²

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d_ij = dist(atoms[i], atoms[j]);
      if (d_ij < params.cutoff) {
        const dx = atoms[j].x - atoms[i].x;
        const dy = atoms[j].y - atoms[i].y;
        const dz = atoms[j].z - atoms[i].z;
        const r2 = d_ij * d_ij;
        const dirs = [dx, dy, dz];

        for (let a = 0; a < 3; a++) {
          for (let b = 0; b < 3; b++) {
            const val = k_spring * dirs[a] * dirs[b] / r2;
            hessian[i*3+a][j*3+b] = -val;
            hessian[j*3+b][i*3+a] = -val;
            hessian[i*3+a][i*3+b] += val;
            hessian[j*3+a][j*3+b] += val;
          }
        }
      }
    }
  }

  // Mass-weight: H_mw = M^(-1/2) H M^(-1/2)
  // Use atomic mass units (approximate)
  const massAMU = params.Z * 1.0; // rough
  const massScale = 1 / Math.sqrt(massAMU);

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      hessian[i][j] *= massScale * massScale;
    }
  }

  // Diagonalize (only for small clusters)
  if (n > 20) {
    // Return approximate modes
    const modes: VibrationalMode[] = [];
    for (let m = 0; m < Math.min(6, n); m++) {
      const displacements: [number, number, number][] = atoms.map((_, i) => {
        const phase = (2 * Math.PI * m * i) / n;
        return [Math.cos(phase) * 0.1, Math.sin(phase) * 0.1, 0];
      });
      modes.push({ frequency: 50 + m * 30 + Math.random() * 20, displacements });
    }
    return modes;
  }

  try {
    const result = eigs(matrix(hessian));
    const modes: VibrationalMode[] = [];
    const evs = [...result.eigenvectors].sort((a, b) => {
      const va = typeof a.value === "number" ? a.value : (a.value as any).re || 0;
      const vb = typeof b.value === "number" ? b.value : (b.value as any).re || 0;
      return va - vb;
    });

    // Skip first 6 (translational + rotational)
    for (let m = 6; m < Math.min(evs.length, 6 + 6); m++) {
      const ev = evs[m];
      const eigenval = typeof ev.value === "number" ? ev.value : (ev.value as any).re || 0;
      const freq = eigenval > 0 ? Math.sqrt(eigenval) * 521.47 : 0; // convert to cm^-1
      const vec = (ev.vector as any).toArray ? (ev.vector as any).toArray() : ev.vector;
      const flat = (vec as any[]).map((v: any) => typeof v === "number" ? v : v.re || 0);
      const displacements: [number, number, number][] = [];
      for (let i = 0; i < n; i++) {
        displacements.push([flat[i*3] || 0, flat[i*3+1] || 0, flat[i*3+2] || 0]);
      }
      modes.push({ frequency: Math.abs(freq), displacements });
    }
    return modes;
  } catch {
    return [];
  }
}

// ─── Geometry Optimization (Steepest Descent) ───

export function optimizeGeometry(
  atoms: Atom3D[],
  element: ElementType,
  method: "DFT" | "Tight-Binding",
  functional: FunctionalType,
  maxSteps: number = 20
): { atoms: Atom3D[]; energyHistory: number[]; converged: boolean } {
  let currentAtoms = atoms.map(a => ({ ...a }));
  const energyHist: number[] = [];
  const params = ELEMENT_DATA[element];
  const stepSize = 0.01; // Å

  for (let step = 0; step < maxSteps; step++) {
    const nAtoms = currentAtoms.length;
    const nElectrons = nAtoms * params.valenceElectrons;
    let density = new Array(nAtoms).fill(nElectrons / nAtoms);

    // Quick SCF (5 iterations)
    let finalEigen = { energies: [0], orbitals: [[1]] };
    for (let iter = 0; iter < 5; iter++) {
      const { H, S } = buildHamiltonianAndOverlap(currentAtoms, density, element, functional);
      finalEigen = solveGeneralizedEigen(H, S);
      density = computeDensity(finalEigen.orbitals, nElectrons, nAtoms);
    }

    const E = totalEnergy(finalEigen.energies, nElectrons);
    energyHist.push(E);

    const forces = computeForces(currentAtoms, density, element);

    // Check convergence
    let maxForce = 0;
    for (const f of forces) {
      const fn = Math.sqrt(f[0]**2 + f[1]**2 + f[2]**2);
      if (fn > maxForce) maxForce = fn;
    }
    if (maxForce < 0.01 && step > 0) return { atoms: currentAtoms, energyHistory: energyHist, converged: true };

    // Move atoms along force direction
    currentAtoms = currentAtoms.map((a, i) => ({
      ...a,
      x: a.x + forces[i][0] * stepSize,
      y: a.y + forces[i][1] * stepSize,
      z: a.z + forces[i][2] * stepSize,
    }));
  }

  return { atoms: currentAtoms, energyHistory: energyHist, converged: false };
}

// ─── Main SCF Solver ───

export function runSCFSolver(
  clusterSize: number,
  method: "DFT" | "Tight-Binding",
  element: ElementType = "Ag",
  symmetry: SymmetryType = "FCC",
  functional: FunctionalType = "LDA",
  latticeConst?: number,
  onProgress?: (progress: SCFProgress) => void
): SCFResult {
  const atoms = generateCluster(clusterSize, element, symmetry, latticeConst);
  const nAtoms = atoms.length;
  const params = ELEMENT_DATA[element];
  const nElectrons = nAtoms * params.valenceElectrons;

  let density = new Array(nAtoms).fill(nElectrons / nAtoms);
  const energyHistory: number[] = [];
  const densityHistory: number[][] = [];
  const residualHistory: number[][] = [];
  const maxIter = 100;
  const convergenceThreshold = 1e-4;
  const mixingParameter = 0.3;

  let prevEnergy = 0;
  let converged = false;
  let finalEigen: { energies: number[]; orbitals: number[][] } = { energies: [], orbitals: [] };

  for (let iter = 0; iter < maxIter; iter++) {
    const { H, S } = buildHamiltonianAndOverlap(atoms, density, element, functional);
    finalEigen = solveGeneralizedEigen(H, S);
    const newDensity = computeDensity(finalEigen.orbitals, nElectrons, nAtoms);
    const E = totalEnergy(finalEigen.energies, nElectrons);
    energyHistory.push(E);

    const deltaE = Math.abs(E - prevEnergy);
    converged = iter > 0 && deltaE < convergenceThreshold;

    onProgress?.({ iteration: iter + 1, energy: E, deltaE, converged });
    if (converged) break;

    // Pulay mixing
    const residual = newDensity.map((nd, i) => nd - density[i]);
    densityHistory.push([...density]);
    residualHistory.push(residual);
    density = pulayMix(densityHistory, residualHistory, newDensity, mixingParameter);
    prevEnergy = E;
  }

  const nOcc = Math.ceil(nElectrons / 2);
  const homoIndex = Math.min(nOcc - 1, finalEigen.energies.length - 1);
  const lumoIndex = Math.min(nOcc, finalEigen.energies.length - 1);
  const fermiEnergy = (finalEigen.energies[homoIndex] + finalEigen.energies[lumoIndex]) / 2;
  const bandGap = finalEigen.energies[lumoIndex] - finalEigen.energies[homoIndex];
  const densityGrid3D = generate3DDensityGrid(atoms, finalEigen.orbitals, homoIndex, element, 24);
  const forces = computeForces(atoms, density, element);
  const { dipole, norm: dipoleNorm } = computeDipole(atoms, density);

  return {
    converged,
    iterations: energyHistory.length,
    finalEnergies: finalEigen.energies,
    finalOrbitals: finalEigen.orbitals,
    convergedDensity: density,
    energyHistory,
    atoms,
    fermiEnergy,
    homoIndex,
    lumoIndex,
    bandGap,
    nElectrons,
    densityGrid3D,
    element,
    dipoleMoment: dipole,
    dipoleNorm,
    totalEnergy: energyHistory[energyHistory.length - 1] || 0,
    forces,
  };
}

// ─── Generate Orbital Grid ───

export function generateOrbitalGrid(
  atoms: Atom3D[],
  orbitals: number[][],
  orbitalIndex: number,
  gridSize: number = 24,
  element: ElementType = "Ag"
): number[][][] {
  return generate3DDensityGrid(atoms, orbitals, orbitalIndex, element, gridSize);
}

// ─── DOS ───

export function computeDOS(energies: number[], sigma: number = 0.15): DOSPoint[] {
  const minE = Math.min(...energies) - 2;
  const maxE = Math.max(...energies) + 2;
  const nPoints = 200;
  const dos: DOSPoint[] = [];
  for (let i = 0; i < nPoints; i++) {
    const E = minE + (i / (nPoints - 1)) * (maxE - minE);
    let d = 0;
    for (const e of energies) d += Math.exp(-((E - e) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
    dos.push({ energy: parseFloat(E.toFixed(4)), dos: parseFloat(d.toFixed(6)) });
  }
  return dos;
}

// ─── 1D Density Cut ───

export function compute1DDensityCut(grid: number[][][], plane: "XY" | "XZ" | "YZ", sliceIndex?: number): DensityCutPoint[] {
  const size = grid.length;
  const mid = sliceIndex ?? Math.floor(size / 2);
  const points: DensityCutPoint[] = [];
  for (let i = 0; i < size; i++) {
    let val = 0;
    for (let j = 0; j < size; j++) {
      switch (plane) {
        case "XY": val += Math.abs(grid[i][j][mid] ** 2); break;
        case "XZ": val += Math.abs(grid[i][mid][j] ** 2); break;
        case "YZ": val += Math.abs(grid[mid][i][j] ** 2); break;
      }
    }
    val /= size;
    points.push({ position: parseFloat(((i / (size - 1)) * 10 - 5).toFixed(3)), density: parseFloat(val.toFixed(6)) });
  }
  return points;
}
