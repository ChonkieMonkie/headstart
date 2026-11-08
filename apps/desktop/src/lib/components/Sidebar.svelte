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

<!-- Main navigation with the level and Insight at a glance. Screens that are not built yet are shown, but disabled. -->
<script lang="ts">
  import { Logo, InsightIcon } from "@headstart/ui";
  import { page } from "$app/state";
  import { useApp } from "$lib/context.ts";

  let { version }: { version: string } = $props();
  const { study, updater } = useApp();

  const NAV = [
    { href: "/", label: "Today", icon: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8" },
    { href: "/courses", label: "Courses", icon: "M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" },
    { href: "/stats", label: "Stats", icon: "M5 20V12M10 20V6M15 20v-6M20 20V9" },
    { href: null, label: "Week plan", icon: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" },
    { href: "/collection", label: "Collection", icon: "M12 3l2.6 5.4 5.9.7-4.4 4 1.2 5.9L12 16.1 6.7 19l1.2-5.9-4.4-4 5.9-.7z" },
    { href: "/crates", label: "Crates", icon: "M3 8l9-4.5L21 8v8.5L12 21l-9-4.5zM3 8l9 4.5L21 8M12 12.5V21" },
    {
      href: "/settings",
      label: "Settings",
      icon: "M18.7 9.9L21.5 10.4L21.5 13.6L18.7 14.1L18.2 15.3L19.8 17.5L17.5 19.8L15.3 18.2L14.1 18.7L13.6 21.5L10.4 21.5L9.9 18.7L8.7 18.2L6.5 19.8L4.2 17.5L5.8 15.3L5.3 14.1L2.5 13.6L2.5 10.4L5.3 9.9L5.8 8.7L4.2 6.5L6.5 4.2L8.7 5.8L9.9 5.3L10.4 2.5L13.6 2.5L14.1 5.3L15.3 5.8L17.5 4.2L19.8 6.5L18.2 8.7ZM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
    },
  ];

  const current = (href: string) =>
    href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href);
  const level = $derived(study.summary?.level);
  const waiting = $derived(study.summary?.cratesWaiting ?? 0);
</script>

<nav class="sidebar" aria-label="Main">
  <div class="brand">
    <Logo size={36} />
    <span class="wordmark">Head<span class="accent">start</span></span>
  </div>

  <ul>
    {#each NAV as item (item.label)}
      <li>
        {#if item.href}
          <a class="nav-item" class:active={current(item.href)} href={item.href} aria-current={current(item.href) ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
            {item.label}
            {#if item.href === "/crates" && waiting > 0}
              <span class="badge">{waiting}<span class="visually-hidden"> waiting</span></span>
            {/if}
          </a>
        {:else}
          <span class="nav-item disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
            {item.label}
            <span class="soon">Soon</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>

  {#if level}
    <div class="level" aria-label="Level {level.level}, {level.xpIntoLevel} of {level.xpForNextLevel} XP">
      <div class="level-row">
        <span class="level-name">Level {level.level}</span>
        <span class="level-xp">{level.xpIntoLevel} / {level.xpForNextLevel} XP</span>
      </div>
      <div class="bar" aria-hidden="true">
        <div class="bar-fill" style:width="{(level.xpIntoLevel / level.xpForNextLevel) * 100}%"></div>
      </div>
      <p class="insight">{study.summary?.stardust ?? 0} <InsightIcon size={14} /> Insight</p>
    </div>
  {/if}

  <div class="footer">
    <span>Version {version}</span>
    {#if updater.status.kind === "available"}
      <button type="button" class="link strong" onclick={() => updater.install()}>
        Update to {updater.status.version}
      </button>
    {:else}
      <button
        type="button"
        class="link"
        disabled={updater.status.kind === "checking" || updater.status.kind === "installing"}
        onclick={() => updater.check()}
      >
        {#if updater.status.kind === "checking"}Checking…{:else if updater.status.kind === "up-to-date"}Up to date{:else if updater.status.kind === "installing"}Installing…{:else}Check for updates{/if}
      </button>
    {/if}
    {#if updater.status.kind === "error"}
      <span class="error" role="status">{updater.status.message}</span>
    {/if}
  </div>
</nav>

<style>
  .sidebar {
    position: sticky;
    top: 0;
    flex: 0 0 232px;
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px 14px 16px;
    background: var(--hs-surface);
    border-right: 1px solid var(--hs-line);
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
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
    gap: 10px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    font-weight: 700;
    color: var(--hs-ink-muted);
    text-decoration: none;
  }

  a.nav-item:hover {
    background: var(--hs-ground);
  }

  .nav-item.active {
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .nav-item.disabled {
    color: var(--hs-ink-disabled);
  }

  .nav-item:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
    flex: none;
  }

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .badge {
    margin-left: auto;
    min-width: 22px;
    padding: 2px 7px;
    box-sizing: border-box;
    border-radius: 999px;
    background: var(--hs-gold);
    color: var(--hs-on-gold);
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .soon {
    margin-left: auto;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--hs-ground);
    font-size: 11px;
    font-weight: 800;
    color: var(--hs-ink-subtle);
  }

  .level {
    margin-top: auto;
    padding: 12px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-ground);
  }

  .level-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .level-name {
    font-family: var(--hs-font-display);
    font-weight: 600;
  }

  .level-xp,
  .insight {
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .bar {
    height: 8px;
    margin: 8px 0;
    border-radius: 999px;
    background: var(--hs-line);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--hs-accent);
  }

  .insight {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
  }

  .footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .link {
    min-height: 28px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--hs-accent-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .link.strong {
    font-weight: 800;
  }

  .link:disabled {
    color: var(--hs-ink-subtle);
    text-decoration: none;
    cursor: default;
  }

  .error {
    color: var(--hs-danger);
  }
</style>
