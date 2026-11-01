import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
const LINK_ANIMATION_OPTIONS = [
  { value: 0, text: "None" },
  { value: 9, text: "Classic Flow" },
  { value: 1, text: "Sacred Flow" },
  { value: 2, text: "Crystal Stream" },
  { value: 3, text: "Quantum Field" },
  { value: 4, text: "Cosmic Weave" },
  { value: 5, text: "Energy Pulse" },
  { value: 6, text: "DNA Helix" },
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
const COEXIST_OPTIONS = [
  { value: "auto", text: "Step aside if one is found" },
  { value: "ours", text: "Keep Enhanced link effects" },
  { value: "defer", text: "Always step aside" }
];
const LINKS = "🔗 Enhanced Links.";
const NODES = "📦 Enhanced Nodes.";
const SETTINGS = [
  { id: "🔗 Enhanced Links.Animate", key: "animate", name: "Link animation", type: "combo", options: LINK_ANIMATION_OPTIONS, default: 9, group: "Links · Effect", tooltip: "Effect drawn along every link." },
  { id: "🔗 Enhanced Links.Animation.Speed", key: "animationSpeed", name: "Link animation speed", type: "slider", min: 0.1, max: 3, step: 0.05, default: 1, group: "Links · Effect" },
  { id: "🔗 Enhanced Links.Direction", key: "direction", name: "Link flow direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Links · Effect", tooltip: "Which way effects travel." },
  { id: "🔗 Enhanced Links.Static.Mode", key: "staticMode", name: "Freeze link animation", type: "boolean", default: false, group: "Links · Effect", tooltip: "Keep the look but stop the motion." },
  { id: "🔗 Enhanced Links.Link.Style", key: "linkStyle", name: "Link path shape", type: "combo", options: LINK_STYLE_OPTIONS, default: "spline", group: "Links · Path", tooltip: "Same as ComfyUI follows the Link Render Mode setting." },
  { id: "🔗 Enhanced Links.Thickness", key: "thickness", name: "Link thickness", type: "slider", min: 1, max: 10, step: 0.5, default: 3, group: "Links · Path" },
  { id: "🔗 Enhanced Links.Quality", key: "quality", name: "Link effect quality", type: "combo", options: QUALITY_OPTIONS, default: 1, group: "Links · Path", tooltip: "More detail, more GPU." },
  { id: "🔗 Enhanced Links.Particle.Density", key: "particleDensity", name: "Link particle density", type: "combo", options: DENSITY_OPTIONS, snap: true, default: 0.5, group: "Links · Path", tooltip: "How many particles or markers each link carries." },
  { id: "🔗 Enhanced Links.Color.Mode", key: "colorMode", name: "Link colors", type: "combo", options: LINK_COLOR_MODE_OPTIONS, default: "default", group: "Links · Color", tooltip: "Type colors follow your palette." },
  { id: "🔗 Enhanced Links.Color.Primary", key: "colorPrimary", name: "Link primary color", type: "color", default: "#ffb300", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Secondary", key: "colorSecondary", name: "Link secondary color", type: "color", default: "#fb00ff", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Accent", key: "colorAccent", name: "Link accent color", type: "color", default: "#9d00ff", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Scheme", key: "colorScheme", name: "Link color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Links · Color", tooltip: "Filter applied on top of the colors." },
  { id: "🔗 Enhanced Links.Glow.Intensity", key: "glowIntensity", name: "Link glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Color" },
  { id: "🔗 Enhanced Links.Marker.Enabled", key: "markerEnabled", name: "Flow markers", type: "boolean", default: true, group: "Links · Markers", tooltip: "Shapes gliding along links in Classic Flow, and in the other animations with Markers on every animation." },
  { id: "🔗 Enhanced Links.Marker.All", key: "markerAll", name: "Markers on every animation", type: "boolean", default: false, group: "Links · Markers", tooltip: "Flow markers over every link animation, not only Classic Flow." },
  { id: "🔗 Enhanced Links.Marker.Shape", key: "markerShape", name: "Marker shape", type: "combo", options: MARKER_SHAPE_OPTIONS, default: "arrow", group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Size", key: "markerSize", name: "Marker size", type: "slider", min: 1, max: 5, step: 0.5, default: 3, group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Color.Mode", key: "markerColorMode", name: "Marker color", type: "combo", options: MARKER_COLOR_MODE_OPTIONS, default: "default", group: "Links · Markers", tooltip: "Same as link follows custom link colors." },
  { id: "🔗 Enhanced Links.Marker.Color", key: "markerColor", name: "Marker custom color", type: "color", default: "#00fff7", group: "Links · Markers", tooltip: "Used when Marker color is Custom." },
  { id: "🔗 Enhanced Links.Marker.Glow", key: "markerGlow", name: "Marker glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Effects", key: "markerEffects", name: "Marker effect", type: "combo", options: MARKER_EFFECT_OPTIONS, default: "none", group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Link.Shadow.Enabled", key: "linkShadowEnabled", name: "Link shadow", type: "boolean", default: true, group: "Links · Shadows", tooltip: "Dark outline under links in Classic Flow, which makes them stand out." },
  { id: "🔗 Enhanced Links.Marker.Shadow.Enabled", key: "markerShadowEnabled", name: "Marker shadow", type: "boolean", default: true, group: "Links · Shadows", tooltip: "Dark outline under flow markers." },
  { id: "🔗 Enhanced Links.Shadow.Style", key: "shadowStyle", name: "Shadow style", type: "combo", options: SHADOW_STYLE_OPTIONS, default: "halo", group: "Links · Shadows", tooltip: "Halo is the soft dark outline v1 drew; Drop shadow is offset, as in v2." },
  { id: "🔗 Enhanced Links.Shadow.Blur", key: "shadowBlur", name: "Drop shadow blur", type: "slider", min: 0, max: 10, step: 0.5, default: 5, group: "Links · Shadows", tooltip: "Used by Drop shadow." },
  { id: "🔗 Enhanced Links.Shadow.Offset", key: "shadowOffset", name: "Drop shadow offset", type: "slider", min: 0, max: 10, step: 0.5, default: 3, group: "Links · Shadows", tooltip: "Used by Drop shadow." },
  { id: "🔗 Enhanced Links.Coexist", key: "coexist", name: "Other link extensions", type: "combo", options: COEXIST_OPTIONS, default: "auto", group: "Links · Compatibility", tooltip: "When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working." },
  { id: "📦 Enhanced Nodes.Animate", key: "animate", name: "Node effect", type: "combo", options: NODE_ANIMATION_OPTIONS, default: 0, group: "Nodes · Effect", tooltip: "Effect drawn on and around every node. Node FX in the node menu picks one for a node." },
  { id: "📦 Enhanced Nodes.Animations.Enabled", key: "animationsEnabled", name: "Show base effect", type: "boolean", default: true, group: "Nodes · Effect", tooltip: "Off draws only the effect's own particles." },
  { id: "📦 Enhanced Nodes.Animation.Speed", key: "animationSpeed", name: "Node effect speed", type: "slider", min: 0.1, max: 3, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Direction", key: "direction", name: "Node effect direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Static.Mode", key: "staticMode", name: "Freeze node effects", type: "boolean", default: false, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Intensity", key: "intensity", name: "Node effect energy", type: "slider", min: 0.1, max: 2, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Animation.Size", key: "animationSize", name: "Node effect size", type: "slider", min: 0.5, max: 3, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Animation.Glow", key: "animationGlow", name: "Node effect bloom", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Effect", tooltip: "Glow of the effect's lines and light, and of the hover outline." },
  { id: "📦 Enhanced Nodes.Quality", key: "quality", name: "Node effect quality", type: "combo", options: QUALITY_OPTIONS, default: 2, group: "Nodes · Effect", tooltip: "More detail, more GPU." },
  { id: "📦 Enhanced Nodes.Glow.Show", key: "glowShow", name: "Node effect glow", type: "boolean", default: true, group: "Nodes · Glow & hover", tooltip: "A halo in the effect's primary color around each node with an effect." },
  { id: "📦 Enhanced Nodes.Glow", key: "glow", name: "Node glow strength", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Glow & hover", tooltip: "How far the halo and the selection frame glow." },
  { id: "📦 Enhanced Nodes.Selection.Glow", key: "selectionGlow", name: "Glowing frame around selected nodes", type: "boolean", default: true, group: "Nodes · Glow & hover", tooltip: "On nodes with an effect." },
  { id: "📦 Enhanced Nodes.Color.Hover.Show", key: "colorHoverShow", name: "Hover outline", type: "boolean", default: false, group: "Nodes · Glow & hover", tooltip: "Outlines animated nodes while hovered or selected." },
  { id: "📦 Enhanced Nodes.Color.Hover", key: "colorHover", name: "Hover outline color", type: "color", default: "#00ff15", group: "Nodes · Glow & hover" },
  { id: "📦 Enhanced Nodes.Color.Mode", key: "colorMode", name: "Node effect colors", type: "combo", options: NODE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Color" },
  { id: "📦 Enhanced Nodes.Color.Primary", key: "colorPrimary", name: "Node primary color", type: "color", default: "#ffb300", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Secondary", key: "colorSecondary", name: "Node secondary color", type: "color", default: "#fb00ff", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Accent", key: "colorAccent", name: "Node accent color", type: "color", default: "#9d00ff", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Scheme", key: "colorScheme", name: "Node color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Nodes · Color", tooltip: "Filter applied on top of the colors." },
  { id: "📦 Enhanced Nodes.Particle.Show", key: "particleShow", name: "Node particles", type: "boolean", default: false, group: "Nodes · Particles", tooltip: "Also drawn when Node effect is None." },
  { id: "📦 Enhanced Nodes.Particle.Density", key: "particleDensity", name: "Node particle density", type: "combo", options: DENSITY_OPTIONS, snap: true, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Size", key: "particleSize", name: "Node particle size", type: "slider", min: 0.1, max: 3, step: 0.1, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Speed", key: "particleSpeed", name: "Node particle speed", type: "slider", min: 0.1, max: 5, step: 0.1, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Intensity", key: "particleIntensity", name: "Node particle motion", type: "slider", min: 0.1, max: 2, step: 0.1, default: 1, group: "Nodes · Particles", tooltip: "How energetic the motion is." },
  { id: "📦 Enhanced Nodes.Particle.Glow", key: "particleGlow", name: "Node particle glow", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Color.Mode", key: "particleColorMode", name: "Node particle colors", type: "combo", options: PARTICLE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Particles", tooltip: "Particle color takes Node particle color with Custom colors, else the effect's primary color; Complementary takes its opposite hue." },
  { id: "📦 Enhanced Nodes.Color.Particle", key: "colorParticle", name: "Node particle color", type: "color", default: "#ffb300", group: "Nodes · Particles", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Text.Animation.Enabled", key: "textAnimationEnabled", name: "Animated titles", type: "boolean", default: false, group: "Nodes · Titles", tooltip: "Draws each node title in the chosen style." },
  { id: "📦 Enhanced Nodes.Text.Style", key: "textStyle", name: "Title style", type: "combo", options: TEXT_STYLE_OPTIONS, default: "neon", group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Color", key: "textColor", name: "Title color", type: "color", default: "#00ffff", group: "Nodes · Titles", tooltip: "Used when Node effect colors is Custom; otherwise titles take the effect's accent color." },
  { id: "📦 Enhanced Nodes.Text.Size", key: "textSize", name: "Title size", type: "slider", min: 8, max: 24, step: 1, default: 14, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Glow", key: "textGlow", name: "Title glow", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Letter.Spacing", key: "textLetterSpacing", name: "Title letter spacing", type: "slider", min: -2, max: 10, step: 0.25, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Position.X", key: "textPositionX", name: "Title offset X", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Position.Y", key: "textPositionY", name: "Title offset Y", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Rotation.Radius", key: "textRotationRadius", name: "Title orbit radius", type: "slider", min: 0, max: 50, step: 1, default: 0, group: "Nodes · Titles", tooltip: "Circles the title around its position." },
  { id: "📦 Enhanced Nodes.Text.Rotation.Angle", key: "textRotationAngle", name: "Title rotation", type: "slider", min: -180, max: 180, step: 5, default: 0, group: "Nodes · Titles" },
  { id: "🔗 Enhanced Links.Pause.During.Render", key: "pauseDuringRender", name: "Pause link animation during runs", type: "boolean", default: true, group: "Runs · During a run", tooltip: "Links hold a still frame while the queue is running." },
  { id: "📦 Enhanced Nodes.Pause.During.Render", key: "pauseDuringRender", name: "Pause node effects during runs", type: "boolean", default: true, group: "Runs · During a run", tooltip: "Node effects and their particles hold still while the queue is running." },
  { id: "📦 Enhanced Nodes.End Animation.Enabled", key: "endAnimationEnabled", name: "Fireworks when a run finishes", type: "boolean", default: true, group: "Runs · Completion", tooltip: "Above your run's output nodes. Completion FX in the node menu sets them for one node." }
];
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
  }
}
function snapshot(prefix) {
  return Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix)).map((s) => [s.key, s.default]));
}
const L = snapshot(LINKS);
const N = snapshot(NODES);
let revision = 0;
function snapshotOf(id) {
  return id.startsWith(LINKS) ? L : N;
}
function show$1(s, value) {
  const values = snapshotOf(s.id);
  const shown = s.type !== "color" || HEX$1.test(String(value)) ? value : s.default;
  if (values[s.key] === shown) return;
  values[s.key] = shown;
  revision++;
  app.canvas?.setDirty(true, true);
}
function params(prefix) {
  return SETTINGS.flatMap((s, i) => s.id.startsWith(prefix) ? [{
    // The package types id as keyof Settings, the core ids only; the settings store takes any string.
    id: s.id,
    name: s.name,
    tooltip: s.tooltip,
    category: ["Enhanced Links & Nodes", s.group, s.id],
    sortOrder: SETTINGS.length - i,
    type: s.type,
    attrs: s.type === "slider" ? { min: s.min, max: s.max, step: s.step } : void 0,
    options: s.type === "combo" ? [...s.options] : void 0,
    defaultValue: s.default,
    migrateDeprecatedValue: (value) => normalize(s, value),
    onChange: (value) => show$1(s, value)
  }] : []);
}
const linkSettings = params(LINKS);
const nodeSettings = params(NODES);
const unsaved = /* @__PURE__ */ new Map();
let saving = Promise.resolve();
function preview(id, value) {
  const s = SETTINGS.find((e) => e.id === id);
  show$1(s, normalize(s, value));
}
function commit(id, value) {
  preview(id, value);
  if (!unsaved.has(id)) saving = saving.then(() => save(id));
  unsaved.set(id, value);
}
async function save(id) {
  const value = unsaved.get(id);
  unsaved.delete(id);
  try {
    await app.extensionManager.setting.set(id, value);
  } catch (error) {
    console.warn(`[EnhancedLinks] Could not save ${id}:`, error);
  }
}
function reset(prefix) {
  for (const s of SETTINGS) {
    if (s.id.startsWith(prefix) && snapshotOf(s.id)[s.key] !== s.default) commit(s.id, s.default);
  }
}
const TURN = 2 * Math.PI / 15;
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
const TURNAROUND = 0.3;
const MAX_FLASH_HZ = 3;
const QUANTUM_SWEEPS = 5;
const MAX_FPS = 60;
const JITTER_MS = 1;
const GUARD_MS = 1e4;
const FAILURES = 5;
const clock = { linkPhase: 0, linkFlow: 0, linkDir: 1, quantumPhase: 0, nodePhase: 0, particleTime: 0, nodeTime: 0, nodeDir: 1, burstTime: 0 };
const STILL_PHASE = 9 * Math.PI / 4;
const env = { running: false, reducedMotion: false };
const live = { links: 0, nodes: 0, particles: 0, bursts: 0 };
const layers = {};
function offscreen(width, height) {
  return typeof OffscreenCanvas === "function" ? new OffscreenCanvas(width, height) : Object.assign(document.createElement("canvas"), { width, height });
}
let sink;
function dummy() {
  sink ??= offscreen(1, 1).getContext("2d");
  return sink;
}
let frame = 0;
let last = 0;
function want() {
  return !document.hidden && live.links + live.nodes + live.particles + live.bursts > 0;
}
const toward = (dir, to, dt) => dir + Math.max(-2 * dt / TURNAROUND, Math.min(2 * dt / TURNAROUND, to - dir));
function advance(dt) {
  if (live.links) {
    const speed = L.animationSpeed;
    clock.linkDir = toward(clock.linkDir, L.direction, dt);
    clock.linkPhase -= PHI2 * speed * clock.linkDir * dt;
    clock.linkFlow += 2 * speed * speed * clock.linkDir * dt;
    clock.quantumPhase -= Math.min(PHI2 * speed, 2 * Math.PI * MAX_FLASH_HZ / QUANTUM_SWEEPS) * clock.linkDir * dt;
  } else {
    clock.linkDir = L.direction;
  }
  clock.nodeDir = live.nodes || live.particles ? toward(clock.nodeDir, N.direction, dt) : N.direction;
  if (live.nodes) clock.nodePhase += TURN * N.animationSpeed * clock.nodeDir * dt;
  if (live.particles) {
    clock.particleTime += N.particleSpeed * clock.nodeDir * dt;
    clock.nodeTime += dt;
  }
  if (live.bursts) clock.burstTime += dt;
}
function tick(now) {
  frame = 0;
  if (!want()) {
    last = 0;
    return;
  }
  if (!last) {
    last = now;
    clock.linkDir = L.direction;
    clock.nodeDir = N.direction;
  } else if (now - last >= 1e3 / MAX_FPS - JITTER_MS) {
    advance(Math.min((now - last) / 1e3, 0.1));
    last = now;
    heal(app.canvas);
    app.canvas.setDirty(true, false);
  }
  frame = requestAnimationFrame(tick);
}
function wake() {
  frame ||= requestAnimationFrame(tick);
}
function need() {
  app.canvas.setDirty(true, true);
}
const hooks = {
  /** onRender(canvas element, ctx) starts each front pass, in screen space between the background and the nodes. */
  onRender: {
    ctx: 1,
    draw(canvas, ctx) {
      live.nodes = live.particles = 0;
      canvas.ds.toCanvasContext(ctx);
      layers.nodes?.(canvas, ctx);
      layers.links?.(canvas, ctx, false);
    },
    installed: void 0,
    called: false,
    running: false
  },
  /** onDrawForeground(ctx, visible area), in graph space over the nodes. */
  onDrawForeground: {
    ctx: 0,
    draw(canvas, ctx) {
      layers.links?.(canvas, ctx, true);
      layers.bursts?.(canvas, ctx);
    },
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
let listening = false;
function install() {
  if (chained !== app.canvas) {
    chained = app.canvas;
    for (const name of HOOKS) chain(app.canvas, name);
  }
  if (listening) return;
  listening = true;
  document.addEventListener("visibilitychange", () => {
    last = 0;
    wake();
  });
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const motion = () => {
    const reduced = query.matches || document.body.classList.contains("disable-animations");
    if (reduced === env.reducedMotion) return;
    env.reducedMotion = reduced;
    need();
  };
  motion();
  query.addEventListener("change", motion);
  new MutationObserver(motion).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  api.addEventListener("status", ({ detail }) => {
    const running = detail?.exec_info?.queue_remaining > 0;
    if (running === env.running) return;
    env.running = running;
    need();
  });
}
const failures = /* @__PURE__ */ new Map();
let failuresSince = revision;
function failuresOf(key) {
  if (failuresSince !== revision) {
    failures.clear();
    failuresSince = revision;
  }
  return failures.get(key);
}
const guard = {
  /** Whether `key` failed too often; changing any setting turns it back on. */
  off: (key) => failuresOf(key)?.off ?? false,
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
  }
};
const HIGHLIGHT = { native: "#ffffff", primary: "#ffffff", secondary: "#ffffff", accent: "#ffffff", marker: "#ffffff" };
const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const NUMBER = "([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)";
const FUNCTION = new RegExp(`^(rgb|hsl)a?\\(\\s*${NUMBER}(%|deg)?\\s*,?\\s*${NUMBER}(%)?\\s*,?\\s*${NUMBER}(%)?\\s*(?:[,/]\\s*${NUMBER}(%)?\\s*)?\\)$`, "i");
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function fromHsl(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return [f(0), f(8), f(4)];
}
function parse(colour) {
  const text = colour.trim();
  const hex = HEX.exec(text);
  if (hex) {
    const digits = hex[1].length < 6 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    const byte = (i) => parseInt(digits.slice(i, i + 2), 16);
    return [byte(0), byte(2), byte(4), digits.length === 8 ? byte(6) / 255 : 1];
  }
  const fn = FUNCTION.exec(text);
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
function show([r, g, b, a]) {
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
function toHsl(r, g, b) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function filter([r, g, b, alpha], scheme) {
  if (scheme === "default") return [r, g, b, alpha];
  const [h, s, L100] = toHsl(r, g, b);
  switch (scheme) {
    case "saturated":
      return [...fromHsl(h, Math.min(s * 1.3, 100), L100), alpha];
    case "vivid":
      return [...fromHsl(h, Math.min(s * 1.4, 100), Math.min(L100 * 1.1, 100)), alpha];
    case "contrast":
      return [...fromHsl(h, Math.min(s * 1.2, 100), L100 > 50 ? Math.min(L100 * 1.2, 100) : Math.max(L100 * 0.8, 0)), alpha];
    case "bright":
      return [...fromHsl(h, s, Math.min(L100 * 1.25, 100)), alpha];
    case "muted":
      return [...fromHsl(h, Math.max(s * 0.7, 0), Math.min(L100 * 1.1, 100)), alpha];
    default:
      return [r, g, b, alpha];
  }
}
const tint = (colour) => show(filter(parse(colour), L.colorScheme));
const palettes = /* @__PURE__ */ new Map();
let palettesSince = -1;
function palette(colour) {
  if (typeof colour !== "string") return void 0;
  if (palettesSince !== revision) {
    palettes.clear();
    palettesSince = revision;
  }
  let p = palettes.get(colour);
  if (p === void 0) {
    const rgba = parse(colour);
    if (rgba) {
      const own = show(filter(rgba, L.colorScheme));
      const [primary, secondary, accent] = L.colorMode === "custom" ? [tint(L.colorPrimary), tint(L.colorSecondary), tint(L.colorAccent)] : [own, own, own];
      const marker = L.markerColorMode === "custom" ? tint(L.markerColor) : L.markerColorMode === "inherit" ? primary : own;
      p = { native: show(rgba), primary, secondary, accent, marker };
    } else p = null;
    palettes.set(colour, p);
  }
  return p ?? void 0;
}
const hues = [];
let huesSince = -1;
function rainbow(hue) {
  if (huesSince !== revision) {
    for (let h = 0; h < 360; h++) hues[h] = show(filter([...fromHsl(h, 100, 50), 1], L.colorScheme));
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
const nodeTint = (colour) => show(filter(parse(colour), N.colorScheme));
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
    const [primary, secondary, accent] = (custom ? [N.colorPrimary, N.colorSecondary, N.colorAccent] : STYLE_COLOURS[style]).map(nodeTint);
    const [r, g, b] = parse(custom ? N.colorParticle : primary);
    const [h, s, l] = toHsl(r, g, b);
    p = nodePalettes[style] = {
      primary,
      secondary,
      accent,
      particle: custom ? nodeTint(N.colorParticle) : primary,
      complement: `hsl(${(h + 180) % 360}, ${s}%, ${l}%)`,
      title: custom ? nodeTint(N.textColor) : accent
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
function translucent(colour, alpha) {
  if (colour.startsWith("hsl(")) return `hsla(${colour.slice(4, -1)}, ${alpha})`;
  if (prefixesSince !== revision) {
    prefixes.clear();
    prefixesSince = revision;
  }
  let start = prefixes.get(colour);
  if (start === void 0) {
    const [r, g, b] = parse(colour);
    prefixes.set(colour, start = `rgba(${r}, ${g}, ${b}, `);
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
  let state = seed | 0;
  return () => {
    const value = noise(state);
    state = state + 1831565813 | 0;
    return value;
  };
}
const CAP = 4096;
const pool = {
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
const STEPS = 8;
const TURNS = 32;
const LEAST = 0.25;
const WIDEST = 256;
const BUDGET = 4 * 2 ** 20;
const sprites = /* @__PURE__ */ new Map();
const discs = /* @__PURE__ */ new Map();
let pixels = 0;
let since = -1;
let pass = 0;
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
  pass++;
}
function stopSprites() {
  scale = 0;
}
const alphas = /* @__PURE__ */ new Map();
function opacity(colour) {
  if (colour.charCodeAt(0) === 35) return 1;
  let alpha = alphas.get(colour);
  if (alpha === void 0) alphas.set(colour, alpha = Number(colour.slice(colour.lastIndexOf(",") + 1, -1)));
  return alpha;
}
const step = (size) => Math.round(Math.log2(Math.max(size, LEAST)) * STEPS);
function cast(shape, size, angle, width, colour, blur, half) {
  const image = offscreen(2 * half, 2 * half);
  const ctx = image.getContext("2d");
  ctx.shadowColor = colour;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 4 * half;
  ctx.lineWidth = width;
  ctx.lineCap = ctx.lineJoin = "round";
  shape.path(ctx, -3 * half, half, size, angle);
  if (shape.stroked) ctx.stroke();
  else ctx.fill();
  pixels += 4 * half * half;
  return { image, size, half, used: pass };
}
function evict() {
  const all = [];
  for (const byColour of sprites.values()) {
    for (const byKey of byColour.values()) for (const [key, sprite2] of byKey) all.push([byKey, key, sprite2]);
  }
  all.sort((x, y) => x[2].used - y[2].used);
  for (const [byKey, key, sprite2] of all) {
    if (pixels <= BUDGET * 0.75) return;
    byKey.delete(key);
    pixels -= 4 * sprite2.half * sprite2.half;
  }
}
function sprite(shape, size, angle, width, colour, blur) {
  const s = step(size);
  const w = width && step(width);
  const [cs, cw] = [2 ** (s / STEPS), width && 2 ** (w / STEPS)];
  const half = Math.ceil((shape.reach ?? 1) * cs + cw / 2 + 1.5 * blur) + 1;
  if (2 * half > WIDEST) return void 0;
  const { turn } = shape;
  const t = turn ? Math.round((angle % turn + turn) % turn / turn * TURNS) % TURNS : 0;
  const key = ((Math.round(blur * 2) * 128 + s + 16) * 128 + (width && w + 17)) * TURNS + t;
  let byColour = sprites.get(shape);
  if (!byColour) sprites.set(shape, byColour = /* @__PURE__ */ new Map());
  let byKey = byColour.get(colour);
  if (!byKey) byColour.set(colour, byKey = /* @__PURE__ */ new Map());
  let found = byKey.get(key);
  if (!found) {
    byKey.set(key, found = cast(shape, cs, turn ? t / TURNS * turn : 0, cw, colour, blur, half));
    if (pixels > BUDGET) evict();
  }
  found.used = pass;
  return found;
}
function stamp(ctx, shape, x, y, size, angle, paint, colour, blur, offset) {
  const d = shape.stroked ? Math.max(size * scale, LEAST) : size * scale;
  if (d < LEAST) return true;
  const found = sprite(shape, d, angle, shape.stroked ? ctx.lineWidth * scale : 0, colour, blur);
  if (!found) return false;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * opacity(paint);
  const h = found.half * d / found.size / scale;
  const o = offset / scale;
  ctx.drawImage(found.image, x + o - h, y + o - h, 2 * h, 2 * h);
  ctx.globalAlpha = alpha;
  return true;
}
function glow(ctx, shape, x, y, size, angle, paint, colour, blur, offset = 0) {
  if (scale && (blur || offset) && stamp(ctx, shape, x, y, size, angle, paint, colour, blur, offset)) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  } else {
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = ctx.shadowOffsetY = offset;
  }
}
function shine(ctx, shape, x, y, size, angle, paint, colour, blur, offset = 0) {
  glow(ctx, shape, x, y, size, angle, paint, colour, blur, offset);
  if (shape.stroked) {
    ctx.strokeStyle = paint;
    ctx.stroke();
  } else {
    ctx.fillStyle = paint;
    ctx.fill();
  }
}
function paintDisc(ctx, x, y, r, colour, alpha, soft) {
  if (soft) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    gradient.addColorStop(0, translucent(colour, alpha));
    gradient.addColorStop(0.4, translucent(colour, alpha * 0.5));
    gradient.addColorStop(1, translucent(colour, 0));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = translucent(colour, alpha);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function disc(ctx, x, y, r, colour, alpha, soft) {
  if (!scale) {
    paintDisc(ctx, x, y, r, colour, alpha, soft);
    return;
  }
  const d = r * scale;
  if (d < LEAST) return;
  const s = step(d);
  let byKey = discs.get(colour);
  if (!byKey) discs.set(colour, byKey = /* @__PURE__ */ new Map());
  const key = (s + 16) * 2 + Number(soft);
  let found = byKey.get(key);
  if (!found) {
    const size = 2 ** (s / STEPS);
    const half = Math.ceil(size) + 1;
    const image = offscreen(2 * half, 2 * half);
    paintDisc(image.getContext("2d"), half, half, size, colour, 1, soft);
    byKey.set(key, found = { image, size, half, used: pass });
  }
  const before = ctx.globalAlpha;
  ctx.globalAlpha = before * alpha;
  const h = found.half * d / found.size / scale;
  ctx.drawImage(found.image, x - h, y - h, 2 * h, 2 * h);
  ctx.globalAlpha = before;
}
export {
  rng as A,
  disc as B,
  CAP as C,
  DOT as D,
  NODE_ANIMATION_OPTIONS as E,
  nodeSettings as F,
  HIGHLIGHT as H,
  L,
  N,
  STILL_PHASE as S,
  TURN as T,
  guard as a,
  layers as b,
  clock as c,
  dummy as d,
  env as e,
  startSprites as f,
  glow as g,
  stopSprites as h,
  reset as i,
  SETTINGS as j,
  snapshotOf as k,
  live as l,
  commit as m,
  preview as n,
  linkSettings as o,
  palette as p,
  install as q,
  rainbow as r,
  shine as s,
  nodePalette as t,
  translucent as u,
  noise as v,
  wake as w,
  particleColour as x,
  revision as y,
  pool as z
};
//# sourceMappingURL=particles-rmz1g5bC.js.map
