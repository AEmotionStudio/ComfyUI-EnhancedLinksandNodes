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
import { api } from '/scripts/api.js';
import { L, N, revision } from '@/core/settings';

type Canvas = typeof app.canvas;

/** v2.0.1's phase rate at speed 1: a turn every 15 s. */
const TURN = (2 * Math.PI) / 15;
const MAX_FPS = 60;
/** rAF timestamps jitter around the display's interval, so a frame this much early still counts. */
const JITTER_MS = 1;
const GUARD_MS = 10_000;
/** Failures of one key within GUARD_MS that turn it off. */
const FAILURES = 5;

/**
 * The animation clock in v2's units: the link phase and flow time (the renderers
 * scale it by speed), the node effect phase and the node particle phase. Only
 * the ticker moves it, never a draw, so a canvas drawn again within a frame (as
 * MagnifyGlass does) shows the same moment.
 */
export const clock = { linkPhase: 0, linkTime: 0, nodePhase: 0, particlePhase: 0 };

/** Whether the queue is running (v2's rule: the global 'status' event), and whether the user asked for less motion. */
export const env = { running: false, reducedMotion: false };

/**
 * What the last front pass drew on screen that moves with each clock, in items:
 * the link layer sets links, and the node layer counts nodes (effect phase,
 * styled titles) and particles. A count a pass missed keeps its value, so the
 * ticker runs on until heal() chains the hook that was replaced. The link pass
 * counts the moving segments it records for the same reason: they show only
 * once the link layer's hook runs.
 */
export const live = { links: 0, nodes: 0, particles: 0 };

/**
 * A layer of each front pass, in graph space: `over` is false when onRender
 * draws it over the background and under the nodes, and true when
 * onDrawForeground draws it over the nodes.
 */
type Layer = (canvas: Canvas, ctx: CanvasRenderingContext2D, over: boolean) => void;

/** The layers each extension's setup() puts in place: what the node effects draw around the nodes, under the link motion, and the link motion. */
export const layers: { nodes?: (canvas: Canvas, ctx: CanvasRenderingContext2D) => void; links?: Layer } = {};

let sink: CanvasRenderingContext2D | undefined;

/** A 1×1 canvas nobody sees, where native draws what we draw ourselves (link segments, styled titles), so other wrappers still get their call. */
export function dummy(): CanvasRenderingContext2D {
    sink ??= (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(1, 1) : Object.assign(document.createElement('canvas'), { width: 1, height: 1 }))
        .getContext('2d') as CanvasRenderingContext2D;
    return sink;
}

let frame = 0;
/** When the clock last moved; 0 while stopped, so the first frame after a start moves it by nothing. */
let last = 0;

/** Whether the front canvas needs repainting: anything animated is on screen and the tab shows. */
function want(): boolean {
    return !document.hidden && live.links + live.nodes + live.particles > 0;
}

function advance(dt: number): void {
    if (live.links) {
        clock.linkPhase += TURN * Math.max(0.01, L.animationSpeed) * L.direction * dt;
        // v2 added each frame's delta to the flow time twice: in drawConnections and in its own rAF loop.
        clock.linkTime += 2 * dt;
    }
    if (live.nodes) clock.nodePhase += TURN * N.animationSpeed * N.direction * dt;
    if (live.particles) clock.particlePhase += TURN * Math.max(0.01, N.particleSpeed) * N.direction * dt;
}

function tick(now: number): void {
    frame = 0;
    if (!want()) {
        last = 0;
        return;
    }
    if (!last) {
        last = now;
    } else if (now - last >= 1000 / MAX_FPS - JITTER_MS) {
        advance(Math.min((now - last) / 1000, 0.1));
        last = now;
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
        const reduced = query.matches || document.body.classList.contains('disable-animations');
        if (reduced === env.reducedMotion) return;
        env.reducedMotion = reduced;
        need();
    };
    motion();
    query.addEventListener('change', motion);
    new MutationObserver(motion).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    api.addEventListener('status', ({ detail }) => {
        const running = detail?.exec_info?.queue_remaining > 0;
        if (running === env.running) return;
        env.running = running;
        need();
    });
}

/** Per key: its latest failure times, when it last logged and whether it is off. Forgotten whenever a setting changes. */
const failures = new Map<string, { times: number[]; logged: number; off: boolean }>();
let failuresSince = revision;

function failuresOf(key: string) {
    if (failuresSince !== revision) {
        failures.clear();
        failuresSince = revision;
    }
    return failures.get(key);
}

export const guard = {
    /** Whether `key` failed too often; changing any setting turns it back on. */
    off: (key: string): boolean => failuresOf(key)?.off ?? false,

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
    },
};
