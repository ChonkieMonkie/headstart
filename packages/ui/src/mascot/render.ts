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

// Draws a whole mascot as the inside of a 200 × 200 SVG: body and skin,
// mood (face, pose, thought bubble) and everything it wears.

import type { MascotId, SkinAnimation, SkinArt, WearArt, WearSlot } from "@headstart/content";
import {
  GEOMETRY,
  MASCOT_NAMES,
  MASCOT_SPECIES,
  MOOD_LOOKS,
  type Mood,
  type MoodLook,
} from "./geometry.ts";
import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "./svg.ts";
import { WEAR_DRAWINGS, type WearContext, type WearParts } from "./wear.ts";

export interface MascotLook {
  species: MascotId;
  skin: SkinArt;
  wear: Partial<Record<WearSlot, WearArt>>;
}

interface SkinAnims {
  /** Body fill, shadow fill, tentacle stroke, gill fill and gill stroke. */
  f?: string;
  sh?: string;
  s?: string;
  accF?: string;
  accS?: string;
}

const SKIN_ANIMS: Record<SkinAnimation, SkinAnims> = {
  aurora: {
    f: animate("mc-aurora-f", 6),
    sh: animate("mc-aurora-sh", 6),
    s: animate("mc-aurora-s", 6),
  },
  starlight: { accF: animate("mc-star-f", 3), accS: animate("mc-star-s", 3) },
  wildfire: { f: animate("mc-wild-f", 1.6), sh: animate("mc-wild-sh", 1.6) },
};

/** Where the mascot stands. It is scaled from here so headwear fits in the box. */
const FEET_Y = 196;

/** Where pattern marks sit on each mascot's head. */
const PATTERN_SPOTS: Record<MascotId, [number, number, number][]> = {
  inky: [
    [128, 40, 4],
    [142, 62, 3.5],
    [62, 54, 4],
    [86, 32, 2.6],
    [116, 28, 2.4],
  ],
  axo: [
    [66, 62, 4],
    [136, 56, 5],
    [118, 44, 3],
    [84, 46, 3],
    [146, 80, 2.6],
  ],
  maple: [
    [70, 52, 3.2],
    [128, 46, 3.6],
    [142, 66, 2.8],
    [58, 74, 2.6],
    [100, 42, 2.4],
  ],
};

interface Skin {
  body: string;
  shade: string;
  light: string;
  cream: string;
  limb: string;
  accent: string;
  spot: string;
}

function fullSkin(art: SkinArt): Skin {
  const light = art.light ?? art.cream ?? art.body;
  return {
    body: art.body,
    shade: art.shade,
    accent: art.accent,
    light,
    cream: art.cream ?? light,
    limb: art.limb ?? art.body,
    spot: art.spot ?? "#FFFFFF",
  };
}

const TENTACLES = [
  "M80 118 C76 140 60 150 58 168 C57 178 66 182 70 174",
  "M93 120 C91 146 84 160 86 178 C87 186 97 184 97 176",
  "M107 120 C109 146 116 160 114 178 C113 186 103 184 103 176",
  "M120 118 C124 140 140 150 142 168 C143 178 134 182 130 174",
];

function lowerBody(species: MascotId, skin: Skin, anim: SkinAnims, mood: MoodLook): string {
  if (species === "inky") {
    return g(
      {},
      g(
        { fill: "none", stroke: OUTLINE, "stroke-width": 16, "stroke-linecap": "round" },
        ...TENTACLES.map((d) => el("path", { d })),
      ),
      g(
        {
          fill: "none",
          stroke: skin.body,
          "stroke-width": 10.5,
          "stroke-linecap": "round",
          style: anim.s,
        },
        ...TENTACLES.map((d) => el("path", { d })),
      ),
      g(
        { fill: skin.accent },
        ...[
          [59, 164, 2.2],
          [62, 155, 2],
          [86, 172, 2.2],
          [87, 162, 2],
          [114, 172, 2.2],
          [113, 162, 2],
          [141, 164, 2.2],
          [138, 155, 2],
        ].map(([cx, cy, r]) => el("circle", { cx, cy, r })),
      ),
      el("ellipse", { cx: 100, cy: 116, rx: 40, ry: 12, fill: skin.body, style: anim.f }),
    );
  }

  if (species === "axo") {
    const starts = [
      [52, 60],
      [46, 78],
      [52, 96],
    ] as const;
    const ends: readonly (readonly [number, number])[] = mood.droop
      ? [
          [30, 60],
          [22, 94],
          [34, 124],
        ]
      : mood.perk
        ? [
            [30, 30],
            [16, 66],
            [24, 100],
          ]
        : [
            [30, 42],
            [20, 76],
            [30, 108],
          ];
    let gills = "";
    for (const side of [-1, 1]) {
      starts.forEach(([sx0, sy], i) => {
        const [ex0, ey] = ends[i] ?? [30, 42];
        const sx = side < 0 ? sx0 : 200 - sx0;
        const ex = side < 0 ? ex0 : 200 - ex0;
        const d = `M${sx} ${sy} L${ex} ${ey}`;
        gills +=
          tube(d, skin.accent, 11, 6.5, anim.accS) +
          outlined(
            "circle",
            {
              cx: sx + (ex - sx) * 0.55,
              cy: sy + (ey - sy) * 0.55,
              r: 4.2,
              fill: skin.accent,
              style: anim.accF,
            },
            2.5,
          ) +
          outlined("circle", { cx: ex, cy: ey, r: 5.6, fill: skin.accent, style: anim.accF }, 2.5);
      });
    }
    return (
      outlined(
        "path",
        { d: "M122 158 C148 164 170 156 182 138 C180 162 160 180 124 178 Z", fill: skin.shade },
        3.5,
      ) +
      el("path", {
        d: "M132 168 C150 168 166 160 176 148",
        fill: "none",
        stroke: skin.light,
        opacity: 0.7,
        "stroke-width": 2.5,
        "stroke-linecap": "round",
      }) +
      gills +
      outlined("ellipse", { cx: 86, cy: 177, rx: 10, ry: 7, fill: skin.body }, 3.5) +
      outlined("ellipse", { cx: 114, cy: 177, rx: 10, ry: 7, fill: skin.body }, 3.5) +
      outlined(
        "path",
        { d: "M74 116 C68 144 72 170 86 176 L114 176 C128 170 132 144 126 116 Z", fill: skin.body },
        3.5,
      ) +
      el("ellipse", { cx: 100, cy: 150, rx: 16, ry: 17, fill: skin.light }) +
      el("path", {
        d: "M120 124 C126 144 124 162 114 172",
        fill: "none",
        stroke: skin.shade,
        opacity: 0.6,
        "stroke-width": 4,
        "stroke-linecap": "round",
      })
    );
  }

  const tail = (
    [
      [174, 102, 12, true],
      [172, 116, 14, false],
      [164, 130, 15, true],
      [152, 142, 15, false],
      [138, 150, 14, true],
    ] as const
  )
    .map(([cx, cy, r, main]) =>
      outlined(
        "circle",
        { cx, cy, r, fill: main ? skin.body : skin.accent, style: main ? anim.f : undefined },
        3.5,
      ),
    )
    .join("");
  return (
    tail +
    outlined("rect", { x: 80, y: 160, width: 17, height: 26, rx: 8, fill: skin.limb }, 3.5) +
    outlined("rect", { x: 103, y: 160, width: 17, height: 26, rx: 8, fill: skin.limb }, 3.5) +
    outlined(
      "path",
      {
        d: "M72 124 C66 146 70 170 84 174 L116 174 C130 170 134 146 128 124 Z",
        fill: skin.body,
        style: anim.f,
      },
      3.5,
    ) +
    el("ellipse", { cx: 100, cy: 153, rx: 16, ry: 15, fill: skin.limb })
  );
}

function mapleEars(skin: Skin, anim: SkinAnims, mood: MoodLook): string {
  const left = mood.droop ? "rotate(-30 66 52)" : undefined;
  const right = mood.droop
    ? "rotate(30 134 52)"
    : mood.bubble === "q"
      ? "rotate(16 134 52)"
      : undefined;
  return (
    g(
      { transform: left },
      outlined(
        "path",
        { d: "M50 64 C42 42 48 24 62 20 C74 24 82 36 84 46 Z", fill: skin.body, style: anim.f },
        3.5,
      ),
      el("path", { d: "M57 56 C53 42 57 32 63 29 C70 33 74 40 76 46 Z", fill: skin.cream }),
    ) +
    g(
      { transform: right },
      outlined(
        "path",
        {
          d: "M150 64 C158 42 152 24 138 20 C126 24 118 36 116 46 Z",
          fill: skin.body,
          style: anim.f,
        },
        3.5,
      ),
      el("path", { d: "M143 56 C147 42 143 32 137 29 C130 33 126 40 124 46 Z", fill: skin.cream }),
    )
  );
}

function head(species: MascotId, skin: Skin, anim: SkinAnims): string {
  if (species === "inky") {
    return (
      outlined(
        "ellipse",
        { cx: 100, cy: 72, rx: 56, ry: 50, fill: skin.body, style: anim.f },
        3.5,
      ) +
      el("path", {
        d: "M146 44 C162 70 158 100 136 116 C150 96 154 70 146 44 Z",
        fill: skin.shade,
        style: anim.sh,
      }) +
      el("ellipse", {
        cx: 76,
        cy: 42,
        rx: 13,
        ry: 7,
        fill: "#FFFFFF",
        opacity: 0.35,
        transform: "rotate(-20 76 42)",
      })
    );
  }
  if (species === "axo") {
    return (
      outlined("ellipse", { cx: 100, cy: 78, rx: 58, ry: 44, fill: skin.body }, 3.5) +
      el("path", {
        d: "M148 56 C162 78 156 104 132 118 C148 100 154 80 148 56 Z",
        fill: skin.shade,
      }) +
      el("ellipse", {
        cx: 74,
        cy: 52,
        rx: 13,
        ry: 6,
        fill: "#FFFFFF",
        opacity: 0.35,
        transform: "rotate(-14 74 52)",
      })
    );
  }
  return (
    outlined(
      "path",
      {
        d: "M100 34 C132 34 154 52 156 78 L164 94 L150 96 L152 104 C140 122 120 128 100 128 C80 128 60 122 48 104 L50 96 L36 94 L44 78 C46 52 68 34 100 34 Z",
        fill: skin.body,
        style: anim.f,
      },
      3.5,
    ) +
    el("path", {
      d: "M152 82 C150 104 134 120 112 126 C132 116 146 100 152 82 Z",
      fill: skin.shade,
      style: anim.sh,
    }) +
    el("ellipse", {
      cx: 78,
      cy: 46,
      rx: 12,
      ry: 6,
      fill: "#FFFFFF",
      opacity: 0.25,
      transform: "rotate(-18 78 46)",
    }) +
    el("ellipse", { cx: 80, cy: 65, rx: 7, ry: 4.5, fill: skin.cream }) +
    el("ellipse", { cx: 120, cy: 65, rx: 7, ry: 4.5, fill: skin.cream }) +
    el("path", { d: "M50 92 C52 80 62 76 70 82 C72 94 66 106 56 108 Z", fill: skin.cream }) +
    el("path", { d: "M150 92 C148 80 138 76 130 82 C128 94 134 106 144 108 Z", fill: skin.cream }) +
    el("ellipse", { cx: 100, cy: 101, rx: 17, ry: 12, fill: skin.cream })
  );
}

function pattern(species: MascotId, art: SkinArt, skin: Skin): string {
  const kind = art.pattern ?? "none";
  if (kind === "none") return "";
  const twinkle = art.animation !== undefined || kind === "stars";
  return PATTERN_SPOTS[species]
    .map(([x, y, r], i) => {
      const style = twinkle ? animate("mc-twinkle", 2.4, i * 0.5) : undefined;
      switch (kind) {
        case "spots":
          return el("circle", { cx: x, cy: y, r, fill: skin.spot, opacity: 0.9, style });
        case "stars":
          return el("path", { d: sparkle(x, y, r + 2), fill: skin.spot, style });
        case "petals":
          return el("ellipse", {
            cx: x,
            cy: y,
            rx: r + 1.5,
            ry: r * 0.6,
            fill: skin.spot,
            opacity: 0.95,
            transform: `rotate(${30 + i * 40} ${x} ${y})`,
          });
        case "stripes":
          return el("path", {
            d: `M${x - r} ${y - r * 1.2} Q${x + r * 0.6} ${y} ${x - r} ${y + r * 1.2}`,
            fill: "none",
            stroke: skin.spot,
            opacity: 0.85,
            "stroke-width": 2.6,
            "stroke-linecap": "round",
            transform: `rotate(${i * 25 - 40} ${x} ${y})`,
          });
        default:
          return "";
      }
    })
    .join("");
}

function face(species: MascotId, mood: MoodLook): string {
  const geo = GEOMETRY[species];
  const k = geo.es;
  const open =
    mood.eyes === "open" ||
    mood.eyes === "focus" ||
    mood.eyes === "side" ||
    mood.eyes === "sparkle";
  let out = g(
    { fill: "#F48FA8", opacity: 0.6 },
    el("ellipse", { cx: geo.bl, cy: geo.by, rx: 6.5, ry: 3.8 }),
    el("ellipse", { cx: geo.br, cy: geo.by, rx: 6.5, ry: 3.8 }),
  );

  [geo.ex1, geo.ex2].forEach((x, i) => {
    const y = geo.ey;
    if (open) {
      const big = mood.eyes === "sparkle" ? 1.15 : 1;
      const ox = x + (mood.eyes === "side" ? 3 : 0);
      const rx = 6 * k * big;
      const ry = 8 * k * big;
      out +=
        el("ellipse", { cx: ox, cy: y, rx, ry, fill: "#231A26" }) +
        el("circle", { cx: ox + rx * 0.35, cy: y - ry * 0.4, r: 2.6 * k * big, fill: "#FFFFFF" }) +
        el("circle", {
          cx: ox - rx * 0.35,
          cy: y + ry * 0.4,
          r: mood.eyes === "sparkle" ? 1.6 : 1.1,
          fill: "#FFFFFF",
          opacity: 0.85,
        });
    } else {
      const d =
        mood.eyes === "happy"
          ? `M${x - 7 * k} ${y + 3} Q${x} ${y - 8 * k} ${x + 7 * k} ${y + 3}`
          : `M${x - 7 * k} ${y} Q${x} ${y + 5 * k} ${x + 7 * k} ${y}`;
      out += el("path", {
        d,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 3.6,
        "stroke-linecap": "round",
      });
    }
    let brow = "";
    if (mood.eyes === "focus") {
      brow =
        i === 0
          ? `M${x - 8} ${y - 14} L${x + 6} ${y - 11}`
          : `M${x + 8} ${y - 14} L${x - 6} ${y - 11}`;
    } else if (mood.eyes === "side" && i === 1) {
      brow = `M${x - 6} ${y - 16} Q${x} ${y - 21} ${x + 7} ${y - 16}`;
    }
    if (brow) {
      out += el("path", {
        d: brow,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 3,
        "stroke-linecap": "round",
      });
    }
  });

  if (species === "maple") {
    out +=
      el("path", {
        d: "M100 97 L100 100",
        stroke: OUTLINE,
        "stroke-width": 2.5,
        "stroke-linecap": "round",
      }) +
      el("path", { d: "M93 91 Q100 87 107 91 Q104 98 100 98 Q96 98 93 91 Z", fill: "#2B1A17" }) +
      el("ellipse", { cx: 98, cy: 91, rx: 2.4, ry: 1.2, fill: "#FFFFFF", opacity: 0.6 });
  }

  const { mx, my } = geo;
  const mw = species === "axo" ? 12 : 8;
  if (mood.mouth === "open") {
    out +=
      outlined(
        "path",
        {
          d: `M${mx - mw - 1} ${my - 2} Q${mx} ${my + 15} ${mx + mw + 1} ${my - 2} Z`,
          fill: "#7A2E3A",
        },
        2.6,
      ) + el("ellipse", { cx: mx, cy: my + 7, rx: 4.5, ry: 2.8, fill: "#F48FA0" });
  } else if (mood.mouth === "o") {
    out += outlined("ellipse", { cx: mx, cy: my + 2, rx: 3.6, ry: 4.2, fill: "#7A2E3A" }, 2.2);
  } else {
    const d =
      mood.mouth === "flat"
        ? `M${mx - 5} ${my + 1} L${mx + 5} ${my + 1}`
        : species === "maple"
          ? `M${mx - 8} ${my - 1} Q${mx - 4} ${my + 5} ${mx} ${my - 1} Q${mx + 4} ${my + 5} ${mx + 8} ${my - 1}`
          : `M${mx - mw} ${my - 1} Q${mx} ${my + 7} ${mx + mw} ${my - 1}`;
    out += el("path", {
      d,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
  }
  return out;
}

const CONFETTI = [
  [22, 40, "#F5B82E", 20],
  [170, 52, "#E9579A", -25],
  [16, 96, "#2F9E6E", 40],
  [178, 100, "#5B8DEF", -10],
  [40, 18, "#8B5CF6", 60],
  [150, 22, "#F08A5D", 15],
] as const;

function moodExtras(mood: MoodLook): string {
  let out = "";
  if (mood.confetti) {
    for (const [x, y, fill, rot] of CONFETTI) {
      out += outlined(
        "rect",
        {
          x,
          y,
          width: 9,
          height: 4.5,
          rx: 1.5,
          fill,
          transform: `rotate(${rot} ${x + 4} ${y + 2})`,
        },
        1.2,
      );
    }
    out += outlined("path", { d: sparkle(30, 66, 6), fill: "#F5B82E" }, 1.4);
    out += outlined("path", { d: sparkle(172, 30, 7), fill: "#F5B82E" }, 1.4);
  }
  if (!mood.bubble) return out;
  let inside = "";
  switch (mood.bubble) {
    case "cup":
      inside =
        el("path", {
          d: "M19 9 Q17 6 19 3 M25 9 Q23 6 25 3",
          fill: "none",
          stroke: "#9AA3B5",
          "stroke-width": 1.6,
          "stroke-linecap": "round",
        }) +
        el("path", {
          d: "M29 14 Q34 14 34 18 Q34 22 29 22",
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 2,
        }) +
        outlined(
          "path",
          { d: "M15 12 L30 12 L29 24 Q29 26 27 26 L18 26 Q16 26 16 24 Z", fill: "#E76F51" },
          2,
        );
      break;
    case "zz":
      inside = el(
        "text",
        {
          x: 24,
          y: 25,
          fill: "#5B4BD6",
          "font-family": "Fredoka Variable, Fredoka, system-ui, sans-serif",
          "font-size": 17,
          "font-weight": 600,
          "text-anchor": "middle",
        },
        "Zz",
      );
      break;
    case "q":
      inside = el(
        "text",
        {
          x: 24,
          y: 27,
          fill: "#B7861F",
          "font-family": "Fredoka Variable, Fredoka, system-ui, sans-serif",
          "font-size": 24,
          "font-weight": 600,
          "text-anchor": "middle",
        },
        "?",
      );
      break;
    case "heart":
      inside = outlined(
        "path",
        {
          d: "M24 28 C12 20 13 8 19 8 C22 8 24 10 24 12 C24 10 26 8 29 8 C35 8 36 20 24 28 Z",
          fill: "#E9579A",
        },
        2,
      );
      break;
  }
  return (
    out +
    g(
      { transform: "translate(150 2)" },
      outlined("circle", { cx: -2, cy: 44, r: 2.6, fill: "#FFFFFF" }, 2),
      outlined("circle", { cx: 5, cy: 36, r: 4, fill: "#FFFFFF" }, 2.2),
      outlined("ellipse", { cx: 24, cy: 18, rx: 22, ry: 16, fill: "#FFFFFF" }, 2.6),
      inside,
    )
  );
}

function wearParts(look: MascotLook, slot: WearSlot, mood: MoodLook): WearParts {
  const art = look.wear[slot];
  if (!art) return {};
  const table: Record<string, (ctx: WearContext) => WearParts> = WEAR_DRAWINGS[slot];
  const draw = table[art.shape];
  if (!draw) return {};
  return draw({ species: look.species, geo: GEOMETRY[look.species], mood, colors: art.colors });
}

/** The inside of a `viewBox="0 0 200 200"` SVG. */
export function renderMascot(look: MascotLook, mood: Mood = "idle"): string {
  const { species } = look;
  const geo = GEOMETRY[species];
  const m = MOOD_LOOKS[mood];
  const skin = fullSkin(look.skin);
  const anim = look.skin.animation ? SKIN_ANIMS[look.skin.animation] : {};

  const headWear = wearParts(look, "head", m);
  const faceWear = wearParts(look, "face", m);
  const outfit = wearParts(look, "outfit", m);
  const held = wearParts(look, "held", m);
  const aura = wearParts(look, "aura", m);

  const hands = geo.hands[m.pose];
  const hoodie = look.wear.outfit?.shape === "hoodie" ? look.wear.outfit.colors[0] : undefined;
  const armColor = hoodie ?? (species === "maple" ? skin.limb : skin.body);
  const handColor = species === "maple" ? skin.limb : skin.body;
  const arms = geo.shoulders
    .map(([sx, sy], i) => {
      const [hx, hy] = hands[i] ?? [sx, sy];
      return (
        tube(
          `M${sx} ${sy} Q${hx} ${sy} ${hx} ${hy}`,
          armColor,
          geo.armOuter,
          geo.armInner,
          !hoodie && species === "inky" ? anim.s : undefined,
        ) +
        outlined(
          "circle",
          {
            cx: hx,
            cy: hy,
            r: geo.handR,
            fill: handColor,
            style: species === "inky" ? anim.f : undefined,
          },
          3,
        )
      );
    })
    .join("");

  const heldHand = hands[1];
  const embers =
    look.skin.animation === "wildfire"
      ? (
          [
            [66, 150, 3],
            [134, 140, 2.6],
            [96, 120, 2.2],
            [146, 172, 3],
            [56, 126, 2.4],
            [118, 110, 2],
          ] as const
        )
          .map(([cx, cy, r], i) =>
            el("circle", {
              cx,
              cy,
              r,
              fill: "#FFC56B",
              style: animate("mc-rise", 2.4, i * 0.4, "ease-in"),
            }),
          )
          .join("")
      : "";

  const parts = [
    aura.back,
    el("ellipse", { cx: 100, cy: 190, rx: 46, ry: 6, fill: "#1B2236", opacity: 0.13 }),
    outfit.back,
    lowerBody(species, skin, anim, m),
    outfit.torso,
    species === "maple" ? mapleEars(skin, anim, m) : "",
    arms,
    head(species, skin, anim),
    pattern(species, look.skin, skin),
    face(species, m),
    outfit.front ? g({ transform: `translate(${geo.nx} ${geo.ny})` }, outfit.front) : "",
    faceWear.front,
    headWear.front
      ? g({ transform: `translate(${geo.hx} ${geo.hy}) scale(${geo.hs})` }, headWear.front)
      : "",
    held.front && heldHand
      ? g({ transform: `translate(${heldHand[0] + 4} ${heldHand[1] - 8}) scale(1.15)` }, held.front)
      : "",
    embers,
    aura.front,
    moodExtras(m),
  ]
    .filter(Boolean)
    .join("");
  // Drawn at 90% from the feet up, so hats and thought bubbles stay inside the box.
  return g({ transform: `translate(10 ${FEET_Y * 0.1}) scale(0.9)` }, parts);
}


/** "Maple the red panda, celebrating", for screen readers. */
export function mascotLabel(species: MascotId, mood: Mood = "idle"): string {
  const moods: Record<Mood, string> = {
    idle: "waiting",
    focus: "focusing",
    break: "on a break",
    celebrate: "celebrating",
    sleepy: "sleepy",
    welcome: "waving hello",
    nudge: "giving you a nudge",
  };
  return `${MASCOT_NAMES[species]} the ${MASCOT_SPECIES[species]}, ${moods[mood]}`;
}
