/**
 * Symbolic Derivative Engine
 * Solves derivatives using direct differentiation rules only.
 * Supports ANY variable (x, t, r, θ, etc.) — auto-detected or specified.
 * NO integrals, NO ODE solving.
 */
import { extractVariables } from "@/lib/variableDetector";

export interface DerivativeStep {
  rule: string;
  expression: string;
  result: string;
  explanation: string;
}

export interface DerivativeResult {
  input: string;
  variable: string;
  steps: DerivativeStep[];
  finalAnswer: string;
  rulesUsed: string[];
}

// ─── Preset examples ───────────────────────────────────────────────────────────
export const derivativePresets = [
  { label: "Power Rule", expr: "x^3", desc: "d/dx (x³)" },
  { label: "Constant Multiple", expr: "3*x^2", desc: "d/dx (3x²)" },
  { label: "Sum Rule", expr: "x^3 + 5*x", desc: "d/dx (x³ + 5x)" },
  { label: "Product Rule", expr: "x^2 * sin(x)", desc: "d/dx (x² · sin x)" },
  { label: "Quotient Rule", expr: "sin(x)/x", desc: "d/dx (sin x / x)" },
  { label: "Chain Rule – Exp", expr: "e^(x^2)", desc: "d/dx e^(x²)" },
  { label: "Chain Rule – Trig", expr: "sin(3*x^2)", desc: "d/dx sin(3x²)" },
  { label: "Chain Rule – Cos", expr: "cos(e^x)", desc: "d/dx cos(eˣ)" },
  { label: "Log Rule", expr: "ln(x^2 + 1)", desc: "d/dx ln(x²+1)" },
  { label: "Tan Rule", expr: "tan(x)", desc: "d/dx tan x" },
];

// ─── Core engine ───────────────────────────────────────────────────────────────

// Tokenized AST-lite approach using pattern matching
type Expr = string;

function trim(s: Expr): Expr {
  return s.trim();
}

/** Detect if a string is a pure number */
function isNumber(s: Expr): boolean {
  return !isNaN(Number(s)) && s !== "";
}

// Current differentiation variable (set per solve call)
let diffVar = "x";

/** Detect if expression is purely a constant w.r.t. the current variable */
function isConstant(s: Expr): boolean {
  // Check if the expression contains the differentiation variable as a standalone token
  const regex = new RegExp(`(?<![a-zA-Z])${diffVar}(?![a-zA-Z])`);
  return !regex.test(s);
}

/** Very lightweight parenthesis-balanced split */
function splitAt(expr: Expr, op: string): [Expr, Expr] | null {
  let depth = 0;
  const ops = op === "+" || op === "-" ? ["+", "-"] : [op];
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === ")") depth++;
    if (ch === "(") depth--;
    if (depth === 0 && ops.includes(ch) && i > 0) {
      return [trim(expr.slice(0, i)), trim(expr.slice(i + 1))];
    }
  }
  return null;
}

/** Check if top-level contains + or - */
function hasTopLevelAddSub(expr: Expr): boolean {
  let depth = 0;
  for (let i = 1; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && (ch === "+" || ch === "-")) return true;
  }
  return false;
}

function hasTopLevelMul(expr: Expr): boolean {
  let depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === ")") depth++;
    if (ch === "(") depth--;
    if (depth === 0 && ch === "*") return true;
  }
  return false;
}

function hasTopLevelDiv(expr: Expr): boolean {
  let depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === ")") depth++;
    if (ch === "(") depth--;
    if (depth === 0 && ch === "/") return true;
  }
  return false;
}

function hasTopLevelPow(expr: Expr): boolean {
  let depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === ")") depth++;
    if (ch === "(") depth--;
    if (depth === 0 && ch === "^") return true;
  }
  return false;
}

/** Strip outer parens if the whole string is wrapped */
function stripOuterParens(expr: Expr): Expr {
  if (expr.startsWith("(") && expr.endsWith(")")) {
    let depth = 0;
    let valid = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      if (expr[i] === ")") depth--;
      if (depth === 0) { valid = false; break; }
    }
    if (valid) return expr.slice(1, -1);
  }
  return expr;
}

/** Simplify basic coefficient arithmetic in the result string */
function simplifyCoeff(expr: string): string {
  // n * 1 => n, 1 * n => n
  expr = expr.replace(/\b1\s*\*\s*([a-zA-Z(])/g, "$1");
  expr = expr.replace(/([a-zA-Z)0-9])\s*\*\s*1\b/g, "$1");
  // 0 * anything => 0
  expr = expr.replace(/0\s*\*\s*[^\s+\-]*/g, "0");
  // n * 0 => 0
  expr = expr.replace(/[^\s+\-]*\s*\*\s*0/g, "0");
  // var^1 => var
  const v = diffVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  expr = expr.replace(new RegExp(`${v}\\^1\\b`, 'g'), diffVar);
  // 1x => x
  expr = expr.replace(new RegExp(`\\b1${v}\\b`, 'g'), diffVar);
  return expr.trim();
}

// Main recursive differentiator
function diff(expr: Expr, steps: DerivativeStep[]): Expr {
  expr = stripOuterParens(trim(expr));

  // Constant
  if (isConstant(expr)) {
    steps.push({
      rule: "Constant Rule",
      expression: expr,
      result: "0",
      explanation: `d/dx(${expr}) = 0 — derivative of a constant is zero`,
    });
    return "0";
  }

  // Just the variable
  if (expr === diffVar) {
    steps.push({
      rule: "Power Rule",
      expression: diffVar,
      result: "1",
      explanation: `d/d${diffVar}(${diffVar}) = 1 — power rule with n=1`,
    });
    return "1";
  }

  // Sum / Difference: split at last top-level + or -
  if (hasTopLevelAddSub(expr)) {
    // Find rightmost top-level + or -
    let depth = 0;
    let splitIdx = -1;
    let splitOp = "+";
    for (let i = expr.length - 1; i >= 1; i--) {
      const ch = expr[i];
      if (ch === ")") depth++;
      if (ch === "(") depth--;
      if (depth === 0 && (ch === "+" || ch === "-")) {
        splitIdx = i;
        splitOp = ch;
        break;
      }
    }
    if (splitIdx > 0) {
      const left = trim(expr.slice(0, splitIdx));
      const right = trim(expr.slice(splitIdx + 1));
      const ruleName = splitOp === "+" ? "Sum Rule" : "Difference Rule";
      steps.push({
        rule: ruleName,
        expression: expr,
        result: `d/dx(${left}) ${splitOp} d/dx(${right})`,
        explanation: `d/dx(f ${splitOp} g) = f' ${splitOp} g' — apply to each term`,
      });
      const dl = diff(left, steps);
      const dr = diff(right, steps);
      const combined = `${dl} ${splitOp} ${dr}`;
      return simplifyCoeff(combined);
    }
  }

  // Division: f/g
  if (hasTopLevelDiv(expr)) {
    const parts = splitAt(expr, "/");
    if (parts) {
      const [f, g] = parts;
      steps.push({
        rule: "Quotient Rule",
        expression: expr,
        result: `(f'·g − f·g') / g²`,
        explanation: `d/dx(${f}/${g}) = [d/dx(${f})·(${g}) − (${f})·d/dx(${g})] / (${g})²`,
      });
      const df = diff(f, steps);
      const dg = diff(g, steps);
      const result = `(${df}·(${g}) - (${f})·${dg}) / (${g})^2`;
      return simplifyCoeff(result);
    }
  }

  // Product: f * g
  if (hasTopLevelMul(expr)) {
    const parts = splitAt(expr, "*");
    if (parts) {
      const [f, g] = parts;
      // If f is a pure number, treat as Constant Multiple Rule
      if (isNumber(f) || isConstant(f)) {
        steps.push({
          rule: "Constant Multiple Rule",
          expression: expr,
          result: `${f} · d/dx(${g})`,
          explanation: `d/dx(c·f) = c·f' — pull constant ${f} outside`,
        });
        const dg = diff(g, steps);
        if (dg === "0") return "0";
        if (dg === "1") return simplifyCoeff(f);
        return simplifyCoeff(`${f} · ${dg}`);
      }
      steps.push({
        rule: "Product Rule",
        expression: expr,
        result: `f'·g + f·g'`,
        explanation: `d/dx(${f}·${g}) = d/dx(${f})·(${g}) + (${f})·d/dx(${g})`,
      });
      const df = diff(f, steps);
      const dg = diff(g, steps);
      const result = `${df}·(${g}) + (${f})·${dg}`;
      return simplifyCoeff(result);
    }
  }

  // Power: x^n or u^n
  if (hasTopLevelPow(expr)) {
    const parts = splitAt(expr, "^");
    if (parts) {
      const [base, exp] = parts;

      // e^u — exponential (e is special)
      if (base === "e") {
        if (exp === diffVar) {
          steps.push({
            rule: "Exponential Rule",
            expression: expr,
            result: `e^${diffVar}`,
            explanation: `d/d${diffVar}(e^${diffVar}) = e^${diffVar} — the exponential is its own derivative`,
          });
          return `e^${diffVar}`;
        }
        // Chain rule: d/dx e^u = e^u · u'
        steps.push({
          rule: "Chain Rule (Exponential)",
          expression: expr,
          result: `e^(${exp}) · d/dx(${exp})`,
          explanation: `Outer: e^u → e^u. Inner: u = ${exp}. Apply chain rule: e^(${exp}) · (${exp})'`,
        });
        const du = diff(exp, steps);
        if (du === "1") return `e^(${exp})`;
        return simplifyCoeff(`e^(${exp}) · ${du}`);
      }

      // a^var general exponential
      if (isConstant(base) && exp === diffVar) {
        steps.push({
          rule: "Exponential Rule",
          expression: expr,
          result: `${base}^${diffVar} · ln(${base})`,
          explanation: `d/d${diffVar}(a^${diffVar}) = a^${diffVar}·ln(a) — general exponential rule`,
        });
        return `${base}^${diffVar} · ln(${base})`;
      }

      // x^n or u^n — power rule or chain rule
      if (isNumber(exp)) {
        const n = parseFloat(exp);
        const newExp = n - 1;
        if (base === diffVar) {
          steps.push({
            rule: "Power Rule",
            expression: expr,
            result: `${n}·${diffVar}^${newExp}`,
            explanation: `d/d${diffVar}(${diffVar}ⁿ) = n·${diffVar}ⁿ⁻¹ → d/d${diffVar}(${diffVar}^${n}) = ${n}·${diffVar}^${newExp}`,
          });
          const result = newExp === 0 ? `${n}` : newExp === 1 ? `${n}${diffVar}` : `${n}${diffVar}^${newExp}`;
          return simplifyCoeff(result);
        }
        // u^n: chain rule
        steps.push({
          rule: "Chain Rule (Power)",
          expression: expr,
          result: `${n}·(${base})^${newExp} · d/dx(${base})`,
          explanation: `Outer: u^${n} → ${n}u^${newExp}. Inner: u = ${base}. Apply chain: ${n}(${base})^${newExp}·(${base})'`,
        });
        const du = diff(base, steps);
        const power = newExp === 0 ? "" : newExp === 1 ? `(${base})` : `(${base})^${newExp}`;
        if (du === "1") return simplifyCoeff(`${n}·${power}`);
        return simplifyCoeff(`${n}·${power}·${du}`);
      }
    }
  }

  // Trig + Exp + Log function patterns
  const funcMatch = expr.match(/^(\w+)\((.+)\)$/);
  if (funcMatch) {
    const fn = funcMatch[1];
    const inner = funcMatch[2];
    const isSimpleX = inner === "x";

    const trigRules: Record<string, { result: (u: string) => string; rule: string; explain: (u: string) => string }> = {
      sin: {
        rule: "Trigonometric Rule",
        result: (u) => `cos(${u})`,
        explain: (u) => `d/dx(sin u) = cos u — standard trig rule`,
      },
      cos: {
        rule: "Trigonometric Rule",
        result: (u) => `-sin(${u})`,
        explain: (u) => `d/dx(cos u) = -sin u — standard trig rule`,
      },
      tan: {
        rule: "Trigonometric Rule",
        result: (u) => `sec^2(${u})`,
        explain: (u) => `d/dx(tan u) = sec²u — standard trig rule`,
      },
      sec: {
        rule: "Trigonometric Rule",
        result: (u) => `sec(${u})·tan(${u})`,
        explain: (u) => `d/dx(sec u) = sec u · tan u`,
      },
      csc: {
        rule: "Trigonometric Rule",
        result: (u) => `-csc(${u})·cot(${u})`,
        explain: (u) => `d/dx(csc u) = -csc u · cot u`,
      },
      cot: {
        rule: "Trigonometric Rule",
        result: (u) => `-csc^2(${u})`,
        explain: (u) => `d/dx(cot u) = -csc²u`,
      },
      ln: {
        rule: "Logarithmic Rule",
        result: (u) => `1/(${u})`,
        explain: (u) => `d/dx(ln u) = 1/u — logarithmic rule`,
      },
      log: {
        rule: "Logarithmic Rule",
        result: (u) => `1/((${u})·ln(10))`,
        explain: (u) => `d/dx(log₁₀ u) = 1/(u·ln10)`,
      },
      sqrt: {
        rule: "Power Rule (sqrt)",
        result: (u) => `1/(2·sqrt(${u}))`,
        explain: (u) => `d/dx(√u) = 1/(2√u) — power rule with n=1/2`,
      },
      exp: {
        rule: "Exponential Rule",
        result: (u) => `e^(${u})`,
        explain: (u) => `d/dx(e^u) = e^u · u'`,
      },
    };

    if (fn in trigRules) {
      const tr = trigRules[fn];
      const outerResult = tr.result(inner);

      if (isSimpleX) {
        steps.push({
          rule: tr.rule,
          expression: expr,
          result: outerResult,
          explanation: tr.explain(inner),
        });
        return outerResult;
      }

      // Chain Rule
      steps.push({
        rule: `Chain Rule (${tr.rule})`,
        expression: expr,
        result: `${outerResult} · d/dx(${inner})`,
        explanation: `Outer: ${fn}(u) → ${tr.result("u")}. Inner: u = ${inner}. Chain: ${outerResult} · (${inner})'`,
      });
      const du = diff(inner, steps);
      if (du === "1") return simplifyCoeff(outerResult);
      return simplifyCoeff(`${outerResult} · ${du}`);
    }
  }

  // Fallback — can't pattern-match, return symbolic
  steps.push({
    rule: "General Rule",
    expression: expr,
    result: `d/dx(${expr})`,
    explanation: `Applying general differentiation to: ${expr}`,
  });
  return `d/dx(${expr})`;
}

/** Public API — auto-detects variable or accepts explicit variable */
export function solveDerivative(rawInput: string, variable?: string): DerivativeResult {
  // Normalize input: strip d/dx(...) or dy/dx wrappers
  let expr = rawInput.trim();
  
  // Try to detect variable from d/d<var> notation
  const dNotation = expr.match(/^d\/d([a-zA-Zα-ω])\s*\(?(.*?)\)?$/i);
  if (dNotation) {
    variable = variable || dNotation[1];
    expr = dNotation[2].trim();
  } else {
    expr = expr.replace(/^dy\/dx\s*\(?(.*?)\)?$/i, "$1").trim();
  }
  expr = expr.replace(/\s+/g, "");

  // Auto-detect variable if not specified
  if (!variable) {
    const vars = extractVariables(expr);
    variable = vars.length > 0 ? vars[0] : "x";
  }
  
  // Set the global diff variable for this solve call
  diffVar = variable;

  const steps: DerivativeStep[] = [];
  const finalAnswer = diff(expr, steps);

  const rulesUsed = [...new Set(steps.map((s) => s.rule))];

  return {
    input: rawInput.trim(),
    variable,
    steps,
    finalAnswer: simplifyCoeff(finalAnswer),
    rulesUsed,
  };
}
