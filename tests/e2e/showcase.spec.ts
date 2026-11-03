// example_workflows/showcase.json, which ComfyUI lists under the extension in its templates: core nodes only, no models
// or input files. Fetched from where the templates browser fetches it, it loads unmodified, runs in seconds, and nothing
// logs an error, with or without the extensions.
import { expect, openApp, pageErrors, test } from './helpers';

test('the showcase workflow loads from the extension’s templates and runs', async ({ page, log }) => {
    await openApp(page);
    const loaded = await page.evaluate(async () => {
        const { app } = window;
        const listed: Record<string, string[]> = await (await app.api.fetchApi('/workflow_templates')).json();
        const pack = Object.keys(listed).find((name) => listed[name].includes('showcase'));
        if (!pack) return null;
        const workflow = await (await fetch(app.api.apiURL(`/workflow_templates/${pack}/showcase.json`))).json();
        await app.loadGraphData(workflow, true, true, 'showcase');
        return { pack, nodes: app.canvas.graph.nodes.length, reroutes: app.canvas.graph.reroutes.size, groups: app.canvas.graph.groups.length };
    });
    expect(loaded).toEqual({ pack: 'comfyui-enhancedlinksandnodes', nodes: 13, reroutes: 1, groups: 1 });
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => {
        const workflow = window.app.extensionManager.workflow.activeWorkflow;
        const tracker = workflow.changeTracker;
        (tracker.captureCanvasState ?? tracker.checkState).call(tracker);
        return Boolean(workflow.isModified);
    })).toBe(false);

    // The run succeeds, and each preview node gets an image.
    const outcome = await page.evaluate(() => new Promise<string>((resolve) => {
        const { api } = window.app;
        const previews: number[] = [];
        api.addEventListener('executed', (e: CustomEvent) => e.detail.output?.images?.length && previews.push(Number(e.detail.display_node ?? e.detail.node)));
        api.addEventListener('execution_success', () => resolve(`success, previews ${previews.sort((a, b) => a - b)}`), { once: true });
        api.addEventListener('execution_error', (e: CustomEvent) => resolve(`error: ${JSON.stringify(e.detail)}`), { once: true });
        window.app.queuePrompt(0, 1);
    }));
    expect(outcome).toBe('success, previews 11,13');
    await page.waitForTimeout(1000);
    expect(pageErrors(log)).toEqual([]);
});
