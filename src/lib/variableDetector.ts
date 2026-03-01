/**
 * Smart variable detector for mathematical equations.
 * Excludes known function names (sin, cos, log, etc.) and constants (e, pi).
 */

const KNOWN_FUNCTIONS = new Set([
  "sin", "cos", "tan", "sec", "csc", "cot",
  "asin", "acos", "atan", "atan2",
  "sinh", "cosh", "tanh",
  "sqrt", "cbrt", "abs",
  "log", "log2", "log10", "ln", "exp",
  "min", "max", "ceil", "floor", "round",
  "sign", "mod", "gcd", "lcm",
  "det", "inv", "transpose",
  "sum", "prod", "lim",
]);

const KNOWN_CONSTANTS = new Set(["e", "E", "pi", "PI", "Infinity", "NaN", "true", "false", "i"]);

/**
 * Extract real symbolic variables from a math expression string.
 * Handles multi-char identifiers and filters out function names + constants.
 */
export function extractVariables(expr: string): string[] {
  // Match word-like tokens (sequences of letters, possibly with underscores)
  const tokens = expr.match(/[a-zA-Zα-ωΑ-Ω_][a-zA-Zα-ωΑ-Ω0-9_]*/g) || [];
  
  const variables = new Set<string>();
  
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (KNOWN_FUNCTIONS.has(lower)) continue;
    if (KNOWN_CONSTANTS.has(token)) continue;
    // Skip if it's purely numeric suffix of something
    if (/^\d+$/.test(token)) continue;
    variables.add(token);
  }
  
  return Array.from(variables).sort();
}

/**
 * Extract variables from multiple equations.
 */
export function extractVariablesFromSystem(equations: string[]): string[] {
  const allVars = new Set<string>();
  for (const eq of equations) {
    extractVariables(eq).forEach(v => allVars.add(v));
  }
  return Array.from(allVars).sort();
}

/**
 * Provide a human-readable system detection message.
 */
export function describeSystem(numEquations: number, variables: string[]): string {
  const n = variables.length;
  if (numEquations === n) {
    return `System detected: ${numEquations} equation${numEquations > 1 ? "s" : ""} with ${n} unknown${n > 1 ? "s" : ""}: ${variables.join(", ")}`;
  } else if (numEquations < n) {
    return `Underdetermined system: ${numEquations} equation${numEquations > 1 ? "s" : ""} with ${n} unknowns (${variables.join(", ")}). Infinitely many solutions possible.`;
  } else {
    return `Overdetermined system: ${numEquations} equations with ${n} unknown${n > 1 ? "s" : ""} (${variables.join(", ")}). May have no exact solution.`;
  }
}
