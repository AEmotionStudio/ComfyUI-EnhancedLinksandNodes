import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
const LINK_ANIMATION_OPTIONS = [
  { value: 0, text: "None" },
  { value: 9, text: "Classic Flow" },
  { value: 1, text: "Sacred Flow" },
  { value: 10, text: "Merkaba Beads" },
  { value: 2, text: "Crystal Stream" },
  { value: 3, text: "Quantum Field" },
  { value: 4, text: "Cosmic Weave" },
  { value: 5, text: "Energy Pulse" },
  { value: 12, text: "Comet Trails" },
  { value: 6, text: "DNA Helix" },
  { value: 11, text: "DNA Helix 3D" },
  { value: 7, text: "Lava Flow" },
  { value: 8, text: "Stellar Plasma" }
];
const LINK_STYLE_OPTIONS = [
  { value: "spline", text: "Same as ComfyUI" },
  { value: "straight", text: "Direct" },
  { value: "linear", text: "Right-angle" },
  { value: "hidden", text: "Effect only" },
  { value: "dotted", text: "Dotted" },
  { value: "dashed", text: "Dashed" },
  { value: "double", text: "Double" },
  { value: "stepped", text: "Stepped" },
  { value: "zigzag", text: "Wave" },
  { value: "coil", text: "Coil" },
  { value: "rope", text: "Rope" },
  { value: "glowpath", text: "Glow path" },
  { value: "chain", text: "Chain" },
  { value: "pulse", text: "Pulse" },
  { value: "holographic", text: "Holographic" }
];
const PHYSICS_OPTIONS = [
  { value: "off", text: "Off" },
  { value: "rope", text: "Rope" },
  { value: "whip", text: "Whip" },
  { value: "gel", text: "Gel" }
];
const MARKER_SHAPE_OPTIONS = [
  { value: "none", text: "None" },
  { value: "arrow", text: "Arrow" },
  { value: "diamond", text: "Diamond" },
  { value: "circle", text: "Circle" },
  { value: "square", text: "Square" },
  { value: "triangle", text: "Triangle" },
  { value: "star", text: "Star" },
  { value: "heart", text: "Heart" },
  { value: "cross", text: "Cross" },
  { value: "hexagon", text: "Hexagon" },
  { value: "flower", text: "Flower" },
  { value: "spiral", text: "Spiral" },
  { value: "merkaba", text: "Merkaba" }
];
const MARKER_EFFECT_OPTIONS = [
  { value: "none", text: "None" },
  { value: "pulse", text: "Pulse" },
  { value: "fade", text: "Fade" },
  { value: "rainbow", text: "Rainbow" }
];
const NODE_ANIMATION_OPTIONS = [
  { value: 0, text: "None" },
  { value: 1, text: "Gentle Pulse" },
  { value: 2, text: "Neon Nexus" },
  { value: 3, text: "Cosmic Ripple" },
  { value: 4, text: "Flower of Life" }
];
const PARTICLE_COLOR_MODE_OPTIONS = [
  { value: "default", text: "Particle color" },
  { value: "rainbow", text: "Rainbow" },
  { value: "complementary", text: "Complementary" },
  { value: "energy", text: "Energy" },
  { value: "quantum", text: "Quantum" },
  { value: "aurora", text: "Aurora" }
];
const TEXT_STYLE_OPTIONS = [
  { value: "neon", text: "Neon pulse" },
  { value: "cyberpunk", text: "Glitch" },
  { value: "retro", text: "Retro" },
  { value: "pulse", text: "Simple pulse" },
  { value: "minimal", text: "Minimal" }
];
const LINK_COLOR_MODE_OPTIONS = [
  { value: "default", text: "Link type colors" },
  { value: "custom", text: "Custom" }
];
const MARKER_COLOR_MODE_OPTIONS = [
  { value: "default", text: "Link type color" },
  { value: "inherit", text: "Same as link" },
  { value: "custom", text: "Custom" }
];
const NODE_COLOR_MODE_OPTIONS = [
  { value: "default", text: "Style colors" },
  { value: "custom", text: "Custom" }
];
const COLOR_SCHEME_OPTIONS = [
  { value: "default", text: "Off" },
  { value: "saturated", text: "Saturated" },
  { value: "vivid", text: "Vivid" },
  { value: "contrast", text: "High contrast" },
  { value: "bright", text: "Bright" },
  { value: "muted", text: "Muted" }
];
const QUALITY_OPTIONS = [
  { value: 1, text: "Fast" },
  { value: 2, text: "Balanced" },
  { value: 3, text: "Rich" }
];
const DENSITY_OPTIONS = [
  { value: 0.5, text: "Minimal" },
  { value: 1, text: "Balanced" },
  { value: 2, text: "Dense" },
  { value: 3, text: "Ultra" }
];
const SHADOW_STYLE_OPTIONS = [
  { value: "halo", text: "Halo (v1)" },
  { value: "drop", text: "Drop shadow (v2)" }
];
const DIRECTION_OPTIONS = [
  { value: 1, text: "Forward" },
  { value: -1, text: "Reverse" }
];
const BLEND_OPTIONS = [
  { value: "normal", text: "Normal" },
  { value: "additive", text: "Additive glow" }
];
const MAX_FPS_OPTIONS = [
  { value: 30, text: "30 fps" },
  { value: 60, text: "60 fps" },
  { value: 0, text: "Display rate" }
];
const MOTION_OPTIONS = [
  { value: "system", text: "Follow system" },
  { value: "reduce", text: "Reduce" },
  { value: "full", text: "Full" }
];
const FOCUS_MODE_OPTIONS = [
  { value: "highlight", text: "Highlight" },
  { value: "animate", text: "Animate only these" },
  { value: "dim", text: "Dim others" },
  { value: "hide", text: "Hide others" }
];
const FOCUS_COLOR_OPTIONS = [
  { value: "native", text: "White (ComfyUI)" },
  { value: "accent", text: "Theme accent" },
  { value: "type", text: "Link type color" }
];
const FOCUS_DEPTH_OPTIONS = [
  { value: "direct", text: "Direct links" },
  { value: "upstream", text: "Everything feeding in" },
  { value: "downstream", text: "Everything it feeds" },
  { value: "chain", text: "Whole chain" }
];
const PAUSE_MODE_OPTIONS = [
  { value: "pause", text: "Freeze effects" },
  { value: "calm", text: "Calm" },
  { value: "spotlight", text: "Spotlight" },
  { value: "ignore", text: "Keep animating" }
];
const COMPLETION_STYLE_OPTIONS = [
  { value: "fireworks", text: "Fireworks" },
  { value: "confetti", text: "Confetti" },
  { value: "shockwave", text: "Shockwave" },
  { value: "trace", text: "Path trace" },
  { value: "random", text: "Surprise" }
];
const COMPLETION_ANCHOR_OPTIONS = [
  { value: "outputs", text: "Output nodes" },
  { value: "primary", text: "Primary nodes" },
  { value: "viewport", text: "Center of screen" }
];
const COEXIST_OPTIONS = [
  { value: "auto", text: "Step aside if one is found" },
  { value: "ours", text: "Keep Enhanced link effects" },
  { value: "defer", text: "Always step aside" }
];
const CLASSIC$2 = 9;
const DENSE = /* @__PURE__ */ new Set([1, 2, 3, 7, 8, 10, 12]);
const linksOn = () => L.enabled && L.animate !== 0;
const wired = () => L.physicsProfile !== "off" && L.physicsAmount > 0;
const SHAPES = /* @__PURE__ */ new Set(["straight", "linear", "stepped", "zigzag", "coil"]);
const markers = () => linksOn() && (L.animate === CLASSIC$2 || L.markerAll) && L.markerEnabled;
const shadows = () => linksOn() && L.animate === CLASSIC$2 && L.linkShadowEnabled || markers() && L.markerShadowEnabled;
const effects$1 = () => N.enabled && N.animate !== 0;
const nodesDraw = () => N.enabled && (N.animate !== 0 || N.particleShow || N.textAnimationEnabled);
const particles = () => N.enabled && N.particleShow;
const focusOn = () => L.focusEnabled;
const runsChange = () => L.pauseMode !== "ignore";
const titles = () => N.enabled && N.textAnimationEnabled;
const customNodes = () => N.colorMode === "custom" ? void 0 : { reason: "Used when Node effect colors is Custom.", id: "📦 Enhanced Nodes.Color.Mode", value: "custom" };
const classicNodes = () => LiteGraph.vueNodesMode ? { reason: "Classic nodes only.", id: "Comfy.VueNodes.Enabled", value: false, label: "Use classic nodes" } : void 0;
const LINKS$1 = "🔗 Enhanced Links.";
const NODES = "📦 Enhanced Nodes.";
const LOOK = "🔗 Enhanced Links.Look";
const PANEL_STATE$1 = { tab: "looks", advanced: false, search: "" };
const SETTINGS = [
  { id: "🔗 Enhanced Links.Enabled", key: "enabled", name: "Link effects", type: "boolean", default: true, group: "Links · Effect", look: false, tooltip: "Off draws native ComfyUI links and leaves every other link setting as it is." },
  { id: "🔗 Enhanced Links.Animate", key: "animate", name: "Link animation", type: "combo", options: LINK_ANIMATION_OPTIONS, default: 9, group: "Links · Effect", showIf: () => L.enabled, tooltip: "Effect drawn along every link." },
  { id: "🔗 Enhanced Links.Animation.Speed", key: "animationSpeed", name: "Link animation speed", type: "slider", min: 0.1, max: 3, step: 0.05, default: 1, group: "Links · Effect", showIf: () => linksOn() && !L.staticMode },
  { id: "🔗 Enhanced Links.Direction", key: "direction", name: "Link flow direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Links · Effect", advanced: true, showIf: linksOn, tooltip: "Which way effects travel." },
  { id: "🔗 Enhanced Links.Static.Mode", key: "staticMode", name: "Freeze link animation", type: "boolean", default: false, group: "Links · Effect", showIf: linksOn, tooltip: "Keep the look but stop the motion." },
  {
    id: "🔗 Enhanced Links.Link.Style",
    key: "linkStyle",
    name: "Link path shape",
    type: "combo",
    options: LINK_STYLE_OPTIONS,
    default: "spline",
    group: "Links · Path",
    showIf: linksOn,
    needs: () => wired() && SHAPES.has(L.linkStyle) ? { reason: "Wire physics shapes the path.", id: "🔗 Enhanced Links.Link.Style", value: "spline" } : void 0,
    tooltip: "Same as ComfyUI follows the Link Render Mode setting."
  },
  { id: "🔗 Enhanced Links.Thickness", key: "thickness", name: "Link thickness", type: "slider", min: 1, max: 10, step: 0.5, default: 3, group: "Links · Path", showIf: linksOn },
  { id: "🔗 Enhanced Links.Physics.Profile", key: "physicsProfile", name: "Wire physics", type: "combo", options: PHYSICS_OPTIONS, default: "off", group: "Links · Path", showIf: () => L.enabled, tooltip: "Wires sag and swing; works with any animation, including None." },
  { id: "🔗 Enhanced Links.Quality", key: "quality", name: "Link effect quality", type: "combo", options: QUALITY_OPTIONS, default: 1, group: "Links · Path", advanced: true, showIf: linksOn, tooltip: "More detail, more GPU." },
  { id: "🔗 Enhanced Links.Particle.Density", key: "particleDensity", name: "Link particle density", type: "combo", options: DENSITY_OPTIONS, snap: true, default: 0.5, group: "Links · Path", advanced: true, showIf: () => linksOn() && DENSE.has(L.animate) || markers(), tooltip: "How many particles or markers each link carries." },
  { id: "🔗 Enhanced Links.Physics.Amount", key: "physicsAmount", name: "Wire physics strength", type: "slider", min: 0, max: 2, step: 0.1, default: 1, group: "Links · Path", advanced: true, showIf: () => L.enabled && L.physicsProfile !== "off", tooltip: "How far wires sag and swing: 0 keeps the native shape, 2 is twice the profile." },
  { id: "🔗 Enhanced Links.Color.Mode", key: "colorMode", name: "Link colors", type: "combo", options: LINK_COLOR_MODE_OPTIONS, default: "default", group: "Links · Color", showIf: linksOn, tooltip: "Type colors follow your palette." },
  { id: "🔗 Enhanced Links.Color.Primary", key: "colorPrimary", name: "Link primary color", type: "color", default: "#ffb300", group: "Links · Color", showIf: () => linksOn() && L.colorMode === "custom", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Secondary", key: "colorSecondary", name: "Link secondary color", type: "color", default: "#fb00ff", group: "Links · Color", showIf: () => linksOn() && L.colorMode === "custom", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Accent", key: "colorAccent", name: "Link accent color", type: "color", default: "#9d00ff", group: "Links · Color", showIf: () => linksOn() && L.colorMode === "custom", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Scheme", key: "colorScheme", name: "Link color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Links · Color", advanced: true, showIf: linksOn, tooltip: "Filter applied on top of the colors." },
  { id: "🔗 Enhanced Links.Glow.Intensity", key: "glowIntensity", name: "Link glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Color", showIf: linksOn },
  { id: "🔗 Enhanced Links.Blend", key: "blend", name: "Glow blending", type: "combo", options: BLEND_OPTIONS, default: "normal", group: "Links · Color", advanced: true, showIf: linksOn, tooltip: "Additive glow lets the moving effects brighten where they cross, on dark palettes; light palettes and canvas background images always use Normal." },
  { id: "🔗 Enhanced Links.Marker.Enabled", key: "markerEnabled", name: "Flow markers", type: "boolean", default: true, group: "Links · Markers", showIf: () => linksOn() && (L.animate === CLASSIC$2 || L.markerAll), tooltip: "Shapes gliding along links in Classic Flow, and in the other animations with Markers on every animation." },
  { id: "🔗 Enhanced Links.Marker.All", key: "markerAll", name: "Markers on every animation", type: "boolean", default: false, group: "Links · Markers", advanced: true, showIf: () => linksOn() && L.animate !== CLASSIC$2, tooltip: "Flow markers over every link animation, not only Classic Flow." },
  { id: "🔗 Enhanced Links.Marker.Shape", key: "markerShape", name: "Marker shape", type: "combo", options: MARKER_SHAPE_OPTIONS, default: "arrow", group: "Links · Markers", showIf: markers },
  { id: "🔗 Enhanced Links.Marker.Size", key: "markerSize", name: "Marker size", type: "slider", min: 1, max: 5, step: 0.5, default: 3, group: "Links · Markers", showIf: markers },
  { id: "🔗 Enhanced Links.Marker.Color.Mode", key: "markerColorMode", name: "Marker color", type: "combo", options: MARKER_COLOR_MODE_OPTIONS, default: "default", group: "Links · Markers", advanced: true, showIf: markers, tooltip: "Same as link follows custom link colors." },
  { id: "🔗 Enhanced Links.Marker.Color", key: "markerColor", name: "Marker custom color", type: "color", default: "#00fff7", group: "Links · Markers", advanced: true, showIf: () => markers() && L.markerColorMode === "custom", tooltip: "Used when Marker color is Custom." },
  { id: "🔗 Enhanced Links.Marker.Glow", key: "markerGlow", name: "Marker glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Markers", advanced: true, showIf: markers },
  { id: "🔗 Enhanced Links.Marker.Effects", key: "markerEffects", name: "Marker effect", type: "combo", options: MARKER_EFFECT_OPTIONS, default: "none", group: "Links · Markers", advanced: true, showIf: markers },
  { id: "🔗 Enhanced Links.Link.Shadow.Enabled", key: "linkShadowEnabled", name: "Link shadow", type: "boolean", default: true, group: "Links · Shadows", showIf: () => linksOn() && L.animate === CLASSIC$2, tooltip: "Dark outline under links in Classic Flow, which makes them stand out." },
  { id: "🔗 Enhanced Links.Marker.Shadow.Enabled", key: "markerShadowEnabled", name: "Marker shadow", type: "boolean", default: true, group: "Links · Shadows", advanced: true, showIf: markers, tooltip: "Dark outline under flow markers." },
  { id: "🔗 Enhanced Links.Shadow.Style", key: "shadowStyle", name: "Shadow style", type: "combo", options: SHADOW_STYLE_OPTIONS, default: "halo", group: "Links · Shadows", advanced: true, showIf: shadows, tooltip: "Halo is the soft dark outline v1 drew; Drop shadow is offset, as in v2." },
  { id: "🔗 Enhanced Links.Shadow.Blur", key: "shadowBlur", name: "Drop shadow blur", type: "slider", min: 0, max: 10, step: 0.5, default: 5, group: "Links · Shadows", advanced: true, showIf: () => shadows() && L.shadowStyle === "drop", tooltip: "Used by Drop shadow." },
  { id: "🔗 Enhanced Links.Shadow.Offset", key: "shadowOffset", name: "Drop shadow offset", type: "slider", min: 0, max: 10, step: 0.5, default: 3, group: "Links · Shadows", advanced: true, showIf: () => shadows() && L.shadowStyle === "drop", tooltip: "Used by Drop shadow." },
  { id: "📦 Enhanced Nodes.Enabled", key: "enabled", name: "Node effects", type: "boolean", default: true, group: "Nodes · Effect", look: false, tooltip: "Off draws native ComfyUI nodes, with no effects, halos, particles, styled titles or completion effects, and leaves every other node setting as it is." },
  { id: "📦 Enhanced Nodes.Animate", key: "animate", name: "Node effect", type: "combo", options: NODE_ANIMATION_OPTIONS, default: 0, group: "Nodes · Effect", showIf: () => N.enabled, tooltip: "Effect drawn on and around every node. Node FX in the node menu picks one for a node." },
  { id: "📦 Enhanced Nodes.Animations.Enabled", key: "animationsEnabled", name: "Show base effect", type: "boolean", default: true, group: "Nodes · Effect", advanced: true, showIf: effects$1, tooltip: "Off draws only the effect's own particles." },
  { id: "📦 Enhanced Nodes.Animation.Speed", key: "animationSpeed", name: "Node effect speed", type: "slider", min: 0.1, max: 3, step: 0.1, default: 1, group: "Nodes · Effect", advanced: true, showIf: () => effects$1() && !N.staticMode },
  { id: "📦 Enhanced Nodes.Direction", key: "direction", name: "Node effect direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Nodes · Effect", advanced: true, showIf: effects$1 },
  { id: "📦 Enhanced Nodes.Static.Mode", key: "staticMode", name: "Freeze node effects", type: "boolean", default: false, group: "Nodes · Effect", showIf: nodesDraw },
  { id: "📦 Enhanced Nodes.Intensity", key: "intensity", name: "Node effect energy", type: "slider", min: 0.1, max: 2, step: 0.1, default: 1, group: "Nodes · Effect", advanced: true, showIf: effects$1 },
  { id: "📦 Enhanced Nodes.Animation.Size", key: "animationSize", name: "Node effect size", type: "slider", min: 0.5, max: 3, step: 0.1, default: 1, group: "Nodes · Effect", advanced: true, showIf: effects$1 },
  { id: "📦 Enhanced Nodes.Animation.Glow", key: "animationGlow", name: "Node effect bloom", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Effect", advanced: true, showIf: effects$1, tooltip: "Glow of the effect's lines and light, and of the hover outline." },
  { id: "📦 Enhanced Nodes.Quality", key: "quality", name: "Node effect quality", type: "combo", options: QUALITY_OPTIONS, default: 2, group: "Nodes · Effect", advanced: true, showIf: effects$1, tooltip: "More detail, more GPU." },
  { id: "📦 Enhanced Nodes.Glow.Show", key: "glowShow", name: "Node effect glow", type: "boolean", default: true, group: "Nodes · Glow & hover", showIf: effects$1, tooltip: "A halo in the effect's primary color around each node with an effect." },
  { id: "📦 Enhanced Nodes.Glow", key: "glow", name: "Node glow strength", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Glow & hover", showIf: () => effects$1() && (N.glowShow || N.selectionGlow), tooltip: "How far the halo and the selection frame glow." },
  { id: "📦 Enhanced Nodes.Selection.Glow", key: "selectionGlow", name: "Glowing frame around selected nodes", type: "boolean", default: true, group: "Nodes · Glow & hover", showIf: effects$1, tooltip: "On nodes with an effect." },
  { id: "📦 Enhanced Nodes.Color.Hover.Show", key: "colorHoverShow", name: "Hover outline", type: "boolean", default: false, group: "Nodes · Glow & hover", advanced: true, showIf: effects$1, needs: classicNodes, tooltip: "Outlines animated nodes while hovered or selected." },
  { id: "📦 Enhanced Nodes.Color.Hover", key: "colorHover", name: "Hover outline color", type: "color", default: "#00ff15", group: "Nodes · Glow & hover", advanced: true, showIf: () => effects$1() && N.colorHoverShow, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Color.Mode", key: "colorMode", name: "Node effect colors", type: "combo", options: NODE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Color", showIf: nodesDraw },
  { id: "📦 Enhanced Nodes.Color.Primary", key: "colorPrimary", name: "Node primary color", type: "color", default: "#ffb300", group: "Nodes · Color", showIf: () => nodesDraw() && N.colorMode === "custom", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Secondary", key: "colorSecondary", name: "Node secondary color", type: "color", default: "#fb00ff", group: "Nodes · Color", showIf: () => nodesDraw() && N.colorMode === "custom", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Accent", key: "colorAccent", name: "Node accent color", type: "color", default: "#9d00ff", group: "Nodes · Color", showIf: () => nodesDraw() && N.colorMode === "custom", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Scheme", key: "colorScheme", name: "Node color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Nodes · Color", advanced: true, showIf: nodesDraw, tooltip: "Filter applied on top of the colors." },
  { id: "📦 Enhanced Nodes.Particle.Show", key: "particleShow", name: "Node particles", type: "boolean", default: false, group: "Nodes · Particles", showIf: () => N.enabled, tooltip: "Also drawn when Node effect is None." },
  { id: "📦 Enhanced Nodes.Particle.Density", key: "particleDensity", name: "Node particle density", type: "combo", options: DENSITY_OPTIONS, snap: true, default: 1, group: "Nodes · Particles", showIf: particles },
  { id: "📦 Enhanced Nodes.Particle.Size", key: "particleSize", name: "Node particle size", type: "slider", min: 0.1, max: 3, step: 0.1, default: 1, group: "Nodes · Particles", advanced: true, showIf: particles },
  { id: "📦 Enhanced Nodes.Particle.Speed", key: "particleSpeed", name: "Node particle speed", type: "slider", min: 0.1, max: 5, step: 0.1, default: 1, group: "Nodes · Particles", advanced: true, showIf: particles },
  { id: "📦 Enhanced Nodes.Particle.Intensity", key: "particleIntensity", name: "Node particle motion", type: "slider", min: 0.1, max: 2, step: 0.1, default: 1, group: "Nodes · Particles", advanced: true, showIf: particles, tooltip: "How energetic the motion is." },
  { id: "📦 Enhanced Nodes.Particle.Glow", key: "particleGlow", name: "Node particle glow", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Particles", advanced: true, showIf: particles },
  { id: "📦 Enhanced Nodes.Particle.Color.Mode", key: "particleColorMode", name: "Node particle colors", type: "combo", options: PARTICLE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Particles", showIf: particles, tooltip: "Particle color takes Node particle color with Custom colors, else the effect's primary color; Complementary takes its opposite hue." },
  { id: "📦 Enhanced Nodes.Color.Particle", key: "colorParticle", name: "Node particle color", type: "color", default: "#ffb300", group: "Nodes · Particles", showIf: () => particles() && (N.particleColorMode === "default" || N.particleColorMode === "complementary"), needs: customNodes, tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Text.Animation.Enabled", key: "textAnimationEnabled", name: "Animated titles", type: "boolean", default: false, group: "Nodes · Titles", showIf: () => N.enabled, needs: classicNodes, tooltip: "Draws each node title in the chosen style." },
  { id: "📦 Enhanced Nodes.Text.Style", key: "textStyle", name: "Title style", type: "combo", options: TEXT_STYLE_OPTIONS, default: "neon", group: "Nodes · Titles", showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Color", key: "textColor", name: "Title color", type: "color", default: "#00ffff", group: "Nodes · Titles", showIf: titles, needs: () => classicNodes() ?? customNodes(), tooltip: "Used when Node effect colors is Custom; otherwise titles take the effect's accent color." },
  { id: "📦 Enhanced Nodes.Text.Size", key: "textSize", name: "Title size", type: "slider", min: 8, max: 24, step: 1, default: 14, group: "Nodes · Titles", showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Glow", key: "textGlow", name: "Title glow", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Letter.Spacing", key: "textLetterSpacing", name: "Title letter spacing", type: "slider", min: -2, max: 10, step: 0.25, default: 0, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Position.X", key: "textPositionX", name: "Title offset X", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Position.Y", key: "textPositionY", name: "Title offset Y", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes },
  { id: "📦 Enhanced Nodes.Text.Rotation.Radius", key: "textRotationRadius", name: "Title orbit radius", type: "slider", min: 0, max: 50, step: 1, default: 0, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes, tooltip: "Circles the title around its position." },
  { id: "📦 Enhanced Nodes.Text.Rotation.Angle", key: "textRotationAngle", name: "Title rotation", type: "slider", min: -180, max: 180, step: 5, default: 0, group: "Nodes · Titles", advanced: true, showIf: titles, needs: classicNodes },
  { id: "🔗 Enhanced Links.Focus.Enabled", key: "focusEnabled", name: "Selection focus", type: "boolean", default: true, group: "Focus & Flow · Selection focus", look: false, tooltip: "Make the selection's connections stand out." },
  { id: "🔗 Enhanced Links.Focus.Mode", key: "focusMode", name: "Selection focus mode", type: "combo", options: FOCUS_MODE_OPTIONS, default: "highlight", group: "Focus & Flow · Selection focus", look: false, showIf: focusOn },
  { id: "🔗 Enhanced Links.Focus.Color", key: "focusColor", name: "Focused link color", type: "combo", options: FOCUS_COLOR_OPTIONS, default: "native", group: "Focus & Flow · Selection focus", look: false, showIf: focusOn },
  { id: "🔗 Enhanced Links.Focus.Depth", key: "focusDepth", name: "Focus reach", type: "combo", options: FOCUS_DEPTH_OPTIONS, default: "direct", group: "Focus & Flow · Selection focus", look: false, showIf: focusOn },
  { id: "🔗 Enhanced Links.Focus.OnTop", key: "focusOnTop", name: "Bring focused links to front", type: "boolean", default: true, group: "Focus & Flow · Selection focus", look: false, showIf: focusOn, tooltip: "Draws them above nodes." },
  { id: "🔗 Enhanced Links.Focus.Hover", key: "focusHover", name: "Focus on hover", type: "boolean", default: false, group: "Focus & Flow · Selection focus", look: false, showIf: focusOn, needs: classicNodes, tooltip: "Hover a node to focus it without selecting." },
  { id: "🔗 Enhanced Links.Focus.Dim", key: "focusDim", name: "Dimmed link opacity", type: "slider", min: 5, max: 60, step: 5, default: 20, group: "Focus & Flow · Selection focus", advanced: true, look: false, showIf: () => focusOn() && L.focusMode === "dim" },
  { id: "🔗 Enhanced Links.Navigate.DoubleClick", key: "navigateDoubleClick", name: "Double-click a slot to jump", type: "boolean", default: true, group: "Focus & Flow · Navigation", look: false, needs: classicNodes, tooltip: "Fly to the other end; repeat to cycle." },
  { id: "🔗 Enhanced Links.Navigate.Follow", key: "navigateFollow", name: "Follow execution", type: "boolean", default: false, group: "Focus & Flow · Navigation", look: false, tooltip: "Pan to each node as your run reaches it." },
  { id: "🔗 Enhanced Links.Pause.Mode", key: "pauseMode", name: "During a run", type: "combo", options: PAUSE_MODE_OPTIONS, default: "spotlight", group: "Focus & Flow · During a run", tooltip: "Reacts to your own runs only." },
  { id: "🔗 Enhanced Links.Pause.During.Render", key: "pauseDuringRender", name: "Apply run behavior to links", type: "boolean", default: true, group: "Focus & Flow · During a run", advanced: true, showIf: runsChange, tooltip: "Off = links ignore runs." },
  { id: "📦 Enhanced Nodes.Pause.During.Render", key: "pauseDuringRender", name: "Apply run behavior to nodes", type: "boolean", default: true, group: "Focus & Flow · During a run", advanced: true, showIf: runsChange },
  { id: "🔗 Enhanced Links.Flow.River", key: "flowRiver", name: "Data river", type: "boolean", default: true, group: "Focus & Flow · During a run", showIf: () => L.enabled, tooltip: "Light flowing into the running node." },
  { id: "🔗 Enhanced Links.Flow.Trail", key: "flowTrail", name: "Executed-path trail", type: "boolean", default: true, group: "Focus & Flow · During a run", showIf: () => L.enabled, tooltip: "The run's path keeps a fading glow." },
  { id: "🔗 Enhanced Links.Flow.Trail.Fade", key: "flowTrailFade", name: "Trail fade time", type: "slider", min: 2, max: 30, step: 1, default: 8, group: "Focus & Flow · During a run", advanced: true, look: false, showIf: () => L.enabled && L.flowTrail },
  { id: "📦 Enhanced Nodes.Run.Ring", key: "runRing", name: "Progress ring", type: "boolean", default: true, group: "Focus & Flow · During a run", showIf: () => N.enabled, tooltip: "Ring fills with the node's progress." },
  { id: "📦 Enhanced Nodes.Run.Error", key: "runError", name: "Error pulse", type: "boolean", default: true, group: "Focus & Flow · During a run", showIf: () => N.enabled, tooltip: "Failed node pulses red." },
  { id: "📦 Enhanced Nodes.End Animation.Enabled", key: "endAnimationEnabled", name: "Effect when a run finishes", type: "boolean", default: true, group: "Focus & Flow · Completion", showIf: () => N.enabled, tooltip: "Plays the Completion style when your run succeeds." },
  { id: "📦 Enhanced Nodes.Completion.Style", key: "completionStyle", name: "Completion style", type: "combo", options: COMPLETION_STYLE_OPTIONS, default: "shockwave", group: "Focus & Flow · Completion", showIf: () => N.enabled && N.endAnimationEnabled, tooltip: "Path trace runs a comet along the links your run took; Surprise plays another style each time." },
  { id: "📦 Enhanced Nodes.Completion.Anchor", key: "completionAnchor", name: "Completion anchor", type: "combo", options: COMPLETION_ANCHOR_OPTIONS, default: "outputs", group: "Focus & Flow · Completion", look: false, showIf: () => N.enabled && N.endAnimationEnabled, tooltip: "Mark primary nodes in the node menu." },
  { id: "📦 Enhanced Nodes.Completion.PerNode", key: "completionPerNode", name: "Burst when each node finishes", type: "boolean", default: false, group: "Focus & Flow · Completion", advanced: true, showIf: () => N.enabled, tooltip: "Sparks pop from the corner of each node on screen as your run finishes it." },
  { id: "🔗 Enhanced Links.Perf.MaxFps", key: "perfMaxFps", name: "Effect frame-rate cap", type: "combo", options: MAX_FPS_OPTIONS, default: 60, group: "Performance · Budget", look: false, tooltip: "The most redraws a second that moving effects ask for. Display rate asks for one with every frame the display shows." },
  { id: "🔗 Enhanced Links.Perf.Adaptive", key: "perfAdaptive", name: "Adaptive quality", type: "boolean", default: true, group: "Performance · Budget", look: false, tooltip: "While frames take half as long again as the frame-rate cap or the display allows, link glows go plain, then particles thin out, then effects hold still, a step a second; they come back after 5 seconds or more with room." },
  { id: "🔗 Enhanced Links.Perf.StaticAbove", key: "perfStaticAbove", name: "Freeze above N visible links", type: "slider", min: 0, max: 5e3, step: 50, default: 400, group: "Performance · Budget", look: false, tooltip: "Link motion holds still while more animated link segments than this are on screen (a link through reroutes has one per stretch), and Nodes 2.0 glows while more than a quarter as many animated nodes are. 0 never freezes." },
  { id: "🔗 Enhanced Links.Motion", key: "motion", name: "Motion", type: "combo", options: MOTION_OPTIONS, default: "system", group: "Performance · Accessibility", look: false, tooltip: "Follow system shows effects still while the system, or ComfyUI's Disable animations, asks for less motion. Reduce always shows them still; Full always animates them." },
  { id: "🔗 Enhanced Links.Coexist", key: "coexist", name: "Other link extensions", type: "combo", options: COEXIST_OPTIONS, default: "auto", group: "Performance · Compatibility", advanced: true, look: false, tooltip: "When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working." },
  { id: LOOK, key: "look", name: "Current look", type: "hidden", default: "", tooltip: "The look last picked: empty until the first-run picker is answered, custom for settings kept as they were." },
  { id: "🔗 Enhanced Links.Panel.State", key: "panelState", name: "Panel state", type: "hidden", default: PANEL_STATE$1, tooltip: "The panel's tab, whether Advanced is open, and its search." },
  { id: "🔗 Enhanced Links.WhatsNew.Seen", key: "whatsNewSeen", name: "Last seen version", type: "hidden", default: "", tooltip: "The version whose What's new was last shown." }
];
const V2_DEFAULTS = {
  "🔗 Enhanced Links.Link.Shadow.Enabled": false,
  "🔗 Enhanced Links.Marker.Shadow.Enabled": false,
  "📦 Enhanced Nodes.Color.Primary": "#44aaff",
  "📦 Enhanced Nodes.Color.Secondary": "#88ccff",
  "📦 Enhanced Nodes.Color.Accent": "#0088ff",
  "📦 Enhanced Nodes.Color.Particle": "#ffff00",
  "📦 Enhanced Nodes.End Animation.Enabled": false
};
const byId$1 = new Map(SETTINGS.map((s) => [s.id, s]));
const setting = (id) => byId$1.get(id);
const HEX$1 = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i;
function normalize(s, value) {
  const numeric = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  switch (s.type) {
    case "boolean":
      if (typeof value === "boolean") return value;
      return value === "true" ? true : value === "false" ? false : s.default;
    case "slider":
      return typeof numeric === "number" && !Number.isNaN(numeric) ? Math.min(s.max, Math.max(s.min, numeric)) : s.default;
    case "combo": {
      const option = s.options.find((o) => o.value === value || o.value === numeric);
      if (option) return option.value;
      if (!s.snap || typeof numeric !== "number" || Number.isNaN(numeric)) return s.default;
      return s.options.reduce((best, o) => Math.abs(Number(o.value) - numeric) < Math.abs(Number(best.value) - numeric) ? o : best).value;
    }
    case "color":
      return typeof value === "string" && HEX$1.test(value) ? `#${value.replace("#", "").toLowerCase()}` : value;
    case "hidden":
      if (typeof s.default !== "string") return { ...s.default, ...value };
      return typeof value === "string" ? value : s.default;
  }
}
function snapshot(prefix) {
  return Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix)).map((s) => [s.key, s.default]));
}
const L = snapshot(LINKS$1);
const N = snapshot(NODES);
let revision = 0;
const snapshotOf = (id) => id.startsWith(LINKS$1) ? L : N;
const shown$3 = (id) => snapshotOf(id)[setting(id).key];
function checked(id) {
  app.extensionManager.setting.get(id);
  return shown$3(id);
}
const listeners = /* @__PURE__ */ new Set();
function watch(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function show$2(s, value) {
  const values = snapshotOf(s.id);
  const next = s.type !== "color" || HEX$1.test(String(value)) ? value : s.default;
  if (values[s.key] === next || typeof next === "object" && JSON.stringify(values[s.key]) === JSON.stringify(next)) return;
  values[s.key] = next;
  if (s.type !== "hidden") {
    revision++;
    app.canvas?.setDirty(true, true);
  }
  for (const listener of listeners) listener(s.id);
  if (s.id === LOOK) for (const id of overlaid) present(setting(id), saved(id));
}
const overlaid = /* @__PURE__ */ new Set();
function present(s, value) {
  show$2(s, L.look === "" && overlaid.has(s.id) && V2_DEFAULTS[s.id] === value ? s.default : value);
}
const stored = /* @__PURE__ */ new Map();
let migrated;
let writing;
const own$2 = /* @__PURE__ */ new Set();
function params(prefix) {
  return SETTINGS.flatMap((s, i) => s.id.startsWith(prefix) ? [{
    // The package types id as keyof Settings, the core ids only; the settings store takes any string.
    id: s.id,
    name: s.name,
    tooltip: s.tooltip,
    category: s.type === "hidden" ? void 0 : ["Enhanced Links & Nodes", s.group, s.id],
    sortOrder: SETTINGS.length - i,
    type: s.type,
    attrs: s.type === "slider" ? { min: s.min, max: s.max, step: s.step } : void 0,
    options: s.type === "combo" ? [...s.options] : void 0,
    defaultValue: s.default,
    migrateDeprecatedValue: (value) => {
      migrated = s.id;
      return normalize(s, value);
    },
    onChange: (value, old) => {
      const chosen = old !== void 0 && writing !== s.id;
      if (old === void 0 && s.type !== "hidden") {
        if (migrated === s.id && value !== (V2_DEFAULTS[s.id] ?? s.default)) own$2.add(s.id);
        else own$2.delete(s.id);
        if (s.id in V2_DEFAULTS && value === V2_DEFAULTS[s.id]) overlaid.add(s.id);
        else overlaid.delete(s.id);
      } else if (chosen) overlaid.delete(s.id);
      migrated = void 0;
      stored.set(s.id, value);
      present(s, value);
      if (chosen) answer(s.id, value);
    }
  }] : []);
}
const linkSettings = params(LINKS$1);
const nodeSettings = params(NODES);
const customised = () => own$2.size > 0;
const unsaved = /* @__PURE__ */ new Map();
let saving = Promise.resolve();
function saved(id) {
  return unsaved.has(id) ? normalize(setting(id), unsaved.get(id)) : stored.get(id);
}
function preview(id, value) {
  const s = setting(id);
  show$2(s, normalize(s, value));
}
function restore$1(ids2) {
  for (const id of ids2) present(setting(id), saved(id));
}
let lent = 0;
function drawWith(values, draw2) {
  const kept2 = [];
  for (const [id, value] of Object.entries(values)) {
    const snapshot2 = snapshotOf(id);
    const { key } = setting(id);
    kept2.push([snapshot2, key, snapshot2[key]]);
    snapshot2[key] = value;
  }
  const own2 = revision;
  revision = --lent;
  try {
    draw2();
  } finally {
    for (const [snapshot2, key, value] of kept2) snapshot2[key] = value;
    revision = own2;
  }
}
function commit(id, value) {
  overlaid.delete(id);
  write(id, value);
  answer(id, value);
}
function answer(id, value) {
  if (L.look !== "" || V2_DEFAULTS[id] !== normalize(setting(id), value)) return;
  commitAll({ ...Object.fromEntries([...overlaid].map((other) => [other, setting(other).default])), [LOOK]: "custom" });
}
function write(id, value) {
  const s = setting(id);
  present(s, normalize(s, value));
  if (!unsaved.has(id)) saving = saving.then(() => save$1(id));
  unsaved.set(id, value);
}
async function save$1(id) {
  const value = unsaved.get(id);
  unsaved.delete(id);
  try {
    writing = id;
    const done = app.extensionManager.setting.set(id, value);
    writing = void 0;
    await done;
  } catch (error) {
    console.warn(`[EnhancedLinks] Could not save ${id}:`, error);
  }
}
function commitAll(values) {
  const before2 = {};
  for (const [id, value] of Object.entries(values)) {
    const old = saved(id);
    if (normalize(setting(id), value) === old) continue;
    before2[id] = old;
    write(id, value);
  }
  return () => commitAll(before2);
}
function reset(prefix) {
  return commitAll(Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix) && s.type !== "hidden").map((s) => [s.id, s.default])));
}
const TURN = 2 * Math.PI / 15;
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
const TURNAROUND = 0.3;
const MAX_FLASH_HZ = 3;
const QUANTUM_SWEEPS = 5;
const JITTER_MS = 1;
const GUARD_MS = 1e4;
const FAILURES = 5;
const CALM = 0.25;
const CALM_ALPHA = 0.5;
const CALM_FPS = 20;
const clock = { linkPhase: 0, linkFlow: 0, linkDir: 1, quantumPhase: 0, nodePhase: 0, particleTime: 0, nodeTime: 0, nodeDir: 1, burstTime: 0, markTime: 0, runTime: 0 };
const STILL_PHASE = 9 * Math.PI / 4;
const env = { running: false, reducedMotion: false };
const PLAIN = 1;
const THIN = 2;
const HELD = 3;
const adaptive = { level: 0, onStep: void 0 };
const SLOW = 1.5;
const ROOMY = 1.2;
const SECOND = 1e3;
const PROBE = 4;
const ROOM_MS = 5e3;
const LONGEST_MS = 6e4;
const judged = {
  slow: 0,
  slowPaints: 0,
  start: 0,
  paints: 0,
  room: 0,
  raised: -Infinity,
  wait: ROOM_MS,
  revision: 0,
  timer: 0,
  scale: 0,
  x: 0,
  y: 0,
  display: 0,
  probe: 0,
  shortest: 0,
  gap: 0
};
function step$3(by, now) {
  if (by > 0) judged.wait = now - judged.raised <= 2 * SECOND ? Math.min(2 * judged.wait, LONGEST_MS) : ROOM_MS;
  if (by < 0) judged.raised = now;
  adaptive.level += by;
  judged.room = judged.start = 0;
  clearTimeout(judged.timer);
  if (adaptive.level === HELD) judged.timer = window.setTimeout(() => step$3(-1, performance.now()), judged.wait);
  need();
  adaptive.onStep?.();
}
function rest$1() {
  judged.slow = judged.slowPaints = judged.start = judged.probe = judged.gap = 0;
}
function relax$1() {
  rest$1();
  judged.room = 0;
  judged.wait = ROOM_MS;
  judged.revision = revision;
  clearTimeout(judged.timer);
  if (!adaptive.level) return;
  adaptive.level = 0;
  adaptive.onStep?.();
}
function judge(canvas, now, since2, fps) {
  if (!L.perfAdaptive) return;
  const { scale: scale2, offset } = canvas.ds;
  if (scale2 !== judged.scale || offset[0] !== judged.x || offset[1] !== judged.y || canvas.isDragging) {
    judged.scale = scale2;
    judged.x = offset[0];
    judged.y = offset[1];
    return rest$1();
  }
  const budget = Math.max(1e3 / (fps || 60), judged.display);
  if (judged.gap) {
    if (judged.gap > SLOW * budget) step$3(1, now);
    return rest$1();
  }
  if (since2 <= SLOW * budget) judged.slow = judged.slowPaints = 0;
  else {
    judged.slow ||= now - since2;
    judged.slowPaints++;
  }
  if (judged.slowPaints >= 3 && now - judged.slow >= SECOND - JITTER_MS && adaptive.level < HELD) {
    judged.gap = (now - judged.slow) / judged.slowPaints;
    judged.probe = PROBE;
    judged.shortest = Infinity;
    return;
  }
  if (!judged.start) {
    judged.start = now;
    judged.paints = 0;
    return;
  }
  judged.paints++;
  const span = now - judged.start;
  if (span < SECOND - JITTER_MS) return;
  const roomy = span / judged.paints <= ROOMY * budget;
  judged.start = now;
  judged.paints = 0;
  if (!roomy || !adaptive.level) judged.room = 0;
  else if ((judged.room += span) >= judged.wait) step$3(-1, now);
}
const during = (applies) => env.running && applies ? L.pauseMode : "ignore";
function heldByRun(applies) {
  const mode = during(applies);
  return mode === "pause" || mode === "spotlight";
}
const calm$1 = () => during(L.pauseDuringRender) === "calm" || during(N.pauseDuringRender) === "calm";
const live = { links: 0, nodes: 0, particles: 0, bursts: 0, marks: 0, flows: 0, rings: 0, wires: 0 };
const layers = {};
const steps$1 = {};
const overlaps = (box2, area, margin) => box2[0] - margin <= area[0] + area[2] && box2[0] + box2[2] + margin >= area[0] && box2[1] - margin <= area[1] + area[3] && box2[1] + box2[3] + margin >= area[1];
function offscreen(width, height) {
  return typeof OffscreenCanvas === "function" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height });
}
let sink$1;
function dummy() {
  sink$1 ??= offscreen(1, 1).getContext("2d");
  return sink$1;
}
let frame$2 = 0;
let last$1 = 0;
let due$1 = 0;
function want() {
  return !document.hidden && live.links + live.nodes + live.particles + live.bursts + live.marks + live.flows + live.rings + live.wires > 0;
}
const toward = (dir, to, dt) => dir + Math.max(-2 * dt / TURNAROUND, Math.min(2 * dt / TURNAROUND, to - dir));
function advance(k2, dt, moving2) {
  if (moving2.links) {
    const speed = L.animationSpeed;
    const linkDt = during(L.pauseDuringRender) === "calm" ? dt * CALM : dt;
    k2.linkDir = toward(k2.linkDir, L.direction, dt);
    k2.linkPhase -= PHI2 * speed * k2.linkDir * linkDt;
    k2.linkFlow += 2 * speed * speed * k2.linkDir * linkDt;
    k2.quantumPhase -= Math.min(PHI2 * speed, 2 * Math.PI * MAX_FLASH_HZ / QUANTUM_SWEEPS) * k2.linkDir * linkDt;
  } else {
    k2.linkDir = L.direction;
  }
  const nodeDt = during(N.pauseDuringRender) === "calm" ? dt * CALM : dt;
  k2.nodeDir = moving2.nodes || moving2.particles ? toward(k2.nodeDir, N.direction, dt) : N.direction;
  if (moving2.nodes) k2.nodePhase += TURN * N.animationSpeed * k2.nodeDir * nodeDt;
  if (moving2.particles) {
    k2.particleTime += N.particleSpeed * k2.nodeDir * nodeDt;
    k2.nodeTime += nodeDt;
  }
  if (moving2.bursts) k2.burstTime += dt;
  if (moving2.marks) k2.markTime += dt;
  if (moving2.flows || moving2.rings) k2.runTime += dt;
}
function tick$1(now) {
  frame$2 = 0;
  if (!want()) {
    last$1 = 0;
    rest$1();
    return;
  }
  if (!last$1) {
    last$1 = due$1 = now;
    clock.linkDir = L.direction;
    clock.nodeDir = N.direction;
  } else if (judged.probe) {
    judged.shortest = Math.min(judged.shortest, now - last$1);
    if (!--judged.probe) judged.display = judged.shortest;
    last$1 = due$1 = now;
  } else if (now >= due$1 - JITTER_MS) {
    const dt = Math.min((now - last$1) / 1e3, 0.1);
    advance(clock, dt, live);
    const swinging2 = live.wires > 0;
    if (swinging2) steps$1.wires?.(dt);
    const fps = calm$1() ? Math.min(L.perfMaxFps || CALM_FPS, CALM_FPS) : L.perfMaxFps;
    judge(app.canvas, now, now - last$1, fps);
    last$1 = now;
    const interval = fps ? 1e3 / fps : 0;
    due$1 = due$1 + interval > now ? due$1 + interval : now + interval;
    heal(app.canvas);
    app.canvas.setDirty(true, swinging2);
  }
  frame$2 = requestAnimationFrame(tick$1);
}
function wake() {
  frame$2 ||= requestAnimationFrame(tick$1);
}
function need() {
  app.canvas.setDirty(true, true);
}
const PANE = '[data-testid="transform-pane"]';
const nodes2 = { onFlip: void 0 };
let vue = false;
let found = null;
let own$1;
let ownCtx = null;
function transformPane() {
  if (!found?.isConnected) found = document.querySelector(PANE);
  return found;
}
function ours(main) {
  const pane = transformPane();
  if (!pane) return null;
  if (!own$1) {
    own$1 = document.createElement("canvas");
    own$1.className = "eln-overlay";
    own$1.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    ownCtx = own$1.getContext("2d");
  }
  if (pane.nextElementSibling !== own$1) pane.after(own$1);
  if (own$1.width !== main.width || own$1.height !== main.height) {
    own$1.width = main.width;
    own$1.height = main.height;
  } else ownCtx?.clearRect(0, 0, own$1.width, own$1.height);
  return ownCtx;
}
function drop() {
  own$1?.remove();
  own$1 = void 0;
  ownCtx = null;
}
function foreground(canvas, ctx) {
  layers.links?.(canvas, ctx, true);
  layers.runs?.(canvas, ctx);
  layers.marks?.(canvas, ctx);
  layers.bursts?.(canvas, ctx);
}
function overNodes(canvas, ctx) {
  if (!LiteGraph.vueNodesMode) {
    if (own$1) drop();
    return foreground(canvas, ctx);
  }
  const main = canvas.canvas;
  const top = "overlayCtx" in canvas ? canvas.overlayCtx : ours(main);
  if (!top) return foreground(canvas, ctx);
  top.save();
  try {
    const scale2 = top.canvas.width / (top.canvas.clientWidth || 1);
    top.setTransform(scale2, 0, 0, scale2, 0, 0);
    canvas.ds.toCanvasContext(top);
    foreground(canvas, top);
  } finally {
    top.restore();
  }
}
const hooks = {
  /** onRender(canvas element, ctx) starts each front pass, in screen space between the background and the nodes. */
  onRender: {
    ctx: 1,
    draw(canvas, ctx) {
      if (LiteGraph.vueNodesMode !== vue) {
        vue = LiteGraph.vueNodesMode;
        found = null;
        nodes2.onFlip?.();
      }
      live.nodes = live.particles = 0;
      canvas.ds.toCanvasContext(ctx);
      layers.nodes?.(canvas, ctx);
      layers.links?.(canvas, ctx, false);
    },
    installed: void 0,
    called: false,
    running: false
  },
  /** onDrawForeground(ctx, visible area), in graph space over the nodes; in Nodes 2.0 on the overlay above them. */
  onDrawForeground: {
    ctx: 0,
    draw: overNodes,
    installed: void 0,
    called: false,
    running: false
  }
};
const HOOKS = Object.keys(hooks);
function chain(canvas, name) {
  const hook = hooks[name];
  const handlers = canvas;
  const previous = handlers[name];
  hook.installed = handlers[name] = function(...args) {
    if (hook.running) return;
    hook.running = true;
    hook.called = true;
    const ctx = args[hook.ctx];
    try {
      ctx.save();
      try {
        hook.draw(this, ctx);
      } finally {
        ctx.restore();
      }
      previous?.apply(this, args);
    } finally {
      hook.running = false;
    }
  };
}
function heal(canvas) {
  for (const name of HOOKS) {
    const hook = hooks[name];
    if (!hook.called && !canvas.dirty_canvas && canvas[name] !== hook.installed) chain(canvas, name);
    hook.called = false;
  }
}
let chained;
let listening$1 = false;
function install() {
  if (chained !== app.canvas) {
    chained = app.canvas;
    for (const name of HOOKS) chain(app.canvas, name);
  }
  if (listening$1) return;
  listening$1 = true;
  document.addEventListener("visibilitychange", () => {
    last$1 = 0;
    wake();
  });
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const motion2 = () => {
    const reduced = L.motion === "reduce" || L.motion === "system" && (query.matches || document.body.classList.contains("disable-animations"));
    if (reduced === env.reducedMotion) return;
    env.reducedMotion = reduced;
    need();
  };
  motion2();
  query.addEventListener("change", motion2);
  new MutationObserver(motion2).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  watch((id) => {
    if (id === "🔗 Enhanced Links.Motion") motion2();
    if (judged.revision !== revision) relax$1();
  });
}
const failures = /* @__PURE__ */ new Map();
let failuresSince = revision;
function current() {
  if (failuresSince !== revision) {
    failures.clear();
    failuresSince = revision;
  }
  return failures;
}
const failuresOf = (key) => current().get(key);
const guard = {
  /** Whether `key` failed too often; changing any setting turns it back on. */
  off: (key) => failuresOf(key)?.off ?? false,
  /** The keys turned off now. */
  tripped: () => [...current()].flatMap(([key, f]) => f.off ? [key] : []),
  /** Turns every key back on, as changing a setting does, and redraws. */
  retry() {
    failures.clear();
    need();
  },
  /** Told when a key is turned off: the open panel, which shows it. */
  onTrip: void 0,
  /** Logs at most once per key every 10 s. FAILURES within 10 s turn the key off, with one toast that says so. */
  fail(key, error) {
    const now = performance.now();
    let f = failuresOf(key);
    if (!f) failures.set(key, f = { times: [], logged: -Infinity, off: false });
    if (now - f.logged >= GUARD_MS) {
      f.logged = now;
      console.warn(`[Enhanced Links & Nodes] ${key} failed:`, error);
    }
    f.times.push(now);
    if (f.times.length > FAILURES) f.times.shift();
    if (f.off || f.times.length < FAILURES || now - f.times[0] > GUARD_MS) return;
    f.off = true;
    app.extensionManager.toast.add({
      severity: "warn",
      summary: `${key} turned off`,
      detail: `It failed ${FAILURES} times in 10 seconds. Change any Enhanced Links & Nodes setting to turn it back on.`,
      life: 1e4
    });
    guard.onTrip?.();
  }
};
const HIGHLIGHT = { native: "#ffffff", primary: "#ffffff", secondary: "#ffffff", accent: "#ffffff", marker: "#ffffff" };
const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const NUMBER = "([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)";
const FUNCTION = new RegExp(`^(rgb|hsl)a?\\(\\s*${NUMBER}(%|deg)?\\s*,?\\s*${NUMBER}(%)?\\s*,?\\s*${NUMBER}(%)?\\s*(?:[,/]\\s*${NUMBER}(%)?\\s*)?\\)$`, "i");
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function fromHsl(h2, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k2 = (n + h2 / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k2 - 3, 9 - k2, 1), -1)));
  };
  return [f(0), f(8), f(4)];
}
function parse(colour2) {
  const text2 = colour2.trim();
  const hex2 = HEX.exec(text2);
  if (hex2) {
    const digits = hex2[1].length < 6 ? [...hex2[1]].map((d) => d + d).join("") : hex2[1];
    const byte = (i) => parseInt(digits.slice(i, i + 2), 16);
    return [byte(0), byte(2), byte(4), digits.length === 8 ? byte(6) / 255 : 1];
  }
  const fn = FUNCTION.exec(text2);
  if (!fn) return null;
  const [, kind, x, xUnit, y, yUnit, z, zUnit, a, aUnit] = fn;
  const alpha = a === void 0 ? 1 : clamp(Number(a) / (aUnit ? 100 : 1), 0, 1);
  if (kind.toLowerCase() === "hsl") {
    const hue = Number(x) % 360;
    return [...fromHsl(hue < 0 ? hue + 360 : hue, clamp(Number(y), 0, 100), clamp(Number(z), 0, 100)), alpha];
  }
  const channel = (v, unit) => Math.round(clamp(unit ? Number(v) * 255 / 100 : Number(v), 0, 255));
  return [channel(x, xUnit), channel(y, yUnit), channel(z, zUnit), alpha];
}
function show$1([r, g, b, a]) {
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
function toHsl(r, g, b) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h2 = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h2 = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h2 = (B - R) / d + 2;
    else h2 = (R - G) / d + 4;
    h2 /= 6;
  }
  return [h2 * 360, s * 100, l * 100];
}
function filter([r, g, b, alpha], scheme) {
  if (scheme === "default") return [r, g, b, alpha];
  const [h2, s, L100] = toHsl(r, g, b);
  switch (scheme) {
    case "saturated":
      return [...fromHsl(h2, Math.min(s * 1.3, 100), L100), alpha];
    case "vivid":
      return [...fromHsl(h2, Math.min(s * 1.4, 100), Math.min(L100 * 1.1, 100)), alpha];
    case "contrast":
      return [...fromHsl(h2, Math.min(s * 1.2, 100), L100 > 50 ? Math.min(L100 * 1.2, 100) : Math.max(L100 * 0.8, 0)), alpha];
    case "bright":
      return [...fromHsl(h2, s, Math.min(L100 * 1.25, 100)), alpha];
    case "muted":
      return [...fromHsl(h2, Math.max(s * 0.7, 0), Math.min(L100 * 1.1, 100)), alpha];
    default:
      return [r, g, b, alpha];
  }
}
const tint$2 = (colour2) => show$1(filter(parse(colour2), L.colorScheme));
const palettes = /* @__PURE__ */ new Map();
let palettesSince = -1;
function palette(colour2) {
  if (typeof colour2 !== "string") return void 0;
  if (palettesSince !== revision) {
    palettes.clear();
    palettesSince = revision;
  }
  let p = palettes.get(colour2);
  if (p === void 0) {
    const rgba = parse(colour2);
    if (rgba) {
      const own2 = show$1(filter(rgba, L.colorScheme));
      const [primary, secondary, accent2] = L.colorMode === "custom" ? [tint$2(L.colorPrimary), tint$2(L.colorSecondary), tint$2(L.colorAccent)] : [own2, own2, own2];
      const marker = L.markerColorMode === "custom" ? tint$2(L.markerColor) : L.markerColorMode === "inherit" ? primary : own2;
      p = { native: show$1(rgba), primary, secondary, accent: accent2, marker };
    } else p = null;
    palettes.set(colour2, p);
  }
  return p ?? void 0;
}
const solids = /* @__PURE__ */ new Map();
const lifted = /* @__PURE__ */ new Map();
const sunk = /* @__PURE__ */ new Map();
let solidsSince = -1;
function solidCaches() {
  if (solidsSince === revision) return;
  solids.clear();
  lifted.clear();
  sunk.clear();
  solidsSince = revision;
}
function solid$1(colour2) {
  solidCaches();
  let p = solids.get(colour2);
  if (!p) solids.set(colour2, p = { native: colour2, primary: colour2, secondary: colour2, accent: colour2, marker: colour2 });
  return p;
}
const lift = (v) => Math.round(v + (255 - v) * 0.2);
function lighter(colour2) {
  solidCaches();
  let light2 = lifted.get(colour2);
  if (light2 === void 0) {
    const rgba = parse(colour2);
    light2 = rgba ? show$1([lift(rgba[0]), lift(rgba[1]), lift(rgba[2]), rgba[3]]) : colour2;
    lifted.set(colour2, light2);
  }
  return light2;
}
const sink = (v) => Math.round(v * 0.6);
function darker(colour2) {
  solidCaches();
  let deep = sunk.get(colour2);
  if (deep === void 0) {
    const rgba = parse(colour2);
    deep = rgba ? show$1([sink(rgba[0]), sink(rgba[1]), sink(rgba[2]), rgba[3]]) : colour2;
    sunk.set(colour2, deep);
  }
  return deep;
}
function accent() {
  const rgba = parse(getComputedStyle(document.body).getPropertyValue("--primary-background"));
  return rgba ? show$1(rgba) : "#0b8ce9";
}
const MID_GREY = 0.184;
let background = "";
let darkBackground = true;
const linear = (v) => v <= 10 ? v / 3294.6 : ((v / 255 + 0.055) / 1.055) ** 2.4;
function dark(colour2) {
  if (colour2 === background) return darkBackground;
  background = colour2;
  const ctx = dummy();
  ctx.fillStyle = "#000";
  ctx.fillStyle = colour2;
  const [r, g, b, a] = parse(String(ctx.fillStyle));
  darkBackground = a === 1 && 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < MID_GREY;
  return darkBackground;
}
const hues = [];
let huesSince = -1;
function rainbow(hue) {
  if (huesSince !== revision) {
    for (let h2 = 0; h2 < 360; h2++) hues[h2] = show$1(filter([...fromHsl(h2, 100, 50), 1], L.colorScheme));
    huesSince = revision;
  }
  return hues[(Math.round(hue) % 360 + 360) % 360];
}
const STYLE_COLOURS = [
  ["#44aaff", "#88ccff", "#0088ff"],
  ["#44aaff", "#88ccff", "#0088ff"],
  ["#00ff88", "#00ffcc", "#00ff44"],
  ["#ff00ff", "#aa00ff", "#ff40ff"],
  ["#ffcc00", "#ff8800", "#ffaa00"]
];
const nodeTint = (colour2) => show$1(filter(parse(colour2), N.colorScheme));
const nodePalettes = [];
let nodePalettesSince = -1;
function nodePalette(style) {
  if (nodePalettesSince !== revision) {
    nodePalettes.length = 0;
    nodePalettesSince = revision;
  }
  let p = nodePalettes[style];
  if (!p) {
    const custom = N.colorMode === "custom";
    const [primary, secondary, accent2] = (custom ? [N.colorPrimary, N.colorSecondary, N.colorAccent] : STYLE_COLOURS[style]).map(nodeTint);
    const [r, g, b] = parse(custom ? N.colorParticle : primary);
    const [h2, s, l] = toHsl(r, g, b);
    p = nodePalettes[style] = {
      primary,
      secondary,
      accent: accent2,
      particle: custom ? nodeTint(N.colorParticle) : primary,
      complement: `hsl(${(h2 + 180) % 360}, ${s}%, ${l}%)`,
      title: custom ? nodeTint(N.textColor) : accent2
    };
  }
  return p;
}
const calm = (w) => Math.min(1, 2 * Math.PI * MAX_FLASH_HZ / w);
function particleColour(pal, i, t, rate) {
  switch (N.particleColorMode) {
    case "rainbow":
      return `hsl(${(i * 30 + t * 50) % 360}, 90%, 75%)`;
    case "complementary":
      return pal.complement;
    case "energy":
      return `hsl(${(t * 100 + i * 20) % 360}, 90%, 75%)`;
    case "quantum": {
      const q = (t * 2 + i * 0.1) % 1;
      return `hsl(${280 + (q < 0 ? q + 1 : q) * 80}, 90%, ${60 + Math.sin(t * 5 * calm(5 * rate)) * 20}%)`;
    }
    case "aurora": {
      const a = (t * 3 + i * 0.2) % 1;
      return `hsl(${120 + (a < 0 ? a + 1 : a) * 60}, ${80 + Math.sin(t * 3) * 20}%, ${70 + Math.sin(t * 4 * calm(4 * rate)) * 20}%)`;
    }
    default:
      return pal.particle;
  }
}
const prefixes = /* @__PURE__ */ new Map();
let prefixesSince = -1;
function translucent(colour2, alpha) {
  if (colour2.startsWith("hsl(")) return `hsla(${colour2.slice(4, -1)}, ${alpha})`;
  if (prefixesSince !== revision) {
    prefixes.clear();
    prefixesSince = revision;
  }
  let start = prefixes.get(colour2);
  if (start === void 0) {
    const [r, g, b] = parse(colour2);
    prefixes.set(colour2, start = `rgba(${r}, ${g}, ${b}, `);
  }
  return `${start}${alpha})`;
}
function noise(seed) {
  let t = seed + 1831565813 | 0;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function rng(seed) {
  let state2 = seed | 0;
  return () => {
    const value = noise(state2);
    state2 = state2 + 1831565813 | 0;
    return value;
  };
}
const CAP = 4096;
const pool$1 = {
  count: 0,
  kind: new Uint8Array(CAP),
  owner: new Uint16Array(CAP),
  angle: new Float64Array(CAP),
  speed: new Float64Array(CAP),
  size: new Float64Array(CAP),
  colour: new Uint8Array(CAP),
  trail: new Uint8Array(CAP),
  seq: new Uint16Array(CAP)
};
const DOT = {
  path(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
};
const STEPS$1 = 8;
const TURNS = 32;
const LEAST = 0.25;
const WIDEST = 256;
const BUDGET = 4 * 2 ** 20;
const sprites = /* @__PURE__ */ new Map();
const discs = /* @__PURE__ */ new Map();
let pixels = 0;
let since = -1;
let pass$2 = 0;
let scale = 0;
function startSprites(ctx) {
  if (since !== revision) {
    sprites.clear();
    discs.clear();
    pixels = 0;
    since = revision;
  }
  const { a, b, c, d } = ctx.getTransform();
  scale = Math.sqrt(Math.abs(a * d - b * c));
  ctx.imageSmoothingQuality = "low";
  pass$2++;
}
function stopSprites() {
  scale = 0;
}
const alphas = /* @__PURE__ */ new Map();
function opacity(colour2) {
  if (colour2.charCodeAt(0) === 35) return 1;
  let alpha = alphas.get(colour2);
  if (alpha === void 0) alphas.set(colour2, alpha = Number(colour2.slice(colour2.lastIndexOf(",") + 1, -1)));
  return alpha;
}
const step$2 = (size) => Math.round(Math.log2(Math.max(size, LEAST)) * STEPS$1);
function cast(shape2, size, angle, width, colour2, blur, half) {
  const image = offscreen(2 * half, 2 * half);
  const ctx = image.getContext("2d");
  ctx.shadowColor = colour2;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 4 * half;
  ctx.lineWidth = width;
  ctx.lineCap = ctx.lineJoin = "round";
  shape2.path(ctx, -3 * half, half, size, angle);
  if (shape2.stroked) ctx.stroke();
  else ctx.fill();
  pixels += 4 * half * half;
  return { image, size, half, used: pass$2 };
}
function evict() {
  const all2 = [];
  for (const byColour of sprites.values()) {
    for (const byKey of byColour.values()) for (const [key, sprite2] of byKey) all2.push([byKey, key, sprite2]);
  }
  all2.sort((x, y) => x[2].used - y[2].used);
  for (const [byKey, key, sprite2] of all2) {
    if (pixels <= BUDGET * 0.75) return;
    byKey.delete(key);
    pixels -= 4 * sprite2.half * sprite2.half;
  }
}
function sprite(shape2, size, angle, width, colour2, blur) {
  const s = step$2(size);
  const w = width && step$2(width);
  const [cs, cw] = [2 ** (s / STEPS$1), width && 2 ** (w / STEPS$1)];
  const half = Math.ceil((shape2.reach ?? 1) * cs + cw / 2 + 1.5 * blur) + 1;
  if (2 * half > WIDEST) return void 0;
  const { turn } = shape2;
  const t = turn ? Math.round((angle % turn + turn) % turn / turn * TURNS) % TURNS : 0;
  const key = ((Math.round(blur * 2) * 128 + s + 16) * 128 + (width && w + 17)) * TURNS + t;
  let byColour = sprites.get(shape2);
  if (!byColour) sprites.set(shape2, byColour = /* @__PURE__ */ new Map());
  let byKey = byColour.get(colour2);
  if (!byKey) byColour.set(colour2, byKey = /* @__PURE__ */ new Map());
  let found2 = byKey.get(key);
  if (!found2) {
    byKey.set(key, found2 = cast(shape2, cs, turn ? t / TURNS * turn : 0, cw, colour2, blur, half));
    if (pixels > BUDGET) evict();
  }
  found2.used = pass$2;
  return found2;
}
function stamp(ctx, shape2, x, y, size, angle, paint2, colour2, blur, offset) {
  const d = shape2.stroked ? Math.max(size * scale, LEAST) : size * scale;
  if (d < LEAST) return true;
  const found2 = sprite(shape2, d, angle, shape2.stroked ? ctx.lineWidth * scale : 0, colour2, blur);
  if (!found2) return false;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * opacity(paint2);
  const h2 = found2.half * d / found2.size / scale;
  const o = offset / scale;
  ctx.drawImage(found2.image, x + o - h2, y + o - h2, 2 * h2, 2 * h2);
  ctx.globalAlpha = alpha;
  return true;
}
function glow(ctx, shape2, x, y, size, angle, paint2, colour2, blur, offset = 0) {
  if (scale && (blur || offset) && stamp(ctx, shape2, x, y, size, angle, paint2, colour2, blur, offset)) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  } else {
    ctx.shadowColor = colour2;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = ctx.shadowOffsetY = offset;
  }
}
function shine(ctx, shape2, x, y, size, angle, paint2, colour2, blur, offset = 0) {
  glow(ctx, shape2, x, y, size, angle, paint2, colour2, blur, offset);
  if (shape2.stroked) {
    ctx.strokeStyle = paint2;
    ctx.stroke();
  } else {
    ctx.fillStyle = paint2;
    ctx.fill();
  }
}
function paintDisc(ctx, x, y, r, colour2, alpha, soft) {
  if (soft) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    gradient.addColorStop(0, translucent(colour2, alpha));
    gradient.addColorStop(0.4, translucent(colour2, alpha * 0.5));
    gradient.addColorStop(1, translucent(colour2, 0));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = translucent(colour2, alpha);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function disc(ctx, x, y, r, colour2, alpha, soft) {
  if (!scale) {
    paintDisc(ctx, x, y, r, colour2, alpha, soft);
    return;
  }
  const d = r * scale;
  if (d < LEAST) return;
  const s = step$2(d);
  let byKey = discs.get(colour2);
  if (!byKey) discs.set(colour2, byKey = /* @__PURE__ */ new Map());
  const key = (s + 16) * 2 + Number(soft);
  let found2 = byKey.get(key);
  if (!found2) {
    const size = 2 ** (s / STEPS$1);
    const half = Math.ceil(size) + 1;
    const image = offscreen(2 * half, 2 * half);
    paintDisc(image.getContext("2d"), half, half, size, colour2, 1, soft);
    byKey.set(key, found2 = { image, size, half, used: pass$2 });
  }
  const before2 = ctx.globalAlpha;
  ctx.globalAlpha = before2 * alpha;
  const h2 = found2.half * d / found2.size / scale;
  ctx.drawImage(found2.image, x - h2, y - h2, 2 * h2, 2 * h2);
  ctx.globalAlpha = before2;
}
const COMPLETION = "Completion effect";
const STYLES$1 = ["fireworks", "confetti", "shockwave", "trace"];
const BURSTS = [
  { x: 0.05, y: -0.2, delay: 0, colour: "#FF3366", size: 3.2 },
  { x: 0.03, y: -0.15, delay: 0.1, colour: "#33EEFF", size: 2.9 },
  { x: 0.06, y: -0.15, delay: 0.2, colour: "#FFEE33", size: 3 }
];
const RATE = 0.84;
const SPARKS = 250;
const SPARKLES = 40;
const [CORE$1, SPARK, SPARKLE, GLOW, PIECE, RING, COMET$1] = [0, 1, 2, 3, 4, 5, 6];
const SHOW = BURSTS.length * (1 + SPARKS + SPARKLES);
const LASTS = { confetti: 2, shockwave: 0.7, trace: 1.5 };
const STAGGER = 1 / MAX_FLASH_HZ;
const MOST$2 = Math.floor(CAP / SHOW);
const PIECES = [60, 120];
const SPREAD = 260;
const ABOVE = [30, 200];
const THROW = 120;
const GRAVITY = 600;
const DRAG = 3;
const SWAY = 10;
const SWAY_HZ = 0.8;
const SPIN = 4;
const FLIPS = [0.4, 1.2];
const LENGTH = [5, 9];
const COME = 0.1;
const GO = 0.5;
const PARAMS = 11;
const RING_PX = 3;
const RING_GLOW_PX = 12;
const POINT_RING = 160;
const RING_CORNER = 8;
const RING_IN = 0.06;
const bursts = [];
const show = { style: "fireworks", rate: RATE };
let played;
const progress = () => clock.burstTime * show.rate;
function hash(text2) {
  let h2 = 2166136261;
  for (let i = 0; i < text2.length; i++) h2 = Math.imul(h2 ^ text2.charCodeAt(i), 16777619);
  return h2;
}
function add$2(kind, owner, angle = 0, speed = 0, size = 0, colour2 = 0, trail2 = 0, seq = 0) {
  const i = pool$1.count++;
  pool$1.kind[i] = kind;
  pool$1.owner[i] = owner;
  pool$1.angle[i] = angle;
  pool$1.speed[i] = speed;
  pool$1.size[i] = size;
  pool$1.colour[i] = colour2;
  pool$1.trail[i] = trail2;
  pool$1.seq[i] = seq;
}
const nth = (seed, n) => noise(seed + n * 1831565813);
function fireworks(nodes, run2) {
  show.rate = RATE;
  const { secondary, accent: accent2 } = nodePalette(N.animate);
  for (const node2 of nodes) {
    if (pool$1.count + SHOW > CAP) break;
    const seed = hash(run2) ^ hash(String(node2.id));
    const random = rng(seed);
    for (const { x, y, delay, size, colour: colour2 } of BURSTS) {
      const owner = bursts.push({ node: node2, x, y, delay, size: node2.small ? size / 2 : size, seed, colours: [colour2, secondary, accent2, "#FFFFFF"] }) - 1;
      if (env.reducedMotion) {
        add$2(GLOW, owner);
        break;
      }
      add$2(CORE$1, owner);
      for (let i = 0; i < SPARKS; i++) {
        const speed = 0.3 + random() * 0.7;
        const shade = Math.floor(random() * 4);
        add$2(SPARK, owner, i / SPARKS * Math.PI * 2, speed, speed, shade, random() < speed * 0.7 ? Math.floor(speed * 3) + 1 : 0, i);
      }
      for (let j = 0; j < SPARKLES; j++) add$2(SPARKLE, owner, random() * Math.PI * 2, random(), random(), 3, 0, j);
    }
  }
}
function play(style, nodes, run2) {
  if (pool$1.count && progress() < 1 || !nodes.length) return;
  played = style;
  pool$1.count = bursts.length = 0;
  clock.burstTime = 0;
  const drawn = show.style = env.reducedMotion ? "fireworks" : style;
  if (drawn === "fireworks") fireworks(nodes, run2);
  else {
    const { primary, secondary, accent: accent2 } = nodePalette(N.animate);
    const anchors2 = drawn === "trace" ? 1 : Math.min(nodes.length, MOST$2);
    show.rate = 1 / (LASTS[drawn] + (anchors2 - 1) * STAGGER);
    for (let k2 = 0; k2 < anchors2; k2++) {
      const node2 = nodes[k2];
      const seed = hash(run2) ^ hash(String(node2.id));
      const owner = bursts.push({ node: node2, x: 0, y: 0, delay: k2 * STAGGER, size: node2.small ? 0.5 : 1, seed, colours: [primary, secondary, accent2] }) - 1;
      if (drawn !== "confetti") add$2(drawn === "shockwave" ? RING : COMET$1, owner);
      else {
        const count2 = Math.round((PIECES[0] + noise(seed) * (PIECES[1] - PIECES[0])) * bursts[owner].size);
        for (let i = 0; i < count2; i++) add$2(PIECE, owner, 0, 0, 0, 0, 0, i);
      }
    }
  }
  live.bursts = pool$1.count;
  wake();
}
function surprise$1(run2, styles) {
  const others = styles.filter((style) => style !== played);
  return others[Math.floor(noise(hash(run2)) * others.length)];
}
function tracing() {
  const p = progress();
  return show.style === "trace" && pool$1.count && p < 1 ? p : -1;
}
function endBursts() {
  pool$1.count = bursts.length = 0;
  live.bursts = 0;
}
const where = new Float64Array(2);
function anchor(node2) {
  const box2 = node2.boundingRect;
  where[0] = box2 ? box2[0] + box2[2] / 2 : node2.pos[0];
  where[1] = box2 ? box2[1] : node2.pos[1];
  return box2;
}
function piece(ctx, burst2, n, t, unit) {
  const alpha = Math.min(1, t / COME, (LASTS.confetti - t) / GO);
  if (alpha <= 0) return;
  const { seed, size } = burst2;
  const at = 1 + n * PARAMS;
  anchor(burst2.node);
  const heading = nth(seed, at + 2) * 2 * Math.PI;
  const speed = nth(seed, at + 3) * THROW;
  const slowed = (1 - Math.exp(-DRAG * t)) / DRAG;
  const sway = SWAY * Math.sin(2 * Math.PI * (SWAY_HZ * t + nth(seed, at + 8)));
  const x = where[0] + unit * ((nth(seed, at) - 0.5) * SPREAD * size + Math.cos(heading) * speed * slowed + sway);
  const y = where[1] + unit * (Math.sin(heading) * speed * slowed + GRAVITY / DRAG * (t - slowed) - (ABOVE[0] + nth(seed, at + 1) * (ABOVE[1] - ABOVE[0])) * size);
  const turn = nth(seed, at + 4) * 2 * Math.PI + (2 * nth(seed, at + 5) - 1) * SPIN * t;
  const flip = Math.cos(2 * Math.PI * ((FLIPS[0] + nth(seed, at + 6) * (FLIPS[1] - FLIPS[0])) * t + nth(seed, at + 7)));
  const half = unit * (LENGTH[0] + nth(seed, at + 9) * (LENGTH[1] - LENGTH[0])) / 2;
  const lx = Math.cos(turn) * half;
  const ly = Math.sin(turn) * half;
  const wx = -ly * 0.5 * flip;
  const wy = lx * 0.5 * flip;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = burst2.colours[Math.floor(nth(seed, at + 10) * 3)];
  ctx.beginPath();
  ctx.moveTo(x + lx + wx, y + ly + wy);
  ctx.lineTo(x - lx + wx, y - ly + wy);
  ctx.lineTo(x - lx - wx, y - ly - wy);
  ctx.lineTo(x + lx - wx, y + ly - wy);
  ctx.closePath();
  ctx.fill();
}
function wave(ctx, burst2, t, unit) {
  const p = t / LASTS.shockwave;
  if (p >= 1) return;
  const grown2 = 1 - (1 - p) ** 3;
  const box2 = anchor(burst2.node);
  ctx.beginPath();
  if (box2) {
    const w = box2[2] * (1 + grown2);
    const h2 = box2[3] * (1 + grown2);
    ctx.roundRect(where[0] - w / 2, where[1] + (box2[3] - h2) / 2, w, h2, RING_CORNER * (1 + grown2));
  } else {
    ctx.arc(where[0], where[1], POINT_RING * burst2.size * unit * (0.1 + 0.9 * grown2), 0, Math.PI * 2);
  }
  const alpha = Math.min(1, t / RING_IN) * (1 - p) ** 2;
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = burst2.colours[2];
  ctx.lineWidth = RING_GLOW_PX * unit;
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = burst2.colours[0];
  ctx.lineWidth = RING_PX * unit;
  ctx.stroke();
}
function drawBursts(canvas, ctx) {
  const phase = progress();
  if (phase >= 1) pool$1.count = bursts.length = 0;
  live.bursts = pool$1.count;
  if (!pool$1.count) return;
  const area = canvas.visible_area;
  const unit = 1 / canvas.ds.scale;
  const view = Math.min(area[2], area[3]);
  const fireworks2 = show.style === "fireworks";
  ctx.save();
  try {
    if (fireworks2) ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < pool$1.count; i++) {
      const burst2 = bursts[pool$1.owner[i]];
      const t = (fireworks2 ? phase : clock.burstTime) - burst2.delay;
      if (t <= 0 || burst2.node.graph !== canvas.graph) continue;
      const x = burst2.node.pos[0] + area[2] * burst2.x;
      const y = burst2.node.pos[1] + area[3] * burst2.y;
      const reach2 = view * 0.2 * burst2.size;
      const colour2 = burst2.colours[pool$1.colour[i]];
      switch (pool$1.kind[i]) {
        case CORE$1: {
          const fade2 = 1 - t * 1.2;
          if (fade2 <= 0) break;
          const radius = reach2 * (0.1 + 0.5 * t);
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, translucent("#FFFFFF", 0.95 * fade2));
          gradient.addColorStop(0.5, translucent(colour2, 0.8 * fade2));
          gradient.addColorStop(1, translucent(colour2, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case SPARK: {
          const alpha = 1 - t * 1.2;
          if (alpha <= 0) break;
          const speed = reach2 * pool$1.speed[i];
          const angle = pool$1.angle[i] + Math.sin(t * 10 + pool$1.seq[i]) * 0.05;
          const gravity = 0.2 * reach2;
          const dy2 = Math.sin(angle) * speed * t + gravity * t * t;
          const size = Math.max(1, 3 * (1 - t) * pool$1.size[i]) * unit;
          disc(ctx, x + Math.cos(angle) * speed * t, y + dy2, size * 1.2, colour2, alpha, true);
          for (let j = 1; j <= pool$1.trail[i]; j++) {
            const back2 = Math.max(0, t - 0.02 * j);
            disc(ctx, x + Math.cos(angle) * speed * back2, y + Math.sin(angle) * speed * back2 + gravity * back2 * back2, size * (1 - j * 0.2), colour2, alpha * (0.7 - j * 0.2), false);
          }
          break;
        }
        case SPARKLE: {
          if (t >= 0.3 || pool$1.seq[i] >= Math.floor(SPARKLES * (1 - t / 0.3))) break;
          const dist = reach2 * 0.7 * t * pool$1.speed[i];
          disc(ctx, x + Math.cos(pool$1.angle[i]) * dist, y + Math.sin(pool$1.angle[i]) * dist, (1 + pool$1.size[i] * 4 * (1 - t)) * unit, colour2, 0.95 * (1 - t * 3), false);
          break;
        }
        case PIECE:
          piece(ctx, burst2, pool$1.seq[i], t, unit);
          break;
        case RING:
          wave(ctx, burst2, t, unit);
          break;
        case GLOW: {
          const radius = reach2 * 0.4;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, translucent(colour2, 0.5 * Math.sin(Math.PI * Math.min(t, 1))));
          gradient.addColorStop(1, translucent(colour2, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } finally {
    ctx.restore();
  }
}
const POP_SPARKS = [8, 12];
const POP_REACH = 48;
const POP_S = 0.4;
const POP_RING = 10;
const POP_RING_S = 0.3;
const POPS = 6;
const pops = [];
const popped = new Float64Array(POPS).fill(-Infinity);
let oldest = 0;
const popLasts = () => env.reducedMotion ? POP_RING_S : POP_S;
const popKept = () => Math.max(popLasts(), 1 / MAX_FLASH_HZ);
function pop(canvas, node2, run2) {
  const now = performance.now();
  if (now - popped[oldest] < 1e3 || !overlaps(node2.boundingRect, canvas.visible_area, 0) || pops.some((p) => p.node === node2 && clock.runTime - p.at < popKept())) return;
  popped[oldest] = now;
  oldest = (oldest + 1) % POPS;
  pops.push({ node: node2, at: clock.runTime, seed: hash(run2) ^ hash(String(node2.id)) });
}
function drawPops(canvas, ctx) {
  let n = 0;
  for (const p of pops) if (clock.runTime - p.at < popKept()) pops[n++] = p;
  pops.length = n;
  if (!n) return 0;
  const lasts = popLasts();
  const area = canvas.visible_area;
  const unit = 1 / canvas.ds.scale;
  const { primary, secondary } = nodePalette(N.animate);
  const light2 = !dark(canvas.clear_background_color);
  const first2 = light2 ? darker(primary) : primary;
  const second = light2 ? darker(secondary) : secondary;
  ctx.save();
  try {
    for (const p of pops) {
      const f = (clock.runTime - p.at) / lasts;
      const box2 = p.node.boundingRect;
      if (f >= 1 || p.node.graph !== canvas.graph || !overlaps(box2, area, POP_REACH * unit)) continue;
      const x = box2[0] + box2[2];
      const y = box2[1];
      ctx.globalAlpha = 1 - f;
      if (env.reducedMotion) {
        ctx.strokeStyle = first2;
        ctx.lineWidth = 2 * unit;
        ctx.beginPath();
        ctx.arc(x, y, POP_RING * unit, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      const out = POP_REACH * unit * (1 - (1 - f) ** 2);
      const sparks = POP_SPARKS[0] + Math.floor(noise(p.seed) * (POP_SPARKS[1] - POP_SPARKS[0] + 1));
      for (let half = 0; half < 2; half++) {
        ctx.fillStyle = half ? second : first2;
        ctx.beginPath();
        for (let i = half; i < sparks; i += 2) {
          const heading = -Math.PI + nth(p.seed, 1 + 3 * i) * 1.5 * Math.PI;
          const reach2 = out * (0.5 + 0.5 * nth(p.seed, 2 + 3 * i));
          const sx = x + Math.cos(heading) * reach2;
          const sy = y + Math.sin(heading) * reach2;
          const r = (3 + nth(p.seed, 3 + 3 * i)) * unit * (1 - 0.5 * f);
          ctx.moveTo(sx + r, sy);
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
  } finally {
    ctx.restore();
  }
  return n;
}
const RUNS = "Run visuals";
const RIVER_DELAY = 0.15;
const RIVER_IN = 0.15;
const RIVER_OUT = 0.6;
const RIVER_WIDTH = 1.4;
const SPACING = 60;
const RIVER_SPEED = 400;
const TRAIL = 0.35;
const TRAIL_WIDTH = 3;
const RING_WIDTH = 3;
const RING_OUT = 9;
const COMET = 0.2;
const COMET_HZ = 0.5;
const PULSE_HZ = 1;
const PULSES = 3;
const SHAKE_PX = 3;
const SHAKE_S = 0.3;
const RED = "#ff3b30";
const ANCHORS = 3;
const BATCH_MS = 1500;
const SHOWS_MS = 3e3;
const [BOX, CIRCLE] = [1, 3];
const LEG = 0.25;
const FADE = 0.5;
const TAIL = 120;
const TAIL_DISCS = 16;
const HEAD = 6;
const OWN_COMPLETION = "enhanced_fx_completion";
const run = { prompt: "", workflow: void 0, end: -Infinity };
const steps = /* @__PURE__ */ new Map();
const cached = /* @__PURE__ */ new Set();
let tint$1 = "";
const held$4 = /* @__PURE__ */ new Map();
let changes = 0;
let celebrating = false;
let listening = false;
const shown$2 = [];
const into = /* @__PURE__ */ new Map();
const rank = /* @__PURE__ */ new Map();
let ranks = 0;
const taken = { graph: void 0, version: -1, changes: -1 };
function path(id) {
  const nodes = [];
  let graph2 = app.rootGraph;
  for (const part2 of id.split(":")) {
    const node2 = graph2?.getNodeById(part2);
    if (!node2) return [];
    nodes.push(node2);
    graph2 = node2.subgraph;
  }
  return nodes;
}
const standIn = (graph2, id) => path(id).find((node2) => node2.graph === graph2);
const here$6 = () => app.extensionManager.workflow.activeWorkflow === run.workflow;
function syncRuns(canvas) {
  const { graph: graph2 } = canvas;
  if (graph2 === taken.graph && graph2?._version === taken.version && changes === taken.changes) return;
  Object.assign(taken, { graph: graph2, version: graph2?._version ?? -1, changes });
  shown$2.length = ranks = 0;
  into.clear();
  rank.clear();
  if (!graph2 || !steps.size || !here$6()) return;
  for (const [id, step2] of steps) {
    const node2 = standIn(graph2, id);
    if (!node2) continue;
    const seen2 = into.get(Number(node2.id));
    if (!seen2) {
      const entry2 = { node: node2, step: step2 };
      shown$2.push(entry2);
      into.set(Number(node2.id), entry2);
      continue;
    }
    const { start, end: end2, progress: progress2, failed } = seen2.step;
    seen2.step = { start: Math.min(start, step2.start), end: Math.max(end2, step2.end), progress: step2.end === Infinity ? step2.progress : progress2, failed: failed || step2.failed };
  }
  for (const { node: node2, step: step2 } of shown$2) if (node2.inputs.some((input) => input.link != null)) rank.set(step2, ranks++);
}
const stepInto = (link2) => into.get(Number(link2.target_id))?.step;
const stepOf = (node2) => into.get(Number(node2.id))?.step;
const flowsShown = () => shown$2.length > 0 && !guard.off(RUNS) && (tracing() >= 0 || (L.flowRiver || L.flowTrail) && clock.runTime < run.end + (L.flowTrail ? L.flowTrailFade : RIVER_OUT));
const linkPass = { drawsRuns: () => false };
function riverAlpha(step2, t, still) {
  if (still) return step2.end === Infinity ? 1 : 0;
  return Math.max(0, Math.min(1, (Math.min(t, step2.end) - step2.start - RIVER_DELAY) / RIVER_IN, 1 - (t - step2.end) / RIVER_OUT));
}
const trailLeft = (step2, t) => step2.end > t ? 0 : Math.max(0, Math.min(1, 1 - (t - run.end) / L.flowTrailFade));
const point = new Float64Array(4);
function comet(ctx, s, order, p, unit) {
  const leg = Math.max(1 / (ranks + FADE), LEG);
  const f = (p - (ranks > 1 ? order * (1 - leg * (1 + FADE)) / (ranks - 1) : 0)) / leg;
  if (f <= 0 || f >= 1 + FADE) return false;
  const tail2 = TAIL * unit;
  const head = f * s.chain;
  const fade2 = Math.min(1, (1 + FADE - f) / FADE);
  for (let i = TAIL_DISCS - 1; i >= 0; i--) {
    const d = head - i / TAIL_DISCS * tail2;
    if (d < s.u0 || d >= s.u0 + s.len) continue;
    s.path.find((d - s.u0) / s.len * s.path.length, point);
    const left = 1 - i / TAIL_DISCS;
    disc(ctx, point[0], point[1], HEAD * unit * (0.4 + 0.6 * left), tint$1, left * fade2, true);
    if (i) continue;
    disc(ctx, point[0], point[1], 2 * HEAD * unit, tint$1, 0.4, true);
    disc(ctx, point[0], point[1], 0.75 * HEAD * unit, "#ffffff", 1, false);
  }
  return true;
}
function drawFlows(ctx, segments2) {
  const t = clock.runTime;
  const still = during(L.pauseDuringRender) === "pause";
  const flowing2 = !still && !env.reducedMotion;
  let moving2 = 0;
  ctx.lineCap = "round";
  startSprites(ctx);
  try {
    for (const s of segments2) {
      const step2 = s.flow;
      if (!step2 || s.empty) continue;
      const left = L.flowTrail ? trailLeft(step2, t) : 0;
      if (left > 0) {
        ctx.globalAlpha = step2.failed ? left : left * TRAIL;
        ctx.strokeStyle = step2.failed ? RED : tint$1;
        ctx.lineWidth = L.thickness * (step2.failed ? RIVER_WIDTH : TRAIL_WIDTH);
        ctx.beginPath();
        s.path.trace(ctx);
        ctx.stroke();
        if (run.end !== Infinity) moving2++;
      }
      if (!L.flowRiver || step2.failed) continue;
      const alpha = riverAlpha(step2, t, still);
      if (!still && t < step2.end + RIVER_OUT && (flowing2 || alpha < 1)) moving2++;
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = lighter(s.colour);
      ctx.lineWidth = L.thickness * RIVER_WIDTH;
      ctx.beginPath();
      s.path.trace(ctx);
      ctx.stroke();
      const shift = flowing2 ? t * RIVER_SPEED % SPACING : 0;
      for (let d = s.u0 + ((shift - s.u0) % SPACING + SPACING) % SPACING; d < s.u0 + s.len; d += SPACING) {
        s.path.at((d - s.u0) / s.len, point);
        disc(ctx, point[0], point[1], L.thickness, "#ffffff", 1, true);
      }
    }
    const p = tracing();
    if (p >= 0) {
      ctx.globalAlpha = 1;
      const unit = 1 / app.canvas.ds.scale;
      for (const s of segments2) {
        const order = s.flow && rank.get(s.flow);
        if (order !== void 0 && !s.empty && comet(ctx, s, order, p, unit)) moving2++;
      }
    }
  } catch (error) {
    guard.fail(RUNS, error);
  } finally {
    stopSprites();
  }
  return moving2;
}
const round = { length: 0, top: 0 };
const dash$1 = [0, 0];
function trace(ctx, node2, out) {
  const box2 = node2.boundingRect;
  const shape2 = node2.renderingShape;
  ctx.beginPath();
  if (shape2 === CIRCLE && !node2.flags.collapsed) {
    const r2 = node2.size[0] / 2 + out;
    ctx.arc(node2.pos[0] + node2.size[0] / 2, node2.pos[1] + node2.size[1] / 2, r2, -Math.PI / 2, 1.5 * Math.PI);
    round.length = 2 * Math.PI * r2;
    round.top = 0;
    return;
  }
  const w = box2[2] + 2 * out;
  const h2 = box2[3] + 2 * out;
  const r = node2.flags.collapsed ? h2 / 2 : shape2 === BOX ? 0 : LiteGraph.ROUND_RADIUS + out;
  ctx.roundRect(box2[0] - out, box2[1] - out, w, h2, r);
  round.length = 2 * (w + h2) - 8 * r + 2 * Math.PI * r;
  round.top = w / 2 - r;
}
function stretch(ctx, from, length) {
  dash$1[0] = length;
  dash$1[1] = round.length - length;
  ctx.setLineDash(dash$1);
  ctx.lineDashOffset = round.length - round.top - from;
  ctx.stroke();
}
function ring$1(ctx, node2, step2, t, still) {
  ctx.globalAlpha = 1;
  ctx.strokeStyle = tint$1;
  ctx.lineWidth = RING_WIDTH;
  trace(ctx, node2, RING_OUT + RING_WIDTH / 2);
  if (!Number.isNaN(step2.progress)) {
    stretch(ctx, 0, step2.progress * round.length);
    return false;
  }
  if (still) {
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    return false;
  }
  const piece2 = COMET * round.length / 4;
  const head = t * COMET_HZ % 1 * round.length;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = (i + 1) / 4;
    stretch(ctx, head - (4 - i) * piece2, piece2);
  }
  return true;
}
function failure(ctx, node2, step2, t) {
  const age = t - step2.end;
  const steady = env.reducedMotion || age >= PULSES / PULSE_HZ;
  ctx.globalAlpha = steady ? 1 : 0.6 + 0.4 * Math.cos(2 * Math.PI * PULSE_HZ * age);
  if (!env.reducedMotion && age < SHAKE_S) ctx.translate(SHAKE_PX * Math.sin(age / SHAKE_S * 6 * Math.PI) * (1 - age / SHAKE_S), 0);
  ctx.strokeStyle = RED;
  ctx.lineWidth = RING_WIDTH;
  trace(ctx, node2, RING_OUT + RING_WIDTH / 2);
  ctx.stroke();
  return !steady;
}
function drawSteps(canvas, ctx) {
  syncRuns(canvas);
  live.rings = 0;
  if (!N.enabled || !shown$2.length || guard.off(RUNS)) return;
  const t = clock.runTime;
  const still = env.reducedMotion || during(N.pauseDuringRender) === "pause";
  const area = canvas.visible_area;
  for (const { node: node2, step: step2 } of shown$2) {
    if (!overlaps(node2.boundingRect, area, RING_OUT + RING_WIDTH)) continue;
    ctx.save();
    try {
      const moves2 = step2.end === Infinity ? N.runRing && ring$1(ctx, node2, step2, t, still) : step2.failed && N.runError && failure(ctx, node2, step2, t);
      if (moves2) live.rings++;
    } catch (error) {
      guard.fail(RUNS, error);
    } finally {
      ctx.restore();
    }
  }
  try {
    live.rings += drawPops(canvas, ctx);
  } catch (error) {
    guard.fail(RUNS, error);
  }
  if (live.rings) wake();
}
let celebrated = -Infinity;
function anchors(canvas, graph2) {
  const area = canvas.visible_area;
  const [x, y] = [area[0] + area[2] / 2, area[1] + area[3] / 2];
  const middle = { id: "view", pos: [x, y], graph: graph2 };
  if (N.completionAnchor === "viewport") return [middle];
  if (!here$6()) return [];
  const choice2 = (node2) => node2.properties[OWN_COMPLETION];
  const reached = /* @__PURE__ */ new Set();
  let elsewhere = false;
  for (const id of [...steps.keys(), ...cached]) {
    const nodes = path(id);
    const node2 = nodes.at(-1);
    if (!node2 || choice2(node2) === "exclude" || !node2.constructor.nodeData?.output_node) continue;
    const stand = nodes.find((n) => n.graph === graph2);
    if (stand) reached.add(stand);
    else elsewhere = true;
  }
  const distance = ({ boundingRect: box2 }) => Math.hypot(box2[0] + box2[2] / 2 - x, box2[1] + box2[3] / 2 - y);
  const near = (a, b) => distance(a) - distance(b);
  const primary = graph2.nodes.filter((node2) => choice2(node2) === "primary").sort(near);
  const outputs = [...reached].filter((node2) => choice2(node2) !== "primary" && choice2(node2) !== "exclude").sort(near);
  const list = (N.completionAnchor === "primary" && primary.length ? primary : [...primary, ...outputs]).slice(0, ANCHORS);
  const shows2 = list.filter((node2) => overlaps(node2.boundingRect, area, 0));
  if (shows2.length < list.length || elsewhere && !list.length) shows2.push({ ...middle, small: true });
  return shows2;
}
function complete(shows2, prompt) {
  const { canvas } = app;
  syncRuns(canvas);
  const styles = ranks && !guard.off(RUNS) && linkPass.drawsRuns(canvas) ? STYLES$1 : STYLES$1.filter((style2) => style2 !== "trace");
  const chosen = N.completionStyle === "random" ? surprise$1(prompt, styles) : N.completionStyle;
  const style = styles.includes(chosen) ? chosen : "shockwave";
  if (style === "trace") canvas.setDirty(true, true);
  play(style, shows2, prompt);
}
function celebrate(prompt) {
  const { canvas } = app;
  const now = performance.now();
  if (!celebrating || !N.enabled || !N.endAnimationEnabled || guard.off(COMPLETION) || !canvas.graph || now - celebrated < SHOWS_MS) return;
  const shows2 = anchors(canvas, canvas.graph);
  if (!shows2.length) return;
  celebrated = now;
  complete(shows2, prompt);
}
function burst(id) {
  const { canvas } = app;
  const node2 = path(id).at(-1);
  if (!celebrating || !N.enabled || !N.completionPerNode || guard.off(RUNS) || !node2 || node2.graph !== canvas.graph || !here$6() || during(N.pauseDuringRender) === "pause") return;
  pop(canvas, node2, run.prompt);
}
function running$1() {
  let id;
  for (const [key, step2] of steps) if (step2.end === Infinity) id = key;
  return id;
}
function shownAs(id) {
  const { graph: graph2 } = app.canvas;
  if (!graph2 || !here$6()) return void 0;
  const nodes = path(id);
  const node2 = nodes.find((n) => n.graph === graph2);
  return node2 && [node2, node2 !== nodes.at(-1)];
}
function errorNodes() {
  const { canvas, extensionManager: manager } = app;
  const ids2 = "lastNodeErrors" in manager ? [...Object.keys(manager.lastNodeErrors ?? {}), ...manager.lastExecutionError?.node_id != null ? [String(manager.lastExecutionError.node_id)] : []] : [...steps].flatMap(([id, step2]) => step2.failed ? [id] : []);
  const graph2 = canvas.graph;
  return graph2 && here$6() ? [...new Set(ids2.flatMap((id) => standIn(graph2, id) ?? []))] : [];
}
function changed$2(moved2) {
  changes++;
  app.canvas.setDirty(true, moved2);
}
function finish() {
  for (const step2 of steps.values()) if (step2.end === Infinity) step2.end = clock.runTime;
  run.end = clock.runTime;
  env.running = false;
  changed$2(true);
}
const signature = (node2) => JSON.stringify([node2.mode, node2.widgets?.map((widget) => widget.value), node2.inputs.map((_, i) => node2.getInputLink(i)?.id)]);
function installRuns(part2) {
  if (part2 === "nodes") {
    layers.runs = drawSteps;
    celebrating = true;
  }
  if (listening) return;
  listening = true;
  const ours2 = (detail) => env.running && detail.prompt_id === run.prompt;
  api.addEventListener("execution_start", ({ detail }) => {
    if (performance.now() - celebrated < BATCH_MS) endBursts();
    Object.assign(run, { prompt: detail.prompt_id, workflow: app.extensionManager.workflow.activeWorkflow, end: Infinity });
    steps.clear();
    cached.clear();
    held$4.clear();
    tint$1 = accent();
    env.running = true;
    changed$2(true);
  });
  api.addEventListener("execution_cached", ({ detail }) => {
    if (ours2(detail)) for (const id of detail.nodes) cached.add(String(id));
  });
  api.addEventListener("progress_state", ({ detail }) => {
    if (!ours2(detail)) return;
    let moved2 = false;
    for (const { state: state2, value, max, node_id, display_node_id } of Object.values(detail.nodes)) {
      const id = String(display_node_id ?? node_id);
      let step2 = steps.get(id);
      if (state2 === "running") {
        if (!step2) {
          steps.set(id, step2 = { start: clock.runTime, end: Infinity, progress: NaN, failed: false });
          moved2 = true;
        } else if (step2.end !== Infinity) {
          step2.end = Infinity;
          moved2 = true;
        }
        step2.progress = max > 1 || value > 0 ? value / max : NaN;
      } else if (state2 === "finished" && step2?.end === Infinity) {
        step2.end = clock.runTime;
        moved2 = true;
        burst(id);
      }
    }
    changed$2(moved2);
  });
  api.addEventListener("execution_success", ({ detail }) => {
    if (!ours2(detail)) return;
    finish();
    celebrate(detail.prompt_id);
  });
  api.addEventListener("execution_error", ({ detail }) => {
    if (!ours2(detail)) return;
    const id = detail.node_id == null ? void 0 : String(detail.node_id);
    if (id !== void 0) {
      const step2 = steps.get(id) ?? { start: clock.runTime, end: Infinity, progress: NaN, failed: false };
      step2.failed = true;
      steps.set(id, step2);
    }
    finish();
    const node2 = id === void 0 ? void 0 : path(id).at(-1);
    if (node2) held$4.set(id, signature(node2));
  });
  api.addEventListener("execution_interrupted", ({ detail }) => {
    if (ours2(detail)) finish();
  });
  api.addEventListener("reconnected", () => {
    if (env.running) finish();
  });
  api.addEventListener("graphChanged", () => {
    let edited = false;
    for (const [id, before2] of held$4) {
      const node2 = path(id).at(-1);
      if (node2 && signature(node2) === before2) continue;
      held$4.delete(id);
      const step2 = steps.get(id);
      if (step2) step2.failed = false;
      edited = true;
    }
    if (edited) changed$2(true);
  });
}
const SACRED = { TRINITY: 3, HARMONY: 7, COMPLETION: 12, QUANTUM: 5 };
const moving = { alpha: 1, glow: 1, density: 1 };
function wrap(x) {
  const r = x % 1;
  return r < 0 ? r + 1 : r;
}
const here$5 = new Float64Array(4);
let ts = new Float64Array(64);
function vertices(s, n) {
  const first2 = Math.ceil(s.t0 * n);
  const last2 = Math.floor(s.t1 * n);
  if (ts.length < last2 - first2 + 3) ts = new Float64Array(2 * (last2 - first2 + 3));
  let m = 0;
  if (first2 / n > s.t0) ts[m++] = s.t0;
  for (let i = first2; i <= last2; i++) ts[m++] = i / n;
  if (last2 / n < s.t1) ts[m++] = s.t1;
  return m;
}
const HEPTAGON = {
  path(ctx, x, y, size, angle) {
    ctx.beginPath();
    for (let i = 0; i < SACRED.HARMONY; i++) {
      const corner = angle + i / SACRED.HARMONY * Math.PI * 2;
      const px = x + Math.cos(corner) * size;
      const py = y + Math.sin(corner) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  },
  stroked: true,
  turn: Math.PI * 2 / SACRED.HARMONY
};
function createCrystal(ctx, x, y, size, rotation, color, glowColor, blur) {
  glow(ctx, HEPTAGON, x, y, size, rotation, color, glowColor, blur);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  HEPTAGON.path(ctx, 0, 0, size, 0);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
const RUNG = {
  path(ctx, x, y, size, angle) {
    const dx2 = Math.cos(angle) * size;
    const dy2 = Math.sin(angle) * size;
    ctx.beginPath();
    ctx.moveTo(x + dx2, y + dy2);
    ctx.lineTo(x - dx2, y - dy2);
  },
  stroked: true,
  turn: Math.PI
};
function triangle(ctx, size, angle) {
  for (let i = 0; i <= SACRED.TRINITY; i++) {
    const a = angle + i / SACRED.TRINITY * Math.PI * 2;
    if (i) ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    else ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
  }
}
const MERKABA = {
  path(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    triangle(ctx, size, 0);
    triangle(ctx, size, Math.PI / SACRED.TRINITY);
    ctx.restore();
  },
  stroked: true,
  turn: Math.PI / SACRED.TRINITY
};
const moved = (turn, T, cp) => turn(T * Math.PI * SACRED.TRINITY - cp) * 10 * Math.sin(T * Math.PI - cp) * 0.5;
function sacredFlow$1(ctx, s, k2) {
  const { thickness } = L;
  const glowIntensity = L.glowIntensity * moving.glow;
  const { primary, accent: accent2 } = s.pal;
  const cp = k2.linkFlow * 0.25;
  const m = vertices(s, Math.max(12, Math.round(s.chain / 8)));
  ctx.beginPath();
  for (let j = 0; j < m; j++) {
    const T = ts[j];
    s.path.at(s.local(T), here$5);
    const x = here$5[0] + moved(Math.sin, T, cp);
    const y = here$5[1] + moved(Math.cos, T, cp);
    if (j) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = primary;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = primary;
  ctx.shadowBlur = glowIntensity;
  ctx.globalAlpha = moving.alpha;
  ctx.stroke();
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity * moving.density));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp * 0.5);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    const x = here$5[0] + moved(Math.sin, T, cp);
    const y = here$5[1] + moved(Math.cos, T, cp);
    DOT.path(ctx, x, y, thickness * 0.75, 0);
    ctx.globalAlpha = (0.4 + Math.sin(k2.linkPhase + T * Math.PI * 2) * 0.2) * moving.alpha;
    shine(ctx, DOT, x, y, thickness * 0.75, 0, accent2, accent2, glowIntensity);
  }
}
function crystalStream$1(ctx, s, k2) {
  const { thickness } = L;
  const { primary, secondary } = s.pal;
  const cp = k2.linkFlow;
  const count2 = Math.max(1, Math.floor(SACRED.HARMONY * L.quality * L.particleDensity * moving.density));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = moving.alpha;
    createCrystal(ctx, here$5[0], here$5[1], 5 * thickness * (1 + Math.sin(cp + T * Math.PI)), T * Math.PI * 2 + cp, primary, secondary, L.glowIntensity * moving.glow);
  }
}
function quantumField$1(ctx, s, k2) {
  const { primary, secondary } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * L.particleDensity)));
  for (let f = 0; f < SACRED.QUANTUM; f++) {
    const fieldPhase = k2.quantumPhase + f * Math.PI * 2 / SACRED.QUANTUM;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$5);
      const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
      const x = here$5[0] + uncertainty * Math.cos(fieldPhase);
      const y = here$5[1] + uncertainty * Math.sin(fieldPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = f % 2 === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = L.thickness * 0.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = L.glowIntensity * moving.glow;
    ctx.globalAlpha = 0.3 * moving.alpha;
    ctx.stroke();
  }
}
function cosmicWeave$1(ctx, s, k2) {
  const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let strand = 0; strand < SACRED.TRINITY; strand++) {
    const strandPhase = k2.linkFlow + strand * Math.PI * 2 / SACRED.TRINITY;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$5);
      const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase) * 10;
      const x = here$5[0] + weave * Math.cos(strandPhase);
      const y = here$5[1] + weave * Math.sin(strandPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = colors[strand];
    ctx.lineWidth = L.thickness * 0.7;
    ctx.shadowColor = colors[strand];
    ctx.shadowBlur = L.glowIntensity * moving.glow;
    ctx.globalAlpha = 0.5 * moving.alpha;
    ctx.stroke();
  }
}
function energyPulse$1(ctx, s, k2) {
  const { secondary } = s.pal;
  const cp = k2.linkFlow * 0.25;
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * moving.density));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    const trip = L.direction > 0 ? T : 1 - T;
    const r = L.thickness * 2 * (1 - trip);
    DOT.path(ctx, here$5[0], here$5[1], r, 0);
    ctx.globalAlpha = 0.5 * (1 - trip) * moving.alpha;
    shine(ctx, DOT, here$5[0], here$5[1], r, 0, secondary, secondary, L.glowIntensity * moving.glow * 2);
  }
}
function dnaHelix$1(ctx, s, k2) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness } = L;
  const glowIntensity = L.glowIntensity * moving.glow;
  const radius = 10;
  const rotations = 4;
  const angle = (T) => (1 - T) * Math.PI * rotations * 2 + k2.linkFlow;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
  for (let strand = 0; strand < 2; strand++) {
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$5);
      const side = strand ? -1 : 1;
      const x = here$5[0] + side * Math.cos(angle(T)) * radius;
      const y = here$5[1] + side * Math.sin(angle(T)) * radius;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = strand ? secondary : primary;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = moving.alpha;
    ctx.stroke();
  }
  const bonds = rotations * 4;
  for (let b = 0; b < bonds; b++) {
    const T = 1 - b / bonds;
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 0.6 * moving.alpha;
    RUNG.path(ctx, here$5[0], here$5[1], radius, angle(T));
    shine(ctx, RUNG, here$5[0], here$5[1], radius, angle(T), accent2, accent2, glowIntensity * 0.5);
  }
}
function linkGradient(ctx, s, dir) {
  const { start, end: end2, t0, t1 } = s;
  const dx2 = (end2[0] - start[0]) / (t1 - t0);
  const dy2 = (end2[1] - start[1]) / (t1 - t0);
  const x0 = start[0] - dx2 * t0;
  const y0 = start[1] - dy2 * t0;
  const x1 = end2[0] + dx2 * (1 - t1);
  const y1 = end2[1] + dy2 * (1 - t1);
  return dir > 0 ? ctx.createLinearGradient(x0, y0, x1, y1) : ctx.createLinearGradient(x1, y1, x0, y0);
}
const LAVA = [
  { ripple: 20, rate: 1, swell: 0.8 },
  { ripple: 20 * 0.7, rate: 1.2, swell: 0.6 }
];
function lavaFlow$1(ctx, s, k2) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness } = L;
  const glowIntensity = L.glowIntensity * moving.glow;
  const cp = k2.linkFlow;
  const tube = thickness * 7;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
  for (const layer2 of LAVA) {
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$5);
      const across = Math.sin(T * Math.PI * 3 - cp * layer2.rate) * layer2.ripple * Math.sin(T * Math.PI * 2 - cp * layer2.swell);
      const x = here$5[0] - here$5[3] * across;
      const y = here$5[1] + here$5[2] * across;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.lineCap = "round";
    ctx.shadowColor = secondary;
    ctx.shadowBlur = glowIntensity * 1.5;
    if (layer2 === LAVA[0]) {
      ctx.strokeStyle = secondary;
      ctx.globalAlpha = 0.3 * moving.alpha;
      ctx.lineWidth = tube;
    } else {
      const gradient = linkGradient(ctx, s, L.direction);
      gradient.addColorStop(0, primary);
      gradient.addColorStop(0.4 + Math.sin(k2.linkPhase) * 0.1, secondary);
      gradient.addColorStop(1, accent2);
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = moving.alpha;
      ctx.lineWidth = thickness * 5;
    }
    ctx.stroke();
  }
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity * moving.density * 3));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp * 0.5);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    const along2 = Math.sin(T * Math.PI * 2) * (tube * 0.15);
    const across = Math.sin(T * Math.PI * 3 - cp) * (20 * 0.3) * Math.sin(T * Math.PI * 2 - cp) + Math.cos(T * Math.PI * 3) * (tube * 0.15);
    const x = here$5[0] + here$5[2] * along2 - here$5[3] * across;
    const y = here$5[1] + here$5[3] * along2 + here$5[2] * across;
    const r = thickness * (0.5 + Math.sin(cp + i) * 0.2);
    DOT.path(ctx, x, y, r, 0);
    ctx.globalAlpha = (0.6 + Math.sin(cp + i) * 0.4) * moving.alpha;
    shine(ctx, DOT, x, y, r, 0, accent2, secondary, glowIntensity * 1.5);
  }
}
function stellarPlasma$1(ctx, s, k2) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness } = L;
  const glowIntensity = L.glowIntensity * moving.glow;
  const f = k2.linkFlow;
  const segments2 = Math.floor(s.chain / 20) * L.quality * L.particleDensity * moving.density || 1;
  const first2 = (t) => L.direction > 0 ? t < 0.5 : t > 0.5;
  for (let i = 0; i <= segments2; i++) {
    const t = i / segments2;
    const size = thickness * (0.5 + Math.sin(t * Math.PI * 2 + f) * 0.5);
    let u = s.local(1 - t);
    if (s.within(u)) {
      s.path.at(u, here$5);
      const y2 = here$5[1] + Math.sin(t * Math.PI * 4 + f) * 15;
      const color = first2(t) ? primary : secondary;
      DOT.path(ctx, here$5[0], y2, size, 0);
      ctx.globalAlpha = (0.7 - Math.abs(t - 0.5) * 0.3) * moving.alpha;
      shine(ctx, DOT, here$5[0], y2, size, 0, color, color, glowIntensity);
    }
    if (i % 3) continue;
    const spark = wrap(t - f * 0.5);
    u = s.local(1 - spark);
    if (!s.within(u)) continue;
    s.path.at(u, here$5);
    const y = here$5[1] + Math.sin(spark * Math.PI * 4 + f) * 15;
    DOT.path(ctx, here$5[0], y, size * 0.5, 0);
    ctx.globalAlpha = (0.6 - Math.abs(spark - 0.5) * 0.4) * moving.alpha;
    shine(ctx, DOT, here$5[0], y, size * 0.5, 0, accent2, accent2, glowIntensity * 0.5);
  }
}
const along$1 = (s, u) => s.path.find(u * s.path.length, here$5);
const SLOT_PX = 12;
const grown = (s, T) => Math.min(1, T * s.chain / SLOT_PX, (1 - T) * s.chain / SLOT_PX);
const BEAD_PX = 60;
const BEAD_RATE = 0.1;
function merkabaBeads(ctx, s, k2) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const glowIntensity = L.glowIntensity * moving.glow;
  const count2 = Math.max(1, Math.floor(s.chain * L.quality * L.particleDensity * moving.density / BEAD_PX));
  ctx.globalAlpha = moving.alpha;
  for (let i = 0; i < count2; i++) {
    const T = wrap((i + 0.5) / count2 + k2.linkFlow * BEAD_RATE);
    const u = s.local(T);
    if (!s.within(u)) continue;
    along$1(s, u);
    const size = L.thickness * 3 * grown(s, T);
    ctx.lineWidth = size * 0.18;
    MERKABA.path(ctx, here$5[0], here$5[1], size, k2.linkPhase);
    shine(ctx, MERKABA, here$5[0], here$5[1], size, k2.linkPhase, primary, secondary, glowIntensity);
    ctx.shadowBlur = 0;
    DOT.path(ctx, here$5[0], here$5[1], size * 0.25, 0);
    ctx.fillStyle = accent2;
    ctx.fill();
  }
}
const PITCH$1 = 6.4;
const RUNG_PX = 12;
let helix = new Float64Array(5 * 128);
let rungs = new Float64Array(5 * 64);
function strandPath(ctx, n, strand, near) {
  let open2 = false;
  for (let j = 0; j + 1 < n; j++) {
    if ((helix[5 * j + 4] + helix[5 * j + 9]) * (strand ? -1 : 1) > 0 !== near) {
      open2 = false;
      continue;
    }
    const o = 5 * j + 2 * strand;
    if (!open2) ctx.moveTo(helix[o], helix[o + 1]);
    ctx.lineTo(helix[o + 5], helix[o + 6]);
    open2 = true;
  }
}
function dnaHelix3d(ctx, s, k2) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness } = L;
  const { path: path2, u0, len } = s;
  const radius = 4 + thickness * 2;
  const pitch = PITCH$1 * radius;
  const n = Math.max(2, Math.ceil(len * L.quality / 8) + 1);
  if (helix.length < 5 * n) helix = new Float64Array(10 * n);
  for (let j = 0; j < n; j++) {
    path2.find(j / (n - 1) * path2.length, here$5);
    const angle = 2 * Math.PI * (u0 + j / (n - 1) * len) / pitch + k2.linkPhase;
    const off = radius * Math.sin(angle);
    helix[5 * j] = here$5[0] - here$5[3] * off;
    helix[5 * j + 1] = here$5[1] + here$5[2] * off;
    helix[5 * j + 2] = here$5[0] + here$5[3] * off;
    helix[5 * j + 3] = here$5[1] - here$5[2] * off;
    helix[5 * j + 4] = Math.cos(angle);
  }
  const gap = RUNG_PX / moving.density;
  const first2 = Math.ceil(u0 / gap);
  const m = Math.max(0, Math.ceil((u0 + len) / gap) - first2);
  if (rungs.length < 5 * m) rungs = new Float64Array(10 * m);
  for (let r = 0; r < m; r++) {
    const D = (first2 + r) * gap;
    path2.find((D - u0) / len * path2.length, here$5);
    const angle = 2 * Math.PI * D / pitch + k2.linkPhase;
    const off = radius * Math.sin(angle);
    rungs[5 * r] = here$5[0];
    rungs[5 * r + 1] = here$5[1];
    rungs[5 * r + 2] = -here$5[3] * off;
    rungs[5 * r + 3] = here$5[2] * off;
    rungs[5 * r + 4] = Math.cos(angle);
  }
  ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.lineCap = "butt";
  ctx.beginPath();
  strandPath(ctx, n, 0, false);
  strandPath(ctx, n, 1, false);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = thickness / 3;
  ctx.globalAlpha = 0.4 * moving.alpha;
  ctx.stroke();
  ctx.strokeStyle = accent2;
  for (let near = 0; near < 2; near++) {
    ctx.beginPath();
    for (let r = 0; r < m; r++) {
      const side = (rungs[5 * r + 4] > 0 ? 1 : -1) * (near ? 1 : -1);
      ctx.moveTo(rungs[5 * r], rungs[5 * r + 1]);
      ctx.lineTo(rungs[5 * r] + side * rungs[5 * r + 2], rungs[5 * r + 1] + side * rungs[5 * r + 3]);
    }
    ctx.globalAlpha = (near ? 0.7 : 0.3) * moving.alpha;
    ctx.stroke();
  }
  ctx.lineWidth = thickness * 1.1;
  ctx.globalAlpha = moving.alpha;
  const front = Math.ceil(2 * u0 / pitch + k2.linkPhase / Math.PI);
  for (let from = front; from < front + 2; from++) {
    const color = from & 1 ? secondary : primary;
    for (let half = from; ; half += 2) {
      const D = (half * Math.PI - k2.linkPhase) * pitch / (2 * Math.PI);
      if (D >= u0 + len) break;
      path2.find((D - u0) / len * path2.length, here$5);
      glow(ctx, DOT, here$5[0], here$5[1], radius * 0.4, 0, color, color, L.glowIntensity * moving.glow);
    }
  }
  ctx.beginPath();
  strandPath(ctx, n, 0, true);
  if (secondary !== primary) {
    ctx.strokeStyle = ctx.shadowColor = primary;
    ctx.stroke();
    ctx.beginPath();
  }
  strandPath(ctx, n, 1, true);
  ctx.strokeStyle = ctx.shadowColor = secondary;
  ctx.stroke();
}
const COMET_PX = 120;
const COMET_RATE = 0.125;
const STRAY = 0.4;
const TAIL_PX = 100;
const LAYERS = [[1, 1, 0.2], [0.6, 0.75, 0.3], [0.3, 0.5, 0.5]];
const LAYER_COLORS = ["primary", "secondary", "accent"];
const WHITE$1 = "#ffffff";
let tail = new Float64Array(4 * 32);
function trail(ctx, s, head, length, width) {
  const tip = head - length;
  const from = Math.max(Math.min(head, tip), s.u0);
  const to = Math.min(Math.max(head, tip), s.u0 + s.len);
  if (from >= to) return;
  const n = Math.max(2, Math.ceil((to - from) / 4) + 1);
  if (tail.length < 4 * n) tail = new Float64Array(8 * n);
  for (let j = 0; j < n; j++) {
    const D = from + (to - from) * j / (n - 1);
    s.path.find((D - s.u0) / s.len * s.path.length, here$5);
    const w = width * Math.sqrt((D - tip) / length);
    tail[4 * j] = here$5[0];
    tail[4 * j + 1] = here$5[1];
    tail[4 * j + 2] = -here$5[3] * w;
    tail[4 * j + 3] = here$5[2] * w;
  }
  ctx.beginPath();
  for (let j = 0; j < n; j++) ctx.lineTo(tail[4 * j] + tail[4 * j + 2], tail[4 * j + 1] + tail[4 * j + 3]);
  for (let j = n - 1; j >= 0; j--) ctx.lineTo(tail[4 * j] - tail[4 * j + 2], tail[4 * j + 1] - tail[4 * j + 3]);
  ctx.closePath();
  ctx.fill();
}
function cometTrails(ctx, s, k2) {
  const { pal } = s;
  const count2 = Math.max(1, Math.floor(s.chain * L.quality * L.particleDensity * moving.density / COMET_PX));
  const radius = L.thickness * 2;
  const length = Math.min(TAIL_PX, s.chain) * k2.linkDir;
  const ahead = length < 0 ? -1 : 1;
  const core2 = lighter(pal.accent);
  for (let i = 0; i < count2; i++) {
    const T = wrap((i + 0.5 + STRAY * (noise(i) - 0.5)) / count2 + k2.linkFlow * COMET_RATE);
    ctx.shadowBlur = 0;
    for (let lap = 0; lap < 2; lap++) {
      const head = (T + lap * ahead) * s.chain;
      for (let l = 0; l < LAYERS.length; l++) {
        ctx.fillStyle = pal[LAYER_COLORS[l]];
        ctx.globalAlpha = LAYERS[l][2] * moving.alpha;
        trail(ctx, s, head, length * LAYERS[l][0], radius * LAYERS[l][1]);
      }
    }
    const u = s.local(T);
    if (!s.within(u)) continue;
    along$1(s, u);
    const r = radius * grown(s, T);
    ctx.globalAlpha = moving.alpha;
    DOT.path(ctx, here$5[0], here$5[1], r, 0);
    shine(ctx, DOT, here$5[0], here$5[1], r, 0, core2, pal.accent, L.glowIntensity * moving.glow * 2);
    ctx.shadowBlur = 0;
    DOT.path(ctx, here$5[0], here$5[1], r * 0.5, 0);
    ctx.fillStyle = WHITE$1;
    ctx.fill();
  }
}
const STROKES = /* @__PURE__ */ new Set([1, 3, 4, 6, 7]);
const MOVING = {
  1: sacredFlow$1,
  2: crystalStream$1,
  3: quantumField$1,
  4: cosmicWeave$1,
  5: energyPulse$1,
  6: dnaHelix$1,
  7: lavaFlow$1,
  8: stellarPlasma$1,
  10: merkabaBeads,
  11: dnaHelix3d,
  12: cometTrails
};
const MOST$1 = 2e3;
const HOVER_MS = 150;
const LEAVE_MS = 100;
const focus = { links: /* @__PURE__ */ new Set(), reroutes: /* @__PURE__ */ new Set() };
const focuses = (link2, reroute) => reroute ? focus.reroutes.has(reroute.id) : focus.links.has(link2.id);
const focusing = () => focus.links.size > 0;
const built = { graph: void 0, version: 0, reroutes: 0, revision: 0, hovered: void 0, background: "", items: [] };
let themeAccent = "";
let resting;
let under;
let adding = 0;
let dropping = 0;
function settle$1(node2) {
  resting = node2;
  app.canvas.setDirty(true, true);
}
function hover$1(canvas) {
  const over = L.focusEnabled && L.focusHover && !canvas.isDragging && !canvas.dragging_canvas && !canvas.linkConnector.isConnecting ? canvas.node_over : void 0;
  if (over === under) return;
  under = over;
  clearTimeout(adding);
  clearTimeout(dropping);
  if (resting && over !== resting) dropping = window.setTimeout(settle$1, LEAVE_MS, void 0);
  if (over && over !== resting) adding = window.setTimeout(settle$1, HOVER_MS, over);
}
function changed$1(canvas, graph2) {
  const items = canvas.selectedItems;
  if (built.graph !== graph2 || built.version !== graph2._version || built.reroutes !== graph2.reroutes.size || built.revision !== revision || built.hovered !== resting || built.background !== canvas.clear_background_color || built.items.length !== items.size) return true;
  let i = 0;
  for (const item of items) if (built.items[i++] !== item) return true;
  return false;
}
const seeds = [];
const stack = [];
const visited = /* @__PURE__ */ new Set();
function add$1(graph2, link2) {
  if (focus.links.size >= MOST$1) return false;
  focus.links.add(link2.id);
  for (let r = graph2.getReroute(link2.parentId); r && !focus.reroutes.has(r.id); r = graph2.getReroute(r.parentId)) focus.reroutes.add(r.id);
  return true;
}
function through(graph2, link2, up, far) {
  if (!link2) return true;
  if (!add$1(graph2, link2)) return false;
  const next = graph2.getNodeById(up ? link2.origin_id : link2.target_id);
  if (next && (far || next.type === "Reroute")) stack.push(next);
  return true;
}
function spread(graph2, up, far) {
  stack.length = 0;
  stack.push(...seeds);
  visited.clear();
  for (let node2 = stack.pop(); node2; node2 = stack.pop()) {
    if (visited.has(node2)) continue;
    visited.add(node2);
    if (up) {
      for (let i = 0; i < node2.inputs.length; i++) if (!through(graph2, node2.getInputLink(i), true, far)) return;
    } else {
      for (const output of node2.outputs) for (const id of output.links ?? []) if (!through(graph2, graph2.getLink(id), false, far)) return;
    }
  }
}
function build(canvas, graph2) {
  focus.links.clear();
  focus.reroutes.clear();
  Object.assign(built, { graph: graph2, version: graph2._version, reroutes: graph2.reroutes.size, revision, hovered: resting, background: canvas.clear_background_color });
  built.items.length = seeds.length = 0;
  for (const item of canvas.selectedItems) {
    built.items.push(item);
    if (item instanceof LGraphNode) seeds.push(item);
    else if (item instanceof LGraphGroup) {
      for (const child of item.children) if (child instanceof LGraphNode) seeds.push(child);
    }
  }
  if (resting?.graph === graph2) seeds.push(resting);
  if (L.focusColor === "accent") themeAccent = accent();
  const { focusDepth: depth2 } = L;
  spread(graph2, true, depth2 === "upstream" || depth2 === "chain");
  spread(graph2, false, depth2 === "downstream" || depth2 === "chain");
}
function syncFocus(canvas) {
  hover$1(canvas);
  const { graph: graph2 } = canvas;
  if (!L.focusEnabled || !graph2) {
    if (!built.graph) return false;
    focus.links.clear();
    focus.reroutes.clear();
    built.graph = void 0;
    return true;
  }
  if (!changed$1(canvas, graph2)) return false;
  build(canvas, graph2);
  return true;
}
function focusPalette(colour2) {
  return L.focusColor === "type" ? solid$1(lighter(colour2)) : L.focusColor === "accent" ? solid$1(themeAccent) : HIGHLIGHT;
}
const UP = 1;
const DOWN = 2;
const LEFT$2 = 3;
const RIGHT$2 = 4;
const STRAIGHT_LINK = 0;
const LINEAR_LINK = 1;
const CHORDS = 40;
const STUB$1 = 10;
const CORNER = 8;
const WAVE = 10;
const WAVELENGTH = 60;
const COIL = 6;
const PITCH = 12;
const TAPER = 15;
const MOST_POINTS = 2049;
const dx = (dir) => dir === LEFT$2 ? -1 : dir === RIGHT$2 ? 1 : 0;
const dy = (dir) => dir === UP ? -1 : dir === DOWN ? 1 : 0;
const smooth = (x) => x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x);
function stub(path2, point2, dir, length) {
  path2.moveTo(point2[0], point2[1]);
  path2.lineTo(point2[0] + dx(dir) * length, point2[1] + dy(dir) * length);
}
let samples = new Float64Array(64);
const here$4 = new Float64Array(4);
class LinkPath {
  /** The ends, which the effects hand back to ask for a point counted from either one. */
  a = [0, 0];
  b = [0, 0];
  /** A spline's start, controls and end, or the points of a polyline, as x, y pairs. */
  p = new Float64Array(12);
  /** How many points p holds: 4 for a spline. */
  n = 4;
  spline = true;
  /** A spline's x and y as a·t³ + b·t² + c·t + start, as v1 computed its own (old_link_animations.js:455-475). */
  k = new Float64Array(6);
  /** The length to each polyline point, or to each of a spline's CHORDS + 1 samples. */
  cum = new Float64Array(CHORDS + 1);
  /** A coil's points, as x, y pairs, and how many: it is drawn and hit through them, and effects keep to the path inside. */
  loops = new Float64Array(0);
  looped = 0;
  length = 0;
  /** Where the segment's centre marker goes, and the angle of an arrow marker there. */
  cx = 0;
  cy = 0;
  angle = 0;
  /** The box around the points, which holds the whole path: left, top, right, bottom. */
  box = new Float64Array(4);
  /** The path native draws for a renderLink call in render mode `mode`, from the arguments the call got. */
  set(a, b, startDir, endDir, mode, startControl, endControl) {
    const ax = this.a[0] = a[0];
    const ay = this.a[1] = a[1];
    const bx = this.b[0] = b[0];
    const by = this.b[1] = b[1];
    this.looped = 0;
    const sd = startDir || RIGHT$2;
    const ed = endDir || LEFT$2;
    this.spline = mode !== LINEAR_LINK && mode !== STRAIGHT_LINK;
    if (this.spline) {
      const d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) * 0.25;
      this.points(4);
      this.point(0, ax, ay);
      this.point(1, ax + (startControl ? startControl[0] || 0 : dx(sd) * d), ay + (startControl ? startControl[1] || 0 : dy(sd) * d));
      this.point(2, bx + (endControl ? endControl[0] || 0 : dx(ed) * d), by + (endControl ? endControl[1] || 0 : dy(ed) * d));
      this.point(3, bx, by);
      this.measureSpline();
      return;
    }
    const l = mode === LINEAR_LINK ? 15 : 10;
    const x1 = ax + dx(sd) * l;
    const y1 = ay + dy(sd) * l;
    const x2 = bx + dx(ed) * l;
    const y2 = by + dy(ed) * l;
    const straight = mode === STRAIGHT_LINK;
    this.points(straight ? 6 : 4);
    this.point(0, ax, ay);
    this.point(1, x1, y1);
    if (straight) {
      this.point(2, (x1 + x2) * 0.5, y1);
      this.point(3, (x1 + x2) * 0.5, y2);
    }
    this.point(this.n - 2, x2, y2);
    this.point(this.n - 1, bx, by);
    this.measurePolyline();
    this.cx = (x1 + x2) * 0.5;
    this.cy = (y1 + y2) * 0.5;
    this.angle = straight ? Math.abs(y2 - y1) < 4 ? 0 : Math.sign(y2 - y1) * Math.PI / 2 : Math.atan2(y2 - y1, x2 - x1);
  }
  /**
   * Turns the path set() gave into steps between the same ends: across at the start's height, then down or up,
   * then a stub into the end along its direction, with the corners rounded.
   */
  step(endDir) {
    const [ax, ay] = this.a;
    const [bx, by] = this.b;
    const ed = endDir || LEFT$2;
    const ex = bx + dx(ed) * STUB$1;
    const ey = by + dy(ed) * STUB$1;
    const rise = Math.abs(ey - ay) * 0.5;
    this.spline = false;
    this.n = 0;
    this.add(ax, ay);
    this.corner(ex, ay, ax, ay, ex, ey, Math.min(CORNER, Math.abs(ex - ax), rise));
    this.corner(ex, ey, ex, ay, bx, by, Math.min(CORNER, rise, Math.abs(bx - ex) + Math.abs(by - ey)));
    this.add(bx, by);
    this.measurePolyline();
    this.centre();
  }
  /**
   * Turns the path into a wave, or winds a coil around it. `u0` is how far along its link the segment starts, so
   * either carries on across reroutes; both grow from nothing at an end that is a slot. Effects ride a wave, as they
   * rode v1's zigzag, but keep to the path inside a coil, whose loops run back along it.
   */
  bend(coil, u0, fromSlot, toSlot) {
    const len = this.length;
    if (!len) return;
    const count2 = Math.min(MOST_POINTS, Math.ceil(len / (coil ? PITCH / 12 : WAVELENGTH / 16)) + 1);
    if (samples.length < 2 * count2 + 2) samples = new Float64Array(4 * count2 + 2);
    const offset = (d, i) => {
      this.find(d, here$4);
      const fade2 = (fromSlot ? smooth(d / TAPER) : 1) * (toSlot ? smooth((len - d) / TAPER) : 1);
      const turn = 2 * Math.PI * (u0 + d) / (coil ? PITCH : WAVELENGTH);
      const across = (coil ? COIL : WAVE) * Math.sin(turn) * fade2;
      const along2 = coil ? 0.6 * COIL * Math.cos(turn) * fade2 : 0;
      samples[i] = here$4[0] + here$4[2] * along2 - here$4[3] * across;
      samples[i + 1] = here$4[1] + here$4[3] * along2 + here$4[2] * across;
    };
    for (let i = 0; i < count2; i++) offset(len * i / (count2 - 1), 2 * i);
    offset(len / 2, 2 * count2);
    const [cx, cy] = [samples[2 * count2], samples[2 * count2 + 1]];
    const angle = Math.atan2(here$4[3], here$4[2]);
    if (coil) {
      if (this.loops.length < 2 * count2) this.loops = new Float64Array(4 * count2);
      this.loops.set(samples.subarray(0, 2 * count2));
      this.looped = count2;
      this.bound(this.loops, count2);
    } else {
      this.spline = false;
      this.n = 0;
      for (let i = 0; i < count2; i++) this.add(samples[2 * i], samples[2 * i + 1]);
      this.measurePolyline();
    }
    [this.cx, this.cy, this.angle] = [cx, cy, angle];
  }
  /** Turns the path into the polyline through the first `count` points of `points`, as x, y pairs: a physics wire's. */
  follow(points, count2) {
    this.spline = false;
    this.n = 0;
    for (let i = 0; i < count2; i++) this.add(points[2 * i], points[2 * i + 1]);
    this.measurePolyline();
    this.centre();
  }
  /**
   * Writes the point at u, from 0 at the start to 1 at the end: the bezier parameter on a spline, the fraction of
   * the length on a polyline. Then the path's direction there, as a unit tangent: x, y, tx, ty.
   */
  at(u, out) {
    if (!this.spline) {
      this.find(u * this.length, out);
      return;
    }
    out[0] = this.bezier(u, 0);
    out[1] = this.bezier(u, 1);
    let tx = this.slope(u, 0);
    let ty = this.slope(u, 1);
    if (Math.abs(tx) + Math.abs(ty) < 1e-9) {
      const i = Math.min(CHORDS - 1, Math.floor(u * CHORDS));
      tx = this.bezier((i + 1) / CHORDS, 0) - this.bezier(i / CHORDS, 0);
      ty = this.bezier((i + 1) / CHORDS, 1) - this.bezier(i / CHORDS, 1);
    }
    const norm = Math.hypot(tx, ty) || 1;
    out[2] = tx / norm;
    out[3] = ty / norm;
  }
  /** Writes the point `d` px along the path, clamped to it, and the path's direction there: x, y, then the unit tangent. */
  find(d, out) {
    const { p, cum } = this;
    const target = Math.min(this.length, Math.max(0, d));
    const i = this.seek(target);
    const span = cum[i + 1] - cum[i];
    const f = span ? (target - cum[i]) / span : 0;
    let tx;
    let ty;
    if (this.spline) {
      const t = (i + f) / CHORDS;
      out[0] = this.bezier(t, 0);
      out[1] = this.bezier(t, 1);
      tx = this.slope(t, 0);
      ty = this.slope(t, 1);
      if (Math.abs(tx) + Math.abs(ty) < 1e-9) {
        tx = this.bezier((i + 1) / CHORDS, 0) - this.bezier(i / CHORDS, 0);
        ty = this.bezier((i + 1) / CHORDS, 1) - this.bezier(i / CHORDS, 1);
      }
    } else {
      out[0] = p[2 * i] + (p[2 * i + 2] - p[2 * i]) * f;
      out[1] = p[2 * i + 1] + (p[2 * i + 3] - p[2 * i + 1]) * f;
      let leg = i;
      while (leg > 0 && cum[leg + 1] === cum[leg]) leg--;
      while (leg < this.n - 2 && cum[leg + 1] === cum[leg]) leg++;
      tx = p[2 * leg + 2] - p[2 * leg];
      ty = p[2 * leg + 3] - p[2 * leg + 1];
    }
    const norm = Math.hypot(tx, ty) || 1;
    out[2] = tx / norm;
    out[3] = ty / norm;
  }
  /** Adds the path, or a coil's loops, to a context's current path or to a Path2D. */
  trace(path2) {
    const [p, n] = this.looped ? [this.loops, this.looped] : [this.p, this.n];
    path2.moveTo(p[0], p[1]);
    if (this.spline && !this.looped) path2.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
    else for (let i = 1; i < n; i++) path2.lineTo(p[2 * i], p[2 * i + 1]);
  }
  /** Strokes the path the way v1's renderers stroked theirs: 0.8 × `thickness` wide. */
  draw(ctx, color, thickness) {
    ctx.beginPath();
    this.trace(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
  /** The path as native keeps it for hit testing. */
  hit() {
    const path2 = new Path2D();
    this.trace(path2);
    return path2;
  }
  /** Makes room for `count` points. */
  points(count2) {
    if (this.p.length < 2 * count2) this.p = new Float64Array(4 * count2);
    this.n = count2;
  }
  point(i, x, y) {
    this.p[2 * i] = x;
    this.p[2 * i + 1] = y;
  }
  /** Appends a polyline point, unless it is where the last one is. */
  add(x, y) {
    const { n } = this;
    if (n && this.p[2 * n - 2] === x && this.p[2 * n - 1] === y) return;
    if (this.p.length < 2 * n + 2) {
      const grown2 = new Float64Array(4 * n + 4);
      grown2.set(this.p);
      this.p = grown2;
    }
    this.n = n + 1;
    this.point(n, x, y);
  }
  /** Appends the corner at (x, y) between a leg from (px, py) and one to (qx, qy), rounded with radius r when the legs are at right angles. */
  corner(x, y, px, py, qx, qy, r) {
    const [ux, uy] = [Math.sign(x - px), Math.sign(y - py)];
    const [vx, vy] = [Math.sign(qx - x), Math.sign(qy - y)];
    if (r <= 0 || ux * vx + uy * vy !== 0 || !(ux || uy) || !(vx || vy)) {
      this.add(x, y);
      return;
    }
    for (let i = 0; i <= 4; i++) {
      const angle = i * Math.PI / 8;
      const back2 = r * (1 - Math.sin(angle));
      const on = r * (1 - Math.cos(angle));
      this.add(x - ux * back2 + vx * on, y - uy * back2 + vy * on);
    }
  }
  /** The spline's polynomial, its length along CHORDS chords and its box; the centre where native puts it (pathRenderer.ts L654-682). */
  measureSpline() {
    const { p, k: k2, cum } = this;
    for (const axis of [0, 1]) {
      const c = 3 * (p[2 + axis] - p[axis]);
      const b = 3 * (p[4 + axis] - p[2 + axis]) - c;
      k2[3 * axis] = p[6 + axis] - p[axis] - c - b;
      k2[3 * axis + 1] = b;
      k2[3 * axis + 2] = c;
    }
    if (cum.length < CHORDS + 1) this.cum = new Float64Array(CHORDS + 1);
    this.cum[0] = 0;
    let [x, y] = [p[0], p[1]];
    for (let i = 1; i <= CHORDS; i++) {
      const nx = this.bezier(i / CHORDS, 0);
      const ny = this.bezier(i / CHORDS, 1);
      this.cum[i] = this.cum[i - 1] + Math.hypot(nx - x, ny - y);
      [x, y] = [nx, ny];
    }
    this.length = this.cum[CHORDS];
    this.bound();
    this.cx = this.bezier(0.5, 0);
    this.cy = this.bezier(0.5, 1);
    this.angle = Math.atan2(this.bezier(0.51, 1) - this.cy, this.bezier(0.51, 0) - this.cx);
  }
  measurePolyline() {
    if (this.n === 1) {
      this.points(2);
      this.point(1, this.p[0], this.p[1]);
    }
    const { p, n } = this;
    if (this.cum.length < n) this.cum = new Float64Array(2 * n);
    const { cum } = this;
    cum[0] = 0;
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
    this.length = cum[n - 1];
    this.bound();
  }
  /** Puts the centre halfway along the path. */
  centre() {
    this.find(this.length / 2, here$4);
    [this.cx, this.cy, this.angle] = [here$4[0], here$4[1], Math.atan2(here$4[3], here$4[2])];
  }
  bound(p = this.p, n = this.n) {
    const { box: box2 } = this;
    box2[0] = box2[2] = p[0];
    box2[1] = box2[3] = p[1];
    for (let i = 1; i < n; i++) {
      box2[0] = Math.min(box2[0], p[2 * i]);
      box2[1] = Math.min(box2[1], p[2 * i + 1]);
      box2[2] = Math.max(box2[2], p[2 * i]);
      box2[3] = Math.max(box2[3], p[2 * i + 1]);
    }
  }
  /** The interval of `cum` that holds a length: the last i with cum[i] <= d, short of the end. */
  seek(d) {
    let lo = 0;
    let hi = (this.spline ? CHORDS : this.n - 1) - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid - 1;
    }
    return Math.max(0, lo);
  }
  /** x (axis 0) or y (axis 1) of the spline at t. */
  bezier(t, axis) {
    const { k: k2 } = this;
    return k2[3 * axis] * t ** 3 + k2[3 * axis + 1] * t ** 2 + k2[3 * axis + 2] * t + this.p[axis];
  }
  slope(t, axis) {
    const { k: k2 } = this;
    return 3 * k2[3 * axis] * t * t + 2 * k2[3 * axis + 1] * t + k2[3 * axis + 2];
  }
}
const PROFILES = {
  rope: { gravity: 1400, damping: 0.88, slack: 1.06, passes: 6, bend: 0.06 },
  whip: { gravity: 1200, damping: 0.95, slack: 1.02, passes: 10, bend: 0.06 },
  gel: { gravity: 300, damping: 0.93, slack: 1.12, passes: 3, bend: 0.03 }
};
const STEP$1 = 1 / 60;
const SUBSTEPS = 4;
const EARLY = 1e-3;
const FEWEST = 12;
const MOST = 16;
const SPAN = 48;
const WAKE = 0.5;
const SLEEPY = 0.5;
const REST_S = 0.3;
const FASTEST = 3e3;
const SETTLING = 0.85;
const SETTLED = 1.5;
const SETTLE_STEPS = 240;
const MISSED = 2;
const PRUNE = 120;
const BETWEEN = 4;
class Wire {
  /** Its points now and a step before, as x, y pairs, and how many. */
  p = new Float64Array(2 * MOST);
  q = new Float64Array(2 * MOST);
  n = 0;
  /** How far the held points are from the ends, the length of each span between them, and the profile's. */
  reach = 0;
  span = 0;
  gravity = 0;
  damping = 0;
  passes = 0;
  bend = 0;
  /** The pass that laid it last; whether it swings, and how long its points have kept still. */
  pass = -Infinity;
  awake = false;
  still = 0;
  /** Where its pinned points were as it came to rest, then its span and gravity then. */
  rested = new Float64Array(10);
}
const wires = /* @__PURE__ */ new Map();
let pass$1 = 0;
let graph;
let workflow;
let held$3 = false;
const laid = [];
let due = 0;
function startWires(shown2, still) {
  pass$1 += shown2 === graph && shown2?.id === workflow ? 1 : MISSED + 2;
  graph = shown2;
  workflow = shown2?.id;
  held$3 = still;
  laid.length = 0;
}
function wireOf(key) {
  let wire2 = wires.get(key);
  if (!wire2) wires.set(key, wire2 = new Wire());
  return wire2.pass === pass$1 ? void 0 : wire2;
}
const forget = (wire2, key) => {
  if (pass$1 - wire2.pass > PRUNE) wires.delete(key);
};
function swinging() {
  let awake = 0;
  for (const wire2 of laid) if (wire2.awake) awake++;
  return live.wires = awake;
}
function endWires() {
  if (swinging()) wake();
  wires.forEach(forget);
}
const here$3 = new Float64Array(4);
function put(p, i, x, y, from = p, j = i) {
  const moved2 = Math.sqrt((x - from[j]) ** 2 + (y - from[j + 1]) ** 2);
  p[i] = x;
  p[i + 1] = y;
  return moved2;
}
function pin(wire2, path2) {
  const { gravity, damping, slack, passes: passes2, bend } = PROFILES[L.physicsProfile];
  const { p, n, rested } = wire2;
  const length = path2.length;
  wire2.gravity = gravity * L.physicsAmount;
  wire2.damping = damping;
  wire2.passes = passes2;
  wire2.bend = bend;
  wire2.reach = length / (n - 1);
  wire2.span = (length * (1 + (slack - 1) * L.physicsAmount) - 2 * wire2.reach) / (n - 3);
  const last2 = 2 * (n - 1);
  const [ax, ay] = path2.a;
  const [bx, by] = path2.b;
  let moved2 = wire2.gravity === rested[9] ? Math.abs(wire2.span - rested[8]) * (n - 3) : Infinity;
  path2.find(0, here$3);
  moved2 = Math.max(moved2, put(p, 0, ax, ay, rested, 0), put(p, 2, ax + here$3[2] * wire2.reach, ay + here$3[3] * wire2.reach, rested, 2));
  path2.find(length, here$3);
  return Math.max(moved2, put(p, last2 - 2, bx - here$3[2] * wire2.reach, by - here$3[3] * wire2.reach, rested, 4), put(p, last2, bx, by, rested, 6));
}
function relax(wire2, back2) {
  const { p, n, span } = wire2;
  for (let k2 = 1; k2 < n - 2; k2++) {
    const j = back2 ? n - 2 - k2 : k2;
    const i = 2 * j;
    const dx2 = p[i + 2] - p[i];
    const dy2 = p[i + 3] - p[i + 1];
    const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (!d) continue;
    const from = j > 1 ? 1 : 0;
    const to = j < n - 3 ? 1 : 0;
    const f = (d - span) / d / (from + to);
    p[i] += dx2 * f * from;
    p[i + 1] += dy2 * f * from;
    p[i + 2] -= dx2 * f * to;
    p[i + 3] -= dy2 * f * to;
  }
}
const bends = new Float64Array(2 * MOST);
function straighten(wire2) {
  const { p, n, bend } = wire2;
  for (let i = 2; i < 2 * n - 2; i++) bends[i] = p[i - 2] - 2 * p[i] + p[i + 2];
  bends[0] = bends[1] = bends[2 * n - 2] = bends[2 * n - 1] = 0;
  for (let i = 4; i < 2 * n - 4; i++) p[i] -= bend * (bends[i - 2] - 2 * bends[i] + bends[i + 2]);
}
function step$1(wire2, damping) {
  const { p, q } = wire2;
  const end2 = 2 * (wire2.n - 2);
  const fall = wire2.gravity * STEP$1 * STEP$1;
  const most = FASTEST * STEP$1;
  for (let i = 4; i < end2; i += 2) {
    let vx = (p[i] - q[i]) * damping;
    let vy = (p[i + 1] - q[i + 1]) * damping + fall;
    const v = Math.sqrt(vx * vx + vy * vy);
    if (v > most) {
      vx *= most / v;
      vy *= most / v;
    }
    q[i] = p[i];
    q[i + 1] = p[i + 1];
    p[i] += vx;
    p[i + 1] += vy;
  }
  straighten(wire2);
  for (let k2 = 0; k2 < wire2.passes; k2++) relax(wire2, k2 % 2 === 1);
  let fastest = 0;
  for (let i = 4; i < end2; i += 2) fastest = Math.max(fastest, (p[i] - q[i]) ** 2 + (p[i + 1] - q[i + 1]) ** 2);
  return Math.sqrt(fastest) / STEP$1;
}
function sleep(wire2) {
  const { p, n, rested } = wire2;
  const last2 = 2 * (n - 1);
  rested.set(p.subarray(0, 4));
  rested.set(p.subarray(last2 - 2, last2 + 2), 4);
  rested[8] = wire2.span;
  rested[9] = wire2.gravity;
  wire2.awake = false;
}
const curve = new Float64Array(2 * ((MOST - 1) * BETWEEN + 1));
function shape(wire2, path2) {
  const { p, n } = wire2;
  let m = 0;
  for (let j = 0; j < n - 1; j++) {
    const a = 2 * Math.max(0, j - 1);
    const b = 2 * j;
    const d = 2 * Math.min(n - 1, j + 2);
    for (let s = 0; s < BETWEEN; s++, m += 2) {
      const t = s / BETWEEN;
      for (let k2 = 0; k2 < 2; k2++) {
        const p0 = p[a + k2];
        const p1 = p[b + k2];
        const p2 = p[b + 2 + k2];
        const p3 = p[d + k2];
        curve[m + k2] = p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
      }
    }
  }
  curve[m] = p[2 * n - 2];
  curve[m + 1] = p[2 * n - 1];
  path2.follow(curve, m / 2 + 1);
}
function rest(wire2, path2) {
  const n = Math.min(MOST, Math.max(FEWEST, Math.ceil(path2.length / SPAN)));
  wire2.n = n;
  pin(wire2, path2);
  const { p, span } = wire2;
  const x = p[2];
  const y = p[3];
  const dx2 = p[2 * n - 4] - x;
  const dy2 = p[2 * n - 3] - y;
  const chord = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  const sag = Math.sqrt(3 * chord * Math.max(0, span * (n - 3) - chord) / 8);
  for (let j = 2; j < n - 2; j++) {
    const u = (j - 1) / (n - 3);
    put(p, 2 * j, x + dx2 * u, y + dy2 * u + 4 * sag * u * (1 - u));
  }
  wire2.q.set(p);
  for (let i = 0; i < SETTLE_STEPS && step$1(wire2, SETTLING) >= SETTLED; i++) ;
  wire2.q.set(p);
  sleep(wire2);
  shape(wire2, path2);
}
function hang(wire2, path2) {
  const fresh = pass$1 - wire2.pass > MISSED + 1;
  wire2.pass = pass$1;
  laid.push(wire2);
  if (fresh) return rest(wire2, path2);
  const moved2 = pin(wire2, path2) > WAKE;
  if (held$3 && (moved2 || wire2.awake)) return rest(wire2, path2);
  if (moved2 && !wire2.awake) {
    wire2.awake = true;
    wire2.still = 0;
  }
  shape(wire2, path2);
}
function stepWires(dt) {
  due = Math.min(due + dt, SUBSTEPS * STEP$1);
  for (; due >= STEP$1 - EARLY; due -= STEP$1) {
    for (const wire2 of laid) {
      if (!wire2.awake) continue;
      wire2.still = step$1(wire2, wire2.damping) < SLEEPY ? wire2.still + STEP$1 : 0;
      if (wire2.still >= REST_S) sleep(wire2);
    }
  }
  swinging();
}
const here$2 = new Float64Array(4);
function elements(s, count2, last2, each) {
  for (let i = 0; i < count2 + (last2 ? 1 : 0); i++) {
    const T = i / count2;
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$2);
    each(T, i);
  }
}
function sacredFlow(ctx, s, phase) {
  const { thickness, glowIntensity } = L;
  const { primary, accent: accent2 } = s.pal;
  const hidden = s.linkStyle === "hidden";
  elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), true, (T) => {
    ctx.beginPath();
    ctx.arc(
      here$2[0] + Math.sin(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
      here$2[1] + Math.cos(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
      thickness * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = accent2;
    ctx.shadowColor = hidden ? accent2 : primary;
    ctx.shadowBlur = hidden ? glowIntensity * 0.7 : glowIntensity;
    ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
    ctx.fill();
  });
}
function crystalStream(ctx, s, phase) {
  const { thickness } = L;
  const { primary, secondary } = s.pal;
  elements(s, Math.max(1, Math.floor(SACRED.HARMONY * L.quality)), false, (T) => {
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 1;
    createCrystal(ctx, here$2[0], here$2[1], thickness * 3 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.2), T * Math.PI * 2 + phase * 0.2, primary, secondary, L.glowIntensity);
  });
}
function quantumField(ctx, s, phase) {
  const { primary, secondary } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let f = 0; f < SACRED.QUANTUM; f++) {
    const fieldPhase = phase + f * Math.PI * 2 / SACRED.QUANTUM;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$2);
      const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
      const x = here$2[0] + uncertainty * Math.cos(fieldPhase);
      const y = here$2[1] + uncertainty * Math.sin(fieldPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = f % 2 === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = L.thickness * 0.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
  }
}
function cosmicWeave(ctx, s, phase) {
  const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
  const dir = L.direction;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let strand = 0; strand < SACRED.TRINITY; strand++) {
    const strandPhase = phase + strand * Math.PI * 2 / SACRED.TRINITY;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$2);
      const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase * dir) * 10;
      const x = here$2[0] + weave * Math.cos(strandPhase);
      const y = here$2[1] + weave * Math.sin(strandPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = colors[strand];
    ctx.lineWidth = L.thickness * 0.7;
    ctx.shadowColor = colors[strand];
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
  }
}
function energyPulse(ctx, s, phase) {
  const { secondary } = s.pal;
  elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), false, (T) => {
    ctx.beginPath();
    ctx.arc(here$2[0], here$2[1], L.thickness * 2 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = secondary;
    ctx.shadowColor = secondary;
    ctx.shadowBlur = L.glowIntensity * 2;
    ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
    ctx.fill();
  });
}
function dnaHelix(ctx, s, phase) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness, glowIntensity } = L;
  const radius = 10;
  const rotations = 4;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
  for (let strand = 0; strand < 2; strand++) {
    const side = strand === 0 ? 1 : -1;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$2);
      const angle = T * Math.PI * rotations * 2 + phase;
      const x = here$2[0] + Math.cos(angle) * radius * side;
      const y = here$2[1] + Math.sin(angle) * radius * side;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = strand === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  elements(s, rotations * 4, true, (T) => {
    const angle = T * Math.PI * rotations * 2 + phase;
    ctx.strokeStyle = accent2;
    ctx.shadowColor = accent2;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(here$2[0] + Math.cos(angle) * radius, here$2[1] + Math.sin(angle) * radius);
    ctx.lineTo(here$2[0] - Math.cos(angle) * radius, here$2[1] - Math.sin(angle) * radius);
    ctx.stroke();
  });
}
function lavaFlow(ctx, s, phase) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
  ctx.beginPath();
  for (let j = 0; j < m; j++) {
    const T = ts[j];
    s.path.at(s.local(T), here$2);
    const across = Math.sin(T * Math.PI * 3 + phase * 1.2) * (15 * 0.7) * Math.sin(phase * 0.6 + T * Math.PI * 2);
    const x = here$2[0] - here$2[3] * across;
    const y = here$2[1] + here$2[2] * across;
    if (j) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  const gradient = linkGradient(ctx, s, 1);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondary);
  gradient.addColorStop(1, accent2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = L.thickness * 5;
  ctx.lineCap = "round";
  ctx.shadowColor = secondary;
  ctx.shadowBlur = L.glowIntensity * 1.5;
  ctx.stroke();
}
function stellarPlasma(ctx, s, phase) {
  const { primary, secondary, accent: accent2 } = s.pal;
  const { thickness, glowIntensity, quality: quality2 } = L;
  const segments2 = Math.max(5, Math.floor(Math.min(Math.floor(s.chain / 30), 20) * quality2 * 0.5));
  elements(s, segments2, true, (T, i) => {
    const wave2 = Math.sin(T * Math.PI * 2 + phase * 0.5) * 8;
    const size = thickness * (0.8 + Math.sin(phase + T * Math.PI) * 0.2);
    const color = T < 0.5 ? primary : secondary;
    ctx.beginPath();
    ctx.arc(here$2[0], here$2[1] + wave2, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    if (i % 3 !== 0 || quality2 <= 1) return;
    ctx.beginPath();
    ctx.arc(here$2[0], here$2[1] + wave2 * 1.2, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = accent2;
    ctx.shadowColor = accent2;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.globalAlpha = 0.4;
    ctx.fill();
  });
}
const held$2 = { linkPhase: 0, quantumPhase: 0, linkFlow: 0, linkDir: 1 };
const posed = (animate) => (ctx, s, phase) => {
  held$2.linkPhase = held$2.quantumPhase = phase;
  held$2.linkDir = L.direction;
  MOVING[animate](ctx, s, held$2);
};
const STILL = {
  1: sacredFlow,
  2: crystalStream,
  3: quantumField,
  4: cosmicWeave,
  5: energyPulse,
  6: dnaHelix,
  7: lavaFlow,
  8: stellarPlasma,
  10: posed(10),
  11: posed(11),
  12: posed(12)
};
const LINK_STYLES = {
  spline: {},
  straight: { mode: LINEAR_LINK },
  linear: { mode: STRAIGHT_LINK },
  hidden: {},
  dotted: { moving: true },
  dashed: { moving: true },
  double: {},
  stepped: { shape: "step" },
  zigzag: { shape: "wave" },
  coil: { shape: "coil" },
  rope: {},
  glowpath: {},
  chain: {},
  pulse: {},
  holographic: {}
};
const MARCH = 12;
const TWIST = 3;
const TWIST_LENGTH = 30;
const WHITE = "rgba(255, 255, 255, 0.3)";
const SHADOW = "rgba(0, 0, 0, 0.95)";
const dash = [0, 0];
const solid = [];
const here$1 = new Float64Array(4);
function dashes(ctx, s, color, thickness, on, off, march) {
  dash[0] = on;
  dash[1] = off;
  ctx.setLineDash(dash);
  ctx.lineDashOffset = s.u0 - (march ? clock.linkFlow * MARCH : 0);
  s.path.draw(ctx, color, thickness);
  ctx.setLineDash(solid);
  ctx.lineDashOffset = 0;
}
function every(s, gap, each) {
  const { path: path2 } = s;
  for (let d = Math.ceil(s.u0 / gap) * gap - s.u0; d < path2.length; d += gap) {
    path2.find(d, here$1);
    each();
  }
}
function beside(ctx, s, step2, across) {
  const { path: path2 } = s;
  const count2 = Math.max(2, Math.ceil(path2.length / step2) + 1);
  ctx.beginPath();
  for (let i = 0; i < count2; i++) {
    const d = path2.length * i / (count2 - 1);
    path2.find(d, here$1);
    const off = across(s.u0 + d);
    const x = here$1[0] - here$1[3] * off;
    const y = here$1[1] + here$1[2] * off;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
}
function drawBody(ctx, s, color, thickness) {
  const { path: path2 } = s;
  const alpha = ctx.globalAlpha;
  switch (s.linkStyle) {
    case "dotted":
      ctx.lineCap = "round";
      dashes(ctx, s, color, thickness, 0, thickness * 3, !s.isStatic);
      return;
    case "dashed":
      dashes(ctx, s, color, thickness, thickness * 4, thickness * 2, !s.isStatic);
      return;
    case "double":
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 0.4;
      for (const side of [1, -1]) {
        beside(ctx, s, 6, () => side * thickness * 0.8);
        ctx.stroke();
      }
      return;
    case "rope": {
      const twist = (D) => TWIST * Math.sin(2 * Math.PI * D / TWIST_LENGTH);
      beside(ctx, s, 3, twist);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 1.2;
      ctx.lineCap = "round";
      ctx.stroke();
      beside(ctx, s, 3, twist);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = thickness * 0.4;
      ctx.stroke();
      return;
    }
    case "glowpath": {
      path2.draw(ctx, color, thickness);
      const glow2 = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
      glow2.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      glow2.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      glow2.addColorStop(1, "rgba(255, 255, 255, 0.5)");
      ctx.beginPath();
      path2.trace(ctx);
      ctx.strokeStyle = glow2;
      ctx.lineWidth = thickness * 2;
      ctx.globalAlpha = alpha * 0.5;
      ctx.stroke();
      ctx.globalAlpha = alpha;
      return;
    }
    case "chain":
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 0.4;
      every(s, thickness * 4, () => {
        ctx.beginPath();
        ctx.ellipse(here$1[0], here$1[1], thickness * 2, thickness * 1.2, Math.atan2(here$1[3], here$1[2]), 0, Math.PI * 2);
        ctx.stroke();
      });
      return;
    case "pulse":
      dashes(ctx, s, color, thickness, thickness * 4, thickness * 4, false);
      ctx.globalAlpha = alpha * 0.3;
      every(s, thickness * 8, () => {
        const blob = ctx.createRadialGradient(here$1[0], here$1[1], 0, here$1[0], here$1[1], thickness * 3);
        blob.addColorStop(0, color);
        blob.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.beginPath();
        ctx.arc(here$1[0], here$1[1], thickness * 3, 0, Math.PI * 2);
        ctx.fillStyle = blob;
        ctx.fill();
      });
      ctx.globalAlpha = alpha;
      return;
    case "holographic": {
      const sheen = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
      sheen.addColorStop(0, color);
      sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
      sheen.addColorStop(1, color);
      ctx.beginPath();
      path2.trace(ctx);
      ctx.strokeStyle = sheen;
      ctx.lineWidth = thickness * 1.2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      every(s, thickness * 2, () => {
        ctx.beginPath();
        ctx.moveTo(here$1[0] - here$1[3] * thickness, here$1[1] + here$1[2] * thickness);
        ctx.lineTo(here$1[0] + here$1[3] * thickness, here$1[1] - here$1[2] * thickness);
        ctx.stroke();
      });
      return;
    }
    default:
      path2.draw(ctx, color, thickness);
  }
}
const BASES = {
  1: ["none", "glow"],
  2: ["ghost", "glow"],
  3: ["ghost", "ghost"],
  4: ["none", "none"],
  5: ["ghost", "ghost"],
  6: ["none", "none"],
  7: ["none", "none"],
  8: ["none", "ghost"],
  9: ["classic", "classic"],
  10: ["ghost", "ghost"],
  11: ["none", "none"],
  12: ["ghost", "ghost"]
};
const shadowBlur = (blur) => L.shadowStyle === "drop" ? L.shadowBlur * 4 : blur;
const shadowOffset = () => L.shadowStyle === "drop" ? L.shadowOffset * 3 : 0;
function drawBase(ctx, s, animate, still, plain = false) {
  const base = BASES[animate]?.[still ? 1 : 0];
  if (!base || base === "none" || s.linkStyle === "hidden") return false;
  const thickness = L.thickness * s.width;
  const color = s.pal.primary;
  ctx.globalAlpha = 1;
  if (base === "classic" && L.linkShadowEnabled && !plain) {
    ctx.shadowColor = SHADOW;
    ctx.shadowBlur = shadowBlur(L.glowIntensity);
    ctx.shadowOffsetX = ctx.shadowOffsetY = shadowOffset();
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = thickness * 1.2;
    drawBody(ctx, s, SHADOW, thickness * 1.2);
  }
  ctx.shadowColor = color;
  ctx.shadowBlur = plain ? 0 : L.glowIntensity;
  ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = base === "glow" ? thickness * 1.5 : thickness;
  if (base === "ghost") ctx.globalAlpha = 0.3;
  drawBody(ctx, s, color, thickness);
  ctx.globalAlpha = 1;
  return true;
}
const MARKERS = {
  diamond: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    }
  },
  circle: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.closePath();
    }
  },
  arrow: {
    path(ctx, x, y, size, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size, size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.lineTo(-size, -size);
      ctx.closePath();
      ctx.restore();
    },
    turn: Math.PI * 2,
    reach: Math.SQRT2
  },
  square: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.rect(x - size, y - size, size * 2, size * 2);
      ctx.closePath();
    }
  },
  triangle: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
    }
  },
  star: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size : size * 0.4;
        const a = i * Math.PI / 5;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
    }
  },
  heart: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size * 0.7, size * 0.7);
      ctx.moveTo(0, 0.4);
      ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
      ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
      ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
      ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
      ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
      ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);
      ctx.restore();
      ctx.closePath();
    },
    // Its point is 2 × 0.7 sizes down.
    reach: 1.4
  },
  cross: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.closePath();
    },
    stroked: true,
    width: 0.3
  },
  hexagon: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        if (i) ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
        else ctx.moveTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
      }
      ctx.closePath();
    }
  },
  flower: {
    path(ctx, x, y, size) {
      const inner = size * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI * 2 / 6;
        const next = (i + 1) * Math.PI * 2 / 6;
        const mid = (a + next) / 2;
        if (i) ctx.lineTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
        else ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
        ctx.quadraticCurveTo(x + Math.cos(mid) * size * 1.5, y + Math.sin(mid) * size * 1.5, x + Math.cos(next) * inner, y + Math.sin(next) * inner);
      }
      ctx.closePath();
      ctx.moveTo(x + inner, y);
      ctx.arc(x, y, inner, 0, Math.PI * 2);
    }
  },
  spiral: {
    // Three turns out from the centre: an open line, which filling would close into a blob.
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const [r, a] = [size * t, t * 3 * Math.PI * 2];
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
    },
    stroked: true,
    width: 0.2
  },
  merkaba: { ...MERKABA, width: 0.15 }
};
function mark(ctx, shape2, x, y, size, angle, color, glow2, blur, offset = 0) {
  shape2.path(ctx, x, y, size, angle);
  if (shape2.stroked) {
    ctx.lineWidth = size * shape2.width;
    ctx.lineCap = "round";
  }
  shine(ctx, shape2, x, y, size, angle, color, glow2, blur, offset);
}
function drawMarkers(ctx, s, phase, flow) {
  const shape2 = MARKERS[L.markerShape];
  if (!L.markerEnabled || !shape2) return;
  const size = 3 * L.markerSize;
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.markerSize * L.particleDensity * moving.density * 0.5));
  const { pal } = s;
  for (let i = 0; i < count2; i++) {
    const T = flow === void 0 ? i / count2 : wrap(i / count2 + flow * 0.1);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$1);
    const angle = L.markerShape === "arrow" ? Math.atan2(here$1[3], here$1[2]) + (L.direction < 0 ? Math.PI : 0) : L.markerShape === "merkaba" ? phase : 0;
    let color = pal.marker;
    let alpha = 1;
    if (L.markerEffects === "pulse") alpha = 0.5 + Math.sin(phase + T * Math.PI * 2) * 0.5;
    else if (L.markerEffects === "fade") alpha = 1 - T;
    else if (L.markerEffects === "rainbow") color = rainbow(T * 360 + phase * 50);
    ctx.globalAlpha = alpha * moving.alpha;
    if (L.markerShadowEnabled) mark(ctx, shape2, here$1[0], here$1[1], size * 1.2, angle, SHADOW, SHADOW, shadowBlur(L.markerGlow * moving.glow), shadowOffset());
    mark(ctx, shape2, here$1[0], here$1[1], size, angle, color, L.markerEffects === "rainbow" ? pal.primary : color, L.markerGlow * moving.glow);
  }
}
const ARROW = 2;
function centreMarker(canvas, ctx, s, fill2 = s.pal.native) {
  const shape2 = canvas.linkMarkerShape;
  if (!shape2 || canvas.ds.scale < 0.6 || !canvas.highquality_render) return;
  const { cx, cy, angle } = s.path;
  ctx.beginPath();
  if (shape2 === ARROW) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.moveTo(cx - 3.2 * cos + 5 * sin, cy - 3.2 * sin - 5 * cos);
    ctx.lineTo(cx + 7 * cos, cy + 7 * sin);
    ctx.lineTo(cx - 3.2 * cos - 5 * sin, cy - 3.2 * sin + 5 * cos);
  } else {
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  }
  ctx.fillStyle = fill2;
  ctx.fill();
}
const LINKS = "Link animation";
const LOD_SCALE = 0.25;
const REACH = 120;
const CLASSIC$1 = 9;
const NATIVE = "spline";
class Segment {
  path = new LinkPath();
  /** The link native drew the segment for. */
  link;
  /** Whether its path is not the one native drew for it, so the hit data must follow ours. */
  custom = false;
  /** The colours it is drawn in, and the colour native draws its link in, but for the white of a highlighted one. */
  pal = HIGHLIGHT;
  colour = "";
  linkStyle = "";
  isStatic = false;
  /** Whether selection focus holds it, and how much wider than Thickness its base is drawn. */
  focused = false;
  width = 1;
  /** The run's step of the node its link leads into, while the run's visuals show. */
  flow;
  /** Whether the pass before did not record it: it came on screen since, as native skips the links off it; and the pass that recorded it last. */
  fresh = false;
  pass = 0;
  /**
   * px along the link to the segment's start, the segment's own length and the link's whole length, along the
   * segments native drew for it: the paths Link.Style takes, before a wave or a coil winds around them.
   */
  u0 = 0;
  len = 0;
  chain = 0;
  /** The fractions of the link where the segment starts and ends. */
  t0 = 0;
  t1 = 1;
  /** Whether the segment is a point on a longer link, where two reroutes, or a reroute and a slot, are on one spot: nothing of the link is on it. */
  get empty() {
    return this.t0 === this.t1;
  }
  get start() {
    return this.path.a;
  }
  get end() {
    return this.path.b;
  }
  /** The segment's own parameter, which its path takes for a point, at fraction T of the whole link: in [0, 1] where T falls on this segment. */
  local(T) {
    return (T - this.t0) / (this.t1 - this.t0);
  }
  /** Whether the segment draws what is at its own parameter u: what its start holds, up to its end, which only the link's last segment draws. */
  within(u) {
    return u >= 0 && (u < 1 || u === 1 && this.t1 === 1);
  }
  /**
   * Lays the segment from a to b on the path `linkStyle` gives it, Link.Style's unless given, the render mode's `mode`
   * where that keeps native's: `u0` px along its link, from a slot if `fromSlot` and to one if `toSlot`, where a wave
   * or a coil starts and ends. A `wire` hangs from native's path instead, whatever the shape, and the path follows it.
   */
  lay(a, b, startDir, endDir, mode, u0 = 0, fromSlot = true, toSlot = true, startControl, endControl, linkStyle = L.linkStyle, wire2) {
    const style = LINK_STYLES[wire2 ? NATIVE : linkStyle];
    this.u0 = u0;
    this.path.set(a, b, startDir, endDir, style.mode ?? mode, startControl, endControl);
    if (wire2) hang(wire2, this.path);
    if (style.shape === "step") this.path.step(endDir);
    this.len = this.path.length;
    if (style.shape === "wave" || style.shape === "coil") this.path.bend(style.shape === "coil", u0, fromSlot, toSlot);
    this.custom = Boolean(wire2 || style.shape) || (style.mode ?? mode) !== mode;
    this.linkStyle = linkStyle;
  }
}
const segments = /* @__PURE__ */ new WeakMap();
let pool = [];
let before$1 = [];
let count = 0;
let counted = 0;
let first = 0;
let open = false;
const ends = /* @__PURE__ */ new Map();
let passes = 0;
const shown$1 = [];
const raised = [];
const flowing = [];
const pass = {
  ctx: void 0,
  on: false,
  still: false,
  wires: false,
  plain: false,
  layered: false,
  kept: false,
  changed: false,
  calls: 0,
  bases: 0,
  highlighted: {},
  focus: "",
  tinted: false,
  runs: false
};
let crowded = false;
let original;
const BUSY = 12;
const SETTLE_MS = 150;
const glows = { bases: 0, due: false, scale: 0, x: 0, y: 0, timer: 0 };
function settle() {
  glows.due = true;
  app.canvas.setDirty(true, true);
}
const layer = {
  ctx: void 0,
  at: void 0,
  scale: 0,
  x0: 0,
  y0: 0,
  e: 0,
  f: 0,
  x: 0,
  y: 0,
  graph: void 0,
  version: 0,
  revision: 0,
  highlighted: void 0,
  background: "",
  pass: 0
};
const strips = [new Float64Array(4), new Float64Array(4)];
let stripCount = 0;
function paintWhole(canvas, ctx) {
  const { width, height } = ctx.canvas;
  if (!layer.ctx || layer.ctx.canvas.width !== width || layer.ctx.canvas.height !== height) {
    layer.ctx = offscreen(width, height).getContext("2d", { willReadFrequently: true });
  }
  const { ds, graph: graph2 } = canvas;
  const at = ctx.getTransform();
  const own2 = layer.ctx;
  own2.setTransform(1, 0, 0, 1, 0, 0);
  own2.clearRect(0, 0, width, height);
  own2.setTransform(at);
  own2.globalAlpha = canvas.editor_alpha;
  Object.assign(layer, {
    at,
    scale: ds.scale,
    x0: ds.offset[0],
    y0: ds.offset[1],
    e: at.e,
    f: at.f,
    x: ds.offset[0],
    y: ds.offset[1],
    graph: graph2,
    version: graph2?._version,
    revision,
    highlighted: canvas.highlighted_links,
    background: canvas.clear_background_color
  });
}
function shows$1(canvas, ctx, refocused) {
  const own2 = layer.ctx;
  return own2 !== void 0 && layer.pass === passes - 1 && own2.canvas.width === ctx.canvas.width && own2.canvas.height === ctx.canvas.height && canvas.ds.scale === layer.scale && !canvas.isDragging && !live.wires && !refocused && layer.graph === canvas.graph && layer.version === canvas.graph?._version && layer.revision === revision && layer.highlighted === canvas.highlighted_links && layer.background === canvas.clear_background_color;
}
function pan$1(canvas, ctx, refocused) {
  if (!shows$1(canvas, ctx, refocused)) return false;
  const own2 = layer.ctx;
  const at = layer.at;
  const { width, height } = ctx.canvas;
  const { offset } = canvas.ds;
  const dx2 = at.a * (offset[0] - layer.x);
  const dy2 = at.d * (offset[1] - layer.y);
  const x = Math.round(dx2);
  const y = Math.round(dy2);
  if (Math.abs(dx2 - x) > 0.01 || Math.abs(dy2 - y) > 0.01 || Math.abs(x) >= width || Math.abs(y) >= height) return false;
  if (!x && !y) return pass.kept = true;
  own2.setTransform(1, 0, 0, 1, 0, 0);
  own2.globalCompositeOperation = "copy";
  own2.drawImage(own2.canvas, x, y);
  own2.globalCompositeOperation = "source-over";
  stripCount = 0;
  if (x) strip(x > 0 ? 0 : width + x, 0, x > 0 ? x : width, height);
  if (y) strip(x > 0 ? x : 0, y > 0 ? 0 : height + y, x < 0 ? width + x : width, y > 0 ? y : height);
  layer.x = offset[0];
  layer.y = offset[1];
  layer.e = at.e + at.a * (offset[0] - layer.x0);
  layer.f = at.f + at.d * (offset[1] - layer.y0);
  own2.setTransform(at.a, 0, 0, at.d, layer.e, layer.f);
  return true;
}
function strip(x0, y0, x1, y1) {
  const s = strips[stripCount++];
  s[0] = x0;
  s[1] = y0;
  s[2] = x1;
  s[3] = y1;
}
function reaches(s, within) {
  const { box: box2 } = s.path;
  const { a, d } = layer.at;
  const { e, f } = layer;
  return box2[2] + REACH >= (within[0] - e) / a && box2[0] - REACH <= (within[2] - e) / a && box2[3] + REACH >= (within[1] - f) / d && box2[1] - REACH <= (within[3] - f) / d;
}
function clipTo(ctx, within) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(within[0], within[1], within[2] - within[0], within[3] - within[1]);
  ctx.clip();
  ctx.setTransform(layer.at.a, 0, 0, layer.at.d, layer.e, layer.f);
}
function repaint$1(canvas) {
  const own2 = layer.ctx;
  own2.setTransform(1, 0, 0, 1, 0, 0);
  own2.clearRect(0, 0, own2.canvas.width, own2.canvas.height);
  own2.setTransform(layer.at.a, 0, 0, layer.at.d, layer.e, layer.f);
  pass.kept = false;
  for (let i = 0; i < count; i++) if (!LINK_STYLES[pool[i].linkStyle].moving) draw(canvas, own2, pool[i], false);
}
const mended = new Float64Array(4);
function mend(canvas, gone) {
  const own2 = layer.ctx;
  const { a, d } = layer.at;
  const { box: box2 } = gone.path;
  mended[0] = Math.max(0, Math.floor((box2[0] - REACH) * a + layer.e));
  mended[1] = Math.max(0, Math.floor((box2[1] - REACH) * d + layer.f));
  mended[2] = Math.min(own2.canvas.width, Math.ceil((box2[2] + REACH) * a + layer.e));
  mended[3] = Math.min(own2.canvas.height, Math.ceil((box2[3] + REACH) * d + layer.f));
  if (mended[0] >= mended[2] || mended[1] >= mended[3]) return;
  own2.setTransform(1, 0, 0, 1, 0, 0);
  own2.clearRect(mended[0], mended[1], mended[2] - mended[0], mended[3] - mended[1]);
  for (let i = 0; i < count; i++) if (reaches(pool[i], mended)) draw(canvas, own2, pool[i], false, mended);
}
const held$1 = new Float64Array(7);
function hold(s) {
  held$1.set(s.path.box);
  held$1[4] = s.path.length;
  held$1[5] = s.u0;
  held$1[6] = s.width;
}
const holds = (s) => {
  const { box: box2, length } = s.path;
  return held$1[0] === box2[0] && held$1[1] === box2[1] && held$1[2] === box2[2] && held$1[3] === box2[3] && held$1[4] === length && held$1[5] === s.u0 && held$1[6] === s.width;
};
function blit(canvas, ctx) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = "transparent";
  ctx.drawImage(layer.ctx.canvas, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = canvas.editor_alpha;
  drawReroutes(canvas, ctx, false);
  ctx.restore();
}
let warned = false;
let foreign = false;
let told = false;
const deferring = () => L.coexist === "defer" || L.coexist === "auto" && foreign;
const drawsRuns = (canvas) => L.enabled && !defers() && canvas.ds.scale >= LOD_SCALE;
function defers() {
  if (!deferring()) return false;
  if (L.coexist === "auto" && !told) {
    told = true;
    app.extensionManager.toast.add({
      severity: "info",
      summary: "Link effects left to another extension",
      detail: "Another extension draws links, so Enhanced link effects step aside. Node effects keep working. To keep Enhanced link effects, change Other link extensions in the settings.",
      life: 1e4
    });
  }
  return true;
}
const LINK_COLOR$1 = "#9A9";
const STUB = 8;
const [LEFT$1, RIGHT$1] = [3, 4];
let unhit;
const unseen = [];
const nothing = () => {
};
function enableAntiAliasing(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.miterLimit = 2;
}
function moves() {
  return L.animate !== 0 && (L.animate !== CLASSIC$1 || L.markerEnabled && L.markerShape !== "none" || Boolean(LINK_STYLES[L.linkStyle].moving));
}
function focusIn() {
  const mode = L.focusEnabled ? L.focusMode : "";
  if (!focusing()) return pass.on && mode === "animate" ? mode : "";
  if (deferring()) return mode === "dim" || mode === "hide" ? mode : "";
  return !pass.on && mode === "animate" ? "highlight" : mode;
}
function begin(canvas, ctx) {
  passes++;
  const last2 = before$1;
  before$1 = pool;
  pool = last2;
  counted = count;
  count = 0;
  open = false;
  ends.clear();
  raised.length = flowing.length = 0;
  pass.ctx = ctx;
  pass.calls = pass.bases = 0;
  pass.on = L.enabled && (L.animate !== 0 || wired()) && !defers() && !guard.off(LINKS) && canvas.ds.scale >= LOD_SCALE;
  const held2 = L.staticMode || env.reducedMotion || crowded || adaptive.level >= HELD;
  pass.still = !pass.on || held2 || heldByRun(L.pauseDuringRender) || !moves();
  pass.wires = pass.on && wired();
  startWires(canvas.graph, held2);
  pass.highlighted = canvas.highlighted_links;
  syncRuns(canvas);
  pass.runs = flowsShown() && drawsRuns(canvas);
  const refocused = syncFocus(canvas);
  pass.focus = focusIn();
  pass.tinted = (pass.focus === "highlight" || pass.focus === "dim" || pass.focus === "hide") && !deferring();
  const { scale: scale2, offset } = canvas.ds;
  const moving2 = scale2 !== glows.scale || offset[0] !== glows.x || offset[1] !== glows.y || canvas.isDragging || live.wires > 0;
  glows.scale = scale2;
  glows.x = offset[0];
  glows.y = offset[1];
  pass.plain = pass.on && adaptive.level >= PLAIN;
  const glowing = L.glowIntensity > 0 || L.animate === CLASSIC$1 && L.linkShadowEnabled;
  const busy = pass.on && glowing && glows.bases > BUSY;
  if (!busy || pass.plain || pass.still) layer.ctx = void 0;
  const layered = busy && !pass.plain && !pass.still && ctx === canvas.bgctx;
  stripCount = 0;
  pass.kept = pass.changed = false;
  if (busy && moving2 && !glows.due) {
    pass.layered = layered && pan$1(canvas, ctx, refocused);
    pass.plain ||= !pass.layered;
    clearTimeout(glows.timer);
    glows.timer = window.setTimeout(settle, SETTLE_MS);
  } else {
    pass.layered = layered;
    pass.kept = layered && !moving2 && !glows.due && layer.x === offset[0] && layer.y === offset[1] && shows$1(canvas, ctx, refocused);
    if (layered && !pass.kept) paintWhole(canvas, ctx);
  }
  glows.due = false;
}
function end(canvas) {
  const ctx = pass.ctx;
  pass.ctx = void 0;
  if (open) close$1();
  endWires();
  if (pass.changed) repaint$1(canvas);
  else if (pass.kept || stripCount) {
    for (let i = 0; i < counted; i++) if (before$1[i].pass !== passes) mend(canvas, before$1[i]);
  }
  if (!pass.plain && !stripCount && !pass.kept) glows.bases = pass.bases;
  if (count && !pass.still) {
    live.links = count;
    wake();
  }
  if (flowing.length) {
    live.flows = flowing.length;
    wake();
  }
  for (const reroute of unseen) {
    delete reroute.draw;
    delete reroute.drawSlots;
    canvas._visibleReroutes.delete(reroute);
  }
  unseen.length = 0;
  if (pass.layered) {
    layer.pass = passes;
    blit(canvas, ctx);
  }
  const crowd = L.perfStaticAbove > 0 && cull(canvas, all) > L.perfStaticAbove;
  if (crowd !== crowded) {
    crowded = crowd;
    canvas.setDirty(true, true);
  }
  if (pass.calls || warned) return;
  for (const segment2 of canvas.renderedPaths) {
    if (segment2._dragging) continue;
    warned = true;
    console.warn("[Enhanced Links & Nodes] Another extension draws links without calling renderLink, so links are not animated.");
    return;
  }
}
function close$1() {
  const last2 = pool[count - 1];
  const chain2 = last2.u0 + last2.len;
  for (let i = first; i < count; i++) {
    const s = pool[i];
    s.chain = chain2;
    s.t0 = s.len === chain2 ? 0 : s.u0 / chain2;
    s.t1 = s.len === chain2 ? 1 : (s.u0 + s.len) / chain2;
  }
  open = false;
}
const own = (canvas, link2, color) => palette(color) ?? palette(LGraphCanvas.link_type_colors[String(link2.type)]) ?? palette(canvas.default_link_color) ?? palette(LINK_COLOR$1);
const keyOf = (link2, extras) => extras?.reroute ? 3 * extras.reroute.id + 1 : 3 * link2.id + (extras?.disabled ? 2 : 0);
function record(canvas, link2, a, b, color, startDir, endDir, extras, focused, flow) {
  if (open && pool[count - 1].link !== link2) close$1();
  if (!open) first = count;
  const reroute = extras?.reroute;
  let segment2 = segments.get(reroute ?? link2);
  if (!segment2) segments.set(reroute ?? link2, segment2 = new Segment());
  pool[count++] = segment2;
  segment2.fresh = segment2.pass !== passes - 1;
  segment2.pass = passes;
  const compared = pass.kept || stripCount > 0;
  const heldPal = segment2.pal;
  const heldStyle = segment2.linkStyle;
  if (compared) hold(segment2);
  const from = canvas.graph?.getReroute((reroute ?? link2).parentId);
  segment2.link = link2;
  segment2.lay(
    a,
    b,
    startDir,
    endDir,
    canvas.links_render_mode,
    from && ends.get(from) || 0,
    !from,
    !reroute,
    extras?.startControl,
    extras?.endControl,
    pass.on ? L.linkStyle : NATIVE,
    pass.wires ? wireOf(keyOf(link2, extras)) : void 0
  );
  if (reroute) ends.set(reroute, segment2.u0 + segment2.len);
  open = Boolean(reroute);
  if (!open) close$1();
  const colours = own(canvas, link2, color);
  segment2.pal = focused && pass.tinted ? focusPalette(colours.native) : pass.highlighted[link2.id] ? HIGHLIGHT : colours;
  segment2.colour = colours.native;
  segment2.focused = focused;
  segment2.width = focused && pass.focus === "highlight" ? 1.5 : 1;
  segment2.isStatic = pass.still;
  segment2.flow = flow;
  if (flow) flowing.push(segment2);
  if (compared) pass.changed ||= segment2.fresh ? pass.kept : heldPal !== segment2.pal || heldStyle !== segment2.linkStyle || !holds(segment2);
  return segment2;
}
const marked$1 = () => L.animate === CLASSIC$1 || L.markerAll && L.animate !== 0;
function place(canvas, ctx, segment2) {
  if (!pass.still && LINK_STYLES[segment2.linkStyle].moving) return true;
  const whole = pass.still && !open;
  if (!pass.layered) return draw(canvas, ctx, segment2, whole);
  if (pass.kept) return true;
  if (!stripCount || segment2.fresh) return draw(canvas, layer.ctx, segment2, false);
  for (let i = 0; i < stripCount; i++) if (reaches(segment2, strips[i]) && !draw(canvas, layer.ctx, segment2, false, strips[i])) return false;
  return true;
}
function draw(canvas, ctx, segment2, whole, within) {
  ctx.save();
  try {
    if (within) clipTo(ctx, within);
    enableAntiAliasing(ctx);
    if (body$1(canvas, ctx, segment2, pass.still, pass.plain)) pass.bases++;
    for (let i = first; whole && i < count; i++) {
      if (pool[i].empty) continue;
      STILL[L.animate]?.(ctx, pool[i], STILL_PHASE);
      if (marked$1()) drawMarkers(ctx, pool[i], STILL_PHASE);
    }
  } catch (error) {
    guard.fail(LINKS, error);
    return false;
  } finally {
    ctx.restore();
  }
  if (whole) {
    ctx.save();
    for (let i = first; i < count; i++) centreMarker(canvas, ctx, pool[i]);
    ctx.restore();
  }
  return true;
}
const BORDER = "rgba(0,0,0,0.5)";
function nativeBody(canvas, ctx, s) {
  const width = canvas.connections_width * s.width;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  ctx.beginPath();
  s.path.trace(ctx);
  if (canvas.render_connections_border && !canvas.low_quality) {
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = width + 4;
    ctx.stroke();
  }
  ctx.strokeStyle = s.pal.native;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}
function body$1(canvas, ctx, s, still, plain) {
  if (L.animate) return drawBase(ctx, s, L.animate, still, plain);
  nativeBody(canvas, ctx, s);
  return false;
}
function hung(canvas, [, a, b, link2, , , color, startDir, endDir, extras]) {
  const owner = extras?.reroute ?? link2;
  let segment2 = segments.get(owner);
  if (!segment2) segments.set(owner, segment2 = new Segment());
  segment2.lay(a, b, startDir, endDir, canvas.links_render_mode, 0, true, true, extras?.startControl, extras?.endControl, NATIVE, wireOf(keyOf(link2, extras)));
  segment2.pal = pass.highlighted[link2.id] ? HIGHLIGHT : own(canvas, link2, color);
  segment2.width = 1;
  return segment2;
}
function alongWire(canvas, args) {
  const [ctx, , , link2, , , , , , extras] = args;
  const segment2 = hung(canvas, args);
  nativeBody(canvas, ctx, segment2);
  ctx.save();
  if (extras?.disabled && canvas._pattern) {
    ctx.globalAlpha = 0.75;
    centreMarker(canvas, ctx, segment2, canvas._pattern);
  } else centreMarker(canvas, ctx, segment2);
  ctx.restore();
  args[0] = dummy();
  original.apply(canvas, args);
  hit(extras?.reroute ?? link2, segment2.path);
}
function hit(owner, path2) {
  owner.path = path2.hit();
  owner._pos[0] = path2.cx;
  owner._pos[1] = path2.cy;
  owner._centreAngle = path2.angle;
}
const all = () => true;
const isFocused = (segment2) => segment2.focused;
const isFlowing = (segment2) => segment2.flow !== void 0;
function cull(canvas, keep2) {
  const area = canvas.visible_area;
  let n = 0;
  for (let i = 0; i < count; i++) {
    const { box: box2 } = pool[i].path;
    if (keep2(pool[i]) && box2[2] + REACH >= area[0] && box2[0] - REACH <= area[0] + area[2] && box2[3] + REACH >= area[1] && box2[1] - REACH <= area[1] + area[3]) shown$1[n++] = pool[i];
  }
  shown$1.length = n;
  return n;
}
function moveShown(ctx) {
  const animation = MOVING[L.animate];
  const additive = L.blend === "additive" && dark(app.canvas.clear_background_color);
  moving.alpha = during(L.pauseDuringRender) === "calm" ? CALM_ALPHA : 1;
  moving.glow = adaptive.level >= PLAIN ? 0 : 1;
  moving.density = adaptive.level >= THIN ? 0.5 : 1;
  try {
    for (const segment2 of shown$1) {
      if (segment2.empty) continue;
      if (additive) ctx.globalCompositeOperation = "lighter";
      animation?.(ctx, segment2, clock);
      ctx.globalCompositeOperation = "source-over";
      if (marked$1()) drawMarkers(ctx, segment2, clock.linkPhase, clock.linkFlow);
    }
  } finally {
    moving.alpha = moving.glow = moving.density = 1;
  }
}
function overShown(canvas, ctx, focused) {
  ctx.globalAlpha = canvas.editor_alpha;
  for (const segment2 of shown$1) centreMarker(canvas, ctx, segment2);
  drawReroutes(canvas, ctx, focused);
}
function drawReroutes(canvas, ctx, focused) {
  for (const reroute of canvas._visibleReroutes) {
    if (focused && !focus.reroutes.has(reroute.id)) continue;
    reroute.draw(ctx, canvas._pattern);
    if (!canvas.pointer.isDown) reroute.drawSlots(ctx);
  }
}
function motion(canvas, ctx) {
  if (pass.still) return 0;
  const n = cull(canvas, all);
  if (!n) return 0;
  ctx.save();
  try {
    enableAntiAliasing(ctx);
    if (!STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
    if (LINK_STYLES[L.linkStyle].moving) for (const segment2 of shown$1) drawBase(ctx, segment2, L.animate, false);
    moveShown(ctx);
  } catch (error) {
    guard.fail(LINKS, error);
    if (guard.off(LINKS)) canvas.setDirty(true, true);
  } finally {
    stopSprites();
    ctx.restore();
  }
  overShown(canvas, ctx, false);
  return n;
}
function flows(canvas, ctx) {
  if (!flowing.length || !cull(canvas, isFlowing)) return 0;
  ctx.save();
  let n = 0;
  try {
    n = drawFlows(ctx, shown$1);
  } finally {
    ctx.restore();
  }
  overShown(canvas, ctx, false);
  return n;
}
function widened(canvas, args) {
  const width = canvas.connections_width;
  const lit = canvas.highlighted_links;
  const { id } = args[3];
  const highlighted = lit[id];
  if (pass.focus === "highlight") canvas.connections_width = width * 1.5;
  delete lit[id];
  try {
    original.apply(canvas, args);
  } finally {
    canvas.connections_width = width;
    if (highlighted) lit[id] = highlighted;
  }
}
function tint(canvas, args) {
  args[6] = focusPalette(own(canvas, args[3], args[6]).native).native;
  raised.push(args);
  widened(canvas, args);
}
function dim(canvas, args) {
  const ctx = args[0];
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * L.focusDim / 100;
  try {
    if (pass.wires) alongWire(canvas, args);
    else original.apply(canvas, args);
  } finally {
    ctx.globalAlpha = alpha;
  }
}
function hide(canvas, args) {
  const [ctx, a, b, link2, , , color, startDir, endDir, extras] = args;
  const path2 = pass.wires ? hung(canvas, args).path : void 0;
  args[0] = dummy();
  original.apply(canvas, args);
  const owner = extras?.reroute ?? link2;
  owner.path = unhit ??= new Path2D();
  owner._pos[0] = owner._pos[1] = NaN;
  if (extras?.reroute) {
    extras.reroute.draw = extras.reroute.drawSlots = nothing;
    unseen.push(extras.reroute);
  }
  const fromSlot = !canvas.graph?.getReroute(owner.parentId);
  if (!fromSlot && extras?.reroute) return;
  const reach2 = LiteGraph.NODE_SLOT_HEIGHT * 0.5 + STUB;
  ctx.save();
  ctx.beginPath();
  if (fromSlot) {
    if (path2) along(ctx, path2, 0, reach2);
    else stub(ctx, a, startDir || RIGHT$1, reach2);
  }
  if (!extras?.reroute) {
    if (path2) along(ctx, path2, path2.length, path2.length - reach2);
    else stub(ctx, b, endDir || LEFT$1, reach2);
  }
  ctx.strokeStyle = own(canvas, link2, color).native;
  ctx.lineWidth = canvas.connections_width;
  ctx.stroke();
  ctx.restore();
}
const here = new Float64Array(4);
function along(ctx, path2, from, to) {
  const n = Math.ceil(Math.abs(to - from) / 2);
  for (let i = 0; i <= n; i++) {
    path2.find(from + (to - from) * i / n, here);
    if (i) ctx.lineTo(here[0], here[1]);
    else ctx.moveTo(here[0], here[1]);
  }
}
function raise(canvas, ctx) {
  if (!L.focusOnTop || !pass.focus) return;
  if (!cull(canvas, isFocused) && !raised.length) return;
  for (const args of raised) {
    args[0] = ctx;
    widened(canvas, args);
  }
  if (pass.on) {
    ctx.save();
    try {
      enableAntiAliasing(ctx);
      if (!pass.still && !STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
      for (const segment2 of shown$1) {
        body$1(canvas, ctx, segment2, pass.still, true);
        if (!pass.still || segment2.empty) continue;
        STILL[L.animate]?.(ctx, segment2, STILL_PHASE);
        if (marked$1()) drawMarkers(ctx, segment2, STILL_PHASE);
      }
      if (!pass.still) moveShown(ctx);
    } catch (error) {
      guard.fail(LINKS, error);
      if (guard.off(LINKS)) canvas.setDirty(true, true);
    } finally {
      stopSprites();
      ctx.restore();
    }
  }
  if (pass.runs) {
    ctx.save();
    drawFlows(ctx, shown$1);
    ctx.restore();
  }
  overShown(canvas, ctx, true);
}
function installLinks() {
  const proto = LGraphCanvas.prototype;
  const drawConnections = proto.drawConnections;
  original = proto.renderLink;
  foreign = !String(original).includes("renderLinkDirect") || Boolean(globalThis.__LINKFX_V2_BOOTED__);
  warned = told = false;
  glows.bases = 0;
  linkPass.drawsRuns = drawsRuns;
  steps$1.wires = stepWires;
  proto.drawConnections = function(...args) {
    begin(this, args[0]);
    try {
      return drawConnections.apply(this, args);
    } finally {
      end(this);
    }
  };
  proto.renderLink = function(...args) {
    const [ctx, a, b, link2, skipBorder, flow, color, startDir, endDir, extras] = args;
    pass.calls++;
    if (ctx !== pass.ctx || !link2 || skipBorder && flow) return original.apply(this, args);
    const disabled = Boolean(extras?.disabled);
    const focused = pass.focus !== "" && !disabled && focuses(link2, extras?.reroute);
    const step2 = pass.runs && !disabled ? stepInto(link2) : void 0;
    if (pass.focus === "dim" && !focused && !step2) return dim(this, args);
    if (pass.focus === "hide" && !focused && !step2) return hide(this, args);
    if (pass.on && !disabled && (focused || step2 || pass.focus !== "animate")) {
      const segment2 = record(this, link2, a, b, color, startDir, endDir, extras, focused, step2);
      if (place(this, ctx, segment2)) {
        args[0] = dummy();
        original.apply(this, args);
        if (segment2.custom) hit(extras?.reroute ?? link2, segment2.path);
        return;
      }
    } else {
      if (disabled && pass.wires) return alongWire(this, args);
      if (step2) record(this, link2, a, b, color, startDir, endDir, extras, focused, step2);
      if (focused && pass.tinted) return tint(this, args);
    }
    return original.apply(this, args);
  };
  layers.links = (canvas, ctx, over) => {
    const ontop = Boolean(canvas.graph?.config.links_ontop);
    if (!over && (syncFocus(canvas) || pass.runs && !flowsShown())) canvas.setDirty(true, true);
    if (over && !ontop) raise(canvas, ctx);
    if (over !== ontop) return;
    live.links = motion(canvas, ctx);
    live.flows = flows(canvas, ctx);
    if (live.links || live.flows) wake();
  };
}
const lookable = (s) => s.type !== "hidden" && s.look !== false;
const DEFAULTS = Object.fromEntries(SETTINGS.filter(lookable).map((s) => [s.id, s.default]));
const LOOKS = [
  {
    id: "off",
    name: "Off",
    description: "Native links and nodes, but for nodes given effects of their own in the node menu, with no run visuals or completion effect.",
    values: {
      "🔗 Enhanced Links.Animate": 0,
      "🔗 Enhanced Links.Flow.River": false,
      "🔗 Enhanced Links.Flow.Trail": false,
      "📦 Enhanced Nodes.Run.Ring": false,
      "📦 Enhanced Nodes.Run.Error": false,
      "📦 Enhanced Nodes.End Animation.Enabled": false
    }
  },
  {
    id: "subtle",
    name: "Subtle",
    description: "Classic Flow links with gliding arrows and v1's dark halo, plain nodes, and a shockwave over your outputs when a run finishes.",
    values: {}
  },
  {
    id: "showcase",
    name: "Showcase",
    description: "Cosmic Weave links that sag like rope and Neon Nexus nodes with aurora particles, in more detail and glow, calmer while your runs play, with a burst as each node finishes and fireworks at the end.",
    // TODO(M9e): hands & eyes.
    values: {
      "🔗 Enhanced Links.Animate": 4,
      "🔗 Enhanced Links.Physics.Profile": "rope",
      "🔗 Enhanced Links.Quality": 2,
      "🔗 Enhanced Links.Particle.Density": 2,
      "🔗 Enhanced Links.Physics.Amount": 0.6,
      "🔗 Enhanced Links.Glow.Intensity": 14,
      "🔗 Enhanced Links.Blend": "additive",
      "📦 Enhanced Nodes.Animate": 2,
      "📦 Enhanced Nodes.Intensity": 1.2,
      "📦 Enhanced Nodes.Glow": 1,
      "📦 Enhanced Nodes.Particle.Show": true,
      "📦 Enhanced Nodes.Particle.Glow": 1,
      "📦 Enhanced Nodes.Particle.Color.Mode": "aurora",
      "🔗 Enhanced Links.Pause.Mode": "calm",
      "📦 Enhanced Nodes.Completion.Style": "fireworks",
      "📦 Enhanced Nodes.Completion.PerNode": true
    }
  },
  {
    id: "performance",
    name: "Performance",
    description: "Still Classic Flow links with less glow and no shadows, plain nodes, runs shown still without a trail, and no completion effect.",
    values: {
      "🔗 Enhanced Links.Static.Mode": true,
      "🔗 Enhanced Links.Glow.Intensity": 6,
      "🔗 Enhanced Links.Link.Shadow.Enabled": false,
      "🔗 Enhanced Links.Marker.Shadow.Enabled": false,
      "🔗 Enhanced Links.Pause.Mode": "pause",
      "🔗 Enhanced Links.Flow.Trail": false,
      "📦 Enhanced Nodes.End Animation.Enabled": false
    }
  },
  {
    // v1's defaults (old_link_animations.js:19-45, old_node_animations.js:146-178); its links are v3's.
    id: "classic-v1",
    name: "Classic v1",
    description: "v1 out of the box: Classic Flow links with their dark halo, Neon Nexus nodes with particles in v1's colors, and none of 3.0's run visuals or completion effect.",
    values: {
      "📦 Enhanced Nodes.Animate": 2,
      "📦 Enhanced Nodes.Quality": 1,
      "📦 Enhanced Nodes.Glow": 1,
      "📦 Enhanced Nodes.Color.Mode": "custom",
      "📦 Enhanced Nodes.Particle.Show": true,
      "📦 Enhanced Nodes.Particle.Density": 0.5,
      "📦 Enhanced Nodes.Particle.Glow": 1,
      "🔗 Enhanced Links.Pause.Mode": "pause",
      "🔗 Enhanced Links.Flow.River": false,
      "🔗 Enhanced Links.Flow.Trail": false,
      "📦 Enhanced Nodes.Run.Ring": false,
      "📦 Enhanced Nodes.Run.Error": false,
      "📦 Enhanced Nodes.End Animation.Enabled": false,
      "📦 Enhanced Nodes.Completion.Style": "fireworks"
    }
  },
  {
    id: "neon-night",
    name: "Neon Night",
    description: "Energy Pulse links and Neon Nexus nodes in electric cyan and magenta, with color-cycling particles and confetti when a run finishes.",
    values: {
      "🔗 Enhanced Links.Animate": 5,
      "🔗 Enhanced Links.Quality": 2,
      "🔗 Enhanced Links.Color.Mode": "custom",
      "🔗 Enhanced Links.Color.Primary": "#00e5ff",
      "🔗 Enhanced Links.Color.Secondary": "#ff2bd6",
      "🔗 Enhanced Links.Color.Accent": "#7c4dff",
      "🔗 Enhanced Links.Glow.Intensity": 16,
      "🔗 Enhanced Links.Blend": "additive",
      "📦 Enhanced Nodes.Animate": 2,
      "📦 Enhanced Nodes.Color.Mode": "custom",
      "📦 Enhanced Nodes.Color.Primary": "#00e5ff",
      "📦 Enhanced Nodes.Color.Secondary": "#ff2bd6",
      "📦 Enhanced Nodes.Color.Accent": "#7c4dff",
      "📦 Enhanced Nodes.Particle.Show": true,
      "📦 Enhanced Nodes.Particle.Color.Mode": "energy",
      "📦 Enhanced Nodes.Completion.Style": "confetti"
    }
  },
  {
    id: "lava-lamp",
    name: "Lava Lamp",
    description: "Lava Flow links and Cosmic Ripple nodes in molten reds and ambers, with color-cycling particles and fireworks when a run finishes.",
    values: {
      "🔗 Enhanced Links.Animate": 7,
      "🔗 Enhanced Links.Quality": 2,
      "🔗 Enhanced Links.Particle.Density": 1,
      "🔗 Enhanced Links.Color.Mode": "custom",
      "🔗 Enhanced Links.Color.Primary": "#ff4d00",
      "🔗 Enhanced Links.Color.Secondary": "#ffb300",
      "🔗 Enhanced Links.Color.Accent": "#ff006e",
      "📦 Enhanced Nodes.Animate": 3,
      "📦 Enhanced Nodes.Color.Mode": "custom",
      "📦 Enhanced Nodes.Color.Primary": "#ff4d00",
      "📦 Enhanced Nodes.Color.Secondary": "#ffb300",
      "📦 Enhanced Nodes.Color.Accent": "#ff006e",
      "📦 Enhanced Nodes.Particle.Show": true,
      "📦 Enhanced Nodes.Particle.Color.Mode": "energy",
      "📦 Enhanced Nodes.Completion.Style": "fireworks"
    }
  },
  {
    id: "sacred-geometry",
    name: "Sacred Geometry",
    description: "Merkaba Beads links and Flower of Life nodes in gold, and a path trace when a run finishes.",
    values: {
      "🔗 Enhanced Links.Animate": 10,
      "🔗 Enhanced Links.Color.Mode": "custom",
      "🔗 Enhanced Links.Color.Primary": "#ffcc00",
      "🔗 Enhanced Links.Color.Secondary": "#ff8800",
      "🔗 Enhanced Links.Color.Accent": "#fff3b0",
      "📦 Enhanced Nodes.Animate": 4,
      "📦 Enhanced Nodes.Color.Mode": "custom",
      "📦 Enhanced Nodes.Color.Primary": "#ffcc00",
      "📦 Enhanced Nodes.Color.Secondary": "#ff8800",
      "📦 Enhanced Nodes.Color.Accent": "#fff3b0",
      "📦 Enhanced Nodes.Completion.Style": "trace"
    }
  },
  {
    id: "living-wires",
    name: "Living Wires",
    description: "Native-looking wires that sag like rope.",
    // TODO(M9e): Assist hands.
    values: {
      "🔗 Enhanced Links.Animate": 0,
      "🔗 Enhanced Links.Physics.Profile": "rope"
    }
  },
  {
    id: "presenter",
    name: "Presenter",
    description: "Thicker, high-contrast Classic Flow links with larger markers, for streams and screenshots.",
    values: {
      "🔗 Enhanced Links.Thickness": 5,
      "🔗 Enhanced Links.Color.Scheme": "contrast",
      "🔗 Enhanced Links.Glow.Intensity": 12,
      "🔗 Enhanced Links.Marker.Size": 4
    }
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Muted right-angle links with small square markers and no shadows, plain nodes, and a path trace when a run finishes.",
    values: {
      "🔗 Enhanced Links.Link.Style": "linear",
      "🔗 Enhanced Links.Color.Scheme": "muted",
      "🔗 Enhanced Links.Glow.Intensity": 4,
      "🔗 Enhanced Links.Marker.Shape": "square",
      "🔗 Enhanced Links.Marker.Size": 2,
      "🔗 Enhanced Links.Link.Shadow.Enabled": false,
      "🔗 Enhanced Links.Marker.Shadow.Enabled": false,
      "📦 Enhanced Nodes.Completion.Style": "trace"
    }
  }
];
const valuesOf = (look) => ({ ...DEFAULTS, ...look.values });
const drawLook = (look, draw2) => drawWith(valuesOf(look), draw2);
function previewLook(look) {
  const values = valuesOf(look);
  for (const [id, value] of Object.entries(values)) preview(id, value);
  return () => restore$1(Object.keys(values));
}
function applyLook(look) {
  return commitAll({ ...valuesOf(look), [LOOK]: look.id });
}
const changed = (look) => Object.entries(valuesOf(look)).some(([id, value]) => shown$3(id) !== value);
function keepShown() {
  commitAll({ ...Object.fromEntries(Object.keys(DEFAULTS).map((id) => [id, shown$3(id)])), [LOOK]: "custom" });
}
function currentLook() {
  const id = L.look || "subtle";
  if (id.startsWith(SURPRISE)) return mix(Number(id.slice(SURPRISE.length)));
  return LOOKS.find((look) => look.id === id) ?? mine$2?.find((look) => look.id === id);
}
const FILE = "enhanced-links-nodes/looks.json";
const APP = "comfyui-enhancedlinksandnodes";
const COLOUR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;
let mine$2;
let reading;
let storing = Promise.resolve();
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function clean(values, errors) {
  const kept2 = {};
  for (const [id, value] of Object.entries(values)) {
    if (!Object.hasOwn(DEFAULTS, id)) {
      errors.push(SETTINGS.some((s2) => s2.id === id) ? `Looks leave ${setting(id).name} alone, so it was left out.` : `${id} is not a setting looks know, so it was left out.`);
      continue;
    }
    const s = setting(id);
    const normal = normalize(s, value);
    if (s.type === "color" && !(typeof normal === "string" && COLOUR.test(normal))) {
      errors.push(`${s.name}: ${JSON.stringify(value)} is no color, so it was left out.`);
      continue;
    }
    if (normal !== value) errors.push(`${s.name}: ${JSON.stringify(value)} became ${JSON.stringify(normal)}.`);
    kept2[id] = normal;
  }
  return kept2;
}
async function read() {
  const response = await api.getUserData(FILE);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Could not read ${FILE}: ${response.status} ${response.statusText}`);
  const data = await response.json();
  const looks = isObject(data) && Array.isArray(data.looks) ? data.looks : [];
  return looks.flatMap((look) => isObject(look) && typeof look.id === "string" && typeof look.name === "string" && isObject(look.values) ? [{ id: look.id, name: look.name, description: "", values: clean(look.values, []) }] : []);
}
async function userLooks() {
  reading ??= read().catch((error) => {
    reading = void 0;
    throw error;
  });
  return mine$2 ??= await reading;
}
function store(looks) {
  const write2 = storing.then(() => api.storeUserData(FILE, { schema: 1, looks }, { overwrite: true, stringify: true, throwOnError: true }));
  storing = write2.catch(() => {
  });
  return write2.then(() => {
  });
}
async function add(name, values) {
  const looks = await userLooks();
  const look = { id: `user-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, description: "", values };
  looks.push(look);
  await store(looks);
  return look;
}
function saveLook(name) {
  return add(name, Object.fromEntries(Object.entries(DEFAULTS).flatMap(([id, value]) => shown$3(id) === value ? [] : [[id, shown$3(id)]])));
}
async function renameLook(id, name) {
  const looks = await userLooks();
  const look = looks.find((l) => l.id === id);
  if (!look) return;
  look.name = name;
  await store(looks);
}
async function deleteLook(id) {
  const looks = await userLooks();
  const at = looks.findIndex((l) => l.id === id);
  if (at < 0) return async () => {
  };
  const [look] = looks.splice(at, 1);
  await store(looks);
  return () => {
    looks.splice(Math.min(at, looks.length), 0, look);
    return store(looks);
  };
}
function exportLook(look) {
  return JSON.stringify({ app: APP, kind: "look", schema: 1, name: look.name, values: look.values }, null, 2);
}
async function importLook(text2) {
  let data;
  try {
    data = JSON.parse(text2);
  } catch {
    return { errors: ["The file is not JSON."] };
  }
  if (!isObject(data) || !isObject(data.values) || data.kind !== void 0 && data.kind !== "look") return { errors: ["The file holds no look."] };
  const errors = [];
  const values = clean(data.values, errors);
  const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Imported look";
  return { look: await add(name, values), errors };
}
const SURPRISE = "surprise-";
const LINK_ANIMATE = "🔗 Enhanced Links.Animate";
const NODE_ANIMATE = "📦 Enhanced Nodes.Animate";
const optionsOf = (id) => {
  const s = setting(id);
  return s.type === "combo" ? s.options : [];
};
const hex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
const light$1 = () => !document.documentElement.classList.contains("dark-theme") && !document.body.classList.contains("dark-theme");
function mix(seed) {
  const random = rng(seed);
  const pick2 = (items) => items[Math.floor(random() * items.length)];
  const between = (lo, hi, step2) => Number((Math.round((lo + random() * (hi - lo)) / step2) * step2).toFixed(2));
  const links = pick2(optionsOf(LINK_ANIMATE).filter((o) => o.value !== 0));
  const nodes = pick2(optionsOf(NODE_ANIMATE));
  const hue = random() * 360;
  const [primary, secondary, accent2] = [0, 40, 180].map((turn) => hex(fromHsl((hue + turn) % 360, 90, seed & 1 ? 40 : 60)));
  const values = {
    [LINK_ANIMATE]: links.value,
    "🔗 Enhanced Links.Animation.Speed": between(0.6, 1.4, 0.05),
    "🔗 Enhanced Links.Quality": pick2([1, 2]),
    "🔗 Enhanced Links.Particle.Density": pick2([0.5, 1, 2]),
    "🔗 Enhanced Links.Glow.Intensity": between(6, 16, 1),
    "🔗 Enhanced Links.Color.Mode": "custom",
    "🔗 Enhanced Links.Color.Primary": primary,
    "🔗 Enhanced Links.Color.Secondary": secondary,
    "🔗 Enhanced Links.Color.Accent": accent2,
    [NODE_ANIMATE]: nodes.value,
    "📦 Enhanced Nodes.Animation.Speed": between(0.6, 1.4, 0.1),
    "📦 Enhanced Nodes.Quality": pick2([1, 2]),
    "📦 Enhanced Nodes.Color.Mode": "custom",
    "📦 Enhanced Nodes.Color.Primary": primary,
    "📦 Enhanced Nodes.Color.Secondary": secondary,
    "📦 Enhanced Nodes.Color.Accent": accent2,
    "📦 Enhanced Nodes.Particle.Show": random() < 0.5,
    "📦 Enhanced Nodes.Particle.Density": pick2([0.5, 1, 2]),
    "📦 Enhanced Nodes.Completion.Style": pick2(STYLES$1)
  };
  const description = `${links.text} links and ${nodes.value ? `${nodes.text} nodes` : "plain nodes"} in colors of their own.`;
  return { id: `${SURPRISE}${seed}`, name: "Surprise", description, values };
}
function surprise() {
  if (Math.random() < 0.25) {
    const looks = LOOKS.filter((look) => look.id !== "off" && look.id !== L.look);
    return looks[Math.floor(Math.random() * looks.length)];
  }
  for (; ; ) {
    const look = mix(Math.floor(Math.random() * 2 ** 30) * 2 | (light$1() ? 1 : 0));
    if (look.values[LINK_ANIMATE] !== L.animate) return look;
  }
}
const STILL_NODE = { nodePhase: Math.PI / 4, particleTime: 0, nodeTime: 0 };
const holdsStill = () => N.staticMode || heldByRun(N.pauseDuringRender) || env.reducedMotion || adaptive.level >= HELD;
const UNDER = 1;
const OVER = 2;
const [NEVER, BYPASS] = [2, 4];
let part$1;
let fade = 1;
let held = false;
let outlined = false;
let thin = 1;
const stores = /* @__PURE__ */ new WeakMap();
const SIZES = 256;
let mine$1;
function makes(ctx, pal, w, h2, k2, sides) {
  let store2 = stores.get(ctx);
  if (!store2) stores.set(ctx, store2 = { since: revision, sizes: 0, made: /* @__PURE__ */ new Map() });
  if (store2.since !== revision || store2.sizes > SIZES) {
    store2.made.clear();
    store2.since = revision;
    store2.sizes = 0;
  }
  let byWidth = store2.made.get(pal);
  if (!byWidth) store2.made.set(pal, byWidth = /* @__PURE__ */ new Map());
  let byHeight = byWidth.get(w);
  if (!byHeight) byWidth.set(w, byHeight = /* @__PURE__ */ new Map());
  let m = byHeight.get(h2);
  if (!m) {
    byHeight.set(h2, m = { phase: NaN, particles: NaN, time: NaN, held: false, thin: 1, slots: [[], [], [], []] });
    store2.sizes++;
  }
  if (m.phase !== k2.nodePhase || m.particles !== k2.particleTime || m.time !== k2.nodeTime || m.held !== held || m.thin !== thin) {
    m.phase = k2.nodePhase;
    m.particles = k2.particleTime;
    m.time = k2.nodeTime;
    m.held = held;
    m.thin = thin;
    for (const slots of m.slots) slots.fill(void 0);
  }
  return m.slots[sides];
}
const kept = (slot) => mine$1[slot];
function keep$1(slot, value) {
  mine$1[slot] = value;
  return value;
}
const [OUTLINE_SHADOW, OUTLINE_STROKE] = [0, 1];
const [LIGHT, HALO, FIREFLY_SHADOW, FIREFLIES] = [2, 3, 4, 5];
const [SCAN, PULSE, PULSE_STROKE, PULSE_SHADOW, HEXAGONS] = [2, 3, 4, 5, 6];
const [RING_SHADOW, RINGS, MOTES] = [2, 3, 8];
const [CORE, DOTS] = [2, 3];
let depth = 0;
function save(ctx) {
  ctx.save();
  depth++;
}
function restore(ctx) {
  ctx.restore();
  depth--;
}
function shows(x0, y0, x1, y1) {
  const p = part$1;
  if (p.sides !== UNDER && p.sides !== OVER) return true;
  if (p.round < 0) return true;
  if (x1 <= p.x0 || x0 >= p.x1 || y1 <= p.y0 || y0 >= p.y1) return p.sides === UNDER;
  const r = p.round;
  const corner = (x0 < p.x0 + r || x1 > p.x1 - r) && (y0 < p.y0 + r || y1 > p.y1 - r);
  const inside = x0 >= p.x0 && x1 <= p.x1 && y0 >= p.y0 && y1 <= p.y1 && !corner;
  return !inside || p.sides === OVER;
}
const circle = (x, y, r) => shows(x - r, y - r, x + r, y + r);
const pales = /* @__PURE__ */ new Map();
let palesSince = -1;
function pale(colour2, alpha) {
  if (colour2.charCodeAt(0) !== 35) return translucent(colour2, alpha);
  if (palesSince !== revision) {
    pales.clear();
    palesSince = revision;
  }
  let start = pales.get(colour2);
  if (start === void 0) {
    const pair = (i) => parseInt(colour2.slice(i, i + 2), 16) || 255;
    pales.set(colour2, start = `rgba(${pair(1)}, ${pair(3)}, ${pair(5)}, `);
  }
  return `${start}${alpha})`;
}
function outline(ctx, x, y, w, h2, selected2, colour2) {
  save(ctx);
  const blur = 15 * N.animationGlow;
  ctx.shadowColor = kept(OUTLINE_SHADOW) ?? keep$1(OUTLINE_SHADOW, colour2(N.colorHover, 0.5));
  ctx.shadowBlur = selected2 ? blur * 1.5 : blur;
  ctx.strokeStyle = kept(OUTLINE_STROKE) ?? keep$1(OUTLINE_STROKE, colour2(N.colorHover, 0.7));
  ctx.lineWidth = 2;
  ctx.globalAlpha = fade;
  ctx.strokeRect(x, y, w, h2);
  restore(ctx);
}
function gentlePulse(ctx, node2, w, h2, k2, pal, only) {
  const { quality: quality2, animationGlow: glow2, animationSize: size, particleSpeed: speed, particleIntensity: motion2 } = N;
  const phase = k2.nodePhase;
  const time = held ? phase : TURN * k2.particleTime;
  const radius = Math.max(w, h2) * (0.5 + quality2 * 0.1) * size;
  const cx = w / 2;
  const cy = h2 / 2;
  save(ctx);
  ctx.translate(cx, cy);
  if (outlined) outline(ctx, -cx, -cy, w, h2, node2.selected, pale);
  let blur = 0;
  if (!only) {
    const breathe = Math.pow(Math.sin(held ? phase : phase * 0.375 * N.direction * N.animationSpeed), 2);
    const pulse = 0.4 + 0.4 * breathe * (N.intensity * 1.5 * 0.75);
    const inner = radius * pulse;
    const outer = radius * (1.2 + glow2 * 0.4) * pulse;
    if (circle(cx, cy, inner)) {
      const alpha = 0.2 * glow2 * (0.5 + breathe * 0.5);
      const gradient = kept(LIGHT) ?? keep$1(LIGHT, light(ctx, inner, alpha, pal));
      ctx.beginPath();
      ctx.arc(0, 0, inner, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = Math.min(0.2 + Math.abs(breathe) * 0.3 + glow2 * 0.2, 1) * fade;
      ctx.fill();
    }
    if (circle(cx, cy, outer)) {
      const alpha = 0.1 * glow2 * (0.5 + breathe * 0.5);
      const gradient = kept(HALO) ?? keep$1(HALO, halo(ctx, radius * 0.6 * pulse, outer, alpha, pal));
      ctx.beginPath();
      ctx.arc(0, 0, outer, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = Math.min(0.15 + Math.abs(breathe) * 0.2 + glow2 * 0.15, 1) * fade;
      ctx.fill();
    }
    if (quality2 > 1) {
      ctx.shadowColor = kept(FIREFLY_SHADOW) ?? keep$1(FIREFLY_SHADOW, pale(pal.secondary, 0.3));
      ctx.shadowBlur = blur = 10 * glow2 * (quality2 * 0.5);
    }
  }
  if (N.particleShow) {
    const { particleGlow: dotGlow } = N;
    const count2 = Math.floor((8 + quality2 * 2) * N.particleDensity * thin);
    const base = (4 + quality2) * size * N.particleSize;
    const wobble = quality2 > 1 ? 12 : 6;
    const rate = held ? 0 : TURN * speed * speed;
    const tick2 = Math.floor(k2.nodeTime * 30) * 4096;
    for (let i = 0; i < count2; i++) {
      const offset = i * (Math.PI * 2 / count2);
      const pace = held ? 1 : (0.5 + Math.sin(i) * 0.25) * motion2 * speed;
      const turned = held ? phase + offset : time * pace + offset;
      const orbit = radius * (0.8 + Math.sin(held ? phase + i : time * 0.2 * speed + i) * 0.25 + Math.cos(held ? phase + i * 0.7 : time * 0.3 * speed + i * 0.7) * 0.25);
      const angle = turned + i * Math.PI * 2 / count2;
      const torus = Math.sin(time * 0.3 * speed + i) * (motion2 * 2);
      const jitterX = held ? 0 : Math.sin(time * 3 * speed + i) * 1.2 * motion2 + Math.cos(time * 2 * speed + i * 0.5) * 0.5 * motion2;
      const jitterY = held ? 0 : Math.cos(time * 2.5 * speed + i) * 1.2 * motion2 + Math.sin(time * 1.5 * speed + i * 0.7) * 0.5 * motion2;
      const x = Math.cos(angle) * (orbit + torus) + Math.sin(held ? phase + i : time * 0.2 * speed + i) * wobble + jitterX;
      const y = Math.sin(angle) * (orbit + torus) - orbit * 0.3 + Math.cos(held ? phase + i : time * 0.15 * speed + i) * wobble + jitterY;
      const s = held ? base : base * (0.7 + Math.sin(time * 0.5 * speed + i) * 0.4 + noise(tick2 + i) * 0.3);
      if (!circle(cx + x, cy + y, s * 2 + 1.5 * blur)) continue;
      const colour2 = kept(FIREFLIES + 2 * i) ?? keep$1(FIREFLIES + 2 * i, particleColour(pal, i, time * speed, rate));
      const gradient = kept(FIREFLIES + 2 * i + 1) ?? keep$1(FIREFLIES + 2 * i + 1, firefly(ctx, x, y, s * 2, colour2, dotGlow));
      const blinkOffset = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % (2 * Math.PI));
      const blinkSpeed = 1.2 + Math.sin(i * 0.7) * 0.6;
      const blink = held ? 0.8 : 0.4 + 0.8 * Math.pow(Math.sin(time * blinkSpeed * speed + blinkOffset), 2);
      const alpha = Math.min(blink, 1) * dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, s * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = alpha * 0.8 * fade;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = colour2;
      ctx.globalAlpha = Math.min(alpha * 1.5, 1) * fade;
      ctx.fill();
    }
  }
  restore(ctx);
}
function light(ctx, r, alpha, pal) {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  gradient.addColorStop(0, pale("#ffffff", Math.min(alpha + 0.15, 1)));
  gradient.addColorStop(0.3, pale(pal.primary, alpha));
  gradient.addColorStop(0.7, pale(pal.secondary, alpha * 0.6));
  gradient.addColorStop(1, pale(pal.accent, 0));
  return gradient;
}
function halo(ctx, r0, r1, alpha, pal) {
  const gradient = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
  gradient.addColorStop(0, pale(pal.secondary, alpha));
  gradient.addColorStop(0.6, pale(pal.accent, alpha * 0.5));
  gradient.addColorStop(1, pale(pal.accent, 0));
  return gradient;
}
function firefly(ctx, x, y, r, colour2, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, pale(colour2, 0.8 * alpha));
  gradient.addColorStop(0.4, pale(colour2, 0.4 * alpha));
  gradient.addColorStop(1, pale(colour2, 0));
  return gradient;
}
function scanLine(ctx, y) {
  const gradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  return gradient;
}
function pulseLight(ctx, x, y, r, pulse) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  return gradient;
}
const HOLOGRAM = [0, 1, 2].map((i) => `hsl(${i * 60 % 360}, 80%, 75%)`);
const DASH = [5, 3];
function roundedRect(ctx, x, y, w, h2, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h2 - r);
  ctx.quadraticCurveTo(x + w, y + h2, x + w - r, y + h2);
  ctx.lineTo(x + r, y + h2);
  ctx.quadraticCurveTo(x, y + h2, x, y + h2 - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function neonNexus(ctx, node2, w, h2, k2, pal, only) {
  const { primary, secondary, accent: accent2 } = pal;
  const { animationGlow: glow2, animationSize: size, particleGlow: dotGlow, particleSpeed: speed } = N;
  const intensity = N.intensity * 1.5;
  const phase = k2.nodePhase;
  const time = held ? phase : phase * speed;
  const radius = Math.min(w, h2) * 0.08;
  const line = Math.max(w, h2) * 75e-4 * size;
  const grid = Math.min(w, h2) * 0.4 * size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "transparent";
  if (!only) {
    for (let i = 0; i < 3; i++) {
      save(ctx);
      ctx.globalAlpha = (0.2 - i * 0.05) * fade;
      ctx.strokeStyle = HOLOGRAM[i];
      ctx.lineWidth = line * 0.4;
      roundedRect(ctx, -i * 2, -i * 2, w + i * 4, h2 + i * 4, radius + i * 1);
      ctx.stroke();
      restore(ctx);
    }
    const flicker = held ? 1 : 0.95 + 0.05 * Math.sin(phase * 0.3 * N.direction);
    for (let i = 0; i < 4; i++) {
      save(ctx);
      ctx.lineWidth = line * (1 + i * 0.3);
      const colour2 = i === 0 ? primary : i === 1 ? secondary : i === 2 ? accent2 : "rgba(255, 255, 255, 0.4)";
      ctx.strokeStyle = colour2;
      ctx.shadowColor = colour2;
      ctx.shadowBlur = (i + 1) * 12 * intensity * glow2;
      const opacity2 = 0.95 - i * 0.15;
      ctx.globalAlpha = (held ? opacity2 : opacity2 * flicker) * fade;
      roundedRect(ctx, 0, 0, w, h2, radius);
      ctx.stroke();
      if (i === 0) {
        ctx.globalAlpha = (held ? 0.3 : 0.3 * flicker) * fade;
        ctx.lineWidth = line * 0.8;
        ctx.shadowBlur = 20 * intensity * glow2;
        roundedRect(ctx, 0, 0, w, h2, radius);
        ctx.stroke();
      }
      restore(ctx);
    }
    const scan = h2 * (Math.sin(phase * 2) * 0.5 + 0.5);
    if (!held && shows(0, scan - 10, w, scan + 10)) {
      ctx.fillStyle = kept(SCAN) ?? keep$1(SCAN, scanLine(ctx, scan));
      ctx.fillRect(0, scan - 10, w, 20);
    }
  }
  if (N.particleShow) {
    const spacing = grid / 4;
    const base = 2 * N.particleSize;
    const rate = held ? 0 : TURN * N.animationSpeed * speed;
    for (let i = 0; i < 70; i++) {
      const col = i % 5;
      const row2 = Math.floor(i / 5);
      const x = (col - 2) * spacing + Math.cos(phase + col) * 2;
      const y = (row2 - 2) * spacing + Math.sin(phase + row2) * 2;
      const s = base + Math.sin(phase * 2 + i) * (base * 0.3);
      if (!circle(x, y, s + 1.5 * 5 * dotGlow)) continue;
      const colour2 = kept(HEXAGONS + i) ?? keep$1(HEXAGONS + i, particleColour(pal, i, time, rate));
      save(ctx);
      ctx.translate(x, y);
      ctx.rotate(phase + i * Math.PI / 8);
      ctx.fillStyle = colour2;
      ctx.globalAlpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * dotGlow * fade;
      ctx.shadowColor = colour2;
      ctx.shadowBlur = 5 * dotGlow;
      ctx.beginPath();
      for (let side = 0; side < 6; side++) {
        const angle = side * Math.PI / 3 + phase;
        const corner = s * (0.8 + Math.sin(phase * 5 + side) * 0.2);
        ctx.lineTo(Math.cos(angle) * corner, Math.sin(angle) * corner);
      }
      ctx.closePath();
      ctx.fill();
      restore(ctx);
    }
    if (!only) {
      save(ctx);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2 * dotGlow * fade;
      ctx.setLineDash(DASH);
      ctx.lineDashOffset = phase * 10;
      const middle = h2 / 5;
      const left = -grid * 0.5;
      for (let i = -1; i <= 1; i += 0.5) {
        if (shows(left + i * grid - 0.5, middle - grid, left + i * grid + 0.5, middle + grid)) {
          ctx.beginPath();
          ctx.moveTo(left + i * grid, middle - grid);
          ctx.lineTo(left + i * grid, middle + grid);
          ctx.stroke();
        }
        if (shows(left - grid, middle + i * grid - 0.5, left + grid, middle + i * grid + 0.5)) {
          ctx.beginPath();
          ctx.moveTo(left - grid, middle + i * grid);
          ctx.lineTo(left + grid, middle + i * grid);
          ctx.stroke();
        }
      }
      restore(ctx);
    }
  }
  if ((node2.selected || node2.mouseOver) && !only) {
    save(ctx);
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + 0.5 * Math.sin(phase * 3);
    ctx.fillStyle = kept(PULSE) ?? keep$1(PULSE, pulseLight(ctx, w / 2, h2 / 2, Math.max(w, h2) * 0.7, pulse));
    roundedRect(ctx, 0, 0, w, h2, radius);
    ctx.fill();
    ctx.strokeStyle = kept(PULSE_STROKE) ?? keep$1(PULSE_STROKE, `rgba(255,255,255,${0.7 * pulse})`);
    ctx.lineWidth = line * 2;
    ctx.shadowColor = kept(PULSE_SHADOW) ?? keep$1(PULSE_SHADOW, `rgba(255,255,255,${0.5 * pulse})`);
    ctx.shadowBlur = 15 * intensity;
    roundedRect(ctx, 0, 0, w, h2, radius);
    ctx.stroke();
    restore(ctx);
  }
}
function cosmicRipple(ctx, _node, w, h2, k2, pal, only) {
  const { animationGlow: glow2, particleGlow: dotGlow, particleIntensity: motion2 } = N;
  const cx = w / 2;
  const cy = h2 / 2;
  if (!only) {
    const most = Math.max(1, Math.min(w, h2) * 0.7 * N.animationSize);
    const intensity = N.intensity * 1.5;
    const ripple = Math.abs(k2.nodePhase) * 0.8;
    for (let i = 0; i < 5; i++) {
      const at = (ripple - i * 0.2) % 1;
      const r = Math.max(5, most * at);
      if (!(r > 5 && r < most)) continue;
      const blur = Math.max(2, 15 * (1 - at) * glow2);
      const line = Math.max(1, 3 * intensity * (1 - at));
      if (!circle(cx, cy, r + line / 2 + 1.5 * blur)) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = kept(RINGS + i) ?? keep$1(RINGS + i, ring(ctx, cx, cy, r, Math.max(0, 1 - at), pal));
      ctx.lineWidth = line;
      ctx.shadowColor = kept(RING_SHADOW) ?? keep$1(RING_SHADOW, translucent(pal.secondary, 0.5));
      ctx.shadowBlur = blur;
      ctx.stroke();
    }
  }
  if (N.particleShow) {
    const count2 = Math.floor(Math.min(100, 30 + Math.floor(motion2 * 20)) * N.particleDensity * thin);
    const corona = Math.max(1, Math.max(w, h2) * 0.7);
    const time = k2.nodeTime;
    for (let i = 0; i < count2; i++) {
      const angle = i / count2 * Math.PI * 2 + k2.particleTime;
      const spread2 = Math.max(0.1, 0.8 + Math.sin(time * 0.5 + i) * 0.2 * motion2);
      const x = Math.cos(angle) * corona * spread2 + cx;
      const y = Math.sin(angle) * corona * spread2 + cy;
      const s = Math.max(1, 2 * N.particleSize + Math.sin(time * 1.5 + i) * 1.5 * motion2);
      const trail2 = Math.max(1, s * 2);
      if (!circle(x, y, trail2 + 1.5 * 15 * dotGlow)) continue;
      const slot = MOTES + 5 * i;
      const colour2 = kept(slot) ?? keep$1(slot, particleColour(pal, i, time, 1));
      ctx.fillStyle = kept(slot + 1) ?? keep$1(slot + 1, mote(ctx, x, y, trail2, colour2, dotGlow));
      ctx.shadowColor = kept(slot + 2) ?? keep$1(slot + 2, translucent(colour2, dotGlow * 0.5));
      ctx.shadowBlur = 10 * dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, trail2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = kept(slot + 3) ?? keep$1(slot + 3, translucent(colour2, 0.7));
      ctx.shadowColor = kept(slot + 4) ?? keep$1(slot + 4, translucent(colour2, dotGlow));
      ctx.shadowBlur = 15 * dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
function ring(ctx, x, y, r, alpha, pal) {
  const gradient = ctx.createLinearGradient(x - r, y, x + r, y);
  gradient.addColorStop(0, translucent(pal.secondary, alpha * 0.8));
  gradient.addColorStop(0.5, translucent(pal.primary, alpha));
  gradient.addColorStop(1, translucent(pal.accent, alpha * 0.8));
  return gradient;
}
function mote(ctx, x, y, r, colour2, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, translucent(colour2, 0.7 * alpha));
  gradient.addColorStop(1, translucent(colour2, 0));
  return gradient;
}
function core(ctx, x, y, r, pulse) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  return gradient;
}
const xs = new Float64Array(127);
const ys = new Float64Array(127);
function flowerOfLife(ctx, _node, w, h2, k2, pal, only) {
  const { primary, secondary, accent: accent2 } = pal;
  const { quality: quality2, particleGlow: dotGlow, particleIntensity: motion2, particleSpeed: speed } = N;
  const intensity = N.intensity * 1.5;
  const cx = w / 2;
  const cy = h2 / 2;
  const phase = k2.nodePhase;
  const time = held ? phase : phase * speed;
  const radius = Math.min(w, h2) * 0.056 * intensity * N.animationSize;
  const layers2 = Math.max(2, Math.floor(quality2 * 2));
  const rotation = phase * 0.2;
  const pulse = 0.8 + Math.sin(phase * 1.5) * 0.2;
  xs[0] = cx;
  ys[0] = cy;
  let n = 1;
  for (let layer2 = 1; layer2 <= layers2; layer2++) {
    const circles = layer2 * 6;
    for (let i = 0; i < circles; i++, n++) {
      const angle = i / circles * Math.PI * 2 + rotation;
      xs[n] = cx + Math.cos(angle) * (radius * 2) * layer2;
      ys[n] = cy + Math.sin(angle) * (radius * 2) * layer2;
    }
  }
  if (!only) {
    const blur = 15 * intensity * N.animationGlow;
    const reach2 = 1 + 1.5 * blur;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.shadowColor = primary;
    ctx.shadowBlur = blur;
    if (circle(cx, cy, radius * pulse + reach2)) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let layer2 = 1, j = 1; layer2 <= layers2; layer2++) {
      for (let index = 0; index < layer2 * 6; index++, j++) {
        if (j > 1 && index > 0 && shows(Math.min(xs[j - 1], xs[j]) - reach2, Math.min(ys[j - 1], ys[j]) - reach2, Math.max(xs[j - 1], xs[j]) + reach2, Math.max(ys[j - 1], ys[j]) + reach2)) {
          ctx.beginPath();
          ctx.moveTo(xs[j - 1], ys[j - 1]);
          ctx.lineTo(xs[j], ys[j]);
          ctx.strokeStyle = secondary;
          ctx.globalAlpha = 0.3 * pulse * fade;
          ctx.stroke();
        }
        if (circle(xs[j], ys[j], radius * pulse + reach2)) {
          ctx.beginPath();
          ctx.arc(xs[j], ys[j], radius * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = index % 2 === 0 ? secondary : accent2;
          ctx.globalAlpha = (1 - layer2 / (layers2 + 1)) * fade;
          ctx.stroke();
        }
      }
    }
    if (circle(cx, cy, radius * layers2 * 2 + reach2)) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2 + rotation;
        const x = cx + Math.cos(angle) * radius * layers2 * 2;
        const y = cy + Math.sin(angle) * radius * layers2 * 2;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = primary;
      ctx.globalAlpha = 0.3 * fade;
      ctx.stroke();
    }
    if (circle(cx, cy, radius * 2 + 1.5 * blur)) {
      ctx.fillStyle = kept(CORE) ?? keep$1(CORE, core(ctx, cx, cy, radius * 2, pulse));
      ctx.globalAlpha = 0.3 * fade;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (N.particleShow) {
    const count2 = Math.floor(5 * N.particleDensity * motion2 * thin);
    const dot = 2 * quality2 * N.particleSize;
    const rate = held ? 0 : TURN * N.animationSpeed * speed;
    for (let j = 0; j < n; j++) {
      for (let p = 0; p < count2; p++) {
        const angle = p / count2 * Math.PI * 2 + time * 2 * motion2;
        const x = xs[j] + Math.cos(angle) * (radius * 0.5 * motion2);
        const y = ys[j] + Math.sin(angle) * (radius * 0.5 * motion2);
        if (!circle(x, y, dot + 1.5 * 10 * dotGlow)) continue;
        const colour2 = kept(DOTS + j * count2 + p) ?? keep$1(DOTS + j * count2 + p, particleColour(pal, j * count2 + p, time, rate));
        ctx.beginPath();
        ctx.arc(x, y, dot, 0, Math.PI * 2);
        ctx.fillStyle = colour2;
        ctx.shadowColor = colour2;
        ctx.shadowBlur = 10 * dotGlow;
        ctx.globalAlpha = 0.7 * dotGlow * fade;
        ctx.fill();
      }
    }
  }
}
const EFFECTS = [gentlePulse, gentlePulse, neonNexus, cosmicRipple, flowerOfLife];
function frame$1(ctx, w, h2, pal) {
  const blur = 15 * (N.glow * 2);
  ctx.shadowColor = pal.accent;
  ctx.shadowBlur = blur * 1.5;
  ctx.strokeStyle = pal.secondary;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fade;
  ctx.strokeRect(0, 0, w, h2);
}
function drawNodeFx(ctx, style, node2, w, h2, k2, p, alpha, only) {
  part$1 = p;
  fade = alpha;
  held = holdsStill();
  thin = adaptive.level >= THIN ? 0.5 : 1;
  outlined = style > 0 && N.colorHoverShow && !LiteGraph.vueNodesMode && Boolean(node2.selected || node2.mouseOver);
  const pal = nodePalette(style);
  mine$1 = makes(ctx, pal, w, h2, held ? STILL_NODE : k2, p.sides);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.globalAlpha = fade;
  const saves = depth;
  try {
    EFFECTS[style](ctx, node2, w, h2, held ? STILL_NODE : k2, pal, only);
    if (outlined && style > 1) outline(ctx, 0, 0, w, h2, node2.selected, translucent);
    if (style > 0 && !only && N.selectionGlow && node2.selected) frame$1(ctx, w, h2, pal);
  } finally {
    while (depth > saves) restore(ctx);
  }
}
function reach(style, w, h2, only) {
  const { quality: quality2, animationGlow: glow2, animationSize: size, particleShow: dots, particleSize: dotSize, particleGlow: dotGlow, particleIntensity: motion2 } = N;
  const intensity = N.intensity * 1.5;
  const long = Math.max(w, h2);
  const short = Math.min(w, h2);
  let r = 0;
  if (style > 0 && N.colorHoverShow) r = 1 + 1.5 * 15 * glow2 * 1.5;
  if (style > 0 && !only && N.selectionGlow) r = Math.max(r, 1 + 1.5 * 45 * N.glow);
  switch (style) {
    case 2: {
      const line = long * 75e-4 * size;
      if (!only) r = Math.max(r, 4 + line, line + 1.5 * 48 * intensity * glow2, line + 1.5 * 15 * intensity, 0.6 * short * size + 0.5);
      if (dots) r = Math.max(r, 1.1 * short * size + 2 + 2.6 * dotSize + 7.5 * dotGlow);
      return r;
    }
    case 3: {
      const rings = 0.7 * short * size + 1.5 * intensity + 1.5 * Math.max(2, 15 * glow2);
      const corona = 0.7 * long * (0.8 + 0.2 * motion2) + 2 * (2 * dotSize + 1.5 * motion2) + 1.5 * 15 * dotGlow;
      return Math.max(r, (only ? 0 : rings) - short / 2, (dots ? corona : 0) - short / 2);
    }
    case 4: {
      const radius = short * 0.056 * intensity * size;
      const rings = 2 * radius * Math.max(2, Math.floor(quality2 * 2));
      const pattern = rings + radius + 1 + 1.5 * 15 * intensity * glow2;
      const circling = rings + 0.5 * radius * motion2 + 2 * quality2 * dotSize + 1.5 * 10 * dotGlow;
      return Math.max(r, (only ? 0 : pattern) - short / 2, (dots ? circling : 0) - short / 2);
    }
    default: {
      const radius = long * (0.5 + quality2 * 0.1) * size;
      const light2 = radius * (1.2 + 0.4 * glow2) * (0.4 + 0.3 * intensity);
      const blur = !only && quality2 > 1 ? 1.5 * 10 * glow2 * quality2 * 0.5 : 0;
      const fireflies = 1.7 * radius + 4.5 * motion2 + 12 + 2.8 * (4 + quality2) * size * dotSize + blur;
      return Math.max(r, (only ? 0 : light2) - short / 2, (dots ? fireflies : 0) - short / 2);
    }
  }
}
const WIDTH = 320;
const HEIGHT = 200;
const FRAME_MS = 1e3 / 30;
const LOOK_MS = 1e3 / 15;
const SPLINE = 2;
const RIGHT = 4;
const LEFT = 3;
const CLASSIC = 9;
const LINK_COLOR = "#9A9";
const MOVING_ALL = { links: 1, nodes: 1, particles: 1, bursts: 0, marks: 0, flows: 0, rings: 0 };
const k = { ...clock };
const segment = new Segment();
const wire = new Wire();
const linksStill = () => L.staticMode || heldByRun(L.pauseDuringRender) || env.reducedMotion;
function link(ctx, animate, a, b, k2) {
  segment.pal = palette(LGraphCanvas.link_type_colors.IMAGE) ?? palette(app.canvas.default_link_color) ?? palette(LINK_COLOR);
  ctx.save();
  if (!animate) {
    segment.path.set(a, b, RIGHT, LEFT, app.canvas.links_render_mode);
    if (wired()) rest(wire, segment.path);
    segment.path.draw(ctx, segment.pal.native, app.canvas.connections_width);
  } else {
    segment.lay(a, b, RIGHT, LEFT, SPLINE);
    if (wired()) {
      segment.path.set(a, b, RIGHT, LEFT, SPLINE);
      rest(wire, segment.path);
      segment.len = segment.path.length;
    }
    segment.chain = segment.len;
    const still = linksStill();
    segment.isStatic = still;
    drawBase(ctx, segment, animate, still);
    if (still) STILL[animate]?.(ctx, segment, STILL_PHASE);
    else MOVING[animate]?.(ctx, segment, k2);
    if (animate === CLASSIC || L.markerAll) drawMarkers(ctx, segment, still ? STILL_PHASE : k2.linkPhase, still ? void 0 : k2.linkFlow);
  }
  ctx.restore();
}
const part = { sides: UNDER | OVER, x0: 0, y0: 0, x1: 0, y1: 0, round: 0 };
const node = { id: 0, title: "", size: [0, 0], selected: false };
function box(ctx, style, x, y, w, h2, k2) {
  const title = LiteGraph.NODE_TITLE_HEIGHT;
  const round2 = LiteGraph.ROUND_RADIUS;
  ctx.save();
  ctx.translate(x, y);
  if (style && N.glowShow) {
    ctx.shadowColor = nodePalette(style).primary;
    ctx.shadowBlur = 10 * N.glow;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 2;
  }
  ctx.beginPath();
  ctx.roundRect(0, -title, w, h2 + title, round2);
  ctx.fillStyle = LiteGraph.NODE_DEFAULT_BGCOLOR;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.roundRect(0, -title, w, title, [round2, round2, 0, 0]);
  ctx.fillStyle = LiteGraph.NODE_DEFAULT_COLOR;
  ctx.fill();
  const only = !style || !N.animationsEnabled;
  if (N.particleShow || !only) {
    node.size[0] = w;
    node.size[1] = h2;
    Object.assign(part, { x0: 0, y0: -title, x1: w, y1: h2, round: round2 });
    drawNodeFx(ctx, style, node, w, h2, k2, part, 1, only);
  }
  ctx.restore();
}
const linkScene = (animate) => (ctx, k2) => link(ctx, animate, [24, 150], [296, 50], k2);
const nodeScene = (style) => (ctx, k2) => box(ctx, style, 70, 75, 180, 100, k2);
const lookScene = (look) => (ctx, k2) => drawLook(look, () => {
  link(ctx, L.animate, [104, 70], [216, 130], k2);
  box(ctx, N.animate, 20, 55, 84, 90, k2);
  box(ctx, N.animate, 216, 115, 84, 70, k2);
});
const tiles = /* @__PURE__ */ new WeakMap();
const shown = /* @__PURE__ */ new Set();
const observer = new IntersectionObserver(seen);
let frame = 0;
let last = 0;
function tile(scene, ms = FRAME_MS) {
  const canvas = document.createElement("canvas");
  canvas.className = "eln-tile-canvas";
  tiles.set(canvas, { canvas, scene, ms, drawn: 0 });
  observer.observe(canvas);
  return canvas;
}
const lookTile = (look) => tile(lookScene(look), LOOK_MS);
function seen(entries) {
  for (const entry2 of entries) {
    const t = tiles.get(entry2.target);
    if (!entry2.isIntersecting || !entry2.target.isConnected) shown.delete(t);
    else if (!shown.has(t)) {
      shown.add(t);
      paint(t);
    }
  }
  frame ||= requestAnimationFrame(tick);
}
function repaint() {
  frame ||= requestAnimationFrame(tick);
}
function stopTiles(within) {
  for (const canvas of within.querySelectorAll(".eln-tile-canvas")) {
    observer.unobserve(canvas);
    shown.delete(tiles.get(canvas));
  }
}
function tick(now) {
  frame = 0;
  if (!shown.size) {
    last = 0;
    return;
  }
  if (env.reducedMotion) {
    last = 0;
    for (const t of shown) paint(t);
    return;
  }
  if (now - last >= FRAME_MS - 1) {
    advance(k, last ? Math.min((now - last) / 1e3, 0.1) : 0, MOVING_ALL);
    last = now;
    for (const t of shown) {
      if (now - t.drawn < t.ms - 1) continue;
      t.drawn = now;
      paint(t);
    }
  }
  frame = requestAnimationFrame(tick);
}
function paint(t) {
  const { canvas, scene } = t;
  const width = Math.round(canvas.clientWidth * devicePixelRatio);
  const height = Math.round(canvas.clientHeight * devicePixelRatio);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
  const ctx = canvas.getContext("2d");
  ctx.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0);
  ctx.fillStyle = app.canvas.clear_background_color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  try {
    scene(ctx, k);
  } catch (error) {
    shown.delete(t);
    console.warn("[Enhanced Links & Nodes] A gallery tile failed:", error);
  } finally {
    ctx.restore();
  }
}
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value !== void 0 && value !== false) el.setAttribute(name, value === true ? "" : String(value));
  }
  el.append(...children);
  return el;
}
function iconButton(icon, label, onClick, attrs = {}) {
  const button2 = h("button", { type: "button", class: "eln-tool", "aria-label": label, title: label, ...attrs }, h("i", { class: `pi ${icon}`, "aria-hidden": "true" }));
  button2.addEventListener("click", onClick);
  return button2;
}
function button(label, onClick, attrs = {}) {
  const el = h("button", { type: "button", class: "eln-button", ...attrs }, label);
  el.addEventListener("click", onClick);
  return el;
}
const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
function roving(group, items, move) {
  group.addEventListener("keydown", (event) => {
    const at = items.indexOf(event.target);
    if (at < 0) return;
    const to = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key in STEP ? (at + STEP[event.key] + items.length) % items.length : -1;
    if (to < 0) return;
    event.preventDefault();
    for (const item of items) item.tabIndex = item === items[to] ? 0 : -1;
    items[to].focus();
    move?.(items[to]);
  });
}
function check(items, at) {
  items.forEach((item, i) => {
    item.setAttribute("aria-checked", String(i === at));
    item.tabIndex = i === at || at < 0 && i === 0 ? 0 : -1;
  });
}
let unhover;
const hovering = () => unhover !== void 0;
function hover(el, start) {
  el.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    endHover();
    unhover = () => {
    };
    unhover = start();
  });
  el.addEventListener("pointerleave", endHover);
  el.addEventListener("click", endHover);
}
function endHover() {
  const end2 = unhover;
  unhover = void 0;
  end2?.();
}
const GALLERIES = {
  "🔗 Enhanced Links.Animate": linkScene,
  "📦 Enhanced Nodes.Animate": nodeScene
};
function toggle(s, id) {
  const el = h("button", { type: "button", role: "switch", id, class: "eln-switch" });
  el.addEventListener("click", () => commit(s.id, !shown$3(s.id)));
  return { el, update: (value) => el.setAttribute("aria-checked", String(value)) };
}
function slider(s, id) {
  const range = h("input", { type: "range", id, min: s.min, max: s.max, step: s.step, class: "eln-range" });
  const number = h("input", { type: "number", min: s.min, max: s.max, step: s.step, class: "eln-number", "aria-label": `${s.name}, value` });
  range.addEventListener("input", () => {
    number.value = range.value;
    preview(s.id, Number(range.value));
  });
  range.addEventListener("change", () => commit(s.id, Number(range.value)));
  number.addEventListener("change", () => {
    if (number.value === "") number.value = String(shown$3(s.id));
    else commit(s.id, Number(number.value));
  });
  return {
    el: h("div", { class: "eln-slider" }, range, number),
    wide: true,
    update(value) {
      range.value = number.value = String(value);
    }
  };
}
const fits = (s) => s.options.length <= 3 && s.options.reduce((n, o) => n + o.text.length, 0) <= 28;
function choice(s, id, label) {
  const index = (value) => s.options.findIndex((o) => o.value === value);
  const scene = GALLERIES[s.id];
  if (scene || fits(s)) {
    const items = s.options.map((o) => {
      const item = scene ? h("button", { type: "button", role: "radio", class: "eln-tile" }, tile(scene(Number(o.value))), h("span", { class: "eln-tile-name" }, o.text)) : h("button", { type: "button", role: "radio", class: "eln-segment" }, o.text);
      if (scene) hover(item, () => {
        preview(s.id, o.value);
        return () => restore$1([s.id]);
      });
      item.addEventListener("click", () => commit(s.id, o.value));
      return item;
    });
    const el = h("div", { role: "radiogroup", id, class: scene ? "eln-gallery" : "eln-segments", "aria-labelledby": label }, ...items);
    roving(el, items, scene ? void 0 : (item) => item.click());
    return { el, wide: true, update: (value) => check(items, index(value)) };
  }
  const select = h("select", { id, class: "eln-select" }, ...s.options.map((o, i) => h("option", { value: i }, o.text)));
  select.addEventListener("change", () => commit(s.id, s.options[select.selectedIndex].value));
  return {
    el: select,
    // Choices too long to share a line with the name at the panel's default width take one of their own.
    wide: s.options.some((o) => o.text.length > 20),
    update(value) {
      select.selectedIndex = index(value);
    }
  };
}
function colour(s, id) {
  const well = h("input", { type: "color", id, class: "eln-well" });
  const hex2 = h("input", { type: "text", class: "eln-hex", maxlength: 9, spellcheck: "false", "aria-label": `${s.name}, hex code` });
  well.addEventListener("input", () => {
    hex2.value = well.value;
    preview(s.id, well.value);
  });
  well.addEventListener("change", () => commit(s.id, well.value));
  hex2.addEventListener("change", () => {
    if (HEX$1.test(hex2.value)) commit(s.id, hex2.value);
    else hex2.value = String(shown$3(s.id));
  });
  return {
    el: h("div", { class: "eln-colour" }, well, hex2),
    update(value) {
      hex2.value = String(value);
      well.value = String(value).slice(0, 7);
    }
  };
}
function text(s, value) {
  if (s.type === "combo") return s.options.find((o) => o.value === value)?.text ?? String(value);
  if (s.type === "boolean") return value ? "On" : "Off";
  return String(value);
}
let ids$1 = 0;
function row(s, found2 = false) {
  const id = `eln-${++ids$1}`;
  const label = `${id}-label`;
  const control = s.type === "boolean" ? toggle(s, id) : s.type === "slider" ? slider(s, id) : s.type === "combo" ? choice(s, id, label) : colour(s, id);
  const modified = h("span", { class: "eln-sr" }, " (modified)");
  const name = h(control.el.getAttribute("role") === "radiogroup" ? "span" : "label", { id: label, class: "eln-name", for: id, title: s.tooltip }, s.name, modified);
  const reset2 = h(
    "button",
    { type: "button", class: "eln-reset", "aria-label": `Reset ${s.name} to ${text(s, s.default)}`, title: `Reset to ${text(s, s.default)}` },
    h("i", { class: "pi pi-undo", "aria-hidden": "true" })
  );
  reset2.addEventListener("click", () => {
    commit(s.id, s.default);
    (control.el.querySelector('input, [tabindex="0"]') ?? control.el).focus();
  });
  const reason = h("span");
  const fix = h("button", { type: "button", class: "eln-link" });
  const need2 = h("p", { class: "eln-need" }, reason, " ", fix);
  const head = h("div", { class: "eln-row-head" }, h("span", { class: "eln-dot", "aria-hidden": "true" }), name);
  if (found2 && "advanced" in s) head.append(h("span", { class: "eln-tag" }, "Advanced"));
  head.append(reset2);
  if (!control.wide) head.append(control.el);
  const el = h("div", { class: "eln-row", "data-setting": s.id }, head);
  if (control.wide) el.append(control.el);
  el.append(need2);
  return {
    setting: s,
    el,
    update() {
      const value = shown$3(s.id);
      control.update(value);
      const changed2 = value !== s.default;
      el.classList.toggle("eln-row--modified", changed2);
      modified.hidden = reset2.hidden = !changed2;
      el.hidden = !found2 && !(s.showIf?.() ?? true);
      const needs = s.needs?.();
      need2.hidden = !needs;
      control.el.toggleAttribute("inert", Boolean(needs));
      control.el.classList.toggle("eln-off", Boolean(needs));
      if (needs) {
        const ours2 = setting(needs.id);
        reason.textContent = needs.reason;
        fix.textContent = needs.label ?? `Use ${text(ours2, needs.value)}`;
        fix.onclick = () => ours2 ? commit(needs.id, needs.value) : void app.extensionManager.setting.set(needs.id, needs.value);
      }
    }
  };
}
const css = `/*
 * The panel, on ComfyUI's own tokens so it follows the palette: the palette's
 * --fg-color and --comfy-menu-bg, and the frontend's --interface-stroke,
 * --secondary-background and --primary-background (1.39.5 to 1.60), with
 * fallbacks. It paints no background of its own but the sidebar's. Muted text
 * is the text colour at 72 %, which keeps 4.5:1 on the palettes' menus and
 * controls; an accent never carries text.
 */

/* The brand mark, the rail icon too: a link with a spark, in the current colour. */
.eln-icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    background: currentColor;
    --eln-mark: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3Cpath d='M5.5 1.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z' fill='black' stroke='none'/%3E%3C/svg%3E");
    -webkit-mask: var(--eln-mark) center / contain no-repeat;
    mask: var(--eln-mark) center / contain no-repeat;
}

.eln {
    --eln-fg: var(--fg-color, #fff);
    --eln-muted: color-mix(in srgb, var(--eln-fg) 72%, transparent);
    --eln-surface: var(--comfy-menu-bg, #171718);
    --eln-stroke: var(--interface-stroke, var(--border-color, #4e4e4e));
    --eln-control: var(--secondary-background, var(--comfy-input-bg, #262729));
    --eln-control-hover: var(--secondary-background-hover, var(--eln-stroke));
    --eln-accent: var(--primary-background, #0b8ce9);
    /* Rings and selected outlines: the accent toward the text colour, at least 3:1 on light menus too. */
    --eln-accent-strong: color-mix(in srgb, var(--eln-accent) 70%, var(--eln-fg));
    --eln-tint: color-mix(in srgb, var(--eln-accent) 18%, var(--eln-surface));
    --eln-ring: var(--eln-fg);
    --eln-ease: cubic-bezier(0.2, 0.8, 0.2, 1);

    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    color: var(--eln-fg);
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.35;
}

.eln *,
.eln *::before,
.eln *::after {
    box-sizing: border-box;
}

.eln button,
.eln input,
.eln select {
    font: inherit;
    color: inherit;
}

.eln button {
    cursor: pointer;
}

.eln :focus-visible {
    outline: 2px solid var(--eln-ring);
    outline-offset: 2px;
}

.eln [hidden] {
    display: none !important;
}

.eln-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}

/* Header, as the native tabs have it. */
.eln-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 4rem;
    padding-inline: 1rem 0.5rem;
    border-bottom: 1px solid var(--eln-stroke);
}

.eln-mark {
    flex: none;
    font-size: 1.125rem;
    margin-inline-end: 0.25rem;
}

/* A little under 1rem, so the whole name fits beside the tools at the sidebar's default width. */
.eln-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.eln-tool {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--eln-muted);
    transition: background-color 120ms var(--eln-ease), color 120ms var(--eln-ease);
}

.eln-tool:hover,
.eln-tool[aria-pressed='true'] {
    background: var(--eln-control);
    color: var(--eln-fg);
}

.eln-tool[aria-pressed='true'] {
    box-shadow: inset 0 0 0 1px var(--eln-accent-strong);
}

/* Quick bar: the chips, then the Look, which takes the rest of the chips' last line where it has room. */
.eln-quick {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.375rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--eln-stroke);
}

.eln-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 1.75rem;
    padding: 0.125rem 0.625rem 0.125rem 0.5rem;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.375rem;
    background: transparent;
    color: var(--eln-muted);
    transition: background-color 120ms var(--eln-ease), border-color 120ms var(--eln-ease);
}

/* On, off and mixed show by the chip's dot as well as its colours. */
.eln-chip::before {
    content: '';
    width: 0.4375rem;
    height: 0.4375rem;
    border: 1.5px solid currentColor;
    border-radius: 50%;
}

.eln-chip[aria-pressed='true'] {
    border-color: var(--eln-accent-strong);
    background: var(--eln-tint);
    color: var(--eln-fg);
}

.eln-chip[aria-pressed='true']::before {
    background: currentColor;
}

.eln-chip[aria-pressed='mixed'] {
    border-color: var(--eln-accent-strong);
    color: var(--eln-fg);
}

.eln-chip[aria-pressed='mixed']::before {
    background: linear-gradient(90deg, currentColor 50%, transparent 50%);
}

.eln-chip:hover {
    background: var(--eln-control);
}

.eln-look {
    position: relative;
    display: flex;
    flex: 1 1 9rem;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
}

.eln-look-label {
    color: var(--eln-muted);
}

.eln-look > .eln-select {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex: 1;
    min-width: 0;
    max-width: none;
    text-align: start;
}

.eln-look-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.eln-look .pi-chevron-down {
    font-size: 0.625rem;
    color: var(--eln-muted);
}

/* The Look menu, over the panel below the quick bar. */
.eln-menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    inset-inline: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    max-height: 20rem;
    padding: 0.25rem;
    overflow-y: auto;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.5rem;
    background: var(--eln-surface);
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.3);
}

.eln-menu > [role='group'] {
    display: flex;
    flex-direction: column;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid var(--eln-stroke);
}

.eln-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2rem;
    padding: 0 0.5rem;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    text-align: start;
}

.eln-menu-item:hover,
.eln-menu-item:focus-visible {
    background: var(--eln-control);
}

.eln-menu-item > .pi {
    font-size: 0.625rem;
}

.eln-menu-item[aria-checked='false'] > .pi {
    visibility: hidden;
}

/* Tabs, with the living underline in the palette's link colours. */
.eln-tabs {
    display: flex;
    padding-inline: 0.375rem;
    overflow-x: auto;
    border-bottom: 1px solid var(--eln-stroke);
    scrollbar-width: none;
}

.eln-tab {
    position: relative;
    flex: none;
    min-height: 2.5rem;
    padding: 0 0.4375rem;
    border: 0;
    background: transparent;
    color: var(--eln-muted);
    font-weight: 500;
}

.eln-tab:hover {
    color: var(--eln-fg);
}

.eln-tab[aria-selected='true'] {
    color: var(--eln-fg);
    font-weight: 600;
}

.eln-tab[aria-selected='true']::after {
    content: '';
    position: absolute;
    inset-inline: 0.375rem;
    bottom: -1px;
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(90deg, var(--eln-link-1, #64b5f6), var(--eln-link-2, #ff9cf9), var(--eln-link-3, #b39ddb), var(--eln-link-1, #64b5f6));
    background-size: 300% 100%;
    animation: eln-drift 8s linear infinite;
}

@keyframes eln-drift {
    to {
        background-position: 150% 0;
    }
}

/* Search */
.eln-find {
    position: relative;
    padding: 0.5rem 1rem;
}

.eln-find > .pi {
    position: absolute;
    inset-inline-start: 1.625rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--eln-muted);
    font-size: 0.75rem;
    pointer-events: none;
}

.eln-search {
    width: 100%;
    height: 2rem;
    padding-inline: 1.75rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: var(--eln-control);
}

.eln-search::placeholder,
.eln-hex::placeholder {
    color: var(--eln-muted);
    opacity: 1;
}

/* Body: the panel's one scroller. */
.eln-body {
    flex: 1 1 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 1rem;
}

.eln-section {
    padding: 0.25rem 1rem;
}

.eln-section + .eln-section {
    border-top: 1px solid var(--eln-stroke);
}

.eln-section-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.eln-section-head h3 {
    flex: 1;
    margin: 0;
    font-size: inherit;
}

.eln-section-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 2.25rem;
    padding: 0;
    border: 0;
    background: transparent;
    font-weight: 600;
    text-align: start;
}

.eln-section-toggle .pi {
    font-size: 0.625rem;
    color: var(--eln-muted);
    transition: transform 120ms var(--eln-ease);
}

.eln-section-toggle[aria-expanded='false'] .pi {
    transform: rotate(-90deg);
}

.eln-count,
.eln-tag {
    flex: none;
    padding: 0.0625rem 0.375rem;
    border-radius: 0.375rem;
    background: var(--eln-control);
    color: var(--eln-muted);
    font-size: 0.6875rem;
    white-space: nowrap;
}

.eln-heading,
.eln-crumb {
    margin: 0.5rem 0;
    font-size: inherit;
    font-weight: 600;
}

.eln-crumb {
    color: var(--eln-muted);
}

.eln-section-body {
    padding-bottom: 0.5rem;
}

/* A setting's row: name and small controls on one line, wide controls under it. */
.eln-row {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding-block: 0.3125rem;
}

.eln-row-head {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2rem;
}

.eln-name {
    flex: 1;
    min-width: 0;
}

.eln-dot {
    flex: none;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: var(--eln-accent-strong);
}

.eln-row-head > .eln-dot {
    visibility: hidden;
    margin-inline-start: -0.625rem;
    margin-inline-end: -0.125rem;
}

.eln-row--modified > .eln-row-head > .eln-dot {
    visibility: visible;
}

.eln-reset {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--eln-muted);
    font-size: 0.75rem;
    opacity: 0;
    transition: opacity 120ms var(--eln-ease);
}

.eln-row:hover .eln-reset,
.eln-reset:focus-visible {
    opacity: 1;
}

.eln-reset:hover {
    background: var(--eln-control);
    color: var(--eln-fg);
}

.eln-off {
    opacity: 0.45;
}

.eln-need {
    margin: 0;
    color: var(--eln-muted);
    font-size: 0.75rem;
}

.eln-link {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--eln-fg);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.eln-more {
    margin-top: 0.25rem;
    color: var(--eln-muted);
    font-size: 0.75rem;
}

/* Controls */
.eln-switch {
    position: relative;
    flex: none;
    width: 2.25rem;
    height: 1.25rem;
    padding: 0;
    border: 0;
    border-radius: 1rem;
    background: var(--border-default, var(--eln-stroke));
    transition: background-color 120ms var(--eln-ease);
}

.eln-switch::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    inset-inline-start: 0.125rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--base-background, var(--eln-surface));
    transition: transform 120ms var(--eln-ease);
}

.eln-switch[aria-checked='true'] {
    background: var(--eln-accent);
}

.eln-switch[aria-checked='true']::after {
    transform: translateX(1rem);
}

.eln-select,
.eln-number,
.eln-hex {
    height: 2rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: var(--eln-control);
}

/* At most half the row, so the name beside it keeps to one line; a list of long choices has a line of its own. */
.eln-select {
    max-width: 50%;
    padding-inline: 0.5rem;
}

.eln-row > .eln-select {
    max-width: none;
}

.eln-select:hover,
.eln-search:hover {
    background: var(--eln-control-hover);
}

.eln-select option,
.eln-select optgroup {
    background: var(--eln-surface);
}

.eln-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.eln-range {
    flex: 1;
    min-width: 0;
    accent-color: var(--eln-accent);
}

.eln-number {
    width: 4.5rem;
    padding-inline: 0.5rem;
    font-variant-numeric: tabular-nums;
}

.eln-segments {
    display: flex;
    padding: 0.125rem;
    border-radius: 0.5rem;
    background: var(--eln-control);
}

.eln-segment {
    flex: 1 1 auto;
    min-height: 1.75rem;
    padding: 0 0.5rem;
    white-space: nowrap;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--eln-muted);
}

.eln-segment[aria-checked='true'] {
    background: var(--eln-surface);
    box-shadow: inset 0 0 0 1px var(--eln-accent-strong);
    color: var(--eln-fg);
    font-weight: 600;
}

.eln-colour {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.eln-well {
    width: 2rem;
    height: 2rem;
    padding: 0.1875rem;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.5rem;
    background: transparent;
}

.eln-hex {
    width: 5.25rem;
    padding-inline: 0.5rem;
    font-variant-numeric: tabular-nums;
}

/* Galleries of live tiles. */
.eln-gallery,
.eln-looks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: 0.5rem;
}

.eln-looks {
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
}

.eln-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    padding: 0.25rem 0.25rem 0.375rem;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.5rem;
    background: transparent;
    text-align: start;
    transition: border-color 120ms var(--eln-ease);
}

.eln-tile:hover {
    border-color: var(--eln-muted);
}

.eln-tile[aria-checked='true'] {
    border-color: var(--eln-accent-strong);
    box-shadow: inset 0 0 0 1px var(--eln-accent-strong);
}

/* A tick as well as the outline. */
.eln-tile[aria-checked='true']::after {
    content: '\\e909';
    position: absolute;
    top: 0.375rem;
    inset-inline-end: 0.375rem;
    display: grid;
    place-items: center;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    background: var(--eln-surface);
    color: var(--eln-fg);
    font-family: primeicons;
    font-size: 0.625rem;
}

.eln-tile-canvas {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 0.375rem;
}

.eln-tile-name {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding-inline: 0.125rem;
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.eln-tile-text {
    display: -webkit-box;
    padding-inline: 0.125rem;
    overflow: hidden;
    color: var(--eln-muted);
    font-size: 0.6875rem;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

/* Looks */
.eln-mine-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 2.25rem;
}

.eln-mine-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.eln-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-block: 0.5rem;
}

.eln-button {
    min-height: 1.75rem;
    padding: 0 0.625rem;
    border: 0;
    border-radius: 0.5rem;
    background: var(--eln-control);
}

.eln-button:hover {
    background: var(--eln-control-hover);
}

.eln-hint {
    margin: 0.25rem 0;
    color: var(--eln-muted);
}

.eln-adaptive {
    margin: 0;
    padding: 0.5rem 1rem 0.25rem;
}

.eln-errors {
    margin: 0.25rem 0;
    padding-inline-start: 1.25rem;
    color: var(--eln-muted);
    font-size: 0.75rem;
}

/* Notices */
.eln-notices:not(:empty) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem 0.25rem;
}

.eln-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.5rem;
    padding: 0.5rem 0.75rem;
    border-inline-start: 3px solid var(--eln-accent-strong);
    border-radius: 0.375rem;
    background: color-mix(in srgb, var(--eln-fg) 6%, var(--eln-surface));
}

.eln-notice > span {
    flex: 1 1 12rem;
}

.eln-notice > .pi {
    color: var(--eln-accent-strong);
}

/* The undo bar of a frontend whose toasts take no action. */
.eln-undo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--eln-stroke);
    background: var(--eln-surface);
}

.eln-undo > span {
    flex: 1;
}

/* About */
.eln a {
    color: inherit;
    text-underline-offset: 2px;
}

.eln-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-block: 0.75rem;
}

.eln-brand > .eln-icon {
    flex: none;
    font-size: 2rem;
}

.eln-brand .eln-heading,
.eln-brand .eln-hint {
    margin: 0;
}

.eln-news {
    margin: 0 0 0.5rem;
    padding-inline-start: 1.125rem;
}

.eln-news > li + li {
    margin-top: 0.25rem;
}

a.eln-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    text-decoration: none;
}

.eln-keys {
    margin: 0 0 0.5rem;
}

.eln-keys > dt {
    font-weight: 600;
}

.eln-keys > dd {
    margin: 0 0 0.375rem;
    color: var(--eln-muted);
}

.eln-confirm {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-inline-start: 3px solid var(--eln-accent-strong);
    border-radius: 0.375rem;
    background: color-mix(in srgb, var(--eln-fg) 6%, var(--eln-surface));
}

.eln-confirm > p {
    flex: 1 1 100%;
    margin: 0;
}

.eln-diagnostics {
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.5rem;
    background: var(--eln-control);
    color: inherit;
    font: inherit;
    font-size: 0.75rem;
    resize: vertical;
}

.eln-studio {
    padding-block: 0.5rem;
}

.eln-studio > summary {
    min-height: 1.5rem;
    font-weight: 600;
    cursor: pointer;
}

/*
 * The first-run look picker, and the undo of a pick where toasts take no action and the panel is closed: a card over
 * the canvas's bottom-left, under ComfyUI's menus, dialogs and toasts, and right of the canvas info LiteGraph draws
 * in the corner.
 */
.eln.eln-picker,
.eln.eln-picker-undo,
.eln.eln-chipbar {
    position: absolute;
    inset-inline-start: 8rem;
    bottom: 1rem;
    z-index: 1000;
    height: auto;
    border: 1px solid var(--eln-stroke);
    border-radius: 0.75rem;
    background: var(--eln-surface);
    box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.3);
    pointer-events: auto;
}

.eln.eln-picker {
    gap: 0.625rem;
    width: min(24rem, calc(100% - 9rem));
    max-height: calc(100% - 2rem);
    padding: 0.75rem 1rem 1rem;
    overflow-y: auto;
}

.eln-picker-close {
    position: absolute;
    top: 0.5rem;
    inset-inline-end: 0.5rem;
}

/* The card takes the focus as it shows: the accent marks it, as the text colour would glare around a whole card. */
.eln-picker:focus-visible {
    outline: 2px solid var(--eln-accent-strong);
    outline-offset: 2px;
}

.eln-picker-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 1.5rem;
    padding-inline-end: 2rem;
}

.eln-picker-more,
.eln-picker-foot > .eln-hint {
    margin: 0;
    color: var(--eln-muted);
}

.eln-picker-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
}

.eln-picker-foot > .eln-hint {
    flex: 1 1 100%;
}

.eln-button--primary {
    background: var(--eln-tint);
    box-shadow: inset 0 0 0 1px var(--eln-accent-strong);
}

.eln.eln-picker-undo {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
}

/* A chip, at the foot of the canvas in the middle, where neither version puts controls of its own. */
.eln.eln-chipbar {
    inset-inline: auto;
    left: 50%;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    max-width: calc(100% - 2rem);
    padding: 0.375rem;
    transform: translateX(-50%);
    white-space: nowrap;
}

.eln-chipbar > span {
    overflow: hidden;
    padding-inline: 0.5rem;
    text-overflow: ellipsis;
}

/* Less motion, as Motion says, or as the system or ComfyUI's Disable animations asks unless Motion is Full. */
.eln--still *,
.eln--still *::after,
.disable-animations .eln:not(.eln--full) *,
.disable-animations .eln:not(.eln--full) *::after {
    animation: none !important;
    transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
    .eln:not(.eln--full) *,
    .eln:not(.eln--full) *::after {
        animation: none !important;
        transition: none !important;
    }
}
`;
const TAB = "enhanced-links-nodes";
const TOGGLE = `Workspace.ToggleSidebarTab.${TAB}`;
const TOGGLE_ALL = "EnhancedLinksNodes.ToggleAll";
const TITLE = "Enhanced Links & Nodes";
const LINKS_ON = "🔗 Enhanced Links.Enabled";
const NODES_ON = "📦 Enhanced Nodes.Enabled";
const FROZEN = ["🔗 Enhanced Links.Static.Mode", "📦 Enhanced Nodes.Static.Mode"];
const FOCUS_ON = "🔗 Enhanced Links.Focus.Enabled";
const PANEL_STATE = "🔗 Enhanced Links.Panel.State";
const COEXIST = "🔗 Enhanced Links.Coexist";
const UNDO_MS = 8e3;
const REMEMBER_MS = 1e3;
const VISIBLE = SETTINGS.filter((s) => s.type !== "hidden");
const TABS = [
  { id: "looks", name: "Looks" },
  { id: "links", name: "Links", part: "Links" },
  { id: "nodes", name: "Nodes", part: "Nodes" },
  // Saved as runs before selection focus joined it.
  { id: "runs", name: "Focus & Flow", part: "Focus & Flow" },
  { id: "perf", name: "Perf", part: "Performance" },
  { id: "about", name: "About" }
];
const running = { links: false, nodes: false };
const DISABLED = {
  links: "Link effects are off: the enhanced.link.animations extension is disabled in Settings › Extensions.",
  nodes: "Node effects are off: the enhanced.node.animations extension is disabled in Settings › Extensions."
};
const badge = () => !L.enabled && !N.enabled ? "OFF" : L.staticMode || N.staticMode ? "‖" : "";
const BADGED = /* @__PURE__ */ new Set([LINKS_ON, NODES_ON, ...FROZEN]);
function installStyle() {
  document.head.append(h("style", { id: "eln-panel" }, css));
}
let installed = false;
function installPanel(part2) {
  running[part2] = true;
  if (installed) return;
  installed = true;
  app.extensionManager.registerSidebarTab({ id: TAB, title: TITLE, tooltip: TITLE, label: "FX", icon: "eln-icon", iconBadge: badge(), type: "custom", render, destroy });
  watch((id) => {
    const tab = BADGED.has(id) ? app.extensionManager.getSidebarTabs?.().find((t) => t.id === TAB) : void 0;
    if (tab) tab.iconBadge = badge();
  });
  installPicker();
}
let state = { ...L.panelState };
let root;
let body;
let tabs = [];
let search;
let advanced;
let panelUndo;
let undoText;
let undoButton;
let undoTimer = 0;
let applied = { undo: () => {
}, until: 0 };
let remembering = 0;
let unwatch;
let quick = () => {
};
let rows = [];
let parts = [];
let mine = [];
let unread = "";
let relist = () => {
};
const opened = /* @__PURE__ */ new Map();
const revealed = /* @__PURE__ */ new Set();
let ids = 0;
function render(container) {
  if (root?.parentElement === container) return;
  if (root) destroy();
  container.replaceChildren();
  container.style.height = "100%";
  state = { ...L.panelState };
  if (!TABS.some((t) => t.id === state.tab)) state.tab = "looks";
  advanced = iconButton("pi-sliders-h", "Advanced settings", () => {
    state = { ...state, advanced: !state.advanced };
    remember();
    refresh();
  }, { "aria-pressed": "false" });
  const close2 = iconButton("pi-times", "Close", () => void app.extensionManager.command.execute(TOGGLE));
  const header = h("header", { class: "eln-head" }, h("span", { class: "eln-icon eln-mark", "aria-hidden": "true" }), h("h2", { class: "eln-title" }, TITLE), advanced, close2);
  tabs = TABS.map((t) => {
    const tab = h("button", { type: "button", role: "tab", id: `eln-tab-${t.id}`, class: "eln-tab", "aria-controls": "eln-body" }, t.name);
    tab.addEventListener("click", () => go(t.id));
    return tab;
  });
  const tablist = h("div", { role: "tablist", class: "eln-tabs", "aria-label": TITLE }, ...tabs);
  roving(tablist, tabs, (tab) => tab.click());
  search = h("input", { type: "search", class: "eln-search", placeholder: "Search settings and looks", "aria-label": "Search settings and looks", autocomplete: "off" });
  search.value = state.search;
  search.addEventListener("input", () => {
    state = { ...state, search: search.value };
    remember();
    fill();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !search.value) return;
    event.preventDefault();
    event.stopPropagation();
    search.value = "";
    search.dispatchEvent(new Event("input"));
  });
  body = h("div", { id: "eln-body", role: "tabpanel", class: "eln-body scrollbar-custom" });
  undoText = h("span");
  undoButton = h("button", { type: "button", class: "eln-button" }, "Undo");
  panelUndo = h("div", { class: "eln-undo", role: "status", hidden: true }, undoText, undoButton);
  const colours = LGraphCanvas.link_type_colors;
  root = h("div", { class: "eln" }, header, quickBar(), tablist, h("div", { class: "eln-find" }, h("i", { class: "pi pi-search", "aria-hidden": "true" }), search), body, panelUndo);
  ["IMAGE", "LATENT", "MODEL"].forEach((type, i) => colours[type] && root.style.setProperty(`--eln-link-${i + 1}`, colours[type]));
  container.append(root);
  unwatch = watch(heard);
  guard.onTrip = nodes2.onFlip = adaptive.onStep = refresh;
  go(state.tab, false);
  void userData(async () => {
  });
}
function destroy() {
  endHover();
  if (root) stopTiles(root);
  unwatch?.();
  guard.onTrip = nodes2.onFlip = adaptive.onStep = void 0;
  clearTimeout(undoTimer);
  applied.until = 0;
  keep();
  root = void 0;
  rows = [];
  parts = [];
}
const panelShown = () => root?.isConnected === true;
function showPanel() {
  if (!panelShown()) void app.extensionManager.command.execute(TOGGLE);
}
function showTab(tab) {
  if (panelShown()) return go(tab);
  if (root) destroy();
  commit(PANEL_STATE, { ...L.panelState, tab, search: "" });
  void app.extensionManager.command.execute(TOGGLE);
}
function go(id, clicked = true) {
  if (clicked) {
    state = { ...state, tab: id, search: "" };
    search.value = "";
    remember();
  }
  tabs.forEach((tab, i) => {
    const selected2 = TABS[i].id === id;
    tab.setAttribute("aria-selected", String(selected2));
    tab.tabIndex = selected2 ? 0 : -1;
  });
  body.setAttribute("aria-labelledby", `eln-tab-${id}`);
  fill();
}
function fill() {
  endHover();
  stopTiles(body);
  rows = [];
  parts = [];
  relist = () => quick();
  const tab = TABS.find((t) => t.id === state.tab);
  const query = state.search.trim();
  body.replaceChildren(...query ? results(query) : tab.id === "looks" ? looksTab() : tab.part ? settingsTab(tab.id, tab.part) : aboutTab());
  body.scrollTop = 0;
  refresh();
}
function heard() {
  if (!hovering()) refresh();
}
function refresh() {
  if (!root) return;
  advanced.setAttribute("aria-pressed", String(state.advanced));
  for (const r of rows) r.update();
  quick();
  for (const part2 of parts) part2();
  root.classList.toggle("eln--still", L.motion === "reduce");
  root.classList.toggle("eln--full", L.motion === "full");
  repaint();
}
function remember() {
  clearTimeout(remembering);
  remembering = window.setTimeout(keep, REMEMBER_MS);
}
function keep() {
  clearTimeout(remembering);
  if (JSON.stringify(state) !== JSON.stringify(L.panelState)) commit(PANEL_STATE, state);
}
function offerUndo(title, undo, look = false) {
  const { toast } = app.extensionManager;
  const earlier = look && Date.now() < applied.until ? applied : void 0;
  const all2 = () => {
    undo();
    earlier?.undo();
  };
  const run2 = () => {
    applied.until = 0;
    all2();
  };
  if ("success" in toast) {
    const id = toast.success(title, {
      id: earlier?.toast,
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick() {
          toast.dismiss(id);
          run2();
        }
      }
    });
    if (look) applied = { undo: all2, toast: id, until: Date.now() + UNDO_MS };
    return;
  }
  if (panelShown()) {
    undoText.textContent = title;
    undoButton.onclick = () => {
      panelUndo.hidden = true;
      run2();
    };
    panelUndo.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = window.setTimeout(() => panelUndo.hidden = true, UNDO_MS);
  } else {
    undoBar(title, run2);
  }
  if (look) applied = { undo: all2, until: Date.now() + UNDO_MS };
}
function apply(look) {
  offerUndo(`${look.name} applied`, applyLook(look), true);
}
const surpriseMe = () => apply(surprise());
function resetEverything() {
  const undoValues = reset("");
  const undoLook = applyLook(LOOKS.find((look) => look.id === "subtle"));
  offerUndo("Every setting reset", () => {
    undoLook();
    undoValues();
  });
}
const keyText = (combo) => [combo.ctrl && "Ctrl", combo.alt && "Alt", combo.shift && "Shift", combo.key.length === 1 ? combo.key.toUpperCase() : combo.key].filter(Boolean).join("+");
const commandKeys = () => new Map(app.extensionManager.command.commands.flatMap((c) => c.keybinding ? [[c.id, keyText(c.keybinding.combo)]] : []));
const MAC_ONLY = /* @__PURE__ */ new Set(["Alt+¬", "Alt+˚", "Alt+∆"]);
function keyName(id) {
  const key = commandKeys().get(id);
  return key && !MAC_ONLY.has(key) ? key : void 0;
}
const toggleLinks = () => commit(LINKS_ON, !L.enabled);
const toggleNodes = () => commit(NODES_ON, !N.enabled);
const toggleFocus = () => commit(FOCUS_ON, !L.focusEnabled);
function toggleStatic() {
  const on = !(L.staticMode && N.staticMode);
  for (const id of FROZEN) commit(id, on);
}
function quickBar() {
  const chip2 = (label, click) => {
    const button2 = h("button", { type: "button", class: "eln-chip" }, label);
    button2.addEventListener("click", click);
    return button2;
  };
  const links = chip2("Link FX", toggleLinks);
  const nodes = chip2("Node FX", toggleNodes);
  const frozen = chip2("Static", toggleStatic);
  const focus2 = chip2("Focus", toggleFocus);
  const name = h("span", { class: "eln-look-name" });
  const dot = h("span", { class: "eln-dot", title: "Changed since the look was applied" }, h("span", { class: "eln-sr" }, "Changed since the look was applied"));
  const choose = h(
    "button",
    { type: "button", id: "eln-look", class: "eln-select", "aria-haspopup": "menu", "aria-expanded": "false", "aria-labelledby": "eln-look-label eln-look" },
    name,
    dot,
    h("i", { class: "pi pi-chevron-down", "aria-hidden": "true" })
  );
  let menu;
  const away = (event) => {
    if (!menu?.contains(event.target) && !choose.contains(event.target)) shut();
  };
  const shut = (refocus = false) => {
    menu?.remove();
    menu = void 0;
    choose.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", away, true);
    if (refocus) choose.focus();
  };
  choose.addEventListener("click", () => {
    if (menu) return shut();
    const current2 = currentLook();
    const items = [...LOOKS, ...mine].map((look) => {
      const item = h(
        "button",
        { type: "button", role: "menuitemradio", class: "eln-menu-item", "aria-checked": look.id === current2?.id ? "true" : "false", tabindex: -1 },
        look.name,
        h("i", { class: "pi pi-check", "aria-hidden": "true" })
      );
      item.addEventListener("click", () => {
        shut(true);
        apply(look);
      });
      return item;
    });
    menu = h("div", { role: "menu", class: "eln-menu", "aria-labelledby": "eln-look-label" }, ...items.slice(0, LOOKS.length));
    if (mine.length) menu.append(h("div", { role: "group", "aria-label": "My looks" }, ...items.slice(LOOKS.length)));
    roving(menu, items);
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Tab") shut(true);
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      shut(true);
    });
    choose.after(menu);
    choose.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", away, true);
    (items.find((item) => item.getAttribute("aria-checked") === "true") ?? items[0]).focus();
  });
  quick = () => {
    links.setAttribute("aria-pressed", String(L.enabled));
    nodes.setAttribute("aria-pressed", String(N.enabled));
    frozen.setAttribute("aria-pressed", L.staticMode === N.staticMode ? String(L.staticMode) : "mixed");
    focus2.setAttribute("aria-pressed", String(L.focusEnabled));
    const look = currentLook();
    name.textContent = look?.name ?? "Custom";
    dot.hidden = !look || !changed(look);
  };
  return h(
    "div",
    { class: "eln-quick", role: "group", "aria-label": "Quick bar" },
    links,
    nodes,
    frozen,
    focus2,
    h("div", { class: "eln-look" }, h("span", { id: "eln-look-label", class: "eln-look-label" }, "Look"), choose)
  );
}
function settingsTab(tab, part2) {
  const groups = /* @__PURE__ */ new Map();
  for (const s of VISIBLE) if (s.group.startsWith(`${part2} · `)) groups.set(s.group, [...groups.get(s.group) ?? [], s]);
  return [notices(tab), ...tab === "perf" ? [quality()] : [], ...[...groups].map(([group, settings], i) => section(group, settings, i === 0 || groups.size <= 3))];
}
const STEPS = ["full quality", "link glows plain", "fewer particles", "effects held still"];
const adaptiveNow = () => L.perfAdaptive ? `Adaptive quality: ${STEPS[adaptive.level]}` : "Adaptive quality: off";
function quality() {
  const line = h("p", { class: "eln-hint eln-adaptive", role: "status" });
  parts.push(() => {
    line.textContent = `${adaptiveNow()}.`;
  });
  return line;
}
function section(group, settings, open2) {
  const title = group.slice(group.indexOf(" · ") + 3);
  const id = `eln-section-${++ids}`;
  open2 = opened.get(group) ?? open2;
  const toggle2 = h(
    "button",
    { type: "button", id: `${id}-title`, class: "eln-section-toggle", "aria-expanded": String(open2), "aria-controls": id },
    h("i", { class: "pi pi-chevron-down", "aria-hidden": "true" }),
    title
  );
  const region = h("div", { id, role: "region", class: "eln-section-body", "aria-labelledby": `${id}-title`, hidden: !open2 });
  toggle2.addEventListener("click", () => {
    region.hidden = !region.hidden;
    toggle2.setAttribute("aria-expanded", String(!region.hidden));
    opened.set(group, !region.hidden);
  });
  const count2 = h("span", { class: "eln-count" });
  const reset2 = iconButton("pi-undo", `Reset ${title} to the defaults`, () => {
    offerUndo(`${title} reset`, commitAll(Object.fromEntries(settings.map((s) => [s.id, s.default]))));
    toggle2.focus();
  });
  const own2 = settings.map((s) => row(s));
  rows.push(...own2);
  const more = h("button", { type: "button", class: "eln-link eln-more" });
  more.addEventListener("click", () => {
    revealed.add(group);
    refresh();
  });
  region.append(...own2.map((r) => r.el), more);
  const el = h("section", { class: "eln-section" }, h("div", { class: "eln-section-head" }, h("h3", {}, toggle2), count2, reset2), region);
  parts.push(() => {
    const changes2 = settings.filter((s) => shown$3(s.id) !== s.default).length;
    count2.textContent = changes2 ? `${changes2} changed` : "";
    count2.hidden = reset2.hidden = !changes2;
    let held2 = 0;
    for (const r of own2) {
      if (r.el.hidden || !("advanced" in r.setting) || state.advanced || revealed.has(group)) continue;
      r.el.hidden = true;
      held2++;
    }
    more.textContent = `+ ${held2} advanced`;
    more.hidden = !held2;
    el.hidden = !held2 && own2.every((r) => r.el.hidden);
  });
  return el;
}
function results(query) {
  const words = query.toLowerCase().split(/\s+/);
  const finds = (...texts) => {
    const text2 = texts.join(" ").toLowerCase();
    return words.every((word) => text2.includes(word));
  };
  const looks = [...LOOKS, ...mine].filter((look) => finds(look.name, look.description));
  const groups = /* @__PURE__ */ new Map();
  for (const s of VISIBLE) {
    if (finds(s.name, s.tooltip ?? "", s.group, s.id, ...s.type === "combo" ? s.options.map((o) => o.text) : [])) groups.set(s.group, [...groups.get(s.group) ?? [], s]);
  }
  if (!looks.length && !groups.size) return [h("p", { class: "eln-hint" }, `Nothing matches “${query}”.`)];
  const found2 = looks.length ? [h("section", { class: "eln-section" }, h("h3", { class: "eln-crumb" }, "Looks"), lookGrid(looks))] : [];
  for (const [group, settings] of groups) {
    const own2 = settings.map((s) => row(s, true));
    rows.push(...own2);
    found2.push(h("section", { class: "eln-section" }, h("h3", { class: "eln-crumb" }, group.replace(" · ", " › ")), h("div", { class: "eln-section-body" }, ...own2.map((r) => r.el))));
  }
  return found2;
}
function noticesOf(tab) {
  const all2 = tab === "looks";
  const list = [];
  if ((all2 || tab === "links") && !running.links) list.push({ text: DISABLED.links });
  if ((all2 || tab === "nodes") && !running.nodes) list.push({ text: DISABLED.nodes });
  if ((all2 || tab === "nodes") && LiteGraph.vueNodesMode) {
    list.push({
      text: "Nodes 2.0 is on: glows, selection and run outlines, particles, selection focus, run visuals and completion effects work. The patterns inside nodes, the hover outline, focus on hover, double-click jumps and animated titles need classic nodes.",
      action: ["Use classic nodes", () => void app.extensionManager.setting.set("Comfy.VueNodes.Enabled", false)]
    });
  }
  if ((all2 || tab === "links") && deferring()) list.push({ text: L.coexist === "defer" ? "Link effects are set to always step aside for other link extensions." : "Another extension draws links, so link effects step aside for it.", action: ["Keep Enhanced link effects", () => commit(COEXIST, "ours")] });
  for (const key of tab === "perf" ? [] : guard.tripped()) {
    list.push({ text: `${key} kept failing, so it was turned off.`, action: ["Retry", () => {
      guard.retry();
      refresh();
    }] });
  }
  return list;
}
function notices(tab) {
  const box2 = h("div", { class: "eln-notices" });
  let showing = "";
  parts.push(() => {
    const list = noticesOf(tab);
    const key = list.map((n) => n.text).join("\n");
    if (key === showing) return;
    showing = key;
    box2.replaceChildren(...list.map(({ text: text2, action }) => {
      const notice = h("div", { class: "eln-notice", role: "note" }, h("i", { class: "pi pi-info-circle", "aria-hidden": "true" }), h("span", {}, text2));
      if (action) {
        const button2 = h("button", { type: "button", class: "eln-link" }, action[0]);
        button2.addEventListener("click", action[1]);
        notice.append(button2);
      }
      return notice;
    }));
  });
  return box2;
}
function lookGrid(looks) {
  const dots = [];
  const items = looks.map((look) => {
    const dot = h("span", { class: "eln-dot", title: "Changed since the look was applied" }, h("span", { class: "eln-sr" }, "Changed since applied"));
    dots.push(dot);
    const item = h(
      "button",
      { type: "button", role: "radio", class: "eln-tile", "data-look": look.id, title: look.description },
      lookTile(look),
      h("span", { class: "eln-tile-name" }, look.name, dot),
      h("span", { class: "eln-tile-text" }, look.description)
    );
    hover(item, () => previewLook(look));
    item.addEventListener("click", () => apply(look));
    return item;
  });
  const grid = h("div", { role: "radiogroup", class: "eln-looks", "aria-label": "Looks" }, ...items);
  roving(grid, items);
  parts.push(() => {
    const current2 = currentLook();
    const at = looks.findIndex((look) => look.id === current2?.id);
    check(items, at);
    dots.forEach((dot, i) => dot.hidden = i !== at || !changed(current2));
  });
  return grid;
}
function looksTab() {
  const list = h("div");
  const note = h("div", { role: "status" });
  const file = h("input", { type: "file", accept: ".json,application/json", hidden: true });
  file.addEventListener("change", () => {
    const picked = file.files?.[0];
    file.value = "";
    if (picked) void userData(async () => {
      const { look, errors } = await importLook(await picked.text());
      note.replaceChildren(
        ...look ? [h("p", { class: "eln-hint" }, `${look.name} is among your looks now.`)] : [],
        ...errors.length ? [h("ul", { class: "eln-errors" }, ...errors.map((error) => h("li", {}, error)))] : []
      );
    });
  });
  relist = () => {
    const hint = unread ? `Your looks could not be read: ${unread}` : "Save what you have now as a look of your own, or import a look file.";
    list.replaceChildren(...mine.length ? mine.map(mineRow) : [h("p", { class: "eln-hint" }, hint)]);
    quick();
  };
  relist();
  return [
    notices("looks"),
    h("section", { class: "eln-section" }, h("h3", { class: "eln-heading" }, "Looks"), lookGrid(LOOKS)),
    h(
      "section",
      { class: "eln-section" },
      h("h3", { class: "eln-heading" }, "My looks"),
      list,
      h("div", { class: "eln-actions" }, button("Save current as look…", () => void saveCurrent()), button("Import…", () => file.click()), button("Surprise me", surpriseMe)),
      note,
      file
    )
  ];
}
async function userData(change) {
  try {
    await change();
    mine = await userLooks();
    unread = "";
  } catch (error) {
    unread = String(error);
    app.extensionManager.toast.add({ severity: "error", summary: "Your looks could not be read or saved", detail: unread, life: UNDO_MS });
  }
  if (root) relist();
}
function mineRow(look) {
  const use = h("button", { type: "button", class: "eln-button" }, "Apply");
  use.addEventListener("click", () => apply(look));
  return h(
    "div",
    { class: "eln-mine-row" },
    h("span", { class: "eln-mine-name" }, look.name),
    use,
    iconButton("pi-pencil", `Rename ${look.name}`, () => void rename(look)),
    iconButton("pi-download", `Export ${look.name}`, () => download(look)),
    iconButton("pi-trash", `Delete ${look.name}`, () => void userData(async () => {
      const undo = await deleteLook(look.id);
      offerUndo(`${look.name} deleted`, () => void userData(undo));
    }))
  );
}
async function saveCurrent() {
  const name = (await app.extensionManager.dialog.prompt({ title: "Save look", message: "Name the look", defaultValue: "My look" }))?.trim();
  if (name) await userData(async () => applyLook(await saveLook(name)));
}
async function rename(look) {
  const name = (await app.extensionManager.dialog.prompt({ title: "Rename look", message: "Name the look", defaultValue: look.name }))?.trim();
  if (name && name !== look.name) await userData(() => renameLook(look.id, name));
}
function download(look) {
  const url = URL.createObjectURL(new Blob([exportLook(look)], { type: "application/json" }));
  h("a", { href: url, download: `${look.name.replace(/[^\w-]+/g, "-")}.json` }).click();
  setTimeout(() => URL.revokeObjectURL(url));
}
const REPO = "https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes";
const DISCORD = "https://discord.gg/UzC9353mfp";
const KOFI = "https://ko-fi.com/aemotionstudio";
const AWAY = { target: "_blank", rel: "noopener noreferrer" };
const NEWS$1 = [
  "Effects draw on ComfyUI's own links and nodes, so links stay clickable, and reroutes, subgraphs and every link render mode work.",
  "v1's look is back: Classic Flow with its halo, and the link animations on v1's clock, moving along the real path across reroutes.",
  "This panel: looks with live previews, search, undo, and two-way sync with the settings dialog, which now has readable names and groups.",
  "Link FX and Node FX switches, a frame-rate cap, a Motion setting, and an effect over your outputs when a run finishes: fireworks, confetti, a shockwave or a comet along the links it took.",
  "Quick toggles: keys for this panel and every effect (see Keys), View ▸ Enhanced Links & Nodes, Enhanced FX in the canvas menu, and buttons on the action bar and the selection toolbox.",
  "Selection focus makes the selected nodes' links stand out, or alone animate, with the rest dimmed or hidden if you like; Go to connected node in the node menu, a double-click on a slot and Back take you along the links; your own runs show light flowing into the running node, a progress ring, a fading trail and a red pulse on errors, which Alt+J goes to.",
  "Wire physics: links sag and swing as rope, a whip or gel, with any link animation or none, as in the Living Wires look.",
  "Three new link animations: Merkaba Beads, DNA Helix 3D and Comet Trails.",
  "Much lighter than 2.x on big graphs."
];
const PLACES = [
  ["pi-github", "Report an issue", `${REPO}/issues`],
  ["pi-discord", "Discord", DISCORD],
  ["pi-youtube", "YouTube", "https://www.youtube.com/@aemotionstudio/videos"],
  ["pi-heart", "Ko-fi", KOFI]
];
const BADGES = [
  { label: `${TITLE} ${"2.0.1"}`, url: REPO, icon: "pi pi-github" },
  { label: "Æmotion Studio Discord", url: DISCORD, icon: "pi pi-discord" },
  { label: "Ko-fi", url: KOFI, icon: "pi pi-heart" }
];
const COMMANDS = [
  [TOGGLE, "Toggle Enhanced Links & Nodes Sidebar", "Opens and closes this panel."],
  [TOGGLE_ALL, "Toggle all effects", "Turns every effect off, or back on."],
  ["EnhancedLinksNodes.GoToRunning", "Go to running node (or next error)", "Goes to the node your run is running, or once it failed, to the next error."]
];
const KEYS = [
  ["← → Home End", "Move between the tabs."],
  ["Arrows, Enter, Space", "Move through a gallery or the looks, and pick one."],
  ["Esc", "Clears the search, or closes the Look menu. On the look picker, keeps the look that shows."]
];
function keys() {
  return [...COMMANDS.map(([id, name, what]) => {
    const key = keyName(id);
    return key ? [key, what] : [name, `${what} Give it a key in Settings › Keybinding.`];
  }), ...KEYS];
}
const STUDIO = "Developed by Æmotion Studio, Enhanced Links & Nodes adds beautiful, customizable animations to both links and nodes in your ComfyUI workflow. Contributions are welcome!";
function aboutTab() {
  const note = h("p", { class: "eln-hint", role: "status" });
  const text2 = h("textarea", { class: "eln-diagnostics", rows: 10, readonly: true, hidden: true, "aria-label": "Diagnostics" });
  const copy = async () => {
    const report = diagnostics();
    try {
      await navigator.clipboard.writeText(report);
      note.textContent = "Copied. Paste it into your report: nothing was sent anywhere.";
      text2.hidden = true;
    } catch {
      note.textContent = "Copy the text below.";
      text2.value = report;
      text2.hidden = false;
      text2.select();
    }
  };
  const sure = h("div", { class: "eln-confirm", role: "group", "aria-label": "Reset everything", hidden: true });
  const ask = button("Reset everything…", () => {
    sure.hidden = false;
    yes.focus();
  });
  const yes = button("Reset everything", () => {
    sure.hidden = true;
    resetEverything();
  });
  sure.append(h("p", {}, "Every Enhanced Links & Nodes setting goes back to its default, and the look to Subtle."), yes, button("Cancel", () => {
    sure.hidden = true;
    ask.focus();
  }));
  return [
    h(
      "section",
      { class: "eln-section eln-brand" },
      h("span", { class: "eln-icon", "aria-hidden": "true" }),
      h(
        "div",
        {},
        h("h3", { class: "eln-heading" }, `${TITLE} ${"2.0.1"}`),
        h("p", { class: "eln-hint" }, "by Æmotion Studio · GPL-3.0 · ", h("a", { href: REPO, ...AWAY }, "Source on GitHub"))
      )
    ),
    h(
      "section",
      { class: "eln-section" },
      h("h3", { class: "eln-heading" }, "What's new in 3.0"),
      h("ul", { class: "eln-news" }, ...NEWS$1.map((item) => h("li", {}, item))),
      h("div", { class: "eln-actions" }, ...PLACES.map(([icon, label, href]) => h("a", { class: "eln-button", href, ...AWAY }, h("i", { class: `pi ${icon}`, "aria-hidden": "true" }), label)))
    ),
    h("section", { class: "eln-section" }, h("h3", { class: "eln-heading" }, "Keys"), h("dl", { class: "eln-keys" }, ...keys().flatMap(([key, what]) => [h("dt", {}, key), h("dd", {}, what)]))),
    h(
      "section",
      { class: "eln-section" },
      h("h3", { class: "eln-heading" }, "Tools"),
      h("div", { class: "eln-actions" }, button("Show the look picker", showPicker), button("Copy diagnostics", () => void copy()), ask),
      sure,
      note,
      text2
    ),
    h("section", { class: "eln-section" }, h(
      "details",
      { class: "eln-studio" },
      h("summary", {}, "About Æmotion Studio"),
      h("p", {}, STUDIO),
      h("a", { href: "https://aemotionstudio.org/", ...AWAY }, "aemotionstudio.org")
    ))
  ];
}
function diagnostics() {
  const look = currentLook();
  const changes2 = VISIBLE.filter((s) => shown$3(s.id) !== s.default).map((s) => `  ${s.id}: ${JSON.stringify(shown$3(s.id))}`);
  return [
    `${TITLE} ${"2.0.1"}, ComfyUI frontend ${window.__COMFYUI_FRONTEND_VERSION__}`,
    `Browser: ${navigator.userAgent}; language ${navigator.language}`,
    `Palette: ${light$1() ? "light" : "dark"}, canvas ${app.canvas.clear_background_color}`,
    `Nodes 2.0: ${LiteGraph.vueNodesMode ? "on" : "off"}`,
    `Workflow: ${app.rootGraph.nodes.length} nodes, ${app.rootGraph.links.size} links`,
    `Look: ${L.look || "not chosen yet"}${look && changed(look) ? ", changed since it was applied" : ""}`,
    `Set up: ${Object.entries(running).flatMap(([part2, on]) => on ? [part2] : []).join(", ") || "neither extension"}`,
    `Coexist: ${L.coexist}${deferring() ? ", stepping aside for another extension" : ""}`,
    `Reduced motion: ${env.reducedMotion ? "yes" : "no"}`,
    adaptiveNow(),
    `Turned off after failing: ${guard.tripped().join(", ") || "nothing"}`,
    `Settings changed from the defaults:${changes2.length ? "" : " none"}`,
    ...changes2
  ].join("\n");
}
const SEEN = "🔗 Enhanced Links.WhatsNew.Seen";
const NEWS = "3.0.0";
const IDLE_MS = 1500;
const NEWS_MS = 1e4;
const CHIP_MS = 6e3;
const byId = (id) => LOOKS.find((look) => look.id === id);
const SUBTLE = byId("subtle");
let card;
let asking = false;
let before = null;
let offer;
let pill;
let pillTimer = 0;
const host = () => document.querySelector(".graph-canvas-panel");
function installPicker() {
  if (L.look !== "") return;
  const wait = () => {
    if (L.look !== "" || card) return;
    if (env.running || [...document.querySelectorAll("[role=dialog]")].some((el) => el.checkVisibility())) setTimeout(wait, IDLE_MS);
    else showPicker();
  };
  setTimeout(wait, IDLE_MS);
  let unanswered = true;
  watch((id) => {
    if (id !== LOOK || unanswered === (L.look === "")) return;
    unanswered = !unanswered;
    if (unanswered) return;
    if (asking) close();
    queueMicrotask(whatsNew);
  });
}
function showPicker() {
  if (card) return;
  asking = L.look === "";
  const looks = ["off", "subtle", "showcase", "performance"].map(byId);
  const items = looks.map((look) => {
    const item = h(
      "button",
      { type: "button", role: "radio", class: "eln-tile", "data-look": look.id, title: look.description },
      lookTile(look),
      h("span", { class: "eln-tile-name" }, look.name),
      h("span", { class: "eln-tile-text" }, look.description)
    );
    hover(item, () => previewLook(look));
    item.addEventListener("click", () => pick$1(look));
    return item;
  });
  const grid = h("div", { role: "radiogroup", class: "eln-looks", "aria-label": "Looks" }, ...items);
  roving(grid, items);
  const shown2 = currentLook();
  check(items, shown2 && !changed(shown2) ? looks.indexOf(shown2) : -1);
  const classic = h("button", { type: "button", class: "eln-link" }, "Classic v1");
  hover(classic, () => previewLook(byId("classic-v1")));
  classic.addEventListener("click", () => pick$1(byId("classic-v1")));
  const more = h("button", { type: "button", class: "eln-link" }, "More looks…");
  more.addEventListener("click", () => {
    close();
    showTab("looks");
  });
  const primary = { class: "eln-button eln-button--primary" };
  const key = keyName(TOGGLE);
  const keeps = !asking ? [button("Done", close, primary)] : customised() ? [button("Keep Subtle", () => pick$1(SUBTLE)), button("Keep my settings", keepMine, primary)] : [button("Keep Subtle", () => pick$1(SUBTLE), primary)];
  card = h(
    "section",
    { class: "eln eln-picker", tabindex: -1, "aria-labelledby": "eln-picker-title" },
    h("header", { class: "eln-picker-head" }, h("span", { class: "eln-icon eln-mark", "aria-hidden": "true" }), h("h2", { id: "eln-picker-title", class: "eln-title" }, "Choose your look")),
    grid,
    h("p", { class: "eln-picker-more" }, "The original look? ", classic, " · ", more),
    h("footer", { class: "eln-picker-foot" }, h("span", { class: "eln-hint" }, `Change it any time in the FX panel${key ? ` (${key})` : ""}.`), ...keeps),
    iconButton("pi-times", "Close", dismiss, { class: "eln-tool eln-picker-close" })
  );
  card.classList.toggle("eln--still", L.motion === "reduce");
  card.classList.toggle("eln--full", L.motion === "full");
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dismiss();
  });
  before = document.activeElement;
  host().append(card);
  if (before === document.body || before === app.canvas.canvas) card.focus();
}
function close() {
  if (!card) return;
  endHover();
  stopTiles(card);
  if (card.contains(document.activeElement) && before instanceof HTMLElement) before.focus();
  card.remove();
  card = void 0;
}
function pick$1(look) {
  const visible = changed(look);
  const undo = applyLook(look);
  close();
  if (!visible) return;
  offerUndo(`${look.name} applied`, () => {
    undo();
    showPicker();
  });
}
function keepMine() {
  commit(LOOK, "custom");
}
function dismiss() {
  if (!asking) close();
  else if (customised()) keepMine();
  else if (changed(SUBTLE)) keepShown();
  else pick$1(SUBTLE);
}
function undoBar(title, undo) {
  offer?.remove();
  const bar = h("div", { class: "eln eln-picker-undo", role: "status" }, h("span", {}, title), button("Undo", () => {
    clearTimeout(timer);
    bar.remove();
    undo();
  }));
  const timer = setTimeout(() => bar.remove(), UNDO_MS);
  offer = bar;
  host().append(bar);
}
function chip(text2, action, ms = CHIP_MS) {
  pill?.remove();
  clearTimeout(pillTimer);
  if (!text2 && !action) return;
  const el = h("div", { class: "eln eln-chipbar", role: "status" });
  if (text2) el.append(h("span", {}, text2));
  if (action) el.append(button(action[0], () => {
    el.remove();
    action[1]();
  }));
  pill = el;
  pillTimer = window.setTimeout(() => el.remove(), ms);
  host().append(el);
}
function whatsNew() {
  if (L.whatsNewSeen === NEWS) return;
  commit(SEEN, NEWS);
  if (!customised()) return;
  const title = "Enhanced Links & Nodes 3.0";
  const text2 = "Links stay clickable, v1's look is back, and a new FX panel brings looks with live previews.";
  const { toast } = app.extensionManager;
  if ("info" in toast) {
    const id = toast.info(title, {
      description: text2,
      duration: NEWS_MS,
      action: {
        label: "What's new",
        onClick() {
          toast.dismiss(id);
          showTab("about");
        }
      }
    });
    return;
  }
  app.extensionManager.toast.add({ severity: "info", summary: title, detail: `${text2} About, in the FX panel, tells more.`, life: NEWS_MS });
}
const OWN_STYLE = "enhanced_fx_style";
const OWN_ONLY = "enhanced_fx_particles_only";
const SELECTION_FX = "EnhancedLinksNodes.SelectionNodeFX";
const STYLES = new Set(NODE_ANIMATION_OPTIONS.map((option) => option.value));
function ownStyle(node2) {
  const style = node2.properties[OWN_STYLE];
  return STYLES.has(style) ? style : void 0;
}
const effectOf = (node2) => ownStyle(node2) ?? N.animate;
function pick(nodes, choices) {
  app.canvas.emitBeforeChange();
  for (const node2 of nodes) {
    for (const [key, value] of Object.entries(choices)) {
      if (value === void 0) delete node2.properties[key];
      else node2.properties[key] = value;
    }
  }
  app.canvas.emitAfterChange();
  app.canvas.setDirty(true, false);
}
const selectedNodes = () => [...app.canvas.selectedItems].filter((item) => item instanceof LGraphNode);
function selected() {
  const nodes = selectedNodes();
  return nodes.length === 1 ? nodes[0] : void 0;
}
function effects() {
  const global = N.animate ? NODE_ANIMATION_OPTIONS.find((option) => option.value === N.animate).text : "Off";
  return [
    {
      name: `Use global (${global})`,
      choices: { [OWN_STYLE]: void 0, [OWN_ONLY]: void 0 },
      has: (node2) => ownStyle(node2) === void 0 && typeof node2.properties[OWN_ONLY] !== "boolean"
    },
    ...NODE_ANIMATION_OPTIONS.map((option) => ({ name: option.value ? option.text : "Off", choices: { [OWN_STYLE]: option.value }, has: (node2) => ownStyle(node2) === option.value }))
  ];
}
function particlesOnly(node2) {
  const own2 = node2.properties[OWN_ONLY];
  return typeof own2 === "boolean" ? own2 : !N.animationsEnabled;
}
const entry = (content, ticked, callback) => ({ content: ticked ? `✓ ${content}` : content, callback });
function nodeMenu(node2) {
  const connected = connections(node2).slice(0, LISTED);
  const selection = selectedNodes();
  const nodes = node2.selected && selection.length > 1 ? selection : [node2];
  const only = nodes.every(particlesOnly);
  const completion = node2.properties[OWN_COMPLETION];
  return [
    {
      content: nodes.length > 1 ? `Node FX (${nodes.length} selected)` : "Node FX",
      has_submenu: true,
      submenu: {
        options: [
          ...effects().map((effect) => entry(effect.name, nodes.every(effect.has), () => pick(nodes, effect.choices))),
          null,
          entry("Particles only", only, () => pick(nodes, { [OWN_ONLY]: !only }))
        ]
      }
    },
    {
      content: "Completion FX",
      has_submenu: true,
      submenu: {
        options: [
          entry("Use global", completion !== "primary" && completion !== "exclude", () => pick([node2], { [OWN_COMPLETION]: void 0 })),
          entry("Primary (anchor here)", completion === "primary", () => pick([node2], { [OWN_COMPLETION]: "primary" })),
          entry("Exclude", completion === "exclude", () => pick([node2], { [OWN_COMPLETION]: "exclude" }))
        ]
      }
    },
    {
      content: "Go to connected node",
      has_submenu: true,
      submenu: {
        options: connected.length ? connected.map((c) => ({ content: `${c.up ? "←" : "→"} ${c.slot} · ${c.node.title} #${c.node.id}`, callback: () => jump(c.node, node2) })) : [{ content: "No connections", disabled: true }]
      }
    }
  ];
}
const HOPS = 100;
const LISTED = 15;
const HISTORY = 20;
const JUMP_MS = 350;
const SMALL = 40;
const PULSE_S = 1.2;
const STEADY_S = 1.5;
const MARK_OUT = 6;
function sourceOf(graph2, link2) {
  for (let hops = 0; link2 && hops < HOPS; hops++) {
    const node2 = graph2.getNodeById(link2.origin_id);
    if (node2?.type !== "Reroute") return node2 ?? void 0;
    link2 = node2.getInputLink(0);
  }
}
function targetsOf(graph2, ids2, into2 = [], hops = 0) {
  for (const id of ids2 ?? []) {
    const link2 = graph2.getLink(id);
    const node2 = link2 && graph2.getNodeById(link2.target_id);
    if (node2?.type !== "Reroute") {
      if (node2) into2.push(node2);
    } else if (hops < HOPS) targetsOf(graph2, node2.outputs[0].links, into2, hops + 1);
  }
  return into2;
}
const slotName = (slot) => slot.label || slot.localized_name || slot.name;
function connections(node2) {
  const graph2 = app.canvas.graph;
  const list = [];
  node2.inputs.forEach((input, i) => {
    const source = sourceOf(graph2, node2.getInputLink(i));
    if (source) list.push({ up: true, slot: slotName(input), node: source });
  });
  for (const output of node2.outputs) {
    for (const target of targetsOf(graph2, output.links)) list.push({ up: false, slot: slotName(output), node: target });
  }
  return list;
}
const back = [];
function backTo() {
  const { graph: graph2 } = app.canvas;
  while (back.length && (back.at(-1).graph !== graph2 || graph2.getNodeById(back.at(-1).node.id) !== back.at(-1).node)) back.pop();
  return back.at(-1)?.node;
}
let marked;
let markColour = "";
function drawMark(canvas, ctx) {
  if (!marked) return;
  const steady = env.reducedMotion;
  const t = clock.markTime / (steady ? STEADY_S : PULSE_S);
  if (t >= 1) {
    marked = void 0;
    live.marks = 0;
    return;
  }
  if (marked.graph !== canvas.graph) return;
  ctx.save();
  ctx.globalAlpha = steady ? 1 : 0.5 - 0.5 * Math.cos(4 * Math.PI * t);
  ctx.strokeStyle = markColour;
  ctx.lineWidth = 3 / canvas.ds.scale;
  trace(ctx, marked, MARK_OUT);
  ctx.stroke();
  ctx.restore();
}
function pan(node2, fit) {
  const { canvas } = app;
  const bounds = node2.boundingRect;
  canvas.ds.animateToBounds(bounds, () => canvas.setDirty(true, true), { duration: env.reducedMotion ? 1 : JUMP_MS, zoom: fit && bounds[3] * canvas.ds.scale < SMALL ? 0.75 : 0 });
}
function jump(node2, from, text2, colour2 = accent()) {
  const { canvas } = app;
  if (from && back.at(-1)?.node !== from) {
    back.push({ node: from, graph: canvas.graph });
    if (back.length > HISTORY) back.shift();
  }
  pan(node2, true);
  canvas.selectItems([node2]);
  layers.marks = drawMark;
  marked = node2;
  markColour = colour2;
  clock.markTime = 0;
  live.marks = 1;
  wake();
  const previous = backTo();
  chip(text2, previous && [`↩ Back to ${previous.title}`, goBack]);
}
function goBack() {
  const node2 = backTo();
  if (!node2) return false;
  back.pop();
  jump(node2);
  return true;
}
let stepped = { from: void 0, way: "", index: 0, of: 0, to: void 0, at: 0 };
const again = (way) => stepped.way === way && stepped.of > 1 && performance.now() - stepped.at < CHIP_MS;
function step(from, way, nodes, next) {
  const index = next ? (stepped.index + 1) % nodes.length : 0;
  stepped = { from, way, index, of: nodes.length, to: nodes[index], at: performance.now() };
  jump(nodes[index], from, nodes.length > 1 ? `${index + 1}/${nodes.length} · ${nodes[index].title}` : void 0);
}
function goAlong(up) {
  const node2 = selected();
  if (!node2) return "Select one node first";
  const way = up ? "up" : "down";
  const next = again(way) && stepped.to === node2;
  const from = next ? stepped.from : node2;
  const nodes = connections(from).filter((c) => c.up === up).map((c) => c.node);
  if (!nodes.length) return up ? `Nothing feeds ${from.title}` : `${from.title} feeds nothing`;
  step(from, way, nodes, next);
}
const navigating = () => L.navigateDoubleClick && !LiteGraph.vueNodesMode;
function navigateOnDoubleClick(nodeType) {
  const { onInputDblClick, onOutputDblClick } = nodeType.prototype;
  nodeType.prototype.onInputDblClick = function(slot, e) {
    const link2 = this.getInputLink(slot);
    onInputDblClick?.call(this, slot, e);
    if (!link2 || this.getInputLink(slot)?.id !== link2.id || !navigating()) return;
    const source = sourceOf(app.canvas.graph, link2);
    if (source) jump(source, this);
  };
  if (onOutputDblClick) return;
  nodeType.prototype.onOutputDblClick = function(slot) {
    if (!navigating()) return;
    const nodes = targetsOf(app.canvas.graph, this.outputs[slot].links);
    const way = `out ${slot}`;
    if (nodes.length) step(this, way, nodes, again(way) && stepped.from === this);
  };
}
const FOLLOW_MS = 1500;
const PAUSE_MS = 1e4;
const REPAUSE_MS = 1e3;
let lastError;
function nextError() {
  const nodes = errorNodes();
  if (!nodes.length) return "No errors";
  const at = (nodes.indexOf(lastError) + 1) % nodes.length;
  const node2 = lastError = nodes[at];
  jump(node2, selected(), nodes.length > 1 ? `${at + 1}/${nodes.length} · ${node2.title}` : void 0, RED);
}
function goToRunning() {
  if (!env.running) return errorNodes().length ? nextError() : "Nothing is running";
  const id = running$1();
  if (!id) return "Nothing is running";
  const shown2 = shownAs(id);
  if (!shown2) return "Running in another graph";
  const [node2, inside] = shown2;
  jump(node2, selected());
  return inside ? `Running inside ${node2.title}` : void 0;
}
let followed = -Infinity;
let pausedUntil = 0;
let watched;
function follow(id) {
  const now = performance.now();
  if (!L.navigateFollow || now < pausedUntil || now - followed < FOLLOW_MS) return;
  const node2 = shownAs(id)?.[0];
  if (!node2 || overlaps(node2.boundingRect, app.canvas.visible_area, 0)) return;
  followed = now;
  pan(node2, false);
}
function resume() {
  pausedUntil = 0;
  followed = -Infinity;
  const id = running$1();
  if (id) follow(id);
}
function interrupted(event) {
  if (!L.navigateFollow || !env.running || event.type === "pointermove" && !event.buttons) return;
  const now = performance.now();
  if (now < pausedUntil - PAUSE_MS + REPAUSE_MS) return;
  pausedUntil = now + PAUSE_MS;
  chip("Following paused", ["Resume", resume], PAUSE_MS);
}
function installFollow() {
  if (watched === app.canvas) return;
  if (!watched) {
    api.addEventListener("executing", ({ detail }) => {
      if (detail != null && env.running) follow(String(detail));
    });
    for (const type of ["wheel", "pointermove"]) {
      document.addEventListener(type, (event) => {
        if (env.running && event.target.closest?.(PANE)) interrupted(event);
      }, { capture: true, passive: true });
    }
  }
  watched = app.canvas;
  app.canvas.canvas.addEventListener("wheel", interrupted, { passive: true });
  app.canvas.canvas.addEventListener("pointermove", interrupted, { passive: true });
}
export {
  holdsStill as $,
  toggleStatic as A,
  BADGES as B,
  toggleFocus as C,
  DISABLED as D,
  FOCUS_ON as E,
  FROZEN as F,
  commit as G,
  showPicker as H,
  surpriseMe as I,
  goBack as J,
  selectedNodes as K,
  LINKS_ON as L,
  effects as M,
  NODES_ON as N,
  pick as O,
  complete as P,
  resetEverything as Q,
  goToRunning as R,
  SELECTION_FX as S,
  TITLE as T,
  nextError as U,
  goAlong as V,
  translucent as W,
  revision as X,
  transformPane as Y,
  syncRuns as Z,
  overlaps as _,
  TOGGLE_ALL as a,
  during as a0,
  nodePalette as a1,
  effectOf as a2,
  particlesOnly as a3,
  stepOf as a4,
  BYPASS as a5,
  NEVER as a6,
  nodeMenu as a7,
  nodeSettings as a8,
  layers as a9,
  live as aa,
  startSprites as ab,
  drawBursts as ac,
  guard as ad,
  COMPLETION as ae,
  drawNodeFx as af,
  clock as ag,
  OVER as ah,
  dummy as ai,
  reach as aj,
  UNDER as ak,
  wake as al,
  ownStyle as am,
  CALM_ALPHA as an,
  STILL_NODE as ao,
  stopSprites as ap,
  install as b,
  checked as c,
  installPanel as d,
  installRuns as e,
  installFollow as f,
  installLinks as g,
  errorNodes as h,
  installStyle as i,
  currentLook as j,
  keyName as k,
  linkSettings as l,
  commandKeys as m,
  navigateOnDoubleClick as n,
  TOGGLE as o,
  panelShown as p,
  keyText as q,
  running as r,
  env as s,
  setting as t,
  shown$3 as u,
  showPanel as v,
  toggleLinks as w,
  L as x,
  toggleNodes as y,
  N as z
};
//# sourceMappingURL=menus-Cfshl9F4.js.map
