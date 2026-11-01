import { app } from "/scripts/app.js";
import { L, D as DOT, s as shine, g as glow, r as rainbow, c as clock, a as guard, e as env, w as wake, l as live, d as dummy, b as layers, H as HIGHLIGHT, p as palette, S as STILL_PHASE, f as startSprites, h as stopSprites, i as reset, j as SETTINGS, k as snapshotOf, m as commit, n as preview, o as linkSettings, q as install } from "./chunks/particles-rmz1g5bC.js";
const SACRED = { TRINITY: 3, HARMONY: 7, COMPLETION: 12, QUANTUM: 5 };
function wrap(x) {
  const r = x % 1;
  return r < 0 ? r + 1 : r;
}
const here$3 = new Float64Array(4);
let ts = new Float64Array(64);
function vertices(s, n) {
  const first2 = Math.ceil(s.t0 * n);
  const last = Math.floor(s.t1 * n);
  if (ts.length < last - first2 + 3) ts = new Float64Array(2 * (last - first2 + 3));
  let m = 0;
  if (first2 / n > s.t0) ts[m++] = s.t0;
  for (let i = first2; i <= last; i++) ts[m++] = i / n;
  if (last / n < s.t1) ts[m++] = s.t1;
  return m;
}
const HEPTAGON = {
  path(ctx, x, y, size, angle) {
    ctx.beginPath();
    for (let i = 0; i < SACRED.HARMONY; i++) {
      const corner = angle + i / SACRED.HARMONY * Math.PI * 2;
      const px = x + Math.cos(corner) * size;
      const py = y + Math.sin(corner) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  },
  stroked: true,
  turn: Math.PI * 2 / SACRED.HARMONY
};
function createCrystal(ctx, x, y, size, rotation, color, glowColor, blur) {
  glow(ctx, HEPTAGON, x, y, size, rotation, color, glowColor, blur);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  HEPTAGON.path(ctx, 0, 0, size, 0);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
const RUNG = {
  path(ctx, x, y, size, angle) {
    const dx2 = Math.cos(angle) * size;
    const dy2 = Math.sin(angle) * size;
    ctx.beginPath();
    ctx.moveTo(x + dx2, y + dy2);
    ctx.lineTo(x - dx2, y - dy2);
  },
  stroked: true,
  turn: Math.PI
};
const moved = (turn, T, cp) => turn(T * Math.PI * SACRED.TRINITY - cp) * 10 * Math.sin(T * Math.PI - cp) * 0.5;
function sacredFlow$1(ctx, s, k) {
  const { thickness, glowIntensity } = L;
  const { primary, accent } = s.pal;
  const cp = k.linkFlow * 0.25;
  const m = vertices(s, Math.max(12, Math.round(s.chain / 8)));
  ctx.beginPath();
  for (let j = 0; j < m; j++) {
    const T = ts[j];
    s.path.at(s.local(T), here$3);
    const x = here$3[0] + moved(Math.sin, T, cp);
    const y = here$3[1] + moved(Math.cos, T, cp);
    if (j) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = primary;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = primary;
  ctx.shadowBlur = glowIntensity;
  ctx.globalAlpha = 1;
  ctx.stroke();
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp * 0.5);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    const x = here$3[0] + moved(Math.sin, T, cp);
    const y = here$3[1] + moved(Math.cos, T, cp);
    DOT.path(ctx, x, y, thickness * 0.75, 0);
    ctx.globalAlpha = 0.4 + Math.sin(k.linkPhase + T * Math.PI * 2) * 0.2;
    shine(ctx, DOT, x, y, thickness * 0.75, 0, accent, accent, glowIntensity);
  }
}
function crystalStream$1(ctx, s, k) {
  const { thickness } = L;
  const { primary, secondary } = s.pal;
  const cp = k.linkFlow;
  const count2 = Math.max(1, Math.floor(SACRED.HARMONY * L.quality * L.particleDensity));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 1;
    createCrystal(ctx, here$3[0], here$3[1], 5 * thickness * (1 + Math.sin(cp + T * Math.PI)), T * Math.PI * 2 + cp, primary, secondary, L.glowIntensity);
  }
}
function quantumField$1(ctx, s, k) {
  const { primary, secondary } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * L.particleDensity)));
  for (let f = 0; f < SACRED.QUANTUM; f++) {
    const fieldPhase = k.quantumPhase + f * Math.PI * 2 / SACRED.QUANTUM;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$3);
      const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
      const x = here$3[0] + uncertainty * Math.cos(fieldPhase);
      const y = here$3[1] + uncertainty * Math.sin(fieldPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = f % 2 === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = L.thickness * 0.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
  }
}
function cosmicWeave$1(ctx, s, k) {
  const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let strand = 0; strand < SACRED.TRINITY; strand++) {
    const strandPhase = k.linkFlow + strand * Math.PI * 2 / SACRED.TRINITY;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$3);
      const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase) * 10;
      const x = here$3[0] + weave * Math.cos(strandPhase);
      const y = here$3[1] + weave * Math.sin(strandPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = colors[strand];
    ctx.lineWidth = L.thickness * 0.7;
    ctx.shadowColor = colors[strand];
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
  }
}
function energyPulse$1(ctx, s, k) {
  const { secondary } = s.pal;
  const cp = k.linkFlow * 0.25;
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    const trip = L.direction > 0 ? T : 1 - T;
    const r = L.thickness * 2 * (1 - trip);
    DOT.path(ctx, here$3[0], here$3[1], r, 0);
    ctx.globalAlpha = 0.5 * (1 - trip);
    shine(ctx, DOT, here$3[0], here$3[1], r, 0, secondary, secondary, L.glowIntensity * 2);
  }
}
function dnaHelix$1(ctx, s, k) {
  const { primary, secondary, accent } = s.pal;
  const { thickness, glowIntensity } = L;
  const radius = 10;
  const rotations = 4;
  const angle = (T) => (1 - T) * Math.PI * rotations * 2 + k.linkFlow;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
  for (let strand = 0; strand < 2; strand++) {
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$3);
      const side = strand ? -1 : 1;
      const x = here$3[0] + side * Math.cos(angle(T)) * radius;
      const y = here$3[1] + side * Math.sin(angle(T)) * radius;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = strand ? secondary : primary;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  const bonds = rotations * 4;
  for (let b = 0; b < bonds; b++) {
    const T = 1 - b / bonds;
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 0.6;
    RUNG.path(ctx, here$3[0], here$3[1], radius, angle(T));
    shine(ctx, RUNG, here$3[0], here$3[1], radius, angle(T), accent, accent, glowIntensity * 0.5);
  }
}
function linkGradient(ctx, s, dir) {
  const { start, end: end2, t0, t1 } = s;
  const dx2 = (end2[0] - start[0]) / (t1 - t0);
  const dy2 = (end2[1] - start[1]) / (t1 - t0);
  const x0 = start[0] - dx2 * t0;
  const y0 = start[1] - dy2 * t0;
  const x1 = end2[0] + dx2 * (1 - t1);
  const y1 = end2[1] + dy2 * (1 - t1);
  return dir > 0 ? ctx.createLinearGradient(x0, y0, x1, y1) : ctx.createLinearGradient(x1, y1, x0, y0);
}
const LAVA = [
  { ripple: 20, rate: 1, swell: 0.8 },
  { ripple: 20 * 0.7, rate: 1.2, swell: 0.6 }
];
function lavaFlow$1(ctx, s, k) {
  const { primary, secondary, accent } = s.pal;
  const { thickness, glowIntensity } = L;
  const cp = k.linkFlow;
  const tube = thickness * 7;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
  for (const layer of LAVA) {
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$3);
      const across = Math.sin(T * Math.PI * 3 - cp * layer.rate) * layer.ripple * Math.sin(T * Math.PI * 2 - cp * layer.swell);
      const x = here$3[0] - here$3[3] * across;
      const y = here$3[1] + here$3[2] * across;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.lineCap = "round";
    ctx.shadowColor = secondary;
    ctx.shadowBlur = glowIntensity * 1.5;
    if (layer === LAVA[0]) {
      ctx.strokeStyle = secondary;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = tube;
    } else {
      const gradient = linkGradient(ctx, s, L.direction);
      gradient.addColorStop(0, primary);
      gradient.addColorStop(0.4 + Math.sin(k.linkPhase) * 0.1, secondary);
      gradient.addColorStop(1, accent);
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = 1;
      ctx.lineWidth = thickness * 5;
    }
    ctx.stroke();
  }
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity * 3));
  for (let i = 0; i < count2; i++) {
    const T = wrap(i / count2 + cp * 0.5);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    const along = Math.sin(T * Math.PI * 2) * (tube * 0.15);
    const across = Math.sin(T * Math.PI * 3 - cp) * (20 * 0.3) * Math.sin(T * Math.PI * 2 - cp) + Math.cos(T * Math.PI * 3) * (tube * 0.15);
    const x = here$3[0] + here$3[2] * along - here$3[3] * across;
    const y = here$3[1] + here$3[3] * along + here$3[2] * across;
    const r = thickness * (0.5 + Math.sin(cp + i) * 0.2);
    DOT.path(ctx, x, y, r, 0);
    ctx.globalAlpha = 0.6 + Math.sin(cp + i) * 0.4;
    shine(ctx, DOT, x, y, r, 0, accent, secondary, glowIntensity * 1.5);
  }
}
function stellarPlasma$1(ctx, s, k) {
  const { primary, secondary, accent } = s.pal;
  const { thickness, glowIntensity } = L;
  const f = k.linkFlow;
  const segments = Math.floor(s.chain / 20) * L.quality * L.particleDensity || 1;
  const first2 = (t) => L.direction > 0 ? t < 0.5 : t > 0.5;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const size = thickness * (0.5 + Math.sin(t * Math.PI * 2 + f) * 0.5);
    let u = s.local(1 - t);
    if (s.within(u)) {
      s.path.at(u, here$3);
      const y2 = here$3[1] + Math.sin(t * Math.PI * 4 + f) * 15;
      const color = first2(t) ? primary : secondary;
      DOT.path(ctx, here$3[0], y2, size, 0);
      ctx.globalAlpha = 0.7 - Math.abs(t - 0.5) * 0.3;
      shine(ctx, DOT, here$3[0], y2, size, 0, color, color, glowIntensity);
    }
    if (i % 3) continue;
    const spark = wrap(t - f * 0.5);
    u = s.local(1 - spark);
    if (!s.within(u)) continue;
    s.path.at(u, here$3);
    const y = here$3[1] + Math.sin(spark * Math.PI * 4 + f) * 15;
    DOT.path(ctx, here$3[0], y, size * 0.5, 0);
    ctx.globalAlpha = 0.6 - Math.abs(spark - 0.5) * 0.4;
    shine(ctx, DOT, here$3[0], y, size * 0.5, 0, accent, accent, glowIntensity * 0.5);
  }
}
const STROKES = /* @__PURE__ */ new Set([1, 3, 4, 6, 7]);
const MOVING = {
  1: sacredFlow$1,
  2: crystalStream$1,
  3: quantumField$1,
  4: cosmicWeave$1,
  5: energyPulse$1,
  6: dnaHelix$1,
  7: lavaFlow$1,
  8: stellarPlasma$1
};
const UP = 1;
const DOWN = 2;
const LEFT = 3;
const RIGHT = 4;
const STRAIGHT_LINK = 0;
const LINEAR_LINK = 1;
const CHORDS = 40;
const STUB = 10;
const CORNER = 8;
const WAVE = 10;
const WAVELENGTH = 60;
const COIL = 6;
const PITCH = 12;
const TAPER = 15;
const MOST_POINTS = 2049;
const dx = (dir) => dir === LEFT ? -1 : dir === RIGHT ? 1 : 0;
const dy = (dir) => dir === UP ? -1 : dir === DOWN ? 1 : 0;
const smooth = (x) => x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x);
let samples = new Float64Array(64);
const here$2 = new Float64Array(4);
class LinkPath {
  /** The ends, which the effects hand back to ask for a point counted from either one. */
  a = [0, 0];
  b = [0, 0];
  /** A spline's start, controls and end, or the points of a polyline, as x, y pairs. */
  p = new Float64Array(12);
  /** How many points p holds: 4 for a spline. */
  n = 4;
  spline = true;
  /** A spline's x and y as a·t³ + b·t² + c·t + start, as v1 computed its own (old_link_animations.js:455-475). */
  k = new Float64Array(6);
  /** The length to each polyline point, or to each of a spline's CHORDS + 1 samples. */
  cum = new Float64Array(CHORDS + 1);
  /** A coil's points, as x, y pairs, and how many: it is drawn and hit through them, and effects keep to the path inside. */
  loops = new Float64Array(0);
  looped = 0;
  length = 0;
  /** Where the segment's centre marker goes, and the angle of an arrow marker there. */
  cx = 0;
  cy = 0;
  angle = 0;
  /** The box around the points, which holds the whole path: left, top, right, bottom. */
  box = new Float64Array(4);
  /** The path native draws for a renderLink call in render mode `mode`, from the arguments the call got. */
  set(a, b, startDir, endDir, mode, startControl, endControl) {
    const ax = this.a[0] = a[0];
    const ay = this.a[1] = a[1];
    const bx = this.b[0] = b[0];
    const by = this.b[1] = b[1];
    this.looped = 0;
    const sd = startDir || RIGHT;
    const ed = endDir || LEFT;
    this.spline = mode !== LINEAR_LINK && mode !== STRAIGHT_LINK;
    if (this.spline) {
      const d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) * 0.25;
      this.points(4);
      this.point(0, ax, ay);
      this.point(1, ax + (startControl ? startControl[0] || 0 : dx(sd) * d), ay + (startControl ? startControl[1] || 0 : dy(sd) * d));
      this.point(2, bx + (endControl ? endControl[0] || 0 : dx(ed) * d), by + (endControl ? endControl[1] || 0 : dy(ed) * d));
      this.point(3, bx, by);
      this.measureSpline();
      return;
    }
    const l = mode === LINEAR_LINK ? 15 : 10;
    const x1 = ax + dx(sd) * l;
    const y1 = ay + dy(sd) * l;
    const x2 = bx + dx(ed) * l;
    const y2 = by + dy(ed) * l;
    const straight = mode === STRAIGHT_LINK;
    this.points(straight ? 6 : 4);
    this.point(0, ax, ay);
    this.point(1, x1, y1);
    if (straight) {
      this.point(2, (x1 + x2) * 0.5, y1);
      this.point(3, (x1 + x2) * 0.5, y2);
    }
    this.point(this.n - 2, x2, y2);
    this.point(this.n - 1, bx, by);
    this.measurePolyline();
    this.cx = (x1 + x2) * 0.5;
    this.cy = (y1 + y2) * 0.5;
    this.angle = straight ? Math.abs(y2 - y1) < 4 ? 0 : Math.sign(y2 - y1) * Math.PI / 2 : Math.atan2(y2 - y1, x2 - x1);
  }
  /**
   * Turns the path set() gave into steps between the same ends: across at the start's height, then down or up,
   * then a stub into the end along its direction, with the corners rounded.
   */
  step(endDir) {
    const [ax, ay] = this.a;
    const [bx, by] = this.b;
    const ed = endDir || LEFT;
    const ex = bx + dx(ed) * STUB;
    const ey = by + dy(ed) * STUB;
    const rise = Math.abs(ey - ay) * 0.5;
    this.spline = false;
    this.n = 0;
    this.add(ax, ay);
    this.corner(ex, ay, ax, ay, ex, ey, Math.min(CORNER, Math.abs(ex - ax), rise));
    this.corner(ex, ey, ex, ay, bx, by, Math.min(CORNER, rise, Math.abs(bx - ex) + Math.abs(by - ey)));
    this.add(bx, by);
    this.measurePolyline();
    this.centre();
  }
  /**
   * Turns the path into a wave, or winds a coil around it. `u0` is how far along its link the segment starts, so
   * either carries on across reroutes; both grow from nothing at an end that is a slot. Effects ride a wave, as they
   * rode v1's zigzag, but keep to the path inside a coil, whose loops run back along it.
   */
  bend(coil, u0, fromSlot, toSlot) {
    const len = this.length;
    if (!len) return;
    const count2 = Math.min(MOST_POINTS, Math.ceil(len / (coil ? PITCH / 12 : WAVELENGTH / 16)) + 1);
    if (samples.length < 2 * count2 + 2) samples = new Float64Array(4 * count2 + 2);
    const offset = (d, i) => {
      this.find(d, here$2);
      const fade = (fromSlot ? smooth(d / TAPER) : 1) * (toSlot ? smooth((len - d) / TAPER) : 1);
      const turn = 2 * Math.PI * (u0 + d) / (coil ? PITCH : WAVELENGTH);
      const across = (coil ? COIL : WAVE) * Math.sin(turn) * fade;
      const along = coil ? 0.6 * COIL * Math.cos(turn) * fade : 0;
      samples[i] = here$2[0] + here$2[2] * along - here$2[3] * across;
      samples[i + 1] = here$2[1] + here$2[3] * along + here$2[2] * across;
    };
    for (let i = 0; i < count2; i++) offset(len * i / (count2 - 1), 2 * i);
    offset(len / 2, 2 * count2);
    const [cx, cy] = [samples[2 * count2], samples[2 * count2 + 1]];
    const angle = Math.atan2(here$2[3], here$2[2]);
    if (coil) {
      if (this.loops.length < 2 * count2) this.loops = new Float64Array(4 * count2);
      this.loops.set(samples.subarray(0, 2 * count2));
      this.looped = count2;
      this.bound(this.loops, count2);
    } else {
      this.spline = false;
      this.n = 0;
      for (let i = 0; i < count2; i++) this.add(samples[2 * i], samples[2 * i + 1]);
      this.measurePolyline();
    }
    [this.cx, this.cy, this.angle] = [cx, cy, angle];
  }
  /**
   * Writes the point at u, from 0 at the start to 1 at the end: the bezier parameter on a spline, the fraction of
   * the length on a polyline. Then the path's direction there, as a unit tangent: x, y, tx, ty.
   */
  at(u, out) {
    if (!this.spline) {
      this.find(u * this.length, out);
      return;
    }
    out[0] = this.bezier(u, 0);
    out[1] = this.bezier(u, 1);
    let tx = this.slope(u, 0);
    let ty = this.slope(u, 1);
    if (Math.abs(tx) + Math.abs(ty) < 1e-9) {
      const i = Math.min(CHORDS - 1, Math.floor(u * CHORDS));
      tx = this.bezier((i + 1) / CHORDS, 0) - this.bezier(i / CHORDS, 0);
      ty = this.bezier((i + 1) / CHORDS, 1) - this.bezier(i / CHORDS, 1);
    }
    const norm = Math.hypot(tx, ty) || 1;
    out[2] = tx / norm;
    out[3] = ty / norm;
  }
  /** Writes the point `d` px along the path, clamped to it, and the path's direction there: x, y, then the unit tangent. */
  find(d, out) {
    const { p, cum } = this;
    const target = Math.min(this.length, Math.max(0, d));
    const i = this.seek(target);
    const span = cum[i + 1] - cum[i];
    const f = span ? (target - cum[i]) / span : 0;
    let tx;
    let ty;
    if (this.spline) {
      const t = (i + f) / CHORDS;
      out[0] = this.bezier(t, 0);
      out[1] = this.bezier(t, 1);
      tx = this.slope(t, 0);
      ty = this.slope(t, 1);
      if (Math.abs(tx) + Math.abs(ty) < 1e-9) {
        tx = this.bezier((i + 1) / CHORDS, 0) - this.bezier(i / CHORDS, 0);
        ty = this.bezier((i + 1) / CHORDS, 1) - this.bezier(i / CHORDS, 1);
      }
    } else {
      out[0] = p[2 * i] + (p[2 * i + 2] - p[2 * i]) * f;
      out[1] = p[2 * i + 1] + (p[2 * i + 3] - p[2 * i + 1]) * f;
      let leg = i;
      while (leg > 0 && cum[leg + 1] === cum[leg]) leg--;
      while (leg < this.n - 2 && cum[leg + 1] === cum[leg]) leg++;
      tx = p[2 * leg + 2] - p[2 * leg];
      ty = p[2 * leg + 3] - p[2 * leg + 1];
    }
    const norm = Math.hypot(tx, ty) || 1;
    out[2] = tx / norm;
    out[3] = ty / norm;
  }
  /** Adds the path, or a coil's loops, to a context's current path or to a Path2D. */
  trace(path) {
    const [p, n] = this.looped ? [this.loops, this.looped] : [this.p, this.n];
    path.moveTo(p[0], p[1]);
    if (this.spline && !this.looped) path.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
    else for (let i = 1; i < n; i++) path.lineTo(p[2 * i], p[2 * i + 1]);
  }
  /** Strokes the path the way v1's renderers stroked theirs: 0.8 × `thickness` wide. */
  draw(ctx, color, thickness) {
    ctx.beginPath();
    this.trace(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 0.8;
    ctx.stroke();
  }
  /** The path as native keeps it for hit testing. */
  hit() {
    const path = new Path2D();
    this.trace(path);
    return path;
  }
  /** Makes room for `count` points. */
  points(count2) {
    if (this.p.length < 2 * count2) this.p = new Float64Array(4 * count2);
    this.n = count2;
  }
  point(i, x, y) {
    this.p[2 * i] = x;
    this.p[2 * i + 1] = y;
  }
  /** Appends a polyline point, unless it is where the last one is. */
  add(x, y) {
    const { n } = this;
    if (n && this.p[2 * n - 2] === x && this.p[2 * n - 1] === y) return;
    if (this.p.length < 2 * n + 2) {
      const grown = new Float64Array(4 * n + 4);
      grown.set(this.p);
      this.p = grown;
    }
    this.n = n + 1;
    this.point(n, x, y);
  }
  /** Appends the corner at (x, y) between a leg from (px, py) and one to (qx, qy), rounded with radius r when the legs are at right angles. */
  corner(x, y, px, py, qx, qy, r) {
    const [ux, uy] = [Math.sign(x - px), Math.sign(y - py)];
    const [vx, vy] = [Math.sign(qx - x), Math.sign(qy - y)];
    if (r <= 0 || ux * vx + uy * vy !== 0 || !(ux || uy) || !(vx || vy)) {
      this.add(x, y);
      return;
    }
    for (let i = 0; i <= 4; i++) {
      const angle = i * Math.PI / 8;
      const back = r * (1 - Math.sin(angle));
      const on = r * (1 - Math.cos(angle));
      this.add(x - ux * back + vx * on, y - uy * back + vy * on);
    }
  }
  /** The spline's polynomial, its length along CHORDS chords and its box; the centre where native puts it (pathRenderer.ts L654-682). */
  measureSpline() {
    const { p, k, cum } = this;
    for (const axis of [0, 1]) {
      const c = 3 * (p[2 + axis] - p[axis]);
      const b = 3 * (p[4 + axis] - p[2 + axis]) - c;
      k[3 * axis] = p[6 + axis] - p[axis] - c - b;
      k[3 * axis + 1] = b;
      k[3 * axis + 2] = c;
    }
    if (cum.length < CHORDS + 1) this.cum = new Float64Array(CHORDS + 1);
    this.cum[0] = 0;
    let [x, y] = [p[0], p[1]];
    for (let i = 1; i <= CHORDS; i++) {
      const nx = this.bezier(i / CHORDS, 0);
      const ny = this.bezier(i / CHORDS, 1);
      this.cum[i] = this.cum[i - 1] + Math.hypot(nx - x, ny - y);
      [x, y] = [nx, ny];
    }
    this.length = this.cum[CHORDS];
    this.bound();
    this.cx = this.bezier(0.5, 0);
    this.cy = this.bezier(0.5, 1);
    this.angle = Math.atan2(this.bezier(0.51, 1) - this.cy, this.bezier(0.51, 0) - this.cx);
  }
  measurePolyline() {
    if (this.n === 1) {
      this.points(2);
      this.point(1, this.p[0], this.p[1]);
    }
    const { p, n } = this;
    if (this.cum.length < n) this.cum = new Float64Array(2 * n);
    const { cum } = this;
    cum[0] = 0;
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
    this.length = cum[n - 1];
    this.bound();
  }
  /** Puts the centre halfway along the path. */
  centre() {
    this.find(this.length / 2, here$2);
    [this.cx, this.cy, this.angle] = [here$2[0], here$2[1], Math.atan2(here$2[3], here$2[2])];
  }
  bound(p = this.p, n = this.n) {
    const { box } = this;
    box[0] = box[2] = p[0];
    box[1] = box[3] = p[1];
    for (let i = 1; i < n; i++) {
      box[0] = Math.min(box[0], p[2 * i]);
      box[1] = Math.min(box[1], p[2 * i + 1]);
      box[2] = Math.max(box[2], p[2 * i]);
      box[3] = Math.max(box[3], p[2 * i + 1]);
    }
  }
  /** The interval of `cum` that holds a length: the last i with cum[i] <= d, short of the end. */
  seek(d) {
    let lo = 0;
    let hi = (this.spline ? CHORDS : this.n - 1) - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid - 1;
    }
    return Math.max(0, lo);
  }
  /** x (axis 0) or y (axis 1) of the spline at t. */
  bezier(t, axis) {
    const { k } = this;
    return k[3 * axis] * t ** 3 + k[3 * axis + 1] * t ** 2 + k[3 * axis + 2] * t + this.p[axis];
  }
  slope(t, axis) {
    const { k } = this;
    return 3 * k[3 * axis] * t * t + 2 * k[3 * axis + 1] * t + k[3 * axis + 2];
  }
}
const here$1 = new Float64Array(4);
function elements(s, count2, last, each) {
  for (let i = 0; i < count2 + (last ? 1 : 0); i++) {
    const T = i / count2;
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here$1);
    each(T, i);
  }
}
function sacredFlow(ctx, s, phase) {
  const { thickness, glowIntensity } = L;
  const { primary, accent } = s.pal;
  const hidden = s.linkStyle === "hidden";
  elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), true, (T) => {
    ctx.beginPath();
    ctx.arc(
      here$1[0] + Math.sin(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
      here$1[1] + Math.cos(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
      thickness * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = accent;
    ctx.shadowColor = hidden ? accent : primary;
    ctx.shadowBlur = hidden ? glowIntensity * 0.7 : glowIntensity;
    ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
    ctx.fill();
  });
}
function crystalStream(ctx, s, phase) {
  const { thickness } = L;
  const { primary, secondary } = s.pal;
  elements(s, Math.max(1, Math.floor(SACRED.HARMONY * L.quality)), false, (T) => {
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 1;
    createCrystal(ctx, here$1[0], here$1[1], thickness * 3 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.2), T * Math.PI * 2 + phase * 0.2, primary, secondary, L.glowIntensity);
  });
}
function quantumField(ctx, s, phase) {
  const { primary, secondary } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let f = 0; f < SACRED.QUANTUM; f++) {
    const fieldPhase = phase + f * Math.PI * 2 / SACRED.QUANTUM;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$1);
      const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
      const x = here$1[0] + uncertainty * Math.cos(fieldPhase);
      const y = here$1[1] + uncertainty * Math.sin(fieldPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = f % 2 === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = L.thickness * 0.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
  }
}
function cosmicWeave(ctx, s, phase) {
  const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
  const dir = L.direction;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
  for (let strand = 0; strand < SACRED.TRINITY; strand++) {
    const strandPhase = phase + strand * Math.PI * 2 / SACRED.TRINITY;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$1);
      const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase * dir) * 10;
      const x = here$1[0] + weave * Math.cos(strandPhase);
      const y = here$1[1] + weave * Math.sin(strandPhase);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = colors[strand];
    ctx.lineWidth = L.thickness * 0.7;
    ctx.shadowColor = colors[strand];
    ctx.shadowBlur = L.glowIntensity;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
  }
}
function energyPulse(ctx, s, phase) {
  const { secondary } = s.pal;
  elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), false, (T) => {
    ctx.beginPath();
    ctx.arc(here$1[0], here$1[1], L.thickness * 2 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = secondary;
    ctx.shadowColor = secondary;
    ctx.shadowBlur = L.glowIntensity * 2;
    ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
    ctx.fill();
  });
}
function dnaHelix(ctx, s, phase) {
  const { primary, secondary, accent } = s.pal;
  const { thickness, glowIntensity } = L;
  const radius = 10;
  const rotations = 4;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
  for (let strand = 0; strand < 2; strand++) {
    const side = strand === 0 ? 1 : -1;
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
      const T = ts[j];
      s.path.at(s.local(T), here$1);
      const angle = T * Math.PI * rotations * 2 + phase;
      const x = here$1[0] + Math.cos(angle) * radius * side;
      const y = here$1[1] + Math.sin(angle) * radius * side;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    const color = strand === 0 ? primary : secondary;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  elements(s, rotations * 4, true, (T) => {
    const angle = T * Math.PI * rotations * 2 + phase;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(here$1[0] + Math.cos(angle) * radius, here$1[1] + Math.sin(angle) * radius);
    ctx.lineTo(here$1[0] - Math.cos(angle) * radius, here$1[1] - Math.sin(angle) * radius);
    ctx.stroke();
  });
}
function lavaFlow(ctx, s, phase) {
  const { primary, secondary, accent } = s.pal;
  const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
  ctx.beginPath();
  for (let j = 0; j < m; j++) {
    const T = ts[j];
    s.path.at(s.local(T), here$1);
    const across = Math.sin(T * Math.PI * 3 + phase * 1.2) * (15 * 0.7) * Math.sin(phase * 0.6 + T * Math.PI * 2);
    const x = here$1[0] - here$1[3] * across;
    const y = here$1[1] + here$1[2] * across;
    if (j) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  const gradient = linkGradient(ctx, s, 1);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondary);
  gradient.addColorStop(1, accent);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = L.thickness * 5;
  ctx.lineCap = "round";
  ctx.shadowColor = secondary;
  ctx.shadowBlur = L.glowIntensity * 1.5;
  ctx.stroke();
}
function stellarPlasma(ctx, s, phase) {
  const { primary, secondary, accent } = s.pal;
  const { thickness, glowIntensity, quality } = L;
  const segments = Math.max(5, Math.floor(Math.min(Math.floor(s.chain / 30), 20) * quality * 0.5));
  elements(s, segments, true, (T, i) => {
    const wave = Math.sin(T * Math.PI * 2 + phase * 0.5) * 8;
    const size = thickness * (0.8 + Math.sin(phase + T * Math.PI) * 0.2);
    const color = T < 0.5 ? primary : secondary;
    ctx.beginPath();
    ctx.arc(here$1[0], here$1[1] + wave, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    if (i % 3 !== 0 || quality <= 1) return;
    ctx.beginPath();
    ctx.arc(here$1[0], here$1[1] + wave * 1.2, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.globalAlpha = 0.4;
    ctx.fill();
  });
}
const STILL = {
  1: sacredFlow,
  2: crystalStream,
  3: quantumField,
  4: cosmicWeave,
  5: energyPulse,
  6: dnaHelix,
  7: lavaFlow,
  8: stellarPlasma
};
const LINK_STYLES = {
  spline: {},
  straight: { mode: LINEAR_LINK },
  linear: { mode: STRAIGHT_LINK },
  hidden: {},
  dotted: { moving: true },
  dashed: { moving: true },
  double: {},
  stepped: { shape: "step" },
  zigzag: { shape: "wave" },
  coil: { shape: "coil" },
  rope: {},
  glowpath: {},
  chain: {},
  pulse: {},
  holographic: {}
};
const MARCH = 12;
const TWIST = 3;
const TWIST_LENGTH = 30;
const WHITE = "rgba(255, 255, 255, 0.3)";
const SHADOW = "rgba(0, 0, 0, 0.95)";
const dash = [0, 0];
const solid = [];
const here = new Float64Array(4);
function dashes(ctx, s, color, thickness, on, off, march) {
  dash[0] = on;
  dash[1] = off;
  ctx.setLineDash(dash);
  ctx.lineDashOffset = s.u0 - (march ? clock.linkFlow * MARCH : 0);
  s.path.draw(ctx, color, thickness);
  ctx.setLineDash(solid);
  ctx.lineDashOffset = 0;
}
function every(s, gap, each) {
  const { path } = s;
  for (let d = Math.ceil(s.u0 / gap) * gap - s.u0; d < path.length; d += gap) {
    path.find(d, here);
    each();
  }
}
function beside(ctx, s, step, across) {
  const { path } = s;
  const count2 = Math.max(2, Math.ceil(path.length / step) + 1);
  ctx.beginPath();
  for (let i = 0; i < count2; i++) {
    const d = path.length * i / (count2 - 1);
    path.find(d, here);
    const off = across(s.u0 + d);
    const x = here[0] - here[3] * off;
    const y = here[1] + here[2] * off;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
}
function drawBody(ctx, s, color, thickness) {
  const { path } = s;
  const alpha = ctx.globalAlpha;
  switch (s.linkStyle) {
    case "dotted":
      ctx.lineCap = "round";
      dashes(ctx, s, color, thickness, 0, thickness * 3, !s.isStatic);
      return;
    case "dashed":
      dashes(ctx, s, color, thickness, thickness * 4, thickness * 2, !s.isStatic);
      return;
    case "double":
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 0.4;
      for (const side of [1, -1]) {
        beside(ctx, s, 6, () => side * thickness * 0.8);
        ctx.stroke();
      }
      return;
    case "rope": {
      const twist = (D) => TWIST * Math.sin(2 * Math.PI * D / TWIST_LENGTH);
      beside(ctx, s, 3, twist);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 1.2;
      ctx.lineCap = "round";
      ctx.stroke();
      beside(ctx, s, 3, twist);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = thickness * 0.4;
      ctx.stroke();
      return;
    }
    case "glowpath": {
      path.draw(ctx, color, thickness);
      const glow2 = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
      glow2.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      glow2.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      glow2.addColorStop(1, "rgba(255, 255, 255, 0.5)");
      ctx.beginPath();
      path.trace(ctx);
      ctx.strokeStyle = glow2;
      ctx.lineWidth = thickness * 2;
      ctx.globalAlpha = alpha * 0.5;
      ctx.stroke();
      ctx.globalAlpha = alpha;
      return;
    }
    case "chain":
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness * 0.4;
      every(s, thickness * 4, () => {
        ctx.beginPath();
        ctx.ellipse(here[0], here[1], thickness * 2, thickness * 1.2, Math.atan2(here[3], here[2]), 0, Math.PI * 2);
        ctx.stroke();
      });
      return;
    case "pulse":
      dashes(ctx, s, color, thickness, thickness * 4, thickness * 4, false);
      ctx.globalAlpha = alpha * 0.3;
      every(s, thickness * 8, () => {
        const blob = ctx.createRadialGradient(here[0], here[1], 0, here[0], here[1], thickness * 3);
        blob.addColorStop(0, color);
        blob.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.beginPath();
        ctx.arc(here[0], here[1], thickness * 3, 0, Math.PI * 2);
        ctx.fillStyle = blob;
        ctx.fill();
      });
      ctx.globalAlpha = alpha;
      return;
    case "holographic": {
      const sheen = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
      sheen.addColorStop(0, color);
      sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
      sheen.addColorStop(1, color);
      ctx.beginPath();
      path.trace(ctx);
      ctx.strokeStyle = sheen;
      ctx.lineWidth = thickness * 1.2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      every(s, thickness * 2, () => {
        ctx.beginPath();
        ctx.moveTo(here[0] - here[3] * thickness, here[1] + here[2] * thickness);
        ctx.lineTo(here[0] + here[3] * thickness, here[1] - here[2] * thickness);
        ctx.stroke();
      });
      return;
    }
    default:
      path.draw(ctx, color, thickness);
  }
}
const BASES = {
  1: ["none", "glow"],
  2: ["ghost", "glow"],
  3: ["ghost", "ghost"],
  4: ["none", "none"],
  5: ["ghost", "ghost"],
  6: ["none", "none"],
  7: ["none", "none"],
  8: ["none", "ghost"],
  9: ["classic", "classic"]
};
const shadowBlur = (blur) => L.shadowStyle === "drop" ? L.shadowBlur * 4 : blur;
const shadowOffset = () => L.shadowStyle === "drop" ? L.shadowOffset * 3 : 0;
function drawBase(ctx, s, animate, still, plain = false) {
  const base = BASES[animate]?.[still ? 1 : 0];
  if (!base || base === "none" || s.linkStyle === "hidden") return false;
  const { thickness } = L;
  const color = s.pal.primary;
  ctx.globalAlpha = 1;
  if (base === "classic" && L.linkShadowEnabled && !plain) {
    ctx.shadowColor = SHADOW;
    ctx.shadowBlur = shadowBlur(L.glowIntensity);
    ctx.shadowOffsetX = ctx.shadowOffsetY = shadowOffset();
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = thickness * 1.2;
    drawBody(ctx, s, SHADOW, thickness * 1.2);
  }
  ctx.shadowColor = color;
  ctx.shadowBlur = plain ? 0 : L.glowIntensity;
  ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = base === "glow" ? thickness * 1.5 : thickness;
  if (base === "ghost") ctx.globalAlpha = 0.3;
  drawBody(ctx, s, color, thickness);
  ctx.globalAlpha = 1;
  return true;
}
function triangle(ctx, size, angle) {
  for (let i = 0; i <= SACRED.TRINITY; i++) {
    const a = angle + i / SACRED.TRINITY * Math.PI * 2;
    if (i) ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
    else ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
  }
}
const MARKERS = {
  diamond: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    }
  },
  circle: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.closePath();
    }
  },
  arrow: {
    path(ctx, x, y, size, angle) {
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
    },
    turn: Math.PI * 2,
    reach: Math.SQRT2
  },
  square: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.rect(x - size, y - size, size * 2, size * 2);
      ctx.closePath();
    }
  },
  triangle: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
    }
  },
  star: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size : size * 0.4;
        const a = i * Math.PI / 5;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
    }
  },
  heart: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size * 0.7, size * 0.7);
      ctx.moveTo(0, 0.4);
      ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
      ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
      ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
      ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
      ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
      ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);
      ctx.restore();
      ctx.closePath();
    },
    // Its point is 2 × 0.7 sizes down.
    reach: 1.4
  },
  cross: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.closePath();
    },
    stroked: true,
    width: 0.3
  },
  hexagon: {
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        if (i) ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
        else ctx.moveTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
      }
      ctx.closePath();
    }
  },
  flower: {
    path(ctx, x, y, size) {
      const inner = size * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI * 2 / 6;
        const next = (i + 1) * Math.PI * 2 / 6;
        const mid = (a + next) / 2;
        if (i) ctx.lineTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
        else ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
        ctx.quadraticCurveTo(x + Math.cos(mid) * size * 1.5, y + Math.sin(mid) * size * 1.5, x + Math.cos(next) * inner, y + Math.sin(next) * inner);
      }
      ctx.closePath();
      ctx.moveTo(x + inner, y);
      ctx.arc(x, y, inner, 0, Math.PI * 2);
    }
  },
  spiral: {
    // Three turns out from the centre: an open line, which filling would close into a blob.
    path(ctx, x, y, size) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const [r, a] = [size * t, t * 3 * Math.PI * 2];
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
    },
    stroked: true,
    width: 0.2
  },
  merkaba: {
    // v1's createMerkaba (old_link_animations.js:1493-1520), which it never drew: two triangles, a sixth of a turn apart.
    path(ctx, x, y, size, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      triangle(ctx, size, 0);
      triangle(ctx, size, Math.PI / SACRED.TRINITY);
      ctx.restore();
    },
    stroked: true,
    width: 0.15,
    turn: Math.PI / SACRED.TRINITY
  }
};
function mark(ctx, shape, x, y, size, angle, color, glow2, blur, offset = 0) {
  shape.path(ctx, x, y, size, angle);
  if (shape.stroked) {
    ctx.lineWidth = size * shape.width;
    ctx.lineCap = "round";
  }
  shine(ctx, shape, x, y, size, angle, color, glow2, blur, offset);
}
function drawMarkers(ctx, s, phase, flow) {
  const shape = MARKERS[L.markerShape];
  if (!L.markerEnabled || !shape) return;
  const size = 3 * L.markerSize;
  const count2 = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.markerSize * L.particleDensity * 0.5));
  const { pal } = s;
  for (let i = 0; i < count2; i++) {
    const T = flow === void 0 ? i / count2 : wrap(i / count2 + flow * 0.1);
    const u = s.local(T);
    if (!s.within(u)) continue;
    s.path.at(u, here);
    const angle = L.markerShape === "arrow" ? Math.atan2(here[3], here[2]) + (L.direction < 0 ? Math.PI : 0) : L.markerShape === "merkaba" ? phase : 0;
    let color = pal.marker;
    let alpha = 1;
    if (L.markerEffects === "pulse") alpha = 0.5 + Math.sin(phase + T * Math.PI * 2) * 0.5;
    else if (L.markerEffects === "fade") alpha = 1 - T;
    else if (L.markerEffects === "rainbow") color = rainbow(T * 360 + phase * 50);
    ctx.globalAlpha = alpha;
    if (L.markerShadowEnabled) mark(ctx, shape, here[0], here[1], size * 1.2, angle, SHADOW, SHADOW, shadowBlur(L.markerGlow), shadowOffset());
    mark(ctx, shape, here[0], here[1], size, angle, color, L.markerEffects === "rainbow" ? pal.primary : color, L.markerGlow);
  }
}
const ARROW = 2;
function centreMarker(canvas, ctx, s) {
  const shape = canvas.linkMarkerShape;
  if (!shape || canvas.ds.scale < 0.6 || !canvas.highquality_render) return;
  const { cx, cy, angle } = s.path;
  ctx.beginPath();
  if (shape === ARROW) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.moveTo(cx - 3.2 * cos + 5 * sin, cy - 3.2 * sin - 5 * cos);
    ctx.lineTo(cx + 7 * cos, cy + 7 * sin);
    ctx.lineTo(cx - 3.2 * cos - 5 * sin, cy - 3.2 * sin + 5 * cos);
  } else {
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  }
  ctx.fillStyle = s.pal.native;
  ctx.fill();
}
const LINKS = "Link animation";
const LOD_SCALE = 0.25;
const REACH = 120;
const CLASSIC = 9;
class Segment {
  path = new LinkPath();
  /** The link native drew the segment for. */
  link;
  /** Whether its path is not the one native drew for it, so the hit data must follow ours. */
  custom = false;
  /** The colours it is drawn in. */
  pal = HIGHLIGHT;
  linkStyle = "";
  isStatic = false;
  /**
   * px along the link to the segment's start, the segment's own length and the link's whole length, along the
   * segments native drew for it: the paths Link.Style takes, before a wave or a coil winds around them.
   */
  u0 = 0;
  len = 0;
  chain = 0;
  /** The fractions of the link where the segment starts and ends. */
  t0 = 0;
  t1 = 1;
  /** Whether the segment is a point on a longer link, where two reroutes, or a reroute and a slot, are on one spot: nothing of the link is on it. */
  get empty() {
    return this.t0 === this.t1;
  }
  get start() {
    return this.path.a;
  }
  get end() {
    return this.path.b;
  }
  /** The segment's own parameter, which its path takes for a point, at fraction T of the whole link: in [0, 1] where T falls on this segment. */
  local(T) {
    return (T - this.t0) / (this.t1 - this.t0);
  }
  /** Whether the segment draws what is at its own parameter u: what its start holds, up to its end, which only the link's last segment draws. */
  within(u) {
    return u >= 0 && (u < 1 || u === 1 && this.t1 === 1);
  }
}
const pool = [];
let count = 0;
let first = 0;
let open = false;
const ends = /* @__PURE__ */ new Map();
const shown = [];
const pass = { ctx: void 0, on: false, still: false, plain: false, calls: 0, bases: 0, highlighted: {} };
const BUSY = 12;
const SETTLE_MS = 150;
const glows = { bases: 0, due: false, scale: 0, x: 0, y: 0, timer: 0 };
function settle() {
  glows.due = true;
  app.canvas.setDirty(true, true);
}
let warned = false;
let foreign = false;
let told = false;
function defers() {
  if (L.coexist === "ours" || L.coexist === "auto" && !foreign) return false;
  if (L.coexist === "auto" && !told) {
    told = true;
    app.extensionManager.toast.add({
      severity: "info",
      summary: "Link effects left to another extension",
      detail: "Another extension draws links, so Enhanced link effects step aside. Node effects keep working. To keep Enhanced link effects, change Other link extensions in the settings.",
      life: 1e4
    });
  }
  return true;
}
const LINK_COLOR = "#9A9";
function enableAntiAliasing(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.miterLimit = 2;
}
function moves() {
  return L.animate !== CLASSIC || L.markerEnabled && L.markerShape !== "none" || Boolean(LINK_STYLES[L.linkStyle].moving);
}
function begin(canvas, ctx) {
  count = 0;
  open = false;
  ends.clear();
  pass.ctx = ctx;
  pass.calls = pass.bases = 0;
  pass.on = L.animate !== 0 && !defers() && !guard.off(LINKS) && canvas.ds.scale >= LOD_SCALE;
  pass.still = L.staticMode || L.pauseDuringRender && env.running || env.reducedMotion || !moves();
  pass.highlighted = canvas.highlighted_links;
  const { scale, offset } = canvas.ds;
  const moving = scale !== glows.scale || offset[0] !== glows.x || offset[1] !== glows.y || canvas.isDragging;
  [glows.scale, glows.x, glows.y] = [scale, offset[0], offset[1]];
  pass.plain = pass.on && !glows.due && glows.bases > BUSY && moving;
  glows.due = false;
  if (pass.plain) {
    clearTimeout(glows.timer);
    glows.timer = window.setTimeout(settle, SETTLE_MS);
  }
}
function end(canvas) {
  pass.ctx = void 0;
  if (open) close();
  if (!pass.plain) glows.bases = pass.bases;
  if (count && !pass.still) {
    live.links = count;
    wake();
  }
  if (pass.calls || warned) return;
  for (const segment of canvas.renderedPaths) {
    if (segment._dragging) continue;
    warned = true;
    console.warn("[Enhanced Links & Nodes] Another extension draws links without calling renderLink, so links are not animated.");
    return;
  }
}
function close() {
  const last = pool[count - 1];
  const chain = last.u0 + last.len;
  for (let i = first; i < count; i++) {
    const s = pool[i];
    s.chain = chain;
    s.t0 = s.len === chain ? 0 : s.u0 / chain;
    s.t1 = s.len === chain ? 1 : (s.u0 + s.len) / chain;
  }
  open = false;
}
function record(canvas, link, a, b, color, startDir, endDir, extras) {
  if (open && pool[count - 1].link !== link) close();
  if (!open) first = count;
  const segment = pool[count++] ??= new Segment();
  const reroute = extras?.reroute;
  const from = canvas.graph?.getReroute((reroute ?? link).parentId);
  const style = LINK_STYLES[L.linkStyle];
  const mode = style.mode ?? canvas.links_render_mode;
  segment.link = link;
  segment.u0 = from && ends.get(from) || 0;
  segment.path.set(a, b, startDir, endDir, mode, extras?.startControl, extras?.endControl);
  if (style.shape === "step") segment.path.step(endDir);
  segment.len = segment.path.length;
  if (style.shape === "wave" || style.shape === "coil") segment.path.bend(style.shape === "coil", segment.u0, !from, !reroute);
  segment.custom = Boolean(style.shape) || mode !== canvas.links_render_mode;
  if (reroute) ends.set(reroute, segment.u0 + segment.len);
  open = Boolean(reroute);
  if (!open) close();
  segment.pal = pass.highlighted[link.id] ? HIGHLIGHT : palette(color) ?? palette(LGraphCanvas.link_type_colors[String(link.type)]) ?? palette(canvas.default_link_color) ?? palette(LINK_COLOR);
  segment.linkStyle = L.linkStyle;
  segment.isStatic = pass.still;
  return segment;
}
const marked = () => L.animate === CLASSIC || L.markerAll;
function place(canvas, ctx, segment) {
  if (!pass.still && LINK_STYLES[segment.linkStyle].moving) return true;
  const whole = pass.still && !open;
  ctx.save();
  try {
    enableAntiAliasing(ctx);
    if (drawBase(ctx, segment, L.animate, pass.still, pass.plain)) pass.bases++;
    for (let i = first; whole && i < count; i++) {
      if (pool[i].empty) continue;
      STILL[L.animate]?.(ctx, pool[i], STILL_PHASE);
      if (marked()) drawMarkers(ctx, pool[i], STILL_PHASE);
    }
  } catch (error) {
    guard.fail(LINKS, error);
    return false;
  } finally {
    ctx.restore();
  }
  if (whole) {
    ctx.save();
    for (let i = first; i < count; i++) centreMarker(canvas, ctx, pool[i]);
    ctx.restore();
  }
  return true;
}
function hit(owner, path) {
  owner.path = path.hit();
  owner._pos[0] = path.cx;
  owner._pos[1] = path.cy;
  owner._centreAngle = path.angle;
}
function motion(canvas, ctx) {
  if (pass.still) return 0;
  const area = canvas.visible_area;
  let n = 0;
  for (let i = 0; i < count; i++) {
    const { box } = pool[i].path;
    if (box[2] + REACH >= area[0] && box[0] - REACH <= area[0] + area[2] && box[3] + REACH >= area[1] && box[1] - REACH <= area[1] + area[3]) shown[n++] = pool[i];
  }
  shown.length = n;
  if (!n) return 0;
  ctx.save();
  try {
    enableAntiAliasing(ctx);
    if (!STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
    if (LINK_STYLES[L.linkStyle].moving) for (const segment of shown) drawBase(ctx, segment, L.animate, false);
    const draw = MOVING[L.animate];
    for (const segment of shown) {
      if (segment.empty) continue;
      draw?.(ctx, segment, clock);
      if (marked()) drawMarkers(ctx, segment, clock.linkPhase, clock.linkFlow);
    }
  } catch (error) {
    guard.fail(LINKS, error);
    if (guard.off(LINKS)) canvas.setDirty(true, true);
  } finally {
    stopSprites();
    ctx.restore();
  }
  ctx.globalAlpha = canvas.editor_alpha;
  for (const segment of shown) centreMarker(canvas, ctx, segment);
  for (const reroute of canvas._visibleReroutes) {
    reroute.draw(ctx, canvas._pattern);
    if (!canvas.pointer.isDown) reroute.drawSlots(ctx);
  }
  return n;
}
function installLinks() {
  const proto = LGraphCanvas.prototype;
  const drawConnections = proto.drawConnections;
  const renderLink = proto.renderLink;
  foreign = !String(renderLink).includes("renderLinkDirect") || Boolean(globalThis.__LINKFX_V2_BOOTED__);
  warned = told = false;
  glows.bases = 0;
  proto.drawConnections = function(...args) {
    begin(this, args[0]);
    try {
      return drawConnections.apply(this, args);
    } finally {
      end(this);
    }
  };
  proto.renderLink = function(...args) {
    const [ctx, a, b, link, skipBorder, flow, color, startDir, endDir, extras] = args;
    pass.calls++;
    if (pass.on && ctx === pass.ctx && link && !(skipBorder && flow) && !extras?.disabled) {
      const segment = record(this, link, a, b, color, startDir, endDir, extras);
      if (place(this, ctx, segment)) {
        args[0] = dummy();
        renderLink.apply(this, args);
        if (segment.custom) hit(extras?.reroute ?? link, segment.path);
        return;
      }
    }
    return renderLink.apply(this, args);
  };
  layers.links = (canvas, ctx, over) => {
    if (over !== Boolean(canvas.graph?.config.links_ontop)) return;
    live.links = motion(canvas, ctx);
    if (live.links) wake();
  };
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
    "On Every Animation",
    "🔗 Enhanced Links.Marker.All",
    "Show the markers over every animation, not only Classic Flow"
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
    "Dark outline under Classic Flow links"
  ));
  body.appendChild(control(
    "Marker Shadows",
    "🔗 Enhanced Links.Marker.Shadow.Enabled",
    "Dark outline under markers"
  ));
  body.appendChild(control(
    "Shadow Style",
    "🔗 Enhanced Links.Shadow.Style",
    "Halo as in v1, or an offset drop shadow as in v2"
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
    "Fireworks over the output nodes when a run finishes"
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
const ext = {
  name: "enhanced.link.animations",
  settings: linkSettings,
  async setup() {
    install();
    initSidebar();
    installLinks();
    console.log("[EnhancedLinks] Extension registered with full batched rendering pipeline.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
