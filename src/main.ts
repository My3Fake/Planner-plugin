import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import LifeFlowApp from "./app.jsx";

export const VIEW_TYPE = "lifeflow-view";

export class LifeFlowView extends ItemView {
	root: ReactDOMClient.Root | null = null;

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "زندگی‌آرام";
	}

	getIcon() {
		return "sparkles";
	}

	async onOpen() {
		// exposed for legacy storage helpers inside app.jsx; will be removed
		// once storage is migrated fully to plugin.loadData/saveData (see PROGRESS.md)
		(window as any).__lifeflowObsidianApp = this.app;
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("lifeflow-plugin-host");
		const mountEl = container.createDiv();
		this.root = ReactDOMClient.createRoot(mountEl);
		this.root.render(React.createElement(LifeFlowApp));
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

export default class LifeFlowPlugin extends Plugin {
	async onload() {
		(window as any).__lifeflowObsidianApp = this.app;
		this.registerView(VIEW_TYPE, (leaf: WorkspaceLeaf) => new LifeFlowView(leaf));
		this.addRibbonIcon("sparkles", "باز کردن زندگی‌آرام", () => this.activateView());
		this.addCommand({
			id: "open-lifeflow",
			name: "باز کردن زندگی‌آرام",
			callback: () => this.activateView(),
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
}
