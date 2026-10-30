# Settings

<!-- Generated from src/core/settings.ts by `pnpm gen:settings`. -->

ComfyUI's settings dialog lists every setting under **Enhanced Links & Nodes**, in the groups below. The id is the key ComfyUI saves the value under, in the user's `comfy.settings.json`.

## Links · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link animation | `🔗 Enhanced Links.Animate` | combo | `0` None, `9` Classic Flow, `1` Sacred Flow, `2` Crystal Stream, `3` Quantum Field, `4` Cosmic Weave, `5` Energy Pulse, `6` DNA Helix, `7` Lava Flow, `8` Stellar Plasma | `9` Classic Flow | Effect drawn along every link. |
| Link animation speed | `🔗 Enhanced Links.Animation.Speed` | slider | 0.1 to 5, step 0.1 | `1` |  |
| Link flow direction | `🔗 Enhanced Links.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward | Which way effects travel. |
| Freeze link animation | `🔗 Enhanced Links.Static.Mode` | boolean | `true`, `false` | `false` | Keep the look but stop the motion. |

## Links · Path

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link path shape | `🔗 Enhanced Links.Link.Style` | combo | `spline` Spline, `straight` Direct (diagonal), `linear` Right-angle, `hidden` Effect only, `dotted` Dotted, `dashed` Dashed, `double` Double, `stepped` Stepped, `zigzag` Zigzag, `rope` Rope, `glowpath` Glow path, `chain` Chain, `pulse` Pulse, `holographic` Holographic | `spline` Spline |  |
| Link thickness | `🔗 Enhanced Links.Thickness` | slider | 1 to 10, step 0.5 | `3` |  |
| Link effect quality | `🔗 Enhanced Links.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `1` Fast | More detail, more GPU. |
| Link particle density | `🔗 Enhanced Links.Particle.Density` | slider | 0 to 2, step 0.1 | `0.5` | How many particles or markers each link carries. |

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
| Flow markers | `🔗 Enhanced Links.Marker.Enabled` | boolean | `true`, `false` | `true` | Shapes gliding along links in Classic Flow. |
| Marker shape | `🔗 Enhanced Links.Marker.Shape` | combo | `none` None, `arrow` Arrow, `diamond` Diamond, `circle` Circle, `square` Square, `triangle` Triangle, `star` Star, `heart` Heart, `cross` Cross, `hexagon` Hexagon, `flower` Flower, `spiral` Spiral | `arrow` Arrow |  |
| Marker size | `🔗 Enhanced Links.Marker.Size` | slider | 1 to 5, step 0.5 | `3` |  |
| Marker color | `🔗 Enhanced Links.Marker.Color.Mode` | combo | `default` Link type color, `custom` Custom | `default` Link type color |  |
| Marker custom color | `🔗 Enhanced Links.Marker.Color` | color | `#rrggbb` | `#00fff7` | Used when Marker color is Custom. |
| Marker glow | `🔗 Enhanced Links.Marker.Glow` | slider | 0 to 20, step 1 | `10` |  |
| Marker effect | `🔗 Enhanced Links.Marker.Effects` | combo | `none` None, `pulse` Pulse, `fade` Fade, `rainbow` Rainbow | `none` None |  |

## Links · Shadows

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link shadow | `🔗 Enhanced Links.Link.Shadow.Enabled` | boolean | `true`, `false` | `false` | Drop shadow under links in Classic Flow. |
| Marker shadow | `🔗 Enhanced Links.Marker.Shadow.Enabled` | boolean | `true`, `false` | `false` | Drop shadow under flow markers. |
| Drop shadow blur | `🔗 Enhanced Links.Shadow.Blur` | slider | 0 to 10, step 0.5 | `5` |  |
| Drop shadow offset | `🔗 Enhanced Links.Shadow.Offset` | slider | 0 to 10, step 0.5 | `3` |  |

## Nodes · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect | `📦 Enhanced Nodes.Animate` | combo | `0` None, `1` Gentle Pulse, `2` Neon Nexus, `3` Cosmic Ripple, `4` Flower of Life | `0` None | Effect drawn around every node. |
| Show base effect | `📦 Enhanced Nodes.Animations.Enabled` | boolean | `true`, `false` | `true` | Off hides the effect but keeps node particles. |
| Node effect speed | `📦 Enhanced Nodes.Animation.Speed` | slider | 0.1 to 5, step 0.1 | `1` |  |
| Node effect direction | `📦 Enhanced Nodes.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward |  |
| Freeze node effects | `📦 Enhanced Nodes.Static.Mode` | boolean | `true`, `false` | `false` |  |
| Node effect energy | `📦 Enhanced Nodes.Intensity` | slider | 0 to 3, step 0.1 | `1` |  |
| Node effect size | `📦 Enhanced Nodes.Animation.Size` | slider | 0.5 to 3, step 0.1 | `1` |  |
| Node effect bloom | `📦 Enhanced Nodes.Animation.Glow` | slider | 0 to 2, step 0.1 | `0.5` | Multiplies Node effect energy. |
| Node effect quality | `📦 Enhanced Nodes.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `2` Balanced | More detail, more GPU. |

## Nodes · Glow & hover

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect glow | `📦 Enhanced Nodes.Glow.Show` | boolean | `true`, `false` | `true` | Off draws node effects without glow. |
| Node glow strength | `📦 Enhanced Nodes.Glow` | slider | 0 to 2, step 0.1 | `0.5` | Glow of node effects and the hover outline. |
| Hover outline | `📦 Enhanced Nodes.Color.Hover.Show` | boolean | `true`, `false` | `false` | Outlines animated nodes while hovered or selected. |
| Hover outline color | `📦 Enhanced Nodes.Color.Hover` | color | `#rrggbb` | `#00ff15` |  |

## Nodes · Color

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effect colors | `📦 Enhanced Nodes.Color.Mode` | combo | `default` Style colors, `custom` Custom | `default` Style colors |  |
| Node primary color | `📦 Enhanced Nodes.Color.Primary` | color | `#rrggbb` | `#44aaff` | Used when Node effect colors is Custom. |
| Node secondary color | `📦 Enhanced Nodes.Color.Secondary` | color | `#rrggbb` | `#88ccff` | Used when Node effect colors is Custom. |
| Node accent color | `📦 Enhanced Nodes.Color.Accent` | color | `#rrggbb` | `#0088ff` | Used when Node effect colors is Custom. |
| Node color boost | `📦 Enhanced Nodes.Color.Scheme` | combo | `default` Off, `saturated` Saturated, `vivid` Vivid, `contrast` High contrast, `bright` Bright, `muted` Muted | `default` Off | Filter applied on top of the colors. |

## Nodes · Particles

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node particles | `📦 Enhanced Nodes.Particle.Show` | boolean | `true`, `false` | `false` | Also drawn when Node effect is None. |
| Node particle density | `📦 Enhanced Nodes.Particle.Density` | slider | 0 to 3, step 0.1 | `1` |  |
| Node particle size | `📦 Enhanced Nodes.Particle.Size` | slider | 0.1 to 3, step 0.1 | `1` |  |
| Node particle speed | `📦 Enhanced Nodes.Particle.Speed` | slider | 0.1 to 5, step 0.1 | `1` |  |
| Node particle motion | `📦 Enhanced Nodes.Particle.Intensity` | slider | 0 to 3, step 0.1 | `1` | How energetic the motion is. |
| Node particle glow | `📦 Enhanced Nodes.Particle.Glow` | slider | 0 to 2, step 0.1 | `0.5` |  |
| Node particle colors | `📦 Enhanced Nodes.Particle.Color.Mode` | combo | `default` Particle color, `rainbow` Rainbow, `complementary` Complementary, `energy` Energy, `quantum` Quantum, `aurora` Aurora | `default` Particle color | Complementary is the opposite hue of the node accent color. |
| Node particle color | `📦 Enhanced Nodes.Color.Particle` | color | `#rrggbb` | `#ffff00` | Used when Node particle colors is Particle color. |

## Nodes · Titles

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Animated titles | `📦 Enhanced Nodes.Text.Animation.Enabled` | boolean | `true`, `false` | `false` | Draws a styled copy of each node title. |
| Title style | `📦 Enhanced Nodes.Text.Style` | combo | `neon` Neon pulse, `cyberpunk` Glitch, `retro` Retro, `pulse` Simple pulse, `minimal` Minimal | `neon` Neon pulse |  |
| Title color | `📦 Enhanced Nodes.Text.Color` | color | `#rrggbb` | `#00ffff` |  |
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
| Pause node effects during runs | `📦 Enhanced Nodes.Pause.During.Render` | boolean | `true`, `false` | `true` | Node effects hold still while the queue is running; their particles keep moving. |

## Runs · Completion

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Completion effect | `📦 Enhanced Nodes.End Animation.Enabled` | boolean | `true`, `false` | `false` | Has no effect yet. |
