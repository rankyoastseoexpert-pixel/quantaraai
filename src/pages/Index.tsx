import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import FloatingEquations from "@/components/FloatingEquations";
import WaveCurve from "@/components/WaveCurve";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Atom, BarChart3, ShieldCheck, FileDown } from "lucide-react";

const stats = [
  { value: "50+", label: "Equation Types" },
  { value: "12", label: "Quantum Models" },
  { value: "∞", label: "Visualizations" },
  { value: "100%", label: "Numerical Validation" },
];

const features = [
  { icon: Activity, title: "Equation Solver", desc: "Solve linear, differential, and matrix equations with step-by-step derivations." },
  { icon: Atom, title: "Quantum Models", desc: "Explore 12+ quantum systems with wavefunctions, energy levels, and time evolution." },
  { icon: BarChart3, title: "Diagram Generator", desc: "Generate publication-ready scientific graphs with custom functions and presets." },
  { icon: ShieldCheck, title: "Validation Toolkit", desc: "Verify numerical results with stability checks and convergence analysis." },
  { icon: FileDown, title: "Export & Reports", desc: "Export solutions as LaTeX, PDF, SVG, or PNG for academic publications." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <FloatingEquations />
        <WaveCurve />

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Research-Grade Scientific Platform
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="text-foreground">WAVE </span>
              <span className="text-gradient">QUANT</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 font-light">
              Precision Mathematics. Visual Quantum Insight.
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto mb-10">
              A research-grade scientific web platform for solving classical and quantum equations
              with interactive visualization, symbolic input, and reproducible numerical workflows.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 rounded-xl px-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-border">
                <Link to="/solver">
                  Get Started <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl px-6 border-border hover:bg-secondary">
                <Link to="/quantum">Open Quantum Solver</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl px-6 border-border hover:bg-secondary">
                <Link to="/graph">Graph Generator</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <GlassCard className="text-center py-8" glow>
                  <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1 font-mono">{s.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20">
        <div className="container px-4">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Built for <span className="text-gradient">Scientific Research</span>
          </motion.h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto text-sm">
            Every tool designed for precision, clarity, and reproducibility.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <GlassCard hover className="h-full">
                  <f.icon className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <div className="container px-4 text-center">
          <GlassCard glow className="max-w-2xl mx-auto py-12 px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
              Start Exploring Quantum Systems
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Dive into wavefunctions, energy spectra, and time evolution — all in your browser.
            </p>
            <Button asChild size="lg" className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/quantum">
                Launch Quantum Solver <ArrowRight size={16} />
              </Link>
            </Button>
          </GlassCard>
        </div>
      </section>

      <div className="h-20" />
    </PageLayout>
  );
};

export default Index;
