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

<!-- The Stardust symbol: a four-pointed star with a small sparkle beside it. -->
<script lang="ts">
  let { size = 14, label = "" }: { size?: number; label?: string } = $props();
</script>

<svg
  class="stardust-icon"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  role={label ? "img" : "presentation"}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
>
  <path
    d="M10 2.5 L12.1 7.9 L17.5 10 L12.1 12.1 L10 17.5 L7.9 12.1 L2.5 10 L7.9 7.9 Z"
    fill="#F5B82E"
    stroke="#2A1F2D"
    stroke-width="1.6"
    stroke-linejoin="round"
  />
  <path
    d="M18.5 14.5 L19.4 16.6 L21.5 17.5 L19.4 18.4 L18.5 20.5 L17.6 18.4 L15.5 17.5 L17.6 16.6 Z"
    fill="#A99BFF"
    stroke="#2A1F2D"
    stroke-width="1.2"
    stroke-linejoin="round"
  />
</svg>

<style>
  .stardust-icon {
    display: inline-block;
    flex: none;
    vertical-align: -0.15em;
  }
</style>
