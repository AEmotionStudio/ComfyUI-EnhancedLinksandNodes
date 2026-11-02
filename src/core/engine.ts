/**
 * What both extensions animate by: one clock that only the ticker moves; one
 * requestAnimationFrame ticker that asks app.canvas for front paints while
 * anything animated is on screen and stops otherwise; the onRender and
 * onDrawForeground hooks, chained with whatever else uses them, which draw the
 * extensions' layers in each front pass; and a guard that turns off what keeps
 * failing.
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
 * plays, from 0 as its show starts, markTime while a node is marked, from 0 as its mark starts, and runTime while a
 * run's visuals move. Only the ticker moves the clock, never a draw, so a canvas drawn again within a frame (as
 * MagnifyGlass does) shows the same moment.
 */
export const clock = { linkPhase: 0, linkFlow: 0, linkDir: 1, quantumPhase: 0, nodePhase: 0, particleTime: 0, nodeTime: 0, nodeDir: 1, burstTime: 0, markTime: 0, runTime: 0 };

/** The pose of still links: the first frame v1 drew in Static mode (old_link_animations.js:2440-2456). */
export const STILL_PHASE = (9 * Math.PI) / 4;

/** Whether this client's run is active (fx/execution.ts), and whether effects show still for less motion, as Motion says. */
export const env = { running: false, reducedMotion: false };

/** What this client's run does to the effects of a part whose Pause.During.Render is `applies`: Pause.Mode while the run is active, else nothing. */
export const during = (applies: boolean): string => (env.running && applies ? L.pauseMode : 'ignore');

/** Whether the run holds a part's effects still: Freeze effects and Spotlight do. */
export function heldByRun(applies: boolean): boolean {
    const mode = during(applies);
    return mode === 'pause' || mode === 'spotlight';
}

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
 * and rings, its progress rings and error outlines.
 */
export const live = { links: 0, nodes: 0, particles: 0, bursts: 0, marks: 0, flows: 0, rings: 0 };

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
 * motion; the link motion; the run's rings and outlines on nodes, and the marks on them, over them; and the bursts,
 * over everything.
 */
export const layers: { nodes?: Draw; links?: Layer; runs?: Draw; marks?: Draw; bursts?: Draw } = {};

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
/** When the clock last moved; 0 while stopped, so the first frame after a start moves it by nothing. */
let last = 0;
/** When the next paint is due at the Perf.MaxFps cap. */
let due = 0;

/** Whether the front canvas needs repainting: anything animated is on screen and the tab shows. */
function want(): boolean {
    return !document.hidden && live.links + live.nodes + live.particles + live.bursts + live.marks + live.flows + live.rings > 0;
}

/** Moves a direction toward `to` by what turning around in TURNAROUND allows in `dt`. */
const toward = (dir: number, to: number, dt: number) => dir + Math.max((-2 * dt) / TURNAROUND, Math.min((2 * dt) / TURNAROUND, to - dir));

/** Moves clock `k` on by `dt` seconds: its links, nodes, particles, bursts, marks and run visuals where `moving` counts any. The panel's gallery tiles run a clock of their own. */
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
}

function tick(now: number): void {
    frame = 0;
    if (!want()) {
        last = 0;
        return;
    }
    if (!last) {
        last = due = now;
        // The clock starts again: links and nodes run the way Direction says, without turning around.
        clock.linkDir = L.direction;
        clock.nodeDir = N.direction;
    } else if (now >= due - JITTER_MS) {
        advance(clock, Math.min((now - last) / 1000, 0.1), live);
        last = now;
        // Paced by when each paint is due rather than by the time since the last one, so a cap the display's rate is
        // no multiple of still holds on average: at 60 a 75 Hz display skips one frame in five, not every other one.
        // A paint more than an interval late starts the pacing afresh instead of catching up.
        const fps = calm() ? Math.min(L.perfMaxFps || CALM_FPS, CALM_FPS) : L.perfMaxFps;
        const interval = fps ? 1000 / fps : 0;
        due = due + interval > now ? due + interval : now + interval;
        heal(app.canvas);
        app.canvas.setDirty(true, false);
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
    /** onDrawForeground(ctx, visible area), in graph space over the nodes. */
    onDrawForeground: {
        ctx: 0,
        draw(canvas: Canvas, ctx: CanvasRenderingContext2D) {
            layers.links?.(canvas, ctx, true);
            layers.runs?.(canvas, ctx);
            layers.marks?.(canvas, ctx);
            layers.bursts?.(canvas, ctx);
        },
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
