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

/** Rarities from most to least common. The order matters: it is used for ranking. */
export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
/** A rarity that crates can drop. */
export type Rarity = (typeof RARITIES)[number];

/**
 * Every rarity an item can have: the crate rarities and, above Legendary,
 * Exotic. Exotic items are never rolled: they are only granted one by one.
 */
export const ITEM_RARITIES = [...RARITIES, "exotic"] as const;
export type ItemRarity = (typeof ITEM_RARITIES)[number];

export const SLOTS = ["skin", "head", "face", "outfit", "held", "aura"] as const;
export type Slot = (typeof SLOTS)[number];

export const MASCOTS = ["inky", "axo", "maple"] as const;
export type MascotId = (typeof MASCOTS)[number];

export const CRATE_TYPES = ["study", "weekly", "streak", "milestone", "exam"] as const;
export type CrateType = (typeof CRATE_TYPES)[number];

/** Slots that hold something the mascot wears or holds, as opposed to its skin. */
export type WearSlot = Exclude<Slot, "skin">;

/**
 * Every shape the mascot renderer can draw, by slot, with the number of
 * colours it takes. Commons are palette swaps of simple shapes; rarer items
 * get their own shapes, so rarity follows design complexity.
 */
export const WEAR_SHAPES = {
  head: {
    beanie: 2,
    "beanie-striped": 2,
    cap: 2,
    "bucket-hat": 2,
    beret: 2,
    headband: 2,
    bow: 2,
    "flower-crown": 3,
    "party-hat": 3,
    "grad-cap": 3,
    headphones: 3,
    sprout: 2,
    "propeller-cap": 3,
    "bright-idea": 2,
    wizard: 3,
    crown: 3,
    halo: 2,
  },
  face: {
    "round-glasses": 1,
    "square-glasses": 1,
    "reading-glasses": 1,
    freckles: 1,
    shades: 2,
    "heart-shades": 1,
    "star-shades": 1,
    monocle: 1,
    goggles: 2,
    visor: 2,
    "prism-glasses": 1,
  },
  outfit: {
    scarf: 2,
    "plaid-scarf": 3,
    "bow-tie": 2,
    necktie: 2,
    medal: 4,
    bandana: 2,
    lanyard: 2,
    lei: 3,
    hoodie: 3,
    "root-hoodie": 3,
    backpack: 3,
    cape: 3,
    "starlit-cape": 2,
  },
  held: {
    pencil: 2,
    book: 2,
    mug: 2,
    highlighter: 2,
    flashcards: 2,
    calculator: 2,
    globe: 2,
    "tea-cup": 2,
    magnifier: 2,
    quill: 2,
    telescope: 2,
    flask: 2,
    lantern: 2,
    "golden-quill": 2,
  },
  aura: {
    glow: 1,
    leaves: 2,
    sparkles: 2,
    bubbles: 1,
    notes: 1,
    snow: 1,
    orbit: 2,
    "stardust-storm": 2,
    "code-orbit": 2,
  },
} as const satisfies Record<WearSlot, Record<string, number>>;

export type WearShape<S extends WearSlot = WearSlot> = keyof (typeof WEAR_SHAPES)[S] & string;

/** How a wearable item is drawn: one of the renderer's shapes in its own colours. */
export interface WearArt {
  shape: string;
  /** "#RRGGBB" colours, as many as the shape takes. */
  colors: string[];
}

export const SKIN_PATTERNS = ["none", "spots", "stars", "petals", "stripes"] as const;
export type SkinPattern = (typeof SKIN_PATTERNS)[number];

/** Colour animations for legendary skins. The keyframes live with the renderer. */
export const SKIN_ANIMATIONS = ["aurora", "starlight", "wildfire"] as const;
export type SkinAnimation = (typeof SKIN_ANIMATIONS)[number];

/** How a skin is drawn. All colours are "#RRGGBB". */
export interface SkinArt {
  body: string;
  shade: string;
  accent: string;
  /** Belly and highlights. Falls back to `cream`. */
  light?: string;
  /** Face markings (Maple). Falls back to `light`. */
  cream?: string;
  /** Legs and arms (Maple). Falls back to `body`. */
  limb?: string;
  pattern?: SkinPattern;
  /** Pattern colour. */
  spot?: string;
  animation?: SkinAnimation;
}

/** A themed group of items. Finishing one is a goal of its own. */
export interface ItemSet {
  id: string;
  name: string;
  description: string;
  /** "#RRGGBB" tint used behind the set's card. */
  tint: string;
  /** "#RRGGBB" colour of the set's progress bar. */
  color: string;
}

export interface Item {
  /** Permanent id. Never rename or reuse one: inventories refer to it forever. */
  id: string;
  name: string;
  slot: Slot;
  rarity: ItemRarity;
  /** One line shown when the item drops or is looked at. */
  description?: string;
  /** How the item is drawn: a `SkinArt` for skins, a `WearArt` for everything else. */
  art: SkinArt | WearArt;
  /** Mascots the item fits. Missing means it fits every mascot. */
  fits?: MascotId[];
  /** Themed set the item belongs to. */
  set?: string;
  /** Season id for items that only drop from Exam Capsules. */
  season?: string;
  /** Legendary skins and other showpieces are animated. */
  animated?: boolean;
  /** Owned from the start (the default skin of each mascot). Never drops. */
  starter?: boolean;
  /** Defaults to true. Seasonal items and legendary skins cannot be crafted. */
  craftable?: boolean;
  /** Defaults to true. False keeps an item out of every crate (for example retired items). */
  dropsFromCrates?: boolean;
  /**
   * Only given by a signed grant (every Exotic item). Never drops, cannot be
   * crafted and stays hidden until it is owned.
   */
  grantOnly?: boolean;
}

export type RarityTable = Record<Rarity, number>;

export interface CrateDefinition {
  type: CrateType;
  name: string;
  /** Number of items in one crate. */
  items: number;
  /** Drop chance per item in percent. Must add up to 100. */
  odds: RarityTable;
  /** At least one item in the crate is this rare or rarer. */
  guaranteedMinRarity?: Rarity;
  /** "standard" items, or the current season's items only. */
  pool: "standard" | "seasonal";
}

export interface CrateRules {
  crates: Record<CrateType, CrateDefinition>;
  /** An Epic (or better) is guaranteed within this many crates, a Legendary within the other. */
  pity: { epic: number; legendary: number };
  /** Insight you get for a duplicate, by rarity (stored as "stardust"). */
  duplicateStardust: RarityTable;
  /** Insight it costs to craft an item, by rarity. */
  craftCost: RarityTable;
}

export interface RewardRules {
  /** XP per fully focused minute. 0.4 gives 10 XP for a 25-minute session. */
  xpPerFocusMinute: number;
  onTimeBonusXp: number;
  recallBonusXp: number;
  distractionFreeBonusXp: number;
  /** A start counts as on time from this many minutes before to this many after the plan. */
  onTimeWindowMinutes: { early: number; late: number };
  /** A recall shorter than this (in characters, trimmed) earns no bonus. */
  minRecallChars: number;
  /** Sessions shorter than this count for XP but not for crates or the distraction-free bonus. */
  minMinutesForCrate: number;
  /** One Study Crate per this many qualifying sessions. */
  studyCrateEvery: number;
  /** Only this many sessions per day count toward crates, so long days are not overrewarded. */
  maxCrateSessionsPerDay: number;
  /** XP needed to go from level n to n + 1 is base × n ^ exponent, rounded to tens. */
  level: { base: number; exponent: number };
}
