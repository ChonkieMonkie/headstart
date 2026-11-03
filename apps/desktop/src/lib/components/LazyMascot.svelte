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

<!-- A mascot for long lists: nothing is drawn until it comes close to the screen. -->
<script lang="ts">
  import { Mascot, type MascotLook } from "@headstart/ui";
  import { onMount } from "svelte";

  let {
    look,
    size,
    grey = false,
  }: { look: MascotLook; size: number; grey?: boolean } = $props();

  let box: HTMLSpanElement;
  let seen = $state(false);

  onMount(() => {
    if (typeof IntersectionObserver === "undefined") {
      seen = true;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen = true;
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  });
</script>

<span class="lazy" bind:this={box} style:width="{size}px" style:height="{size}px">
  {#if seen}
    <Mascot {look} {size} {grey} still label="" />
  {/if}
</span>

<style>
  .lazy {
    display: block;
  }
</style>
