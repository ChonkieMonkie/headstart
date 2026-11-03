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

<!-- Early home screen: proves the shell, tray, updater and saved progress work on every OS. -->
<script lang="ts">
  import { APP_NAME, formatMinutes, formatPercent } from "@headstart/core";
  import { Logo, rarityColors } from "@headstart/ui";
  import { getVersion } from "@tauri-apps/api/app";
  import { listen } from "@tauri-apps/api/event";
  import { onMount } from "svelte";
  import { Study } from "$lib/study.svelte.ts";
  import { inTauri } from "$lib/tauri.ts";
  import { Updater } from "$lib/updater.svelte.ts";

  const updater = new Updater();
  const study = new Study();
  let version = $state("dev");
  let trayMessage = $state("");

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const rarityName = (rarity: string) => rarity.charAt(0).toUpperCase() + rarity.slice(1);

  const nav = ["Today", "Plan", "Courses", "Stats", "Collection", "Crates", "Settings"];

  onMount(() => {
    study.open();
    if (!inTauri) return;
    getVersion().then((v) => {
      version = v;
    });
    const unlisteners = [
      listen("tray://check-updates", () => updater.check()),
      listen("tray://start-session", () => {
        trayMessage = "Focus sessions arrive in milestone M2.";
      }),
    ];
    if (import.meta.env.PROD) updater.check();
    return () => {
      for (const unlisten of unlisteners) unlisten.then((fn) => fn());
    };
  });
</script>

<div class="shell">
  <nav class="sidebar" aria-label="Main">
    <div class="brand">
      <Logo size={36} />
      <span class="wordmark">Head<span class="accent">start</span></span>
    </div>
    <ul>
      {#each nav as item, i (item)}
        <li>
          <span class="nav-item" class:active={i === 0} aria-current={i === 0 ? "page" : undefined}>
            {item}
          </span>
        </li>
      {/each}
    </ul>
  </nav>

  <main>
    <header>
      <p class="date">{today}</p>
      <h1>{greeting}</h1>
    </header>

    <section class="card" aria-labelledby="welcome-h">
      <Logo size={96} />
      <div class="card-body">
        <h2 id="welcome-h">{APP_NAME} is up and running</h2>
        <p>
          This is an early build. It installs, lives in the menu bar or system tray, updates itself
          and keeps your progress in a local database. The study screens arrive in the next
          milestones.
        </p>
        {#if trayMessage}
          <p class="note" role="status">{trayMessage}</p>
        {/if}
      </div>
    </section>

    <section class="card progress" aria-labelledby="progress-h">
      <div class="card-body">
        <h2 id="progress-h">Your progress</h2>
        {#if study.error}
          <p role="alert">Could not open your saved progress: {study.error}</p>
        {:else if study.summary}
          {@const s = study.summary}
          <div class="level">
            <span class="level-number">Level {s.level.level}</span>
            <span class="level-xp">{s.level.xpIntoLevel} / {s.level.xpForNextLevel} XP</span>
          </div>
          <div
            class="bar"
            role="progressbar"
            aria-label="XP toward the next level"
            aria-valuemin="0"
            aria-valuemax={s.level.xpForNextLevel}
            aria-valuenow={s.level.xpIntoLevel}
          >
            <div class="bar-fill" style:width="{(s.level.xpIntoLevel / s.level.xpForNextLevel) * 100}%"></div>
          </div>
          <dl class="stats">
            <div><dt>Sessions</dt><dd>{s.sessions}</dd></div>
            <div><dt>Focus time</dt><dd>{formatMinutes(s.focusMinutes)}</dd></div>
            <div><dt>Next Study Crate</dt><dd>{s.crateProgress} of {s.crateEvery}</dd></div>
            <div><dt>Stardust</dt><dd>{s.stardust}</dd></div>
            <div><dt>Items</dt><dd>{s.itemsOwned}</dd></div>
          </dl>
        {:else}
          <p>Loading…</p>
        {/if}
      </div>
    </section>

    {#if study.summary}
      <section class="card" aria-labelledby="odds-h">
        <div class="card-body">
          <h2 id="odds-h">Study Crate odds</h2>
          <p>Chance per crate. Bad luck has a ceiling, so Epic and Legendary are also guaranteed.</p>
          <ul class="odds">
            {#each study.summary.studyCrateOdds as row (row.rarity)}
              <li>
                <span class="dot" style:background={rarityColors[row.rarity].dot} aria-hidden="true"></span>
                <span class="odds-name" style:color={rarityColors[row.rarity].fg}>{rarityName(row.rarity)}</span>
                <span class="odds-pct">{formatPercent(row.percent)}</span>
                {#if row.guaranteedWithin !== null}
                  <span class="odds-pity">
                    guaranteed within {row.guaranteedWithin} crates
                    {#if row.guaranteedIn !== row.guaranteedWithin}
                      <span class="odds-next">· next within {row.guaranteedIn}</span>
                    {/if}
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      </section>
    {/if}

    <section class="card update" aria-labelledby="update-h">
      <div class="card-body">
        <h2 id="update-h">Version {version}</h2>
        <p role="status" aria-live="polite">
          {#if updater.status.kind === "idle"}
            Updates are checked automatically when the app starts.
          {:else if updater.status.kind === "checking"}
            Checking for updates…
          {:else if updater.status.kind === "up-to-date"}
            You have the latest version.
          {:else if updater.status.kind === "available"}
            Version {updater.status.version} is ready to install.
          {:else if updater.status.kind === "installing"}
            Installing update{updater.status.percent === null ? "…" : ` (${updater.status.percent}%)`}
          {:else}
            Could not check for updates: {updater.status.message}
          {/if}
        </p>
      </div>
      {#if updater.status.kind === "available"}
        <button type="button" class="primary" onclick={() => updater.install()}>Update and restart</button>
      {:else}
        <button
          type="button"
          class="secondary"
          onclick={() => updater.check()}
          disabled={updater.status.kind === "checking" || updater.status.kind === "installing"}
        >
          Check for updates
        </button>
      {/if}
    </section>
  </main>
</div>

<style>
  .shell {
    display: flex;
    flex-wrap: wrap;
    min-height: 100vh;
  }

  .sidebar {
    flex: 1 1 220px;
    max-width: 260px;
    padding: 22px 14px;
    background: var(--hs-surface);
    border-right: 1px solid var(--hs-line);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 18px;
  }

  .wordmark {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 22px;
  }

  .accent {
    color: var(--hs-accent);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .nav-item.active {
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  main {
    flex: 999 1 560px;
    min-width: 0;
    padding: 30px 36px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .date {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.1rem;
  }

  .card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 22px;
    padding: 22px;
    background: var(--hs-surface);
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
  }

  .card-body {
    flex: 1 1 320px;
    min-width: 0;
  }

  h2 {
    margin: 0 0 6px;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.4rem;
  }

  p {
    margin: 0;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .note {
    margin-top: 10px;
    color: var(--hs-accent-strong);
    font-weight: 700;
  }

  button {
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

  .level {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 4px 0 8px;
  }

  .level-number {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.25rem;
  }

  .level-xp {
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--hs-line);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--hs-accent);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin: 16px 0 0;
  }

  .stats dt {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .stats dd {
    margin: 2px 0 0;
    font-size: 1.2rem;
    font-weight: 800;
  }

  .odds {
    margin-top: 14px;
    gap: 8px;
  }

  .odds li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 10px;
    row-gap: 2px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }

  .odds-name {
    min-width: 92px;
    font-weight: 800;
  }

  .odds-pct {
    min-width: 48px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .odds-pity {
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .odds-next {
    color: var(--hs-accent-strong);
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
