/* 华人超市特价单: weekly flyers from NY Chinese supermarkets' official websites (data/flyers.json, refreshed Fridays). */
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const AREAS = [["", "全部地区"], ["fl", "法拉盛"], ["el", "艾姆赫斯特"], ["co", "可乐娜"], ["ln", "小颈 · 湾边"], ["mh", "曼哈顿华埠"], ["bk", "布鲁克林"], ["li", "长岛"]];
  let data = null, loading = null, area = "";
  try { area = localStorage.getItem("hl-cs-area") || ""; } catch (e) {}
  const load = () => loading || (loading = fetch("data/flyers.json", { cache: "no-cache" }).then(r => r.json()).then(d => (data = d)).catch(() => (data = { stores: [] })));
  const md = iso => { if (!iso) return ""; const d = new Date(iso); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; };

  function render(el, storeId) {
    if (!data) { el.innerHTML = '<div class="skel"><i></i><i></i><i></i></div>'; load().then(() => render(el, storeId)); return; }
    const all = data.stores || [];
    const inArea = all.filter(s => !area || s.areas.includes(area));
    const withImg = inArea.filter(s => s.imgs && s.imgs.length), linkOnly = inArea.filter(s => !s.imgs || !s.imgs.length);
    let cur = storeId ? all.find(s => s.id === storeId) : null;
    if (!cur && withImg.length) cur = withImg[0];
    el.innerHTML = `
      <div class="cs-areas" role="tablist" aria-label="选择地区">${AREAS.map(([k, n]) => `<button type="button" data-csarea="${k}"${k === area ? ' class="on"' : ""}>${esc(n)}</button>`).join("")}</div>
      ${withImg.length ? `<div class="cs-stores">${withImg.map(s => `<a href="#cs-${esc(s.id)}"${cur && cur.id === s.id ? ' class="on"' : ""}>${esc(s.name)}</a>`).join("")}</div>` : `<p class="tl-note">这个地区暂时没有能直接看的特价单，可以点下面的超市去官网看。</p>`}
      ${cur && cur.imgs && cur.imgs.length ? `<section class="cs-flyer">
        <div class="cs-head"><div><h2>${esc(cur.name)}</h2><p>${esc(cur.locs.join(" · "))}</p></div><a class="btn ghost sm" href="${esc(cur.page)}" target="_blank" rel="noopener">官网原版 ›</a></div>
        <p class="cs-meta">${cur.got ? `${md(cur.got)}从超市官网更新` : ""}${cur.stale ? " · 本周官网还没出新单，先显示上一期" : ""}${cur.imgs.length > 1 ? ` · 共 ${cur.imgs.length} 张（不同分店可能不同）` : ""} · 点图片可放大</p>
        ${cur.imgs.map((u, i) => `<a class="cs-img" href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(cur.name)} 本周特价单 ${i + 1}" loading="${i ? "lazy" : "eager"}" referrerpolicy="no-referrer" onerror="this.closest('.cs-img').classList.add('bad')"><span>图片打不开？点这里去官网看</span></a>`).join("")}
      </section>` : ""}
      ${linkOnly.length ? `<section class="cs-links"><h3>其他超市（去官网看特价）</h3><ul>${linkOnly.map(s => `<li><a href="${esc(s.page)}" target="_blank" rel="noopener"><b>${esc(s.name)}</b><span>${esc(s.locs.join(" · "))}</span><em>官网 ›</em></a></li>`).join("")}</ul></section>` : ""}
      <p class="tl-note">每周五自动更新。特价单图片来自各超市官方网站，版权归超市所有；价格和日期以店内为准。超市老板想加入或更正，请到「联系我们」。</p>`;
    el.onclick = e => {
      const b = e.target.closest("[data-csarea]"); if (!b) return;
      area = b.dataset.csarea; try { localStorage.setItem("hl-cs-area", area); } catch (er) {}
      if (location.hash !== "#chaoshi") location.hash = "#chaoshi"; else render(el, "");
    };
  }
  window.HLChaoshi = { render, load };
})();
