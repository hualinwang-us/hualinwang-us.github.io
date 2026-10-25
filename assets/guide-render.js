/* 华邻网 guides: rendering and the "what can I apply for" check.
   Shared by the home page (browser) and the page builder (Node). Content lives in data/guides.json. */
(function (root) {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = (o, lang) => (o && typeof o === "object" && !Array.isArray(o) ? (o[lang] || o.zh || o.en || "") : (o || ""));
  const LA = (o, lang) => { const v = o && typeof o === "object" && !Array.isArray(o) ? (o[lang] || o.zh || o.en) : o; return Array.isArray(v) ? v : (v ? [v] : []); };
  // Inline **bold** only; everything else is escaped.
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  const UI = {
    zh: { who: "谁能申请", docs: "需要准备的材料", how: "怎么申请", contacts: "电话与网址", myths: "常见误区", news: "最新变化",
      sources: "官方资料来源", verified: "本文核实于", changed: "官方页面在 {d} 有更新，本文内容可能需要复核，请以官方网站为准。",
      disclaimer: "本指南为一般信息，不是法律或专业意见。各项规定经常调整，申请前请以官方网站或工作人员的说明为准。",
      share: "分享到微信", all: "全部指南", back: "← 返回指南目录", phone: "电话", web: "网站", chinese: "有中文服务" },
    en: { who: "Who can apply", docs: "Documents to prepare", how: "How to apply", contacts: "Phone & websites", myths: "Common mistakes", news: "What changed recently",
      sources: "Official sources", verified: "Checked on", changed: "The official page changed on {d}. This guide may need review; the official site is the final word.",
      disclaimer: "This guide is general information, not legal or professional advice. Rules change often; confirm with the official website or agency staff before applying.",
      share: "Share", all: "All guides", back: "← Back to guides", phone: "Phone", web: "Website", chinese: "Chinese available" }
  };

  function list(items, ordered) {
    if (!items.length) return "";
    const tag = ordered ? "ol" : "ul";
    return `<${tag} class="g-list">${items.map(i => `<li>${rich(i)}</li>`).join("")}</${tag}>`;
  }

  function renderGuide(g, lang, opts) {
    opts = opts || {};
    const u = UI[lang] || UI.zh;
    const watch = opts.watch || {};
    const changed = (g.watch || []).map(w => watch[w] && watch[w].changed).filter(d => d && d > (g.verified || "")).sort().pop();
    const contacts = (g.contacts || []).map(c => `<li><b>${esc(L(c.label, lang))}</b>${c.phone ? `<span class="g-ph">${esc(u.phone)} <span class="v">${esc(c.phone)}</span></span>` : ""}${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.urlText || c.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}${c.chinese ? `<span class="g-zh">${esc(u.chinese)}</span>` : ""}${L(c.note, lang) ? `<span class="g-note">${rich(L(c.note, lang))}</span>` : ""}</li>`).join("");
    return `<article class="guide">
      <div class="g-head"><span class="seal md" aria-hidden="true">${esc(g.glyph || "指")}</span><div><h1>${esc(L(g.title, lang))}</h1><p class="g-sum">${rich(L(g.summary, lang))}</p></div></div>
      ${changed ? `<div class="g-alert">${esc(u.changed.replace("{d}", changed))}</div>` : ""}
      ${LA(g.news, lang).length ? `<section class="g-news"><h2>${esc(u.news)}</h2>${list(LA(g.news, lang))}</section>` : ""}
      ${LA(g.who, lang).length ? `<section><h2>${esc(u.who)}</h2>${list(LA(g.who, lang))}</section>` : ""}
      ${LA(g.how, lang).length ? `<section><h2>${esc(u.how)}</h2>${list(LA(g.how, lang), true)}</section>` : ""}
      ${LA(g.docs, lang).length ? `<section><h2>${esc(u.docs)}</h2>${list(LA(g.docs, lang))}</section>` : ""}
      ${contacts ? `<section><h2>${esc(u.contacts)}</h2><ul class="g-contacts">${contacts}</ul></section>` : ""}
      ${LA(g.myths, lang).length ? `<section class="g-myths"><h2>${esc(u.myths)}</h2>${list(LA(g.myths, lang))}</section>` : ""}
      ${(g.sources || []).length ? `<section class="g-src"><h2>${esc(u.sources)}</h2><ul>${g.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(L(s.name, lang) || s.url)}</a></li>`).join("")}</ul></section>` : ""}
      <p class="g-fine">${esc(u.verified)} ${esc(g.verified || "")} · ${esc(u.disclaimer)}</p>
    </article>`;
  }

  function renderIndex(data, lang, linkFor) {
    const groups = data.groups || [];
    return groups.map(gr => {
      const items = (data.guides || []).filter(g => g.group === gr.id);
      if (!items.length) return "";
      return `<section class="g-group"><h2>${esc(L(gr, lang))}</h2><div class="g-cards">${items.map(g => `<a class="g-card" href="${esc(linkFor(g))}"><span class="seal sm" aria-hidden="true">${esc(g.glyph || "指")}</span><span><b>${esc(L(g.title, lang))}</b><small>${esc(L(g.short || g.summary, lang))}</small></span></a>`).join("")}</div></section>`;
    }).join("");
  }

  /* ---------- the check ----------
     answers: { nyc, age, size, monthly, status: citizen|lpr5|lpr|refugee|other|none,
                flags: { preg, kids, disabled, renter, regulated } }
     Each rule returns "likely", "maybe", "info" or null. Numbers come from data/guides.json (fpl, ami80, ami130). */
  const LAWFUL = ["citizen", "lpr5", "lpr", "refugee"];
  const RULES = {
    "medicaid": a => {
      if (a.age < 19 || a.pct > 138) return null;
      if (a.status === "citizen" || a.status === "lpr5") return "likely";
      if (a.status === "none") return (a.age >= 65 || a.f.preg) ? "likely" : null;
      return "maybe";
    },
    "essential-plan": a => (a.age >= 19 && a.age <= 64 && a.pct <= 200 && (a.pct > 138 || a.status === "refugee") && a.status !== "none")
      ? (["citizen", "lpr5", "lpr", "refugee"].includes(a.status) ? "likely" : "maybe") : null,
    "child-health-plus": a => (a.f.kids || a.f.preg) ? "likely" : null,
    "nyc-care": a => a.nyc && (a.status === "none" || a.status === "other") ? "likely" : null,
    "medicare-help": a => a.age >= 65 && a.status !== "none" ? (a.pct <= 186 ? "likely" : "maybe") : null,
    "snap": a => {
      const limit = (a.age >= 60 || a.f.disabled) ? 200 : 150;
      if (a.pct > limit) return null;
      if (a.status === "citizen" || a.status === "lpr5") return "likely";
      if (a.status === "lpr") return a.f.kids ? "likely" : "maybe";
      if (a.status === "refugee") return "maybe";
      return a.f.kids ? "maybe" : null;
    },
    "wic": a => (a.f.preg && a.pct <= 185) ? "likely" : null,
    "cash-assistance": a => {
      if (a.pct > 100) return null;
      if (LAWFUL.includes(a.status)) return "maybe";
      return a.status === "other" || a.f.kids ? "maybe" : null;
    },
    "heap": a => a.pct <= 249 ? (LAWFUL.includes(a.status) ? "likely" : (a.f.kids ? "maybe" : null)) : null,
    "fair-fares": a => (a.nyc && a.age >= 18 && a.age <= 64) ? (a.pct <= 150 ? "likely" : a.pct <= 200 ? "maybe" : null) : null,
    "free-tax": a => a.yearly <= (a.f.kids ? 97000 : 68000) ? "likely" : null,
    "lifeline": a => a.pct <= 135 ? "likely" : null,
    "school-meals": a => a.f.kids ? "likely" : null,
    "nycha": a => (a.nyc && a.yearly <= a.ami80) ? (LAWFUL.includes(a.status) ? "likely" : "maybe") : null,
    "housing-connect": a => (a.nyc && a.yearly <= a.ami130) ? "likely" : null,
    "scrie": a => (a.nyc && a.f.regulated && a.yearly <= 50000) ? (a.age >= 62 ? "likely" : a.f.disabled ? "maybe" : null) : null,
    "tenant-help": a => (a.nyc && a.f.renter && a.pct <= 200) ? "likely" : null,
    "senior-housing": a => (a.nyc && a.age >= 62 && a.yearly <= a.ami80) ? "likely" : null,
    "senior-services": a => (a.nyc && a.age >= 60) ? "likely" : null,
    "idnyc": a => (a.nyc && a.age >= 10 && ["none", "other", "refugee", "lpr"].includes(a.status)) ? "likely" : null,
    "prek": a => (a.nyc && (a.f.kids || a.f.preg)) ? "likely" : null,
    "naturalization": a => a.status === "lpr5" ? "likely" : a.status === "lpr" ? "maybe" : null,
    "green-card": a => ["other", "refugee"].includes(a.status) ? "info" : null,
    "public-charge": a => ["lpr", "other", "none", "refugee"].includes(a.status) ? "info" : null,
    "legal-help": a => ["other", "none", "refugee", "lpr", "lpr5"].includes(a.status) ? "info" : null
  };
  function fplYear(fpl, size) {
    if (!fpl) return null;
    const t = fpl.table || [];
    if (size <= t.length) return t[size - 1];
    return t[t.length - 1] + (size - t.length) * (fpl.add || 0);
  }
  const fromTable = (t, size) => (!t || !t.length) ? Infinity : size <= t.length ? t[size - 1] : t[t.length - 1] * (1 + 0.08 * (size - t.length));
  function evaluate(data, ans) {
    const yearly = (Number(ans.monthly) || 0) * 12;
    const fpl = fplYear(data.fpl, ans.size || 1);
    const a = { nyc: !!ans.nyc, age: Number(ans.age) || 0, size: ans.size || 1, status: ans.status, f: ans.flags || {}, yearly,
      pct: fpl ? yearly / fpl * 100 : 0, ami80: fromTable(data.ami80, ans.size || 1), ami130: fromTable(data.ami130, ans.size || 1) };
    const order = { likely: 0, maybe: 1, info: 2 };
    const out = [];
    for (const g of data.guides || []) {
      const rule = RULES[g.id]; if (!rule) continue;
      const level = rule(a); if (level) out.push({ g, level });
    }
    out.sort((x, y) => order[x.level] - order[y.level]);
    return { results: out, yearly, fpl, pct: fpl ? Math.round(yearly / fpl * 100) : null };
  }

  root.HLG = { renderGuide, renderIndex, evaluate, fplYear, UI, L, LA, esc };
})(typeof window !== "undefined" ? window : globalThis);
