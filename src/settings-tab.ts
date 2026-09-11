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
		advancedOpenByDefault: boolean;
	};
	reports: {
		folderName: string;
	};
	// Lane 7 (زمان‌بندی هوشمند و ظرفیت، PROGRESS.md بندهای ۷۷/۷۸/۸۰-۸۸): بازه‌های
	// ساعات کاری که مجموعشان ظرفیتِ روزانه را می‌سازد (بند ۷۸: چند بازه در یک
	// روز). یک مجموعه‌ی واحد برای همه‌ی روزهای هفته — نسخه‌ی v1، بدون تفکیکِ
	// روزهای هفته. Mirrors app.jsx's DEFAULT_SCHEDULING exactly (kept separate
	// since this file is plain TS, not part of the React tree — same
	// low-divergence-risk duplication already used for QUADRANTS/PRIORITIES).
	scheduling: {
		workingHours: {
			enabled: boolean;
			periods: Array<{ id: string; start: string; end: string }>;
		};
		// بندِ ۸۴: دقیقاً هم‌شکلِ workingHours — بازه‌هایی از روز به‌عنوانِ
		// زمانِ تمرکز؛ opt-in (پیش‌فرض خاموش/خالی).
		focusTime: {
			enabled: boolean;
			periods: Array<{ id: string; start: string; end: string }>;
		};
		// بندهای ۸۵/۸۶: هدفِ روزانه/هفتگیِ تمرکز به دقیقه؛ ۰ یعنی «هدفی
		// تنظیم نشده»، نه «هدفِ صفردقیقه‌ای».
		focusGoals: {
			dailyMinutes: number;
			weeklyMinutes: number;
		};
		// بندِ ۸۷: اعدادِ ۰-۶ هم‌قراردادِ JS Date.getDay() (۰=یکشنبه).
		noMeetingWeekdays: number[];
		// بندِ ۸۸: یک عددِ سراسریِ ساده (v1) — اِعمالِ واقعیِ آن (درجِ خودکار
		// در برنامه) بخشی از موتورِ زمان‌بندیِ خودکارِ آینده است.
		bufferMinutes: number;
	};
	appearance: {
		fontFamily: string;
		density: string;
		// Lane 6 / item 23 (calendar zoom + time scale). No native-tab control
		// for these yet — the zoom/slot buttons live directly in the calendar
		// view (CalendarZoomControls in app.jsx), right where they're used.
		// Optional here only so this interface doesn't need to know their
		// defaults; readSettings()'s spread already round-trips whatever the
		// React app wrote, same as any other appearance field.
		calendarZoom?: number;
		calendarSlotMinutes?: number;
		calendarTaskDetail?: string;
		// Item 59 (remember last calendar view/date) - same reasoning as the
		// three fields above: no native-tab control, round-trips via
		// readSettings()'s spread, app.jsx (CalendarViews) is the only reader/
		// writer.
		calendarLastView?: string | null;
		calendarLastDate?: string | null;
		quadrantColors: {
			q1: string;
			q2: string;
			q3: string;
			q4: string;
		};
		// Item 22 first slice - Record<string,string> rather than a fixed
		// shape like quadrantColors, since the exercise-type ids are
		// arbitrary Persian strings defined in app.jsx's EXERCISE_TYPES, not
		// a fixed small set of known keys like q1-q4.
		exerciseTypeColors?: Record<string, string>;
	};
	// Spec item 8 (custom task model system, Lane 1) — user-defined task
	// types beyond the 4 built-in ones (task/event/routine/learning), each
	// shaped exactly like app.jsx's ITEM_TYPES entries so AddTaskModal can
	// just concat() the two lists.
	customItemTypes: { id: string; label: string; icon: string; color: string }[];
	[key: string]: unknown;
}

interface AiConfig {
	provider: string;
	apiKey: string;
}

// Mirrors app.jsx's QUADRANTS default colors exactly (id -> hex). Kept as a
// separate named constant (not inlined into DEFAULT_SETTINGS) so both the
// default-value assignment below and the nested merge in readSettings() can
// reference the same object without repeating the 4 hex values twice.
const DEFAULT_QUADRANT_COLORS = { q1: "#DB2777", q2: "#C026D3", q3: "#22D3EE", q4: "#6B7280" };

// Mirrors app.jsx's DEFAULT_WORKING_HOURS_PERIODS exactly (same 09:00–17:00
// single-period default, chosen as a common generic working day).
const DEFAULT_WORKING_HOURS_PERIODS = [{ id: "default-1", start: "09:00", end: "17:00" }];
// Item 22 first slice: mirrors app.jsx's DEFAULT_EXERCISE_TYPE_COLORS exactly
// (same 4 Persian type ids as keys, same hex defaults). Kept here for the
// same reason as DEFAULT_QUADRANT_COLORS above - this file is plain TS, not
// part of the React tree, so a small amount of constant duplication is
// cheaper and lower-risk than importing across the build boundary.
const DEFAULT_EXERCISE_TYPE_COLORS: Record<string, string> = { "قدرتی": "#C026D3", "کششی": "#F59E0B", "کاردیو": "#DB2777", "دویدن": "#22D3EE" };

const DEFAULT_SETTINGS: LifeFlowSettings = {
	theme: "dark",
	language: "fa",
	notifications: { taskReminders: true, pomodoroEnd: true, learningDeadlines: true, dailyDigest: false, dndDuringFocus: true },
	features: {
		showMatrix: true,
		tabs: { planning: true, calendar: true, study: true, fitness: true, learning: true, pomodoro: true, notes: true },
	},
	taskDefaults: { quad: "q2", priority: 2, daypart: "morning", duration: 45, advancedOpenByDefault: false },
	reports: { folderName: "LifeFlow Reports" },
	scheduling: {
		workingHours: { enabled: true, periods: DEFAULT_WORKING_HOURS_PERIODS },
		focusTime: { enabled: false, periods: [] },
		focusGoals: { dailyMinutes: 0, weeklyMinutes: 0 },
		noMeetingWeekdays: [],
		bufferMinutes: 0,
	},
	appearance: { fontFamily: "default", density: "comfortable", quadrantColors: DEFAULT_QUADRANT_COLORS, exerciseTypeColors: DEFAULT_EXERCISE_TYPE_COLORS },
	customItemTypes: [],
};

// Tiny local id generator for new working-hour periods — settings-tab.ts is
// plain TS with no dependency on app.jsx's `uid()`, so it gets its own
// (same reasoning as every other small duplicated helper in this file).
function newPeriodId(): string {
	return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Mirrors app.jsx's ICON_PATHS keys exactly (same duplication pattern as
// DEFAULT_QUADRANT_COLORS above) — this native tab can't easily import from
// the JSX bundle source, so the icon name list is kept in sync by hand. If
// a new icon is ever added to ICON_PATHS in app.jsx, add it here too.
const ICON_CHOICES = [
	"bell", "book", "calendar", "check", "clipboard", "clock", "cloud", "columns",
	"copy", "download", "dumbbell", "edit", "flame", "folder", "grid", "headphones",
	"home", "location", "lock", "moon", "pause", "play", "plus", "repeat", "search",
	"settings", "sparkles", "sun", "sunrise", "sunset", "tag", "trash", "upload", "x",
];

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

// Mirrors resolveFontFamily()'s id/order in app.jsx (kept separate since
// settings-tab.ts is plain TS, not part of the React tree).
const FONT_OPTIONS: Record<string, string> = {
	default: "پیش‌فرض پلاگین (Vazirmatn، با بازگشت به فونت تم Obsidian در صورت تعریف)",
	obsidian: "دقیقاً فونت تم فعلی Obsidian",
	vazirmatn: "همیشه Vazirmatn",
	system: "فونت سیستم‌عامل",
};

const DENSITY_OPTIONS: Record<string, string> = {
	comfortable: "راحت (پیش‌فرض)",
	compact: "فشرده (فاصله‌گذاری کمتر بین عناصر)",
};

// Mirrors QUADRANTS' id/label/sub text in app.jsx exactly (kept separate
// since settings-tab.ts is plain TS, not part of the React tree) — same
// low-divergence-risk duplication already used for FONT_OPTIONS etc.
const QUADRANT_SETTING_LABELS: Record<string, string> = {
	q1: "فوری و مهم (همین الان)",
	q2: "مهم، غیرفوری (برنامه‌ریزی کن)",
	q3: "فوری، غیرمهم (واگذار یا سریع رد کن)",
	q4: "غیرفوری و غیرمهم (بعداً یا حذف)",
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
				reports: { ...DEFAULT_SETTINGS.reports, ...(parsed.reports || {}) },
				scheduling: {
					...DEFAULT_SETTINGS.scheduling,
					...(parsed.scheduling || {}),
					workingHours: {
						...DEFAULT_SETTINGS.scheduling.workingHours,
						...((parsed.scheduling || {}).workingHours || {}),
					},
					focusTime: {
						...DEFAULT_SETTINGS.scheduling.focusTime,
						...((parsed.scheduling || {}).focusTime || {}),
					},
					focusGoals: {
						...DEFAULT_SETTINGS.scheduling.focusGoals,
						...((parsed.scheduling || {}).focusGoals || {}),
					},
				},
				appearance: {
					...DEFAULT_SETTINGS.appearance,
					...(parsed.appearance || {}),
					quadrantColors: { ...DEFAULT_SETTINGS.appearance.quadrantColors, ...((parsed.appearance || {}).quadrantColors || {}) },
					exerciseTypeColors: { ...DEFAULT_SETTINGS.appearance.exerciseTypeColors, ...((parsed.appearance || {}).exerciseTypeColors || {}) },
				},
				customItemTypes: Array.isArray(parsed.customItemTypes) ? parsed.customItemTypes : [],
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

		new Setting(containerEl)
			.setName("فونت متن پلاگین")
			.setDesc("فونت استفاده‌شده داخل رابط کاربری زندگی‌آرام. گزینه‌ی «پیش‌فرض پلاگین» همان چیزی است که همیشه بوده؛ بقیه‌ی گزینه‌ها اختیاری‌اند.")
			.addDropdown((drop) => {
				Object.entries(FONT_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
				drop.setValue(settings.appearance.fontFamily);
				drop.onChange((value) => {
					const next = this.readSettings();
					next.appearance.fontFamily = value;
					this.writeSettings(next);
				});
			});

		new Setting(containerEl)
			.setName("تراکم چیدمان")
			.setDesc("حالت «فشرده» فاصله‌گذاری داخلی/بین عناصر رابط کاربری را کم می‌کند تا محتوای بیشتری در یک صفحه جا شود؛ روی اندازه‌ی متن یا دکمه‌ها اثر نمی‌گذارد.")
			.addDropdown((drop) => {
				Object.entries(DENSITY_OPTIONS).forEach(([id, label]) => drop.addOption(id, label));
				drop.setValue(settings.appearance.density);
				drop.onChange((value) => {
					const next = this.readSettings();
					next.appearance.density = value;
					this.writeSettings(next);
				});
			});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "رنگ‌های ماتریس آیزنهاور" });
		containerEl.createEl("p", {
			text: "این ۴ رنگ در همه‌جای برنامه (ماتریس، ردیف تسک‌ها، کانبان، برنامه‌ریزی روزانه/هفتگی، نمودارها) برای همان دسته به کار می‌روند.",
			cls: "setting-item-description",
		});

		(Object.entries(QUADRANT_SETTING_LABELS) as [keyof LifeFlowSettings["appearance"]["quadrantColors"], string][]).forEach(([quadId, label]) => {
			new Setting(containerEl)
				.setName(label)
				.addColorPicker((picker) => {
					picker.setValue(settings.appearance.quadrantColors[quadId]);
					picker.onChange((value) => {
						const next = this.readSettings();
						next.appearance.quadrantColors[quadId] = value;
						this.writeSettings(next);
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("rotate-ccw");
					btn.setTooltip("بازگشت به رنگ پیش‌فرض");
					btn.onClick(() => {
						const next = this.readSettings();
						next.appearance.quadrantColors[quadId] = DEFAULT_QUADRANT_COLORS[quadId];
						this.writeSettings(next);
						this.display();
					});
				});
		});

		// ---------------------------------------------------------------
		// Item 22 (رنگ‌بندی گسترده) first slice: same one-color-per-item
		// pattern as the quadrant section above, applied to fitness activity
		// types. Further categories (بخش یادگیری/زیرتسک/زیربخش/دسته‌ها) are
		// intentionally left for a later session - see PROGRESS.md 4.8.
		containerEl.createEl("h3", { text: "رنگ‌های نوع فعالیت (ورزش)" });
		containerEl.createEl("p", {
			text: "رنگ هر نوع تمرین در برگه‌ی تناسب‌اندام (ثبت تمرین و افزودن تمرین تازه) استفاده می‌شود.",
			cls: "setting-item-description",
		});

		Object.keys(DEFAULT_EXERCISE_TYPE_COLORS).forEach((typeId) => {
			new Setting(containerEl)
				.setName(typeId)
				.addColorPicker((picker) => {
					picker.setValue((settings.appearance.exerciseTypeColors || {})[typeId] ?? DEFAULT_EXERCISE_TYPE_COLORS[typeId]);
					picker.onChange((value) => {
						const next = this.readSettings();
						if (!next.appearance.exerciseTypeColors) next.appearance.exerciseTypeColors = { ...DEFAULT_EXERCISE_TYPE_COLORS };
						next.appearance.exerciseTypeColors[typeId] = value;
						this.writeSettings(next);
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("rotate-ccw");
					btn.setTooltip("بازگشت به رنگ پیش‌فرض");
					btn.onClick(() => {
						const next = this.readSettings();
						if (!next.appearance.exerciseTypeColors) next.appearance.exerciseTypeColors = { ...DEFAULT_EXERCISE_TYPE_COLORS };
						next.appearance.exerciseTypeColors[typeId] = DEFAULT_EXERCISE_TYPE_COLORS[typeId];
						this.writeSettings(next);
						this.display();
					});
				});
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

		new Setting(containerEl)
			.setName("گزینه‌های بیشتر به‌طور پیش‌فرض باز باشند")
			.setDesc("پنجره‌ی «تسک جدید» معمولاً بخش «زمان‌بندی/تکرار/یادآوری/...» را بسته نگه می‌دارد تا شلوغ نباشد؛ اگر معمولاً از این گزینه‌ها استفاده می‌کنید، همیشه باز نگه دارید.")
			.addToggle((toggle) => {
				toggle.setValue(!!settings.taskDefaults.advancedOpenByDefault);
				toggle.onChange((value) => {
					const next = this.readSettings();
					next.taskDefaults.advancedOpenByDefault = value;
					this.writeSettings(next);
				});
			});

		// ---------------------------------------------------------------
		// Spec item 8 (Lane 1): user-defined task types beyond the 4
		// built-in ones. Each is a plain {id, label, icon, color} record,
		// same shape as app.jsx's ITEM_TYPES, so AddTaskModal's chip row
		// just concatenates the two lists — see PROGRESS.md Lane 1 log.
		containerEl.createEl("h3", { text: "نوع‌های سفارشیِ تسک" });
		containerEl.createEl("p", {
			text: "علاوه بر ۴ نوعِ پیش‌فرض (تسک/رویداد/روتین/یادگیری)، می‌توانید نوع‌های دلخواهِ خودتان را اضافه کنید — مثلاً «قرآن» یا «کار شخصی». هرکدام در پنجره‌ی «تسک جدید» به‌عنوان یک گزینه‌ی تازه ظاهر می‌شود.",
			cls: "setting-item-description",
		});

		const customTypes = Array.isArray(settings.customItemTypes) ? settings.customItemTypes : [];
		customTypes.forEach((ct, idx) => {
			new Setting(containerEl)
				.setName(ct.label)
				.setDesc(`آیکون: ${ct.icon}`)
				.addColorPicker((picker) => {
					picker.setValue(ct.color);
					picker.onChange((value) => {
						const next = this.readSettings();
						next.customItemTypes[idx] = { ...next.customItemTypes[idx], color: value };
						this.writeSettings(next);
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("trash-2");
					btn.setTooltip("حذف این نوع");
					btn.onClick(() => {
						const next = this.readSettings();
						next.customItemTypes.splice(idx, 1);
						this.writeSettings(next);
						this.display();
					});
				});
		});

		let newTypeName = "";
		let newTypeIcon = ICON_CHOICES[0];
		new Setting(containerEl)
			.setName("افزودن نوعِ تازه")
			.addText((text) => {
				text.setPlaceholder("مثلاً «قرآن»");
				text.onChange((value) => {
					newTypeName = value;
				});
			})
			.addDropdown((dd) => {
				ICON_CHOICES.forEach((icon) => dd.addOption(icon, icon));
				dd.setValue(newTypeIcon);
				dd.onChange((value) => {
					newTypeIcon = value;
				});
			})
			.addButton((btn) => {
				btn.setButtonText("افزودن").setCta();
				btn.onClick(() => {
					const trimmed = newTypeName.trim();
					if (!trimmed) return;
					const next = this.readSettings();
					if (!Array.isArray(next.customItemTypes)) next.customItemTypes = [];
					next.customItemTypes.push({
						id: `custom_${Date.now()}`,
						label: trimmed,
						icon: newTypeIcon,
						color: "#8B5CF6",
					});
					this.writeSettings(next);
					this.display();
				});
			});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "گزارش‌گیری" });
		containerEl.createEl("p", {
			text: "خروجی‌های Markdown (گزارش روزانه/هفتگی/ماهانه، از تب «گزارش روزانه» در برنامه‌ریزی) داخل این پوشه در ریشه‌ی ولت ذخیره می‌شوند.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("نام پوشه‌ی گزارش‌ها")
			.setDesc("اگر خالی بگذارید، از مقدار پیش‌فرض («LifeFlow Reports») استفاده می‌شود. تغییر این مقدار فقط روی خروجی‌های بعدی اثر می‌گذارد؛ فایل‌های قبلاً ذخیره‌شده جابه‌جا نمی‌شوند.")
			.addText((text) => {
				text.setPlaceholder(DEFAULT_SETTINGS.reports.folderName);
				text.setValue(settings.reports.folderName);
				text.onChange((value) => {
					const next = this.readSettings();
					const trimmed = value.trim();
					next.reports.folderName = trimmed || DEFAULT_SETTINGS.reports.folderName;
					this.writeSettings(next);
				});
			});

		// ---------------------------------------------------------------
		containerEl.createEl("h3", { text: "زمان‌بندی هوشمند و ظرفیت" });
		containerEl.createEl("p", {
			text: "بازه‌های ساعات کاری زیر مجموعاً «ظرفیت» هر روز را می‌سازند — مثلاً صبح ۹ تا ۱۳ به‌علاوه‌ی عصر ۱۵ تا ۱۹ یعنی ظرفیت ۸ ساعت. این ظرفیت در نمای «برنامه‌ریزی روزانه»ی تقویم، کنار مجموع زمانِ زمان‌بندی‌شده‌ی همان روز نشان داده می‌شود و در صورت بیش‌برنامه‌ریزی هشدار می‌دهد. در هر ردیف، ورودیِ اول ساعتِ شروع و ورودیِ دوم ساعتِ پایانِ همان بازه است. فعلاً همین یک مجموعه‌ی بازه برای همه‌ی روزهای هفته یکسان اعمال می‌شود.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("لحاظ‌کردن ساعات کاری در محاسبه‌ی ظرفیت")
			.setDesc("خاموش‌کردن این گزینه فقط نمایشِ ظرفیت/هشدارِ بیش‌برنامه‌ریزی را در تقویم مخفی می‌کند؛ خودِ بازه‌ها پاک نمی‌شوند.")
			.addToggle((toggle) => {
				toggle.setValue(settings.scheduling.workingHours.enabled);
				toggle.onChange((value) => {
					const next = this.readSettings();
					next.scheduling.workingHours.enabled = value;
					this.writeSettings(next);
				});
			});

		settings.scheduling.workingHours.periods.forEach((period, idx) => {
			const canRemove = settings.scheduling.workingHours.periods.length > 1;
			new Setting(containerEl)
				.setName(`بازه‌ی کاری ${idx + 1}`)
				.addText((text) => {
					text.inputEl.type = "time";
					text.setValue(period.start);
					text.onChange((value) => {
						const next = this.readSettings();
						const p = next.scheduling.workingHours.periods.find((x) => x.id === period.id);
						if (p) p.start = value;
						this.writeSettings(next);
					});
				})
				.addText((text) => {
					text.inputEl.type = "time";
					text.setValue(period.end);
					text.onChange((value) => {
						const next = this.readSettings();
						const p = next.scheduling.workingHours.periods.find((x) => x.id === period.id);
						if (p) p.end = value;
						this.writeSettings(next);
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("trash-2");
					btn.setTooltip(canRemove ? "حذف این بازه" : "حداقل یک بازه لازم است");
					btn.setDisabled(!canRemove);
					btn.onClick(() => {
						if (!canRemove) return;
						const next = this.readSettings();
						next.scheduling.workingHours.periods = next.scheduling.workingHours.periods.filter((x) => x.id !== period.id);
						this.writeSettings(next);
						this.display();
					});
				});
		});

		new Setting(containerEl).addButton((btn) => {
			btn.setButtonText("+ افزودن بازه‌ی کاری");
			btn.onClick(() => {
				const next = this.readSettings();
				next.scheduling.workingHours.periods.push({ id: newPeriodId(), start: "09:00", end: "17:00" });
				this.writeSettings(next);
				this.display();
			});
		});

		// --- بند ۸۴: Focus Time — دقیقاً هم‌ساختارِ ساعاتِ کاری بالا، فقط
		// روی زیرشاخه‌ی دیگری از scheduling می‌نویسد (opt-in، پیش‌فرض خاموش).
		containerEl.createEl("h4", { text: "زمان تمرکز (Focus Time)" });
		containerEl.createEl("p", {
			text: "بازه‌هایی از روز که می‌خواهید به‌عنوان زمانِ تمرکزِ محافظت‌شده علامت بخورند (مثلاً صبح‌های زود). فعلاً فقط تعریف می‌شوند؛ جلوگیریِ خودکار از زمان‌بندیِ کارهای دیگر در این بازه‌ها بخشی از موتورِ زمان‌بندیِ خودکارِ آینده خواهد بود.",
			cls: "setting-item-description",
		});
		new Setting(containerEl).setName("فعال‌کردن زمان تمرکز").addToggle((toggle) => {
			toggle.setValue(settings.scheduling.focusTime.enabled);
			toggle.onChange((value) => {
				const next = this.readSettings();
				next.scheduling.focusTime.enabled = value;
				this.writeSettings(next);
			});
		});
		settings.scheduling.focusTime.periods.forEach((period, idx) => {
			const canRemove = true;
			new Setting(containerEl)
				.setName(`بازه‌ی تمرکز ${idx + 1}`)
				.addText((text) => {
					text.inputEl.type = "time";
					text.setValue(period.start);
					text.onChange((value) => {
						const next = this.readSettings();
						const p = next.scheduling.focusTime.periods.find((x) => x.id === period.id);
						if (p) p.start = value;
						this.writeSettings(next);
					});
				})
				.addText((text) => {
					text.inputEl.type = "time";
					text.setValue(period.end);
					text.onChange((value) => {
						const next = this.readSettings();
						const p = next.scheduling.focusTime.periods.find((x) => x.id === period.id);
						if (p) p.end = value;
						this.writeSettings(next);
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("trash-2");
					btn.setTooltip("حذف این بازه");
					btn.setDisabled(!canRemove);
					btn.onClick(() => {
						const next = this.readSettings();
						next.scheduling.focusTime.periods = next.scheduling.focusTime.periods.filter((x) => x.id !== period.id);
						this.writeSettings(next);
						this.display();
					});
				});
		});
		new Setting(containerEl).addButton((btn) => {
			btn.setButtonText("+ افزودن بازه‌ی تمرکز");
			btn.onClick(() => {
				const next = this.readSettings();
				next.scheduling.focusTime.periods.push({ id: newPeriodId(), start: "07:00", end: "09:00" });
				this.writeSettings(next);
				this.display();
			});
		});

		// --- بندهای ۸۵/۸۶: هدف روزانه/هفتگیِ تمرکز (به دقیقه). صفر یعنی
		// «بدون هدف» — این‌جا فقط ذخیره می‌شود؛ محاسبه‌ی پیشرفتِ واقعی از
		// روی جلساتِ پومودورو (قلمروِ لِین ۴) در جلسه‌ای دیگر انجام می‌شود
		// تا با کارِ فعالِ آن لِین برخورد نکند.
		containerEl.createEl("h4", { text: "هدف تمرکز روزانه و هفتگی" });
		containerEl.createEl("p", {
			text: "هدفِ دقیقه‌ای برای زمانِ تمرکز (مثلاً زمانِ کاریِ پومودورو). صفر یعنی هدفی تنظیم نشده.",
			cls: "setting-item-description",
		});
		new Setting(containerEl).setName("هدف روزانه (دقیقه)").addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "0";
			text.inputEl.step = "5";
			text.setValue(String(settings.scheduling.focusGoals.dailyMinutes));
			text.onChange((value) => {
				const next = this.readSettings();
				next.scheduling.focusGoals.dailyMinutes = Math.max(0, Number(value) || 0);
				this.writeSettings(next);
			});
		});
		new Setting(containerEl).setName("هدف هفتگی (دقیقه)").addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "0";
			text.inputEl.step = "5";
			text.setValue(String(settings.scheduling.focusGoals.weeklyMinutes));
			text.onChange((value) => {
				const next = this.readSettings();
				next.scheduling.focusGoals.weeklyMinutes = Math.max(0, Number(value) || 0);
				this.writeSettings(next);
			});
		});

		// --- بند ۸۷: روز بدون جلسه — انتخابِ روزهای هفته که نباید در آن‌ها
		// جلسه/کارِ زمان‌بندی‌شده گذاشته شود. id ها دقیقاً هم‌قراردادِ
		// app.jsx's WEEKDAYS (id = Date.getDay()، ترتیبِ نمایش از شنبه).
		containerEl.createEl("h4", { text: "روز بدون جلسه" });
		containerEl.createEl("p", {
			text: "روزهایی از هفته که ترجیح می‌دهید در آن‌ها جلسه یا کارِ زمان‌بندی‌شده نداشته باشید.",
			cls: "setting-item-description",
		});
		const WEEKDAY_LABELS_FA: Array<{ id: number; label: string }> = [
			{ id: 6, label: "شنبه" },
			{ id: 0, label: "یکشنبه" },
			{ id: 1, label: "دوشنبه" },
			{ id: 2, label: "سه‌شنبه" },
			{ id: 3, label: "چهارشنبه" },
			{ id: 4, label: "پنج‌شنبه" },
			{ id: 5, label: "جمعه" },
		];
		WEEKDAY_LABELS_FA.forEach(({ id, label }) => {
			new Setting(containerEl).setName(label).addToggle((toggle) => {
				toggle.setValue(settings.scheduling.noMeetingWeekdays.includes(id));
				toggle.onChange((value) => {
					const next = this.readSettings();
					const set = new Set(next.scheduling.noMeetingWeekdays);
					if (value) set.add(id);
					else set.delete(id);
					next.scheduling.noMeetingWeekdays = Array.from(set).sort();
					this.writeSettings(next);
				});
			});
		});

		// --- بند ۸۸: زمان حائل — نسخه‌ی v1، فقط یک عددِ سراسری ذخیره
		// می‌شود؛ درجِ خودکارِ آن در برنامه موکول به موتورِ زمان‌بندیِ
		// خودکارِ آینده است.
		containerEl.createEl("h4", { text: "زمان حائل" });
		containerEl.createEl("p", {
			text: "چند دقیقه فاصله‌ی خالی قبل و بعد از فعالیت‌های زمان‌بندی‌شده در نظر گرفته شود (فعلاً فقط ذخیره می‌شود؛ اِعمالِ خودکارِ آن به‌زودی).",
			cls: "setting-item-description",
		});
		new Setting(containerEl).setName("زمان حائل (دقیقه)").addText((text) => {
			text.inputEl.type = "number";
			text.inputEl.min = "0";
			text.inputEl.step = "5";
			text.setValue(String(settings.scheduling.bufferMinutes));
			text.onChange((value) => {
				const next = this.readSettings();
				next.scheduling.bufferMinutes = Math.max(0, Number(value) || 0);
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
