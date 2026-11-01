import { app } from "/scripts/app.js";
import { l as linkSettings, i as install, a as installPanel, b as installLinks } from "./chunks/sidebar-DL7e4t_v.js";
const ext = {
  name: "enhanced.link.animations",
  settings: linkSettings,
  async setup() {
    install();
    installPanel("links");
    installLinks();
    console.log("[EnhancedLinks] Extension registered with full batched rendering pipeline.");
  }
};
app.registerExtension(ext);
//# sourceMappingURL=link_animations.js.map
