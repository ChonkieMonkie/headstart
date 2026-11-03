# Headstart

A study companion for Windows, macOS and Linux that helps you **get started**, **stay focused** and **keep going**, with a mascot that rewards real studying.

> Status: milestone **M3 (study screens)** is done: Headstart is ready for daily studying. The mascot, wardrobe and crate opening arrive in M4.

## What works today

- **Courses and tasks.** Courses can have an exam date with a countdown. Every task needs a concrete **next step**, so starting never needs a decision.
- **Today screen**: the next planned session with its next step, today's plan, focus time, your on-time streak and crate progress. Start, move or remove planned sessions in one click.
- **Planned sessions with reminders**: a notification two minutes before, and one gentle nudge if a session has not started ten minutes in (at most three nudges a day). Starting a planned session on time earns a bonus.
- **Session complete**: what you earned, then write down what you remember (free recall), rate your focus and set the next step. Recall notes are kept per course.
- **Stats**: focus time per day and per course, on-time start rate, streaks, distraction-free share and focus rating.
- **Focus sessions** of 25 minutes, 50 minutes or "just 5 minutes", with pause, +5 min and ending early (time studied still counts; under a minute is not saved). A break starts on its own afterwards.
- **Three focus layouts**: the normal window, **full screen** that stays on top (hold *Exit full screen* for 2 seconds to leave), and a **compact timer** that floats above other windows and can be dragged anywhere.
- **Menu bar / system tray**: left-click the icon for a small panel with the next session, the running timer and today's numbers; right-click for the menu. On macOS the countdown ticks in the menu bar; on Windows and Linux it is in the tooltip and the menu. Linux trays only offer the menu.
- **Notifications** for planned sessions, and when a session or break ends while Headstart is hidden. macOS asks for permission the first time.
- **Global shortcut** <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd> (<kbd>⌥⇧H</kbd> on a Mac) starts a session from anywhere, or brings the running one to the front. On Wayland, where global shortcuts are limited, bind a system shortcut to `headstart --start` instead.
- **Rewards**: XP and levels, a Study Crate every 3 sessions of 10+ minutes, and Stardust from duplicates. Crate odds are shown in the app together with the pity guarantee: an Epic is guaranteed within 15 crates and a Legendary within 60.
- Everything is stored **locally** in an append-only event log (SQLite). Nothing leaves your computer.

## Installing (unsigned builds)

Download the installer for your system from the latest [release](https://github.com/ChonkieMonkie/headstart/releases).

The builds are not code signed yet, so the operating system warns the first time:

- **Windows:** SmartScreen says "Windows protected your PC". Click **More info → Run anyway**.
- **macOS:** right-click (or Control-click) **Headstart** in Applications and choose **Open**, then **Open** again. If macOS says the app is damaged, run `xattr -cr /Applications/Headstart.app` in Terminal once.
- **Linux:** use the `.deb` (Debian, Ubuntu), the `.rpm` (Fedora) or the `.AppImage` (any distro: `chmod +x` it first). On GNOME, the tray icon needs the *AppIndicator and KStatusNotifierItem Support* extension.

After that, updates install from inside the app.

## Developing

Requirements: [Node.js 24](https://nodejs.org) · [pnpm](https://pnpm.io) · [Rust](https://rustup.rs) · the [Tauri system dependencies](https://tauri.app/start/prerequisites/) for your OS.

```bash
pnpm install          # install everything
pnpm dev              # run the desktop app with hot reload
pnpm test             # unit tests
pnpm typecheck        # TypeScript and Svelte checks
pnpm lint             # Biome lint and format check (pnpm format fixes)
pnpm check:licenses   # make sure every dependency is GPL-compatible
pnpm build            # build installers for the current OS
pnpm --filter @headstart/core simulate   # simulate a semester: XP, levels and crate odds
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml   # Rust shell tests
```

`pnpm --filter @headstart/desktop dev` serves only the UI on <http://localhost:1420>. In a plain browser it keeps progress in memory and skips the tray, notifications and window layouts, which is handy for working on screens.

### Repository layout

```
apps/desktop/         Tauri 2 app: SvelteKit UI in src/, Rust shell in src-tauri/
                      (tray, focus layouts, notifications, global shortcut)
packages/core/        domain logic in pure TypeScript: event log, timer, XP, crates, pity
packages/content/     items, crate odds and reward rules as JSON, validated at startup
packages/ui/          design tokens, fonts and shared Svelte components
scripts/              repository tooling, such as the licence check
.github/workflows/    CI and release builds for all three operating systems
```

### Releasing

1. Bump `version` in `apps/desktop/package.json` (the app reads it from there) and in `apps/desktop/src-tauri/Cargo.toml`.
2. Commit, then tag and push: `git tag v0.2.0 && git push --tags`.
3. The Release workflow builds every installer and creates a **draft** release.
4. Test the draft, then publish it. Installed apps pick up the update on their next start.

Update files are signed with the key in the `TAURI_SIGNING_PRIVATE_KEY` repository secret. The matching public key is in `apps/desktop/src-tauri/tauri.conf.json`. Never commit the private key.

## License

```
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
```

The full license is in [LICENSE](LICENSE). The bundled Fredoka and Nunito fonts are licensed under the SIL Open Font License 1.1. Questions, bugs or ideas: open an
[issue on GitHub](https://github.com/ChonkieMonkie/headstart/issues).
