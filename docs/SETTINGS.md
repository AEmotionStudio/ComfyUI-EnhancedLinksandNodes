# Settings

<!-- Generated from src/core/settings.ts by `pnpm gen:settings`. -->

ComfyUI's settings dialog lists every setting under **Enhanced Links & Nodes**, in the groups below. The id is the key ComfyUI saves the value under, in the user's `comfy.settings.json`.

## Links · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link effects | `🔗 Enhanced Links.Enabled` | boolean | `true`, `false` | `true` | Off draws native ComfyUI links and leaves every other link setting as it is. |
| Link animation | `🔗 Enhanced Links.Animate` | combo | `0` None, `9` Classic Flow, `1` Sacred Flow, `10` Merkaba Beads, `2` Crystal Stream, `3` Quantum Field, `4` Cosmic Weave, `5` Energy Pulse, `12` Comet Trails, `6` DNA Helix, `11` DNA Helix 3D, `7` Lava Flow, `8` Stellar Plasma, `13` Stardust | `9` Classic Flow | Effect drawn along every link. |
| Link animation speed | `🔗 Enhanced Links.Animation.Speed` | slider | 0.1 to 3, step 0.05 | `1` |  |
| Link flow direction | `🔗 Enhanced Links.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward | Which way effects travel. |
| Freeze link animation | `🔗 Enhanced Links.Static.Mode` | boolean | `true`, `false` | `false` | Keep the look but stop the motion. |

## Links · Path

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link path shape | `🔗 Enhanced Links.Link.Style` | combo | `spline` Same as ComfyUI, `straight` Direct, `linear` Right-angle, `hidden` Effect only, `dotted` Dotted, `dashed` Dashed, `double` Double, `stepped` Stepped, `zigzag` Wave, `coil` Coil, `rope` Rope, `glowpath` Glow path, `chain` Chain, `pulse` Pulse, `holographic` Holographic | `spline` Same as ComfyUI | Same as ComfyUI follows the Link Render Mode setting. |
| Link thickness | `🔗 Enhanced Links.Thickness` | slider | 1 to 10, step 0.5 | `3` |  |
| Wire physics | `🔗 Enhanced Links.Physics.Profile` | combo | `off` Off, `rope` Cable, `whip` Spring, `gel` Syrup | `off` Off | Wires sag and swing; works with any animation, including None. |
| Link effect quality | `🔗 Enhanced Links.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `1` Fast | More detail, more GPU. |
| Link particle density | `🔗 Enhanced Links.Particle.Density` | combo | `0.5` Minimal, `1` Balanced, `2` Dense, `3` Ultra | `0.5` Minimal | How many particles or markers each link carries. |
| Wire physics strength | `🔗 Enhanced Links.Physics.Amount` | slider | 0 to 2, step 0.1 | `1` | How far wires sag and swing: 0 keeps the native shape, 2 is twice the profile. |

## Links · Color

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Link colors | `🔗 Enhanced Links.Color.Mode` | combo | `default` Link type colors, `custom` Custom | `default` Link type colors | Type colors follow your palette. |
| Link primary color | `🔗 Enhanced Links.Color.Primary` | color | `#rrggbb` | `#ffb300` | Used when Link colors is Custom. |
| Link secondary color | `🔗 Enhanced Links.Color.Secondary` | color | `#rrggbb` | `#fb00ff` | Used when Link colors is Custom. |
| Link accent color | `🔗 Enhanced Links.Color.Accent` | color | `#rrggbb` | `#9d00ff` | Used when Link colors is Custom. |
| Link color boost | `🔗 Enhanced Links.Color.Scheme` | combo | `default` Off, `saturated` Saturated, `vivid` Vivid, `contrast` High contrast, `bright` Bright, `muted` Muted | `default` Off | Filter applied on top of the colors. |
| Link glow | `🔗 Enhanced Links.Glow.Intensity` | slider | 0 to 20, step 1 | `10` |  |
| Glow blending | `🔗 Enhanced Links.Blend` | combo | `normal` Normal, `additive` Additive glow | `normal` Normal | Additive glow lets the moving effects brighten where they cross, on dark palettes; light palettes and canvas background images always use Normal. |

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

## Links · Connecting

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Connection assist | `🔗 Enhanced Links.Assist.Mode` | combo | `off` Off, `line` Guide line, `hands` Reaching hands, `hands-eyes` Hands & eyes | `off` Off | While you drag a link, show the nearest slot it can connect to. |
| Clasp shimmer | `🔗 Enhanced Links.Assist.Shine` | boolean | `true`, `false` | `true` | Light bursts from the hands as they clasp. |
| Connect on release | `🔗 Enhanced Links.Assist.AutoConnect` | boolean | `true`, `false` | `true` | Let go once the hands clasp, or once the guide line points at a slot, and the link connects there. |
| Snap key | `🔗 Enhanced Links.Assist.SnapKey` | combo | `ctrl` Ctrl (⌘ on Mac), `alt` Alt (Option on Mac), `off` Off | `ctrl` Ctrl (⌘ on Mac) | Hold it as you let go to connect to the slot connection assist shows, anywhere in its reach. |

## Nodes · Effect

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node effects | `📦 Enhanced Nodes.Enabled` | boolean | `true`, `false` | `true` | Off draws native ComfyUI nodes, with no effects, halos, particles, styled titles or completion effects, and leaves every other node setting as it is. |
| Node effect | `📦 Enhanced Nodes.Animate` | combo | `0` None, `1` Gentle Pulse, `2` Neon Nexus, `3` Cosmic Ripple, `4` Sacred Rosette, `5` Flower of Life, `6` Jelly, `7` Circuit Trace, `8` Aurora Veil, `9` Ember Crown | `0` None | Effect drawn on and around every node. Node FX in the node menu picks one for a node. |
| Show base effect | `📦 Enhanced Nodes.Animations.Enabled` | boolean | `true`, `false` | `true` | Off draws only the effect's own particles. |
| Node effect speed | `📦 Enhanced Nodes.Animation.Speed` | slider | 0.1 to 3, step 0.1 | `1` |  |
| Node effect direction | `📦 Enhanced Nodes.Direction` | combo | `1` Forward, `-1` Reverse | `1` Forward |  |
| Freeze node effects | `📦 Enhanced Nodes.Static.Mode` | boolean | `true`, `false` | `false` |  |
| Node effect energy | `📦 Enhanced Nodes.Intensity` | slider | 0.1 to 2, step 0.1 | `1` |  |
| Node effect size | `📦 Enhanced Nodes.Animation.Size` | slider | 0.5 to 3, step 0.1 | `1` |  |
| Node effect bloom | `📦 Enhanced Nodes.Animation.Glow` | slider | 0 to 1, step 0.05 | `0.5` | Glow of the effect's lines and light, and of the hover outline. |
| Node effect quality | `📦 Enhanced Nodes.Quality` | combo | `1` Fast, `2` Balanced, `3` Rich | `2` Balanced | More detail, more GPU. |

## Nodes · Background

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Node background | `📦 Enhanced Nodes.Background` | combo | `none` None, `plasma` Plasma, `aurora` Aurora, `starfield` Starfield, `liquid` Liquid, `smoke` Smoke, `grid` Grid, `lava` Lava, `caustics` Caustics | `none` None | An animated pattern on each node's body, under its slots and widgets, drawn on the GPU. Node background in the node menu picks one for a node. |
| Background strength | `📦 Enhanced Nodes.Background.Strength` | slider | 0.1 to 1, step 0.05 | `0.45` | How much of the node's own fill it covers: less keeps slot names easier to read. |
| Background speed | `📦 Enhanced Nodes.Background.Speed` | slider | 0 to 3, step 0.1 | `1` | 0 holds it still. |
| Background scale | `📦 Enhanced Nodes.Background.Scale` | slider | 0.25 to 4, step 0.05 | `1` | How large its pattern is. |
| Background colors | `📦 Enhanced Nodes.Background.Color.Mode` | combo | `preset` Pattern colors, `effect` Node effect colors, `custom` Custom | `preset` Pattern colors |  |
| Background primary color | `📦 Enhanced Nodes.Background.Color.Primary` | color | `#rrggbb` | `#00e5ff` |  |
| Background secondary color | `📦 Enhanced Nodes.Background.Color.Secondary` | color | `#rrggbb` | `#7c4dff` |  |
| Background accent color | `📦 Enhanced Nodes.Background.Color.Accent` | color | `#rrggbb` | `#ff2bd6` |  |
| Background detail | `📦 Enhanced Nodes.Background.Detail` | combo | `1` Fast, `2` Balanced, `3` Rich | `2` Balanced | How sharp it is drawn: Fast at a third of the screen's resolution, Balanced at half, Rich at full. |

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
| Title style | `📦 Enhanced Nodes.Text.Style` | combo | `neon` Neon pulse, `cyberpunk` Glitch, `retro` Retro, `pulse` Simple pulse, `minimal` Minimal, `rainbow` Rainbow wave, `bounce` Bounce, `typewriter` Typewriter, `decode` Decode, `molten` Molten, `chrome` Chrome shine, `groovy` Groovy 70s, `hologram` Hologram | `neon` Neon pulse |  |
| Title color | `📦 Enhanced Nodes.Text.Color` | color | `#rrggbb` | `#00ffff` | Used when Node effect colors is Custom; otherwise titles take the effect's accent color. |
| Title size | `📦 Enhanced Nodes.Text.Size` | slider | 8 to 24, step 1 | `14` |  |
| Title glow | `📦 Enhanced Nodes.Text.Glow` | slider | 0 to 1, step 0.05 | `0.5` |  |
| Title letter spacing | `📦 Enhanced Nodes.Text.Letter.Spacing` | slider | -2 to 10, step 0.25 | `0` |  |
| Title offset X | `📦 Enhanced Nodes.Text.Position.X` | slider | -50 to 50, step 1 | `0` |  |
| Title offset Y | `📦 Enhanced Nodes.Text.Position.Y` | slider | -50 to 50, step 1 | `0` |  |
| Title orbit radius | `📦 Enhanced Nodes.Text.Rotation.Radius` | slider | 0 to 50, step 1 | `0` | Circles the title around its position. |
| Title rotation | `📦 Enhanced Nodes.Text.Rotation.Angle` | slider | -180 to 180, step 5 | `0` |  |

## Focus & Flow · Selection focus

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Selection focus | `🔗 Enhanced Links.Focus.Enabled` | boolean | `true`, `false` | `true` | Make the selection's connections stand out. |
| Selection focus mode | `🔗 Enhanced Links.Focus.Mode` | combo | `highlight` Highlight, `animate` Animate only these, `dim` Dim others, `hide` Hide others | `highlight` Highlight |  |
| Focused link color | `🔗 Enhanced Links.Focus.Color` | combo | `native` White (ComfyUI), `accent` Theme accent, `type` Link type color | `native` White (ComfyUI) |  |
| Focus reach | `🔗 Enhanced Links.Focus.Depth` | combo | `direct` Direct links, `upstream` Everything feeding in, `downstream` Everything it feeds, `chain` Whole chain | `direct` Direct links |  |
| Bring focused links to front | `🔗 Enhanced Links.Focus.OnTop` | boolean | `true`, `false` | `true` | Draws them above nodes. |
| Focus on hover | `🔗 Enhanced Links.Focus.Hover` | boolean | `true`, `false` | `false` | Hover a node to focus it without selecting. |
| Dimmed link opacity | `🔗 Enhanced Links.Focus.Dim` | slider | 5 to 60, step 5 | `20` |  |

## Focus & Flow · Navigation

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Double-click a slot to jump | `🔗 Enhanced Links.Navigate.DoubleClick` | boolean | `true`, `false` | `true` | Fly to the other end; repeat to cycle. |
| Follow execution | `🔗 Enhanced Links.Navigate.Follow` | boolean | `true`, `false` | `false` | Pan to each node as your run reaches it. |

## Focus & Flow · During a run

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| During a run | `🔗 Enhanced Links.Pause.Mode` | combo | `pause` Freeze effects, `calm` Calm, `spotlight` Spotlight, `ignore` Keep animating | `spotlight` Spotlight | Reacts to your own runs only. |
| Apply run behavior to links | `🔗 Enhanced Links.Pause.During.Render` | boolean | `true`, `false` | `true` | Off = links ignore runs. |
| Apply run behavior to nodes | `📦 Enhanced Nodes.Pause.During.Render` | boolean | `true`, `false` | `true` |  |
| Data river | `🔗 Enhanced Links.Flow.River` | boolean | `true`, `false` | `true` | Light flowing into the running node. |
| Executed-path trail | `🔗 Enhanced Links.Flow.Trail` | boolean | `true`, `false` | `true` | The run's path keeps a fading glow. |
| Trail fade time | `🔗 Enhanced Links.Flow.Trail.Fade` | slider | 2 to 30, step 1 | `8` |  |
| Progress ring | `📦 Enhanced Nodes.Run.Ring` | boolean | `true`, `false` | `true` | Ring fills with the node's progress. |
| Progress ring color | `📦 Enhanced Nodes.Run.Ring.Color.Mode` | combo | `accent` Theme accent, `effect` Node effect color, `custom` Custom, `rainbow` Rainbow, `status` Status (amber → green) | `accent` Theme accent | Node effect color takes the primary color of the node's effect, the accent for a node without one; Rainbow runs the colour wheel round the ring; Status turns from amber to green as the node gets done. |
| Progress ring custom color | `📦 Enhanced Nodes.Run.Ring.Color` | color | `#rrggbb` | `#00e5ff` | Used when Progress ring color is Custom. |
| Error pulse | `📦 Enhanced Nodes.Run.Error` | boolean | `true`, `false` | `true` | Failed node pulses red. |

## Focus & Flow · Completion

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Effect when a run finishes | `📦 Enhanced Nodes.End Animation.Enabled` | boolean | `true`, `false` | `true` | Plays the Completion style when your run succeeds. |
| Completion style | `📦 Enhanced Nodes.Completion.Style` | combo | `fireworks` Fireworks, `confetti` Confetti, `shockwave` Shockwave, `trace` Path trace, `random` Surprise | `shockwave` Shockwave | Path trace runs a comet along the links your run took; Surprise plays another style each time. |
| Completion anchor | `📦 Enhanced Nodes.Completion.Anchor` | combo | `outputs` Output nodes, `primary` Primary nodes, `viewport` Center of screen | `outputs` Output nodes | Mark primary nodes in the node menu. |
| Burst when each node finishes | `📦 Enhanced Nodes.Completion.PerNode` | boolean | `true`, `false` | `false` | Sparks pop from the corner of each node on screen as your run finishes it. |

## Performance · Budget

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Effect frame-rate cap | `🔗 Enhanced Links.Perf.MaxFps` | combo | `30` 30 fps, `60` 60 fps, `0` Display rate | `60` 60 fps | The most redraws a second that moving effects ask for. Display rate asks for one with every frame the display shows. |
| Adaptive quality | `🔗 Enhanced Links.Perf.Adaptive` | boolean | `true`, `false` | `true` | While frames take half as long again as the frame-rate cap or the display allows, link glows go plain, then particles thin out, then effects hold still, a step a second; they come back after 5 seconds or more with room. |
| Keep link glow while moving | `🔗 Enhanced Links.Perf.KeepGlow` | boolean | `true`, `false` | `true` | Off lets link glows go plain while you pan, zoom, drag nodes or wires swing on a graph with many glowing links, and come back once it all keeps still: smoother on slower machines. Adaptive quality can still make them plain while frames are slow. |
| Freeze above N visible links | `🔗 Enhanced Links.Perf.StaticAbove` | slider | 0 to 5000, step 50 | `400` | Link motion holds still while more animated link segments than this are on screen (a link through reroutes has one per stretch), and Nodes 2.0 glows while more than a quarter as many animated nodes are. 0 never freezes. |
| Hide effects zoomed out below | `🔗 Enhanced Links.Perf.MinZoom` | slider | 0 to 100, step 5 | `25` | The zoom, in percent, below which links and nodes are drawn as ComfyUI draws them, but for the run visuals on nodes. 0 keeps the effects at every zoom. |

## Performance · Accessibility

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Motion | `🔗 Enhanced Links.Motion` | combo | `system` Follow system, `reduce` Reduce, `full` Full | `system` Follow system | Follow system shows effects still while the system, or ComfyUI's Disable animations, asks for less motion. Reduce always shows them still; Full always animates them. |

## Performance · Compatibility

| Name | Id | Type | Options or range | Default | Tooltip |
| --- | --- | --- | --- | --- | --- |
| Shortcut keys | `🔗 Enhanced Links.Keys` | combo | `off` Off, `alt` Alt+L, Alt+K, Alt+J, `alt-shift` Alt+Shift+L, Alt+Shift+K, Alt+Shift+J | `off` Off | L shows the panel, K toggles every effect and J goes to the running node. Takes effect when the page reloads. Where your browser or desktop already uses a key, pick the other set, or give any command a key of your own in Settings › Keybinding. |
| Other link extensions | `🔗 Enhanced Links.Coexist` | combo | `auto` Step aside if one is found, `ours` Keep Enhanced link effects, `defer` Always step aside | `auto` Step aside if one is found | When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working. |

## Kept by the panel

The panel and the first-run picker save these in the same file. The settings dialog does not show them.

| Name | Id | Default | What it holds |
| --- | --- | --- | --- |
| Current look | `🔗 Enhanced Links.Look` | `""` | The look last picked: empty until the first-run picker is answered, custom for settings kept as they were. |
| Panel state | `🔗 Enhanced Links.Panel.State` | `{"tab":"looks","advanced":false,"search":""}` | The panel's tab, whether Advanced is open, and its search. |
| Last seen version | `🔗 Enhanced Links.WhatsNew.Seen` | `""` | The version whose What's new was last shown. |
