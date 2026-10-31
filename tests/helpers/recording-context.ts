/**
 * Recording CanvasRenderingContext2D for characterization traces.
 *
 * Every method call and property set becomes one trace line, with numbers
 * rounded to 0.01 and alphas and gradient offsets to 0.001. Values are
 * validated the way browsers do: an invalid fillStyle/strokeStyle/shadowColor
 * (e.g. '' or an object) is logged as ignored and keeps the previous value,
 * non-finite path arguments are ignored, and addColorStop throws a SyntaxError
 * for an invalid colour. Colours are stored and logged in the browser's
 * serialized form (#rrggbb or rgba(r, g, b, a)). Colour syntax Chrome accepts
 * but this parser does not (oklch(), color-mix(), system colours...) throws.
 *
 * @module tests/helpers/recording-context
 */

type Rgba = [number, number, number, number];

/** Left, top, right and bottom on the canvas. */
type Box = [number, number, number, number];

interface Paint {
    op: string;
    style: string;
    globalAlpha: number;
    lineWidth: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    composite: string;
    /**
     * What a path or rectangle covers, before its line width and shadow: the box of its points under the
     * transform, with curves bounded by their control points and arcs by their square. None for text and images.
     */
    box?: Box;
}

// =============================================================================
// Numbers and colours
// =============================================================================

export function fmt(n: number, places = 2): string {
    if (!Number.isFinite(n)) return String(n);
    const scale = 10 ** places;
    const r = Math.round(n * scale) / scale;
    return String(r === 0 ? 0 : r);
}

/** Alphas and gradient offsets keep a third decimal, so a faint 0.0125 glow does not print as 0.01. */
const fmtAlpha = (n: number) => fmt(n, 3);

const NAMED_COLORS = new Map<string, number>();
{
    const pairs = (
        'aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc ' +
        'bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a ' +
        'burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 ' +
        'cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b ' +
        'darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b ' +
        'darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 ' +
        'darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f ' +
        'darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff ' +
        'dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 ' +
        'forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 ' +
        'gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 ' +
        'indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 ' +
        'lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff ' +
        'lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 ' +
        'lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 ' +
        'lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 ' +
        'linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd ' +
        'mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee ' +
        'mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 ' +
        'mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 ' +
        'olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa ' +
        'palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 ' +
        'peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 ' +
        'red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 ' +
        'seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd ' +
        'slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c ' +
        'teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 ' +
        'white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32'
    ).split(' ');
    for (let i = 0; i < pairs.length; i += 2) NAMED_COLORS.set(pairs[i], parseInt(pairs[i + 1], 16));
}

const NUMBER = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?';
const NUMBER_RE = new RegExp(`^${NUMBER}$`);
const PERCENT_RE = new RegExp(`^(${NUMBER})%$`);
const HUE_RE = new RegExp(`^(${NUMBER})(deg|rad|grad|turn)?$`);
const HUE_UNITS: Record<string, number> = { deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Valid in Chrome, but not parsed here: treating them as invalid would make a trace silently wrong.
const UNSUPPORTED_FUNCTION_RE = /^(?:oklch|oklab|lab|lch|hwb|color|color-mix|light-dark)\(|^(?:rgba?|hsla?)\(\s*from\s/;
const SYSTEM_COLORS = new Set((
    'accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext ' +
    'graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext activeborder ' +
    'activecaption appworkspace background buttonhighlight buttonshadow captiontext inactiveborder inactivecaption ' +
    'inactivecaptiontext infobackground infotext menu menutext scrollbar threeddarkshadow threedface threedhighlight ' +
    'threedlightshadow threedshadow window windowframe windowtext'
).split(' '));

/** Parse a CSS colour the way canvas does; null when the browser would reject it. */
export function parseColor(input: string): Rgba | null {
    const s = input.trim().toLowerCase();
    if (s === 'transparent') return [0, 0, 0, 0];
    // A canvas outside the document resolves currentColor to black.
    if (s === 'currentcolor') return [0, 0, 0, 1];
    const named = NAMED_COLORS.get(s);
    if (named !== undefined) return [named >> 16, (named >> 8) & 255, named & 255, 1];
    if (s.startsWith('#')) return parseHex(s.slice(1));
    if (UNSUPPORTED_FUNCTION_RE.test(s) || SYSTEM_COLORS.has(s)) {
        throw new Error(`recording-context: unsupported colour syntax ${JSON.stringify(input)}`);
    }
    const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(s);
    const args = fn && splitArgs(fn[2]);
    if (!fn || !args) return null;
    return fn[1].startsWith('rgb') ? parseRgb(args.parts, args.legacy) : parseHsl(args.parts, args.legacy);
}

function serializeColor([r, g, b, a]: Rgba): string {
    if (a === 1) return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
    return `rgba(${r}, ${g}, ${b}, ${fmtAlpha(a)})`;
}

function parseHex(hex: string): Rgba | null {
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map(c => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const byte = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return [byte(0), byte(2), byte(4), hex.length === 8 ? byte(6) / 255 : 1];
}

/** Legacy syntax is comma separated; modern syntax is space separated with an optional "/ alpha". */
function splitArgs(body: string): { parts: string[]; legacy: boolean } | null {
    if (body.includes(',')) {
        const parts = body.split(',').map(p => p.trim());
        const ok = (parts.length === 3 || parts.length === 4) && parts.every(p => /^\S+$/.test(p));
        return ok ? { parts, legacy: true } : null;
    }
    const [main, alpha, ...rest] = body.split('/');
    const parts = main.trim().split(/\s+/);
    if (rest.length || parts.length !== 3) return null;
    if (alpha !== undefined) {
        if (!/^\S+$/.test(alpha.trim())) return null;
        parts.push(alpha.trim());
    }
    return { parts, legacy: false };
}

function alphaOf(token: string | undefined, legacy: boolean): number | null {
    if (token === undefined) return 1;
    const pct = PERCENT_RE.exec(token);
    if (pct) return clamp(Number(pct[1]) / 100, 0, 1);
    if (NUMBER_RE.test(token)) return clamp(Number(token), 0, 1);
    return token === 'none' && !legacy ? 0 : null;
}

function parseRgb(parts: string[], legacy: boolean): Rgba | null {
    const channels: number[] = [];
    let percents = 0;
    for (const token of parts.slice(0, 3)) {
        const pct = PERCENT_RE.exec(token);
        if (pct) {
            channels.push((Number(pct[1]) / 100) * 255);
            percents++;
        } else if (NUMBER_RE.test(token)) channels.push(Number(token));
        else if (token === 'none' && !legacy) channels.push(0);
        else return null;
    }
    // The legacy comma syntax may not mix numbers and percentages.
    if (legacy && percents % 3 !== 0) return null;
    const alpha = alphaOf(parts[3], legacy);
    if (alpha === null) return null;
    const [r, g, b] = channels.map(c => Math.round(clamp(c, 0, 255)));
    return [r, g, b, alpha];
}

function parseHsl(parts: string[], legacy: boolean): Rgba | null {
    const hue = HUE_RE.exec(parts[0]);
    let h: number;
    if (hue) h = Number(hue[1]) * HUE_UNITS[hue[2] ?? 'deg'];
    else if (parts[0] === 'none' && !legacy) h = 0;
    else return null;
    const sl: number[] = [];
    for (const token of parts.slice(1, 3)) {
        const pct = PERCENT_RE.exec(token);
        if (pct) sl.push(Number(pct[1]));
        else if (!legacy && NUMBER_RE.test(token)) sl.push(Number(token));
        else if (!legacy && token === 'none') sl.push(0);
        else return null;
    }
    const alpha = alphaOf(parts[3], legacy);
    if (alpha === null) return null;
    const s = clamp(sl[0], 0, 100) / 100;
    const l = clamp(sl[1], 0, 100) / 100;
    h = ((h % 360) + 360) % 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    };
    return [f(0), f(8), f(4), alpha];
}

/** Runs `fn`; if it throws, the trace says so even when the code under test catches the error. */
function logThrow<T>(lines: string[], line: string, fn: () => T): T {
    try {
        return fn();
    } catch (error) {
        lines.push(`${line} threw ${(error as Error).message}`);
        throw error;
    }
}

/** How an argument or rejected value is shown in the trace. */
function show(value: unknown): string {
    if (typeof value === 'number') return fmt(value);
    if (typeof value === 'string') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(show).join(', ')}]`;
    if (value instanceof RecordingGradient || value instanceof RecordingPattern) return value.label;
    if (value && typeof value === 'object' && 'width' in value && 'height' in value) {
        return `image(${fmt(Number(value.width))}x${fmt(Number(value.height))})`;
    }
    return String(value);
}

// =============================================================================
// Gradient, pattern and Path2D stubs
// =============================================================================

class RecordingGradient {
    constructor(private readonly lines: string[], readonly label: string) {}

    addColorStop(offset: number, color: string): void {
        const n = Number(offset);
        const rgba = logThrow(this.lines, `${this.label}.addColorStop(${fmtAlpha(n)}, ${show(color)})`, () => parseColor(String(color)));
        const line = `${this.label}.addColorStop(${fmtAlpha(n)}, ${rgba ? serializeColor(rgba) : show(color)})`;
        let error: Error | undefined;
        if (!Number.isFinite(n)) error = new TypeError('The provided double value is non-finite.');
        else if (n < 0 || n > 1) error = new DOMException(`The provided value (${n}) is outside the range [0, 1].`, 'IndexSizeError');
        else if (!rgba) error = new DOMException(`The value provided ('${String(color)}') could not be parsed as a color.`, 'SyntaxError');
        if (error) {
            this.lines.push(`${line} threw ${error.name}`);
            throw error;
        }
        this.lines.push(line);
    }

    get [Symbol.toStringTag](): string {
        return 'CanvasGradient';
    }
}

class RecordingPattern {
    constructor(private readonly lines: string[], readonly label: string) {}

    setTransform(transform?: unknown): void {
        this.lines.push(`${this.label}.setTransform(${transform === undefined ? '' : show(transform)})`);
    }

    get [Symbol.toStringTag](): string {
        return 'CanvasPattern';
    }
}

class RecordingPath2D {
    static created = 0;
    readonly ops: string[] = [];

    constructor(init?: RecordingPath2D | string) {
        RecordingPath2D.created++;
        if (init instanceof RecordingPath2D) this.ops.push(...init.ops);
        else if (init !== undefined) this.ops.push(`svg(${JSON.stringify(String(init))})`);
    }

    addPath(path: RecordingPath2D): void { this.ops.push(...path.ops); }
    closePath(): void { this.op('closePath', []); }
    moveTo(...args: number[]): void { this.op('moveTo', args); }
    lineTo(...args: number[]): void { this.op('lineTo', args); }
    bezierCurveTo(...args: number[]): void { this.op('bezierCurveTo', args); }
    quadraticCurveTo(...args: number[]): void { this.op('quadraticCurveTo', args); }
    arc(...args: unknown[]): void { this.op('arc', args); }
    arcTo(...args: number[]): void { this.op('arcTo', args); }
    ellipse(...args: unknown[]): void { this.op('ellipse', args); }
    rect(...args: number[]): void { this.op('rect', args); }
    roundRect(...args: unknown[]): void { this.op('roundRect', args); }

    private op(name: string, args: unknown[]): void {
        this.ops.push(`${name}(${args.map(show).join(', ')})`);
    }

    get [Symbol.toStringTag](): string {
        return 'Path2D';
    }
}

// jsdom has no Path2D; install the stub so `new Path2D()` works and is counted.
Object.assign(globalThis, { Path2D: RecordingPath2D });

// =============================================================================
// Drawing state
// =============================================================================

const IGNORED = Symbol('ignored');
type Accept = (value: unknown) => unknown;

const finite = (ok: (n: number) => boolean): Accept => (value) => {
    const n = Number(value);
    return Number.isFinite(n) && ok(n) ? n : IGNORED;
};

const oneOf = (values: string): Accept => {
    const allowed = new Set(values.split(' '));
    return (value) => (allowed.has(String(value)) ? String(value) : IGNORED);
};

const color: Accept = (value) => {
    const rgba = parseColor(String(value));
    return rgba ? serializeColor(rgba) : IGNORED;
};

const paintStyle: Accept = (value) =>
    value instanceof RecordingGradient || value instanceof RecordingPattern ? value : color(value);

const FONT_RE = /(?:^|\s)(?:\d*\.?\d+(?:px|pt|pc|in|cm|mm|q|em|rem|ex|ch|vw|vh|%)|(?:xx?-|xxx-)?(?:small|large)|medium|larger|smaller)(?:\/\S+)?\s+\S/;
const LENGTH_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:px|em|rem|pt|pc|in|cm|mm|q|ex|ch|vw|vh)?$/;

const PROPS: Record<string, { init: unknown; accept: Accept }> = {
    fillStyle: { init: '#000000', accept: paintStyle },
    strokeStyle: { init: '#000000', accept: paintStyle },
    shadowColor: { init: 'rgba(0, 0, 0, 0)', accept: color },
    globalAlpha: { init: 1, accept: finite(n => n >= 0 && n <= 1) },
    lineWidth: { init: 1, accept: finite(n => n > 0) },
    miterLimit: { init: 10, accept: finite(n => n > 0) },
    lineDashOffset: { init: 0, accept: finite(() => true) },
    shadowBlur: { init: 0, accept: finite(n => n >= 0) },
    shadowOffsetX: { init: 0, accept: finite(() => true) },
    shadowOffsetY: { init: 0, accept: finite(() => true) },
    lineCap: { init: 'butt', accept: oneOf('butt round square') },
    lineJoin: { init: 'miter', accept: oneOf('round bevel miter') },
    globalCompositeOperation: {
        init: 'source-over',
        accept: oneOf(
            'source-over source-in source-out source-atop destination-over destination-in destination-out ' +
            'destination-atop lighter copy xor multiply screen overlay darken lighten color-dodge color-burn ' +
            'hard-light soft-light difference exclusion hue saturation color luminosity',
        ),
    },
    font: { init: '10px sans-serif', accept: (v) => (FONT_RE.test(String(v)) ? String(v) : IGNORED) },
    textAlign: { init: 'start', accept: oneOf('start end left right center') },
    textBaseline: { init: 'alphabetic', accept: oneOf('top hanging middle alphabetic ideographic bottom') },
    direction: { init: 'inherit', accept: oneOf('ltr rtl inherit') },
    imageSmoothingEnabled: { init: true, accept: (v) => Boolean(v) },
    imageSmoothingQuality: { init: 'low', accept: oneOf('low medium high') },
    filter: { init: 'none', accept: (v) => String(v) },
    letterSpacing: { init: '0px', accept: (v) => (LENGTH_RE.test(String(v)) ? String(v) : IGNORED) },
    wordSpacing: { init: '0px', accept: (v) => (LENGTH_RE.test(String(v)) ? String(v) : IGNORED) },
    fontKerning: { init: 'auto', accept: oneOf('auto normal none') },
    fontStretch: {
        init: 'normal',
        accept: oneOf('ultra-condensed extra-condensed condensed semi-condensed normal semi-expanded expanded extra-expanded ultra-expanded'),
    },
    fontVariantCaps: { init: 'normal', accept: oneOf('normal small-caps all-small-caps petite-caps all-petite-caps unicase titling-caps') },
    textRendering: { init: 'auto', accept: oneOf('auto optimizeSpeed optimizeLegibility geometricPrecision') },
};

const initialProps = () => Object.fromEntries(Object.entries(PROPS).map(([k, v]) => [k, v.init]));

const METHODS = (
    'save restore reset scale rotate translate transform setTransform resetTransform getTransform ' +
    'createLinearGradient createRadialGradient createConicGradient createPattern clearRect fillRect strokeRect ' +
    'beginPath fill stroke clip isPointInPath isPointInStroke drawFocusIfNeeded fillText strokeText measureText ' +
    'drawImage createImageData getImageData putImageData setLineDash getLineDash closePath moveTo lineTo ' +
    'quadraticCurveTo bezierCurveTo arcTo rect roundRect arc ellipse getContextAttributes isContextLost'
).split(' ');

// Methods whose arguments are `unrestricted double`: any non-finite number makes the call a no-op.
const SKIP_NON_FINITE = new Set(
    ('scale rotate translate transform setTransform clearRect fillRect strokeRect fillText strokeText ' +
        'drawImage moveTo lineTo quadraticCurveTo bezierCurveTo arcTo rect roundRect arc ellipse').split(' '),
);

const PAINTS = new Set('fill stroke fillRect strokeRect fillText strokeText drawImage'.split(' '));

function requireFinite(args: unknown[], count: number): void {
    for (let i = 0; i < count; i++) {
        if (!Number.isFinite(Number(args[i]))) throw new TypeError('The provided double value is non-finite.');
    }
}

// =============================================================================
// Recorder
// =============================================================================

export class CanvasRecorder {
    readonly ctx: CanvasRenderingContext2D;
    readonly lines: string[] = [];
    readonly paints: Paint[] = [];
    private props = initialProps();
    private lineDash: number[] = [];
    private matrix = [1, 0, 0, 1, 0, 0];
    private path: Box = [Infinity, Infinity, -Infinity, -Infinity];
    private covered?: Box;
    private stack: Array<{ props: Record<string, unknown>; lineDash: number[]; matrix: number[] }> = [];
    private emptyRestores = 0;
    private gradients = 0;
    private patterns = 0;
    private shadowBlurSets = 0;
    private readonly pathBase = RecordingPath2D.created;
    private readonly pathLabels = new Map<RecordingPath2D, { label: string; logged: number }>();
    private readonly methods = new Map<string, (...args: unknown[]) => unknown>();
    private readonly expandos = new Map<PropertyKey, unknown>();

    constructor(width = 1600, height = 900) {
        const canvas = { width, height };
        for (const name of METHODS) this.methods.set(name, (...args) => this.call(name, args));
        this.ctx = new Proxy({} as CanvasRenderingContext2D, {
            get: (_target, key) => {
                if (key === 'canvas') return canvas;
                if (typeof key === 'string' && Object.hasOwn(PROPS, key)) return this.props[key];
                if (typeof key === 'string' && this.methods.has(key)) return this.methods.get(key);
                if (key === Symbol.toStringTag) return 'CanvasRenderingContext2D';
                return this.expandos.get(key);
            },
            set: (_target, key, value) => {
                if (typeof key === 'string' && Object.hasOwn(PROPS, key)) this.setProp(key, value);
                else {
                    this.expandos.set(key, value);
                    this.lines.push(`${String(key)} = ${show(value)} [expando]`);
                }
                return true;
            },
            has: (_target, key) =>
                key === 'canvas' ||
                (typeof key === 'string' && (Object.hasOwn(PROPS, key) || this.methods.has(key))) ||
                this.expandos.has(key),
        });
    }

    get depth(): number {
        return this.stack.length;
    }

    /** Add a "# ..." comment line, e.g. a frame header. */
    note(text: string): void {
        this.lines.push(`# ${text}`);
    }

    trace(): string {
        return `${this.lines.join('\n')}\n`;
    }

    counts(): { gradients: number; patterns: number; shadowBlurSets: number; path2d: number } {
        return {
            gradients: this.gradients,
            patterns: this.patterns,
            shadowBlurSets: this.shadowBlurSets,
            path2d: RecordingPath2D.created - this.pathBase,
        };
    }

    assertBalanced(): void {
        if (this.depth !== 0 || this.emptyRestores !== 0) {
            throw new Error(`save/restore unbalanced: depth ${this.depth}, ${this.emptyRestores} restore() on an empty stack`);
        }
    }

    private setProp(key: string, value: unknown): void {
        if (key === 'shadowBlur') this.shadowBlurSets++;
        const accepted = logThrow(this.lines, `${key} = ${show(value)}`, () => PROPS[key].accept(value));
        if (accepted === IGNORED) {
            const shown = key === 'globalAlpha' && typeof value === 'number' ? fmtAlpha(value) : show(value);
            this.lines.push(`${key} = ${shown} [ignored, keeps ${this.bare(this.props[key], key)}]`);
            return;
        }
        this.props[key] = accepted;
        this.lines.push(`${key} = ${this.bare(accepted, key)}`);
    }

    /** Accepted state values print bare: `lineCap = round`, `strokeStyle = #ffb300`. */
    private bare(value: unknown, key?: string): string {
        if (key === 'globalAlpha') return fmtAlpha(value as number);
        return typeof value === 'string' ? value : show(value);
    }

    private arg(value: unknown): string {
        if (!(value instanceof RecordingPath2D)) return show(value);
        let entry = this.pathLabels.get(value);
        if (!entry) {
            entry = { label: `path${this.pathLabels.size + 1}`, logged: -1 };
            this.pathLabels.set(value, entry);
        }
        if (entry.logged !== value.ops.length) {
            this.lines.push(`${entry.label} = Path2D[${value.ops.join(' ')}]`);
            entry.logged = value.ops.length;
        }
        return entry.label;
    }

    private call(name: string, args: unknown[]): unknown {
        const head = `${name}(${args.map(a => this.arg(a)).join(', ')})`;
        if (SKIP_NON_FINITE.has(name) && args.some(a => typeof a === 'number' && !Number.isFinite(a))) {
            this.lines.push(`${head} [ignored]`);
            return undefined;
        }
        let result: unknown;
        try {
            result = this.run(name, args);
        } catch (error) {
            this.lines.push(`${head} threw ${(error as Error).name}`);
            throw error;
        }
        if (result === IGNORED) {
            this.lines.push(`${head} [ignored]`);
            return undefined;
        }
        const created = result instanceof RecordingGradient || result instanceof RecordingPattern ? result.label : '';
        this.lines.push(created ? `${created} = ${head}` : head);
        this.track(name, args.map(Number), args[0] instanceof RecordingPath2D);
        if (PAINTS.has(name)) this.paint(name);
        return result;
    }

    /** Keeps the current path's box, which save() and restore() leave alone as canvas does, and what the next paint covers. */
    private track(name: string, n: number[], ofPath2D: boolean): void {
        switch (name) {
            case 'beginPath':
                this.path = [Infinity, Infinity, -Infinity, -Infinity];
                return;
            case 'moveTo':
            case 'lineTo':
            case 'quadraticCurveTo':
            case 'bezierCurveTo':
                return this.cover(this.path, n);
            case 'arcTo':
                return this.cover(this.path, n.slice(0, 4));
            case 'arc':
            case 'ellipse': {
                const r = name === 'arc' ? n[2] : Math.max(n[2], n[3]);
                return this.cover(this.path, [n[0] - r, n[1] - r, n[0] + r, n[1] - r, n[0] - r, n[1] + r, n[0] + r, n[1] + r]);
            }
            case 'rect':
            case 'roundRect':
                return this.cover(this.path, corners(n));
            case 'fill':
            case 'stroke':
                this.covered = ofPath2D || this.path[0] > this.path[2] ? undefined : [...this.path];
                return;
            case 'fillRect':
            case 'strokeRect':
                this.covered = [Infinity, Infinity, -Infinity, -Infinity];
                return this.cover(this.covered, corners(n));
            case 'fillText':
            case 'strokeText':
            case 'drawImage':
                this.covered = undefined;
        }
    }

    /** Grows `box` by the points [x0, y0, x1, y1, ...] under the transform. */
    private cover(box: Box, xy: number[]): void {
        const [a, b, c, d, e, f] = this.matrix;
        for (let i = 0; i + 1 < xy.length; i += 2) {
            const [x, y] = [a * xy[i] + c * xy[i + 1] + e, b * xy[i] + d * xy[i + 1] + f];
            box[0] = Math.min(box[0], x);
            box[1] = Math.min(box[1], y);
            box[2] = Math.max(box[2], x);
            box[3] = Math.max(box[3], y);
        }
    }

    private run(name: string, args: unknown[]): unknown {
        const n = args.map(Number);
        switch (name) {
            case 'save':
                this.stack.push({ props: { ...this.props }, lineDash: [...this.lineDash], matrix: [...this.matrix] });
                return undefined;
            case 'restore': {
                const top = this.stack.pop();
                if (!top) {
                    this.emptyRestores++;
                    return IGNORED;
                }
                ({ props: this.props, lineDash: this.lineDash, matrix: this.matrix } = top);
                return undefined;
            }
            case 'reset':
                this.props = initialProps();
                this.lineDash = [];
                this.matrix = [1, 0, 0, 1, 0, 0];
                this.stack = [];
                return undefined;
            case 'createLinearGradient':
                requireFinite(args, 4);
                return new RecordingGradient(this.lines, `grad${++this.gradients}`);
            case 'createRadialGradient':
                requireFinite(args, 6);
                if (n[2] < 0 || n[5] < 0) throw new DOMException('The radius provided is negative.', 'IndexSizeError');
                return new RecordingGradient(this.lines, `grad${++this.gradients}`);
            case 'createConicGradient':
                requireFinite(args, 3);
                return new RecordingGradient(this.lines, `grad${++this.gradients}`);
            case 'createPattern': {
                const repetition = args[1] === null || args[1] === '' ? 'repeat' : String(args[1]);
                if (!['repeat', 'repeat-x', 'repeat-y', 'no-repeat'].includes(repetition)) {
                    throw new DOMException(`The provided type ('${repetition}') is not one of 'repeat', 'no-repeat', 'repeat-x', or 'repeat-y'.`, 'SyntaxError');
                }
                return new RecordingPattern(this.lines, `pattern${++this.patterns}`);
            }
            case 'arc':
                if (n[2] < 0) throw new DOMException(`The radius provided (${n[2]}) is negative.`, 'IndexSizeError');
                return undefined;
            case 'arcTo':
                if (n[4] < 0) throw new DOMException(`The radius provided (${n[4]}) is negative.`, 'IndexSizeError');
                return undefined;
            case 'ellipse':
                if (n[2] < 0 || n[3] < 0) throw new DOMException('The radius provided is negative.', 'IndexSizeError');
                return undefined;
            case 'roundRect': {
                const radii = ([] as unknown[]).concat(args[4] ?? 0).map(Number);
                if (radii.some(r => r < 0)) throw new RangeError('The radius provided is negative.');
                return undefined;
            }
            case 'setLineDash': {
                const segments = Array.from(args[0] as ArrayLike<unknown>, Number);
                if (segments.some(s => !Number.isFinite(s) || s < 0)) return IGNORED;
                this.lineDash = segments.length % 2 ? [...segments, ...segments] : segments;
                return undefined;
            }
            case 'getLineDash':
                return [...this.lineDash];
            case 'measureText':
                return this.measure(String(args[0]));
            case 'translate':
                return this.multiply([1, 0, 0, 1, n[0], n[1]]);
            case 'scale':
                return this.multiply([n[0], 0, 0, n[1], 0, 0]);
            case 'rotate':
                return this.multiply([Math.cos(n[0]), Math.sin(n[0]), -Math.sin(n[0]), Math.cos(n[0]), 0, 0]);
            case 'transform':
                return this.multiply(n.slice(0, 6));
            case 'setTransform': {
                const init = (args[0] ?? {}) as Record<string, number>;
                this.matrix = args.length >= 6
                    ? n.slice(0, 6)
                    : [init.a ?? init.m11 ?? 1, init.b ?? init.m12 ?? 0, init.c ?? init.m21 ?? 0, init.d ?? init.m22 ?? 1, init.e ?? init.m41 ?? 0, init.f ?? init.m42 ?? 0];
                return undefined;
            }
            case 'resetTransform':
                this.matrix = [1, 0, 0, 1, 0, 0];
                return undefined;
            case 'getTransform': {
                const [a, b, c, d, e, f] = this.matrix;
                return { a, b, c, d, e, f, m11: a, m12: b, m21: c, m22: d, m41: e, m42: f, is2D: true };
            }
            case 'isPointInPath':
            case 'isPointInStroke':
            case 'isContextLost':
                return false;
            case 'getImageData':
            case 'createImageData': {
                const [w, h] = name === 'getImageData' ? [n[2], n[3]] : [n[0], n[1]];
                return { width: w, height: h, data: new Uint8ClampedArray(Math.abs(w * h) * 4 || 0) };
            }
            case 'getContextAttributes':
                return { alpha: true, colorSpace: 'srgb', desynchronized: false, willReadFrequently: false };
            default:
                return undefined;
        }
    }

    private multiply([a2, b2, c2, d2, e2, f2]: number[]): undefined {
        const [a, b, c, d, e, f] = this.matrix;
        this.matrix = [
            a * a2 + c * b2, b * a2 + d * b2,
            a * c2 + c * d2, b * c2 + d * d2,
            a * e2 + c * f2 + e, b * e2 + d * f2 + f,
        ];
        return undefined;
    }

    /** Deterministic metrics: every character is half the font size wide. */
    private measure(text: string): TextMetrics {
        const size = Number(/(\d*\.?\d+)px/.exec(String(this.props.font))?.[1] ?? 10);
        const width = [...text].length * size * 0.5;
        return {
            width,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: width,
            actualBoundingBoxAscent: size * 0.75,
            actualBoundingBoxDescent: size * 0.25,
            fontBoundingBoxAscent: size * 0.8,
            fontBoundingBoxDescent: size * 0.2,
            emHeightAscent: size * 0.8,
            emHeightDescent: size * 0.2,
            alphabeticBaseline: 0,
            hangingBaseline: size * 0.6,
            ideographicBaseline: -size * 0.2,
        };
    }

    private paint(op: string): void {
        const p = this.props;
        this.paints.push({
            op,
            style: op === 'drawImage' ? 'image' : this.bare(op.startsWith('stroke') ? p.strokeStyle : p.fillStyle),
            globalAlpha: p.globalAlpha as number,
            lineWidth: p.lineWidth as number,
            shadowBlur: p.shadowBlur as number,
            shadowColor: p.shadowColor as string,
            shadowOffsetX: p.shadowOffsetX as number,
            shadowOffsetY: p.shadowOffsetY as number,
            composite: p.globalCompositeOperation as string,
            box: this.covered,
        });
    }
}

/** The corners of the rectangle x, y, w, h. */
const corners = ([x, y, w, h]: number[]) => [x, y, x + w, y, x, y + h, x + w, y + h];
