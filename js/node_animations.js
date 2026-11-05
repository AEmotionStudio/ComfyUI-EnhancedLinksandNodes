import { app } from "/scripts/app.js";
import { P as N, t as translucent, a5 as revision, a6 as transformPane, a7 as syncRuns, a8 as overlaps, a9 as JELLY, aa as kicked, L, ab as zoomedOut, ac as holdsStill, ad as during, ae as nodePalette, af as effectOf, ag as particlesOnly$1, ah as stepOf, ai as BYPASS, aj as NEVER, S as SELECTION_FX, ak as nodeMenu, al as nodeSettings, k as install, m as installPanel, o as installRuns, l as layers, a as live, am as startSprites, an as drawBursts, g as guard, ao as COMPLETION, ap as wobbles, aq as shapeNode, ar as drawNodeFx, c as clock, as as OVER, at as dummy, au as startShaking, av as prepareBackgrounds, aw as shake, ax as reach, ay as NO_TITLE, az as UNDER, w as wake, aA as ownStyle, aB as CALM_ALPHA, aC as STILL_NODE, aD as wobbling, aE as hasBackground, aF as drawBackground, aG as BACKGROUND, aH as stopSprites } from "./chunks/menus-tZZ10UH5.js";
const TAU = 2 * Math.PI;
const GLITCH = [["#ff0080", 0.7], ["#00ffff", 0.7], ["#ffff00", 0.5]];
const GROOVY = ["#7a3b10", "#d9411e", "#f26b1d", "#f2a81d"];
const CHROME = [[0, "#f4f6f8"], [0.45, "#9aa3ad"], [0.55, "#e9edf1"], [1, "#5d6670"]];
const MOLTEN = [[0, "#ffd166"], [0.5, "#ff7a1a"], [1, "#ff3d00"]];
const GLYPHS = "01#$%&*+=<>/\\?@ABCDEFXZ";
const graphemes = new Intl.Segmenter(void 0, { granularity: "grapheme" });
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
function lettersOf(ctx, title) {
  if (!title.letters) {
    const chars = Array.from(graphemes.segment(title.text), (part2) => part2.segment);
    const x = [];
    let before = "";
    for (const char of chars) {
      x.push(ctx.measureText(before).width);
      before += char;
    }
    title.letters = { chars, x };
  }
  return title.letters;
}
function cycle(phase, rate) {
  const u = (phase - Math.PI / 4) * rate / TAU % 1;
  return u < 0 ? u + 1 : u;
}
function hash(a, b) {
  let h = Math.imul(a ^ 2654435769, 2246822507) ^ Math.imul(b + 1663821227, 3266489909);
  h ^= h >>> 15;
  h = Math.imul(h, 739982445);
  return (h ^ h >>> 12) >>> 0;
}
const fill = (ctx, text, x, y, style) => {
  ctx.fillStyle = style;
  ctx.fillText(text, x, y);
};
function clipTo(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
}
function drawTitle(ctx, title, x, y, colour, phase, fade) {
  const { text, width } = title;
  const glow = N.textGlow;
  const size = N.textSize;
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
      const middle = tx + width / 2;
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
        const bursts = cycle(phase, 3) * 2;
        const burst = Math.floor(bursts);
        if (bursts - burst < 0.125) {
          ctx.shadowBlur = 0;
          const seed = Math.floor((phase - Math.PI / 4) * 3 / TAU) * 2 + burst;
          for (let j = 0; j < 2; j++) {
            const h = hash(seed, j);
            const shift = (3 + h % 3) * (h >>> 2 & 1 ? 1 : -1);
            ctx.save();
            clipTo(ctx, tx - 8, ty - size / 2 + (h >>> 3) % 80 * size * 0.01, width + 16, 2 + (h >>> 10) % 3);
            fill(ctx, text, tx + shift, ty, j ? GLITCH[1][0] : colour);
            ctx.restore();
          }
        }
        break;
      }
      case "retro": {
        const scan = Math.sin(phase * 5) * 0.5;
        fill(ctx, text, tx - 1, ty + scan, "rgba(255, 0, 0, 0.5)");
        fill(ctx, text, tx + 1, ty - scan, "rgba(0, 255, 255, 0.5)");
        ctx.shadowColor = colour;
        ctx.shadowBlur = 3 * glow;
        fill(ctx, text, tx, ty, colour);
        clipTo(ctx, tx - 4, ty - size * 0.7 + cycle(phase, 3) * size * 1.4, width + 8, 3);
        ctx.shadowBlur = 6 * glow;
        fill(ctx, text, tx + 1.5, ty, "#ffffff");
        break;
      }
      case "pulse": {
        const beat = 0.5 + Math.sin(phase * 2) * 0.5;
        const middle = tx + width / 2;
        ctx.translate(middle, ty);
        ctx.scale(1 + beat * 0.04, 1 + beat * 0.04);
        ctx.translate(-middle, -ty);
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
        const u = cycle(phase, 2);
        const [from, to] = u < 0.5 ? [0, 1] : u < 0.65 ? [(u - 0.5) / 0.15, 1] : u < 0.7 ? [1, 1] : [0, (u - 0.7) / 0.3];
        if (to > from) {
          ctx.beginPath();
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1;
          ctx.globalAlpha = alpha * 0.5 * fade;
          ctx.moveTo(tx + width * from, ty + 10);
          ctx.lineTo(tx + width * to, ty + 10);
          ctx.stroke();
        }
        break;
      }
      case "rainbow": {
        const { chars, x: at } = lettersOf(ctx, title);
        ctx.shadowColor = translucent("#ffffff", 0.5 * glow);
        ctx.shadowBlur = 8 * glow;
        fill(ctx, text, tx, ty, translucent("#ffffff", 0.2 * glow));
        ctx.shadowBlur = 0;
        const turn = phase * 3 * 180 / Math.PI;
        for (let i = 0; i < chars.length; i++) {
          const hue = Math.round(i * 25 + turn) % 360;
          fill(ctx, chars[i], tx + at[i], ty + Math.sin(phase * 10 - i * 0.6) * 3, `hsl(${hue < 0 ? hue + 360 : hue}, 100%, 65%)`);
        }
        break;
      }
      case "bounce": {
        const { chars, x: at } = lettersOf(ctx, title);
        ctx.shadowColor = colour;
        ctx.shadowBlur = 6 * glow;
        fill(ctx, text, tx, ty, translucent(colour, 0.15 * glow));
        ctx.shadowBlur = 0;
        ctx.fillStyle = colour;
        const foot = ty + size * 0.35;
        for (let i = 0; i < chars.length; i++) {
          const lift = Math.abs(Math.sin(phase * 6 - i * 0.5));
          if (lift >= 0.15) {
            ctx.fillText(chars[i], tx + at[i], ty - lift * 5);
            continue;
          }
          const middle = tx + (at[i] + (at[i + 1] ?? width)) / 2;
          ctx.save();
          ctx.translate(middle, foot);
          ctx.scale(1.1, 0.88);
          ctx.fillText(chars[i], tx + at[i] - middle, ty - foot);
          ctx.restore();
        }
        break;
      }
      case "typewriter": {
        const { chars, x: at } = lettersOf(ctx, title);
        const n = chars.length;
        const u = cycle(phase, 2);
        const typed = u < 0.45 ? n : u < 0.55 ? Math.ceil(n * (0.55 - u) / 0.1) : u < 0.6 ? 0 : Math.min(n, Math.ceil(n * (u - 0.6) / 0.4));
        ctx.shadowColor = colour;
        ctx.shadowBlur = 6 * glow;
        if (typed > 0) fill(ctx, typed === n ? text : chars.slice(0, typed).join(""), tx, ty, colour);
        if (u >= 0.45 || Math.sin(phase * 10) > 0) ctx.fillRect(tx + (typed < n ? at[typed] : width) + 1, ty - size * 0.45, Math.max(1.5, size * 0.1), size * 0.9);
        break;
      }
      case "decode": {
        ctx.shadowColor = colour;
        ctx.shadowBlur = 6 * glow;
        const u = cycle(phase, 2);
        if (u < 0.5) {
          fill(ctx, text, tx, ty, colour);
          break;
        }
        const { chars, x: at } = lettersOf(ctx, title);
        const n = chars.length;
        const step = Math.floor(phase * 60 / TAU);
        ctx.shadowBlur = 0;
        for (let i = 0; i < n; i++) {
          if (!chars[i].trim()) continue;
          const lockAt = 0.6 + 0.4 * (i + 1) / n;
          if (u < lockAt) {
            ctx.globalAlpha = 0.7 * fade;
            fill(ctx, GLYPHS[hash(i, step) % GLYPHS.length], tx + at[i], ty, colour);
            continue;
          }
          const popping = u - lockAt < 0.05;
          ctx.globalAlpha = fade;
          ctx.shadowBlur = popping ? 8 * glow : 0;
          fill(ctx, chars[i], tx + at[i], ty, popping ? "#ffffff" : colour);
        }
        break;
      }
      case "molten": {
        const drift = Math.sin(phase * 4) * 2;
        const heat = ctx.createLinearGradient(0, ty - size / 2 + drift, 0, ty + size / 2 + drift);
        for (const [offset, shade] of MOLTEN) heat.addColorStop(offset, shade);
        ctx.shadowColor = "rgba(255, 61, 0, 0.8)";
        ctx.shadowBlur = 8 * glow * (0.85 + 0.15 * (Math.sin(phase * 7) + 0.5 * Math.sin(phase * 10.3)) / 1.5);
        fill(ctx, text, tx, ty, heat);
        break;
      }
      case "chrome": {
        const metal = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
        for (const [offset, shade] of CHROME) metal.addColorStop(offset, shade);
        ctx.shadowColor = translucent(colour, 0.6 * glow);
        ctx.shadowBlur = 4 * glow;
        ctx.strokeStyle = "rgba(20, 24, 30, 0.8)";
        ctx.lineWidth = 1;
        ctx.strokeText(text, tx, ty);
        fill(ctx, text, tx, ty, metal);
        const u = cycle(phase, 3);
        if (u < 0.3) {
          const band = size * 1.7;
          const at = tx - band + (width + 2 * band) * u / 0.3;
          const sheen = ctx.createLinearGradient(at - band / 2, 0, at + band / 2, 0);
          sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
          sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.9)");
          sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.shadowBlur = 0;
          fill(ctx, text, tx, ty, sheen);
        }
        break;
      }
      case "groovy": {
        const sway = 1 + 0.4 * Math.sin(phase * 6);
        for (let i = 0; i < GROOVY.length; i++) {
          const step = (GROOVY.length - i) * 1.6;
          fill(ctx, text, tx + step * sway, ty + step, GROOVY[i]);
        }
        ctx.shadowColor = translucent(colour, 0.6 * glow);
        ctx.shadowBlur = 3 * glow;
        fill(ctx, text, tx, ty, colour);
        break;
      }
      case "hologram": {
        ctx.shadowColor = translucent(colour, 0.6 * glow);
        ctx.shadowBlur = 6 * glow;
        ctx.globalAlpha = 0.35 * fade;
        fill(ctx, text, tx, ty, colour);
        const u = cycle(phase, 3);
        const drift = (-phase * 8 % 4 + 4) % 4;
        ctx.beginPath();
        for (let line = ty - size / 2 - 4 + drift; line < ty + size / 2 + 2; line += 4) ctx.rect(tx - 4, line, width + 8, 2);
        ctx.clip();
        ctx.globalAlpha = (0.75 + 0.2 * Math.sin(phase * 8)) * fade;
        fill(ctx, text, tx + (u >= 0.5 && u < 0.55 ? u < 0.525 ? 1.5 : -1.5 : 0), ty, colour);
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
        const u = cycle(phase, 2);
        if (u < 0.3) {
          clipTo(ctx, tx - 1.5 * size + (width + 2 * size) * u / 0.3, ty - size, size, size * 2);
          ctx.shadowColor = colour;
          ctx.shadowBlur = 8 * glow;
          ctx.globalAlpha = 0.9 * fade;
          fill(ctx, text, tx, ty, "#ffffff");
        }
      }
    }
  } finally {
    ctx.restore();
  }
}
const FX = ["", "gentle", "neon", "cosmic", "rosette", "flower", "jelly", "circuit", "aurora", "ember"];
const EFFECT$1 = 15;
const SELECTED = 16;
const RUNNING = 32;
const FAILED = 64;
const BYPASSED = 128;
const MUTED = 256;
const ONLY = 512;
const COLLAPSED = 1024;
const STEADY = ONLY | COLLAPSED | SELECTED | RUNNING | FAILED;
const MOVES = [false, true, false, true, true, true, false, true, true, true];
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
  put(el, "data-eln-fx", FX[look & EFFECT$1]);
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
    `.lg-node[data-eln-fx=circuit]::after{border:1.5px dashed var(--eln-c2);box-shadow:${withHalo(`0 0 4px var(--eln-c1), 0 0 ${bloom}px ${light}`)};animation:eln-breathe ${period(2.4)} ease-in-out infinite alternate}`,
    `.lg-node[data-eln-fx=aurora]::after{box-shadow:${withHalo(`0 ${-Math.round(bloom / 3)}px ${bloom}px ${light}`)};animation:eln-sway ${period(6)} ease-in-out infinite alternate}`,
    `.lg-node[data-eln-fx=ember]::after{box-shadow:${withHalo(`0 ${-Math.round(bloom / 2)}px ${bloom}px ${light}`)};animation:eln-flicker ${period(1.6)} ease-in-out infinite}`,
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
    "@keyframes eln-bloom{0%{opacity:0;transform:scale(0.97)}25%{opacity:var(--eln-a);transform:none}94%{opacity:var(--eln-a)}100%{opacity:0}}",
    `@keyframes eln-sway{from{transform:translateX(${-r}px)}to{transform:translateX(${r}px)}}`,
    "@keyframes eln-flicker{50%{opacity:calc(var(--eln-a) * 0.7)}}"
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
    if (MOVES[look & EFFECT$1] && !(look & STEADY) && overlaps(node.boundingRect, canvas.visible_area, 0)) moving++;
    if ((look & EFFECT$1) === JELLY && kicked(node)) {
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
  live.nodes += prepareBackgrounds(canvas, ctx);
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
function backdrop(canvas, ctx, node, size, fill2) {
  if (!hasBackground(node)) return false;
  ctx.fillStyle = fill2;
  ctx.beginPath();
  body(canvas, ctx, node);
  ctx.fill();
  ctx.save();
  try {
    ctx.beginPath();
    body(canvas, ctx, node);
    ctx.clip();
    drawBackground(ctx, node, size[0], size[1], fxAlpha(canvas, node));
  } catch (error) {
    guard.fail(BACKGROUND, error);
  } finally {
    ctx.restore();
  }
  return true;
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
      if (backdrop(this, ctx, node, size, args[4])) args[4] = "transparent";
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
