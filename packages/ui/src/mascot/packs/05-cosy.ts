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

// Pack 05, the cosy set: knitwear, hot drinks and candlelight, with the
// Fireside Room background. Every item here uses at most three colours of
// its own, besides the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, tube } from "../svg.ts";
import {
  BODY,
  blob,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
} from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common, Cosy. A long knitted nightcap with a pom on the tip.
  nightcap: (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-36 6 C-34 -16 -8 -26 18 -36 C24 -22 32 -10 36 6 Z", fill: c(ctx, 0) },
        3,
      ) +
      SHINE("M-22 -4 C-20 -14 -10 -22 2 -27", 0.3) +
      outlined("rect", { x: -40, y: 0, width: 80, height: 12, rx: 6, fill: c(ctx, 1) }, 2.8) +
      outlined("circle", { cx: 18, cy: -38, r: 7, fill: c(ctx, 1) }, 2.6),
  }),

  // Common, Cosy. A chunky knitted headwrap with a knot on one side.
  "wool-headwrap": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 15, 11) +
      line(HEADBAND, c(ctx, 1), 1.6, { "stroke-dasharray": "2 3", opacity: 0.8 }) +
      SHINE("M-30 4 C-24 -2 -16 -4 -8 -4", 0.3) +
      outlined("circle", { cx: 40, cy: 12, r: 6, fill: c(ctx, 1) }, 2.4) +
      outlined("path", { d: "M42 16 L52 30 L46 32 L38 20 Z", fill: c(ctx, 0) }, 2.2),
  }),

  // Epic, Cosy. A teacup balanced on the head, steaming away.
  "teacup-hat": (ctx) => ({
    front:
      outlined("ellipse", { cx: 0, cy: 4, rx: 38, ry: 6, fill: c(ctx, 1) }, 2.8) +
      outlined(
        "path",
        {
          d: "M-18 -2 L-14 -24 C-13 -27 13 -27 14 -24 L18 -2 C18 3 -18 3 -18 -2 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      tube("M17 -16 C26 -16 26 -4 16 -4", c(ctx, 2), 5, 2.4) +
      line("M-16 -12 L16 -12", c(ctx, 2), 2.2) +
      outlined("ellipse", { cx: 0, cy: -24, rx: 14, ry: 3.6, fill: c(ctx, 2) }, 2) +
      SHINE("M-11 -18 C-9 -20 -6 -20 -4 -20", 0.5) +
      g(
        { style: animate("mc-bubble", 2.8) },
        tube("M-4 -30 C-9 -36 1 -40 -3 -46", "#DDEBFF", 4.4, 2.2),
      ),
  }),

  // Rare, Cosy. A knitted hood whose pom-pom bobs along with you.
  "bobble-hood": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-40 8 C-44 -24 -26 -34 0 -34 C26 -34 44 -24 40 8 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      line("M-20 -18 C-12 -26 12 -26 20 -18", OUTLINE, 1.6, { opacity: 0.22 }) +
      SHINE("M-26 -14 C-22 -26 -12 -30 0 -30", 0.35) +
      outlined("rect", { x: -41, y: 2, width: 82, height: 11, rx: 5.5, fill: c(ctx, 1) }, 2.8) +
      g(
        { style: animate("mc-bob", 2.8) },
        outlined("circle", { cx: 0, cy: -40, r: 8, fill: c(ctx, 1) }, 2.8) +
          SHINE("M-4 -45 C-2 -47 1 -47 3 -46", 0.6),
      ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Cosy. Round glasses fogged up after a hot drink.
  "steamed-glasses": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const mid = (x1 + x2) / 2;
    const lens = (x: number) =>
      el("circle", { cx: x, cy: y, r: 12, fill: "#DDEBFF", opacity: 0.7 }) +
      el("circle", { cx: x - 3, cy: y - 4, r: 3, fill: "#FFFFFF", opacity: 0.8 }) +
      el("circle", { cx: x + 4, cy: y + 4, r: 2, fill: "#FFFFFF", opacity: 0.8 }) +
      el("circle", { cx: x, cy: y, r: 12, fill: "none", stroke: OUTLINE, "stroke-width": 5 }) +
      el("circle", { cx: x, cy: y, r: 12, fill: "none", stroke: c(ctx, 0), "stroke-width": 2.6 });
    const bridge = `M${x1 + 12} ${y - 3} Q${mid} ${y - 7} ${x2 - 12} ${y - 3}`;
    return {
      front: line(bridge, OUTLINE, 4.6) + line(bridge, c(ctx, 0), 2.2) + lens(x1) + lens(x2),
    };
  },

  // Uncommon, Cosy. Rosy cheeks, with a little shine on each.
  "rosy-blush": (ctx) => ({
    front: [ctx.geo.bl, ctx.geo.br]
      .map(
        (x) =>
          outlined(
            "ellipse",
            { cx: x, cy: ctx.geo.by, rx: 7, ry: 4.5, fill: c(ctx, 0), opacity: 0.85 },
            1.4,
          ) + el("circle", { cx: x - 2, cy: ctx.geo.by - 1.5, r: 1.2, fill: "#FFFFFF" }),
      )
      .join(""),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Cosy. Striped pyjamas with a V-neck and buttons.
  "pyjama-top": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.2) +
        [136, 152, 168].map((y) => line(`M70 ${y} L130 ${y}`, c(ctx, 1), 3.4)).join("") +
        tube("M84 123 L100 142 L116 123", c(ctx, 1), 5.5, 2.6) +
        [150, 164]
          .map((y) => outlined("circle", { cx: 100, cy: y, r: 2.2, fill: c(ctx, 1) }, 1.6))
          .join(""),
    ),
  }),

  // Uncommon, Cosy. A chunky cable-knit jumper with a ribbed neck.
  "cable-knit-sweater": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        tube("M84 124 Q100 134 116 124", c(ctx, 1), 7, 3.6) +
        [88, 112]
          .map((x) =>
            tube(
              `M${x} 138 C${x - 5} 146 ${x + 5} 150 ${x} 158 C${x - 5} 166 ${x + 5} 170 ${x} 174`,
              c(ctx, 1),
              6,
              2.4,
            ),
          )
          .join("") +
        line("M100 140 L100 176", OUTLINE, 1.2, { opacity: 0.2, "stroke-dasharray": "2 3" }),
    ),
  }),

  // Uncommon, Cosy. A soft bathrobe with lapels and a tie belt.
  bathrobe: (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        tube("M82 122 L100 158 L118 122", c(ctx, 1), 6, 3) +
        tube("M68 152 C84 158 116 158 132 152", c(ctx, 1), 7, 3.4) +
        outlined("circle", { cx: 100, cy: 158, r: 4, fill: c(ctx, 1) }, 2),
    ),
  }),

  // Rare, Cosy. A plaid blanket over the shoulders that sways a little.
  "plaid-blanket": (ctx) => ({
    torso: torso(
      ctx,
      g(
        { style: `transform-origin: 100px 120px; ${animate("mc-sway", 4.5)}` },
        outlined(
          "path",
          {
            d: "M58 122 C60 112 78 110 100 118 C122 110 140 112 142 122 C146 150 140 176 134 186 L66 186 C60 176 54 150 58 122 Z",
            fill: c(ctx, 0),
          },
          3,
        ) +
          [74, 90, 106, 122]
            .map((x) => line(`M${x} 118 L${x} 184`, c(ctx, 1), 3, { opacity: 0.85 }))
            .join("") +
          [130, 150, 170]
            .map((y) => line(`M64 ${y} L136 ${y}`, c(ctx, 1), 3, { opacity: 0.85 }))
            .join("") +
          [70, 80, 90, 100, 110, 120, 130]
            .map((x) => line(`M${x} 186 L${x} 191`, c(ctx, 1), 2))
            .join(""),
      ),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Cosy. Two knitting needles through a ball of yarn.
  "knitting-needles": (ctx) => ({
    front:
      tube("M-2 2 L-13 -30", "#9AA3B5", 4.6, 2.2) +
      tube("M3 2 L14 -30", "#9AA3B5", 4.6, 2.2) +
      outlined("circle", { cx: 0, cy: 10, r: 9.5, fill: c(ctx, 0) }, 2.6) +
      line("M-9 12 C-3 9 4 16 9 12", c(ctx, 1), 2) +
      line("M-6 6 C-2 4 2 6 5 4 M-8 11 C-3 12 3 15 7 12", OUTLINE, 1.2, { opacity: 0.35 }) +
      SHINE("M-5 6 C-3 3 0 2 3 2", 0.5),
  }),

  // Common, Cosy. A fluffy slipper hanging from its loop.
  "fluffy-slipper": (ctx) => ({
    front:
      line("M-4 -14 Q0 -22 4 -14", OUTLINE, 1.8) +
      outlined(
        "path",
        {
          d: "M-13 -6 L11 -6 C18 -6 20 6 16 12 C14 16 9 16 5 14 L-13 14 C-16 14 -17 10 -16 4 C-15 -2 -14 -6 -13 -6 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      blob(
        [
          [-8, -6, 5],
          [0, -8, 5.5],
          [8, -6, 5],
          [13, -2, 3.5],
        ],
        c(ctx, 1),
        1.4,
      ) +
      line("M-11 8 L12 8", OUTLINE, 1.4, { opacity: 0.3 }),
  }),

  // Uncommon, Cosy. A rubber hot water bottle in a knitted cover.
  "hot-water-bottle": (ctx) => ({
    front:
      outlined("rect", { x: -4, y: -13, width: 8, height: 6, rx: 2, fill: c(ctx, 0) }, 2.2) +
      outlined(
        "path",
        {
          d: "M-6 -8 L6 -8 C12 -4 16 2 15 12 C14 20 8 23 0 23 C-8 23 -14 20 -15 12 C-16 2 -12 -4 -6 -8 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined(
        "path",
        { d: "M-16 0 C-10 4 10 4 16 0 L16 14 C10 19 -10 19 -16 14 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      line(
        "M-11 9 L-7 9 M-3 9 L1 9 M5 9 L9 9 M-7 14 L-3 14 M1 14 L5 14 M9 14 L12 14",
        OUTLINE,
        1.2,
        { opacity: 0.35 },
      ),
  }),

  // Uncommon, Cosy. A plate of cookies, held out for a study break.
  "cookie-plate": (ctx) => ({
    front:
      outlined("ellipse", { cx: 0, cy: 6, rx: 20, ry: 5.5, fill: c(ctx, 0) }, 2.6) +
      [
        [-7, 0],
        [6, -1],
        [0, -8],
      ]
        .map(
          ([x = 0, y = 0]) =>
            outlined("circle", { cx: x, cy: y, r: 6.5, fill: "#C98B5B" }, 2) +
            el("circle", { cx: x - 2, cy: y - 1, r: 1.1, fill: "#4A3426" }) +
            el("circle", { cx: x + 2, cy: y + 2, r: 1.1, fill: "#4A3426" }),
        )
        .join("") +
      SHINE("M-14 6 C-10 9 -2 10 6 9", 0.4),
  }),

  // Rare, Cosy. A cream candle with a flame that flickers.
  candle: (ctx) => ({
    front:
      outlined("rect", { x: -6, y: -4, width: 12, height: 26, rx: 2.5, fill: c(ctx, 0) }, 2.4) +
      line("M0 -4 L0 -8", OUTLINE, 1.6) +
      SHINE("M-3 2 L-3 16", 0.5) +
      g(
        { style: animate("mc-twinkle", 1.6) },
        outlined(
          "path",
          { d: "M0 -26 C7 -19 8 -12 0 -7 C-8 -12 -7 -19 0 -26 Z", fill: c(ctx, 1) },
          2,
        ) +
          el("path", {
            d: "M0 -17 C3 -13 3 -10 0 -9 C-3 -10 -3 -13 0 -17 Z",
            fill: "#FFFFFF",
            opacity: 0.85,
          }),
      ),
  }),

  // Rare, Cosy. A little kettle that puffs steam while it warms up.
  "whistling-kettle": (ctx) => ({
    front:
      tube("M12 -4 C25 -9 25 8 12 6", c(ctx, 1), 6, 2.8) +
      outlined("path", { d: "M-12 -2 L-21 -11 L-17 -14 L-9 -7 Z", fill: c(ctx, 0) }, 2.2) +
      outlined(
        "path",
        {
          d: "M-14 2 C-18 -10 -10 -16 0 -16 C10 -16 18 -10 14 2 C14 12 9 16 0 16 C-9 16 -14 12 -14 2 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined("rect", { x: -5, y: -20, width: 10, height: 5, rx: 2.5, fill: c(ctx, 1) }, 2.2) +
      SHINE("M-8 -2 C-8 -7 -5 -10 -1 -10", 0.45) +
      [
        [-19, -24, 0],
        [-13, -33, 0.9],
        [-21, -40, 1.8],
      ]
        .map(([x = 0, y = 0, d = 0]) =>
          g(
            { style: animate("mc-bubble", 2.6, d) },
            el("circle", {
              cx: x,
              cy: y,
              r: 3.2,
              fill: "#FFFFFF",
              stroke: OUTLINE,
              "stroke-width": 1.2,
            }),
          ),
        )
        .join(""),
  }),

  // Epic, Cosy. A jar of cocoa with marshmallows bobbing out of the top.
  "marshmallow-cocoa": (ctx) => ({
    front:
      g(
        { style: animate("mc-bubble", 2.8) },
        tube("M-4 -30 C-9 -36 1 -40 -3 -46", "#DDEBFF", 4.4, 2.2),
      ) +
      outlined(
        "path",
        {
          d: "M-14 -4 L14 -4 L15 22 C15 26 13 28 9 28 L-9 28 C-13 28 -15 26 -15 22 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined("rect", { x: -16, y: -9, width: 32, height: 7, rx: 3, fill: c(ctx, 1) }, 2.4) +
      outlined("rect", { x: -9, y: 6, width: 18, height: 11, rx: 2.5, fill: c(ctx, 1) }, 2) +
      SHINE("M-9 2 L-10 20", 0.35) +
      g(
        { style: animate("mc-bob", 2.6) },
        [
          [-7, -15],
          [4, -19],
          [10, -12],
        ]
          .map(([x = 0, y = 0]) => outlined("circle", { cx: x, cy: y, r: 5, fill: "#FFFFFF" }, 2))
          .join(""),
      ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Cosy. Warm steam curling up on both sides of the buddy.
  "cosy-steam": (ctx) => ({
    front: [
      { d: "M40 166 C28 146 52 130 40 110 C30 94 46 82 40 56", delay: 0 },
      { d: "M160 166 C148 146 172 130 160 110 C150 94 166 82 160 56", delay: 1.6 },
      { d: "M30 160 C22 146 36 134 28 120 C22 108 32 98 28 84", delay: 0.8 },
      { d: "M170 160 C178 146 164 134 172 120 C178 108 168 98 172 84", delay: 2.4 },
    ]
      .map(({ d, delay }) =>
        g({ style: animate("mc-bubble", 4, delay) }, tube(d, c(ctx, 0), 5.5, 2.4)),
      )
      .join(""),
  }),

  // Rare, Cosy. A string of warm fairy lights that twinkle on each side.
  "fairy-lights": (ctx) => {
    const left: [number, number][] = [
      [27, 46],
      [21, 72],
      [23, 98],
      [28, 124],
      [34, 150],
      [40, 172],
    ];
    const right: [number, number][] = [
      [173, 46],
      [179, 72],
      [177, 98],
      [172, 124],
      [166, 150],
      [160, 172],
    ];
    const bulbs = (points: [number, number][]): string =>
      points
        .map(([x = 0, y = 0], i) =>
          g(
            { style: animate("mc-twinkle", 2.4, (i * 0.4) % 2.4) },
            el("circle", { cx: x, cy: y, r: 6, fill: c(ctx, 1), opacity: 0.6 }) +
              outlined("circle", { cx: x, cy: y, r: 2.8, fill: c(ctx, 0) }, 1.4),
          ),
        )
        .join("");
    return {
      front:
        line("M30 36 C18 80 20 130 40 176", OUTLINE, 1.4, { opacity: 0.5 }) +
        line("M170 36 C182 80 180 130 160 176", OUTLINE, 1.4, { opacity: 0.5 }) +
        bulbs(left) +
        bulbs(right),
    };
  },

  // Epic, Cosy. Little embers drifting up and glowing around the buddy.

  // Legendary, Cosy. A friendly flame that keeps you company while you study.
};

// Set background: muted, about four tones, thin lines, nothing moves. The
// middle of the box stays calm; the fireplace sits on the right.

const fireside: Scene = () =>
  `<rect width="200" height="200" fill="#F6E7D8"/>
<rect y="158" width="200" height="42" fill="#DCC7A4"/>
<path d="M0 158 L200 158" stroke="#C98F7A" stroke-width="2"/>
<g stroke="#8E6136" stroke-width="1.6" fill="none"><rect x="14" y="40" width="36" height="28" rx="2" fill="#F6E7D8"/><path d="M18 64 L30 50 L38 58 L44 52 L48 64 Z" fill="#C98F7A"/></g>
<g stroke="#8E6136" stroke-width="1.6"><rect x="144" y="86" width="56" height="8" rx="2" fill="#DCC7A4"/><rect x="150" y="94" width="50" height="64" fill="#C98F7A"/><rect x="156" y="120" width="38" height="38" fill="#8E6136"/></g>
<path d="M164 158 C156 146 170 140 166 126 C178 138 182 146 178 158 Z" fill="#E9A24A"/>
<path d="M170 158 C166 150 174 146 172 138 C178 146 178 152 176 158 Z" fill="#F5C542"/>
<ellipse cx="100" cy="186" rx="60" ry="9" fill="#C98F7A" opacity=".45"/>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { fireside },
};
