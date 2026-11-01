import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { N, t as translucent, r as revision, p as pool, c as clock, n as nodePalette, C as CAP, d as rng, e as env, f as live, w as wake, g as disc, h as NODE_ANIMATION_OPTIONS, j as nodeSettings, i as install, a as installPanel, k as layers, m as guard, o as drawNodeFx, O as OVER, q as dummy, s as holdsStill, u as reach, U as UNDER, S as STILL_NODE, v as startSprites, x as stopSprites } from "./chunks/sidebar-DL7e4t_v.js";
const GLITCH = [["#ff0080", 0.7], ["#00ffff", 0.7], ["#ffff00", 0.5]];
let fontSince = -1;
let family = "";
let font = "";
let spacing = "";
function setFont(ctx) {
  if (fontSince !== revision || family !== LiteGraph.NODE_FONT) {
    [fontSince, family] = [revision, LiteGraph.NODE_FONT];
    font = `${N.textSize}px ${family}`;
    spacing = `${N.textLetterSpacing}px`;
  }
  ctx.font = font;
  ctx.letterSpacing = spacing;
}
function cut(ctx, text, room) {
  const width = (part2) => ctx.measureText(part2).width;
  if (room <= 0 || width(text) <= room) return text;
  const left = room - width("...");
  if (left <= 0) return "...";
  let [low, high, fits] = [0, text.length, 0];
  while (low <= high) {
    const mid = low + high >> 1;
    if (width(text.substring(0, mid)) <= left) [fits, low] = [mid, mid + 1];
    else high = mid - 1;
  }
  return `${text.substring(0, fits)}...`;
}
const shown = /* @__PURE__ */ new WeakMap();
function titleOf(ctx, node) {
  setFont(ctx);
  let room = node.renderingSize[0] - LiteGraph.NODE_TITLE_HEIGHT * 2;
  let buttons = 0;
  for (const button of node.title_buttons) if (button.visible) buttons += button.getWidth(ctx) + 2;
  if (buttons > 0) room -= buttons - 20;
  const { title, pinned } = node;
  const collapsed = Boolean(node.flags.collapsed);
  let last = shown.get(node);
  if (!last || last.title !== title || last.pinned !== pinned || last.collapsed !== collapsed || last.room !== room || last.since !== revision) {
    const full = title + (pinned ? "📌" : "");
    const text = collapsed ? full.substring(0, 20) : cut(ctx, full, room);
    shown.set(node, last = { text, width: ctx.measureText(text).width, title, pinned, collapsed, room, since: revision });
  }
  return last;
}
const fill = (ctx, text, x, y, style) => {
  ctx.fillStyle = style;
  ctx.fillText(text, x, y);
};
function drawTitle(ctx, title, x, y, colour, phase, fade) {
  const { text } = title;
  const glow = N.textGlow;
  let tx = x + N.textPositionX;
  let ty = y + N.textPositionY;
  if (N.textRotationRadius > 0) {
    tx += Math.cos(phase * 2) * N.textRotationRadius;
    ty += Math.sin(phase * 2) * N.textRotationRadius;
  }
  ctx.save();
  try {
    setFont(ctx);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.globalAlpha = fade;
    if (N.textRotationAngle !== 0) {
      const middle = tx + title.width / 2;
      ctx.translate(middle, ty);
      ctx.rotate(N.textRotationAngle * Math.PI / 180);
      ctx.translate(-middle, -ty);
    }
    switch (N.textStyle) {
      case "cyberpunk": {
        const offset = Math.sin(phase * 10) * 2;
        const alpha = 0.7 * glow;
        for (let i = 0; i < GLITCH.length; i++) {
          const [copy, opacity] = GLITCH[i];
          ctx.shadowColor = translucent(copy, alpha);
          ctx.shadowBlur = 5 * glow;
          fill(ctx, text, tx + offset * (i - 1), ty, translucent(copy, opacity));
        }
        ctx.shadowColor = translucent(colour, alpha);
        ctx.shadowBlur = 10 * glow;
        fill(ctx, text, tx, ty, colour);
        break;
      }
      case "retro": {
        const scan = Math.sin(phase * 5) * 0.5;
        fill(ctx, text, tx - 1, ty + scan, "rgba(255, 0, 0, 0.5)");
        fill(ctx, text, tx + 1, ty - scan, "rgba(0, 255, 255, 0.5)");
        ctx.shadowColor = colour;
        ctx.shadowBlur = 3 * glow;
        fill(ctx, text, tx, ty, colour);
        break;
      }
      case "pulse": {
        const beat = 0.5 + Math.sin(phase * 2) * 0.5;
        ctx.globalAlpha = (0.8 + beat * 0.2) * fade;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 10 * glow * beat;
        fill(ctx, text, tx, ty, colour);
        break;
      }
      case "minimal": {
        const alpha = 0.7 + Math.sin(phase * 2) * 0.3;
        ctx.globalAlpha = alpha * fade;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 3 * glow;
        fill(ctx, text, tx, ty, colour);
        ctx.beginPath();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5 * fade;
        ctx.moveTo(tx, ty + 10);
        ctx.lineTo(tx + title.width, ty + 10);
        ctx.stroke();
        break;
      }
      default: {
        const pulse = 0.7 + Math.sin(phase * 3) * 0.3;
        const alpha = 0.8 * glow * pulse;
        ctx.shadowColor = translucent(colour, alpha * 0.5);
        ctx.shadowBlur = 20 * glow;
        fill(ctx, text, tx, ty, translucent(colour, alpha * 0.3));
        ctx.shadowBlur = 10 * glow;
        fill(ctx, text, tx, ty, translucent(colour, alpha * 0.6));
        ctx.shadowBlur = 5 * glow;
        fill(ctx, text, tx, ty, colour);
        ctx.shadowBlur = 3;
        ctx.globalAlpha = 0.5 * pulse * fade;
        fill(ctx, text, tx, ty, "#ffffff");
      }
    }
  } finally {
    ctx.restore();
  }
}
const BURSTS = [
  { x: 0.05, y: -0.2, delay: 0, colour: "#FF3366", size: 3.2 },
  { x: 0.03, y: -0.15, delay: 0.1, colour: "#33EEFF", size: 2.9 },
  { x: 0.06, y: -0.15, delay: 0.2, colour: "#FFEE33", size: 3 }
];
const RATE = 0.84;
const SPARKS = 250;
const SPARKLES = 40;
const [CORE, SPARK, SPARKLE, GLOW] = [0, 1, 2, 3];
const SHOW = BURSTS.length * (1 + SPARKS + SPARKLES);
const bursts = [];
const progress = () => clock.burstTime * RATE;
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h;
}
function add(kind, owner, angle = 0, speed = 0, size = 0, colour = 0, trail = 0, seq = 0) {
  const i = pool.count++;
  pool.kind[i] = kind;
  pool.owner[i] = owner;
  pool.angle[i] = angle;
  pool.speed[i] = speed;
  pool.size[i] = size;
  pool.colour[i] = colour;
  pool.trail[i] = trail;
  pool.seq[i] = seq;
}
function fireworks(nodes, run) {
  if (pool.count && progress() < 1 || !nodes.length) return;
  pool.count = bursts.length = 0;
  clock.burstTime = 0;
  const { secondary, accent } = nodePalette(N.animate);
  for (const node of nodes) {
    if (pool.count + SHOW > CAP) break;
    const random = rng(hash(run) ^ hash(String(node.id)));
    for (const { x, y, delay, size, colour } of BURSTS) {
      const owner = bursts.push({ node, x, y, delay, size, colours: [colour, secondary, accent, "#FFFFFF"] }) - 1;
      if (env.reducedMotion) {
        add(GLOW, owner);
        break;
      }
      add(CORE, owner);
      for (let i = 0; i < SPARKS; i++) {
        const speed = 0.3 + random() * 0.7;
        const shade = Math.floor(random() * 4);
        add(SPARK, owner, i / SPARKS * Math.PI * 2, speed, speed, shade, random() < speed * 0.7 ? Math.floor(speed * 3) + 1 : 0, i);
      }
      for (let j = 0; j < SPARKLES; j++) add(SPARKLE, owner, random() * Math.PI * 2, random(), random(), 3, 0, j);
    }
  }
  live.bursts = pool.count;
  wake();
}
function drawBursts(canvas, ctx) {
  const phase = progress();
  if (phase >= 1) pool.count = bursts.length = 0;
  live.bursts = pool.count;
  if (!pool.count) return;
  const area = canvas.visible_area;
  const unit = 1 / canvas.ds.scale;
  const view = Math.min(area[2], area[3]);
  ctx.save();
  try {
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < pool.count; i++) {
      const burst = bursts[pool.owner[i]];
      const t = phase - burst.delay;
      if (t <= 0 || burst.node.graph !== canvas.graph) continue;
      const x = burst.node.pos[0] + area[2] * burst.x;
      const y = burst.node.pos[1] + area[3] * burst.y;
      const reach2 = view * 0.2 * burst.size;
      const colour = burst.colours[pool.colour[i]];
      switch (pool.kind[i]) {
        case CORE: {
          const fade = 1 - t * 1.2;
          if (fade <= 0) break;
          const radius = reach2 * (0.1 + 0.5 * t);
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, translucent("#FFFFFF", 0.95 * fade));
          gradient.addColorStop(0.5, translucent(colour, 0.8 * fade));
          gradient.addColorStop(1, translucent(colour, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case SPARK: {
          const alpha = 1 - t * 1.2;
          if (alpha <= 0) break;
          const speed = reach2 * pool.speed[i];
          const angle = pool.angle[i] + Math.sin(t * 10 + pool.seq[i]) * 0.05;
          const gravity = 0.2 * reach2;
          const dy = Math.sin(angle) * speed * t + gravity * t * t;
          const size = Math.max(1, 3 * (1 - t) * pool.size[i]) * unit;
          disc(ctx, x + Math.cos(angle) * speed * t, y + dy, size * 1.2, colour, alpha, true);
          for (let j = 1; j <= pool.trail[i]; j++) {
            const back = Math.max(0, t - 0.02 * j);
            disc(ctx, x + Math.cos(angle) * speed * back, y + Math.sin(angle) * speed * back + gravity * back * back, size * (1 - j * 0.2), colour, alpha * (0.7 - j * 0.2), false);
          }
          break;
        }
        case SPARKLE: {
          if (t >= 0.3 || pool.seq[i] >= Math.floor(SPARKLES * (1 - t / 0.3))) break;
          const dist = reach2 * 0.7 * t * pool.speed[i];
          disc(ctx, x + Math.cos(pool.angle[i]) * dist, y + Math.sin(pool.angle[i]) * dist, (1 + pool.size[i] * 4 * (1 - t)) * unit, colour, 0.95 * (1 - t * 3), false);
          break;
        }
        default: {
          const radius = reach2 * 0.4;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, translucent(colour, 0.5 * Math.sin(Math.PI * Math.min(t, 1))));
          gradient.addColorStop(1, translucent(colour, 0));
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
const EFFECT = "Node effect";
const PARTICLES = "Node particles";
const TITLES = "Animated titles";
const FIREWORKS = "Fireworks";
const [ROUND, CIRCLE, CARD] = [2, 3, 4];
const [NEVER, BYPASS] = [2, 4];
const NO_TITLE = 1;
const OWN_STYLE = "enhanced_fx_style";
const OWN_ONLY = "enhanced_fx_particles_only";
const OWN_COMPLETION = "enhanced_fx_completion";
const STYLES = new Set(NODE_ANIMATION_OPTIONS.map((option) => option.value));
function ownStyle(node) {
  const style = node.properties[OWN_STYLE];
  return STYLES.has(style) ? style : void 0;
}
const styleWanted = (node) => ownStyle(node) ?? N.animate;
function styleOf(node) {
  if (!N.enabled || node.flags.collapsed) return void 0;
  const style = styleWanted(node);
  if (style > 0) return style;
  return ownStyle(node) === void 0 && N.particleShow ? 0 : void 0;
}
function particlesOnly(node, style) {
  const own = node.properties[OWN_ONLY];
  return style === 0 || (typeof own === "boolean" ? own : !N.animationsEnabled);
}
const draws = (only) => N.particleShow || !only;
const keyOf = (style) => style ? EFFECT : PARTICLES;
function modeAlpha(canvas, node) {
  if (node.flags.ghost) return 0.3;
  return node.mode === BYPASS ? 0.2 : node.mode === NEVER ? 0.4 : canvas.editor_alpha;
}
const ROUND_CORNERS = [0];
const CARD_CORNERS = [0, 0, 0, 0];
function body(canvas, ctx, node) {
  const box = node.boundingRect;
  const left = box[0] - node.pos[0];
  const top = box[1] - node.pos[1];
  const shape = node.renderingShape;
  ROUND_CORNERS[0] = CARD_CORNERS[0] = CARD_CORNERS[1] = LiteGraph.ROUND_RADIUS;
  if (canvas.low_quality) ctx.rect(left, top, box[2], box[3]);
  else if (shape === ROUND || shape === CARD) ctx.roundRect(left, top, box[2], box[3], shape === CARD ? CARD_CORNERS : ROUND_CORNERS);
  else if (shape === CIRCLE) ctx.arc(node.size[0] / 2, node.size[1] / 2, node.size[0] / 2, 0, Math.PI * 2);
  else ctx.rect(left, top, box[2], box[3]);
}
const part = { sides: UNDER, x0: 0, y0: 0, x1: 0, y1: 0, round: 0 };
function partOf(canvas, node, sides) {
  const box = node.boundingRect;
  const shape = node.renderingShape;
  part.sides = sides;
  part.x0 = box[0] - node.pos[0];
  part.y0 = box[1] - node.pos[1];
  part.x1 = part.x0 + box[2];
  part.y1 = part.y0 + box[3];
  part.round = canvas.low_quality || shape !== ROUND && shape !== CARD && shape !== CIRCLE ? 0 : shape === CIRCLE ? -1 : LiteGraph.ROUND_RADIUS;
  return part;
}
const lit = (canvas, style) => style !== void 0 && style > 0 && N.glowShow && !canvas.low_quality && !guard.off(keyOf(style));
function halo(canvas, ctx, node, style, scale) {
  const shift = Math.ceil((canvas.visible_area[2] + node.boundingRect[2]) * scale) + 64;
  ctx.translate(shift / scale, 0);
  ctx.beginPath();
  body(canvas, ctx, node);
  ctx.translate(-shift / scale, 0);
  ctx.fillStyle = node.renderingBgColor;
  ctx.shadowColor = nodePalette(style).primary;
  ctx.shadowBlur = 10 * N.glow;
  ctx.shadowOffsetX = 2 * canvas.ds.scale - shift;
  ctx.shadowOffsetY = 2 * canvas.ds.scale;
  ctx.globalAlpha = modeAlpha(canvas, node);
  ctx.fill();
}
const overlaps = (box, area, margin) => box[0] - margin <= area[0] + area[2] && box[0] + box[2] + margin >= area[0] && box[1] - margin <= area[1] + area[3] && box[1] + box[3] + margin >= area[1];
function under(canvas, ctx) {
  const { graph } = canvas;
  if (!graph || LiteGraph.vueNodesMode) return;
  const moving = !holdsStill();
  const titles = N.enabled && N.textAnimationEnabled && moving && !canvas.low_quality && !guard.off(TITLES);
  const area = canvas.visible_area;
  const scale = ctx.getTransform().a;
  for (const node of graph.nodes) {
    const style = styleOf(node);
    const only = style !== void 0 && particlesOnly(node, style);
    const shown2 = style !== void 0 && draws(only) && !guard.off(keyOf(style));
    const glows = lit(canvas, style);
    const reach$1 = shown2 ? reach(style, node.size[0], node.size[1], only) : 0;
    if (!overlaps(node.renderArea, area, Math.max(0, reach$1))) continue;
    if (titles && node.title && !node.onDrawTitleText && node.title_mode !== NO_TITLE) live.nodes++;
    if (shown2 && moving) {
      if (style) live.nodes++;
      if (N.particleShow) live.particles++;
    }
    if (!glows && (!shown2 || reach$1 <= 0)) continue;
    ctx.save();
    try {
      ctx.translate(node.pos[0], node.pos[1]);
      if (glows) halo(canvas, ctx, node, style, scale);
      if (shown2 && reach$1 > 0) {
        ctx.beginPath();
        ctx.rect(area[0] - node.pos[0], area[1] - node.pos[1], area[2], area[3]);
        body(canvas, ctx, node);
        ctx.clip("evenodd");
        drawNodeFx(ctx, style, node, node.size[0], node.size[1], clock, partOf(canvas, node, UNDER), modeAlpha(canvas, node), only);
      }
    } catch (error) {
      guard.fail(keyOf(style), error);
    } finally {
      ctx.restore();
    }
  }
  if (live.nodes || live.particles) wake();
}
function styledTitle(canvas, ctx, node) {
  ctx.save();
  try {
    const height = LiteGraph.NODE_TITLE_HEIGHT;
    const phase = (holdsStill() ? STILL_NODE : clock).nodePhase;
    drawTitle(ctx, titleOf(ctx, node), height, -height / 2, nodePalette(styleWanted(node)).title, phase, modeAlpha(canvas, node));
    return true;
  } catch (error) {
    guard.fail(TITLES, error);
    return false;
  } finally {
    ctx.restore();
  }
}
let shaping;
let titled;
function pick(node, choices) {
  app.canvas.emitBeforeChange();
  for (const [key, value] of Object.entries(choices)) {
    if (value === void 0) delete node.properties[key];
    else node.properties[key] = value;
  }
  app.canvas.emitAfterChange();
  app.canvas.setDirty(true, false);
}
const entry = (content, ticked, callback) => ({ content: ticked ? `✓ ${content}` : content, callback });
const reached = /* @__PURE__ */ new Set();
let ranOn;
function celebrates(node) {
  const own = node.properties[OWN_COMPLETION];
  if (own === "fireworks") return true;
  if (own === "off") return false;
  return N.endAnimationEnabled && reached.has(String(node.id)) && Boolean(node.constructor.nodeData?.output_node);
}
const ext = {
  name: "enhanced.node.animations",
  settings: nodeSettings,
  async setup() {
    install();
    installPanel("nodes");
    layers.nodes = under;
    layers.bursts = (canvas, ctx) => {
      if (!live.bursts) return;
      startSprites(ctx);
      try {
        drawBursts(canvas, ctx);
      } catch (error) {
        guard.fail(FIREWORKS, error);
      } finally {
        stopSprites();
      }
    };
    const { drawNodeShape } = LGraphCanvas.prototype;
    const { drawTitleText } = LGraphNode.prototype;
    LGraphCanvas.prototype.drawNodeShape = function(...args) {
      const [node, ctx, size] = args;
      const style = styleOf(node);
      const fx = style !== void 0 && !guard.off(keyOf(style));
      if (lit(this, style)) ctx.shadowColor = "transparent";
      shaping = node;
      titled = void 0;
      try {
        drawNodeShape.apply(this, args);
      } finally {
        shaping = void 0;
      }
      const only = fx && particlesOnly(node, style);
      if (fx && draws(only)) {
        ctx.save();
        try {
          ctx.beginPath();
          body(this, ctx, node);
          ctx.clip();
          drawNodeFx(ctx, style, node, size[0], size[1], clock, partOf(this, node, OVER), modeAlpha(this, node), only);
        } catch (error) {
          guard.fail(keyOf(style), error);
        } finally {
          ctx.restore();
        }
      }
      if (titled && !styledTitle(this, ctx, node)) drawTitleText.call(node, ctx, titled);
    };
    LGraphNode.prototype.drawTitleText = function(...args) {
      if (!N.enabled || !N.textAnimationEnabled || !this.title || this.onDrawTitleText || args[1].low_quality || guard.off(TITLES)) return drawTitleText.apply(this, args);
      if (shaping === this) titled = args[1];
      else if (!styledTitle(app.canvas, args[0], this)) return drawTitleText.apply(this, args);
      args[0] = dummy();
      return drawTitleText.apply(this, args);
    };
    api.addEventListener("execution_start", () => {
      reached.clear();
      ranOn = app.canvas?.graph;
    });
    api.addEventListener("executing", ({ detail }) => {
      if (detail != null) reached.add(String(detail));
    });
    api.addEventListener("execution_cached", ({ detail }) => {
      for (const id of detail.nodes) reached.add(String(id));
    });
    api.addEventListener("execution_success", ({ detail }) => {
      const graph = app.canvas?.graph;
      if (N.enabled && graph && graph === ranOn && !guard.off(FIREWORKS)) fireworks(graph.nodes.filter(celebrates), detail.prompt_id);
    });
    console.log("[EnhancedNodes] Extension registered with full animation pipeline.");
  },
  // One submenu level each, with has_submenu, so the Vue node menu shows them too (FE157 composables/graph/contextMenuConverter.ts L428-447).
  getNodeMenuItems(node) {
    const style = ownStyle(node);
    const only = node.properties[OWN_ONLY];
    const completion = node.properties[OWN_COMPLETION];
    const particles = typeof only === "boolean" ? only : !N.animationsEnabled;
    return [
      {
        content: "Node FX",
        has_submenu: true,
        submenu: {
          options: [
            entry("Use global", style === void 0 && typeof only !== "boolean", () => pick(node, { [OWN_STYLE]: void 0, [OWN_ONLY]: void 0 })),
            ...NODE_ANIMATION_OPTIONS.map((option) => entry(option.text, style === option.value, () => pick(node, { [OWN_STYLE]: option.value }))),
            null,
            entry("Particles only", particles, () => pick(node, { [OWN_ONLY]: !particles }))
          ]
        }
      },
      {
        content: "Completion FX",
        has_submenu: true,
        submenu: {
          options: [
            entry("Use global", completion !== "fireworks" && completion !== "off", () => pick(node, { [OWN_COMPLETION]: void 0 })),
            entry("Fireworks", completion === "fireworks", () => pick(node, { [OWN_COMPLETION]: "fireworks" })),
            entry("Off", completion === "off", () => pick(node, { [OWN_COMPLETION]: "off" }))
          ]
        }
      }
    ];
  }
};
app.registerExtension(ext);
//# sourceMappingURL=node_animations.js.map
