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
  A dropdown in Headstart's own style: a button that opens a list.
  Keyboard: arrows, Home and End move, Enter or Space picks, Escape closes,
  and typing jumps to the first option that starts with what you typed.
-->
<script lang="ts" module>
  export interface SelectOption<V> {
    value: V;
    label: string;
    /** Smaller text after the label. */
    hint?: string;
    /** A colour dot, such as the course colour. */
    color?: string;
  }

  export interface SelectGroup<V> {
    label: string;
    /** Short tag before the group label, such as a course code. */
    tag?: string | null;
    color?: string;
    options: SelectOption<V>[];
  }
</script>

<script lang="ts" generics="T extends string | number">
  import { onMount } from "svelte";

  let {
    value = $bindable(),
    groups,
    label,
    id,
    onchange,
    dark = false,
    quiet = false,
  }: {
    value: T;
    /** Options in groups. A group with an empty label shows no heading. */
    groups: SelectGroup<T>[];
    /** Accessible name, used when no visible label points at `id`. */
    label?: string;
    /** Id of the button, for a visible `<label for>` or `aria-labelledby`. */
    id?: string;
    onchange?: (value: T) => void;
    /** Colours for the dark focus screens. */
    dark?: boolean;
    /** No border until hovered, for a choice that rarely matters. */
    quiet?: boolean;
  } = $props();

  const uid = Math.random().toString(36).slice(2, 8);
  let open = $state(false);
  let alignRight = $state(false);
  let active = $state(-1);
  let root: HTMLDivElement;
  let button: HTMLButtonElement;
  let list = $state<HTMLUListElement | null>(null);
  let typed = "";
  let typedAt = 0;

  const flat = $derived(groups.flatMap((g) => g.options));
  const selected = $derived(flat.find((o) => o.value === value) ?? null);
  const selectedGroup = $derived(groups.find((g) => g.options.some((o) => o.value === value)) ?? null);

  function show(): void {
    alignRight = root.getBoundingClientRect().left + 260 > window.innerWidth;
    open = true;
    active = Math.max(0, flat.findIndex((o) => o.value === value));
    queueMicrotask(() => scrollToActive());
  }

  function close(focusButton = true): void {
    open = false;
    if (focusButton) button?.focus();
  }

  function pick(option: SelectOption<T>): void {
    value = option.value;
    onchange?.(option.value);
    close();
  }

  function scrollToActive(): void {
    list?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function move(to: number): void {
    if (flat.length === 0) return;
    active = Math.min(flat.length - 1, Math.max(0, to));
    scrollToActive();
  }

  function onkeydown(event: KeyboardEvent): void {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(active + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        move(active - 1);
        return;
      case "Home":
        event.preventDefault();
        move(0);
        return;
      case "End":
        event.preventDefault();
        move(flat.length - 1);
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = flat[active];
        if (option) pick(option);
        return;
      }
      case "Escape":
        event.preventDefault();
        close();
        return;
      case "Tab":
        close(false);
        return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      const now = Date.now();
      typed = now - typedAt > 700 ? event.key : typed + event.key;
      typedAt = now;
      const index = flat.findIndex((o) => o.label.toLowerCase().startsWith(typed.toLowerCase()));
      if (index >= 0) move(index);
    }
  }

  onMount(() => {
    const away = (event: PointerEvent) => {
      if (open && !root.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  const indexOf = (option: SelectOption<T>) => flat.indexOf(option);
</script>

<div class="select" class:dark class:quiet bind:this={root}>
  <button
    type="button"
    class="trigger"
    role="combobox"
    {id}
    bind:this={button}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls="list-{uid}"
    aria-label={label ? `${label}: ${selected?.label ?? "none"}` : undefined}
    aria-activedescendant={open && active >= 0 ? `opt-${uid}-${active}` : undefined}
    onclick={() => (open ? close() : show())}
    {onkeydown}
  >
    {#if selected?.color ?? selectedGroup?.color}
      <span class="dot" style:background={selected?.color ?? selectedGroup?.color} aria-hidden="true"></span>
    {/if}
    <span class="value">
      {#if selectedGroup?.label && selected && selected.label !== selectedGroup.label}
        <span class="context">{selectedGroup.tag ?? selectedGroup.label} ·</span>
      {/if}
      {selected?.label ?? "Choose…"}
    </span>
    <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
  </button>

  {#if open}
    <ul class="list" class:right={alignRight} role="listbox" id="list-{uid}" tabindex="-1" bind:this={list} aria-label={label}>
      {#each groups as group, g (g)}
        {#if group.label}
          <li class="group" role="presentation">
            {#if group.color}<span class="dot" style:background={group.color} aria-hidden="true"></span>{/if}
            {#if group.tag}<span class="tag">{group.tag}</span>{/if}
            {group.label}
          </li>
        {/if}
        {#each group.options as option (option.value)}
          {@const i = indexOf(option)}
          <!-- The keyboard is handled on the combobox button, as in the ARIA select-only combobox pattern. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            role="option"
            id="opt-{uid}-{i}"
            data-index={i}
            class="option"
            class:indented={!!group.label}
            class:active={i === active}
            aria-selected={option.value === value}
            onpointerenter={() => (active = i)}
            onpointerdown={(e) => e.preventDefault()}
            onclick={() => pick(option)}
          >
            {#if option.color}<span class="dot" style:background={option.color} aria-hidden="true"></span>{/if}
            <span class="label">{option.label}</span>
            {#if option.hint}<span class="hint">{option.hint}</span>{/if}
            {#if option.value === value}
              <svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {/if}
          </li>
        {/each}
      {/each}
    </ul>
  {/if}
</div>

<style>
  .select {
    position: relative;
    display: inline-block;
    min-width: 0;
    --line: #c9cfdc;
    --bg: var(--hs-surface);
    --ink: var(--hs-ink);
    --muted: var(--hs-ink-subtle);
    --hover: var(--hs-accent-soft);
    --pop: var(--hs-surface);
  }

  .select.dark {
    --line: #3a4070;
    --bg: transparent;
    --ink: var(--hs-focus-text);
    --muted: var(--hs-focus-text-muted);
    --hover: #2a2f55;
    --pop: var(--hs-focus-surface);
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 10px 0 14px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--bg);
    font: inherit;
    font-weight: 700;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }

  .trigger:hover {
    border-color: var(--hs-accent);
  }

  .quiet .trigger {
    border-color: transparent;
    background: transparent;
    font-weight: 600;
    color: var(--muted);
  }

  .quiet .trigger:hover,
  .quiet .trigger[aria-expanded="true"] {
    border-color: var(--line);
    color: var(--ink);
  }

  .trigger[aria-expanded="true"] {
    border-color: var(--hs-accent);
    box-shadow: 0 0 0 3px var(--hs-accent-soft);
  }

  .trigger:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context {
    font-weight: 600;
    color: var(--muted);
  }

  svg {
    width: 18px;
    height: 18px;
    flex: none;
  }

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .chevron {
    color: var(--muted);
    transition: transform 0.15s;
  }

  .trigger[aria-expanded="true"] .chevron {
    transform: rotate(180deg);
  }

  .list {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    width: max-content;
    min-width: max(100%, 240px);
    max-width: min(420px, 90vw);
    max-height: 320px;
    overflow-y: auto;
    box-sizing: border-box;
    margin: 0;
    padding: 6px;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--pop);
    box-shadow: var(--hs-shadow-pop);
  }

  .list.right {
    left: auto;
    right: 0;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 10px 4px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--muted);
  }

  .tag {
    padding: 1px 6px;
    border-radius: 5px;
    background: var(--hover);
    letter-spacing: 0;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 10px;
    border-radius: 9px;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
  }

  .option.indented {
    padding-left: 24px;
  }

  .option.active {
    background: var(--hover);
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hint {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }

  .check {
    margin-left: auto;
    color: var(--hs-accent);
  }

  .dark .check {
    color: var(--hs-focus-accent);
  }

  .dot {
    width: 10px;
    height: 10px;
    flex: none;
    border-radius: 999px;
  }
</style>
