import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";
import PageLayout from "@/components/PageLayout";
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
} from "lucide-react";

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

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <FloatingEquations />
        <HeroWaveAnimation />

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

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.95]">
              <motion.span
                className="text-foreground inline-block"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                WAVE{" "}
              </motion.span>
              <motion.span
                className="text-gradient glow-text inline-block"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                QUANT
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
                Start Exploring Quantum Systems
              </h2>
              <p className="text-muted-foreground mb-8 text-sm max-w-md mx-auto">
                Dive into wavefunctions, energy spectra, and time evolution — all in your browser.
                No installation required.
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

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border/30 py-10">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary font-mono text-xs font-bold">
                ψ
              </div>
              <span className="text-sm font-semibold text-foreground">
                Wave<span className="text-primary">Quant</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/solver" className="hover:text-foreground transition-colors">Equations</Link>
              <Link to="/quantum" className="hover:text-foreground transition-colors">Quantum</Link>
              <Link to="/graph" className="hover:text-foreground transition-colors">Graphs</Link>
              <Link to="/library" className="hover:text-foreground transition-colors">Library</Link>
            </div>
            <p className="text-xs text-muted-foreground/50">
              © 2024 WaveQuant. Scientific Precision.
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
