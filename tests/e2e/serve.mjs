// Starts one e2e leg from legs.json: an isolated ComfyUI whose --base-directory is a fresh temp dir,
// so custom_nodes, user, input, output and temp all live there. Without it, startup would rmtree the
// live ComfyUI/temp. custom_nodes holds symlinks (unlinked before the dir is removed) and, for a leg
// with a `commit`, this repo's __init__.py and js/ as of that commit.
//
//   node tests/e2e/serve.mjs <leg>        (COMFYUI_DIR defaults to the ComfyUI this repo sits in)
//
// --multi-user gives every leg a `default` user (extensions enabled) and a `native` one (both disabled);
// each test clones one into a fresh user.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const COMFY = process.env.COMFYUI_DIR ?? path.resolve(REPO, '../..');
// The author's own ComfyUI listens on 8188; the harness keeps to its own range.
const PORTS = [8199, 8205];

const SETTINGS = {
    'Comfy.TutorialCompleted': true,
    'Comfy.Notification.ShowVersionUpdates': false,
    'Comfy.VersionCompatibility.DisableWarnings': true,
    'Comfy.Workflow.ShowMissingNodesWarning': false,
    'Comfy.Workflow.ShowMissingModelsWarning': false,
    'Comfy.ErrorSystem.ShowMissingModels': false,
    'Comfy.Window.UnloadConfirmation': false,
    'Comfy.Minimap.Visible': false,
    'Comfy.Locale': 'en',
    'Comfy.VueNodes.Enabled': false,
    'Comfy.LinkRenderMode': 2,
    'Comfy.Graph.LinkMarkers': 1,
    'Comfy.LinkRelease.Action': 'search box',
    'Comfy.LinkRelease.ActionShift': 'context menu',
};

// `default` also answers the requests the frontend sends before it knows its user.
const PROFILES = {
    default: { 'Comfy.Extension.Disabled': [] },
    native: { 'Comfy.Extension.Disabled': ['enhanced.link.animations', 'enhanced.node.animations'] },
};

const legs = JSON.parse(fs.readFileSync(path.join(HERE, 'legs.json'), 'utf8'));
const name = process.argv[2];
const leg = legs[name];
if (!leg) {
    console.error(`usage: node tests/e2e/serve.mjs <${Object.keys(legs).join('|')}>`);
    process.exit(2);
}
if (!(leg.port >= PORTS[0] && leg.port <= PORTS[1])) {
    console.error(`[eln-e2e] port ${leg.port} of ${name} is outside ${PORTS.join('-')}`);
    process.exit(2);
}
// main.py always loads this file from beside itself, and no flag overrides the custom_nodes paths it adds.
const extraPaths = path.join(path.dirname(fs.realpathSync(path.join(COMFY, 'main.py'))), 'extra_model_paths.yaml');
if (fs.existsSync(extraPaths) && /^\s*custom_nodes\s*:/m.test(fs.readFileSync(extraPaths, 'utf8'))) {
    console.error(`[eln-e2e] ${extraPaths} adds custom_nodes paths that --base-directory cannot override, so every leg would load those packs`);
    process.exit(2);
}

await new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => {
        console.error(`[eln-e2e] port ${leg.port} is already in use`);
        process.exit(1);
    });
    probe.listen(leg.port, '127.0.0.1', () => probe.close(resolve));
});

const base = fs.mkdtempSync(path.join(os.tmpdir(), `eln-e2e-${name}-`));
const nodesDir = path.join(base, 'custom_nodes');
const logPath = path.join(base, 'comfyui.log');

function removeBase() {
    if (!fs.existsSync(base)) return;
    if (fs.existsSync(nodesDir)) {
        for (const entry of fs.readdirSync(nodesDir)) {
            const p = path.join(nodesDir, entry);
            if (fs.lstatSync(p).isSymbolicLink()) fs.unlinkSync(p);
        }
    }
    fs.rmSync(base, { recursive: true, force: true });
}

let child;
process.on('exit', () => {
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    removeBase();
});
// Installed before the synchronous setup below, so a signal during it waits for the first await instead
// of killing the process before the exit handler can clean up.
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => stop(0));

fs.mkdirSync(nodesDir);
fs.symlinkSync(path.join(HERE, 'fixtures/nodes/eln_e2e'), path.join(nodesDir, 'eln_e2e'));
if (leg.commit) {
    const pack = path.join(nodesDir, `eln-${leg.commit}`);
    fs.mkdirSync(pack);
    execFileSync('tar', ['-x', '-f', '-', '-C', pack], { input: execFileSync('git', ['-C', REPO, 'archive', leg.commit, '__init__.py', 'js']) });
} else {
    fs.symlinkSync(REPO, path.join(nodesDir, 'comfyui-enhancedlinksandnodes'));
}
for (const pack of leg.packs ?? []) {
    fs.symlinkSync(path.join(COMFY, 'custom_nodes', pack), path.join(nodesDir, pack));
}

const userDir = path.join(base, 'user');
fs.mkdirSync(userDir);
fs.writeFileSync(path.join(userDir, 'users.json'), JSON.stringify(Object.fromEntries(Object.keys(PROFILES).map((p) => [p, p]))));
for (const [profile, settings] of Object.entries(PROFILES)) {
    fs.mkdirSync(path.join(userDir, profile));
    fs.writeFileSync(path.join(userDir, profile, 'comfy.settings.json'), JSON.stringify({ ...SETTINGS, ...settings }, null, 4));
}

// The whitelist keeps packs that any other custom_nodes path adds from importing or running prestartup scripts.
const args = [
    'main.py', '--cpu', '--listen', '127.0.0.1', '--port', String(leg.port), '--disable-auto-launch', '--offline',
    '--base-directory', base, '--database-url', 'sqlite:///:memory:', '--multi-user',
    '--disable-all-custom-nodes', '--whitelist-custom-nodes', ...fs.readdirSync(nodesDir),
];
if (leg.frontendRoot) args.push('--front-end-root', path.join(COMFY, leg.frontendRoot));

const log = fs.openSync(logPath, 'w');
child = spawn(path.join(COMFY, 'venv/bin/python'), args, {
    cwd: COMFY,
    stdio: ['ignore', log, log],
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUNBUFFERED: '1' },
});
const exited = new Promise((resolve) => child.once('exit', resolve));

function logTail() {
    return fs.readFileSync(logPath, 'utf8').split('\n').slice(-40).join('\n');
}

async function stop(code) {
    if (stopping) return;
    stopping = true;
    if (child && child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM');
        const kill = setTimeout(() => child.kill('SIGKILL'), 10_000);
        await exited;
        clearTimeout(kill);
    }
    removeBase();
    process.exit(code);
}

exited.then(() => {
    if (stopping) return;
    console.error(`[eln-e2e] ComfyUI (${name}) exited:\n${logTail()}`);
    stop(1);
});

// Playwright passes its own pid, so a killed runner cannot leave the server listening.
const parent = Number(process.env.ELN_E2E_PARENT ?? process.ppid);
setInterval(() => {
    try {
        process.kill(parent, 0);
    } catch {
        stop(0);
    }
}, 1000).unref();

const url = `http://127.0.0.1:${leg.port}/`;
const deadline = Date.now() + 180_000;
for (;;) {
    const ok = await fetch(url, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok, () => false);
    if (ok) break;
    if (Date.now() > deadline) {
        console.error(`[eln-e2e] ComfyUI (${name}) did not answer within 180 s:\n${logTail()}`);
        await stop(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
}
console.log(`[eln-e2e] ${name} ready at ${url} (base ${base})`);
