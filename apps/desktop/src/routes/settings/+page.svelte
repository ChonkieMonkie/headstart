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

<!-- Settings: session length, breaks, reminders, motion, your study buddy and app updates. Every change saves at once. -->
<script lang="ts">
  import { MASCOTS } from "@headstart/content";
  import { FOCUS_LENGTHS, REMIND_BEFORE, type Settings } from "@headstart/core";
  import { lookFor, Mascot, MASCOT_NAMES, MASCOT_TINTS } from "@headstart/ui";
  import Select from "$lib/components/Select.svelte";
  import { useApp } from "$lib/context.ts";
  import { testNotification } from "$lib/shell.ts";

  const { study, updater } = useApp();
  const shortcut = /Mac/.test(navigator.userAgent) ? "⌥⇧H" : "Alt+Shift+H";

  let saved = $state<string | null>(null);
  let error = $state<string | null>(null);
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  const settings = $derived(study.settings);

  async function save(changes: Partial<Settings>): Promise<void> {
    error = await study.saveSettings(changes);
    if (error) return;
    saved = "Saved";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved = null), 1600);
  }

  let testSent = $state<string | null>(null);
  async function sendTest(): Promise<void> {
    const sent = await testNotification(settings.chime);
    testSent = sent
      ? "Sent. If nothing showed up, allow Headstart in your system's notification settings."
      : "Notifications only work in the installed app.";
  }

  const lengthGroups = [{ label: "", options: FOCUS_LENGTHS.map((m) => ({ value: m, label: `${m} minutes` })) }];
  const beforeGroups = [
    {
      label: "",
      options: [
        { value: 0, label: "No reminder" },
        ...REMIND_BEFORE.map((m) => ({ value: m, label: `${m} ${m === 1 ? "minute" : "minutes"} before` })),
      ],
    },
  ];
  const nudgeGroups = [
    {
      label: "",
      options: [0, 1, 2, 3, 5].map((n) => ({
        value: n,
        label: n === 0 ? "No nudges" : `At most ${n} a day`,
      })),
    },
  ];
  const motionGroups = [
    {
      label: "",
      options: [
        { value: "system", label: "Follow my computer" },
        { value: "reduced", label: "Keep things still" },
      ],
    },
  ];
</script>

<header class="top">
  <div>
    <h1>Settings</h1>
    <p class="lead">Changes are saved right away.</p>
  </div>
  <p class="saved" role="status" aria-live="polite">{saved ?? ""}</p>
</header>

{#if error}<p class="error" role="alert">{error}</p>{/if}

<section class="card" aria-labelledby="focus-h">
  <h2 id="focus-h">Focus sessions</h2>
  <div class="row">
    <div class="text">
      <span class="name" id="length-label">Session length</span>
      <span class="hint">For sessions you start without a plan, from Today, the tray or {shortcut}.</span>
    </div>
    <div class="control">
      <Select
        value={settings.focusMinutes}
        groups={lengthGroups}
        label="Session length"
        onchange={(v) => save({ focusMinutes: v })}
      />
    </div>
  </div>
  <div class="row">
    <div class="text">
      <span class="name" id="break-label">Start the break by itself</span>
      <span class="hint">A short break starts when a session ends. Every fourth break is a longer one.</span>
    </div>
    <div class="control">
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={settings.autoBreak}
        aria-labelledby="break-label"
        onclick={() => save({ autoBreak: !settings.autoBreak })}
      >
        <span class="knob" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  <div class="row">
    <div class="text">
      <span class="name" id="next-label">Start the next session after the break</span>
      <span class="hint">When a break ends, the next session starts after a 10 second countdown that you can stop.</span>
    </div>
    <div class="control">
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={settings.autoStartNext}
        aria-labelledby="next-label"
        onclick={() => save({ autoStartNext: !settings.autoStartNext })}
      >
        <span class="knob" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  <div class="row">
    <div class="text">
      <span class="name" id="chime-label">Play a sound</span>
      <span class="hint">A short chime with the notification when a session or a break ends.</span>
    </div>
    <div class="control">
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={settings.chime}
        aria-labelledby="chime-label"
        onclick={() => save({ chime: !settings.chime })}
      >
        <span class="knob" aria-hidden="true"></span>
      </button>
    </div>
  <div class="row">
    <div class="text">
      <span class="name">Notifications</span>
      <span class="hint">{testSent ?? "Headstart notifies you when a session ends, the break starts and the break is over."}</span>
    </div>
    <div class="control">
      <button type="button" class="secondary" onclick={sendTest}>Send a test notification</button>
    </div>
  </div>
  </div>
</section>

<section class="card" aria-labelledby="remind-h">
  <h2 id="remind-h">Reminders</h2>
  <div class="row">
    <div class="text">
      <span class="name">Before a planned session</span>
      <span class="hint">A notification just before it starts.</span>
    </div>
    <div class="control">
      <Select
        value={settings.remindBeforeMinutes ?? 0}
        groups={beforeGroups}
        label="Reminder before a planned session"
        onchange={(v) => save({ remindBeforeMinutes: v === 0 ? null : v })}
      />
    </div>
  </div>
  <div class="row">
    <div class="text">
      <span class="name">Nudges</span>
      <span class="hint">One gentle nudge ten minutes after a planned session should have started.</span>
    </div>
    <div class="control">
      <Select
        value={settings.maxNudgesPerDay}
        groups={nudgeGroups}
        label="Nudges"
        onchange={(v) => save({ maxNudgesPerDay: v })}
      />
    </div>
  </div>
</section>

<section class="card" aria-labelledby="look-h">
  <h2 id="look-h">Look and feel</h2>
  <div class="row">
    <div class="text">
      <span class="name">Motion</span>
      <span class="hint">Keep the mascot, crates and auras still. Your computer's "reduce motion" setting is followed either way.</span>
    </div>
    <div class="control">
      <Select
        value={settings.motion}
        groups={motionGroups}
        label="Motion"
        onchange={(v) => save({ motion: v as Settings["motion"] })}
      />
    </div>
  </div>
  <div class="row">
    <div class="text">
      <span class="name" id="buddy-label">Study buddy</span>
      <span class="hint">Each one keeps its own outfit. Dress them up in the <a href="/collection">Collection</a>.</span>
    </div>
    <div class="control buddies" role="group" aria-labelledby="buddy-label">
      {#each MASCOTS as m (m)}
        <button
          type="button"
          class="buddy"
          aria-pressed={study.mascot === m}
          style:background={MASCOT_TINTS[m]}
          onclick={() => study.chooseMascot(m)}
        >
          <Mascot look={lookFor(m, study.equippedOf(m), study.catalog)} size={56} still label="" />
          <span>{MASCOT_NAMES[m]}</span>
        </button>
      {/each}
    </div>
  </div>
</section>

<section class="card" aria-labelledby="about-h">
  <h2 id="about-h">About</h2>
  <div class="row">
    <div class="text">
      <span class="name">Updates</span>
      <span class="hint">Headstart checks for updates when it starts and installs them when you say so.</span>
    </div>
    <div class="control">
      {#if updater.status.kind === "available"}
        <button type="button" class="primary" onclick={() => updater.install()}>Update to {updater.status.version}</button>
      {:else}
        <button
          type="button"
          class="secondary"
          disabled={updater.status.kind === "checking" || updater.status.kind === "installing"}
          onclick={() => updater.check()}
        >
          {#if updater.status.kind === "checking"}Checking…{:else if updater.status.kind === "up-to-date"}Up to date{:else if updater.status.kind === "installing"}Installing…{:else}Check for updates{/if}
        </button>
      {/if}
    </div>
  </div>
  <p class="hint">
    Your data stays on this computer. Headstart is free software under the GNU GPL, version 3 or later.
  </p>
</section>

<style>
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.1rem;
  }

  .lead {
    margin: 4px 0 0;
    color: var(--hs-ink-muted);
  }

  .saved {
    margin: 0;
    min-height: 1.4em;
    font-weight: 800;
    color: var(--hs-success-strong);
  }

  .card {
    display: flex;
    flex-direction: column;
    max-width: 820px;
    margin-bottom: 18px;
    padding: 8px 22px 14px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  h2 {
    margin: 12px 0 4px;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.25rem;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    padding: 14px 0;
    border-top: 1px solid var(--hs-line);
  }

  h2 + .row {
    border-top: 0;
  }

  .text {
    flex: 1 1 300px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    font-weight: 800;
  }

  .hint {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-ink-muted);
  }

  p.hint {
    padding: 10px 0 4px;
  }

  .hint a {
    color: var(--hs-accent-strong);
    font-weight: 700;
  }

  .control {
    flex: 0 0 240px;
    display: flex;
    justify-content: flex-end;
  }

  .control :global(.select) {
    width: 100%;
  }

  .switch {
    position: relative;
    width: 52px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: #c9cfdc;
    cursor: pointer;
    transition: background 0.15s;
  }

  .switch[aria-checked="true"] {
    background: var(--hs-accent);
  }

  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgb(27 34 54 / 0.3);
    transition: transform 0.15s;
  }

  .switch[aria-checked="true"] .knob {
    transform: translateX(22px);
  }

  .buddies {
    gap: 8px;
  }

  .buddy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 76px;
    padding: 6px 4px 8px;
    border: 2px solid transparent;
    border-radius: 14px;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink);
    cursor: pointer;
  }

  .buddy[aria-pressed="true"] {
    border-color: var(--hs-accent);
  }

  .primary,
  .secondary {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--hs-accent);
    color: #fff;
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .secondary:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .error {
    margin: 0 0 18px;
    color: #b42318;
    font-weight: 700;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
