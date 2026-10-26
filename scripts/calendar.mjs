// 今天放假吗 / 今天要挪车吗: holiday calendar for NYC.
// - ASP (alternate side parking) suspensions: parsed from NYC DOT's official page every day.
// - Schools, trash collection, banks/post office: official calendars typed in below (check each school year).
import fs from "node:fs/promises";
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const ymd = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const range = (a, b) => { const out = []; for (let t = Date.parse(a + "T12:00:00Z"); t <= Date.parse(b + "T12:00:00Z"); t += 864e5) out.push(new Date(t).toISOString().slice(0, 10)); return out; };
const text = h => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();

let prev = {}; try { prev = JSON.parse(await fs.readFile("data/calendar.json", "utf8")); } catch {}
const asp = [];
try {
  const r = await fetch("https://www.nyc.gov/html/dot/html/motorist/alternate-side-parking.shtml", { headers: { "user-agent": "Mozilla/5.0 (huamai88.com calendar)" } });
  const html = (await r.text()).replace(/<!--[\s\S]*?-->/g, "");
  for (const tbl of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const yr = (text(tbl).match(/(20\d\d) Alternate Side Parking/) || tbl.match(/summary="[^"]*(20\d\d)/) || [])[1]; if (!yr) continue;
    for (const tr of tbl.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
      const cells = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(text); if (cells.length < 2) continue;
      const row = cells.join(" | ");
      // e.g. "Thursday, January 1 | New Year's Day"  or "Mon, Feb 16 | Lunar New Year's Eve"
      const m = row.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/i);
      if (!m) continue;
      const mo = MONTHS[m[1].toLowerCase()], d1 = +m[2], d2 = m[3] ? +m[3] : d1;
      const name = cells.find(c => !/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i.test(c) && /[a-z]/i.test(c)) || cells[cells.length - 1];
      for (let d = d1; d <= d2; d++) asp.push({ d: ymd(+yr, mo, d), name, major: /\*/.test(row) });
    }
  }
  console.log(`::notice title=asp::${asp.length} days ${asp.slice(0, 3).map(x => x.d + " " + x.name).join("; ")}`);
} catch (e) { console.log(`::warning title=asp::${e.message}`); }

// NYC public schools 2026-27 (schools.nyc.gov calendar)
const school = [
  ["2026-09-21", "赎罪日 Yom Kippur"], ["2026-10-12", "意大利传统日/原住民日"], ["2026-11-11", "退伍军人节"],
  ...range("2026-11-26", "2026-11-27").map(d => [d, "感恩节假期"]), ...range("2026-12-24", "2027-01-01").map(d => [d, "寒假"]),
  ["2027-01-18", "马丁·路德·金纪念日"], ...range("2027-02-15", "2027-02-19").map(d => [d, "冬季假期"]), ["2027-03-09", "开斋节"],
  ["2027-03-26", "耶稣受难日"], ...range("2027-04-22", "2027-04-30").map(d => [d, "春假"]), ["2027-05-17", "宰牲节"], ["2027-05-31", "阵亡将士纪念日"],
  ["2027-06-08", "教师行政日（大部分学校停课）"], ["2027-06-10", "教师会议日（学生不上学）"],
].map(([d, name]) => ({ d, name }));
const schoolNotes = [{ d: "2026-09-10", name: "开学第一天" }, { d: "2026-11-03", name: "选举日：全体在家网课" }, { d: "2027-06-28", name: "最后一天上学" }];
// DSNY: no trash / recycling / compost collection
const trash = [["2026-01-01", "元旦"], ["2026-01-19", "马丁·路德·金纪念日"], ["2026-02-16", "总统日"], ["2026-05-25", "阵亡将士纪念日"], ["2026-06-19", "六月节"], ["2026-07-04", "独立日"], ["2026-09-07", "劳动节"], ["2026-11-26", "感恩节"], ["2026-12-25", "圣诞节"],
  ["2027-01-01", "元旦"], ["2027-01-18", "马丁·路德·金纪念日"], ["2027-02-15", "总统日"], ["2027-05-31", "阵亡将士纪念日"]].map(([d, name]) => ({ d, name }));
// Federal holidays (observed): banks and post offices closed
const federal = [["2026-01-01", "元旦"], ["2026-01-19", "马丁·路德·金纪念日"], ["2026-02-16", "总统日"], ["2026-05-25", "阵亡将士纪念日"], ["2026-06-19", "六月节"], ["2026-07-03", "独立日（补假）"], ["2026-09-07", "劳动节"], ["2026-10-12", "哥伦布日"], ["2026-11-11", "退伍军人节"], ["2026-11-26", "感恩节"], ["2026-12-25", "圣诞节"],
  ["2027-01-01", "元旦"], ["2027-01-18", "马丁·路德·金纪念日"], ["2027-02-15", "总统日"], ["2027-05-31", "阵亡将士纪念日"], ["2027-06-18", "六月节（补假）"], ["2027-07-05", "独立日（补假）"], ["2027-09-06", "劳动节"], ["2027-10-11", "哥伦布日"], ["2027-11-11", "退伍军人节"], ["2027-11-25", "感恩节"], ["2027-12-24", "圣诞节（补假）"]].map(([d, name]) => ({ d, name }));
const out = { updated: new Date().toISOString(), asp: asp.length ? asp : (prev.asp || []), school, schoolNotes, trash, federal,
  sources: { asp: "https://www.nyc.gov/html/dot/html/motorist/alternate-side-parking.shtml", school: "https://www.schools.nyc.gov/calendar", trash: "https://www.nyc.gov/site/dsny/index.page" } };
await fs.writeFile("data/calendar.json", JSON.stringify(out));
