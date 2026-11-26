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
  The burst behind a revealed item, grander for every rarity: a soft pop for
  Common, a green sparkle ring for Uncommon, a blue burst with rays for Rare,
  a dimmed screen and a purple shockwave for Epic, and golden beams with
  confetti for Legendary. Only transform and opacity move, at most 60
  particles, and everything is removed when it is done.
-->
<script lang="ts">
  import type { Rarity } from "@headstart/content";

  let { rarity, color }: { rarity: Rarity; color: string } = $props();

  // A fixed pseudo-random spread, so the same rarity always looks the same.
  const spread = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      return r - Math.floor(r);
    });

  const sparkles = $derived(
    rarity === "common" ? 6 : rarity === "uncommon" ? 14 : rarity === "rare" ? 16 : rarity === "epic" ? 20 : 10,
  );
  const ring = $derived(
    Array.from({ length: sparkles }, (_, i) => {
      const angle = (i / sparkles) * Math.PI * 2;
      const distance = rarity === "common" ? 120 : 165;
      return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, delay: (i % 4) * 0.05 };
    }),
  );
  const confetti = $derived(
    rarity === "legendary"
      ? spread(46, 3).map((r, i) => ({
          left: r * 100,
          delay: spread(46, 7)[i]! * 0.9,
          duration: 1.8 + spread(46, 11)[i]! * 1.2,
          hue: ["#F5C542", "#FF8FC0", "#7FD8C0", "#8B5CF6", "#FFFFFF"][i % 5],
          turn: Math.round(spread(46, 5)[i]! * 720),
        }))
      : [],
  );
</script>

{#if rarity === "epic"}<div class="dim" aria-hidden="true"></div>{/if}

<div class="fx {rarity}" style:--fx={color} aria-hidden="true">
  {#if rarity === "rare" || rarity === "legendary"}
    <svg class="rays" viewBox="0 0 400 400">
      <g fill="var(--fx)" opacity={rarity === "legendary" ? 0.32 : 0.24}>
        {#each Array.from({ length: rarity === "legendary" ? 16 : 10 }) as _, i (i)}
          <polygon points="200,200 192,0 208,0" transform="rotate({i * (rarity === 'legendary' ? 22.5 : 36)} 200 200)" />
        {/each}
      </g>
    </svg>
  {/if}
  {#if rarity === "epic" || rarity === "legendary"}
    <span class="wave"></span>
    <span class="wave late"></span>
  {/if}
  {#each ring as p, i (i)}
    <span class="spark" style:--x="{p.x}px" style:--y="{p.y}px" style:animation-delay="{p.delay}s"></span>
  {/each}
</div>

{#if confetti.length > 0}
  <div class="confetti" aria-hidden="true">
    {#each confetti as c, i (i)}
      <span
        style:left="{c.left}%"
        style:background={c.hue}
        style:animation-delay="{c.delay}s"
        style:animation-duration="{c.duration}s"
        style:--turn="{c.turn}deg"
      ></span>
    {/each}
  </div>
{/if}

<style>
  .fx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rays {
    position: absolute;
    width: 150%;
    height: 150%;
    animation:
      fx-in 0.5s ease-out both,
      fx-spin 24s linear infinite;
  }

  .legendary .rays {
    width: 190%;
    height: 190%;
  }

  .spark {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--fx);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    opacity: 0;
    animation: fx-spark 0.9s ease-out forwards;
  }

  .common .spark {
    width: 9px;
    height: 9px;
    background: #ffffff;
  }

  .wave {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 6px solid var(--fx);
    opacity: 0;
    animation: fx-wave 1.1s ease-out forwards;
  }

  .wave.late {
    animation-delay: 0.25s;
  }

  .dim {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: #0b0d1c;
    pointer-events: none;
    animation: fx-dim 2.2s ease-out forwards;
  }

  .confetti {
    position: fixed;
    inset: 0;
    z-index: 3;
    overflow: hidden;
    pointer-events: none;
  }

  .confetti span {
    position: absolute;
    top: -16px;
    width: 9px;
    height: 14px;
    border-radius: 2px;
    opacity: 0;
    animation-name: fx-confetti;
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
  }

  @keyframes fx-in {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
  }

  @keyframes fx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fx-spark {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.4);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--x), var(--y)) scale(1);
    }
  }

  @keyframes fx-wave {
    0% {
      opacity: 0.9;
      transform: scale(0.4);
    }
    100% {
      opacity: 0;
      transform: scale(2.4);
    }
  }

  @keyframes fx-dim {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 0.55;
    }
    100% {
      opacity: 0.2;
    }
  }

  @keyframes fx-confetti {
    0% {
      opacity: 1;
      transform: translateY(0) rotate(0);
    }
    100% {
      opacity: 0.9;
      transform: translateY(105vh) rotate(var(--turn));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fx,
    .dim,
    .confetti {
      display: none;
    }
  }
</style>
