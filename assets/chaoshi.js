/* 华人超市特价单: weekly flyers from NY Chinese supermarkets (data/flyers.json, refreshed Fridays).
   Everything opens inside the site: pick an area (or use location), pick a store, flyer shows here; tap to zoom in an in-page viewer. */
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const AREAS = [["", "全部地区"], ["fl", "法拉盛"], ["el", "艾姆赫斯特"], ["co", "可乐娜"], ["ln", "小颈 · 湾边"], ["mh", "曼哈顿华埠"], ["bk", "布鲁克林"], ["li", "长岛"]];
  const PTS = { fl: [40.7590, -73.8300], el: [40.7370, -73.8780], co: [40.7450, -73.8620], ln: [40.7640, -73.7550], mh: [40.7155, -73.9970], bk: [40.6330, -74.0050], li: [40.7550, -73.5900] };
  let data = null, loading = null, area = null, locMsg = "", asked = false;
  try { const a = localStorage.getItem("hl-cs-area"); if (a !== null) area = a; } catch (e) {}
  const load = () => loading || (loading = fetch("data/flyers.json", { cache: "no-cache" }).then(r => r.json()).then(d => (data = d)).catch(() => (data = { stores: [] })));
  const md = iso => { if (!iso) return ""; const d = new Date(iso); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; };
  const saveArea = a => { area = a; try { localStorage.setItem("hl-cs-area", a); } catch (e) {} };
  function nearest(lat, lon) {
    let best = "", bd = 1e9;
    for (const [k, p] of Object.entries(PTS)) { const x = (lon - p[1]) * Math.cos(lat * Math.PI / 180), y = lat - p[0], d = Math.sqrt(x * x + y * y) * 111; if (d < bd) { bd = d; best = k; } }
    return bd < 45 ? best : null;
  }
  function locate(el, storeId) {
    if (!navigator.geolocation) { locMsg = "这台手机不支持定位，请直接选地区。"; render(el, storeId); return; }
    locMsg = "正在定位，找你附近的超市…"; render(el, storeId);
    navigator.geolocation.getCurrentPosition(p => {
      const a = nearest(p.coords.latitude, p.coords.longitude);
      locMsg = a ? "已按你的位置选好地区，可以随时换。" : "你好像不在纽约华人区附近，先显示全部超市。";
      saveArea(a || ""); render(el, "");
    }, () => { locMsg = "没拿到位置（可能没允许定位），请直接选地区。"; if (area === null) area = ""; render(el, storeId); }, { timeout: 10000, maximumAge: 600000 });
  }

  function render(el, storeId) {
    if (!data) { el.innerHTML = '<div class="skel"><i></i><i></i><i></i></div>'; load().then(() => render(el, storeId)); return; }
    // First visit: ask for location once to pick the nearest area (phones show the permission prompt).
    if (area === null && !asked) { asked = true; locate(el, storeId); return; }
    const cur0 = area || "";
    const shops = (data.stores || []).filter(s => s.imgs && s.imgs.length);
    const inArea = shops.filter(s => !cur0 || s.areas.includes(cur0));
    let cur = storeId ? shops.find(s => s.id === storeId) : null;
    if (!cur) cur = inArea[0] || null;
    const areaName = (AREAS.find(a => a[0] === cur0) || AREAS[0])[1];
    el.innerHTML = `
      <div class="cs-loc"><button type="button" class="linkbtn" data-csloc>📍 用我的位置找附近超市</button>${locMsg ? `<span>${esc(locMsg)}</span>` : ""}</div>
      <div class="cs-step">① 选地区</div>
      <div class="cs-areas" role="tablist" aria-label="选择地区">${AREAS.map(([k, n]) => `<button type="button" data-csarea="${k}"${k === cur0 ? ' class="on"' : ""}>${esc(n)}</button>`).join("")}</div>
      <div class="cs-step">② 选超市 <small>${esc(areaName)} · ${inArea.length} 家</small></div>
      ${inArea.length ? `<div class="cs-stores">${inArea.map(s => `<a href="#cs-${esc(s.id)}"${cur && cur.id === s.id ? ' class="on"' : ""}>${esc(s.name)}</a>`).join("")}</div>` : `<p class="tl-note">这个地区暂时还没有超市的特价单，看看旁边的地区吧。</p>`}
      ${cur ? `<section class="cs-flyer">
        <div class="cs-head"><h2>${esc(cur.name)}</h2><p>${esc(cur.locs.join(" · "))}</p></div>
        <p class="cs-meta">${cur.got ? `${md(cur.got)}更新` : ""}${cur.stale ? " · 本周还没出新单，先显示上一期" : ""}${cur.imgs.length > 1 ? ` · 共 ${cur.imgs.length} 张（不同分店可能不同）` : ""} · 点图片放大看</p>
        ${cur.imgs.map((u, i) => `<button type="button" class="cs-img" data-csview="${i}"><img src="${esc(u)}" alt="${esc(cur.name)} 本周特价单 ${i + 1}" loading="${i ? "lazy" : "eager"}" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('bad')"><span>图片暂时打不开，请稍后再试</span></button>`).join("")}
      </section>` : ""}
      <p class="tl-note">每周五自动更新。特价单来自各超市官方网站，版权归超市所有；价格和日期以店内为准。超市老板想加入或更正，请到「联系我们」。</p>`;
    el.querySelectorAll(".cs-areas .on, .cs-stores .on").forEach(x => { const p = x.parentNode; p.scrollLeft = x.offsetLeft - p.offsetLeft - 16; });
    el.onclick = e => {
      const b = e.target.closest("[data-csarea]");
      if (b) { saveArea(b.dataset.csarea); locMsg = ""; if (location.hash !== "#chaoshi") location.hash = "#chaoshi"; else render(el, ""); return; }
      if (e.target.closest("[data-csloc]")) { locate(el, ""); return; }
      const v = e.target.closest("[data-csview]"); if (v && cur) viewer(cur, Number(v.dataset.csview));
    };
  }

  /* in-page zoom viewer */
  function viewer(store, idx) {
    let k = idx, zoom = false;
    const ov = document.createElement("div"); ov.className = "cs-view"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", store.name + " 特价单");
    const paint = () => {
      ov.innerHTML = `<div class="cs-vbar"><b>${esc(store.name)}${store.imgs.length > 1 ? ` · ${k + 1}/${store.imgs.length}` : ""}</b><button type="button" data-vz>${zoom ? "缩小" : "放大"}</button><button type="button" data-vx aria-label="关闭">✕</button></div>
        <div class="cs-vbody${zoom ? " z" : ""}"><img src="${esc(store.imgs[k])}" alt="" referrerpolicy="no-referrer"></div>
        ${store.imgs.length > 1 ? `<div class="cs-vnav"><button type="button" data-vp${k ? "" : " disabled"}>‹ 上一张</button><button type="button" data-vn${k < store.imgs.length - 1 ? "" : " disabled"}>下一张 ›</button></div>` : ""}`;
    };
    const close = () => { ov.remove(); document.documentElement.style.overflow = ""; window.removeEventListener("popstate", close); };
    ov.onclick = e => {
      if (e.target.closest("[data-vx]")) { history.back(); return; }
      if (e.target.closest("[data-vz]") || (e.target.tagName === "IMG" && !zoom)) { zoom = !zoom; paint(); return; }
      if (e.target.closest("[data-vp]") && k > 0) { k--; zoom = false; paint(); }
      if (e.target.closest("[data-vn]") && k < store.imgs.length - 1) { k++; zoom = false; paint(); }
    };
    paint(); document.body.appendChild(ov); document.documentElement.style.overflow = "hidden";
    // Phone back button closes the viewer instead of leaving the page.
    history.pushState({ csView: 1 }, ""); window.addEventListener("popstate", close);
  }
  window.HLChaoshi = { render, load };
})();
