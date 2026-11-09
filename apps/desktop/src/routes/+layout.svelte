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
  The main window: one Study for every screen, plus the focus views that take
  over the window during a session. The tray panel (/panel) is a separate
  window and gets none of this.
-->
<script lang="ts">
  import "@headstart/ui/styles.css";
  import { getVersion } from "@tauri-apps/api/app";
  import { onMount, type Snippet } from "svelte";
  import { page } from "$app/state";
  import CompactTimer from "$lib/components/CompactTimer.svelte";
  import StartPicker from "$lib/components/StartPicker.svelte";
  import DevMenu from "$lib/components/DevMenu.svelte";
  import FocusView from "$lib/components/FocusView.svelte";
  import Lookahead from "$lib/components/Lookahead.svelte";
  import Onboarding from "$lib/components/Onboarding.svelte";
  import SessionComplete from "$lib/components/SessionComplete.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import { AppleSync } from "$lib/applecal.svelte.ts";
  import { Calendars } from "$lib/calendars.svelte.ts";
  import { provideApp } from "$lib/context.ts";
  import { Study } from "$lib/study.svelte.ts";
  import { inTauri } from "$lib/tauri.ts";
  import { followTheme } from "$lib/theme.ts";
  import { Updater } from "$lib/updater.svelte.ts";

  let { children }: { children: Snippet } = $props();

  const isPanel = page.url.pathname.startsWith("/panel");
  const study = isPanel ? null : new Study();
  const updater = isPanel ? null : new Updater();
  const calendars = study ? new Calendars(study) : null;
  const apple = study && calendars ? new AppleSync(study, calendars) : null;
  if (study && updater && calendars && apple) provideApp({ study, updater, calendars, apple });
  let version = $state("dev");
  let devOpen = $state(false);
  /** Shown once on a fresh install, decided when the saved progress has loaded. */
  let onboarding = $state<boolean | null>(null);
  $effect(() => {
    if (study?.ready && onboarding === null) {
      onboarding = study.mascot === null && study.courses.length === 0 && (study.state?.completedSessions ?? 0) === 0;
    }
  });

  // Light, dark or the computer's choice, from Settings.
  $effect(() => {
    if (study?.ready) return followTheme(study.settings.theme);
  });

  // "Reduce motion" in Settings stills every animation, like the system setting does.
  $effect(() => {
    document.documentElement.classList.toggle("hs-still", study?.settings.motion === "reduced");
  });

  onMount(() => {
    // Pause every animation while the window cannot be seen (closed to the tray, minimised).
    // The screen also ticks slower then (the shell keeps time for the tray).
    // A window left in the background for a minute also stops animating:
    // it is still visible, but nobody is looking at it closely.
    let away = false;
    let awayTimer: ReturnType<typeof setTimeout> | undefined;
    const pause = () => {
      document.documentElement.classList.toggle("hs-paused", document.hidden || away);
      study?.setHidden(document.hidden);
    };
    const blur = () => {
      clearTimeout(awayTimer);
      awayTimer = setTimeout(() => {
        away = true;
        pause();
      }, 60_000);
    };
    const focus = () => {
      clearTimeout(awayTimer);
      away = false;
      pause();
    };
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    const stopPausing = () => {
      clearTimeout(awayTimer);
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
    if (!study || !updater) return stopPausing;
    study.onCheckUpdates = () => updater.check();
    study.open().then(() => {
      calendars?.start();
      apple?.start();
    });
    if (inTauri) {
      getVersion().then((v) => {
        version = v;
      });
      if (import.meta.env.PROD) updater.check();
    }
    return () => {
      stopPausing();
      calendars?.stop();
      apple?.stop();
      study.close();
    };
  });
</script>

<svelte:window
  onkeydown={(e) => {
    // The developer menu has no button: only this key combination, and only with a developer token.
    if (study?.developer && e.code === "KeyD" && e.altKey && e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      devOpen = !devOpen;
    }
  }}
/>

{#if study?.profile === "debug"}
  <div class="debug-band" role="status">Debug profile{study.clockOffset ? ` · clock ahead ${Math.round(study.clockOffset / 3_600_000)} h` : ""}</div>
{/if}
{#if study?.developer}
  <DevMenu {study} bind:open={devOpen} />
{/if}

{#if !study}
  {@render children()}
{:else if study.layout === "compact" && (study.active || study.breakTimer)}
  <CompactTimer {study} />
{:else if onboarding && !study.active}
  <Onboarding {study} onDone={() => (onboarding = false)} />
{:else if study.active}
  <FocusView {study} />
{:else if study.completion}
  <SessionComplete {study} />
{:else}
  <div class="shell">
    <Sidebar {version} />
    <main>
      {#if study.error}
        <p class="load-error" role="alert">Could not open your saved progress: {study.error}</p>
      {:else}
        {@render children()}
      {/if}
    </main>
  </div>
  <StartPicker {study} />
  {#if study.lookaheadOpen}
    <Lookahead onClose={() => (study.lookaheadOpen = false)} />
  {/if}
{/if}

<style>
  .debug-band {
    position: fixed;
    z-index: 900;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 14px;
    border-radius: 0 0 10px 10px;
    background: #d7263d;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    pointer-events: none;
  }

  .shell {
    display: flex;
    min-height: 100vh;
  }

  main {
    flex: 1 1 auto;
    min-width: 0;
    padding: 30px 36px 48px;
  }

  .load-error {
    margin: 0;
    padding: 16px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-danger-soft);
    color: var(--hs-danger-strong);
    font-weight: 700;
  }
</style>
