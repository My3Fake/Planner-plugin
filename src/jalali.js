var require_jalali = __commonJS({
  "src/jalali.js"(exports, module2) {
    var FA_FMT = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC"
    });
    function toJalaliParts(dateObj) {
      return gregorianToJalali(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    }
    function gregorianToJalali(gy, gm, gd) {
      const d = new Date(Date.UTC(gy, gm - 1, gd, 12));
      const parts = FA_FMT.formatToParts(d);
      const get = (t2) => Number(parts.find((p) => p.type === t2).value);
      return { jy: get("year"), jm: get("month"), jd: get("day") };
    }
    function jKey(jy, jm, jd) {
      return jy * 400 + jm * 32 + jd;
    }
    function jalaliToGregorian(jy, jm, jd) {
      const target = jKey(jy, jm, jd);
      let lo = Math.floor(Date.UTC(jy + 620, 0, 1) / 864e5);
      let hi = Math.floor(Date.UTC(jy + 622, 11, 31) / 864e5);
      const keyAt = (days) => {
        const d2 = new Date(days * 864e5);
        const p = gregorianToJalali(d2.getUTCFullYear(), d2.getUTCMonth() + 1, d2.getUTCDate());
        return jKey(p.jy, p.jm, p.jd);
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (keyAt(mid) < target) lo = mid + 1;
        else hi = mid;
      }
      const d = new Date(lo * 864e5);
      return { gy: d.getUTCFullYear(), gm: d.getUTCMonth() + 1, gd: d.getUTCDate() };
    }
    function fromJalaliParts(jy, jm, jd, hours = 0, minutes = 0) {
      const g = jalaliToGregorian(jy, jm, jd);
      return new Date(g.gy, g.gm - 1, g.gd, hours, minutes);
    }
    function jalaliMonthLength(jy, jm) {
      const start = jalaliToGregorian(jy, jm, 1);
      const nextJy = jm === 12 ? jy + 1 : jy;
      const nextJm = jm === 12 ? 1 : jm + 1;
      const next = jalaliToGregorian(nextJy, nextJm, 1);
      const d1 = Date.UTC(start.gy, start.gm - 1, start.gd);
      const d2 = Date.UTC(next.gy, next.gm - 1, next.gd);
      return Math.round((d2 - d1) / 864e5);
    }
    function isLeapJalaliYear(jy) {
      return jalaliMonthLength(jy, 12) === 30;
    }
    var MONTH_NAMES_FA = ["\u0641\u0631\u0648\u0631\u062F\u06CC\u0646", "\u0627\u0631\u062F\u06CC\u0628\u0647\u0634\u062A", "\u062E\u0631\u062F\u0627\u062F", "\u062A\u06CC\u0631", "\u0645\u0631\u062F\u0627\u062F", "\u0634\u0647\u0631\u06CC\u0648\u0631", "\u0645\u0647\u0631", "\u0622\u0628\u0627\u0646", "\u0622\u0630\u0631", "\u062F\u06CC", "\u0628\u0647\u0645\u0646", "\u0627\u0633\u0641\u0646\u062F"];
    var WEEKDAY_NAMES_FA = ["\u06CC\u06A9\u0634\u0646\u0628\u0647", "\u062F\u0648\u0634\u0646\u0628\u0647", "\u0633\u0647\u200C\u0634\u0646\u0628\u0647", "\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647", "\u067E\u0646\u062C\u0634\u0646\u0628\u0647", "\u062C\u0645\u0639\u0647", "\u0634\u0646\u0628\u0647"];
    var WEEKDAY_SHORT_FA = ["\u06CC", "\u062F", "\u0633", "\u0686", "\u067E", "\u062C", "\u0634"];
    var WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
    function formatJalali(dateObj, opts = {}) {
      const { jy, jm, jd } = toJalaliParts(dateObj);
      const withWeekday = opts.weekday !== false;
      const weekdayStr = withWeekday ? WEEKDAY_NAMES_FA[dateObj.getDay()] + "\u060C " : "";
      return `${weekdayStr}${jd} ${MONTH_NAMES_FA[jm - 1]}${opts.year === false ? "" : " " + jy}`.trim();
    }
    function formatJalaliNumeric(dateObj, sep = "/") {
      const { jy, jm, jd } = toJalaliParts(dateObj);
      const p2 = (n) => String(n).padStart(2, "0");
      return `${jy}${sep}${p2(jm)}${sep}${p2(jd)}`;
    }
    function jalaliDateKey(dateObj) {
      return formatJalaliNumeric(dateObj, "-");
    }
    function addDays(dateObj, n) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + n);
      return d;
    }
    function jalaliStartOfWeek(dateObj) {
      return addDays(dateObj, -WEEK_ORDER.indexOf(dateObj.getDay()));
    }
    function jalaliStartOfMonth(dateObj) {
      const { jy, jm } = toJalaliParts(dateObj);
      return fromJalaliParts(jy, jm, 1);
    }
    function jalaliStartOfYear(dateObj) {
      const { jy } = toJalaliParts(dateObj);
      return fromJalaliParts(jy, 1, 1);
    }
    function jalaliAddMonths(dateObj, n) {
      let { jy, jm, jd } = toJalaliParts(dateObj);
      const total = jy * 12 + (jm - 1) + n;
      jy = Math.floor(total / 12);
      jm = total % 12 + 1;
      return fromJalaliParts(jy, jm, Math.min(jd, jalaliMonthLength(jy, jm)));
    }
    function jalaliMonthGrid(dateObj) {
      const monthStart = jalaliStartOfMonth(dateObj);
      const { jy, jm } = toJalaliParts(monthStart);
      const monthEnd = addDays(monthStart, jalaliMonthLength(jy, jm) - 1);
      const gridStart = jalaliStartOfWeek(monthStart);
      const gridEnd = addDays(jalaliStartOfWeek(monthEnd), 6);
      const days = [];
      for (let c = gridStart; c <= gridEnd; c = addDays(c, 1)) days.push(c);
      return days;
    }
    function isSameJalaliDay(a, b) {
      return jalaliDateKey(a) === jalaliDateKey(b);
    }
    var Jalali2 = {
      gregorianToJalali,
      jalaliToGregorian,
      isLeapJalaliYear,
      jalaliMonthLength,
      toJalaliParts,
      fromJalaliParts,
      formatJalali,
      formatJalaliNumeric,
      jalaliDateKey,
      addDays,
      jalaliStartOfWeek,
      jalaliStartOfMonth,
      jalaliStartOfYear,
      jalaliAddMonths,
      jalaliMonthGrid,
      isSameJalaliDay,
      MONTH_NAMES_FA,
      WEEKDAY_NAMES_FA,
      WEEKDAY_SHORT_FA,
      WEEK_ORDER
    };
    if (typeof module2 !== "undefined" && module2.exports) module2.exports = Jalali2;
    if (typeof window !== "undefined") window.Jalali = Jalali2;
  }
});

