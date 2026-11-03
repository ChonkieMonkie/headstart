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

<!-- A mascot, drawn from a look (skin and items) in one of its moods. -->
<script lang="ts">
  import type { Mood } from "./geometry.ts";
  import { type MascotLook, mascotLabel, renderMascot } from "./render.ts";

  let {
    look,
    mood = "idle",
    size = 120,
    label,
    still = false,
    grey = false,
  }: {
    look: MascotLook;
    mood?: Mood;
    size?: number;
    /** Screen reader text. Defaults to the mascot's name and mood; "" hides it. */
    label?: string;
    /** No animations, for thumbnails and long lists. */
    still?: boolean;
    /** Drawn in greys, for items not found yet. */
    grey?: boolean;
  } = $props();

  const inner = $derived(renderMascot(look, mood, { still, grey }));
  const text = $derived(label ?? mascotLabel(look.species, mood));
</script>

<svg
  class="mascot"
  viewBox="0 0 200 200"
  width={size}
  height={size}
  role={text ? "img" : "presentation"}
  aria-label={text || undefined}
  aria-hidden={text ? undefined : "true"}
>
  {@html inner}
</svg>

<style>
  .mascot {
    display: block;
    overflow: visible;
  }
</style>
