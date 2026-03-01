import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Delete, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import katex from "katex";
import "katex/dist/katex.min.css";

// ── Template definitions ──
interface MathTemplate {
  label: string;
  latex: string;
  plain: string;
  cursorOffset?: number; // how far back from end to place cursor
}

const templateGroups: { label: string; templates: MathTemplate[] }[] = [
  {
    label: "Fractions & Roots",
    templates: [
      { label: "a/b", latex: "\\frac{a}{b}", plain: "(a)/(b)", cursorOffset: 4 },
      { label: "√x", latex: "\\sqrt{x}", plain: "sqrt(x)", cursorOffset: 1 },
      { label: "ⁿ√x", latex: "\\sqrt[n]{x}", plain: "nthroot(x,n)", cursorOffset: 1 },
    ],
  },
  {
    label: "Powers & Scripts",
    templates: [
      { label: "x²", latex: "x^{2}", plain: "x^2" },
      { label: "xⁿ", latex: "x^{n}", plain: "x^n", cursorOffset: 1 },
      { label: "x₁", latex: "x_{1}", plain: "x_1" },
      { label: "eˣ", latex: "e^{x}", plain: "e^(x)", cursorOffset: 1 },
    ],
  },
  {
    label: "Calculus",
    templates: [
      { label: "∂/∂x", latex: "\\frac{\\partial}{\\partial x}", plain: "∂/∂x " },
      { label: "d/dx", latex: "\\frac{d}{dx}", plain: "d/dx " },
      { label: "∫", latex: "\\int", plain: "∫ " },
      { label: "∫ₐᵇ", latex: "\\int_{a}^{b}", plain: "∫_a^b ", cursorOffset: 2 },
      { label: "Σ", latex: "\\sum_{i=0}^{n}", plain: "Σ ", cursorOffset: 1 },
      { label: "lim", latex: "\\lim_{x \\to 0}", plain: "lim " },
      { label: "∇", latex: "\\nabla", plain: "∇" },
      { label: "∇²", latex: "\\nabla^2", plain: "∇²" },
    ],
  },
  {
    label: "Quantum Operators",
    templates: [
      { label: "Ĥ", latex: "\\hat{H}", plain: "Ĥ" },
      { label: "p̂", latex: "\\hat{p}", plain: "p̂" },
      { label: "x̂", latex: "\\hat{x}", plain: "x̂" },
      { label: "L̂", latex: "\\hat{L}", plain: "L̂" },
      { label: "Ŝ", latex: "\\hat{S}", plain: "Ŝ" },
      { label: "⟨⟩", latex: "\\langle \\rangle", plain: "⟨⟩", cursorOffset: 1 },
      { label: "|ψ⟩", latex: "|\\psi\\rangle", plain: "|ψ⟩" },
      { label: "⟨ψ|", latex: "\\langle\\psi|", plain: "⟨ψ|" },
      { label: "†", latex: "^\\dagger", plain: "†" },
      { label: "⊗", latex: "\\otimes", plain: "⊗" },
      { label: "ℏ", latex: "\\hbar", plain: "ℏ" },
    ],
  },
  {
    label: "Greek Letters",
    templates: [
      { label: "α", latex: "\\alpha", plain: "α" },
      { label: "β", latex: "\\beta", plain: "β" },
      { label: "γ", latex: "\\gamma", plain: "γ" },
      { label: "δ", latex: "\\delta", plain: "δ" },
      { label: "ε", latex: "\\epsilon", plain: "ε" },
      { label: "θ", latex: "\\theta", plain: "θ" },
      { label: "λ", latex: "\\lambda", plain: "λ" },
      { label: "μ", latex: "\\mu", plain: "μ" },
      { label: "π", latex: "\\pi", plain: "π" },
      { label: "σ", latex: "\\sigma", plain: "σ" },
      { label: "φ", latex: "\\phi", plain: "φ" },
      { label: "ψ", latex: "\\psi", plain: "ψ" },
      { label: "ω", latex: "\\omega", plain: "ω" },
      { label: "χ", latex: "\\chi", plain: "χ" },
    ],
  },
  {
    label: "Relations & Operators",
    templates: [
      { label: "=", latex: "=", plain: " = " },
      { label: "≠", latex: "\\neq", plain: "≠" },
      { label: "≈", latex: "\\approx", plain: "≈" },
      { label: "≤", latex: "\\leq", plain: "≤" },
      { label: "≥", latex: "\\geq", plain: "≥" },
      { label: "±", latex: "\\pm", plain: "±" },
      { label: "×", latex: "\\times", plain: "×" },
      { label: "·", latex: "\\cdot", plain: "·" },
      { label: "∞", latex: "\\infty", plain: "∞" },
      { label: "→", latex: "\\to", plain: "→" },
    ],
  },
  {
    label: "Trig & Functions",
    templates: [
      { label: "sin", latex: "\\sin", plain: "sin" },
      { label: "cos", latex: "\\cos", plain: "cos" },
      { label: "tan", latex: "\\tan", plain: "tan" },
      { label: "ln", latex: "\\ln", plain: "ln" },
      { label: "log", latex: "\\log", plain: "log" },
      { label: "exp", latex: "\\exp", plain: "exp" },
    ],
  },
  {
    label: "Matrix",
    templates: [
      { label: "2×2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", plain: "[[a, b], [c, d]]" },
      { label: "3×3", latex: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}", plain: "[[a,b,c],[d,e,f],[g,h,i]]" },
    ],
  },
];

// ── LaTeX Preview Renderer ──
function LaTeXPreview({ latex }: { latex: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !latex.trim()) {
      setError(false);
      return;
    }
    try {
      katex.render(latex, ref.current, {
        throwOnError: false,
        displayMode: true,
        trust: true,
      });
      setError(false);
    } catch {
      setError(true);
    }
  }, [latex]);

  if (!latex.trim()) {
    return (
      <div className="text-muted-foreground/50 text-sm italic text-center py-4">
        Type or select templates to see LaTeX preview
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto py-3 px-2 ${error ? "text-destructive" : ""}`}>
      <div ref={ref} className="text-center" />
    </div>
  );
}

// ── Small template button renderer ──
function TemplateButton({ template, onClick }: { template: MathTemplate; onClick: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(template.latex, ref.current, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        if (ref.current) ref.current.textContent = template.label;
      }
    }
  }, [template]);

  return (
    <button
      onClick={onClick}
      className="h-8 min-w-[36px] px-2 rounded-md bg-secondary/70 border border-border text-foreground text-xs hover:bg-primary/15 hover:border-primary/30 transition-colors flex items-center justify-center"
      title={template.label}
    >
      <span ref={ref}>{template.label}</span>
    </button>
  );
}

// ── Main Component ──
interface LaTeXEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LaTeXEquationEditor({ value, onChange, placeholder, className }: LaTeXEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [latexPreview, setLatexPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Fractions & Roots", "Calculus", "Quantum Operators"]));

  // Convert plain text to approximate LaTeX for preview
  const updatePreview = useCallback((text: string) => {
    let latex = text;
    // Basic conversions for preview
    latex = latex.replace(/(\w)\^(\w)/g, "$1^{$2}");
    latex = latex.replace(/(\w)\^(\([^)]+\))/g, (_, base, exp) => `${base}^{${exp.slice(1, -1)}}`);
    latex = latex.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");
    latex = latex.replace(/∂/g, "\\partial ");
    latex = latex.replace(/∇²/g, "\\nabla^2 ");
    latex = latex.replace(/∇/g, "\\nabla ");
    latex = latex.replace(/ℏ/g, "\\hbar ");
    latex = latex.replace(/Ĥ/g, "\\hat{H}");
    latex = latex.replace(/p̂/g, "\\hat{p}");
    latex = latex.replace(/x̂/g, "\\hat{x}");
    latex = latex.replace(/L̂/g, "\\hat{L}");
    latex = latex.replace(/Ŝ/g, "\\hat{S}");
    latex = latex.replace(/Â/g, "\\hat{A}");
    latex = latex.replace(/ψ/g, "\\psi ");
    latex = latex.replace(/φ/g, "\\phi ");
    latex = latex.replace(/ω/g, "\\omega ");
    latex = latex.replace(/α/g, "\\alpha ");
    latex = latex.replace(/β/g, "\\beta ");
    latex = latex.replace(/γ/g, "\\gamma ");
    latex = latex.replace(/δ/g, "\\delta ");
    latex = latex.replace(/ε/g, "\\epsilon ");
    latex = latex.replace(/θ/g, "\\theta ");
    latex = latex.replace(/λ/g, "\\lambda ");
    latex = latex.replace(/μ/g, "\\mu ");
    latex = latex.replace(/π/g, "\\pi ");
    latex = latex.replace(/σ/g, "\\sigma ");
    latex = latex.replace(/χ/g, "\\chi ");
    latex = latex.replace(/⟨/g, "\\langle ");
    latex = latex.replace(/⟩/g, "\\rangle ");
    latex = latex.replace(/†/g, "^\\dagger ");
    latex = latex.replace(/⊗/g, "\\otimes ");
    latex = latex.replace(/∫/g, "\\int ");
    latex = latex.replace(/Σ/g, "\\sum ");
    latex = latex.replace(/≈/g, "\\approx ");
    latex = latex.replace(/≠/g, "\\neq ");
    latex = latex.replace(/≤/g, "\\leq ");
    latex = latex.replace(/≥/g, "\\geq ");
    latex = latex.replace(/±/g, "\\pm ");
    latex = latex.replace(/∞/g, "\\infty ");
    latex = latex.replace(/→/g, "\\to ");
    setLatexPreview(latex);
  }, []);

  useEffect(() => {
    updatePreview(value);
  }, [value, updatePreview]);

  const insertAtCursor = useCallback((text: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + text + value.slice(end);
    onChange(newValue);
    // Set cursor position after insertion
    requestAnimationFrame(() => {
      const pos = start + text.length - (cursorOffset || 0);
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  }, [value, onChange]);

  const handleCopyLatex = useCallback(() => {
    navigator.clipboard.writeText(latexPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [latexPreview]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "f":
          e.preventDefault();
          insertAtCursor("()/()");
          break;
        case "p":
          e.preventDefault();
          insertAtCursor("^");
          break;
        case "r":
          e.preventDefault();
          insertAtCursor("sqrt()");
          break;
      }
    }
  };

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {/* LaTeX Preview */}
      <div className="rounded-lg border border-border/50 bg-secondary/30 min-h-[56px] relative">
        <div className="absolute top-1 right-1 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={handleCopyLatex}
            title="Copy LaTeX"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </Button>
        </div>
        <LaTeXPreview latex={latexPreview} />
      </div>

      {/* Text Input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Enter equation (e.g. iℏ ∂ψ/∂t = Ĥψ)..."}
        className="w-full h-28 bg-secondary/50 border border-border rounded-lg p-3 font-mono text-sm text-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors"
      />

      {/* Keyboard shortcuts hint */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground/60">
        <span>Ctrl+F: fraction</span>
        <span>Ctrl+P: power</span>
        <span>Ctrl+R: root</span>
      </div>

      {/* Template Groups */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {templateGroups.map(group => {
          const isExpanded = expandedGroups.has(group.label);
          return (
            <div key={group.label} className="border border-border/30 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-secondary/50 transition-colors flex items-center justify-between"
              >
                {group.label}
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                      {group.templates.map(template => (
                        <TemplateButton
                          key={template.label}
                          template={template}
                          onClick={() => insertAtCursor(template.plain, template.cursorOffset)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
