// 华邻网 news + market fetcher. Runs in GitHub Actions (free), no API keys, no dependencies.
// Writes data/news.json and data/market.json. If a feed fails, the previous items are kept.
import fs from "node:fs/promises";

const UA = "Mozilla/5.0 (compatible; HuaLinNewsBot/1.0; +https://github.com)";
const MAX_AGE_H = 96;

const gnSearch = (q, lang) => lang === "zh"
  ? [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=zh-CN&gl=US&ceid=US:zh-Hans`,
     `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`]
  : [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=en-US&gl=US&ceid=US:en`];
const gnTopic = (topic, lang) => lang === "zh"
  ? [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-CN&gl=US&ceid=US:zh-Hans`,
     `https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-CN&gl=CN&ceid=CN:zh-Hans`]
  : [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`];

// Section order = de-duplication priority. A story shows up in the first section that claims it.
const FEEDS = {
  zh: {
    top: [["华人 美国", gnSearch("美国 华人", "zh")], ["华裔", gnSearch("华裔", "zh")], ["美国新闻", gnTopic("NATION", "zh")]],
    local: [["纽约华人", gnSearch("纽约 华人", "zh")], ["法拉盛", gnSearch("法拉盛", "zh")], ["布碌崙", gnSearch("布鲁克林 OR 布碌崙 OR 日落公园 华人", "zh")]],
    immigration: [["移民签证", gnSearch("移民 OR 签证 OR 绿卡 OR 入籍 美国", "zh")], ["H-1B", gnSearch("H-1B OR 留学生 OR F-1", "zh")]],
    uschina: [["中美关系", gnSearch("中美关系 OR 中美贸易 OR 关税 中国 美国", "zh")]],
    china: [["BBC中文", ["https://feeds.bbci.co.uk/zhongwen/simp/rss.xml"]], ["RFI中文", ["https://www.rfi.fr/cn/rss"]], ["DW中文", ["https://rss.dw.com/rdf/rss-chi-all"]], ["中国新闻", gnSearch("中国", "zh")]],
    business: [["财经", gnTopic("BUSINESS", "zh")], ["美股", gnSearch("美股 OR 美联储 OR 房贷利率", "zh")]],
    health: [["健康", gnTopic("HEALTH", "zh")], ["养生", gnSearch("养生 OR 健康 饮食", "zh")]],
    ent: [["娱乐", gnTopic("ENTERTAINMENT", "zh")], ["体育", gnTopic("SPORTS", "zh")]]
  },
  en: {
    top: [["Chinese American", gnSearch("\"Chinese American\" OR \"Chinese Americans\"", "en")], ["Asian American", gnSearch("\"Asian American\"", "en")]],
    local: [["Flushing", gnSearch("Flushing Queens", "en")], ["Chinatown NYC", gnSearch("Chinatown Manhattan OR \"Sunset Park\" Brooklyn", "en")], ["New York City", gnSearch("New York City council OR Mamdani", "en")]],
    immigration: [["Immigration", gnSearch("H-1B OR \"green card\" OR USCIS OR \"student visa\"", "en")]],
    uschina: [["US–China", gnSearch("\"US-China\" OR \"U.S.-China\" OR Beijing tariffs", "en")]],
    china: [["China", gnSearch("China Beijing", "en")], ["BBC Asia", ["https://feeds.bbci.co.uk/news/world/asia/china/rss.xml"]]],
    business: [["Business", gnTopic("BUSINESS", "en")]],
    health: [["Health", gnTopic("HEALTH", "en")]],
    ent: [["Entertainment", gnTopic("ENTERTAINMENT", "en")], ["Sports", gnTopic("SPORTS", "en")]]
  }
};
const CAP = { top: 24, local: 18, immigration: 18, uschina: 16, china: 20, business: 16, health: 16, ent: 18 };

const ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
const unCdata = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
const stripTags = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const clean = s => stripTags(decode(unCdata(s || ""))).trim();
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}
function attr(xml, name, a) {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${a}=["']([^"']+)["']`, "i"));
  return m ? decode(m[1]) : "";
}

export function parseFeed(xml, fallbackSource) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(b => {
    let title = clean(tag(b, "title"));
    let link = clean(tag(b, "link")) || attr(b, "link", "href");
    const date = clean(tag(b, "pubDate") || tag(b, "dc:date") || tag(b, "published") || tag(b, "updated"));
    let source = clean(tag(b, "source")) || fallbackSource;
    const isGN = /news\.google\.com/.test(link);
    if (isGN) {
      const cut = title.lastIndexOf(" - ");
      if (cut > 0) { if (!clean(tag(b, "source"))) source = title.slice(cut + 3); title = title.slice(0, cut); }
    }
    let summary = isGN ? "" : clean(tag(b, "description") || tag(b, "summary") || tag(b, "content"));
    if (summary.length > 160) summary = summary.slice(0, 158) + "…";
    if (summary && summary.replace(/\s/g, "") === title.replace(/\s/g, "")) summary = "";
    const img = attr(b, "media:thumbnail", "url") || attr(b, "media:content", "url") || (/(jpe?g|png|webp)/i.test(attr(b, "enclosure", "type") + attr(b, "enclosure", "url")) ? attr(b, "enclosure", "url") : "");
    const t = Date.parse(date);
    return { t: title, u: link, s: summary, src: source, d: Number.isFinite(t) ? new Date(t).toISOString() : "", img };
  }).filter(i => i.t && /^https?:/.test(i.u));
}

async function get(url, type = "text") {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, application/json, */*" }, signal: ctl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return type === "json" ? await r.json() : await r.text();
  } finally { clearTimeout(timer); }
}

const key = t => t.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "").slice(0, 22);

async function readJSON(path, fallback) { try { return JSON.parse(await fs.readFile(path, "utf8")); } catch { return fallback; } }

async function buildNews() {
  const prev = await readJSON("data/news.json", { sections: {} });
  const out = { updatedAt: new Date().toISOString(), sections: { zh: {}, en: {} }, feeds: [] };
  const now = Date.now();
  for (const lang of ["zh", "en"]) {
    const seen = new Set();
    for (const [sec, feeds] of Object.entries(FEEDS[lang])) {
      let items = [];
      const results = await Promise.all(feeds.map(async ([name, urls]) => {
        for (const url of urls) {
          try {
            const got = parseFeed(await get(url), name);
            if (got.length) return { name, ok: true, items: got };
          } catch (e) { var err = String(e.message || e); }
        }
        return { name, ok: false, items: [], err: typeof err === "string" ? err : "no items" };
      }));
      for (const r of results) {
        out.feeds.push({ lang, sec, name: r.name, ok: r.ok, n: r.items.length, ...(r.err ? { err: r.err } : {}) });
        items.push(...r.items);
      }
      items = items.filter(i => !i.d || now - Date.parse(i.d) < MAX_AGE_H * 3600e3);
      items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
      const fresh = [];
      for (const i of items) { const k = key(i.t); if (k.length < 4 || seen.has(k)) continue; seen.add(k); fresh.push(i); if (fresh.length >= CAP[sec]) break; }
      // Keep yesterday's stories when a section comes back thin, so the page never goes empty.
      const old = (prev.sections?.[lang]?.[sec] || []).filter(i => !i.d || now - Date.parse(i.d) < 7 * 86400e3);
      for (const i of old) { if (fresh.length >= Math.min(8, CAP[sec])) break; const k = key(i.t); if (seen.has(k)) continue; seen.add(k); fresh.push(i); }
      out.sections[lang][sec] = fresh;
    }
  }
  await fs.writeFile("data/news.json", JSON.stringify(out));
  const ok = out.feeds.filter(f => f.ok).length;
  console.log(`news: ${ok}/${out.feeds.length} feeds ok`);
  for (const f of out.feeds.filter(f => !f.ok)) console.log("  failed:", f.lang, f.sec, f.name, f.err);
}

async function buildMarket() {
  const prev = await readJSON("data/market.json", {});
  const out = { updatedAt: new Date().toISOString(), rates: prev.rates || null, weather: prev.weather || null };
  try {
    const r = await get("https://open.er-api.com/v6/latest/USD", "json");
    if (r && r.rates) {
      const pick = ["CNY", "HKD", "TWD", "EUR", "GBP", "CAD", "JPY", "KRW", "AUD", "SGD"];
      out.rates = { base: "USD", asOf: r.time_last_update_utc || "", rates: Object.fromEntries(pick.filter(c => r.rates[c]).map(c => [c, r.rates[c]])) };
    }
  } catch (e) { console.log("rates failed:", e.message); }
  try {
    const w = await get("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=3", "json");
    if (w && w.current) out.weather = { city: "New York", now: { temp: w.current.temperature_2m, code: w.current.weather_code, at: w.current.time }, days: (w.daily?.time || []).map((d, i) => ({ d, code: w.daily.weather_code[i], hi: w.daily.temperature_2m_max[i], lo: w.daily.temperature_2m_min[i] })) };
  } catch (e) { console.log("weather failed:", e.message); }
  await fs.writeFile("data/market.json", JSON.stringify(out));
  console.log("market:", out.rates ? "rates ok" : "no rates", out.weather ? "weather ok" : "no weather");
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  await buildNews();
  await buildMarket();
}
