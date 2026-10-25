// 华脉 weekly report → huamai.us@gmail.com. Runs in GitHub Actions every Monday morning.
// Needs repository secrets: SUPABASE_SERVICE_KEY (Supabase secret key) and GMAIL_APP_PASSWORD (Gmail app password).
import fs from "node:fs/promises";


const TO = process.env.REPORT_TO || "huamai.us@gmail.com";
const SITE = "https://huamai88.com";
const repo = process.env.GITHUB_REPOSITORY, gh = process.env.GITHUB_TOKEN;
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const read = async f => { try { return JSON.parse(await fs.readFile(f, "utf8")); } catch { return null; } };
const nyDay = d => new Date(d).toLocaleDateString("zh-CN", { timeZone: "America/New_York", month: "numeric", day: "numeric" });
const ago = iso => { if (!iso) return "未知"; const h = (Date.now() - Date.parse(iso)) / 36e5; return h < 1 ? Math.round(h * 60) + " 分钟前" : h < 48 ? Math.round(h) + " 小时前" : Math.round(h / 24) + " 天前"; };
const pct = (a, b) => (!b ? "" : ` (${a >= b ? "↑" : "↓"}${Math.abs(Math.round((a - b) / b * 100))}%)`);

const cfgTxt = await fs.readFile("config.js", "utf8");
const SB_URL = (cfgTxt.match(/supabaseUrl:\s*"([^"]+)"/) || [])[1]?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const SB_PUB = (cfgTxt.match(/supabaseKey:\s*"([^"]+)"/) || [])[1];
const issues = []; // things that need the owner's attention

/* 1. database numbers */
let db = null;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!key) issues.push("还没有设置 SUPABASE_SERVICE_KEY，所以没有访问量、发帖和举报数据。");
else {
  try {
    const h = { apikey: key, "Content-Type": "application/json" };
    if (!/^sb_/.test(key)) h.Authorization = "Bearer " + key;
    const r = await fetch(SB_URL + "/rest/v1/rpc/weekly_report", { method: "POST", headers: h, body: JSON.stringify({ p_days: 7 }) });
    const t = await r.text();
    if (!r.ok) throw new Error(r.status + " " + t.slice(0, 200));
    db = JSON.parse(t);
  } catch (e) { issues.push("读取数据库失败：" + e.message + "（如果是 404，请先在 Supabase 运行 12-stats.sql）"); }
}

/* 2. automatic jobs (GitHub Actions) over the last 7 days */
const jobs = [];
if (gh && repo) {
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=100&created=>=${since}`, { headers: { authorization: "Bearer " + gh, accept: "application/vnd.github+json" } });
    const d = await r.json();
    const by = {};
    for (const run of d.workflow_runs || []) { const k = run.name; (by[k] ||= { ok: 0, bad: 0, last: null, lastBad: null }); if (run.conclusion === "success") by[k].ok++; else if (run.conclusion && run.conclusion !== "cancelled" && run.conclusion !== "skipped") { by[k].bad++; by[k].lastBad ||= run.html_url; } by[k].last ||= run.created_at; }
    for (const [k, v] of Object.entries(by)) { jobs.push({ name: k, ...v }); if (v.bad && v.bad >= Math.max(2, v.ok * 0.2)) issues.push(`自动任务「${k}」本周失败 ${v.bad} 次（成功 ${v.ok} 次）。`); }
  } catch (e) { issues.push("读取自动任务记录失败：" + e.message); }
}

/* 3. scraping health from the data files in the repo */
const news = await read("data/news.json"), deals = await read("data/deals.json"), flyers = await read("data/flyers.json"), visa = await read("data/visa.json"), market = await read("data/market.json");
const badFeeds = (news?.feeds || []).filter(f => !f.ok).map(f => f.name);
const emptyFeeds = (news?.feeds || []).filter(f => f.ok && !f.n).map(f => f.name);
if (news && Date.now() - Date.parse(news.updatedAt) > 3 * 36e5) issues.push(`新闻已经 ${ago(news.updatedAt)} 没更新了（正常每 30 分钟一次）。`);
if (badFeeds.length > 3) issues.push(`有 ${badFeeds.length} 个新闻来源抓取失败：${badFeeds.slice(0, 8).join("、")}`);
const staleFlyers = (flyers?.stores || []).filter(s => s.stale || (s.got && Date.now() - Date.parse(s.got) > 9 * 864e5));
if (staleFlyers.length) issues.push(`超市特价单没更新：${staleFlyers.map(s => s.name).join("、")}（可能是超市官网改版或还没发新单）。`);
if (visa && !Object.keys(visa).length) issues.push("移民排期（visa bulletin）自动更新被美国国务院网站挡住了，页面目前显示官方链接（已知问题，可以不管）。");

/* 4. live checks */
const live = [];
async function check(name, url, opt, test) {
  const t0 = Date.now();
  try { const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(20000) }); const body = await r.text(); const ok = r.ok && (!test || test(body)); live.push({ name, ok, ms: Date.now() - t0, note: ok ? "" : "HTTP " + r.status }); if (!ok) issues.push(`${name} 检查失败（HTTP ${r.status}）。`); }
  catch (e) { live.push({ name, ok: false, ms: Date.now() - t0, note: e.message }); issues.push(`${name} 打不开：${e.message}`); }
}
await check("网站首页", SITE + "/", {}, b => b.includes("华脉"));
await check("App 安装包", `https://github.com/${repo}/releases/latest/download/hualin.apk`, { method: "HEAD", redirect: "follow" });
if (SB_URL && SB_PUB) {
  await check("公交实时（Bus Time）", SB_URL + "/functions/v1/transit?op=stops&lat=40.7590&lon=-73.8300", { headers: { apikey: SB_PUB } }, b => /"stops":\[\{/.test(b));
  await check("北方铁路实时", SB_URL + "/functions/v1/transit?op=rail&sys=mnr&stop=1", { headers: { apikey: SB_PUB } }, b => /"list":\[\{/.test(b));
  await check("帖子数据库", SB_URL + "/rest/v1/posts?select=id&limit=1", { headers: { apikey: SB_PUB } });
}

/* 5. build the email */
const PAGE_NAMES = { home: "首页", news: "新闻", article: "新闻文章", deals: "本周优惠", chaoshi: "超市特价单", tools: "实用工具", city: "同城分类", board: "分类版块", travel: "玩转美国", stocks: "美股行情", check: "福利自测", guide: "福利指南", guideone: "福利指南文章", yp: "商家黄页", me: "我的", search: "搜索", disc: "说明页", ads: "广告页" };
const TOOL_NAMES = { transit: "实时到站", scam: "防骗", civics: "入籍考试", natdate: "入籍时间", visa: "移民排期", permit: "驾照笔试", mortgage: "房贷", carloan: "车贷", rent40: "租房收入", homeafford: "买房预算", phrases: "英语急救卡", units: "单位换算", sizes: "尺码换算", tip: "小费" };
let boardNames = {};
try { const c = await fs.readFile("assets/common.js", "utf8"); for (const m of c.matchAll(/\["([a-z]+)",\s*"[^"]+",\s*"([^"]+)",\s*"[^"]*"\]/g)) boardNames[m[1]] = m[2]; } catch {}
const pageName = p => { const [v, ...rest] = p.split("-"), id = rest.join("-"); const base = PAGE_NAMES[v] || v; if (!id) return base; if (v === "board") return "分类：" + (boardNames[id] || id); if (v === "tools") return "工具：" + (TOOL_NAMES[id] || id); if (v === "chaoshi") return "特价单：" + id; return base + "：" + id; };
const REASONS = { scam: "诈骗", illegal: "违法", spam: "广告刷屏", expired: "已过期", other: "其他" };

const row = (a, b, c = "") => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${a}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${b}</td>${c !== null ? `<td style="padding:6px 10px;border-bottom:1px solid #eee;color:#777">${c}</td>` : ""}</tr>`;
const table = rows => `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join("")}</table>`;
const sec = (title, body) => `<h2 style="font-size:17px;margin:26px 0 8px;border-left:4px solid #B8312A;padding-left:8px">${title}</h2>${body}`;
const today = new Date(), from = new Date(Date.now() - 7 * 864e5);
let html = `<div style="font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;max-width:640px;margin:auto;color:#1B1F2A;line-height:1.6">
<h1 style="font-size:22px;margin:0">华脉每周报告</h1><p style="color:#777;margin:4px 0 0">${nyDay(from)} – ${nyDay(today)} · <a href="${SITE}">huamai88.com</a></p>`;

html += sec(issues.length ? `⚠️ 需要你注意（${issues.length}）` : "✅ 本周一切正常", issues.length ? `<ul style="padding-left:20px;margin:0">${issues.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p style="margin:0">网站、App、新闻、特价单和实时到站都在正常运行。</p>`);

if (db) {
  html += sec("📈 访问量", table([
    row("本周页面浏览", db.views.toLocaleString(), "上周 " + db.views_prev.toLocaleString() + pct(db.views, db.views_prev)),
    row("其中来自 App", db.views_app.toLocaleString(), db.views ? Math.round(db.views_app / db.views * 100) + "%" : ""),
    ...(db.views_daily || []).map(d => row(nyDay(d.day + "T12:00:00"), Number(d.n).toLocaleString(), "")),
  ]) + `<p style="color:#777;font-size:12.5px;margin:6px 0 0">只统计打开了哪个页面，不记录任何个人信息。</p>`);
  html += sec("🔥 最多人看的地方", (db.top_pages || []).length ? table(db.top_pages.map((p, i) => row(`${i + 1}. ${esc(pageName(p.path))}`, Number(p.n).toLocaleString(), null))) : "<p>本周还没有数据（统计刚开始）。</p>");
  html += sec("📝 发帖和互动", table([
    row("新帖子", db.posts_new, "上周 " + db.posts_prev + pct(db.posts_new, db.posts_prev)),
    row("网站上的帖子总数", db.posts_total, ""),
    row("帖子回复", db.replies_new < 0 ? "—" : db.replies_new, ""),
    row("新闻评论", db.comments_new < 0 ? "—" : db.comments_new, db.comments_new < 0 ? "还没运行 11-guests-comments.sql" : ""),
    row("新注册用户", db.users_new < 0 ? "—" : db.users_new, db.users_total >= 0 ? "总共 " + db.users_total : ""),
  ]) + ((db.posts_by_board || []).length ? `<p style="margin:8px 0 2px;font-weight:700">本周哪些版块有人发帖：</p><p style="margin:0">${db.posts_by_board.map(b => `${esc(boardNames[b.board] || b.board)} ${b.n}`).join(" · ")}</p>` : ""));
  html += sec(`🚩 举报（本周 ${db.reports_new} 次）`, (db.reported || []).length
    ? table(db.reported.map(p => row(`<a href="${SITE}/p/${p.id}/">${esc(p.title)}</a><br><span style="color:#777;font-size:12.5px">${esc(boardNames[p.board] || p.board)} · ${esc(String(p.reasons || "").split(",").map(r => REASONS[r] || r).join("、"))}</span>`, p.n + " 人", p.hidden ? "已自动隐藏" : "还在显示")))
      + `<p style="color:#777;font-size:12.5px;margin:6px 0 0">3 个不同的人举报会自动隐藏。要恢复或删除：Supabase → Table Editor → posts，找到对应编号修改 hidden。</p>`
    : "<p style=\"margin:0\">本周没有人举报。</p>");
}

html += sec("🤖 自动抓取", table([
  row("新闻", news ? `${(news.feeds || []).filter(f => f.ok).length}/${(news.feeds || []).length} 个来源正常` : "—", news ? "最后更新 " + ago(news.updatedAt) : ""),
  ...(badFeeds.length ? [row("抓取失败的新闻来源", badFeeds.length, esc(badFeeds.slice(0, 6).join("、")))] : []),
  ...(emptyFeeds.length ? [row("本次没抓到新文章", emptyFeeds.length, esc(emptyFeeds.slice(0, 6).join("、")))] : []),
  row("本周优惠", deals ? `${Object.values(deals.sections || {}).reduce((a, l) => a + l.length, 0)} 条` : "—", deals ? "最后更新 " + ago(deals.updatedAt) : ""),
  row("超市特价单", flyers ? `${(flyers.stores || []).filter(s => (s.imgs || []).length).length} 家有图` : "—", flyers ? "最后抓取 " + ago(flyers.updated) + (staleFlyers.length ? ` · ${staleFlyers.length} 家没更新` : "") : ""),
  row("美股行情", market ? "正常" : "—", market?.updatedAt ? "最后更新 " + ago(market.updatedAt) : ""),
]) + (jobs.length ? `<p style="margin:10px 0 4px;font-weight:700">自动任务运行记录（本周）：</p>` + table(jobs.sort((a, b) => b.bad - a.bad).map(j => row(esc(j.name), `${j.ok} ✓${j.bad ? ` / ${j.bad} ✗` : ""}`, j.bad && j.lastBad ? `<a href="${j.lastBad}">看失败记录</a>` : "最后一次 " + ago(j.last)))) : ""));

html += sec("🩺 现在的运行状态", table(live.map(l => row(esc(l.name), l.ok ? "✅ 正常" : "❌ 异常", l.ok ? (l.ms + " 毫秒") : esc(l.note)))));
html += `<p style="color:#999;font-size:12px;margin-top:30px">这封邮件每周一早上由网站自动发送。不想收或想改内容，跟 Claude 说一声就行。</p></div>`;

/* 6. send */
const subject = `华脉每周报告 ${nyDay(from)}–${nyDay(today)}${issues.length ? ` · ⚠️ ${issues.length} 项需要注意` : " · 一切正常"}`;
await fs.writeFile("weekly-report.html", html);
const pass = process.env.GMAIL_APP_PASSWORD;
if (!pass) { console.log("::warning title=report::GMAIL_APP_PASSWORD not set; report saved as artifact only"); process.exit(0); }
const nodemailer = (await import("nodemailer")).default;
const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: "huamai.us@gmail.com", pass: pass.replace(/\s+/g, "") } });
await tr.sendMail({ from: '"华脉网站" <huamai.us@gmail.com>', to: TO, subject, html });
console.log(`::notice title=report::sent to ${TO}: ${subject}`);
