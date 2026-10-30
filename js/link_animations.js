import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { L, e as enhanceColor, g as getLinkColor, a as getCustomLinkColors, v as validateHexColor, b as getSecondaryColor, c as getAccentColor, r as reset, S as SETTINGS, s as snapshotOf, d as commit, p as preview, l as linkSettings } from "./chunks/color-manager-CtPq5NfG.js";
const SACRED = Object.freeze({
  /** Base pattern foundation - used for trinity-based patterns */
  TRINITY: 3,
  /** Flow and crystalline structures */
  HARMONY: 7,
  /** Complex pattern completion cycles */
  COMPLETION: 12,
  /** Fibonacci sequence for growth patterns */
  FIBONACCI: Object.freeze([1, 1, 2, 3, 5, 8, 13, 21]),
  /** Quantum effects base */
  QUANTUM: 5,
  /** Infinite pattern cycles */
  INFINITY: 8
});
function createFlowField(t, phase) {
  return {
    x: Math.sin(t * Math.PI * SACRED.TRINITY + phase) * 10,
    y: Math.cos(t * Math.PI * SACRED.TRINITY + phase) * 10
  };
}
function createCrystal(ctx, x, y, size, rotation, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < SACRED.HARMONY; i++) {
    const angle = i / SACRED.HARMONY * Math.PI * 2;
    const px = Math.cos(angle) * size;
    const py = Math.sin(angle) * size;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
function enableAntiAliasing(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.miterLimit = 2;
}
function dist(a, b) {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}
const spline = {
  getLength(start, end) {
    const samples = 40;
    let length = 0;
    let prev = this.getPoint(start, end, 0);
    for (let i = 1; i <= samples; i++) {
      const p = this.getPoint(start, end, i / samples);
      length += dist(prev, p);
      prev = p;
    }
    return length;
  },
  getNormalizedT(start, end, targetDist, _totalLength) {
    const samples = 40;
    let acc = 0;
    let prev = this.getPoint(start, end, 0);
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const p = this.getPoint(start, end, t);
      const seg = dist(prev, p);
      acc += seg;
      if (acc >= targetDist) {
        const prevT = (i - 1) / samples;
        const excess = acc - targetDist;
        return prevT + (t - prevT) * (1 - excess / seg);
      }
      prev = p;
    }
    return 1;
  },
  getPoint(start, end, t) {
    const d = dist(start, end);
    const bend = Math.min(d * 0.5, 100);
    const p0x = start[0], p0y = start[1];
    const p1x = start[0] + bend, p1y = start[1];
    const p2x = end[0] - bend, p2y = end[1];
    const p3x = end[0], p3y = end[1];
    const cx = 3 * (p1x - p0x);
    const bx = 3 * (p2x - p1x) - cx;
    const ax = p3x - p0x - cx - bx;
    const cy = 3 * (p1y - p0y);
    const by = 3 * (p2y - p1y) - cy;
    const ay = p3y - p0y - cy - by;
    return [
      ax * t ** 3 + bx * t ** 2 + cx * t + p0x,
      ay * t ** 3 + by * t ** 2 + cy * t + p0y
    ];
  },
  draw(ctx, start, end, color, thickness) {
    const d = dist(start, end);
    const bend = Math.min(d * 0.5, 100);
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.bezierCurveTo(
      start[0] + bend,
      start[1],
      end[0] - bend,
      end[1],
      end[0],
      end[1]
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
};
const straight = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
};
const linear = {
  getLength(start, end) {
    const midX = (start[0] + end[0]) / 2;
    return Math.abs(midX - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[0] - midX);
  },
  getNormalizedT(start, end, targetDist, totalLength) {
    const midX = (start[0] + end[0]) / 2;
    const h1 = Math.abs(midX - start[0]);
    const v = Math.abs(end[1] - start[1]);
    const s1p = h1 / totalLength;
    const s2p = v / totalLength;
    const h2 = Math.abs(end[0] - midX);
    const nd = targetDist / totalLength;
    if (nd <= s1p) return nd / s1p * 0.33;
    if (nd <= s1p + s2p) return 0.33 + (nd - s1p) / s2p * 0.34;
    return 0.67 + (nd - s1p - s2p) / (h2 / totalLength) * 0.33;
  },
  getPoint(start, end, t) {
    const midX = (start[0] + end[0]) / 2;
    if (t <= 0.33) {
      const st2 = t / 0.33;
      return [start[0] + (midX - start[0]) * st2, start[1]];
    }
    if (t <= 0.67) {
      const st2 = (t - 0.33) / 0.34;
      return [midX, start[1] + (end[1] - start[1]) * st2];
    }
    const st = (t - 0.67) / 0.33;
    return [midX + (end[0] - midX) * st, end[1]];
  },
  draw(ctx, start, end, color, thickness) {
    const midX = (start[0] + end[0]) / 2;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(midX, start[1]);
    ctx.lineTo(midX, end[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
};
const hidden = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw() {
  }
};
const dotted = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, start, end, color, thickness) {
    const len = dist(start, end);
    const spacing = thickness * 3;
    const num = Math.floor(len / spacing);
    for (let i = 0; i <= num; i++) {
      const t = i / num;
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      ctx.beginPath();
      ctx.arc(x, y, thickness * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
};
const dashed = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    ctx.setLineDash([thickness * 4, thickness * 2]);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
  }
};
const double = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
    const off = thickness * 0.8;
    const dx = Math.cos(angle + Math.PI / 2) * off;
    const dy = Math.sin(angle + Math.PI / 2) * off;
    ctx.beginPath();
    ctx.moveTo(s[0] + dx, s[1] + dy);
    ctx.lineTo(e[0] + dx, e[1] + dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s[0] - dx, s[1] - dy);
    ctx.lineTo(e[0] - dx, e[1] - dy);
    ctx.stroke();
  }
};
const stepped = {
  getLength(s, e) {
    return Math.abs(e[0] - s[0]) + Math.abs(e[1] - s[1]);
  },
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint(s, e, t) {
    const midX = s[0] + (e[0] - s[0]) * (t < 0.5 ? t * 2 : 1);
    const midY = s[1] + (e[1] - s[1]) * (t >= 0.5 ? (t - 0.5) * 2 : 0);
    return [midX, midY];
  },
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(s[0] + (e[0] - s[0]), s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
};
const zigzag = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint(s, e, t) {
    const bx = s[0] + (e[0] - s[0]) * t;
    const by = s[1] + (e[1] - s[1]) * t;
    const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
    const amp = 10, freq = 10;
    return [
      bx + Math.cos(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
      by + Math.sin(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp
    ];
  },
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const p = this.getPoint(s, e, i / steps);
      i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
};
const rope = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint(s, e, t) {
    const bx = s[0] + (e[0] - s[0]) * t;
    const by = s[1] + (e[1] - s[1]) * t;
    const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
    const amp = 3, freq = 20;
    return [
      bx + Math.cos(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
      by + Math.sin(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp
    ];
  },
  draw(ctx, s, e, color, thickness) {
    const steps = 100;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = this.getPoint(s, e, i / steps);
      i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 1.2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = this.getPoint(s, e, i / steps);
      i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = thickness * 0.4;
    ctx.stroke();
  }
};
const glowpath = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
    const gradient = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.5)");
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness * 2;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};
const chain = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, start, end, color, thickness) {
    const len = dist(start, end);
    const linkSize = thickness * 2;
    const numLinks = Math.floor(len / (linkSize * 2));
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    for (let i = 0; i < numLinks; i++) {
      const t = i / numLinks;
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      ctx.beginPath();
      ctx.ellipse(x, y, linkSize, linkSize * 0.6, angle, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 0.4;
      ctx.stroke();
    }
  }
};
const pulse = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    const len = dist(s, e);
    const dashLen = thickness * 4;
    const numDashes = Math.floor(len / (dashLen * 2));
    ctx.beginPath();
    ctx.setLineDash([dashLen, dashLen]);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
    const pulseWidth = thickness * 3;
    for (let i = 0; i < numDashes; i++) {
      const t = i / numDashes;
      const x = s[0] + (e[0] - s[0]) * t;
      const y = s[1] + (e[1] - s[1]) * t;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, pulseWidth);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.beginPath();
      ctx.arc(x, y, pulseWidth, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};
const holographic = {
  getLength: (s, e) => dist(s, e),
  getNormalizedT: (_s, _e, td, tl) => td / tl,
  getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
  draw(ctx, s, e, color, thickness) {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    const gradient = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, color);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness * 1.2;
    ctx.stroke();
    const len = dist(s, e);
    const spacing = thickness * 2;
    const num = Math.floor(len / spacing);
    const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
    for (let i = 0; i <= num; i++) {
      const t = i / num;
      const x = s[0] + (e[0] - s[0]) * t;
      const y = s[1] + (e[1] - s[1]) * t;
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(angle + Math.PI / 2) * thickness,
        y + Math.sin(angle + Math.PI / 2) * thickness
      );
      ctx.lineTo(
        x + Math.cos(angle - Math.PI / 2) * thickness,
        y + Math.sin(angle - Math.PI / 2) * thickness
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
};
const LinkRenderers = {
  spline,
  straight,
  linear,
  hidden,
  dotted,
  dashed,
  double,
  stepped,
  zigzag,
  rope,
  glowpath,
  chain,
  pulse,
  holographic
};
function getLinkRenderer(name) {
  return LinkRenderers[name] ?? spline;
}
const none = () => {
};
const diamond = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
};
const circle = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.closePath();
};
const arrow = (ctx, x, y, size, angle = 0) => {
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
};
const square = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.rect(x - size, y - size, size * 2, size * 2);
  ctx.closePath();
};
const triangle = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x - size, y + size);
  ctx.closePath();
};
const star = (ctx, x, y, size) => {
  const spikes = 5;
  const innerRadius = size * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? size : innerRadius;
    const a = i * Math.PI / spikes;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
};
const heart = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.save();
  ctx.translate(x, y);
  const scale = size * 0.7;
  ctx.scale(scale, scale);
  ctx.moveTo(0, 0.4);
  ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
  ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
  ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
  ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
  ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
  ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);
  ctx.restore();
  ctx.closePath();
};
const cross = (ctx, x, y, size) => {
  ctx.beginPath();
  const width = size * 0.3;
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.closePath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";
};
const hexagon = (ctx, x, y, size) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const px = x + Math.cos(a) * size;
    const py = y + Math.sin(a) * size;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
};
const flower = (ctx, x, y, size) => {
  const petals = 6;
  const innerRadius = size * 0.3;
  ctx.beginPath();
  for (let i = 0; i < petals; i++) {
    const a = i * Math.PI * 2 / petals;
    const na = (i + 1) * Math.PI * 2 / petals;
    const ma = (a + na) / 2;
    const sx = x + Math.cos(a) * innerRadius;
    const sy = y + Math.sin(a) * innerRadius;
    const cx = x + Math.cos(ma) * size * 1.5;
    const cy = y + Math.sin(ma) * size * 1.5;
    const ex = x + Math.cos(na) * innerRadius;
    const ey = y + Math.sin(na) * innerRadius;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
  }
  ctx.closePath();
  ctx.moveTo(x + innerRadius, y);
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
};
const spiral = (ctx, x, y, size) => {
  ctx.beginPath();
  const turns = 3, points = 40;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const r = size * t;
    const a = t * turns * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
};
const MarkerShapes = {
  none,
  diamond,
  circle,
  arrow,
  square,
  triangle,
  star,
  heart,
  cross,
  hexagon,
  flower,
  spiral
};
function shapeNeedsFill(name) {
  return name !== "cross" && name !== "none";
}
function renderSacredFlow(ctx, items, phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  const animSpeed = L.animationSpeed;
  const colorScheme = L.colorScheme;
  const speedReductionFactor = 0.25;
  const continuousPhase = (state.totalTime || 0) * animSpeed * speedReductionFactor;
  ctx.shadowBlur = glowIntensity;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const baseColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
    const primaryColor = enhanceColor(baseColor, colorScheme);
    const accentColor = enhanceColor(getAccentColor(defaultColor), colorScheme);
    ctx.beginPath();
    const points = Math.floor(SACRED.TRINITY * quality * particleDensity);
    for (let i = 0; i <= points; i++) {
      const baseT = i / points;
      const t = direction > 0 ? baseT : 1 - baseT;
      const flow = createFlowField(t, continuousPhase);
      const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
      const x = pos[0] + flow.x * Math.sin(t * Math.PI + continuousPhase) * 0.5;
      const y = pos[1] + flow.y * Math.sin(t * Math.PI + continuousPhase) * 0.5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = thickness;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 1;
    ctx.stroke();
    const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity);
    const particleSize = thickness * 0.75;
    for (let i = 0; i < particleCount; i++) {
      const baseT = i / particleCount;
      const t = direction > 0 ? (baseT + continuousPhase * 0.5) % 1 : 1 - (baseT + continuousPhase * 0.5) % 1;
      const boundedT = Math.max(0, Math.min(1, t));
      const flow = createFlowField(boundedT, continuousPhase);
      const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
      const x = pos[0] + flow.x * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;
      const y = pos[1] + flow.y * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.shadowBlur = 0;
}
function renderCrystalStream(ctx, items, _phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  const animSpeed = L.animationSpeed;
  const continuousPhase = (state.totalTime || 0) * animSpeed;
  const createCrystal2 = (cx, x, y, size, rotation, color) => {
    cx.save();
    cx.translate(x, y);
    cx.rotate(rotation);
    cx.beginPath();
    for (let i = 0; i < SACRED.HARMONY; i++) {
      const angle = i / SACRED.HARMONY * Math.PI * 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      i === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py);
    }
    cx.closePath();
    cx.strokeStyle = color;
    cx.stroke();
    cx.restore();
  };
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, isStatic);
      ctx.globalAlpha = 1;
    }
    const crystals = Math.floor(SACRED.HARMONY * quality * particleDensity);
    for (let i = 0; i < crystals; i++) {
      const baseT = i / crystals;
      const t = direction > 0 ? (baseT + continuousPhase) % 1 : 1 - (baseT + continuousPhase) % 1;
      const boundedT = Math.max(0, Math.min(1, t));
      const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
      const size = 5 * thickness * (1 + Math.sin(continuousPhase + boundedT * Math.PI));
      ctx.shadowColor = secondaryColor;
      ctx.shadowBlur = glowIntensity;
      createCrystal2(ctx, pos[0], pos[1], size, boundedT * Math.PI * 2 + continuousPhase, primaryColor);
    }
  });
}
function renderQuantumField(ctx, items, phase, _state) {
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, isStatic);
      ctx.globalAlpha = 1;
    }
    const fieldLines = SACRED.QUANTUM;
    const points = Math.floor(SACRED.COMPLETION * quality * particleDensity);
    for (let f = 0; f < fieldLines; f++) {
      ctx.beginPath();
      const fieldPhase = phase + f * Math.PI * 2 / fieldLines;
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
        const uncertainty = 8 * Math.sin(t * Math.PI * 2 + fieldPhase);
        const x = pos[0] + uncertainty * Math.cos(fieldPhase);
        const y = pos[1] + uncertainty * Math.sin(fieldPhase);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = f % 2 === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = thickness * 0.5;
      ctx.shadowColor = f % 2 === 0 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderCosmicWeave(ctx, items, _phase, state) {
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const animSpeed = L.animationSpeed;
  const continuousPhase = (state.totalTime || 0) * animSpeed;
  const direction = state.direction;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0;
      r.draw(ctx, end, start, primaryColor, thickness, isStatic);
      ctx.globalAlpha = 1;
    }
    const strands = SACRED.TRINITY;
    const points = Math.floor(SACRED.COMPLETION * quality);
    for (let s = 0; s < strands; s++) {
      ctx.beginPath();
      const strandPhase = continuousPhase + s * Math.PI * 2 / strands;
      for (let i = 0; i <= points; i++) {
        const t = direction > 0 ? i / points : 1 - i / points;
        const pos = r.getPoint(end, start, t, isStatic ? 0.3 : 0.5);
        const weave = Math.sin(t * Math.PI * 6 + strandPhase * direction) * 10;
        const x = pos[0] + weave * Math.cos(strandPhase);
        const y = pos[1] + weave * Math.sin(strandPhase);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const strandColor = [primaryColor, secondaryColor, accentColor][s % 3];
      ctx.strokeStyle = strandColor;
      ctx.lineWidth = thickness * 0.7;
      ctx.shadowColor = strandColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderEnergyPulse(ctx, items, _phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const animSpeed = L.animationSpeed;
  const speedReductionFactor = 0.25;
  const continuousPhase = (state.totalTime || 0) * animSpeed * speedReductionFactor;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, isStatic);
      ctx.globalAlpha = 1;
    }
    const pulseCount = Math.floor(SACRED.TRINITY * quality);
    for (let i = 0; i < pulseCount; i++) {
      const baseT = i / pulseCount;
      const t = direction > 0 ? (baseT + continuousPhase) % 1 : 1 - (baseT + continuousPhase) % 1;
      const boundedT = Math.max(0, Math.min(1, t));
      const pulseSize = thickness * 2 * (1 - boundedT);
      const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = secondaryColor;
      ctx.shadowColor = secondaryColor;
      ctx.shadowBlur = glowIntensity * 2;
      ctx.globalAlpha = 0.5 * (1 - boundedT);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
function renderDNAHelix(ctx, items, _phase, state) {
  const direction = -state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const animSpeed = L.animationSpeed;
  const continuousPhase = (state.totalTime || 0) * animSpeed;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const points = Math.floor(SACRED.COMPLETION * quality * 2);
    const helixRadius = 10;
    const rotations = 4;
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    const actualStart = direction > 0 ? start : end;
    const actualEnd = direction > 0 ? end : start;
    const strand1Points = [];
    const strand2Points = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
      const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
      const hx = Math.cos(baseAngle) * helixRadius;
      const hy = Math.sin(baseAngle) * helixRadius;
      strand1Points.push({ x: pos[0] + hx, y: pos[1] + hy });
      strand2Points.push({ x: pos[0] - hx, y: pos[1] - hy });
    }
    [strand1Points, strand2Points].forEach((strandPoints, index) => {
      ctx.beginPath();
      strandPoints.forEach((point, i) => {
        i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = index === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = thickness;
      ctx.shadowColor = index === 0 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.stroke();
    });
    const bonds = rotations * 4;
    ctx.strokeStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.globalAlpha = 0.6;
    for (let b = 0; b < bonds; b++) {
      const t = b / bonds;
      const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
      const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
      const x1 = pos[0] + Math.cos(baseAngle) * helixRadius;
      const y1 = pos[1] + Math.sin(baseAngle) * helixRadius;
      const x2 = pos[0] - Math.cos(baseAngle) * helixRadius;
      const y2 = pos[1] - Math.sin(baseAngle) * helixRadius;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderLavaFlow(ctx, items, phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  const animSpeed = L.animationSpeed;
  const continuousPhase = (state.totalTime || 0) * animSpeed;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0;
      r.draw(ctx, start, end, primaryColor, thickness, isStatic);
      ctx.globalAlpha = 1;
    }
    const tubeWidth = thickness * 7;
    const flowWidth = thickness * 5;
    const turbulenceScale = 20;
    const pts = Math.floor(SACRED.TRINITY * quality * 12);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
      const noise = Math.sin(t * Math.PI * 3 + continuousPhase) * turbulenceScale;
      const x = pos[0];
      const y = pos[1] + noise * Math.sin(continuousPhase * 0.8 + t * Math.PI * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = secondaryColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = tubeWidth;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
      const noise = Math.sin(t * Math.PI * 3 + continuousPhase * 1.2) * (turbulenceScale * 0.7);
      const x = pos[0];
      const y = pos[1] + noise * Math.sin(continuousPhase * 0.6 + t * Math.PI * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const gradient = ctx.createLinearGradient(
      direction > 0 ? start[0] : end[0],
      direction > 0 ? start[1] : end[1],
      direction > 0 ? end[0] : start[0],
      direction > 0 ? end[1] : start[1]
    );
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondaryColor);
    gradient.addColorStop(1, accentColor);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = flowWidth;
    ctx.lineCap = "round";
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur = glowIntensity * 1.5;
    ctx.stroke();
    const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity * 3);
    for (let i = 0; i < particleCount; i++) {
      const baseT = i / particleCount;
      const t = direction > 0 ? (baseT + continuousPhase * 0.5) % 1 : 1 - (baseT + continuousPhase * 0.5) % 1;
      const boundedT = Math.max(0, Math.min(1, t));
      const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
      const noise = Math.sin(boundedT * Math.PI * 3 + continuousPhase) * (turbulenceScale * 0.3);
      const x = pos[0] + Math.sin(boundedT * Math.PI * 2) * (tubeWidth * 0.15);
      const y = pos[1] + noise * Math.sin(continuousPhase + boundedT * Math.PI * 2) + Math.cos(boundedT * Math.PI * 3) * (tubeWidth * 0.15);
      const particleSize = thickness * (0.5 + Math.sin(continuousPhase + i) * 0.2);
      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.6 + Math.sin(continuousPhase + i) * 0.4;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStellarPlasma(ctx, items, _phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  const animSpeed = L.animationSpeed;
  const continuousPhase = -(state.totalTime || 0) * animSpeed;
  items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    const actualStart = direction > 0 ? end : start;
    const actualEnd = direction > 0 ? start : end;
    const length = r.getLength(start, end);
    const segments = Math.floor(length / 20) * quality * particleDensity;
    ctx.save();
    for (let i = 0; i <= segments; i++) {
      const baseT = i / segments;
      const t = baseT;
      const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
      const wavePhase = t * Math.PI * 4 - continuousPhase * direction;
      const wave = Math.sin(wavePhase) * 15;
      const sizePhase = t * Math.PI * 2 - continuousPhase * direction;
      const size = thickness * (0.5 + Math.sin(sizePhase) * 0.5);
      ctx.beginPath();
      ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
      ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
      ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.7 - Math.abs(t - 0.5) * 0.3;
      ctx.fill();
      if (i % 3 === 0) {
        const particleT = (baseT + continuousPhase * 0.5) % 1;
        const boundedPT = Math.max(0, Math.min(1, particleT));
        const particlePos = r.getPoint(actualStart, actualEnd, boundedPT, isStatic ? 0.3 : 0.5);
        const pWavePhase = boundedPT * Math.PI * 4 - continuousPhase * direction;
        const pWave = Math.sin(pWavePhase) * 15;
        ctx.beginPath();
        ctx.arc(particlePos[0], particlePos[1] + pWave, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.globalAlpha = 0.6 - Math.abs(boundedPT - 0.5) * 0.4;
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}
function renderClassicFlow(ctx, items, phase, state) {
  const direction = state.direction;
  const quality = L.quality;
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const particleDensity = L.particleDensity;
  const animSpeed = L.animationSpeed;
  const markerEnabled = L.markerEnabled;
  const markerShape = L.markerShape;
  const markerSize = L.markerSize;
  const markerColorMode = L.markerColorMode;
  const markerColor = L.markerColor;
  const markerGlow = L.markerGlow;
  const markerEffect = L.markerEffects;
  const colorScheme = L.colorScheme;
  const shadowBlur = L.shadowBlur;
  const shadowOffset = L.shadowOffset;
  const continuousPhase = (state.totalTime || 0) * animSpeed;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = enhanceColor(getLinkColor(defaultColor), colorScheme);
    if (linkStyle !== "hidden") {
      const linkColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
      const enhancedColor = enhanceColor(linkColor, colorScheme);
      ctx.lineWidth = thickness;
      const linkShadowEnabled = L.linkShadowEnabled;
      if (linkShadowEnabled) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = shadowBlur * 4;
        ctx.shadowOffsetX = shadowOffset * 3;
        ctx.shadowOffsetY = shadowOffset * 3;
        ctx.lineWidth = thickness * 1.2;
        r.draw(ctx, start, end, "rgba(0, 0, 0, 0.95)", thickness * 1.2, true);
      }
      ctx.shadowColor = enhancedColor;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = enhancedColor;
      ctx.lineWidth = thickness;
      r.draw(ctx, start, end, enhancedColor, thickness, true);
    }
    if (markerEnabled && markerShape !== "none") {
      let effectiveMarkerColor;
      if (markerColorMode === "custom") {
        effectiveMarkerColor = enhanceColor(
          validateHexColor(markerColor) || primaryColor,
          colorScheme
        );
      } else if (markerColorMode === "default") {
        effectiveMarkerColor = enhanceColor(defaultColor, colorScheme);
      } else {
        effectiveMarkerColor = primaryColor;
      }
      const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
      const markSize = 3 * markerSize;
      for (let i = 0; i < numMarks; i++) {
        const baseT = i / numMarks;
        const t = direction > 0 ? (baseT + continuousPhase * 0.1) % 1 : 1 - (baseT + continuousPhase * 0.1) % 1;
        const pos = r.getPoint(start, end, t, true);
        let angle = 0;
        if (markerShape === "arrow") {
          const nextT = Math.min(t + 0.01, 1);
          const nextPos = r.getPoint(start, end, nextT, true);
          angle = Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]);
        }
        let effectColor = effectiveMarkerColor;
        let opacity = 1;
        switch (markerEffect) {
          case "pulse":
            opacity = 0.5 + Math.sin(phase + t * Math.PI * 2) * 0.5;
            break;
          case "fade":
            opacity = 1 - t;
            break;
          case "rainbow": {
            const hue = (t * 360 + phase * 50) % 360;
            effectColor = enhanceColor(`hsl(${hue}, 100%, 50%)`, colorScheme);
            break;
          }
        }
        const shapeFn = MarkerShapes[markerShape];
        if (shapeFn) {
          const markerShadowEnabled = L.markerShadowEnabled;
          if (markerShadowEnabled) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = shadowBlur * 4;
            ctx.shadowOffsetX = shadowOffset * 3;
            ctx.shadowOffsetY = shadowOffset * 3;
            ctx.globalAlpha = opacity;
            shapeFn(ctx, pos[0], pos[1], markSize * 1.2, angle);
            if (shapeNeedsFill(markerShape)) ctx.fill();
          }
          ctx.shadowColor = markerEffect === "rainbow" ? primaryColor : effectColor;
          ctx.shadowBlur = markerGlow;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          if (markerShape === "cross") ctx.strokeStyle = effectColor;
          ctx.fillStyle = effectColor;
          ctx.globalAlpha = opacity;
          shapeFn(ctx, pos[0], pos[1], markSize, angle);
          if (shapeNeedsFill(markerShape)) ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  });
}
const ANIMATED_RENDERERS = {
  1: renderSacredFlow,
  2: renderCrystalStream,
  3: renderQuantumField,
  4: renderCosmicWeave,
  5: renderEnergyPulse,
  6: renderDNAHelix,
  7: renderLavaFlow,
  8: renderStellarPlasma,
  9: renderClassicFlow
};
function renderAnimatedStyle(ctx, items, style, phase, state) {
  const renderer = ANIMATED_RENDERERS[style];
  if (renderer) {
    renderer(ctx, items, phase, state);
  }
}
function renderStatic1(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness * 1.5;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = glowIntensity;
      r.draw(ctx, start, end, primaryColor, thickness, true);
    }
    const points = Math.floor(SACRED.TRINITY * quality);
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const pos = r.getPoint(start, end, t, true);
      const flow = createFlowField(t, phase);
      const x = pos[0] + flow.x * Math.sin(t * Math.PI + phase) * 0.3;
      const y = pos[1] + flow.y * Math.sin(t * Math.PI + phase) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, thickness * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.shadowColor = linkStyle === "hidden" ? accentColor : primaryColor;
      ctx.shadowBlur = linkStyle === "hidden" ? glowIntensity * 0.7 : glowIntensity;
      ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic2(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      r.draw(ctx, start, end, primaryColor, thickness, true);
    }
    const crystals = Math.floor(SACRED.HARMONY * quality);
    for (let i = 0; i < crystals; i++) {
      const t = i / crystals;
      const pos = r.getPoint(start, end, t, true);
      const size = thickness * 3 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.2);
      ctx.shadowColor = secondaryColor;
      ctx.shadowBlur = glowIntensity;
      createCrystal(ctx, pos[0], pos[1], size, t * Math.PI * 2 + phase * 0.2, primaryColor);
    }
  });
}
function renderStatic3(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, true);
      ctx.globalAlpha = 1;
    }
    const fieldLines = SACRED.QUANTUM;
    const points = Math.floor(SACRED.COMPLETION * quality);
    for (let f = 0; f < fieldLines; f++) {
      ctx.beginPath();
      const fieldPhase = phase + f * Math.PI * 2 / fieldLines;
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        const pos = r.getPoint(start, end, t, true);
        const uncertainty = 8 * Math.sin(t * Math.PI * 2 + fieldPhase);
        const x = pos[0] + uncertainty * Math.cos(fieldPhase);
        const y = pos[1] + uncertainty * Math.sin(fieldPhase);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = f % 2 === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = thickness * 0.5;
      ctx.shadowColor = f % 2 === 0 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic4(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  const direction = L.direction;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0;
      r.draw(ctx, end, start, primaryColor, thickness, true);
      ctx.globalAlpha = 1;
    }
    const strands = SACRED.TRINITY;
    const points = Math.floor(SACRED.COMPLETION * quality);
    for (let s = 0; s < strands; s++) {
      ctx.beginPath();
      const strandPhase = phase + s * Math.PI * 2 / strands;
      for (let i = 0; i <= points; i++) {
        const t = direction > 0 ? i / points : 1 - i / points;
        const pos = r.getPoint(end, start, t, true);
        const weave = Math.sin(t * Math.PI * 6 + strandPhase * direction) * 10;
        const x = pos[0] + weave * Math.cos(strandPhase);
        const y = pos[1] + weave * Math.sin(strandPhase);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const strandColor = [primaryColor, secondaryColor, accentColor][s % 3];
      ctx.strokeStyle = strandColor;
      ctx.lineWidth = thickness * 0.7;
      ctx.shadowColor = strandColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic5(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, true);
      ctx.globalAlpha = 1;
    }
    const pulseCount = Math.floor(SACRED.TRINITY * quality);
    for (let i = 0; i < pulseCount; i++) {
      const t = i / pulseCount;
      const pulseSize = thickness * 2 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.3);
      const pos = r.getPoint(start, end, t, true);
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = secondaryColor;
      ctx.shadowColor = secondaryColor;
      ctx.shadowBlur = glowIntensity * 2;
      ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic6(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    const points = Math.floor(SACRED.COMPLETION * quality * 2);
    const helixRadius = 10;
    const rotations = 4;
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        const baseAngle = t * Math.PI * rotations * 2 + phase;
        const pos = r.getPoint(start, end, t, true);
        const hx = Math.cos(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
        const hy = Math.sin(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
        const x = pos[0] + hx;
        const y = pos[1] + hy;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strand === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = thickness * 1.2;
      ctx.shadowColor = strand === 0 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.stroke();
    }
    const bonds = rotations * 4;
    ctx.strokeStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 0.8;
    for (let b = 0; b <= bonds; b++) {
      const t = b / bonds;
      const baseAngle = t * Math.PI * rotations * 2 + phase;
      const pos = r.getPoint(start, end, t, true);
      const x1 = pos[0] + Math.cos(baseAngle) * helixRadius;
      const y1 = pos[1] + Math.sin(baseAngle) * helixRadius;
      const x2 = pos[0] - Math.cos(baseAngle) * helixRadius;
      const y2 = pos[1] - Math.sin(baseAngle) * helixRadius;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic7(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    const tubeWidth = thickness * 7;
    const flowWidth = thickness * 5;
    const turbulenceScale = 15;
    const pts = Math.floor(SACRED.TRINITY * quality * 12);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const pos = r.getPoint(start, end, t, true);
      const noise = Math.sin(t * Math.PI * 3 + phase) * turbulenceScale;
      const x = pos[0];
      const y = pos[1] + noise * Math.sin(phase * 0.8 + t * Math.PI * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = secondaryColor;
    ctx.globalAlpha = 0;
    ctx.lineWidth = tubeWidth;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const pos = r.getPoint(start, end, t, true);
      const noise = Math.sin(t * Math.PI * 3 + phase * 1.2) * (turbulenceScale * 0.7);
      const x = pos[0];
      const y = pos[1] + noise * Math.sin(phase * 0.6 + t * Math.PI * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondaryColor);
    gradient.addColorStop(1, accentColor);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = flowWidth;
    ctx.lineCap = "round";
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur = glowIntensity * 1.5;
    ctx.stroke();
  });
}
function renderStatic8(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = getLinkColor(defaultColor);
    const secondaryColor = getSecondaryColor(defaultColor);
    const accentColor = getAccentColor(defaultColor);
    if (linkStyle !== "hidden") {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 0.3;
      r.draw(ctx, start, end, primaryColor, thickness, true);
      ctx.globalAlpha = 1;
    }
    const length = r.getLength(start, end);
    const maxSegments = Math.min(Math.floor(length / 30), 20);
    const segments = Math.max(5, Math.floor(maxSegments * quality * 0.5));
    const waveAmplitude = 8;
    const phaseOffset = phase * 0.5;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = r.getPoint(start, end, t, true);
      const wave = Math.sin(t * Math.PI * 2 + phaseOffset) * waveAmplitude;
      const size = thickness * (0.8 + Math.sin(phase + t * Math.PI) * 0.2);
      ctx.beginPath();
      ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
      ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
      ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      if (i % 3 === 0 && quality > 1) {
        const particleSize = size * 0.4;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1] + wave * 1.2, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.globalAlpha = 0.4;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  });
}
function renderStatic9(ctx, items, phase) {
  const thickness = L.thickness;
  const glowIntensity = L.glowIntensity;
  const quality = L.quality;
  const markerEnabled = L.markerEnabled;
  const markerShape = L.markerShape;
  const markerSize = L.markerSize;
  const markerColorMode = L.markerColorMode;
  const markerColor = L.markerColor;
  const markerGlow = L.markerGlow;
  const markerEffect = L.markerEffects;
  const colorScheme = L.colorScheme;
  const particleDensity = L.particleDensity;
  const shadowBlur = L.shadowBlur;
  const shadowOffset = L.shadowOffset;
  items.forEach(({ start, end, defaultColor, linkStyle }) => {
    const r = getLinkRenderer(linkStyle);
    const primaryColor = enhanceColor(getLinkColor(defaultColor), colorScheme);
    if (linkStyle !== "hidden") {
      const linkColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
      const enhancedColor = enhanceColor(linkColor, colorScheme);
      ctx.lineWidth = thickness;
      const linkShadowEnabled = L.linkShadowEnabled;
      if (linkShadowEnabled) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = shadowBlur * 4;
        ctx.shadowOffsetX = shadowOffset * 3;
        ctx.shadowOffsetY = shadowOffset * 3;
        ctx.lineWidth = thickness * 1.2;
        r.draw(ctx, start, end, "rgba(0, 0, 0, 0.95)", thickness * 1.2, true);
      }
      ctx.shadowColor = enhancedColor;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = enhancedColor;
      ctx.lineWidth = thickness;
      r.draw(ctx, start, end, enhancedColor, thickness, true);
    }
    if (markerEnabled && markerShape !== "none") {
      let effectiveMarkerColor;
      if (markerColorMode === "custom") {
        effectiveMarkerColor = enhanceColor(validateHexColor(markerColor) || primaryColor, colorScheme);
      } else if (markerColorMode === "default") {
        effectiveMarkerColor = enhanceColor(defaultColor, colorScheme);
      } else {
        effectiveMarkerColor = primaryColor;
      }
      const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
      const markSize = 3 * markerSize;
      for (let i = 0; i < numMarks; i++) {
        const baseT = i / numMarks;
        const t = baseT;
        const pos = r.getPoint(start, end, t, true);
        let angle = 0;
        if (markerShape === "arrow") {
          const nextT = Math.min(t + 0.01, 1);
          const nextPos = r.getPoint(start, end, nextT, true);
          angle = Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]);
        }
        let effectColor = effectiveMarkerColor;
        let opacity = 1;
        switch (markerEffect) {
          case "pulse":
            opacity = 0.5 + Math.sin(phase + t * Math.PI * 2) * 0.5;
            break;
          case "fade":
            opacity = 1 - t;
            break;
          case "rainbow": {
            const hue = (t * 360 + phase * 50) % 360;
            effectColor = enhanceColor(`hsl(${hue}, 100%, 50%)`, colorScheme);
            break;
          }
        }
        const shapeFn = MarkerShapes[markerShape];
        if (shapeFn) {
          const markerShadowEnabled = L.markerShadowEnabled;
          if (markerShadowEnabled) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = shadowBlur * 4;
            ctx.shadowOffsetX = shadowOffset * 3;
            ctx.shadowOffsetY = shadowOffset * 3;
            ctx.globalAlpha = opacity;
            shapeFn(ctx, pos[0], pos[1], markSize * 1.2, angle);
            if (shapeNeedsFill(markerShape)) ctx.fill();
          }
          ctx.shadowColor = markerEffect === "rainbow" ? primaryColor : effectColor;
          ctx.shadowBlur = markerGlow;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          if (markerShape === "cross") ctx.strokeStyle = effectColor;
          ctx.fillStyle = effectColor;
          ctx.globalAlpha = opacity;
          shapeFn(ctx, pos[0], pos[1], markSize, angle);
          if (shapeNeedsFill(markerShape)) ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  });
}
const STATIC_RENDERERS = {
  1: renderStatic1,
  2: renderStatic2,
  3: renderStatic3,
  4: renderStatic4,
  5: renderStatic5,
  6: renderStatic6,
  7: renderStatic7,
  8: renderStatic8,
  9: renderStatic9
};
function renderStaticStyle(ctx, items, style, phase) {
  const renderer = STATIC_RENDERERS[style];
  if (renderer) {
    renderer(ctx, items, phase);
  }
}
const Icons = {
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`
};
function createSlider(label, value, min, max, step, unit, onInput, onChange, tooltip) {
  const row = document.createElement("div");
  row.className = "enh-control-row";
  if (tooltip) row.title = tooltip;
  const sliderId = `enh-slider-${Math.random().toString(36).substr(2, 9)}`;
  const labelRow = document.createElement("div");
  labelRow.className = "enh-control-label-row";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.htmlFor = sliderId;
  const valueEl = document.createElement("span");
  valueEl.className = "enh-control-value";
  valueEl.textContent = `${value}${unit}`;
  labelRow.appendChild(labelEl);
  labelRow.appendChild(valueEl);
  const slider = document.createElement("input");
  slider.type = "range";
  slider.id = sliderId;
  slider.className = "enh-slider";
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);
  slider.setAttribute("aria-valuetext", `${value}${unit}`);
  slider.addEventListener("mousedown", (e) => e.stopPropagation());
  slider.addEventListener("touchstart", (e) => e.stopPropagation());
  slider.addEventListener("pointerdown", (e) => e.stopPropagation());
  slider.addEventListener("input", (e) => {
    e.stopPropagation();
    const newValue = parseFloat(slider.value);
    valueEl.textContent = `${newValue}${unit}`;
    slider.setAttribute("aria-valuetext", `${newValue}${unit}`);
    onInput(newValue);
  });
  slider.addEventListener("change", () => onChange(parseFloat(slider.value)));
  row.appendChild(labelRow);
  row.appendChild(slider);
  return row;
}
function createToggle(label, checked, onChange, tooltip) {
  const row = document.createElement("div");
  row.className = "enh-toggle-row";
  if (tooltip) row.title = tooltip;
  const toggleId = `enh-toggle-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `${toggleId}-label`;
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.id = labelId;
  labelEl.style.cursor = "pointer";
  const toggle = document.createElement("div");
  toggle.className = `enh-toggle${checked ? " active" : ""}`;
  toggle.id = toggleId;
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", String(checked));
  toggle.setAttribute("aria-labelledby", labelId);
  toggle.tabIndex = 0;
  const handleToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isActive = toggle.classList.toggle("active");
    toggle.setAttribute("aria-checked", String(isActive));
    onChange(isActive);
  };
  toggle.addEventListener("click", handleToggle);
  labelEl.addEventListener("click", handleToggle);
  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleToggle(e);
    }
  });
  row.appendChild(labelEl);
  row.appendChild(toggle);
  return row;
}
function createSelect(label, currentValue, options, onChange, tooltip) {
  const row = document.createElement("div");
  row.className = "enh-control-row";
  if (tooltip) row.title = tooltip;
  const selectId = `enh-select-${Math.random().toString(36).substr(2, 9)}`;
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.htmlFor = selectId;
  const select = document.createElement("select");
  select.id = selectId;
  select.className = "enh-select";
  select.addEventListener("mousedown", (e) => e.stopPropagation());
  select.addEventListener("pointerdown", (e) => e.stopPropagation());
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = String(opt.value);
    option.textContent = opt.text;
    if (String(opt.value) == String(currentValue)) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener("change", () => {
    const rawValue = select.value;
    const matchedOpt = options.find(
      (o) => String(o.value) === rawValue
    );
    onChange(matchedOpt ? matchedOpt.value : rawValue);
  });
  row.appendChild(labelEl);
  row.appendChild(select);
  return row;
}
function createColorPicker(label, value, onInput, onChange, tooltip) {
  const row = document.createElement("div");
  row.className = "enh-control-row enh-color-row";
  if (tooltip) row.title = tooltip;
  const colorId = `enh-color-${Math.random().toString(36).substr(2, 9)}`;
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.htmlFor = colorId;
  const colorWrapper = document.createElement("div");
  colorWrapper.className = "enh-color-wrapper";
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.id = colorId;
  colorInput.className = "enh-color-input";
  colorInput.value = value;
  const colorPreview = document.createElement("input");
  colorPreview.type = "text";
  colorPreview.className = "enh-color-preview";
  colorPreview.value = value;
  colorPreview.maxLength = 7;
  colorPreview.setAttribute("aria-label", `Hex code for ${label}`);
  colorPreview.addEventListener("keydown", (e) => e.stopPropagation());
  colorPreview.addEventListener("focus", () => colorPreview.select());
  const updateFromText = () => {
    let val = colorPreview.value;
    if (!val.startsWith("#") && /^[0-9A-Fa-f]{6}$/.test(val)) {
      val = "#" + val;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      colorPreview.value = val;
      colorInput.value = val;
      onChange(val);
    } else {
      colorPreview.value = colorInput.value;
    }
  };
  colorPreview.addEventListener("change", updateFromText);
  colorInput.addEventListener("input", () => {
    colorPreview.value = colorInput.value;
    onInput(colorInput.value);
  });
  colorInput.addEventListener("change", () => onChange(colorInput.value));
  colorWrapper.appendChild(colorInput);
  colorWrapper.appendChild(colorPreview);
  row.appendChild(labelEl);
  row.appendChild(colorWrapper);
  return row;
}
function createSection(title, defaultCollapsed = true) {
  const section = document.createElement("div");
  section.className = "enh-sidebar-section";
  const collapsed = defaultCollapsed;
  const header = document.createElement("div");
  header.className = `enh-sidebar-section-header${collapsed ? " collapsed" : ""}`;
  const sectionId = `enh-section-${Math.random().toString(36).substr(2, 9)}`;
  const bodyId = `${sectionId}-body`;
  header.setAttribute("role", "button");
  header.setAttribute("tabindex", "0");
  header.setAttribute("aria-expanded", String(!collapsed));
  header.setAttribute("aria-controls", bodyId);
  header.innerHTML = Icons.chevronDown;
  const titleSpan = document.createElement("span");
  titleSpan.textContent = title;
  header.appendChild(titleSpan);
  const body = document.createElement("div");
  body.className = `enh-sidebar-section-body${collapsed ? " collapsed" : ""}`;
  body.id = bodyId;
  body.setAttribute("role", "region");
  if (collapsed) {
    body.style.display = "none";
  }
  const toggleSection = () => {
    const isCollapsed = header.classList.toggle("collapsed");
    body.classList.toggle("collapsed");
    body.style.display = isCollapsed ? "none" : "";
    header.setAttribute("aria-expanded", String(!isCollapsed));
  };
  header.addEventListener("click", toggleSection);
  header.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection();
    }
  });
  section.appendChild(header);
  section.appendChild(body);
  return { section, body };
}
function control(label, id, tooltip, unit = "") {
  const s = SETTINGS.find((e) => e.id === id);
  const value = snapshotOf(id)[s.key];
  switch (s.type) {
    case "slider":
      return createSlider(label, value, s.min, s.max, s.step, unit, (v) => preview(id, v), (v) => commit(id, v), tooltip);
    case "boolean":
      return createToggle(label, value, (v) => commit(id, v), tooltip);
    case "combo":
      return createSelect(label, value, s.options, (v) => commit(id, v), tooltip);
    case "color":
      return createColorPicker(label, value, (v) => preview(id, v), (v) => commit(id, v), tooltip);
  }
}
function renderLinkAnimationSection(container) {
  const { section, body } = createSection("🎬 Animation", true);
  body.appendChild(control(
    "Animation Style",
    "🔗 Enhanced Links.Animate",
    "Select the animation effect for link connections"
  ));
  body.appendChild(control(
    "Static Mode",
    "🔗 Enhanced Links.Static.Mode",
    "Display a static snapshot of the animation"
  ));
  body.appendChild(control(
    "Speed",
    "🔗 Enhanced Links.Animation.Speed",
    "Animation playback speed",
    "x"
  ));
  body.appendChild(control(
    "Direction",
    "🔗 Enhanced Links.Direction",
    "Flow direction along links"
  ));
  body.appendChild(control(
    "Pause During Render",
    "🔗 Enhanced Links.Pause.During.Render",
    "Pause animations while ComfyUI is processing"
  ));
  container.appendChild(section);
}
function renderLinkStyleSection(container) {
  const { section, body } = createSection("🔗 Link Style", true);
  body.appendChild(control(
    "Link Style",
    "🔗 Enhanced Links.Link.Style",
    "Visual style for link connections"
  ));
  body.appendChild(control(
    "Thickness",
    "🔗 Enhanced Links.Thickness",
    "Link line thickness",
    "px"
  ));
  body.appendChild(control(
    "Quality",
    "🔗 Enhanced Links.Quality",
    "Rendering quality — higher uses more GPU"
  ));
  container.appendChild(section);
}
function renderLinkColorSection(container) {
  const { section, body } = createSection("🎨 Colors", true);
  body.appendChild(control(
    "Color Mode",
    "🔗 Enhanced Links.Color.Mode",
    "How colors are determined for link animations"
  ));
  body.appendChild(control(
    "Color Scheme",
    "🔗 Enhanced Links.Color.Scheme",
    "Preset color scheme for link types"
  ));
  body.appendChild(control(
    "Primary Color",
    "🔗 Enhanced Links.Color.Primary",
    "Primary animation color"
  ));
  body.appendChild(control(
    "Secondary Color",
    "🔗 Enhanced Links.Color.Secondary",
    "Secondary animation color"
  ));
  body.appendChild(control(
    "Accent Color",
    "🔗 Enhanced Links.Color.Accent",
    "Accent animation color"
  ));
  container.appendChild(section);
}
function renderLinkEffectsSection(container) {
  const { section, body } = createSection("✨ Effects", true);
  body.appendChild(control(
    "Glow Intensity",
    "🔗 Enhanced Links.Glow.Intensity",
    "Intensity of the glow effect around links"
  ));
  body.appendChild(control(
    "Particle Density",
    "🔗 Enhanced Links.Particle.Density",
    "Number of particles along links"
  ));
  container.appendChild(section);
}
function renderLinkMarkerSection(container) {
  const { section, body } = createSection("➤ Markers", true);
  body.appendChild(control(
    "Enabled",
    "🔗 Enhanced Links.Marker.Enabled",
    "Show flow direction markers on links"
  ));
  body.appendChild(control(
    "Shape",
    "🔗 Enhanced Links.Marker.Shape",
    "Shape of the flow markers"
  ));
  body.appendChild(control(
    "Size",
    "🔗 Enhanced Links.Marker.Size",
    "Size of flow markers"
  ));
  body.appendChild(control(
    "Color Mode",
    "🔗 Enhanced Links.Marker.Color.Mode",
    "How marker colors are determined"
  ));
  body.appendChild(control(
    "Custom Color",
    "🔗 Enhanced Links.Marker.Color",
    "Custom marker color (when Color Mode is Custom)"
  ));
  body.appendChild(control(
    "Glow",
    "🔗 Enhanced Links.Marker.Glow",
    "Glow intensity for markers"
  ));
  body.appendChild(control(
    "Effects",
    "🔗 Enhanced Links.Marker.Effects",
    "Additional marker animation effects"
  ));
  container.appendChild(section);
}
function renderLinkShadowSection(container) {
  const { section, body } = createSection("🌑 Shadows", true);
  body.appendChild(control(
    "Link Shadows",
    "🔗 Enhanced Links.Link.Shadow.Enabled",
    "Enable drop shadows on links"
  ));
  body.appendChild(control(
    "Marker Shadows",
    "🔗 Enhanced Links.Marker.Shadow.Enabled",
    "Enable drop shadows on markers"
  ));
  container.appendChild(section);
}
function renderNodeAnimationSection(container) {
  const { section, body } = createSection("🎬 Animation", true);
  body.appendChild(control(
    "Animation Style",
    "📦 Enhanced Nodes.Animate",
    "Select the animation effect for nodes"
  ));
  body.appendChild(control(
    "Animations Enabled",
    "📦 Enhanced Nodes.Animations.Enabled",
    "Master toggle for all node animations"
  ));
  body.appendChild(control(
    "Speed",
    "📦 Enhanced Nodes.Animation.Speed",
    "Animation playback speed",
    "x"
  ));
  body.appendChild(control(
    "Direction",
    "📦 Enhanced Nodes.Direction",
    "Animation direction"
  ));
  body.appendChild(control(
    "Static Mode",
    "📦 Enhanced Nodes.Static.Mode",
    "Display a static snapshot of the animation"
  ));
  body.appendChild(control(
    "End Animation",
    "📦 Enhanced Nodes.End Animation.Enabled",
    "Play completion animation when a node finishes processing"
  ));
  body.appendChild(control(
    "Pause During Render",
    "📦 Enhanced Nodes.Pause.During.Render",
    "Pause animations while ComfyUI is processing"
  ));
  body.appendChild(control(
    "Animation Size",
    "📦 Enhanced Nodes.Animation.Size",
    "Scale of the animation effect area",
    "x"
  ));
  container.appendChild(section);
}
function renderNodeColorSection(container) {
  const { section, body } = createSection("🎨 Colors", true);
  body.appendChild(control(
    "Color Mode",
    "📦 Enhanced Nodes.Color.Mode",
    "How colors are determined for node animations"
  ));
  body.appendChild(control(
    "Color Scheme",
    "📦 Enhanced Nodes.Color.Scheme",
    "Preset color scheme"
  ));
  body.appendChild(control(
    "Primary Color",
    "📦 Enhanced Nodes.Color.Primary",
    "Primary animation color"
  ));
  body.appendChild(control(
    "Secondary Color",
    "📦 Enhanced Nodes.Color.Secondary",
    "Secondary animation color"
  ));
  body.appendChild(control(
    "Accent Color",
    "📦 Enhanced Nodes.Color.Accent",
    "Accent animation color"
  ));
  body.appendChild(control(
    "Hover Color",
    "📦 Enhanced Nodes.Color.Hover",
    "Color shown on node hover"
  ));
  body.appendChild(control(
    "Show Hover Effect",
    "📦 Enhanced Nodes.Color.Hover.Show",
    "Show hover highlight on nodes"
  ));
  container.appendChild(section);
}
function renderNodeGlowSection(container) {
  const { section, body } = createSection("✨ Glow", true);
  body.appendChild(control(
    "Glow Level",
    "📦 Enhanced Nodes.Glow",
    "Base glow intensity"
  ));
  body.appendChild(control(
    "Animation Glow",
    "📦 Enhanced Nodes.Animation.Glow",
    "Glow intensity during animation"
  ));
  body.appendChild(control(
    "Show Glow",
    "📦 Enhanced Nodes.Glow.Show",
    "Toggle glow effect visibility"
  ));
  body.appendChild(control(
    "Intensity",
    "📦 Enhanced Nodes.Intensity",
    "Overall effect intensity"
  ));
  body.appendChild(control(
    "Quality",
    "📦 Enhanced Nodes.Quality",
    "Rendering quality — higher uses more GPU"
  ));
  container.appendChild(section);
}
function renderNodeParticleSection(container) {
  const { section, body } = createSection("🌠 Particles", true);
  body.appendChild(control(
    "Show Particles",
    "📦 Enhanced Nodes.Particle.Show",
    "Toggle particle display"
  ));
  body.appendChild(control(
    "Density",
    "📦 Enhanced Nodes.Particle.Density",
    "Number of particles per node"
  ));
  body.appendChild(control(
    "Speed",
    "📦 Enhanced Nodes.Particle.Speed",
    "Particle movement speed",
    "x"
  ));
  body.appendChild(control(
    "Intensity",
    "📦 Enhanced Nodes.Particle.Intensity",
    "Particle brightness/opacity"
  ));
  body.appendChild(control(
    "Size",
    "📦 Enhanced Nodes.Particle.Size",
    "Particle size",
    "x"
  ));
  body.appendChild(control(
    "Glow",
    "📦 Enhanced Nodes.Particle.Glow",
    "Particle glow intensity"
  ));
  body.appendChild(control(
    "Color Mode",
    "📦 Enhanced Nodes.Particle.Color.Mode",
    "How particle colors are determined"
  ));
  body.appendChild(control(
    "Particle Color",
    "📦 Enhanced Nodes.Color.Particle",
    "Custom particle color"
  ));
  container.appendChild(section);
}
function renderSettingsPanel(container) {
  const linkHeader = document.createElement("div");
  linkHeader.className = "enh-section-divider";
  linkHeader.textContent = "🔗 Link Settings";
  container.appendChild(linkHeader);
  renderLinkAnimationSection(container);
  renderLinkStyleSection(container);
  renderLinkColorSection(container);
  renderLinkEffectsSection(container);
  renderLinkMarkerSection(container);
  renderLinkShadowSection(container);
  container.appendChild(createResetButton("Reset Link Settings to Defaults", "🔗 Enhanced Links.", container));
  const nodeHeader = document.createElement("div");
  nodeHeader.className = "enh-section-divider";
  nodeHeader.textContent = "📦 Node Settings";
  container.appendChild(nodeHeader);
  renderNodeAnimationSection(container);
  renderNodeColorSection(container);
  renderNodeGlowSection(container);
  renderNodeParticleSection(container);
  container.appendChild(createResetButton("Reset Node Settings to Defaults", "📦 Enhanced Nodes.", container));
  const about = document.createElement("div");
  about.className = "enh-about";
  about.innerHTML = `
        <strong>Enhanced Links & Nodes</strong><br>
        by <a href="https://github.com/AEmotionStudio" target="_blank">ÆmotionStudio</a><br>
        <br>
        Beautiful animations and effects for your ComfyUI workflow.<br>
        Changes apply instantly — adjust to taste!
    `;
  container.appendChild(about);
}
function createResetButton(label, prefix, panelContainer) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;justify-content:center;padding:8px 12px;";
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.cssText = [
    "background: linear-gradient(135deg, rgba(220,50,50,0.25), rgba(180,40,40,0.15))",
    "border: 1px solid rgba(220,80,80,0.4)",
    "color: #ff9999",
    "padding: 8px 20px",
    "border-radius: 6px",
    "cursor: pointer",
    "font-size: 12px",
    "font-weight: 600",
    "letter-spacing: 0.5px",
    "transition: all 0.2s ease",
    "width: 100%"
  ].join(";");
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "linear-gradient(135deg, rgba(220,50,50,0.45), rgba(180,40,40,0.3))";
    btn.style.borderColor = "rgba(220,80,80,0.7)";
    btn.style.color = "#ffbbbb";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "linear-gradient(135deg, rgba(220,50,50,0.25), rgba(180,40,40,0.15))";
    btn.style.borderColor = "rgba(220,80,80,0.4)";
    btn.style.color = "#ff9999";
  });
  btn.addEventListener("click", () => {
    reset(prefix);
    panelContainer.innerHTML = "";
    renderSettingsPanel(panelContainer);
  });
  wrapper.appendChild(btn);
  return wrapper;
}
const sidebarCSS = "/**\n * Sidebar CSS — injected inline by sidebar.ts\n *\n * Uses ComfyUI PrimeVue theme variables for native look.\n */\n\n/* =============================================================================\n   Sidebar Container\n   ============================================================================= */\n\n.enh-sidebar {\n    display: flex;\n    flex-direction: column;\n    height: 100%;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    font-size: 13px;\n    color: var(--p-content-color, #ddd);\n    background: var(--p-content-background, #1a1a2e);\n    overflow-y: auto;\n    scrollbar-width: thin;\n    scrollbar-color: var(--p-surface-500, #555) transparent;\n}\n\n.enh-sidebar::-webkit-scrollbar {\n    width: 6px;\n}\n\n.enh-sidebar::-webkit-scrollbar-thumb {\n    background: var(--p-surface-500, #555);\n    border-radius: 3px;\n}\n\n/* =============================================================================\n   Header\n   ============================================================================= */\n\n.enh-sidebar-header {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 12px 14px;\n    border-bottom: 1px solid var(--p-surface-700, #333);\n    flex-shrink: 0;\n}\n\n.enh-sidebar-header svg {\n    flex-shrink: 0;\n    opacity: 0.8;\n}\n\n.enh-sidebar-header h2 {\n    margin: 0;\n    font-size: 14px;\n    font-weight: 600;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.enh-sidebar-content {\n    flex: 1;\n    overflow-y: auto;\n    padding: 6px 0;\n}\n\n/* =============================================================================\n   Collapsible Sections\n   ============================================================================= */\n\n.enh-sidebar-section {\n    border-bottom: 1px solid var(--p-surface-700, #333);\n}\n\n.enh-sidebar-section-header {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    padding: 8px 14px;\n    cursor: pointer;\n    user-select: none;\n    font-weight: 500;\n    font-size: 12px;\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    color: var(--p-content-color, #ccc);\n    transition: background 0.15s;\n}\n\n.enh-sidebar-section-header:hover {\n    background: var(--p-surface-800, rgba(255, 255, 255, 0.04));\n}\n\n.enh-sidebar-section-header:focus-visible {\n    outline: 2px solid var(--p-primary-color, #6366f1);\n    outline-offset: -2px;\n}\n\n.enh-sidebar-section-header svg {\n    transition: transform 0.2s ease;\n    flex-shrink: 0;\n}\n\n.enh-sidebar-section-header.collapsed svg {\n    transform: rotate(-90deg);\n}\n\n.enh-sidebar-section-body {\n    padding: 4px 14px 10px;\n}\n\n.enh-sidebar-section-body.collapsed {\n    display: none;\n}\n\n/* =============================================================================\n   Control Rows\n   ============================================================================= */\n\n.enh-control-row {\n    margin-bottom: 8px;\n}\n\n.enh-control-row label {\n    display: block;\n    font-size: 11px;\n    color: var(--p-text-muted-color, #999);\n    margin-bottom: 3px;\n}\n\n.enh-control-label-row {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n\n.enh-control-value {\n    font-size: 11px;\n    color: var(--p-primary-color, #6366f1);\n    font-weight: 500;\n    font-variant-numeric: tabular-nums;\n}\n\n/* =============================================================================\n   Slider\n   ============================================================================= */\n\n.enh-slider {\n    -webkit-appearance: none;\n    appearance: none;\n    width: 100%;\n    height: 4px;\n    border-radius: 2px;\n    background: var(--p-surface-600, #444);\n    outline: none;\n    cursor: pointer;\n}\n\n.enh-slider::-webkit-slider-thumb {\n    -webkit-appearance: none;\n    appearance: none;\n    width: 14px;\n    height: 14px;\n    border-radius: 50%;\n    background: var(--p-primary-color, #6366f1);\n    cursor: pointer;\n    transition: box-shadow 0.15s;\n}\n\n.enh-slider::-webkit-slider-thumb:hover {\n    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);\n}\n\n.enh-slider::-moz-range-thumb {\n    width: 14px;\n    height: 14px;\n    border-radius: 50%;\n    background: var(--p-primary-color, #6366f1);\n    border: none;\n    cursor: pointer;\n}\n\n/* =============================================================================\n   Toggle Switch\n   ============================================================================= */\n\n.enh-toggle-row {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 8px;\n}\n\n.enh-toggle-row label {\n    font-size: 11px;\n    color: var(--p-text-muted-color, #999);\n    cursor: pointer;\n}\n\n.enh-toggle {\n    position: relative;\n    width: 34px;\n    height: 18px;\n    border-radius: 9px;\n    background: var(--p-surface-600, #444);\n    cursor: pointer;\n    transition: background 0.2s;\n    flex-shrink: 0;\n}\n\n.enh-toggle::after {\n    content: '';\n    position: absolute;\n    top: 2px;\n    left: 2px;\n    width: 14px;\n    height: 14px;\n    border-radius: 50%;\n    background: #fff;\n    transition: transform 0.2s;\n}\n\n.enh-toggle.active {\n    background: var(--p-primary-color, #6366f1);\n}\n\n.enh-toggle.active::after {\n    transform: translateX(16px);\n}\n\n.enh-toggle:focus-visible {\n    outline: 2px solid var(--p-primary-color, #6366f1);\n    outline-offset: 2px;\n}\n\n/* =============================================================================\n   Select Dropdown\n   ============================================================================= */\n\n.enh-select {\n    width: 100%;\n    padding: 5px 8px;\n    border-radius: 4px;\n    border: 1px solid var(--p-surface-600, #444);\n    background: var(--p-surface-800, #1a1a2e);\n    color: var(--p-content-color, #ddd);\n    font-size: 12px;\n    cursor: pointer;\n    outline: none;\n}\n\n.enh-select:focus {\n    border-color: var(--p-primary-color, #6366f1);\n}\n\n.enh-select option {\n    background: var(--p-surface-800, #1a1a2e);\n    color: var(--p-content-color, #ddd);\n}\n\n/* =============================================================================\n   Color Picker\n   ============================================================================= */\n\n.enh-color-row {\n    display: flex;\n    flex-direction: column;\n}\n\n.enh-color-wrapper {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n}\n\n.enh-color-input {\n    width: 32px;\n    height: 24px;\n    border: 1px solid var(--p-surface-600, #444);\n    border-radius: 4px;\n    padding: 0;\n    cursor: pointer;\n    background: transparent;\n}\n\n.enh-color-input::-webkit-color-swatch-wrapper {\n    padding: 1px;\n}\n\n.enh-color-input::-webkit-color-swatch {\n    border: none;\n    border-radius: 3px;\n}\n\n.enh-color-preview {\n    flex: 1;\n    padding: 4px 8px;\n    border-radius: 4px;\n    border: 1px solid var(--p-surface-600, #444);\n    background: var(--p-surface-800, #1a1a2e);\n    color: var(--p-content-color, #ddd);\n    font-size: 12px;\n    font-family: monospace;\n}\n\n.enh-color-preview:focus {\n    border-color: var(--p-primary-color, #6366f1);\n    outline: none;\n}\n\n/* =============================================================================\n   About Section\n   ============================================================================= */\n\n.enh-about {\n    padding: 10px 14px;\n    font-size: 11px;\n    color: var(--p-text-muted-color, #888);\n    line-height: 1.5;\n}\n\n.enh-about a {\n    color: var(--p-primary-color, #6366f1);\n    text-decoration: none;\n}\n\n.enh-about a:hover {\n    text-decoration: underline;\n}\n\n/* =============================================================================\n   Section Divider\n   ============================================================================= */\n\n.enh-section-divider {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    margin: 6px 0 4px;\n    font-size: 10px;\n    font-weight: 600;\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    color: var(--p-primary-color, #6366f1);\n    opacity: 0.7;\n}\n\n.enh-section-divider::after {\n    content: '';\n    flex: 1;\n    height: 1px;\n    background: var(--p-surface-600, #444);\n}\n";
const SIDEBAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
let cssInjected = false;
function injectStyles() {
  if (cssInjected) return;
  const style = document.createElement("style");
  style.id = "enhanced-links-sidebar-styles";
  style.textContent = sidebarCSS;
  document.head.appendChild(style);
  cssInjected = true;
}
let sidebarRegistered = false;
function renderSidebar(container) {
  if (container.querySelector(".enh-sidebar")) {
    return;
  }
  container.innerHTML = "";
  const sidebar = document.createElement("div");
  sidebar.className = "enh-sidebar";
  const header = document.createElement("div");
  header.className = "enh-sidebar-header";
  header.innerHTML = `${SIDEBAR_ICON}<h2>Enhanced Links & Nodes</h2>`;
  sidebar.appendChild(header);
  const content = document.createElement("div");
  content.className = "enh-sidebar-content";
  renderSettingsPanel(content);
  sidebar.appendChild(content);
  container.appendChild(sidebar);
}
function registerSidebar() {
  if (sidebarRegistered) return;
  if (!app.extensionManager) {
    console.warn("[EnhancedLinks] extensionManager not available, sidebar registration skipped");
    return;
  }
  try {
    injectStyles();
    app.extensionManager.registerSidebarTab({
      id: "enhanced-links-nodes",
      icon: "pi pi-link",
      title: "Enhanced",
      tooltip: "Enhanced Links & Nodes Settings",
      type: "custom",
      render: (el) => {
        renderSidebar(el);
      }
    });
    sidebarRegistered = true;
    console.log("[EnhancedLinks] Sidebar registered");
  } catch (e) {
    console.warn("[EnhancedLinks] Failed to register sidebar:", e);
  }
}
function initSidebar() {
  setTimeout(() => {
    registerSidebar();
  }, 100);
}
const AnimationState = {
  direction: 1,
  targetPhase: 0,
  smoothFactor: 0.95,
  lastPhaseUpdate: 0,
  transitionSpeed: 2 * Math.PI / (10 * 1.5),
  update(delta) {
    const dir = L.direction;
    const speed = Math.max(0.01, L.animationSpeed);
    this.direction = dir;
    return State.phase + this.transitionSpeed * delta * speed * this.direction;
  }
};
const TimingManager = {
  smoothDelta: 0,
  lastTime: performance.now(),
  update() {
    const now = performance.now();
    const rawDelta = Math.min((now - this.lastTime) / 1e3, 1 / 30);
    this.lastTime = now;
    this.smoothDelta = this.smoothDelta * 0.9 + rawDelta * 0.1;
    return this.smoothDelta;
  }
};
const State = {
  isRunning: false,
  phase: 0,
  totalTime: 0,
  lastFrame: performance.now(),
  animationFrame: null,
  staticPhase: Math.PI / 4,
  lastSettings: null,
  lastAnimStyle: null,
  forceUpdate: false,
  forceRedraw: false,
  lastRenderState: null,
  speedMultiplier: 1,
  linkPositions: /* @__PURE__ */ new Map(),
  particlePool: /* @__PURE__ */ new Map(),
  activeParticles: /* @__PURE__ */ new Set()
};
const ext = {
  name: "enhanced.link.animations",
  settings: linkSettings,
  async setup() {
    api.addEventListener("status", ({ detail }) => {
      State.isRunning = detail?.exec_info?.queue_remaining > 0;
      app.graph?.setDirtyCanvas(true, true);
    });
    initSidebar();
    const origDrawConnections = LGraphCanvas.prototype.drawConnections;
    LGraphCanvas.prototype.drawConnections = function(ctx) {
      try {
        ctx.save();
        enableAntiAliasing(ctx);
        const animStyle = L.animate;
        const linkStyle = L.linkStyle;
        const shouldPauseDuringRender = L.pauseDuringRender;
        const isStaticMode = L.staticMode;
        const quality = L.quality;
        const particleDensity = L.particleDensity;
        if (animStyle === 0) {
          origDrawConnections.call(this, ctx);
          ctx.restore();
          return;
        }
        const isPaused = shouldPauseDuringRender && State.isRunning;
        const effectiveStaticMode = isStaticMode || isPaused;
        const currentSettings = `${animStyle}-${linkStyle}-${quality}-${particleDensity}`;
        if (State.lastSettings !== currentSettings || State.forceRedraw) {
          State.forceUpdate = true;
          State.lastSettings = currentSettings;
          State.lastAnimStyle = animStyle;
          State.forceRedraw = false;
        }
        const delta = TimingManager.update();
        let phase;
        if (effectiveStaticMode) {
          if (State.forceUpdate || State.lastAnimStyle !== animStyle) {
            State.staticPhase = (State.staticPhase + Math.PI * 2) % (Math.PI * 4);
            State.forceUpdate = false;
            State.lastAnimStyle = animStyle;
          }
          phase = State.staticPhase;
        } else {
          phase = AnimationState.update(delta);
          State.phase = phase;
          State.totalTime += delta;
        }
        State.activeParticles.clear();
        const renderQueue = /* @__PURE__ */ new Map();
        for (const linkId in this.graph.links) {
          const linkData = this.graph.links[linkId];
          if (!linkData) continue;
          const originNode = this.graph._nodes_by_id[linkData.origin_id];
          const targetNode = this.graph._nodes_by_id[linkData.target_id];
          if (!originNode || !targetNode || originNode.flags?.collapsed || targetNode.flags?.collapsed) continue;
          const startPos = new Float32Array(2);
          const endPos = new Float32Array(2);
          originNode.getConnectionPos(false, linkData.origin_slot, startPos);
          targetNode.getConnectionPos(true, linkData.target_slot, endPos);
          const defaultColor = linkData.type ? LGraphCanvas.link_type_colors?.[linkData.type] ?? this.default_connection_color : this.default_connection_color;
          if (!renderQueue.has(animStyle)) {
            renderQueue.set(animStyle, []);
          }
          renderQueue.get(animStyle).push({
            start: startPos,
            end: endPos,
            color: defaultColor,
            defaultColor,
            linkId,
            linkStyle,
            isStatic: effectiveStaticMode
          });
        }
        if (effectiveStaticMode) {
          const items = renderQueue.get(animStyle);
          if (items) {
            renderStaticStyle(ctx, items, animStyle, phase);
          }
        } else {
          renderQueue.forEach((items, style) => {
            renderAnimatedStyle(ctx, items, style, phase, {
              direction: AnimationState.direction,
              totalTime: State.totalTime,
              phase: State.phase
            });
          });
        }
        ctx.restore();
        app.graph?.setDirtyCanvas(true, true);
      } catch (error) {
        console.error("[EnhancedLinks] Error in drawConnections:", error);
        origDrawConnections.call(this, ctx);
      }
    };
    function animate() {
      const isStaticMode = L.staticMode;
      const animStyle = L.animate;
      const shouldPauseDuringRender = L.pauseDuringRender;
      if (shouldPauseDuringRender && State.isRunning) {
        if (!State.lastRenderState) {
          State.lastRenderState = {
            phase: State.phase,
            totalTime: State.totalTime
          };
        }
        requestAnimationFrame(animate);
        return;
      } else if (State.lastRenderState) {
        State.phase = State.lastRenderState.phase;
        State.totalTime = State.lastRenderState.totalTime;
        State.lastRenderState = null;
      }
      if (isStaticMode && animStyle > 0 || animStyle > 0 && !isStaticMode) {
        State.totalTime += TimingManager.smoothDelta * State.speedMultiplier;
        app.graph?.setDirtyCanvas(true, true);
      }
      State.animationFrame = requestAnimationFrame(animate);
    }
    animate();
    console.log("[EnhancedLinks] Extension registered with full batched rendering pipeline.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
