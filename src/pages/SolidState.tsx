import { useState, lazy, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Atom, Grid3X3, Hexagon, Compass, BarChart3, ChevronLeft, ChevronRight, AudioWaveform, Activity } from "lucide-react";

const KronigPenneySimulator = lazy(() => import("@/components/solid-state/KronigPenneySimulator"));
const TightBindingModel = lazy(() => import("@/components/solid-state/TightBindingModel"));
const LatticeSimulation = lazy(() => import("@/components/solid-state/LatticeSimulation"));
const BrillouinZone = lazy(() => import("@/components/solid-state/BrillouinZone"));
const BandDiagramTool = lazy(() => import("@/components/solid-state/BandDiagramTool"));
const PhononDispersion = lazy(() => import("@/components/solid-state/PhononDispersion"));
const DensityOfStates = lazy(() => import("@/components/solid-state/DensityOfStates"));

type SubModule = "kronig-penney" | "tight-binding" | "lattice" | "brillouin" | "band-diagram" | "phonon" | "dos";

const modules: { key: SubModule; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "kronig-penney", label: "Kronig–Penney", icon: Atom, desc: "1D periodic potential band structure" },
  { key: "tight-binding", label: "Tight-Binding", icon: Grid3X3, desc: "Hopping model & DOS" },
  { key: "dos", label: "Density of States", icon: Activity, desc: "1D / 2D / 3D DOS & Fermi–Dirac" },
  { key: "lattice", label: "Lattice Builder", icon: Hexagon, desc: "Real & reciprocal space" },
  { key: "brillouin", label: "Brillouin Zone", icon: Compass, desc: "k-space navigation" },
  { key: "band-diagram", label: "Band Diagram", icon: BarChart3, desc: "Material band plotting" },
  { key: "phonon", label: "Phonon Dispersion", icon: AudioWaveform, desc: "Acoustic & optical branches" },
];

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SolidState() {
  const [active, setActive] = useState<SubModule>("kronig-penney");
  const [collapsed, setCollapsed] = useState(false);

  const ActiveModule = () => {
    switch (active) {
      case "kronig-penney": return <KronigPenneySimulator />;
      case "tight-binding": return <TightBindingModel />;
      case "lattice": return <LatticeSimulation />;
      case "brillouin": return <BrillouinZone />;
      case "band-diagram": return <BandDiagramTool />;
      case "phonon": return <PhononDispersion />;
      case "dos": return <DensityOfStates />;
    }
  };

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 56 : 260 }}
          transition={{ duration: 0.2 }}
          className="border-r border-border/50 bg-background/60 backdrop-blur-sm flex-shrink-0 flex flex-col"
        >
          <div className="p-3 border-b border-border/30 flex items-center justify-between">
            {!collapsed && (
              <h2 className="text-xs font-bold text-foreground tracking-wider uppercase">Solid-State</h2>
            )}
            <button onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {modules.map(m => {
              const Icon = m.icon;
              const isActive = active === m.key;
              return (
                <button key={m.key} onClick={() => setActive(m.key)}
                  className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    collapsed ? "p-2 justify-center" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                  }`}
                  title={collapsed ? m.label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && (
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium truncate">{m.label}</p>
                      <p className="text-[9px] opacity-60 truncate">{m.desc}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="p-3 border-t border-border/30">
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Graduate-level solid-state physics simulations with interactive visualizations.
              </p>
            </div>
          )}
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-1">
                {(() => { const Icon = modules.find(m => m.key === active)!.icon; return <Icon size={22} className="text-primary" />; })()}
                <h1 className="text-xl font-bold text-foreground">
                  {modules.find(m => m.key === active)!.label}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground ml-[34px]">
                {modules.find(m => m.key === active)!.desc}
              </p>
            </motion.div>

            <Suspense fallback={<Loader />}>
              <ActiveModule />
            </Suspense>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}
