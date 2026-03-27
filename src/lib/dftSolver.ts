// ═══════════════════════════════════════════════════════════════
// Simplified DFT / Tight-Binding SCF Solver for Silver Clusters
// LCAO-MO approach with LDA exchange-correlation
// ═══════════════════════════════════════════════════════════════

import { multiply, eigs, matrix, identity, add, subtract, norm, zeros, Matrix } from "mathjs";

// ─── Constants (atomic units where convenient, output in eV) ───
const EV_PER_HARTREE = 27.2114;
const BOHR_TO_ANGSTROM = 0.529177;

// Ag tight-binding parameters (s-orbital model, eV)
const AG_ONSITE = -5.3;       // on-site energy (eV)
const AG_HOPPING = -1.2;      // nearest-neighbor hopping (eV)
const AG_CUTOFF = 3.2;        // cutoff distance for hopping (Å)
const AG_LATTICE = 2.89;      // nearest-neighbor distance in Ag (Å)

// ─── Cluster Geometry ───

export interface Atom3D {
  x: number; y: number; z: number;
  element: string;
}

export function generateCluster(n: number): Atom3D[] {
  if (n <= 1) return [{ x: 0, y: 0, z: 0, element: "Ag" }];

  // Build icosahedral-like clusters for magic numbers 13, 55
  // Otherwise use simple cubic packing
  if (n === 13) return icosahedral13();
  if (n === 55) return icosahedral55();
  return simpleCubic(n);
}

function icosahedral13(): Atom3D[] {
  const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, element: "Ag" }];
  const d = AG_LATTICE;
  const phi = (1 + Math.sqrt(5)) / 2;
  // 12 vertices of icosahedron scaled to nearest-neighbor distance
  const scale = d / Math.sqrt(1 + phi * phi);
  const verts = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
    [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1],
  ];
  for (const v of verts) {
    atoms.push({ x: v[0] * scale, y: v[1] * scale, z: v[2] * scale, element: "Ag" });
  }
  return atoms;
}

function icosahedral55(): Atom3D[] {
  // 13-atom core + 42-atom shell
  const core = icosahedral13();
  const atoms = [...core];
  const d = AG_LATTICE * 2;
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = d / Math.sqrt(1 + phi * phi);
  // Second shell: 42 atoms at various positions
  const angles = 42;
  for (let i = 0; i < angles; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / angles);
    const phiAngle = Math.PI * (1 + Math.sqrt(5)) * i;
    atoms.push({
      x: d * Math.sin(theta) * Math.cos(phiAngle),
      y: d * Math.sin(theta) * Math.sin(phiAngle),
      z: d * Math.cos(theta),
      element: "Ag",
    });
  }
  return atoms.slice(0, 55);
}

function simpleCubic(n: number): Atom3D[] {
  const atoms: Atom3D[] = [];
  const side = Math.ceil(Math.cbrt(n));
  const offset = (side - 1) * AG_LATTICE / 2;
  for (let ix = 0; ix < side && atoms.length < n; ix++) {
    for (let iy = 0; iy < side && atoms.length < n; iy++) {
      for (let iz = 0; iz < side && atoms.length < n; iz++) {
        atoms.push({
          x: ix * AG_LATTICE - offset,
          y: iy * AG_LATTICE - offset,
          z: iz * AG_LATTICE - offset,
          element: "Ag",
        });
      }
    }
  }
  return atoms;
}

// ─── Distance helper ───
function dist(a: Atom3D, b: Atom3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// ─── Hamiltonian Construction ───

function buildHamiltonian(
  atoms: Atom3D[],
  density: number[],
  method: "DFT" | "Tight-Binding"
): number[][] {
  const n = atoms.length;
  const H: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    // On-site energy + Hartree-like correction + LDA XC
    const hartree = density[i] * 0.5; // simplified Hartree (Coulomb repulsion)
    const xc = ldaExchangeCorrelation(density[i]); // LDA functional
    H[i][i] = AG_ONSITE + hartree + xc;

    for (let j = i + 1; j < n; j++) {
      const d_ij = dist(atoms[i], atoms[j]);
      if (d_ij < AG_CUTOFF) {
        // Distance-dependent hopping with exponential decay
        const hopping = AG_HOPPING * Math.exp(-(d_ij - AG_LATTICE) / 0.6);
        H[i][j] = hopping;
        H[j][i] = hopping;
      }
    }
  }
  return H;
}

// Simple LDA exchange-correlation (Slater exchange approximation)
function ldaExchangeCorrelation(n_e: number): number {
  if (n_e <= 0) return 0;
  // Slater Xα exchange: εx = -Cx * n^(1/3)
  const Cx = 0.7386; // eV, parameterized for Ag
  return -Cx * Math.pow(Math.abs(n_e), 1 / 3);
}

// ─── Matrix Diagonalization ───

interface EigenResult {
  energies: number[];
  orbitals: number[][];
}

function diagonalize(H: number[][]): EigenResult {
  const n = H.length;
  try {
    const result = eigs(matrix(H));
    // mathjs eigs returns { values, eigenvectors: [{value, vector}] }
    const eigenvectors = result.eigenvectors;

    const pairs: { energy: number; orbital: number[] }[] = [];
    for (const ev of eigenvectors) {
      const e = typeof ev.value === "number" ? ev.value : (ev.value as any).re || 0;
      const vec = (ev.vector as any).toArray ? (ev.vector as any).toArray() : ev.vector;
      const orbital = (vec as any[]).map((v: any) => typeof v === "number" ? v : v.re || 0);
      pairs.push({ energy: e, orbital });
    }

    pairs.sort((a, b) => a.energy - b.energy);
    return {
      energies: pairs.map(p => p.energy),
      orbitals: pairs.map(p => p.orbital),
    };
  } catch {
    // Fallback: return diagonal elements as eigenvalues
    const energies = H.map((row, i) => row[i]).sort((a, b) => a - b);
    const orbitals = Array.from({ length: n }, (_, i) => {
      const v = new Array(n).fill(0);
      v[i] = 1;
      return v;
    });
    return { energies, orbitals };
  }
}

// ─── Density from Orbitals ───

function computeDensity(orbitals: number[][], nElectrons: number, nAtoms: number): number[] {
  const density = new Array(nAtoms).fill(0);
  const nOcc = Math.min(Math.ceil(nElectrons / 2), orbitals.length); // doubly occupied

  for (let k = 0; k < nOcc; k++) {
    const occ = k < nOcc - 1 ? 2 : (nElectrons % 2 === 0 ? 2 : 1);
    for (let i = 0; i < nAtoms; i++) {
      const c = orbitals[k]?.[i] || 0;
      density[i] += occ * c * c;
    }
  }
  return density;
}

// ─── Total Energy ───

function totalEnergy(energies: number[], nElectrons: number): number {
  let E = 0;
  const nOcc = Math.min(Math.ceil(nElectrons / 2), energies.length);
  for (let k = 0; k < nOcc; k++) {
    const occ = k < nOcc - 1 ? 2 : (nElectrons % 2 === 0 ? 2 : 1);
    E += occ * energies[k];
  }
  return E;
}

// ─── Density Mixing ───

function mixDensity(oldDen: number[], newDen: number[], alpha: number): number[] {
  return oldDen.map((o, i) => alpha * newDen[i] + (1 - alpha) * o);
}

// ─── SCF Solver Result ───

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
  densityGrid3D: number[][][]; // volumetric data for 3D visualization
}

export interface SCFProgress {
  iteration: number;
  energy: number;
  deltaE: number;
  converged: boolean;
}

// ─── 3D Density Grid Generator ───

function generate3DDensityGrid(
  atoms: Atom3D[],
  orbitals: number[][],
  orbitalIndex: number,
  gridSize: number = 32
): number[][][] {
  // Determine bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const a of atoms) {
    minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
    minZ = Math.min(minZ, a.z); maxZ = Math.max(maxZ, a.z);
  }

  const pad = 3.0; // Angstroms padding
  minX -= pad; maxX += pad;
  minY -= pad; maxY += pad;
  minZ -= pad; maxZ += pad;

  const orbital = orbitals[orbitalIndex] || orbitals[0];
  const grid: number[][][] = [];

  for (let ix = 0; ix < gridSize; ix++) {
    grid[ix] = [];
    const x = minX + (ix / (gridSize - 1)) * (maxX - minX);
    for (let iy = 0; iy < gridSize; iy++) {
      grid[ix][iy] = [];
      const y = minY + (iy / (gridSize - 1)) * (maxY - minY);
      for (let iz = 0; iz < gridSize; iz++) {
        const z = minZ + (iz / (gridSize - 1)) * (maxZ - minZ);

        // Sum LCAO contributions: ψ(r) = Σ c_i · φ_i(r - R_i)
        let psi = 0;
        for (let a = 0; a < atoms.length; a++) {
          const dx = x - atoms[a].x;
          const dy = y - atoms[a].y;
          const dz = z - atoms[a].z;
          const r2 = dx * dx + dy * dy + dz * dz;
          // Slater-type orbital: φ(r) = N * exp(-ζr)
          const zeta = 1.6; // Slater exponent for Ag 5s
          const r = Math.sqrt(r2);
          const phi = Math.exp(-zeta * r);
          psi += (orbital[a] || 0) * phi;
        }

        grid[ix][iy][iz] = psi; // Store ψ (not |ψ|²) to show orbital sign
      }
    }
  }

  return grid;
}

// ─── Main SCF Solver ───

export function runSCFSolver(
  clusterSize: number,
  method: "DFT" | "Tight-Binding",
  onProgress?: (progress: SCFProgress) => void
): SCFResult {
  const atoms = generateCluster(clusterSize);
  const nAtoms = atoms.length;
  const nElectrons = nAtoms; // 1 valence electron per Ag (5s¹)

  // Initialize uniform density
  let density = new Array(nAtoms).fill(nElectrons / nAtoms);
  const energyHistory: number[] = [];
  const maxIter = 100;
  const convergenceThreshold = 1e-4; // eV
  const mixingParameter = 0.3;

  let prevEnergy = 0;
  let converged = false;
  let finalEigen: EigenResult = { energies: [], orbitals: [] };

  for (let iter = 0; iter < maxIter; iter++) {
    // 1. Build Hamiltonian with current density
    const H = buildHamiltonian(atoms, density, method);

    // 2. Diagonalize: H ψ = ε ψ
    finalEigen = diagonalize(H);

    // 3. Compute new density from occupied orbitals
    const newDensity = computeDensity(finalEigen.orbitals, nElectrons, nAtoms);

    // 4. Compute total energy
    const E = totalEnergy(finalEigen.energies, nElectrons);
    energyHistory.push(E);

    // 5. Check convergence
    const deltaE = Math.abs(E - prevEnergy);
    converged = iter > 0 && deltaE < convergenceThreshold;

    onProgress?.({
      iteration: iter + 1,
      energy: E,
      deltaE,
      converged,
    });

    if (converged) break;

    // 6. Mix density for next iteration
    density = mixDensity(density, newDensity, mixingParameter);
    prevEnergy = E;
  }

  // Determine HOMO/LUMO
  const nOcc = Math.ceil(nElectrons / 2);
  const homoIndex = Math.min(nOcc - 1, finalEigen.energies.length - 1);
  const lumoIndex = Math.min(nOcc, finalEigen.energies.length - 1);
  const fermiEnergy = (finalEigen.energies[homoIndex] + finalEigen.energies[lumoIndex]) / 2;
  const bandGap = finalEigen.energies[lumoIndex] - finalEigen.energies[homoIndex];

  // Generate 3D density grid for HOMO orbital
  const densityGrid3D = generate3DDensityGrid(atoms, finalEigen.orbitals, homoIndex, 24);

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
  };
}

// ─── Generate Density Grid for Specific Orbital ───

export function generateOrbitalGrid(
  atoms: Atom3D[],
  orbitals: number[][],
  orbitalIndex: number,
  gridSize: number = 24
): number[][][] {
  return generate3DDensityGrid(atoms, orbitals, orbitalIndex, gridSize);
}

// ─── DOS Calculation ───

export interface DOSPoint {
  energy: number;
  dos: number;
}

export function computeDOS(energies: number[], sigma: number = 0.15): DOSPoint[] {
  const minE = Math.min(...energies) - 2;
  const maxE = Math.max(...energies) + 2;
  const nPoints = 200;
  const dos: DOSPoint[] = [];

  for (let i = 0; i < nPoints; i++) {
    const E = minE + (i / (nPoints - 1)) * (maxE - minE);
    let d = 0;
    for (const e of energies) {
      // Gaussian broadening
      d += Math.exp(-((E - e) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
    }
    dos.push({ energy: parseFloat(E.toFixed(4)), dos: parseFloat(d.toFixed(6)) });
  }
  return dos;
}

// ─── 1D Density Cut ───

export interface DensityCutPoint {
  position: number;
  density: number;
}

export function compute1DDensityCut(
  grid: number[][][],
  plane: "XY" | "XZ" | "YZ",
  sliceIndex?: number
): DensityCutPoint[] {
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
    val /= size; // average
    points.push({
      position: parseFloat(((i / (size - 1)) * 10 - 5).toFixed(3)),
      density: parseFloat(val.toFixed(6)),
    });
  }
  return points;
}
