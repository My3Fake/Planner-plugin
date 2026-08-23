var main_exports = {};
__export(main_exports, {
  default: () => LifeFlowPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var ReactNS2 = __toESM(require_react());
var ReactDOMClient2 = __toESM(require_client());

var import_jalali = __toESM(require_jalali());

var VIEW_TYPE = "lifeflow-view";
var LifeFlowView = class extends import_obsidian.ItemView {
  constructor() {
    super(...arguments);
    this.root = null;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645";
  }
  getIcon() {
    return "sparkles";
  }
  async onOpen() {
    window.__lifeflowObsidianApp = this.app;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("lifeflow-plugin-host");
    const mountEl = container.createDiv();
    const AppComponent = window.LifeFlowApp;
    this.root = ReactDOMClient2.createRoot(mountEl);
    this.root.render(ReactNS2.createElement(AppComponent));
  }
  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
};
var LifeFlowPlugin = class extends import_obsidian.Plugin {
  async onload() {
    window.__lifeflowObsidianApp = this.app;
    this.registerView(VIEW_TYPE, (leaf) => new LifeFlowView(leaf));
    this.addRibbonIcon("sparkles", "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645", () => this.activateView());
    this.addCommand({
      id: "open-lifeflow",
      name: "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645",
      callback: () => this.activateView()
    });
  }
  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.detach());
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.development.js:
  (**
   * @license React
   * scheduler.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.development.js:
  (**
   * @license React
   * react-dom.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.development.js:
  (**
   * @license React
   * react-dom-client.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
