import { app } from "/scripts/app.js";
import { i as installStyle, c as checked, F as FROZEN, a as currentLook, B as BADGES, T as TITLE, b as TOGGLE_ALL, p as panelShown, S as SELECTION_FX, l as linkSettings, d as install, e as installPanel, f as installLinks, k as keyName, g as commandKeys, h as TOGGLE, j as keyText, r as running, t as toggleNodes, N, m as NODES_ON, n as toggleStatic, L, s as surpriseMe, o as showPanel, q as showPicker, u as LINKS_ON, v as toggleLinks, w as setting, x as shown, y as commit, z as selectedNodes, A as effects, C as pick, D as fireworks, E as resetEverything, G as DISABLED } from "./chunks/menus-BcXUDhho.js";
const SAY_MS = 2e3;
const HINT_MS = 5e3;
let said;
function say(text, ms = SAY_MS) {
  const { toast } = app.extensionManager;
  if ("info" in toast) said = toast.info(text, { id: said, duration: ms });
  else app.extensionManager.toast.add({ severity: "info", summary: text, life: ms });
}
const needs = (work, part) => () => {
  if (part ? running[part] : running.links || running.nodes) work();
  else say(part ? DISABLED[part] : `${TITLE} is disabled in Settings › Extensions.`, HINT_MS);
};
function next(id) {
  const { name, options } = setting(id);
  const option = options[(options.findIndex((o) => o.value === shown(id)) + 1) % options.length];
  commit(id, option.value);
  say(`${name}: ${option.text}`);
}
function toggleAll() {
  const on = !(L.enabled || N.enabled);
  if (L.enabled !== on) toggleLinks();
  if (N.enabled !== on) toggleNodes();
  const key = keyName(TOGGLE_ALL);
  say(on ? "Effects on" : key ? `Effects off — ${key} to restore` : "Effects off");
}
function stepSelection() {
  const nodes2 = selectedNodes();
  if (!nodes2.length) return say("Select a node first");
  const list = effects();
  const effect = list[(list.findIndex((e) => nodes2.every(e.has)) + 1) % list.length];
  pick(nodes2, effect.choices);
  say(`${nodes2.length} ${nodes2.length === 1 ? "node" : "nodes"}: ${effect.name}`);
}
function preview() {
  const { canvas } = app;
  const area = canvas.visible_area;
  const nodes2 = selectedNodes();
  const outputs = canvas.visible_nodes.filter((node) => node.constructor.nodeData?.output_node);
  const middle = { id: "view", pos: [area[0] + area[2] / 2, area[1] + area[3] / 2], graph: canvas.graph };
  fireworks(nodes2.length ? nodes2 : outputs.length ? outputs : [middle], `preview ${Date.now()}`);
}
async function resetAll() {
  const sure = await app.extensionManager.dialog.confirm({
    title: `Reset ${TITLE}`,
    message: `Every ${TITLE} setting goes back to its default, and the look to Subtle. You can undo it right after.`
  });
  if (sure) resetEverything();
}
const ID = "EnhancedLinksNodes.";
const panel = {
  id: `${ID}ShowPanel`,
  label: `Show ${TITLE} panel`,
  menubarLabel: "Panel",
  category: "view-controls",
  icon: "eln-icon",
  active: panelShown,
  function: needs(showPanel)
};
const all = {
  id: TOGGLE_ALL,
  label: "Toggle all effects",
  menubarLabel: "All effects",
  category: "essentials",
  icon: "pi pi-sparkles",
  active: () => checked(LINKS_ON) || checked(NODES_ON),
  function: needs(toggleAll)
};
const links = {
  id: `${ID}ToggleLinks`,
  label: "Toggle link effects",
  menubarLabel: "Link effects",
  category: "view-controls",
  icon: "pi pi-link",
  active: () => checked(LINKS_ON),
  function: needs(() => {
    toggleLinks();
    say(L.enabled ? "Link effects on" : "Link effects off");
  }, "links")
};
const nodes = {
  id: `${ID}ToggleNodes`,
  label: "Toggle node effects",
  menubarLabel: "Node effects",
  category: "view-controls",
  icon: "pi pi-objects-column",
  active: () => checked(NODES_ON),
  function: needs(() => {
    toggleNodes();
    say(N.enabled ? "Node effects on" : "Node effects off");
  }, "nodes")
};
const frozen = {
  id: `${ID}ToggleStatic`,
  label: "Freeze / unfreeze animation",
  menubarLabel: "Freeze animation",
  category: "view-controls",
  icon: "pi pi-pause",
  active: () => FROZEN.every(checked),
  function: needs(() => {
    toggleStatic();
    say(L.staticMode ? "Animation frozen" : "Animation unfrozen");
  })
};
const look = {
  id: `${ID}ChooseLook`,
  label: "Choose a look…",
  menubarLabel: "Choose look…",
  category: "view-controls",
  icon: "pi pi-palette",
  function: needs(showPicker)
};
const surprise = {
  id: `${ID}SurpriseMe`,
  label: "Surprise me (random look)",
  menubarLabel: "Surprise me",
  icon: "pi pi-star",
  function: needs(surpriseMe)
};
const commands = [
  panel,
  all,
  links,
  nodes,
  frozen,
  {
    id: `${ID}NextLinkStyle`,
    label: "Next link animation",
    category: "view-controls",
    icon: "pi pi-forward",
    function: needs(() => next("🔗 Enhanced Links.Animate"), "links")
  },
  {
    id: `${ID}NextNodeStyle`,
    label: "Next node effect",
    category: "view-controls",
    icon: "pi pi-forward",
    function: needs(() => next("📦 Enhanced Nodes.Animate"), "nodes")
  },
  look,
  surprise,
  { id: SELECTION_FX, label: "Cycle node effect for selection", icon: "pi pi-sparkles", mutatesGraph: true, function: needs(stepSelection, "nodes") },
  { id: `${ID}PreviewCompletion`, label: "Preview completion effect", icon: "pi pi-play", function: needs(preview, "nodes") },
  { id: `${ID}ResetAll`, label: `Reset all ${TITLE} settings…`, icon: "pi pi-refresh", function: needs(() => void resetAll()) }
];
const KEYS = [
  { commandId: TOGGLE, combo: { key: "l", alt: true } },
  { commandId: TOGGLE, combo: { key: "¬", alt: true } },
  { commandId: TOGGLE_ALL, combo: { key: "k", alt: true } },
  { commandId: TOGGLE_ALL, combo: { key: "˚", alt: true } }
];
const run = (command) => () => void app.extensionManager.command.execute(command.id);
const ext = {
  name: "enhanced.link.animations",
  settings: linkSettings,
  commands,
  // Read once as the extension registers, after ComfyUI's own keys and those of the extensions registered before
  // it. A key bound twice is an error toast (FE157 platform/keybindings/keybindingStore.ts L121-140, wrapped at
  // services/extensionService.ts L42-49), so the keys a command has already are left out.
  get keybindings() {
    const taken = new Set(commandKeys().values());
    return KEYS.filter(({ combo }) => !taken.has(keyText(combo)));
  },
  // Two groups, which the menu parts with a separator (FE157 stores/menuItemStore.ts L61-65); checks come from active().
  menuCommands: [
    { path: ["View", TITLE], commands: [panel.id, look.id, surprise.id] },
    { path: ["View", TITLE], commands: [all.id, links.id, nodes.id, frozen.id] }
  ],
  // Drawn as it was given, so its icon stays as it is; the tooltip is read whenever the bar draws.
  actionBarButtons: [{
    icon: "eln-icon",
    get tooltip() {
      const key = keyName(TOGGLE_ALL);
      return key ? `${all.label} (${key})` : all.label;
    },
    onClick: run(all)
  }],
  aboutPageBadges: BADGES,
  // One item with one submenu level. The switches show their state in their text: the canvas menu has no checks.
  getCanvasMenuItems: () => [{
    content: "Enhanced FX",
    has_submenu: true,
    submenu: {
      options: [
        ...[links, nodes, frozen].map((c) => ({ content: `${c.active() ? "☑" : "☐"} ${c.menubarLabel}`, callback: run(c) })),
        { content: `Look: ${currentLook()?.name ?? "Custom"}…`, callback: run(look) },
        { content: surprise.menubarLabel, callback: run(surprise) },
        { content: "Open panel", callback: run(panel) }
      ]
    }
  }],
  async setup() {
    install();
    installPanel("links");
    installLinks();
    console.log("[EnhancedLinks] Extension registered with full batched rendering pipeline.");
  }
};
installStyle();
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
