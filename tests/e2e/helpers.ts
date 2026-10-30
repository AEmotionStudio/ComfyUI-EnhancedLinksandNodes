import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';

export { expect };

/** Console messages kept per type; the rest are only counted. */
const LOG_CAP = 500;

declare global {
    interface Window {
        app: any;
        LiteGraph: any;
        LGraphCanvas: any;
        LGraphNode: any;
        __COMFYUI_FRONTEND_VERSION__: string;
        __eln: Probe;
        __elnCsp: CspViolation[];
        __elnConnectionPos?: { node: number; input: boolean; pos: Point }[];
    }
}

export type Point = [number, number];

export interface LegOptions {
    /** Seeded user (see serve.mjs) whose settings each test copies into a fresh user. */
    profile: string;
    /** Applied over the profile's settings before the app loads, e.g. `{ 'Comfy.VueNodes.Enabled': true }`. */
    settings: Record<string, unknown>;
    /** Frontend version the leg serves. */
    frontend: string;
}

export interface LogMessage {
    type: string;
    text: string;
    /** The script that logged it. */
    url: string;
}

export interface PageLog {
    /** The first LOG_CAP messages of each type, for the attachment. */
    console: LogMessage[];
    /** Every message, counted by type, url and the first 200 characters of its text, in order of first appearance. Checks read these. */
    counts: (LogMessage & { count: number })[];
    errors: string[];
}

export interface CspViolation {
    directive: string;
    blocked: string;
    source: string;
}

/** One native renderLink call. */
export interface Segment {
    link: number | null;
    origin: number | null;
    target: number | null;
    a: Point;
    b: Point;
    color: string | null;
    disabled: boolean;
    reroute: number | null;
}

/** Test-only counters, installed in the page by {@link openApp}. */
export interface Probe {
    front: number;
    back: number;
    frontMs: number[];
    backMs: number[];
    /** Settings reads through the two extension APIs, and how many of them happened inside a paint. */
    reads: { getSettingValue: number; settingGet: number; inPaint: number };
    renderLink: number;
    segments: Segment[];
}

export const test = base.extend<LegOptions & { user: string; log: PageLog }>({
    profile: ['default', { option: true }],
    settings: [{}, { option: true }],
    frontend: ['', { option: true }],
    // A fresh multi-user profile per test, so settings a test changes never leak into the next one.
    user: [
        async ({ page, request, profile, settings }, use) => {
            // Everything from here on writes to the server's user directory, so refuse a ComfyUI that serve.mjs
            // did not start, such as one Playwright reused because it already listened on the leg's port.
            const argv: string[] = (await (await request.get('/system_stats')).json()).system.argv;
            const baseDir = argv[argv.indexOf('--base-directory') + 1] ?? '';
            const isolated = argv.includes('--multi-user') && path.dirname(baseDir) === os.tmpdir() && path.basename(baseDir).startsWith('eln-e2e-');
            expect(isolated, `refusing to run against a ComfyUI not started by serve.mjs: ${argv.join(' ')}`).toBe(true);
            const created = await request.post('/users', { data: { username: `${profile}-${randomUUID()}` } });
            expect(created.ok(), await created.text()).toBe(true);
            const user: string = await created.json();
            const seed = await request.get('/settings', { headers: { 'comfy-user': profile } });
            const saved = await request.post('/settings', { headers: { 'comfy-user': user }, data: { ...(await seed.json()), ...settings } });
            expect(saved.ok()).toBe(true);
            await page.addInitScript((id) => localStorage.setItem('Comfy.userId', id), user);
            await use(user);
        },
        { auto: true },
    ],
    log: [
        async ({ page }, use, testInfo) => {
            const log: PageLog = { console: [], counts: [], errors: [] };
            const kept: Record<string, number> = {};
            const counted = new Map<string, PageLog['counts'][number]>();
            page.on('console', (m) => {
                const message = { type: m.type(), text: m.text(), url: m.location().url };
                const key = `${message.type} ${message.url}: ${message.text.slice(0, 200)}`;
                let entry = counted.get(key);
                if (!entry) {
                    entry = { ...message, text: message.text.slice(0, 200), count: 0 };
                    counted.set(key, entry);
                    log.counts.push(entry);
                }
                entry.count++;
                kept[message.type] = (kept[message.type] ?? 0) + 1;
                if (kept[message.type] <= LOG_CAP) log.console.push(message);
            });
            page.on('pageerror', (e) => log.errors.push(e.stack ?? e.message));
            await page.addInitScript(() => {
                window.__elnCsp = [];
                document.addEventListener('securitypolicyviolation', (e) => {
                    window.__elnCsp.push({ directive: e.violatedDirective, blocked: e.blockedURI, source: e.sourceFile });
                });
            });
            await use(log);
            await testInfo.attach('page-log', { body: JSON.stringify(log, null, 2), contentType: 'application/json' });
        },
        { auto: true },
    ],
});

/** Loads the app and waits until the startup workflow is in place, checks both bundles registered, then installs the probe. */
export async function openApp(page: Page): Promise<void> {
    await page.goto('/');
    await page.waitForFunction(() => {
        const app = window.app;
        return !!(app?.canvas?.graph && app.extensionManager?.workflow?.activeWorkflow);
    }, null, { timeout: 60_000 });
    // Disabled extensions are registered too, so this holds on every profile; a bundle that failed to import is missing.
    const names: string[] = await page.evaluate(() => window.app.extensions.map((e: { name: string }) => e.name));
    expect(names, 'both bundles registered').toEqual(expect.arrayContaining(['enhanced.link.animations', 'enhanced.node.animations']));
    await installProbe(page);
}

export function cspViolations(page: Page): Promise<CspViolation[]> {
    return page.evaluate(() => window.__elnCsp);
}

async function installProbe(page: Page): Promise<void> {
    await page.evaluate(() => {
        if (window.__eln) return;
        const CAP = 20_000;
        const probe: Probe = {
            front: 0,
            back: 0,
            frontMs: [],
            backMs: [],
            reads: { getSettingValue: 0, settingGet: 0, inPaint: 0 },
            renderLink: 0,
            segments: [],
        };
        window.__eln = probe;
        const { app } = window;
        const proto = window.LGraphCanvas.prototype;
        let painting = 0;
        const read = (api: 'getSettingValue' | 'settingGet') => {
            probe.reads[api]++;
            if (painting) probe.reads.inPaint++;
        };

        const settings = app.ui.settings;
        const getSettingValue = settings.getSettingValue;
        settings.getSettingValue = function (this: unknown, ...args: unknown[]) {
            read('getSettingValue');
            return getSettingValue.apply(this, args);
        };
        // extensionManager.setting is a computed that can hand out a new object, so re-wrap before each paint.
        const wrapSettingGet = () => {
            const setting = app.extensionManager?.setting;
            if (!setting || setting.get.__eln) return;
            const get = setting.get;
            const wrapped = function (this: unknown, ...args: unknown[]) {
                read('settingGet');
                return get.apply(this, args);
            };
            wrapped.__eln = true;
            setting.get = wrapped;
        };
        wrapSettingGet();

        const timePaints = (method: string, count: 'front' | 'back', times: 'frontMs' | 'backMs') => {
            const original = proto[method];
            proto[method] = function (this: unknown, ...args: unknown[]) {
                wrapSettingGet();
                painting++;
                const start = performance.now();
                try {
                    return original.apply(this, args);
                } finally {
                    painting--;
                    probe[count]++;
                    if (probe[times].length < CAP) probe[times].push(performance.now() - start);
                }
            };
        };
        timePaints('drawFrontCanvas', 'front', 'frontMs');
        timePaints('drawBackCanvas', 'back', 'backMs');

        const renderLink = proto.renderLink;
        proto.renderLink = function (this: unknown, ...args: any[]) {
            probe.renderLink++;
            if (probe.segments.length < CAP) {
                const [, a, b, link, , , color, , , options] = args;
                // 1.57 keeps link topology in a store that hands node ids back as strings.
                probe.segments.push({
                    link: link ? Number(link.id) : null,
                    origin: link ? Number(link.origin_id) : null,
                    target: link ? Number(link.target_id) : null,
                    a: [a[0], a[1]],
                    b: [b[0], b[1]],
                    color: color == null ? null : String(color),
                    disabled: !!options?.disabled,
                    reroute: options?.reroute?.id ?? null,
                });
            }
            return renderLink.apply(this, args);
        };
    });
}

export async function resetProbe(page: Page): Promise<void> {
    await page.evaluate(() => {
        const probe = window.__eln;
        probe.front = probe.back = probe.renderLink = 0;
        probe.frontMs = [];
        probe.backMs = [];
        probe.segments = [];
        probe.reads = { getSettingValue: 0, settingGet: 0, inPaint: 0 };
    });
}

export function readProbe(page: Page): Promise<Probe> {
    return page.evaluate(() => window.__eln);
}

/** Marks both canvases dirty and resolves after the next background paint. */
export async function redraw(page: Page): Promise<void> {
    await page.evaluate(() => new Promise<void>((resolve) => {
        const probe = window.__eln;
        const painted = probe.back;
        window.app.canvas.setDirty(true, true);
        const check = () => (probe.back > painted ? resolve() : requestAnimationFrame(check));
        requestAnimationFrame(check);
    }));
}

/** Resolves true once neither canvas has painted for `quietMs`, or false after `timeoutMs`. */
export function settle(page: Page, quietMs = 500, timeoutMs = 10_000): Promise<boolean> {
    return page.evaluate(async ([quietMs, timeoutMs]) => {
        const probe = window.__eln;
        const deadline = performance.now() + timeoutMs;
        let paints = probe.front + probe.back;
        let since = performance.now();
        while (performance.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            if (probe.front + probe.back !== paints) {
                paints = probe.front + probe.back;
                since = performance.now();
            } else if (performance.now() - since >= quietMs) {
                return true;
            }
        }
        return false;
    }, [quietMs, timeoutMs]);
}

const EMPTY_WORKFLOW = { last_node_id: 0, last_link_id: 0, nodes: [], links: [], groups: [], config: {}, extra: {}, version: 0.4 };

/** Loads a workflow without restoring its saved view; the view is reset so graph and canvas coordinates match. */
export async function loadWorkflow(page: Page, workflow: object): Promise<void> {
    await page.evaluate(async (data) => {
        const { app } = window;
        await app.loadGraphData(data, true, false);
        app.canvas.ds.scale = 1;
        app.canvas.ds.offset = [0, 0];
        app.canvas.setDirty(true, true);
    }, workflow);
}

export interface NodeSpec {
    type: string;
    pos: Point;
    mode?: 'mute' | 'bypass';
    collapsed?: boolean;
}

export interface LinkSpec {
    from: string;
    to: string;
    output?: number;
    input?: number;
    /** Adds a native reroute at this graph position. */
    reroute?: Point;
    /** Disconnects the input afterwards but keeps the reroute, which leaves a floating link. */
    floating?: boolean;
}

export interface GraphSpec {
    nodes: Record<string, NodeSpec>;
    links?: Record<string, LinkSpec>;
    /** Nodes converted into one subgraph. */
    subgraph?: string[];
}

export interface BuiltGraph {
    nodes: Record<string, number>;
    links: Record<string, number>;
    reroutes: Record<string, number>;
    /** Id of the subgraph node, or null when the spec has none or the frontend cannot convert. */
    subgraph: number | null;
}

/** Replaces the graph with one built through the LiteGraph API. */
export async function buildGraph(page: Page, spec: GraphSpec): Promise<BuiltGraph> {
    await loadWorkflow(page, EMPTY_WORKFLOW);
    return page.evaluate((spec) => {
        const { app, LiteGraph } = window;
        const graph = app.graph;
        const MODES = { mute: 2, bypass: 4 };
        const nodes: Record<string, any> = {};
        for (const [name, s] of Object.entries(spec.nodes)) {
            const node = LiteGraph.createNode(s.type);
            if (!node) throw new Error(`Unknown node type ${s.type}`);
            graph.add(node);
            node.pos = [...s.pos];
            nodes[name] = node;
        }
        const links: Record<string, number> = {};
        const reroutes: Record<string, number> = {};
        for (const [name, s] of Object.entries(spec.links ?? {})) {
            const link = nodes[s.from].connect(s.output ?? 0, nodes[s.to], s.input ?? 0);
            if (!link) throw new Error(`Could not connect ${name}`);
            links[name] = Number(link.id);
            if (s.reroute) reroutes[name] = graph.createReroute([...s.reroute], link).id;
            if (s.floating) {
                // 1.39.5's createReroute also lists the link as floating, which stops the disconnect from
                // leaving a floating link. Loading a workflow validates reroutes the same way; 1.57 has no such step.
                graph.reroutes.get(reroutes[name]).validateLinks?.(graph._links, graph.floatingLinks);
                nodes[s.to].disconnectInput(s.input ?? 0, true);
            }
        }
        for (const [name, s] of Object.entries(spec.nodes)) {
            if (s.mode) nodes[name].changeMode(MODES[s.mode]);
            if (s.collapsed) nodes[name].collapse(true);
        }
        let subgraph: number | null = null;
        if (spec.subgraph && typeof graph.convertToSubgraph === 'function') {
            subgraph = Number(graph.convertToSubgraph(new Set(spec.subgraph.map((name) => nodes[name]))).node.id);
        }
        app.canvas.setDirty(true, true);
        const ids = Object.fromEntries(Object.entries(nodes).map(([name, node]) => [name, Number(node.id)]));
        return { nodes: ids, links, reroutes, subgraph };
    }, spec);
}

/** Opens a subgraph node and waits for the canvas to settle on its first view. */
export async function openSubgraph(page: Page, nodeId: number): Promise<void> {
    await page.evaluate((id) => {
        const { app } = window;
        const node = app.graph.getNodeById(id);
        app.canvas.openSubgraph(node.subgraph, node);
    }, nodeId);
    await settle(page);
}

export function setSetting(page: Page, id: string, value: unknown): Promise<void> {
    return page.evaluate(([id, value]) => window.app.extensionManager.setting.set(id, value), [id, value] as const);
}

/** Converts a graph point to page coordinates and checks that nothing covers the canvas there. */
export function toClient(page: Page, point: Point): Promise<Point> {
    return page.evaluate(([x, y]) => {
        const { canvas } = window.app;
        const rect = canvas.canvas.getBoundingClientRect();
        const [cx, cy] = canvas.ds.convertOffsetToCanvas([x, y]);
        const client: Point = [rect.left + cx, rect.top + cy];
        const hit = document.elementFromPoint(...client);
        if (hit !== canvas.canvas) throw new Error(`Graph point ${x},${y} is covered by <${hit?.tagName.toLowerCase()} class="${hit?.className}">`);
        return client;
    }, point);
}

export async function clickAt(page: Page, point: Point): Promise<void> {
    const [x, y] = await toClient(page, point);
    await page.mouse.click(x, y);
}

/** Front-canvas RGBA at a graph point. */
export function pixelAt(page: Page, point: Point): Promise<number[]> {
    return page.evaluate(([x, y]) => {
        const { canvas } = window.app;
        const el: HTMLCanvasElement = canvas.canvas;
        const [cx, cy] = canvas.ds.convertOffsetToCanvas([x, y]);
        const ratio = el.width / el.clientWidth;
        return [...el.getContext('2d')!.getImageData(Math.round(cx * ratio), Math.round(cy * ratio), 1, 1).data];
    }, point);
}

/** The centre the native renderer stored on the link at its last paint. */
export function linkCentre(page: Page, linkId: number): Promise<Point> {
    return page.evaluate((id) => {
        const link = window.app.canvas.graph.getLink(id);
        return [link._pos[0], link._pos[1]] as Point;
    }, linkId);
}

/**
 * A point at fraction `t` on the straight line from the output slot to the input slot of a link.
 * It does not depend on anything the renderer stored, so it also works when the native renderer never ran.
 */
export function slotPoint(page: Page, linkId: number, t: number): Promise<Point> {
    return page.evaluate(([id, t]) => {
        const graph = window.app.canvas.graph;
        const link = graph.getLink(id);
        const a = graph.getNodeById(link.origin_id).getOutputPos(link.origin_slot);
        const b = graph.getNodeById(link.target_id).getInputPos(link.target_slot);
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as Point;
    }, [linkId, t]);
}

/** A {@link slotPoint} on a link without reroutes that must also lie on the path the native renderer stored. */
export async function pointOnLink(page: Page, linkId: number, t: number): Promise<Point> {
    const point = await slotPoint(page, linkId, t);
    await page.evaluate(([id, x, y]) => {
        const { app } = window;
        const link = app.canvas.graph.getLink(id);
        const ctx = document.createElement('canvas').getContext('2d')!;
        ctx.lineWidth = app.canvas.connections_width;
        if (!link.path || !ctx.isPointInStroke(link.path, x, y)) throw new Error(`${x},${y} is not on link ${id}`);
    }, [linkId, ...point]);
    return point;
}

/** The colour native ComfyUI paints a link in, as RGBA. */
export function linkColour(page: Page, linkId: number): Promise<number[]> {
    return page.evaluate((id) => {
        const { app, LGraphCanvas } = window;
        const link = app.canvas.graph.getLink(id);
        const ctx = document.createElement('canvas').getContext('2d')!;
        ctx.fillStyle = link.color || LGraphCanvas.link_type_colors[link.type] || app.canvas.default_link_color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data];
    }, linkId);
}

/** Front-canvas pixels at graph points once the graph is emptied: what "nothing drawn here" looks like. */
export async function blankPixels(page: Page, points: Point[]): Promise<number[][]> {
    await buildGraph(page, { nodes: {} });
    await redraw(page);
    const pixels: number[][] = [];
    for (const point of points) pixels.push(await pixelAt(page, point));
    return pixels;
}

/**
 * From now on, records the getConnectionPos results of each drawConnections pass. A drawConnections
 * override that never calls renderLink, like v2's, takes its link ends from there.
 */
export function recordConnectionPos(page: Page): Promise<void> {
    return page.evaluate(() => {
        if (window.__elnConnectionPos) return;
        const canvasProto = window.LGraphCanvas.prototype;
        const nodeProto = window.LGraphNode.prototype;
        const drawConnections = canvasProto.drawConnections;
        const getConnectionPos = nodeProto.getConnectionPos;
        const calls: { node: number; input: boolean; pos: Point }[] = [];
        let inside = false;
        window.__elnConnectionPos = calls;
        canvasProto.drawConnections = function (this: unknown, ...args: unknown[]) {
            calls.length = 0;
            inside = true;
            try {
                return drawConnections.apply(this, args);
            } finally {
                inside = false;
            }
        };
        nodeProto.getConnectionPos = function (this: any, input: boolean, slot: number, out?: Point) {
            const pos = getConnectionPos.call(this, input, slot, out);
            if (inside) calls.push({ node: Number(this.id), input, pos: [pos[0], pos[1]] });
            return pos;
        };
    });
}

/** The output and input end of a link as getConnectionPos gave them in the last drawConnections pass. */
export function connectionPosEnds(page: Page, linkId: number): Promise<[Point, Point] | null> {
    return page.evaluate((id) => {
        const link = window.app.canvas.graph.getLink(id);
        const calls = window.__elnConnectionPos ?? [];
        const start = calls.find((c) => c.node === Number(link.origin_id) && !c.input);
        const end = calls.find((c) => c.node === Number(link.target_id) && c.input);
        return start && end ? [start.pos, end.pos] : null;
    }, linkId);
}

/**
 * Where the last paint put the ends of a link without reroutes: its renderLink segment, or else what
 * getConnectionPos gave (see {@link recordConnectionPos}). Null if the link was not drawn either way.
 */
export async function drawnLinkEnds(page: Page, linkId: number): Promise<[Point, Point] | null> {
    const segment = (await readProbe(page)).segments.find((s) => s.link === linkId);
    return segment ? [segment.a, segment.b] : connectionPosEnds(page, linkId);
}

/** Graph positions of the slot dots of a Vue node, measured in the DOM. */
export function vueSlotCentres(page: Page, nodeId: number): Promise<{ inputs: Point[]; outputs: Point[] }> {
    return page.evaluate((id) => {
        const { canvas } = window.app;
        const rect = canvas.canvas.getBoundingClientRect();
        const centre = (dot: Element): Point => {
            const r = dot.getBoundingClientRect();
            const [x, y] = canvas.ds.convertCanvasToOffset([r.left + r.width / 2 - rect.left, r.top + r.height / 2 - rect.top]);
            return [x, y];
        };
        const node = document.querySelector(`.lg-node[data-node-id="${id}"]`);
        if (!node) throw new Error(`Node ${id} has no Vue element`);
        return {
            inputs: [...node.querySelectorAll('.lg-slot--input .slot-dot')].map(centre),
            outputs: [...node.querySelectorAll('.lg-slot--output .slot-dot')].map(centre),
        };
    }, nodeId);
}

export function distance(a: Point, b: Point): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function reroutePos(page: Page, rerouteId: number): Promise<Point> {
    return page.evaluate((id) => {
        const reroute = window.app.canvas.graph.reroutes.get(id);
        return [reroute.pos[0], reroute.pos[1]] as Point;
    }, rerouteId);
}

/** A point inside the node's title bar, which selects the node when clicked. */
export function titleOf(page: Page, nodeId: number): Promise<Point> {
    return page.evaluate((id) => {
        const { app, LiteGraph } = window;
        const node = app.canvas.graph.getNodeById(id);
        return [node.pos[0] + node.size[0] / 2, node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT / 2] as Point;
    }, nodeId);
}
