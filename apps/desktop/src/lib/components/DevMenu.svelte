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
  The developer menu. It only exists with a developer token for this
  installation. The real profile can only claim the token's signed grants;
  everything else changes the debug profile, which has its own database.
-->
<script lang="ts">
  import { CRATE_TYPES, type CrateType, items, type Item, SLOTS } from "@headstart/content";
  import { developer } from "@headstart/core";
  import { lookFor, Mascot, MASCOT_TINTS, rarityColors } from "@headstart/ui";
  import type { Study } from "$lib/study.svelte.ts";
  import Select from "./Select.svelte";

  let { study, open = $bindable(false) }: { study: Study; open?: boolean } = $props();

  const HOUR = 60 * 60 * 1000;
  let dialog = $state<HTMLDialogElement | null>(null);
  let message = $state<string | null>(null);
  let itemId = $state(items[0]?.id ?? "");
  let crateType = $state<CrateType>("study");
  let stardust = $state(1000);
  let confirmingReset = $state(false);
  let claimed = $state<Item[]>([]);

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  const itemGroups = SLOTS.map((slot) => ({
    label: slot,
    options: items
      .filter((i) => i.slot === slot)
      .map((i) => ({ value: i.id, label: i.name, hint: i.rarity, color: rarityColors[i.rarity].dot })),
  }));
  const crateGroups = [{ label: "", options: CRATE_TYPES.map((t) => ({ value: t, label: t })) }];

  const days = (ms: number) => (ms === 0 ? "now" : ms % (24 * HOUR) === 0 ? `+${ms / (24 * HOUR)} d` : `+${Math.round(ms / HOUR)} h`);
  const say = (error: string | null, done: string) => (message = error ?? done);

  async function claim(): Promise<void> {
    const result = await study.claimDeveloperGrants();
    claimed = result.items;
    message = result.error;
  }

  async function wearClaimed(): Promise<void> {
    const mascot = study.mascot;
    if (!mascot) return;
    for (const item of claimed) await study.equip(mascot, item.slot, item.id);
    message = "Put on.";
  }

  const claimedLook = $derived(
    study.mascot && claimed.length > 0
      ? lookFor(study.mascot, { ...study.equippedOf(study.mascot), ...Object.fromEntries(claimed.map((i) => [i.slot, i.id])) }, items)
      : null,
  );
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="dev-h"
  oncancel={(e) => {
    e.preventDefault();
    open = false;
  }}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
>
  <header>
    <div>
      <p class="eyebrow">Developer</p>
      <!-- Focus starts here, not on the profile switch, so no button looks picked by mistake. -->
      <!-- svelte-ignore a11y_autofocus -->
      <h2 id="dev-h" tabindex="-1" autofocus>{study.profile === "debug" ? "Debug profile" : "Real profile"}</h2>
    </div>
    <div class="switch" role="group" aria-label="Profile">
      {#each [["real", "Real"], ["debug", "Debug"]] as const as [profile, label] (profile)}
        <button
          type="button"
          aria-pressed={study.profile === profile}
          class="segment"
          class:debug={profile === "debug"}
          onclick={() => study.profile !== profile && say(study.switchProfile(profile), "")}>{label}</button
        >
      {/each}
    </div>
  </header>

  {#if study.profile === "real"}
    <section>
      <h3>Developer items</h3>
      {#if claimedLook}
        <div class="reveal">
          <div class="stage" style:background={MASCOT_TINTS[study.mascot ?? "maple"]}><Mascot look={claimedLook} mood="celebrate" size={180} /></div>
          <div>
            <p class="exotic">Exotic</p>
            <p class="big">{claimed.map((i) => i.name).join(" and ")} {claimed.length === 1 ? "is" : "are"} yours.</p>
            <button type="button" class="primary" onclick={wearClaimed}>Put {claimed.length === 1 ? "it" : "them"} on</button>
          </div>
        </div>
      {:else if study.unclaimedGrants.length > 0}
        <p>Signed for this installation: {study.unclaimedGrants.map((i) => i.name).join(", ")}.</p>
        <button type="button" class="primary" onclick={claim}>Claim</button>
      {:else}
        <p class="muted">Every grant in the token is claimed.</p>
      {/if}
    </section>
    <p class="muted">The real profile only takes signed grants. Everything else is in the debug profile.</p>
  {:else}
    <section>
      <h3>Items</h3>
      <div class="row">
        <Select bind:value={itemId} groups={itemGroups} label="Item" />
        <button type="button" onclick={async () => say(await study.dev((_, c) => developer.giveItem(itemId, c)), "Given.")}>Give</button>
        <button type="button" onclick={async () => say(await study.dev((s, c) => developer.takeItem(s, itemId, c)), "Taken.")}>Take</button>
      </div>
    </section>
    <section>
      <h3>Crates, Stardust and XP</h3>
      <div class="row">
        <Select bind:value={crateType} groups={crateGroups} label="Crate" />
        <button type="button" onclick={async () => say(await study.dev((_, c) => developer.addCrate(`dev:${study.newId()}`, crateType, c)), "Crate added.")}>Add crate</button>
      </div>
      <div class="row">
        <input type="number" min="0" step="100" bind:value={stardust} aria-label="Stardust" />
        <button type="button" onclick={async () => say(await study.dev((_, c) => developer.setStardust(Number(stardust), c)), "Stardust set.")}>Set Stardust</button>
        <button type="button" onclick={async () => say(await study.dev((_, c) => developer.addXp(100, c)), "+100 XP.")}>+100 XP</button>
        <button type="button" onclick={async () => say(await study.dev((_, c) => developer.addXp(1000, c)), "+1000 XP.")}>+1000 XP</button>
      </div>
    </section>
    <section>
      <h3>Clock <span class="muted">{days(study.clockOffset)}</span></h3>
      <div class="row">
        <button type="button" onclick={() => say(study.jumpClock(HOUR), "")}>+1 hour</button>
        <button type="button" onclick={() => say(study.jumpClock(24 * HOUR), "")}>+1 day</button>
        <button type="button" onclick={() => say(study.jumpClock(7 * 24 * HOUR), "")}>+1 week</button>
        <button type="button" disabled={study.clockOffset === 0} onclick={() => say(study.jumpClock(null), "")}>Back to now</button>
      </div>
      <p class="muted">Only this profile's clock moves. The app reopens.</p>
    </section>
    <section>
      <h3>Whole profile</h3>
      <div class="row">
        <button type="button" onclick={async () => say(await study.simulateWeek(), "")}>Simulate a week</button>
        {#if confirmingReset}
          <button type="button" class="danger" onclick={async () => say(await study.resetDebugProfile(), "")}>Yes, empty the debug profile</button>
          <button type="button" onclick={() => (confirmingReset = false)}>Keep it</button>
        {:else}
          <button type="button" onclick={() => (confirmingReset = true)}>Reset debug profile</button>
        {/if}
      </div>
    </section>
  {/if}

  {#if message}<p class="message" role="status">{message}</p>{/if}
  <footer><button type="button" class="link" onclick={() => (open = false)}>Close</button></footer>
</dialog>

<style>
  dialog {
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    padding: 22px 24px;
    border: 0;
    border-radius: 18px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    box-shadow: var(--hs-shadow-dialog);
  }

  dialog::backdrop {
    background: var(--hs-backdrop);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }

  .eyebrow,
  .exotic {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9e1b2d;
  }

  h2 {
    margin: 2px 0 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.4rem;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 800;
  }

  section {
    padding: 14px 0;
    border-top: 1px solid var(--hs-line);
  }

  p {
    margin: 0 0 10px;
    line-height: 1.45;
  }

  .muted {
    font-weight: 600;
    color: var(--hs-ink-subtle);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  h2:focus {
    outline: none;
  }

  /* A segmented switch: the current profile is filled, the other is plain. */
  .switch {
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--hs-ground);
  }

  .switch .segment {
    min-height: 32px;
    padding: 0 16px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--hs-ink-muted);
  }

  .switch .segment:not([aria-pressed="true"]):hover {
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .switch .segment[aria-pressed="true"] {
    background: var(--hs-accent);
    color: #fff;
    cursor: default;
  }

  .switch .segment.debug[aria-pressed="true"] {
    background: #d7263d;
  }

  .switch .segment:focus-visible {
    outline-offset: 1px;
  }

  button {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 700;
    color: var(--hs-ink);
    cursor: pointer;
  }

  /* The profile switch has its own hover, below. */
  button:not(:disabled):not(.segment):hover {
    background: var(--hs-ground);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .primary {
    border: 0;
    background: #d7263d;
    color: #fff;
  }

  .primary:not(:disabled):hover {
    background: #b81f33;
  }

  .danger {
    border-color: #d7263d;
    color: #9e1b2d;
  }

  .link {
    border: 0;
    background: none;
    color: var(--hs-accent-strong);
    text-decoration: underline;
  }

  input {
    width: 110px;
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    font: inherit;
  }

  .reveal {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stage {
    flex: none;
    border-radius: 16px;
    padding: 4px;
    box-shadow: 0 0 0 3px #d7263d, 0 0 0 6px #f5c542;
  }

  .big {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.2rem;
  }

  .message {
    margin-top: 10px;
    font-weight: 700;
    color: var(--hs-accent-strong);
  }

  footer {
    display: flex;
    justify-content: flex-end;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
