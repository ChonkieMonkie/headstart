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

// Dragging list rows to a new place, by pointer or keyboard. Pointer events,
// not HTML5 drag and drop: Tauri's file-drop handling breaks HTML5 drag and
// drop in the Windows web view, and pointer events also work with touch.
//
// Markup: a list is `<ul data-reorder="<scope>" data-reorder-group="<group>">`
// and each row `<li data-reorder-id="<id>">` with a handle button inside.
// Rows can move between lists of the same scope; the group tells where.

export interface Drop {
  id: string;
  /** The row just above the new place, or null at the top. */
  after: string | null;
  /** The row just below the new place, or null at the bottom. */
  before: string | null;
  /** `data-reorder-group` of the list it was dropped in. */
  group: string | null;
}

const EDGE = 48;
/**
 * How far above and below a list a drop still lands in it. Nothing on the
 * page changes size during a drag (that made the window jump), so an empty
 * list, which has no height, is reached through this margin.
 */
const REACH = 16;
const START_DISTANCE = 4;

function rowsOf(list: Element, without?: string): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>(":scope > [data-reorder-id]")].filter(
    (row) => row.dataset.reorderId !== without,
  );
}

function placeIn(list: Element, id: string, y: number): Omit<Drop, "id"> {
  const rows = rowsOf(list, id);
  let index = rows.findIndex((row) => {
    const box = row.getBoundingClientRect();
    return y < box.top + box.height / 2;
  });
  if (index === -1) index = rows.length;
  return {
    after: rows[index - 1]?.dataset.reorderId ?? null,
    before: rows[index]?.dataset.reorderId ?? null,
    group: (list as HTMLElement).dataset.reorderGroup ?? null,
  };
}

/** The first solid background behind an element, so the lifted row matches its card. */
function surfaceBehind(element: Element): string {
  for (let el: Element | null = element; el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor;
    if (color && color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return "white";
}

/** Starts a pointer drag from a row's handle. `ondrop` gets the new place. */
export function dragRow(event: PointerEvent, ondrop: (drop: Drop) => void): void {
  if (event.button !== 0) return;
  const handle = event.currentTarget as HTMLElement;
  const row = handle.closest<HTMLElement>("[data-reorder-id]");
  const home = row?.parentElement;
  const scope = home?.dataset.reorder;
  const id = row?.dataset.reorderId;
  if (!row || !home || !scope || !id) return;
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);

  const startY = event.clientY;
  const box = row.getBoundingClientRect();
  let ghost: HTMLElement | null = null;
  let line: HTMLElement | null = null;
  let target: { list: Element; drop: Omit<Drop, "id"> } | null = null;
  let lastY = startY;
  let scrolling = 0;

  const begin = () => {
    ghost = row.cloneNode(true) as HTMLElement;
    ghost.classList.add("reorder-ghost");
    Object.assign(ghost.style, {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      background: surfaceBehind(home),
      color: getComputedStyle(row).color,
    });
    document.body.append(ghost);
    line = document.createElement("div");
    line.className = "reorder-line";
    document.body.append(line);
    row.classList.add("reorder-source");
    document.documentElement.classList.add("reordering");
  };

  const update = (y: number) => {
    lastY = y;
    if (!ghost || !line) return;
    ghost.style.top = `${box.top + y - startY}px`;
    const lists = [...document.querySelectorAll(`[data-reorder="${CSS.escape(scope)}"]`)];
    // The list under the pointer, or the closest one within reach.
    let list: Element | null = null;
    let closest = REACH;
    for (const l of lists) {
      const b = l.getBoundingClientRect();
      const distance = y < b.top ? b.top - y : y > b.bottom ? y - b.bottom : 0;
      if (distance <= closest) {
        list = l;
        closest = distance;
        if (distance === 0) break;
      }
    }
    if (!list) {
      target = null;
      line.style.display = "none";
      return;
    }
    const drop = placeIn(list, id, y);
    target = { list, drop };
    const rows = rowsOf(list, id);
    const below = rows.find((r) => r.dataset.reorderId === drop.before);
    const above = rows.find((r) => r.dataset.reorderId === drop.after);
    const listBox = list.getBoundingClientRect();
    const at = below
      ? below.getBoundingClientRect().top - 2
      : above
        ? above.getBoundingClientRect().bottom + 1
        : listBox.top + 2;
    Object.assign(line.style, {
      display: "block",
      left: `${listBox.left}px`,
      width: `${listBox.width}px`,
      top: `${at}px`,
    });
  };

  // Scrolls the page while the pointer is near the top or bottom edge.
  const scroll = () => {
    const speed =
      lastY < EDGE
        ? -(EDGE - lastY) / 3
        : lastY > innerHeight - EDGE
          ? (lastY - innerHeight + EDGE) / 3
          : 0;
    if (speed !== 0) {
      const scroller = document.scrollingElement ?? document.documentElement;
      scroller.scrollBy(0, speed);
      update(lastY);
    }
    scrolling = requestAnimationFrame(scroll);
  };

  const move = (e: PointerEvent) => {
    if (!ghost) {
      if (Math.abs(e.clientY - startY) < START_DISTANCE) return;
      begin();
      scrolling = requestAnimationFrame(scroll);
    }
    update(e.clientY);
  };

  const end = (e: PointerEvent) => {
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", end);
    handle.removeEventListener("pointercancel", end);
    cancelAnimationFrame(scrolling);
    ghost?.remove();
    line?.remove();
    row.classList.remove("reorder-source");
    document.documentElement.classList.remove("reordering");
    if (ghost && target && e.type === "pointerup") ondrop({ id, ...target.drop });
  };

  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

/**
 * Keyboard moving from a row's handle: Space picks the row up, ↑/↓ moves it,
 * Space or Enter puts it down and Escape takes it back. Alt+↑/↓ moves it
 * straight away. Returns true when the key was used.
 */
export class KeyboardMove {
  /** The row being moved, and where it was before, so Escape can undo. */
  held = $state<{ id: string; after: string | null; before: string | null } | null>(null);
  /** Read out by a live region. */
  message = $state("");

  constructor(
    private readonly ondrop: (drop: Drop) => void | Promise<void>,
    private readonly nameOf: (id: string) => string,
  ) {}

  /** Moves the row and keeps keyboard focus on its handle, which the list re-renders. */
  async #move(drop: Drop): Promise<void> {
    await this.ondrop(drop);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-reorder-id="${CSS.escape(drop.id)}"] .grip`)
        ?.focus();
    });
  }

  key(event: KeyboardEvent, ids: readonly string[], id: string): boolean {
    const index = ids.indexOf(id);
    if (index === -1) return false;
    const name = this.nameOf(id);
    const position = (i: number) => `${name}, position ${i + 1} of ${ids.length}`;
    const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;

    if (step !== 0 && (this.held?.id === id || event.altKey)) {
      const to = index + step;
      if (to < 0 || to >= ids.length) return true;
      const rest = ids.filter((other) => other !== id);
      this.#move({ id, after: rest[to - 1] ?? null, before: rest[to] ?? null, group: null });
      this.message = position(to);
      return true;
    }
    if (event.key === " " || event.key === "Enter") {
      if (this.held?.id === id) {
        this.held = null;
        this.message = `${position(index)}. Dropped.`;
      } else if (event.key === " ") {
        this.held = { id, after: ids[index - 1] ?? null, before: ids[index + 1] ?? null };
        this.message = `${position(index)}. Picked up. Use the arrow keys to move it, Space to drop it, Escape to cancel.`;
      } else {
        return false;
      }
      return true;
    }
    if (event.key === "Escape" && this.held?.id === id) {
      const { after, before } = this.held;
      this.held = null;
      this.#move({ id, after, before, group: null });
      this.message = `${name}: move cancelled.`;
      return true;
    }
    return false;
  }
}
