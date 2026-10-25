/* 华脉 share sheet: WeChat (copy link / QR code / in-WeChat hint), WhatsApp, Facebook, LINE, X, SMS, email, copy.
   Used on every page: HLShare.open({ url, title, text }). */
(function () {
  "use strict";
  const zh = () => (document.documentElement.lang || "zh").startsWith("zh");
  const T = () => zh() ? {
    title: "分享给亲友", wechat: "微信", wechatTip: "链接已复制。打开微信，粘贴到聊天或朋友圈即可。", inWechat: "点右上角 ··· ，选择“发送给朋友”或“分享到朋友圈”。",
    qr: "用微信扫码，在手机上打开后转发", more: "更多", copy: "复制链接", copied: "已复制", sms: "短信", email: "邮件", close: "关闭", system: "手机分享"
  } : {
    title: "Share", wechat: "WeChat", wechatTip: "Link copied. Open WeChat and paste it into a chat or Moments.", inWechat: "Tap ··· at the top right, then \"Send to Friend\" or \"Share to Moments\".",
    qr: "Scan with WeChat to open on your phone and share", more: "More", copy: "Copy link", copied: "Copied", sms: "Text", email: "Email", close: "Close", system: "Share via phone"
  };
  const inWeChat = /MicroMessenger/i.test(navigator.userAgent);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let dlg = null, qrLoaded = null;

  function loadQR() {
    if (window.QRCode) return Promise.resolve();
    if (qrLoaded) return qrLoaded;
    qrLoaded = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return qrLoaded;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e2) {} ta.remove(); return ok;
    }
  }

  function open(opts) {
    const t = T();
    const url = opts.url || location.href;
    const title = opts.title || document.title;
    const text = opts.text || title;
    const msg = text + "\n" + url;
    const enc = encodeURIComponent;
    const links = [
      ["WhatsApp", "wa", `https://wa.me/?text=${enc(msg)}`],
      ["Facebook", "fb", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
      ["LINE", "line", `https://social-plugins.line.me/lineit/share?url=${enc(url)}`],
      ["X", "tw", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
      [t.sms, "sms", `sms:?&body=${enc(msg)}`],
      [t.email, "mail", `mailto:?subject=${enc(title)}&body=${enc(msg)}`]
    ];
    if (dlg) dlg.remove();
    dlg = document.createElement("dialog");
    dlg.className = "share-dlg";
    dlg.innerHTML = `<div class="sh">
      <button type="button" class="x" data-sh-close aria-label="${esc(t.close)}">×</button>
      <h3>${esc(t.title)}</h3>
      <p class="sh-title">${esc(text)}</p>
      ${inWeChat ? `<div class="sh-wx-hint">${esc(t.inWechat)}</div>` : ""}
      <div class="sh-grid">
        <button type="button" class="sh-btn wx" data-sh="wechat"><span class="sh-ic">微</span>${esc(t.wechat)}</button>
        ${(navigator.share || window.HuaLinApp) && !inWeChat ? `<button type="button" class="sh-btn" data-sh="system"><span class="sh-ic">⇪</span>${esc(t.system)}</button>` : ""}
        ${links.map(([label, cls, href]) => `<a class="sh-btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><span class="sh-ic">${esc(label.slice(0, 1))}</span>${esc(label)}</a>`).join("")}
        <button type="button" class="sh-btn" data-sh="copy"><span class="sh-ic">⧉</span>${esc(t.copy)}</button>
      </div>
      <p class="sh-msg" role="status"></p>
      <div class="sh-qr" hidden><div class="sh-qr-box"></div><p>${esc(t.qr)}</p></div>
      <input class="sh-url" readonly value="${esc(url)}" aria-label="URL">
    </div>`;
    document.body.appendChild(dlg);
    const say = m => { dlg.querySelector(".sh-msg").textContent = m; };
    dlg.addEventListener("click", async e => {
      if (e.target === dlg || e.target.closest("[data-sh-close]")) { dlg.close(); return; }
      const b = e.target.closest("[data-sh]"); if (!b) return;
      const k = b.dataset.sh;
      if ((k === "wechat" || k === "system") && window.HuaLinApp && window.HuaLinApp.share) { try { window.HuaLinApp.share(msg, window.__hlt || ""); dlg.close(); return; } catch (err) {} }
      if (k === "wechat") {
        const ok = await copy(msg);
        say(ok ? t.wechatTip : "");
        if (!ok) { const u = dlg.querySelector(".sh-url"); u.focus(); u.select(); }
        if (!inWeChat) {
          const q = dlg.querySelector(".sh-qr"); q.hidden = false;
          const box = q.querySelector(".sh-qr-box");
          if (!box.firstChild) loadQR().then(() => { new window.QRCode(box, { text: url, width: 168, height: 168, correctLevel: window.QRCode.CorrectLevel.M }); }).catch(() => { q.hidden = true; });
        }
      } else if (k === "system") {
        try { await navigator.share({ title, text, url }); dlg.close(); } catch (err) {}
      } else if (k === "copy") {
        const ok = await copy(url); say(ok ? t.copied : "");
        if (!ok) { const u = dlg.querySelector(".sh-url"); u.focus(); u.select(); }
      }
    });
    dlg.addEventListener("close", () => { setTimeout(() => { if (dlg && !dlg.open) { dlg.remove(); dlg = null; } }, 50); });
    dlg.showModal();
  }
  window.HLShare = { open };
})();
