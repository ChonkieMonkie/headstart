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

<!--
  A crate of any kind. Idle, it breathes. Charging, it hops once per rarity
  step, higher each time, while its glow walks through the rarity colours
  (grey, green, blue, purple, gold) and stops on the best item's colour. Then
  it trembles (Legendary floats up), bursts open its own way (lid, bow, chest
  lid, vault door) and sinks away. Only transform and opacity animate.
-->
<script lang="ts">
  import type { CrateType } from "@headstart/content";
  import { crateSvg } from "$lib/crateArt.ts";

  let {
    type,
    size = 280,
    phase = "idle",
    hop = -1,
    hopTime = 0.46,
    glow = "transparent",
    level = 0,
    float = false,
    gather = false,
    gatherTime = 1,
    flames = 4,
    still = false,
  }: {
    type: CrateType;
    size?: number;
    phase?: "idle" | "charging" | "tell" | "open";
    /** The hop going on now, from 0. Each new value plays one hop. */
    hop?: number;
    /** Seconds per hop. */
    hopTime?: number;
    /** The glow colour now. */
    glow?: string;
    /** 0 to 4: how far the glow has climbed, so it grows a little each step. */
    level?: number;
    /** Legendary: float up while trembling. */
    float?: boolean;
    /** Rare and better: white sparks are pulled into the crate while it charges. */
    gather?: boolean;
    /** Seconds the sparks take to arrive. */
    gatherTime?: number;
    /** Lit flames on a Streak Chest. */
    flames?: number;
    /** No movement at all (small icons and lists). */
    still?: boolean;
  } = $props();

  const svg = $derived(crateSvg(type, { flames }));
  const height = $derived(hop <= 0 ? 16 : 12 + hop * 7);
  const SPARKS = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { x: Math.round(Math.cos(a) * 150), y: Math.round(Math.sin(a) * 110 - 30), delay: (i % 5) * 0.08 };
  });
</script>

<div
  class="crate {type} {phase}"
  class:still
  class:float
  style:width="{size}px"
  style:height="{size * 0.8}px"
  style:--glow={glow}
  style:--level={level}
  style:--hop-time="{hopTime}s"
  style:--h="{height}px"
  style:--tilt="{hop % 2 === 0 ? -4 : 4}deg"
  style:--gather-time="{gatherTime}s"
>
  <span class="halo" aria-hidden="true"></span>
  {#if gather && (phase === "charging" || phase === "tell")}
    <span class="sparks" aria-hidden="true">
      {#each SPARKS as s, i (i)}
        <span style:--x="{s.x}px" style:--y="{s.y}px" style:animation-delay="{s.delay}s"></span>
      {/each}
    </span>
  {/if}
  {#key hop}
    <div class="art" class:hopping={phase === "charging" && hop >= 0}>{@html svg}</div>
    {#if phase === "charging" && hop >= 0}<span class="puff" aria-hidden="true"></span>{/if}
  {/key}
  {#if phase === "open"}<span class="flash" aria-hidden="true"></span>{/if}
</div>

<style>
  .crate {
    position: relative;
    display: block;
  }

  .art {
    position: relative;
    width: 100%;
    height: 100%;
    transform-origin: 50% 92%;
    animation: cr-breathe 2.6s ease-in-out infinite;
  }

  .still .art {
    animation: none;
  }

  .halo {
    position: absolute;
    inset: -18%;
    border-radius: 50%;
    color: var(--glow);
    background: radial-gradient(closest-side, currentColor, transparent);
    opacity: 0;
    transform: scale(0.7);
    transition:
      color 0.18s ease-out,
      opacity 0.3s ease-out,
      transform 0.3s ease-out;
  }

  .charging .halo,
  .tell .halo {
    opacity: calc(0.55 + var(--level) * 0.1);
    transform: scale(calc(0.85 + var(--level) * 0.07));
  }

  .open .halo {
    opacity: 1;
    transform: scale(1.7);
    transition-duration: 0.12s;
  }

  .art.hopping {
    animation: cr-hop var(--hop-time) cubic-bezier(0.3, 0.7, 0.4, 1) both;
  }

  .tell .art {
    animation: cr-tremble 0.09s linear infinite alternate;
  }

  .tell.float .art {
    animation: cr-float 0.09s linear infinite alternate;
  }

  .open .art {
    animation:
      cr-burst 0.38s ease-out both,
      cr-sink 0.45s 0.4s ease-in forwards;
  }

  .puff {
    position: absolute;
    left: 50%;
    bottom: 2%;
    width: 70%;
    height: 9%;
    margin-left: -35%;
    border-radius: 50%;
    background: #ffffff;
    opacity: 0;
    animation: cr-puff 0.4s calc(var(--hop-time) * 0.76) ease-out forwards;
  }

  .flash {
    position: absolute;
    left: 50%;
    top: 55%;
    width: 80%;
    aspect-ratio: 1;
    margin: -40% 0 0 -40%;
    border-radius: 50%;
    background: radial-gradient(closest-side, #ffffff, rgba(255, 255, 255, 0));
    animation: cr-flash 0.45s ease-out forwards;
  }

  .sparks span {
    position: absolute;
    left: 50%;
    top: 60%;
    width: 8px;
    height: 8px;
    margin: -4px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff;
    opacity: 0;
    animation: cr-gather var(--gather-time) ease-in both;
  }

  /* How each crate opens. */
  .art :global(.lid),
  .art :global(.door),
  .art :global(.dial) {
    transform-box: fill-box;
  }

  .charging.milestone .art :global(.dial) {
    transform-origin: 50% 50%;
    animation: cr-spin 0.9s linear infinite;
  }

  .tell.milestone .art :global(.dial) {
    transform-origin: 50% 50%;
    animation: cr-spin 0.3s linear infinite;
  }

  .open .art :global(.lid) {
    transform-origin: 50% 100%;
    animation: cr-lid-off 0.5s ease-out forwards;
  }

  .open.weekly .art :global(.lid) {
    animation: cr-untie 0.55s ease-out forwards;
  }

  .open.streak .art :global(.lid) {
    animation: cr-creak 0.45s ease-out forwards;
  }

  .open.milestone .art :global(.door) {
    transform-origin: 0% 50%;
    animation: cr-swing 0.42s ease-out forwards;
  }

  @keyframes cr-breathe {
    0%,
    100% {
      transform: none;
    }
    50% {
      transform: scale(1.02, 0.98);
    }
  }

  @keyframes cr-hop {
    0% {
      transform: scale(1.12, 0.86);
    }
    12% {
      transform: scale(0.92, 1.1);
    }
    45% {
      transform: translateY(calc(var(--h) * -1)) rotate(var(--tilt)) scale(0.96, 1.05);
    }
    76% {
      transform: translateY(0) scale(1.16, 0.84);
    }
    100% {
      transform: scale(1.03, 0.98);
    }
  }

  @keyframes cr-tremble {
    from {
      transform: translateX(-3px) rotate(-2deg);
    }
    to {
      transform: translateX(3px) rotate(2deg);
    }
  }

  @keyframes cr-float {
    from {
      transform: translate(-3px, -14px) rotate(-2deg) scale(1.04);
    }
    to {
      transform: translate(3px, -14px) rotate(2deg) scale(1.04);
    }
  }

  @keyframes cr-burst {
    0% {
      transform: scale(1.18, 0.86);
    }
    35% {
      transform: scale(0.94, 1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes cr-sink {
    to {
      transform: translateY(26px) scale(0.78);
      opacity: 0;
    }
  }

  @keyframes cr-puff {
    0% {
      opacity: 0.6;
      transform: scale(0.6);
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }

  @keyframes cr-flash {
    0% {
      opacity: 0.95;
      transform: scale(0.3);
    }
    100% {
      opacity: 0;
      transform: scale(2.4);
    }
  }

  @keyframes cr-gather {
    0% {
      opacity: 0;
      transform: translate(var(--x), var(--y));
    }
    15% {
      opacity: 1;
    }
    95% {
      opacity: 1;
      transform: translate(0, 0) scale(0.4);
    }
    100% {
      opacity: 0;
      transform: translate(0, 0) scale(0.4);
    }
  }

  @keyframes cr-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes cr-lid-off {
    15% {
      transform: translateY(-8px) rotate(-6deg);
    }
    100% {
      transform: translate(70px, -110px) rotate(220deg);
      opacity: 0;
    }
  }

  @keyframes cr-untie {
    18% {
      transform: translateY(-6px) scale(1.12, 0.9);
    }
    45% {
      transform: translateY(-46px) rotate(-12deg);
    }
    100% {
      transform: translateY(-96px) rotate(28deg);
      opacity: 0;
    }
  }

  @keyframes cr-creak {
    20% {
      transform: translateY(-5px);
    }
    70% {
      transform: translateY(-26px) scaleY(-0.5);
    }
    100% {
      transform: translateY(-22px) scaleY(-0.42);
    }
  }

  @keyframes cr-swing {
    55% {
      transform: scaleX(0.04);
    }
    80% {
      transform: scaleX(0.16);
    }
    100% {
      transform: scaleX(0.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .art,
    .art.hopping,
    .tell .art,
    .open .art,
    .open .art :global(*),
    .puff,
    .flash,
    .sparks span {
      animation: none !important;
    }
  }
</style>
