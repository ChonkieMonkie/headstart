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
  import FocusView from "$lib/components/FocusView.svelte";
  import SessionComplete from "$lib/components/SessionComplete.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import { provideApp } from "$lib/context.ts";
  import { Study } from "$lib/study.svelte.ts";
  import { inTauri } from "$lib/tauri.ts";
  import { Updater } from "$lib/updater.svelte.ts";

  let { children }: { children: Snippet } = $props();

  const isPanel = page.url.pathname.startsWith("/panel");
  const study = isPanel ? null : new Study();
  const updater = isPanel ? null : new Updater();
  if (study && updater) provideApp({ study, updater });
  let version = $state("dev");

  onMount(() => {
    if (!study || !updater) return;
    study.onCheckUpdates = () => updater.check();
    study.open();
    if (inTauri) {
      getVersion().then((v) => {
        version = v;
      });
      if (import.meta.env.PROD) updater.check();
    }
    return () => study.close();
  });
</script>

{#if !study}
  {@render children()}
{:else if study.layout === "compact" && (study.active || study.breakTimer)}
  <CompactTimer {study} />
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
{/if}

<style>
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
    background: #fdecea;
    color: #8a1c13;
    font-weight: 700;
  }
</style>
