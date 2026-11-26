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

// Pack 18, fantasy: knights, elves, dragons, fairies and a phoenix. A theme
// batch with no set. Every item uses at most three colours of its own,
// besides the shared outline and white shine.

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

/** A small rune on a cheek: an upright stroke with two arms, inked with the outline. */
function rune(x: number, y: number, color: string): string {
  const d = `M${x} ${y - 7} L${x} ${y + 7} M${x} ${y - 1} L${x - 5} ${y - 6} M${x} ${y - 1} L${x + 5} ${y - 6}`;
  return line(d, OUTLINE, 3.6) + line(d, color, 1.8);
}

/** One half of a masquerade mask: a lens with a flick at its outer corner. s is -1 for the left eye, 1 for the right. */
function maskLens(x: number, y: number, s: number): string {
  return `M${x - 12 * s} ${y + 2} C${x - 12 * s} ${y - 8} ${x + 4 * s} ${y - 9} ${x + 14 * s} ${y - 3} L${x + 26 * s} ${y - 10} L${x + 22 * s} ${y + 2} C${x + 18 * s} ${y + 8} ${x - 4 * s} ${y + 9} ${x - 12 * s} ${y + 2} Z`;
}

/** A small round-bottomed bottle with a cork, its top at height `top`. */
function vial(x: number, top: number, liquid: string): string {
  const cy = top + 12;
  return (
    outlined("rect", { x: x - 2.6, y: top + 3, width: 5.2, height: 10, fill: "#EAF6FF" }, 2) +
    outlined("rect", { x: x - 4, y: top, width: 8, height: 4, rx: 1.2, fill: "#9AA3B5" }, 1.6) +
    outlined("circle", { cx: x, cy, r: 6.5, fill: "#EAF6FF" }, 2.2) +
    el("circle", { cx: x, cy: cy + 1, r: 4, fill: liquid }) +
    line(`M${x - 3.6} ${cy - 1} L${x - 3.6} ${cy + 1.5}`, "#FFFFFF", 1.4, { opacity: 0.9 })
  );
}

const HEAD: Record<string, Draw> = {
  // Common, Fantasy. An open-face metal helm: a dome, a raised ridge, cheek guards and a plume.
  "knight-helm": (ctx) => ({
    front:
      // Cheek guards, hanging down the sides well outside the eyes.
      [-1, 1]
        .map(
          (s) =>
            outlined(
              "path",
              {
                d: `M${36 * s} 4 L${41 * s} 14 C${42 * s} 26 ${39 * s} 34 ${33 * s} 38 L${27 * s} 36 C${31 * s} 28 ${31 * s} 18 ${28 * s} 6 Z`,
                fill: c(ctx, 0),
              },
              2.8,
            ) + el("circle", { cx: 35 * s, cy: 14, r: 1.6, fill: "#FFFFFF" }),
        )
        .join("") +
      // Rounded metal dome.
      outlined(
        "path",
        { d: "M-36 6 C-38 -20 -20 -36 0 -36 C20 -36 38 -20 36 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      // Raised centre ridge.
      outlined("path", { d: "M-4 -34 Q0 -39 4 -34 L5 4 L-5 4 Z", fill: c(ctx, 0) }, 2.2) +
      SHINE("M-24 -16 C-20 -26 -10 -30 -2 -31", 0.7) +
      // Rim band with rivets.
      outlined("rect", { x: -39, y: 2, width: 78, height: 8, rx: 3.5, fill: c(ctx, 1) }, 2.8) +
      [-28, -14, 0, 14, 28]
        .map((x) => el("circle", { cx: x, cy: 6, r: 1.6, fill: "#FFFFFF" }))
        .join("") +
      // Small plume on top.
      outlined(
        "path",
        { d: "M2 -36 C8 -48 20 -46 22 -38 C16 -42 10 -40 6 -34 Z", fill: c(ctx, 1) },
        2.2,
      ),
  }),

  // Common. Pointy elf ears that poke out from the sides of the head.
  "elf-ears": (ctx) => ({
    front: [-1, 1]
      .map(
        (s) =>
          outlined(
            "path",
            {
              d: `M${28 * s} -2 C${40 * s} -8 ${52 * s} -7 ${66 * s} -3 C${54 * s} 4 ${42 * s} 12 ${28 * s} 10 Z`,
              fill: c(ctx, 0),
            },
            2.8,
          ) +
          el("path", {
            d: `M${32 * s} 0 C${42 * s} -4 ${50 * s} -4 ${59 * s} -3 C${51 * s} 2 ${42 * s} 6 ${32 * s} 6 Z`,
            fill: c(ctx, 1),
          }),
      )
      .join(""),
  }),

  // Uncommon, Fantasy. A pearly unicorn horn on a pink band.
  "unicorn-horn": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      outlined(
        "path",
        { d: "M-6 -2 C-4 -14 -1 -26 0 -42 C1 -26 4 -14 6 -2 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      line("M-5 -10 L4 -14 M-4 -20 L3 -24 M-2 -30 L2 -33", OUTLINE, 1.4, { opacity: 0.35 }) +
      SHINE("M-2 -20 C-2 -26 -1 -32 0 -36", 0.8),
  }),

  // Uncommon, Fantasy. A hood with dragon horns and scales.
  "dragon-hood": (ctx) => ({
    front:
      [-1, 1]
        .map((s) =>
          outlined(
            "path",
            {
              d: `M${26 * s} -14 C${34 * s} -22 ${40 * s} -30 ${46 * s} -40 C${42 * s} -26 ${40 * s} -14 ${36 * s} -4 Z`,
              fill: c(ctx, 1),
            },
            2.6,
          ),
        )
        .join("") +
      outlined("path", { d: "M-38 8 C-38 -36 38 -36 38 8 Z", fill: c(ctx, 0) }, 3.2) +
      line("M-22 -12 Q-16 -18 -10 -12 M-6 -20 Q0 -26 6 -20 M10 -12 Q16 -18 22 -12", c(ctx, 1), 2) +
      SHINE("M-22 -18 C-16 -26 -8 -28 0 -28", 0.3) +
      outlined("rect", { x: -40, y: 2, width: 80, height: 8, rx: 4, fill: c(ctx, 1) }, 2.6),
  }),

  // Rare, Fantasy. A thin gold circlet with a star that twinkles above it.
  "star-circlet": (ctx) => ({
    front:
      tube("M-40 14 C-26 5 26 5 40 14", c(ctx, 0), 6.5, 3.2) +
      outlined("circle", { cx: 0, cy: 7, r: 4.6, fill: c(ctx, 1) }, 2) +
      el("path", {
        d: sparkle(0, -16, 9),
        fill: c(ctx, 0),
        stroke: OUTLINE,
        "stroke-width": 1.6,
        style: animate("mc-twinkle", 2.2),
      }) +
      el("path", {
        d: sparkle(-30, -16, 4.2),
        fill: c(ctx, 0),
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2.2, 1),
      }) +
      el("path", {
        d: sparkle(30, -22, 3.4),
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2.2, 0.5),
      }),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Fantasy. A little rune on each cheek.
  "rune-marks": (ctx) => ({
    front: [ctx.geo.bl, ctx.geo.br].map((x) => rune(x, ctx.geo.by, c(ctx, 0))).join(""),
  }),

  // Uncommon, Fantasy. A gem on the forehead, on a little gold setting.
  "forehead-gem": (ctx) => ({
    front: g(
      { transform: `translate(100 ${ctx.geo.ey - 16})` },
      outlined("path", { d: "M-10 0 C-6 -5 6 -5 10 0 C6 5 -6 5 -10 0 Z", fill: c(ctx, 1) }, 2) +
        outlined("path", { d: "M0 -8 L7 0 L0 8 L-7 0 Z", fill: c(ctx, 0) }, 2.2) +
        line("M-3 -4 L-1 -6", "#FFFFFF", 1.8, { opacity: 0.9 }),
    ),
  }),

  // Rare, Fantasy. A masquerade mask over the eyes, with sparkling tips.
  "masquerade-mask": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    return {
      front:
        el("path", { d: maskLens(x1, y, -1), fill: c(ctx, 0), opacity: 0.45 }) +
        el("path", { d: maskLens(x2, y, 1), fill: c(ctx, 0), opacity: 0.45 }) +
        outlined("path", { d: maskLens(x1, y, -1), fill: "none" }, 2.6) +
        outlined("path", { d: maskLens(x2, y, 1), fill: "none" }, 2.6) +
        line(maskLens(x1, y, -1), c(ctx, 1), 1.2) +
        line(maskLens(x2, y, 1), c(ctx, 1), 1.2) +
        outlined(
          "path",
          { d: sparkle(x1 - 30, y - 12, 3.4), fill: "#FFFFFF", style: animate("mc-twinkle", 2) },
          1.2,
        ) +
        outlined(
          "path",
          { d: sparkle(x2 + 30, y - 12, 3.4), fill: "#FFFFFF", style: animate("mc-twinkle", 2, 1) },
          1.2,
        ),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Fantasy. Polished armour with a gold trim and a belt.
  "knight-breastplate": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        SHINE("M78 134 C76 146 76 158 80 166", 0.6) +
        line("M100 130 L100 168", OUTLINE, 1.6, { opacity: 0.22 }) +
        outlined(
          "path",
          { d: "M80 124 L100 146 L120 124 L112 121 L100 134 L88 121 Z", fill: c(ctx, 1) },
          2,
        ) +
        [84, 116].map((x) => el("circle", { cx: x, cy: 148, r: 1.8, fill: "#FFFFFF" })).join("") +
        outlined("rect", { x: 72, y: 166, width: 56, height: 9, rx: 4, fill: c(ctx, 1) }, 2.6),
    ),
  }),

  // Common, Fantasy. A long robe with stars and a sash.
  "starry-robe": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        { d: "M68 122 C58 148 50 170 46 182 L154 182 C150 170 142 148 132 122 Z", fill: c(ctx, 0) },
        3.4,
      ) +
        outlined(
          "path",
          { d: "M50 172 C80 178 120 178 150 172 L154 182 L46 182 Z", fill: c(ctx, 1) },
          2.4,
        ) +
        line("M86 124 L100 140 L114 124", OUTLINE, 2, { opacity: 0.35 }) +
        line("M74 134 C90 146 110 146 126 134", c(ctx, 1), 2.2) +
        [
          [84, 152, 4.4],
          [118, 150, 3.6],
          [100, 164, 4.8],
          [76, 166, 2.8],
          [126, 166, 2.8],
        ]
          .map(([x = 0, y = 0, r = 0]) =>
            outlined("path", { d: star(x, y, r), fill: c(ctx, 1) }, 1.4),
          )
          .join("") +
        SHINE("M76 140 C74 150 72 160 70 168", 0.5),
    ),
  }),

  // Uncommon, Fantasy. A pair of delicate fairy wings behind the back.
  "fairy-wings": (ctx) => {
    const wing =
      outlined(
        "path",
        { d: "M72 124 C50 118 30 98 28 72 C48 70 66 84 72 100 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      outlined(
        "path",
        { d: "M72 124 C58 136 44 148 34 162 C52 168 66 152 74 132 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      line("M66 116 C54 100 44 88 34 78 M60 128 C52 138 44 150 40 158", c(ctx, 1), 1.6) +
      SHINE("M40 80 C44 76 50 75 56 78", 0.6);
    return {
      back: g({}, wing) + g({ transform: "translate(200 0) scale(-1 1)" }, wing),
    };
  },
};

const HELD: Record<string, Draw> = {
  // Common, Fantasy. A little magic wand with a star on the tip.
  "magic-wand": (ctx) => ({
    front: g(
      { transform: "rotate(20)" },
      outlined("rect", { x: -2.6, y: -30, width: 5.2, height: 40, rx: 2.6, fill: c(ctx, 0) }, 2.2) +
        outlined("rect", { x: -3.5, y: 3, width: 7, height: 8, rx: 2, fill: c(ctx, 1) }, 2) +
        outlined("path", { d: star(0, -38, 9), fill: c(ctx, 1) }, 2.2),
    ),
  }),

  // Uncommon, Fantasy. Three bottles, the middle one taller.
  "potion-trio": (ctx) => ({
    front: g(
      { transform: "scale(1.15)" },
      vial(-9, -4, c(ctx, 0)) + vial(0, -12, c(ctx, 1)) + vial(9, -4, c(ctx, 0)),
    ),
  }),

  // Uncommon, Fantasy. A round shield with a boss and a cross.
  "round-shield": (ctx) => ({
    front:
      outlined("circle", { cx: 0, cy: 0, r: 15, fill: c(ctx, 0) }, 3) +
      el("circle", {
        cx: 0,
        cy: 0,
        r: 10.5,
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 2.6,
      }) +
      line("M0 -8 L0 8 M-8 0 L8 0", c(ctx, 1), 3) +
      outlined("circle", { cx: 0, cy: 0, r: 3.4, fill: c(ctx, 1) }, 1.8) +
      SHINE("M-9 -8 C-7 -11 -4 -12 -1 -12", 0.6),
  }),

  // Rare, Fantasy. A crystal ball on a stand, with a twinkle inside.
  "crystal-ball": (ctx) => ({
    front:
      el("circle", {
        cx: 0,
        cy: -14,
        r: 20,
        fill: c(ctx, 0),
        opacity: 0.3,
        style: animate("mc-pulse", 2.6),
      }) +
      outlined("path", { d: "M-9 -2 L9 -2 L12 8 L-12 8 Z", fill: c(ctx, 1) }, 2.4) +
      outlined("circle", { cx: 0, cy: -14, r: 13, fill: c(ctx, 0) }, 2.8) +
      el("path", {
        d: "M-7 -16 C-3 -22 6 -18 4 -11 C2 -6 -5 -8 -3 -13",
        fill: "none",
        stroke: "#FFFFFF",
        opacity: 0.6,
        "stroke-width": 1.6,
        "stroke-linecap": "round",
      }) +
      el("path", {
        d: sparkle(-4, -10, 2.8),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2, 0),
      }) +
      el("path", { d: sparkle(5, -20, 2.2), fill: "#FFFFFF", style: animate("mc-twinkle", 2, 1) }) +
      SHINE("M-9 -22 C-7 -25 -4 -26 -1 -26", 0.8),
  }),

  // Rare, Fantasy. A speckled egg that wobbles on the hand.
  "dragon-egg": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 8px; ${animate("mc-sway", 2.8)}` },
      outlined(
        "path",
        {
          d: "M0 -26 C-12 -26 -15 -6 -14 0 C-13 8 13 8 14 0 C15 -6 12 -26 0 -26 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
        SHINE("M-7 -16 C-6 -20 -3 -22 0 -22", 0.7) +
        outlined("circle", { cx: -6, cy: -10, r: 2.6, fill: c(ctx, 1) }, 1.6) +
        outlined("circle", { cx: 6, cy: -16, r: 2.2, fill: c(ctx, 1) }, 1.6) +
        outlined("circle", { cx: 5, cy: -2, r: 2.4, fill: c(ctx, 1) }, 1.6) +
        line("M-2 -26 L-5 -20 L1 -16 L-3 -10", OUTLINE, 1.4, { opacity: 0.5 }),
    ),
  }),

  // Rare, Fantasy. A little banner on a pole that waves in the wind.
  "quest-banner": (ctx) => ({
    front:
      outlined("rect", { x: -2, y: -52, width: 4, height: 60, rx: 2, fill: "#9AA3B5" }, 1.8) +
      outlined("circle", { cx: 0, cy: -55, r: 3.2, fill: c(ctx, 1) }, 1.8) +
      g(
        { style: `transform-origin: 2px -42px; ${animate("mc-sway", 3)}` },
        outlined(
          "path",
          {
            d: "M2 -50 C14 -54 26 -52 38 -48 L32 -40 L38 -32 C26 -28 14 -30 2 -34 Z",
            fill: c(ctx, 0),
          },
          2.6,
        ) + outlined("path", { d: star(20, -41, 5.6), fill: c(ctx, 1) }, 1.6),
      ),
  }),

  // Epic, Fantasy. A small jade dragon that flaps its wings and breathes a little flame.
  "tiny-dragon": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.6) },
      tube("M-8 -4 C-18 -2 -22 6 -14 8", c(ctx, 0), 6.4, 3.2) +
        g(
          { style: `transform-origin: -2px -12px; ${animate("mc-sway", 1.6)}` },
          outlined(
            "path",
            { d: "M-2 -12 C-12 -30 -26 -30 -26 -18 C-20 -20 -12 -16 -6 -8 Z", fill: c(ctx, 1) },
            2.2,
          ),
        ) +
        outlined("ellipse", { cx: 0, cy: -9, rx: 12, ry: 9, fill: c(ctx, 0) }, 2.8) +
        el("ellipse", { cx: 0, cy: -7, rx: 6, ry: 5.5, fill: "#F6E7D8" }) +
        outlined("circle", { cx: -5, cy: 1, r: 3, fill: c(ctx, 0) }, 2) +
        outlined("circle", { cx: 5, cy: 1, r: 3, fill: c(ctx, 0) }, 2) +
        outlined("circle", { cx: 6, cy: -22, r: 8, fill: c(ctx, 0) }, 2.6) +
        outlined("path", { d: "M1 -26 L-2 -35 L5 -29 Z", fill: c(ctx, 1) }, 1.8) +
        outlined("path", { d: "M10 -26 L13 -34 L8 -28 Z", fill: c(ctx, 1) }, 1.8) +
        outlined("ellipse", { cx: 14, cy: -19, rx: 4, ry: 3, fill: c(ctx, 0) }, 2) +
        el("circle", { cx: 9, cy: -23, r: 1.6, fill: OUTLINE }) +
        outlined(
          "path",
          {
            d: "M18 -20 C22 -26 27 -26 30 -22 C26 -21 24 -18 22 -15 Z",
            fill: c(ctx, 1),
            style: animate("mc-twinkle", 1.2),
          },
          1.6,
        ),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Fantasy. Pink and aqua sparkles drifting in the margins.
  "fairy-dust": (ctx) => {
    const sparks: [number, number, number, number][] = [
      [30, 52, 5, 0],
      [46, 98, 3.4, 0.9],
      [24, 140, 4.4, 1.6],
      [50, 174, 3, 0.4],
      [172, 58, 4.4, 1.2],
      [156, 110, 3, 1.9],
      [178, 150, 5, 0.6],
      [150, 178, 3.4, 1.4],
    ];
    return {
      front:
        sparks
          .map(([x = 0, y = 0, r = 0, delay = 0], i) =>
            outlined(
              "path",
              {
                d: sparkle(x, y, r),
                fill: i % 2 === 0 ? c(ctx, 0) : c(ctx, 1),
                style: animate("mc-twinkle", 2.4, delay),
              },
              1.2,
            ),
          )
          .join("") +
        el("circle", { cx: 40, cy: 76, r: 1.8, fill: c(ctx, 1) }) +
        el("circle", { cx: 164, cy: 92, r: 1.6, fill: c(ctx, 0) }) +
        el("circle", { cx: 60, cy: 150, r: 1.5, fill: c(ctx, 0) }),
    };
  },

  // Epic, Fantasy. A glowing ring of runes on the floor under the buddy.

  // Legendary, Fantasy. A phoenix with a flame tail, circling you in warm light.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
