/**
 * What both extensions animate by: one clock that only the ticker moves; one
 * requestAnimationFrame ticker that asks app.canvas for front paints while
 * anything animated is on screen, and background paints too while physics
 * wires swing, and stops otherwise; the onRender and
 * onDrawForeground hooks, chained with whatever else uses them, which draw the
 * extensions' layers in each front pass, those over the nodes on a canvas
 * above them in Nodes 2.0, whose nodes are DOM elements over the main canvas;
 * and a guard that turns off what keeps failing.
 *
 * @module core/engine
 */

import { app } from '/scripts/app.js';
import { L, N, revision, watch } from '@/core/settings';

type Canvas = typeof app.canvas;

/** v1's node phase rate at speed 1 (AnimationController.transitionSpeed, old_node_animations.js:71-127): a turn every 15 s. */
export const TURN = (2 * Math.PI) / 15;
/** v1's link phase turned PHI² radians a second at speed 1 (old_link_animations.js:260-285), a turn every 2.40 s. */
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
/** A Direction change turns links and nodes around over this many seconds. */
const TURNAROUND = 0.3;
/** WCAG 2.3.1: what flashes does so at most three times a second. */
export const MAX_FLASH_HZ = 3;
/** Quantum Field's five filaments each sweep round their link once a turn of its phase. */
const QUANTUM_SWEEPS = 5;
/** rAF timestamps jitter around the display's interval, so a frame this much early still counts. */
const JITTER_MS = 1;
const GUARD_MS = 10_000;
/** Failures of one key within GUARD_MS that turn it off. */
const FAILURES = 5;
/** How fast, how opaque and how often at most a Calm run lets the effects move and draw. */
const CALM = 0.25;
export const CALM_ALPHA = 0.5;
const CALM_FPS = 20;

/**
 * The animation clock. The links run on v1's (old_link_animations.js:260-303, 2457-2459, 3186-3190): their phase
 * falls by PHI² × speed radians a second going Forward, and their flow grows by 2 × speed² a second, signed by the
 * direction, as v1 added speed × the frame's time to its own time twice a frame and its renderers took that times the
 * speed again. linkDir is the way they run, which turns around over TURNAROUND when Direction changes; nothing wraps.
 * quantumPhase is the link phase for Quantum Field: it turns as fast, but never so fast that its filaments sweep round
 * more than MAX_FLASH_HZ times a second, which binds above speed 1.44. The nodes run on v1's 60 Hz rates
 * (old_node_animations.js:71-127, 2945-2957), whatever the frame rate: their phase turns TURN × speed radians a second,
 * their particles' time runs Particle.Speed seconds a second and nodeTime one, and nodeDir turns them around as linkDir
 * does the links. A Calm run moves both at a quarter of their pace. burstTime runs a second a second while a burst
 * plays, from 0 as its show starts, markTime while a node is marked, from 0 as its mark starts, runTime while a
 * run's visuals move, and assistTime while connection assist draws. Only the ticker moves the clock, never a draw, so
 * a canvas drawn again within a frame (as MagnifyGlass does) shows the same moment.
 */
export const clock = { linkPhase: 0, linkFlow: 0, linkDir: 1, quantumPhase: 0, nodePhase: 0, particleTime: 0, nodeTime: 0, nodeDir: 1, burstTime: 0, markTime: 0, runTime: 0, assistTime: 0 };

/** The pose of still links: the first frame v1 drew in Static mode (old_link_animations.js:2440-2456). */
export const STILL_PHASE = (9 * Math.PI) / 4;

/** Whether this client's run is active (fx/execution.ts), and whether effects show still for less motion, as Motion says. */
export const env = { running: false, reducedMotion: false };

/**
 * Perf.Adaptive's steps down from full quality: link glows go plain, then the link and node particles thin out too,
 * then the effects are held still too. adaptive.level is the step taken, and onStep is told of each: the open panel.
 */
export const PLAIN = 1;
export const THIN = 2;
export const HELD = 3;
export const adaptive = { level: 0, onStep: undefined as (() => void) | undefined };

/**
 * Paints are too slow once every one for a second, three at least, took over SLOW times the cap's interval, or the
 * display's where it gives frames less often: a page busy elsewhere for a while makes one long gap rather than slow
 * frames. They have room in a second when they took at most ROOMY times it on average.
 */
const SLOW = 1.5;
const ROOMY = 1.2;
const SECOND = 1000;
/**
 * The frames left unpainted before each step down, to see how soon frames come with nothing of ours to draw: what the
 * display gives, as at 30 Hz or in a browser saving power, where no step down makes paints come sooner. The first may
 * still wait on the paint before it.
 */
const PROBE = 4;
/** How long paints must have room before a step back up; a step up they cannot keep doubles it, up to LONGEST_MS, until one they keep. */
const ROOM_MS = 5000;
const LONGEST_MS = 60_000;

/**
 * When the slow paints began and how many there have been since; the second being judged for room, when it began and
 * its paints, and how long paints have had room; when quality last came back up a step, how long the next step back up
 * waits, the settings revision judged for, and the timer that brings quality back up from HELD, where nothing paints.
 * Where the view was at the last paint: paints while it pans or zooms, or nodes are dragged, cost what the frontend's
 * own drawing costs then, so they are not judged. The display's interval as last seen; and while the frames left
 * unpainted come, how many are to come, the shortest gap between them so far and the slow paints' average gap.
 */
const judged = {
    slow: 0, slowPaints: 0, start: 0, paints: 0, room: 0, raised: -Infinity, wait: ROOM_MS, revision: 0, timer: 0, scale: 0, x: 0, y: 0,
    display: 0, probe: 0, shortest: 0, gap: 0,
};

/** Takes a step: down from full quality for `by` 1, back up for -1. A step down within 2 s of a step up doubles the wait for the next. */
function step(by: number, now: number): void {
    if (by > 0) judged.wait = now - judged.raised <= 2 * SECOND ? Math.min(2 * judged.wait, LONGEST_MS) : ROOM_MS;
    if (by < 0) judged.raised = now;
    adaptive.level += by;
    judged.room = judged.start = 0;
    clearTimeout(judged.timer);
    if (adaptive.level === HELD) judged.timer = window.setTimeout(() => step(-1, performance.now()), judged.wait);
    need();
    adaptive.onStep?.();
}

/** Forgets the paints judged so far and the frames still to be left unpainted, as the ticker stops. */
function rest(): void {
    judged.slow = judged.slowPaints = judged.start = judged.probe = judged.gap = 0;
}

/** Full quality again, judged afresh: for a setting that changed, which repaints both canvases itself. */
function relax(): void {
    rest();
    judged.room = 0;
    judged.wait = ROOM_MS;
    judged.revision = revision;
    clearTimeout(judged.timer);
    if (!adaptive.level) return;
    adaptive.level = 0;
    adaptive.onStep?.();
}

/** Judges a paint the ticker asked for at `fps` (0: the display's, taken as 60), `since` ms after the one before. */
function judge(canvas: Canvas, now: number, since: number, fps: number): void {
    if (!L.perfAdaptive) return;
    const { scale, offset } = canvas.ds;
    if (scale !== judged.scale || offset[0] !== judged.x || offset[1] !== judged.y || canvas.isDragging) {
        judged.scale = scale;
        judged.x = offset[0];
        judged.y = offset[1];
        return rest();
    }
    const budget = Math.max(1000 / (fps || 60), judged.display);
    if (judged.gap) {
        // The frames left unpainted are in: a step down only where the slow paints came later than the display allows.
        if (judged.gap > SLOW * budget) step(1, now);
        return rest();
    }
    if (since <= SLOW * budget) judged.slow = judged.slowPaints = 0;
    else {
        judged.slow ||= now - since;
        judged.slowPaints++;
    }
    if (judged.slowPaints >= 3 && now - judged.slow >= SECOND - JITTER_MS && adaptive.level < HELD) {
        judged.gap = (now - judged.slow) / judged.slowPaints;
        judged.probe = PROBE;
        judged.shortest = Infinity;
        return;
    }
    if (!judged.start) {
        judged.start = now;
        judged.paints = 0;
        return;
    }
    judged.paints++;
    const span = now - judged.start;
    if (span < SECOND - JITTER_MS) return;
    const roomy = span / judged.paints <= ROOMY * budget;
    judged.start = now;
    judged.paints = 0;
    if (!roomy || !adaptive.level) judged.room = 0;
    else if ((judged.room += span) >= judged.wait) step(-1, now);
}

/** What this client's run does to the effects of a part whose Pause.During.Render is `applies`: Pause.Mode while the run is active, else nothing. */
export const during = (applies: boolean): string => (env.running && applies ? L.pauseMode : 'ignore');

/** Whether the run holds a part's effects still: Freeze effects and Spotlight do. */
export function heldByRun(applies: boolean): boolean {
    const mode = during(applies);
    return mode === 'pause' || mode === 'spotlight';
}

/** Whether `canvas` is zoomed out below Perf.MinZoom, where links and nodes are drawn as native draws them. */
export const zoomedOut = (canvas: { ds: { scale: number } }): boolean => canvas.ds.scale * 100 < L.perfMinZoom;

/** Whether a Calm run is slowing the links or the nodes. */
const calm = () => during(L.pauseDuringRender) === 'calm' || during(N.pauseDuringRender) === 'calm';

/**
 * What the last front pass drew on screen that moves with each clock, in items:
 * the link layer sets links, and the node layer counts nodes (effect phase,
 * styled titles) and particles. A count a pass missed keeps its value, so the
 * ticker runs on until heal() chains the hook that was replaced. The link pass
 * counts the moving segments it records for the same reason: they show only
 * once the link layer's hook runs. bursts counts the particles of the bursts
 * playing, on screen or not, so that they end, and marks the nodes marked. A
 * run's visuals that move count too: flows, the links of its river and trail,
 * and rings, its progress rings, error outlines and the bursts as its nodes
 * finish. wires counts the physics wires on screen that swing, which the
 * ticker moves on and the background shows, and assist is 1 while connection
 * assist draws over a link being dragged.
 */
export const live = { links: 0, nodes: 0, particles: 0, bursts: 0, marks: 0, flows: 0, rings: 0, wires: 0, assist: 0 };

/**
 * A layer of each front pass, in graph space: `over` is false when onRender
 * draws it over the background and under the nodes, and true when
 * onDrawForeground draws it over the nodes.
 */
type Layer = (canvas: Canvas, ctx: CanvasRenderingContext2D, over: boolean) => void;

/** A layer one hook draws in each front pass, in graph space. */
type Draw = (canvas: Canvas, ctx: CanvasRenderingContext2D) => void;

/**
 * The layers each extension's setup() puts in place: what the node effects draw around the nodes, under the link
 * motion; the link motion; the run's rings and outlines on nodes, and the marks on them, over them; the bursts, over
 * those; and connection assist, over everything.
 */
export const layers: { nodes?: Draw; links?: Layer; runs?: Draw; marks?: Draw; bursts?: Draw; assist?: Draw } = {};

/** What the ticker moves on with the clock, by `dt` s: the physics wires that swing (links/physics.ts), which the link setup() puts in place. */
export const steps: { wires?: (dt: number) => void } = {};

/** Whether `box` grown by `margin` on each side overlaps `area`, as the layers cull what they draw to the view. */
export const overlaps = (box: ArrayLike<number>, area: ArrayLike<number>, margin: number) =>
    box[0] - margin <= area[0] + area[2] && box[0] + box[2] + margin >= area[0] && box[1] - margin <= area[1] + area[3] && box[1] + box[3] + margin >= area[1];

/** A canvas nobody sees: an OffscreenCanvas, or a canvas element where the browser has none. */
export function offscreen(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
    return typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height });
}

let sink: CanvasRenderingContext2D | undefined;

/** A 1×1 canvas nobody sees, where native draws what we draw ourselves (link segments, styled titles), so other wrappers still get their call. */
export function dummy(): CanvasRenderingContext2D {
    sink ??= offscreen(1, 1).getContext('2d') as CanvasRenderingContext2D;
    return sink;
}

let frame = 0;
/** When the clock last moved, or held for a frame left unpainted; 0 while stopped, so the first frame after a start moves it by nothing. */
let last = 0;
/** When the next paint is due at the Perf.MaxFps cap. */
let due = 0;

/** Whether the front canvas needs repainting: anything animated is on screen and the tab shows. */
function want(): boolean {
    return !document.hidden && live.links + live.nodes + live.particles + live.bursts + live.marks + live.flows + live.rings + live.wires + live.assist > 0;
}

/** Moves a direction toward `to` by what turning around in TURNAROUND allows in `dt`. */
const toward = (dir: number, to: number, dt: number) => dir + Math.max((-2 * dt) / TURNAROUND, Math.min((2 * dt) / TURNAROUND, to - dir));

/** Moves clock `k` on by `dt` seconds: its links, nodes, particles, bursts, marks, run visuals and assist where `moving` counts any. The panel's gallery tiles run a clock of their own. */
export function advance(k: typeof clock, dt: number, moving: typeof live): void {
    if (moving.links) {
        const speed = L.animationSpeed;
        const linkDt = during(L.pauseDuringRender) === 'calm' ? dt * CALM : dt;
        k.linkDir = toward(k.linkDir, L.direction, dt);
        k.linkPhase -= PHI2 * speed * k.linkDir * linkDt;
        k.linkFlow += 2 * speed * speed * k.linkDir * linkDt;
        k.quantumPhase -= Math.min(PHI2 * speed, (2 * Math.PI * MAX_FLASH_HZ) / QUANTUM_SWEEPS) * k.linkDir * linkDt;
    } else {
        // Links that are not moving turn around at once.
        k.linkDir = L.direction;
    }
    const nodeDt = during(N.pauseDuringRender) === 'calm' ? dt * CALM : dt;
    k.nodeDir = moving.nodes || moving.particles ? toward(k.nodeDir, N.direction, dt) : N.direction;
    if (moving.nodes) k.nodePhase += TURN * N.animationSpeed * k.nodeDir * nodeDt;
    if (moving.particles) {
        k.particleTime += N.particleSpeed * k.nodeDir * nodeDt;
        k.nodeTime += nodeDt;
    }
    if (moving.bursts) k.burstTime += dt;
    if (moving.marks) k.markTime += dt;
    if (moving.flows || moving.rings) k.runTime += dt;
    if (moving.assist) k.assistTime += dt;
}

function tick(now: number): void {
    frame = 0;
    if (!want()) {
        last = 0;
        rest();
        return;
    }
    if (!last) {
        last = due = now;
        // The clock starts again: links and nodes run the way Direction says, without turning around.
        clock.linkDir = L.direction;
        clock.nodeDir = N.direction;
    } else if (judged.probe) {
        // Nothing of ours paints and the clock holds: how soon this frame came is what the display gives.
        judged.shortest = Math.min(judged.shortest, now - last);
        if (!--judged.probe) judged.display = judged.shortest;
        last = due = now;
    } else if (now >= due - JITTER_MS) {
        const dt = Math.min((now - last) / 1000, 0.1);
        advance(clock, dt, live);
        // Swinging wires change the background, which shows them once more as they come to rest.
        const swinging = live.wires > 0;
        if (swinging) steps.wires?.(dt);
        // Paced by when each paint is due rather than by the time since the last one, so a cap the display's rate is
        // no multiple of still holds on average: at 60 a 75 Hz display skips one frame in five, not every other one.
        // A paint more than an interval late starts the pacing afresh instead of catching up.
        const fps = calm() ? Math.min(L.perfMaxFps || CALM_FPS, CALM_FPS) : L.perfMaxFps;
        judge(app.canvas, now, now - last, fps);
        last = now;
        const interval = fps ? 1000 / fps : 0;
        due = due + interval > now ? due + interval : now + interval;
        heal(app.canvas);
        app.canvas.setDirty(true, swinging);
    }
    frame = requestAnimationFrame(tick);
}

/** Starts the ticker unless it is running; the passes call it whenever they draw something animated. */
export function wake(): void {
    frame ||= requestAnimationFrame(tick);
}

/** Repaints both canvases once, for a change between moving and still frames. */
function need(): void {
    app.canvas.setDirty(true, true);
}

/** The element Nodes 2.0's nodes are in (FE157 and FE1395 renderer/core/layout/transform/TransformPane.vue). */
export const PANE = '[data-testid="transform-pane"]';

/** Told when a front pass finds Nodes 2.0 turned on or off, which LiteGraph.vueNodesMode follows: the open panel, which shows what works there. */
export const nodes2 = { onFlip: undefined as (() => void) | undefined };
/** Whether the last front pass drew in Nodes 2.0. */
let vue = false;

/** The transform pane as last found, let go as the mode turns. */
let found: Element | null = null;
let own: HTMLCanvasElement | undefined;
let ownCtx: CanvasRenderingContext2D | null = null;

/** The transform pane, once it mounts after the mode turns on; Vue makes it anew as it renders it again, so it is looked for again once it is gone. */
export function transformPane(): Element | null {
    if (!found?.isConnected) found = document.querySelector(PANE);
    return found;
}

/**
 * 1.39.5 has no overlay: ours goes right after the transform pane, so it stacks above the DOM nodes, sized to the
 * main canvas in device pixels as FE157's LinkOverlayCanvas.vue sizes its own, and cleared for each pass.
 */
function ours(main: HTMLCanvasElement): CanvasRenderingContext2D | null {
    const pane = transformPane();
    if (!pane) return null;
    if (!own) {
        own = document.createElement('canvas');
        own.className = 'eln-overlay';
        own.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
        ownCtx = own.getContext('2d');
    }
    if (pane.nextElementSibling !== own) pane.after(own);
    if (own.width !== main.width || own.height !== main.height) {
        own.width = main.width;
        own.height = main.height;
    } else ownCtx?.clearRect(0, 0, own.width, own.height);
    return ownCtx;
}

function drop(): void {
    own?.remove();
    own = undefined;
    ownCtx = null;
}

function foreground(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    layers.links?.(canvas, ctx, true);
    layers.runs?.(canvas, ctx);
    layers.marks?.(canvas, ctx);
    layers.bursts?.(canvas, ctx);
    layers.assist?.(canvas, ctx);
}

/**
 * Draws the layers over the nodes, in graph space: on `ctx`, the main canvas's, in classic mode; in Nodes 2.0 on the
 * overlay above the DOM nodes, which core clears in each Vue front pass before onDrawForeground (FE157 LGraphCanvas.ts
 * _drawOverlayLinks), with its transform set as _drawOverlayLinks sets it. Until the overlay mounts they stay on `ctx`.
 */
function overNodes(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    if (!LiteGraph.vueNodesMode) {
        if (own) drop();
        return foreground(canvas, ctx);
    }
    const main = canvas.canvas;
    const top = 'overlayCtx' in canvas ? canvas.overlayCtx : ours(main);
    if (!top) return foreground(canvas, ctx);
    top.save();
    try {
        const scale = top.canvas.width / (top.canvas.clientWidth || 1);
        top.setTransform(scale, 0, 0, scale, 0, 0);
        canvas.ds.toCanvasContext(top);
        foreground(canvas, top);
    } finally {
        top.restore();
    }
}

/**
 * Our handlers on app.canvas. Per hook: which argument is the context, what it draws there before calling
 * the handler it chained to, our handler as installed, whether a front pass called it since the ticker last
 * asked for one, and whether it is running.
 */
const hooks = {
    /** onRender(canvas element, ctx) starts each front pass, in screen space between the background and the nodes. */
    onRender: {
        ctx: 1,
        draw(canvas: Canvas, ctx: CanvasRenderingContext2D) {
            if (LiteGraph.vueNodesMode !== vue) {
                vue = LiteGraph.vueNodesMode;
                found = null;
                nodes2.onFlip?.();
            }
            // The node layer counts afresh; the link layer sets its own count wherever it draws.
            live.nodes = live.particles = 0;
            canvas.ds.toCanvasContext(ctx);
            layers.nodes?.(canvas, ctx);
            layers.links?.(canvas, ctx, false);
        },
        installed: undefined as unknown,
        called: false,
        running: false,
    },
    /** onDrawForeground(ctx, visible area), in graph space over the nodes; in Nodes 2.0 on the overlay above them. */
    onDrawForeground: {
        ctx: 0,
        draw: overNodes,
        installed: undefined as unknown,
        called: false,
        running: false,
    },
};
type Hook = keyof typeof hooks;
type Handler = (this: Canvas, ...args: unknown[]) => void;
const HOOKS = Object.keys(hooks) as Hook[];

function chain(canvas: Canvas, name: Hook): void {
    const hook = hooks[name];
    const handlers = canvas as unknown as Record<Hook, Handler | undefined>;
    const previous = handlers[name];
    hook.installed = handlers[name] = function (...args) {
        // A hook that saved this one and was then wrapped by it again calls back in.
        if (hook.running) return;
        hook.running = true;
        hook.called = true;
        const ctx = args[hook.ctx] as CanvasRenderingContext2D;
        try {
            ctx.save();
            try {
                hook.draw(this, ctx);
            } finally {
                ctx.restore();
            }
            previous?.apply(this, args);
        } finally {
            hook.running = false;
        }
    };
}

/** A front pass ran since the ticker last asked (it cleared dirty_canvas) without calling one of our hooks: it was replaced without calling through. */
function heal(canvas: Canvas): void {
    for (const name of HOOKS) {
        const hook = hooks[name];
        if (!hook.called && !canvas.dirty_canvas && canvas[name] !== hook.installed) chain(canvas, name);
        hook.called = false;
    }
}

/** The canvas our hooks are chained on. Once they are, only heal() chains them again, over a hook that replaced ours. */
let chained: Canvas | undefined;
let listening = false;

/** Each extension's setup() calls this: the first call chains our hooks on app.canvas and listens to the page. */
export function install(): void {
    if (chained !== app.canvas) {
        chained = app.canvas;
        for (const name of HOOKS) chain(app.canvas, name);
    }
    if (listening) return;
    listening = true;

    document.addEventListener('visibilitychange', () => {
        last = 0;
        wake();
    });

    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => {
        // 1.57.1 mirrors Comfy.Appearance.DisableAnimations as this class (coreSettings.ts), so it needs no settings read.
        const reduced = L.motion === 'reduce' || (L.motion === 'system' && (query.matches || document.body.classList.contains('disable-animations')));
        if (reduced === env.reducedMotion) return;
        env.reducedMotion = reduced;
        need();
    };
    motion();
    query.addEventListener('change', motion);
    new MutationObserver(motion).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    watch((id) => {
        if (id === '🔗 Enhanced Links.Motion') motion();
        // Another look or setting costs what it costs: Perf.Adaptive judges it from full quality.
        if (judged.revision !== revision) relax();
    });
}

/** Per key: its latest failure times, when it last logged and whether it is off. Forgotten whenever a setting changes. */
const failures = new Map<string, { times: number[]; logged: number; off: boolean }>();
let failuresSince = revision;

function current() {
    if (failuresSince !== revision) {
        failures.clear();
        failuresSince = revision;
    }
    return failures;
}

const failuresOf = (key: string) => current().get(key);

export const guard = {
    /** Whether `key` failed too often; changing any setting turns it back on. */
    off: (key: string): boolean => failuresOf(key)?.off ?? false,

    /** The keys turned off now. */
    tripped: (): string[] => [...current()].flatMap(([key, f]) => (f.off ? [key] : [])),

    /** Turns every key back on, as changing a setting does, and redraws. */
    retry(): void {
        failures.clear();
        need();
    },

    /** Told when a key is turned off: the open panel, which shows it. */
    onTrip: undefined as (() => void) | undefined,

    /** Logs at most once per key every 10 s. FAILURES within 10 s turn the key off, with one toast that says so. */
    fail(key: string, error: unknown): void {
        const now = performance.now();
        let f = failuresOf(key);
        if (!f) failures.set(key, (f = { times: [], logged: -Infinity, off: false }));
        if (now - f.logged >= GUARD_MS) {
            f.logged = now;
            console.warn(`[Enhanced Links & Nodes] ${key} failed:`, error);
        }
        f.times.push(now);
        if (f.times.length > FAILURES) f.times.shift();
        if (f.off || f.times.length < FAILURES || now - f.times[0] > GUARD_MS) return;
        f.off = true;
        app.extensionManager.toast.add({
            severity: 'warn',
            summary: `${key} turned off`,
            detail: `It failed ${FAILURES} times in 10 seconds. Change any Enhanced Links & Nodes setting to turn it back on.`,
            life: 10_000,
        });
        guard.onTrip?.();
    },
};
