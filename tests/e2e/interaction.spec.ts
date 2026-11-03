// Native link and node behaviour, checked with the extension enabled (fe157, fe1395) and disabled
// (the -native projects). Every check asserts what native ComfyUI does.
import type { Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import {
    blankPixels,
    buildGraph,
    clickAt,
    cspViolations,
    distance,
    drawnLinkEnds,
    expect,
    linkCentre,
    linkColour,
    openApp,
    openSubgraph,
    pixelAt,
    readProbe,
    recordConnectionPos,
    redraw,
    reroutePos,
    resetProbe,
    setSetting,
    settle,
    slotPoint,
    test,
    titleOf,
    toClient,
    vueSlotCentres,
    type GraphSpec,
    type Point,
} from './helpers';

const WHITE = [255, 255, 255, 255];

const enabled = (profile: string) => profile !== 'native';
/** Pixels within `tolerance` per channel, which allows for antialiasing. */
const near = (a: number[], b: number[], tolerance = 16) => a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
const since157 = (frontend: string) => Number(frontend.split('.')[1]) >= 57;

/** The native spline at bezier parameter `t` for a link from an output to an input, without reroutes: each control a quarter of the length out along its slot's direction. */
async function splinePoint(page: Page, linkId: number, t: number): Promise<Point> {
    const [a, b] = [await slotPoint(page, linkId, 0), await slotPoint(page, linkId, 1)];
    const d = distance(a, b) * 0.25;
    const u = 1 - t;
    const at = (i: 0 | 1, c1: number, c2: number) => u * u * u * a[i] + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * b[i];
    return [at(0, a[0] + d, b[0] - d), at(1, a[1], b[1])];
}

/** Checks that the still frame shows a link without reroutes: a point on it, away from its centre marker, is not what an empty canvas shows. */
async function expectLinkShown(page: Page, linkId: number): Promise<void> {
    const point = await splinePoint(page, linkId, 0.3);
    const drawn = await pixelAt(page, point);
    const [blank] = await blankPixels(page, [point]);
    expect(near(drawn, blank, 4), `drawn ${drawn}, blank ${blank}`).toBe(false);
}

/** Paints of each canvas during `ms`, and the seconds that really took. */
function paints(page: Page, ms: number): Promise<{ front: number; back: number; seconds: number }> {
    return page.evaluate(async (ms) => {
        const probe = window.__eln;
        const [front, back, start] = [probe.front, probe.back, performance.now()];
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { front: probe.front - front, back: probe.back - back, seconds: (performance.now() - start) / 1000 };
    }, ms);
}

test.beforeEach(async ({ page }) => {
    await openApp(page);
});

test('serves the leg frontend with the extensions of its profile', async ({ page, frontend, profile, log }) => {
    expect(await page.evaluate(() => window.__COMFYUI_FRONTEND_VERSION__)).toBe(frontend);
    const messages = log.counts.map((m) => m.text);
    for (const name of ['enhanced.link.animations', 'enhanced.node.animations']) {
        expect(messages.includes(`Extension ${name} is disabled.`), name).toBe(!enabled(profile));
    }
});

test.describe('link hit-testing', () => {
    test('clicking a link centre opens the link menu', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const [x, y] = await toClient(page, await slotPoint(page, graph.links.int, 0.5));
        await page.mouse.click(x, y);
        const menu = page.locator('.litecontextmenu');
        await expect(menu).toBeVisible({ timeout: 3000 });
        await expect(menu).toContainText('Add Reroute');
        await expect(menu).toContainText('Delete');
    });

    for (const [style, name] of [['stepped', 'Stepped'], ['zigzag', 'Wave'], ['coil', 'Coil']]) {
        test.describe(`along a ${name} link`, () => {
            test.use({ settings: { '🔗 Enhanced Links.Link.Style': style } });

            test('clicking the centre opens the link menu, where the centre marker is drawn', async ({ page, profile }) => {
                test.skip(!enabled(profile), 'Link.Style is the extension\'s');
                const graph = await buildGraph(page, graphs.diagonal);
                await redraw(page);
                const centre = await linkCentre(page, graph.links.int);
                // The marker is a 5 px circle in the link colour.
                const [drawn, colour] = [await pixelAt(page, centre), await linkColour(page, graph.links.int)];
                expect(near(drawn, colour), `drawn ${drawn}, link colour ${colour}`).toBe(true);
                // Steps leave the native curve far behind: across at the output's height, then down to the input.
                const native = await splinePoint(page, graph.links.int, 0.5);
                if (style === 'stepped') expect(distance(centre, native)).toBeGreaterThan(100);
                else expect(distance(centre, native)).toBeLessThan(12);
                await clickAt(page, centre);
                const menu = page.locator('.litecontextmenu');
                await expect(menu).toBeVisible({ timeout: 3000 });
                await expect(menu).toContainText('Add Reroute');
                await expect(menu).toContainText('Delete');
            });
        });
    }

    test('shift-dragging a link starts a connection', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const [x, y] = await toClient(page, await slotPoint(page, graph.links.int, 0.25));
        await page.mouse.move(x, y);
        await page.keyboard.down('Shift');
        await page.mouse.down();
        await page.mouse.move(x + 120, y + 40, { steps: 8 });
        const connecting = await page.evaluate(() => window.app.canvas.linkConnector.isConnecting);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        expect(connecting).toBe(true);
    });

    test('alt-clicking a link adds a reroute on it', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const point = await slotPoint(page, graph.links.int, 0.25);
        const [x, y] = await toClient(page, point);
        await page.keyboard.down('Alt');
        await page.mouse.click(x, y);
        await page.keyboard.up('Alt');
        const reroutes = await page.evaluate(() => [...window.app.graph.reroutes.values()].map((r) => ({ id: r.id, pos: [...r.pos] })));
        expect(reroutes).toHaveLength(1);
        expect(distance(reroutes[0].pos as Point, point)).toBeLessThan(2);
        expect(await page.evaluate((id) => window.app.graph.getLink(id).parentId, graph.links.int)).toBe(reroutes[0].id);
    });

    test('dragging a reroute moves it', async ({ page }) => {
        const graph = await buildGraph(page, graphs.rerouted);
        await redraw(page);
        const before = await reroutePos(page, graph.reroutes.float);
        const [x, y] = await toClient(page, before);
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 60, y + 40, { steps: 8 });
        await page.mouse.up();
        const after = await reroutePos(page, graph.reroutes.float);
        expect(after[0] - before[0]).toBeCloseTo(60, 0);
        expect(after[1] - before[1]).toBeCloseTo(40, 0);
    });

    test('dropping a moved input link on the canvas opens the search box', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        // 1.57 opens a dialog, 1.39.5 a search popup.
        const searchBox = page.getByRole('dialog').or(page.getByRole('search')).first();
        await expect(searchBox).toBeHidden();
        const [x, y] = await toClient(page, await slotPoint(page, graph.links.int, 1));
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - 150, y + 250, { steps: 20 });
        await page.mouse.up();
        await expect(searchBox).toBeVisible({ timeout: 3000 });
        expect(await page.evaluate((id) => !!window.app.graph.getLink(id), graph.links.int)).toBe(true);
    });
});

test.describe('link rendering', () => {
    test('reroutes are drawn on their links', async ({ page }) => {
        const graph = await buildGraph(page, graphs.rerouted);
        await redraw(page);
        const reroute = await reroutePos(page, graph.reroutes.float);
        // Inside the disc's inner ring and off the link through its centre: the reroute colour under the ring's '#ffffff55' (Reroute.draw).
        const disc = await page.evaluate((id) => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            ctx.fillStyle = window.app.canvas.graph.reroutes.get(id).colour;
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillStyle = '#ffffff55';
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
        }, graph.reroutes.float);
        const inside: number[][] = [];
        for (const [dx, dy] of [[0, -5], [0, 5], [-4, -4], [4, 4]]) inside.push(await pixelAt(page, [reroute[0] + dx, reroute[1] + dy]));
        expect(inside.every((pixel) => near(pixel, disc, 20)), `drawn ${inside.join(' / ')}, disc ${disc}`).toBe(true);
        const drawn = await pixelAt(page, reroute);
        const [blank] = await blankPixels(page, [reroute]);
        expect(drawn).not.toEqual(blank);
    });

    test('a floating link renders as a disabled segment to its reroute', async ({ page }) => {
        const graph = await buildGraph(page, graphs.floating);
        expect(await page.evaluate(() => window.app.graph.floatingLinks.size)).toBe(1);
        await resetProbe(page);
        await redraw(page);
        const { back, segments } = await readProbe(page);
        const floating = segments.filter((s) => s.disabled);
        expect(floating).toHaveLength(back);
        expect(floating[0].b).toEqual(await reroutePos(page, graph.reroutes.int));
    });

    test('subgraph IO links render inside the subgraph', async ({ page }) => {
        const graph = await buildGraph(page, graphs.subgraph);
        test.skip(graph.subgraph === null, 'this frontend cannot convert to subgraphs');
        await openSubgraph(page, graph.subgraph!);
        await resetProbe(page);
        await redraw(page);
        const { back, segments } = await readProbe(page);
        expect(segments.filter((s) => s.origin === -10)).toHaveLength(back);
        expect(segments.filter((s) => s.target === -20)).toHaveLength(back);
    });

    test('Hidden link render mode draws no links', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await setSetting(page, 'Comfy.LinkRenderMode', -1);
        await expect.poll(() => page.evaluate(() => window.app.canvas.links_render_mode)).toBe(-1);
        await redraw(page);
        const centre = await slotPoint(page, graph.links.int, 0.5);
        const drawn = await pixelAt(page, centre);
        const [blank] = await blankPixels(page, [centre]);
        expect(drawn).toEqual(blank);
    });

    test('Straight and Linear render modes draw the native paths', async ({ page }) => {
        const graph = await buildGraph(page, graphs.diagonal);
        const colour = await linkColour(page, graph.links.int);
        const [a, b] = [await slotPoint(page, graph.links.int, 0), await slotPoint(page, graph.links.int, 1)];
        // Straight runs through a vertical segment halfway across; Linear is a diagonal between points 15 px out from the slots.
        const straight: Point = [(a[0] + b[0]) / 2, a[1] + (b[1] - a[1]) / 4];
        const linear: Point = [a[0] + 15 + (b[0] - a[0] - 30) / 4, a[1] + (b[1] - a[1]) / 4];
        const wrong: string[] = [];
        for (const [mode, value, point] of [['Straight', 0, straight], ['Linear', 1, linear]] as const) {
            await setSetting(page, 'Comfy.LinkRenderMode', value);
            await expect.poll(() => page.evaluate(() => window.app.canvas.links_render_mode)).toBe(value);
            await redraw(page);
            const drawn = await pixelAt(page, point);
            if (!near(drawn, colour)) wrong.push(`${mode}: drawn ${drawn}, link colour ${colour}`);
        }
        expect(wrong).toEqual([]);
    });

    test('link centre markers are drawn', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        expect(await page.evaluate(() => window.app.canvas.linkMarkerShape)).toBe(1);
        // The circle marker has a 5 px radius, wider than the link and its border.
        const [x, y] = await slotPoint(page, graph.links.int, 0.5);
        const [drawn, colour] = [await pixelAt(page, [x, y - 4]), await linkColour(page, graph.links.int)];
        expect(near(drawn, colour), `drawn ${drawn}, link colour ${colour}`).toBe(true);
    });

    test('selecting a node paints its links white', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const centre = await slotPoint(page, graph.links.int, 0.5);
        expect(await pixelAt(page, centre)).not.toEqual(WHITE);

        await clickAt(page, await titleOf(page, graph.nodes.target));
        await expect.poll(() => page.evaluate((id) => !!window.app.canvas.highlighted_links[id], graph.links.int)).toBe(true);
        await redraw(page);
        const drawn = await pixelAt(page, centre);
        expect(near(drawn, WHITE), `drawn ${drawn}`).toBe(true);
    });

    test('links are painted in their native colours', async ({ page }) => {
        const graph = await buildGraph(page, graphs.typed);
        // Classic Flow's markers glide along the links with a dark halo, and could pass under a sampled point.
        await setSetting(page, '🔗 Enhanced Links.Marker.Enabled', false);
        await redraw(page);
        const wrong: string[] = [];
        // The middle holds the centre marker, in the link colour; the link's own body shows on either side of it.
        for (const [name, id] of Object.entries(graph.links)) {
            const colour = await linkColour(page, id);
            for (const t of [0.3, 0.5, 0.7]) {
                const drawn = await pixelAt(page, await splinePoint(page, id, t));
                if (!near(drawn, colour)) wrong.push(`${name} at ${t}: drawn ${drawn}, link colour ${colour}`);
            }
        }
        expect(wrong).toEqual([]);
    });

    test('links to collapsed nodes render', async ({ page }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        await redraw(page);
        const colour = await linkColour(page, graph.links.collapsed);
        const drawn: number[][] = [];
        for (const t of [0.25, 0.5, 0.75]) drawn.push(await pixelAt(page, await splinePoint(page, graph.links.collapsed, t)));
        expect(drawn.every((pixel) => near(pixel, colour)), `drawn ${drawn.join(' / ')}, link colour ${colour}`).toBe(true);
    });

    test('links to bypassed and muted nodes render', async ({ page }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        await redraw(page);
        for (const [name, id] of [['bypassed', graph.links.bypassed], ['muted', graph.links.muted]] as const) {
            const [drawn, colour] = [await pixelAt(page, await slotPoint(page, id, 0.5)), await linkColour(page, id)];
            expect(near(drawn, colour), `${name}: drawn ${drawn}, link colour ${colour}`).toBe(true);
        }
    });

    test('a hidden link is not drawn and shows its badges', async ({ page, frontend }) => {
        test.skip(!since157(frontend), 'links can be hidden from 1.57');
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const id = graph.links.int;
        const [a, b, centre] = [await slotPoint(page, id, 0), await slotPoint(page, id, 1), await slotPoint(page, id, 0.5)];
        await page.evaluate((id) => {
            const { canvas } = window.app;
            const rect = canvas.canvas.getBoundingClientRect();
            canvas.showLinkMenu(canvas.graph.getLink(id), new PointerEvent('pointerdown', { clientX: rect.left + 600, clientY: rect.top + 200 }));
        }, id);
        await page.locator('.litecontextmenu').getByText('Hide Link').click();
        await redraw(page);
        const colour = await linkColour(page, id);
        // Each badge starts 14 px beyond its slot and is 18 px tall, so these points miss a link between the slots.
        const badges = [await pixelAt(page, [a[0] + 19, a[1] - 6]), await pixelAt(page, [b[0] - 19, b[1] - 6])];
        const drawn = await pixelAt(page, centre);
        const [blank] = await blankPixels(page, [centre]);
        expect(badges.every((badge) => near(badge, colour)), `badges ${badges.join(' / ')}, link colour ${colour}`).toBe(true);
        expect(drawn).toEqual(blank);
    });
});

test.describe('node menus', () => {
    const NODE: GraphSpec = { nodes: { node: { type: 'ELNInt', pos: [400, 300] } } };

    /** The node's own Enhanced choices, and whether the workflow counts as changed once its tracker has looked. */
    const state = (page: Page, nodeId: number) => page.evaluate((id) => {
        const { app } = window;
        const workflow = app.extensionManager.workflow.activeWorkflow;
        const tracker = workflow.changeTracker;
        (tracker.captureCanvasState ?? tracker.checkState).call(tracker);
        const { properties } = app.canvas.graph.getNodeById(id);
        return { own: Object.fromEntries(Object.entries(properties).filter(([key]) => key.startsWith('enhanced_fx_'))), modified: Boolean(workflow.isModified) };
    }, nodeId);

    /** Loads `workflow`, or the graph as it stands, as a workflow fresh from its file. */
    const load = (page: Page, workflow?: object) => page.evaluate(async (data) => {
        const { app } = window;
        await app.loadGraphData(data ?? app.graph.serialize(), true, false);
    }, workflow);

    test('Node FX and Completion FX set the node, ticked, and Use global takes it back', async ({ page, profile }) => {
        test.skip(!enabled(profile), "the menus are the extension's");
        const graph = await buildGraph(page, NODE);
        const pick = async (submenu: string, entry: string) => {
            const [x, y] = await toClient(page, await titleOf(page, graph.nodes.node));
            await page.mouse.click(x, y, { button: 'right' });
            await page.locator('.litecontextmenu .litemenu-entry', { hasText: submenu }).click();
            await page.locator('.litecontextmenu').last().locator('.litemenu-entry', { hasText: entry }).click();
            await expect(page.locator('.litecontextmenu')).toHaveCount(0);
        };
        await load(page);
        expect(await state(page, graph.nodes.node)).toEqual({ own: {}, modified: false });
        await pick('Node FX', 'Neon Nexus');
        await pick('Completion FX', 'Exclude');
        await expect.poll(() => state(page, graph.nodes.node)).toEqual({ own: { enhanced_fx_style: 2, enhanced_fx_completion: 'exclude' }, modified: true });
        // The choice is ticked; Use global takes it back out.
        const [x, y] = await toClient(page, await titleOf(page, graph.nodes.node));
        await page.mouse.click(x, y, { button: 'right' });
        await page.locator('.litecontextmenu .litemenu-entry', { hasText: 'Node FX' }).click();
        const submenu = page.locator('.litecontextmenu').last();
        await expect(submenu.locator('.litemenu-entry', { hasText: 'Neon Nexus' })).toHaveText('✓ Neon Nexus');
        await submenu.locator('.litemenu-entry', { hasText: 'Use global' }).click();
        await pick('Completion FX', 'Use global');
        expect((await state(page, graph.nodes.node)).own).toEqual({});
    });

    test.describe('in Vue nodes mode', () => {
        test.use({ settings: { 'Comfy.VueNodes.Enabled': true } });

        test('the Vue node menu shows them too, and a pick sets the node', async ({ page, profile }) => {
            test.skip(!enabled(profile), "the menus are the extension's");
            const graph = await buildGraph(page, NODE);
            const node = page.locator(`.lg-node[data-node-id="${graph.nodes.node}"]`);
            await expect(node).toHaveCount(1);
            await node.click({ button: 'right', position: { x: 60, y: 12 } });
            await page.getByRole('menuitem', { name: 'Node FX' }).hover();
            await page.getByRole('menuitem', { name: 'Cosmic Ripple' }).click();
            await expect.poll(async () => (await state(page, graph.nodes.node)).own).toEqual({ enhanced_fx_style: 3 });
        });
    });

    test('a workflow that holds the choices loads without a write, and is not marked modified', async ({ page }) => {
        const graph = await buildGraph(page, NODE);
        const own = { enhanced_fx_style: 4, enhanced_fx_particles_only: true, enhanced_fx_completion: 'primary' };
        const workflow = await page.evaluate(([id, own]) => {
            const data = window.app.graph.serialize();
            const node = data.nodes.find((n: { id: number }) => Number(n.id) === id);
            node.properties = { ...node.properties, ...own };
            return data;
        }, [graph.nodes.node, own] as const);
        await load(page, workflow);
        // Drawn a while, with Sacred Rosette on the node.
        await redraw(page);
        await page.waitForTimeout(1000);
        expect(await state(page, graph.nodes.node)).toEqual({ own, modified: false });
    });
});

test.describe('fireworks', () => {
    test.use({ settings: { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Completion.Style': 'fireworks' } });

    test('light up over the output node after a run, then the canvas goes quiet', async ({ page, profile }) => {
        test.skip(!enabled(profile), "the fireworks are the extension's");
        test.setTimeout(90_000);
        await buildGraph(page, { nodes: { sleep: { type: 'ELNSleep', pos: [400, 400], widgets: [0.2] } } });
        await settle(page);
        // Where the first burst's white-hot core opens: 5 % of the view right of the node and 20 % above it.
        const core: Point = await page.evaluate(() => {
            const { canvas } = window.app;
            const [node] = canvas.graph.nodes;
            return [node.pos[0] + canvas.visible_area[2] * 0.05, node.pos[1] - canvas.visible_area[3] * 0.2];
        });
        const before = await pixelAt(page, core);
        // The brightest the core gets while the show plays, sampled each frame from the run's success on.
        const brightest = page.evaluate(([x, y]) => new Promise<number[]>((resolve) => {
            const { app } = window;
            app.api.addEventListener('execution_success', () => {
                const el: HTMLCanvasElement = app.canvas.canvas;
                const [cx, cy] = app.canvas.ds.convertOffsetToCanvas([x, y]);
                const ratio = el.width / el.clientWidth;
                let best = [0, 0, 0, 0];
                const until = performance.now() + 1500;
                const sample = () => {
                    const pixel = [...el.getContext('2d')!.getImageData(Math.floor(cx * ratio), Math.floor(cy * ratio), 1, 1).data];
                    if (pixel[0] + pixel[1] + pixel[2] > best[0] + best[1] + best[2]) best = pixel;
                    if (performance.now() < until) requestAnimationFrame(sample);
                    else resolve(best);
                };
                requestAnimationFrame(sample);
            }, { once: true });
        }), core);
        await page.evaluate(() => window.app.queuePrompt(0, 1));
        const lit = await brightest;
        expect(lit.slice(0, 3).every((c, i) => c > before[i] + 100), `before ${before}, brightest ${lit}`).toBe(true);
        // The show is over within its 1.2 s: then nothing repaints.
        expect(await settle(page, 500, 5000)).toBe(true);
        expect(await paints(page, 2000)).toMatchObject({ front: 0, back: 0 });
    });
});

test.describe('Vue nodes', () => {
    test.use({ settings: { 'Comfy.VueNodes.Enabled': true } });

    test('links start and end at the slot dots', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
        await recordConnectionPos(page);
        // The DOM settles after the nodes mount, so poll until the drawn ends meet the dots.
        await expect.poll(async () => {
            await resetProbe(page);
            await redraw(page);
            const ends = await drawnLinkEnds(page, graph.links.int);
            if (!ends) return Infinity;
            const [source, target] = [await vueSlotCentres(page, graph.nodes.source), await vueSlotCentres(page, graph.nodes.target)];
            return Math.max(distance(ends[0], source.outputs[0]), distance(ends[1], target.inputs[0]));
        }, { message: 'px between the drawn link ends and the slot dots', timeout: 5000 }).toBeLessThan(3);
        // What shows next to the dots is the link: with the extension, the body it draws where native would have.
        const colour = await linkColour(page, graph.links.int);
        await expect.poll(async () => {
            await redraw(page);
            const [source, target] = [await vueSlotCentres(page, graph.nodes.source), await vueSlotCentres(page, graph.nodes.target)];
            const [out, into] = [source.outputs[0], target.inputs[0]];
            const drawn: number[][] = [];
            for (const point of [[out[0] + 8, out[1]], [out[0] + 14, out[1]], [into[0] - 8, into[1]], [into[0] - 14, into[1]]] as Point[]) drawn.push(await pixelAt(page, point));
            return drawn.filter((pixel) => !near(pixel, colour)).length;
        }, { message: 'pixels next to the slot dots not in the link colour', timeout: 5000 }).toBe(0);
    });
});

test.describe('redraws', () => {
    test.describe('with nothing animated', () => {
        test.use({ settings: { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 0 } });

        test('an idle canvas does not repaint', async ({ page }) => {
            await buildGraph(page, graphs.mixed);
            expect(await settle(page)).toBe(true);
            expect(await paints(page, 3000)).toMatchObject({ front: 0, back: 0 });
        });
    });

    test('an animated look repaints only the front canvas, at most once a frame', async ({ page, profile }) => {
        test.skip(!enabled(profile), 'nothing animates without the extension');
        await buildGraph(page, graphs.mixed);
        await redraw(page);
        // Let the paints that building the graph asked for finish.
        await page.waitForTimeout(500);
        const { front, back, seconds } = await paints(page, 3000);
        expect(back).toBe(0);
        expect(front / seconds).toBeGreaterThan(0);
        // A 60 fps cap, plus one frame.
        expect(front / seconds).toBeLessThanOrEqual(61);
    });

    // These keep the default animated look, which must still stop repainting.
    test.describe('in Static mode', () => {
        test.use({ settings: { '🔗 Enhanced Links.Static.Mode': true } });

        test('the canvas stops repainting after the static frame', async ({ page }) => {
            const graph = await buildGraph(page, graphs.mixed);
            await settle(page, 500, 5000);
            const painted = await paints(page, 3000);
            expect(painted).toMatchObject({ front: 0, back: 0 });
            await expectLinkShown(page, graph.links.int);
        });
    });

    test.describe('with reduced motion', () => {
        test.use({ contextOptions: { reducedMotion: 'reduce' } });

        test('the canvas does not repaint', async ({ page }) => {
            expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
            const graph = await buildGraph(page, graphs.mixed);
            await settle(page, 500, 5000);
            const painted = await paints(page, 3000);
            expect(painted).toMatchObject({ front: 0, back: 0 });
            await expectLinkShown(page, graph.links.int);
        });
    });

    test.describe('with Disable animations on', () => {
        test.use({ settings: { 'Comfy.Appearance.DisableAnimations': true } });

        test('the canvas does not repaint', async ({ page, frontend }) => {
            test.skip(!since157(frontend), 'the setting arrived in 1.43');
            const graph = await buildGraph(page, graphs.mixed);
            await settle(page, 500, 5000);
            expect(await paints(page, 3000)).toMatchObject({ front: 0, back: 0 });
            await expectLinkShown(page, graph.links.int);
        });
    });

    test('a view with nothing on screen does not repaint', async ({ page }) => {
        await buildGraph(page, graphs.mixed);
        await page.evaluate(() => {
            const { canvas } = window.app;
            canvas.ds.offset = [-20000, -20000];
            canvas.setDirty(true, true);
        });
        await settle(page, 500, 5000);
        const painted = await paints(page, 3000);
        expect(painted).toMatchObject({ front: 0, back: 0 });
    });

    test('paints read no settings', async ({ page }) => {
        await buildGraph(page, graphs.mixed);
        await resetProbe(page);
        for (let i = 0; i < 5; i++) await redraw(page);
        const { front, reads } = await readProbe(page);
        expect(front).toBeGreaterThan(0);
        expect(reads.inPaint).toBe(0);
    });

    test.describe('with an animated link style', () => {
        test.use({ settings: { '🔗 Enhanced Links.Animate': 4 } });

        test('animation continues inside a subgraph', async ({ page, profile }) => {
            test.skip(!enabled(profile), 'nothing animates without the extension');
            const graph = await buildGraph(page, graphs.subgraph);
            test.skip(graph.subgraph === null, 'this frontend cannot convert to subgraphs');
            expect((await paints(page, 1000)).front).toBeGreaterThan(0);
            await openSubgraph(page, graph.subgraph!);
            expect((await paints(page, 1000)).front).toBeGreaterThan(0);
        });
    });

    test('the extension logs no errors and makes no blocked requests', async ({ page, log }) => {
        await buildGraph(page, graphs.mixed);
        await page.waitForTimeout(2000);
        // A failed import or hook is logged from the frontend's own bundle, with our path or extension name in the text.
        const marks = ['/extensions/comfyui-enhancedlinksandnodes/', 'enhanced.link.animations', 'enhanced.node.animations'];
        const ours = (s: string) => marks.some((mark) => s.includes(mark));
        expect(log.counts.filter((m) => m.type === 'error' && (ours(m.url) || ours(m.text)))).toEqual([]);
        expect(log.errors.filter(ours)).toEqual([]);
        expect((await cspViolations(page)).filter((v) => ours(v.source))).toEqual([]);
    });
});
