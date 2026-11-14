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

<!-- Text with LaTeX between dollar signs drawn as maths. Plain text stays plain and never loads KaTeX. -->
<script lang="ts">
  import { splitMath } from "@headstart/core";
  import { ensureKatex, math, renderTex } from "$lib/math.svelte.ts";

  let { text }: { text: string } = $props();

  // A formula on its own line is a block already, so the line breaks around it
  // in the text would add an empty line in notes shown with pre-wrap.
  const segments = $derived.by(() => {
    if (!text.includes("$")) return null;
    const parts = splitMath(text);
    return parts.map((part, i) => {
      if (part.kind !== "text") return part;
      let t = part.text;
      const before = parts[i - 1];
      const after = parts[i + 1];
      if (before?.kind === "math" && before.display) t = t.replace(/^\r?\n/, "");
      if (after?.kind === "math" && after.display) t = t.replace(/\r?\n$/, "");
      return { ...part, text: t };
    });
  });
  const hasMath = $derived(segments?.some((s) => s.kind === "math") ?? false);

  $effect(() => {
    if (hasMath) ensureKatex();
  });
</script>

{#if !segments || !hasMath}{text}{:else}{#each segments as segment, i (i)}{#if segment.kind === "text"}{segment.text}{:else if math.katex}{@const drawn = renderTex(math.katex, segment.tex, segment.display)}{#if drawn.html}<span class="math" class:display={segment.display}>{@html drawn.html}</span>{:else}<code class="math-error" title={drawn.error ?? ""}>{segment.tex}</code>{/if}{:else}<span class="math-raw">{segment.raw}</span>{/if}{/each}{/if}

<style>
  .math :global(.katex) {
    font-size: 1.08em;
  }

  .math.display {
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .math.display :global(.katex-display) {
    margin: 0.4em 0;
  }

  .math-error {
    padding: 1px 6px;
    border: 1px solid var(--hs-danger);
    border-radius: 6px;
    background: var(--hs-danger-soft);
    color: var(--hs-danger-strong);
    font-size: 0.88em;
    white-space: pre-wrap;
  }

  .math-raw {
    color: var(--hs-ink-muted);
  }
</style>
