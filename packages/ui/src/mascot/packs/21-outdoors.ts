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

// Pack 21, outdoors: hats, gear and a few forest friends for trail days and
// long study walks. Every item uses at most three colours of its own, besides
// the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import { BODY, c, type Draw, HEADBAND, line, type PackDrawings, SHINE, torso } from "./kit.ts";

const SPOTTED = (x: number, y: number, cap: string): string =>
  outlined(
    "path",
    {
      d: `M${x - 8} ${y} C${x - 8} ${y - 9} ${x - 4} ${y - 12} ${x} ${y - 12} C${x + 4} ${y - 12} ${x + 8} ${y - 9} ${x + 8} ${y} Z`,
      fill: cap,
    },
    2.2,
  ) +
  outlined("rect", { x: x - 3, y: y - 1, width: 6, height: 7, rx: 2.5, fill: "#FFFFFF" }, 1.6) +
  el("circle", { cx: x - 3, cy: y - 6, r: 1.5, fill: "#FFFFFF" }) +
  el("circle", { cx: x + 3, cy: y - 8.5, r: 1.2, fill: "#FFFFFF" });

const HEAD: Record<string, Draw> = {
  // Common, Garden-ish trail hat. A wide-brim ranger hat with a band.
  "ranger-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-25 6 C-25 -22 -17 -34 0 -34 C17 -34 25 -22 25 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("rect", { x: -25, y: -9, width: 50, height: 8, rx: 3, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-16 -24 C-12 -29 -6 -31 0 -31", 0.35) +
      outlined(
        "path",
        { d: "M-44 6 C-30 -1 30 -1 44 6 C34 14 -34 14 -44 6 Z", fill: c(ctx, 0) },
        3,
      ),
  }),

  // Uncommon, Deep Sea-ish. A safari hat with a net that falls around the head.
  "mosquito-net-hat": (ctx) => ({
    front:
      el("path", {
        d: "M-42 6 C-42 26 -38 32 -30 34 L30 34 C38 32 42 26 42 6 C30 14 -30 14 -42 6 Z",
        fill: c(ctx, 1),
        opacity: 0.28,
      }) +
      line(
        "M-36 14 L-28 30 M-22 14 L-18 30 M-8 14 L-6 31 M6 14 L8 31 M20 14 L20 31 M34 14 L30 30",
        c(ctx, 1),
        1.2,
        { opacity: 0.6 },
      ) +
      outlined(
        "path",
        { d: "M-24 4 C-24 -22 -16 -32 0 -32 C16 -32 24 -22 24 4 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined("rect", { x: -25, y: -6, width: 50, height: 8, rx: 3, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-14 -22 C-10 -27 -5 -29 0 -29", 0.35) +
      outlined(
        "path",
        { d: "M-46 6 C-32 -1 32 -1 46 6 C36 14 -36 14 -46 6 Z", fill: c(ctx, 0) },
        3,
      ),
  }),

  // Uncommon, Garden-ish. An acorn that is also a hat, with its cap on the head.
  "acorn-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-22 -4 C-24 -26 -14 -38 0 -38 C14 -38 24 -26 22 -4 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("circle", { cx: 0, cy: -40, r: 3.2, fill: c(ctx, 0) }, 2.2) +
      SHINE("M-14 -26 C-12 -31 -7 -34 -1 -34", 0.4) +
      outlined(
        "path",
        {
          d: "M-25 -2 C-25 -8 -17 -8 0 -8 C17 -8 25 -8 25 -2 C25 8 15 10 0 10 C-15 10 -25 8 -25 -2 Z",
          fill: c(ctx, 1),
        },
        2.8,
      ) +
      line("M-12 0 L-8 4 M-3 0 L1 4 M7 0 L11 4", OUTLINE, 1.2, { opacity: 0.4 }),
  }),

  // Rare, Camping. A headlamp on the forehead whose lens glows softly.
  "camping-headlamp": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 7, 4) +
      el("circle", { cx: 0, cy: -8, r: 15, fill: c(ctx, 1), style: animate("mc-pulse", 2.6) }) +
      outlined("circle", { cx: 0, cy: -8, r: 8, fill: c(ctx, 0) }, 2.8) +
      el("circle", { cx: 0, cy: -8, r: 4.6, fill: c(ctx, 1) }) +
      SHINE("M-5 -11 C-4 -13 -2 -14 0 -14", 0.8),
  }),

  // Epic, Garden-ish. A tiny pine tree that sits on the head and bobs.
  "tiny-pine": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.2) },
      outlined("rect", { x: -4, y: -4, width: 8, height: 12, rx: 2, fill: c(ctx, 1) }, 2.4),
      outlined("path", { d: "M-22 -4 L0 -24 L22 -4 Z", fill: c(ctx, 0) }, 2.8),
      outlined("path", { d: "M-17 -16 L0 -36 L17 -16 Z", fill: c(ctx, 0) }, 2.8),
      outlined("path", { d: "M-11 -28 L0 -46 L11 -28 Z", fill: c(ctx, 0) }, 2.8),
      SHINE("M-6 -34 C-5 -37 -3 -39 -1 -40", 0.5),
      el("path", {
        d: sparkle(22, -38, 4),
        fill: c(ctx, 2),
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2, 0.4),
      }),
    ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Garden-ish. A mud smudge on the left cheek, from the trail.
  "mud-smudge": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl} ${ctx.geo.by})` },
      outlined(
        "path",
        { d: "M-8 -2 C-6 -8 2 -8 5 -4 C9 -1 8 4 3 5 C-1 8 -7 5 -8 -2 Z", fill: c(ctx, 0) },
        1.8,
      ),
      el("circle", { cx: -3, cy: 2, r: 1.3, fill: c(ctx, 1) }),
      el("circle", { cx: 3, cy: -2, r: 1.1, fill: c(ctx, 1) }),
      el("circle", { cx: 1, cy: 3, r: 1, fill: c(ctx, 1) }),
    ),
  }),

  // Rare, Garden-ish. A fresh leaf stuck to the right cheek that bobs along.
  "leaf-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br} ${ctx.geo.by}) rotate(-20)` },
      g(
        { style: animate("mc-bob", 3) },
        outlined("path", { d: "M-6 4 C-9 -4 -2 -9 7 -8 C8 0 2 7 -6 4 Z", fill: c(ctx, 0) }, 1.8),
        line("M-5 3 L4 -6", c(ctx, 1), 1.4),
      ),
    ),
  }),

  // Epic, Deep Sea-ish. A dragonfly that landed on the cheek and whose wings flicker.
};

const OUTFIT: Record<string, Draw> = {
  // Common, Cosy-ish. A checked flannel shirt with a collar and buttons.
  "flannel-shirt": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.2) +
        line("M68 150 L132 150 M68 166 L132 166", c(ctx, 1), 4, { opacity: 0.55 }) +
        line("M82 126 L82 176 M118 126 L118 176", c(ctx, 1), 4, { opacity: 0.55 }) +
        outlined("path", { d: "M84 121 L100 142 L116 121 Z", fill: c(ctx, 1) }, 2.4) +
        line("M100 142 L100 180", OUTLINE, 1.6, { opacity: 0.3 }) +
        [158, 172]
          .map((y) =>
            el("circle", {
              cx: 100,
              cy: y,
              r: 2,
              fill: "#FFFFFF",
              stroke: OUTLINE,
              "stroke-width": 1,
            }),
          )
          .join(""),
    ),
  }),

  // Uncommon, Garden-ish. A coiled rope worn across the body like a bandolier.
  "coiled-rope": (ctx) => ({
    torso: torso(
      ctx,
      tube("M76 124 C92 144 110 160 128 178", c(ctx, 0), 11, 7) +
        [
          [88, 138],
          [101, 152],
          [114, 165],
        ]
          .map(([x = 0, y = 0]) =>
            el("circle", {
              cx: x,
              cy: y,
              r: 5.5,
              fill: "none",
              stroke: c(ctx, 1),
              "stroke-width": 2.2,
            }),
          )
          .join(""),
    ),
  }),

  // Rare, Camping. A field vest with four pockets and a badge that twinkles.
  "field-vest": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M68 124 C62 146 64 170 78 179 L122 179 C136 170 138 146 132 124 L114 124 L100 134 L86 124 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        line("M100 134 L100 179", OUTLINE, 1.6, { opacity: 0.35 }) +
        outlined("rect", { x: 80, y: 146, width: 15, height: 12, rx: 2.5, fill: c(ctx, 1) }, 2) +
        outlined("rect", { x: 105, y: 146, width: 15, height: 12, rx: 2.5, fill: c(ctx, 1) }, 2) +
        g(
          { transform: "translate(112.5 152)" },
          el("path", {
            d: star(0, 0, 4.2),
            fill: c(ctx, 2),
            stroke: OUTLINE,
            "stroke-width": 1,
            style: animate("mc-twinkle", 2.4),
          }),
        ),
    ),
  }),

  // Rare, Camping. A water canteen on a strap, hanging at the hip.
  canteen: (ctx) => ({
    torso: torso(
      ctx,
      tube("M74 124 C92 138 112 146 118 156", c(ctx, 1), 5, 2.6) +
        outlined("ellipse", { cx: 124, cy: 162, rx: 11, ry: 12, fill: c(ctx, 0) }, 2.8) +
        outlined("rect", { x: 120, y: 147, width: 8, height: 6, rx: 2, fill: c(ctx, 2) }, 2) +
        SHINE("M117 156 C117 153 118 151 120 150", 0.5) +
        el("path", {
          d: sparkle(138, 146, 3.2),
          fill: c(ctx, 2),
          style: animate("mc-twinkle", 2.2, 0.5),
        }),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Garden-ish trail. A hiking stick with a hooked top and two bands.
  "hiking-stick": (ctx) => ({
    front:
      tube("M-3 24 L6 -58", c(ctx, 0), 7, 4.2) +
      tube("M6 -58 C6 -66 -4 -68 -8 -62", c(ctx, 0), 7, 4.2) +
      line("M-5 7.6 L3 7.6", c(ctx, 1), 3.6) +
      line("M-3 -12.9 L5 -12.9", c(ctx, 1), 3.6),
  }),

  // Common, Garden-ish. A pine cone with a short stem.
  "pine-cone": (ctx) => ({
    front: g(
      { transform: "translate(0 -6)" },
      tube("M0 -20 C1 -24 3 -27 6 -30", c(ctx, 1), 5, 2.6),
      outlined(
        "path",
        {
          d: "M0 -20 C12 -18 14 -4 12 4 C10 14 4 20 0 22 C-4 20 -10 14 -12 4 C-14 -4 -12 -18 0 -20 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ),
      line("M-8 -8 L0 -2 L8 -8 M-9 3 L0 9 L9 3 M-6 13 L0 17 L6 13", OUTLINE, 1.4, {
        opacity: 0.35,
      }),
      SHINE("M-6 -10 C-6 -4 -7 0 -8 4", 0.35),
    ),
  }),

  // Common, Student-ish. A roasting stick with a marshmallow, toasted on top.
  "marshmallow-stick": (ctx) => ({
    front:
      tube("M-2 24 L10 -40", c(ctx, 0), 6, 3.2) +
      outlined(
        "ellipse",
        { cx: 13, cy: -56, rx: 10, ry: 13, fill: c(ctx, 1), transform: "rotate(18 13 -56)" },
        2.6,
      ) +
      el("ellipse", {
        cx: 11,
        cy: -62,
        rx: 6,
        ry: 3.6,
        fill: c(ctx, 2),
        transform: "rotate(18 11 -62)",
      }) +
      SHINE("M6 -62 C7 -66 10 -67 13 -67", 0.6),
  }),

  // Uncommon, Camping. Binoculars with a dangling strap.
  binoculars: (ctx) => ({
    front:
      line("M-1 4 C-6 16 -8 28 -4 40", OUTLINE, 2) +
      outlined("rect", { x: -12, y: -20, width: 10, height: 22, rx: 4, fill: c(ctx, 0) }, 2.8) +
      outlined("rect", { x: 2, y: -20, width: 10, height: 22, rx: 4, fill: c(ctx, 0) }, 2.8) +
      outlined("rect", { x: -3.5, y: -12, width: 7, height: 6, rx: 2, fill: c(ctx, 0) }, 2) +
      outlined("circle", { cx: -7, cy: 0, r: 3.6, fill: c(ctx, 1) }, 1.6) +
      outlined("circle", { cx: 7, cy: 0, r: 3.6, fill: c(ctx, 1) }, 1.6) +
      SHINE("M-10 -16 C-9 -18 -8 -19 -6 -19", 0.6),
  }),

  // Uncommon, Camping. A wicker basket full of spotted mushrooms.
  "mushroom-basket": (ctx) => ({
    front:
      SPOTTED(-10, -6, c(ctx, 1)) +
      SPOTTED(4, -4, c(ctx, 1)) +
      SPOTTED(15, -7, c(ctx, 1)) +
      outlined(
        "path",
        {
          d: "M-18 -6 L18 -6 L14 14 C14 16 12 17 10 17 L-10 17 C-12 17 -14 16 -14 14 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      line("M-16 2 L16 2 M-15 9 L15 9", OUTLINE, 1.4, { opacity: 0.35 }) +
      outlined("rect", { x: -19, y: -8, width: 38, height: 5, rx: 2.5, fill: c(ctx, 0) }, 2.4),
  }),

  // Uncommon, Camping. A folded trail map with a dashed way forward.
  "trail-map": (ctx) => ({
    front: g(
      { transform: "rotate(-8)" },
      outlined("rect", { x: -13, y: -16, width: 26, height: 30, rx: 2.5, fill: c(ctx, 0) }, 2.6),
      line("M-13 -3 L13 -3 M-13 6 L13 6", OUTLINE, 1.2, { opacity: 0.25 }),
      line("M-8 10 C-4 4 0 3 2 -2 C4 -7 6 -6 8 -9", c(ctx, 1), 2, { "stroke-dasharray": "3 2.5" }),
      el("circle", { cx: 8, cy: -9, r: 2.6, fill: c(ctx, 1) }),
    ),
  }),

  // Rare, Camping. A tiny tent on a keyring that bobs on the hand.
  "tent-keyring": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      el("circle", { cx: 0, cy: -8, r: 4, fill: "none", stroke: "#9AA3B5", "stroke-width": 2.2 }),
      outlined("path", { d: "M-12 18 L0 -3 L12 18 Z", fill: c(ctx, 0) }, 2.8),
      outlined("path", { d: "M-4 18 L0 8 L4 18 Z", fill: c(ctx, 1) }, 1.6),
      line("M-8 12 L8 12", c(ctx, 2), 2.2, { opacity: 0.9 }),
    ),
  }),
};

const NEEDLES: [number, number, number][] = [
  [30, 40, 0],
  [46, 64, 1.1],
  [24, 96, 2.2],
  [52, 118, 0.6],
  [34, 150, 1.7],
  [48, 172, 2.8],
  [166, 36, 1.4],
  [150, 66, 0.3],
  [178, 98, 2],
  [156, 128, 1],
  [172, 158, 2.5],
  [146, 182, 0.8],
];

const AURA: Record<string, Draw> = {
  // Rare, Camping. Pine needles drifting down around the buddy.
  "falling-pine-needles": (ctx) => ({
    front: NEEDLES.map(([x = 0, y = 0, d = 0]) =>
      g(
        { style: animate("mc-fall", 3.6, d) },
        line(`M${x} ${y} L${x + 5} ${y + 10}`, c(ctx, 0), 2.2),
        el("circle", { cx: x + 5, cy: y + 10, r: 1.4, fill: c(ctx, 1) }),
      ),
    ).join(""),
  }),

  // Epic, Camping. Two peaks with soft mist drifting around their feet.

  // Legendary, Camping. A small forest spirit deer with a glowing trail.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
