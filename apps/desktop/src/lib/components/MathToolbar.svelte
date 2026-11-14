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

<!-- The symbol bar above a field that holds LaTeX: each button puts the code in at the cursor. -->
<script lang="ts">
  import { GREEK, MATH_COMMANDS, type MathCommand } from "@headstart/core";
  import { insertSnippet, type TextField } from "$lib/mathInput.ts";

  let { field, compact = false }: { field: () => TextField | undefined; compact?: boolean } = $props();

  type Pop = "greek" | "relations" | "help" | null;
  let open = $state<Pop>(null);

  const RELATIONS = ["le", "ge", "ne", "approx", "to", "Rightarrow", "Leftrightarrow", "in", "subseteq", "infty", "pm", "cdot", "times", "partial", "nabla", "forall", "exists"]
    .map((name) => MATH_COMMANDS.find((c) => c.name === name))
    .filter((c): c is MathCommand => c !== undefined);

  const BASIC: { label: string; name: string; insert: string; title: string }[] = [
    { label: "a/b", name: "Fraction", insert: "\\frac{|}{}", title: "\\frac{a}{b}" },
    { label: "xⁿ", name: "Power", insert: "^{|}", title: "x^{n}" },
    { label: "xᵢ", name: "Index", insert: "_{|}", title: "x_{i}" },
    { label: "√", name: "Square root", insert: "\\sqrt{|}", title: "\\sqrt{x}" },
    { label: "∫", name: "Integral", insert: "\\int_{|}^{}", title: "\\int_{a}^{b}" },
    { label: "∑", name: "Sum", insert: "\\sum_{|}^{}", title: "\\sum_{i=1}^{n}" },
    { label: "lim", name: "Limit", insert: "\\lim_{| \\to }", title: "\\lim_{x \\to a}" },
    { label: "v⃗", name: "Vector", insert: "\\vec{|}", title: "\\vec{v}" },
    { label: "( ⋮ )", name: "Matrix", insert: "\\begin{pmatrix} | & \\\\  & \\end{pmatrix}", title: "\\begin{pmatrix} … \\end{pmatrix}" },
  ];

  const shown = $derived(compact ? BASIC.slice(0, 6) : BASIC);

  function put(snippet: string): void {
    const target = field();
    if (!target) return;
    insertSnippet(target, snippet);
    open = null;
  }

  function toggle(pop: Pop): void {
    open = open === pop ? null : pop;
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && open && (open = null)} />

<div class="bar" class:compact role="toolbar" aria-label="Math symbols">
  {#each shown as b (b.name)}
    <button type="button" class="sym" aria-label={b.name} title="{b.name}  {b.title}" onmousedown={(e) => e.preventDefault()} onclick={() => put(b.insert)}>{b.label}</button>
  {/each}
  <span class="sep" aria-hidden="true"></span>
  <div class="pop-wrap">
    <button type="button" class="sym wide" aria-label="Greek letters" aria-expanded={open === "greek"} onmousedown={(e) => e.preventDefault()} onclick={() => toggle("greek")}>αβ <span class="caret" aria-hidden="true">▾</span></button>
    {#if open === "greek"}
      <div class="pop grid" role="group" aria-label="Greek letters">
        {#each GREEK as g (g.name)}
          <button type="button" class="sym" aria-label={g.name} title={`\\${g.name}`} onmousedown={(e) => e.preventDefault()} onclick={() => put(g.insert)}>{g.shows}</button>
        {/each}
      </div>
    {/if}
  </div>
  <div class="pop-wrap">
    <button type="button" class="sym wide" aria-label="Relations and arrows" aria-expanded={open === "relations"} onmousedown={(e) => e.preventDefault()} onclick={() => toggle("relations")}>≤ → <span class="caret" aria-hidden="true">▾</span></button>
    {#if open === "relations"}
      <div class="pop grid" role="group" aria-label="Relations and arrows">
        {#each RELATIONS as r (r.name)}
          <button type="button" class="sym" aria-label={r.name} title={`\\${r.name}`} onmousedown={(e) => e.preventDefault()} onclick={() => put(r.insert)}>{r.shows}</button>
        {/each}
      </div>
    {/if}
  </div>
  {#if !compact}
    <span class="grow"></span>
    <div class="pop-wrap right">
      <button type="button" class="help" aria-expanded={open === "help"} onclick={() => toggle("help")}>How it works</button>
      {#if open === "help"}
        <div class="pop help-pop" role="note">
          <p>Write maths as LaTeX between dollar signs. The buttons put the code in for you.</p>
          <dl>
            <dt><code>$x^2$</code></dt><dd>maths in the text</dd>
            <dt><code>$$\int_0^1 x\,dx$$</code></dt><dd>maths on its own line</dd>
            <dt><code>{"\\frac{a}{b}"}</code></dt><dd>a fraction</dd>
            <dt><code>\alpha, \le, \to</code></dt><dd>symbols; type <code>\</code> for suggestions</dd>
            <dt><code>\$</code></dt><dd>a dollar sign</dd>
          </dl>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 5px;
    border: 1px solid var(--hs-field-line);
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    background: var(--hs-ground);
  }

  .bar.compact {
    border-bottom: 1px solid var(--hs-field-line);
    border-radius: 10px;
    padding: 4px;
    gap: 3px;
  }

  .sym {
    min-width: 36px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font-family: "Times New Roman", "STIX Two Text", serif;
    font-size: 15px;
    cursor: pointer;
  }

  .sym.wide {
    min-width: 46px;
  }

  .sym:hover,
  .help:hover {
    border-color: var(--hs-field-line);
  }

  .caret {
    font-size: 9px;
  }

  .sep {
    width: 1px;
    align-self: stretch;
    margin: 4px 2px;
    background: var(--hs-line);
  }

  .grow {
    flex: 1;
  }

  .help {
    height: 32px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--hs-accent-strong);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .pop-wrap {
    position: relative;
  }

  .pop {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 0;
    padding: 6px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-pop);
  }

  .pop.grid {
    display: grid;
    grid-template-columns: repeat(8, 36px);
    gap: 3px;
  }

  .right .pop {
    left: auto;
    right: 0;
  }

  .help-pop {
    width: 320px;
    padding: 12px 14px;
    font-size: 13.5px;
    color: var(--hs-ink);
  }

  .help-pop p {
    margin: 0 0 8px;
  }

  .help-pop dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    margin: 0;
  }

  .help-pop dt,
  .help-pop dd {
    margin: 0;
  }

  .help-pop code {
    font-size: 12.5px;
    color: var(--hs-accent-strong);
  }
</style>
