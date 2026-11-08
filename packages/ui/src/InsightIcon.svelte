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

<!-- The Insight symbol: a tall crystal shard with a front ridge, lit from the top left. -->
<script lang="ts">
  let { size = 14, label = "" }: { size?: number; label?: string } = $props();
</script>

<svg
  class="insight-icon"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  role={label ? "img" : "presentation"}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
>
  <!-- Faces: light on the left, mid in the middle, dark at the bottom right. -->
  <polygon points="12 1.6 5.8 7.6 10.6 9.4" fill="#FFFFFF" />
  <polygon points="12 1.6 10.6 9.4 18.2 7.6" fill="#D4CCFF" />
  <polygon points="5.8 7.6 10.6 9.4 10.6 18.4 5.8 16.6" fill="#FFFFFF" />
  <polygon points="10.6 9.4 18.2 7.6 18.2 16.6 10.6 18.4" fill="#D4CCFF" />
  <polygon points="5.8 16.6 10.6 18.4 12 22.6" fill="#D4CCFF" />
  <polygon points="10.6 18.4 18.2 16.6 12 22.6" fill="#8E7DFF" />
  <!-- Facet lines, then the outline on top. -->
  <g fill="none" stroke="#2A1F2D" stroke-linejoin="round" stroke-linecap="round">
    <polyline points="12 1.6 10.6 9.4 10.6 18.4 12 22.6" stroke-width="0.9" />
    <polyline points="5.8 7.6 10.6 9.4 18.2 7.6" stroke-width="0.9" />
    <polyline points="5.8 16.6 10.6 18.4 18.2 16.6" stroke-width="0.9" />
    <polygon points="12 1.6 18.2 7.6 18.2 16.6 12 22.6 5.8 16.6 5.8 7.6" stroke-width="1.6" />
  </g>
</svg>

<style>
  .insight-icon {
    display: inline-block;
    flex: none;
    vertical-align: -0.15em;
  }
</style>
