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

// Pack 19, summer: hibiscus, melon, sun hats, sunscreen, shaved ice, the
// beach and one sun that circles the buddy. Every item uses only its own
// colours, besides the shared outline, white and the neutral greys.

import { animate, el, g, OUTLINE, outlined, tube } from "../svg.ts";
import { BODY, c, type Draw, eyesOf, line, type PackDrawings, SHINE, torso } from "./kit.ts";

const round = (n: number): number => Math.round(n * 100) / 100;

/** Straight spokes from radius `inner` to `outer`, `count` of them, as one path. */
function spokes(count: number, inner: number, outer: number): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const a = (i * 2 * Math.PI) / count;
    d += `M${round(inner * Math.cos(a))} ${round(inner * Math.sin(a))} L${round(outer * Math.cos(a))} ${round(outer * Math.sin(a))} `;
  }
  return d.trim();
}

/** A small diamond centred on (x, y) with half-size s. */
const diamond = (x: number, y: number, s: number): string =>
  `M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`;

const HEAD: Record<string, Draw> = {
  // Common, Summer. A hibiscus clipped above one ear, with a leaf.
  "hibiscus-clip": (ctx) => {
    const petals = [0, 1, 2, 3, 4]
      .map((i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return outlined(
          "circle",
          { cx: 30 + 6.4 * Math.cos(a), cy: 3 + 6.4 * Math.sin(a), r: 5, fill: c(ctx, 0) },
          2,
        );
      })
      .join("");
    return {
      front:
        petals +
        outlined("circle", { cx: 30, cy: 3, r: 3.6, fill: c(ctx, 1) }, 1.6) +
        outlined(
          "path",
          { d: "M24 11 C18 18 12 17 9 13 C15 9 20 9 24 11 Z", fill: c(ctx, 2) },
          1.8,
        ),
    };
  },

  // Uncommon, Summer. A slice of watermelon worn as a hat, seeds and all.
  "watermelon-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-34 6 A34 34 0 0 1 34 6 Z", fill: c(ctx, 0) }, 3) +
      el("path", { d: "M-31 6 A31 31 0 0 1 31 6 Z", fill: "#FFFFFF" }) +
      el("path", { d: "M-28 6 A28 28 0 0 1 28 6 Z", fill: c(ctx, 1) }) +
      [
        [-13, -8],
        [0, -16],
        [13, -8],
        [-6, -1],
        [7, -2],
      ]
        .map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 1.9, fill: OUTLINE }))
        .join("") +
      SHINE("M-23 -4 C-21 -15 -15 -22 -6 -26", 0.6),
  }),

  // Common, Summer. A floppy sun hat with a ribbon, for the reading terrace.
  "sun-hat": (ctx) => ({
    front:
      outlined("ellipse", { cx: 0, cy: 6, rx: 44, ry: 9, fill: c(ctx, 0) }, 3) +
      outlined(
        "path",
        { d: "M-24 4 C-24 -24 -14 -26 0 -26 C14 -26 24 -24 24 4 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined("rect", { x: -23.5, y: -9, width: 47, height: 6, fill: c(ctx, 1) }, 2) +
      SHINE("M-16 -14 C-14 -20 -8 -22 -2 -22", 0.5),
  }),

  // Rare, Summer. A pineapple hat with a leafy top. It bobs gently.
  "pineapple-hat": (ctx) => {
    const frond = (d: string) => outlined("path", { d, fill: c(ctx, 2) }, 2);
    return {
      front: g(
        { style: animate("mc-bob", 3) },
        g(
          { style: `transform-origin: 0px -26px; ${animate("mc-sway", 3)}` },
          frond("M0 -26 C-4 -36 -12 -44 -18 -42 C-12 -36 -8 -30 0 -26 Z") +
            frond("M0 -26 C4 -36 12 -44 18 -42 C12 -36 8 -30 0 -26 Z") +
            frond("M0 -26 C-3 -38 -4 -46 0 -52 C4 -46 3 -38 0 -26 Z"),
        ),
        outlined("ellipse", { cx: 0, cy: -14, rx: 15, ry: 16, fill: c(ctx, 0) }, 3) +
          [
            [-6, -22],
            [6, -22],
            [0, -12],
            [-5, -2],
            [5, -2],
          ]
            .map(([x = 0, y = 0]) => line(diamond(x, y, 3.4), c(ctx, 1), 1.6))
            .join("") +
          SHINE("M-9 -24 C-7 -28 -4 -29 -1 -29", 0.6),
      ),
    };
  },

  // Epic, Summer. A tiny palm tree on the head, its fronds swaying in the breeze.
  "palm-tree-hat": (ctx) => {
    const frond = (d: string) => outlined("path", { d, fill: c(ctx, 1) }, 2);
    return {
      front: g(
        { style: animate("mc-bob", 3.2) },
        tube("M0 4 C-3 -8 4 -18 8 -30", c(ctx, 0), 7, 4),
        g(
          { style: `transform-origin: 8px -30px; ${animate("mc-sway", 3)}` },
          frond("M8 -30 C0 -42 -14 -44 -24 -36 C-14 -38 -6 -34 8 -30 Z") +
            frond("M8 -30 C16 -42 30 -44 38 -34 C28 -38 18 -34 8 -30 Z") +
            frond("M8 -30 C4 -42 2 -50 6 -56 C10 -48 12 -40 8 -30 Z") +
            frond("M8 -30 C0 -26 -10 -22 -18 -20 C-10 -28 -2 -30 8 -30 Z") +
            frond("M8 -30 C14 -24 24 -22 30 -18 C22 -28 16 -30 8 -30 Z") +
            outlined("circle", { cx: 5, cy: -27, r: 3.4, fill: c(ctx, 2) }, 1.8) +
            outlined("circle", { cx: 11, cy: -26, r: 3.4, fill: c(ctx, 2) }, 1.8),
        ),
      ),
    };
  },
};

const FACE: Record<string, Draw> = {
  // Common, Summer. A white sunscreen stripe across the nose.
  "zinc-stripe": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    return {
      front: tube(`M${x1 + 2} ${y + 9} Q100 ${y + 13} ${x2 - 2} ${y + 9}`, c(ctx, 0), 8, 5),
    };
  },

  // Uncommon, Summer. A lemon or lime slice sticker on one cheek.
  "lemon-slice": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 2} ${ctx.geo.by - 1}) rotate(14)` },
      outlined("circle", { cx: 0, cy: 0, r: 9, fill: c(ctx, 0) }, 2.2),
      el("circle", { cx: 0, cy: 0, r: 7, fill: c(ctx, 1) }),
      line(spokes(6, 0, 6.5), OUTLINE, 1, { opacity: 0.4 }),
      outlined(
        "path",
        { d: "M5 -7 C7 -13 13 -14 15 -12 C13 -8 9 -6 5 -7 Z", fill: c(ctx, 2) },
        1.8,
      ),
      line("M-4 -4 L-2 -6", "#FFFFFF", 1.6, { opacity: 0.9 }),
    ),
  }),

  // Rare, Summer. A little sun sticker on one cheek, its rays twinkling.
  "sun-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl - 2} ${ctx.geo.by - 1})` },
      g({ style: animate("mc-twinkle", 2.2) }, line(spokes(8, 8.5, 12), c(ctx, 1), 2.4)),
      outlined("circle", { cx: 0, cy: 0, r: 6.2, fill: c(ctx, 0) }, 2),
      line("M-3 -2 L-1 -4", "#FFFFFF", 1.4, { opacity: 0.9 }),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Summer. A long-sleeved swim top with stripes across the chest.
  "rash-guard": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M70 137 L130 137 M72 151 L128 151 M80 165 L120 165", c(ctx, 1), 4) +
        line("M86 124 Q100 136 114 124", c(ctx, 1), 3.4),
    ),
  }),

  // Uncommon, Summer. A loud shirt with flowers printed all over it.
  "hawaiian-shirt": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        [
          [80, 136],
          [100, 132],
          [120, 136],
          [88, 152],
          [112, 152],
          [100, 166],
        ]
          .map(([x = 0, y = 0]) =>
            outlined("circle", { cx: x, cy: y, r: 3.6, fill: c(ctx, 1) }, 1.4),
          )
          .join("") +
        line("M86 124 L100 146 L114 124", OUTLINE, 2.2),
    ),
  }),

  // Uncommon, Summer. A red sleeveless top with a white band across the chest.
  "lifeguard-tank": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) + line("M68 142 L132 142", c(ctx, 1), 6),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Summer. A beach ball with a lens panel on the front.
  "beach-ball": (ctx) => ({
    front:
      outlined("circle", { cx: 0, cy: 0, r: 14, fill: c(ctx, 0) }, 2.4) +
      outlined("path", { d: "M0 -14 C7 -7 7 7 0 14 C-7 7 -7 -7 0 -14 Z", fill: c(ctx, 1) }, 1.8) +
      SHINE("M-8 -8 C-6 -11 -3 -12 0 -12", 0.6),
  }),

  // Common, Summer. A sand bucket with a spade sticking out of it.
  "sand-bucket": (ctx) => ({
    front:
      tube("M9 -4 L22 -26", c(ctx, 2), 4.4, 2) +
      outlined(
        "path",
        {
          d: "M19 -30 C17 -38 25 -42 28 -38 C31 -34 29 -28 25 -26 C22 -25 20 -27 19 -30 Z",
          fill: c(ctx, 2),
        },
        2,
      ) +
      tube("M-10 -4 C-10 -18 10 -18 10 -4", c(ctx, 1), 4.8, 2.4) +
      outlined("path", { d: "M-11 -4 L11 -4 L8 14 L-8 14 Z", fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: -9.5, y: 2, width: 19, height: 4, fill: c(ctx, 1) }, 1.6),
  }),

  // Uncommon, Summer. A squeezy sunscreen bottle with a cap.
  "sunscreen-bottle": (ctx) => ({
    front:
      outlined("rect", { x: -10, y: -8, width: 20, height: 28, rx: 6, fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: -5, y: -16, width: 10, height: 9, rx: 2.5, fill: c(ctx, 1) }, 2) +
      outlined("rect", { x: -8, y: 3, width: 16, height: 9, rx: 2, fill: c(ctx, 2) }, 1.6) +
      SHINE("M-5 -4 L-5 1", 0.7),
  }),

  // Uncommon, Summer. Shaved ice in a paper cup, with a syrup cap.
  "shaved-ice": (ctx) => ({
    front:
      outlined("path", { d: "M-13 0 L13 0 L9 20 L-9 20 Z", fill: c(ctx, 0) }, 2.6) +
      line("M-11 9 L11 9", "#FFFFFF", 1.8, { opacity: 0.6 }) +
      outlined(
        "path",
        { d: "M-16 2 C-17 -12 -6 -18 0 -18 C6 -18 17 -12 16 2 Z", fill: "#FFFFFF" },
        2.4,
      ) +
      outlined(
        "path",
        {
          d: "M-15 -1 C-14 -10 -6 -14 0 -14 C6 -14 14 -10 15 -1 C12 2 11 -2 9 3 C8 7 6 0 4 3 C2 7 0 0 -2 3 C-4 7 -6 0 -8 3 C-10 4 -12 -1 -15 -1 Z",
          fill: c(ctx, 1),
        },
        1.8,
      ),
  }),

  // Rare, Summer. A coconut cup with a pink straw that bobs as you sip.
  "coconut-drink": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-14 -4 C-14 12 -8 18 0 18 C8 18 14 12 14 -4 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      line("M-7 4 L-5 10 M0 6 L0 13 M7 4 L5 10", OUTLINE, 1.4, { opacity: 0.3 }) +
      g({ style: animate("mc-bob", 3) }, tube("M3 -4 C5 -16 11 -24 17 -30", c(ctx, 1), 5, 2.6)) +
      outlined("ellipse", { cx: 0, cy: -4, rx: 14, ry: 5, fill: c(ctx, 2) }, 2.4),
  }),

  // Rare, Summer. A surfboard held in the hand, bobbing as if on a wave.
  surfboard: (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined(
        "path",
        {
          d: "M0 -46 C9 -46 11 -30 11 -14 C11 2 9 14 0 16 C-9 14 -11 2 -11 -14 C-11 -30 -9 -46 0 -46 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
        line("M0 -38 L0 4", c(ctx, 1), 3.2) +
        outlined("path", { d: "M-4 12 L0 22 L4 12 Z", fill: c(ctx, 2) }, 2) +
        SHINE("M-6 -36 C-6 -40 -4 -42 -2 -43", 0.6),
    ),
  }),

  // Epic, Summer. A blue swim ring with a flamingo head that bobs along.
  "flamingo-ring": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.2) },
      el("circle", { cx: 0, cy: 6, r: 12, fill: "none", stroke: OUTLINE, "stroke-width": 15 }),
      el("circle", { cx: 0, cy: 6, r: 12, fill: "none", stroke: c(ctx, 0), "stroke-width": 9 }),
      tube("M0 -2 C-4 -12 6 -18 4 -28", c(ctx, 1), 6, 3.4),
      outlined("ellipse", { cx: 7, cy: -31, rx: 6, ry: 4.5, fill: c(ctx, 1) }, 2),
      outlined("path", { d: "M11 -32 L19 -29 L11 -27 Z", fill: c(ctx, 2) }, 1.6),
      el("circle", { cx: 8, cy: -33, r: 1.2, fill: OUTLINE }),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Summer. Two little suns in the top corners, twinkling.
  "sunny-corners": (ctx) => {
    const sun = (x: number, y: number, delay: number): string =>
      g(
        { transform: `translate(${x} ${y})` },
        g({ style: animate("mc-twinkle", 2.4, delay) }, line(spokes(8, 11, 16), c(ctx, 1), 3)),
        outlined("circle", { cx: 0, cy: 0, r: 8, fill: c(ctx, 0) }, 2.4),
      );
    return { front: sun(34, 44, 0) + sun(166, 44, 1.2) };
  },

  // Rare, Summer. Little waves at the bottom corners, with drops that jump.
  "splashing-waves": (ctx) => {
    const wave =
      outlined(
        "path",
        {
          d: "M12 200 C12 166 26 152 44 150 C36 156 34 166 40 172 C46 178 56 178 62 174 L62 200 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      line("M22 172 C26 164 32 160 40 159", "#FFFFFF", 2, { opacity: 0.9 }) +
      [
        [24, 146, 0],
        [36, 138, 0.8],
        [54, 144, 1.6],
      ]
        .map(([x = 0, y = 0, d = 0]) =>
          el("circle", {
            cx: x,
            cy: y,
            r: 2.6,
            fill: c(ctx, 1),
            style: animate("mc-bubble", 2.4, d),
          }),
        )
        .join("");
    return { front: wave + g({ transform: "translate(200 0) scale(-1 1)" }, wave) };
  },

  // Legendary, Summer. A big friendly sun that circles the buddy slowly, behind it,
  // with a warm glow, clear rays and two sparkles that travel with it.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
