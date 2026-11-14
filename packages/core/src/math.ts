// Headstart, a study companion that helps you get started, stay focused and keep going.
// Copyright (C) 2026  ChonkieMonkie
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Finds the maths in a note or to-do. Notes stay plain text: LaTeX between
// dollar signs is drawn as maths wherever the text is shown. The rules follow
// the common Markdown ones, so prices are left alone:
// - `$$…$$` is maths on its own line (it may span lines).
// - `$…$` is maths in the text, on one line. The opening `$` must be followed
//   by a non-space, the closing one preceded by a non-space and not followed
//   by a digit, so "$40 and $50" stays text.
// - `\$` is always a dollar sign.

export type MathSegment =
  | { kind: "text"; text: string }
  | { kind: "math"; tex: string; display: boolean; raw: string };

/** Splits text into plain parts and maths. Joining every `text` and `raw` gives the input back, apart from `\$`. */
export function splitMath(input: string): MathSegment[] {
  const out: MathSegment[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ kind: "text", text });
    text = "";
  };
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && input[i + 1] === "$") {
      text += "$";
      i += 2;
      continue;
    }
    if (ch !== "$") {
      text += ch;
      i += 1;
      continue;
    }
    if (input[i + 1] === "$") {
      const end = findClose(input, i + 2, "$$");
      if (end !== -1 && input.slice(i + 2, end).trim() !== "") {
        flush();
        out.push({
          kind: "math",
          tex: input.slice(i + 2, end).trim(),
          display: true,
          raw: input.slice(i, end + 2),
        });
        i = end + 2;
        continue;
      }
      text += "$$";
      i += 2;
      continue;
    }
    const end = inlineClose(input, i + 1);
    if (end !== -1) {
      flush();
      out.push({
        kind: "math",
        tex: input.slice(i + 1, end),
        display: false,
        raw: input.slice(i, end + 1),
      });
      i = end + 1;
      continue;
    }
    text += "$";
    i += 1;
  }
  flush();
  return out;
}

/** True when the text holds any maths. */
export function hasMath(input: string): boolean {
  return input.includes("$") && splitMath(input).some((s) => s.kind === "math");
}

function findClose(input: string, from: number, token: string): number {
  for (let i = from; i < input.length; i++) {
    if (input[i] === "\\") {
      i += 1;
      continue;
    }
    if (input.startsWith(token, i)) return i;
  }
  return -1;
}

function inlineClose(input: string, from: number): number {
  const first = input[from];
  if (first === undefined || /\s/.test(first)) return -1;
  for (let i = from; i < input.length; i++) {
    const ch = input[i];
    if (ch === "\n") return -1;
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "$") {
      const before = input[i - 1] ?? "";
      const after = input[i + 1] ?? "";
      if (i > from && !/\s/.test(before) && !/\d/.test(after) && after !== "$") return i;
      if (after === "$") return -1;
    }
  }
  return -1;
}

/** A LaTeX command offered while typing, with what it looks like. */
export interface MathCommand {
  name: string;
  /** What to insert; `|` is where the cursor goes. */
  insert: string;
  /** The symbol, for the suggestion list. */
  shows: string;
}

const symbol = (name: string, shows: string): MathCommand => ({ name, insert: `\\${name}`, shows });

/** Commands for auto-complete after a backslash, most used first. */
export const MATH_COMMANDS: readonly MathCommand[] = [
  { name: "frac", insert: "\\frac{|}{}", shows: "a/b" },
  { name: "sqrt", insert: "\\sqrt{|}", shows: "√" },
  { name: "int", insert: "\\int_{|}^{}", shows: "∫" },
  { name: "sum", insert: "\\sum_{|}^{}", shows: "∑" },
  { name: "prod", insert: "\\prod_{|}^{}", shows: "∏" },
  { name: "lim", insert: "\\lim_{|}", shows: "lim" },
  { name: "vec", insert: "\\vec{|}", shows: "v⃗" },
  { name: "det", insert: "\\det", shows: "det" },
  { name: "operatorname", insert: "\\operatorname{|}", shows: "op" },
  { name: "begin{pmatrix}", insert: "\\begin{pmatrix} | \\\\  \\end{pmatrix}", shows: "( )" },
  { name: "cdot", insert: "\\cdot", shows: "·" },
  { name: "times", insert: "\\times", shows: "×" },
  { name: "partial", insert: "\\partial", shows: "∂" },
  { name: "nabla", insert: "\\nabla", shows: "∇" },
  { name: "infty", insert: "\\infty", shows: "∞" },
  symbol("le", "≤"),
  symbol("ge", "≥"),
  symbol("ne", "≠"),
  symbol("approx", "≈"),
  symbol("equiv", "≡"),
  symbol("to", "→"),
  symbol("Rightarrow", "⇒"),
  symbol("Leftrightarrow", "⇔"),
  symbol("in", "∈"),
  symbol("subseteq", "⊆"),
  symbol("cup", "∪"),
  symbol("cap", "∩"),
  symbol("forall", "∀"),
  symbol("exists", "∃"),
  symbol("pm", "±"),
  symbol("land", "∧"),
  symbol("lor", "∨"),
  symbol("neg", "¬"),
  symbol("langle", "⟨"),
  symbol("rangle", "⟩"),
  symbol("sin", "sin"),
  symbol("cos", "cos"),
  symbol("tan", "tan"),
  symbol("ln", "ln"),
  symbol("log", "log"),
  symbol("exp", "exp"),
  symbol("mathbb{R}", "ℝ"),
  symbol("mathbb{C}", "ℂ"),
  symbol("mathbb{N}", "ℕ"),
  symbol("mathbb{Z}", "ℤ"),
];

/** Greek letters for the symbol bar and auto-complete. */
export const GREEK: readonly MathCommand[] = [
  ["alpha", "α"],
  ["beta", "β"],
  ["gamma", "γ"],
  ["delta", "δ"],
  ["epsilon", "ε"],
  ["varepsilon", "ε"],
  ["zeta", "ζ"],
  ["eta", "η"],
  ["theta", "θ"],
  ["kappa", "κ"],
  ["lambda", "λ"],
  ["mu", "μ"],
  ["nu", "ν"],
  ["xi", "ξ"],
  ["pi", "π"],
  ["rho", "ρ"],
  ["sigma", "σ"],
  ["tau", "τ"],
  ["phi", "φ"],
  ["varphi", "φ"],
  ["chi", "χ"],
  ["psi", "ψ"],
  ["omega", "ω"],
  ["Gamma", "Γ"],
  ["Delta", "Δ"],
  ["Theta", "Θ"],
  ["Lambda", "Λ"],
  ["Pi", "Π"],
  ["Sigma", "Σ"],
  ["Phi", "Φ"],
  ["Psi", "Ψ"],
  ["Omega", "Ω"],
].map(([name, shows]) => symbol(name as string, shows as string));

/** Commands whose name starts with what was typed after the backslash, best first. */
export function suggestCommands(prefix: string, limit = 6): MathCommand[] {
  if (!prefix) return [];
  const all = [...MATH_COMMANDS, ...GREEK];
  const exact = all.filter((c) => c.name.startsWith(prefix));
  const lower = prefix.toLowerCase();
  const loose = all.filter(
    (c) => !c.name.startsWith(prefix) && c.name.toLowerCase().startsWith(lower),
  );
  return [...exact, ...loose].slice(0, limit);
}
