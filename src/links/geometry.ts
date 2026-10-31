/**
 * The path ComfyUI draws a link segment along, by the frontend's own rules
 * (litegraphLinkAdapter.ts and pathRenderer.ts, the same in 1.39.5 and
 * 1.57.1), so the effects follow Comfy.LinkRenderMode and reroutes. Points
 * come the way v2's renderers took theirs from v2's own paths: at the bezier
 * parameter t on a spline, and at the fraction t of the length along the
 * LINEAR and STRAIGHT polylines.
 *
 * @module links/geometry
 */

import type { LinkPoint, LinkRenderer } from '@/renderers/link-renderers';

/** LinkDirection (types/globalEnums.ts); CENTER and NONE move nothing. */
const UP = 1;
const DOWN = 2;
const LEFT = 3;
const RIGHT = 4;

/** LinkRenderType; any other mode draws a spline (litegraphLinkAdapter.ts convertRenderMode). */
const STRAIGHT_LINK = 0;
const LINEAR_LINK = 1;

const dx = (dir: number) => (dir === LEFT ? -1 : dir === RIGHT ? 1 : 0);
const dy = (dir: number) => (dir === UP ? -1 : dir === DOWN ? 1 : 0);

export class LinkPath implements Pick<LinkRenderer, 'getLength' | 'getPoint' | 'draw'> {
    /** The ends, which the effects hand back to ask for a point counted from either one. */
    readonly a: [number, number] = [0, 0];
    readonly b: [number, number] = [0, 0];
    /** A spline's start, controls and end, or the points of a polyline, as x, y pairs. */
    private readonly p = new Float64Array(12);
    /** How many points p holds: 4 for a spline and for LINEAR, 6 for STRAIGHT. */
    private n = 4;
    private spline = true;
    /** The length to each polyline point. */
    private readonly at = new Float64Array(6);
    private length = 0;
    /** Where native puts the segment's centre marker, and the angle of an arrow marker there. */
    cx = 0;
    cy = 0;
    angle = 0;
    /** The box around the points, which holds the whole path: left, top, right, bottom. */
    readonly box = new Float64Array(4);

    /** The segment renderLink was called for, with the arguments the native call got. */
    set(a: Readonly<LinkPoint>, b: Readonly<LinkPoint>, startDir: number, endDir: number, mode: number,
        startControl?: Readonly<LinkPoint>, endControl?: Readonly<LinkPoint>): void {
        const { p } = this;
        const ax = (this.a[0] = p[0] = a[0]);
        const ay = (this.a[1] = p[1] = a[1]);
        const bx = (this.b[0] = b[0]);
        const by = (this.b[1] = b[1]);
        // litegraphLinkAdapter.ts L218-219.
        const sd = startDir || RIGHT;
        const ed = endDir || LEFT;
        this.spline = mode !== LINEAR_LINK && mode !== STRAIGHT_LINK;
        if (this.spline) {
            // litegraphLinkAdapter.ts L241-295: a given control is an offset from its end, else a quarter of the length along the direction.
            const d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) * 0.25;
            p[2] = ax + (startControl ? startControl[0] || 0 : dx(sd) * d);
            p[3] = ay + (startControl ? startControl[1] || 0 : dy(sd) * d);
            p[4] = bx + (endControl ? endControl[0] || 0 : dx(ed) * d);
            p[5] = by + (endControl ? endControl[1] || 0 : dy(ed) * d);
            this.n = 4;
        } else {
            // pathRenderer.ts L231-344: stubs 15 px (LINEAR) or 10 px (STRAIGHT) out from the ends, joined straight or at right angles.
            const l = mode === LINEAR_LINK ? 15 : 10;
            const x1 = (p[2] = ax + dx(sd) * l);
            const y1 = (p[3] = ay + dy(sd) * l);
            const x2 = bx + dx(ed) * l;
            const y2 = by + dy(ed) * l;
            if (mode === STRAIGHT_LINK) {
                p[4] = p[6] = (x1 + x2) * 0.5;
                p[5] = y1;
                p[7] = y2;
                this.n = 6;
            } else {
                this.n = 4;
            }
            p[2 * this.n - 4] = x2;
            p[2 * this.n - 3] = y2;
        }
        p[2 * this.n - 2] = bx;
        p[2 * this.n - 1] = by;
        this.measure();
    }

    private measure(): void {
        const { p, n, at, box } = this;
        box[0] = box[2] = p[0];
        box[1] = box[3] = p[1];
        for (let i = 1; i < n; i++) {
            box[0] = Math.min(box[0], p[2 * i]);
            box[1] = Math.min(box[1], p[2 * i + 1]);
            box[2] = Math.max(box[2], p[2 * i]);
            box[3] = Math.max(box[3], p[2 * i + 1]);
        }
        // The centre (pathRenderer.ts calculateCenterPoint, L648-792).
        if (this.spline) {
            // Along 40 chords, as v2's spline measured itself.
            this.length = 0;
            let x = p[0];
            let y = p[1];
            for (let i = 1; i <= 40; i++) {
                const nx = this.bezier(i / 40, 0);
                const ny = this.bezier(i / 40, 1);
                this.length += Math.hypot(nx - x, ny - y);
                x = nx;
                y = ny;
            }
            this.cx = this.bezier(0.5, 0);
            this.cy = this.bezier(0.5, 1);
            this.angle = Math.atan2(this.bezier(0.51, 1) - this.cy, this.bezier(0.51, 0) - this.cx);
            return;
        }
        at[0] = 0;
        for (let i = 1; i < n; i++) at[i] = at[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
        this.length = at[n - 1];
        // The middle between the stubs' inner ends.
        const x1 = p[2];
        const y1 = p[3];
        const x2 = p[2 * n - 4];
        const y2 = p[2 * n - 3];
        this.cx = (x1 + x2) * 0.5;
        this.cy = (y1 + y2) * 0.5;
        if (n === 4) this.angle = Math.atan2(y2 - y1, x2 - x1);
        else this.angle = Math.abs(y2 - y1) < 4 ? 0 : (Math.sign(y2 - y1) * Math.PI) / 2;
    }

    /** x (axis 0) or y (axis 1) of the spline at t. */
    private bezier(t: number, axis: number): number {
        const { p } = this;
        const mt = 1 - t;
        return mt * mt * mt * p[axis] + 3 * mt * mt * t * p[2 + axis] + 3 * mt * t * t * p[4 + axis] + t * t * t * p[6 + axis];
    }

    getLength(): number {
        return this.length;
    }

    /** The point at t counted from `from`: the start, or the end, from which Cosmic Weave, DNA Helix and Stellar Plasma count. */
    getPoint(from: LinkPoint, _to: LinkPoint, t: number): [number, number] {
        const u = from === this.b ? 1 - t : t;
        if (this.spline) return [this.bezier(u, 0), this.bezier(u, 1)];
        const { p, at } = this;
        const target = Math.min(this.length, Math.max(0, u * this.length));
        let i = 1;
        while (i < this.n - 1 && at[i] < target) i++;
        const span = at[i] - at[i - 1];
        const f = span ? (target - at[i - 1]) / span : 0;
        return [p[2 * i - 2] + (p[2 * i] - p[2 * i - 2]) * f, p[2 * i - 1] + (p[2 * i + 1] - p[2 * i - 1]) * f];
    }

    /** Strokes the path the way v2's spline stroked its own. */
    draw(ctx: CanvasRenderingContext2D, _start: LinkPoint, _end: LinkPoint, color: string, thickness: number): void {
        const { p } = this;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        if (this.spline) ctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
        else for (let i = 1; i < this.n; i++) ctx.lineTo(p[2 * i], p[2 * i + 1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    }
}
