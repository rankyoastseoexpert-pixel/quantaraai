import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = ["All", "Operators", "Constants", "Equations", "Potentials", "Spin Systems"];

interface LibEntry {
  category: string;
  name: string;
  equation: string;
  explanation: string;
  meaning: string;
  method: string;
}

const libraryData: LibEntry[] = [
  // Operators
  { category: "Operators", name: "Hamiltonian Operator", equation: "Ĥ = -ℏ²/2m ∇² + V(x)", explanation: "Total energy operator combining kinetic and potential terms.", meaning: "Governs the time evolution of quantum systems via the Schrödinger equation.", method: "Eigenvalue problem Ĥψ = Eψ" },
  { category: "Operators", name: "Momentum Operator", equation: "p̂ = -iℏ ∂/∂x", explanation: "Generates spatial translations in quantum mechanics.", meaning: "Observable corresponding to linear momentum of a particle.", method: "Fourier transform to momentum space" },
  { category: "Operators", name: "Position Operator", equation: "x̂ψ(x) = xψ(x)", explanation: "Multiplication by coordinate x in position representation.", meaning: "Observable corresponding to the position of a particle.", method: "Direct multiplication in position basis" },
  { category: "Operators", name: "Angular Momentum", equation: "L̂ = r̂ × p̂", explanation: "Cross product of position and momentum operators.", meaning: "Quantized orbital angular momentum with eigenvalues ℏ√(l(l+1)).", method: "Spherical harmonics Yₗₘ(θ,φ)" },
  { category: "Operators", name: "Spin Operators", equation: "Ŝᵢ = ℏ/2 σᵢ", explanation: "Intrinsic angular momentum operators using Pauli matrices.", meaning: "Describes spin-½ particles with two eigenstates |↑⟩, |↓⟩.", method: "Matrix diagonalization of σ matrices" },
  { category: "Operators", name: "Pauli Matrices", equation: "σₓ = (⁰₁ ₁⁰), σᵧ = (⁰₋ᵢ ᵢ⁰), σ_z = (¹₀ ⁰₋₁)", explanation: "Three 2×2 matrices forming a basis for spin-½ operators.", meaning: "Fundamental building blocks for two-level quantum systems.", method: "Direct matrix multiplication and commutation" },
  { category: "Operators", name: "Creation & Annihilation", equation: "â†|n⟩ = √(n+1)|n+1⟩, â|n⟩ = √n|n-1⟩", explanation: "Ladder operators for the quantum harmonic oscillator.", meaning: "Add or remove quanta of energy from oscillator states.", method: "Algebraic (Fock space) method" },
  { category: "Operators", name: "Number Operator", equation: "N̂ = â†â", explanation: "Counts the number of quanta in a state.", meaning: "Eigenvalues are non-negative integers n = 0, 1, 2, ...", method: "N̂|n⟩ = n|n⟩" },
  { category: "Operators", name: "Projection Operator", equation: "P̂ₙ = |n⟩⟨n|", explanation: "Projects onto the eigenstate |n⟩.", meaning: "Used in measurement theory and spectral decomposition.", method: "Outer product construction" },
  { category: "Operators", name: "Time Evolution Operator", equation: "Û(t) = e^{-iĤt/ℏ}", explanation: "Evolves quantum states forward in time.", meaning: "Unitary operator preserving probability normalization.", method: "Matrix exponentiation or series expansion" },

  // Constants
  { category: "Constants", name: "Reduced Planck Constant", equation: "ℏ = 1.0546 × 10⁻³⁴ J·s", explanation: "Fundamental quantum of action, h/2π.", meaning: "Sets the scale of quantum effects; appears in all quantum equations.", method: "—" },
  { category: "Constants", name: "Speed of Light", equation: "c = 2.998 × 10⁸ m/s", explanation: "Maximum speed of information propagation.", meaning: "Fundamental constant linking space and time in relativity.", method: "—" },
  { category: "Constants", name: "Elementary Charge", equation: "e = 1.602 × 10⁻¹⁹ C", explanation: "Charge of a proton (magnitude of electron charge).", meaning: "Determines electromagnetic interaction strength.", method: "—" },
  { category: "Constants", name: "Vacuum Permittivity", equation: "ε₀ = 8.854 × 10⁻¹² F/m", explanation: "Electric constant appearing in Coulomb's law.", meaning: "Relates electric field strength to charge distribution.", method: "—" },
  { category: "Constants", name: "Vacuum Permeability", equation: "μ₀ = 4π × 10⁻⁷ H/m", explanation: "Magnetic constant relating current to magnetic field.", meaning: "Fundamental constant of magnetostatics.", method: "—" },
  { category: "Constants", name: "Boltzmann Constant", equation: "k_B = 1.381 × 10⁻²³ J/K", explanation: "Relates temperature to energy at the molecular scale.", meaning: "Bridge between macroscopic thermodynamics and microscopic physics.", method: "—" },

  // Equations
  { category: "Equations", name: "TDSE", equation: "iℏ ∂Ψ/∂t = ĤΨ", explanation: "Time-dependent Schrödinger equation governing quantum evolution.", meaning: "Describes how a quantum state evolves in time.", method: "Separation of variables, numerical integration" },
  { category: "Equations", name: "TISE", equation: "Ĥψ = Eψ", explanation: "Time-independent Schrödinger equation for stationary states.", meaning: "Eigenvalue equation yielding allowed energy levels.", method: "Boundary conditions + eigenvalue methods" },
  { category: "Equations", name: "Klein–Gordon", equation: "(∂² - ∇² + m²)φ = 0", explanation: "Relativistic wave equation for spin-0 particles.", meaning: "Lorentz-covariant generalization of Schrödinger equation.", method: "Fourier transform, Green's functions" },
  { category: "Equations", name: "Heat Equation", equation: "∂u/∂t = α∇²u", explanation: "Parabolic PDE describing heat diffusion.", meaning: "Models temperature distribution over time in a medium.", method: "Separation of variables, Fourier series" },
  { category: "Equations", name: "Wave Equation", equation: "∂²u/∂t² = c²∇²u", explanation: "Hyperbolic PDE describing wave propagation.", meaning: "Models mechanical, electromagnetic, and acoustic waves.", method: "d'Alembert solution, normal modes" },
  { category: "Equations", name: "Laplace Equation", equation: "∇²φ = 0", explanation: "Elliptic PDE for steady-state potentials.", meaning: "Solutions (harmonic functions) describe equilibrium configurations.", method: "Separation of variables, conformal mapping" },
  { category: "Equations", name: "Helmholtz Equation", equation: "∇²u + k²u = 0", explanation: "Time-independent form of the wave equation.", meaning: "Describes spatial part of monochromatic wave solutions.", method: "Eigenfunction expansion, Bessel functions" },
];

const QuantumLibrary = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = libraryData.filter(entry => {
    const matchesCat = activeCategory === "All" || entry.category === activeCategory;
    const matchesSearch = !search || entry.name.toLowerCase().includes(search.toLowerCase()) || entry.equation.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <PageLayout>
      <div className="container px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Quantum <span className="text-gradient">Library</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Academic reference — operators, constants, equations, and formulas.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 bg-secondary/50 border-border text-sm w-full sm:w-64"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <GlassCard hover className="h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{entry.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {entry.category}
                  </span>
                </div>
                <div className="font-mono text-sm text-primary mb-3 p-2 rounded-md bg-secondary/30 border border-border/30">
                  {entry.equation}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{entry.explanation}</p>
                <div className="text-xs space-y-1">
                  <div><span className="text-foreground/70 font-medium">Physical meaning:</span> <span className="text-muted-foreground">{entry.meaning}</span></div>
                  <div><span className="text-foreground/70 font-medium">Solution method:</span> <span className="text-muted-foreground">{entry.method}</span></div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No entries found matching your search.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default QuantumLibrary;
