// Headstart, a study companion that helps you get started, stay focused and keep going.
// Copyright (C) 2026  ChonkieMonkie
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Editing helpers for text fields that hold LaTeX: inserting a snippet at the
// cursor, and finding the command being typed after a backslash.

export type TextField = HTMLInputElement | HTMLTextAreaElement;

const CARET = "\u0000";

/** True when the cursor sits inside `$…$` or `$$…$$`, judged from the text before it. */
export function insideMath(text: string, caret: number): boolean {
  const before = text.slice(0, caret);
  const displays = before.match(/(?<!\\)\$\$/g)?.length ?? 0;
  if (displays % 2 === 1) return true;
  const line = before.slice(before.lastIndexOf("\n") + 1).replace(/(?<!\\)\$\$/g, "");
  const singles = line.match(/(?<!\\)\$/g)?.length ?? 0;
  return singles % 2 === 1;
}

/**
 * Inserts a snippet at the cursor, replacing any selection, or replacing the
 * `replaceBefore` characters before the cursor (a half-typed command). `|` in
 * the snippet marks where the cursor goes, and a selection is put there.
 * Outside maths the snippet is wrapped in `$…$`. Fires an input event so
 * bindings update.
 */
export function insertSnippet(field: TextField, snippet: string, replaceBefore = 0): void {
  const caretAt = field.selectionStart ?? field.value.length;
  const start = caretAt - replaceBefore;
  const end = field.selectionEnd ?? caretAt;
  const selected = replaceBefore === 0 ? field.value.slice(start, end) : "";
  const wrap = replaceBefore === 0 && !insideMath(field.value, start);
  let text = snippet.includes("|")
    ? snippet.replace("|", `${selected}${CARET}`)
    : `${snippet}${selected}${CARET}`;
  if (wrap) text = `$${text}$`;
  const caret = start + text.indexOf(CARET);
  text = text.replace(CARET, "");
  field.value = field.value.slice(0, start) + text + field.value.slice(end);
  field.focus();
  field.setSelectionRange(caret, caret);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** The command being typed right before the cursor, such as "la" in "$\la", inside maths only. */
export function typedCommand(field: TextField): string | null {
  const caret = field.selectionStart ?? 0;
  if (caret !== field.selectionEnd) return null;
  const match = /\\([A-Za-z]+)$/.exec(field.value.slice(0, caret));
  if (!match || !insideMath(field.value, caret - match[0].length)) return null;
  return match[1] ?? null;
}
