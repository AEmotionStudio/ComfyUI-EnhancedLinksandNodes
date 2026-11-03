# Contributing to ComfyUI Enhanced Links and Nodes

First off, thank you for considering contributing to ComfyUI Enhanced Links and Nodes! Your help is greatly appreciated.

## How Can I Contribute?

### Reporting Bugs

Open an issue on the [GitHub issue tracker](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/issues) with:

- A clear title, and the steps that show the bug.
- What **Copy diagnostics** puts on your clipboard (the panel's **About** tab): the extension and frontend versions, Nodes 2.0, your palette and look.
- Whether it happens with the extension's effects off (**Alt+K**), and any errors from the browser console.

### Pull Requests

1. Fork the repository and branch from `main` (`git checkout -b feature/your-feature-name`).
2. Keep each pull request to one change, with the tests that show it.
3. Run the checks below, then open the pull request against `main`.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or 24, and [pnpm](https://pnpm.io/) 10 (`package.json` pins the version).
- A ComfyUI install with its Python environment in `venv/`, for the browser tests.

### Setup

```bash
cd ComfyUI/custom_nodes/
git clone https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes.git comfyui-enhancedlinksandnodes
cd comfyui-enhancedlinksandnodes
pnpm install
```

Clone with the full history: the v1 tests read v1's code with `git show`.

ComfyUI loads the built `js/` folder. Edit `src/`, never `js/`: run `pnpm dev`, then refresh the browser. `js/` is committed, so every change to `src/` comes with a fresh `pnpm build`.

### Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Rebuild `js/` on every change. |
| `pnpm build` | Type-check, then build `js/`. |
| `pnpm type-check` | Type-check the extension and unit tests, and the browser tests. |
| `pnpm test` / `pnpm test:run` | Unit tests (Vitest), watching or once. |
| `pnpm exec knip` | Unused files and exports. |
| `pnpm gen:settings` | Regenerate `locales/en/` and `docs/SETTINGS.md` from the settings schema. |
| `pnpm e2e` | Browser tests (Playwright) on frontends 1.57.1 and 1.39.5, and the rollback check on 2.0.1. |
| `pnpm e2e:perf` | Performance baselines, against native, v2.0.1 and v1. |
| `pnpm e2e:gallery` | Screenshots to look at, not checks. |
| `pnpm e2e:serve <leg>` | Start one test server by hand. |

### Checks

CI (`.github/workflows/ci.yml`) runs these on every pull request, and `publish.yml` runs them again before a release:

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm exec tsc --noEmit -p tests/e2e
pnpm exec vite build        # js/ must come out unchanged
pnpm exec vitest run
pnpm exec knip
```

Run `pnpm e2e` too for anything that draws or touches the panel.

### Browser tests

`tests/e2e/serve.mjs` starts each leg in `tests/e2e/legs.json` as its own ComfyUI: `--base-directory` in a fresh `/tmp/eln-e2e-*` folder, `--offline`, `--cpu`, `--multi-user`, an in-memory database, and only the custom nodes the leg names (this repo by symlink, a test-only node pack, and KJNodes and MagnifyGlass for `interop`). The folder is removed when the server stops. Each test gets a fresh user. ComfyUI is the one two folders up, or `COMFYUI_DIR`.

- **Never run the tests against your own ComfyUI.** Without `--base-directory`, ComfyUI's startup empties its `temp` folder. The legs use ports 8199–8205, never 8188, and the tests refuse a server `serve.mjs` did not start.
- A Playwright config of your own must give each web server `gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 }`, or its temp folder stays behind.
- `fe157` uses the frontend installed in ComfyUI's venv, which must be 1.57.1. `fe1395` needs `web_custom_versions/Comfy-Org_ComfyUI_frontend/1.39.5` in ComfyUI (start ComfyUI once with `--front-end-version Comfy-Org/ComfyUI_frontend@1.39.5`).
- Chromium comes from `/usr/bin/chromium`, or `pnpm exec playwright install chromium`.
- The `-native` projects run with both extensions disabled, as the baseline. `v2-ref` serves 2.0.1 from git for `@perf` and the `@rollback` check, which `pnpm e2e` runs too; `v1-ref` serves v1 for `@perf` and `@gallery`. `interop` runs only when named (`pnpm e2e --project interop`) and needs `comfyui-kjnodes` and `comfyui-magnifyglass` in ComfyUI's `custom_nodes`.

### Traces

The unit tests record what each effect draws on a recording canvas.

- `tests/unit/__traces__/v1/` is the v1 reference, checked against v1's code at commit `1ecca1d`: the link traces are what v1 draws, and the node traces are v2's port of v1's effects driven with v1's inputs. These files never change: `tests/unit/__traces__/v1.sha256` lists their sums and a test checks them. Where 3.0 draws differently from v1 on purpose, `tests/unit/v1-deviations.ts` lists the difference and proves it.
- `tests/unit/__traces__/v3/` holds 3.0's own effects. They are snapshots: after checking that a change to what one shows is intended, `pnpm exec vitest run tests/unit/v3-traces.test.ts -u` rewrites them.

### Settings

`src/core/settings.ts` is the one schema. Each extension registers its own settings from it, and `pnpm gen:settings` writes the dialog's text (`locales/en/`) and `docs/SETTINGS.md` from it; CI fails while they are stale. A setting's id is kept for good, so older versions and other installs keep reading users' files: never rename or delete one.

### Adding an effect

A renderer that draws from the segment and the shared clock, a trace in `tests/unit/__traces__/v3/`, a tile in the panel's gallery, and a pass through the flash test (at most 3 flashes a second) and the still frame shown under reduced motion.

## Releases

1. Set the version in `pyproject.toml`, the only place it is kept: the build writes it into the About tab.
2. Give the `Unreleased` section of `CHANGELOG.md` its date, update the README, and `pnpm build`.
3. Merge to `main`. A change to `pyproject.toml` there runs `publish.yml`: the checks above, then the Comfy Registry publish, which zips the files git tracks minus `.comfyignore`. `tests/unit/packaging.test.ts` checks what that archive holds.
4. Tag `vX.Y.Z` and publish the GitHub release with the changelog section.

## Project Structure

- **`src/core/`**: the settings schema, the clock and ticker, colors.
- **`src/links/`**, **`src/nodes/`**, **`src/fx/`**: link effects, node effects, and particles, completion effects, run visuals and connection assist.
- **`src/sidebar/`**, **`src/ui/`**: the panel, the look picker, looks, menus and navigation.
- **`src/extensions/`**: the two extensions ComfyUI loads, `enhanced.link.animations` and `enhanced.node.animations`.
- **`js/`**: the build output ComfyUI loads. Do not edit it by hand.
- **`locales/`**, **`docs/SETTINGS.md`**: generated from the schema.
- **`example_workflows/`**: workflows ComfyUI lists under the extension's templates.
- **`tests/unit/`**, **`tests/e2e/`**, **`tests/helpers/`**: unit tests, browser tests and their fakes.
- **`__init__.py`**: ComfyUI's entry point; the extension has no Python nodes.

## Code Style

- TypeScript in strict mode, named exports, and short TSDoc comments on what is exported.
- Match the code around your change; keep comments to what the code cannot say.
- No runtime dependencies. The bundle imports only ComfyUI's `/scripts/app.js` and `/scripts/api.js`, makes no requests beyond the ComfyUI server, and loads no remote fonts or images.
- Drawing code never reads the settings store: settings reach it through their `onChange`, in the `L` and `N` snapshots.

By contributing, you agree that your contributions are licensed under the project's licence, the GNU General Public License v3 (see [LICENSE](LICENSE)).

Thank you for your contributions!
