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

<!-- Settings: the focus tools of this computer. The distraction guard with its list of apps, and Do Not Disturb during sessions. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fromSystem, sameApp, suggestions } from "$lib/focusTools.svelte.ts";
  import { type AppInfo, type DndStatus, dnd, type GuardedApp, guard } from "$lib/shell.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();
  const tools = $derived(study.tools);

  let support = $state<{ supported: boolean; reason: string | null } | null>(null);
  let quiet = $state<DndStatus | null>(null);
  onMount(() => {
    guard.support().then((s) => (support = s));
    dnd.status().then((s) => (quiet = s));
  });

  function setGuard(on: boolean): void {
    tools.setGuard(on);
    if (on && tools.apps.length === 0) openPicker();
    study.toolsChanged();
  }

  // "Add an app": suggestions, the apps open right now, and any other app.
  let adding = $state(false);
  let loading = $state(false);
  let running = $state<AppInfo[]>([]);
  let installed = $state<AppInfo[]>([]);
  let search = $state("");

  async function openPicker(): Promise<void> {
    adding = true;
    loading = true;
    const apps = await guard.apps().catch(() => ({ running: [], installed: [] }));
    running = apps.running;
    installed = apps.installed;
    loading = false;
  }

  const isGuarded = (app: GuardedApp) => tools.apps.some((g) => sameApp(g, app));
  const suggested = $derived(suggestions(tools.apps, installed));
  const openNow = $derived(running.map(fromSystem).filter((app) => !isGuarded(app)));
  const typed = $derived(search.trim());
  const found = $derived(
    typed
      ? installed
          .filter((app) => app.name.toLowerCase().includes(typed.toLowerCase()))
          .map(fromSystem)
          .filter((app) => !isGuarded(app))
          .slice(0, 8)
      : [],
  );
  const typedApp = $derived<GuardedApp>({ name: typed, ids: [] });
  const canAddTyped = $derived(typed !== "" && !isGuarded(typedApp) && !found.some((app) => sameApp(app, typedApp)));

  function add(app: GuardedApp): void {
    tools.add(app);
    study.toolsChanged();
  }

  function addTyped(): void {
    if (found.length === 1 && found[0]) add(found[0]);
    else if (canAddTyped) add(typedApp);
    else return;
    search = "";
  }

  function remove(app: GuardedApp): void {
    tools.remove(app);
    study.toolsChanged();
  }

  // Do Not Disturb.
  let checking = $state(false);
  let trying = $state<"idle" | "on" | "done">("idle");
  let quietError = $state<string | null>(null);

  async function checkAgain(): Promise<void> {
    checking = true;
    quiet = await dnd.status();
    checking = false;
    if (!quiet.ready && tools.dndOn) setQuiet(false);
  }

  function setQuiet(on: boolean): void {
    tools.setDnd(on);
    study.toolsChanged();
  }

  /** Turns the Focus on for ten seconds, so the user sees that both Shortcuts work. */
  async function tryIt(): Promise<void> {
    quietError = null;
    trying = "on";
    try {
      await dnd.set(true);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      // A session that started meanwhile keeps its Focus.
      if (!study.dndActive) await dnd.set(false);
      trying = "done";
    } catch (error) {
      quietError = String(error);
      trying = "idle";
    }
  }
</script>

<section class="card" aria-labelledby="tools-h">
  <h2 id="tools-h">Focus tools</h2>
  <div class="row">
    <div class="text">
      <span class="name" id="guard-label">Distraction guard</span>
      <span class="hint">
        {#if support && !support.supported}
          {support.reason}
        {:else}
          During a session, a small card asks if you want to go back when one of your chosen apps has been in front for 10
          seconds. Headstart never looks inside the app and never saves which app it was.
        {/if}
      </span>
    </div>
    <div class="control">
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={tools.guardOn && support?.supported !== false}
        aria-labelledby="guard-label"
        disabled={support?.supported === false}
        onclick={() => setGuard(!tools.guardOn)}
      >
        <span class="knob" aria-hidden="true"></span>
      </button>
    </div>
  </div>

  {#if tools.guardOn && support?.supported !== false}
    <div class="block">
      <ul class="apps" aria-label="Guarded apps">
        {#each tools.apps as app (app.name)}
          <li class="app">
            <span class="initial" aria-hidden="true">{app.name.slice(0, 1).toUpperCase()}</span>
            {app.name}
            <button type="button" class="remove" aria-label="Stop guarding {app.name}" title="Remove" onclick={() => remove(app)}>×</button>
          </li>
        {/each}
        <li>
          <button type="button" class="add" aria-expanded={adding} onclick={() => (adding ? (adding = false) : openPicker())}>
            {adding ? "Close" : "+ Add an app"}
          </button>
        </li>
      </ul>
      {#if tools.apps.length === 0}
        <p class="hint">Nothing is guarded yet. Add the apps that tend to pull you away.</p>
      {/if}

      {#if adding}
        <div class="picker" role="group" aria-label="Add an app">
          {#if suggested.length > 0}
            <p class="label">Suggestions</p>
            <div class="chips">
              {#each suggested as app (app.name)}
                <button type="button" class="chip" onclick={() => add(app)}>+ {app.name}</button>
              {/each}
            </div>
          {/if}
          <p class="label">Open right now</p>
          {#if loading}
            <p class="hint">Looking…</p>
          {:else if openNow.length > 0}
            <div class="chips">
              {#each openNow as app (app.ids[0])}
                <button type="button" class="chip" onclick={() => add(app)}>+ {app.name}</button>
              {/each}
            </div>
          {:else}
            <p class="hint">No other apps are open. Open the app you want to guard, then close and open this list.</p>
          {/if}
          <label class="label" for="guard-search">Any other app</label>
          <form
            class="search"
            onsubmit={(e) => {
              e.preventDefault();
              addTyped();
            }}
          >
            <input
              id="guard-search"
              type="text"
              bind:value={search}
              maxlength="60"
              placeholder={installed.length > 0 ? "Search your apps, or type a name" : "Type the app's name"}
              autocomplete="off"
            />
            <button type="submit" class="secondary" disabled={!canAddTyped && found.length !== 1}>Add</button>
          </form>
          {#if found.length > 0}
            <div class="chips">
              {#each found as app (app.ids[0])}
                <button
                  type="button"
                  class="chip"
                  onclick={() => {
                    add(app);
                    search = "";
                  }}>+ {app.name}</button
                >
              {/each}
            </div>
          {:else if typed && installed.length === 0}
            <p class="hint">Use the name the app shows in its title bar or in the list of running programs.</p>
          {/if}
          <p class="hint">Browsers are best left out: you study in them too.</p>
        </div>
      {/if}
    </div>
  {/if}

  {#if quiet && quiet.kind !== "none"}
    <div class="row">
      <div class="text">
        <span class="name" id="quiet-label">Do Not Disturb during sessions</span>
        <span class="hint">
          {#if quiet.kind === "gnome"}
            Hides notification banners from other apps while a session runs. Headstart's own reminders still come through.
          {:else if quiet.ready}
            Turns your Focus on when a session starts and off when it ends. Headstart's own reminders still come through if
            your Focus allows Headstart.
          {:else}
            macOS lets no app switch a Focus on by itself, but Headstart can run a Shortcut that does. Set it up once below.
          {/if}
        </span>
      </div>
      <div class="control">
        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked={tools.dndOn && quiet.ready}
          aria-labelledby="quiet-label"
          disabled={!quiet.ready}
          onclick={() => setQuiet(!tools.dndOn)}
        >
          <span class="knob" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    {#if quiet.kind === "shortcuts"}
      <div class="block">
        <ol class="steps">
          <li>
            <span class="step" class:ok={quiet.ready} aria-hidden="true">{quiet.ready ? "✓" : "1"}</span>
            <div>
              <p class="step-name">Make two Shortcuts</p>
              <p class="hint">
                In the Shortcuts app, make a shortcut named <b>Headstart Focus On</b> with one action: <b>Set Focus</b>,
                turn Do Not Disturb <b>On</b> until <b>Turned Off</b>. Make a second one named <b>Headstart Focus Off</b>
                with <b>Set Focus</b>, turn Do Not Disturb <b>Off</b>. The names must match exactly.
              </p>
              {#if !quiet.ready && quiet.missing.length > 0}
                <p class="hint missing" role="status">Not found yet: {quiet.missing.join(" and ")}.</p>
              {/if}
              <div class="buttons">
                <button type="button" class="secondary" onclick={() => dnd.openSetup()}>Open Shortcuts</button>
                <button type="button" class="secondary" disabled={checking} onclick={checkAgain}>
                  {checking ? "Checking…" : quiet.ready ? "Check again" : "I have made them"}
                </button>
              </div>
            </div>
          </li>
          <li>
            <span class="step" aria-hidden="true">2</span>
            <div>
              <p class="step-name">Pick which Focus</p>
              <p class="hint">
                Do Not Disturb, or a Focus of your own that still lets your family through. You choose it in the Set Focus
                action of both Shortcuts.
              </p>
            </div>
          </li>
          <li>
            <span class="step" class:ok={trying === "done"} aria-hidden="true">{trying === "done" ? "✓" : "3"}</span>
            <div>
              <p class="step-name">Try it</p>
              <div class="buttons">
                <button type="button" class="secondary" disabled={!quiet.ready || trying === "on"} onclick={tryIt}>
                  {trying === "on" ? "Focus is on for 10 seconds…" : "Turn Focus on for 10 seconds"}
                </button>
              </div>
              <p class="hint" role="status">
                {#if quietError}
                  <span class="missing">{quietError}</span>
                {:else if trying === "done"}
                  It turned on and off again. You are set.
                {:else}
                  You should see the Focus turn on in the menu bar, then off again.
                {/if}
              </p>
            </div>
          </li>
        </ol>
        <p class="hint">
          If Headstart quits during a session, it turns the Focus off on the way out. After a crash, it turns it off the next
          time it starts.
        </p>
      </div>
    {/if}
    {#if study.dndError}
      <p class="hint missing" role="alert">{study.dndError}</p>
    {/if}
  {/if}
</section>

<style>
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

  .name,
  .step-name {
    margin: 0;
    font-weight: 800;
  }

  .hint {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-ink-muted);
  }

  .missing {
    font-weight: 700;
    color: var(--hs-warning-strong);
  }

  .control {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
  }

  .block {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 0 16px;
  }

  .apps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .app {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    box-sizing: border-box;
    padding: 0 4px 0 6px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    font-weight: 700;
  }

  .initial {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
    font-size: 13px;
    font-weight: 800;
  }

  .remove {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--hs-ink-muted);
    font: inherit;
    font-size: 18px;
    cursor: pointer;
  }

  .remove:hover {
    background: var(--hs-ground);
    color: var(--hs-ink);
  }

  .add {
    min-height: 40px;
    padding: 0 14px;
    border: 1px dashed var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    color: var(--hs-accent-strong);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .add:hover {
    background: var(--hs-ground);
  }

  .picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--hs-line);
    border-radius: 14px;
    background: var(--hs-ground);
  }

  .label {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-muted);
  }

  .chips,
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .buttons {
    gap: 8px;
    margin-top: 8px;
  }

  .chip {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 999px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .chip:hover {
    border-color: var(--hs-accent);
  }

  .search {
    display: flex;
    gap: 8px;
    max-width: 460px;
  }

  .search input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 42px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .secondary {
    min-height: 42px;
    padding: 0 16px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .secondary:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .steps li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .step {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 14px;
  }

  .step.ok {
    background: var(--hs-success);
    color: #fff;
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

  .switch:disabled {
    opacity: 0.55;
    cursor: default;
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

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
