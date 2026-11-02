import { app } from "/scripts/app.js";
import { z as N, W as translucent, X as revision, S as SELECTION_FX, Y as nodeMenu, Z as nodeSettings, b as install, d as installPanel, e as installRuns, _ as layers, $ as live, a0 as startSprites, a1 as drawBursts, a2 as guard, a3 as FIREWORKS, a4 as particlesOnly$1, a5 as drawNodeFx, a6 as clock, a7 as OVER, a8 as dummy, a9 as holdsStill, aa as reach, ab as overlaps, ac as UNDER, ad as wake, ae as ownStyle, af as during, ag as CALM_ALPHA, ah as STILL_NODE, ai as nodePalette, aj as stopSprites } from "./chunks/menus-CKk-joPo.js";
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
const EFFECT = "Node effect";
const PARTICLES = "Node particles";
const TITLES = "Animated titles";
const [ROUND, CIRCLE, CARD] = [2, 3, 4];
const [NEVER, BYPASS] = [2, 4];
const NO_TITLE = 1;
const styleWanted = (node) => ownStyle(node) ?? N.animate;
function styleOf(node) {
  if (!N.enabled || node.flags.collapsed) return void 0;
  const style = styleWanted(node);
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
  ctx.globalAlpha = fxAlpha(canvas, node);
  ctx.fill();
}
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
        drawNodeFx(ctx, style, node, node.size[0], node.size[1], clock, partOf(canvas, node, UNDER), fxAlpha(canvas, node), only);
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
