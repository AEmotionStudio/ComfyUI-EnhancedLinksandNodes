<div align="center">

# ComfyUI-Enhanced Links and Nodes

**Beautiful, customizable animations for the links and nodes of your ComfyUI workflow, drawn on top of ComfyUI's own.**

[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green?style=for-the-badge)](https://github.com/comfyanonymous/ComfyUI)
[![Version](https://img.shields.io/badge/Version-3.0.0-orange?style=for-the-badge)](CHANGELOG.md)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-red?style=for-the-badge)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=for-the-badge&color=blue)](package.json)

[![Last Commit](https://img.shields.io/github/last-commit/AEmotionStudio/ComfyUI-EnhancedLinksandNodes?style=for-the-badge&label=Last%20Update&color=orange)](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/commits)
[![Activity](https://img.shields.io/github/commit-activity/m/AEmotionStudio/ComfyUI-EnhancedLinksandNodes?style=for-the-badge&label=Activity&color=yellow)](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/commits)

![The Showcase look on a txt2img workflow](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/hero.webp)  
*The Showcase look: Cosmic Weave links that sag like rope, Neon Nexus nodes with aurora particles.*

[What's new](#-whats-new-in-30) • [Features](#-features) • [Looks](#-looks) • [Installation](#-installation) • [Quick toggles](#-quick-toggles) • [Settings](#-settings) • [Compatibility](#-compatibility) • [FAQ](#-faq) • [Changelog](CHANGELOG.md)

</div>

---

## 🚀 What's New in 3.0

*   **Links stay native.** Effects now decorate ComfyUI's own link drawing, so clicking a link, Shift-drag, Alt-click to add a reroute, the link-release search, reroutes, subgraphs, hidden links and every Link Render Mode work as they do without the extension. v1's animations are back as v1 drew them, and follow the real path across reroutes.
*   **Selection focus and navigation.** The selected nodes' links in ComfyUI's white, with the rest dimmed or hidden if you like. Go to connected node, double-click a slot to jump to the other end, Go back, and Follow execution.
*   **Run visuals and completion effects.** For the runs you queue: light flowing into the running node, a progress ring, a fading trail and a red pulse on errors, then fireworks, confetti, a shockwave or a path trace when the run finishes.
*   **The FX panel.** 11 looks with live previews, search, Undo and a first-run look picker; every setting also has a readable name and group in ComfyUI's settings dialog.
*   **New effects.** Merkaba Beads, DNA Helix 3D, Comet Trails and Stardust, wire physics, and connection assist with reaching hands and googly eyes.

> **Upgrading from 2.x:** your settings are kept. On first load a **Choose your look** card asks for a look; until you pick, Subtle shows and nothing is written to your settings. If you had changed settings in 2.x, **Keep my settings** keeps them.

> 📄 **See [CHANGELOG.md](CHANGELOG.md) for the complete version history.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔗 Links
![Link animations](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/links.webp)

*   **13 animations**: v1's Classic Flow, Sacred Flow, Crystal Stream, Quantum Field, Cosmic Weave, Energy Pulse, DNA Helix, Lava Flow and Stellar Plasma on v1's clock, plus Merkaba Beads, DNA Helix 3D, Comet Trails and Stardust (drifting, twinkling star dust).
*   **15 path shapes**, from Same as ComfyUI to Wave, Coil, Rope and Chain, and **12 marker shapes**, which can ride on every animation.
*   **Halo or drop shadows**, custom colors, color boost and additive glow on dark palettes.

</td>
<td width="50%">

### 💫 Nodes
![Node effects](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/nodes.webp)

*   **5 effects**: Gentle Pulse, Neon Nexus, Cosmic Ripple and Sacred Rosette (v1's Flower of Life, its rings now closed), drawn over the node at v1's strength, and the new **Flower of Life**: nineteen circles that draw themselves in, the Seed of Life first, then bloom and turn, with a halo and a glowing frame on selected nodes.
*   **Particles** with or without an effect, in 6 color modes.
*   **5 title styles** and a **Node FX** menu to give one node its own effect.

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Looks and the FX panel
![Looks in the FX panel](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/looks.webp)

*   **11 looks**: hover one to preview it on the canvas, click to apply, Undo to go back. Save your own, share them as JSON, or let **Surprise me** pick.
*   **The FX tab** in the sidebar: Looks, Links, Nodes, Focus & Flow, Perf and About, with search, live previews and a reset on every changed setting.

</td>
<td width="50%">

### 🎯 Selection focus and navigation
![Selection focus](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/focus.webp)

*   **Highlight**, **Animate only these**, **Dim others** or **Hide others**, in ComfyUI's white, the theme accent or the link type color.
*   **Reach**: direct links, everything upstream or downstream, or the whole chain, through reroutes. Focused links can go above nodes.
*   **Go to connected node** (node menu), double-click a slot to jump, **Go back**.

</td>
</tr>
<tr>
<td width="50%">

### 🏁 Run visuals and completion
![Run visuals](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/run.webp)

*   **For runs you queue**: a data river into the running node, a progress ring (theme accent, effect color, custom, rainbow or amber → green), the executed path's fading trail, a red pulse on a failed node. **Go to running node** goes there, then to errors.
*   **When it finishes**: Fireworks (v1's), Confetti, Shockwave (default), Path trace or Surprise, over the output nodes, nodes you mark Primary, or the center of the screen.
*   **During a run**: Spotlight (default) holds other effects still; Calm, Freeze effects or Keep animating.

</td>
<td width="50%">

### 🧵 Wire physics
![Wire physics](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/physics.webp)

*   **Rope, Whip or Gel**: links sag and swing as you move nodes, with any animation or none.
*   Wires stay clickable along their whole length, and stop redrawing once they settle.
*   The **Living Wires** look: native-looking wires that sag like rope.

</td>
</tr>
<tr>
<td width="50%">

### 👐 Connection assist
![Connection assist](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/assist.webp)

*   While you drag a link, the nearest slot within reach that it can connect to gets a **Guide line**, **Reaching hands** that clasp when you are close, or **Hands & eyes**.
*   **Connect on release** (on by default): let go once the hands clasp, or wherever the guide line points, and the link connects there. Hold the **Snap key** (Ctrl, ⌘ on Mac) as you let go to connect from anywhere in reach.
*   A link let go on a slot, a node or a reroute connects exactly as in ComfyUI; one let go far from any slot opens ComfyUI's link-release search.

</td>
<td width="50%">

### 🧊 Nodes 2.0
![Nodes 2.0](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/vue.webp)

*   Node effects show as glows (halo, each effect, selection, running and failed) with particles beneath.
*   Focused links, progress rings, error outlines, completion effects and connection assist draw on a layer above the nodes.

</td>
</tr>
</table>

---

## 🎨 Looks

A look sets how links and nodes look in one click; it never changes your focus, navigation or performance settings. Pick one on the first-run card, in the panel's **Looks** tab, or with **Choose look…** in View › Enhanced Links & Nodes.

<table>
<tr>
<td width="33%"><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-off.webp" alt="Off"><br><b>Off</b>: native links and nodes, no run visuals or completion effect.</td>
<td width="33%"><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-subtle.webp" alt="Subtle"><br><b>Subtle</b> (default): Classic Flow with gliding arrows and v1's halo, plain nodes, a shockwave at the end of a run.</td>
<td width="33%"><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-showcase.webp" alt="Showcase"><br><b>Showcase</b>: Cosmic Weave on rope wires, Neon Nexus with aurora particles, hands and eyes, fireworks.</td>
</tr>
<tr>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-performance.webp" alt="Performance"><br><b>Performance</b>: still links, less glow, no shadows or completion effect.</td>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-classic-v1.webp" alt="Classic v1"><br><b>Classic v1</b>: v1 out of the box, with none of 3.0's run visuals.</td>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-neon-night.webp" alt="Neon Night"><br><b>Neon Night</b>: Energy Pulse and Neon Nexus in cyan and magenta, confetti.</td>
</tr>
<tr>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-lava-lamp.webp" alt="Lava Lamp"><br><b>Lava Lamp</b>: Lava Flow and Cosmic Ripple in reds and ambers, fireworks.</td>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-sacred-geometry.webp" alt="Sacred Geometry"><br><b>Sacred Geometry</b>: Merkaba Beads and Flower of Life in gold, path trace.</td>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-living-wires.webp" alt="Living Wires"><br><b>Living Wires</b>: native-looking wires that sag like rope, reaching hands.</td>
</tr>
<tr>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-presenter.webp" alt="Presenter"><br><b>Presenter</b>: thicker, high-contrast links and larger markers, for streams.</td>
<td><img src="https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v3/look-blueprint.webp" alt="Blueprint"><br><b>Blueprint</b>: muted right-angle links with square markers, path trace.</td>
<td></td>
</tr>
</table>

---

## 📦 Installation

### Option 1: ComfyUI Manager (Recommended)
1.  Open **ComfyUI Manager**.
2.  Search for **`ComfyUI-EnhancedLinksandNodes`**.
3.  Click **Install**, then restart ComfyUI and reload the page.

### Option 2: Manual Install
```bash
cd /path/to/ComfyUI/custom_nodes
git clone https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes.git
```

Needs ComfyUI frontend 1.39.5 or later. The extension adds no nodes and has no Python dependencies.

The **showcase** example workflow (core nodes only, no models, runs in seconds on CPU) is in ComfyUI's templates under this extension: queue it to see the run visuals and the completion effect.

---

## 🔑 Quick toggles

Shortcut keys are off by default, as some browsers and desktops use the same keys. Turn them on in the FX panel under **Perf › Shortcut keys** (or the settings dialog), as Alt or Alt+Shift, and reload the page.

| Key | Command | Also in |
| :--- | :--- | :--- |
| **Alt+L** or **Alt+Shift+L** | Show or hide the FX panel | The **FX** tab in the sidebar |
| **Alt+K** or **Alt+Shift+K** | Toggle all effects | The action bar's button, View › Enhanced Links & Nodes |
| **Alt+J** or **Alt+Shift+J** | Go to running node, or once a run failed, the next error | View menu, canvas menu |

*   **View › Enhanced Links & Nodes**: Panel, Choose look…, Surprise me, All effects, Link effects, Node effects, Freeze animation, Selection focus, Follow execution, Go to running node and Next error.
*   **Right-click the canvas › Enhanced FX**: Link effects, Node effects, Freeze animation, Selection focus, Follow execution, Go to running node, the current look, Surprise me and Open panel.
*   **Right-click a node**: **Node FX ›** (an effect for that node, or particles only), **Completion FX ›** (Primary or Exclude) and **Go to connected node ›**. The selection toolbox has a button that cycles the selected nodes' effect.
*   A key another command already uses is left to it. All 20 commands can be given keys in **Settings › Keybinding**.

---

## 🔧 Settings

All 96 settings are in ComfyUI's settings dialog under **Enhanced Links & Nodes**, grouped as Links, Nodes, Focus & Flow and Performance, each with a readable name and its real range; the FX panel shows the same settings, with the less used ones behind **Advanced settings**. [docs/SETTINGS.md](docs/SETTINGS.md) lists every setting with its id, options or range, and default.

*   **Link effects** and **Node effects** switch each half off and keep its settings.
*   **Freeze link animation** and **Freeze node effects** keep the look and stop the motion.
*   The About tab's **Copy diagnostics** puts your versions and settings on the clipboard for a bug report; nothing is sent anywhere.

---

## 🧩 Compatibility

| | |
| :--- | :--- |
| **ComfyUI frontend** | 1.39.5 or later; tested on 1.39.5 and 1.57.1. |
| **Classic nodes** | Everything. |
| **Nodes 2.0** | Glows, particles, selection focus, run visuals, completion effects and connection assist. Classic only, as the panel says: the patterns inside nodes (Neon Nexus's tube and lattice, Cosmic Ripple's rings, Sacred Rosette's and Flower of Life's patterns), animated titles, the hover outline, focus on hover and the double-click jump. |
| **Subgraphs** | Effects keep animating inside them, and links into and out of them stay native. |
| **KJNodes, MagnifyGlass** | Work alongside, tested together. |
| **LinkFX and other extensions that draw links** | **Other link extensions** is *Step aside if one is found* by default: the other extension draws the links, and node effects, progress rings and completion effects keep working. |
| **Browser** | Tested in Chromium. |
| **Network** | No requests beyond your ComfyUI server, no remote fonts. |

---

## ⚡ Performance tips

*   Nothing redraws while nothing moves, and off-screen links are skipped.
*   **Adaptive quality** (on by default): when frames run long, link glows go plain, then particles thin out, then effects hold still; they come back when there is room.
*   **Freeze above N visible links** (400 by default) holds link motion still on crowded screens, and Nodes 2.0 glows above a quarter as many animated nodes.
*   **Hide effects zoomed out below** (25% by default): zoomed out further, links and nodes are drawn as ComfyUI draws them. Set it to 0 to keep effects at every zoom, or higher to save work on big graphs.
*   Glow is the biggest cost: lower **Link glow** and **Marker glow**, or turn the shadows off. Sacred Flow, DNA Helix, DNA Helix 3D and Lava Flow are the heaviest animations.
*   **Keep link glow while moving** (on by default) redraws busy graphs' glows as you zoom or drag nodes; turn it off for smoother zooming on slower machines.
*   The **Performance** look, **Freeze link animation**, or an **Effect frame-rate cap** of 30 fps.
*   In Nodes 2.0, an effect on every node costs the most: give effects to a few nodes with **Node FX** instead.

---

## ❓ FAQ

<details>
<summary><b>I updated and nothing changed.</b></summary>

Restart ComfyUI and reload the page. Once the page is idle, a **Choose your look** card opens at the bottom left of the canvas; until you pick, Subtle shows, or your own settings if you changed any in 2.x. Pick a look there, or any time in the FX panel.

</details>

<details>
<summary><b>How do I get the v1 look back?</b></summary>

Apply the **Classic v1** look: the link under the looks on the first-run card, or the Looks tab. It sets v1's defaults, with v1's halo and Neon Nexus nodes in v1's colors, and turns off 3.0's run visuals.

</details>

<details>
<summary><b>Does it work with LinkFX?</b></summary>

Yes. With **Other link extensions** at its default, *Step aside if one is found*, LinkFX draws the links and Enhanced keeps node effects, progress rings and completion effects. Set it to *Keep Enhanced link effects* to draw ours instead.

</details>

<details>
<summary><b>How do I roll back to 2.0.1?</b></summary>

In ComfyUI Manager, switch the version to 2.0.1. With git: `git checkout 852af8a` (2.0.1) in the extension's folder. 3.0 never renames or deletes a 2.x setting, so 2.0.1 reads your settings file as before and ignores what only 3.0 knows. To turn effects off without uninstalling, click the extension's button on the action bar (**Toggle all effects**), or disable either extension in **Settings › Extension**.

</details>

<details>
<summary><b>Can I reduce motion?</b></summary>

**Motion** (Perf tab) is *Follow system* by default: effects hold still while your system or ComfyUI's **Disable animations** asks for less motion. *Reduce* always holds them still, *Full* always animates. Flashing is kept to 3 a second or less.

</details>

---

## 🐛 Known Issues

*   **Nodes 2.0**: Escape does not end a slot drag, so connection assist stays until you release. ComfyUI's node opacity, and 1.57's drop shadow, also fall on the glows.
*   **Run visuals** follow the runs this page queued. A run that starts while another workflow is shown draws on the shown workflow's nodes, as ComfyUI's own progress does, and a page reloaded mid-run shows nothing until the next run.
*   **Frontend 1.39.5**: with Shortcut keys on and both extensions disabled, Alt+L logs "Command … not found" in the console.

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for the setup, the checks and the test harness.

---

## 🙏 Credits

*   [m4d1sir](https://github.com/m4d1sir), whose builds in #45 showed the way to selected-only links, selected links on top and native colors; their ideas are reimplemented in 3.0.
*   Connection assist's hands and eyes are inspired by [nodezator](https://github.com/IndieSmiths/nodezator), which [Foolsets](https://github.com/Foolsets) suggested in #3.
*   Everyone who reported issues: [Aljnk](https://github.com/Aljnk) (#4), [alenhrp](https://github.com/alenhrp) (#5), [kakkkarot](https://github.com/kakkkarot) and [chris2018cfh](https://github.com/chris2018cfh) (#40), [jakieliu2019-coder](https://github.com/jakieliu2019-coder) (#44), [HuntingSuccubus](https://github.com/HuntingSuccubus) (#46).

---

## 📝 License

Enhanced Links & Nodes is licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later); see [LICENSE](LICENSE).

---

<div align="center">

**Developed by [Æmotion Studio](https://aemotionstudio.org/)**

[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@aemotionstudio/videos)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/UzC9353mfp)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/aemotionstudio)

</div>
