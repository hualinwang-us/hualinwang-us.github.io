/* 华邻网 single-listing page (/p/<id>/). Works from the pre-built page data or, for brand-new listings, loads it live. */
(function () {
  "use strict";
  const HLC = window.HLC;
  const T = {
    zh: { tagline: "在美华人 · 新闻与生活信息", postFree: "免费发布", foot1: "在美华人新闻与免费分类信息。", footSafeH: "安全提示",
      footSafe: "分类信息由用户自行发布，请自行核实；交易当面确认，切勿预付定金，谨防诈骗。", contact: "联系方式", phone: "电话", wx: "微信",
      copy: "复制", copied: "已复制", call: "拨打", share: "分享到微信", report: "举报", reportH: "举报原因", reportSend: "提交举报",
      reported: "已收到举报，谢谢你帮忙把关", reportFail: "举报失败，请稍后再试", alreadyReported: "你已经举报过这条信息",
      linkCopied: "链接已复制，打开微信粘贴到群里即可", shareManual: "长按下面的链接复制：", scamH: "防骗提醒",
      scamP: "这条信息提到{x}。正规雇主和房东不会要求你先付钱或提供证件号码。见面确认前不要转账。",
      safety: "请当面交易，切勿预付定金或转账给陌生人。", moreIn: "更多{b}信息", home: "回到华邻网首页", loading: "载入中…",
      gone: "这条信息已经删除或下架。", footLegal: "免责声明", footLegalP: "本信息由用户发布，本站未核实其内容，也不参与交易。", footLegalLink: "阅读完整免责声明 →", notFound: "找不到这个页面。", del: "删除我的信息", delSure: "确认删除？", deleted: "已删除", delFail: "删除失败，请稍后再试" },
    en: { tagline: "News & community listings for Chinese Americans", postFree: "Post Free", foot1: "News and free listings for Chinese Americans.",
      footSafeH: "Stay safe", footSafe: "Listings are posted by users. Verify details, meet in person and never send deposits to strangers.",
      contact: "Contact", phone: "Phone", wx: "WeChat", copy: "Copy", copied: "Copied", call: "Call", share: "Share", report: "Report",
      reportH: "Why are you reporting this?", reportSend: "Send report", reported: "Thanks, we got your report", reportFail: "Couldn't send the report. Please try again.",
      alreadyReported: "You already reported this listing", linkCopied: "Link copied. Paste it into a chat to share.", shareManual: "Press and hold to copy the link:",
      scamH: "Scam warning", scamP: "This listing mentions {x}. Real employers and landlords don't ask you to pay first or share ID numbers. Don't send money before meeting in person.",
      safety: "Meet in person. Never prepay or wire money to strangers.", moreIn: "More in {b}", home: "Back to HuaLin home", loading: "Loading…",
      gone: "This listing has been removed.", footLegal: "Disclaimer", footLegalP: "Posted by a user. We haven't verified it and aren't part of any transaction.", footLegalLink: "Read the full disclaimer →", notFound: "Page not found.", del: "Delete my listing", delSure: "Confirm delete?", deleted: "Deleted", delFail: "Couldn't delete. Please try again." }
  };
  let lang = "zh"; try { lang = localStorage.getItem("hl-lang") || "zh"; } catch (e) {}
  let post = window.HL_POST || null, state = post ? "ok" : "loading";
  const $ = s => document.querySelector(s);
  const t = k => T[lang][k] || T.zh[k] || k;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const base = HLC.siteBase();
  function toast(m) { const el = $("#toast"); el.textContent = m; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2400); }

  function chrome() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    $("#lzh").setAttribute("aria-pressed", String(lang === "zh")); $("#len").setAttribute("aria-pressed", String(lang === "en"));
    ["tagline", "foot1", "footSafeH", "footSafe", "footLegal", "footLegalP", "footLegalLink"].forEach(k => { const el = document.getElementById(k); if (el) el.textContent = t(k); });
    $("#postLink").textContent = t("postFree");
    $("#today").textContent = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "America/New_York" });
  }

  function render() {
    const box = $("#post");
    if (state !== "ok") {
      const msg = state === "loading" ? t("loading") : state === "gone" ? t("gone") : t("notFound");
      box.innerHTML = `<article class="pcard"><p>${esc(msg)}</p><div class="pmore"><a href="${esc(base)}">${esc(t("home"))} →</a></div></article>`;
      return;
    }
    const p = post, b = HLC.boardById(p.board), bn = b ? (lang === "zh" ? b.zh : b.en) : "";
    const hits = HLC.scamHits(p.title + " " + p.body);
    const hitText = lang === "zh" ? "“" + hits.map(h => h.zh).join("”“") + "”" : hits.map(h => h.en).join(", ");
    const tel = (p.phone || "").replace(/[^\d+]/g, "");
    const myKey = HLC.keys.get(p.id);
    document.title = (p.area ? "[" + p.area + "] " : "") + p.title + " - 华邻网";
    box.innerHTML = `<article class="pcard">
      <span class="tag">${esc(bn)}${p.area ? " · " + esc(p.area) : ""} · ${esc(new Date(p.created_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US"))}</span>
      <h1>${esc(p.title)}</h1>
      <div class="detail-body">${esc(p.body)}</div>
      ${(p.images || []).length ? `<div class="gallery">${p.images.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join("")}</div>` : ""}
      <div class="contact"><b>${esc(t("contact"))}</b>${p.contact ? `<span>${esc(p.contact)}</span>` : ""}
        ${p.phone ? `<span>${esc(t("phone"))} <span class="v" id="cpP">${esc(p.phone)}</span></span><button type="button" class="copy" data-copy="cpP">${esc(t("copy"))}</button>${tel.length >= 7 ? `<a class="copy call" href="tel:${esc(tel)}">${esc(t("call"))}</a>` : ""}` : ""}
        ${p.wechat ? `<span>${esc(t("wx"))} <span class="v" id="cpW">${esc(p.wechat)}</span></span><button type="button" class="copy" data-copy="cpW">${esc(t("copy"))}</button>` : ""}</div>
      ${hits.length ? `<div class="scam" role="note"><b>${esc(t("scamH"))}</b><p>${esc(t("scamP").replace("{x}", hitText))}</p></div>` : `<p class="warn">${esc(t("safety"))}</p>`}
      <div class="post-actions">
        <button type="button" class="btn" id="shareBtn">${esc(t("share"))}</button>
        <button type="button" class="btn ghost" id="repBtn">${esc(t("report"))}</button>
        ${myKey ? `<button type="button" class="btn ghost" id="delBtn">${esc(t("del"))}</button>` : ""}
      </div>
      <div class="manual" id="manualBox" hidden><span>${esc(t("shareManual"))}</span><input readonly value="${esc(HLC.postUrl(p.id))}"></div>
      <div class="reasons" id="repBox" hidden><b>${esc(t("reportH"))}</b>
        ${HLC.REPORT_REASONS.map(([k, zh, en], i) => `<label><input type="radio" name="rr" value="${k}" ${i === 0 ? "checked" : ""}> ${esc(lang === "zh" ? zh : en)}</label>`).join("")}
        <button type="button" class="btn" id="repSend">${esc(t("reportSend"))}</button></div>
    </article>
    <div class="pmore">${b ? `<a href="${esc(base)}#b-${esc(b.id)}">${esc(t("moreIn").replace("{b}", bn))} →</a>` : ""}<a href="${esc(base)}">${esc(t("home"))} →</a></div>`;
    $("#shareBtn").onclick = () => HLShare.open({ url: HLC.postUrl(p.id), title: (p.area ? "[" + p.area + "] " : "") + p.title, text: (p.area ? "[" + p.area + "] " : "") + p.title + " - 华邻网" });
    $("#repBtn").onclick = () => { if (HLC.reported.get(p.id)) { toast(t("alreadyReported")); return; } $("#repBox").hidden = !$("#repBox").hidden; };
    $("#repSend").onclick = async () => {
      const btn = $("#repSend"); btn.disabled = true;
      const picked = document.querySelector('#repBox input[name="rr"]:checked');
      try { await HLC.rpc("report_post", { p_id: p.id, p_reason: picked ? picked.value : "other" }); HLC.reported.set(p.id, 1); $("#repBox").hidden = true; toast(t("reported")); }
      catch (e) { btn.disabled = false; toast(t("reportFail")); }
    };
    const del = $("#delBtn");
    if (del) del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = t("delSure"); return; }
      del.disabled = true;
      try { const ok = await HLC.rpc("delete_post", { p_id: p.id, p_key: myKey }); if (ok === false) throw 0; HLC.keys.drop(p.id); state = "gone"; render(); toast(t("deleted")); }
      catch (e) { del.disabled = false; toast(t("delFail")); }
    };
  }

  document.addEventListener("click", e => {
    const c = e.target.closest("[data-copy]"); if (!c) return;
    const el = document.getElementById(c.dataset.copy);
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(() => toast(t("copied")), sel); else sel();
  });
  $("#lzh").onclick = () => { lang = "zh"; try { localStorage.setItem("hl-lang", lang); } catch (e) {} chrome(); render(); };
  $("#len").onclick = () => { lang = "en"; try { localStorage.setItem("hl-lang", lang); } catch (e) {} chrome(); render(); };

  chrome(); render();

  // Always re-check with the database: catches brand-new listings (not yet pre-built) and removed ones.
  const m = location.pathname.match(/\/p\/(\d+)\/?$/);
  const id = post ? post.id : (m ? m[1] : null);
  if (!id) { if (!post) { state = "missing"; render(); } return; }
  if (!HLC.POSTS_ON) return;
  HLC.getPost(id).then(row => {
    if (row) { post = row; state = "ok"; } else { state = "gone"; }
    render();
  }).catch(() => { if (!post) { state = "missing"; render(); } });
})();
