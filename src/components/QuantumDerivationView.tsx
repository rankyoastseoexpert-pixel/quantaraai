import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, Lightbulb, BookOpen, Zap, Star, Info } from "lucide-react";
import type { FullDerivation, DerivationStep } from "@/lib/quantumEngine";

interface QuantumDerivationViewProps {
  derivation: FullDerivation;
}

const QuantumDerivationView = ({ derivation }: QuantumDerivationViewProps) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setVisibleCount(0);
    setShowFinal(false);
    setShowNotes(false);

    const timers: NodeJS.Timeout[] = [];
    derivation.steps.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 700));
    });
    timers.push(setTimeout(() => setShowFinal(true), (derivation.steps.length + 1) * 700));
    timers.push(setTimeout(() => setShowNotes(true), (derivation.steps.length + 2) * 700));

    return () => timers.forEach(clearTimeout);
  }, [derivation]);

  return (
    <div className="space-y-3">
      {/* Title & Equation Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card !p-4 border-primary/20"
      >
        <div className="flex items-center gap-2 text-xs text-primary mb-2">
          <Zap size={12} />
          <span className="font-semibold uppercase tracking-wider">{derivation.title}</span>
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">Equation:</span>
            <span className="text-foreground font-semibold">{derivation.equation}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">Operator:</span>
            <span className="text-primary/80">{derivation.operatorForm}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">Differential:</span>
            <span className="text-accent/80">{derivation.differentialForm}</span>
          </div>
        </div>
      </motion.div>

      {/* Step-by-step derivation */}
      <div className="space-y-2">
        <AnimatePresence>
          {derivation.steps.slice(0, visibleCount).map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              isActive={i === visibleCount - 1}
              isComplete={i < visibleCount - 1}
              totalSteps={derivation.steps.length}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${(visibleCount / derivation.steps.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground text-right font-mono">
        Step {visibleCount}/{derivation.steps.length}
      </div>

      {/* Final Answer */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-5 border-green-500/30"
            style={{ boxShadow: "0 0 25px hsl(142 70% 45% / 0.1)" }}
          >
            <div className="flex items-center gap-2 text-xs text-green-400 mb-2 font-semibold">
              <CheckCircle2 size={14} />
              FINAL ANSWER
            </div>
            <p className="font-mono text-sm text-foreground font-bold leading-relaxed">{derivation.finalAnswer}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Meaning */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-4 border-amber-500/20"
          >
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-2 font-semibold">
              <Lightbulb size={12} />
              PHYSICAL MEANING
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{derivation.physicalMeaning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Method */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-4 border-border/30"
          >
            <div className="flex items-center gap-2 text-xs text-foreground mb-2 font-semibold">
              <BookOpen size={12} className="text-primary" />
              SOLUTION METHOD
            </div>
            <p className="text-xs text-muted-foreground font-mono">{derivation.method}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <AnimatePresence>
        {showNotes && derivation.notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-4 border-primary/10"
          >
            <div className="flex items-center gap-2 text-xs text-primary mb-2 font-semibold">
              <Info size={12} />
              KEY NOTES
            </div>
            <div className="space-y-1.5">
              {derivation.notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary/60 mt-0.5">•</span>
                  <span className="leading-relaxed">{note}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual step card
const StepCard = ({
  step,
  index,
  isActive,
  isComplete,
  totalSteps,
}: {
  step: DerivationStep;
  index: number;
  isActive: boolean;
  isComplete: boolean;
  totalSteps: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -30, scale: 0.95 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="relative"
  >
    <div
      className={`
        glass-card !p-4 transition-all duration-500
        ${isActive ? "border-primary/40 glow-border" : step.highlight ? "border-accent/20" : "border-border/20"}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Step number */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            step.highlight ? "bg-accent/15" : "bg-primary/15"
          }`}
        >
          <span className="text-[10px] font-bold text-primary">{index + 1}</span>
        </motion.div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Rule name badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              step.highlight
                ? "bg-accent/15 text-accent border border-accent/20"
                : "bg-primary/10 text-primary border border-primary/15"
            }`}>
              {step.highlight && <Star size={8} />}
              {step.rule}
            </span>
          </div>

          {/* Formula */}
          <div className="font-mono text-[11px] text-primary/70 bg-primary/5 rounded-md px-2.5 py-1.5 border border-primary/10">
            {step.formula}
          </div>

          {/* Action description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.action}
          </p>

          {/* Result */}
          <div className={`font-mono text-xs rounded-md px-2.5 py-1.5 border ${
            step.highlight
              ? "bg-accent/5 border-accent/15 text-foreground font-semibold"
              : "bg-secondary/30 border-border/30 text-foreground/90"
          }`}>
            → {step.result}
          </div>
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0 mt-1">
          {isComplete && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <CheckCircle2 size={14} className="text-green-400/60" />
            </motion.div>
          )}
          {isActive && (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronRight size={14} className="text-primary" />
            </motion.div>
          )}
        </div>
      </div>
    </div>

    {/* Connector */}
    {index < totalSteps - 1 && isComplete && (
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        className="absolute left-[26px] top-full w-[1px] h-2 bg-primary/20 origin-top"
      />
    )}
  </motion.div>
);

export default QuantumDerivationView;
