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

<!-- The Headstart mark: a grinning stopwatch whose ring has only just started. -->
<script lang="ts">
  import { colors } from "./tokens.ts";

  interface Props {
    size?: number;
    variant?: "tile" | "bare";
    tone?: "purple" | "lavender";
    label?: string;
  }

  let { size = 40, variant = "tile", tone = "purple", label = "Headstart" }: Props = $props();

  const tile = $derived(variant === "tile");
  const tileFill = $derived(tone === "lavender" ? colors.lavender : colors.accent);
  const ink = $derived(tile && tone === "purple" ? "#FFFFFF" : colors.accent);
</script>

<svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label}>
  {#if tile}
    <rect width="100" height="100" rx="24" fill={tileFill} />
  {/if}
  <g transform={tile ? "translate(12 12) scale(0.76)" : undefined}>
    <rect x="43" y="3" width="14" height="10" rx="3.5" fill={ink} />
    <rect x="74" y="13" width="10" height="8" rx="3" fill={ink} transform="rotate(40 79 17)" />
    <circle cx="50" cy="55" r="34" fill="none" stroke={ink} stroke-opacity="0.35" stroke-width="8" />
    <circle
      cx="50"
      cy="55"
      r="34"
      fill="none"
      stroke={ink}
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray="38 214"
      transform="rotate(-90 50 55)"
    />
    <path d="M33 53 Q40 44 47 53" fill="none" stroke={ink} stroke-width="6" stroke-linecap="round" />
    <path d="M53 53 Q60 44 67 53" fill="none" stroke={ink} stroke-width="6" stroke-linecap="round" />
    <path d="M36 62 Q50 79 64 62 Z" fill={ink} stroke={ink} stroke-width="3" stroke-linejoin="round" />
  </g>
</svg>
