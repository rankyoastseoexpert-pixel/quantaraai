/**
 * Comprehensive Physics Equations Library
 * Covers: Kinematics, Waves, SHM, Electromagnetism, Thermodynamics, Quantum Mechanics
 */

export type PhysicsDomain =
  | "Kinematics"
  | "Waves"
  | "Simple Harmonic Motion"
  | "Electromagnetism"
  | "Thermodynamics"
  | "Quantum Mechanics";

export interface PhysicsEquation {
  id: string;
  name: string;
  domain: PhysicsDomain;
  equation: string;
  /** LaTeX-like readable form */
  latexForm: string;
  /** Parameters for interactive graph */
  parameters: {
    name: string;
    symbol: string;
    default: number;
    min: number;
    max: number;
    step: number;
    unit: string;
  }[];
  /** Independent variable for x-axis */
  xVar: { symbol: string; label: string; min: number; max: number };
  /** Dependent variable for y-axis */
  yVar: { symbol: string; label: string };
  /** Function to compute y given x and params */
  compute: (x: number, params: Record<string, number>) => number;
  /** Step-by-step derivation */
  derivation: string[];
  /** Physical explanation */
  explanation: string;
  /** Key relationships */
  keyPoints: string[];
}

export const domainColors: Record<PhysicsDomain, string> = {
  "Kinematics": "hsl(200, 90%, 60%)",
  "Waves": "hsl(280, 80%, 65%)",
  "Simple Harmonic Motion": "hsl(160, 80%, 50%)",
  "Electromagnetism": "hsl(45, 95%, 55%)",
  "Thermodynamics": "hsl(10, 85%, 60%)",
  "Quantum Mechanics": "hsl(320, 75%, 60%)",
};

export const domainIcons: Record<PhysicsDomain, string> = {
  "Kinematics": "🚀",
  "Waves": "🌊",
  "Simple Harmonic Motion": "🔄",
  "Electromagnetism": "⚡",
  "Thermodynamics": "🔥",
  "Quantum Mechanics": "⚛️",
};

export const physicsEquations: PhysicsEquation[] = [
  // ─── KINEMATICS ─────────────────────────────────────────
  {
    id: "suvat-1",
    name: "First Equation of Motion",
    domain: "Kinematics",
    equation: "v = u + at",
    latexForm: "v = u + at",
    parameters: [
      { name: "Initial velocity", symbol: "u", default: 5, min: 0, max: 50, step: 1, unit: "m/s" },
      { name: "Acceleration", symbol: "a", default: 9.8, min: -20, max: 20, step: 0.1, unit: "m/s²" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "v", label: "Velocity (m/s)" },
    compute: (t, p) => p.u + p.a * t,
    derivation: [
      "Start from the definition of acceleration:",
      "a = dv/dt  →  dv = a · dt",
      "Integrate both sides with limits:",
      "∫ᵤᵛ dv = ∫₀ᵗ a dt",
      "v - u = at  (for constant acceleration)",
      "∴ v = u + at",
      "This is a linear function of time t.",
      "Slope = acceleration (a)",
      "y-intercept = initial velocity (u)",
    ],
    explanation: "The first equation of motion relates velocity to time under constant acceleration. It's derived directly from integrating the definition of acceleration. The graph is a straight line where the slope gives acceleration and the y-intercept gives the initial velocity.",
    keyPoints: [
      "Linear relationship: v ∝ t",
      "Slope of v-t graph = acceleration",
      "Area under v-t graph = displacement",
      "Valid only for constant acceleration",
    ],
  },
  {
    id: "suvat-2",
    name: "Second Equation of Motion",
    domain: "Kinematics",
    equation: "s = ut + ½at²",
    latexForm: "s = ut + \\frac{1}{2}at^2",
    parameters: [
      { name: "Initial velocity", symbol: "u", default: 0, min: 0, max: 50, step: 1, unit: "m/s" },
      { name: "Acceleration", symbol: "a", default: 9.8, min: -20, max: 20, step: 0.1, unit: "m/s²" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "s", label: "Displacement (m)" },
    compute: (t, p) => p.u * t + 0.5 * p.a * t * t,
    derivation: [
      "From v = u + at, we know v = ds/dt",
      "ds/dt = u + at",
      "Integrate both sides w.r.t. t:",
      "∫₀ˢ ds = ∫₀ᵗ (u + at) dt",
      "s = ut + ½at²",
      "This is a quadratic (parabolic) function of t.",
      "At t = 0: s = 0 (assuming displacement starts from origin)",
      "The vertex of the parabola represents the turning point (if a < 0).",
    ],
    explanation: "The second SUVAT equation gives displacement as a function of time. It's obtained by integrating velocity over time. The parabolic shape reflects the quadratic dependence on time due to constant acceleration.",
    keyPoints: [
      "Quadratic: s ∝ t²",
      "Parabolic graph (concave up if a > 0)",
      "Gradient of s-t graph = instantaneous velocity",
      "Second derivative = acceleration",
    ],
  },
  {
    id: "suvat-3",
    name: "Third Equation of Motion",
    domain: "Kinematics",
    equation: "v² = u² + 2as",
    latexForm: "v^2 = u^2 + 2as",
    parameters: [
      { name: "Initial velocity", symbol: "u", default: 0, min: 0, max: 50, step: 1, unit: "m/s" },
      { name: "Acceleration", symbol: "a", default: 9.8, min: -20, max: 20, step: 0.1, unit: "m/s²" },
    ],
    xVar: { symbol: "s", label: "Displacement (m)", min: 0, max: 100 },
    yVar: { symbol: "v²", label: "v² (m²/s²)" },
    compute: (s, p) => p.u * p.u + 2 * p.a * s,
    derivation: [
      "From v = u + at  →  t = (v - u)/a",
      "Substitute into s = ut + ½at²:",
      "s = u·(v-u)/a + ½a·((v-u)/a)²",
      "s = u(v-u)/a + (v-u)²/(2a)",
      "2as = 2u(v-u) + (v-u)²",
      "2as = 2uv - 2u² + v² - 2uv + u²",
      "2as = v² - u²",
      "∴ v² = u² + 2as",
      "This eliminates time from the equations of motion.",
    ],
    explanation: "The third equation of motion connects velocity to displacement without involving time. It's derived by eliminating t between the first two equations. The v² vs s graph is linear with slope = 2a.",
    keyPoints: [
      "Time-independent equation",
      "v² vs s is linear (slope = 2a)",
      "Useful for finding final speed given distance",
      "Energy interpretation: ½mv² - ½mu² = mas = Work done",
    ],
  },
  {
    id: "suvat-4",
    name: "Fourth Equation of Motion",
    domain: "Kinematics",
    equation: "s = ½(u + v)t",
    latexForm: "s = \\frac{1}{2}(u + v)t",
    parameters: [
      { name: "Initial velocity", symbol: "u", default: 5, min: 0, max: 50, step: 1, unit: "m/s" },
      { name: "Final velocity", symbol: "v", default: 25, min: 0, max: 100, step: 1, unit: "m/s" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "s", label: "Displacement (m)" },
    compute: (t, p) => 0.5 * (p.u + p.v) * t,
    derivation: [
      "The average velocity for uniform acceleration is:",
      "v_avg = (u + v) / 2",
      "Since displacement = average velocity × time:",
      "s = v_avg × t",
      "∴ s = ½(u + v)t",
      "This represents the area of a trapezium on the v-t graph.",
    ],
    explanation: "This equation uses the average velocity concept. Under constant acceleration, the velocity changes linearly, so the average of initial and final velocities gives the mean velocity. Displacement equals this mean velocity multiplied by time.",
    keyPoints: [
      "Based on average velocity concept",
      "Area of trapezium under v-t graph",
      "Linear in t for constant u and v",
      "Simplest form when both u and v are known",
    ],
  },

  // ─── WAVE EQUATIONS ─────────────────────────────────────
  {
    id: "wave-1",
    name: "Transverse Wave Equation",
    domain: "Waves",
    equation: "y = A sin(kx − ωt)",
    latexForm: "y = A \\sin(kx - \\omega t)",
    parameters: [
      { name: "Amplitude", symbol: "A", default: 1, min: 0.1, max: 5, step: 0.1, unit: "m" },
      { name: "Wave number", symbol: "k", default: 2, min: 0.5, max: 10, step: 0.5, unit: "rad/m" },
      { name: "Angular frequency", symbol: "ω", default: 3, min: 0.5, max: 10, step: 0.5, unit: "rad/s" },
      { name: "Time", symbol: "t", default: 0, min: 0, max: 5, step: 0.1, unit: "s" },
    ],
    xVar: { symbol: "x", label: "Position (m)", min: 0, max: 10 },
    yVar: { symbol: "y", label: "Displacement (m)" },
    compute: (x, p) => p.A * Math.sin(p.k * x - p["ω"] * p.t),
    derivation: [
      "Start from the 1D wave equation: ∂²y/∂t² = v² · ∂²y/∂x²",
      "Assume a harmonic wave solution: y(x,t) = A sin(kx − ωt + φ)",
      "Verify: ∂²y/∂t² = −ω²A sin(kx − ωt) = −ω²y",
      "∂²y/∂x² = −k²A sin(kx − ωt) = −k²y",
      "Substituting: −ω²y = v²(−k²y)",
      "∴ v = ω/k — the phase velocity",
      "Relations: k = 2π/λ, ω = 2πf, v = fλ",
      "The wave propagates in the +x direction with speed v = ω/k.",
    ],
    explanation: "This is the general form of a sinusoidal traveling wave. The argument (kx − ωt) represents the phase of the wave. Points of constant phase move with velocity v = ω/k. The wave number k relates to wavelength as k = 2π/λ.",
    keyPoints: [
      "A = amplitude (maximum displacement)",
      "k = 2π/λ (wave number)",
      "ω = 2πf (angular frequency)",
      "Phase velocity: v = ω/k = fλ",
      "y(x,t) satisfies the wave equation ∂²y/∂t² = v²∂²y/∂x²",
    ],
  },
  {
    id: "wave-2",
    name: "Wave Speed Relation",
    domain: "Waves",
    equation: "v = fλ",
    latexForm: "v = f\\lambda",
    parameters: [
      { name: "Frequency", symbol: "f", default: 5, min: 0.5, max: 50, step: 0.5, unit: "Hz" },
    ],
    xVar: { symbol: "λ", label: "Wavelength (m)", min: 0.1, max: 10 },
    yVar: { symbol: "v", label: "Wave speed (m/s)" },
    compute: (lambda, p) => p.f * lambda,
    derivation: [
      "In one complete oscillation (period T), the wave advances one wavelength λ.",
      "Speed = distance / time",
      "v = λ / T",
      "Since frequency f = 1/T:",
      "v = fλ",
      "This is the fundamental wave relation connecting speed, frequency, and wavelength.",
    ],
    explanation: "The wave speed equation is universal for all wave phenomena — sound, light, water waves, seismic waves. It states that speed equals the product of frequency and wavelength. For a given medium, v is constant, so f and λ are inversely proportional.",
    keyPoints: [
      "Universal for all wave types",
      "v = fλ = λ/T = ω/k",
      "In a fixed medium, v = constant → f ∝ 1/λ",
      "Applies to transverse and longitudinal waves",
    ],
  },
  {
    id: "wave-3",
    name: "Standing Wave (Fixed Ends)",
    domain: "Waves",
    equation: "y = 2A sin(kx) cos(ωt)",
    latexForm: "y = 2A\\sin(kx)\\cos(\\omega t)",
    parameters: [
      { name: "Amplitude", symbol: "A", default: 1, min: 0.1, max: 3, step: 0.1, unit: "m" },
      { name: "Mode number", symbol: "n", default: 3, min: 1, max: 8, step: 1, unit: "" },
      { name: "Time", symbol: "t", default: 0, min: 0, max: 5, step: 0.1, unit: "s" },
    ],
    xVar: { symbol: "x", label: "Position (m)", min: 0, max: Math.PI },
    yVar: { symbol: "y", label: "Displacement (m)" },
    compute: (x, p) => 2 * p.A * Math.sin(p.n * x) * Math.cos(2 * p.n * p.t),
    derivation: [
      "Superpose two waves traveling in opposite directions:",
      "y₁ = A sin(kx − ωt)  and  y₂ = A sin(kx + ωt)",
      "y = y₁ + y₂ = A[sin(kx−ωt) + sin(kx+ωt)]",
      "Using trig identity: sin α + sin β = 2 sin((α+β)/2) cos((α−β)/2)",
      "y = 2A sin(kx) cos(ωt)",
      "Nodes: sin(kx) = 0 → x = nπ/k (no vibration)",
      "Antinodes: sin(kx) = ±1 → x = (2n+1)π/(2k) (max vibration)",
      "For fixed ends of length L: kₙ = nπ/L → λₙ = 2L/n",
    ],
    explanation: "Standing waves form when two identical waves traveling in opposite directions interfere. Unlike traveling waves, standing waves have fixed nodes and antinodes. The spatial and temporal parts separate, meaning all points vibrate in phase but with different amplitudes.",
    keyPoints: [
      "Nodes: positions of zero displacement",
      "Antinodes: positions of maximum displacement",
      "Quantized frequencies: fₙ = nv/(2L)",
      "Fundamental mode: n = 1",
    ],
  },

  // ─── SIMPLE HARMONIC MOTION ─────────────────────────────
  {
    id: "shm-1",
    name: "SHM Displacement",
    domain: "Simple Harmonic Motion",
    equation: "x = A cos(ωt + φ)",
    latexForm: "x(t) = A\\cos(\\omega t + \\varphi)",
    parameters: [
      { name: "Amplitude", symbol: "A", default: 2, min: 0.1, max: 5, step: 0.1, unit: "m" },
      { name: "Angular frequency", symbol: "ω", default: 2, min: 0.5, max: 10, step: 0.5, unit: "rad/s" },
      { name: "Phase", symbol: "φ", default: 0, min: 0, max: 6.28, step: 0.1, unit: "rad" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "x", label: "Displacement (m)" },
    compute: (t, p) => p.A * Math.cos(p["ω"] * t + p["φ"]),
    derivation: [
      "Start from Hooke's Law restoring force: F = −kx",
      "Apply Newton's second law: ma = −kx",
      "m(d²x/dt²) = −kx",
      "d²x/dt² + (k/m)x = 0",
      "Let ω² = k/m, so: d²x/dt² + ω²x = 0",
      "This is a second-order linear ODE with constant coefficients.",
      "Characteristic equation: r² + ω² = 0 → r = ±iω",
      "General solution: x(t) = C₁cos(ωt) + C₂sin(ωt)",
      "Equivalently: x(t) = A cos(ωt + φ)",
      "where A = √(C₁² + C₂²) and tan φ = −C₂/C₁",
      "Period: T = 2π/ω = 2π√(m/k)",
    ],
    explanation: "SHM occurs when the restoring force is proportional to displacement. The motion is sinusoidal with constant amplitude and frequency. The angular frequency ω = √(k/m) depends only on the system parameters, not on the amplitude — a hallmark of linear oscillators.",
    keyPoints: [
      "ω = √(k/m) — natural frequency",
      "T = 2π/ω — period independent of amplitude",
      "Velocity: v = −Aω sin(ωt + φ)",
      "Acceleration: a = −Aω² cos(ωt + φ) = −ω²x",
      "Energy: E = ½kA² = ½mω²A² (constant)",
    ],
  },
  {
    id: "shm-2",
    name: "SHM Velocity",
    domain: "Simple Harmonic Motion",
    equation: "v = −Aω sin(ωt + φ)",
    latexForm: "v(t) = -A\\omega\\sin(\\omega t + \\varphi)",
    parameters: [
      { name: "Amplitude", symbol: "A", default: 2, min: 0.1, max: 5, step: 0.1, unit: "m" },
      { name: "Angular frequency", symbol: "ω", default: 2, min: 0.5, max: 10, step: 0.5, unit: "rad/s" },
      { name: "Phase", symbol: "φ", default: 0, min: 0, max: 6.28, step: 0.1, unit: "rad" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "v", label: "Velocity (m/s)" },
    compute: (t, p) => -p.A * p["ω"] * Math.sin(p["ω"] * t + p["φ"]),
    derivation: [
      "Given displacement: x(t) = A cos(ωt + φ)",
      "Velocity is the time derivative of displacement:",
      "v = dx/dt = d/dt[A cos(ωt + φ)]",
      "Apply chain rule: d/dt[cos(u)] = −sin(u) · du/dt",
      "Here u = ωt + φ, so du/dt = ω",
      "v = A · (−sin(ωt + φ)) · ω",
      "∴ v(t) = −Aω sin(ωt + φ)",
      "Maximum speed: |v_max| = Aω (at equilibrium position)",
      "v = 0 at extreme positions (x = ±A)",
    ],
    explanation: "The velocity in SHM leads the displacement by π/2 radians. When displacement is maximum (at turning points), velocity is zero and vice versa. The maximum speed Aω occurs at the equilibrium position where all energy is kinetic.",
    keyPoints: [
      "v = dx/dt (first derivative of displacement)",
      "90° phase lead over displacement",
      "|v_max| = Aω at x = 0",
      "v = 0 at x = ±A (turning points)",
      "v² = ω²(A² − x²)",
    ],
  },
  {
    id: "shm-3",
    name: "Simple Pendulum",
    domain: "Simple Harmonic Motion",
    equation: "T = 2π√(L/g)",
    latexForm: "T = 2\\pi\\sqrt{\\frac{L}{g}}",
    parameters: [
      { name: "Gravity", symbol: "g", default: 9.8, min: 1, max: 25, step: 0.1, unit: "m/s²" },
    ],
    xVar: { symbol: "L", label: "Length (m)", min: 0.1, max: 5 },
    yVar: { symbol: "T", label: "Period (s)" },
    compute: (L, p) => 2 * Math.PI * Math.sqrt(L / p.g),
    derivation: [
      "For a simple pendulum, the restoring torque is:",
      "τ = −mgL sin θ",
      "For small angles: sin θ ≈ θ",
      "τ = −mgLθ",
      "Using τ = Iα where I = mL² (point mass):",
      "mL²(d²θ/dt²) = −mgLθ",
      "d²θ/dt² = −(g/L)θ",
      "This is SHM with ω² = g/L",
      "Period: T = 2π/ω = 2π√(L/g)",
      "Note: T is independent of mass m and amplitude (for small θ).",
    ],
    explanation: "The simple pendulum demonstrates SHM for small oscillations. The period depends only on the length and gravitational acceleration — not on mass or amplitude. This makes pendulums excellent timekeeping devices and tools for measuring g.",
    keyPoints: [
      "T ∝ √L — period increases with length",
      "T ∝ 1/√g — shorter period in stronger gravity",
      "Independent of mass and amplitude (small angle)",
      "Small angle approximation: θ < 15°",
    ],
  },

  // ─── ELECTROMAGNETISM ──────────────────────────────────
  {
    id: "em-1",
    name: "Ohm's Law",
    domain: "Electromagnetism",
    equation: "V = IR",
    latexForm: "V = IR",
    parameters: [
      { name: "Resistance", symbol: "R", default: 5, min: 0.5, max: 50, step: 0.5, unit: "Ω" },
    ],
    xVar: { symbol: "I", label: "Current (A)", min: 0, max: 10 },
    yVar: { symbol: "V", label: "Voltage (V)" },
    compute: (I, p) => I * p.R,
    derivation: [
      "Ohm's Law is an empirical relation for ohmic conductors:",
      "V = IR",
      "In terms of microscopic quantities:",
      "Current density: J = σE (σ = conductivity, E = electric field)",
      "J = nev_d (n = carrier density, e = charge, v_d = drift velocity)",
      "E = V/L (for uniform field in a wire of length L)",
      "J = I/A (for cross-section A)",
      "Combining: V = (ρL/A)·I where ρ = 1/σ",
      "∴ R = ρL/A — resistance depends on geometry and material",
    ],
    explanation: "Ohm's Law is the foundational relation in circuit analysis. It states that voltage across an ohmic conductor is directly proportional to the current through it. The proportionality constant R (resistance) depends on the material's resistivity, length, and cross-sectional area.",
    keyPoints: [
      "V ∝ I for ohmic materials",
      "Slope of V-I graph = R",
      "R = ρL/A (resistivity, length, area)",
      "Power: P = IV = I²R = V²/R",
      "Non-ohmic: diodes, thermistors, filament lamps",
    ],
  },
  {
    id: "em-2",
    name: "Coulomb's Law",
    domain: "Electromagnetism",
    equation: "F = kq₁q₂/r²",
    latexForm: "F = \\frac{1}{4\\pi\\epsilon_0}\\frac{q_1 q_2}{r^2}",
    parameters: [
      { name: "Charge 1", symbol: "q1", default: 1e-6, min: 1e-9, max: 1e-3, step: 1e-7, unit: "C" },
      { name: "Charge 2", symbol: "q2", default: 1e-6, min: 1e-9, max: 1e-3, step: 1e-7, unit: "C" },
    ],
    xVar: { symbol: "r", label: "Distance (m)", min: 0.01, max: 1 },
    yVar: { symbol: "F", label: "Force (N)" },
    compute: (r, p) => (8.99e9 * p.q1 * p.q2) / (r * r),
    derivation: [
      "Coulomb's Law (empirical, analogous to Newton's gravity):",
      "F = (1/4πε₀) · q₁q₂/r²",
      "where k = 1/(4πε₀) = 8.99 × 10⁹ N·m²/C²",
      "ε₀ = 8.854 × 10⁻¹² F/m (permittivity of free space)",
      "Vector form: F⃗ = kq₁q₂r̂/r²",
      "Attractive if charges are opposite; repulsive if same sign",
      "This is the electrostatic analog of Newton's gravitational law.",
      "It forms the basis of Gauss's Law: ∮ E⃗·dA⃗ = Q_enc/ε₀",
    ],
    explanation: "Coulomb's Law describes the electrostatic force between two point charges. The force is proportional to the product of charges and inversely proportional to the square of the distance. It obeys the superposition principle and is the foundation of classical electrostatics.",
    keyPoints: [
      "Inverse-square law: F ∝ 1/r²",
      "Like charges repel, unlike charges attract",
      "k = 8.99 × 10⁹ N·m²/C²",
      "Superposition principle applies",
      "Basis of Gauss's Law",
    ],
  },
  {
    id: "em-3",
    name: "Capacitor Charging",
    domain: "Electromagnetism",
    equation: "V(t) = V₀(1 − e^(−t/RC))",
    latexForm: "V(t) = V_0\\left(1 - e^{-t/RC}\\right)",
    parameters: [
      { name: "Supply voltage", symbol: "V0", default: 10, min: 1, max: 50, step: 1, unit: "V" },
      { name: "Resistance", symbol: "R", default: 1000, min: 100, max: 10000, step: 100, unit: "Ω" },
      { name: "Capacitance", symbol: "C", default: 0.001, min: 0.0001, max: 0.01, step: 0.0001, unit: "F" },
    ],
    xVar: { symbol: "t", label: "Time (s)", min: 0, max: 10 },
    yVar: { symbol: "V", label: "Voltage (V)" },
    compute: (t, p) => p.V0 * (1 - Math.exp(-t / (p.R * p.C))),
    derivation: [
      "For an RC circuit with emf V₀:",
      "KVL: V₀ = IR + Q/C",
      "Since I = dQ/dt:",
      "V₀ = R(dQ/dt) + Q/C",
      "Rearrange: dQ/dt + Q/(RC) = V₀/R",
      "This is a first-order linear ODE.",
      "Integrating factor: μ = e^(t/RC)",
      "Solution: Q(t) = CV₀(1 − e^(−t/RC))",
      "Voltage across capacitor: V_C = Q/C = V₀(1 − e^(−t/RC))",
      "Time constant: τ = RC",
      "At t = τ: V_C = V₀(1 − 1/e) ≈ 0.632 V₀",
      "At t = 5τ: V_C ≈ 0.993 V₀ (practically fully charged)",
    ],
    explanation: "RC charging demonstrates exponential approach to equilibrium. The capacitor voltage rises from 0 toward V₀ with time constant τ = RC. After 5τ, the capacitor is ~99.3% charged. This is a classic example of a first-order ODE in circuit theory.",
    keyPoints: [
      "Time constant: τ = RC",
      "At t = RC: V ≈ 63.2% of V₀",
      "At t = 5RC: V ≈ 99.3% of V₀",
      "Current: I(t) = (V₀/R)e^(−t/RC) (decays exponentially)",
      "Energy stored: E = ½CV²",
    ],
  },
  {
    id: "em-4",
    name: "Gauss's Law (Electric Field)",
    domain: "Electromagnetism",
    equation: "E = Q/(4πε₀r²)",
    latexForm: "E = \\frac{Q}{4\\pi\\epsilon_0 r^2}",
    parameters: [
      { name: "Charge", symbol: "Q", default: 1e-6, min: 1e-9, max: 1e-3, step: 1e-7, unit: "C" },
    ],
    xVar: { symbol: "r", label: "Distance (m)", min: 0.01, max: 2 },
    yVar: { symbol: "E", label: "Electric Field (N/C)" },
    compute: (r, p) => p.Q / (4 * Math.PI * 8.854e-12 * r * r),
    derivation: [
      "Gauss's Law: ∮ E⃗ · dA⃗ = Q_enc/ε₀",
      "For a point charge, use a spherical Gaussian surface of radius r:",
      "E is constant and radial on the sphere: E ∮ dA = Q/ε₀",
      "Surface area of sphere: 4πr²",
      "E · 4πr² = Q/ε₀",
      "∴ E = Q/(4πε₀r²)",
      "This recovers Coulomb's law from Gauss's law.",
      "E points radially outward for positive Q.",
    ],
    explanation: "Gauss's Law (one of Maxwell's four equations) relates the electric flux through a closed surface to the enclosed charge. For symmetric charge distributions, it provides an elegant way to calculate the electric field without integration.",
    keyPoints: [
      "One of Maxwell's four equations",
      "E ∝ 1/r² (inverse square law)",
      "Exploits symmetry for easy computation",
      "Works for any closed surface (Gaussian surface)",
      "∮ E⃗·dA⃗ = Q_enc/ε₀",
    ],
  },

  // ─── THERMODYNAMICS ─────────────────────────────────────
  {
    id: "thermo-1",
    name: "Ideal Gas Law",
    domain: "Thermodynamics",
    equation: "PV = nRT",
    latexForm: "PV = nRT",
    parameters: [
      { name: "Moles", symbol: "n", default: 1, min: 0.1, max: 10, step: 0.1, unit: "mol" },
      { name: "Temperature", symbol: "T", default: 300, min: 100, max: 1000, step: 10, unit: "K" },
    ],
    xVar: { symbol: "V", label: "Volume (m³)", min: 0.001, max: 0.1 },
    yVar: { symbol: "P", label: "Pressure (Pa)" },
    compute: (V, p) => (p.n * 8.314 * p.T) / V,
    derivation: [
      "Combine three empirical gas laws:",
      "Boyle's Law: PV = constant (at constant T)",
      "Charles's Law: V/T = constant (at constant P)",
      "Avogadro's Law: V/n = constant (at constant T, P)",
      "Combining: PV ∝ nT",
      "∴ PV = nRT",
      "R = 8.314 J/(mol·K) — universal gas constant",
      "Per-molecule form: PV = NkᵦT (kᵦ = R/Nₐ = 1.38 × 10⁻²³ J/K)",
      "From kinetic theory: PV = ⅓Nm⟨v²⟩ → ½m⟨v²⟩ = (3/2)kᵦT",
    ],
    explanation: "The ideal gas law is a combination of Boyle's, Charles's, and Avogadro's laws. It describes the behavior of an ideal gas where particles have no intermolecular forces and occupy negligible volume. The P-V graph at constant T is a hyperbola (isothermal process).",
    keyPoints: [
      "R = 8.314 J/(mol·K)",
      "P ∝ 1/V at constant T (Boyle's law — hyperbola)",
      "V ∝ T at constant P (Charles's law — linear)",
      "Valid for low pressure, high temperature",
      "Real gases: van der Waals equation",
    ],
  },
  {
    id: "thermo-2",
    name: "Heat Transfer",
    domain: "Thermodynamics",
    equation: "Q = mcΔT",
    latexForm: "Q = mc\\Delta T",
    parameters: [
      { name: "Mass", symbol: "m", default: 1, min: 0.1, max: 10, step: 0.1, unit: "kg" },
      { name: "Specific heat", symbol: "c", default: 4186, min: 100, max: 10000, step: 100, unit: "J/(kg·K)" },
    ],
    xVar: { symbol: "ΔT", label: "Temperature change (K)", min: 0, max: 100 },
    yVar: { symbol: "Q", label: "Heat energy (J)" },
    compute: (dT, p) => p.m * p.c * dT,
    derivation: [
      "From the first law of thermodynamics: dU = δQ − δW",
      "For a system at constant volume (no work done): dU = δQ",
      "The heat capacity at constant volume: Cᵥ = (∂U/∂T)ᵥ",
      "For a process at constant pressure:",
      "δQ = nCₚdT (per mole) or δQ = mcₚdT (per unit mass)",
      "Integrating from T₁ to T₂:",
      "Q = mc(T₂ − T₁) = mcΔT",
      "where c = specific heat capacity (J/(kg·K))",
      "Water: c = 4186 J/(kg·K) — one of the highest known values",
    ],
    explanation: "This equation quantifies the heat energy required to change a substance's temperature. Specific heat capacity c is a material property — water's high specific heat (4186 J/kg·K) makes it an excellent coolant and thermal reservoir.",
    keyPoints: [
      "Q ∝ m, Q ∝ ΔT (linear)",
      "c is material-specific",
      "Water: c = 4186 J/(kg·K)",
      "First law: ΔU = Q − W",
      "Phase changes: Q = mL (latent heat, no temperature change)",
    ],
  },
  {
    id: "thermo-3",
    name: "Stefan-Boltzmann Law",
    domain: "Thermodynamics",
    equation: "P = εσAT⁴",
    latexForm: "P = \\varepsilon\\sigma A T^4",
    parameters: [
      { name: "Emissivity", symbol: "ε", default: 1, min: 0.1, max: 1, step: 0.05, unit: "" },
      { name: "Area", symbol: "A", default: 1, min: 0.01, max: 10, step: 0.1, unit: "m²" },
    ],
    xVar: { symbol: "T", label: "Temperature (K)", min: 200, max: 2000 },
    yVar: { symbol: "P", label: "Radiated Power (W)" },
    compute: (T, p) => p["ε"] * 5.67e-8 * p.A * Math.pow(T, 4),
    derivation: [
      "From Planck's radiation law, the spectral radiance is:",
      "B(ν,T) = (2hν³/c²) · 1/(e^(hν/kT) − 1)",
      "Integrating over all frequencies and solid angles:",
      "P/A = σT⁴ where σ = 2π⁵k⁴/(15c²h³)",
      "σ = 5.670 × 10⁻⁸ W/(m²·K⁴) — Stefan-Boltzmann constant",
      "For non-ideal (grey) bodies: P = εσAT⁴",
      "ε = emissivity (0 ≤ ε ≤ 1), ε = 1 for blackbody",
      "This shows radiated power increases dramatically with temperature (T⁴ dependence).",
    ],
    explanation: "The Stefan-Boltzmann law describes thermal radiation — all objects above absolute zero emit electromagnetic radiation. The T⁴ dependence means doubling the temperature increases radiated power by a factor of 16. This governs stellar luminosity, radiative heat transfer, and climate science.",
    keyPoints: [
      "P ∝ T⁴ — very sensitive to temperature",
      "σ = 5.67 × 10⁻⁸ W/(m²·K⁴)",
      "Blackbody: ε = 1",
      "Derived from Planck's law by integration",
      "Applies to stars, furnaces, thermal imaging",
    ],
  },
  {
    id: "thermo-4",
    name: "Carnot Efficiency",
    domain: "Thermodynamics",
    equation: "η = 1 − T_cold/T_hot",
    latexForm: "\\eta = 1 - \\frac{T_C}{T_H}",
    parameters: [
      { name: "Cold reservoir", symbol: "Tc", default: 300, min: 100, max: 500, step: 10, unit: "K" },
    ],
    xVar: { symbol: "Th", label: "Hot reservoir T (K)", min: 300, max: 2000 },
    yVar: { symbol: "η", label: "Efficiency" },
    compute: (Th, p) => Th > p.Tc ? 1 - p.Tc / Th : 0,
    derivation: [
      "For a Carnot cycle (most efficient heat engine):",
      "Two isothermal + two adiabatic processes",
      "Heat absorbed from hot reservoir: Q_H at temperature T_H",
      "Heat rejected to cold reservoir: Q_C at temperature T_C",
      "For reversible processes: Q_H/T_H = Q_C/T_C (Clausius theorem)",
      "Efficiency: η = W/Q_H = (Q_H − Q_C)/Q_H = 1 − Q_C/Q_H",
      "∴ η = 1 − T_C/T_H",
      "This is the maximum possible efficiency for any heat engine.",
      "Second law: η < 1 always (T_C > 0 K in practice).",
    ],
    explanation: "The Carnot efficiency sets the theoretical upper limit for any heat engine. No real engine can exceed this efficiency. It depends only on the temperatures of the hot and cold reservoirs, emphasizing why higher operating temperatures improve engine performance.",
    keyPoints: [
      "Maximum possible efficiency for any heat engine",
      "η → 1 only if T_C → 0 K (impossible in practice)",
      "Real engines: η_real < η_Carnot",
      "Foundation of the second law of thermodynamics",
      "Increases with T_H and decreases with T_C",
    ],
  },

  // ─── QUANTUM MECHANICS ──────────────────────────────────
  {
    id: "qm-1",
    name: "Particle in a Box (Infinite Well)",
    domain: "Quantum Mechanics",
    equation: "ψₙ = √(2/L) sin(nπx/L)",
    latexForm: "\\psi_n(x) = \\sqrt{\\frac{2}{L}}\\sin\\left(\\frac{n\\pi x}{L}\\right)",
    parameters: [
      { name: "Box width", symbol: "L", default: 1, min: 0.5, max: 5, step: 0.1, unit: "nm" },
      { name: "Quantum number", symbol: "n", default: 1, min: 1, max: 8, step: 1, unit: "" },
    ],
    xVar: { symbol: "x", label: "Position (nm)", min: 0, max: 1 },
    yVar: { symbol: "ψ", label: "Wavefunction" },
    compute: (x, p) => {
      const xNorm = x / p.L;
      if (xNorm < 0 || xNorm > 1) return 0;
      return Math.sqrt(2 / p.L) * Math.sin(p.n * Math.PI * xNorm);
    },
    derivation: [
      "Time-independent Schrödinger equation: −(ℏ²/2m)d²ψ/dx² + V(x)ψ = Eψ",
      "Inside the box (0 < x < L): V = 0",
      "−(ℏ²/2m)d²ψ/dx² = Eψ",
      "d²ψ/dx² = −(2mE/ℏ²)ψ = −k²ψ where k² = 2mE/ℏ²",
      "General solution: ψ(x) = A sin(kx) + B cos(kx)",
      "Boundary conditions: ψ(0) = 0 → B = 0",
      "ψ(L) = 0 → sin(kL) = 0 → kL = nπ (n = 1, 2, 3, ...)",
      "∴ kₙ = nπ/L",
      "Energy quantization: Eₙ = ℏ²kₙ²/(2m) = n²π²ℏ²/(2mL²)",
      "Normalization: ∫₀ᴸ |ψ|² dx = 1 → A = √(2/L)",
      "∴ ψₙ(x) = √(2/L) sin(nπx/L)",
    ],
    explanation: "The particle in a box is the simplest quantum system showing energy quantization. The boundary conditions force the wavefunction to have discrete wavelengths, leading to quantized energy levels Eₙ ∝ n². This model explains quantum confinement in nanostructures and quantum dots.",
    keyPoints: [
      "Energy: Eₙ = n²π²ℏ²/(2mL²)",
      "Zero-point energy: E₁ ≠ 0 (Heisenberg uncertainty)",
      "n nodes in ψₙ (including boundaries)",
      "Probability density: |ψₙ|² = (2/L)sin²(nπx/L)",
      "Energy spacing increases with n",
    ],
  },
  {
    id: "qm-2",
    name: "Quantum Harmonic Oscillator (Ground State)",
    domain: "Quantum Mechanics",
    equation: "ψ₀ = (mω/πℏ)^(1/4) e^(−mωx²/2ℏ)",
    latexForm: "\\psi_0(x) = \\left(\\frac{m\\omega}{\\pi\\hbar}\\right)^{1/4} e^{-m\\omega x^2 / 2\\hbar}",
    parameters: [
      { name: "Width parameter", symbol: "α", default: 1, min: 0.2, max: 5, step: 0.1, unit: "" },
    ],
    xVar: { symbol: "x", label: "Position", min: -5, max: 5 },
    yVar: { symbol: "ψ₀", label: "Wavefunction" },
    compute: (x, p) => Math.pow(p["α"] / Math.PI, 0.25) * Math.exp(-p["α"] * x * x / 2),
    derivation: [
      "Schrödinger equation: −(ℏ²/2m)d²ψ/dx² + ½mω²x²ψ = Eψ",
      "Introduce dimensionless variable: ξ = √(mω/ℏ) · x",
      "Equation becomes: d²ψ/dξ² + (2E/(ℏω) − ξ²)ψ = 0",
      "For large ξ: ψ ~ e^(−ξ²/2) (asymptotic behavior)",
      "Try ψ = H(ξ)e^(−ξ²/2) where H(ξ) is a polynomial",
      "This gives Hermite's equation: H'' − 2ξH' + 2nH = 0",
      "Solutions: Hermite polynomials Hₙ(ξ) with Eₙ = (n + ½)ℏω",
      "Ground state (n = 0): H₀ = 1",
      "ψ₀(x) = (mω/πℏ)^(1/4) exp(−mωx²/2ℏ)",
      "Zero-point energy: E₀ = ½ℏω ≠ 0",
    ],
    explanation: "The quantum harmonic oscillator is one of the most important models in physics. Its ground state is a Gaussian wavefunction with zero-point energy E₀ = ½ℏω. The equally-spaced energy levels Eₙ = (n+½)ℏω are fundamental to quantum field theory, molecular vibrations, and phonon physics.",
    keyPoints: [
      "Eₙ = (n + ½)ℏω — equally spaced levels",
      "Zero-point energy: E₀ = ½ℏω",
      "Ground state is a Gaussian",
      "Hermite polynomials Hₙ(ξ)",
      "Foundation of quantum field theory",
    ],
  },
  {
    id: "qm-3",
    name: "de Broglie Wavelength",
    domain: "Quantum Mechanics",
    equation: "λ = h/p = h/(mv)",
    latexForm: "\\lambda = \\frac{h}{p} = \\frac{h}{mv}",
    parameters: [
      { name: "Mass", symbol: "m", default: 9.109e-31, min: 1e-31, max: 1e-25, step: 1e-31, unit: "kg" },
    ],
    xVar: { symbol: "v", label: "Velocity (m/s)", min: 1e4, max: 1e7 },
    yVar: { symbol: "λ", label: "Wavelength (m)" },
    compute: (v, p) => 6.626e-34 / (p.m * v),
    derivation: [
      "Einstein showed light has particle nature: E = hf, p = h/λ",
      "de Broglie proposed matter also has wave nature (1924):",
      "Every particle with momentum p has an associated wavelength:",
      "λ = h/p",
      "For a non-relativistic particle: p = mv",
      "∴ λ = h/(mv)",
      "h = 6.626 × 10⁻³⁴ J·s (Planck's constant)",
      "For an electron at v = 10⁶ m/s:",
      "λ = 6.626×10⁻³⁴ / (9.109×10⁻³¹ × 10⁶) ≈ 0.73 nm",
      "This is comparable to atomic spacing → electron diffraction!",
      "Confirmed by Davisson-Germer experiment (1927).",
    ],
    explanation: "de Broglie's hypothesis unified wave-particle duality by assigning a wavelength to all matter. The wavelength is inversely proportional to momentum — heavier or faster particles have shorter wavelengths. This concept is foundational to quantum mechanics and explains electron diffraction.",
    keyPoints: [
      "λ = h/p = h/(mv)",
      "λ ∝ 1/v (hyperbolic decrease)",
      "Significant only for microscopic particles",
      "Confirmed by electron diffraction experiments",
      "Basis of electron microscopy",
    ],
  },
  {
    id: "qm-4",
    name: "Planck's Radiation Law",
    domain: "Quantum Mechanics",
    equation: "B(ν) = (2hν³/c²) / (e^(hν/kT) − 1)",
    latexForm: "B(\\nu, T) = \\frac{2h\\nu^3}{c^2} \\cdot \\frac{1}{e^{h\\nu/kT} - 1}",
    parameters: [
      { name: "Temperature", symbol: "T", default: 5778, min: 1000, max: 10000, step: 100, unit: "K" },
    ],
    xVar: { symbol: "ν", label: "Frequency (×10¹⁴ Hz)", min: 0.1, max: 30 },
    yVar: { symbol: "B", label: "Spectral Radiance (arb.)" },
    compute: (nu_scaled, p) => {
      const nu = nu_scaled * 1e14;
      const h = 6.626e-34;
      const c = 3e8;
      const k = 1.381e-23;
      const x = h * nu / (k * p.T);
      if (x > 500) return 0;
      return (2 * h * nu * nu * nu) / (c * c) / (Math.exp(x) - 1);
    },
    derivation: [
      "Classical theory (Rayleigh-Jeans): B ∝ ν² → ultraviolet catastrophe!",
      "Planck's revolutionary assumption (1900):",
      "Energy of oscillators is quantized: E = nhν (n = 0, 1, 2, ...)",
      "Average energy of an oscillator:",
      "⟨E⟩ = hν / (e^(hν/kT) − 1)",
      "Number of modes per unit volume: g(ν) = 8πν²/c³",
      "Spectral energy density: u(ν) = g(ν) · ⟨E⟩",
      "u(ν) = (8πhν³/c³) / (e^(hν/kT) − 1)",
      "Spectral radiance: B(ν,T) = (c/4π) · u(ν)",
      "B(ν,T) = (2hν³/c²) / (e^(hν/kT) − 1)",
      "Low ν limit → Rayleigh-Jeans: B ≈ 2ν²kT/c²",
      "High ν limit → Wien's law: B ≈ (2hν³/c²)e^(−hν/kT)",
    ],
    explanation: "Planck's law describes the spectral distribution of thermal radiation from a blackbody. It resolved the ultraviolet catastrophe by quantizing oscillator energies — the birth of quantum physics. The peak wavelength shifts with temperature (Wien's displacement law).",
    keyPoints: [
      "Birth of quantum mechanics (1900)",
      "Wien's law: λ_max · T = 2.898 × 10⁻³ m·K",
      "Low ν → Rayleigh-Jeans; High ν → Wien",
      "Integrating gives Stefan-Boltzmann: P = σT⁴",
      "Explains cosmic microwave background, stellar spectra",
    ],
  },
];

export function getEquationsByDomain(domain: PhysicsDomain): PhysicsEquation[] {
  return physicsEquations.filter(eq => eq.domain === domain);
}

export function getAllDomains(): PhysicsDomain[] {
  return [...new Set(physicsEquations.map(eq => eq.domain))];
}
