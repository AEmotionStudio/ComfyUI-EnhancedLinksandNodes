/**
 * Node backgrounds: an animated pattern on each node's body below its title bar, under its slots and widgets, drawn
 * by a fragment shader of our own on the GPU, in its own colours, the node effect's or custom ones, at
 * Background.Strength over the body's native fill. Classic nodes only: Nodes 2.0's DOM nodes paint their own bodies.
 *
 * Each pass, before any node is drawn, each node with a background that is on screen gets a slot of its own in one
 * atlas: as much of its body as is in view, at Background.Detail × the canvas's pixels, all of them shrunk alike while
 * they would not fit. The slots are drawn into one WebGL canvas, which becomes one bitmap that each node then draws its
 * slot from as native draws its body. The pattern keeps to the node, moving and scaling with it. While the backgrounds
 * hold still and the slots are as they were, the bitmap is kept.
 *
 * A browser without WebGL on a GPU draws none, which the panel says; a lost context or a shader that fails goes
 * through the guard, which turns the backgrounds off after repeated failures.
 *
 * @module nodes/shader
 */

import { BACKGROUND_OPTIONS, N, revision } from '@/core/settings';
import { PLAIN, THIN, adaptive, clock, guard, zoomedOut } from '@/core/engine';
import { nodePalette, rgb } from '@/core/colors';
import { effectOf, holdsStill } from '@/nodes/effects';
import { hash } from '@/fx/particles';

type Canvas = InstanceType<typeof LGraphCanvas>;
type Node = InstanceType<typeof LGraphNode>;

/** The guard's key, which its toast names when it turns the backgrounds off. */
export const BACKGROUND = 'Node background';

/** Where a node keeps the background its menu gave it. */
export const OWN_BACKGROUND = 'enhanced_fx_background';

const NAMES = new Set<unknown>(BACKGROUND_OPTIONS.map((option) => option.value));

/** The background a node was given, if it is one: a workflow may hold anything there. */
export function ownBackground(node: { properties: Record<string, unknown> }): string | undefined {
    const own = node.properties[OWN_BACKGROUND];
    return NAMES.has(own) ? (own as string) : undefined;
}

/** The background a node shows: its own, else Background. */
const backgroundOf = (node: { properties: Record<string, unknown> }): string => ownBackground(node) ?? N.background;

/** TitleMode.NO_TITLE: reroutes and label nodes, which have no body to speak of. */
const NO_TITLE = 1;

/** Whether a node shows a background, wherever it is: one not collapsed, with a title bar, given one or under Background. */
const backed = (node: Node): boolean => !node.flags.collapsed && node.title_mode !== NO_TITLE && backgroundOf(node) !== 'none';

/** The time still backgrounds show. */
const STILL_TIME = 7.3;

/** Background.Detail's share of the canvas's pixels, by its value. */
const DETAIL = [0, 0.35, 0.5, 1];

/** How far past the view a slot reaches, in canvas px, so a jelly node's wobble shows no edge. */
const MARGIN = 16;

/** The most of the atlas the slots may take before they shrink: shelves seldom pack it tighter. */
const PACKED = 0.8;

// =============================================================================
// The patterns
// =============================================================================

/**
 * What each pattern's fragment shader shares: the uniforms, where in the body it is, in graph units from its top left,
 * a pattern unit being 100 × Background.Scale of those, and value noise whose octaves fade out as they get finer than two
 * pixels, so nothing shimmers zoomed out or at Fast.
 */
const COMMON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_time;
uniform vec2 u_size;
uniform float u_scale;
uniform float u_px;
uniform float u_seed;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
varying vec2 v_at;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p, float px) {
    float v = 0.0;
    float a = 0.5;
    float f = 1.0;
    for (int i = 0; i < 4; i++) {
        v += a * mix(0.5, noise(p * f), clamp(1.0 - f * px * 2.0, 0.0, 1.0));
        f *= 2.0;
        a *= 0.5;
    }
    return v;
}
vec3 ramp(float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(u_c1, u_c2, t * 2.0) : mix(u_c2, u_c3, t * 2.0 - 1.0);
}
`;

interface Pattern {
    /** Its own colours: primary, secondary, accent. */
    colours: [string, string, string];
    /** The most times a second its brightness anywhere swings at Background.Speed 1: at 3 at most it stays within MAX_FLASH_HZ. */
    hz: number;
    /** Its main(), after COMMON, with P its place in pattern units and t its time. */
    main: string;
}

/** The patterns, by Background value. */
export const PATTERNS: Record<string, Pattern> = {
    plasma: {
        colours: ['#ff2bd6', '#7c4dff', '#00e5ff'],
        hz: 0.16,
        main: `
    vec2 p = P * 3.0;
    float v = sin(p.x + t) + sin(p.y * 1.3 - t * 0.8) + sin((p.x + p.y) * 0.7 + t * 0.6) + sin(length(p - vec2(1.5)) * 1.8 - t);
    gl_FragColor = vec4(ramp(0.5 + 0.22 * v) * (0.6 + 0.4 * cos(v)), 1.0);`,
    },
    aurora: {
        colours: ['#3dffa8', '#38c6ff', '#c77dff'],
        hz: 0.1,
        main: `
    float x = P.x * 1.6 + 1.2 * fbm(vec2(P.x * 0.8, t * 0.08), u_px * 0.8);
    float band = 0.5 + 0.5 * sin(x * 4.0 + t * 0.35);
    float hang = smoothstep(1.05, 0.0, v_at.y / u_size.y);
    float rays = mix(0.875, 0.75 + 0.25 * noise(vec2(P.x * 14.0, t * 0.1)), clamp(1.0 - 28.0 * u_px, 0.0, 1.0));
    vec3 light = mix(mix(u_c1, u_c2, band), u_c3, smoothstep(0.75, 1.0, band));
    gl_FragColor = vec4(u_c2 * 0.08 + light * band * band * hang * rays, 1.0);`,
    },
    starfield: {
        colours: ['#5a6bff', '#1b1f4a', '#ffffff'],
        hz: 0.48,
        main: `
    vec3 c = u_c2 * 0.5 + u_c1 * 0.6 * smoothstep(0.3, 0.8, fbm(P * 1.2 + vec2(t * 0.02, 0.0), u_px * 1.2));
    vec2 g = P * 5.0;
    vec2 id = floor(g);
    float h = hash(id + 3.1);
    if (h > 0.6) {
        vec2 off = vec2(hash(id + 1.7), hash(id + 9.2)) - 0.5;
        float d = length(fract(g) - 0.5 - off * 0.6);
        float r = max(0.08, u_px * 5.0);
        float star = smoothstep(r, 0.0, d) * (0.08 / r) * (0.08 / r) + 0.35 * smoothstep(4.0 * r, 0.0, d);
        float twinkle = 0.65 + 0.35 * sin(t * (1.0 + 2.0 * fract(h * 13.0)) + h * 40.0);
        c += mix(u_c3, vec3(1.0), 0.5) * star * twinkle;
    }
    gl_FragColor = vec4(c, 1.0);`,
    },
    liquid: {
        colours: ['#00c2ff', '#2a2f8f', '#9dfff5'],
        hz: 0.5,
        main: `
    vec2 p = P * 1.4;
    float px = u_px * 1.4;
    vec2 q = vec2(fbm(p + vec2(0.0, t * 0.03), px), fbm(p + vec2(5.2, 1.3) - t * 0.025, px));
    float v = fbm(p + 2.0 * q + t * 0.02, px);
    gl_FragColor = vec4(ramp(v * 1.3 - 0.1) * (0.35 + 0.65 * v), 1.0);`,
    },
    smoke: {
        colours: ['#3a3f4b', '#8a93a6', '#e6ecff'],
        hz: 0.6,
        main: `
    vec2 p = P * 2.0 + vec2(0.0, t * 0.15);
    float v = fbm(p + 0.6 * fbm(P * 3.0 - vec2(0.0, t * 0.1), u_px * 3.0), u_px * 2.0);
    gl_FragColor = vec4(ramp(v) * smoothstep(0.25, 0.85, v), 1.0);`,
    },
    grid: {
        colours: ['#ff2bd6', '#1a0b2e', '#ffb300'],
        hz: 0.8,
        main: `
    vec2 uv = v_at / u_size;
    float horizon = 0.35;
    vec3 c = mix(u_c2 * 0.6, u_c3 * 0.55, smoothstep(0.0, horizon, uv.y));
    if (uv.y > horizon) {
        float d = uv.y - horizon;
        float z = 0.3 / d;
        vec2 g = vec2((uv.x - 0.5) * (u_size.x / u_size.y) * z, z + t * 0.4) * 2.0 / u_scale;
        vec2 cell = abs(fract(g) - 0.5);
        float px = u_px * 100.0 * u_scale / u_size.y;
        float fz = 0.3 / (d * d) * px * 2.0 / u_scale;
        float fx = z * px * 2.0 / u_scale;
        float lines = max(smoothstep(0.04 + fx, 0.04, 0.5 - cell.x) * clamp(1.0 - fx * 3.0, 0.0, 1.0), smoothstep(0.04 + fz, 0.04, 0.5 - cell.y) * clamp(1.0 - fz * 3.0, 0.0, 1.0));
        c = u_c2 * 0.5 + u_c1 * lines + u_c3 * exp(-d * 18.0) * 0.6;
    }
    gl_FragColor = vec4(c, 1.0);`,
    },
    lava: {
        colours: ['#ff4d00', '#3a0a00', '#ffb300'],
        hz: 0.1,
        main: `
    vec2 uv = v_at / u_size;
    float aspect = u_size.x / u_size.y;
    float f = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float rise = fract(fi * 0.37 + u_seed * 0.013 + t * 0.04 * (1.0 + fi * 0.15));
        vec2 c = vec2(0.5 + 0.38 * sin(t * 0.25 * (1.0 + fi * 0.13) + fi * 2.1 + u_seed), 1.15 - rise * 1.3);
        float r = (0.1 + 0.05 * fract(fi * 0.61)) * sin(3.14159 * rise) * clamp(u_scale, 0.5, 2.0);
        vec2 d = (uv - c) * vec2(aspect, 1.0);
        f += r * r / max(dot(d, d), 0.0001);
    }
    float m = smoothstep(0.85, 1.15, f);
    float rim = smoothstep(0.6, 0.95, f) - m;
    gl_FragColor = vec4(mix(u_c2 * 0.6, ramp(0.35 + 0.4 * clamp(f - 1.0, 0.0, 1.0)), m) + u_c3 * rim * 0.5, 1.0);`,
    },
    caustics: {
        colours: ['#7fe9ff', '#06374a', '#ffffff'],
        hz: 0.8,
        main: `
    vec2 p = P * 2.5;
    float v = 0.0;
    for (int n = 0; n < 3; n++) {
        float a = float(n) * 2.094 + 0.4;
        vec2 dir = vec2(cos(a), sin(a));
        v += sin(dot(p, dir) * 3.0 + t * (0.5 + 0.15 * float(n)) + 0.8 * sin(dot(p, dir.yx) * 1.7 + t * 0.3));
    }
    float ridge = 1.0 - abs(v) / 3.0;
    float light = pow(ridge, mix(8.0, 2.0, clamp(u_px * 22.0, 0.0, 1.0)));
    gl_FragColor = vec4(u_c2 * 0.6 + u_c1 * light * 0.8 + u_c3 * pow(light, 3.0) * 0.4, 1.0);`,
    },
};

/** The vertex shader: a quad over the slot, carrying where in the body each corner is. */
const VERTEX = `
attribute vec2 a_corner;
uniform vec4 u_area;
varying vec2 v_at;
void main() {
    v_at = u_area.xy + vec2(a_corner.x, 1.0 - a_corner.y) * u_area.zw;
    gl_Position = vec4(a_corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

/** A pattern's fragment shader: COMMON, then its main(). */
const fragment = (pattern: Pattern) => `${COMMON}
void main() {
    vec2 P = v_at / (100.0 * u_scale) + vec2(u_seed);
    float t = u_time;
${pattern.main}
}
`;

// =============================================================================
// Planning the atlas
// =============================================================================

/** Where a slot sits in the atlas, from its top left, and how large it is, in its pixels; x is -1 for one that did not fit. */
export interface Placed {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Lays slots of `sizes` px out in shelves, tallest first, on an atlas `width` × `height`, after shrinking them all alike
 * by the share it returns where together they would take more than PACKED of it. What still does not fit is left out.
 */
export function pack(sizes: readonly { w: number; h: number }[], width: number, height: number, out: Placed[]): number {
    let total = 0;
    for (const { w, h } of sizes) total += w * h;
    const shrink = total > PACKED * width * height ? Math.sqrt((PACKED * width * height) / total) : 1;
    const order = sizes.map((_, i) => i).sort((a, b) => sizes[b].h - sizes[a].h);
    let [x, y, shelf] = [0, 0, 0];
    out.length = sizes.length;
    for (const i of order) {
        const w = Math.max(1, Math.ceil(sizes[i].w * shrink));
        const h = Math.max(1, Math.ceil(sizes[i].h * shrink));
        if (x + w > width) [x, y, shelf] = [0, y + shelf, 0];
        if (x + w > width || y + h > height) {
            out[i] = { x: -1, y: 0, w, h };
            continue;
        }
        out[i] = { x, y, w, h };
        x += w;
        shelf = Math.max(shelf, h);
    }
    return shrink;
}

// =============================================================================
// The GPU
// =============================================================================

interface Program {
    program: WebGLProgram;
    corner: number;
    area: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    size: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    px: WebGLUniformLocation | null;
    seed: WebGLUniformLocation | null;
    c1: WebGLUniformLocation | null;
    c2: WebGLUniformLocation | null;
    c3: WebGLUniformLocation | null;
}

/** A WebGL canvas the patterns are drawn on, and what it holds: its programs, by pattern, and the quad. */
interface Target {
    canvas: OffscreenCanvas;
    gl: WebGLRenderingContext;
    programs: Map<string, Program>;
    quad: WebGLBuffer;
}

/** WebGL on a GPU, kept small and plain: a pattern needs no depth, stencil, alpha or antialiasing. */
const ATTRIBUTES: WebGLContextAttributes = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true };

/** A new target, or undefined where the browser has no WebGL on a GPU. */
function target(): Target | undefined {
    if (typeof OffscreenCanvas !== 'function') return undefined;
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl', ATTRIBUTES);
    if (!gl) return undefined;
    const quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    return { canvas, gl, programs: new Map(), quad };
}

function compile(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader {
    const shader = gl.createShader(kind)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`Node background shader: ${gl.getShaderInfoLog(shader)}`);
    return shader;
}

/** The program for pattern `name`, compiled and linked on first use. */
function programOf(t: Target, name: string): Program {
    let p = t.programs.get(name);
    if (p) return p;
    const { gl } = t;
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment(PATTERNS[name])));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`Node background program: ${gl.getProgramInfoLog(program)}`);
    const at = (uniform: string) => gl.getUniformLocation(program, uniform);
    p = {
        program, corner: gl.getAttribLocation(program, 'a_corner'), area: at('u_area'), time: at('u_time'), size: at('u_size'), scale: at('u_scale'), px: at('u_px'),
        seed: at('u_seed'), c1: at('u_c1'), c2: at('u_c2'), c3: at('u_c3'),
    };
    t.programs.set(name, p);
    return p;
}

/** What a slot draws: pattern `name` over the part of a w × h body from (x0, y0) to (x1, y1), with `seed`, in colours, at `px` graph units an atlas pixel. */
interface Draw {
    name: string;
    w: number;
    h: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    seed: number;
    colours: [number, number, number][];
    px: number;
}

/** Draws each of `draws` into its place on `t`'s canvas, `height` px tall, at `time` s into its pattern. */
function render(t: Target, draws: readonly Draw[], places: readonly Placed[], height: number, time: number): void {
    const { gl } = t;
    const scale = N.backgroundScale;
    let current = '';
    let p: Program | undefined;
    gl.bindBuffer(gl.ARRAY_BUFFER, t.quad);
    for (let i = 0; i < draws.length; i++) {
        const d = draws[i];
        const at = places[i];
        if (at.x < 0) continue;
        if (d.name !== current) {
            current = d.name;
            p = programOf(t, d.name);
            gl.useProgram(p.program);
            gl.enableVertexAttribArray(p.corner);
            gl.vertexAttribPointer(p.corner, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1f(p.time, time);
            gl.uniform1f(p.scale, scale);
        }
        // WebGL counts rows up from the bottom.
        gl.viewport(at.x, height - at.y - at.h, at.w, at.h);
        gl.uniform4f(p!.area, d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
        gl.uniform2f(p!.size, d.w, d.h);
        gl.uniform1f(p!.px, d.px / (100 * scale));
        gl.uniform1f(p!.seed, d.seed);
        gl.uniform3fv(p!.c1, d.colours[0]);
        gl.uniform3fv(p!.c2, d.colours[1]);
        gl.uniform3fv(p!.c3, d.colours[2]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

// =============================================================================
// Each pass
// =============================================================================

/** The canvas's target, and whether making one failed, which it then never tries again. */
let main: Target | undefined;
let failed = false;

/** Whether node backgrounds can be drawn: WebGL on a GPU, which it tries for once. */
export function available(): boolean {
    if (!main && !failed) {
        main = target();
        failed = !main;
    }
    return !failed;
}

/** The time the patterns are drawn at: the clock's, or STILL_TIME while they hold still. Each pattern swings at most `hz` times a second at speed 1, so Background.Speed's 3 keeps them within MAX_FLASH_HZ. */
const timeOf = (time: number) => (holdsStill() ? STILL_TIME : time);

/** Each colour mode's colours for a node, by revision. */
const coloursSince = { revision: -1, custom: [] as [number, number, number][], own: new Map<string, [number, number, number][]>(), effect: new Map<number, [number, number, number][]>() };

/** The colours node `node` draws pattern `name` in, as Background.Color.Mode says. */
function coloursOf(node: Node, name: string): [number, number, number][] {
    if (coloursSince.revision !== revision) {
        coloursSince.revision = revision;
        coloursSince.custom = [N.backgroundColorPrimary, N.backgroundColorSecondary, N.backgroundColorAccent].map(rgb);
        coloursSince.own.clear();
        coloursSince.effect.clear();
    }
    if (N.backgroundColorMode === 'custom') return coloursSince.custom;
    const style = effectOf(node);
    if (N.backgroundColorMode === 'effect' && style > 0) {
        let colours = coloursSince.effect.get(style);
        if (!colours) {
            const { primary, secondary, accent } = nodePalette(style);
            coloursSince.effect.set(style, (colours = [primary, secondary, accent].map(rgb)));
        }
        return colours;
    }
    let colours = coloursSince.own.get(name);
    if (!colours) coloursSince.own.set(name, (colours = PATTERNS[name].colours.map(rgb)));
    return colours;
}

/** This pass's slots: what each draws, and where; the nodes they are for; and the bitmap they are on. */
const draws: Draw[] = [];
const places: Placed[] = [];
const sizes: { w: number; h: number }[] = [];
const placed = new Map<Node, number>();
let bitmap: ImageBitmap | undefined;
/** What the bitmap was drawn for, while the backgrounds hold still. */
let drawnFor = '';

/** Background.Detail, a notch lower for each of Perf.Adaptive's first two steps down. */
function detail(): number {
    const steps = adaptive.level >= THIN ? 2 : adaptive.level >= PLAIN ? 1 : 0;
    return DETAIL[Math.max(1, N.backgroundDetail - steps)];
}

/**
 * Readies this pass's backgrounds, before any node is drawn: a slot for each node that shows one and is on screen,
 * drawn into the atlas, and the atlas as a bitmap. Returns how many of them move.
 */
export function prepareBackgrounds(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    placed.clear();
    draws.length = sizes.length = 0;
    const { graph } = canvas;
    if (!graph || guard.off(BACKGROUND) || zoomedOut(canvas) || !N.enabled || LiteGraph.vueNodesMode) return 0;
    const share = detail();
    const [vx, vy, vw, vh] = canvas.visible_area;
    // Canvas px to a graph unit, read once a node needs it.
    let scale = 0;
    let margin = 0;
    const nodes: Node[] = [];
    for (const node of graph.nodes) {
        if (!backed(node)) continue;
        if (!scale) {
            scale = ctx.getTransform().a;
            margin = MARGIN / scale;
        }
        const [x, y] = node.pos;
        const [w, h] = node.size;
        const x0 = Math.max(x, vx - margin);
        const y0 = Math.max(y, vy - margin);
        const x1 = Math.min(x + w, vx + vw + margin);
        const y1 = Math.min(y + h, vy + vh + margin);
        if (x1 <= x0 || y1 <= y0) continue;
        const name = backgroundOf(node);
        nodes.push(node);
        draws.push({ name, w, h, x0: x0 - x, y0: y0 - y, x1: x1 - x, y1: y1 - y, seed: (hash(String(node.id)) >>> 0) % 640 / 10, colours: coloursOf(node, name), px: 0 });
        sizes.push({ w: (x1 - x0) * scale * share, h: (y1 - y0) * scale * share });
    }
    if (!nodes.length || !available()) return 0;
    try {
        if (main!.gl.isContextLost()) {
            main = undefined;
            failed = false;
            throw new Error('Node background: the WebGL context was lost');
        }
        const t = main!;
        const width = Math.max(1, Math.round(ctx.canvas.width * share));
        const height = Math.max(1, Math.round(ctx.canvas.height * share));
        if (t.canvas.width !== width || t.canvas.height !== height) [t.canvas.width, t.canvas.height] = [width, height];
        const shrink = pack(sizes, t.gl.drawingBufferWidth, t.gl.drawingBufferHeight, places);
        for (let i = 0; i < draws.length; i++) {
            draws[i].px = 1 / (scale * share * shrink);
            if (places[i].x >= 0) placed.set(nodes[i], i);
        }
        const held = holdsStill();
        const time = timeOf(clock.backgroundTime);
        const key = held ? `${revision} ${width} ${height} ${JSON.stringify(draws)} ${JSON.stringify(places)}` : '';
        if (!held || key !== drawnFor || !bitmap) {
            render(t, draws, places, t.gl.drawingBufferHeight, time);
            bitmap?.close();
            bitmap = t.canvas.transferToImageBitmap();
            drawnFor = key;
        }
    } catch (error) {
        placed.clear();
        guard.fail(BACKGROUND, error);
        return 0;
    }
    return holdsStill() || N.backgroundSpeed === 0 ? 0 : placed.size;
}

/** Whether a node has its background this pass. */
export const hasBackground = (node: Node): boolean => bitmap !== undefined && placed.has(node);

/**
 * Draws a node's background on its body, w × h below its title bar, at Background.Strength × `alpha`, as the context's
 * clip, the body's shape, allows; true if it had one this pass.
 */
export function drawBackground(ctx: CanvasRenderingContext2D, node: Node, w: number, h: number, alpha: number): boolean {
    const i = placed.get(node);
    if (i === undefined || !bitmap) return false;
    const d = draws[i];
    const at = places[i];
    ctx.save();
    try {
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = N.backgroundStrength * alpha;
        ctx.drawImage(bitmap, at.x, at.y, at.w, at.h, d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
    } finally {
        ctx.restore();
    }
    return true;
}
