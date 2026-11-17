<!--
  Headstart, a study companion that helps you get started, stay focused and keep going.
  Copyright (C) 2026  ChonkieMonkie

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<!-- A plaque, drawn at its tier. A shield that gets grander: a star and a second rim at II, laurels at III, a crown at IV, rays and a banner at V. One-time plaques are round. -->
<script lang="ts" module>
  const INK = "#2A1F2D";
  const GOLD = "#F2C24B";

  /** The rays behind a tier V shield: a 16-pointed star. */
  const RAYS = Array.from({ length: 32 }, (_, k) => {
    const r = k % 2 === 0 ? 59 : 47;
    const a = (Math.PI * 2 * k) / 32 - Math.PI / 2;
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(62 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

  /** Laurel leaves climbing each side from the bottom, tips leaning outwards. */
  const LEAVES = [1, -1].flatMap((side) =>
    Array.from({ length: 6 }, (_, n) => {
      const deg = 66 - n * 19;
      const a = (deg * Math.PI) / 180;
      const x = 60 + 51 * Math.cos(a);
      const rot = deg - 58;
      return { x: side === 1 ? x : 120 - x, y: 64 + 51 * Math.sin(a), rot: side === 1 ? rot : 180 - rot };
    }),
  );

  const STAR = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 === 0 ? 9 : 3.9;
    return `${(60 + r * Math.sin((Math.PI * k) / 5)).toFixed(1)},${(12 - r * Math.cos((Math.PI * k) / 5)).toFixed(1)}`;
  }).join(" ");

  const SHIELD = "M40 4 L72 16 L72 46 C72 66 58 78 40 84 C22 78 8 66 8 46 L8 16 Z";
  const FIELD = "M40 12 L64 21 L64 46 C64 61 54 71 40 76 C26 71 16 61 16 46 L16 21 Z";
</script>

<script lang="ts">
  import type { PlaqueGroup } from "@headstart/content";
  import { GROUP_COLORS, PLAQUE_ICONS, TIER_NUMERALS } from "$lib/plaques.ts";

  let {
    group,
    icon,
    tier,
    tiers = 5,
    size = 96,
    faded = false,
    label = "",
  }: {
    group: PlaqueGroup;
    icon: string;
    /** The tier to draw, 1 to 5. A plaque not started is drawn as tier 1, faded. */
    tier: number;
    /** 5 for a plaque that grows, 1 for a one-time plaque. */
    tiers?: number;
    size?: number;
    faded?: boolean;
    /** Read out instead of the picture. Empty hides it from screen readers. */
    label?: string;
  } = $props();

  const colors = $derived(GROUP_COLORS[group]);
  const drawn = $derived(Math.min(Math.max(tier, 1), 5));
  const path = $derived(PLAQUE_ICONS[icon] ?? PLAQUE_ICONS.question ?? "");
</script>

{#if tiers > 1}
  <svg
    class:faded
    viewBox="0 0 120 124"
    width={size}
    height={Math.round((size * 124) / 120)}
    role={label ? "img" : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : "true"}
  >
    {#if drawn >= 5}
      <polygon points={RAYS} fill={colors.inner} stroke={INK} stroke-width="2" stroke-linejoin="round" />
    {/if}
    {#if drawn >= 3}
      {#each LEAVES as leaf, i (i)}
        <ellipse cx={leaf.x} cy={leaf.y} rx="10" ry="4.6" transform="rotate({leaf.rot} {leaf.x} {leaf.y})" fill={colors.fill} stroke={INK} stroke-width="1.6" />
      {/each}
    {/if}
    <g transform="translate(20 20)">
      <path d={SHIELD} fill={colors.fill} stroke={INK} stroke-width="3.2" stroke-linejoin="round" />
      <path d={FIELD} fill={colors.inner} />
      {#if drawn >= 2}
        <path d={FIELD} fill="none" stroke={colors.fill} stroke-width="3.2" transform="translate(40 44) scale(0.82) translate(-40 -44)" />
      {/if}
      <path d={path} fill="none" stroke={INK} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(24 24) scale(1.35)" />
    </g>
    {#if drawn === 2 || drawn === 3}
      <polygon points={STAR} fill={colors.fill} stroke={INK} stroke-width="2" stroke-linejoin="round" />
    {/if}
    {#if drawn >= 4}
      <path d="M44 25 L41 9 L51 17 L60 4 L69 17 L79 9 L76 25 Z" fill={GOLD} stroke={INK} stroke-width="2.4" stroke-linejoin="round" />
    {/if}
    {#if drawn >= 5}
      <path d="M12 90 L108 90 L100 99 L108 108 L12 108 L20 99 Z" fill={colors.fill} stroke={INK} stroke-width="2.4" stroke-linejoin="round" />
      <text x="60" y="104" text-anchor="middle" class="numeral" font-size="14" fill="#FFFFFF">V</text>
    {:else}
      <circle cx="60" cy="106" r="10.5" fill="#FFFFFF" stroke={INK} stroke-width="2.4" />
      <text x="60" y="110.5" text-anchor="middle" class="numeral" font-size="12" fill={INK}>{TIER_NUMERALS[drawn - 1]}</text>
    {/if}
  </svg>
{:else}
  <svg
    class:faded
    viewBox="0 0 120 124"
    width={size}
    height={Math.round((size * 124) / 120)}
    role={label ? "img" : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : "true"}
  >
    <circle cx="60" cy="62" r="44" fill={colors.fill} stroke={INK} stroke-width="3.2" />
    <circle cx="60" cy="62" r="33" fill={colors.inner} />
    <path d={path} fill="none" stroke={INK} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(41.4 43.4) scale(1.55)" />
  </svg>
{/if}

<style>
  svg {
    flex: none;
    display: block;
  }

  .faded {
    opacity: 0.35;
    filter: grayscale(0.6);
  }

  .numeral {
    font-family: var(--hs-font-display);
    font-weight: 600;
  }
</style>
