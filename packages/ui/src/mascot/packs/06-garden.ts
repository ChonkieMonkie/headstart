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

// Pack 06, the garden: leafy hats, sticker flowers, a trowel and a bloom ring,
// with a greenhouse for the set background. Every item here uses at most three
// colours of its own, besides the shared outline and white shine.

import { animate, el, flower, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
  type WearContext,
} from "./kit.ts";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Three-leaf clover centred on (x, y). */
function clover(x: number, y: number, leaf: string, heart: string): string {
  return (
    outlined("circle", { cx: x - 5, cy: y - 2.5, r: 5.4, fill: leaf }, 1.6) +
    outlined("circle", { cx: x + 5, cy: y - 2.5, r: 5.4, fill: leaf }, 1.6) +
    outlined("circle", { cx: x, cy: y + 3.5, r: 5.4, fill: leaf }, 1.6) +
    el("circle", { cx: x, cy: y, r: 2.6, fill: heart })
  );
}

/** A small ladybug centred on (x, y), for a sticker. */
function ladybug(x: number, y: number, shell: string, spots: string): string {
  return (
    outlined("ellipse", { cx: x, cy: y, rx: 6.5, ry: 5.5, fill: shell }, 1.8) +
    line(`M${x} ${y - 5.5} L${x} ${y + 5.5}`, OUTLINE, 1.4) +
    el("circle", { cx: x - 3, cy: y - 1.5, r: 1.4, fill: spots }) +
    el("circle", { cx: x + 3, cy: y + 1.5, r: 1.4, fill: spots }) +
    el("circle", { cx: x, cy: y - 6, r: 2.4, fill: OUTLINE })
  );
}

/** A denim bib with straps, for the dungarees. */
function dungarees(ctx: WearContext): string {
  return torso(
    ctx,
    outlined("path", { d: BODY, fill: c(ctx, 0) }, 2.8) +
      tube("M84 134 L80 118", c(ctx, 0), 9, 5.5) +
      tube("M116 134 L120 118", c(ctx, 0), 9, 5.5) +
      outlined("path", { d: "M82 132 L118 132 L118 156 L82 156 Z", fill: c(ctx, 0) }, 2.2) +
      outlined("rect", { x: 92, y: 138, width: 16, height: 11, rx: 2, fill: "none" }, 1.4) +
      outlined("circle", { cx: 88, cy: 136, r: 2.4, fill: c(ctx, 1) }, 1.4) +
      outlined("circle", { cx: 112, cy: 136, r: 2.4, fill: c(ctx, 1) }, 1.4) +
      SHINE("M71 150 C69 160 71 170 77 176", 0.35),
  );
}

/** One seed pouch on the belt, hanging from its top edge. */
function pouch(ctx: WearContext, x: number, delay: number): string {
  return g(
    {
      style: `transform-box: fill-box; transform-origin: 50% 0%; ${animate("mc-sway", 3.4, delay)}`,
    },
    outlined(
      "path",
      {
        d: `M${x} 156 L${x + 12} 156 L${x + 11} 170 Q${x + 6} 173 ${x + 1} 170 Z`,
        fill: c(ctx, 1),
      },
      1.8,
    ) + line(`M${x + 1} 160 L${x + 11} 160`, OUTLINE, 1.2),
  );
}

/** A bee with stripes and one wing, centred on (x, y). */
function bee(x: number, y: number, body: string, wing: string, delay: number): string {
  return g(
    { style: animate("mc-bob", 2.6, delay) },
    outlined("ellipse", { cx: x - 4, cy: y - 6, rx: 4.2, ry: 3, fill: wing }, 1.4) +
      outlined("ellipse", { cx: x, cy: y, rx: 6.5, ry: 5, fill: body }, 1.8) +
      line(
        `M${x - 2.5} ${y - 4.5} L${x - 2.5} ${y + 4.5} M${x + 2} ${y - 4.5} L${x + 2} ${y + 4.5}`,
        OUTLINE,
        1.6,
      ),
  );
}

/** A butterfly centred on (x, y), fluttering up and down. */
function butterfly(ctx: WearContext, x: number, y: number, delay: number): string {
  return g(
    { style: animate("mc-bob", 3, delay) },
    outlined(
      "ellipse",
      {
        cx: x - 6,
        cy: y - 3,
        rx: 6,
        ry: 5.5,
        fill: c(ctx, 0),
        transform: `rotate(-25 ${x - 6} ${y - 3})`,
      },
      1.8,
    ) +
      outlined(
        "ellipse",
        {
          cx: x + 6,
          cy: y - 3,
          rx: 6,
          ry: 5.5,
          fill: c(ctx, 0),
          transform: `rotate(25 ${x + 6} ${y - 3})`,
        },
        1.8,
      ) +
      outlined("ellipse", { cx: x - 4, cy: y + 4, rx: 3.5, ry: 3.5, fill: c(ctx, 1) }, 1.6) +
      outlined("ellipse", { cx: x + 4, cy: y + 4, rx: 3.5, ry: 3.5, fill: c(ctx, 1) }, 1.6) +
      line(`M${x} ${y - 7} L${x} ${y + 7}`, OUTLINE, 2.4),
  );
}

// ─── Head ──────────────────────────────────────────────────────────────────

const LEAVES: readonly (readonly [number, number, number])[] = [
  [-34, 2, -55],
  [-25, -9, -35],
  [-12, -16, -15],
  [0, -19, 0],
  [12, -16, 15],
  [25, -9, 35],
  [34, 2, 55],
];

const HEAD: Record<string, Draw> = {
  // Common, Garden. A straw sun hat with a ribbon.
  "straw-sun-hat": (ctx: WearContext) => ({
    front:
      outlined("ellipse", { cx: 0, cy: -2, rx: 44, ry: 9, fill: c(ctx, 0) }, 2.6) +
      outlined("path", { d: "M-24 -4 C-24 -32 24 -32 24 -4 Z", fill: c(ctx, 0) }, 2.6) +
      line("M-23.5 -10 Q0 -5 23.5 -10", c(ctx, 1), 5.5) +
      SHINE("M-15 -20 C-15 -26 -8 -28 -4 -28", 0.4),
  }),

  // Uncommon, Garden. A crown of leaves with two berries.
  "leaf-crown": (ctx: WearContext) => ({
    front:
      LEAVES.map(([x = 0, y = 0, a = 0]) =>
        outlined(
          "ellipse",
          { cx: x, cy: y, rx: 8, ry: 4.4, fill: c(ctx, 0), transform: `rotate(${a} ${x} ${y})` },
          2,
        ),
      ).join("") +
      outlined("circle", { cx: -18, cy: -2, r: 3.2, fill: c(ctx, 1) }, 1.6) +
      outlined("circle", { cx: 18, cy: -2, r: 3.2, fill: c(ctx, 1) }, 1.6),
  }),

  // Uncommon, Garden. A tulip on a green band.
  "tulip-hat": (ctx: WearContext) => ({
    front:
      line(HEADBAND, c(ctx, 1), 6) +
      outlined(
        "ellipse",
        { cx: -12, cy: 0, rx: 7, ry: 3.4, fill: c(ctx, 1), transform: "rotate(-35 -12 0)" },
        2,
      ) +
      outlined(
        "ellipse",
        { cx: 12, cy: 0, rx: 7, ry: 3.4, fill: c(ctx, 1), transform: "rotate(35 12 0)" },
        2,
      ) +
      outlined(
        "path",
        {
          d: "M-13 0 C-16 -14 -10 -28 0 -30 C10 -28 16 -14 13 0 C8 -4 -8 -4 -13 0 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      line("M0 -25 L0 -6", OUTLINE, 1.6) +
      SHINE("M-8 -20 C-9 -16 -9 -12 -8 -8", 0.4),
  }),

  // Rare, Garden. A ladybug shell cap with antennae that bob.
  "ladybug-cap": (ctx: WearContext) => ({
    front:
      outlined("path", { d: "M-30 2 C-30 -28 30 -28 30 2 Z", fill: c(ctx, 0) }, 2.8) +
      line("M0 -19 L0 2", OUTLINE, 2) +
      el("circle", { cx: -15, cy: -6, r: 4, fill: c(ctx, 1) }) +
      el("circle", { cx: 14, cy: -8, r: 4, fill: c(ctx, 1) }) +
      el("circle", { cx: -5, cy: -13, r: 3, fill: c(ctx, 1) }) +
      g(
        { style: animate("mc-bob", 2.4) },
        [-10, 10]
          .map(
            (x) =>
              line(`M${x} -17 Q${x * 1.6} -28 ${x * 1.6} -36`, OUTLINE, 2) +
              outlined("circle", { cx: x * 1.6, cy: -38, r: 4.5, fill: c(ctx, 1) }, 1.8),
          )
          .join(""),
      ),
  }),

  // Epic, Garden. A big sunflower worn like a hat: its petals sway gently and the whole flower bobs.
  "sunflower-hat": (ctx: WearContext) => {
    const CY = -18;
    const PETALS = 14;
    let petals = "";
    for (let i = 0; i < PETALS; i++) {
      const a = (i * Math.PI * 2) / PETALS;
      const x = 22 * Math.cos(a);
      const y = CY + 22 * Math.sin(a);
      petals += outlined(
        "ellipse",
        {
          cx: x,
          cy: y,
          rx: 10,
          ry: 6.5,
          fill: c(ctx, 0),
          transform: `rotate(${(a * 180) / Math.PI} ${x} ${y})`,
        },
        1.8,
      );
    }
    const seeds = [
      [-5, CY - 4],
      [4, CY - 5],
      [0, CY + 3],
      [-6, CY + 4],
      [6, CY + 3],
    ]
      .map(([x, y]) => el("circle", { cx: x, cy: y, r: 1.6, fill: OUTLINE }))
      .join("");
    return {
      front: g(
        { style: animate("mc-bob", 2.8) },
        g(
          {
            style: `transform-box: fill-box; transform-origin: 50% 50%; ${animate("mc-sway", 3.6)}`,
          },
          petals +
            outlined("circle", { cx: 0, cy: CY, r: 13, fill: c(ctx, 1) }, 2) +
            seeds +
            SHINE("M-7 -26 C-5 -30 0 -31 4 -29", 0.4),
        ),
      ),
    };
  },
};

// ─── Face ──────────────────────────────────────────────────────────────────

const FACE: Record<string, Draw> = {
  // Common, Garden. A lucky clover on one cheek.
  "clover-sticker": (ctx: WearContext) => ({
    front: clover(ctx.geo.bl + 2, ctx.geo.by, c(ctx, 0), c(ctx, 1)),
  }),

  // Uncommon, Garden. A ladybug walking across one cheek.
  "ladybug-sticker": (ctx: WearContext) => ({
    front: ladybug(ctx.geo.br - 2, ctx.geo.by, c(ctx, 0), c(ctx, 1)),
  }),

  // Rare, Garden. Daisy frames around both eyes, with a twinkle.
  "daisy-glasses": (ctx: WearContext) => {
    const [left, right] = eyesOf(ctx);
    const ring = ([x, y]: [number, number]): string => {
      let out = "";
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        out += outlined(
          "circle",
          { cx: x + 9.5 * Math.cos(a), cy: y + 9.5 * Math.sin(a), r: 4.2, fill: c(ctx, 0) },
          1.4,
        );
      }
      return out;
    };
    return {
      front:
        line(`M${left[0] + 9.5} ${left[1]} L${right[0] - 9.5} ${right[1]}`, OUTLINE, 2) +
        ring(left) +
        ring(right) +
        el("path", {
          d: sparkle(left[0] - 13, left[1] - 12, 2.8),
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 2.2),
        }),
    };
  },
};

// ─── Outfit ────────────────────────────────────────────────────────────────

const OUTFIT: Record<string, Draw> = {
  // Common, Garden. Denim dungarees, with a bib and buttons.
  "garden-dungarees": (ctx: WearContext) => ({ torso: dungarees(ctx) }),

  // Uncommon, Garden. A green vine wrapped round the neck.
  "vine-wrap": (ctx: WearContext) => ({
    front:
      tube("M-30 -3 Q0 9 30 -3", c(ctx, 0), 13, 8) +
      outlined(
        "ellipse",
        { cx: -28, cy: 3, rx: 6, ry: 3.2, fill: c(ctx, 1), transform: "rotate(-25 -28 3)" },
        1.6,
      ) +
      outlined(
        "ellipse",
        { cx: 28, cy: 3, rx: 6, ry: 3.2, fill: c(ctx, 1), transform: "rotate(25 28 3)" },
        1.6,
      ) +
      outlined(
        "ellipse",
        { cx: 6, cy: 7, rx: 5, ry: 2.8, fill: c(ctx, 1), transform: "rotate(15 6 7)" },
        1.6,
      ),
  }),

  // Uncommon, Garden. A flower corsage pinned to the chest.
  "flower-corsage": (ctx: WearContext) => ({
    torso: torso(
      ctx,
      outlined(
        "ellipse",
        { cx: 106, cy: 143, rx: 7.5, ry: 4, fill: c(ctx, 1), transform: "rotate(-35 106 143)" },
        1.6,
      ) +
        outlined(
          "ellipse",
          { cx: 122, cy: 143, rx: 7.5, ry: 4, fill: c(ctx, 1), transform: "rotate(35 122 143)" },
          1.6,
        ) +
        flower(114, 137, 9.5, c(ctx, 0)),
    ),
  }),

  // Rare, Garden. A tool belt with seed pouches that sway.
  "seed-belt": (ctx: WearContext) => ({
    torso: torso(
      ctx,
      outlined("path", { d: "M66 146 L134 146 L133 157 L67 157 Z", fill: c(ctx, 0) }, 2.4) +
        outlined("rect", { x: 96, y: 147, width: 8, height: 8, rx: 2, fill: "#FFFFFF" }, 1.5) +
        pouch(ctx, 80, 0) +
        pouch(ctx, 110, 1.2),
    ),
  }),
};

// ─── Held ──────────────────────────────────────────────────────────────────

const HELD: Record<string, Draw> = {
  // Common, Garden. A trowel with a wooden or painted handle.
  "garden-trowel": (ctx: WearContext) => ({
    front:
      tube("M0 -18 L0 -1", c(ctx, 0), 8.5, 5.2) +
      outlined(
        "path",
        { d: "M-7.5 0 C-8.5 10 -5 18 0 25 C5 18 8.5 10 7.5 0 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      SHINE("M-3.5 6 C-4.2 11 -2.8 15 -1 18", 0.5),
  }),

  // Common, Garden. A carrot with its green top.
  carrot: (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        { d: "M-7.5 -1 L7.5 -1 C6.5 12 3.5 24 0 31 C-3.5 24 -6.5 12 -7.5 -1 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      line("M-3 8 L-1.5 11 M3.5 13 L2 16 M-2.5 19 L-1 21", OUTLINE, 1.6) +
      outlined(
        "ellipse",
        { cx: -5, cy: -8, rx: 4.5, ry: 8, fill: c(ctx, 1), transform: "rotate(-25 -5 -8)" },
        2,
      ) +
      outlined(
        "ellipse",
        { cx: 5, cy: -8, rx: 4.5, ry: 8, fill: c(ctx, 1), transform: "rotate(25 5 -8)" },
        2,
      ) +
      outlined("ellipse", { cx: 0, cy: -11, rx: 3.6, ry: 7, fill: c(ctx, 1) }, 2),
  }),

  // Common, Garden. A paper seed packet with a flower on the front.
  "seed-packet": (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        { d: "M-9 -1 L-6 -3 L-3 -1 L0 -3 L3 -1 L6 -3 L9 -1 L9 20 L-9 20 Z", fill: c(ctx, 0) },
        2.4,
      ) + flower(0, 9, 4.2, c(ctx, 1)),
  }),

  // Uncommon, Garden. A tulip standing in a little pot.
  "tulip-pot": (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        { d: "M-7 -6 C-9 -16 -5 -24 0 -25 C5 -24 9 -16 7 -6 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      outlined("path", { d: "M-10 -3 L10 -3 L8 15 Q0 18 -8 15 Z", fill: c(ctx, 0) }, 2.4) +
      outlined("rect", { x: -11, y: -6, width: 22, height: 5, rx: 2, fill: c(ctx, 0) }, 2.2),
  }),

  // Epic, Garden. A honey jar with a bee that bobs above the lid.
  "honey-jar": (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        {
          d: "M-10 -1 L10 -1 C12 4 13 18 10 23 C6 26 -6 26 -10 23 C-13 18 -12 4 -10 -1 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      outlined("rect", { x: -7, y: -7, width: 14, height: 6, rx: 2, fill: c(ctx, 1) }, 2.2) +
      outlined("rect", { x: -7.5, y: 8, width: 15, height: 9, rx: 2, fill: "#FFFFFF" }, 1.6) +
      SHINE("M-6 3 C-7 8 -7 14 -5 18", 0.5) +
      g({ style: animate("mc-bob", 2.4) }, bee(12, -15, c(ctx, 0), "#FFFFFF", 0)),
  }),

  // Rare, Garden. A small bouquet that sways.
  bouquet: (ctx: WearContext) => ({
    front: g(
      { style: `transform-box: fill-box; transform-origin: 50% 100%; ${animate("mc-sway", 3.6)}` },
      line("M0 0 L-9 -17 M0 0 L1 -23 M0 0 L10 -16", OUTLINE, 1.8) +
        flower(-9, -17, 6, c(ctx, 0)) +
        flower(1, -23, 6.5, c(ctx, 1)) +
        flower(10, -16, 5.5, c(ctx, 0)) +
        outlined("path", { d: "M-5 1 L5 1 L3 6 L-3 6 Z", fill: c(ctx, 1) }, 1.8),
    ),
  }),

  // Rare, Garden. A tiny gnome in a red hat that bobs.
  "garden-gnome": (ctx: WearContext) => ({
    front: g(
      { style: `transform-box: fill-box; transform-origin: 50% 100%; ${animate("mc-bob", 2.8)}` },
      outlined("circle", { cx: 0, cy: 12, r: 10, fill: c(ctx, 1) }, 2.4) +
        outlined("path", { d: "M-9 -2 Q-3 -12 1 -26 Q6 -12 9 -2 Z", fill: c(ctx, 0) }, 2.4) +
        outlined("ellipse", { cx: 0, cy: -1.5, rx: 10, ry: 3.2, fill: c(ctx, 0) }, 2) +
        outlined("path", { d: "M-7 6 Q0 19 7 6 Z", fill: "#FFFFFF" }, 1.8) +
        el("circle", { cx: -3.5, cy: 2, r: 1.3, fill: OUTLINE }) +
        el("circle", { cx: 3.5, cy: 2, r: 1.3, fill: OUTLINE }),
    ),
  }),
};

// ─── Aura ──────────────────────────────────────────────────────────────────

const AURA: Record<string, Draw> = {
  // Rare, Garden. Three butterflies that flutter at the sides.
  butterflies: (ctx: WearContext) => ({
    front: butterfly(ctx, 34, 74, 0) + butterfly(ctx, 168, 104, 1.2) + butterfly(ctx, 40, 150, 0.6),
  }),

  // Epic, Garden. Three bees on a faint orbit round the buddy.

  // Legendary, Garden. A warm glow, with flowers that bloom up the sides.
};

// ─── Scene ─────────────────────────────────────────────────────────────────

/** A greenhouse: pale glass, a few hanging plants and shelves at the sides. */
const greenhouse: Scene = () =>
  `<rect width="200" height="200" fill="#EEF6EA"/>
<path d="M0 18 L18 0 M0 44 L44 0 M18 60 L60 18 M200 18 L182 0 M200 44 L156 0 M182 60 L140 18" fill="none" stroke="#B5D3AE" stroke-width="1.4"/>
<rect width="6" height="200" fill="#C5DDBE"/><rect x="194" width="6" height="200" fill="#C5DDBE"/>
<rect y="176" width="200" height="24" fill="#D5E6CC"/><path d="M0 176 L200 176" stroke="#B5D3AE" stroke-width="1.4"/>
<path d="M24 14 L24 38 M176 14 L176 38" stroke="#8FB98A" stroke-width="1.4"/>
<ellipse cx="24" cy="46" rx="7" ry="9" fill="#B6D9AD"/><ellipse cx="176" cy="46" rx="7" ry="9" fill="#B6D9AD"/>
<rect x="6" y="118" width="40" height="5" fill="#D9C6A5" stroke="#B8A07A" stroke-width="1"/>
<rect x="154" y="118" width="40" height="5" fill="#D9C6A5" stroke="#B8A07A" stroke-width="1"/>
<path d="M12 104 L22 104 L21 118 L13 118 Z M30 104 L40 104 L39 118 L31 118 Z M160 104 L170 104 L169 118 L161 118 Z M178 104 L188 104 L187 118 L179 118 Z" fill="#E2B08C"/>
<ellipse cx="17" cy="98" rx="9" ry="7" fill="#BFDDB6"/><ellipse cx="35" cy="96" rx="8" ry="6" fill="#CFE6C6"/>
<ellipse cx="165" cy="98" rx="9" ry="7" fill="#BFDDB6"/><ellipse cx="183" cy="96" rx="8" ry="6" fill="#CFE6C6"/>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { greenhouse },
};
