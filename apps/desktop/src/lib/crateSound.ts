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

// Crate sounds, made with Web Audio so no sound files ship: a soft thud and a
// rising note for every hop, and a chime per rarity on the reveal. They follow
// the system volume. Off until turned on; the choice is kept per computer
// (localStorage).

import type { Rarity } from "@headstart/content";

const KEY = "headstart.crateSound";

export function crateSoundOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setCrateSound(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Not saved; the choice lasts until the app closes.
  }
}

/** Notes (in semitones above A4) and their start times in seconds. */
const TUNES: Record<Rarity, [number, number][]> = {
  common: [[3, 0]],
  uncommon: [
    [3, 0],
    [7, 0.09],
  ],
  rare: [
    [3, 0],
    [7, 0.08],
    [10, 0.16],
  ],
  epic: [
    [-9, 0],
    [3, 0.05],
    [7, 0.05],
    [10, 0.3],
    [15, 0.42],
  ],
  legendary: [
    [3, 0],
    [7, 0.1],
    [10, 0.2],
    [15, 0.3],
    [19, 0.42],
    [22, 0.54],
    [15, 0.54],
  ],
};

let audio: AudioContext | null = null;

function tone(
  freq: number,
  at: number,
  length: number,
  volume: number,
  type: OscillatorType,
): void {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/** One hop: a soft low thud on landing and a note that rises with each rarity step. */
export function playHop(step: number, landingIn: number): void {
  if (!crateSoundOn() || typeof AudioContext === "undefined") return;
  try {
    audio ??= new AudioContext();
    const start = audio.currentTime + 0.01;
    tone(440 * 2 ** ((3 + step * 4) / 12), start + 0.04, 0.22, 0.05, "sine");
    tone(110, start + landingIn, 0.16, 0.09, "triangle");
  } catch {
    // Sound is a nicety; never let it break opening a crate.
  }
}

export function playReveal(rarity: Rarity): void {
  if (!crateSoundOn() || typeof AudioContext === "undefined") return;
  try {
    audio ??= new AudioContext();
    const start = audio.currentTime + 0.02;
    for (const [semitone, at] of TUNES[rarity]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = rarity === "common" ? "sine" : "triangle";
      osc.frequency.value = 440 * 2 ** (semitone / 12);
      const t = start + at;
      const length = rarity === "legendary" || rarity === "epic" ? 0.7 : 0.35;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + length + 0.05);
    }
  } catch {
    // Sound is a nicety; never let it break opening a crate.
  }
}
