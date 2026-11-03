# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - Unreleased

A rework: effects now decorate ComfyUI's own link and node drawing instead of replacing it, v1's effects are back as v1 drew them, and there are looks, selection focus, run visuals and new effects.

### Upgrading
- **Your settings are kept.** Every 2.x setting id still works. On first load a look picker opens; until you choose, Subtle shows and nothing is written to your settings file. If you had changed settings, **Keep my settings** keeps them as they were.
- Values 2.x saved out of range or in an old format are read as the nearest valid one; the saved value is left as it is, so 2.0.1 reads your file as before.
- To go back, install 2.0.1 from the Manager. ComfyUI's Settings › Extension turns either half off.

### Looks and panel
- **New panel** (the **FX** tab in the sidebar): Looks, Links, Nodes, Focus & Flow, Perf and About tabs, search, Advanced settings behind a switch, a reset on every changed setting, Undo, live previews, and two-way sync with ComfyUI's settings dialog, saving once per change.
- **11 looks**: Off, Subtle (the defaults), Showcase, Performance, Classic v1, Neon Night, Lava Lamp, Sacred Geometry, Living Wires, Presenter and Blueprint. Hovering one previews it on the canvas; applying one changes only what differs, with Undo. Save your own, share them as JSON, or let **Surprise me** pick.
- **Settings dialog**: every setting is under **Enhanced Links & Nodes** with a readable name, a group, its real range and a tooltip. [docs/SETTINGS.md](docs/SETTINGS.md) lists them.
- **Link effects** and **Node effects** switches turn each half off without losing its settings.
- **Quick toggles**: **Shortcut keys** (off by default; Alt or Alt+Shift with L for the panel, K for all effects, J for the running node, then the next error), View › Enhanced Links & Nodes, **Enhanced FX** in the canvas menu, a button on the action bar and one in the selection toolbox, and 20 commands in ComfyUI's keybinding settings. A key another command already has is left to it.
- **About**: the version, what's new, shortcuts and Copy diagnostics.

### Links
- **Native links stay native**: clicking a link's centre, Shift-drag, Alt-click to add a reroute, the link-release search, reroutes, floating links, subgraph links, links to collapsed nodes, hidden links and every Link Render Mode work as they do without the extension. In 2.x, Classic Flow, the default, replaced ComfyUI's link drawing and broke these.
- **v1's animations, as v1 drew them**: v1's clock, direction and speed curve, the density presets (Minimal, Balanced, Dense and Ultra), and Classic Flow's dark halo. Link and marker shadows are on by default; Shadow style picks the Halo (v1) or the Drop shadow (v2).
- Effects follow the link's real path, across reroutes, for every path shape. Path shapes have plain names (Same as ComfyUI, Direct, Right-angle, Effect only, Wave), Dotted and Dashed move, and there is a new **Coil**.
- Markers: a new Merkaba shape, Spiral now draws as a spiral (2.x filled it into a blob), **Markers on every animation**, and Marker color **Same as link** works again.
- **Glow blending**: Additive glow on dark palettes.

### New link animations
- **Merkaba Beads**, **DNA Helix 3D**, **Comet Trails** and **Stardust**: glittering motes drifting along the link, swelling and twinkling toward its middle.

### Wire physics
- **Wire physics** (Cable, Spring or Syrup, with a strength): links hang and swing as you move nodes, with any animation or none, and stay clickable along the wire.

### Connection assist
- **Connection assist** (Guide line, Reaching hands, or Hands & eyes): while you drag a link, it points out the nearest slot within reach the link can connect to. Inspired by nodezator, as suggested in #3.
- **Connect on release**: let go once the hands clasp, or wherever the guide line points, and the link connects; hold the **Snap key** (Ctrl or Alt) as you let go to connect from anywhere in reach.

### Nodes
- **Node effects show again**: Gentle Pulse, Neon Nexus, Cosmic Ripple and Sacred Rosette draw over the node at v1's strength (2.x drew them under the node, where they could not be seen), with their halo, a glowing frame around selected nodes, and particles on their own.
- **Sacred Rosette** is v1's Flower of Life, renamed: its rings of circles now close all the way round, and it draws its pattern and dots in a few strokes instead of hundreds, about 12 times faster at Rich quality. Settings and nodes that had it keep it.
- All five title styles can be picked, and titles are drawn once.
- Node menu: **Node FX ›** for that node, **Completion FX ›** (Use global, Primary or Exclude) and **Go to connected node ›**. A choice is saved in the workflow only when you make one.
- Bypassed and muted nodes dim their effects. Particle colors Complementary, Quantum and Aurora are fixed.

### New node effects
- **Flower of Life**: nineteen circles, each through the middles of those beside it, draw themselves in round the node, the Seed of Life first, inside a ring; then the flower blooms and slowly turns, with a shimmer through its petals at Rich quality and sparks running round its circles, before it draws itself in again. The Sacred Geometry look uses it.
- **Jelly**: the node itself wobbles like gel, leaning as you drag it, swaying as you let go and squashing as you select it and as your run finishes it, then settles still and is drawn as ComfyUI draws it; its links' ends follow it. A gel tint and gloss sit on the body, with bubbles as its particles. In Nodes 2.0 the node bounces instead.

### Selection focus and navigation
- **Selection focus** (#4, #5, #45): highlight the selected nodes' links, animate only them, or dim or hide the others; color them in ComfyUI's white, the theme accent or their type color; reach direct links, everything upstream or downstream, or the whole chain, through reroutes; draw them above nodes; optionally on hover. Works with link effects off.
- **Go to connected node** in the node menu, a double-click on a slot to fly to the other end (again to cycle), and Go back. **Follow execution** pans to the running node when it is off screen.

### Run visuals
- For runs you queue: light flowing into the running node, a fading trail along the path the run took, a progress ring (in the theme accent, the node's effect color, a custom color, a rainbow, or amber turning green), and a red pulse and shake on a failed node.
- **During a run**: Freeze effects, Calm, Spotlight (the default: other effects hold still while the run visuals play) or Keep animating, and links or nodes can each ignore runs.

### Completion
- **Effect when a run finishes**: Fireworks (v1's), Confetti, Shockwave (the default), Path trace or Surprise, over the output nodes, the nodes you mark Primary, or the centre of the screen. Optionally a burst as each node finishes. **Preview completion effect** plays it on demand. (The 2.x End Animation switch did nothing.)

### Nodes 2.0
- Node effects show on Nodes 2.0 as glows (halo, each effect, selection, running and failed), with particles beneath, and focused links, progress rings, error outlines, completion effects and connection assist on a layer above. Neon Nexus's tube and lattice, Cosmic Ripple's rings, Sacred Rosette's and Flower of Life's patterns, styled titles, the hover outline, focus on hover and the slot double-click are classic-only; the panel says so and offers to switch.

### Performance
- Nothing redraws while nothing moves. Settings are read when they change, never per frame (2.x read them for every link and node, every frame). Off-screen links are skipped, and animation stops in a hidden tab.
- **Effect frame-rate cap** (30, 60 or the display's rate), **Adaptive quality**, **Freeze above N visible links**, **Keep link glow while moving**: glows stay while you pan, zoom or drag nodes, or turn it off to let busy graphs drop them until you stop; and **Hide effects zoomed out below** (25% by default, 0 for every zoom), which node halos now follow too.
- **Motion** (Follow system, Reduce or Full): effects hold still when the system or ComfyUI's Disable animations asks for less motion. Flashing is kept to 3 a second or less.

### Compatibility
- ComfyUI frontend 1.39.5 or later, tested on 1.39.5 and 1.57.1, in classic mode and Nodes 2.0. Effects keep animating inside subgraphs.
- Works with KJNodes and MagnifyGlass. When LinkFX or another extension draws links too, **Other link extensions** steps aside by default: it leaves link drawing to the other extension and keeps node effects.
- Makes no requests beyond the ComfyUI server and loads no remote fonts.
- A **showcase** example workflow under the extension in ComfyUI's templates: core nodes only, no models, and it runs in seconds on CPU.
- Licensed under GPLv3; 2.0.1 and earlier were MIT.

### Fixed
- Link colors that fell back to nothing threw errors; Cosmic Weave, DNA Helix and Stellar Plasma ran from the wrong end; Stellar Plasma's sparks piled up at one end; Lava Flow's ripples ran upstream; decorations only worked on straight links; particles moved at half speed on 120 Hz screens; the animation clock ran 6.25× slow and backwards; Ultra density could not be chosen, and density 0 blanked the styles.
- Three list settings showed as sliders, 12 settings had no control in the panel, colors saved without `#` showed as black, the panel was hard to read on light palettes, and every slider tick saved.

---

## [2.0.1] - 2026-03-24

### Fixed
- **Registry Publish** — fixed node ID casing mismatch preventing ComfyUI Registry updates
- **Gitignore** — fixed patterns for `docs/` files, removed tracked images folder
- **Preview Images** — moved to GitHub Releases CDN for faster loading

The LICENSE in this release is still MIT: the move to GPLv3 came just after it.

---

## [2.0.0] - 2026-03-24

### ✨ Major Rewrite — TypeScript Architecture

The entire extension has been rewritten from ~7,000 lines of JavaScript into a modular, type-safe TypeScript codebase.

Before this release, from 2026-01-14 on, the code on `main` drew no link effects at all: it hooked `drawLink`, which ComfyUI no longer calls (#40).

### Added
- **Sidebar Settings Panel** — all link and node settings are now adjustable live from a dedicated sidebar panel with instant visual preview *(12 settings had no control in it)*
- **Reset to Defaults** — one-click reset buttons for both link and node settings
- **Independent Particles** — particles can now be enabled as a standalone feature, independent of node animation style selection
- **Batched Link Rendering** — high-performance `drawConnections` render queue replaces per-link `drawLink` for reduced canvas state changes *(it replaced ComfyUI's own link drawing, which broke link clicks, reroutes and subgraph links)*
- **Link Transition Manager** — spring physics-based smooth transitions when switching between static link modes *(never shipped: the code was not part of the build)*
- **60+ Registered Settings** — all settings are properly registered with ComfyUI's settings system *(all in one category, so the settings dialog showed only one of them)*
- **5 Text Animation Styles** — neon, cyberpunk, retro, pulse, minimal *(only neon could be chosen)*
- **6 Particle Color Modes** — default, rainbow, complementary, energy, quantum, aurora

### Fixed
- **Console spam** — eliminated 125,000+ deprecation warnings per second caused by `getSettingValue()` using deprecated 2-argument signature
- **TypeScript strictness** — resolved all literal type narrowing issues with explicit generic type annotations

### Changed  
- **Default Settings** — node animations, particles, link shadows, and marker shadows are now **off by default** for a cleaner initial experience
- **Modular Architecture** — code is organized into `renderers/`, `effects/`, `utils/`, `core/`, `sidebar/`, and `ui/` directories
- **Node Effects Fidelity** — all 4 node effects (Gentle Pulse, Neon Nexus, Cosmic Ripple, Flower of Life) faithfully ported line-by-line from original JS *(drawn under the node body, so they did not show)*

### Not shipped
- The End Animation switch had no effect, the per-node menu and Particles Only were missing, and the About / Pattern Designer window in the source could not be opened.

### Technical
- **Build**: Vite/TypeScript producing 3 optimized chunks (~150KB total)
- **Modules**: 22 TypeScript modules
- **Zero build errors** *(Vite's; `tsc` reported 30 type errors)*

---

## [1.0.2] - 2025-02-22

The Comfy Registry lists this release as 1.0.0.

### Added
- **Link Animations**: 9 Unique Animation Styles including Classic Flow, Sacred Flow, and more.
- **Node Animations**: 4 Node Animation Styles including Gentle Pulse and Neon Nexus.
- **Advanced Customization**: Extensive control over colors, markers, styles, and performance.
- **Performance Settings**: Options for static mode, quality control, and pause during render.
- **Text Visibility Tool**: Enhanced text animation for nodes.
- **End-of-Render Animation**: Special effects upon workflow completion.
