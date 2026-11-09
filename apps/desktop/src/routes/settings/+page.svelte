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

<!-- Settings: session length, breaks, reminders, calendars, the weekly look-ahead, theme, motion, your study buddy and app updates. Every change saves at once. -->
<script lang="ts">
  import { MASCOTS } from "@headstart/content";
  import { addCalendar, FOCUS_LENGTHS, REMIND_BEFORE, removeCalendar, type Settings, type Theme } from "@headstart/core";
  import { lookFor, Mascot, MASCOT_NAMES, MASCOT_TINTS } from "@headstart/ui";
  import Select from "$lib/components/Select.svelte";
  import { useApp } from "$lib/context.ts";
  import { testNotification } from "$lib/shell.ts";

  const { study, updater, calendars, apple } = useApp();
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
  const THEME_CHOICES: { value: Theme; label: string; icon: string }[] = [
    { value: "system", label: "System", icon: "M3 5h18v11H3zM8 20h8M12 16v4" },
    {
      value: "light",
      label: "Light",
      icon: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8",
    },
    { value: "dark", label: "Dark", icon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" },
  ];
  // Calendars: links refreshed every hour, and imported files.
  let addingLink = $state(false);
  let linkName = $state("");
  let linkUrl = $state("");
  let calendarError = $state<string | null>(null);
  let fileInput = $state<HTMLInputElement>();

  function ago(ms: number): string {
    const minutes = Math.round((study.now - ms) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
  }

  async function addLink(): Promise<void> {
    const calendarId = study.newId();
    const result = await study.run((s) => addCalendar(s, { calendarId, name: linkName || "Schedule", url: linkUrl }));
    if (!result.ok) {
      calendarError = result.reason;
      return;
    }
    calendarError = null;
    addingLink = false;
    linkName = "";
    linkUrl = "";
    const link = study.state?.calendars.get(calendarId);
    if (link) calendarError = await calendars.refresh(link);
  }

  async function removeLink(id: string): Promise<void> {
    const result = await study.run((s) => removeCalendar(s, id));
    if (result.ok) calendars.forget(id);
  }

  async function importFile(event: Event): Promise<void> {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    calendarError = calendars.addFile(file.name, await file.text());
    (event.currentTarget as HTMLInputElement).value = "";
  }

  let connecting = $state(false);
  async function toggleApple(): Promise<void> {
    if (apple.on) {
      apple.disconnect();
      return;
    }
    connecting = true;
    calendarError = await apple.connect();
    connecting = false;
  }
  const appleGroups = $derived([
    {
      label: "",
      options: [
        ...apple.calendars.filter((c) => c.writable).map((c) => ({ value: c.id, label: c.title, hint: c.icloud ? "iCloud" : c.source })),
        { value: "new", label: "A new calendar: Headstart" },
      ],
    },
  ]);

  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayGroups = [{ label: "", options: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: WEEKDAYS[d] ?? "" })) }];
  const timeGroups = $derived([
    {
      label: "",
      options: [...new Set(["08:00", "12:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", settings.lookaheadTime])]
        .sort()
        .map((t) => ({ value: t, label: t })),
    },
  ]);

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

<section class="card" aria-labelledby="calendar-h">
  <h2 id="calendar-h">Calendars</h2>
  <p class="hint">Your schedule shows as busy time in the planner. Calendar data stays on this computer, and links are checked every hour.</p>
  {#if apple.available}
    <div class="row">
      <div class="text">
        <span class="name" id="apple-label">Apple Calendar</span>
        <span class="hint">
          {#if apple.on}
            Sessions you plan go to {apple.calendarName}, so they show on your phone too.{apple.lastSync ? ` Synced ${ago(apple.lastSync)}.` : ""}
          {:else if apple.status === "denied" || apple.status === "restricted"}
            Headstart has no access to your calendars. Allow it in System Settings, Privacy &amp; Security, Calendars.
          {:else}
            Add the sessions you plan to your calendar. Move one in Calendar and it moves here. macOS asks for access the first time.
          {/if}
        </span>
      </div>
      <div class="control">
        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked={apple.on}
          aria-labelledby="apple-label"
          disabled={connecting}
          onclick={toggleApple}
        >
          <span class="knob" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    {#if apple.on}
      <div class="row">
        <div class="text">
          <span class="name">Add sessions to</span>
          <span class="hint">A calendar of their own is easy to show or hide.</span>
        </div>
        <div class="control">
          <Select
            value={apple.saved.calendarId ?? "new"}
            groups={appleGroups}
            label="Calendar for sessions"
            onchange={async (v) => (calendarError = await apple.setCalendar(String(v)))}
          />
        </div>
      </div>
      <div class="row">
        <div class="text">
          <span class="name" id="twoway-label">Changes in Calendar update Headstart</span>
          <span class="hint">Moving, resizing or deleting a session in Calendar changes the plan here.</span>
        </div>
        <div class="control">
          <button
            type="button"
            class="switch"
            role="switch"
            aria-checked={apple.saved.twoWay}
            aria-labelledby="twoway-label"
            onclick={() => apple.setTwoWay(!apple.saved.twoWay)}
          >
            <span class="knob" aria-hidden="true"></span>
          </button>
        </div>
      </div>
      <div class="row busy-row">
        <div class="text">
          <span class="name">Show as busy</span>
          <span class="hint">Headstart only reads these calendars and never plans on top of them.</span>
        </div>
        <div class="checks">
          {#each apple.calendars.filter((c) => c.id !== apple.saved.calendarId) as cal (cal.id)}
            <label class="check">
              <input type="checkbox" checked={apple.saved.busyIds.includes(cal.id)} onchange={() => apple.toggleBusy(cal.id)} />
              <span>{cal.title}</span><small>{cal.icloud ? "iCloud" : cal.source}</small>
            </label>
          {/each}
        </div>
      </div>
    {/if}
    {#if apple.error}<p class="error inline" role="alert">{apple.error}</p>{/if}
  {/if}
  {#each calendars.links as link (link.id)}
    {@const status = calendars.status(link.id)}
    <div class="row">
      <div class="text">
        <span class="name">{link.name}</span>
        <span class="hint url">{link.url}</span>
        <span class="hint" class:bad={status.error}>
          {#if status.fetching}Fetching…{:else if status.error}{status.error}{:else if status.fetchedAt}Updated {ago(status.fetchedAt)}{status.count ? ` · ${status.count} events coming up` : ""}{:else}Not fetched yet{/if}
        </span>
      </div>
      <div class="control buttons">
        <button type="button" class="secondary" disabled={status.fetching} onclick={async () => (calendarError = await calendars.refresh(link))}>Refresh</button>
        <button type="button" class="secondary" onclick={() => removeLink(link.id)}>Remove</button>
      </div>
    </div>
  {/each}
  {#each calendars.files as file (file.id)}
    <div class="row">
      <div class="text">
        <span class="name">{file.name}</span>
        <span class="hint">Imported file · {file.count} events coming up</span>
      </div>
      <div class="control">
        <button type="button" class="secondary" onclick={() => calendars.removeFile(file.id)}>Remove</button>
      </div>
    </div>
  {/each}
  {#if addingLink}
    <form
      class="row link-form"
      onsubmit={(e) => {
        e.preventDefault();
        addLink();
      }}
    >
      <label class="field">
        <span>Name</span>
        <input type="text" bind:value={linkName} maxlength="60" placeholder="TimeEdit" />
      </label>
      <label class="field wide">
        <span>Link</span>
        <input type="text" bind:value={linkUrl} placeholder="https://cloud.timeedit.net/…/schedule.ics" required />
      </label>
      <div class="buttons">
        <button type="submit" class="primary">Add link</button>
        <button type="button" class="secondary" onclick={() => (addingLink = false)}>Cancel</button>
      </div>
      <p class="hint">In TimeEdit, Canvas or your calendar app, look for "Subscribe" or "Copy link". A webcal:// link works too.</p>
    </form>
  {:else}
    <div class="row">
      <div class="buttons">
        <button type="button" class="secondary" onclick={() => (addingLink = true)}>Add a link</button>
        <button type="button" class="secondary" onclick={() => fileInput?.click()}>Import .ics file</button>
        <input bind:this={fileInput} type="file" accept=".ics,text/calendar" hidden onchange={importFile} />
      </div>
    </div>
  {/if}
  {#if calendarError}<p class="error inline" role="alert">{calendarError}</p>{/if}
</section>

<section class="card" aria-labelledby="week-h">
  <h2 id="week-h">Weekly planning</h2>
  <div class="row">
    <div class="text">
      <span class="name" id="lookahead-label">Weekly look-ahead</span>
      <span class="hint">A two-minute look back at the week and a nudge to plan the next one. Off unless you want it.</span>
    </div>
    <div class="control">
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={settings.weeklyLookahead}
        aria-labelledby="lookahead-label"
        onclick={() => save({ weeklyLookahead: !settings.weeklyLookahead, lookaheadOffered: true })}
      >
        <span class="knob" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  {#if settings.weeklyLookahead}
    <div class="row">
      <div class="text">
        <span class="name">When</span>
        <span class="hint">A notification opens it. If you miss it, it waits on Today until the next evening.</span>
      </div>
      <div class="control buttons">
        <Select value={settings.lookaheadDay} groups={dayGroups} label="Day" onchange={(v) => save({ lookaheadDay: v })} />
        <Select value={settings.lookaheadTime} groups={timeGroups} label="Time" onchange={(v) => save({ lookaheadTime: v })} />
      </div>
    </div>
  {/if}
</section>

<section class="card" aria-labelledby="look-h">
  <h2 id="look-h">Look and feel</h2>
  <div class="row">
    <div class="text">
      <span class="name" id="theme-label">Theme</span>
      <span class="hint">System follows your computer's light or dark mode, and changes with it.</span>
    </div>
    <div class="control">
      <div class="segments" role="group" aria-labelledby="theme-label">
        {#each THEME_CHOICES as choice (choice.value)}
          <button
            type="button"
            class="segment"
            aria-pressed={settings.theme === choice.value}
            onclick={() => settings.theme !== choice.value && save({ theme: choice.value })}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={choice.icon} /></svg>
            {choice.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
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

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .control.buttons {
    flex-basis: auto;
    flex-wrap: nowrap;
  }

  .url {
    font-size: 12.5px;
    word-break: break-all;
  }

  .hint.bad {
    color: var(--hs-danger);
    font-weight: 700;
  }

  .link-form {
    align-items: flex-end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 0 0 180px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .field.wide {
    flex: 1 1 280px;
  }

  .field input {
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

  .error.inline {
    margin: 0 0 8px;
  }

  .busy-row {
    align-items: flex-start;
  }

  .checks {
    flex: 1 1 260px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }

  .check input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--hs-accent);
  }

  .check small {
    font-weight: 600;
    color: var(--hs-ink-subtle);
  }

  .switch {
    position: relative;
    width: 52px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--hs-field-line);
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
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
    transition: transform 0.15s;
  }

  .switch[aria-checked="true"] .knob {
    transform: translateX(22px);
  }

  /* On the light lavender of the dark theme, a dark knob reads better. */
  :global(:root[data-theme="dark"]) .switch[aria-checked="true"] .knob {
    background: var(--hs-on-accent);
  }

  /* The theme choice: the current one is filled, the others are plain. */
  .segments {
    display: flex;
    gap: 3px;
    padding: 3px;
    border-radius: 12px;
    background: var(--hs-raised);
    border: 1px solid var(--hs-line);
  }

  .segment {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 38px;
    padding: 0 14px;
    border: 0;
    border-radius: 9px;
    background: none;
    font: inherit;
    font-size: 15px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .segment svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .segment:not([aria-pressed="true"]):hover {
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .segment[aria-pressed="true"] {
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    cursor: default;
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
    color: var(--hs-on-accent);
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
    color: var(--hs-danger);
    font-weight: 700;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
