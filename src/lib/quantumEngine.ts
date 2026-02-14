// ═══════════════════════════════════════════════════════
// Symbolic Quantum Derivation Engine
// Research-grade step-by-step rule-based solver
// ═══════════════════════════════════════════════════════

export interface DerivationStep {
  rule: string;        // e.g. "Power Rule", "Chain Rule", "Operator Expansion"
  formula: string;     // The formula/rule being applied
  action: string;      // What we're doing in this step
  result: string;      // The result after applying the rule
  highlight?: boolean; // Whether this is a key transformation
}

export interface FullDerivation {
  title: string;
  equation: string;
  operatorForm: string;
  differentialForm: string;
  steps: DerivationStep[];
  finalAnswer: string;
  physicalMeaning: string;
  method: string;
  notes: string[];
}

// ─── Operator Definitions ───
export const operators = {
  hamiltonian: {
    symbol: "Ĥ",
    name: "Hamiltonian Operator",
    operatorForm: "Ĥ = T̂ + V̂",
    differentialForm: "Ĥ = -ℏ²/(2m) ∂²/∂x² + V(x)",
    description: "Total energy operator (kinetic + potential)",
  },
  momentum: {
    symbol: "p̂",
    name: "Momentum Operator",
    operatorForm: "p̂",
    differentialForm: "p̂ = -iℏ ∂/∂x",
    description: "Linear momentum in position representation",
  },
  position: {
    symbol: "x̂",
    name: "Position Operator",
    operatorForm: "x̂",
    differentialForm: "x̂ψ = xψ (multiplicative)",
    description: "Position operator acts by multiplication",
  },
  angularMomentum: {
    symbol: "L̂",
    name: "Angular Momentum Operator",
    operatorForm: "L̂ = r̂ × p̂",
    differentialForm: "L̂z = -iℏ ∂/∂φ",
    description: "Orbital angular momentum",
  },
  spin: {
    symbol: "Ŝ",
    name: "Spin Operator",
    operatorForm: "Ŝ = (Ŝx, Ŝy, Ŝz)",
    differentialForm: "Ŝz|↑⟩ = +ℏ/2 |↑⟩, Ŝz|↓⟩ = -ℏ/2 |↓⟩",
    description: "Intrinsic angular momentum (matrix representation)",
  },
  kinetic: {
    symbol: "T̂",
    name: "Kinetic Energy Operator",
    operatorForm: "T̂ = p̂²/(2m)",
    differentialForm: "T̂ = -ℏ²/(2m) ∂²/∂x²",
    description: "Kinetic energy via momentum operator squared",
  },
  laplacian: {
    symbol: "∇²",
    name: "Laplacian Operator",
    operatorForm: "∇² = ∇·∇",
    differentialForm: "∇² = ∂²/∂x² + ∂²/∂y² + ∂²/∂z²",
    description: "Sum of unmixed second partial derivatives",
  },
  nabla: {
    symbol: "∇",
    name: "Nabla (Gradient) Operator",
    operatorForm: "∇",
    differentialForm: "∇ = (∂/∂x, ∂/∂y, ∂/∂z)",
    description: "Vector differential operator",
  },
};

// ─── Differentiation Rules ───
export const diffRules = {
  power: {
    name: "Power Rule",
    formula: "d/dx [xⁿ] = n·xⁿ⁻¹",
    description: "Derivative of x raised to a power",
  },
  product: {
    name: "Product Rule",
    formula: "d/dx [f·g] = f'·g + f·g'",
    description: "Derivative of a product of two functions",
  },
  quotient: {
    name: "Quotient Rule",
    formula: "d/dx [f/g] = (f'·g - f·g') / g²",
    description: "Derivative of a quotient",
  },
  chain: {
    name: "Chain Rule",
    formula: "d/dx [f(g(x))] = f'(g(x))·g'(x)",
    description: "Derivative of a composite function",
  },
  exponential: {
    name: "Exponential Rule",
    formula: "d/dx [eᶠ⁽ˣ⁾] = f'(x)·eᶠ⁽ˣ⁾",
    description: "Derivative of exponential with chain rule",
  },
  partial: {
    name: "Partial Differentiation",
    formula: "∂f/∂x treats all other variables as constants",
    description: "Differentiate with respect to one variable, holding others fixed",
  },
  separation: {
    name: "Separation of Variables",
    formula: "ψ(x,t) = X(x)·T(t) → separate into ODEs",
    description: "Split PDE into independent ODEs by assuming product form",
  },
  substitution: {
    name: "Substitution Method",
    formula: "Let u = g(x), then du = g'(x)dx",
    description: "Change of variable to simplify expression",
  },
  linearOperator: {
    name: "Linear Operator Property",
    formula: "Â(αψ₁ + βψ₂) = αÂψ₁ + βÂψ₂",
    description: "Operators distribute over linear combinations",
  },
  operatorExpansion: {
    name: "Operator Expansion",
    formula: "Replace operator symbols with their differential forms",
    description: "Convert abstract operator notation to explicit derivatives",
  },
  eigenvalue: {
    name: "Eigenvalue Equation",
    formula: "Âψ = aψ → operator action yields scalar multiple",
    description: "When operator acts on eigenstate, result is eigenvalue times state",
  },
};

// ─── Full Derivation Database ───

function deriveTDSE(): FullDerivation {
  return {
    title: "Time-Dependent Schrödinger Equation — Full Derivation",
    equation: "iℏ ∂ψ/∂t = Ĥψ",
    operatorForm: "iℏ ∂ψ/∂t = Ĥψ  where Ĥ = T̂ + V̂",
    differentialForm: "iℏ ∂ψ/∂t = [-ℏ²/(2m) ∂²/∂x² + V(x)] ψ",
    steps: [
      {
        rule: "Operator Expansion",
        formula: "Ĥ = T̂ + V̂ = p̂²/(2m) + V(x)",
        action: "Replace the Hamiltonian operator with its components: kinetic + potential energy",
        result: "iℏ ∂ψ/∂t = [p̂²/(2m) + V(x)] ψ",
      },
      {
        rule: "Momentum Operator Substitution",
        formula: "p̂ = -iℏ ∂/∂x → p̂² = (-iℏ)² ∂²/∂x² = -ℏ² ∂²/∂x²",
        action: "Substitute the momentum operator p̂ = -iℏ ∂/∂x and square it",
        result: "iℏ ∂ψ/∂t = [-ℏ²/(2m) ∂²ψ/∂x² + V(x)ψ]",
        highlight: true,
      },
      {
        rule: "Separation of Variables",
        formula: "ψ(x,t) = φ(x)·T(t)",
        action: "Assume the wavefunction separates into spatial and temporal parts",
        result: "iℏ φ(x)·T'(t) = [-ℏ²/(2m) φ''(x)·T(t) + V(x)·φ(x)·T(t)]",
      },
      {
        rule: "Algebraic Division",
        formula: "Divide both sides by φ(x)·T(t)",
        action: "Separate variables by dividing through by the full product ψ = φ·T",
        result: "iℏ T'(t)/T(t) = [-ℏ²/(2m) φ''(x)/φ(x) + V(x)]",
      },
      {
        rule: "Separation Constant",
        formula: "LHS depends only on t, RHS only on x → both equal constant E",
        action: "Since left depends on t and right on x, both must equal separation constant E (energy)",
        result: "iℏ T'/T = E  AND  -ℏ²/(2m) φ''/φ + V(x) = E",
        highlight: true,
      },
      {
        rule: "First-Order ODE (Time Part)",
        formula: "dT/dt = -(iE/ℏ)T → T(t) = e^(-iEt/ℏ)",
        action: "Solve the temporal ODE: iℏ dT/dt = ET → separate and integrate",
        result: "T(t) = C·e^(-iEt/ℏ)  — oscillatory time evolution",
      },
      {
        rule: "Rearrangement to Eigenvalue Form",
        formula: "Multiply through by φ(x): -ℏ²/(2m) φ''(x) + V(x)φ(x) = Eφ(x)",
        action: "The spatial part becomes the Time-Independent Schrödinger Equation (TISE)",
        result: "Ĥφ(x) = Eφ(x)  — the energy eigenvalue equation",
        highlight: true,
      },
      {
        rule: "Superposition Principle",
        formula: "Linear Operator Property: Ĥ(Σcₙψₙ) = Σcₙ(Ĥψₙ)",
        action: "General solution is a superposition of all energy eigenstates",
        result: "ψ(x,t) = Σₙ cₙ φₙ(x) e^(-iEₙt/ℏ)",
      },
    ],
    finalAnswer: "ψ(x,t) = Σₙ cₙ φₙ(x) e^(-iEₙt/ℏ)  where Ĥφₙ = Eₙφₙ",
    physicalMeaning: "The TDSE governs the complete time evolution of a quantum system. Each energy eigenstate acquires a phase factor e^(-iEt/ℏ), causing interference patterns in superposition states. The probability density |ψ|² may oscillate in time for mixed states.",
    method: "Separation of Variables → Time ODE + TISE (Spatial Eigenvalue Problem)",
    notes: [
      "The time-dependence is purely oscillatory — no decay for isolated systems",
      "Energy eigenstates are stationary: |ψₙ|² is time-independent",
      "Superposition states exhibit quantum beats at frequency (Eₘ-Eₙ)/ℏ",
    ],
  };
}

function deriveTISE(): FullDerivation {
  return {
    title: "Time-Independent Schrödinger Equation — Full Derivation",
    equation: "Ĥψ = Eψ",
    operatorForm: "Ĥψ = Eψ  where Ĥ = T̂ + V̂",
    differentialForm: "-ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ",
    steps: [
      {
        rule: "Operator Expansion",
        formula: "Ĥ = T̂ + V̂ = p̂²/(2m) + V(x)",
        action: "Expand the Hamiltonian into kinetic and potential operators",
        result: "[p̂²/(2m) + V(x)]ψ = Eψ",
      },
      {
        rule: "Operator-to-Differential Conversion",
        formula: "p̂ = -iℏ d/dx → p̂² = -ℏ² d²/dx²",
        action: "Replace p̂² with its differential form: (-iℏ)² d²/dx² = -ℏ² d²/dx²",
        result: "[-ℏ²/(2m) d²/dx² + V(x)]ψ = Eψ",
        highlight: true,
      },
      {
        rule: "Linear Operator Property",
        formula: "Distribute the operator: each term acts on ψ independently",
        action: "Apply the operator sum to ψ term by term",
        result: "-ℏ²/(2m) d²ψ/dx² + V(x)ψ = Eψ",
      },
      {
        rule: "Algebraic Rearrangement",
        formula: "Move all terms to one side: f(x) = 0 form",
        action: "Rearrange into standard second-order ODE form",
        result: "d²ψ/dx² + (2m/ℏ²)[E - V(x)]ψ = 0",
        highlight: true,
      },
      {
        rule: "Substitution: k² Definition",
        formula: "Let k²(x) = 2m[E - V(x)]/ℏ²",
        action: "Define local wavenumber k(x) to simplify notation",
        result: "d²ψ/dx² + k²(x)ψ = 0  — Helmholtz-type equation",
      },
      {
        rule: "Case Analysis: Free Particle (V=0)",
        formula: "d²ψ/dx² + (2mE/ℏ²)ψ = 0 with k² = 2mE/ℏ²",
        action: "For V=0, this is a constant-coefficient ODE. Try ψ = e^(rx)",
        result: "r² + k² = 0 → r = ±ik → ψ(x) = Ae^(ikx) + Be^(-ikx)",
      },
      {
        rule: "Case Analysis: Infinite Square Well",
        formula: "V=0 inside (0<x<L), V=∞ outside → ψ(0) = ψ(L) = 0",
        action: "Apply boundary conditions to the general solution ψ = A sin(kx) + B cos(kx)",
        result: "ψ(0)=0 → B=0; ψ(L)=0 → sin(kL)=0 → k = nπ/L",
        highlight: true,
      },
      {
        rule: "Energy Quantization",
        formula: "k = nπ/L → E = ℏ²k²/(2m) = n²π²ℏ²/(2mL²)",
        action: "Boundary conditions force k to be discrete → energy is quantized",
        result: "Eₙ = n²π²ℏ²/(2mL²),  ψₙ(x) = √(2/L) sin(nπx/L)",
      },
      {
        rule: "Normalization",
        formula: "∫|ψ|²dx = 1 → A²∫₀ᴸ sin²(nπx/L)dx = 1 → A = √(2/L)",
        action: "Use Power Rule on sin²: ∫sin²(u)du = u/2 - sin(2u)/4",
        result: "ψₙ(x) = √(2/L) sin(nπx/L)  — normalized eigenstates",
      },
    ],
    finalAnswer: "Eₙ = n²π²ℏ²/(2mL²),  ψₙ(x) = √(2/L) sin(nπx/L),  n = 1, 2, 3, ...",
    physicalMeaning: "The TISE is an energy eigenvalue equation. Only specific discrete energies are allowed — this is the origin of quantization. The eigenfunction ψₙ describes the stationary probability distribution for energy level n.",
    method: "Operator expansion → Second-order ODE → Boundary conditions → Quantization",
    notes: [
      "Ground state n=1 has non-zero energy (zero-point energy) — purely quantum effect",
      "Eigenstates are orthonormal: ∫ψₘ*ψₙ dx = δₘₙ",
      "Higher n → more nodes in ψ → higher kinetic energy",
    ],
  };
}

function deriveExpectation(): FullDerivation {
  return {
    title: "Expectation Value — Full Derivation",
    equation: "⟨Â⟩ = ∫ ψ* Â ψ dx",
    operatorForm: "⟨Â⟩ = ⟨ψ|Â|ψ⟩",
    differentialForm: "⟨Â⟩ = ∫₋∞^∞ ψ*(x) Â ψ(x) dx",
    steps: [
      {
        rule: "Definition of Expectation Value",
        formula: "⟨Â⟩ = ⟨ψ|Â|ψ⟩ = ∫ ψ*(x) Â ψ(x) dx",
        action: "The expectation value is the inner product of ψ with Âψ",
        result: "⟨Â⟩ = ∫ ψ* Â ψ dx",
      },
      {
        rule: "Example: Position Operator",
        formula: "x̂ψ = xψ (multiplicative operator)",
        action: "For position, x̂ simply multiplies by x",
        result: "⟨x⟩ = ∫ ψ*(x) · x · ψ(x) dx = ∫ x|ψ(x)|² dx",
        highlight: true,
      },
      {
        rule: "Example: Momentum Operator",
        formula: "p̂ = -iℏ ∂/∂x",
        action: "For momentum, apply the differential operator p̂ = -iℏ d/dx to ψ first",
        result: "⟨p⟩ = ∫ ψ*(x) · (-iℏ ∂ψ/∂x) dx",
      },
      {
        rule: "Concrete Calculation: Particle in Box (n=1)",
        formula: "ψ₁(x) = √(2/L) sin(πx/L),  x̂ψ = x·ψ",
        action: "Compute ⟨x⟩ = (2/L) ∫₀ᴸ x sin²(πx/L) dx",
        result: "⟨x⟩ = (2/L) · L²/4 = L/2  — particle centered in box",
        highlight: true,
      },
      {
        rule: "Product Rule for ⟨p⟩",
        formula: "d/dx[sin(πx/L)] = (π/L)cos(πx/L)",
        action: "Differentiate ψ: ∂ψ/∂x = √(2/L)·(π/L)·cos(πx/L)",
        result: "⟨p⟩ = -iℏ(2/L)(π/L) ∫₀ᴸ sin(πx/L)cos(πx/L) dx",
      },
      {
        rule: "Trigonometric Identity",
        formula: "sin(u)cos(u) = ½sin(2u)",
        action: "Apply trig identity to simplify the integrand",
        result: "⟨p⟩ = -iℏ(π/L²) ∫₀ᴸ sin(2πx/L) dx = 0",
      },
      {
        rule: "Physical Interpretation",
        formula: "⟨p⟩ = 0 means equal probability of moving left/right",
        action: "The integral of sin over a full period vanishes",
        result: "⟨p⟩ = 0  — no net momentum (standing wave)",
        highlight: true,
      },
      {
        rule: "Uncertainty Calculation",
        formula: "Δx = √(⟨x²⟩ - ⟨x⟩²),  Δp = √(⟨p²⟩ - ⟨p⟩²)",
        action: "Calculate ⟨x²⟩ and ⟨p²⟩ to find uncertainties",
        result: "Δx·Δp ≥ ℏ/2  — Heisenberg uncertainty principle satisfied",
      },
    ],
    finalAnswer: "⟨x⟩ = L/2,  ⟨p⟩ = 0,  Δx·Δp ≥ ℏ/2",
    physicalMeaning: "Expectation values bridge quantum formalism and measurement. They give the average outcome over many measurements on identically prepared systems. The uncertainty product confirms Heisenberg's principle.",
    method: "Direct integration with operator acting on wavefunction, then algebraic simplification",
    notes: [
      "For energy eigenstates: ⟨Ĥ⟩ = E (exact, no uncertainty)",
      "⟨p²⟩ = n²π²ℏ²/L² for particle in box",
      "Uncertainty principle is never violated — it's built into the formalism",
    ],
  };
}

function deriveMomentum(): FullDerivation {
  return {
    title: "Momentum Operator — Full Derivation",
    equation: "p̂ = -iℏ d/dx",
    operatorForm: "p̂ = -iℏ ∂/∂x",
    differentialForm: "p̂ψ = -iℏ dψ/dx",
    steps: [
      {
        rule: "Starting Point: de Broglie Relation",
        formula: "p = ℏk where k = 2π/λ is the wavenumber",
        action: "A free particle with momentum p has associated wavenumber k = p/ℏ",
        result: "Free particle wavefunction: ψ(x) = Ae^(ikx) = Ae^(ipx/ℏ)",
      },
      {
        rule: "Differentiation (Chain Rule)",
        formula: "d/dx [e^(ikx)] = ik·e^(ikx)",
        action: "Differentiate the plane wave with respect to x using chain rule: d/dx[e^(ax)] = ae^(ax)",
        result: "dψ/dx = ik·Ae^(ikx) = ik·ψ",
        highlight: true,
      },
      {
        rule: "Algebraic Manipulation",
        formula: "Multiply both sides by -iℏ",
        action: "Construct the operator: -iℏ dψ/dx = -iℏ(ik)ψ = ℏk·ψ",
        result: "-iℏ dψ/dx = ℏk·ψ = p·ψ",
      },
      {
        rule: "Eigenvalue Identification",
        formula: "Âψ = aψ identifies Â as operator, a as eigenvalue",
        action: "This has the form (operator)ψ = (eigenvalue)ψ, identifying p̂ = -iℏ d/dx",
        result: "p̂ψ = pψ  where p̂ = -iℏ d/dx",
        highlight: true,
      },
      {
        rule: "Operator Squaring (for Kinetic Energy)",
        formula: "p̂² = p̂·p̂ = (-iℏ d/dx)(-iℏ d/dx)",
        action: "Apply the momentum operator twice: (-iℏ)² = -ℏ²",
        result: "p̂² = -ℏ² d²/dx²",
      },
      {
        rule: "Connection to Kinetic Energy",
        formula: "T = p²/(2m) → T̂ = p̂²/(2m)",
        action: "Classical kinetic energy T = p²/(2m) becomes operator T̂ = -ℏ²/(2m) d²/dx²",
        result: "T̂ = -ℏ²/(2m) d²/dx²  — the kinetic energy operator",
        highlight: true,
      },
      {
        rule: "Commutation Relation",
        formula: "[x̂, p̂]ψ = x̂(p̂ψ) - p̂(x̂ψ)",
        action: "Compute: x(-iℏ dψ/dx) - (-iℏ) d(xψ)/dx. Apply Product Rule to d(xψ)/dx = ψ + x dψ/dx",
        result: "[x̂, p̂] = iℏ  — fundamental commutation relation",
      },
    ],
    finalAnswer: "p̂ = -iℏ d/dx,  p̂² = -ℏ² d²/dx²,  [x̂, p̂] = iℏ",
    physicalMeaning: "The momentum operator generates spatial translations. Its form arises naturally from requiring plane waves e^(ikx) to be momentum eigenstates with eigenvalue p = ℏk.",
    method: "Start from de Broglie → differentiate plane wave → identify operator form → verify commutation",
    notes: [
      "In 3D: p̂ = -iℏ∇ = -iℏ(∂/∂x, ∂/∂y, ∂/∂z)",
      "Eigenstates are non-normalizable → use wave packets for physical states",
      "The commutator [x̂, p̂] = iℏ is the mathematical origin of the uncertainty principle",
    ],
  };
}

function derivePlanck(): FullDerivation {
  return {
    title: "Planck Energy-Frequency Relation — Full Derivation",
    equation: "E = hf = ℏω",
    operatorForm: "Ê|n⟩ = nℏω|n⟩ (number state representation)",
    differentialForm: "E = hf where h = 6.626 × 10⁻³⁴ J·s",
    steps: [
      {
        rule: "Historical Context",
        formula: "Classical prediction: u(ν) → ∞ as ν → ∞ (ultraviolet catastrophe)",
        action: "Classical Rayleigh-Jeans law predicts infinite energy at high frequencies",
        result: "Classical physics fails for blackbody radiation",
      },
      {
        rule: "Planck's Quantization Hypothesis",
        formula: "Energy of oscillators is discrete: E = nhf, n = 0, 1, 2, ...",
        action: "Planck proposed that energy is not continuous but comes in quanta of size hf",
        result: "E = nhf — energy is quantized in units of hf",
        highlight: true,
      },
      {
        rule: "Angular Frequency Conversion",
        formula: "ω = 2πf → f = ω/(2π)",
        action: "Express in terms of angular frequency ω and reduced Planck constant ℏ = h/(2π)",
        result: "E = h·(ω/2π) = (h/2π)·ω = ℏω",
      },
      {
        rule: "Photon Energy (Einstein Extension)",
        formula: "Each photon carries energy E = hf",
        action: "Einstein extended Planck's idea: light itself is quantized into photons",
        result: "E_photon = hf = ℏω — single photon energy",
        highlight: true,
      },
      {
        rule: "Linear Relationship Analysis",
        formula: "E = hf → slope = h (Planck's constant), intercept = 0",
        action: "This is a linear equation y = mx + c with m = h, c = 0",
        result: "Plot E vs f: straight line through origin with slope h",
      },
      {
        rule: "Photoelectric Effect Application",
        formula: "Eₖ = hf - φ where φ = work function",
        action: "Kinetic energy of ejected electron: total photon energy minus binding energy",
        result: "Eₖ = hf - φ — threshold frequency: f₀ = φ/h",
        highlight: true,
      },
    ],
    finalAnswer: "E = hf = ℏω,  with h = 6.626 × 10⁻³⁴ J·s,  ℏ = 1.055 × 10⁻³⁴ J·s",
    physicalMeaning: "Energy quantization was the birth of quantum theory. It resolves the ultraviolet catastrophe and implies that electromagnetic energy exchange occurs in discrete packets (photons).",
    method: "Direct proportionality — no differential equation. This is a fundamental postulate.",
    notes: [
      "Visible light photon: E ≈ 2 eV",
      "The slope h from photoelectric experiments confirms quantum theory",
      "This relation connects wave properties (f, ω) with particle properties (E)",
    ],
  };
}

function deriveDeBroglie(): FullDerivation {
  return {
    title: "de Broglie Relation — Full Derivation",
    equation: "λ = h/p  or  p = ℏk",
    operatorForm: "p̂|k⟩ = ℏk|k⟩",
    differentialForm: "λ = h/(mv) for massive particles",
    steps: [
      {
        rule: "Starting Point: Photon Relations",
        formula: "Photon: E = hf and E = pc (massless particle)",
        action: "For photons, combine Einstein's E = hf with relativistic E = pc",
        result: "pc = hf → p = hf/c",
      },
      {
        rule: "Wave Relation",
        formula: "c = fλ → f = c/λ",
        action: "Use the fundamental wave equation: speed = frequency × wavelength",
        result: "p = h(c/λ)/c = h/λ",
        highlight: true,
      },
      {
        rule: "de Broglie's Bold Hypothesis",
        formula: "λ = h/p applies to ALL particles, not just photons",
        action: "de Broglie (1924) proposed that matter also has wave-like properties with wavelength λ = h/p",
        result: "λ = h/p = h/(mv) — matter wavelength",
      },
      {
        rule: "Wavenumber Form",
        formula: "k = 2π/λ and ℏ = h/(2π)",
        action: "Convert to wavenumber: p = h/λ = h·(k/2π) = (h/2π)·k = ℏk",
        result: "p = ℏk — momentum-wavenumber relation",
        highlight: true,
      },
      {
        rule: "Free Particle Wavefunction",
        formula: "ψ(x) = Ae^(ikx) where k = p/ℏ",
        action: "A particle with definite momentum p has wavefunction e^(ipx/ℏ)",
        result: "ψₚ(x) = Ae^(ipx/ℏ) — momentum eigenstate",
      },
      {
        rule: "Numerical Example: Electron",
        formula: "E = 100 eV → p = √(2mE)",
        action: "m = 9.109×10⁻³¹ kg, E = 1.602×10⁻¹⁷ J → p = 5.4×10⁻²⁴ kg·m/s",
        result: "λ = h/p ≈ 0.123 nm — comparable to atomic spacing (confirmed by diffraction)",
        highlight: true,
      },
    ],
    finalAnswer: "λ = h/p = h/(mv),  p = ℏk,  k = 2π/λ",
    physicalMeaning: "Every particle has an associated wavelength. This wave nature explains electron diffraction, quantum tunneling, and the quantization of energy levels in atoms.",
    method: "Photon analogy → generalization to matter → wavenumber form",
    notes: [
      "Davisson-Germer experiment (1927) confirmed electron diffraction",
      "Macroscopic objects: λ ≈ 10⁻³⁴ m — undetectable",
      "This relation bridges classical mechanics (p=mv) and wave mechanics (k, λ)",
    ],
  };
}

function deriveProbabilityCurrent(): FullDerivation {
  return {
    title: "Probability Current — Full Derivation",
    equation: "J = (ℏ/m) Im(ψ* ∂ψ/∂x)",
    operatorForm: "J = (1/2m)(ψ*p̂ψ + (p̂ψ)*ψ) = Re(ψ* p̂ψ/m)",
    differentialForm: "J = (ℏ/2mi)(ψ* ∂ψ/∂x - ψ ∂ψ*/∂x)",
    steps: [
      {
        rule: "Starting Point: Probability Density",
        formula: "ρ(x,t) = |ψ(x,t)|² = ψ*ψ",
        action: "The probability density must satisfy a conservation law (total probability = 1)",
        result: "∂ρ/∂t + ∂J/∂x = 0  — continuity equation (to be derived)",
      },
      {
        rule: "Product Rule for Time Derivative",
        formula: "∂(ψ*ψ)/∂t = (∂ψ*/∂t)ψ + ψ*(∂ψ/∂t)",
        action: "Differentiate ρ = ψ*ψ with respect to t using the product rule",
        result: "∂ρ/∂t = ψ̇*ψ + ψ*ψ̇",
        highlight: true,
      },
      {
        rule: "Substitute TDSE",
        formula: "iℏ ∂ψ/∂t = Ĥψ → ∂ψ/∂t = -i/ℏ · Ĥψ",
        action: "Use TDSE for ∂ψ/∂t and its conjugate for ∂ψ*/∂t",
        result: "∂ρ/∂t = (i/ℏ)(Ĥψ)*ψ + ψ*(-i/ℏ)(Ĥψ) = (i/ℏ)(Ĥψ*·ψ - ψ*·Ĥψ)",
      },
      {
        rule: "Operator Expansion",
        formula: "Ĥ = -ℏ²/(2m) ∂²/∂x² + V(x)",
        action: "Expand Ĥ. V(x) terms cancel (V is real): V*ψ*ψ - ψ*Vψ = 0",
        result: "∂ρ/∂t = (iℏ/2m)(∂²ψ*/∂x²·ψ - ψ*·∂²ψ/∂x²)",
        highlight: true,
      },
      {
        rule: "Product Rule (Reverse Application)",
        formula: "∂/∂x[ψ*·∂ψ/∂x - ψ·∂ψ*/∂x] = ψ*·∂²ψ/∂x² - ψ·∂²ψ*/∂x² + (cancel terms)",
        action: "Recognize that the expression is ∂/∂x of a simpler form (reverse product rule)",
        result: "∂ρ/∂t = -(∂/∂x)[(ℏ/2mi)(ψ*∂ψ/∂x - ψ∂ψ*/∂x)]",
      },
      {
        rule: "Identify Probability Current",
        formula: "Compare with continuity equation: ∂ρ/∂t + ∂J/∂x = 0",
        action: "The expression in brackets is the probability current J",
        result: "J = (ℏ/2mi)(ψ* ∂ψ/∂x - ψ ∂ψ*/∂x) = (ℏ/m) Im(ψ* ∂ψ/∂x)",
        highlight: true,
      },
      {
        rule: "Verification: Plane Wave",
        formula: "ψ = Ae^(i(kx-ωt))",
        action: "∂ψ/∂x = ikψ → ψ*∂ψ/∂x = |A|²ik → Im(...) = |A|²k",
        result: "J = |A|²ℏk/m = |A|²v  — probability flows at velocity v = p/m ✓",
        highlight: true,
      },
    ],
    finalAnswer: "J = (ℏ/2mi)(ψ* ∂ψ/∂x - ψ ∂ψ*/∂x) = (ℏ/m) Im(ψ* ∂ψ/∂x)",
    physicalMeaning: "Probability current describes how probability flows in space, analogous to charge current. Together with ρ = |ψ|², it ensures total probability is conserved: d/dt ∫|ψ|²dx = 0.",
    method: "Differentiate |ψ|² → substitute TDSE → reverse product rule → identify continuity equation",
    notes: [
      "J = 0 for standing waves (real ψ) — no net probability flow",
      "Reflection coefficient: R = J_reflected/J_incident = |B/A|²",
      "Transmission coefficient: T = (k₂/k₁)|C/A|² at potential steps",
    ],
  };
}

function deriveHarmonicOscillator(): FullDerivation {
  return {
    title: "Quantum Harmonic Oscillator — Full Derivation",
    equation: "-ℏ²/(2m) d²ψ/dx² + ½mω²x²ψ = Eψ",
    operatorForm: "Ĥ = p̂²/(2m) + ½mω²x̂²",
    differentialForm: "d²ψ/dx² + (2m/ℏ²)(E - ½mω²x²)ψ = 0",
    steps: [
      {
        rule: "Operator Expansion",
        formula: "Ĥ = T̂ + V̂ = p̂²/(2m) + ½mω²x̂²",
        action: "The harmonic oscillator potential V(x) = ½mω²x² replaces V̂",
        result: "[-ℏ²/(2m) d²/dx² + ½mω²x²]ψ = Eψ",
      },
      {
        rule: "Substitution: Dimensionless Variable",
        formula: "Let ξ = αx where α = √(mω/ℏ), and ε = 2E/(ℏω)",
        action: "Non-dimensionalize: d/dx = α·d/dξ, d²/dx² = α²·d²/dξ²",
        result: "d²ψ/dξ² + (ε - ξ²)ψ = 0",
        highlight: true,
      },
      {
        rule: "Asymptotic Analysis (Large ξ)",
        formula: "For |ξ| → ∞: d²ψ/dξ² ≈ ξ²ψ → ψ ~ e^(-ξ²/2)",
        action: "At large ξ, the ε term is negligible. The solution must decay as Gaussian",
        result: "ψ(ξ) = H(ξ)·e^(-ξ²/2) where H(ξ) is a polynomial (to be determined)",
      },
      {
        rule: "Product Rule + Chain Rule (Substitution)",
        formula: "d/dξ[H·e^(-ξ²/2)] = (H' - ξH)e^(-ξ²/2)",
        action: "Substitute ψ = H·e^(-ξ²/2) into the ODE. Apply product rule twice",
        result: "H'' - 2ξH' + (ε-1)H = 0  — Hermite's differential equation",
        highlight: true,
      },
      {
        rule: "Power Series Method",
        formula: "H(ξ) = Σ aₖξᵏ → recurrence: aₖ₊₂ = [2k-(ε-1)]aₖ/[(k+1)(k+2)]",
        action: "Assume power series, substitute, and match coefficients (using power rule)",
        result: "Series must terminate for normalizability: ε - 1 = 2n → ε = 2n + 1",
      },
      {
        rule: "Energy Quantization",
        formula: "ε = 2E/(ℏω) = 2n + 1 → E = (n + ½)ℏω",
        action: "The termination condition gives quantized energy levels",
        result: "Eₙ = (n + ½)ℏω,  n = 0, 1, 2, ...",
        highlight: true,
      },
      {
        rule: "Hermite Polynomials",
        formula: "H₀ = 1, H₁ = 2ξ, H₂ = 4ξ²-2, H₃ = 8ξ³-12ξ",
        action: "The truncated series gives Hermite polynomials Hₙ(ξ)",
        result: "ψₙ(x) = Nₙ Hₙ(αx) e^(-α²x²/2) with α = √(mω/ℏ)",
      },
      {
        rule: "Normalization",
        formula: "∫|ψₙ|²dx = 1 → Nₙ = (α/π)^(1/4) / √(2ⁿn!)",
        action: "Compute normalization constant using Gaussian integral and Hermite orthogonality",
        result: "ψₙ(x) = (mω/πℏ)^(1/4) · (1/√(2ⁿn!)) · Hₙ(αx) · e^(-mωx²/(2ℏ))",
      },
    ],
    finalAnswer: "Eₙ = (n + ½)ℏω,  ψₙ(x) = Nₙ·Hₙ(αx)·e^(-α²x²/2),  α = √(mω/ℏ)",
    physicalMeaning: "The quantum harmonic oscillator has equally spaced energy levels with zero-point energy E₀ = ½ℏω. It models molecular vibrations, phonons, photons, and is the foundation of quantum field theory.",
    method: "Substitution → asymptotic analysis → Hermite equation → series termination → quantization",
    notes: [
      "Zero-point energy ½ℏω is a purely quantum effect — no classical analog",
      "Ladder operators â and â† provide an algebraic solution method",
      "Adjacent levels: ΔE = ℏω (uniform spacing) — unique to harmonic potential",
    ],
  };
}

function deriveAngularMomentum(): FullDerivation {
  return {
    title: "Angular Momentum Operator — Full Derivation",
    equation: "L̂ = r̂ × p̂",
    operatorForm: "L̂z = x̂p̂y - ŷp̂x",
    differentialForm: "L̂z = -iℏ ∂/∂φ",
    steps: [
      {
        rule: "Classical Definition",
        formula: "L = r × p (cross product of position and momentum)",
        action: "Classical angular momentum: L = r × p with components Lz = xpy - ypx",
        result: "L = (ypz - zpy, zpx - xpz, xpy - ypx)",
      },
      {
        rule: "Operator Promotion",
        formula: "Replace classical variables with operators: x→x̂, p→p̂",
        action: "Quantize by replacing classical observables with their operator forms",
        result: "L̂z = x̂p̂y - ŷp̂x = -iℏ(x ∂/∂y - y ∂/∂x)",
        highlight: true,
      },
      {
        rule: "Coordinate Transformation (Chain Rule)",
        formula: "x = r sinθ cosφ, y = r sinθ sinφ, z = r cosθ",
        action: "Transform to spherical coordinates using chain rule for partial derivatives",
        result: "∂/∂φ = x ∂/∂y - y ∂/∂x (by chain rule computation)",
      },
      {
        rule: "Simplification",
        formula: "L̂z = -iℏ(x ∂/∂y - y ∂/∂x) = -iℏ ∂/∂φ",
        action: "The z-component simplifies to a single partial derivative in spherical coords",
        result: "L̂z = -iℏ ∂/∂φ",
        highlight: true,
      },
      {
        rule: "Eigenvalue Equation",
        formula: "L̂z Φ(φ) = mℏ Φ(φ)",
        action: "Solve -iℏ dΦ/dφ = mℏΦ → dΦ/Φ = im dφ",
        result: "Φ(φ) = e^(imφ),  m = 0, ±1, ±2, ...",
      },
      {
        rule: "Periodicity Boundary Condition",
        formula: "Φ(φ + 2π) = Φ(φ) → e^(im2π) = 1",
        action: "Wavefunction must be single-valued → m must be integer",
        result: "m = 0, ±1, ±2, ..., ±l  — magnetic quantum number",
        highlight: true,
      },
      {
        rule: "L² Operator and Total Angular Momentum",
        formula: "L̂² = L̂x² + L̂y² + L̂z²",
        action: "In spherical coordinates, L̂² involves θ and φ derivatives",
        result: "L̂²Y = l(l+1)ℏ²Y,  L̂zY = mℏY  — spherical harmonics Y_l^m(θ,φ)",
      },
    ],
    finalAnswer: "L̂z = -iℏ ∂/∂φ,  eigenvalues mℏ;  L̂² eigenvalues l(l+1)ℏ²",
    physicalMeaning: "Angular momentum is quantized in both magnitude (l) and z-projection (m). This explains atomic orbital shapes, spectral line splitting (Zeeman effect), and selection rules.",
    method: "Classical L = r×p → operator promotion → spherical coord transformation → eigenvalue equation",
    notes: [
      "l = 0,1,2,... (orbital quantum number); m = -l,...,+l",
      "[L̂x, L̂y] = iℏL̂z — components don't commute → can't know all simultaneously",
      "Spin angular momentum Ŝ follows same algebra but with half-integer values",
    ],
  };
}

function deriveHydrogenAtom(): FullDerivation {
  return {
    title: "Hydrogen Atom — Full Derivation",
    equation: "[-ℏ²/(2μ)∇² - e²/(4πε₀r)]ψ = Eψ",
    operatorForm: "Ĥ = T̂ + V̂ = p̂²/(2μ) - e²/(4πε₀r̂)",
    differentialForm: "∇²ψ + (2μ/ℏ²)[E + e²/(4πε₀r)]ψ = 0",
    steps: [
      {
        rule: "Operator Expansion",
        formula: "Ĥ = -ℏ²/(2μ)∇² + V(r), V(r) = -e²/(4πε₀r)",
        action: "Coulomb potential V(r) = -e²/(4πε₀r) for electron-proton system",
        result: "[-ℏ²/(2μ)∇² - e²/(4πε₀r)]ψ = Eψ",
      },
      {
        rule: "Laplacian in Spherical Coordinates",
        formula: "∇² = (1/r²)∂/∂r(r²∂/∂r) + (1/r²)L̂²/(−ℏ²)",
        action: "Expand ∇² in spherical coordinates: radial + angular parts",
        result: "[-ℏ²/(2μr²) ∂/∂r(r²∂/∂r) + L̂²/(2μr²) - e²/(4πε₀r)]ψ = Eψ",
        highlight: true,
      },
      {
        rule: "Separation of Variables",
        formula: "ψ(r,θ,φ) = R(r)·Y_l^m(θ,φ)",
        action: "Angular part Y gives L̂²Y = l(l+1)ℏ²Y (already solved)",
        result: "Radial equation: -ℏ²/(2μ) [d²R/dr² + (2/r)dR/dr] + [l(l+1)ℏ²/(2μr²) - e²/(4πε₀r)]R = ER",
        highlight: true,
      },
      {
        rule: "Substitution: u(r) = rR(r)",
        formula: "R = u/r → dR/dr = (u'r - u)/r² → simplifies second derivative",
        action: "Eliminates the first-derivative term using product rule",
        result: "-ℏ²/(2μ) d²u/dr² + [l(l+1)ℏ²/(2μr²) - e²/(4πε₀r)]u = Eu",
      },
      {
        rule: "Asymptotic Analysis + Series Solution",
        formula: "As r→∞: u ~ e^(-κr). As r→0: u ~ r^(l+1)",
        action: "Factor out asymptotic behavior: u = r^(l+1)·e^(-κr)·v(r), then power series for v",
        result: "Series must terminate → quantization condition: n = l+1, l+2, ...",
        highlight: true,
      },
      {
        rule: "Energy Quantization",
        formula: "Eₙ = -μe⁴/(32π²ε₀²ℏ²n²) = -13.6 eV/n²",
        action: "Termination condition gives the Bohr energy formula",
        result: "Eₙ = -13.6/n² eV,  n = 1, 2, 3, ...",
        highlight: true,
      },
    ],
    finalAnswer: "Eₙ = -13.6/n² eV,  ψₙₗₘ = Rₙₗ(r)·Y_l^m(θ,φ),  n = 1,2,...; l = 0,...,n-1; m = -l,...,+l",
    physicalMeaning: "The hydrogen atom solution explains atomic spectra, orbital shapes (s,p,d,f), and the periodic table. Energy depends only on n (accidental degeneracy unique to 1/r potential).",
    method: "Spherical coord separation → radial ODE → series method → quantization",
    notes: [
      "Degeneracy: n² states for each n (without spin: 2n² with spin)",
      "Ground state: E₁ = -13.6 eV, Bohr radius a₀ = 0.529 Å",
      "Spectral lines: ΔE = 13.6(1/n₁² - 1/n₂²) eV — Balmer, Lyman, etc.",
    ],
  };
}

// ─── Master Derivation Lookup ───
export const derivationDatabase: Record<string, () => FullDerivation> = {
  tdse: deriveTDSE,
  tise: deriveTISE,
  expectation: deriveExpectation,
  momentum: deriveMomentum,
  planck: derivePlanck,
  debroglie: deriveDeBroglie,
  probability_current: deriveProbabilityCurrent,
  harmonic_oscillator: deriveHarmonicOscillator,
  angular_momentum: deriveAngularMomentum,
  hydrogen_atom: deriveHydrogenAtom,
};

// ─── Enhanced equation detection ───
export function detectEquationAdvanced(input: string): string | null {
  const lower = input.toLowerCase().replace(/\s+/g, "");
  
  // Hydrogen atom
  if (lower.includes("hydrogen") || lower.includes("-e²/(4πε₀r)") || lower.includes("coulomb") || lower.includes("-13.6")) return "hydrogen_atom";
  // Harmonic oscillator  
  if (lower.includes("½mω²") || lower.includes("harmonic") || lower.includes("mω²x²") || lower.includes("oscillator")) return "harmonic_oscillator";
  // Angular momentum
  if (lower.includes("l̂") || lower.includes("angular") || lower.includes("r×p") || lower.includes("r̂×p̂") || lower.includes("∂/∂φ")) return "angular_momentum";
  // TDSE
  if (lower.includes("iℏ") && (lower.includes("∂ψ/∂t") || lower.includes("∂ψ"))) return "tdse";
  if (lower.includes("time-dependent") || lower.includes("tdse")) return "tdse";
  // TISE
  if (lower.includes("ĥψ=eψ") || lower.includes("ĥψ") || lower.includes("tise") || lower.includes("time-independent")) return "tise";
  // Expectation
  if (lower.includes("⟨a⟩") || lower.includes("expectation") || lower.includes("ψ*â") || lower.includes("⟨ψ|")) return "expectation";
  // Momentum
  if (lower.includes("p̂") || lower.includes("p^") || (lower.includes("momentum") && lower.includes("operator"))) return "momentum";
  // Planck
  if (lower.includes("e=hf") || lower.includes("planck") || lower.includes("ℏω") || lower.includes("e=ℏω")) return "planck";
  // de Broglie
  if (lower.includes("debroglie") || lower.includes("h/λ") || lower.includes("ℏk") || lower.includes("broglie") || lower.includes("λ=h/p")) return "debroglie";
  // Probability current
  if (lower.includes("probability") && lower.includes("current") || lower.includes("ℑ(ψ") || lower.includes("im(ψ")) return "probability_current";
  // Fallback
  if (lower.includes("iℏ")) return "tdse";
  if (lower.includes("ĥ") && lower.includes("ψ")) return "tise";
  
  return null;
}
