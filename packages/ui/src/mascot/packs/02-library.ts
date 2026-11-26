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

// Pack 02, the library: a study room of hats, glasses, books, ink and a few
// floating letters. Every item here uses at most three colours of its own,
// besides the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  SHINE,
  torso,
} from "./kit.ts";

/** Letter strokes for the floating letters, centred on (0, 0). */
const GLYPH = {
  A: "M-4 4 L0 -4 L4 4 M-2 1 L2 1",
  E: "M3 -4 L-3 -4 L-3 4 L3 4 M-3 0 L2 0",
  T: "M-4 -4 L4 -4 M0 -4 L0 4",
  O: "M0 -4 C2.5 -4 4 -2 4 0 C4 2 2.5 4 0 4 C-2.5 4 -4 2 -4 0 C-4 -2 -2.5 -4 0 -4 Z",
};
type Letter = keyof typeof GLYPH;

/** One floating letter tile on the canvas. */
const tile = (x: number, y: number, letter: Letter, colour: string, delay: number): string =>
  g(
    { style: animate("mc-bob", 3.2, delay) },
    outlined("rect", { x: x - 7, y: y - 7, width: 14, height: 14, rx: 3, fill: colour }, 2.2),
    g({ transform: `translate(${x} ${y})` }, line(GLYPH[letter], "#FFFFFF", 1.8)),
  );

const HEAD: Record<string, Draw> = {
  // Common, Library. A felt hat with one owl feather tucked in the band.
  "owl-feather-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-34 6 C-34 -24 -20 -32 0 -32 C20 -32 34 -24 34 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      SHINE("M-22 -18 C-16 -25 -8 -27 -2 -27", 0.3) +
      line("M-33 -3 C-18 1 18 1 33 -3", OUTLINE, 4.2) +
      outlined(
        "path",
        { d: "M14 -4 C18 -22 28 -36 40 -46 C40 -30 34 -12 24 -2 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      line("M18 -6 C26 -20 32 -34 38 -43", OUTLINE, 1.2, { opacity: 0.4 }) +
      outlined("path", { d: "M-42 6 C-30 2 30 2 42 6 C36 14 -36 14 -42 6 Z", fill: c(ctx, 0) }, 3),
  }),

  // Uncommon, Library. A drawer from a card catalogue, worn on top of the head.
  "card-catalogue-hat": (ctx) => ({
    front:
      outlined("rect", { x: -32, y: -28, width: 64, height: 34, rx: 4, fill: c(ctx, 0) }, 3) +
      SHINE("M-24 -22 L-24 -8", 0.3) +
      outlined("rect", { x: -22, y: -24, width: 44, height: 9, rx: 1.5, fill: c(ctx, 1) }, 1.8) +
      line("M-17 -19.5 L9 -19.5", OUTLINE, 1.2, { opacity: 0.4 }) +
      outlined("circle", { cx: 0, cy: -7, r: 3, fill: "#FFFFFF" }, 1.8) +
      outlined("rect", { x: -38, y: 4, width: 76, height: 6, rx: 3, fill: c(ctx, 0) }, 2.6),
  }),

  // Uncommon, Library. A worm in a tiny book hat, reading over your shoulder.
  "bookworm-hat": (ctx) => ({
    front:
      tube("M-8 -14 C-16 -22 -2 -30 -8 -38 C-11 -43 -2 -48 4 -45", c(ctx, 1), 7, 4) +
      outlined("circle", { cx: 6, cy: -44, r: 5.2, fill: c(ctx, 1) }, 2.2) +
      el("circle", { cx: 4.4, cy: -45, r: 1, fill: OUTLINE }) +
      el("circle", { cx: 8, cy: -45, r: 1, fill: OUTLINE }) +
      line("M3.5 -40.6 Q6 -38.6 8.5 -40.6", OUTLINE, 1) +
      outlined("rect", { x: -32, y: -14, width: 64, height: 20, rx: 4, fill: c(ctx, 0) }, 3) +
      el("rect", { x: -27, y: -4, width: 54, height: 6, rx: 2, fill: "#FFFFFF" }) +
      line("M0 -14 L0 6", OUTLINE, 1.4, { opacity: 0.35 }) +
      SHINE("M-24 -10 L-16 -10", 0.5),
  }),

  // Rare, Library. A headband with a clip-on reading lamp whose glow comes and goes.
  "reading-lamp-band": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      tube("M38 6 L44 -12 L56 -24", c(ctx, 0), 5, 2.4) +
      el("circle", { cx: 60, cy: -4, r: 12, fill: c(ctx, 1), style: animate("mc-pulse", 2.6) }) +
      outlined("path", { d: "M47 -14 C47 -34 73 -34 73 -14 Z", fill: c(ctx, 0) }, 2.6) +
      el("circle", { cx: 60, cy: -14, r: 2.6, fill: "#FFFFFF" }),
  }),

  // Epic, Library. A wise owl perched on top of the head. It bobs and blinks slowly.
  "owl-perch": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.4) },
      outlined("path", { d: "M-13 -30 L-17 -46 L-3 -37 Z", fill: c(ctx, 0) }, 2.4) +
        outlined("path", { d: "M13 -30 L17 -46 L3 -37 Z", fill: c(ctx, 0) }, 2.4) +
        outlined("ellipse", { cx: 0, cy: -18, rx: 18, ry: 20, fill: c(ctx, 0) }, 3) +
        outlined("circle", { cx: -8, cy: -24, r: 7.6, fill: c(ctx, 1) }, 1.6) +
        outlined("circle", { cx: 8, cy: -24, r: 7.6, fill: c(ctx, 1) }, 1.6) +
        el("circle", { cx: -8, cy: -24, r: 4.2, fill: "#FFFFFF" }) +
        el("circle", { cx: 8, cy: -24, r: 4.2, fill: "#FFFFFF" }) +
        el("circle", { cx: -8, cy: -23.5, r: 2.2, fill: OUTLINE }) +
        el("circle", { cx: 8, cy: -23.5, r: 2.2, fill: OUTLINE }) +
        el("circle", {
          cx: -8,
          cy: -24,
          r: 4.6,
          fill: c(ctx, 0),
          style: animate("mc-twinkle", 4),
        }) +
        el("circle", { cx: 8, cy: -24, r: 4.6, fill: c(ctx, 0), style: animate("mc-twinkle", 4) }) +
        outlined("path", { d: "M-2.6 -18 L2.6 -18 L0 -13.5 Z", fill: c(ctx, 2) }, 1.2) +
        line("M-7 2 L-7 5 M7 2 L7 5", c(ctx, 2), 2.4),
    ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Library. A smudge of ink on one cheek, from taking notes in a hurry.
  "ink-smudge": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl + 7} ${ctx.geo.by - 2}) rotate(-12)` },
      outlined(
        "path",
        {
          d: "M-9 -2 C-7 -7 2 -7 5 -3 C9 -1 10 4 6 6 C4 9 -3 8 -4 5 C-8 6 -11 2 -9 -2 Z",
          fill: c(ctx, 0),
        },
        1.4,
      ),
      outlined("circle", { cx: 6, cy: 10, r: 1.8, fill: c(ctx, 0) }, 1.1),
    ),
  }),

  // Uncommon, Library. Clip-on glasses for the nose, with a cord that runs to the ear.
  "pince-nez": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const r = 8;
    return {
      front:
        line(`M${x1 + r} ${y} Q100 ${y - 3} ${x2 - r} ${y}`, c(ctx, 0), 2.4) +
        el("circle", { cx: x1, cy: y, r, fill: "#DDEBFF", opacity: 0.45 }) +
        el("circle", { cx: x2, cy: y, r, fill: "#DDEBFF", opacity: 0.45 }) +
        el("circle", { cx: x1, cy: y, r, fill: "none", stroke: OUTLINE, "stroke-width": 4.4 }) +
        el("circle", { cx: x2, cy: y, r, fill: "none", stroke: OUTLINE, "stroke-width": 4.4 }) +
        el("circle", { cx: x1, cy: y, r, fill: "none", stroke: c(ctx, 0), "stroke-width": 2 }) +
        el("circle", { cx: x2, cy: y, r, fill: "none", stroke: c(ctx, 0), "stroke-width": 2 }) +
        line(
          `M${x1 - r} ${y} C${x1 - r - 8} ${y + 2} ${x1 - r - 12} ${y + 12} ${x1 - r - 10} ${y + 22}`,
          c(ctx, 1),
          1.6,
          {
            "stroke-dasharray": "3 2",
          },
        ) +
        line(`M${x1 - 4} ${y - 4} L${x1 - 1} ${y - 6}`, "#FFFFFF", 1.4, { opacity: 0.8 }),
    };
  },

  // Rare, Library. A red stamp on the forehead, with sparkles when it is approved.
  "library-stamp": (ctx) => ({
    front:
      el("circle", { cx: 100, cy: 62, r: 8, fill: "none", stroke: OUTLINE, "stroke-width": 4.6 }) +
      el("circle", {
        cx: 100,
        cy: 62,
        r: 8,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 2.6,
      }) +
      el("circle", {
        cx: 100,
        cy: 62,
        r: 4.2,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 1.4,
      }) +
      line("M96.5 62 L103.5 62", c(ctx, 0), 1.4) +
      el("path", {
        d: sparkle(113, 52, 3.6),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1,
        style: animate("mc-twinkle", 2),
      }) +
      el("path", {
        d: sparkle(88, 50, 2.8),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1,
        style: animate("mc-twinkle", 2, 1),
      }),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Library. A tweed jacket with a white shirt, lapels and elbow patches.
  "tweed-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M72 136 L96 172 M128 136 L104 172", OUTLINE, 1.4, {
          opacity: 0.22,
          "stroke-dasharray": "3 3",
        }) +
        el("path", { d: "M92 122 L108 122 L100 146 Z", fill: "#FFFFFF" }) +
        outlined("path", { d: "M80 122 L92 122 L100 146 L90 156 Z", fill: c(ctx, 1) }, 2) +
        outlined("path", { d: "M120 122 L108 122 L100 146 L110 156 Z", fill: c(ctx, 1) }, 2) +
        el("circle", { cx: 100, cy: 164, r: 2, fill: OUTLINE }) +
        el("circle", { cx: 100, cy: 172, r: 2, fill: OUTLINE }) +
        outlined("ellipse", { cx: 73, cy: 160, rx: 6, ry: 7, fill: c(ctx, 1) }, 2) +
        outlined("ellipse", { cx: 127, cy: 160, rx: 6, ry: 7, fill: c(ctx, 1) }, 2),
    ),
  }),

  // Common, Library. A book satchel on one strap, down by the right hip.
  "book-satchel": (ctx) => ({
    torso: torso(
      ctx,
      tube("M74 122 Q100 152 110 156", c(ctx, 1), 6, 3.2) +
        outlined("rect", { x: 106, y: 148, width: 30, height: 26, rx: 5, fill: c(ctx, 0) }, 3) +
        outlined(
          "path",
          { d: "M106 157 L136 157 L136 163 Q121 170 106 163 Z", fill: c(ctx, 1) },
          2,
        ) +
        el("rect", {
          x: 116,
          y: 163,
          width: 10,
          height: 7,
          rx: 1.5,
          fill: "#FFFFFF",
          opacity: 0.85,
        }),
    ),
  }),

  // Uncommon, Library. A long gown with a stole, for grand reading rooms.
  "scholar-gown": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        { d: "M68 122 C60 146 56 166 54 182 L146 182 C144 166 140 146 132 122 Z", fill: c(ctx, 0) },
        3.2,
      ) +
        outlined("path", { d: "M84 122 L100 156 L116 122 Z", fill: c(ctx, 1) }, 2.4) +
        line("M100 156 L100 182", OUTLINE, 1.4, { opacity: 0.3 }) +
        line("M72 150 L64 176 M128 150 L136 176", OUTLINE, 1.4, { opacity: 0.25 }) +
        SHINE("M80 134 C76 146 74 158 72 170", 0.3),
    ),
  }),

  // Rare, Library. A cord necklace with a bookmark ribbon that swings gently.
  "bookmark-ribbon": (ctx) => ({
    torso: torso(
      ctx,
      tube("M76 122 Q100 146 124 122", c(ctx, 1), 4.6, 2.2) +
        g(
          { style: `transform-origin: 100px 134px; ${animate("mc-sway", 3.2)}` },
          outlined(
            "path",
            { d: "M92 134 L108 134 L108 170 L100 164 L92 170 Z", fill: c(ctx, 0) },
            2.4,
          ) + line("M96 141 L96 152", "#FFFFFF", 1.6, { opacity: 0.7 }),
        ),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Library. A rolled note with the whole week written on it.
  "rolled-scroll": (ctx) => ({
    front:
      outlined("rect", { x: -9, y: -12, width: 18, height: 24, rx: 2, fill: c(ctx, 1) }, 2.2) +
      line("M-5 -6 L5 -6 M-5 -1 L5 -1 M-5 4 L2 4", OUTLINE, 1.1, { opacity: 0.35 }) +
      outlined("rect", { x: -11, y: -16, width: 22, height: 6, rx: 3, fill: c(ctx, 0) }, 2.2) +
      outlined("rect", { x: -11, y: 10, width: 22, height: 6, rx: 3, fill: c(ctx, 0) }, 2.2),
  }),

  // Common, Library. A little bottle of ink for the fountain pen and the doodles.
  "ink-bottle": (ctx) => ({
    front:
      outlined("rect", { x: -3, y: -7, width: 6, height: 5, rx: 1, fill: "#DDEBFF" }, 1.8) +
      outlined("rect", { x: -4.5, y: -12, width: 9, height: 6, rx: 1.5, fill: c(ctx, 1) }, 2) +
      outlined(
        "path",
        { d: "M-9 -2 L9 -2 L9 12 C9 15 7 16 4 16 L-4 16 C-7 16 -9 15 -9 12 Z", fill: "#DDEBFF" },
        2.6,
      ) +
      el("path", {
        d: "M-7 3 L7 3 L7 12 C7 14 6 14.5 4.5 14.5 L-4.5 14.5 C-6 14.5 -7 14 -7 12 Z",
        fill: c(ctx, 0),
      }) +
      SHINE("M-5 5 L-5 10", 0.7),
  }),

  // Uncommon, Library. Three books in a stack, with their pages showing.
  "stack-of-books": (ctx) => ({
    front:
      outlined("rect", { x: -14, y: 6, width: 28, height: 9, rx: 2.5, fill: c(ctx, 0) }, 2.2) +
      el("rect", { x: 9, y: 8, width: 3, height: 5, fill: "#FFFFFF" }) +
      outlined("rect", { x: -12, y: -2, width: 25, height: 8, rx: 2.5, fill: c(ctx, 1) }, 2.2) +
      el("rect", { x: 9, y: 0, width: 2.5, height: 4, fill: "#FFFFFF" }) +
      outlined("rect", { x: -13, y: -11, width: 24, height: 8, rx: 2.5, fill: c(ctx, 0) }, 2.2) +
      el("rect", { x: 8, y: -9, width: 2.5, height: 4, fill: "#FFFFFF" }) +
      line("M-8 -7 L2 -7", OUTLINE, 1, { opacity: 0.3 }),
  }),

  // Uncommon, Library. A letter with a wax seal, sealed for later.
  "wax-letter": (ctx) => ({
    front:
      outlined("rect", { x: -14, y: -9, width: 28, height: 19, rx: 2.5, fill: c(ctx, 0) }, 2.4) +
      line("M-13 -8 L0 3 L13 -8", OUTLINE, 1.4, { opacity: 0.5 }) +
      outlined("circle", { cx: 0, cy: 2, r: 4.2, fill: c(ctx, 1) }, 1.8),
  }),

  // Rare, Library. A desk bell. The little arcs flash when it rings.
  "library-bell": (ctx) => ({
    front:
      outlined("rect", { x: -16, y: 7, width: 32, height: 6, rx: 3, fill: c(ctx, 1) }, 2.2) +
      outlined(
        "path",
        { d: "M-13 8 C-13 -9 -7 -15 0 -15 C7 -15 13 -9 13 8 Z", fill: c(ctx, 0) },
        2.4,
      ) +
      SHINE("M-8 -6 C-7 -10 -4 -12 -1 -12", 0.6) +
      outlined("circle", { cx: 0, cy: -17, r: 2.6, fill: c(ctx, 1) }, 1.8) +
      g(
        { style: animate("mc-twinkle", 1.8) },
        line("M-19 -8 Q-23 -1 -19 6", c(ctx, 0), 2),
        line("M19 -8 Q23 -1 19 6", c(ctx, 0), 2),
      ),
  }),

  // Rare, Library. A pocket watch on a loop. It bobs along while you study.
  "pocket-watch": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("rect", { x: -2.5, y: -17, width: 5, height: 4, rx: 1.5, fill: c(ctx, 1) }, 1.8) +
        outlined("circle", { cx: 0, cy: -2, r: 11, fill: c(ctx, 0) }, 2.6) +
        el("circle", { cx: 0, cy: -2, r: 7.8, fill: "#FFFFFF" }) +
        line("M0 -2 L0 -6.5 M0 -2 L3.5 0", OUTLINE, 1.4) +
        el("circle", { cx: 0, cy: -2, r: 1, fill: OUTLINE }) +
        line("M0 -9.5 L0 -8.2 M8.2 -2 L9.5 -2 M0 5.2 L0 6.5 M-8.2 -2 L-9.5 -2", OUTLINE, 1.2) +
        SHINE("M-6 -8 C-4 -10 -2 -11 0 -11", 0.6),
    ),
  }),

  // Epic, Library. An hourglass where the sand keeps falling, one grain at a time.
};

const AURA: Record<string, Draw> = {
  // Rare, Library. Letter tiles that bob around you, spelling nothing in particular.
  "floating-letters": (ctx) => ({
    front:
      tile(34, 70, "A", c(ctx, 0), 0) +
      tile(166, 80, "E", c(ctx, 1), 0.8) +
      tile(30, 130, "T", c(ctx, 1), 1.6) +
      tile(170, 136, "O", c(ctx, 0), 2.4),
  }),

  // Epic, Library. Pages that flip over around you, one chapter at a time.

  // Legendary, Library. Books circling you slowly, with a warm glow behind.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
