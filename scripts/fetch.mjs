// 华邻网 news + market fetcher. Runs in GitHub Actions (free), no API keys, no dependencies.
// Writes data/news.json and data/market.json. If a feed fails, the previous items are kept.
import fs from "node:fs/promises";
import crypto from "node:crypto";

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

// The publisher's own short description (what link previews show). Kept short; we always link to the full article.
function ogDesc(html) {
  const head = html.slice(0, 300000);
  const pick = re => { const m = head.match(re); return m ? clean(m[1]) : ""; };
  let d = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
    || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (d.length > 160) d = d.slice(0, 158) + "…";
  return d;
}

// Can the publisher's page be shown inside our site? Only if it doesn't forbid framing.
function frameable(headers) {
  const xfo = (headers.get("x-frame-options") || "").toLowerCase();
  if (xfo) return false;
  const csp = (headers.get("content-security-policy") || "").toLowerCase();
  const fa = csp.match(/frame-ancestors([^;]*)/);
  if (fa && !/(^|\s)\*(\s|$)/.test(fa[1])) return false;
  return true;
}

async function findImage(item) {
  const url = /news\.google\.com/.test(item.u) ? await resolveGoogleNews(item.u) : item.u;
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*" }, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const buf = new Uint8Array(await r.arrayBuffer());
    let cs = ((r.headers.get("content-type") || "").match(/charset=([\w-]+)/i) || [])[1];
    if (!cs) cs = (new TextDecoder("latin1").decode(buf.slice(0, 4000)).match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
    cs = (cs || "utf-8").toLowerCase(); if (cs === "gb2312") cs = "gbk";
    let html; try { html = new TextDecoder(cs).decode(buf); } catch { html = new TextDecoder("utf-8").decode(buf); }
    const finalUrl = r.url || url;
    return { img: ogImage(html, finalUrl), desc: ogDesc(html), real: finalUrl, frame: /^https:/.test(finalUrl) && frameable(r.headers) };
  } finally { clearTimeout(timer); }
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
  for (const k of Object.keys(cache)) if (/\uFFFD/.test(cache[k].desc || "")) delete cache[k];
  const want = [];
  for (const lang of ["zh", "en"]) {
    for (const [sec, list] of Object.entries(out.sections[lang])) {
      const n = sec === "top" ? 14 : 10;
      list.slice(0, n).forEach(i => { if (!i.img) want.push(i); });
    }
  }
  let found = 0, tried = 0;
  const todo = [];
  for (const i of want) {
    const k = key(i.t) + "|" + (i.src || "");
    if (cache[k] && "frame" in cache[k]) { if (cache[k].img) { i.img = cache[k].img; found++; } continue; }
    if (todo.length >= 120) continue; // cap new lookups per run; the rest wait for the next run
    todo.push(async () => {
      tried++;
      try { const r = await findImage(i); cache[k] = { img: r.img, desc: r.desc, real: r.real, frame: r.frame, t: now }; if (r.img) { i.img = r.img; found++; } }
      catch (e) { cache[k] = { img: "", t: now, err: String(e.message || e).slice(0, 60) }; }
    });
  }
  await pool(todo, 6);
  // Apply cached pictures to every story, not just the ones looked up.
  for (const lang of ["zh", "en"]) for (const list of Object.values(out.sections[lang])) for (const i of list) {
    const c = cache[key(i.t) + "|" + (i.src || "")]; if (!c) continue;
    if (!i.img && c.img) i.img = c.img;
    if (!i.s && c.desc && c.desc.replace(/\s/g, "") !== i.t.replace(/\s/g, "")) i.s = c.desc;
    if (c.real && /news\.google\.com/.test(i.u)) i.u = c.real; // link straight to the publisher
    if (c.frame) i.fr = 1;
  }
  await fs.writeFile(IMG_CACHE, JSON.stringify(cache));
  const errs = Object.values(cache).filter(c => c.err).map(c => c.err);
  console.log(`images: ${found} found, ${tried} new lookups${errs.length ? ", errors e.g. " + [...new Set(errs)].slice(0, 3).join(" / ") : ""}`);
  out.imageStats = { found, tried, errors: [...new Set(errs)].slice(0, 5) };
}


/* ---------- official notices (U.S. federal government works are public domain, 17 U.S.C. §105) ----------
   Full text is saved to data/full/<id>.json and shown on our own page. */
export function htmlToBlocks(html, max = 60000) {
  let h = html.replace(/<(script|style|noscript|svg|figure)[\s\S]*?<\/\1>/gi, " ").replace(/<img[^>]*>/gi, " ");
  h = h.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (m, x) => "\n\n## " + stripTags(x) + "\n\n")
       .replace(/<li[^>]*>/gi, "\n• ").replace(/<\/(p|div|li|ul|ol|table|tr|section|br)>|<br\s*\/?>/gi, "\n\n");
  const text = decode(h.replace(/<[^>]+>/g, " "));
  const blocks = [];
  let total = 0;
  for (let b of text.split(/\n\s*\n/)) {
    b = b.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
    if (!b || b === "•") continue;
    blocks.push(b); total += b.length;
    if (total > max) { blocks.push("…"); break; }
  }
  return blocks;
}

async function buildOfficial(out) {
  const items = [];
  const saveFull = async (id, data) => { await fs.writeFile(`data/full/${id}.json`, JSON.stringify(data)); };
  await fs.rm("data/full", { recursive: true, force: true });
  await fs.mkdir("data/full", { recursive: true });
  const hid = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);

  // 1) State Department travel advisories for China, Hong Kong, Macau, Taiwan (full text in the feed).
  try {
    const xml = await get("https://travel.state.gov/_res/rss/TAsTWs.xml");
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    for (const b of blocks) {
      const title = clean(tag(b, "title"));
      if (!/\b(China|Hong Kong|Macau|Taiwan)\b/i.test(title)) continue;
      const link = clean(tag(b, "link"));
      const date = clean(tag(b, "pubDate"));
      const body = htmlToBlocks(decode(unCdata(tag(b, "description"))));
      if (!body.length) continue;
      const id = "o" + hid(title);
      await saveFull(id, { t: title, u: link, src: "U.S. Department of State", d: date, body });
      items.push({ id, t: title, u: link, s: body[0].slice(0, 160), src: "美国国务院 U.S. Department of State", d: Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : "", full: 1, pd: 1 });
    }
  } catch (e) { out.feeds.push({ lang: "en", sec: "official", name: "State travel advisories", ok: false, n: 0, err: String(e.message || e) }); }

  // 2) Latest USCIS documents in the Federal Register (rules, notices), full text from the API.
  try {
    const api = "https://www.federalregister.gov/api/v1/documents.json?per_page=100&order=newest&conditions%5Bagencies%5D%5B%5D=u-s-citizenship-and-immigration-services&conditions%5Bagencies%5D%5B%5D=homeland-security-department&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE&fields%5B%5D=title&fields%5B%5D=abstract&fields%5B%5D=html_url&fields%5B%5D=body_html_url&fields%5B%5D=publication_date&fields%5B%5D=type";
    const res = await get(api, "json");
    // Keep rules, proposed rules and real notices; skip routine paperwork ("information collection") notices.
    const IMM = /immigra|nonimmigrant|visa|H-1B|H-2|green card|permanent resident|naturaliz|citizenship|asylum|parole|public charge|USCIS|employment authorization|refugee|adjustment of status|temporary protected|TPS|DACA|deferred action|fee schedule|biometric/i;
    const useful = (res.results || []).filter(r => IMM.test((r.title || "") + " " + (r.abstract || "")) && !/information collection|collection activities|currently approved collection|safety zone|security zone|drawbridge|regatta|anchorage/i.test(r.title || "")).slice(0, 6);
    for (const r of useful) {
      let body = [];
      try { body = htmlToBlocks(await get(r.body_html_url)); } catch (e) { body = r.abstract ? [r.abstract] : []; }
      if (!body.length) continue;
      const id = "o" + hid(r.html_url);
      const t = `${r.type ? r.type + ": " : ""}${r.title}`;
      await saveFull(id, { t, u: r.html_url, src: "Federal Register (DHS/USCIS)", d: r.publication_date, body });
      items.push({ id, t, u: r.html_url, s: (r.abstract || body[0] || "").slice(0, 160), src: "联邦公报 Federal Register · DHS/USCIS", d: r.publication_date ? new Date(r.publication_date + "T12:00:00Z").toISOString() : "", full: 1, pd: 1 });
    }
  } catch (e) { out.feeds.push({ lang: "en", sec: "official", name: "Federal Register USCIS", ok: false, n: 0, err: String(e.message || e) }); }

  items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
  out.sections.zh.official = items;
  out.sections.en.official = items;
  console.log(`official notices: ${items.length}`);
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
      for (const i of fresh) i.id = crypto.createHash("sha1").update(key(i.t) + "|" + (i.src || "")).digest("hex").slice(0, 10);
      out.sections[lang][sec] = fresh;
    }
  }
  try { await enrichImages(out); } catch (e) { console.log("images failed:", e.message); }
  try { await buildOfficial(out); } catch (e) { console.log("official failed:", e.message); }
  await fs.writeFile("data/news.json", JSON.stringify(out));
  const ok = out.feeds.filter(f => f.ok).length;
  console.log(`news: ${ok}/${out.feeds.length} feeds ok`);
  for (const f of out.feeds.filter(f => !f.ok)) console.log("  failed:", f.lang, f.sec, f.name, f.err);
}


/* ---------- this week's deals and free stuff ---------- */
const DEAL_FEEDS = {
  online: [["Slickdeals", ["https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1"]], ["Hip2Save", ["https://hip2save.com/feed/"]]],
  free: [["The Freebie Guy", ["https://thefreebieguy.com/feed/"]], ["Hip2Save 免费", ["https://hip2save.com/category/freebies/feed/"]]],
  events: [["NYC free events", gnSearch("\"free\" events NYC this weekend", "en")], ["Free things to do NYC", gnSearch("free things to do in NYC", "en")]],
  zh: [["纽约免费活动", gnSearch("纽约 免费 活动 OR 免费 领取 OR 免费 讲座", "zh")], ["华人优惠", gnSearch("法拉盛 OR 华埠 OR 布碌崙 优惠 OR 折扣 OR 特价 OR 免费", "zh")]]
};
async function buildDeals() {
  const prev = await readJSON("data/deals.json", { sections: {} });
  const out = { updatedAt: new Date().toISOString(), sections: {}, feeds: [] };
  const now = Date.now();
  for (const [sec, feeds] of Object.entries(DEAL_FEEDS)) {
    let items = [];
    for (const [name, urls] of feeds) {
      let got = [], err = "";
      for (const url of urls) { try { got = parseFeed(await get(url), name); if (got.length) break; } catch (e) { err = String(e.message || e); } }
      out.feeds.push({ sec, name, ok: got.length > 0, n: got.length, ...(err && !got.length ? { err } : {}) });
      items.push(...got);
    }
    const maxAge = sec === "events" ? 30 : 7; // events list upcoming dates; deals expire fast
    items = items.filter(i => !i.d || now - Date.parse(i.d) < maxAge * 86400e3);
    // Keep only items that are actually about free stuff or discounts.
    const FREE_ZH = /免费|免費|优惠|優惠|折扣|特价|特價|半价|半價|赠送|贈送|买一送一|買一送一|领取|領取|讲座|講座|福利|补助|補助/;
    if (sec === "zh") items = items.filter(i => isChinese(i.t) && FREE_ZH.test(i.t));
    if (sec === "free") items = items.filter(i => /\bfree\b|freebie|\$0\b|no cost/i.test(i.t));
    if (sec === "events") items = items.filter(i => /\bfree\b/i.test(i.t));
    items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    const seen = new Set(), list = [];
    for (const i of items) { const k = key(i.t); if (k.length < 4 || seen.has(k)) continue; seen.add(k); i.id = crypto.createHash("sha1").update(k).digest("hex").slice(0, 10); list.push(i); if (list.length >= 24) break; }
    out.sections[sec] = list.length ? list : (prev.sections?.[sec] || []).filter(i => !i.d || now - Date.parse(i.d) < maxAge * 86400e3);
  }
  await fs.writeFile("data/deals.json", JSON.stringify(out));
  console.log("deals:", Object.entries(out.sections).map(([k, v]) => k + " " + v.length).join(", "));
  for (const f of out.feeds.filter(f => !f.ok)) console.log("  deals feed failed:", f.name, f.err || "no items");
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
  try { await buildDeals(); } catch (e) { console.log("deals failed:", e.message); }
}
