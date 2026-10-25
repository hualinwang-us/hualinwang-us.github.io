// Once a day, checks the official pages each guide is based on. When a page's text changes,
// it records the date in data/watch.json (the guide then shows a "may need review" note) and
// opens or updates one GitHub issue so the site owner gets an email. No dependencies.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const readJSON = async (p, d) => { try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return d; } };

const guides = await readJSON("data/guides.json", { guides: [] });
const state = await readJSON("data/watch.json", { lastRun: null, pages: {} });
const now = new Date();
if (state.lastRun && now - new Date(state.lastRun) < 20 * 3600e3 && !process.env.FORCE_WATCH) {
  console.log("watch: checked less than 20h ago, skipping");
  process.exit(0);
}

// Text that matters: drop scripts, styles, navigation chrome, tags, and volatile bits like timestamps.
function normalize(html) {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\b(last (updated|modified|reviewed)|updated|page last)[^.]{0,60}/gi, " ")
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return normalize(await r.text());
  } finally { clearTimeout(t); }
}

const urls = [...new Set((guides.guides || []).flatMap(g => g.watch || []))];
const today = now.toISOString().slice(0, 10);
const changes = [];
for (const url of urls) {
  const prev = state.pages[url] || {};
  try {
    const text = await fetchText(url);
    if (text.length < 200) throw new Error("page too short");
    const hash = crypto.createHash("sha1").update(text).digest("hex");
    if (prev.hash && prev.hash !== hash) {
      // Require the new version to be seen twice in a row, so one-off glitches don't raise alarms.
      if (prev.pending === hash) { state.pages[url] = { hash, changed: today, checked: today }; changes.push(url); }
      else state.pages[url] = { ...prev, pending: hash, checked: today };
    } else {
      state.pages[url] = { hash, changed: prev.changed || null, checked: today };
    }
  } catch (e) {
    state.pages[url] = { ...prev, checked: today, error: String(e.message || e).slice(0, 80) };
  }
}
state.lastRun = now.toISOString();
await fs.writeFile("data/watch.json", JSON.stringify(state, null, 1));
console.log(`watch: ${urls.length} pages checked, ${changes.length} changed`);

// Tell the owner through a GitHub issue (GitHub emails the repo owner).
const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPOSITORY;
if (changes.length && token && repo) {
  const api = (path, opts = {}) => fetch(`https://api.github.com/repos/${repo}${path}`, { ...opts,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "hualin-watch" } });
  const affected = (guides.guides || []).filter(g => (g.watch || []).some(u => changes.includes(u)));
  const body = `以下官方页面在 ${today} 有变动，相关指南可能需要复核：\n\n` +
    changes.map(u => `- ${u}`).join("\n") + "\n\n涉及的指南：\n" +
    affected.map(g => `- ${g.title.zh}（data/guides.json 里的 \`${g.id}\`）`).join("\n") +
    "\n\n复核后，把该指南的 `verified` 改成当天日期，页面上的提醒就会消失。";
  try {
    const open = await (await api("/issues?state=open&labels=policy-watch&per_page=1")).json();
    if (Array.isArray(open) && open.length) await api(`/issues/${open[0].number}/comments`, { method: "POST", body: JSON.stringify({ body }) });
    else await api("/issues", { method: "POST", body: JSON.stringify({ title: "福利指南：官方页面有变动，请复核", body, labels: ["policy-watch"] }) });
    console.log("watch: owner notified");
  } catch (e) { console.log("watch: could not open issue:", e.message); }
}
