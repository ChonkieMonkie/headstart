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

import { describe, expect, it } from "vitest";
import { hasMath, splitMath, suggestCommands } from "./math.ts";

const kinds = (text: string) =>
  splitMath(text)
    .map((s) => (s.kind === "math" ? `[${s.tex}${s.display ? "|d" : ""}]` : s.text))
    .join("");

describe("finding maths in text", () => {
  it("finds inline and display maths", () => {
    expect(kinds("So $x^2$ grows.")).toBe("So [x^2] grows.");
    expect(kinds("Then\n$$\\det(A - \\lambda I) = 0$$\ndone")).toBe(
      "Then\n[\\det(A - \\lambda I) = 0|d]\ndone",
    );
    expect(kinds("$a$ and $b$")).toBe("[a] and [b]");
  });

  it("leaves prices and lone dollar signs alone", () => {
    expect(kinds("The book was $40 and the lab $50.")).toBe("The book was $40 and the lab $50.");
    expect(kinds("Only $5")).toBe("Only $5");
    expect(kinds("a $ b $ c")).toBe("a $ b $ c");
    expect(kinds("Cost \\$3, then $y$")).toBe("Cost $3, then [y]");
  });

  it("keeps inline maths on one line and ignores empty display maths", () => {
    expect(kinds("$a\nb$")).toBe("$a\nb$");
    expect(kinds("$$ $$")).toBe("$$ $$");
  });

  it("keeps the raw text of a formula, for showing errors", () => {
    // A typo is still maths: the renderer shows it in red instead of breaking the note.
    const [, math] = splitMath("half-life $\\frac{\\ln 2}{k$ here");
    expect(math).toMatchObject({ kind: "math", tex: "\\frac{\\ln 2}{k" });
    const segs = splitMath("x $\\frac{1}{2}$");
    expect(segs[1]).toEqual({
      kind: "math",
      tex: "\\frac{1}{2}",
      display: false,
      raw: "$\\frac{1}{2}$",
    });
  });

  it("says whether text has maths", () => {
    expect(hasMath("Redo problem 5.7 d")).toBe(false);
    expect(hasMath("Prove $a^2+b^2=c^2$")).toBe(true);
    expect(hasMath("It was $40")).toBe(false);
  });
});

describe("suggesting commands", () => {
  it("offers commands that start with what was typed", () => {
    expect(suggestCommands("la").map((c) => c.name)).toEqual([
      "land",
      "langle",
      "lambda",
      "Lambda",
    ]);
    expect(suggestCommands("fr")[0]?.insert).toBe("\\frac{|}{}");
    expect(suggestCommands("")).toEqual([]);
  });
});
