import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef, useState, lazy, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import quantaraLogo from "@/assets/quantara-logo.png";
import demoVideo from "@/assets/quantara-demo.mp4";
import demoThumbnail from "@/assets/demo-thumbnail.jpg";
import FloatingEquations from "@/components/FloatingEquations";
import HeroWaveAnimation from "@/components/HeroWaveAnimation";
import ScienceBackground from "@/components/ScienceBackground";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Activity,
  Atom,
  BarChart3,
  FileDown,
  Zap,
  Eye,
  ChevronRight,
  Waves,
  Check,
  X,
  Star,
  Play,
  Quote,
} from "lucide-react";
import FloatingScientificModels from "@/components/FloatingScientificModels";
import InteractivePeriodicTable from "@/components/InteractivePeriodicTable";

const FloatingMolecule = lazy(() => import("@/components/MolecularModels"));

const stats = [
  { value: "50+", label: "Equation Types" },
  { value: "12", label: "Quantum Models" },
  { value: "∞", label: "Visualizations" },
  { value: "100%", label: "Validated" },
];

const features = [
  {
    icon: Waves,
    title: "Time-Dependent Schrödinger Solver",
    desc: "Simulate quantum state evolution iℏ∂ψ/∂t = Ĥψ with real-time wavefunction animation.",
  },
  {
    icon: Atom,
    title: "Time-Independent Solver",
    desc: "Find energy eigenvalues and eigenstates for bound and scattering potentials.",
  },
  {
    icon: Eye,
    title: "Potential Visualizer",
    desc: "Interactive potential energy landscapes with barrier, well, and harmonic oscillator presets.",
  },
  {
    icon: BarChart3,
    title: "Wavefunction Graphing Engine",
    desc: "Publication-quality plots of ψ(x), |ψ|², probability currents, and energy spectra.",
  },
  {
    icon: Activity,
    title: "Classical Equation Solver",
    desc: "Differential equations, integrals, and linear algebra with step-by-step derivations.",
  },
  {
    icon: FileDown,
    title: "Data Export Tools",
    desc: "Export solutions as LaTeX, PDF, SVG, or PNG for academic publications and reports.",
  },
];

const workflowSteps = [
  {
    title: "Input Your Equation",
    desc: "Type or select from presets — Schrödinger, Legendre, Bessel, Heat, Wave equations and more.",
    icon: "ψ",
  },
  {
    title: "Watch It Solve",
    desc: "Animated step-by-step derivations with progress tracking and intermediate results.",
    icon: "∂",
  },
  {
    title: "Visualize Results",
    desc: "Interactive graphs with wavefunctions, probability densities, and energy level diagrams.",
    icon: "∫",
  },
  {
    title: "Export & Verify",
    desc: "Download publication-ready outputs with full numerical validation and convergence analysis.",
    icon: "✓",
  },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const ComparisonCell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15"><Check size={12} className="text-primary" /></span>;
  if (value === false) return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/30"><X size={12} className="text-muted-foreground/50" /></span>;
  return <span className="text-[10px] text-muted-foreground">{value}</span>;
};

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.92]);

  return (
    <PageLayout>
      <ScienceBackground />
      <FloatingScientificModels />

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <FloatingEquations />
        <HeroWaveAnimation />

        {/* 3D Molecules — lazy loaded, positioned as bg decorations */}
        <Suspense fallback={null}>
          <FloatingMolecule type="water" className="absolute left-[3%] top-[10%] w-[180px] h-[180px] hidden lg:block z-0" />
          <FloatingMolecule type="methane" className="absolute right-[3%] top-[15%] w-[160px] h-[160px] hidden lg:block z-0" />
        </Suspense>

        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, hsl(195 100% 50% / 0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          className="container relative z-10 px-4 text-center"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-medium text-primary"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Research-Grade Scientific Platform
            </motion.div>

            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.7 }}
            >
              <img
                src={quantaraLogo}
                alt="Quantara AI Logo"
                className="h-20 sm:h-28 lg:h-36 w-auto drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
              />
            </motion.div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-[0.95]">
              <motion.span
                className="text-foreground inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Quantara{" "}
              </motion.span>
              <motion.span
                className="text-gradient glow-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                AI
              </motion.span>
            </h1>

            <motion.p
              className="text-xl sm:text-2xl text-foreground/80 max-w-2xl mx-auto mb-3 font-light tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Precision Mathematics. Visual Quantum Insight.
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Advanced quantum and classical equation solvers with interactive visualization,
              symbolic computation, and reproducible numerical workflows.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-full px-8 text-sm font-semibold hero-gradient-btn text-primary-foreground border-0"
              >
                <Link to="/solver">
                  Get Started <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 text-sm border-border/50 hover:bg-secondary/50 hover:border-primary/30"
              >
                <Link to="/quantum">Open Quantum Solver</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground/60"
            >
              <span className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary/50" /> Instant Results
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Atom size={12} className="text-primary/50" /> 12+ Quantum Models
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <FileDown size={12} className="text-primary/50" /> PDF / LaTeX Export
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="relative py-16">
        <div className="container px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={staggerItem}>
                <GlassCard className="text-center py-8" glow>
                  <motion.div
                    className="text-3xl sm:text-4xl font-bold text-gradient mb-1 font-mono"
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  >
                    {s.value}
                  </motion.div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ WORKFLOW ═══════ */}
      <ParallaxSection offset={40}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                From <span className="text-gradient">Equations</span> to{" "}
                <span className="text-gradient">Verified Results</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                A seamless workflow designed for researchers, students, and scientists.
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {workflowSteps.map((step, i) => (
                <motion.div key={step.title} variants={staggerItem} className="relative">
                  <GlassCard hover className="h-full text-center">
                    <motion.div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-mono text-xl font-bold"
                      whileInView={{ rotate: [0, 10, -10, 0] }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 + 0.5, duration: 0.6 }}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-xs font-semibold text-primary/60 uppercase tracking-wider mb-2">
                      Step {i + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </GlassCard>
                  {i < workflowSteps.length - 1 && (
                    <motion.div
                      className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 + 0.8 }}
                    >
                      <ChevronRight size={16} className="text-primary/30" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ FEATURES ═══════ */}
      <ParallaxSection offset={30}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Built for <span className="text-gradient">Scientific Research</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Every tool designed for precision, clarity, and reproducibility.
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {features.map((f, i) => (
                <motion.div key={f.title} variants={staggerItem} className="group">
                  <GlassCard hover tilt className="h-full">
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <f.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-sm font-semibold mb-2 text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ 3D MOLECULAR MODELS ═══════ */}
      <ParallaxSection offset={20}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                3D <span className="text-gradient">Molecular Models</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Interactive Three.js molecular visualizations with accurate geometry and bonding.
              </p>
            </motion.div>

            <Suspense fallback={null}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {([
                  { type: "water" as const, label: "H₂O — Water", desc: "Bent geometry, 104.5° bond angle" },
                  { type: "methane" as const, label: "CH₄ — Methane", desc: "Tetrahedral, sp³ hybridization" },
                  { type: "crystal" as const, label: "Cubic Lattice", desc: "3×3×3 crystal unit cell" },
                  { type: "mg" as const, label: "Mg — HCP", desc: "Hexagonal close-packed structure" },
                ]).map((mol, i) => (
                  <motion.div
                    key={mol.type}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                  >
                    <GlassCard hover className="h-full">
                      <div className="h-[200px] -mx-2 -mt-2">
                        <FloatingMolecule type={mol.type} className="w-full h-full" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground font-mono mt-2">{mol.label}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">{mol.desc}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </Suspense>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ INTERACTIVE PERIODIC TABLE ═══════ */}
      <ParallaxSection offset={15}>
        <InteractivePeriodicTable />
      </ParallaxSection>

      {/* ═══════ INTERACTIVE DEMO PREVIEW ═══════ */}
      <ParallaxSection offset={25}>
        <section className="relative py-24">
          <div className="container px-4">
            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  See Quantum Physics{" "}
                  <span className="text-gradient">Come Alive</span>
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Watch wavefunctions evolve in real-time, explore energy eigenvalues,
                  and interact with probability distributions — all rendered with
                  publication-quality precision.
                </p>
                <div className="space-y-3">
                  {[
                    "Real-time wavefunction evolution |Ψ(x,t)|²",
                    "Interactive energy level diagrams",
                    "Step-by-step animated derivations",
                    "Export-ready scientific graphs",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 text-sm text-foreground/80"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    >
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                      />
                      {item}
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    asChild
                    className="gap-2 rounded-full px-6 hero-gradient-btn text-primary-foreground border-0"
                  >
                    <Link to="/quantum">
                      Try Live Demo <ArrowRight size={14} />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <GlassCard glow className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                        quantum-solver.wq
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="font-mono text-xs text-primary/80 space-y-1">
                      <p><span className="text-muted-foreground">eq:</span> iℏ ∂Ψ/∂t = ĤΨ</p>
                      <p><span className="text-muted-foreground">V(x):</span> ½mω²x²</p>
                      <p><span className="text-muted-foreground">n:</span> 0, 1, 2, 3</p>
                    </div>
                    <svg className="w-full h-32" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="demoWave" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(195 100% 50%)" stopOpacity="0" />
                          <stop offset="50%" stopColor="hsl(195 100% 50%)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="hsl(210 100% 56%)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path stroke="url(#demoWave)" strokeWidth="2" fill="none">
                        <animate
                          attributeName="d"
                          dur="3s"
                          repeatCount="indefinite"
                          values="
                            M0,50 C50,20 100,80 150,50 C200,20 250,80 300,50 C350,20 400,50 400,50;
                            M0,50 C50,80 100,20 150,50 C200,80 250,20 300,50 C350,80 400,50 400,50;
                            M0,50 C50,20 100,80 150,50 C200,20 250,80 300,50 C350,20 400,50 400,50
                          "
                        />
                      </path>
                      <path stroke="hsl(210 100% 56%)" strokeWidth="1" fill="none" opacity="0.3">
                        <animate
                          attributeName="d"
                          dur="4s"
                          repeatCount="indefinite"
                          values="
                            M0,50 C80,35 160,65 240,50 C320,35 400,50 400,50;
                            M0,50 C80,65 160,35 240,50 C320,65 400,50 400,50;
                            M0,50 C80,35 160,65 240,50 C320,35 400,50 400,50
                          "
                        />
                      </path>
                    </svg>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>E₀ = ½ℏω</span>
                      <span>|ψ₀(x)|² = Gaussian</span>
                      <span className="text-green-400">✓ Converged</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ VIDEO DEMO ═══════ */}
      <ParallaxSection offset={20}>
        <section className="relative py-24" id="demo">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Watch How Our Step-by-Step{" "}
                <span className="text-gradient">Quantum Solver</span> Works
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                See every feature in action — equation input, step-by-step derivations, interactive plots, and more.
              </p>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Video Player */}
              <GlassCard glow className="p-0 overflow-hidden">
                <div className="relative aspect-video bg-background/50">
                  <video
                    className="w-full h-full object-cover"
                    poster={demoThumbnail}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    loop
                  >
                    <source src={demoVideo} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                </div>

                {/* Video caption bar */}
                <div className="px-5 py-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1.5"><Atom size={11} className="text-primary" /> Quantum Solver</span>
                    <span className="flex items-center gap-1.5"><Activity size={11} className="text-primary" /> Step-by-Step</span>
                    <span className="flex items-center gap-1.5"><BarChart3 size={11} className="text-primary" /> Interactive Plots</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50">Full platform walkthrough</span>
                </div>
              </GlassCard>

              {/* Feature highlights under video */}
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { icon: "ψ", label: "Equation Input", desc: "LaTeX editor with symbol palette" },
                  { icon: "∂", label: "Rule Application", desc: "Power, Product & Chain rules" },
                  { icon: "∫", label: "Operator Handling", desc: "Ĥ, p̂, ∇² expansion" },
                  { icon: "✓", label: "Verified Results", desc: "Numerical validation included" },
                ].map((item) => (
                  <motion.div key={item.label} variants={staggerItem}>
                    <GlassCard className="text-center py-4">
                      <div className="text-xl font-mono text-primary mb-1">{item.icon}</div>
                      <div className="text-xs font-semibold text-foreground">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA under demo */}
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-full px-8 hero-gradient-btn text-primary-foreground border-0"
                >
                  <Link to="/quantum">
                    <Play size={16} /> Try the Step-by-Step Solver Now
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Transcript for SEO */}
            <div className="sr-only">
              <h3>Step-by-step quantum equation solving process</h3>
              <p>This demo video showcases all sections of the Quantara AI platform including: equation input with LaTeX editor, step-by-step derivation engine applying Power Rule, Product Rule, Chain Rule, and operator handling for quantum equations like the Schrödinger equation. Interactive wavefunction plots, 3D molecular models, periodic table explorer, Gaussian elimination for systems of equations, and export capabilities are all demonstrated.</p>
              <p>1. Enter a quantum equation like the Time-Dependent Schrödinger Equation: iℏ ∂ψ/∂t = Ĥψ</p>
              <p>2. The solver applies operator expansion, substituting Ĥ = T̂ + V̂ and p̂ = -iℏ ∂/∂x</p>
              <p>3. Using the Power Rule, Product Rule, and Chain Rule for operator handling</p>
              <p>4. Separation of variables yields the time-independent equation Ĥφₙ = Eₙφₙ</p>
              <p>5. Final result: ψ(x,t) = Σₙ cₙ φₙ(x) e^(-iEₙt/ℏ)</p>
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ FEATURE COMPARISON TABLE ═══════ */}
      <ParallaxSection offset={15}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Why <span className="text-gradient">Quantara AI</span>?
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                See how we compare to other equation solvers and calculators.
              </p>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto overflow-x-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <GlassCard className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 text-muted-foreground font-medium text-xs">Feature</th>
                      <th className="p-4 text-center">
                        <span className="text-primary font-bold text-xs">Quantara AI</span>
                      </th>
                      <th className="p-4 text-center text-muted-foreground text-xs font-medium">Wolfram Alpha</th>
                      <th className="p-4 text-center text-muted-foreground text-xs font-medium">Symbolab</th>
                      <th className="p-4 text-center text-muted-foreground text-xs font-medium hidden sm:table-cell">Desmos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Step-by-step derivations", q: true, w: "Paid", s: "Paid", d: false },
                      { feature: "Quantum equation solver", q: true, w: "Limited", s: false, d: false },
                      { feature: "LaTeX equation editor", q: true, w: false, s: true, d: false },
                      { feature: "Interactive wavefunction plots", q: true, w: false, s: false, d: "Limited" },
                      { feature: "Any-variable support", q: true, w: true, s: true, d: true },
                      { feature: "Operator algebra (Ĥ, p̂, ∇²)", q: true, w: "Limited", s: false, d: false },
                      { feature: "Gaussian elimination steps", q: true, w: "Paid", s: "Paid", d: false },
                      { feature: "3D molecular models", q: true, w: false, s: false, d: false },
                      { feature: "Export (PDF, SVG, LaTeX)", q: true, w: "Paid", s: "Paid", d: "Limited" },
                      { feature: "100% Free", q: true, w: false, s: false, d: true },
                    ].map((row, i) => (
                      <motion.tr
                        key={row.feature}
                        className="border-b border-border/20 last:border-0"
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <td className="p-3 pl-4 text-xs text-foreground/80">{row.feature}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                            <Check size={12} className="text-primary" />
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <ComparisonCell value={row.w} />
                        </td>
                        <td className="p-3 text-center">
                          <ComparisonCell value={row.s} />
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          <ComparisonCell value={row.d} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <ParallaxSection offset={15}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Trusted by <span className="text-gradient">Researchers & Students</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                What users say about the Quantara AI platform.
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {[
                {
                  name: "Miss Ayesha Ijaz",
                  role: "Research Analyst-Math, Lahore College for Women University",
                  text: "Just checked the Quantara AI site. Masha'Allah, it's a very professional and well-explained project! It clearly targets the right audience. The color scheme, 3D visuals, colorful periodic table, and overall interface layout are very attractive. As a user, I really liked it.",
                  stars: 5,
                },
                {
                  name: "Dr. Sarah Chen",
                  role: "Quantum Physics Researcher, MIT",
                  text: "The step-by-step Schrödinger derivations are exactly what I need for teaching. My students finally understand operator algebra.",
                  stars: 5,
                },
                {
                  name: "Alex Petrov",
                  role: "Physics PhD Student, ETH Zürich",
                  text: "Quantara's multi-variable solver caught errors in my homework that other tools missed. The Gaussian elimination steps are crystal clear.",
                  stars: 5,
                },
                {
                  name: "Prof. Maria González",
                  role: "Applied Mathematics, Stanford",
                  text: "Finally a free tool that handles quantum operators properly. The LaTeX editor and export features save me hours every week.",
                  stars: 5,
                },
                {
                  name: "James Liu",
                  role: "Undergraduate, Caltech",
                  text: "The interactive wavefunction plots helped me visualize concepts I'd been struggling with for months. Game changer for learning QM.",
                  stars: 5,
                },
                {
                  name: "Dr. Aisha Rahman",
                  role: "Computational Chemistry, Oxford",
                  text: "The 3D molecular models and periodic table explorer are beautifully designed. I use Quantara in every lecture now.",
                  stars: 4,
                },
                {
                  name: "Viktor Novak",
                  role: "Engineering Student, TU Munich",
                  text: "Best differential equation solver I've used. The Bessel and Legendre equation solutions with all steps shown are invaluable.",
                  stars: 5,
                },
              ].map((testimonial, i) => (
                <motion.div key={testimonial.name} variants={staggerItem}>
                  <GlassCard hover className="h-full flex flex-col">
                    <Quote size={18} className="text-primary/30 mb-3" />
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          size={12}
                          className={si < testimonial.stars ? "text-primary fill-primary" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-[10px] text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ PROBLEM EXAMPLES ═══════ */}
      <ParallaxSection offset={15}>
        <section className="relative py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Try These <span className="text-gradient">Example Problems</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Click any example to solve it instantly with full step-by-step derivation.
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {[
                { label: "Linear Equation", eq: "3x + 7 = 22", link: "/solver" },
                { label: "Quadratic", eq: "x² - 5x + 6 = 0", link: "/solver" },
                { label: "System of Equations", eq: "2a + 3b = 7, a - b = 1", link: "/solver" },
                { label: "Derivative", eq: "d/dx(x³ sin(x))", link: "/solver" },
                { label: "Schrödinger Equation", eq: "Ĥψ = Eψ", link: "/quantum" },
                { label: "Harmonic Oscillator", eq: "Ĥ = p̂²/(2m) + ½mω²x̂²", link: "/quantum" },
              ].map((ex, i) => (
                <motion.div key={ex.label} variants={staggerItem}>
                  <Link to={ex.link}>
                    <GlassCard hover className="cursor-pointer group">
                      <div className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold mb-1">{ex.label}</div>
                      <div className="font-mono text-sm text-foreground group-hover:text-primary transition-colors">{ex.eq}</div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                        Solve now <ArrowRight size={10} />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </ParallaxSection>

      {/* ═══════ CTA ═══════ */}
      <section className="relative py-24">
        <div className="container px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard glow className="max-w-2xl mx-auto py-14 px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                Ready to Solve Your Equations?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm max-w-md mx-auto">
                Step-by-step derivations, quantum simulations, and interactive visualizations — all free, all in your browser.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-full px-8 hero-gradient-btn text-primary-foreground border-0"
                >
                  <Link to="/quantum">
                    Launch Quantum Solver <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 border-border/50 hover:bg-secondary/50"
                >
                  <Link to="/solver">Equation Solver</Link>
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STICKY CTA ═══════ */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <Button
          asChild
          size="lg"
          className="gap-2 rounded-full px-8 shadow-[0_8px_32px_hsl(var(--primary)/0.4)] hero-gradient-btn text-primary-foreground border-0"
        >
          <Link to="/solver">
            <Zap size={16} /> Try the Step-by-Step Solver Now
          </Link>
        </Button>
      </motion.div>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border/30 py-10">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={quantaraLogo} alt="Quantara AI" className="h-7 w-auto" />
              <span className="text-sm font-semibold text-foreground">
                Quantara<span className="text-primary">AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/solver" className="hover:text-foreground transition-colors">Equations</Link>
              <Link to="/quantum" className="hover:text-foreground transition-colors">Quantum</Link>
              <Link to="/graph" className="hover:text-foreground transition-colors">Graphs</Link>
              <Link to="/library" className="hover:text-foreground transition-colors">Library</Link>
            </div>
            <p className="text-xs text-muted-foreground/50">
              © 2024 Quantara AI. Quantum Problem Solver.
            </p>
          </div>
        </div>
      </footer>
    </PageLayout>
  );
};

/* Parallax wrapper for sections */
const ParallaxSection = ({ children, offset = 50 }: { children: React.ReactNode; offset?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <div ref={ref}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
};

export default Index;
