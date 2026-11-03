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

<!-- The wooden Study Crate. It wobbles while it waits and shakes hard just before it opens. -->
<script lang="ts">
  let { size = 280, shaking = false }: { size?: number; shaking?: boolean } = $props();
</script>

<svg
  class="crate"
  class:shaking
  viewBox="0 0 140 112"
  width={size}
  height={size * 0.8}
  role="img"
  aria-label="Closed wooden Study Crate"
>
  <ellipse cx="70" cy="104" rx="52" ry="5" fill="#000000" opacity="0.3" />
  <g stroke="#2A1F2D" stroke-linejoin="round">
    <rect x="22" y="36" width="96" height="64" rx="4" fill="#C08A52" stroke-width="3" />
    <path d="M22 57 L118 57 M22 78 L118 78" fill="none" stroke="#8E6136" stroke-width="2.5" />
    <polygon points="26,96 34,96 114,42 114,40 106,40 26,94" fill="#A9763F" stroke-width="2.4" />
    <rect x="16" y="28" width="108" height="13" rx="3" fill="#D29C62" stroke-width="3" />
    <path d="M30 32 L58 32" fill="none" stroke="#F1C995" stroke-width="2.5" stroke-linecap="round" />
    <rect x="50" y="60" width="40" height="16" rx="3" fill="#F4E3C3" stroke-width="2.4" />
    <path d="M59 68 L81 68" fill="none" stroke="#8E6136" stroke-width="2.4" stroke-linecap="round" />
    <g fill="#5E4630" stroke="none">
      <circle cx="28" cy="46" r="2" />
      <circle cx="112" cy="46" r="2" />
      <circle cx="28" cy="90" r="2" />
      <circle cx="112" cy="90" r="2" />
    </g>
  </g>
</svg>

<style>
  .crate {
    display: block;
    transform-origin: 50% 90%;
    animation: cr-wobble 1.6s ease-in-out infinite;
  }

  .crate.shaking {
    animation: cr-shake 0.12s linear infinite;
  }

  @keyframes cr-wobble {
    0%,
    100% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-3deg);
    }
    75% {
      transform: rotate(3deg);
    }
  }

  @keyframes cr-shake {
    0%,
    100% {
      transform: translateX(0) rotate(0);
    }
    25% {
      transform: translateX(-4px) rotate(-4deg);
    }
    75% {
      transform: translateX(4px) rotate(4deg);
    }
  }
</style>
