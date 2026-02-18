import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Zap, BookOpen, Star } from "lucide-react";
import type { DerivativeResult } from "@/lib/derivativeEngine";

interface DerivativeStepsViewProps {
  result: DerivativeResult;
}

const ruleColor: Record<string, string> = {
  "Power Rule": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Constant Rule": "text-slate-400 bg-slate-400/10 border-slate-400/20",
  "Constant Multiple Rule": "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  "Sum Rule": "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Difference Rule": "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Product Rule": "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "Quotient Rule": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Trigonometric Rule": "text-green-400 bg-green-400/10 border-green-400/20",
  "Logarithmic Rule": "text-rose-400 bg-rose-400/10 border-rose-400/20",
  "Exponential Rule": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Chain Rule (Exponential)": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Chain Rule (Power)": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Chain Rule (Trigonometric Rule)": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Chain Rule (Logarithmic Rule)": "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

function ruleClass(rule: string) {
  for (const key of Object.keys(ruleColor)) {
    if (rule.startsWith(key) || rule === key) return ruleColor[key];
  }
  return "text-primary bg-primary/10 border-primary/20";
}

const DerivativeStepsView = ({ result }: DerivativeStepsViewProps) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card !p-4 border-primary/20"
      >
        <div className="flex items-center gap-2 text-xs text-primary mb-2 font-semibold">
          <Zap size={12} />
          SYMBOLIC DERIVATIVE CALCULATOR
        </div>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-muted-foreground shrink-0">d/dx</span>
          <span className="text-foreground font-bold">({result.input})</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {result.rulesUsed.map((r) => (
            <span
              key={r}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${ruleClass(r)}`}
            >
              {r}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Steps */}
      <div className="space-y-2">
        <AnimatePresence>
          {result.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <div className="glass-card !p-4 border-border/20">
                <div className="flex items-start gap-3">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Rule badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${ruleClass(step.rule)}`}>
                      {step.rule.startsWith("Chain") && <Star size={8} />}
                      {step.rule}
                    </span>

                    {/* Expression */}
                    <div className="font-mono text-xs text-primary/80 bg-primary/5 rounded px-2.5 py-1.5 border border-primary/10">
                      d/dx({step.expression})
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.explanation}</p>

                    {/* Result */}
                    <div className="font-mono text-xs rounded px-2.5 py-1.5 border bg-secondary/30 border-border/30 text-foreground/90">
                      → {step.result}
                    </div>
                  </div>

                  {/* Check icon for completed */}
                  {i < result.steps.length - 1 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.07 + 0.2 }}>
                      <CheckCircle2 size={14} className="text-green-400/60 flex-shrink-0 mt-1" />
                    </motion.div>
                  )}
                  {i === result.steps.length - 1 && (
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ChevronRight size={14} className="text-primary flex-shrink-0 mt-1" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Connector */}
              {i < result.steps.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.07 + 0.1 }}
                  className="absolute left-[26px] top-full w-[1px] h-2 bg-primary/20 origin-top"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <motion.div
        className="h-1 rounded-full bg-gradient-to-r from-primary to-accent"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.6, delay: result.steps.length * 0.07 }}
      />

      {/* Final Answer */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: result.steps.length * 0.07 + 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="glass-card !p-5 border-green-500/30"
        style={{ boxShadow: "0 0 20px hsl(142 70% 45% / 0.08)" }}
      >
        <div className="flex items-center gap-2 text-xs text-green-400 mb-2 font-semibold">
          <CheckCircle2 size={14} />
          FINAL ANSWER
        </div>
        <div className="font-mono text-sm text-foreground font-bold">
          d/dx({result.input}) = <span className="text-green-400">{result.finalAnswer}</span>
        </div>
      </motion.div>

      {/* Rules reference */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: result.steps.length * 0.07 + 0.25, type: "spring", stiffness: 200, damping: 20 }}
        className="glass-card !p-4 border-amber-500/15"
      >
        <div className="flex items-center gap-2 text-xs text-amber-400 mb-2 font-semibold">
          <BookOpen size={12} />
          RULES APPLIED
        </div>
        <ul className="space-y-0.5">
          {result.rulesUsed.map((r) => (
            <li key={r} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-primary/50">•</span> {r}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default DerivativeStepsView;
