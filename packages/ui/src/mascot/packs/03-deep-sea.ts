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

// Pack 03, deep sea: shells, a brass helmet, a glowing anglerfish lure and a
// few fish and a whale. The set's background (the aquarium) already exists in
// pack 01, so this pack draws no scene.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
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

/** A small fan shell with a flat hinge at (x, y) and ridges, for crowns and necklaces. */
function scallop(x: number, y: number, r: number, fill: string): string {
  return (
    outlined(
      "path",
      {
        d: `M${x - r} ${y} C${x - r} ${y - r * 1.3} ${x + r} ${y - r * 1.3} ${x + r} ${y} Z`,
        fill,
      },
      2.2,
    ) +
    line(
      `M${x} ${y} L${x} ${y - r * 0.9} M${x} ${y} L${x - r * 0.6} ${y - r * 0.7} M${x} ${y} L${x + r * 0.6} ${y - r * 0.7}`,
      OUTLINE,
      1.1,
      {
        opacity: 0.35,
      },
    )
  );
}

const HEAD: Record<string, Draw> = {
  // Common, Deep Sea. Three scallop shells on a band, the middle one biggest.
  "shell-crown": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 1), 9.5, 5.5) +
      scallop(-22, 3, 9, c(ctx, 0)) +
      scallop(22, 3, 9, c(ctx, 0)) +
      scallop(0, 1, 11, c(ctx, 0)) +
      SHINE("M-4 -7 C-2 -9 1 -10 4 -10", 0.6),
  }),

  // Uncommon, Deep Sea. A yellow sponge cap with holes, on a soft brim.
  "sponge-cap": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-34 6 C-38 -24 -22 -36 0 -36 C22 -36 38 -24 34 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      [
        [-18, -16],
        [0, -26],
        [18, -14],
        [-4, -6],
      ]
        .map(([x = 0, y = 0]) => outlined("circle", { cx: x, cy: y, r: 3, fill: c(ctx, 1) }, 1.4))
        .join("") +
      outlined("rect", { x: -37, y: 2, width: 74, height: 10, rx: 5, fill: c(ctx, 1) }, 2.8) +
      SHINE("M-24 -16 C-20 -24 -12 -28 -4 -29", 0.6),
  }),

  // Uncommon, Deep Sea. A glass bowl on your head with a fish swimming in it.
  "fishbowl-hat": (ctx) => ({
    front:
      el("circle", { cx: 0, cy: -14, r: 30, fill: c(ctx, 0), opacity: 0.35 }) +
      el("path", {
        d: "M-28.9 -6 Q0 -1 28.9 -6 A30 30 0 1 1 -28.9 -6 Z",
        fill: c(ctx, 0),
        opacity: 0.45,
      }) +
      outlined("ellipse", { cx: 2, cy: 4, rx: 8, ry: 5, fill: c(ctx, 1) }, 1.8) +
      outlined("path", { d: "M-5 4 L-12 0 L-12 8 Z", fill: c(ctx, 1) }, 1.6) +
      el("circle", { cx: 6, cy: 2, r: 1.3, fill: OUTLINE }) +
      outlined("circle", { cx: 0, cy: -14, r: 30, fill: "none" }, 3) +
      SHINE("M-22 -30 C-18 -37 -10 -40 -3 -41", 0.8) +
      outlined("rect", { x: -17, y: 12, width: 34, height: 6, rx: 3, fill: c(ctx, 1) }, 2.2),
  }),

  // Rare, Deep Sea. A brass diving helmet, open at the face, with bubbles on top.
  "brass-diving-helmet": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-41 12 C-43 -24 -24 -40 0 -40 C24 -40 43 -24 41 12 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      line("M-14 -34 C-18 -18 -18 0 -14 8 M14 -34 C18 -18 18 0 14 8", OUTLINE, 1.4, {
        opacity: 0.3,
      }) +
      [-27, 27]
        .map(
          (x) =>
            outlined("circle", { cx: x, cy: -4, r: 8, fill: c(ctx, 2) }, 2.6) +
            line(`M${x - 4} -7 L${x - 1} -10`, "#FFFFFF", 1.6, { opacity: 0.9 }),
        )
        .join("") +
      outlined("rect", { x: -45, y: 10, width: 90, height: 10, rx: 5, fill: c(ctx, 1) }, 3) +
      outlined("rect", { x: -4, y: -46, width: 8, height: 7, rx: 2, fill: c(ctx, 1) }, 2) +
      el("circle", {
        cx: 4,
        cy: -50,
        r: 3,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-bubble", 2.4),
      }) +
      el("circle", {
        cx: -6,
        cy: -52,
        r: 2.2,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-bubble", 2.4, 1.2),
      }),
  }),

  // Rare, Deep Sea. A seahorse clip on the side of the head that bobs gently.
  "seahorse-clip": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      tube("M22 -2 C30 -6 34 -14 28 -22 C23 -28 26 -34 34 -36", c(ctx, 0), 9, 6) +
        outlined(
          "path",
          { d: "M22 -14 C14 -14 12 -8 16 -4 C18 -2 22 -4 24 -8 Z", fill: c(ctx, 1) },
          1.8,
        ) +
        outlined("circle", { cx: 36, cy: -40, r: 7, fill: c(ctx, 0) }, 2.4) +
        tube("M41 -41 L49 -43", c(ctx, 0), 6, 3.4) +
        el("circle", { cx: 39, cy: -42, r: 1.4, fill: OUTLINE }) +
        el("circle", { cx: 28, cy: -18, r: 1.4, fill: c(ctx, 1) }),
    ),
  }),

  // Epic, Deep Sea. A headband with a stalk and a glowing lure, like an anglerfish.
  "anglerfish-lure": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      tube("M2 0 C-4 -12 2 -22 9 -30", c(ctx, 0), 6, 3) +
      el("circle", {
        cx: 9,
        cy: -36,
        r: 11,
        fill: c(ctx, 1),
        opacity: 0.45,
        style: `mix-blend-mode: screen; ${animate("mc-pulse", 2.2)}`,
      }) +
      outlined("circle", { cx: 9, cy: -36, r: 6.5, fill: c(ctx, 1) }, 2.4) +
      line("M6 -39 C6.5 -41 8 -42 10 -42", "#FFFFFF", 1.8, { opacity: 0.9 }),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Deep Sea. A starfish sticker on the left cheek.
  "starfish-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl - 2} ${ctx.geo.by - 1}) rotate(-12)` },
      outlined("path", { d: star(0, 0, 10.5), fill: c(ctx, 0) }, 2.2),
      el("circle", { cx: 0, cy: -1.5, r: 1.3, fill: c(ctx, 1) }),
      el("circle", { cx: -4, cy: 3, r: 1.1, fill: c(ctx, 1) }),
      el("circle", { cx: 4, cy: 3, r: 1.1, fill: c(ctx, 1) }),
      line("M-4 -6 L-2 -8", "#FFFFFF", 1.6, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Deep Sea. One pearl just below the outer eye, like a tear that stayed.
  "pearl-drop": (ctx) => {
    const [, [x2, y]] = eyesOf(ctx);
    const px = x2 + 5;
    const py = y + 13;
    return {
      front:
        outlined("circle", { cx: px, cy: py, r: 7, fill: c(ctx, 0) }, 2.2) +
        el("circle", { cx: px + 2.6, cy: py + 3, r: 4, fill: c(ctx, 1), opacity: 0.5 }) +
        line(`M${px - 4} ${py - 2.5} L${px - 2.2} ${py - 4.4}`, "#FFFFFF", 1.8, { opacity: 0.95 }),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Deep Sea. Pink shells on a cord, hung at the neck.
  "shell-necklace": (ctx) => ({
    front:
      line("M-22 -2 Q0 20 22 -2", c(ctx, 1), 2.2) +
      [
        [-16.7, 2.6],
        [-8.8, 7.2],
        [0, 9],
        [8.8, 7.2],
        [16.7, 2.6],
      ]
        .map(([x = 0, y = 0], i) => scallop(x, y + 4, i === 2 ? 7 : 5.5, c(ctx, 0)))
        .join(""),
  }),

  // Common, Deep Sea. Kelp fronds hanging from a wrap around the neck.
  "kelp-scarf": (ctx) => ({
    front:
      [-22, -6, 10, 24]
        .map((x, i) =>
          tube(
            `M${x} 4 C${x + (i % 2 ? 6 : -6)} 14 ${x + (i % 2 ? -6 : 6)} 20 ${x + (i % 2 ? -2 : 2)} 34`,
            c(ctx, 1),
            6,
            3,
          ),
        )
        .join("") + tube("M-30 -1 Q0 9 30 -1", c(ctx, 0), 10, 6.5),
  }),

  // Uncommon, Deep Sea. A long coat with a shirt, lapels and white buttons.
  "captains-coat": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        outlined("path", { d: "M84 122 L100 156 L116 122 Z", fill: c(ctx, 1) }, 2.2) +
        line("M80 122 L100 160 M120 122 L100 160", OUTLINE, 2.2) +
        [146, 164]
          .map((y) => outlined("circle", { cx: 100, cy: y, r: 2, fill: "#FFFFFF" }, 1.2))
          .join("") +
        line("M72 150 L88 150 M112 150 L128 150", OUTLINE, 1.6, { opacity: 0.3 }),
    ),
  }),

  // Rare, Deep Sea. A turtle shell on the back, with the hexagon scute in the middle.
  "turtle-shell-pack": (ctx) => ({
    back: g(
      { style: `transform-origin: 100px 146px; ${animate("mc-sway", 4)}` },
      outlined("ellipse", { cx: 100, cy: 146, rx: 52, ry: 36, fill: c(ctx, 0) }, 3.4) +
        outlined(
          "path",
          { d: "M100 118 L120 130 L120 152 L100 164 L80 152 L80 130 Z", fill: c(ctx, 1) },
          2.2,
        ) +
        line(
          "M62 130 L80 130 M138 130 L120 130 M60 160 L80 152 M140 160 L120 152",
          c(ctx, 1),
          2.2,
        ) +
        SHINE("M60 128 C64 118 72 112 80 110", 0.5),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Deep Sea. A fan shell held by its hinge.
  seashell: (ctx) => ({
    front:
      outlined("path", { d: "M-16 0 C-16 -18 16 -18 16 0 Z", fill: c(ctx, 0) }, 2.6) +
      line("M0 -1 L0 -15 M0 -1 L-9 -14 M0 -1 L9 -14 M0 -1 L-14 -8 M0 -1 L14 -8", OUTLINE, 1.2, {
        opacity: 0.4,
      }) +
      outlined("rect", { x: -4, y: -2, width: 8, height: 6, rx: 2, fill: c(ctx, 1) }, 1.8) +
      SHINE("M-9 -9 C-7 -12 -4 -13 -2 -13", 0.7),
  }),

  // Common, Deep Sea. A glass bottle with a rolled note and a cork.
  "message-bottle": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-11 14 L-11 -6 C-11 -10 -8 -12 -6 -14 L-3 -20 L3 -20 L6 -14 C8 -12 11 -10 11 -6 L11 14 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      outlined("rect", { x: -4, y: -25, width: 8, height: 6, rx: 1.5, fill: "#C98A4B" }, 1.8) +
      outlined("rect", { x: -5, y: -2, width: 10, height: 11, rx: 1.5, fill: c(ctx, 1) }, 1.2) +
      line("M-3 1 L3 1 M-3 4 L3 4 M-3 7 L1 7", OUTLINE, 0.8, { opacity: 0.4 }) +
      line("M-8 0 L-8 8", "#FFFFFF", 1.8, { opacity: 0.8 }),
  }),

  // Uncommon, Deep Sea. A little crab that sits on the hand with its claws up.
  "little-crab": (ctx) => ({
    front:
      line("M-9 4 L-15 8 M-8 6 L-12 11 M9 4 L15 8 M8 6 L12 11", OUTLINE, 1.8) +
      tube("M-7 -2 L-13 -12", c(ctx, 0), 5.5, 3) +
      tube("M7 -2 L13 -12", c(ctx, 0), 5.5, 3) +
      outlined(
        "ellipse",
        { cx: -16, cy: -16, rx: 6.2, ry: 4.6, fill: c(ctx, 0), transform: "rotate(-30 -16 -16)" },
        2.2,
      ) +
      outlined(
        "ellipse",
        { cx: 16, cy: -16, rx: 6.2, ry: 4.6, fill: c(ctx, 0), transform: "rotate(30 16 -16)" },
        2.2,
      ) +
      outlined("ellipse", { cx: 0, cy: 0, rx: 11, ry: 7.5, fill: c(ctx, 0) }, 2.6) +
      el("circle", { cx: -4, cy: 1, r: 1.6, fill: c(ctx, 1) }) +
      el("circle", { cx: 4, cy: 2, r: 1.6, fill: c(ctx, 1) }) +
      tube("M-4 -6 L-5 -12", c(ctx, 0), 3.4, 1.8) +
      tube("M4 -6 L5 -12", c(ctx, 0), 3.4, 1.8) +
      outlined("circle", { cx: -5, cy: -13.5, r: 2.6, fill: "#FFFFFF" }, 1.3) +
      outlined("circle", { cx: 5, cy: -13.5, r: 2.6, fill: "#FFFFFF" }, 1.3) +
      el("circle", { cx: -4.5, cy: -13, r: 1.1, fill: OUTLINE }) +
      el("circle", { cx: 5.5, cy: -13, r: 1.1, fill: OUTLINE }),
  }),

  // Uncommon, Deep Sea. A conch shell with its flared lip facing down.
  "conch-shell": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-12 14 C-14 2 -6 -10 0 -24 C6 -10 14 2 12 14 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      line("M-6 4 C-2 0 4 2 4 -2 C4 -6 -1 -6 -1 -2", OUTLINE, 1.4, { opacity: 0.5 }) +
      outlined("ellipse", { cx: 0, cy: 14, rx: 13, ry: 4.5, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-7 4 C-7 -2 -4 -8 -2 -14", 0.7),
  }),

  // Rare, Deep Sea. A clam, open just enough to show a pearl that twinkles.
  "pearl-clam": (ctx) => ({
    front:
      outlined("path", { d: "M-17 -2 C-17 12 17 12 17 -2 Z", fill: c(ctx, 0) }, 2.8) +
      line("M-10 4 L-6 9 M0 6 L0 10 M10 4 L6 9", OUTLINE, 1.2, { opacity: 0.3 }) +
      outlined(
        "path",
        { d: "M-17 -2 C-22 -18 -8 -26 4 -24 C14 -22 19 -12 17 -2 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      outlined("circle", { cx: 0, cy: -8, r: 6, fill: c(ctx, 1) }, 2) +
      el("path", {
        d: sparkle(3, -12, 3),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 0.8,
        style: animate("mc-twinkle", 2.2),
      }),
  }),

  // Rare, Deep Sea. A three-tined staff with a gem that glows. Strictly ceremonial.
  "sea-staff": (ctx) => ({
    front:
      tube("M0 14 L0 -34", c(ctx, 0), 6.5, 3.4) +
      tube("M0 -34 L0 -56", c(ctx, 0), 6.5, 3.4) +
      tube("M-7 -34 C-10 -40 -10 -46 -9 -54", c(ctx, 0), 5.4, 2.6) +
      tube("M7 -34 C10 -40 10 -46 9 -54", c(ctx, 0), 5.4, 2.6) +
      outlined("rect", { x: -10, y: -36, width: 20, height: 5, rx: 2.5, fill: c(ctx, 0) }, 2.2) +
      g(
        { style: animate("mc-pulse", 2.2) },
        outlined("circle", { cx: 0, cy: -16, r: 4.6, fill: c(ctx, 1) }, 2),
      ),
  }),

  // Rare, Deep Sea. A glass float on a rope that bobs while you think.
  "glass-float": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      line("M0 0 L0 -17", OUTLINE, 1.6),
      outlined("circle", { cx: 0, cy: -28, r: 11, fill: c(ctx, 0) }, 2.6) +
        line("M-9 -28 L9 -28 M-4 -36 L-4 -20 M4 -36 L4 -20", c(ctx, 1), 1.4, { opacity: 0.8 }) +
        SHINE("M-7 -33 C-5 -37 -1 -38 2 -38", 0.8),
    ),
  }),

  // Epic, Deep Sea. A small brass cage lantern with a light that breathes.
  "sea-lantern": (ctx) => ({
    front:
      tube("M-8 -18 Q0 -36 8 -18", c(ctx, 0), 4.5, 2.2) +
      el("circle", {
        cx: 0,
        cy: -11,
        r: 13,
        fill: c(ctx, 1),
        opacity: 0.35,
        style: `mix-blend-mode: screen; ${animate("mc-pulse", 2.6)}`,
      }) +
      outlined("rect", { x: -7.5, y: -20, width: 15, height: 22, rx: 4, fill: c(ctx, 1) }, 2.2) +
      line("M-3 -19 L-3 0 M3 -19 L3 0", c(ctx, 0), 1.6) +
      el("circle", { cx: 0, cy: -11, r: 3.2, fill: "#FFFFFF", style: animate("mc-twinkle", 2.6) }) +
      outlined("rect", { x: -10, y: 2, width: 20, height: 4, rx: 2, fill: c(ctx, 0) }, 2),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Deep Sea. Four small fish that swim in place along the margins.
  "school-of-fish": (ctx) => {
    const fish = (x: number, y: number, flip: number, delay: number): string =>
      g(
        { transform: `translate(${x} ${y}) scale(${flip} 1)` },
        g(
          { style: animate("mc-bob", 2.6, delay) },
          outlined("path", { d: "M-7 0 L-13 -5 L-13 5 Z", fill: c(ctx, 0) }, 1.4) +
            outlined("ellipse", { cx: 0, cy: 0, rx: 9, ry: 5.6, fill: c(ctx, 0) }, 1.8) +
            line("M-2 -4 C-1 -1 -1 1 -2 4", c(ctx, 1), 1.6) +
            el("circle", { cx: 4, cy: -1.2, r: 1.3, fill: OUTLINE }),
        ),
      );
    return {
      front:
        fish(38, 62, 1, 0) +
        fish(30, 124, 1, 1.2) +
        fish(168, 94, -1, 0.6) +
        fish(172, 152, -1, 1.8),
    };
  },

  // Epic, Deep Sea. Kelp that sways beside you on both margins.

  // Legendary, Deep Sea. A tiny whale that bobs beside you, blows bubbles and glows.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
