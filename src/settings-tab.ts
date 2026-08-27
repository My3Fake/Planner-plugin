import { App, PluginSettingTab, Setting } from "obsidian";
import type LifeFlowPlugin from "./main";

// Mirrors the shape app.jsx's loadSettings()/DEFAULT_FEATURES/DEFAULT_NOTIFICATIONS
// produce, so this native tab and the in-app React SettingsModal read/write the
// exact same data.json key and stay in sync (see main.ts's LEGACY_LOCAL_STORAGE_KEYS
// list + PROGRESS.md "کار ۲" notes for the storage bridge this relies on).
const SETTINGS_KEY = "lifeflow_settings_v1";
const AI_CONFIG_KEY = "lifeflow_ai_v1";

interface LifeFlowSettings {
	theme: string;
	language: string;
	notifications: {
		taskReminders: boolean;
		pomodoroEnd: boolean;
		learningDeadlines: boolean;
		dailyDigest: boolean;
		dndDuringFocus: boolean;
	};
	features: {
		showMatrix: boolean;
		tabs: {
			planning: boolean;
			calendar: boolean;
			study: boolean;
			fitness: boolean;
			learning: boolean;
			pomodoro: boolean;
			notes: boolean;
		};
	};
	taskDefaults: {
		quad: string;
		priority: number;
		daypart: string;
		duration: number;
	};
	[key: string]: unknown;
}

interface AiConfig {
	provider: string;
	apiKey: string;
}

const DEFAULT_SETTINGS: LifeFlowSettings = {
	theme: "dark",
	language: "fa",
	notifications: { taskReminders: true, pomodoroEnd: true, learningDeadlines: true, dailyDigest: false, dndDuringFocus: true },
	features: {
		showMatrix: true,
		tabs: { planning: true, calendar: true, study: true, fitness: true, learning: true, pomodoro: true, notes: true },
	},
	taskDefaults: { quad: "q2", priority: 2, daypart: "morning", duration: 45 },
};

const LANGUAGE_OPTIONS: Record<string, string> = {
	fa: "فارسی",
	en: "English",
	fr: "Français",
	ar: "العربية",
};

const TAB_LABELS: Record<string, string> = {
	planning: "برنامه‌ریزی",
	calendar: "تقویم",
	study: "مطالعه",
	fitness: "تناسب اندام",
	learning: "یادگیری",
	pomodoro: "پومودورو",
	notes: "یادداشت‌ها",
};

// Mirrors QUADRANTS / PRIORITIES / DAYPARTS in app.jsx (kept separate since
// settings-tab.ts is plain TS, not part of the React tree).
const QUADRANT_OPTIONS: Record<string, string> = {
	q1: "فوری و مهم",
	q2: "مهم، غیرفوری",
	q3: "فوری، غیرمهم",
	q4: "غیرفوری و غیرمهم",
};
const PRIORITY_OPTIONS: Record<string, string> = {
	"1": "پایین",
	"2": "متوسط",
	"3": "بالا",
	"4": "بحرانی",
};
const DAYPART_OPTIONS: Record<string, string> = {
	morning: "صبح",
	noon: "ظهر",
	evening: "عصر",
	night: "شب",
};

export class LifeFlowSettingTab extends PluginSettingTab {
	plugin: LifeFlowPlugin;

	constructor(app: App, plugin: LifeFlowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private readSettings(): LifeFlowSettings {
		const raw = this.plugin.getDataValue(SETTINGS_KEY);
		if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
		try {
			const parsed = JSON.parse(raw);
			return {
				...DEFAULT_SETTINGS,
				...parsed,
				notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
				features: {
					...DEFAULT_SETTINGS.features,
					...(parsed.features || {}),
					tabs: { ...DEFAULT_SETTINGS.features.tabs, ...((parsed.features || {}).tabs || {}) },
				},
				taskDefaults: { ...DEFAULT_SETTINGS.taskDefaults, ...(parsed.taskDefaults || {}) },
			};
		} catch (e) {
			return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
		}
	}

	private writeSettings(next: LifeFlowSettings) {
		this.plugin.setDataValue(SETTINGS_KEY, JSON.stringify(next));
		// Let an already-open LifeFlowView pick up the change immediately
		// instead of only on next open (see app.jsx's "lifeflow-settings-changed"
		// listener added alongside this settings tab).
		window.dispatchEvent(new CustomEvent("lifeflow-settings-changed"));
	}

	private readAiConfig(): AiConfig {
		const raw = this.plugin.getDataValue(AI_CONFIG_KEY);
		if (!raw) return { provider: "anthropic", apiKey: "" };
		try {
			return { provider: "anthropic", apiKey: "", ...JSON.parse(raw) };
		} catch (e) {
			return { provider: "anthropic", apiKey: "" };
		}
	}

	private writeAiConfig(next: AiConfig) {
		this.plugin.setDataValue(AI_CONFIG_KEY, JSON.stringify(next));
		window.dispatchEvent(new CustomEvent("lifeflow-settings-changed"));
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("lifeflow-settings-tab");

		const settings = this.readSettings();

		containerEl.createEl("h2", { text: "زندگی‌آرام (LifeFlow)" });
		containerEl.createEl("p", {
			text: "این تنظیمات مستقیماً همان داده‌ای را می‌خوانند و می‌نویسند که در تنظیمات داخل خودِ پلاگین (آیکون چرخ‌دنده) استفاده می‌شود؛ تغییر از هرکدام بلافاصله در دیگری هم اعمال می‌شود.",
			cls: "setting-item-description",
		});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "ظاهر و زبان" });

		new Setting(containerEl)
			.setName("زبان رابط کاربری")
			.setDesc("زبان متن‌ها و جهت (راست‌به‌چپ/چپ‌به‌راست) داخل پلاگین")
			.addDropdown((drop) => {
				Object.entries(LANGUAGE_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
				drop.setValue(settings.language);
				drop.onChange((value) => {
					const next = this.readSettings();
					next.language = value;
					this.writeSettings(next);
				});
			});

		containerEl.createEl("p", {
			text: "ظاهر روشن/تاریک پلاگین به‌طور خودکار از تم فعلی Obsidian پیروی می‌کند (بخش Appearance در تنظیمات خود Obsidian) — نیازی به تنظیم جداگانه در اینجا نیست.",
			cls: "setting-item-description",
		});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "قابلیت‌ها" });

		new Setting(containerEl)
			.setName("نمایش ماتریس آیزنهاور")
			.setDesc("نمای «ماتریس» در سوییچر ویوهای تب تسک‌ها نشان داده شود یا نه")
			.addToggle((toggle) => {
				toggle.setValue(settings.features.showMatrix);
				toggle.onChange((value) => {
					const next = this.readSettings();
					next.features.showMatrix = value;
					this.writeSettings(next);
				});
			});

		containerEl.createEl("p", {
			text: "بخش‌های زیر را می‌توانید از نوار کناری/پایین پنهان کنید (داشبورد و تسک‌ها همیشه در دسترس‌اند):",
			cls: "setting-item-description",
		});

		(Object.keys(TAB_LABELS) as Array<keyof typeof TAB_LABELS>).forEach((tabId) => {
			new Setting(containerEl).setName(TAB_LABELS[tabId]).addToggle((toggle) => {
				toggle.setValue(settings.features.tabs[tabId as keyof typeof settings.features.tabs]);
				toggle.onChange((value) => {
					const next = this.readSettings();
					(next.features.tabs as any)[tabId] = value;
					this.writeSettings(next);
				});
			});
		});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "اعلان‌ها" });

		const notifItems: Array<[keyof LifeFlowSettings["notifications"], string, string]> = [
			["taskReminders", "یادآوری تسک‌ها", "اعلان برای تسک‌های زمان‌بندی‌شده‌ی نزدیک"],
			["pomodoroEnd", "پایان پومودورو", "اعلان وقتی یک دور پومودورو تمام می‌شود"],
			["learningDeadlines", "مهلت‌های یادگیری", "اعلان نزدیک‌شدن مهلت اهداف یادگیری"],
			["dailyDigest", "خلاصه‌ی روزانه", "یک اعلان جمع‌بندی در پایان روز"],
			["dndDuringFocus", "عدم‌مزاحمت حین جلسه‌ی کاری پومودورو", "وقتی یک دور «کار» پومودورو در حال اجراست، بقیه‌ی اعلان‌های بالا موقتاً ساکت می‌شوند (خودِ اعلان پایان پومودورو ساکت نمی‌شود)"],
		];

		notifItems.forEach(([key, name, desc]) => {
			new Setting(containerEl)
				.setName(name)
				.setDesc(desc)
				.addToggle((toggle) => {
					toggle.setValue(settings.notifications[key]);
					toggle.onChange((value) => {
						const next = this.readSettings();
						next.notifications[key] = value;
						this.writeSettings(next);
					});
				});
		});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "پیش‌فرض‌های پنجره‌ی «تسک جدید»" });
		containerEl.createEl("p", {
			text: "این مقادیر فقط هنگام ساخت یک تسک تازه از قبل انتخاب می‌شوند؛ همیشه قابل تغییر دستی هستند.",
			cls: "setting-item-description",
		});

		new Setting(containerEl).setName("ربع پیش‌فرض (ماتریس آیزنهاور)").addDropdown((drop) => {
			Object.entries(QUADRANT_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
			drop.setValue(settings.taskDefaults.quad);
			drop.onChange((value) => {
				const next = this.readSettings();
				next.taskDefaults.quad = value;
				this.writeSettings(next);
			});
		});

		new Setting(containerEl).setName("اولویت پیش‌فرض").addDropdown((drop) => {
			Object.entries(PRIORITY_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
			drop.setValue(String(settings.taskDefaults.priority));
			drop.onChange((value) => {
				const next = this.readSettings();
				next.taskDefaults.priority = Number(value);
				this.writeSettings(next);
			});
		});

		new Setting(containerEl).setName("زمان روز پیش‌فرض").addDropdown((drop) => {
			Object.entries(DAYPART_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
			drop.setValue(settings.taskDefaults.daypart);
			drop.onChange((value) => {
				const next = this.readSettings();
				next.taskDefaults.daypart = value;
				this.writeSettings(next);
			});
		});

		new Setting(containerEl)
			.setName("مدت پیش‌فرض (دقیقه)")
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = "5";
				text.setValue(String(settings.taskDefaults.duration));
				text.onChange((value) => {
					const n = Math.max(5, Number(value) || 45);
					const next = this.readSettings();
					next.taskDefaults.duration = n;
					this.writeSettings(next);
				});
			});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "خلاصه‌سازی با هوش مصنوعی" });

		const aiConfig = this.readAiConfig();
		new Setting(containerEl)
			.setName("کلید API")
			.setDesc("برای فعال‌شدن کارت خلاصه‌ی هوشمند در داشبورد؛ این کلید فقط داخل data.json همین ولت ذخیره می‌شود.")
			.addText((text) => {
				text.inputEl.type = "password";
				text.setPlaceholder("sk-...");
				text.setValue(aiConfig.apiKey);
				text.onChange((value) => {
					const next = this.readAiConfig();
					next.apiKey = value.trim();
					this.writeAiConfig(next);
				});
			});
	}
}
