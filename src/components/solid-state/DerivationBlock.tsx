import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DerivationStep {
  title: string;
  content: string;
  equation?: string;
}

interface DerivationBlockProps {
  title: string;
  steps: DerivationStep[];
}

export default function DerivationBlock({ title, steps }: DerivationBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs w-full justify-between"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} />
          {open ? "Hide" : "Show"} {title}
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-5 mt-3 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen size={14} className="text-primary" />
                {title}
              </h3>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">{step.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{step.content}</p>
                        {step.equation && (
                          <div className="bg-secondary/40 border border-border/30 rounded-lg p-3 mt-2 font-mono text-[11px] text-primary leading-relaxed overflow-x-auto">
                            {step.equation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
