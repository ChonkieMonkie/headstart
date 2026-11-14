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
  A text field that takes LaTeX: the symbol bar, suggestions after a backslash
  and a preview. A typo in one formula is shown on its own and never blocks saving.
-->
<script lang="ts">
  import { type MathCommand, splitMath, suggestCommands } from "@headstart/core";
  import { ensureKatex, math, renderTex } from "$lib/math.svelte.ts";
  import { insertSnippet, type TextField, typedCommand } from "$lib/mathInput.ts";
  import MathText from "./MathText.svelte";
  import MathToolbar from "./MathToolbar.svelte";

  let {
    value = $bindable(""),
    multiline = true,
    rows = 5,
    placeholder = "",
    maxlength,
    id,
    labelledby,
    describedby,
    label,
    compact = false,
    preview = true,
    onkeydown,
    field = $bindable(),
  }: {
    value?: string;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    maxlength?: number;
    id?: string;
    labelledby?: string;
    describedby?: string;
    label?: string;
    /** A smaller symbol bar, for to-dos. */
    compact?: boolean;
    preview?: boolean;
    onkeydown?: (event: KeyboardEvent) => void;
    field?: TextField;
  } = $props();

  let suggestions = $state<MathCommand[]>([]);
  let typed = $state("");
  let pick = $state(0);
  let showPreview = $state(true);

  const segments = $derived(value.includes("$") ? splitMath(value) : []);
  const formulas = $derived(segments.filter((s) => s.kind === "math"));
  const errors = $derived.by(() => {
    const katex = math.katex;
    if (!katex) return [];
    return formulas
      .map((f) => ({ tex: f.tex, error: renderTex(katex, f.tex, f.display).error }))
      .filter((f) => f.error !== null);
  });

  $effect(() => {
    ensureKatex();
  });

  function refreshSuggestions(): void {
    if (!field) return;
    const command = typedCommand(field);
    typed = command ?? "";
    suggestions = command ? suggestCommands(command) : [];
    pick = 0;
  }

  function accept(command: MathCommand): void {
    if (!field) return;
    insertSnippet(field, command.insert, typed.length + 1);
    suggestions = [];
  }

  function keydown(event: KeyboardEvent): void {
    if (suggestions.length > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        pick = (pick + step + suggestions.length) % suggestions.length;
        return;
      }
      if (event.key === "Tab" || event.key === "Enter") {
        const command = suggestions[pick];
        if (command) {
          event.preventDefault();
          accept(command);
          return;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        suggestions = [];
        return;
      }
    }
    onkeydown?.(event);
  }
</script>

<div class="math-field" class:compact>
  <MathToolbar field={() => field} {compact} />
  <div class="input-wrap">
    {#if multiline}
      <textarea
        bind:this={field}
        bind:value
        {id}
        {rows}
        {placeholder}
        {maxlength}
        aria-labelledby={labelledby}
        aria-describedby={describedby}
        aria-label={label}
        spellcheck="false"
        oninput={refreshSuggestions}
        onclick={refreshSuggestions}
        onkeyup={(e) => (e.key === "ArrowLeft" || e.key === "ArrowRight") && refreshSuggestions()}
        onkeydown={keydown}
        onblur={() => setTimeout(() => (suggestions = []), 120)}
      ></textarea>
    {:else}
      <input
        type="text"
        bind:this={field}
        bind:value
        {id}
        {placeholder}
        {maxlength}
        aria-labelledby={labelledby}
        aria-describedby={describedby}
        aria-label={label}
        spellcheck="false"
        oninput={refreshSuggestions}
        onkeydown={keydown}
        onblur={() => setTimeout(() => (suggestions = []), 120)}
      />
    {/if}
    {#if suggestions.length > 0}
      <div class="suggest" role="listbox" aria-label="Suggestions">
        {#each suggestions as s, i (s.name)}
          <button
            type="button"
            role="option"
            aria-selected={i === pick}
            class:picked={i === pick}
            onmousedown={(e) => e.preventDefault()}
            onclick={() => accept(s)}
          >
            <code>\{s.name}</code><span class="shows">{s.shows}</span>
          </button>
        {/each}
        <span class="keys">↑↓ to choose, Tab to put in</span>
      </div>
    {/if}
  </div>

  {#if preview && formulas.length > 0}
    <div class="preview-head">
      <span>Preview</span>
      <button type="button" class="link" onclick={() => (showPreview = !showPreview)}>{showPreview ? "Hide preview" : "Show preview"}</button>
    </div>
    {#if showPreview}
      <div class="preview" class:inline={!multiline} aria-live="polite"><MathText text={value} /></div>
    {/if}
  {/if}
  {#each errors as e, i (i)}
    <p class="formula-error" role="status">
      <code>{e.tex}</code>: {e.error}. The note can still be saved.
    </p>
  {/each}
</div>

<style>
  .math-field {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .input-wrap {
    position: relative;
  }

  textarea,
  input {
    box-sizing: border-box;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--hs-field-line);
    border-radius: 0 0 12px 12px;
    font: inherit;
    color: var(--hs-ink);
    background: var(--hs-surface);
  }

  .compact textarea,
  .compact input {
    margin-top: 6px;
    border-radius: 10px;
    padding: 9px 12px;
  }

  textarea {
    resize: vertical;
    line-height: 1.5;
  }

  textarea:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .suggest {
    position: absolute;
    z-index: 25;
    top: calc(100% + 4px);
    left: 12px;
    width: 250px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-pop);
  }

  .suggest button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--hs-ink);
    font: inherit;
    cursor: pointer;
  }

  .suggest button.picked {
    background: var(--hs-accent-soft);
  }

  .suggest code {
    font-size: 13px;
  }

  .shows {
    font-family: "Times New Roman", serif;
    font-size: 16px;
  }

  .keys {
    padding: 4px 10px 2px;
    font-size: 11.5px;
    color: var(--hs-ink-muted);
  }

  .preview-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-muted);
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: none;
    color: var(--hs-accent-strong);
    cursor: pointer;
  }

  .preview {
    margin-top: 6px;
    padding: 12px 14px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
    background: var(--hs-ground);
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .preview.inline {
    padding: 8px 12px;
  }

  .formula-error {
    margin: 8px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-danger-strong);
  }

  .formula-error code {
    font-size: 12.5px;
  }
</style>
