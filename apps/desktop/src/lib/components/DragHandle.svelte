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

<!-- The grip on a list row: drag it to move the row, or use Space and the arrow keys. -->
<script lang="ts">
  let {
    label,
    held = false,
    dark = false,
    onpointerdown,
    onkeydown,
  }: {
    label: string;
    held?: boolean;
    dark?: boolean;
    onpointerdown: (event: PointerEvent) => void;
    onkeydown: (event: KeyboardEvent) => void;
  } = $props();
</script>

<button
  type="button"
  class="grip"
  class:held
  class:dark
  aria-label="Move {label}"
  aria-pressed={held}
  title="Drag to move"
  {onpointerdown}
  {onkeydown}
>
  <svg viewBox="0 0 12 20" aria-hidden="true">
    {#each [4, 10, 16] as y (y)}
      <circle cx="3.5" cy={y} r="1.5" />
      <circle cx="8.5" cy={y} r="1.5" />
    {/each}
  </svg>
</button>

<style>
  .grip {
    flex: none;
    display: grid;
    place-items: center;
    width: 20px;
    /* As tall as a checkbox row (18px box, 2px above and below), so the dots
       line up with the checkbox beside them. */
    min-height: 22px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--hs-ink-subtle);
    cursor: grab;
    touch-action: none;
    opacity: 0.55;
  }

  .grip.dark {
    color: var(--hs-focus-text-muted);
  }

  .grip:hover,
  .grip:focus-visible,
  .grip.held {
    opacity: 1;
  }

  .grip.held {
    background: color-mix(in srgb, var(--hs-accent) 18%, transparent);
  }

  .grip:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 1px;
  }

  svg {
    width: 10px;
    height: 16px;
    fill: currentColor;
  }
</style>
