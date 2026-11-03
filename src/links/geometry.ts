/**
 * The path a link segment is drawn along. By default it is the path ComfyUI
 * draws, by the frontend's own rules (litegraphLinkAdapter.ts and
 * pathRenderer.ts, the same in 1.39.5 and 1.57.1), so effects follow
 * Comfy.LinkRenderMode and reroutes. Link.Style can ask for another of those
 * rules, or for a shape of our own: steps with rounded corners, or a wave or a
 * coil along the native path; a physics wire (links/physics.ts) makes it the
 * polyline the wire hangs as. at() finds points the way v1's renderers took
 * theirs: at the bezier parameter on a spline and at the fraction of the
 * length along a polyline. find() finds them by length instead, for what is
 * spaced in pixels.
 *
 * @module links/geometry
 */

/** LinkDirection (types/globalEnums.ts); CENTER and NONE move nothing. */
const UP = 1;
const DOWN = 2;
const LEFT = 3;
const RIGHT = 4;

/** LinkRenderType; any other mode draws a spline (litegraphLinkAdapter.ts convertRenderMode). */
export const STRAIGHT_LINK = 0;
export const LINEAR_LINK = 1;

/** A spline is measured along this many chords, as v1 measured its own (old_link_animations.js:408-424). */
const CHORDS = 40;

/** The stepped path's stub into the input, and the radius of its corners at most. */
const STUB = 10;
const CORNER = 8;
/** The wave (stored as zigzag) swings 10 px to each side every 60 px, so a 300 px link gets v1's 5 periods. */
const WAVE = 10;
const WAVELENGTH = 60;
/** The coil's loops are 6 px across and one every 12 px; it runs back along the path by 0.6 of that, which makes the loops. */
const COIL = 6;
const PITCH = 12;
/** Both grow from nothing over this length from a slot, so they leave and enter slots along the native path. */
const TAPER = 15;
/** Points a wave or coil is drawn through at most: one every 1 px of a 2048 px coil. */
const MOST_POINTS = 2049;

const dx = (dir: number) => (dir === LEFT ? -1 : dir === RIGHT ? 1 : 0);
const dy = (dir: number) => (dir === UP ? -1 : dir === DOWN ? 1 : 0);
const smooth = (x: number) => (x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x));

/** Adds a line `length` px out from `point` along slot direction `dir` to a path. */
export function stub(path: CanvasPath, point: Readonly<ArrayLike<number>>, dir: number, length: number): void {
    path.moveTo(point[0], point[1]);
    path.lineTo(point[0] + dx(dir) * length, point[1] + dy(dir) * length);
}

/** Where the base path of a wave or coil is sampled before the samples become the path. */
let samples = new Float64Array(64);
/** The point and direction find() writes while a shape is built. */
const here = new Float64Array(4);

export class LinkPath {
    /** The ends, which the effects hand back to ask for a point counted from either one. */
    readonly a: [number, number] = [0, 0];
    readonly b: [number, number] = [0, 0];
    /** A spline's start, controls and end, or the points of a polyline, as x, y pairs. */
    private p = new Float64Array(12);
    /** How many points p holds: 4 for a spline. */
    private n = 4;
    private spline = true;
    /** A spline's x and y as a·t³ + b·t² + c·t + start, as v1 computed its own (old_link_animations.js:455-475). */
    private readonly k = new Float64Array(6);
    /** The length to each polyline point, or to each of a spline's CHORDS + 1 samples. */
    private cum = new Float64Array(CHORDS + 1);
    /** A coil's points, as x, y pairs, and how many: it is drawn and hit through them, and effects keep to the path inside. */
    private loops = new Float64Array(0);
    private looped = 0;
    length = 0;
    /** Where the segment's centre marker goes, and the angle of an arrow marker there. */
    cx = 0;
    cy = 0;
    angle = 0;
    /** The box around the points, which holds the whole path: left, top, right, bottom. */
    readonly box = new Float64Array(4);

    /** The path native draws for a renderLink call in render mode `mode`, from the arguments the call got. */
    set(a: Readonly<ArrayLike<number>>, b: Readonly<ArrayLike<number>>, startDir: number, endDir: number, mode: number,
        startControl?: Readonly<ArrayLike<number>>, endControl?: Readonly<ArrayLike<number>>): void {
        const ax = (this.a[0] = a[0]);
        const ay = (this.a[1] = a[1]);
        const bx = (this.b[0] = b[0]);
        const by = (this.b[1] = b[1]);
        this.looped = 0;
        // litegraphLinkAdapter.ts L218-219.
        const sd = startDir || RIGHT;
        const ed = endDir || LEFT;
        this.spline = mode !== LINEAR_LINK && mode !== STRAIGHT_LINK;
        if (this.spline) {
            // litegraphLinkAdapter.ts L241-295: a given control is an offset from its end, else a quarter of the length along the direction.
            const d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) * 0.25;
            this.points(4);
            this.point(0, ax, ay);
            this.point(1, ax + (startControl ? startControl[0] || 0 : dx(sd) * d), ay + (startControl ? startControl[1] || 0 : dy(sd) * d));
            this.point(2, bx + (endControl ? endControl[0] || 0 : dx(ed) * d), by + (endControl ? endControl[1] || 0 : dy(ed) * d));
            this.point(3, bx, by);
            this.measureSpline();
            return;
        }
        // pathRenderer.ts L231-344: stubs 15 px (LINEAR) or 10 px (STRAIGHT) out from the ends, joined straight or at right angles.
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
        // The middle between the stubs' inner ends (pathRenderer.ts calculateCenterPoint, L683-781).
        this.cx = (x1 + x2) * 0.5;
        this.cy = (y1 + y2) * 0.5;
        this.angle = straight ? (Math.abs(y2 - y1) < 4 ? 0 : (Math.sign(y2 - y1) * Math.PI) / 2) : Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Turns the path set() gave into steps between the same ends: across at the start's height, then down or up,
     * then a stub into the end along its direction, with the corners rounded.
     */
    step(endDir: number): void {
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
    bend(coil: boolean, u0: number, fromSlot: boolean, toSlot: boolean): void {
        const len = this.length;
        if (!len) return;
        const count = Math.min(MOST_POINTS, Math.ceil(len / (coil ? PITCH / 12 : WAVELENGTH / 16)) + 1);
        if (samples.length < 2 * count + 2) samples = new Float64Array(4 * count + 2);
        const offset = (d: number, i: number) => {
            this.find(d, here);
            const fade = (fromSlot ? smooth(d / TAPER) : 1) * (toSlot ? smooth((len - d) / TAPER) : 1);
            const turn = (2 * Math.PI * (u0 + d)) / (coil ? PITCH : WAVELENGTH);
            const across = (coil ? COIL : WAVE) * Math.sin(turn) * fade;
            const along = coil ? 0.6 * COIL * Math.cos(turn) * fade : 0;
            samples[i] = here[0] + here[2] * along - here[3] * across;
            samples[i + 1] = here[1] + here[3] * along + here[2] * across;
        };
        for (let i = 0; i < count; i++) offset((len * i) / (count - 1), 2 * i);
        // The centre marker sits on the shape halfway along the path, pointing the way the path runs there.
        offset(len / 2, 2 * count);
        const [cx, cy] = [samples[2 * count], samples[2 * count + 1]];
        const angle = Math.atan2(here[3], here[2]);
        if (coil) {
            if (this.loops.length < 2 * count) this.loops = new Float64Array(4 * count);
            this.loops.set(samples.subarray(0, 2 * count));
            this.looped = count;
            this.bound(this.loops, count);
        } else {
            this.spline = false;
            this.n = 0;
            for (let i = 0; i < count; i++) this.add(samples[2 * i], samples[2 * i + 1]);
            this.measurePolyline();
        }
        [this.cx, this.cy, this.angle] = [cx, cy, angle];
    }

    /** Turns the path into the polyline through the first `count` points of `points`, as x, y pairs: a physics wire's. */
    follow(points: Float64Array, count: number): void {
        this.spline = false;
        this.n = 0;
        for (let i = 0; i < count; i++) this.add(points[2 * i], points[2 * i + 1]);
        this.measurePolyline();
        this.centre();
    }

    /**
     * Writes the point at u, from 0 at the start to 1 at the end: the bezier parameter on a spline, the fraction of
     * the length on a polyline. Then the path's direction there, as a unit tangent: x, y, tx, ty.
     */
    at(u: number, out: Float64Array): void {
        if (!this.spline) {
            this.find(u * this.length, out);
            return;
        }
        out[0] = this.bezier(u, 0);
        out[1] = this.bezier(u, 1);
        let tx = this.slope(u, 0);
        let ty = this.slope(u, 1);
        // A control on its end leaves no slope there; the chord's direction stands in.
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
    find(d: number, out: Float64Array): void {
        const { p, cum } = this;
        const target = Math.min(this.length, Math.max(0, d));
        const i = this.seek(target);
        const span = cum[i + 1] - cum[i];
        const f = span ? (target - cum[i]) / span : 0;
        let tx: number;
        let ty: number;
        if (this.spline) {
            const t = (i + f) / CHORDS;
            out[0] = this.bezier(t, 0);
            out[1] = this.bezier(t, 1);
            tx = this.slope(t, 0);
            ty = this.slope(t, 1);
            // A control on its end leaves no slope there; the chord's direction stands in.
            if (Math.abs(tx) + Math.abs(ty) < 1e-9) {
                tx = this.bezier((i + 1) / CHORDS, 0) - this.bezier(i / CHORDS, 0);
                ty = this.bezier((i + 1) / CHORDS, 1) - this.bezier(i / CHORDS, 1);
            }
        } else {
            out[0] = p[2 * i] + (p[2 * i + 2] - p[2 * i]) * f;
            out[1] = p[2 * i + 1] + (p[2 * i + 3] - p[2 * i + 1]) * f;
            // A stub of no length (into a CENTER end) points nowhere; the leg before it, or after it, does.
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
    trace(path: CanvasPath): void {
        const [p, n] = this.looped ? [this.loops, this.looped] : [this.p, this.n];
        path.moveTo(p[0], p[1]);
        if (this.spline && !this.looped) path.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
        else for (let i = 1; i < n; i++) path.lineTo(p[2 * i], p[2 * i + 1]);
    }

    /** Strokes the path the way v1's renderers stroked theirs: 0.8 × `thickness` wide. */
    draw(ctx: CanvasRenderingContext2D, color: string, thickness: number): void {
        ctx.beginPath();
        this.trace(ctx);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    }

    /** The path as native keeps it for hit testing. */
    hit(): Path2D {
        const path = new Path2D();
        this.trace(path);
        return path;
    }

    /** Makes room for `count` points. */
    private points(count: number): void {
        if (this.p.length < 2 * count) this.p = new Float64Array(4 * count);
        this.n = count;
    }

    private point(i: number, x: number, y: number): void {
        this.p[2 * i] = x;
        this.p[2 * i + 1] = y;
    }

    /** Appends a polyline point, unless it is where the last one is. */
    private add(x: number, y: number): void {
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
    private corner(x: number, y: number, px: number, py: number, qx: number, qy: number, r: number): void {
        const [ux, uy] = [Math.sign(x - px), Math.sign(y - py)];
        const [vx, vy] = [Math.sign(qx - x), Math.sign(qy - y)];
        if (r <= 0 || ux * vx + uy * vy !== 0 || !(ux || uy) || !(vx || vy)) {
            this.add(x, y);
            return;
        }
        // A quarter circle from r before the corner to r past it.
        for (let i = 0; i <= 4; i++) {
            const angle = (i * Math.PI) / 8;
            const back = r * (1 - Math.sin(angle));
            const on = r * (1 - Math.cos(angle));
            this.add(x - ux * back + vx * on, y - uy * back + vy * on);
        }
    }

    /** The spline's polynomial, its length along CHORDS chords and its box; the centre where native puts it (pathRenderer.ts L654-682). */
    private measureSpline(): void {
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

    private measurePolyline(): void {
        // A segment that ends where it starts still has two ends.
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
    private centre(): void {
        this.find(this.length / 2, here);
        [this.cx, this.cy, this.angle] = [here[0], here[1], Math.atan2(here[3], here[2])];
    }

    private bound(p = this.p, n = this.n): void {
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
    private seek(d: number): number {
        let lo = 0;
        let hi = (this.spline ? CHORDS : this.n - 1) - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this.cum[mid] <= d) lo = mid;
            else hi = mid - 1;
        }
        return Math.max(0, lo);
    }

    /** x (axis 0) or y (axis 1) of the spline at t. */
    private bezier(t: number, axis: number): number {
        const { k } = this;
        return k[3 * axis] * t ** 3 + k[3 * axis + 1] * t ** 2 + k[3 * axis + 2] * t + this.p[axis];
    }

    private slope(t: number, axis: number): number {
        const { k } = this;
        return 3 * k[3 * axis] * t * t + 2 * k[3 * axis + 1] * t + k[3 * axis + 2];
    }
}
