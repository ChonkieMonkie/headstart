/*
 * Headstart, a study companion that helps you get started, stay focused and keep going.
 * Copyright (C) 2026  ChonkieMonkie
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Sets the light or dark theme before the first paint, from the copy that
// src/lib/theme.ts keeps. A plain file, since the app's CSP allows no inline script.
(() => {
  let choice = "system";
  try {
    choice = localStorage.getItem("headstart.theme") || "system";
  } catch {
    // no storage: follow the computer
  }
  const dark =
    choice === "dark" || (choice !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
