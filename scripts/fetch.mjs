// 华脉 news + market fetcher. Runs in GitHub Actions (free), no API keys, no dependencies.
// Writes data/news.json and data/market.json. If a feed fails, the previous items are kept.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createRequire } from "node:module";

// Traditional → simplified for Chinese headlines and summaries (the page converts to 繁體 for readers who pick it).
let toSimp = x => x;
try { const OpenCC = createRequire(import.meta.url)("opencc-js"); toSimp = OpenCC.Converter({ from: "tw", to: "cn" }); } catch (e) { console.log("opencc-js not installed; keeping original characters"); }
const simpItem = i => { if (i.t) i.t = toSimp(i.t); if (i.s) i.s = toSimp(i.s); if (i.sz) i.sz = toSimp(i.sz); if (i.tz) i.tz = toSimp(i.tz); return i; };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_AGE_H = 96;

const gnSearch = (q, lang, w = "3d") => lang === "zh"
  ? [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:" + w)}&hl=zh-CN&gl=US&ceid=US:zh-Hans`,
     `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:" + w)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`]
  : [`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:" + w)}&hl=en-US&gl=US&ceid=US:en`];
const gnTopic = (topic, lang) => lang === "zh"
  ? [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-CN&gl=CN&ceid=CN:zh-Hans`,
     `https://news.google.com/rss/headlines/section/topic/${topic}?hl=zh-TW&gl=TW&ceid=TW:zh-Hant`]
  : [`https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`];

// Section order = de-duplication priority. A story shows up in the first section that claims it.
const FEEDS = {
  zh: {
    top: [["美国最新", gnSearch("美国", "zh", "1d")], ["美国华人", gnSearch("美国 华人 OR 华裔", "zh")], ["美国要闻", gnSearch("美国 白宫 OR 国会 OR 特朗普 OR 川普", "zh")], ["选举", gnSearch("美国 中期选举 OR 选民 OR 投票", "zh")]],
    local: [["纽约最新", gnSearch("纽约", "zh", "1d")], ["纽约华人", gnSearch("纽约 华人", "zh")], ["法拉盛", gnSearch("法拉盛", "zh")], ["布碌崙", gnSearch("布鲁克林 OR 布碌崙 OR 日落公园 华人", "zh")]],
    immigration: [["移民", gnSearch("美国 移民", "zh")], ["绿卡", gnSearch("绿卡 OR 入籍 OR 公民身份", "zh")], ["签证", gnSearch("美国 签证 OR H-1B 签证 OR 留学生 签证", "zh")], ["ICE", gnSearch("ICE 移民局 OR 移民执法 OR 遣返", "zh")]],
    uschina: [["中美关系", gnSearch("中美关系 OR 中美贸易 OR 关税 中国 美国", "zh")]],
    // BBC, RFI and DW don't allow their pages inside other sites, so they're not used.
    china: [["国内新闻", [gnTopic("NATION", "zh")[0]]], ["中国新闻", gnSearch("中国", "zh")], ["中国经济", gnSearch("中国 经济 OR 楼市 OR 股市 OR 消费", "zh")], ["中国社会", gnSearch("中国 社会 OR 民生 OR 国内 新闻", "zh")]],
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

// The opening of the article (first paragraphs), clipped to about 200 characters, shown as a lead above the embedded page.
// Page furniture that sometimes sits inside article paragraphs (audio players, "AI summary" labels, share prompts).
const LEAD_JUNK = [
  /\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/g, /your browser does not support[^.!。！]*[.!。！]?/gi, /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,
  /AI\s*(摘要|总结|導讀|导读|生成)[^：:]{0,12}[：:]?/gi, /(文章)?摘要整理[：:]?/g, /(本文|以下)(由|为)?\s*AI[^。]{0,20}[。：:]?/gi,
  /(收听|朗读|播放)(本文|文章|全文)?/g, /(字号|大中小|打印本页|分享到)[^\s]{0,10}/g
];
function scrubLead(t) { for (const re of LEAD_JUNK) t = t.replace(re, " "); return t.replace(/\s+/g, " ").replace(/^[\s:：,，、。]+/, "").trim(); }
function leadText(html) {
  const body = html.replace(/<(script|style|noscript|header|footer|nav|aside|figure|form)[\s\S]*?<\/\1>/gi, " ");
  const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => scrubLead(clean(m[1])))
    .filter(p => (p.match(/[\u4e00-\u9fff]/g) || []).length >= 25 || (!/[\u4e00-\u9fff]/.test(p) && p.length >= 80))
    .filter(p => !/-->|网站地图|京报百科/.test(p) && !(!/[。，！？；,.!?]/.test(p) && p.split(" ").length > 5))
    .filter(p => !/版权|免责|声明|责任编辑|原标题|来源：|点击|关注|下载|扫码|copyright|all rights reserved|subscribe|cookie/i.test(p));
  let out = "";
  for (const p of paras) { out += (out ? " " : "") + p; if (out.length >= 200) break; }
  return out.length > 200 ? out.slice(0, 198).replace(/[，,、；;\s]+$/, "") + "…" : out;
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
    return { img: ogImage(html, finalUrl), desc: ogDesc(html), lead: leadText(html), real: finalUrl, frame: /^https:/.test(finalUrl) && frameable(r.headers) };
  } finally { clearTimeout(timer); }
}

async function pool(tasks, size) {
  const results = []; let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < tasks.length) { const k = i++; results[k] = await tasks[k]().catch(() => null); } }));
  return results;
}


/* Keep readers on our site: drop a story that can't be shown inline when another outlet's report of the
   same event can, and rank stories that can be shown inline a little higher. */
function bigrams(t) {
  const c = t.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
  const set = new Set(); for (let k = 0; k < c.length - 1; k++) set.add(c.slice(k, k + 2)); return set;
}
function similar(a, b) {
  if (a.size < 8 || b.size < 8) return 0;
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter); // Jaccard: share of all two-character pieces the titles have in common
}
function preferEmbeddable(out) {
  let swapped = 0;
  for (const lang of ["zh", "en"]) {
    const all = Object.values(out.sections[lang]).flat().filter(i => !i.full);
    const ok = all.filter(i => i.fr === 1).map(i => ({ i, g: bigrams(i.t) }));
    for (const [sec, list] of Object.entries(out.sections[lang])) {
      if (sec === "official") continue;
      out.sections[lang][sec] = list.filter(i => {
        if (i.fr !== 0) return true;
        const g = bigrams(i.t);
        const twin = ok.find(o => o.i !== i && similar(g, o.g) >= 0.5);
        if (twin) { swapped++; return false; }
        return true;
      });
      { const L = out.sections[lang][sec], c = { n: L.length, ok: 0, no: 0, unk: 0, fresh6: 0, fresh6ok: 0 };
        for (const i of L) { const f = Date.now() - (Date.parse(i.d) || 0) < 6 * 3600e3; if (i.fr === 1 || i.full) c.ok++; else if (i.fr === 0) c.no++; else c.unk++; if (f) { c.fresh6++; if (i.fr === 1) c.fresh6ok++; } }
        (out.filterStats = out.filterStats || {})[lang + "." + sec] = c; }
      // Stories that can't be shown in full on our site are always left out.
      const keep = out.sections[lang][sec].filter(i => i.fr === 1 || i.full);
      const score = i => Date.parse(i.d) || 0;
      out.sections[lang][sec] = keep.sort((a, b) => score(b) - score(a)).slice(0, CAP[sec] || 20);
    }
  }
  console.log(`inline-friendly: replaced ${swapped} stories with another outlet's report of the same event`);
}

async function enrichImages(out) {
  const cache = await readJSON(IMG_CACHE, {});
  const now = Date.now();
  for (const k of Object.keys(cache)) if (now - (cache[k].t || 0) > 5 * 86400e3) delete cache[k];
  for (const k of Object.keys(cache)) if (/\uFFFD/.test(cache[k].desc || "")) delete cache[k];
  // Check every story, highest-ranked first across all sections, so the ones people see are done first.
  const want = [];
  const lists = ["zh", "en"].flatMap(lang => Object.values(out.sections[lang]));
  const depth = Math.max(0, ...lists.map(l => l.length));
  for (let r = 0; r < depth; r++) for (const l of lists) if (l[r]) want.push(l[r]);
  let found = 0, tried = 0;
  const todo = [];
  for (const i of want) {
    const k = key(i.t) + "|" + (i.src || "");
    if (cache[k] && "frame" in cache[k] && (cache[k].frame === false || cache[k].lv === 4)) { if (cache[k].img) { i.img = cache[k].img; found++; } continue; }
    if (cache[k] && cache[k].err && now - (cache[k].t || 0) < 6 * 3600e3) continue; // page refused us recently: don't spend lookups on it every run
    if (todo.length >= 400) continue; // cap new lookups per run; the rest wait for the next run
    todo.push(async () => {
      tried++;
      try { const r = await findImage(i); cache[k] = { img: r.img, desc: r.desc, lead: r.lead, lv: 4, real: r.real, frame: r.frame, t: now }; if (r.img) { i.img = r.img; found++; } }
      catch (e) { cache[k] = { img: "", t: now, err: String(e.message || e).slice(0, 60) }; }
    });
  }
  await pool(todo, 12);
  // Apply cached pictures to every story, not just the ones looked up.
  for (const lang of ["zh", "en"]) for (const list of Object.values(out.sections[lang])) for (const i of list) {
    const c = cache[key(i.t) + "|" + (i.src || "")]; if (!c) continue;
    if (!i.img && c.img) i.img = c.img;
    if (!i.s && c.desc && c.desc.replace(/\s/g, "") !== i.t.replace(/\s/g, "")) i.s = c.desc;
    // A fuller lead for stories read inside our site: use the article's opening if it says more than the short description.
    if (i.s) i.s = scrubLead(i.s);
    if (i.s && (/-->|网站地图/.test(i.s) || (!/[。，！？；,.!?]/.test(i.s) && i.s.split(" ").length > 5))) i.s = "";
    if (c.lead && c.lead.length > (i.s || "").length + 20 && (lang === "en" || /[\u4e00-\u9fff]/.test(c.lead))) i.s = c.lead;
    if (c.real && /news\.google\.com/.test(i.u)) i.u = c.real; // link straight to the publisher
    if (c.frame) i.fr = 1; else if (c.frame === false) i.fr = 0;
  }
  await fs.writeFile(IMG_CACHE, JSON.stringify(cache));
  preferEmbeddable(out);
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
  for (const i of items) { const z = await tr(i.t); if (z) i.tz = z; const sz = await tr(i.s); if (sz) i.sz = sz; }
  // Chinese full text for the travel advisories (short); long Federal Register rules keep English text with a Chinese title and summary.
  for (const i of items.filter(x => /Department of State/.test(x.src))) {
    try {
      const f = JSON.parse(await fs.readFile(`data/full/${i.id}.json`, "utf8"));
      const zh = [];
      for (const b of f.body) { const h = b.startsWith("## ") ? "## " : b.startsWith("• ") ? "• " : ""; const z = await tr(b.slice(h.length)); if (!z) { zh.length = 0; break; } zh.push(h + z); }
      if (zh.length === f.body.length) { f.body_zh = zh; await fs.writeFile(`data/full/${i.id}.json`, JSON.stringify(f)); i.fullzh = 1; }
    } catch (e) {}
  }
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
      for (const i of items) { const k = key(i.t); if (k.length < 4 || seen.has(k)) continue; seen.add(k); fresh.push(i); if (fresh.length >= CAP[sec] * 2) break; } // extra candidates: some get dropped later if they can't be shown in-site
      // Keep yesterday's stories when a section comes back thin, so the page never goes empty.
      const old = (prev.sections?.[lang]?.[sec] || []).filter(i => !BLOCK_SRC.test(i.src || "") && !BLOCK_TITLE.test(i.t) && (!i.d || now - Date.parse(i.d) < 7 * 86400e3) && (lang !== "zh" || isChinese(i.t)));
      for (const i of old) { if (fresh.length >= Math.min(8, CAP[sec])) break; const k = key(i.t); if (seen.has(k)) continue; seen.add(k); fresh.push(i); }
      for (const i of fresh) i.id = crypto.createHash("sha1").update(key(i.t) + "|" + (i.src || "")).digest("hex").slice(0, 10);
      out.sections[lang][sec] = fresh;
    }
  }
  try { await enrichImages(out); } catch (e) { console.log("images failed:", e.message); }
  try { await buildOfficial(out); } catch (e) { console.log("official failed:", e.message); }
  for (const list of Object.values(out.sections.zh || {})) list.forEach(simpItem);
  await fs.writeFile("data/news.json", JSON.stringify(out));
  const ok = out.feeds.filter(f => f.ok).length;
  console.log(`news: ${ok}/${out.feeds.length} feeds ok`);
  for (const f of out.feeds.filter(f => !f.ok)) console.log("  failed:", f.lang, f.sec, f.name, f.err);
}



/* ---------- translation into Chinese (free MyMemory service; every text translated once and cached) ----------
   Daily free allowance: about 5,000 characters, or 50,000 if config.js has translateEmail. */
const TR_CACHE = "data/tr-cache.json";
const TR = { cache: null, daily: 0, day: "", quota: false, fresh: 0 };
let TR_EMAIL = "";
try { TR_EMAIL = ((await fs.readFile("config.js", "utf8")).match(/translateEmail:\s*"([^"]*)"/) || [])[1] || ""; } catch {}
const TR_LIMIT = TR_EMAIL ? 45000 : 4800;
async function trInit() {
  if (TR.cache) return;
  TR.cache = await readJSON(TR_CACHE, {});
  TR.day = new Date().toISOString().slice(0, 10);
  const u = TR.cache.__usage || {};
  TR.daily = u.day === TR.day ? (u.chars || 0) : 0;
}
function trChunks(text) {
  const parts = text.match(/[^.!?;]+[.!?;]*\s*/g) || [text];
  const out = []; let cur = "";
  for (const p of parts) { if ((cur + p).length > 440 && cur) { out.push(cur); cur = ""; } cur += p.length > 440 ? p.slice(0, 440) : p; }
  if (cur.trim()) out.push(cur);
  return out;
}
// Google's free web translator first (no daily quota for normal use), MyMemory as a fallback.
async function trGoogle(chunk) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=" + encodeURIComponent(chunk);
  const r = await get(url, "json");
  const z = clean((Array.isArray(r) && Array.isArray(r[0]) ? r[0].map(x => (x && x[0]) || "").join("") : ""));
  return z && isChinese(z) ? z : "";
}
async function trMyMemory(chunk) {
  if (TR.quota || TR.daily + chunk.length > TR_LIMIT) return "";
  const url = "https://api.mymemory.translated.net/get?langpair=en%7Czh-CN&q=" + encodeURIComponent(chunk) + (TR_EMAIL ? "&de=" + encodeURIComponent(TR_EMAIL) : "");
  const r = await get(url, "json");
  TR.daily += chunk.length;
  if (r.quotaFinished || /QUOTA|LIMIT EXCEEDED/i.test(r.responseDetails || "")) { TR.quota = true; return ""; }
  const z = clean((r.responseData && r.responseData.translatedText) || "");
  return z && isChinese(z) ? z : "";
}
export async function tr(text) {
  text = String(text || "").trim();
  if (!text || isChinese(text)) return "";
  await trInit();
  const hit = TR.cache[text]; if (hit) { hit.t = Date.now(); return hit.z; }
  const pieces = [];
  for (const chunk of trChunks(text)) {
    let z = "";
    if (!TR.gFail) { try { z = await trGoogle(chunk); } catch (e) { TR.gErr = (TR.gErr || 0) + 1; if (TR.gErr >= 5) TR.gFail = true; } }
    if (!z) { try { z = await trMyMemory(chunk); } catch (e) {} }
    if (!z) return "";
    pieces.push(z);
  }
  const z = pieces.join("");
  TR.cache[text] = { z, t: Date.now() }; TR.fresh++;
  return z;
}
async function trSave() {
  if (!TR.cache) return;
  for (const k of Object.keys(TR.cache)) if (k !== "__usage" && Date.now() - (TR.cache[k].t || 0) > 21 * 86400e3) delete TR.cache[k];
  TR.cache.__usage = { day: TR.day, chars: TR.daily };
  await fs.writeFile(TR_CACHE, JSON.stringify(TR.cache));
  console.log(`translation: ${TR.fresh} new today-run, ${TR.daily}/${TR_LIMIT} chars used today${TR.quota ? " (free quota reached)" : ""}`);
}
async function translateTitles(items) { for (const i of items) { const z = await tr(i.t); if (z) i.tz = z; } }

/* ---------- this week's deals and free stuff ---------- */
const DEAL_FEEDS = {
  online: [["Slickdeals", ["https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1"]], ["Hip2Save", ["https://hip2save.com/feed/"]]],
  free: [["The Freebie Guy", ["https://thefreebieguy.com/feed/"]], ["Hip2Save 免费", ["https://hip2save.com/category/freebies/feed/"]]],
  events: [["NYC free events", gnSearch("\"free\" events NYC this weekend", "en")], ["Free things to do NYC", gnSearch("free things to do in NYC", "en")]],
  zh: [["纽约免费活动", gnSearch("纽约 免费 活动 OR 免费 领取 OR 免费 讲座", "zh")], ["华人优惠", gnSearch("法拉盛 OR 华埠 OR 布碌崙 优惠 OR 折扣 OR 特价 OR 免费", "zh")]],
  biz: [["商家开业优惠", gnSearch("法拉盛 OR 华埠 OR 八大道 OR 艾姆赫斯特 开业 OR 开幕 优惠 OR 折扣 OR 特价", "zh")],
        ["超市特价", gnSearch("华人超市 OR 亚洲超市 特价 OR 优惠 OR 折扣 纽约 OR 新泽西", "zh")],
        ["餐馆优惠", gnSearch("纽约 餐厅 OR 餐馆 OR 奶茶 OR 火锅 优惠 OR 折扣 OR 买一送一 OR 开业", "zh")],
        ["商家活动", gnSearch("读者 购物 特价 OR 优惠 OR 赠送 世界日报 OR 星岛", "zh")]]
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
    const maxAge = sec === "events" ? 30 : sec === "biz" ? 21 : 7; // events list upcoming dates; deals expire fast
    items = items.filter(i => !i.d || now - Date.parse(i.d) < maxAge * 86400e3);
    // Keep only items that are actually about free stuff or discounts.
    const FREE_ZH = /免费|免費|优惠|優惠|折扣|特价|特價|半价|半價|赠送|贈送|买一送一|買一送一|领取|領取|讲座|講座|福利|补助|補助/;
    if (sec === "zh") items = items.filter(i => isChinese(i.t) && FREE_ZH.test(i.t));
    if (sec === "biz") items = items.filter(i => isChinese(i.t) && /优惠|優惠|折扣|特价|特價|半价|半價|赠送|贈送|买一送一|買一送一|开业|開業|开幕|開幕|促销|促銷|大减价|大減價|免费|免費|折|送/.test(i.t) && !/诈骗|詐騙|起诉|起訴|逮捕|死亡|枪|槍/.test(i.t));
    const maxAgeBiz = sec === "biz" ? 21 : null;
    if (sec === "free") items = items.filter(i => /\bfree\b|freebie|\$0\b|no cost/i.test(i.t));
    if (sec === "events") items = items.filter(i => /(^|[^-\w])free\b/i.test(i.t) && !/(gluten|sugar|tax|dairy|smoke|crime|hands)[- ]free/i.test(i.t));
    items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    const seen = new Set(), list = [];
    for (const i of items) { const k = key(i.t); if (k.length < 4 || seen.has(k)) continue; seen.add(k); i.id = crypto.createHash("sha1").update(k).digest("hex").slice(0, 10); list.push(i); if (list.length >= 24) break; }
    out.sections[sec] = list.length ? list : (prev.sections?.[sec] || []).filter(i => !i.d || now - Date.parse(i.d) < maxAge * 86400e3);
  }
  // Chinese titles for English deals, and whether each deal page can open inside our site.
  const allDeals = Object.values(out.sections).flat();
  try { await translateTitles(allDeals); } catch (e) { console.log("translation failed:", e.message); }
  try {
    const dc = await readJSON("data/deal-cache.json", {});
    const todo = allDeals.filter(i => !(i.u in dc) || !("desc" in dc[i.u])).slice(0, 90).map(i => async () => {
      try { const r = await findImage(i); dc[i.u] = { fr: r.frame ? 1 : 0, real: r.real, img: r.img, desc: r.desc, t: Date.now() }; }
      catch (e) { dc[i.u] = { fr: 0, t: Date.now() }; }
    });
    await pool(todo, 12);
    for (const i of allDeals) { const c = dc[i.u]; if (!c) continue; i.fr = c.fr; if (c.real && /news\.google\.com/.test(i.u)) i.u = c.real; if (!i.img && c.img) i.img = c.img; if (!i.s && c.desc) i.s = c.desc; }
    // Chinese summaries for English deals (titles were translated above).
    for (const i of allDeals) { if (i.s && !isChinese(i.s)) { const z = await tr(i.s); if (z) i.sz = z; } }
    for (const k of Object.keys(dc)) if (Date.now() - (dc[k].t || 0) > 21 * 86400e3) delete dc[k];
    await fs.writeFile("data/deal-cache.json", JSON.stringify(dc));
  } catch (e) { console.log("deal page check failed:", e.message); }
  for (const list of Object.values(out.sections || {})) list.forEach(simpItem);
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


/* ---------- official listings: NYC government jobs and affordable-housing lotteries (NYC Open Data, free to reuse) ---------- */
const BORO_ZH = { manhattan: "曼哈顿", brooklyn: "布鲁克林", queens: "皇后区", bronx: "布朗克斯", "staten island": "史泰登岛", mn: "曼哈顿", bk: "布鲁克林", qn: "皇后区", bx: "布朗克斯", si: "史泰登岛" };
const BORO_EN = { mn: "Manhattan", bk: "Brooklyn", qn: "Queens", bx: "Bronx", si: "Staten Island" };
const money = n => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
async function buildListings() {
  const prev = await readJSON("data/listings.json", { jobs: [], housing: [] });
  const out = { updated: new Date().toISOString(), jobs: prev.jobs || [], housing: prev.housing || [] };
  const today = new Date().toISOString().slice(0, 10);
  const SODA = "https://data.cityofnewyork.us/resource/";
  // Affordable-housing lotteries that are still open for applications.
  try {
    const rows = await get(SODA + "vy5i-a666.json?$limit=2000&$order=lottery_end_date%20DESC", "json");
    const open = rows.filter(r => r.lottery_end_date && r.lottery_end_date.slice(0, 10) >= today).slice(0, 80);
    out.housing = open.map(r => {
      const b0 = (r.borough || "").trim(), boro = BORO_EN[b0.toLowerCase()] || b0, bz = BORO_ZH[b0.toLowerCase()] || b0;
      const end = r.lottery_end_date.slice(0, 10);
      const units = Number(r.unit_count) || 0;
      const types = [["studio", "开间", "Studio"], ["1bed", "一房", "1 BR"], ["2bed", "两房", "2 BR"], ["3bed", "三房", "3 BR"], ["4bed", "四房以上", "4+ BR"]]
        .map(([k, z, e]) => [Number(r["unit_distribution_" + k]) || 0, z, e]).filter(x => x[0] > 0);
      const inc = [["ext_low", "极低收入", "Extremely low"], ["very_low", "很低收入", "Very low"], ["low", "低收入", "Low"], ["moderate", "中等收入", "Moderate"], ["middle", "中高收入", "Middle"], ["above", "较高收入", "Above middle"]]
        .filter(([k]) => /^(yes|true|1)$/i.test(String(r["applied_income_ami_" + k] || "")) || Number(r["applied_income_ami_" + k]) > 0);
      const senior = Number(r.lottery_62_percent) >= 100;
      const pref = [["lottery_community_board_percent", "本社区居民", "community board residents"], ["lottery_62_percent", "62岁以上老人", "seniors 62+"], ["lottery_nycha_percent", "NYCHA 住户", "NYCHA residents"], ["lottery_mobility_percent", "行动不便人士", "mobility disabilities"], ["lottery_vision_hearing_percent", "视力/听力障碍人士", "vision/hearing disabilities"], ["lottery_municipal_employee_percent", "市政员工/退伍军人", "city employees/veterans"]]
        .filter(([k]) => Number(r[k]) > 0).map(([k, z, e]) => [Number(r[k]), z, e]);
      const url = "https://housingconnect.nyc.gov/PublicWeb/details/" + encodeURIComponent(r.lottery_id);
      return {
        id: "h" + r.lottery_id, board: senior ? "rent" : "rent", kind: "housing", senior,
        area: bz, area_en: boro, d: (r.lottery_start_date || "").slice(0, 10), until: end, url,
        t: `${senior ? "【老人公寓】" : ""}${bz}平价房抽签：${(r.lottery_name || "").trim()}${units ? `（${units} 套）` : ""}`,
        te: `${senior ? "[Senior] " : ""}${boro} affordable housing lottery: ${(r.lottery_name || "").trim()}${units ? ` (${units} units)` : ""}`,
        bz: [`申请截止：${end}`, types.length ? `户型：${types.map(x => `${x[1]} ${x[0]} 套`).join("、")}` : "", inc.length ? `收入类别：${inc.map(x => x[1]).join("、")}（具体收入范围以官网为准）` : "", pref.length ? `优先名额：${pref.map(x => `${x[1]} ${x[0]}%`).join("、")}` : "", `怎么申请：上 NYC Housing Connect（housingconnect.nyc.gov）免费注册申请，可以选中文。一户只能申请一次，重复申请会被取消。`, `注意：申请完全免费，任何收费“代抽签”“保证中签”都是骗局。`].filter(Boolean).join("\n"),
        be: [`Deadline: ${end}`, types.length ? `Units: ${types.map(x => `${x[2]} ${x[0]}`).join(", ")}` : "", inc.length ? `Income bands: ${inc.map(x => x[2]).join(", ")} (see the listing for exact limits)` : "", pref.length ? `Preferences: ${pref.map(x => `${x[2]} ${x[0]}%`).join(", ")}` : "", "How to apply: free on NYC Housing Connect (housingconnect.nyc.gov). One application per household.", "Applying is free. Anyone charging a fee or promising a win is a scam."].filter(Boolean).join("\n"),
        src: "NYC HPD Housing Connect"
      };
    });
    console.log("housing lotteries:", out.housing.length);
  } catch (e) { console.log("housing failed:", e.message); }
  // City government job openings that the public can apply for.
  try {
    let rows;
    try { rows = await get(SODA + "kpav-sd4t.json?$limit=1500&$where=posting_type=%27External%27&$order=posting_date%20DESC", "json"); }
    catch (e) { rows = await get(SODA + "kpav-sd4t.json?$limit=1500", "json"); }
    const seen = new Set(), jobs = [];
    for (const r of rows) {
      if (!r.job_id || seen.has(r.job_id) || (r.posting_type && !/external/i.test(r.posting_type))) continue;
      if (r.post_until && r.post_until.slice(0, 10) < today) continue;
      seen.add(r.job_id); jobs.push(r);
      if (jobs.length >= 120) break;
    }
    const prevById = Object.fromEntries((prev.jobs || []).map(j => [j.id, j]));
    out.jobs = [];
    for (const [i, r] of jobs.entries()) {
      const id = "j" + r.job_id, old = prevById[id];
      const title = (r.business_title || r.civil_service_title || "").trim();
      const pay = r.salary_range_from ? `${money(r.salary_range_from)}${r.salary_range_to && r.salary_range_to !== r.salary_range_from ? "–" + money(r.salary_range_to) : ""}` : "";
      const per = { annual: ["年薪", "/yr"], hourly: ["时薪", "/hr"], daily: ["日薪", "/day"] }[String(r.salary_frequency || "").toLowerCase()] || ["工资", ""];
      const ft = /^f/i.test(r.full_time_part_time_indicator || "") ? ["全职", "Full-time"] : /^p/i.test(r.full_time_part_time_indicator || "") ? ["兼职", "Part-time"] : ["", ""];
      const desc = clean(r.job_description || "").replace(/\s+/g, " ");
      const tz = (old && old.tz) || await tr(title);
      const az = (old && old.az) || await tr((r.agency || "").trim());
      const dz = (old && old.dz) || (i < 40 ? await tr(desc.slice(0, 420)) : "");
      out.jobs.push({
        id, board: "jobs", kind: "job", jobId: r.job_id, area: "纽约市政府", area_en: "NYC government",
        d: (r.posting_date || "").slice(0, 10), until: (r.post_until || "").slice(0, 10),
        tz, az, dz, te: title, ae: (r.agency || "").trim(),
        t: `${tz || title}${pay ? ` · ${per[0]} ${pay}` : ""}`,
        pay: pay ? { zh: `${per[0]} ${pay}`, en: `${pay}${per[1]}` } : null, ft,
        loc: (r.work_location || "").trim(), cat: (r.job_category || "").trim(),
        be: desc.slice(0, 1600), url: "https://cityjobs.nyc.gov/", src: "NYC Jobs (DCAS)"
      });
    }
    console.log("city jobs:", out.jobs.length);
  } catch (e) { console.log("jobs failed:", e.message); }
  await fs.writeFile("data/listings.json", JSON.stringify(out));
}

/* ---------- visa bulletin (U.S. State Department), China mainland-born column ---------- */
export function parseBulletin(html) {
  const cell = c => clean(c).replace(/\s+/g, " ").trim();
  const tables = (html.match(/<table[\s\S]*?<\/table>/gi) || []).map(t => (t.match(/<tr[\s\S]*?<\/tr>/gi) || []).map(r => (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(cell)));
  const fam = [], emp = [];
  for (const rows of tables) {
    if (!rows.length) continue;
    const head = rows[0], col = head.findIndex(h => /CHINA/i.test(h));
    if (col < 0) continue;
    const kind = /family/i.test(head[0]) ? fam : /employ/i.test(head[0]) ? emp : null;
    if (!kind) continue;
    const list = rows.slice(1).filter(r => r[col]).map(r => {
      let c = r[0].replace(/\s*\(.*$/, "").trim();
      if (/^5th Unreserved/i.test(r[0])) c = "5th";
      return { c, v: r[col] };
    }).filter(x => /^(F1|F2A|F2B|F3|F4|1st|2nd|3rd|Other Workers|4th|5th)$/i.test(x.c));
    kind.push(list);
  }
  const merge = (pair) => { const [fa = [], df = []] = pair; return fa.map(r => ({ c: r.c, fa: r.v, df: (df.find(d => d.c === r.c) || {}).v || "" })); };
  return { family: merge(fam), employment: merge(emp) };
}
async function buildVisa() {
  const base = "https://travel.state.gov";
  const idx = await get(base + "/content/travel/en/legal/visa-law0/visa-bulletin.html");
  const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const links = [...new Set((idx.match(/\/content\/travel\/en\/legal\/visa-law0\/visa-bulletin\/\d{4}\/visa-bulletin-for-[a-z]+-\d{4}\.html/gi) || []))]
    .map(u => { const m = u.match(/for-([a-z]+)-(\d{4})/i); return { u, y: +m[2], m: MONTHS.indexOf(m[1].toLowerCase()) }; }).filter(x => x.m >= 0).sort((a, b) => (b.y * 12 + b.m) - (a.y * 12 + a.m));
  if (!links.length) throw new Error("no bulletin links");
  const pick = links[0], html = await get(base + pick.u), data = parseBulletin(html);
  if (!data.family.length && !data.employment.length) throw new Error("bulletin tables not found");
  await fs.writeFile("data/visa.json", JSON.stringify({ month: `${pick.y}年${pick.m + 1}月`, monthEn: `${MONTHS[pick.m]} ${pick.y}`, url: base + pick.u, checked: new Date().toISOString(), ...data }));
  console.log(`::notice title=visa::ok ${pick.u} fam=${data.family.length} emp=${data.employment.length}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  await buildNews();
  await buildMarket();
  try { await buildDeals(); } catch (e) { console.log("deals failed:", e.message); }
  try { await buildVisa(); } catch (e) { console.log("::warning title=visa::" + String(e.message || e).slice(0, 200)); }
  await trSave();
}
