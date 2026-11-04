import { app } from "/scripts/app.js";
import { g as guard, L, l as layers, a as live, c as clock, d as darker, b as dark, e as env, w as wake, s as setting, i as installStyle, n as navigateOnDoubleClick, B as BADGES, T as TITLE, f as TOGGLE_ALL, p as panelShown, h as checked, F as FROZEN, S as SELECTION_FX, j as linkSettings, k as install, m as installPanel, o as installRuns, q as installFollow, r as installLinks, t as watch, u as errorNodes, v as currentLook, x as keyName, y as savedEarly, z as commandKeys, A as TOGGLE, C as keyText, D as running, E as shown$1, G as DISABLED, H as showPanel, I as LINKS_ON, N as NODES_ON, J as toggleLinks, K as toggleNodes, M as N, O as toggleStatic, P as toggleFocus, Q as FOCUS_ON, R as commit, U as showPicker, V as surpriseMe, W as goBack, X as selectedNodes, Y as effects, Z as pick, _ as complete, $ as resetEverything, a0 as goToRunning, a1 as nextError, a2 as goAlong } from "./chunks/menus-Cx0tk3FA.js";
const ASSIST = "Connection assist";
const RANGE = 150;
const CLASP = 75;
const SLACK = 10;
const SMALL = 0.75;
const FLIP = 0.3;
const POP_S = 0.18;
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
let shapes;
function oval(path, x, y, rx, ry, turn = 0) {
  path.moveTo(x + rx * Math.cos(turn), y + rx * Math.sin(turn));
  path.ellipse(x, y, rx, ry, turn, 0, 2 * Math.PI);
}
function fingers(spec) {
  const halves = [new Path2D(), new Path2D()];
  spec.forEach(([turn, x, y, rx, ry], i) => oval(halves[i % 2], x, y, rx, ry, turn));
  return halves;
}
function build() {
  const open = new Path2D();
  oval(open, 9, 0.5, 10.5, 10);
  oval(open, 10 + 10 * Math.cos(-1.25), 10 * Math.sin(-1.25), 6.5, 3.4, -1.25);
  const spread = [[-0.62, 8.5], [-0.21, 10], [0.2, 9.5], [0.6, 7.5]].map(([turn, length]) => [turn, 10 + 13 * Math.cos(turn), 0.5 + 13 * Math.sin(turn), length, 3.1]);
  const reach = new Path2D();
  oval(reach, 9, 1, 11, 9.5);
  oval(reach, 12.5, -8.6, 7.8, 3.6, -0.55);
  for (const [y, tip, turn] of [[-6.1, 33, -0.05], [-0.8, 35, -0.01], [4.5, 33, 0.03], [9.3, 28.5, 0.08]]) oval(reach, (12 + tip) / 2, y, (tip - 12) / 2, 2.9, turn);
  const creases = new Path2D();
  for (const y of [-3.45, 1.85, 6.9]) {
    creases.moveTo(17, y);
    creases.lineTo(26, y * 1.03);
  }
  const palms = new Path2D();
  oval(palms, -12, 1, 12.5, 10);
  oval(palms, 12, -0.5, 12.5, 10);
  const wrapped = [[-7.4, -15], [-2.5, -17], [2.4, -16.5], [7.2, -13]].map(([y, tip], i) => [0.1 * i - 0.1, (5 + tip) / 2, y, (5 - tip) / 2, 2.7]);
  const thumb = new Path2D();
  oval(thumb, 2, -9.6, 10, 3.5, -0.14);
  const cuff = new Path2D();
  cuff.roundRect(-10, -9.5, 10.5, 19, 4);
  const cuffs = new Path2D();
  cuffs.roundRect(-35, -9.5, 10.5, 19, 4);
  cuffs.roundRect(24.5, -9.5, 10.5, 19, 4);
  return { open: [open, ...fingers(spread)], reach, creases, clasp: [palms, ...fingers(wrapped), thumb], cuff, cuffs };
}
function inked(ctx, path, colour) {
  ctx.lineWidth = 2 * OUTLINE;
  ctx.strokeStyle = INK;
  ctx.stroke(path);
  ctx.fillStyle = colour;
  ctx.fill(path);
}
function place(ctx, x, y, turn, size, flip) {
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.scale(size, flip ? -size : size);
}
function glove(ctx, s, reaching, x, y, turn, size, flip, cuff) {
  ctx.save();
  place(ctx, x, y, turn, size, flip);
  if (reaching) {
    inked(ctx, s.reach, WHITE);
    ctx.lineWidth = 1.2;
    ctx.stroke(s.creases);
  } else for (const part of s.open) inked(ctx, part, WHITE);
  inked(ctx, s.cuff, cuff);
  ctx.restore();
}
function clasp(ctx, s, x, y, turn, size, flip, cuff) {
  ctx.save();
  place(ctx, x, y, turn, size, flip);
  for (const part of s.clasp) inked(ctx, part, WHITE);
  inked(ctx, s.cuffs, cuff);
  ctx.restore();
}
function lid(t) {
  const p = (t + BLINKS - FIRST_BLINK) % BLINKS;
  const u = p < BLINK_S ? p : p - BLINK_GAP;
  return u >= 0 && u < BLINK_S ? Math.max(0.1, Math.abs(Math.cos(Math.PI * u / BLINK_S))) : 1;
}
function eyes(ctx, box, x, y, unit, open) {
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
  if (found.node !== shown.node || found.slot !== shown.slot || there !== shown.there || clasped !== shown.clasped) {
    shown.node = found.node;
    shown.slot = found.slot;
    shown.there = there;
    shown.clasped = clasped;
    shown.since = t;
  }
  const still = env.reducedMotion || L.staticMode;
  const pop = still ? 1 : smooth(Math.min(1, (t - shown.since) / POP_S));
  const moving = !still && (L.assistMode === "line" ? there : !there || pop < 1 || L.assistMode === "hands-eyes");
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
      glove(ctx, s, false, x, y, heading + (still ? 0 : WAVE * Math.sin(2 * Math.PI * WAVE_HZ * (t - began))), unit, mirrored, tint);
    } else if (clasped) {
      clasp(ctx, s, (x + found.x) / 2, (y + found.y) / 2, turn, unit * (1.15 - 0.15 * pop), mirrored, tint);
    } else {
      const size = unit * (SMALL + (1 - SMALL) * smooth((RANGE - d) / (RANGE - CLASP)));
      glove(ctx, s, true, x, y, turn, size, mirrored, tint);
      ctx.globalAlpha = pop;
      glove(ctx, s, true, found.x, found.y, turn + Math.PI, size * (SMALL + (1 - SMALL) * pop), !mirrored, tint);
      ctx.globalAlpha = 1;
    }
    if (L.assistMode === "hands-eyes") eyes(ctx, (found.node ?? link.node).boundingRect, x, y, unit, still ? 1 : lid(t - began));
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
