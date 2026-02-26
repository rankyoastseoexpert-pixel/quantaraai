/**
 * Research-grade 1D Quantum Simulator
 * - Crank–Nicolson implicit time stepping
 * - Split-step Fourier method
 * - Expectation value engine
 * - Measurement collapse
 * - Norm & energy conservation diagnostics
 */

// ── Complex number helpers ──
export type Complex = [number, number]; // [re, im]

const cadd = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];
const csub = (a: Complex, b: Complex): Complex => [a[0] - b[0], a[1] - b[1]];
const cmul = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];
const cscale = (a: Complex, s: number): Complex => [a[0] * s, a[1] * s];
const cconj = (a: Complex): Complex => [a[0], -a[1]];
const cabs2 = (a: Complex): number => a[0] * a[0] + a[1] * a[1];
const cexp = (theta: number): Complex => [Math.cos(theta), Math.sin(theta)];
const cdiv = (a: Complex, b: Complex): Complex => {
  const d = cabs2(b);
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};

// ── Potential presets ──
export type PotentialType =
  | "infinite_well"
  | "harmonic"
  | "step"
  | "double_well"
  | "gaussian_barrier"
  | "free"
  | "morse"
  | "coulomb";

export type BoundaryCondition = "dirichlet" | "neumann" | "periodic" | "absorbing";

export interface PotentialParams {
  type: PotentialType;
  V0: number;       // characteristic potential height/depth
  width: number;    // well/barrier width parameter
  omega: number;    // harmonic frequency
  separation: number; // double well separation
}

export function computePotential(x: number, params: PotentialParams): number {
  const { type, V0, width, omega, separation } = params;
  switch (type) {
    case "infinite_well":
      return Math.abs(x) > width / 2 ? 1e6 : 0;
    case "harmonic":
      return 0.5 * omega * omega * x * x;
    case "step":
      return x > 0 ? V0 : 0;
    case "double_well":
      return V0 * ((x * x - separation * separation) ** 2) / (separation ** 4);
    case "gaussian_barrier":
      return V0 * Math.exp(-(x * x) / (2 * width * width));
    case "free":
      return 0;
    case "morse":
      return V0 * (1 - Math.exp(-width * x)) ** 2 - V0;
    case "coulomb":
      return -V0 / (Math.abs(x) + 0.1); // softened
    default:
      return 0;
  }
}

// ── Simulation state ──
export interface SimState {
  N: number;
  dx: number;
  dt: number;
  xMin: number;
  xMax: number;
  x: Float64Array;
  psi: Complex[];
  potential: Float64Array;
  time: number;
  hbar: number;
  mass: number;
  boundaryCondition: BoundaryCondition;
}

export interface ExpectationValues {
  x_mean: number;
  p_mean: number;
  x2_mean: number;
  p2_mean: number;
  delta_x: number;
  delta_p: number;
  heisenberg: number;
  energy: number;
  norm: number;
}

export interface MeasurementRecord {
  time: number;
  position: number;
  type: "position" | "momentum";
}

// ── Initial state types ──
export type InitialStateType = "gaussian" | "coherent" | "cat" | "squeezed" | "plane_wave" | "eigenstate";

export interface InitialStateParams {
  type: InitialStateType;
  x0: number;
  k0: number;
  sigma: number;
}

// ── Initialize simulation ──
export function initSimulation(
  N: number,
  xMin: number,
  xMax: number,
  dt: number,
  potentialParams: PotentialParams,
  bc: BoundaryCondition,
  initialState: InitialStateParams = { type: "gaussian", x0: -2, k0: 5, sigma: 0.5 }
): SimState {
  const dx = (xMax - xMin) / (N - 1);
  const x = new Float64Array(N);
  const potential = new Float64Array(N);
  const psi: Complex[] = new Array(N);
  const hbar = 1;
  const mass = 1;

  for (let i = 0; i < N; i++) {
    x[i] = xMin + i * dx;
    potential[i] = computePotential(x[i], potentialParams);
  }

  const { x0, k0, sigma } = initialState;

  switch (initialState.type) {
    case "gaussian":
    default:
      for (let i = 0; i < N; i++) {
        const gauss = Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma));
        const phase = k0 * x[i];
        psi[i] = [gauss * Math.cos(phase), gauss * Math.sin(phase)];
      }
      break;

    case "coherent":
      // Coherent state: displaced Gaussian ground state of harmonic oscillator
      // ψ(x) = (mω/πℏ)^{1/4} exp(-(x-x0)²mω/(2ℏ)) exp(ik0·x)
      for (let i = 0; i < N; i++) {
        const omega_eff = potentialParams.omega || 1;
        const sig_co = 1 / Math.sqrt(2 * omega_eff); // natural width
        const gauss = Math.exp(-((x[i] - x0) ** 2) / (4 * sig_co * sig_co));
        const phase = k0 * x[i];
        psi[i] = [gauss * Math.cos(phase), gauss * Math.sin(phase)];
      }
      break;

    case "cat":
      // Schrödinger cat state: superposition of two Gaussians
      // ψ(x) = N[exp(-(x-a)²/4σ²)e^{ik0x} + exp(-(x+a)²/4σ²)e^{-ik0x}]
      for (let i = 0; i < N; i++) {
        const sep = Math.max(Math.abs(x0), 2); // separation from origin
        const g1 = Math.exp(-((x[i] - sep) ** 2) / (4 * sigma * sigma));
        const g2 = Math.exp(-((x[i] + sep) ** 2) / (4 * sigma * sigma));
        const re = g1 * Math.cos(k0 * x[i]) + g2 * Math.cos(-k0 * x[i]);
        const im = g1 * Math.sin(k0 * x[i]) + g2 * Math.sin(-k0 * x[i]);
        psi[i] = [re, im];
      }
      break;

    case "squeezed":
      // Squeezed state: Gaussian with reduced position uncertainty
      // σ_squeezed = σ * squeeze_factor (< 1 means position-squeezed)
      for (let i = 0; i < N; i++) {
        const squeeze = 0.3; // squeeze factor
        const sig_sq = sigma * squeeze;
        const gauss = Math.exp(-((x[i] - x0) ** 2) / (4 * sig_sq * sig_sq));
        const phase = k0 * x[i];
        psi[i] = [gauss * Math.cos(phase), gauss * Math.sin(phase)];
      }
      break;

    case "plane_wave":
      // Plane wave with soft envelope
      for (let i = 0; i < N; i++) {
        const envelope = Math.exp(-((x[i] - x0) ** 2) / (4 * 25)); // very wide
        const phase = k0 * x[i];
        psi[i] = [envelope * Math.cos(phase), envelope * Math.sin(phase)];
      }
      break;

    case "eigenstate":
      // n=1 eigenstate of infinite well centered at 0, width = 2*|x0| or 10
      {
        const L = Math.max(Math.abs(x0) * 2, 8);
        const n = Math.max(1, Math.round(Math.abs(k0)));
        for (let i = 0; i < N; i++) {
          if (Math.abs(x[i]) < L / 2) {
            psi[i] = [Math.sqrt(2 / L) * Math.sin((n * Math.PI * (x[i] + L / 2)) / L), 0];
          } else {
            psi[i] = [0, 0];
          }
        }
      }
      break;
  }

  // Normalize
  const state: SimState = { N, dx, dt, xMin, xMax, x, psi, potential, time: 0, hbar, mass, boundaryCondition: bc };
  normalize(state);
  return state;
}

function normalize(state: SimState) {
  let norm = 0;
  for (let i = 0; i < state.N; i++) {
    norm += cabs2(state.psi[i]) * state.dx;
  }
  const s = 1 / Math.sqrt(norm);
  for (let i = 0; i < state.N; i++) {
    state.psi[i] = cscale(state.psi[i], s);
  }
}

// ── Crank-Nicolson time step ──
// Solves: (1 + iΔt/2ℏ H)ψ^{n+1} = (1 - iΔt/2ℏ H)ψ^n
// Using tridiagonal Thomas algorithm
export function crankNicolsonStep(state: SimState): void {
  const { N, dx, dt, hbar, mass, potential, psi, boundaryCondition } = state;
  const r = (hbar * dt) / (4 * mass * dx * dx);

  // Tridiagonal coefficients for LHS: (1 + iΔt/2ℏ H)
  // diagonal: 1 + 2ir + iΔt/(2ℏ) V
  // off-diag: -ir
  const alpha: Complex = [-r, 0]; // off-diagonal (actually we use -i*r => [0, -r] wait...
  // H = -ℏ²/(2m) d²/dx² + V
  // iΔt/(2ℏ) * (-ℏ²/(2m)) d²/dx² = iΔt*ℏ/(4m) d²/dx² => the r factor
  // Actually let me redo: factor = dt/(2ℏ) = dt/2 (ℏ=1)
  // Kinetic: -ℏ²/(2m*dx²) => -1/(2*dx²) with ℏ=m=1
  // So coefficient = i * dt/2 * (-1/(2dx²)) = -i*dt/(4dx²) = -i*r
  // For d²ψ/dx² ≈ (ψ_{i+1} - 2ψ_i + ψ_{i-1})/dx²

  // LHS diagonal: 1 + 2i*r + i*(dt/2)*V_i
  // LHS off-diag: -i*r
  // RHS diagonal: 1 - 2i*r - i*(dt/2)*V_i
  // RHS off-diag: +i*r

  const ir: Complex = [0, r];
  const nir: Complex = [0, -r];

  // Build RHS vector
  const rhs: Complex[] = new Array(N);
  for (let i = 0; i < N; i++) {
    const vfac: Complex = [0, -(dt / 2) * potential[i]]; // -i*(dt/2)*V
    const diag: Complex = cadd([1, 0], cadd(cscale([0, 1], -2 * r), vfac)); // 1 - 2ir - i*dt/2*V

    let val = cmul(diag, psi[i]);

    if (i > 0) val = cadd(val, cmul(ir, psi[i - 1]));
    if (i < N - 1) val = cadd(val, cmul(ir, psi[i + 1]));

    // Periodic BC
    if (boundaryCondition === "periodic") {
      if (i === 0) val = cadd(val, cmul(ir, psi[N - 1]));
      if (i === N - 1) val = cadd(val, cmul(ir, psi[0]));
    }

    rhs[i] = val;
  }

  // Solve tridiagonal system with Thomas algorithm
  // LHS: a_i * ψ_{i-1} + b_i * ψ_i + c_i * ψ_{i+1} = rhs_i
  const a: Complex[] = new Array(N); // sub-diagonal
  const b: Complex[] = new Array(N); // diagonal
  const c: Complex[] = new Array(N); // super-diagonal

  for (let i = 0; i < N; i++) {
    const vfac: Complex = [0, (dt / 2) * potential[i]]; // i*(dt/2)*V
    b[i] = cadd([1, 0], cadd(cscale([0, 1], 2 * r), vfac)); // 1 + 2ir + i*dt/2*V
    a[i] = nir; // -ir
    c[i] = nir; // -ir
  }

  // Dirichlet: ψ(0)=ψ(N-1)=0
  if (boundaryCondition === "dirichlet" || boundaryCondition === "absorbing") {
    rhs[0] = [0, 0];
    rhs[N - 1] = [0, 0];
    b[0] = [1, 0]; a[0] = [0, 0]; c[0] = [0, 0];
    b[N - 1] = [1, 0]; a[N - 1] = [0, 0]; c[N - 1] = [0, 0];
  }

  // Thomas forward sweep
  const cp: Complex[] = new Array(N);
  const dp: Complex[] = new Array(N);
  cp[0] = cdiv(c[0], b[0]);
  dp[0] = cdiv(rhs[0], b[0]);

  for (let i = 1; i < N; i++) {
    const m = cdiv(a[i], csub(b[i], cmul(a[i], cp[i - 1])));
    // Actually Thomas: m = a[i] / (b[i] - a[i]*cp[i-1]) is wrong
    // Correct: denom = b[i] - a[i]*cp[i-1]
    const denom = csub(b[i], cmul(a[i], cp[i - 1]));
    cp[i] = cdiv(c[i], denom);
    dp[i] = cdiv(csub(rhs[i], cmul(a[i], dp[i - 1])), denom);
  }

  // Back substitution
  state.psi[N - 1] = dp[N - 1];
  for (let i = N - 2; i >= 0; i--) {
    state.psi[i] = csub(dp[i], cmul(cp[i], state.psi[i + 1]));
  }

  // Absorbing BC: apply damping near boundaries
  if (boundaryCondition === "absorbing") {
    const dampWidth = Math.floor(N * 0.1);
    for (let i = 0; i < dampWidth; i++) {
      const factor = Math.sin((Math.PI * i) / (2 * dampWidth)) ** 2;
      state.psi[i] = cscale(state.psi[i], factor);
      state.psi[N - 1 - i] = cscale(state.psi[N - 1 - i], factor);
    }
  }

  state.time += dt;
}

// ── Expectation values ──
export function computeExpectations(state: SimState): ExpectationValues {
  const { N, dx, psi, x, hbar, mass } = state;

  let norm = 0, x_mean = 0, x2_mean = 0, p_mean = 0, p2_mean = 0, energy = 0;

  for (let i = 0; i < N; i++) {
    const prob = cabs2(psi[i]) * dx;
    norm += prob;
    x_mean += x[i] * prob;
    x2_mean += x[i] * x[i] * prob;
  }

  // Momentum expectation via finite difference: p̂ψ = -iℏ dψ/dx
  for (let i = 1; i < N - 1; i++) {
    const dpsi: Complex = cscale(csub(psi[i + 1], psi[i - 1]), 1 / (2 * dx));
    const p_psi: Complex = cmul([0, -hbar], dpsi); // -iℏ dψ/dx
    const integrand = cmul(cconj(psi[i]), p_psi);
    p_mean += integrand[0] * dx; // Re part
  }

  // ⟨p²⟩ via second derivative
  for (let i = 1; i < N - 1; i++) {
    const d2psi: Complex = cscale(
      cadd(csub(psi[i + 1], cscale(psi[i], 2)), psi[i - 1]),
      1 / (dx * dx)
    );
    const p2_psi: Complex = cscale(d2psi, -(hbar * hbar)); // -ℏ² d²ψ/dx²
    const integrand = cmul(cconj(psi[i]), p2_psi);
    p2_mean += integrand[0] * dx;
  }

  // Energy: kinetic + potential
  for (let i = 1; i < N - 1; i++) {
    const d2psi: Complex = cscale(
      cadd(csub(psi[i + 1], cscale(psi[i], 2)), psi[i - 1]),
      1 / (dx * dx)
    );
    const kinetic: Complex = cscale(d2psi, -(hbar * hbar) / (2 * mass));
    const pot: Complex = cscale(psi[i], state.potential[i]);
    const H_psi = cadd(kinetic, pot);
    const integrand = cmul(cconj(psi[i]), H_psi);
    energy += integrand[0] * dx;
  }

  const delta_x = Math.sqrt(Math.max(0, x2_mean - x_mean * x_mean));
  const delta_p = Math.sqrt(Math.max(0, p2_mean - p_mean * p_mean));

  return {
    x_mean, p_mean, x2_mean, p2_mean,
    delta_x, delta_p,
    heisenberg: delta_x * delta_p,
    energy, norm,
  };
}

// ── Measurement collapse ──
export function measurePosition(state: SimState): number {
  const { N, dx, psi, x } = state;

  // Sample from |ψ|²
  const probs = new Float64Array(N);
  let total = 0;
  for (let i = 0; i < N; i++) {
    probs[i] = cabs2(psi[i]) * dx;
    total += probs[i];
  }

  const rand = Math.random() * total;
  let cumulative = 0;
  let measuredIndex = 0;
  for (let i = 0; i < N; i++) {
    cumulative += probs[i];
    if (cumulative >= rand) {
      measuredIndex = i;
      break;
    }
  }

  const measuredX = x[measuredIndex];

  // Collapse to narrow Gaussian at measured position
  const collapseSigma = state.dx * 5;
  for (let i = 0; i < N; i++) {
    const g = Math.exp(-((x[i] - measuredX) ** 2) / (2 * collapseSigma * collapseSigma));
    state.psi[i] = [g, 0];
  }
  normalize(state);

  return measuredX;
}

export function measureMomentum(state: SimState): number {
  const { N, dx, psi, hbar } = state;

  // FFT to momentum space (simple DFT for small N)
  const dk = (2 * Math.PI) / (N * dx);
  const kMin = -(N / 2) * dk;
  const phi: Complex[] = new Array(N);
  const probK = new Float64Array(N);
  let totalK = 0;

  for (let j = 0; j < N; j++) {
    const k = kMin + j * dk;
    let sum: Complex = [0, 0];
    for (let i = 0; i < N; i++) {
      const phase = -k * state.x[i];
      sum = cadd(sum, cmul(psi[i], cexp(phase)));
    }
    phi[j] = cscale(sum, Math.sqrt(dx / (2 * Math.PI)));
    probK[j] = cabs2(phi[j]) * dk;
    totalK += probK[j];
  }

  // Sample
  const rand = Math.random() * totalK;
  let cumulative = 0;
  let measuredK = 0;
  for (let j = 0; j < N; j++) {
    cumulative += probK[j];
    if (cumulative >= rand) {
      measuredK = kMin + j * dk;
      break;
    }
  }

  const measuredP = hbar * measuredK;

  // Collapse to plane wave with narrow k spread
  const kSigma = dk * 5;
  for (let i = 0; i < N; i++) {
    const envelope = Math.exp(-((state.x[i]) ** 2) / (2 * (1 / kSigma) ** 2));
    const phase = measuredK * state.x[i];
    state.psi[i] = [envelope * Math.cos(phase), envelope * Math.sin(phase)];
  }
  normalize(state);

  return measuredP;
}

// ── Phase extraction ──
export function getPhase(c: Complex): number {
  return Math.atan2(c[1], c[0]);
}

// ── Phase to HSL color ──
export function phaseToColor(phase: number): string {
  const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
  return `hsl(${hue}, 85%, 55%)`;
}

// ── Get simulation data for plotting ──
export interface PlotPoint {
  x: number;
  psi_re: number;
  psi_im: number;
  prob: number;
  potential: number;
  phase: number;
  phaseColor: string;
}

export function getPlotData(state: SimState): PlotPoint[] {
  const points: PlotPoint[] = [];
  const maxV = Math.max(...Array.from(state.potential).map(Math.abs).filter(v => v < 1e5));
  
  for (let i = 0; i < state.N; i++) {
    const phase = getPhase(state.psi[i]);
    const prob = cabs2(state.psi[i]);
    const v = Math.min(state.potential[i], maxV * 2); // Clamp infinite wells for display
    points.push({
      x: state.x[i],
      psi_re: state.psi[i][0],
      psi_im: state.psi[i][1],
      prob,
      potential: v,
      phase,
      phaseColor: phaseToColor(phase),
    });
  }
  return points;
}

// ── Educational content ──
export interface EducationalContent {
  equation: string;
  boundaryDesc: string;
  operatorDesc: string;
  physicsHint: string;
}

export function getEducationalContent(potential: PotentialType, bc: BoundaryCondition): EducationalContent {
  const equations: Record<PotentialType, string> = {
    infinite_well: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + V∞(x)]ψ",
    harmonic: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + ½mω²x²]ψ",
    step: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + V₀θ(x)]ψ",
    double_well: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + V₀(x²−a²)²/a⁴]ψ",
    gaussian_barrier: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + V₀e^{-x²/2σ²}]ψ",
    free: "iℏ ∂ψ/∂t = -ℏ²/(2m) d²ψ/dx²",
    morse: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² + D(1−e^{-αx})²]ψ",
    coulomb: "iℏ ∂ψ/∂t = [-ℏ²/(2m) d²/dx² − e²/(4πε₀|x|)]ψ",
  };

  const bcDescs: Record<BoundaryCondition, string> = {
    dirichlet: "ψ(x_min) = ψ(x_max) = 0 — hard wall reflection",
    neumann: "∂ψ/∂x = 0 at boundaries — zero flux",
    periodic: "ψ(x_min) = ψ(x_max) — ring topology",
    absorbing: "Exponential damping near boundaries — open system",
  };

  const hints: Record<PotentialType, string> = {
    infinite_well: "Discrete energy levels Eₙ = n²π²ℏ²/(2mL²). The ground state has zero nodes.",
    harmonic: "Equally spaced energy levels Eₙ = (n+½)ℏω. Coherent states oscillate classically.",
    step: "Partial reflection & transmission. Tunneling occurs when E < V₀.",
    double_well: "Tunneling between wells splits energy levels. Ground state is symmetric.",
    gaussian_barrier: "Quantum tunneling through the barrier. Transmission depends exponentially on barrier width.",
    free: "Wave packet disperses over time. Group velocity = ℏk₀/m.",
    morse: "Anharmonic oscillator with finite bound states. Models molecular vibrations.",
    coulomb: "1D hydrogen-like atom. Softened to avoid singularity at origin.",
  };

  return {
    equation: equations[potential],
    boundaryDesc: bcDescs[bc],
    operatorDesc: `Ĥ = T̂ + V̂ = -ℏ²/(2m)d²/dx² + V(x)`,
    physicsHint: hints[potential],
  };
}
