/* 华脉 share image: turns a listing into a phone-sized picture (title, price, photo, contact, QR code)
   that posters can save or send to WeChat groups and Moments. Everything is drawn in the browser. */
(function () {
  "use strict";
  const W = 750, PAD = 40;
  const SERIF = '"Noto Serif SC","Songti SC","STSong",serif', SANS = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  let qrLib = null;
  function loadQR() {
    if (window.QRCode) return Promise.resolve();
    if (!qrLib) qrLib = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return qrLib;
  }
  async function qrCanvas(text, size) {
    await loadQR();
    const box = document.createElement("div"); box.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(box);
    new window.QRCode(box, { text, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M });
    const c = box.querySelector("canvas"); box.remove(); return c;
  }
  function loadImg(src) {
    return new Promise(res => { if (!src) return res(null); const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; setTimeout(() => res(null), 6000); });
  }
  function price(p) {
    const txt = p.title + " " + p.body;
    const m = txt.match(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:\/|每)\s?(?:月|周|小时|天|晚|mo|month|hr|hour|wk|week))?/i) || txt.match(/\d[\d,]{2,}\s?(?:元|刀)(?:\s?\/\s?(?:月|周))?/);
    return m ? m[0].replace(/\s+/g, "") : "";
  }
  function wrap(ctx, text, maxW, maxLines) {
    const lines = []; let cur = "";
    for (const ch of String(text).replace(/\s+/g, " ")) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch === " " ? "" : ch; if (lines.length === maxLines) break; }
      else cur += ch;
    }
    if (lines.length < maxLines && cur) lines.push(cur);
    else if (lines.length === maxLines && cur) { let l = lines[maxLines - 1]; while (l && ctx.measureText(l + "…").width > maxW) l = l.slice(0, -1); lines[maxLines - 1] = l + "…"; }
    return lines;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  async function make(p, opts) {
    try { await document.fonts.ready; } catch (e) {}
    const board = opts.board || "", url = opts.url;
    const img = await loadImg((p.images || [])[0]);
    const qr = await qrCanvas(url, 220).catch(() => null);
    const c = document.createElement("canvas"); const ctx = c.getContext("2d");
    // measure first to size the card
    c.width = W; c.height = 10; ctx.font = `900 46px ${SERIF}`;
    const areaTag = p.area && !p.title.includes(p.area.split(" ")[0]) ? "【" + p.area + "】" : "";
    const tLines = wrap(ctx, areaTag + p.title, W - PAD * 2 - 48, 3);
    const contacts = [p.contact, p.phone && "☎ " + p.phone, p.wechat && "微信 " + p.wechat].filter(Boolean);
    ctx.font = `700 30px ${SANS}`;
    const oneLine = contacts.length && ctx.measureText(contacts.join("    ")).width <= W - PAD * 2 - 88;
    const cH = !contacts.length ? 0 : oneLine ? 70 : 24 + contacts.length * 44;
    ctx.font = `400 28px ${SANS}`;
    const bLines = wrap(ctx, p.body, W - PAD * 2 - 48, img ? 3 : 6);
    const pr = price(p);
    const photoH = img ? 400 : 0;
    const cardH = 40 + 44 + 24 + photoH + (img ? 28 : 0) + tLines.length * 62 + (pr ? 76 : 10) + bLines.length * 44 + 30 + (cH ? cH + 20 : 0) + 30;
    const H = 200 + cardH + 40 + 290;
    c.width = W; c.height = H;
    // paper background
    ctx.fillStyle = "#f5efe6"; ctx.fillRect(0, 0, W, H);
    // header band
    const g = ctx.createLinearGradient(0, 0, W, 200); g.addColorStop(0, "#c8372c"); g.addColorStop(1, "#9e241e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
    ctx.fillStyle = "#fff"; rr(ctx, PAD, 48, 104, 104, 18); ctx.fill();
    ctx.strokeStyle = "#c8372c"; ctx.lineWidth = 3; rr(ctx, PAD + 8, 56, 88, 88, 12); ctx.stroke();
    ctx.fillStyle = "#c8372c"; ctx.font = `900 66px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("脉", PAD + 52, 102);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff"; ctx.font = `900 50px ${SERIF}`; ctx.fillText("华脉", PAD + 128, 104);
    ctx.fillStyle = "#ffe3c2"; ctx.font = `600 27px ${SERIF}`; ctx.fillText("华脉一开，好事就来", PAD + 130, 146);
    // card
    const cx = PAD, cy = 170, cw = W - PAD * 2;
    ctx.save(); ctx.shadowColor = "rgba(60,20,10,.14)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fillStyle = "#fff"; rr(ctx, cx, cy, cw, cardH, 24); ctx.fill(); ctx.restore();
    let y = cy + 40; const ix = cx + 24, iw = cw - 48;
    // board tag
    ctx.font = `700 24px ${SANS}`; const tagW = ctx.measureText(board).width + 32;
    ctx.fillStyle = "#c8372c"; rr(ctx, ix, y, tagW, 44, 22); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(board, ix + 16, y + 30);
    ctx.fillStyle = "#8a8f9c"; ctx.font = `400 22px ${SANS}`; ctx.fillText(new Date(p.created_at || Date.now()).toLocaleDateString("zh-CN"), ix + tagW + 16, y + 30);
    y += 44 + 24;
    if (img) {
      ctx.save(); rr(ctx, ix, y, iw, photoH, 16); ctx.clip();
      const k = Math.max(iw / img.width, photoH / img.height), dw = img.width * k, dh = img.height * k;
      ctx.drawImage(img, ix + (iw - dw) / 2, y + (photoH - dh) / 2, dw, dh); ctx.restore();
      y += photoH + 28;
    }
    ctx.fillStyle = "#121a2b"; ctx.font = `900 46px ${SERIF}`;
    for (const l of tLines) { y += 52; ctx.fillText(l, ix, y); y += 10; }
    if (pr) { y += 62; ctx.fillStyle = "#c8372c"; ctx.font = `900 54px ${SANS}`; ctx.fillText(pr, ix, y); y += 14; } else y += 10;
    ctx.fillStyle = "#4a5163"; ctx.font = `400 28px ${SANS}`;
    for (const l of bLines) { y += 44; ctx.fillText(l, ix, y); }
    y += 30;
    if (cH) {
      ctx.fillStyle = "#fbeeec"; rr(ctx, ix, y, iw, cH, 14); ctx.fill();
      ctx.fillStyle = "#121a2b"; ctx.font = `700 30px ${SANS}`;
      if (oneLine) ctx.fillText(contacts.join("    "), ix + 20, y + 46);
      else contacts.forEach((l, n) => ctx.fillText(wrap(ctx, l, iw - 40, 1)[0], ix + 20, y + 46 + n * 44));
    }
    // footer with QR
    const fy = cy + cardH + 40;
    ctx.fillStyle = "#fff"; rr(ctx, PAD, fy, W - PAD * 2, 250, 24); ctx.fill();
    if (qr) { ctx.drawImage(qr, PAD + 24, fy + 15, 220, 220); }
    else { ctx.fillStyle = "#c8372c"; rr(ctx, PAD + 24, fy + 15, 220, 220, 18); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `900 120px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("脉", PAD + 134, fy + 125); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; }
    ctx.fillStyle = "#121a2b"; ctx.font = `900 40px ${SERIF}`; ctx.fillText("扫码查看详情", PAD + 280, fy + 88);
    ctx.fillStyle = "#c8372c"; ctx.font = `700 28px ${SANS}`; ctx.fillText("招聘 · 租房 · 二手 · 免费发布", PAD + 280, fy + 140);
    ctx.fillStyle = "#8a8f9c"; ctx.font = `400 22px ${SANS}`; ctx.fillText("华脉 · 纽约华人新闻与分类信息", PAD + 280, fy + 186);
    return c;
  }
  window.HLPoster = { make };
})();
