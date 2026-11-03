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

<!-- A button that only acts after being held down, for exits that should take a moment of intent. -->
<script lang="ts">
  let {
    label,
    onhold,
    duration = 2000,
  }: { label: string; onhold: () => void; duration?: number } = $props();

  let holding = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const seconds = $derived(Math.round(duration / 1000));

  function begin(): void {
    if (holding) return;
    holding = true;
    timer = setTimeout(() => {
      cancel();
      onhold();
    }, duration);
  }

  function cancel(): void {
    holding = false;
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function onkeydown(event: KeyboardEvent): void {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      begin();
    }
  }

  function onkeyup(event: KeyboardEvent): void {
    if (event.key === " " || event.key === "Enter") cancel();
  }
</script>

<button
  type="button"
  class="hold"
  class:holding
  style:--hold-ms="{duration}ms"
  aria-label="{label}, hold for {seconds} seconds"
  onpointerdown={begin}
  onpointerup={cancel}
  onpointerleave={cancel}
  onpointercancel={cancel}
  {onkeydown}
  {onkeyup}
  onblur={cancel}
>
  <span class="fill" aria-hidden="true"></span>
  <span class="text">{label} <small>hold {seconds} s</small></span>
</button>

<style>
  .hold {
    position: relative;
    overflow: hidden;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }

  .fill {
    position: absolute;
    inset: 0;
    width: 0;
    background: rgb(169 155 255 / 0.35);
    transition: width 120ms ease-out;
  }

  .holding .fill {
    width: 100%;
    transition: width var(--hold-ms) linear;
  }

  .text {
    position: relative;
  }

  small {
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }
</style>
