import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { N, e as env, t as nodePalette, u as translucent, T as TURN, v as noise, x as particleColour, y as revision, z as pool, c as clock, C as CAP, A as rng, l as live, w as wake, B as disc, E as NODE_ANIMATION_OPTIONS, F as nodeSettings, q as install, b as layers, a as guard, d as dummy, f as startSprites, h as stopSprites } from "./chunks/particles-rmz1g5bC.js";
const STILL_NODE = { nodePhase: Math.PI / 4, particleTime: 0, nodeTime: 0 };
const holdsStill = () => N.staticMode || N.pauseDuringRender && env.running || env.reducedMotion;
const UNDER = 1;
const OVER = 2;
let part$1;
let fade = 1;
let held = false;
let outlined = false;
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
function pale(colour, alpha) {
  if (colour.charCodeAt(0) !== 35) return translucent(colour, alpha);
  if (palesSince !== revision) {
    pales.clear();
    palesSince = revision;
  }
  let start = pales.get(colour);
  if (start === void 0) {
    const pair = (i) => parseInt(colour.slice(i, i + 2), 16) || 255;
    pales.set(colour, start = `rgba(${pair(1)}, ${pair(3)}, ${pair(5)}, `);
  }
  return `${start}${alpha})`;
}
function outline(ctx, x, y, w, h, selected, colour) {
  save(ctx);
  const blur = 15 * N.animationGlow;
  ctx.shadowColor = colour(N.colorHover, 0.5);
  ctx.shadowBlur = selected ? blur * 1.5 : blur;
  ctx.strokeStyle = colour(N.colorHover, 0.7);
  ctx.lineWidth = 2;
  ctx.globalAlpha = fade;
  ctx.strokeRect(x, y, w, h);
  restore(ctx);
}
function gentlePulse(ctx, node, w, h, k, pal, only) {
  const { quality, animationGlow: glow, animationSize: size, particleSpeed: speed, particleIntensity: motion } = N;
  const { primary, secondary, accent } = pal;
  const phase = k.nodePhase;
  const time = held ? phase : TURN * k.particleTime;
  const radius = Math.max(w, h) * (0.5 + quality * 0.1) * size;
  const cx = w / 2;
  const cy = h / 2;
  save(ctx);
  ctx.translate(cx, cy);
  if (outlined) outline(ctx, -cx, -cy, w, h, node.selected, pale);
  let blur = 0;
  if (!only) {
    const breathe = Math.pow(Math.sin(held ? phase : phase * 0.375 * N.direction * N.animationSpeed), 2);
    const pulse = 0.4 + 0.4 * breathe * (N.intensity * 1.5 * 0.75);
    const inner = radius * pulse;
    const outer = radius * (1.2 + glow * 0.4) * pulse;
    if (circle(cx, cy, inner)) {
      const alpha = 0.2 * glow * (0.5 + breathe * 0.5);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, inner);
      gradient.addColorStop(0, pale("#ffffff", Math.min(alpha + 0.15, 1)));
      gradient.addColorStop(0.3, pale(primary, alpha));
      gradient.addColorStop(0.7, pale(secondary, alpha * 0.6));
      gradient.addColorStop(1, pale(accent, 0));
      ctx.beginPath();
      ctx.arc(0, 0, inner, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = Math.min(0.2 + Math.abs(breathe) * 0.3 + glow * 0.2, 1) * fade;
      ctx.fill();
    }
    if (circle(cx, cy, outer)) {
      const alpha = 0.1 * glow * (0.5 + breathe * 0.5);
      const gradient = ctx.createRadialGradient(0, 0, radius * 0.6 * pulse, 0, 0, outer);
      gradient.addColorStop(0, pale(secondary, alpha));
      gradient.addColorStop(0.6, pale(accent, alpha * 0.5));
      gradient.addColorStop(1, pale(accent, 0));
      ctx.beginPath();
      ctx.arc(0, 0, outer, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = Math.min(0.15 + Math.abs(breathe) * 0.2 + glow * 0.15, 1) * fade;
      ctx.fill();
    }
    if (quality > 1) {
      ctx.shadowColor = pale(secondary, 0.3);
      ctx.shadowBlur = blur = 10 * glow * (quality * 0.5);
    }
  }
  if (N.particleShow) {
    const { particleGlow: dotGlow } = N;
    const count = Math.floor((8 + quality * 2) * N.particleDensity);
    const base = (4 + quality) * size * N.particleSize;
    const wobble = quality > 1 ? 12 : 6;
    const rate = held ? 0 : TURN * speed * speed;
    const tick = Math.floor(k.nodeTime * 30) * 4096;
    for (let i = 0; i < count; i++) {
      const offset = i * (Math.PI * 2 / count);
      const pace = held ? 1 : (0.5 + Math.sin(i) * 0.25) * motion * speed;
      const turned = held ? phase + offset : time * pace + offset;
      const orbit = radius * (0.8 + Math.sin(held ? phase + i : time * 0.2 * speed + i) * 0.25 + Math.cos(held ? phase + i * 0.7 : time * 0.3 * speed + i * 0.7) * 0.25);
      const angle = turned + i * Math.PI * 2 / count;
      const torus = Math.sin(time * 0.3 * speed + i) * (motion * 2);
      const jitterX = held ? 0 : Math.sin(time * 3 * speed + i) * 1.2 * motion + Math.cos(time * 2 * speed + i * 0.5) * 0.5 * motion;
      const jitterY = held ? 0 : Math.cos(time * 2.5 * speed + i) * 1.2 * motion + Math.sin(time * 1.5 * speed + i * 0.7) * 0.5 * motion;
      const x = Math.cos(angle) * (orbit + torus) + Math.sin(held ? phase + i : time * 0.2 * speed + i) * wobble + jitterX;
      const y = Math.sin(angle) * (orbit + torus) - orbit * 0.3 + Math.cos(held ? phase + i : time * 0.15 * speed + i) * wobble + jitterY;
      const s = held ? base : base * (0.7 + Math.sin(time * 0.5 * speed + i) * 0.4 + noise(tick + i) * 0.3);
      if (!circle(cx + x, cy + y, s * 2 + 1.5 * blur)) continue;
      const colour = particleColour(pal, i, time * speed, rate);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, s * 2);
      gradient.addColorStop(0, pale(colour, 0.8 * dotGlow));
      gradient.addColorStop(0.4, pale(colour, 0.4 * dotGlow));
      gradient.addColorStop(1, pale(colour, 0));
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
      ctx.fillStyle = colour;
      ctx.globalAlpha = Math.min(alpha * 1.5, 1) * fade;
      ctx.fill();
    }
  }
  restore(ctx);
}
const HOLOGRAM = [0, 1, 2].map((i) => `hsl(${i * 60 % 360}, 80%, 75%)`);
const DASH = [5, 3];
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function neonNexus(ctx, node, w, h, k, pal, only) {
  const { primary, secondary, accent } = pal;
  const { animationGlow: glow, animationSize: size, particleGlow: dotGlow, particleSpeed: speed } = N;
  const intensity = N.intensity * 1.5;
  const phase = k.nodePhase;
  const time = held ? phase : phase * speed;
  const radius = Math.min(w, h) * 0.08;
  const line = Math.max(w, h) * 75e-4 * size;
  const grid = Math.min(w, h) * 0.4 * size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "transparent";
  if (!only) {
    for (let i = 0; i < 3; i++) {
      save(ctx);
      ctx.globalAlpha = (0.2 - i * 0.05) * fade;
      ctx.strokeStyle = HOLOGRAM[i];
      ctx.lineWidth = line * 0.4;
      roundedRect(ctx, -i * 2, -i * 2, w + i * 4, h + i * 4, radius + i * 1);
      ctx.stroke();
      restore(ctx);
    }
    const flicker = held ? 1 : 0.95 + 0.05 * Math.sin(phase * 0.3 * N.direction);
    for (let i = 0; i < 4; i++) {
      save(ctx);
      ctx.lineWidth = line * (1 + i * 0.3);
      const colour = i === 0 ? primary : i === 1 ? secondary : i === 2 ? accent : "rgba(255, 255, 255, 0.4)";
      ctx.strokeStyle = colour;
      ctx.shadowColor = colour;
      ctx.shadowBlur = (i + 1) * 12 * intensity * glow;
      const opacity = 0.95 - i * 0.15;
      ctx.globalAlpha = (held ? opacity : opacity * flicker) * fade;
      roundedRect(ctx, 0, 0, w, h, radius);
      ctx.stroke();
      if (i === 0) {
        ctx.globalAlpha = (held ? 0.3 : 0.3 * flicker) * fade;
        ctx.lineWidth = line * 0.8;
        ctx.shadowBlur = 20 * intensity * glow;
        roundedRect(ctx, 0, 0, w, h, radius);
        ctx.stroke();
      }
      restore(ctx);
    }
    const scan = h * (Math.sin(phase * 2) * 0.5 + 0.5);
    if (!held && shows(0, scan - 10, w, scan + 10)) {
      const gradient = ctx.createLinearGradient(0, scan - 10, 0, scan + 10);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scan - 10, w, 20);
    }
  }
  if (N.particleShow) {
    const spacing2 = grid / 4;
    const base = 2 * N.particleSize;
    const rate = held ? 0 : TURN * N.animationSpeed * speed;
    for (let i = 0; i < 70; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = (col - 2) * spacing2 + Math.cos(phase + col) * 2;
      const y = (row - 2) * spacing2 + Math.sin(phase + row) * 2;
      const s = base + Math.sin(phase * 2 + i) * (base * 0.3);
      if (!circle(x, y, s + 1.5 * 5 * dotGlow)) continue;
      const colour = particleColour(pal, i, time, rate);
      save(ctx);
      ctx.translate(x, y);
      ctx.rotate(phase + i * Math.PI / 8);
      ctx.fillStyle = colour;
      ctx.globalAlpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * dotGlow * fade;
      ctx.shadowColor = colour;
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
      const middle = h / 5;
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
  if ((node.selected || node.mouseOver) && !only) {
    save(ctx);
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + 0.5 * Math.sin(phase * 3);
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    roundedRect(ctx, 0, 0, w, h, radius);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse})`;
    ctx.lineWidth = line * 2;
    ctx.shadowColor = `rgba(255,255,255,${0.5 * pulse})`;
    ctx.shadowBlur = 15 * intensity;
    roundedRect(ctx, 0, 0, w, h, radius);
    ctx.stroke();
    restore(ctx);
  }
}
function cosmicRipple(ctx, _node, w, h, k, pal, only) {
  const { primary, secondary, accent } = pal;
  const { animationGlow: glow, particleGlow: dotGlow, particleIntensity: motion } = N;
  const cx = w / 2;
  const cy = h / 2;
  if (!only) {
    const most = Math.max(1, Math.min(w, h) * 0.7 * N.animationSize);
    const intensity = N.intensity * 1.5;
    const ripple = Math.abs(k.nodePhase) * 0.8;
    for (let i = 0; i < 5; i++) {
      const at = (ripple - i * 0.2) % 1;
      const r = Math.max(5, most * at);
      if (!(r > 5 && r < most)) continue;
      const blur = Math.max(2, 15 * (1 - at) * glow);
      const line = Math.max(1, 3 * intensity * (1 - at));
      if (!circle(cx, cy, r + line / 2 + 1.5 * blur)) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      const alpha = Math.max(0, 1 - at);
      gradient.addColorStop(0, translucent(secondary, alpha * 0.8));
      gradient.addColorStop(0.5, translucent(primary, alpha));
      gradient.addColorStop(1, translucent(accent, alpha * 0.8));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = line;
      ctx.shadowColor = translucent(secondary, 0.5);
      ctx.shadowBlur = blur;
      ctx.stroke();
    }
  }
  if (N.particleShow) {
    const count = Math.floor(Math.min(100, 30 + Math.floor(motion * 20)) * N.particleDensity);
    const corona = Math.max(1, Math.max(w, h) * 0.7);
    const time = k.nodeTime;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + k.particleTime;
      const spread = Math.max(0.1, 0.8 + Math.sin(time * 0.5 + i) * 0.2 * motion);
      const x = Math.cos(angle) * corona * spread + cx;
      const y = Math.sin(angle) * corona * spread + cy;
      const s = Math.max(1, 2 * N.particleSize + Math.sin(time * 1.5 + i) * 1.5 * motion);
      const trail = Math.max(1, s * 2);
      if (!circle(x, y, trail + 1.5 * 15 * dotGlow)) continue;
      const colour = particleColour(pal, i, time, 1);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, trail);
      gradient.addColorStop(0, translucent(colour, 0.7 * dotGlow));
      gradient.addColorStop(1, translucent(colour, 0));
      ctx.fillStyle = gradient;
      ctx.shadowColor = translucent(colour, dotGlow * 0.5);
      ctx.shadowBlur = 10 * dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, trail, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = translucent(colour, 0.7);
      ctx.shadowColor = translucent(colour, dotGlow);
      ctx.shadowBlur = 15 * dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
const xs = new Float64Array(127);
const ys = new Float64Array(127);
function flowerOfLife(ctx, _node, w, h, k, pal, only) {
  const { primary, secondary, accent } = pal;
  const { quality, particleGlow: dotGlow, particleIntensity: motion, particleSpeed: speed } = N;
  const intensity = N.intensity * 1.5;
  const cx = w / 2;
  const cy = h / 2;
  const phase = k.nodePhase;
  const time = held ? phase : phase * speed;
  const radius = Math.min(w, h) * 0.056 * intensity * N.animationSize;
  const layers2 = Math.max(2, Math.floor(quality * 2));
  const rotation = phase * 0.2;
  const pulse = 0.8 + Math.sin(phase * 1.5) * 0.2;
  xs[0] = cx;
  ys[0] = cy;
  let n = 1;
  for (let layer = 1; layer <= layers2; layer++) {
    const circles = layer * 6;
    for (let i = 0; i < circles; i++, n++) {
      const angle = i / circles * Math.PI * 2 + rotation;
      xs[n] = cx + Math.cos(angle) * (radius * 2) * layer;
      ys[n] = cy + Math.sin(angle) * (radius * 2) * layer;
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
    for (let layer = 1, j = 1; layer <= layers2; layer++) {
      for (let index = 0; index < layer * 6; index++, j++) {
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
          ctx.strokeStyle = index % 2 === 0 ? secondary : accent;
          ctx.globalAlpha = (1 - layer / (layers2 + 1)) * fade;
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
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.3 * fade;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (N.particleShow) {
    const count = Math.floor(5 * N.particleDensity * motion);
    const dot = 2 * quality * N.particleSize;
    const rate = held ? 0 : TURN * N.animationSpeed * speed;
    for (let j = 0; j < n; j++) {
      for (let p = 0; p < count; p++) {
        const angle = p / count * Math.PI * 2 + time * 2 * motion;
        const x = xs[j] + Math.cos(angle) * (radius * 0.5 * motion);
        const y = ys[j] + Math.sin(angle) * (radius * 0.5 * motion);
        if (!circle(x, y, dot + 1.5 * 10 * dotGlow)) continue;
        const colour = particleColour(pal, j * count + p, time, rate);
        ctx.beginPath();
        ctx.arc(x, y, dot, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 10 * dotGlow;
        ctx.globalAlpha = 0.7 * dotGlow * fade;
        ctx.fill();
      }
    }
  }
}
const EFFECTS = [gentlePulse, gentlePulse, neonNexus, cosmicRipple, flowerOfLife];
function frame(ctx, w, h, pal) {
  const blur = 15 * (N.glow * 2);
  ctx.shadowColor = pal.accent;
  ctx.shadowBlur = blur * 1.5;
  ctx.strokeStyle = pal.secondary;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fade;
  ctx.strokeRect(0, 0, w, h);
}
function drawNodeFx(ctx, style, node, w, h, k, p, alpha, only) {
  part$1 = p;
  fade = alpha;
  held = holdsStill();
  outlined = style > 0 && N.colorHoverShow && Boolean(node.selected || node.mouseOver);
  const pal = nodePalette(style);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.globalAlpha = fade;
  const saves = depth;
  try {
    EFFECTS[style](ctx, node, w, h, held ? STILL_NODE : k, pal, only);
    if (outlined && style > 1) outline(ctx, 0, 0, w, h, node.selected, translucent);
    if (style > 0 && !only && N.selectionGlow && node.selected) frame(ctx, w, h, pal);
  } finally {
    while (depth > saves) restore(ctx);
  }
}
function reach(style, w, h, only) {
  const { quality, animationGlow: glow, animationSize: size, particleShow: dots, particleSize: dotSize, particleGlow: dotGlow, particleIntensity: motion } = N;
  const intensity = N.intensity * 1.5;
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  let r = 0;
  if (style > 0 && N.colorHoverShow) r = 1 + 1.5 * 15 * glow * 1.5;
  if (style > 0 && !only && N.selectionGlow) r = Math.max(r, 1 + 1.5 * 45 * N.glow);
  switch (style) {
    case 2: {
      const line = long * 75e-4 * size;
      if (!only) r = Math.max(r, 4 + line, line + 1.5 * 48 * intensity * glow, line + 1.5 * 15 * intensity, 0.6 * short * size + 0.5);
      if (dots) r = Math.max(r, 1.1 * short * size + 2 + 2.6 * dotSize + 7.5 * dotGlow);
      return r;
    }
    case 3: {
      const rings = 0.7 * short * size + 1.5 * intensity + 1.5 * Math.max(2, 15 * glow);
      const corona = 0.7 * long * (0.8 + 0.2 * motion) + 2 * (2 * dotSize + 1.5 * motion) + 1.5 * 15 * dotGlow;
      return Math.max(r, (only ? 0 : rings) - short / 2, (dots ? corona : 0) - short / 2);
    }
    case 4: {
      const radius = short * 0.056 * intensity * size;
      const rings = 2 * radius * Math.max(2, Math.floor(quality * 2));
      const pattern = rings + radius + 1 + 1.5 * 15 * intensity * glow;
      const circling = rings + 0.5 * radius * motion + 2 * quality * dotSize + 1.5 * 10 * dotGlow;
      return Math.max(r, (only ? 0 : pattern) - short / 2, (dots ? circling : 0) - short / 2);
    }
    default: {
      const radius = long * (0.5 + quality * 0.1) * size;
      const light = radius * (1.2 + 0.4 * glow) * (0.4 + 0.3 * intensity);
      const blur = !only && quality > 1 ? 1.5 * 10 * glow * quality * 0.5 : 0;
      const fireflies = 1.7 * radius + 4.5 * motion + 12 + 2.8 * (4 + quality) * size * dotSize + blur;
      return Math.max(r, (only ? 0 : light) - short / 2, (dots ? fireflies : 0) - short / 2);
    }
  }
}
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
function drawTitle(ctx, title, x, y, colour, phase, fade2) {
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
    ctx.globalAlpha = fade2;
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
        ctx.globalAlpha = (0.8 + beat * 0.2) * fade2;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 10 * glow * beat;
        fill(ctx, text, tx, ty, colour);
        break;
      }
      case "minimal": {
        const alpha = 0.7 + Math.sin(phase * 2) * 0.3;
        ctx.globalAlpha = alpha * fade2;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 3 * glow;
        fill(ctx, text, tx, ty, colour);
        ctx.beginPath();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5 * fade2;
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
        ctx.globalAlpha = 0.5 * pulse * fade2;
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
          const fade2 = 1 - t * 1.2;
          if (fade2 <= 0) break;
          const radius = reach2 * (0.1 + 0.5 * t);
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, translucent("#FFFFFF", 0.95 * fade2));
          gradient.addColorStop(0.5, translucent(colour, 0.8 * fade2));
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
  if (node.flags.collapsed) return void 0;
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
  const titles = N.textAnimationEnabled && moving && !canvas.low_quality && !guard.off(TITLES);
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
      if (!N.textAnimationEnabled || !this.title || this.onDrawTitleText || args[1].low_quality || guard.off(TITLES)) return drawTitleText.apply(this, args);
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
      if (graph && graph === ranOn && !guard.off(FIREWORKS)) fireworks(graph.nodes.filter(celebrates), detail.prompt_id);
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
