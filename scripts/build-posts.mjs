// Builds one page per listing (_site/p/<id>/index.html) so each listing has its own link,
// with the listing's title and summary in the page head (what WeChat and other apps show
// when a link is shared). Also writes 404.html (fallback for listings newer than the last
// build), sitemap.xml and robots.txt. Runs in GitHub Actions; no dependencies.
import fs from "node:fs/promises";

const OUT = process.argv[2] || "_site";
const read = p => fs.readFile(p, "utf8");

// Load the site's own config and board list exactly as the browser does.
const win = {};
new Function("window", await read("config.js"))(win);
new Function("window", "globalThis", await read("assets/common.js"))(win, win);
const HLC = win.HLC;
const BASE = (HLC.CFG.siteUrl || "https://hualinwang-us.github.io/").replace(/\/?$/, "/");
const tpl = await read("post.html");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const json = v => JSON.stringify(v).replace(/</g, "\\u003c").replace(new RegExp("[\\u2028\\u2029]", "g"), c => "\\u" + c.charCodeAt(0).toString(16));
const fill = map => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : ""));

let posts = [];
if (HLC.POSTS_ON) {
  try {
    const r = await fetch(`${HLC.SB_URL}/rest/v1/posts?select=${HLC.POST_COLS}&order=created_at.desc&limit=2000`, { headers: HLC.sbHeaders() });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
    posts = await r.json();
  } catch (e) { console.log("posts fetch failed:", e.message); }
}

let n = 0;
for (const p of posts) {
  const b = HLC.boardById(p.board);
  const title = (p.area ? `[${p.area}] ` : "") + p.title;
  const who = [p.contact, p.phone].filter(Boolean).join(" ");
  const desc = `【${b ? b.zh : "分类信息"}】${p.body.replace(/\s+/g, " ").slice(0, 90)}${p.body.length > 90 ? "…" : ""}${who ? " 联系：" + who : ""}`;
  const url = `${BASE}p/${p.id}/`;
  const ssr = `<article class="pcard"><span class="tag">${esc(b ? b.zh : "")}</span><h1>${esc(p.title)}</h1><div class="detail-body">${esc(p.body)}</div></article>`;
  const html = fill({ TITLE: esc(title), DESC: esc(desc), BASE: esc(BASE), URL: esc(url), JSON: json(p), SSR: ssr });
  await fs.mkdir(`${OUT}/p/${p.id}`, { recursive: true });
  await fs.writeFile(`${OUT}/p/${p.id}/index.html`, html);
  n++;
}

await fs.writeFile(`${OUT}/404.html`, fill({ TITLE: "华邻网 · 分类信息", DESC: "在美华人新闻与免费分类信息。", BASE: esc(BASE), URL: esc(BASE), JSON: "null", SSR: "" }));

// Guide pages: /g/<id>/ with both languages pre-rendered (good for sharing and search engines).
new Function("window", "globalThis", await read("assets/guide-render.js"))(win, win);
const HLG = win.HLG;
let guides = { guides: [] }, watch = {};
try { guides = JSON.parse(await read("data/guides.json")); } catch (e) { console.log("no guides:", e.message); }
try { watch = JSON.parse(await read("data/watch.json")).pages || {}; } catch (e) {}
const gtpl = await read("guide.html");
const gfill = map => gtpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : ""));
for (const g of guides.guides || []) {
  const url = `${BASE}g/${g.id}/`;
  const html = gfill({ TITLE: esc(HLG.L(g.title, "zh")), DESC: esc(HLG.L(g.summary, "zh").replace(/\*\*/g, "").slice(0, 120)), BASE: esc(BASE), URL: esc(url),
    ZH: HLG.renderGuide(g, "zh", { watch, base: BASE }), EN: HLG.renderGuide(g, "en", { watch, base: BASE }) });
  await fs.mkdir(`${OUT}/g/${g.id}`, { recursive: true });
  await fs.writeFile(`${OUT}/g/${g.id}/index.html`, html);
}
console.log(`guide pages: ${(guides.guides || []).length}`);

// News pages: /n/<id>/ for every story currently on the site, so shared links show the headline.
const ntpl = await read("news.html");
const nfill = map => ntpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : ""));
let newsData = { sections: {} }; try { newsData = JSON.parse(await read("data/news.json")); } catch (e) {}
const SEC = { zh: { official: "政府公告", top: "新闻速递", local: "纽约本地", immigration: "移民签证", uschina: "中美关系", china: "中国", business: "财经", health: "健康养生", ent: "娱乐体育" },
  en: { official: "Official notices", top: "Top Stories", local: "New York", immigration: "Immigration", uschina: "US–China", china: "China", business: "Business", health: "Health", ent: "Entertainment & Sports" } };
let nn = 0; const seenN = new Set();
for (const lg of ["zh", "en"]) for (const [sname, list] of Object.entries((newsData.sections || {})[lg] || {})) for (const i of list) {
  if (!i.id || seenN.has(i.id)) continue; seenN.add(i.id);
  const src = i.src || (lg === "zh" ? "原网站" : "the publisher");
  const when = i.d ? new Date(i.d).toLocaleString(lg === "zh" ? "zh-CN" : "en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  const body = `<span class="tag">${esc(SEC[lg][sname] || "")}</span><h1>${esc(i.t)}</h1><span class="meta"><span class="src">${esc(src)}</span>${when ? `<span>${esc(when)}</span>` : ""}</span>` +
    (i.img && /^https:\/\//.test(i.img) ? `<div class="art-img" data-hasimg><img src="${esc(i.img)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.removeAttribute('data-hasimg')"></div>` : "") +
    (i.full ? await (async () => { try { const fb = JSON.parse(await read(`data/full/${i.id}.json`)); return `<div class="art-full">${(fb.body || []).map(b => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b)}</p>`).join("")}</div>`; } catch { return ""; } })() : "") +
    `<p class="art-sum${i.s ? "" : " muted"}">${esc(i.s || (lg === "zh" ? "华邻网只收录新闻标题和摘要，全文请到原网站阅读。" : "HuaLin shows headlines and summaries only; read the full story on the original site."))}</p>`;
  const html = nfill({ TITLE: esc(i.t), DESC: esc((i.s || i.t).slice(0, 120)), BASE: esc(BASE), URL: esc(`${BASE}n/${i.id}/`), BODY: body,
    SRCURL: esc(/^https?:\/\//.test(i.u) ? i.u : BASE), READ: esc(lg === "zh" ? `前往 ${src} 阅读全文 →` : `Read the full story at ${src} →`),
    COPY: esc(lg === "zh" ? `新闻版权归 ${src} 所有，华邻网仅收录标题与摘要并链接原文。` : `Copyright belongs to ${src}. HuaLin shows the headline and summary and links to the original.`) });
  await fs.mkdir(`${OUT}/n/${i.id}`, { recursive: true });
  await fs.writeFile(`${OUT}/n/${i.id}/index.html`, html);
  nn++;
}
console.log(`news pages: ${nn}`);

const urls = [`<url><loc>${BASE}</loc><changefreq>hourly</changefreq></url>`]
  .concat((guides.guides || []).map(g => `<url><loc>${BASE}g/${g.id}/</loc><lastmod>${g.verified || ""}</lastmod></url>`))
  .concat(posts.map(p => `<url><loc>${BASE}p/${p.id}/</loc><lastmod>${String(p.created_at).slice(0, 10)}</lastmod></url>`));
await fs.writeFile(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
await fs.writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log(`listing pages: ${n}`);
