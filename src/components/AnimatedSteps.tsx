import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, Lightbulb, BookOpen } from "lucide-react";

interface AnimatedStepsProps {
  steps: string[];
  solution: string;
  explanation: string;
  equation: string;
}

const AnimatedSteps = ({ steps, solution, explanation, equation }: AnimatedStepsProps) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    setVisibleCount(0);
    setShowSolution(false);
    setShowExplanation(false);

    const timers: NodeJS.Timeout[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 600));
    });
    timers.push(setTimeout(() => setShowSolution(true), (steps.length + 1) * 600));
    timers.push(setTimeout(() => setShowExplanation(true), (steps.length + 2) * 600));

    return () => timers.forEach(clearTimeout);
  }, [steps, solution]);

  return (
    <div className="space-y-3">
      {/* Equation header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card !p-4 border-primary/20"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <BookOpen size={12} className="text-primary" />
          EQUATION
        </div>
        <p className="font-mono text-sm text-foreground">{equation}</p>
      </motion.div>

      {/* Animated steps */}
      <div className="space-y-2">
        <AnimatePresence>
          {steps.slice(0, visibleCount).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <div className={`
                glass-card !p-3 flex items-start gap-3 transition-all duration-500
                ${i === visibleCount - 1 ? "border-primary/30 glow-border" : "border-border/20"}
              `}>
                {/* Step number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring" }}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center"
                >
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {step.replace(/^Step \d+:\s*/, "")}
                  </p>
                </div>

                {/* Completed check for non-active steps */}
                {i < visibleCount - 1 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
                    <CheckCircle2 size={14} className="text-green-400/60 flex-shrink-0 mt-0.5" />
                  </motion.div>
                )}

                {/* Active indicator */}
                {i === visibleCount - 1 && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  </motion.div>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && i < visibleCount - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  className="absolute left-[22px] top-full w-[1px] h-2 bg-primary/20 origin-top"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${(visibleCount / steps.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Solution */}
      <AnimatePresence>
        {showSolution && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-4 border-green-500/30"
            style={{ boxShadow: "0 0 20px hsl(142 70% 45% / 0.08)" }}
          >
            <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
              <CheckCircle2 size={12} />
              FINAL ANSWER
            </div>
            <p className="font-mono text-sm text-foreground font-semibold">{solution}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card !p-4 border-amber-500/20"
          >
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
              <Lightbulb size={12} />
              EXPLANATION
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSteps;
