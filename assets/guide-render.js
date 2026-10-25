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
     answers: { nyc: bool, age: number, size: 1-8, monthly: number, status: citizen|lpr5|lpr|refugee|other|none,
                flags: { preg: bool, kids: bool, disabled: bool, renter: bool, regulated: bool } }
     Each guide may carry `check`: { minAge, maxAge, maxFpl, maxYearly, nycOnly, status:[...], maybeStatus:[...], needs:[flag...] , anyOf:[flag...] } */
  function fplYear(fpl, size) {
    if (!fpl) return null;
    const t = fpl.table || [];
    if (size <= t.length) return t[size - 1];
    return t[t.length - 1] + (size - t.length) * (fpl.add || 0);
  }
  function evaluate(data, a) {
    const out = [];
    const yearly = (Number(a.monthly) || 0) * 12;
    const fpl = fplYear(data.fpl, a.size || 1);
    for (const g of data.guides || []) {
      const c = g.check; if (!c) continue;
      let level = "likely";
      const reasons = [];
      if (c.nycOnly && !a.nyc) continue;
      if (c.minAge && a.age < c.minAge) continue;
      if (c.maxAge && a.age > c.maxAge) continue;
      if (c.needs && !c.needs.every(f => a.flags && a.flags[f])) continue;
      if (c.anyOf && !c.anyOf.some(f => a.flags && a.flags[f])) continue;
      if (c.maxFpl && fpl && yearly > fpl * c.maxFpl / 100) continue;
      if (c.maxYearly && yearly > c.maxYearly) continue;
      if (c.status) {
        if (c.status.includes(a.status)) { /* ok */ }
        else if (c.maybeStatus && c.maybeStatus.includes(a.status)) { level = "maybe"; reasons.push("status"); }
        else continue;
      }
      out.push({ g, level, reasons });
    }
    out.sort((x, y) => (x.level === y.level ? 0 : x.level === "likely" ? -1 : 1));
    return { results: out, yearly, fpl, pct: fpl ? Math.round(yearly / fpl * 100) : null };
  }

  root.HLG = { renderGuide, renderIndex, evaluate, fplYear, UI, L, LA, esc };
})(typeof window !== "undefined" ? window : globalThis);
