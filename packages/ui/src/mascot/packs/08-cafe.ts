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

// Pack 08, the cafe: coffee cups, pastries and a table by the window. Every
// item here uses at most three colours of its own, besides the shared outline
// and white shine.

import { animate, el, g, heart, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  c,
  type Draw,
  HEADBAND,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
} from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common, Cafe. A takeaway cup worn as a hat, with a sleeve and a lid.
  "coffee-cup-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-22 -34 L-17 6 L17 6 L22 -34 Z", fill: c(ctx, 0) }, 3.2) +
      outlined("path", { d: "M-20.4 -22 L20.4 -22 L18.8 -10 L-18.8 -10 Z", fill: c(ctx, 1) }, 2.4) +
      outlined("rect", { x: -26, y: -42, width: 52, height: 9, rx: 4.5, fill: c(ctx, 1) }, 3) +
      outlined("rect", { x: -7, y: -48, width: 14, height: 7, rx: 3.5, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-14 -30 L-12 -14", 0.55),
  }),

  // Common, Cafe. A puffed-up chef's toque with a band and pleats.
  "chef-toque": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-30 2 C-40 -4 -40 -24 -26 -26 C-28 -40 -10 -44 0 -38 C10 -44 28 -40 26 -26 C40 -24 40 -4 30 2 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
      line("M-12 -30 L-14 -8 M0 -36 L0 -12 M12 -30 L14 -8", OUTLINE, 1.6, { opacity: 0.25 }) +
      outlined("rect", { x: -29, y: -3, width: 58, height: 12, rx: 4, fill: c(ctx, 1) }, 2.6) +
      SHINE("M-22 -28 C-20 -34 -14 -37 -8 -38", 0.6),
  }),

  // Uncommon, Cafe. A buttery croissant: a crescent with five segments.
  "croissant-hat": (ctx) => {
    // The crescent is the quadratic curve from (-32, 8) through (0, -38) to (32, 8).
    const point = (t: number): [number, number] => [
      -32 * (1 - t) * (1 - t) + 32 * t * t,
      8 * (1 - t) * (1 - t) - 76 * t * (1 - t) + 8 * t * t,
    ];
    const seams = [0.2, 0.4, 0.6, 0.8]
      .map((t) => {
        const [x, y] = point(t);
        const dy = 92 * (2 * t - 1);
        const length = Math.hypot(dy, 64);
        const nx = -dy / length;
        const ny = 64 / length;
        return line(
          `M${(x - nx * 10).toFixed(2)} ${(y - ny * 10).toFixed(2)} L${(x + nx * 10).toFixed(2)} ${(y + ny * 10).toFixed(2)}`,
          c(ctx, 1),
          2,
        );
      })
      .join("");
    return {
      front:
        tube("M-32 8 Q0 -40 32 8", c(ctx, 0), 27, 20) +
        seams +
        SHINE("M-14 -4 Q-10 -14 -2 -17", 0.5),
    };
  },

  // Rare, Cafe. A little chalkboard sign that swings from the band.
  "chalkboard-headband": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 1), 8.5, 5.5) +
      g(
        { style: `transform-origin: 32px 4px; ${animate("mc-sway", 3)}` },
        line("M32 4 L21 11 M32 4 L43 11", OUTLINE, 1.4) +
          outlined("rect", { x: 20, y: 11, width: 24, height: 24, rx: 3, fill: c(ctx, 1) }, 2.4) +
          el("rect", { x: 23, y: 14, width: 18, height: 18, rx: 2, fill: c(ctx, 0) }) +
          line("M27 21 L35 21 L34 27 L28 27 Z", "#FFFFFF", 1.3, { opacity: 0.85 }) +
          line("M30 18 Q29 16 30 14 M33 18 Q32 16 33 14", "#FFFFFF", 1.1, { opacity: 0.7 }),
      ),
  }),

  // Epic, Cafe. A basket of warm rolls that bobs on your head.
  "bakery-basket": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("circle", { cx: -14, cy: -12, r: 8.5, fill: c(ctx, 1) }, 2.4) +
        outlined("circle", { cx: 4, cy: -17, r: 9.5, fill: c(ctx, 1) }, 2.4) +
        outlined("circle", { cx: 19, cy: -11, r: 8, fill: c(ctx, 1) }, 2.4) +
        SHINE("M-2 -22 C0 -25 4 -26 7 -25", 0.6) +
        outlined(
          "path",
          { d: "M-30 -4 L30 -4 L25 6 Q24 8 21 8 L-21 8 Q-24 8 -25 6 Z", fill: c(ctx, 0) },
          3,
        ) +
        line("M-24 0 L24 0 M-21 4 L21 4 M-10 -4 L-10 8 M0 -4 L0 8 M10 -4 L10 8", OUTLINE, 1.4, {
          opacity: 0.3,
        }),
    ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Cafe. A round latte-art sticker with a heart of foam, on one cheek.
  "latte-art-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 2} ${ctx.geo.by - 1}) rotate(-12)` },
      outlined("circle", { cx: 0, cy: 0, r: 9, fill: c(ctx, 0) }, 2.2),
      el("path", { d: heart(0, 0.5, 4.2), fill: c(ctx, 1) }),
      line("M-4 -4 L-2 -5.5", "#FFFFFF", 1.6, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Cafe. A light dusting of cocoa powder on both cheeks.
  "cocoa-dust": (ctx) => {
    const dots: [number, number, number][] = [
      [-5, -3, 1.3],
      [-1, -6, 1],
      [3, -4, 1.2],
      [6, 0, 1],
      [-4, 3, 1.1],
      [0, 4, 1.3],
      [4, 5, 1],
      [-7, 0, 0.9],
    ];
    const cheek = (x: number, y: number, mirror: number): string =>
      dots
        .map(([dx = 0, dy = 0, r = 0], i) =>
          el("circle", {
            cx: x + dx * mirror,
            cy: y + dy,
            r: r * 2,
            fill: i % 3 === 0 ? c(ctx, 1) : c(ctx, 0),
          }),
        )
        .join("");
    return { front: cheek(ctx.geo.bl, ctx.geo.by, 1) + cheek(ctx.geo.br, ctx.geo.by, -1) };
  },

  // Rare, Cafe. Sugar crystals on the cheeks that twinkle.
  "sugar-cheeks": (ctx) => {
    const spots: [number, number, number][] = [
      [-5, -3, 0],
      [3, 2, 1.1],
      [-1, 5, 0.6],
    ];
    const cheek = (x: number, y: number, mirror: number): string =>
      spots
        .map(([dx = 0, dy = 0, delay = 0]) =>
          el("path", {
            d: sparkle(x + dx * mirror, y + dy, 5.4),
            fill: c(ctx, 0),
            stroke: OUTLINE,
            "stroke-width": 0.9,
            style: animate("mc-twinkle", 2.2, delay),
          }),
        )
        .join("");
    return { front: cheek(ctx.geo.bl, ctx.geo.by, 1) + cheek(ctx.geo.br, ctx.geo.by, -1) };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Cafe. A pinstriped vest with a V neck and buttons.
  "barista-vest": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M70 124 L92 124 L100 140 L108 124 L130 124 C133 146 135 166 134 180 L66 180 C65 166 67 146 70 124 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        line("M92 124 L100 140 L108 124", c(ctx, 1), 2.6) +
        line("M78 132 L78 178 M88 134 L88 178 M112 134 L112 178 M122 132 L122 178", OUTLINE, 1.2, {
          opacity: 0.22,
        }) +
        [
          [100, 152],
          [100, 166],
        ]
          .map(([x = 0, y = 0]) =>
            outlined("circle", { cx: x, cy: y, r: 2.4, fill: c(ctx, 1) }, 1.4),
          )
          .join(""),
    ),
  }),

  // Common, Cafe. Roasted coffee beans strung on a cord, worn at the neck.
  "bean-necklace": (ctx) => {
    const beans = [0.16, 0.34, 0.5, 0.66, 0.84]
      .map((t) => {
        const x = 60 * t - 30;
        const y = -4 + 44 * t - 44 * t * t;
        const angle = (Math.atan2(44 - 88 * t, 60) * 180) / Math.PI;
        return g(
          { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})` },
          outlined("ellipse", { cx: 0, cy: 0, rx: 5, ry: 4.2, fill: c(ctx, 0) }, 1.6) +
            line("M-4.2 0 Q0 1.8 4.2 0", OUTLINE, 1.1, { opacity: 0.55 }),
        );
      })
      .join("");
    return { front: tube("M-30 -4 Q0 18 30 -4", c(ctx, 1), 4.6, 2.4) + beans };
  },

  // Uncommon, Cafe. A double-breasted chef's jacket with lapels.
  "pastry-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.2) +
        line("M86 124 L100 152 L114 124", OUTLINE, 1.8, { opacity: 0.45 }) +
        line("M100 152 L100 180", OUTLINE, 1.6, { opacity: 0.25 }) +
        [
          [92, 150],
          [108, 150],
          [92, 166],
          [108, 166],
        ]
          .map(([x = 0, y = 0]) =>
            outlined("circle", { cx: x, cy: y, r: 2.2, fill: c(ctx, 1) }, 1.2),
          )
          .join(""),
    ),
  }),

  // Rare, Cafe. A striped tea towel on the belt that sways as you walk.
  "tea-towel-tabard": (ctx) => ({
    torso: torso(
      ctx,
      g(
        { style: `transform-origin: 120px 146px; ${animate("mc-sway", 3.2)}` },
        outlined("path", { d: "M112 150 L128 150 L127 180 L113 180 Z", fill: c(ctx, 0) }, 2.6) +
          line("M113 158 L127 158 M113 166 L127 166 M113 174 L127 174", c(ctx, 1), 2.6) +
          outlined("rect", { x: 109, y: 143, width: 22, height: 9, rx: 3, fill: c(ctx, 1) }, 2.2),
      ),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Cafe. A glazed donut with sprinkles, held up for a snack.
  donut: (ctx) => ({
    front:
      outlined("circle", { cx: 0, cy: 0, r: 15, fill: c(ctx, 1) }, 3) +
      outlined(
        "path",
        {
          d: "M-11 0 C-11 -6 -6 -8 -4 -6 C-2 -10 4 -10 6 -6 C9 -8 11 -4 11 0 C11 6 6 9 4 6 C2 9 -2 9 -4 6 C-6 9 -11 6 -11 0 Z",
          fill: c(ctx, 0),
        },
        2.2,
      ) +
      outlined("circle", { cx: 0, cy: 0, r: 4.2, fill: "#FFFFFF" }, 2) +
      line("M-8 -4 L-6 -5.5 M7 -5 L9 -3.5 M-8 5 L-6 4 M6 6 L8 4.5", "#FFFFFF", 1.8),
  }),

  // Uncommon, Cafe. Purple or mango tea with chewy pearls and a straw.
  "bubble-tea": (ctx) => ({
    front:
      tube("M3 -14 L9 -34", "#FFFFFF", 4.6, 2.2) +
      outlined(
        "path",
        { d: "M-14 -8 L14 -8 L10 22 Q9.5 26 6 26 L-6 26 Q-9.5 26 -10 22 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      [
        [-6, 17],
        [0, 19],
        [6, 17],
        [-3, 12],
        [3, 12],
      ]
        .map(([x = 0, y = 0]) => outlined("circle", { cx: x, cy: y, r: 3, fill: c(ctx, 1) }, 1.2))
        .join("") +
      outlined("path", { d: "M-17 -8 Q0 -17 17 -8 Z", fill: "#FFFFFF" }, 2.6) +
      SHINE("M-8 -2 L-7 12", 0.6),
  }),

  // Uncommon, Cafe. Three macarons stacked high.
  "macaron-tower": (ctx) => {
    const macaron = (y: number): string =>
      outlined("ellipse", { cx: 0, cy: y + 3, rx: 13, ry: 4.4, fill: c(ctx, 0) }, 2.2) +
      outlined(
        "rect",
        { x: -11.5, y: y - 2.5, width: 23, height: 5.5, rx: 2.5, fill: c(ctx, 1) },
        1.8,
      ) +
      outlined("ellipse", { cx: 0, cy: y - 3, rx: 13, ry: 4.4, fill: c(ctx, 0) }, 2.2);
    return {
      front: [16, 4, -8].map(macaron).join("") + SHINE("M-8 -14 L-3 -15", 0.6),
    };
  },

  // Uncommon, Cafe. A glass press with a plunger and a coffee in it.
  "french-press": (ctx) => ({
    front:
      outlined("rect", { x: -1.6, y: -14, width: 3.2, height: 18, rx: 1.6, fill: c(ctx, 1) }, 1.4) +
      outlined("circle", { cx: 0, cy: -17, r: 4.4, fill: c(ctx, 1) }, 2.2) +
      outlined(
        "path",
        { d: "M-12 -4 L12 -4 L12 16 Q12 22 6 22 L-6 22 Q-12 22 -12 16 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      outlined("rect", { x: -14, y: -8, width: 28, height: 6, rx: 3, fill: c(ctx, 1) }, 2.4) +
      outlined("rect", { x: -14, y: 20, width: 28, height: 4, rx: 2, fill: c(ctx, 1) }, 2) +
      SHINE("M-7 -1 L-7 14", 0.55),
  }),

  // Rare, Cafe. A latte in a glass with a rosetta, and steam that rises.
  "latte-art": (ctx) => {
    const glass = "M-13 -12 L13 -12 L10 22 Q9.5 25 6 25 L-6 25 Q-9.5 25 -10 22 Z";
    return {
      front:
        line("M-4 -18 C-7 -23 -1 -27 -4 -32 M5 -18 C2 -23 8 -27 5 -32", "#FFFFFF", 2.2, {
          opacity: 0.85,
          style: animate("mc-bubble", 2.4),
        }) +
        el("path", { d: glass, fill: "#DDEBFF" }) +
        el("path", {
          d: "M-11.2 2 L11.2 2 L10 22 Q9.5 24 6 24 L-6 24 Q-9.5 24 -10 22 Z",
          fill: c(ctx, 0),
        }) +
        el("path", { d: "M-12.2 -8 L12.2 -8 L11.2 2 L-11.2 2 Z", fill: c(ctx, 1) }) +
        el("path", { d: heart(0, -3, 3.4), fill: "#FFFFFF" }) +
        outlined("path", { d: glass, fill: "none" }, 2.6) +
        SHINE("M-8 -4 L-7 16", 0.6),
    };
  },

  // Rare, Cafe. A little jug of milk that tilts gently.
  "milk-jug": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 22px; ${animate("mc-sway", 3)}` },
      tube("M11 -2 C22 -2 22 12 11 12", c(ctx, 0), 6, 3) +
        outlined("path", { d: "M-12 -4 Q-15 18 0 21 Q15 18 12 -4 Z", fill: c(ctx, 0) }, 2.8) +
        outlined("path", { d: "M-11 -4 L-18 -10 L-13 -9 Z", fill: c(ctx, 0) }, 2.4) +
        outlined("ellipse", { cx: 0, cy: -4, rx: 12, ry: 3.4, fill: c(ctx, 1) }, 1.8) +
        line("M-10 9 Q0 12 10 9", OUTLINE, 1.2, { opacity: 0.25 }),
    ),
  }),

  // Epic, Cafe. A wooden coffee grinder with a brass wheel that spins.
  "hand-grinder": (ctx) => ({
    front:
      outlined("rect", { x: -11, y: -1, width: 22, height: 22, rx: 5, fill: c(ctx, 0) }, 2.8) +
      outlined("path", { d: "M-12 -1 L-8 -13 L8 -13 L12 -1 Z", fill: c(ctx, 1) }, 2.6) +
      line("M-6 -8 L6 -8", OUTLINE, 1.4, { opacity: 0.3 }) +
      SHINE("M-7 4 L-7 14", 0.5) +
      g(
        { transform: "translate(13 8)" },
        g(
          {
            style: `transform-box: fill-box; transform-origin: center; ${animate("mc-propeller", 0.9, 0, "linear")}`,
          },
          outlined("circle", { cx: 0, cy: 0, r: 6, fill: c(ctx, 1) }, 2.2) +
            line("M0 -5 L0 5 M-5 0 L5 0", OUTLINE, 1.4, { opacity: 0.5 }),
        ),
      ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Cafe. Coffee beans that drift around you.
  "floating-beans": (ctx) => {
    const bean = (x: number, y: number, rotate: number, delay: number): string =>
      g(
        { transform: `translate(${x} ${y}) rotate(${rotate})` },
        g(
          { style: animate("mc-bob", 3, delay) },
          outlined("ellipse", { cx: 0, cy: 0, rx: 5.4, ry: 7.6, fill: c(ctx, 0) }, 1.8) +
            line("M0 -6.4 Q2.2 0 0 6.4", OUTLINE, 1.2, { opacity: 0.55 }),
        ),
      );
    return {
      front:
        bean(38, 68, -20, 0) +
        bean(26, 120, 14, 0.9) +
        bean(44, 164, -35, 1.8) +
        bean(166, 62, 24, 0.5) +
        bean(176, 106, -12, 1.4) +
        bean(160, 158, 30, 2.2),
    };
  },

  // Epic, Cafe. Wisps of warm steam that rise around you.

  // Legendary, Cafe. Cups of espresso circle you in a glowing swirl.
};

// Set background: a window seat with a counter and a shelf of cups. Muted,
// with thin lines, nothing moves, and the middle is kept calm.

const cafe: Scene = () =>
  `<rect width="200" height="200" fill="#F4E7D7"/>
<rect x="6" y="18" width="50" height="128" rx="4" fill="#CFE3E6" stroke="#9C7456" stroke-width="2"/>
<path d="M31 18 L31 146 M6 82 L56 82" fill="none" stroke="#9C7456" stroke-width="2"/>
<path d="M12 26 L22 26 L12 42 Z" fill="#FFFFFF" opacity=".5"/>
<rect x="150" y="74" width="46" height="4" fill="#9C7456"/>
<g fill="#FFFFFF" stroke="#9C7456" stroke-width="1.4"><path d="M156 56 L168 56 L167 74 L157 74 Z"/><path d="M178 60 L188 60 L187 74 L179 74 Z"/></g>
<path d="M156 60 L152 60 M187 64 L190 64" fill="none" stroke="#9C7456" stroke-width="1.4"/>
<rect y="158" width="200" height="42" fill="#D8B696"/>
<rect y="155" width="200" height="5" fill="#B98F6B"/>
<g fill="#FFFFFF" stroke="#9C7456" stroke-width="1.4"><path d="M12 146 L26 146 L24 156 L14 156 Z"/><path d="M172 146 L186 146 L184 156 L174 156 Z"/></g>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { cafe },
};
