import { app } from "/scripts/app.js";
import { g as guard, L, l as layers, a as live, c as clock, d as darker, b as dark, e as env, M as MAX_FLASH_HZ, w as wake, t as translucent, s as setting, i as installStyle, n as navigateOnDoubleClick, B as BADGES, T as TITLE, f as TOGGLE_ALL, p as panelShown, h as checked, F as FROZEN, S as SELECTION_FX, j as linkSettings, k as install, m as installPanel, o as installRuns, q as installFollow, r as installLinks, u as watch, v as errorNodes, x as currentLook, y as keyName, z as savedEarly, A as commandKeys, C as TOGGLE, D as keyText, E as running, G as shown$1, H as DISABLED, I as showPanel, J as LINKS_ON, N as NODES_ON, K as toggleLinks, O as toggleNodes, P as N, Q as toggleStatic, R as toggleFocus, U as FOCUS_ON, V as commit, W as showPicker, X as surpriseMe, Y as goBack, Z as selectedNodes, _ as effects, $ as pick, a0 as complete, a1 as resetEverything, a2 as goToRunning, a3 as nextError, a4 as goAlong } from "./chunks/menus-fA9Bxy3d.js";
const ASSIST = "Connection assist";
const RANGE = 200;
const CLASP = 120;
const SLACK = 10;
const SMALL = 0.75;
const HAND = 36;
const ARM = CLASP - 2 * HAND;
const HALF = 26.7;
const WRISTS = [[-26.9, -3.2], [27, -5.2]];
const FLIP = 0.3;
const POP_S = 0.18;
const SHINE_S = 0.8;
const WAVE = 0.22;
const WAVE_HZ = 0.7;
const EYE = 8;
const EYES = 20;
const PUPIL = 3.6;
const LOOK = 3.6;
const BLINKS = 7.4;
const BLINK_GAP = 4.3;
const BLINK_S = 0.18;
const FIRST_BLINK = 2.6;
const DASH = [6, 6];
const NO_DASH = [];
const MARCH = 24;
const RING = 9;
const WHITE = "#fdfdfd";
const INK = "#1d1d24";
const OUTLINE = 1.6;
const BLUSH = "rgba(255, 110, 150, 0.55)";
let shapes;
function finger(path, x1, y1, x2, y2, r) {
  const turn = Math.atan2(y2 - y1, x2 - x1);
  path.moveTo(x1 + r * Math.sin(turn), y1 - r * Math.cos(turn));
  path.arc(x2, y2, r, turn - Math.PI / 2, turn + Math.PI / 2);
  path.arc(x1, y1, r, turn + Math.PI / 2, turn + 1.5 * Math.PI);
  path.closePath();
}
function build() {
  const reach = new Path2D();
  reach.roundRect(-1, -9, 20, 19, 7);
  const tips = [[-6.3, 31], [-1.7, 34], [2.9, 32], [7.3, 28]];
  for (const [y, tip] of tips) finger(reach, 14, y, tip, y, 2.55);
  finger(reach, 7, -6.5, 19, -11.5, 3);
  const knuckles = new Path2D();
  for (const y of [-4, 0.5, 5]) {
    knuckles.moveTo(2.5, 0.9 * y);
    knuckles.lineTo(9, y);
  }
  const creases = new Path2D();
  for (let i = 1; i < tips.length; i++) {
    const y = (tips[i - 1][0] + tips[i][0]) / 2;
    const tip = Math.min(tips[i - 1][1], tips[i][1]) - 2.5;
    knuckles.moveTo(23, y);
    knuckles.lineTo(tip, y);
    creases.moveTo(19, y);
    creases.lineTo(tip, y);
  }
  creases.moveTo(10, -6.4);
  creases.quadraticCurveTo(14, -7.4, 17.5, -9.2);
  const cuff = new Path2D();
  cuff.roundRect(-10, -9.5, 10.5, 19, 4);
  const hands = new Path2D("M-25.6-12.5C-17.2-12-8.1-10.7-0.3-8.8C8.8-10.1 17.9-11.4 24.4-13.3C26.8-7.8 28.1-1.3 26.8 2.9C24.4 6.5 21.8 9.8 19.2 13C15.3 18.9 8.8 24.7 1.3 25C-1.6 25-3.5 24.1-4.8 23.1L-18.5 13.7C-21.1 11.7-23.7 9.1-27.6 6.2C-27.8 0-27.3-6.5-25.6-12.5Z");
  const curled = [[-6, 20.9, -3.9, 22.5, 2.5], [-9.8, 18.1, -7.7, 19.6, 2.7], [-13.9, 15, -11.8, 16.5, 2.9], [-18.3, 11.6, -16.2, 13.1, 2.9]].map(([x1, y1, x2, y2, r]) => {
    const path = new Path2D();
    finger(path, x1, y1, x2, y2, r);
    return path;
  });
  const clasped = new Path2D("M0-6.8C-6.1-5.9-10.9-4.5-11.3-2.3C-11.6-0.5-8.7-0.1-5.2-0.5C2.3-1.3 10.8-0.3 17.7 2.9L19.5 11.4M2.3 15.9L7 20.8M6.9 10.7L14 17.7");
  const cuffs = new Path2D("M-25.6-12.5C-23-12.3-21.1-12.2-19.8-12L-20.8 8.1C-23 7.5-25.6 6.8-27.6 6.2C-27.8 0-27.3-6.5-25.6-12.5ZM19.2-12C21.2-12.5 22.9-12.9 24.4-13.3C26.8-7.8 28.1-1.3 26.8 2.9C25.5 4.2 24.2 5.2 22.9 6.2C22.5 0 20.8-6.5 19.2-12Z");
  return { reach, knuckles, creases, cuff, clasp: [hands, ...curled], clasped, cuffs };
}
function inked(ctx, path, colour) {
  ctx.lineWidth = 2 * OUTLINE;
  ctx.strokeStyle = INK;
  ctx.stroke(path);
  ctx.fillStyle = colour;
  ctx.fill(path);
}
function arm(ctx, from, x, y, colour) {
  const d = Math.hypot(x - from, y);
  const nx = -y / d;
  const ny = (x - from) / d;
  const path = new Path2D();
  path.moveTo(from + 3 * nx, 3 * ny);
  path.lineTo(x + 5.5 * nx, y + 5.5 * ny);
  path.lineTo(x - 5.5 * nx, y - 5.5 * ny);
  path.lineTo(from - 3 * nx, -3 * ny);
  path.closePath();
  inked(ctx, path, colour);
}
function place(ctx, x, y, turn, size, flip) {
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.scale(size, flip ? -size : size);
}
function glove(ctx, s, palm, x, y, turn, size, cuff, stretch = 0) {
  ctx.save();
  place(ctx, x, y, turn, size, palm);
  if (stretch > 8) arm(ctx, -stretch, -8, 0, cuff);
  inked(ctx, s.reach, WHITE);
  ctx.lineWidth = 1.2;
  ctx.stroke(palm ? s.creases : s.knuckles);
  inked(ctx, s.cuff, cuff);
  ctx.restore();
}
function clasp(ctx, s, x, y, turn, size, flip, cuff, slot) {
  ctx.save();
  place(ctx, x, y, flip ? turn + Math.PI : turn, size, false);
  const [wx, wy] = WRISTS[flip ? 0 : 1];
  const from = flip ? -slot : slot;
  if (Math.abs(from) > Math.abs(wx)) arm(ctx, from, wx, wy, cuff);
  for (const part of s.clasp) inked(ctx, part, WHITE);
  ctx.lineWidth = 1.2;
  ctx.stroke(s.clasped);
  inked(ctx, s.cuffs, cuff);
  ctx.restore();
}
function shine(ctx, x, y, unit, p, tint2, lit) {
  const grown = 1 - (1 - p) ** 3;
  const core = lit ? WHITE : tint2;
  const glow = 0.3 + 0.5 * (1 - p);
  const r = (30 + 40 * grown) * unit;
  ctx.save();
  if (lit) ctx.globalCompositeOperation = "lighter";
  const aura = ctx.createRadialGradient(x, y, 0, x, y, r);
  aura.addColorStop(0, translucent(core, glow));
  aura.addColorStop(0.45, translucent(tint2, glow * 0.6));
  aura.addColorStop(1, translucent(tint2, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  if (p < 1) {
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = core;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const turn = i * Math.PI / 5 + 0.35 * grown;
      const [c, s] = [Math.cos(turn), Math.sin(turn)];
      const from = (18 + 6 * grown) * unit;
      const to = from + (i % 2 ? 22 : 34) * grown * unit;
      const w = 3 * unit;
      ctx.moveTo(x + c * from - s * w, y + s * from + c * w);
      ctx.lineTo(x + c * to, y + s * to);
      ctx.lineTo(x + c * from + s * w, y + s * from - c * w);
      ctx.closePath();
    }
    ctx.fill();
    const k = 4 * Math.sin(Math.PI * Math.min(1, 1.4 * p)) * unit;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const turn = i * Math.PI / 3 + 0.5;
      const far = (26 + 44 * grown) * unit;
      const sx = x + far * Math.cos(turn);
      const sy = y + far * Math.sin(turn);
      ctx.moveTo(sx, sy - 1.6 * k);
      ctx.quadraticCurveTo(sx, sy, sx + k, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + 1.6 * k);
      ctx.quadraticCurveTo(sx, sy, sx - k, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - 1.6 * k);
    }
    ctx.fill();
  }
  ctx.restore();
}
function lid(t) {
  const p = (t + BLINKS - FIRST_BLINK) % BLINKS;
  const u = p < BLINK_S ? p : p - BLINK_GAP;
  return u >= 0 && u < BLINK_S ? Math.max(0.1, Math.abs(Math.cos(Math.PI * u / BLINK_S))) : 1;
}
function eyes(ctx, box, x, y, unit, open, happy) {
  const cy = box[1] - Math.max(0, unit - 1) * EYE;
  for (let side = -0.5; side <= 0.5; side++) {
    const cx = box[0] + box[2] / 2 + side * EYES * unit;
    ctx.beginPath();
    ctx.ellipse(cx, cy, EYE * unit, EYE * unit * open, 0, 0, 2 * Math.PI);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.lineWidth = OUTLINE * unit;
    ctx.strokeStyle = INK;
    ctx.stroke();
    if (happy) {
      ctx.beginPath();
      ctx.arc(cx, cy + 3 * unit, 4.2 * unit * happy, Math.PI + 0.45, 2 * Math.PI - 0.45);
      ctx.lineWidth = 2.2 * unit;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + side * 1.5 * EYE * unit, cy + 1.05 * EYE * unit, 4 * unit * happy, 2.2 * unit * happy, 0, 0, 2 * Math.PI);
      ctx.fillStyle = BLUSH;
      ctx.fill();
      continue;
    }
    if (open < 0.5) continue;
    const dx = x - cx;
    const dy = y - cy;
    const far = Math.hypot(dx, dy);
    const k = far ? Math.min(LOOK * unit, far) / far : 0;
    const px = cx + dx * k;
    const py = cy + dy * k * open;
    ctx.beginPath();
    ctx.arc(px, py, PUPIL * unit, 0, 2 * Math.PI);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - 1.1 * unit, py - 1.1 * unit, 1.1 * unit, 0, 2 * Math.PI);
    ctx.fillStyle = WHITE;
    ctx.fill();
  }
}
function line(ctx, x, y, turn, d, unit, colour, pop, march) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.scale(unit, unit);
  ctx.strokeStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.max(0, d - RING), 0);
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.setLineDash(DASH);
  ctx.lineDashOffset = -march;
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
  ctx.beginPath();
  ctx.arc(d, 0, RING * (SMALL + (1 - SMALL) * pop), 0, 2 * Math.PI);
  ctx.globalAlpha = 0.3 * pop;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.globalAlpha = pop;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
const smooth = (x) => x * x * (3 - 2 * x);
const found = { node: void 0, slot: -1, x: 0, y: 0, d: 0 };
function take(node, i, sx, sy, x, y) {
  const d = (sx - x) ** 2 + (sy - y) ** 2;
  if (d >= found.d) return;
  found.node = node;
  found.slot = i;
  found.x = sx;
  found.y = sy;
  found.d = d;
}
function seek(canvas, link, x, y) {
  const reach = RANGE / canvas.ds.scale;
  const inputs = canvas.linkConnector.state.connectingTo === "input";
  const type = link.fromSlot.type;
  found.node = void 0;
  found.slot = -1;
  found.d = reach * reach;
  for (const node of canvas.visible_nodes) {
    const box = node.boundingRect;
    const dx = Math.max(0, box[0] - SLACK - x, x - box[0] - box[2] - SLACK);
    const dy = Math.max(0, box[1] - SLACK - y, y - box[1] - box[3] - SLACK);
    if (node === link.node || dx * dx + dy * dy >= found.d) continue;
    const slots = inputs ? node.inputs : node.outputs;
    for (let i = 0; i < slots.length; i++) {
      if (!LiteGraph.isValidConnection(inputs ? type : slots[i].type, inputs ? slots[i].type : type)) continue;
      const [sx, sy] = inputs ? node.getInputPos(i) : node.getOutputPos(i);
      take(node, i, sx, sy, x, y);
    }
  }
  const { subgraph } = canvas;
  if (subgraph && link.node !== subgraph.inputNode && link.node !== subgraph.outputNode) {
    const io = inputs ? subgraph.outputNode : subgraph.inputNode;
    const { slots } = io;
    for (let i = 0; i <= slots.length; i++) {
      const slot = slots[i] ?? io.emptySlot;
      if (LiteGraph.isValidConnection(inputs ? type : slot.type, inputs ? slot.type : type)) take(io, i, slot.pos[0], slot.pos[1], x, y);
    }
  }
  return found.node !== void 0;
}
const snapKey = (event) => L.assistSnapKey === "ctrl" ? event.ctrlKey || event.metaKey : L.assistSnapKey === "alt" && event.altKey;
let snapping = false;
const grips = (d, held) => held || L.assistAutoConnect && (L.assistMode === "line" || d <= CLASP);
function drop(canvas, event) {
  const { linkConnector } = canvas;
  const link = linkConnector.renderLinks[0];
  if (!link || !L.enabled || L.assistMode === "off" || guard.off(ASSIST)) return false;
  const { canvasX: x, canvasY: y } = event;
  if (!seek(canvas, link, x, y) || !grips(Math.sqrt(found.d) * canvas.ds.scale, snapKey(event))) return false;
  const node = found.node;
  const at = event;
  at.canvasX = found.x;
  at.canvasY = found.y;
  try {
    if (node instanceof LGraphNode) linkConnector.dropOnNode(node, event);
    else linkConnector.dropOnIoNode(node, event);
  } finally {
    at.canvasX = x;
    at.canvasY = y;
  }
  return true;
}
let dragged;
let released;
let began = 0;
let tint = "";
let mirrored = false;
let shone = -Infinity;
const shown = { node: void 0, slot: -1, there: false, clasped: false, since: 0 };
function drawAssist(canvas, ctx) {
  const { linkConnector } = canvas;
  const link = linkConnector.isConnecting ? linkConnector.renderLinks[0] : void 0;
  if (!link) dragged = released = void 0;
  if (!link || link === released || !L.enabled || L.assistMode === "off" || guard.off(ASSIST)) {
    live.assist = 0;
    return;
  }
  if (link !== dragged) {
    dragged = link;
    began = clock.assistTime;
    mirrored = false;
    const colour = LGraphCanvas.link_type_colors[String(link.fromSlot.type)] || canvas.default_link_color;
    tint = dark(canvas.clear_background_color) ? colour : darker(colour);
  }
  const held = canvas._highlight_pos;
  const end = LiteGraph.snaps_for_comfy ? linkConnector.state.snapLinksPos ?? held ?? canvas.graph_mouse : canvas.graph_mouse;
  const [x, y] = end;
  const [hx, hy] = held ?? end;
  let there = seek(canvas, link, hx, hy);
  if (held) {
    if (!there || Math.abs(found.x - held[0]) + Math.abs(found.y - held[1]) > 1) {
      found.node = void 0;
      found.slot = -1;
    }
    found.x = held[0];
    found.y = held[1];
    there = true;
  }
  const scale = canvas.ds.scale;
  const unit = 1 / scale;
  const d = Math.hypot(found.x - x, found.y - y) * scale;
  const clasped = there && (d <= CLASP || snapping);
  const t = clock.assistTime;
  const still = env.reducedMotion || L.staticMode;
  if (clasped && !shown.clasped && !still && L.assistShine && t - shone >= 1 / MAX_FLASH_HZ) shone = t;
  if (found.node !== shown.node || found.slot !== shown.slot || there !== shown.there || clasped !== shown.clasped) {
    shown.node = found.node;
    shown.slot = found.slot;
    shown.there = there;
    shown.clasped = clasped;
    shown.since = t;
  }
  const pop = still ? 1 : smooth(Math.min(1, (t - shown.since) / POP_S));
  const burst = clasped && L.assistShine && !still ? (t - shone) / SHINE_S : 1;
  const moving = !still && (L.assistMode === "line" ? there : !there || pop < 1 || burst < 1 || L.assistMode === "hands-eyes");
  live.assist = moving ? 1 : 0;
  if (moving) wake();
  if (L.assistMode === "line" && !there) return;
  const turn = Math.atan2(found.y - y, found.x - x);
  ctx.save();
  try {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (L.assistMode === "line") return line(ctx, x, y, turn, d, unit, tint, pop, still ? 0 : MARCH * (t - began) % (DASH[0] + DASH[1]));
    const s = shapes ??= build();
    const [fx, fy] = link.fromPos;
    const heading = there ? turn : Math.atan2(y - fy, x - fx);
    mirrored = mirrored ? Math.cos(heading) < FLIP : Math.cos(heading) < -FLIP;
    if (!there) {
      glove(ctx, s, false, x, y, heading + (still ? 0 : WAVE * Math.sin(2 * Math.PI * WAVE_HZ * (t - began))), unit, tint);
    } else if (clasped) {
      const k = 1.05 - 0.05 * pop;
      const off = Math.min(d / 2, HALF * k);
      const cx = x + Math.cos(turn) * off * unit;
      const cy = y + Math.sin(turn) * off * unit;
      if (L.assistShine) shine(ctx, cx, cy, unit, Math.min(1, burst), tint, dark(canvas.clear_background_color));
      clasp(ctx, s, cx, cy, turn, unit * k, mirrored, tint, (d - off) / k);
    } else {
      const near = smooth(Math.min(1, Math.max(0, (RANGE - d) / (RANGE - CLASP))));
      const size = unit * (SMALL + (1 - SMALL) * near);
      glove(ctx, s, false, x, y, turn, size, tint);
      const stretch = ARM * near * pop;
      const grown = size * (SMALL + (1 - SMALL) * pop);
      ctx.globalAlpha = pop;
      glove(ctx, s, true, found.x - Math.cos(turn) * stretch * unit, found.y - Math.sin(turn) * stretch * unit, turn + Math.PI, grown, tint, stretch * unit / grown);
      ctx.globalAlpha = 1;
    }
    if (L.assistMode === "hands-eyes") {
      const open = still || clasped ? 1 : lid(t - began);
      const happy = clasped ? pop : 0;
      eyes(ctx, link.node.boundingRect, x, y, unit, open, happy);
      if (found.node) eyes(ctx, found.node.boundingRect, x, y, unit, open, happy);
    }
  } finally {
    ctx.restore();
  }
}
function installAssist() {
  layers.assist = (canvas, ctx) => {
    try {
      drawAssist(canvas, ctx);
    } catch (error) {
      guard.fail(ASSIST, error);
    }
  };
  const { linkConnector } = app.canvas;
  const clear = () => {
    if (dragged) app.canvas.setDirty(true);
  };
  linkConnector.events.addEventListener("dropped-on-canvas", () => {
    released = linkConnector.renderLinks[0];
    clear();
  });
  linkConnector.events.addEventListener("reset", clear);
  const { dropOnNothing } = linkConnector;
  let dropping = false;
  linkConnector.dropOnNothing = function(event) {
    let dropped = false;
    if (!dropping) {
      dropping = true;
      try {
        dropped = drop(app.canvas, event);
      } catch (error) {
        guard.fail(ASSIST, error);
      } finally {
        dropping = false;
      }
    }
    if (!dropped) dropOnNothing.call(this, event);
  };
  const track = (event) => {
    const held = snapKey(event);
    if (held === snapping) return;
    snapping = held;
    if (dragged) app.canvas.setDirty(true);
  };
  window.addEventListener("keydown", track, { capture: true, passive: true });
  window.addEventListener("keyup", track, { capture: true, passive: true });
  window.addEventListener("blur", () => {
    snapping = false;
  });
}
const SAY_MS = 2e3;
const HINT_MS = 5e3;
let said;
function say(text, ms = SAY_MS) {
  const { toast } = app.extensionManager;
  if ("info" in toast) said = toast.info(text, { id: said, duration: ms });
  else app.extensionManager.toast.add({ severity: "info", summary: text, life: ms });
}
const needs = (work, part) => () => {
  if (part ? running[part] : running.links || running.nodes) work();
  else say(part ? DISABLED[part] : `${TITLE} is disabled in Settings › Extensions.`, HINT_MS);
};
const FOCUS_MODE = "🔗 Enhanced Links.Focus.Mode";
const FOLLOW = "🔗 Enhanced Links.Navigate.Follow";
function choices(id) {
  const s = setting(id);
  return [s, s.options.findIndex((o) => o.value === shown$1(id))];
}
function next(id) {
  const [{ name, options }, at] = choices(id);
  const option = options[(at + 1) % options.length];
  commit(id, option.value);
  say(`${name}: ${option.text}`);
}
function focusMode() {
  const [{ options }, at] = choices(FOCUS_MODE);
  return options[at].text;
}
const saying = (work) => () => {
  const text = work();
  if (text) say(text);
};
function toggleAll() {
  const on = !(L.enabled || N.enabled);
  if (L.enabled !== on) toggleLinks();
  if (N.enabled !== on) toggleNodes();
  const key = keyName(TOGGLE_ALL);
  say(on ? "Effects on" : key ? `Effects off — ${key} to restore` : "Effects off");
}
function stepSelection() {
  const nodes2 = selectedNodes();
  if (!nodes2.length) return say("Select a node first");
  const list = effects();
  const effect = list[(list.findIndex((e) => nodes2.every(e.has)) + 1) % list.length];
  pick(nodes2, effect.choices);
  say(`${nodes2.length} ${nodes2.length === 1 ? "node" : "nodes"}: ${effect.name}`);
}
function preview() {
  const { canvas } = app;
  const area = canvas.visible_area;
  const nodes2 = selectedNodes();
  const outputs = canvas.visible_nodes.filter((node) => node.constructor.nodeData?.output_node);
  const middle = { id: "view", pos: [area[0] + area[2] / 2, area[1] + area[3] / 2], graph: canvas.graph };
  complete(nodes2.length ? nodes2 : outputs.length ? outputs : [middle], `preview ${Date.now()}`);
}
async function resetAll() {
  const sure = await app.extensionManager.dialog.confirm({
    title: `Reset ${TITLE}`,
    message: `Every ${TITLE} setting goes back to its default, and the look to Subtle. You can undo it right after.`
  });
  if (sure) resetEverything();
}
const ID = "EnhancedLinksNodes.";
const panel = {
  id: `${ID}ShowPanel`,
  label: `Show ${TITLE} panel`,
  menubarLabel: "Panel",
  category: "view-controls",
  icon: "eln-icon",
  active: panelShown,
  function: needs(showPanel)
};
const all = {
  id: TOGGLE_ALL,
  label: "Toggle all effects",
  menubarLabel: "All effects",
  category: "essentials",
  icon: "pi pi-sparkles",
  active: () => checked(LINKS_ON) || checked(NODES_ON),
  function: needs(toggleAll)
};
const links = {
  id: `${ID}ToggleLinks`,
  label: "Toggle link effects",
  menubarLabel: "Link effects",
  category: "view-controls",
  icon: "pi pi-link",
  active: () => checked(LINKS_ON),
  function: needs(() => {
    toggleLinks();
    say(L.enabled ? "Link effects on" : "Link effects off");
  }, "links")
};
const nodes = {
  id: `${ID}ToggleNodes`,
  label: "Toggle node effects",
  menubarLabel: "Node effects",
  category: "view-controls",
  icon: "pi pi-objects-column",
  active: () => checked(NODES_ON),
  function: needs(() => {
    toggleNodes();
    say(N.enabled ? "Node effects on" : "Node effects off");
  }, "nodes")
};
const frozen = {
  id: `${ID}ToggleStatic`,
  label: "Freeze / unfreeze animation",
  menubarLabel: "Freeze animation",
  category: "view-controls",
  icon: "pi pi-pause",
  active: () => FROZEN.every(checked),
  function: needs(() => {
    toggleStatic();
    say(L.staticMode ? "Animation frozen" : "Animation unfrozen");
  })
};
const focus = {
  id: `${ID}ToggleFocus`,
  label: "Toggle selection focus",
  menubarLabel: "Selection focus",
  category: "view-controls",
  icon: "pi pi-bullseye",
  active: () => checked(FOCUS_ON),
  function: needs(() => {
    toggleFocus();
    say(L.focusEnabled ? `Selection focus: ${focusMode()}` : "Selection focus off");
  }, "links")
};
const toRunning = {
  id: `${ID}GoToRunning`,
  label: "Go to running node (or next error)",
  menubarLabel: "Go to running node",
  category: "essentials",
  icon: "pi pi-directions",
  function: needs(saying(goToRunning))
};
const toError = {
  id: `${ID}NextError`,
  label: "Go to next error",
  menubarLabel: "Next error",
  category: "essentials",
  icon: "pi pi-exclamation-triangle",
  function: needs(saying(nextError))
};
const follow = {
  id: `${ID}ToggleFollow`,
  label: "Toggle follow execution",
  menubarLabel: "Follow execution",
  category: "view-controls",
  icon: "pi pi-eye",
  active: () => checked(FOLLOW),
  function: needs(() => {
    commit(FOLLOW, !L.navigateFollow);
    say(L.navigateFollow ? "Follow execution on" : "Follow execution off");
  }, "links")
};
const look = {
  id: `${ID}ChooseLook`,
  label: "Choose a look…",
  menubarLabel: "Choose look…",
  category: "view-controls",
  icon: "pi pi-palette",
  function: needs(showPicker)
};
const surprise = {
  id: `${ID}SurpriseMe`,
  label: "Surprise me (random look)",
  menubarLabel: "Surprise me",
  icon: "pi pi-star",
  function: needs(surpriseMe)
};
const commands = [
  panel,
  all,
  links,
  nodes,
  frozen,
  focus,
  {
    id: `${ID}NextFocusMode`,
    label: "Next selection focus mode",
    category: "view-controls",
    icon: "pi pi-filter",
    // Turned on too, so the mode it names shows.
    function: needs(() => {
      if (!L.focusEnabled) toggleFocus();
      next(FOCUS_MODE);
    }, "links")
  },
  {
    id: `${ID}NextLinkStyle`,
    label: "Next link animation",
    category: "view-controls",
    icon: "pi pi-forward",
    function: needs(() => next("🔗 Enhanced Links.Animate"), "links")
  },
  {
    id: `${ID}NextNodeStyle`,
    label: "Next node effect",
    category: "view-controls",
    icon: "pi pi-forward",
    function: needs(() => next("📦 Enhanced Nodes.Animate"), "nodes")
  },
  look,
  surprise,
  toRunning,
  toError,
  follow,
  { id: `${ID}GoUpstream`, label: "Go to input node", category: "view-controls", icon: "pi pi-arrow-left", function: needs(saying(() => goAlong(true))) },
  { id: `${ID}GoDownstream`, label: "Go to output node", category: "view-controls", icon: "pi pi-arrow-right", function: needs(saying(() => goAlong(false))) },
  {
    id: `${ID}GoBack`,
    label: "Go back",
    category: "view-controls",
    icon: "pi pi-undo",
    function: needs(() => {
      if (!goBack()) say("Nothing to go back to");
    })
  },
  { id: SELECTION_FX, label: "Cycle node effect for selection", icon: "pi pi-sparkles", mutatesGraph: true, function: needs(stepSelection, "nodes") },
  { id: `${ID}PreviewCompletion`, label: "Preview completion effect", icon: "pi pi-play", function: needs(preview, "nodes") },
  { id: `${ID}ResetAll`, label: `Reset all ${TITLE} settings…`, icon: "pi pi-refresh", function: needs(() => void resetAll()) }
];
const KEYS = {
  alt: [
    { commandId: TOGGLE, combo: { key: "l", alt: true } },
    { commandId: TOGGLE, combo: { key: "¬", alt: true } },
    { commandId: TOGGLE_ALL, combo: { key: "k", alt: true } },
    { commandId: TOGGLE_ALL, combo: { key: "˚", alt: true } },
    { commandId: toRunning.id, combo: { key: "j", alt: true } },
    { commandId: toRunning.id, combo: { key: "∆", alt: true } }
  ],
  "alt-shift": [
    { commandId: TOGGLE, combo: { key: "l", alt: true, shift: true } },
    { commandId: TOGGLE, combo: { key: "Ò", alt: true, shift: true } },
    { commandId: TOGGLE_ALL, combo: { key: "k", alt: true, shift: true } },
    { commandId: TOGGLE_ALL, combo: { key: "", alt: true, shift: true } },
    { commandId: toRunning.id, combo: { key: "j", alt: true, shift: true } },
    { commandId: toRunning.id, combo: { key: "Ô", alt: true, shift: true } }
  ]
};
const KEY_SET = "🔗 Enhanced Links.Keys";
let bound = setting(KEY_SET).default;
const run = (command) => () => void app.extensionManager.command.execute(command.id);
const ext = {
  name: "enhanced.link.animations",
  settings: linkSettings,
  commands,
  // Read once as the extension registers, after ComfyUI's own keys and those of the extensions registered before
  // it, and before its settings are: Shortcut keys is read as saved. A key bound twice is an error toast (FE157
  // platform/keybindings/keybindingStore.ts L121-140, wrapped at services/extensionService.ts L42-49), so the keys a
  // command has already are left out.
  get keybindings() {
    bound = savedEarly(KEY_SET);
    const taken = new Set(commandKeys().values());
    return (KEYS[bound] ?? []).filter(({ combo }) => !taken.has(keyText(combo)));
  },
  // Three groups, which the menu parts with separators (FE157 stores/menuItemStore.ts L61-65); checks come from active().
  menuCommands: [
    { path: ["View", TITLE], commands: [panel.id, look.id, surprise.id] },
    { path: ["View", TITLE], commands: [all.id, links.id, nodes.id, frozen.id] },
    { path: ["View", TITLE], commands: [focus.id, follow.id, toRunning.id, toError.id] }
  ],
  // Drawn as it was given, so its icon stays as it is; the tooltip is read whenever the bar draws.
  actionBarButtons: [{
    icon: "eln-icon",
    get tooltip() {
      const key = keyName(TOGGLE_ALL);
      return key ? `${all.label} (${key})` : all.label;
    },
    onClick: run(all)
  }],
  aboutPageBadges: BADGES,
  // One item with one submenu level. The switches show their state in their text: the canvas menu has no checks. Once a
  // run is over, Go to running node goes to its errors.
  getCanvasMenuItems: () => {
    const errors = env.running ? 0 : errorNodes().length;
    return [{
      content: "Enhanced FX",
      has_submenu: true,
      submenu: {
        options: [
          ...[links, nodes, frozen].map((c) => ({ content: `${c.active() ? "☑" : "☐"} ${c.menubarLabel}`, callback: run(c) })),
          { content: `${focus.active() ? "☑" : "☐"} ${focus.menubarLabel}: ${focusMode()}`, callback: run(focus) },
          { content: `${follow.active() ? "☑" : "☐"} ${follow.menubarLabel}`, callback: run(follow) },
          errors ? { content: `${toError.menubarLabel} (${errors})`, callback: run(toError) } : { content: toRunning.menubarLabel, callback: run(toRunning) },
          { content: `Look: ${currentLook()?.name ?? "Custom"}…`, callback: run(look) },
          { content: surprise.menubarLabel, callback: run(surprise) },
          { content: "Open panel", callback: run(panel) }
        ]
      }
    }];
  },
  beforeRegisterNodeDef: navigateOnDoubleClick,
  async setup() {
    install();
    installPanel("links");
    installRuns("links");
    installFollow();
    installLinks();
    installAssist();
    watch((id) => {
      if (id === KEY_SET && L.keys !== bound) say("Reload the page to use the new shortcut keys", HINT_MS);
    });
    console.log("[EnhancedLinks] Extension registered with full batched rendering pipeline.");
  }
};
installStyle();
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
