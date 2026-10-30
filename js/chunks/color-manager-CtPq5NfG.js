import { app } from "/scripts/app.js";
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
  { value: "spline", text: "Spline" },
  { value: "straight", text: "Direct (diagonal)" },
  { value: "linear", text: "Right-angle" },
  { value: "hidden", text: "Effect only" },
  { value: "dotted", text: "Dotted" },
  { value: "dashed", text: "Dashed" },
  { value: "double", text: "Double" },
  { value: "stepped", text: "Stepped" },
  { value: "zigzag", text: "Zigzag" },
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
  { value: "spiral", text: "Spiral" }
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
const DIRECTION_OPTIONS = [
  { value: 1, text: "Forward" },
  { value: -1, text: "Reverse" }
];
const LINKS = "🔗 Enhanced Links.";
const NODES = "📦 Enhanced Nodes.";
const SETTINGS = [
  { id: "🔗 Enhanced Links.Animate", key: "animate", name: "Link animation", type: "combo", options: LINK_ANIMATION_OPTIONS, default: 9, group: "Links · Effect", tooltip: "Effect drawn along every link." },
  { id: "🔗 Enhanced Links.Animation.Speed", key: "animationSpeed", name: "Link animation speed", type: "slider", min: 0.1, max: 5, step: 0.1, default: 1, group: "Links · Effect" },
  { id: "🔗 Enhanced Links.Direction", key: "direction", name: "Link flow direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Links · Effect", tooltip: "Which way effects travel." },
  { id: "🔗 Enhanced Links.Static.Mode", key: "staticMode", name: "Freeze link animation", type: "boolean", default: false, group: "Links · Effect", tooltip: "Keep the look but stop the motion." },
  { id: "🔗 Enhanced Links.Link.Style", key: "linkStyle", name: "Link path shape", type: "combo", options: LINK_STYLE_OPTIONS, default: "spline", group: "Links · Path" },
  { id: "🔗 Enhanced Links.Thickness", key: "thickness", name: "Link thickness", type: "slider", min: 1, max: 10, step: 0.5, default: 3, group: "Links · Path" },
  { id: "🔗 Enhanced Links.Quality", key: "quality", name: "Link effect quality", type: "combo", options: QUALITY_OPTIONS, default: 1, group: "Links · Path", tooltip: "More detail, more GPU." },
  { id: "🔗 Enhanced Links.Particle.Density", key: "particleDensity", name: "Link particle density", type: "slider", min: 0, max: 2, step: 0.1, default: 0.5, group: "Links · Path", tooltip: "How many particles or markers each link carries." },
  { id: "🔗 Enhanced Links.Color.Mode", key: "colorMode", name: "Link colors", type: "combo", options: LINK_COLOR_MODE_OPTIONS, default: "default", group: "Links · Color", tooltip: "Type colors follow your palette." },
  { id: "🔗 Enhanced Links.Color.Primary", key: "colorPrimary", name: "Link primary color", type: "color", default: "#ffb300", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Secondary", key: "colorSecondary", name: "Link secondary color", type: "color", default: "#fb00ff", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Accent", key: "colorAccent", name: "Link accent color", type: "color", default: "#9d00ff", group: "Links · Color", tooltip: "Used when Link colors is Custom." },
  { id: "🔗 Enhanced Links.Color.Scheme", key: "colorScheme", name: "Link color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Links · Color", tooltip: "Filter applied on top of the colors." },
  { id: "🔗 Enhanced Links.Glow.Intensity", key: "glowIntensity", name: "Link glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Color" },
  { id: "🔗 Enhanced Links.Marker.Enabled", key: "markerEnabled", name: "Flow markers", type: "boolean", default: true, group: "Links · Markers", tooltip: "Shapes gliding along links in Classic Flow." },
  { id: "🔗 Enhanced Links.Marker.Shape", key: "markerShape", name: "Marker shape", type: "combo", options: MARKER_SHAPE_OPTIONS, default: "arrow", group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Size", key: "markerSize", name: "Marker size", type: "slider", min: 1, max: 5, step: 0.5, default: 3, group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Color.Mode", key: "markerColorMode", name: "Marker color", type: "combo", options: MARKER_COLOR_MODE_OPTIONS, default: "default", group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Color", key: "markerColor", name: "Marker custom color", type: "color", default: "#00fff7", group: "Links · Markers", tooltip: "Used when Marker color is Custom." },
  { id: "🔗 Enhanced Links.Marker.Glow", key: "markerGlow", name: "Marker glow", type: "slider", min: 0, max: 20, step: 1, default: 10, group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Marker.Effects", key: "markerEffects", name: "Marker effect", type: "combo", options: MARKER_EFFECT_OPTIONS, default: "none", group: "Links · Markers" },
  { id: "🔗 Enhanced Links.Link.Shadow.Enabled", key: "linkShadowEnabled", name: "Link shadow", type: "boolean", default: false, group: "Links · Shadows", tooltip: "Drop shadow under links in Classic Flow." },
  { id: "🔗 Enhanced Links.Marker.Shadow.Enabled", key: "markerShadowEnabled", name: "Marker shadow", type: "boolean", default: false, group: "Links · Shadows", tooltip: "Drop shadow under flow markers." },
  { id: "🔗 Enhanced Links.Shadow.Blur", key: "shadowBlur", name: "Drop shadow blur", type: "slider", min: 0, max: 10, step: 0.5, default: 5, group: "Links · Shadows" },
  { id: "🔗 Enhanced Links.Shadow.Offset", key: "shadowOffset", name: "Drop shadow offset", type: "slider", min: 0, max: 10, step: 0.5, default: 3, group: "Links · Shadows" },
  { id: "📦 Enhanced Nodes.Animate", key: "animate", name: "Node effect", type: "combo", options: NODE_ANIMATION_OPTIONS, default: 0, group: "Nodes · Effect", tooltip: "Effect drawn around every node." },
  { id: "📦 Enhanced Nodes.Animations.Enabled", key: "animationsEnabled", name: "Show base effect", type: "boolean", default: true, group: "Nodes · Effect", tooltip: "Off hides the effect but keeps node particles." },
  { id: "📦 Enhanced Nodes.Animation.Speed", key: "animationSpeed", name: "Node effect speed", type: "slider", min: 0.1, max: 5, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Direction", key: "direction", name: "Node effect direction", type: "combo", options: DIRECTION_OPTIONS, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Static.Mode", key: "staticMode", name: "Freeze node effects", type: "boolean", default: false, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Intensity", key: "intensity", name: "Node effect energy", type: "slider", min: 0, max: 3, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Animation.Size", key: "animationSize", name: "Node effect size", type: "slider", min: 0.5, max: 3, step: 0.1, default: 1, group: "Nodes · Effect" },
  { id: "📦 Enhanced Nodes.Animation.Glow", key: "animationGlow", name: "Node effect bloom", type: "slider", min: 0, max: 2, step: 0.1, default: 0.5, group: "Nodes · Effect", tooltip: "Multiplies Node effect energy." },
  { id: "📦 Enhanced Nodes.Quality", key: "quality", name: "Node effect quality", type: "combo", options: QUALITY_OPTIONS, default: 2, group: "Nodes · Effect", tooltip: "More detail, more GPU." },
  { id: "📦 Enhanced Nodes.Glow.Show", key: "glowShow", name: "Node effect glow", type: "boolean", default: true, group: "Nodes · Glow & hover", tooltip: "Off draws node effects without glow." },
  { id: "📦 Enhanced Nodes.Glow", key: "glow", name: "Node glow strength", type: "slider", min: 0, max: 2, step: 0.1, default: 0.5, group: "Nodes · Glow & hover", tooltip: "Glow of node effects and the hover outline." },
  { id: "📦 Enhanced Nodes.Color.Hover.Show", key: "colorHoverShow", name: "Hover outline", type: "boolean", default: false, group: "Nodes · Glow & hover", tooltip: "Outlines animated nodes while hovered or selected." },
  { id: "📦 Enhanced Nodes.Color.Hover", key: "colorHover", name: "Hover outline color", type: "color", default: "#00ff15", group: "Nodes · Glow & hover" },
  { id: "📦 Enhanced Nodes.Color.Mode", key: "colorMode", name: "Node effect colors", type: "combo", options: NODE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Color" },
  { id: "📦 Enhanced Nodes.Color.Primary", key: "colorPrimary", name: "Node primary color", type: "color", default: "#44aaff", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Secondary", key: "colorSecondary", name: "Node secondary color", type: "color", default: "#88ccff", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Accent", key: "colorAccent", name: "Node accent color", type: "color", default: "#0088ff", group: "Nodes · Color", tooltip: "Used when Node effect colors is Custom." },
  { id: "📦 Enhanced Nodes.Color.Scheme", key: "colorScheme", name: "Node color boost", type: "combo", options: COLOR_SCHEME_OPTIONS, default: "default", group: "Nodes · Color", tooltip: "Filter applied on top of the colors." },
  { id: "📦 Enhanced Nodes.Particle.Show", key: "particleShow", name: "Node particles", type: "boolean", default: false, group: "Nodes · Particles", tooltip: "Also drawn when Node effect is None." },
  { id: "📦 Enhanced Nodes.Particle.Density", key: "particleDensity", name: "Node particle density", type: "slider", min: 0, max: 3, step: 0.1, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Size", key: "particleSize", name: "Node particle size", type: "slider", min: 0.1, max: 3, step: 0.1, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Speed", key: "particleSpeed", name: "Node particle speed", type: "slider", min: 0.1, max: 5, step: 0.1, default: 1, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Intensity", key: "particleIntensity", name: "Node particle motion", type: "slider", min: 0, max: 3, step: 0.1, default: 1, group: "Nodes · Particles", tooltip: "How energetic the motion is." },
  { id: "📦 Enhanced Nodes.Particle.Glow", key: "particleGlow", name: "Node particle glow", type: "slider", min: 0, max: 2, step: 0.1, default: 0.5, group: "Nodes · Particles" },
  { id: "📦 Enhanced Nodes.Particle.Color.Mode", key: "particleColorMode", name: "Node particle colors", type: "combo", options: PARTICLE_COLOR_MODE_OPTIONS, default: "default", group: "Nodes · Particles", tooltip: "Complementary is the opposite hue of the node accent color." },
  { id: "📦 Enhanced Nodes.Color.Particle", key: "colorParticle", name: "Node particle color", type: "color", default: "#ffff00", group: "Nodes · Particles", tooltip: "Used when Node particle colors is Particle color." },
  { id: "📦 Enhanced Nodes.Text.Animation.Enabled", key: "textAnimationEnabled", name: "Animated titles", type: "boolean", default: false, group: "Nodes · Titles", tooltip: "Draws a styled copy of each node title." },
  { id: "📦 Enhanced Nodes.Text.Style", key: "textStyle", name: "Title style", type: "combo", options: TEXT_STYLE_OPTIONS, default: "neon", group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Color", key: "textColor", name: "Title color", type: "color", default: "#00ffff", group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Size", key: "textSize", name: "Title size", type: "slider", min: 8, max: 24, step: 1, default: 14, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Glow", key: "textGlow", name: "Title glow", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Letter.Spacing", key: "textLetterSpacing", name: "Title letter spacing", type: "slider", min: -2, max: 10, step: 0.25, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Position.X", key: "textPositionX", name: "Title offset X", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Position.Y", key: "textPositionY", name: "Title offset Y", type: "slider", min: -50, max: 50, step: 1, default: 0, group: "Nodes · Titles" },
  { id: "📦 Enhanced Nodes.Text.Rotation.Radius", key: "textRotationRadius", name: "Title orbit radius", type: "slider", min: 0, max: 50, step: 1, default: 0, group: "Nodes · Titles", tooltip: "Circles the title around its position." },
  { id: "📦 Enhanced Nodes.Text.Rotation.Angle", key: "textRotationAngle", name: "Title rotation", type: "slider", min: -180, max: 180, step: 5, default: 0, group: "Nodes · Titles" },
  { id: "🔗 Enhanced Links.Pause.During.Render", key: "pauseDuringRender", name: "Pause link animation during runs", type: "boolean", default: true, group: "Runs · During a run", tooltip: "Links hold a still frame while the queue is running." },
  { id: "📦 Enhanced Nodes.Pause.During.Render", key: "pauseDuringRender", name: "Pause node effects during runs", type: "boolean", default: true, group: "Runs · During a run", tooltip: "Node effects hold still while the queue is running; their particles keep moving." },
  { id: "📦 Enhanced Nodes.End Animation.Enabled", key: "endAnimationEnabled", name: "Completion effect", type: "boolean", default: false, group: "Runs · Completion", tooltip: "Has no effect yet." }
];
const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i;
function normalize(s, value) {
  const numeric = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  switch (s.type) {
    case "boolean":
      if (typeof value === "boolean") return value;
      return value === "true" ? true : value === "false" ? false : s.default;
    case "slider":
      return typeof numeric === "number" && !Number.isNaN(numeric) ? Math.min(s.max, Math.max(s.min, numeric)) : s.default;
    case "combo":
      return s.options.find((o) => o.value === value || o.value === numeric)?.value ?? s.default;
    case "color":
      return typeof value === "string" && HEX.test(value) ? `#${value.replace("#", "").toLowerCase()}` : value;
  }
}
function snapshot(prefix) {
  return Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix)).map((s) => [s.key, s.default]));
}
const L = snapshot(LINKS);
const N = snapshot(NODES);
function snapshotOf(id) {
  return id.startsWith(LINKS) ? L : N;
}
function show(s, value) {
  const values = snapshotOf(s.id);
  const shown = s.type !== "color" || HEX.test(String(value)) ? value : s.default;
  if (values[s.key] === shown) return;
  values[s.key] = shown;
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
    onChange: (value) => show(s, value)
  }] : []);
}
const linkSettings = params(LINKS);
const nodeSettings = params(NODES);
const unsaved = /* @__PURE__ */ new Map();
let saving = Promise.resolve();
function preview(id, value) {
  const s = SETTINGS.find((e) => e.id === id);
  show(s, normalize(s, value));
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
function hex2Hsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hsl2Hex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function validateHexColor(color) {
  if (!color || typeof color !== "string") return null;
  let c = color;
  if (c[0] !== "#") c = "#" + c;
  if (!/^#[0-9A-Fa-f]{6}$/.test(c)) return null;
  return c;
}
function enhanceColor(color, scheme) {
  if (!color || scheme === "default") return color;
  const valid = validateHexColor(color);
  if (!valid) return color;
  try {
    const [h, s, l] = hex2Hsl(valid);
    switch (scheme) {
      case "saturated":
        return hsl2Hex(h, Math.min(s * 1.3, 100), l);
      case "vivid":
        return hsl2Hex(h, Math.min(s * 1.4, 100), Math.min(l * 1.1, 100));
      case "contrast":
        return hsl2Hex(h, Math.min(s * 1.2, 100), l > 50 ? Math.min(l * 1.2, 100) : Math.max(l * 0.8, 0));
      case "bright":
        return hsl2Hex(h, s, Math.min(l * 1.25, 100));
      case "muted":
        return hsl2Hex(h, Math.max(s * 0.7, 0), Math.min(l * 1.1, 100));
      default:
        return valid;
    }
  } catch {
    return color;
  }
}
function getCustomLinkColors() {
  const colorMode = L.colorMode;
  const colorScheme = L.colorScheme;
  if (colorMode === "custom") {
    const primary = L.colorPrimary;
    const secondary = L.colorSecondary;
    const accent = L.colorAccent;
    return {
      primary: enhanceColor(validateHexColor(primary) || "#ffffff", colorScheme),
      secondary: enhanceColor(validateHexColor(secondary) || "#ff6600", colorScheme),
      accent: enhanceColor(validateHexColor(accent) || "#ff8800", colorScheme)
    };
  }
  return null;
}
function getLinkColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = L.colorScheme;
  return colors ? colors.primary : enhanceColor(defaultColor, scheme);
}
function getSecondaryColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = L.colorScheme;
  return colors ? colors.secondary : enhanceColor(defaultColor, scheme);
}
function getAccentColor(defaultColor) {
  const colors = getCustomLinkColors();
  const scheme = L.colorScheme;
  return colors ? colors.accent : enhanceColor(defaultColor, scheme);
}
const NODE_ANIMATION_COLORS = Object.freeze({
  gentlePulse: Object.freeze({ primary: "#44aaff", secondary: "#88ccff", accent: "#0088ff" }),
  neonNexus: Object.freeze({ primary: "#00ff88", secondary: "#00ffcc", accent: "#00ff44" }),
  cosmicRipple: Object.freeze({ primary: "#ff00ff", secondary: "#aa00ff", accent: "#ff40ff" }),
  flowerOfLife: Object.freeze({ primary: "#ffcc00", secondary: "#ff8800", accent: "#ffaa00" })
});
function getCustomNodeColors() {
  const colorMode = N.colorMode;
  const colorScheme = N.colorScheme;
  const animStyle = N.animate;
  const animColors = (() => {
    switch (animStyle) {
      case 2:
        return NODE_ANIMATION_COLORS.neonNexus;
      case 3:
        return NODE_ANIMATION_COLORS.cosmicRipple;
      case 4:
        return NODE_ANIMATION_COLORS.flowerOfLife;
      default:
        return NODE_ANIMATION_COLORS.gentlePulse;
    }
  })();
  if (colorMode === "custom") {
    const primary = N.colorPrimary;
    const secondary = N.colorSecondary;
    const accent = N.colorAccent;
    return {
      primary: enhanceColor(validateHexColor(primary) || animColors.primary, colorScheme),
      secondary: enhanceColor(validateHexColor(secondary) || animColors.secondary, colorScheme),
      accent: enhanceColor(validateHexColor(accent) || animColors.accent, colorScheme)
    };
  }
  return {
    primary: enhanceColor(animColors.primary, colorScheme),
    secondary: enhanceColor(animColors.secondary, colorScheme),
    accent: enhanceColor(animColors.accent, colorScheme)
  };
}
export {
  L,
  N,
  SETTINGS as S,
  getCustomLinkColors as a,
  getSecondaryColor as b,
  getAccentColor as c,
  commit as d,
  enhanceColor as e,
  getCustomNodeColors as f,
  getLinkColor as g,
  linkSettings as l,
  nodeSettings as n,
  preview as p,
  reset as r,
  snapshotOf as s,
  validateHexColor as v
};
//# sourceMappingURL=color-manager-CtPq5NfG.js.map
