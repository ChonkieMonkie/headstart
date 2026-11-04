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

<!-- Adds a course, or edits one: name, an optional course code, colour and an optional exam date. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { COURSE_COLORS, type Course, createCourse, localDayKey, updateCourse } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "./DatePicker.svelte";

  let { study, course = null, onDone }: { study: Study; course?: Course | null; onDone: () => void } =
    $props();

  const COLOR_NAMES = ["Blue", "Orange", "Green", "Raspberry", "Lavender", "Mint"];

  const initial = untrack(() => course);
  let name = $state(initial?.name ?? "");
  let code = $state(initial?.code ?? "");
  // A new course gets the first colour no other course uses yet.
  const used = untrack(() => new Set(study.courses.map((c) => c.color)));
  let color = $state<string>(
    initial?.color ?? COURSE_COLORS.find((c) => !used.has(c)) ?? COURSE_COLORS[used.size % COURSE_COLORS.length] ?? "#255EBC",
  );
  let examDate = $state(initial?.examDate ?? "");
  let error = $state<string | null>(null);

  async function submit(): Promise<void> {
    const result = initial
      ? await study.run((s) => updateCourse(s, initial.id, { name, code: code || null, color, examDate: examDate || null }))
      : await study.run((s) =>
          createCourse(s, { courseId: study.newId(), name, code, color, ...(examDate ? { examDate } : {}) }),
        );
    if (result.ok) onDone();
    else error = result.reason;
  }
</script>

<form
  class="form"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  <label>
    <span>Course name</span>
    <input type="text" bind:value={name} maxlength="60" placeholder="Linear Algebra" required />
  </label>
  <label>
    <span>Course code (optional)</span>
    <input type="text" class="code" bind:value={code} maxlength="16" placeholder="MA1234" autocomplete="off" spellcheck="false" />
  </label>
  <div class="field">
    <span>Exam date (optional)</span>
    <DatePicker bind:value={examDate} label="Exam date" optional min={localDayKey(Date.now())} />
  </div>
  <fieldset>
    <legend>Colour</legend>
    <div class="swatches">
      {#each COURSE_COLORS as swatch, i (swatch)}
        <label class="swatch" style:--swatch={courseColor(swatch)} title={COLOR_NAMES[i]}>
          <input type="radio" name="colour" value={swatch} bind:group={color} />
          <span class="visually-hidden">{COLOR_NAMES[i] ?? `Colour ${i + 1}`}</span>
        </label>
      {/each}
    </div>
  </fieldset>
  <div class="actions">
    <button type="submit" class="primary">{initial ? "Save course" : "Add course"}</button>
    <button type="button" class="secondary" onclick={onDone}>Cancel</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</form>

<style>
  .form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    padding: 16px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-ground);
  }

  label,
  .field,
  legend {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  input[type="text"] {
    min-height: 42px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  input.code {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }

  fieldset {
    grid-column: 1 / -1;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: 6px;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .swatch {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: var(--swatch);
    cursor: pointer;
  }

  .swatch input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .swatch:has(input:checked) {
    box-shadow:
      0 0 0 3px var(--hs-surface),
      0 0 0 6px var(--swatch);
  }

  .swatch:has(input:focus-visible) {
    outline: 3px solid var(--hs-ink);
    outline-offset: 6px;
  }

  .actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    min-height: 42px;
    padding: 0 18px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .error {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--hs-danger);
    font-weight: 700;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  input:focus-visible,
  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
