import { app } from "/scripts/app.js";
import { M as N, a3 as translucent, a4 as revision, a5 as transformPane, a6 as syncRuns, a7 as overlaps, a8 as JELLY, a9 as kicked, L, aa as zoomedOut, ab as holdsStill, ac as during, ad as nodePalette, ae as effectOf, af as particlesOnly$1, ag as stepOf, ah as BYPASS, ai as NEVER, S as SELECTION_FX, aj as nodeMenu, ak as nodeSettings, k as install, m as installPanel, o as installRuns, l as layers, a as live, al as startSprites, am as drawBursts, g as guard, an as COMPLETION, ao as wobbles, ap as shapeNode, aq as drawNodeFx, c as clock, ar as OVER, as as dummy, at as startShaking, au as shake, av as reach, aw as UNDER, w as wake, ax as ownStyle, ay as CALM_ALPHA, az as STILL_NODE, aA as wobbling, aB as stopSprites } from "./chunks/menus-BpeAvtOf.js";
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
const shown$1 = /* @__PURE__ */ new WeakMap();
function titleOf(ctx, node) {
  setFont(ctx);
  let room = node.renderingSize[0] - LiteGraph.NODE_TITLE_HEIGHT * 2;
  let buttons = 0;
  for (const button of node.title_buttons) if (button.visible) buttons += button.getWidth(ctx) + 2;
  if (buttons > 0) room -= buttons - 20;
  const { title, pinned } = node;
  const collapsed = Boolean(node.flags.collapsed);
  let last = shown$1.get(node);
  if (!last || last.title !== title || last.pinned !== pinned || last.collapsed !== collapsed || last.room !== room || last.since !== revision) {
    const full = title + (pinned ? "📌" : "");
    const text = collapsed ? full.substring(0, 20) : cut(ctx, full, room);
    shown$1.set(node, last = { text, width: ctx.measureText(text).width, title, pinned, collapsed, room, since: revision });
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
const FX = ["", "gentle", "neon", "cosmic", "rosette", "flower", "jelly"];
const SELECTED = 8;
const RUNNING = 16;
const FAILED = 32;
const BYPASSED = 64;
const MUTED = 128;
const ONLY = 256;
const COLLAPSED = 512;
const STEADY = ONLY | COLLAPSED | SELECTED | RUNNING | FAILED;
const MOVES = [false, true, false, true, true, true, false];
const ATTRIBUTES = ["data-eln-fx", "data-eln-only", "data-eln-collapsed", "data-eln-sel", "data-eln-run", "data-eln-mode"];
let observed = null;
let observer;
let sheet;
let written = -1;
let pace = "";
let given = /* @__PURE__ */ new WeakMap();
let shown;
function lookOf(node, selected) {
  const fx = effectOf(node);
  const only = fx > 0 && particlesOnly$1(node);
  const step = stepOf(node);
  return fx | (only ? ONLY : 0) | (fx && node.flags.collapsed ? COLLAPSED : 0) | (fx && !only && N.selectionGlow && selected.has(node) ? SELECTED : 0) | (step?.end === Infinity ? N.runRing ? RUNNING : 0 : step?.failed && N.runError ? FAILED : 0) | (node.mode === BYPASS ? BYPASSED : node.mode === NEVER ? MUTED : 0);
}
const put = (el, name, value) => value ? el.setAttribute(name, value) : el.removeAttribute(name);
const BOUNCE = [1, 1.045, 0.98, 1.012, 1];
const BOUNCE_MS = 700;
function bounce(el, node) {
  const origin = `${node.pos[0] + el.offsetWidth / 2}px ${node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT + el.offsetHeight / 2}px`;
  el.animate(BOUNCE.map((scale) => ({ scale: String(scale), transformOrigin: origin })), { duration: BOUNCE_MS, easing: "ease-out" });
}
function mark(el, look) {
  put(el, "data-eln-fx", FX[look & 7]);
  el.toggleAttribute("data-eln-only", (look & ONLY) > 0);
  el.toggleAttribute("data-eln-collapsed", (look & COLLAPSED) > 0);
  el.toggleAttribute("data-eln-sel", (look & SELECTED) > 0);
  put(el, "data-eln-run", look & RUNNING ? "running" : look & FAILED ? "failed" : "");
  put(el, "data-eln-mode", look & BYPASSED ? "bypass" : look & MUTED ? "muted" : "");
}
function mounted(records) {
  const { canvas } = app;
  for (const record of records) {
    for (const el of record.addedNodes) {
      if (!(el instanceof HTMLElement)) continue;
      const node = canvas.graph?.getNodeById(el.dataset.nodeId);
      if (!node) continue;
      const look = lookOf(node, canvas.selectedItems);
      given.set(node, look);
      mark(el, look);
    }
  }
}
const SHORTEST = 0.8;
const period = (seconds) => `calc(${Math.max(SHORTEST, seconds / N.animationSpeed).toFixed(2)}s * var(--eln-slow, 1))`;
function stylesheet() {
  const { glow, animationGlow, animationSize: size, intensity } = N;
  const bloom = Math.round((6 + 24 * animationGlow) * size);
  const light = `color-mix(in srgb, var(--eln-c2) ${Math.round(Math.min(100, 45 * intensity))}%, transparent)`;
  const halo2 = N.glowShow && glow > 0 ? `0 0 ${Math.round(36 * glow)}px color-mix(in srgb, var(--eln-c1) 60%, transparent)` : "";
  const withHalo = (shadows) => halo2 ? `${halo2}, ${shadows}` : shadows;
  const r = Math.round(4 * size);
  const running = N.runRingColorMode === "custom" ? N.runRingColor : N.runRingColorMode === "effect" ? "var(--eln-c1, var(--primary-background))" : "var(--primary-background)";
  const turn = Array.from({ length: 9 }, (_, i) => `${i * 12.5}%{transform:translate(${(r * Math.cos(i * Math.PI / 4)).toFixed(1)}px,${(r * Math.sin(i * Math.PI / 4)).toFixed(1)}px)}`).join("");
  const colours = FX.slice(1).map((fx, i) => {
    const { primary, secondary, accent } = nodePalette(i + 1);
    return `.lg-node[data-eln-fx=${fx}]{--eln-c1:${primary};--eln-c2:${secondary};--eln-c3:${accent}}`;
  });
  return [
    ...colours,
    '.lg-node:is([data-eln-fx],[data-eln-run])::after{content:"";position:absolute;inset:-6px;z-index:-1;border-radius:18px;pointer-events:none;--eln-a:calc(var(--eln-mode, 1) * var(--eln-calm, 1));opacity:var(--eln-a)}',
    `.lg-node[data-eln-fx=gentle]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-breathe ${period(3)} ease-in-out infinite alternate}`,
    `.lg-node[data-eln-fx=neon]::after{border:1.5px solid var(--eln-c1);box-shadow:${withHalo(`0 0 4px var(--eln-c1), 0 0 ${bloom}px ${light}`)}}`,
    `.lg-node[data-eln-fx=cosmic]::after{border:1.5px solid var(--eln-c1);box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-ripple ${period(3)} ease-out infinite}`,
    `.lg-node[data-eln-fx=rosette]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-turn ${period(12)} linear infinite ${N.direction < 0 ? "reverse" : "normal"}}`,
    `.lg-node[data-eln-fx=flower]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-bloom ${period(16)} ease-in-out infinite ${N.direction < 0 ? "reverse" : "normal"}}`,
    `.lg-node[data-eln-fx=jelly]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)}}`,
    `.lg-node[data-eln-sel]::after{border:0;box-shadow:${withHalo(`0 0 ${Math.round(12 + 36 * glow)}px 2px color-mix(in srgb, var(--eln-c3) 75%, transparent)`)};animation:none}`,
    `.lg-node[data-eln-only]::after{border:0;box-shadow:${halo2 || "none"};animation:none}`,
    ".lg-node[data-eln-collapsed]:not([data-eln-run])::after{content:none}",
    `.lg-node[data-eln-run=running]::after{border:0;box-shadow:0 0 16px 2px color-mix(in srgb, ${running} 60%, transparent);animation:none;opacity:1}`,
    ".lg-node[data-eln-run=failed]::after{border:0;box-shadow:0 0 16px 2px rgb(255 59 48 / 55%);animation:none;opacity:1}",
    ".lg-node[data-eln-mode=bypass]{--eln-mode:0.4}",
    ".lg-node[data-eln-mode=muted]{--eln-mode:0.8}",
    ":root[data-eln-pace=still] .lg-node::after, .disable-animations .lg-node::after{animation:none}",
    ":root[data-eln-pace=calm]{--eln-calm:0.5;--eln-slow:4}",
    ":root[data-eln-pace=far] .lg-node:not([data-eln-run])::after{content:none}",
    "@keyframes eln-breathe{from{opacity:calc(var(--eln-a) * 0.35)}}",
    `@keyframes eln-ripple{0%{opacity:0;transform:scale(0.98)}20%{opacity:var(--eln-a);transform:none}100%{opacity:0;transform:scale(${(1 + 0.08 * size).toFixed(2)})}}`,
    `@keyframes eln-turn{${turn}}`,
    "@keyframes eln-bloom{0%{opacity:0;transform:scale(0.97)}25%{opacity:var(--eln-a);transform:none}94%{opacity:var(--eln-a)}100%{opacity:0}}"
  ].join("\n");
}
function off() {
  observer?.disconnect();
  sheet?.remove();
  sheet = void 0;
  for (const el of observed?.querySelectorAll(ATTRIBUTES.map((name) => `[${name}]`).join()) ?? []) for (const name of ATTRIBUTES) el.removeAttribute(name);
  observed = null;
  shown = void 0;
  pace = "";
  document.documentElement.removeAttribute("data-eln-pace");
}
function vueNodes(canvas) {
  const { graph } = canvas;
  const pane = LiteGraph.vueNodesMode && N.enabled ? transformPane() : null;
  if (!graph || !pane) {
    if (sheet || observed) off();
    return;
  }
  if (pane !== observed) {
    observed = pane;
    observer ??= new MutationObserver(mounted);
    observer.disconnect();
    observer.observe(pane, { childList: true });
    shown = void 0;
  }
  if (!sheet) {
    sheet = Object.assign(document.createElement("style"), { id: "eln-vue" });
    document.head.append(sheet);
    written = -1;
  }
  if (written !== revision) {
    written = revision;
    const css = stylesheet();
    if (sheet.textContent !== css) sheet.textContent = css;
  }
  if (graph !== shown) {
    shown = graph;
    given = /* @__PURE__ */ new WeakMap();
  }
  syncRuns(canvas);
  const selected = canvas.selectedItems;
  let moving = 0;
  for (const node of graph.nodes) {
    const look = lookOf(node, selected);
    if (MOVES[look & 7] && !(look & STEADY) && overlaps(node.boundingRect, canvas.visible_area, 0)) moving++;
    if ((look & 7) === JELLY && kicked(node)) {
      const el2 = pane.querySelector(`.lg-node[data-node-id="${node.id}"]`);
      if (el2 instanceof HTMLElement) bounce(el2, node);
    }
    if (given.get(node) === look) continue;
    given.set(node, look);
    const el = pane.querySelector(`.lg-node[data-node-id="${node.id}"]`);
    if (el) mark(el, look);
  }
  const crowded = L.perfStaticAbove > 0 && moving > L.perfStaticAbove / 4;
  const now = zoomedOut(canvas) ? "far" : holdsStill() || crowded ? "still" : during(N.pauseDuringRender) === "calm" ? "calm" : "";
  if (now !== pace) {
    pace = now;
    put(document.documentElement, "data-eln-pace", pace);
  }
}
const EFFECT = "Node effect";
const PARTICLES = "Node particles";
const TITLES = "Animated titles";
const [ROUND, CIRCLE, CARD] = [2, 3, 4];
const NO_TITLE = 1;
function styleOf(node) {
  if (!N.enabled || node.flags.collapsed) return void 0;
  const style = effectOf(node);
  if (style > 0) return style;
  return ownStyle(node) === void 0 && N.particleShow ? 0 : void 0;
}
const particlesOnly = (node, style) => style === 0 || particlesOnly$1(node);
const draws = (only) => N.particleShow || !only;
const keyOf = (style) => style ? EFFECT : PARTICLES;
function modeAlpha(canvas, node) {
  if (node.flags.ghost) return 0.3;
  return node.mode === BYPASS ? 0.2 : node.mode === NEVER ? 0.4 : canvas.editor_alpha;
}
const fxAlpha = (canvas, node) => modeAlpha(canvas, node) * (during(N.pauseDuringRender) === "calm" ? CALM_ALPHA : 1);
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
const lit = (canvas, style) => style !== void 0 && style > 0 && N.glowShow && !zoomedOut(canvas) && !guard.off(keyOf(style));
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
  ctx.globalAlpha = fxAlpha(canvas, node);
  ctx.fill();
}
function under(canvas, ctx) {
  startShaking(canvas);
  vueNodes(canvas);
  const { graph } = canvas;
  if (!graph) return;
  const vue = LiteGraph.vueNodesMode;
  const moving = !holdsStill();
  const titles = !vue && N.enabled && N.textAnimationEnabled && moving && !canvas.low_quality && !guard.off(TITLES);
  const far = zoomedOut(canvas);
  const area = canvas.visible_area;
  const scale = ctx.getTransform().a;
  for (const node of graph.nodes) {
    const style = styleOf(node);
    if (style === JELLY) shake(node);
    const only = style !== void 0 && (vue || particlesOnly(node, style));
    const shown2 = style !== void 0 && !far && draws(only) && !guard.off(keyOf(style));
    const glows = !vue && lit(canvas, style);
    const reach$1 = shown2 ? reach(style, node.size[0], node.size[1], only) : 0;
    if (!overlaps(node.renderArea, area, Math.max(0, reach$1))) continue;
    if (titles && node.title && !node.onDrawTitleText && node.title_mode !== NO_TITLE) live.nodes++;
    if (shown2 && moving) {
      if (style && style !== JELLY) live.nodes++;
      if (N.particleShow) live.particles++;
    }
    if (!glows && (!shown2 || reach$1 <= 0)) continue;
    ctx.save();
    try {
      ctx.translate(node.pos[0], node.pos[1]);
      if (glows) halo(canvas, ctx, node, style, scale);
      if (shown2 && reach$1 > 0) {
        shapeNode(ctx, node);
        ctx.beginPath();
        ctx.rect(area[0] - node.pos[0], area[1] - node.pos[1], area[2], area[3]);
        body(canvas, ctx, node);
        ctx.clip("evenodd");
        drawNodeFx(ctx, style, node, node.size[0], node.size[1], clock, partOf(canvas, node, UNDER), fxAlpha(canvas, node), only);
      }
    } catch (error) {
      guard.fail(keyOf(style), error);
    } finally {
      ctx.restore();
    }
  }
  if (wobbling) {
    live.nodes += wobbling;
    if (L.enabled) canvas.setDirty(true, true);
  }
  if (live.nodes || live.particles) wake();
}
function styledTitle(canvas, ctx, node) {
  ctx.save();
  try {
    const height = LiteGraph.NODE_TITLE_HEIGHT;
    const phase = (holdsStill() ? STILL_NODE : clock).nodePhase;
    drawTitle(ctx, titleOf(ctx, node), height, -height / 2, nodePalette(effectOf(node)).title, phase, modeAlpha(canvas, node));
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
const ext = {
  name: "enhanced.node.animations",
  settings: nodeSettings,
  async setup() {
    install();
    installPanel("nodes");
    installRuns("nodes");
    layers.nodes = under;
    layers.bursts = (canvas, ctx) => {
      if (!live.bursts) return;
      startSprites(ctx);
      try {
        drawBursts(canvas, ctx);
      } catch (error) {
        guard.fail(COMPLETION, error);
      } finally {
        stopSprites();
      }
    };
    const { drawNode, drawNodeShape } = LGraphCanvas.prototype;
    const { drawTitleText } = LGraphNode.prototype;
    LGraphCanvas.prototype.drawNode = function(...args) {
      const [node, ctx] = args;
      if (!wobbles(node)) return drawNode.apply(this, args);
      ctx.save();
      try {
        shapeNode(ctx, node);
        return drawNode.apply(this, args);
      } finally {
        ctx.restore();
      }
    };
    LGraphCanvas.prototype.drawNodeShape = function(...args) {
      const [node, ctx, size] = args;
      const style = styleOf(node);
      const fx = style !== void 0 && !zoomedOut(this) && !guard.off(keyOf(style));
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
          drawNodeFx(ctx, style, node, size[0], size[1], clock, partOf(this, node, OVER), fxAlpha(this, node), only);
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
    console.log("[EnhancedNodes] Extension registered with full animation pipeline.");
  },
  getNodeMenuItems: nodeMenu,
  // Per selected item; the toolbox shows each command once (FE157 components/graph/SelectionToolbox.vue L86-99).
  getSelectionToolboxCommands: (item) => item instanceof LGraphNode && N.enabled ? [SELECTION_FX] : []
};
app.registerExtension(ext);
//# sourceMappingURL=node_animations.js.map
