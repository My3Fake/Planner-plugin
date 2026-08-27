import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import LifeFlowApp from "./app.jsx";

export const VIEW_TYPE = "lifeflow-view";

// Static keys the React app used to read/write via the private
// app.loadLocalStorage/saveLocalStorage API (vault-local browser storage,
// doesn't sync). Listed here once so the one-time migration below can pull
// any pre-existing data into the plugin's own data.json before the old
// storage is no longer consulted. Per-day notification "already fired"
// flags (lifeflow_notif_*) are intentionally not migrated: they're
// disposable dedupe markers, not user data.
const LEGACY_LOCAL_STORAGE_KEYS = [
	"lifeflow_data_v1",
	"lifeflow_sync_v1",
	"lifeflow_settings_v1",
	"lifeflow_ai_v1",
	"lifeflow_backups_v1",
];

/** Plain string->string map, JSON-serialised into data.json as-is (each
 * value is itself already a JSON string produced by the React app, so this
 * plugin doesn't need to know its shape). */
type LifeFlowData = Record<string, string>;

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
	/** In-memory cache of data.json, kept in sync so the React app (which
	 * expects synchronous localStorage-style get/set) never has to await. */
	data: LifeFlowData = {};
	private saveTimer: number | null = null;

	async onload() {
		this.data = ((await this.loadData()) as LifeFlowData) || {};
		await this.migrateLegacyLocalStorageIfNeeded();

		// Exposed so app.jsx's `storage` helper can read/write through the
		// plugin's own data.json instead of the private, non-syncing
		// app.loadLocalStorage/saveLocalStorage API it used before.
		(window as any).__lifeflowPlugin = this;

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
		if (this.saveTimer) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
			// flush synchronously-ish (fire and forget) so nothing is lost
			// if the plugin is disabled right after a change.
			void this.saveData(this.data);
		}
	}

	/** Synchronous read from the in-memory cache (mirrors the old
	 * localStorage.getItem contract that app.jsx's `storage` helper expects). */
	getDataValue(key: string): string | null {
		return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
	}

	/** Synchronous write to the in-memory cache + debounced persist to
	 * data.json, so rapid successive writes (e.g. typing) don't hit disk
	 * on every keystroke. */
	setDataValue(key: string, value: string) {
		this.data[key] = value;
		if (this.saveTimer) window.clearTimeout(this.saveTimer);
		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			void this.saveData(this.data);
		}, 400);
	}

	/** One-time migration (guarded by a flag stored inside data.json itself)
	 * that copies any pre-existing data from the old vault-local
	 * app.loadLocalStorage API into the new data.json, so upgrading this
	 * plugin doesn't silently wipe a user's tasks/settings. Safe to call
	 * every load: it's a no-op once the flag is set. */
	private async migrateLegacyLocalStorageIfNeeded() {
		if (this.data.__legacyLocalStorageMigrated === "1") return;
		try {
			const anyApp = this.app as any;
			if (typeof anyApp.loadLocalStorage === "function") {
				for (const key of LEGACY_LOCAL_STORAGE_KEYS) {
					if (this.data[key] !== undefined) continue; // don't clobber newer data.json data
					const legacyValue = anyApp.loadLocalStorage(key);
					if (legacyValue !== null && legacyValue !== undefined) {
						this.data[key] = legacyValue;
					}
				}
			}
		} catch (e) {
			// Private API missing/changed shape — nothing to migrate, and the
			// plugin should still work fine starting from an empty data.json.
		}
		this.data.__legacyLocalStorageMigrated = "1";
		await this.saveData(this.data);
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
