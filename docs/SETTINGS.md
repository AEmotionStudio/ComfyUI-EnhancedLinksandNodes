# Settings

<!-- Generated from src/core/settings.ts by `pnpm gen:settings`. -->

ComfyUI's settings dialog lists every setting under **Enhanced Links & Nodes**, in the groups below. The id is the key ComfyUI saves the value under, in the user's `comfy.settings.json`.

## Links · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link animation | `🔗 Enhanced Links.Animate` | combo | `0` None, `9` Classic Flow, `1` Sacred Flow, `2` Crystal Stream, `3` Quantum Field, `4` Cosmic Weave, `5` Energy Pulse, `6` DNA Helix, `7` Lava Flow, `8` Stellar Plasma | `9` Classic Flow | Effect drawn along every link. |
| Link animation speed | `🔗 Enhanced Links.Animation.Speed` | slider | 0.1 to 3, step 0.05 | `1` |  |
| Link flow direction | `🔗 Enhanced Links.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward | Which way effects travel. |
| Freeze link animation | `🔗 Enhanced Links.Static.Mode` | boolean | `true`, `false` | `false` | Keep the look but stop the motion. |

## Links · Path

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link path shape | `🔗 Enhanced Links.Link.Style` | combo | `spline` Same as ComfyUI, `straight` Direct, `linear` Right-angle, `hidden` Effect only, `dotted` Dotted, `dashed` Dashed, `double` Double, `stepped` Stepped, `zigzag` Wave, `coil` Coil, `rope` Rope, `glowpath` Glow path, `chain` Chain, `pulse` Pulse, `holographic` Holographic | `spline` Same as ComfyUI | Same as ComfyUI follows the Link Render Mode setting. |
| Link thickness | `🔗 Enhanced Links.Thickness` | slider | 1 to 10, step 0.5 | `3` |  |
| Link effect quality | `🔗 Enhanced Links.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `1` Fast | More detail, more GPU. |
| Link particle density | `🔗 Enhanced Links.Particle.Density` | combo | `0.5` Minimal, `1` Balanced, `2` Dense, `3` Ultra | `0.5` Minimal | How many particles or markers each link carries. |

## Links · Color

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link colors | `🔗 Enhanced Links.Color.Mode` | combo | `default` Link type colors, `custom` Custom | `default` Link type colors | Type colors follow your palette. |
| Link primary color | `🔗 Enhanced Links.Color.Primary` | color | `#rrggbb` | `#ffb300` | Used when Link colors is Custom. |
| Link secondary color | `🔗 Enhanced Links.Color.Secondary` | color | `#rrggbb` | `#fb00ff` | Used when Link colors is Custom. |
| Link accent color | `🔗 Enhanced Links.Color.Accent` | color | `#rrggbb` | `#9d00ff` | Used when Link colors is Custom. |
| Link color boost | `🔗 Enhanced Links.Color.Scheme` | combo | `default` Off, `saturated` Saturated, `vivid` Vivid, `contrast` High contrast, `bright` Bright, `muted` Muted | `default` Off | Filter applied on top of the colors. |
| Link glow | `🔗 Enhanced Links.Glow.Intensity` | slider | 0 to 20, step 1 | `10` |  |

## Links · Markers

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Flow markers | `🔗 Enhanced Links.Marker.Enabled` | boolean | `true`, `false` | `true` | Shapes gliding along links in Classic Flow, and in the other animations with Markers on every animation. |
| Markers on every animation | `🔗 Enhanced Links.Marker.All` | boolean | `true`, `false` | `false` | Flow markers over every link animation, not only Classic Flow. |
| Marker shape | `🔗 Enhanced Links.Marker.Shape` | combo | `none` None, `arrow` Arrow, `diamond` Diamond, `circle` Circle, `square` Square, `triangle` Triangle, `star` Star, `heart` Heart, `cross` Cross, `hexagon` Hexagon, `flower` Flower, `spiral` Spiral, `merkaba` Merkaba | `arrow` Arrow |  |
| Marker size | `🔗 Enhanced Links.Marker.Size` | slider | 1 to 5, step 0.5 | `3` |  |
| Marker color | `🔗 Enhanced Links.Marker.Color.Mode` | combo | `default` Link type color, `inherit` Same as link, `custom` Custom | `default` Link type color | Same as link follows custom link colors. |
| Marker custom color | `🔗 Enhanced Links.Marker.Color` | color | `#rrggbb` | `#00fff7` | Used when Marker color is Custom. |
| Marker glow | `🔗 Enhanced Links.Marker.Glow` | slider | 0 to 20, step 1 | `10` |  |
| Marker effect | `🔗 Enhanced Links.Marker.Effects` | combo | `none` None, `pulse` Pulse, `fade` Fade, `rainbow` Rainbow | `none` None |  |

## Links · Shadows

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link shadow | `🔗 Enhanced Links.Link.Shadow.Enabled` | boolean | `true`, `false` | `true` | Dark outline under links in Classic Flow, which makes them stand out. |
| Marker shadow | `🔗 Enhanced Links.Marker.Shadow.Enabled` | boolean | `true`, `false` | `true` | Dark outline under flow markers. |
| Shadow style | `🔗 Enhanced Links.Shadow.Style` | combo | `halo` Halo (v1), `drop` Drop shadow (v2) | `halo` Halo (v1) | Halo is the soft dark outline v1 drew; Drop shadow is offset, as in v2. |
| Drop shadow blur | `🔗 Enhanced Links.Shadow.Blur` | slider | 0 to 10, step 0.5 | `5` | Used by Drop shadow. |
| Drop shadow offset | `🔗 Enhanced Links.Shadow.Offset` | slider | 0 to 10, step 0.5 | `3` | Used by Drop shadow. |

## Links · Compatibility

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Other link extensions | `🔗 Enhanced Links.Coexist` | combo | `auto` Step aside if one is found, `ours` Keep Enhanced link effects, `defer` Always step aside | `auto` Step aside if one is found | When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working. |

## Nodes · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect | `📦 Enhanced Nodes.Animate` | combo | `0` None, `1` Gentle Pulse, `2` Neon Nexus, `3` Cosmic Ripple, `4` Flower of Life | `0` None | Effect drawn on and around every node. Node FX in the node menu picks one for a node. |
| Show base effect | `📦 Enhanced Nodes.Animations.Enabled` | boolean | `true`, `false` | `true` | Off draws only the effect's own particles. |
| Node effect speed | `📦 Enhanced Nodes.Animation.Speed` | slider | 0.1 to 3, step 0.1 | `1` |  |
| Node effect direction | `📦 Enhanced Nodes.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward |  |
| Freeze node effects | `📦 Enhanced Nodes.Static.Mode` | boolean | `true`, `false` | `false` |  |
| Node effect energy | `📦 Enhanced Nodes.Intensity` | slider | 0.1 to 2, step 0.1 | `1` |  |
| Node effect size | `📦 Enhanced Nodes.Animation.Size` | slider | 0.5 to 3, step 0.1 | `1` |  |
| Node effect bloom | `📦 Enhanced Nodes.Animation.Glow` | slider | 0 to 1, step 0.05 | `0.5` | Glow of the effect's lines and light, and of the hover outline. |
| Node effect quality | `📦 Enhanced Nodes.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `2` Balanced | More detail, more GPU. |

## Nodes · Glow & hover

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect glow | `📦 Enhanced Nodes.Glow.Show` | boolean | `true`, `false` | `true` | A halo in the effect's primary color around each node with an effect. |
| Node glow strength | `📦 Enhanced Nodes.Glow` | slider | 0 to 1, step 0.05 | `0.5` | How far the halo and the selection frame glow. |
| Glowing frame around selected nodes | `📦 Enhanced Nodes.Selection.Glow` | boolean | `true`, `false` | `true` | On nodes with an effect. |
| Hover outline | `📦 Enhanced Nodes.Color.Hover.Show` | boolean | `true`, `false` | `false` | Outlines animated nodes while hovered or selected. |
| Hover outline color | `📦 Enhanced Nodes.Color.Hover` | color | `#rrggbb` | `#00ff15` |  |

## Nodes · Color

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect colors | `📦 Enhanced Nodes.Color.Mode` | combo | `default` Style colors, `custom` Custom | `default` Style colors |  |
| Node primary color | `📦 Enhanced Nodes.Color.Primary` | color | `#rrggbb` | `#ffb300` | Used when Node effect colors is Custom. |
| Node secondary color | `📦 Enhanced Nodes.Color.Secondary` | color | `#rrggbb` | `#fb00ff` | Used when Node effect colors is Custom. |
| Node accent color | `📦 Enhanced Nodes.Color.Accent` | color | `#rrggbb` | `#9d00ff` | Used when Node effect colors is Custom. |
| Node color boost | `📦 Enhanced Nodes.Color.Scheme` | combo | `default` Off, `saturated` Saturated, `vivid` Vivid, `contrast` High contrast, `bright` Bright, `muted` Muted | `default` Off | Filter applied on top of the colors. |

## Nodes · Particles

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node particles | `📦 Enhanced Nodes.Particle.Show` | boolean | `true`, `false` | `false` | Also drawn when Node effect is None. |
| Node particle density | `📦 Enhanced Nodes.Particle.Density` | combo | `0.5` Minimal, `1` Balanced, `2` Dense, `3` Ultra | `1` Balanced |  |
| Node particle size | `📦 Enhanced Nodes.Particle.Size` | slider | 0.1 to 3, step 0.1 | `1` |  |
| Node particle speed | `📦 Enhanced Nodes.Particle.Speed` | slider | 0.1 to 5, step 0.1 | `1` |  |
| Node particle motion | `📦 Enhanced Nodes.Particle.Intensity` | slider | 0.1 to 2, step 0.1 | `1` | How energetic the motion is. |
| Node particle glow | `📦 Enhanced Nodes.Particle.Glow` | slider | 0 to 1, step 0.05 | `0.5` |  |
| Node particle colors | `📦 Enhanced Nodes.Particle.Color.Mode` | combo | `default` Particle color, `rainbow` Rainbow, `complementary` Complementary, `energy` Energy, `quantum` Quantum, `aurora` Aurora | `default` Particle color | Particle color takes Node particle color with Custom colors, else the effect's primary color; Complementary takes its opposite hue. |
| Node particle color | `📦 Enhanced Nodes.Color.Particle` | color | `#rrggbb` | `#ffb300` | Used when Node effect colors is Custom. |

## Nodes · Titles

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Animated titles | `📦 Enhanced Nodes.Text.Animation.Enabled` | boolean | `true`, `false` | `false` | Draws each node title in the chosen style. |
| Title style | `📦 Enhanced Nodes.Text.Style` | combo | `neon` Neon pulse, `cyberpunk` Glitch, `retro` Retro, `pulse` Simple pulse, `minimal` Minimal | `neon` Neon pulse |  |
| Title color | `📦 Enhanced Nodes.Text.Color` | color | `#rrggbb` | `#00ffff` | Used when Node effect colors is Custom; otherwise titles take the effect's accent color. |
| Title size | `📦 Enhanced Nodes.Text.Size` | slider | 8 to 24, step 1 | `14` |  |
| Title glow | `📦 Enhanced Nodes.Text.Glow` | slider | 0 to 1, step 0.05 | `0.5` |  |
| Title letter spacing | `📦 Enhanced Nodes.Text.Letter.Spacing` | slider | -2 to 10, step 0.25 | `0` |  |
| Title offset X | `📦 Enhanced Nodes.Text.Position.X` | slider | -50 to 50, step 1 | `0` |  |
| Title offset Y | `📦 Enhanced Nodes.Text.Position.Y` | slider | -50 to 50, step 1 | `0` |  |
| Title orbit radius | `📦 Enhanced Nodes.Text.Rotation.Radius` | slider | 0 to 50, step 1 | `0` | Circles the title around its position. |
| Title rotation | `📦 Enhanced Nodes.Text.Rotation.Angle` | slider | -180 to 180, step 5 | `0` |  |

## Runs · During a run

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Pause link animation during runs | `🔗 Enhanced Links.Pause.During.Render` | boolean | `true`, `false` | `true` | Links hold a still frame while the queue is running. |
| Pause node effects during runs | `📦 Enhanced Nodes.Pause.During.Render` | boolean | `true`, `false` | `true` | Node effects and their particles hold still while the queue is running. |

## Runs · Completion

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Fireworks when a run finishes | `📦 Enhanced Nodes.End Animation.Enabled` | boolean | `true`, `false` | `true` | Above your run's output nodes. Completion FX in the node menu sets them for one node. |
