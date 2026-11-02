<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script lang="ts">
  import "@headstart/ui/styles.css";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
