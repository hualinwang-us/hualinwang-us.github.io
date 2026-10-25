// 华邻网 news + market fetcher. Runs in GitHub Actions (free), no API keys, no dependencies.
// Writes data/news.json and data/market.json. If a feed fails, the previous items are kept.
import fs from "node:fs/promises";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_AGE_H = 96;

const gnSearch = (q, lang) => lang === "zh"
  ? [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=zh-CN&gl=US&ceid=US:zh-Hans`,
     `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`]
  : [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=en-US&gl=US&ceid=US:en`];
const gnTopic = (topic, lang) => lang === "zh"
  ? [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-CN&gl=CN&ceid=CN:zh-Hans`,
     `https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-TW&gl=TW&ceid=TW:zh-Hant`]
  : [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`];

// Section order = de-duplication priority. A story shows up in the first section that claims it.
const FEEDS = {
  zh: {
    top: [["美国华人", gnSearch("美国 华人 OR 华裔", "zh")], ["美国要闻", gnSearch("美国 白宫 OR 国会 OR 特朗普 OR 川普", "zh")], ["选举", gnSearch("美国 中期选举 OR 选民 OR 投票", "zh")]],
    local: [["纽约华人", gnSearch("纽约 华人", "zh")], ["法拉盛", gnSearch("法拉盛", "zh")], ["布碌崙", gnSearch("布鲁克林 OR 布碌崙 OR 日落公园 华人", "zh")]],
    immigration: [["移民", gnSearch("美国 移民", "zh")], ["绿卡", gnSearch("绿卡 OR 入籍 OR 公民身份", "zh")], ["签证", gnSearch("美国 签证 OR H-1B 签证 OR 留学生 签证", "zh")], ["ICE", gnSearch("ICE 移民局 OR 移民执法 OR 遣返", "zh")]],
    uschina: [["中美关系", gnSearch("中美关系 OR 中美贸易 OR 关税 中国 美国", "zh")]],
    china: [["BBC中文", ["https://feeds.bbci.co.uk/zhongwen/simp/rss.xml"]], ["RFI中文", ["https://www.rfi.fr/cn/rss"]], ["DW中文", ["https://rss.dw.com/rdf/rss-chi-all"]], ["中国新闻", gnSearch("中国", "zh")]],
    business: [["美股", gnSearch("美股 OR 华尔街 OR 美联储 OR 道琼斯", "zh")], ["美国经济", gnSearch("美国经济 OR 房贷利率 OR 油价 OR 通胀", "zh")], ["华人理财", gnSearch("报税 OR 退休金 OR 社安金 OR 理财 美国", "zh")], ["财经频道", gnTopic("BUSINESS", "zh")]],
    health: [["养生", gnSearch("养生 OR 医生提醒 OR 健康饮食 OR 失智 OR 糖尿病 OR 高血压", "zh")], ["医疗保险", gnSearch("白卡 OR 红蓝卡 OR 医疗保险 OR 疫苗 美国", "zh")], ["健康频道", gnTopic("HEALTH", "zh")]],
    ent: [["娱乐", gnSearch("明星 OR 女星 OR 影帝 OR 娱乐圈 OR 好莱坞 OR 演唱会", "zh")], ["体育", gnSearch("NBA OR 足球 OR 网球 OR 体育", "zh")], ["娱乐频道", gnTopic("ENTERTAINMENT", "zh")], ["体育频道", gnTopic("SPORTS", "zh")]]
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
    if (/\|/.test(title)) { const first = title.split(/\s*[|｜]\s*/)[0]; if (first.length >= 8) title = first; }
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

// Stock-ticker blurbs and press-release mills crowd out real news; skip them.
const BLOCK_SRC = /TradingKey|TradingView|Moomoo|富途|东方财富|同花顺|雪球|股吧|金融界|格隆汇|智通财经|财华社|生物通|证券|Investing\.com|MarketBeat|Benzinga|Zacks|GuruFocus|Yahoo Finance UK/i;
const BLOCK_TITLE = /\([A-Z]{1,5}\)|\d{4,5}\.HK|季度业绩|财年第|耗资|回购|非经营性|概念股?集体|涨超|跌超|\bQ[1-4]\b.*Earnings|Stock (Price|Forecast)/i;
// A Chinese headline: at least 30% of its non-space characters are CJK.
const isChinese = t => { const c = t.replace(/\s/g, ""); const n = (c.match(/[\u3400-\u9fff]/g) || []).length; return c.length > 0 && n / c.length >= 0.3; };
const key = t => t.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "").slice(0, 22);

async function readJSON(path, fallback) { try { return JSON.parse(await fs.readFile(path, "utf8")); } catch { return fallback; } }


/* ---------- images ----------
   Google News links hide the publisher URL. For the stories people see first (the lead and the
   top few of each section) we resolve the real article, read its og:image, and cache the result
   in data/img-cache.json so each story is looked up only once. Any failure just means no picture. */
const IMG_CACHE = "data/img-cache.json";
const BAD_IMG = /logo|default|placeholder|favicon|icon|blank|spacer|avatar|share[-_]?img|1x1|\.svg(\?|$)|\.gif(\?|$)/i;

async function post(url, body) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body, signal: ctl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  } finally { clearTimeout(timer); }
}

async function resolveGoogleNews(link) {
  const m = link.match(/news\.google\.com\/(?:rss\/)?articles\/([^?/]+)/);
  if (!m) return link;
  const id = m[1];
  const page = await get(`https://news.google.com/articles/${id}`);
  const sg = (page.match(/data-n-a-sg="([^"]+)"/) || [])[1];
  const ts = (page.match(/data-n-a-ts="([^"]+)"/) || [])[1];
  if (!sg || !ts) throw new Error("no signature");
  const inner = JSON.stringify(["garturlreq", [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts), sg]);
  const body = "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]]));
  const txt = await post("https://news.google.com/_/DotsSplashUi/data/batchexecute", body);
  const part = txt.split("\n\n")[1] || txt.slice(txt.indexOf("["));
  const arr = JSON.parse(part);
  const url = JSON.parse(arr[0][2])[1];
  if (!/^https?:\/\//.test(url)) throw new Error("bad url");
  return url;
}

function ogImage(html, pageUrl) {
  const head = html.slice(0, 300000);
  const pick = re => { const m = head.match(re); return m ? decode(m[1]).trim() : ""; };
  let img = pick(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    || pick(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (!img) return "";
  try { img = new URL(img, pageUrl).href; } catch { return ""; }
  if (!/^https:\/\//.test(img) || BAD_IMG.test(img)) return "";
  return img;
}

async function findImage(item) {
  const url = /news\.google\.com/.test(item.u) ? await resolveGoogleNews(item.u) : item.u;
  const html = await get(url);
  return { img: ogImage(html, url), real: url };
}

async function pool(tasks, size) {
  const results = []; let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < tasks.length) { const k = i++; results[k] = await tasks[k]().catch(() => null); } }));
  return results;
}

async function enrichImages(out) {
  const cache = await readJSON(IMG_CACHE, {});
  const now = Date.now();
  for (const k of Object.keys(cache)) if (now - (cache[k].t || 0) > 5 * 86400e3) delete cache[k];
  const want = [];
  for (const lang of ["zh", "en"]) {
    for (const [sec, list] of Object.entries(out.sections[lang])) {
      const n = sec === "top" ? 8 : 4;
      list.slice(0, n).forEach(i => { if (!i.img) want.push(i); });
    }
  }
  let found = 0, tried = 0;
  const todo = [];
  for (const i of want) {
    const k = key(i.t) + "|" + (i.src || "");
    if (cache[k]) { if (cache[k].img) { i.img = cache[k].img; found++; } continue; }
    if (todo.length >= 70) continue; // cap new lookups per run; the rest wait for the next run
    todo.push(async () => {
      tried++;
      try { const r = await findImage(i); cache[k] = { img: r.img, t: now }; if (r.img) { i.img = r.img; found++; } }
      catch (e) { cache[k] = { img: "", t: now, err: String(e.message || e).slice(0, 60) }; }
    });
  }
  await pool(todo, 6);
  // Apply cached pictures to every story, not just the ones looked up.
  for (const lang of ["zh", "en"]) for (const list of Object.values(out.sections[lang])) for (const i of list) {
    if (i.img) continue; const c = cache[key(i.t) + "|" + (i.src || "")]; if (c && c.img) i.img = c.img;
  }
  await fs.writeFile(IMG_CACHE, JSON.stringify(cache));
  const errs = Object.values(cache).filter(c => c.err).map(c => c.err);
  console.log(`images: ${found} found, ${tried} new lookups${errs.length ? ", errors e.g. " + [...new Set(errs)].slice(0, 3).join(" / ") : ""}`);
  out.imageStats = { found, tried, errors: [...new Set(errs)].slice(0, 5) };
}

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
      // Feeds named "...频道" are broad topic channels: used only to fill up after the targeted searches.
      const filler = [];
      for (const r of results) {
        out.feeds.push({ lang, sec, name: r.name, ok: r.ok, n: r.items.length, ...(r.err ? { err: r.err } : {}) });
        (/频道$/.test(r.name) ? filler : items).push(...r.items);
      }
      const prep = list => {
        list = list.filter(i => (!i.d || now - Date.parse(i.d) < MAX_AGE_H * 3600e3) && !BLOCK_SRC.test(i.src || "") && !BLOCK_TITLE.test(i.t));
        if (lang === "zh") list = list.filter(i => isChinese(i.t));
        return list.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
      };
      items = prep(items).concat(prep(filler));
      const fresh = [];
      for (const i of items) { const k = key(i.t); if (k.length < 4 || seen.has(k)) continue; seen.add(k); fresh.push(i); if (fresh.length >= CAP[sec]) break; }
      // Keep yesterday's stories when a section comes back thin, so the page never goes empty.
      const old = (prev.sections?.[lang]?.[sec] || []).filter(i => !BLOCK_SRC.test(i.src || "") && !BLOCK_TITLE.test(i.t) && (!i.d || now - Date.parse(i.d) < 7 * 86400e3) && (lang !== "zh" || isChinese(i.t)));
      for (const i of old) { if (fresh.length >= Math.min(8, CAP[sec])) break; const k = key(i.t); if (seen.has(k)) continue; seen.add(k); fresh.push(i); }
      out.sections[lang][sec] = fresh;
    }
  }
  try { await enrichImages(out); } catch (e) { console.log("images failed:", e.message); }
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
