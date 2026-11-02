# Headstart

A study companion for Windows, macOS and Linux that helps you **get started**, **stay focused** and **keep going**, with a mascot that rewards real studying.

> Status: milestone **M0 (foundations)**. The app installs, lives in the menu bar or system tray and updates itself. Study features arrive in the next milestones.

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
```

### Repository layout

```
apps/desktop/         Tauri 2 app: SvelteKit UI in src/, Rust shell in src-tauri/
packages/core/        domain logic in pure TypeScript (timer, rewards, crates …)
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
