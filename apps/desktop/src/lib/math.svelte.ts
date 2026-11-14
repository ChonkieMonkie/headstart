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

// Draws LaTeX with KaTeX. KaTeX and its fonts load the first time a text with
// maths is shown, so screens without maths never pay for it. Rendering never
// runs code from a note: `trust` is off and errors become a message.

import type Katex from "katex";

type KatexModule = typeof Katex;

export const math = $state<{ katex: KatexModule | null }>({ katex: null });

let loading: Promise<void> | null = null;

/** Starts loading KaTeX and its stylesheet, once. */
export function ensureKatex(): Promise<void> {
  loading ??= Promise.all([import("katex"), import("katex/dist/katex.min.css")])
    .then(([module]) => {
      math.katex = module.default;
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

export interface RenderedTex {
  html: string | null;
  /** Why the formula could not be drawn, in a few words. */
  error: string | null;
}

const cache = new Map<string, RenderedTex>();

/** Renders one formula, or explains what is wrong with it. Results are cached. */
export function renderTex(katex: KatexModule, tex: string, display: boolean): RenderedTex {
  const key = `${display ? "D" : "I"}${tex}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let result: RenderedTex;
  try {
    result = {
      html: katex.renderToString(tex, {
        displayMode: display,
        throwOnError: true,
        trust: false,
        strict: "ignore",
        maxSize: 20,
        maxExpand: 200,
      }),
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // "KaTeX parse error: Expected '}', got 'EOF' at end of input: \frac{1}{2" → "Expected '}', got 'EOF'"
    const short = message
      .replace(/^KaTeX parse error:\s*/, "")
      .replace(/\s+at (end of input|position \d+):.*$/s, "")
      .replace(/\s+in a macro argument/, "");
    result = { html: null, error: short };
  }
  if (cache.size > 500) cache.clear();
  cache.set(key, result);
  return result;
}
