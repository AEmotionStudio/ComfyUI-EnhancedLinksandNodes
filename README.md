<div align="center">

# ComfyUI-Enhanced Links and Nodes 🎨✨

**A visually stunning extension for ComfyUI that adds beautiful, customizable animations to both links and nodes in your workflow.**

[![ComfyUI](https://img.shields.io/badge/ComfyUI-Extension-green?style=for-the-badge)](https://github.com/comfyanonymous/ComfyUI)
[![Version](https://img.shields.io/badge/Version-2.0.1-orange?style=for-the-badge)](CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/AEmotionStudio/ComfyUI-EnhancedLinksandNodes?style=for-the-badge&label=Last%20Update&color=orange)](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/commits)
[![Activity](https://img.shields.io/github/commit-activity/m/AEmotionStudio/ComfyUI-EnhancedLinksandNodes?style=for-the-badge&label=Activity&color=yellow)](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/commits)

![ComfyUI-Enhanced](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v1/preview.webp)

*Enhanced visual aids • Customizable animations • Performance focused*

<p align="center">
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-settings">Settings</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="CHANGELOG.md">Changelog</a>
</p>

</div>

---

## What's New in v2.0.1

**Complete TypeScript Rewrite & Sidebar UI**

*   **Sidebar Settings Panel** — adjust all link and node settings live with instant visual preview
*   **Independent Particles** — particles now work as a standalone feature, no animation style required
*   **Reset to Defaults** — one-click reset buttons for both link and node settings
*   **Complete TypeScript Rewrite** — modular, type-safe architecture with batched rendering and 60+ registered settings

> 📄 **See [CHANGELOG.md](CHANGELOG.md) for the complete version history.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔄 Link Animations

- **9 Unique Animation Styles**:
  - Classic Flow, Sacred Flow, Crystal Stream, Quantum Field, Cosmic Weave, Energy Pulse, DNA Helix, Lava Flow, Stellar Plasma
- **Link Style Options**:
  - Spline, Straight, Linear, Hidden, Dotted, Dashed, Double, Stepped, Zigzag, Rope, Glowpath, Chain, Pulse
- **Marker Customization**:
  - Multiple shapes, color modes, size adjustment, glow intensity
- **Advanced Color Options**:
  - Primary, secondary, and accent colors, custom schemes, glow effects

</td>
<td width="50%">

### 💫 Node Animations

- **4 Node Animation Styles**:
  - Gentle Pulse, Neon Nexus, Cosmic Ripple, Flower of Life
- **Independent Particle System**:
  - Works standalone or combined with any animation style
  - 6 color modes: default, rainbow, complementary, energy, quantum, aurora
- **Node Animation Features**:
  - Static mode option
  - Completion effects
  - 5 text animation styles (neon, cyberpunk, retro, pulse, minimal)
  - Quality settings
  - Animation speed control

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ Performance Focused

- **Performance Settings**:
  - Quality control
  - Static mode
  - Animation speed
  - Particle density
  - Pause during render option
- **Efficient Rendering**: Optimized for performance, though larger workflows may require adjustment.

</td>
<td width="50%">

### 🎨 Visual Tools

- **Live Sidebar Panel**: Adjust all settings with instant visual feedback
- **Reset to Defaults**: One-click restore for link and node settings
- **Context Menu for Nodes**: Easy access to per-node settings
- **End of Animation Completion Effect**: Visual feedback when tasks complete
- **Text Animation Tool**: 5 styles to bring node titles to life

</td>
</tr>
</table>

**Context Menu for Nodes**

![ComfyUI-Enhanced](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v1/preview2.webp)

**End of Animation Completion Effect**

![ComfyUI-Enhanced](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v1/preview3.webp)

**Text Animation Tool**

![ComfyUI-Enhanced](https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes/releases/download/assets-v1/preview4.webp)

---

## 🚀 Installation

### Option 1: ComfyUI Manager (Recommended)
Search for "ComfyUI Enhanced" in ComfyUI Manager and click Install.

### Option 2: Git Clone

1. Navigate to your ComfyUI custom nodes directory:
```bash
cd ComfyUI/custom_nodes/
```

2. Clone the repository:
```bash
git clone https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes.git
```

3. Restart ComfyUI

---

## ⚙️ Settings

Every setting is in ComfyUI's settings dialog under **Enhanced Links & Nodes**, and most are in the Enhanced sidebar panel too; [docs/SETTINGS.md](docs/SETTINGS.md) lists each one with its id, options or range, and default.

<details>
<summary><b>🔄 Link Animation Settings</b></summary>

- **Animation Style**: Choose from 9 unique animation patterns
- **Link Style**: Select from 13 different connection styles
- **Marker Options**: Customize shape, color, size, and effects
- **Color Settings**: Configure primary, secondary, and accent colors
- **Performance**: Adjust quality, speed, and particle density
- **Effects**: Control glow intensity and shadow settings

</details>

<details>
<summary><b>💫 Node Animation Settings</b></summary>

- **Animation Style**: Select global or per-node animation patterns
- **Mode Options**: Toggle between animated and static modes
- **Particle Effects**: Adjust density, glow, and intensity
- **Completion Effects**: Enable special animations on node completion
- **Text Animation**: Optional animated node titles
- **Performance**: Control quality and animation speed

</details>

<details>
<summary><b>⚡ Performance Tips</b></summary>

- Use "Static Mode" during heavy workflow execution
- Adjust "Quality" settings based on your system capabilities
- Reduce "Particle Density" if experiencing performance issues
- Enable "Pause During Render" for optimal rendering performance
- Consider using "Particles Only" mode for lighter animations
- Animations can be disabled node by node - so you can have some nodes animated and some static or none at all.

</details>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute to this project.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Developed by [Æmotion Studio](https://aemotionstudio.org/)**

[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@aemotionstudio/videos)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/UzC9353mfp)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/aemotionstudio)

</div>
