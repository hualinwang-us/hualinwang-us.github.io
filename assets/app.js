/* 华邻网 front end. Plain JS, no build step. */
(function () {
  "use strict";
  const HLC = window.HLC;
  const CFG = HLC.CFG, SB_URL = HLC.SB_URL, SB_KEY = HLC.SB_KEY, POSTS_ON = HLC.POSTS_ON;
  const { GROUPS, BOARDS, boardById } = HLC;
  const FEATURED = ["jobs", "rest", "seek", "rent", "share", "house", "biz", "sale", "car", "move", "reno", "law"];

  const SECTIONS = ["top", "local", "immigration", "uschina", "china", "business", "health", "ent"];

  /* ---------- text ---------- */
  const T = {
    zh: {
      tagline: "在美华人 · 新闻与生活信息", searchPh: "搜索分类信息：工作、房屋、地区…", searchBtn: "搜索", postFree: "免费发布",
      directory: "分类目录", more: "更多", home: "首页", classifiedsTab: "分类信息",
      sec_top: "新闻速递", sec_local: "纽约本地", sec_immigration: "移民签证", sec_uschina: "中美关系", sec_china: "中国",
      sec_business: "财经", sec_health: "健康养生", sec_ent: "娱乐体育",
      ctaH: "免费发布分类信息", ctaP: "招聘、租房、生意转让、二手买卖……无需注册，一分钟发布。", postNow: "立即发布",
      latest: "最新信息", fx: "货币兑换率", weather: "纽约天气", classifieds: "分类信息", classHint: "点击板块查看全部",
      back: "← 返回首页", postHere: "在本板块发布", filterPh: "在本板块中筛选",
      foot1: "新闻每小时自动汇集自各大中英文媒体，点击标题阅读原文。", footAds: "广告刊登", footAdsP: "首页及侧栏广告位招租，欢迎商家联系。",
      footSafe: "安全提示", foot2: "分类信息由用户自行发布，请自行核实；交易当面确认，切勿预付定金，谨防诈骗。",
      postH: "发布分类信息", postOff: "发布功能即将开放，敬请期待。", fBoard: "板块", fArea: "地区", areaPh: "如：法拉盛",
      fTitle: "标题", titlePh: "如：法拉盛餐馆请炒锅，包吃住", fBody: "详细内容", bodyPh: "薪资、要求、价格、时间等",
      fName: "联系人", namePh: "如：王先生", fPhone: "电话", fWx: "微信（选填）",
      formHint: "电话和微信至少填一项。信息公开显示，请勿填写证件号等隐私。", cancel: "取消", submit: "发布", posting: "发布中…",
      posted: "发布成功", eTitle: "标题至少2个字。", eBody: "请填写详细内容。", eContact: "请至少留下电话或微信。",
      eSave: "发布失败，请稍后再试。", eFlood: "发布太频繁，请10分钟后再试。", eBusy: "网站繁忙，请稍后再试。",
      loading: "载入中…", newsEmpty: "新闻正在更新，请稍后刷新。", noPosts: "还没有信息，", beFirst: "抢先发布",
      noLatest: "暂时没有新信息。", noMatch: "没有找到相关信息。", searchFor: "搜索：", results: "条结果",
      contact: "联系方式", phone: "电话", wx: "微信", copy: "复制", copied: "已复制", del: "删除我的信息", delSure: "确认删除？",
      deleted: "已删除", delFail: "删除失败，请稍后再试。", safety: "请当面交易，切勿预付定金或转账给陌生人。",
      updated: "更新于", fxAsOf: "以 1 美元计", minAgo: "分钟前", hrAgo: "小时前", dayAgo: "天前", justNow: "刚刚",
      adLabel: "推荐商家", adEmptyH: "广告位招租", adEmptyP: "黄金位置，曝光给每一位访客", adContact: "联系：",
      sponsored: "推荐", rateNames: { CNY: "人民币", HKD: "港币", TWD: "新台币", EUR: "欧元", GBP: "英镑", CAD: "加元", JPY: "日元", KRW: "韩元", AUD: "澳元", SGD: "新加坡元" },
      wx_codes: { 0: "晴", 1: "晴间多云", 2: "多云", 3: "阴", 45: "雾", 48: "雾", 51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨", 66: "冻雨", 67: "冻雨", 71: "小雪", 73: "中雪", 75: "大雪", 77: "雪粒", 80: "阵雨", 81: "阵雨", 82: "强阵雨", 85: "阵雪", 86: "阵雪", 95: "雷雨", 96: "雷雨", 99: "雷雨" },
      today: "今天", newsSrc: "新闻来源：各媒体原文，标题链接至原网站。",
      share: "分享到微信", linkCopied: "链接已复制，打开微信粘贴到群里即可", shareManual: "长按下面的链接复制：", call: "拨打",
      report: "举报", reportH: "举报原因", reportSend: "提交举报", reported: "已收到举报，谢谢你帮忙把关", reportFail: "举报失败，请稍后再试",
      alreadyReported: "你已经举报过这条信息", scamH: "防骗提醒", scamP: "这条信息提到{x}。正规雇主和房东不会要求你先付钱或提供证件号码。见面确认前不要转账。",
      postedShare: "发布成功！转发到微信群和朋友圈，让更多人看到。", pageLink: "信息链接"
    },
    en: {
      tagline: "News & community listings for Chinese Americans", searchPh: "Search listings: jobs, rentals, areas…", searchBtn: "Search", postFree: "Post Free",
      directory: "Directory", more: "More", home: "Home", classifiedsTab: "Classifieds",
      sec_top: "Top Stories", sec_local: "New York", sec_immigration: "Immigration", sec_uschina: "US–China", sec_china: "China",
      sec_business: "Business", sec_health: "Health", sec_ent: "Entertainment & Sports",
      ctaH: "Post a free listing", ctaP: "Jobs, rentals, businesses for sale, used items. No sign-up, done in a minute.", postNow: "Post now",
      latest: "Latest Listings", fx: "Exchange Rates", weather: "NYC Weather", classifieds: "Classifieds", classHint: "Open a board to see everything",
      back: "← Back to home", postHere: "Post in this board", filterPh: "Filter this board",
      foot1: "News is gathered every hour from Chinese- and English-language outlets. Click a headline to read the original.",
      footAds: "Advertise", footAdsP: "Homepage and sidebar ad spaces are available.", footSafe: "Stay safe",
      foot2: "Listings are posted by users. Verify details, meet in person and never send deposits to strangers.",
      postH: "Post a Listing", postOff: "Posting opens soon.", fBoard: "Board", fArea: "Area", areaPh: "e.g. Flushing",
      fTitle: "Title", titlePh: "e.g. Wok chef wanted in Flushing, room & board", fBody: "Details", bodyPh: "Pay, requirements, price, schedule…",
      fName: "Contact name", namePh: "e.g. Mr. Wang", fPhone: "Phone", fWx: "WeChat (optional)",
      formHint: "Give a phone number or WeChat ID. Listings are public; don't include ID numbers or other private data.", cancel: "Cancel",
      submit: "Post", posting: "Posting…", posted: "Posted", eTitle: "Title needs at least 2 characters.", eBody: "Add the details.",
      eContact: "Add a phone number or WeChat ID.", eSave: "Couldn't post. Please try again.", eFlood: "Too many posts. Try again in 10 minutes.",
      eBusy: "The site is busy. Please try again shortly.", loading: "Loading…", newsEmpty: "News is updating. Refresh in a moment.",
      noPosts: "Nothing here yet. ", beFirst: "Post the first one", noLatest: "No new listings yet.", noMatch: "No matching listings.",
      searchFor: "Search: ", results: "results", contact: "Contact", phone: "Phone", wx: "WeChat", copy: "Copy", copied: "Copied",
      del: "Delete my listing", delSure: "Confirm delete?", deleted: "Deleted", delFail: "Couldn't delete. Please try again.",
      safety: "Meet in person. Never prepay or wire money to strangers.", updated: "Updated", fxAsOf: "per 1 US dollar",
      minAgo: "m ago", hrAgo: "h ago", dayAgo: "d ago", justNow: "just now", adLabel: "Featured", adEmptyH: "Ad space available",
      adEmptyP: "Prime placement seen by every visitor", adContact: "Contact: ", sponsored: "Ad",
      rateNames: { CNY: "Chinese yuan", HKD: "HK dollar", TWD: "NT dollar", EUR: "Euro", GBP: "Pound", CAD: "Canadian dollar", JPY: "Yen", KRW: "Won", AUD: "Australian dollar", SGD: "Singapore dollar" },
      wx_codes: { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Showers", 81: "Showers", 82: "Heavy showers", 85: "Snow showers", 86: "Snow showers", 95: "Thunderstorms", 96: "Thunderstorms", 99: "Thunderstorms" },
      today: "Today", newsSrc: "Headlines link to the original publishers.",
      share: "Share", linkCopied: "Link copied. Paste it into a chat to share.", shareManual: "Press and hold to copy the link:", call: "Call",
      report: "Report", reportH: "Why are you reporting this?", reportSend: "Send report", reported: "Thanks, we got your report", reportFail: "Couldn't send the report. Please try again.",
      alreadyReported: "You already reported this listing", scamH: "Scam warning", scamP: "This listing mentions {x}. Real employers and landlords don't ask you to pay first or share ID numbers. Don't send money before meeting in person.",
      postedShare: "Posted! Share it to your WeChat groups so more people see it.", pageLink: "Link"
    }
  };

  /* ---------- state ---------- */
  let lang = "zh";
  try { lang = localStorage.getItem("hl-lang") || "zh"; } catch (e) {}
  let news = null, market = null, ads = { slots: [] }, posts = [], postsLoaded = false;
  let route = { view: "home" }, searchQ = "";

  const $ = s => document.querySelector(s);
  const t = k => (T[lang][k] !== undefined ? T[lang][k] : T.zh[k] !== undefined ? T.zh[k] : k);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = o => (o && typeof o === "object" ? (o[lang] || o.zh || o.en || "") : (o || ""));
  const bName = b => (b ? (lang === "zh" ? b.zh : b.en) : "");
  const safeUrl = u => (/^https?:\/\//i.test(u || "") ? u : "#");

  function ago(iso) {
    const ms = typeof iso === "number" ? iso : Date.parse(iso);
    if (!Number.isFinite(ms)) return "";
    const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (m < 2) return t("justNow");
    if (m < 60) return lang === "zh" ? m + t("minAgo") : m + t("minAgo");
    const h = Math.round(m / 60);
    if (h < 24) return h + t("hrAgo");
    const d = Math.round(h / 24);
    if (d < 7) return d + t("dayAgo");
    return new Date(ms).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { month: "numeric", day: "numeric" });
  }
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2400); }

  /* ---------- data ---------- */
  async function getJSON(path) {
    const r = await fetch(path + "?v=" + Math.floor(Date.now() / 300000), { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function loadData() {
    const [n, m, a] = await Promise.allSettled([getJSON("data/news.json"), getJSON("data/market.json"), getJSON("data/ads.json")]);
    if (n.status === "fulfilled") news = n.value;
    if (m.status === "fulfilled") market = m.value;
    if (a.status === "fulfilled" && a.value && Array.isArray(a.value.slots)) ads = a.value;
    news = news || { sections: {} };
    renderNews(); renderMarket(); renderAds(); renderNewsView();
  }

  function sbHeaders(extra) {
    const h = { apikey: SB_KEY, "Content-Type": "application/json" };
    if (!/^sb_publishable_/.test(SB_KEY)) h.Authorization = "Bearer " + SB_KEY;
    return Object.assign(h, extra || {});
  }
  async function loadPosts() {
    if (!POSTS_ON) { postsLoaded = true; renderPostsAll(); return; }
    try {
      const r = await fetch(SB_URL + "/rest/v1/posts?select=id,created_at,board,title,body,area,contact,phone,wechat&order=created_at.desc&limit=600", { headers: sbHeaders() });
      if (!r.ok) throw new Error(r.status);
      posts = (await r.json()).map(p => Object.assign(p, { ts: Date.parse(p.created_at) }));
    } catch (e) { /* keep what we have */ }
    postsLoaded = true;
    renderPostsAll();
  }
  async function rpc(fn, body) {
    const r = await fetch(SB_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
    const txt = await r.text();
    let data = null; try { data = JSON.parse(txt); } catch (e) {}
    if (!r.ok) { const err = new Error((data && (data.message || data.hint)) || ("HTTP " + r.status)); err.raw = txt; throw err; }
    return data;
  }
  const keys = HLC.keys;


  /* ---------- render: chrome ---------- */
  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    $("#lzh").setAttribute("aria-pressed", String(lang === "zh"));
    $("#len").setAttribute("aria-pressed", String(lang === "en"));
    document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => (el.placeholder = t(el.dataset.i18nPh)));
    $("#today").textContent = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "America/New_York" });
    $("#fBoard").innerHTML = GROUPS.map(g => `<optgroup label="${esc(lang === "zh" ? g.zh : g.en)}">${g.boards.map(b => `<option value="${b[0]}">${esc(lang === "zh" ? b[2] : b[3])}</option>`).join("")}</optgroup>`).join("");
    renderTabs(); renderDir(); renderNews(); renderMarket(); renderAds(); renderPostsAll(); renderNewsView(); renderAdContact();
  }
  function setLang(l) { lang = l; try { localStorage.setItem("hl-lang", l); } catch (e) {} applyLang(); }

  function renderTabs() {
    const items = [["", t("home")]].concat(SECTIONS.map(s => ["n-" + s, t("sec_" + s)])).concat([["classifieds", t("classifiedsTab")]]);
    const cur = route.view === "news" ? "n-" + route.sec : route.view === "home" ? "" : "";
    $("#tabs").innerHTML = items.map(([h, label]) => `<a href="#${h}" class="${h === cur && (route.view !== "home" || h === "") ? "on" : ""}">${esc(label)}</a>`).join("");
  }
  function renderDir() {
    const count = id => posts.filter(p => p.board === id).length;
    $("#dir").innerHTML = GROUPS.map(g => `<div class="dg"><h3>${esc(lang === "zh" ? g.zh : g.en)}</h3><ul>${g.boards.map(b => {
      const n = count(b[0]); return `<li><a href="#b-${b[0]}">${esc(lang === "zh" ? b[2] : b[3])}</a>${n ? `<span class="n">${n}</span>` : ""}</li>`;
    }).join("")}</ul></div>`).join("");
  }
  function renderAdContact() {
    const c = CFG.adContact || {};
    const parts = [c.phone && (t("phone") + " " + c.phone), c.wechat && (t("wx") + " " + c.wechat), c.email].filter(Boolean);
    $("#adContact").textContent = t("footAdsP") + (parts.length ? " " + parts.join(" · ") : "");
  }

  /* ---------- render: news ---------- */
  const sec = s => ((news && news.sections && news.sections[lang] && news.sections[lang][s]) || []);
  function metaHtml(i) { const a = ago(i.d); return `<span class="meta">${i.src ? `<span class="src">${esc(i.src)}</span>` : ""}${a ? `<span>${esc(a)}</span>` : ""}</span>`; }
  const imgTag = (i, cls) => `<img class="${cls}" src="${esc(i.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('[data-hasimg]')&&this.closest('[data-hasimg]').removeAttribute('data-hasimg');this.remove()">`;
  function liHtml(i, withSummary, withThumb) {
    const thumb = withThumb && i.img;
    return `<li${thumb ? ' class="thumbed" data-hasimg' : ""}>${thumb ? `<a class="th-link" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${imgTag(i, "th")}</a>` : ""}<div class="tx"><a class="t" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener">${esc(i.t)}</a>${withSummary && i.s ? `<span class="s">${esc(i.s)}</span>` : ""}${metaHtml(i)}</div></li>`;
  }
  // Move the first story that has a picture (among the first few) to the top and show it as a feature.
  function withFeature(list, look) {
    const k = list.slice(0, look).findIndex(i => i.img);
    if (k <= 0) return { list, feat: k === 0 };
    const copy = list.slice(); const [f] = copy.splice(k, 1); copy.unshift(f);
    return { list: copy, feat: true };
  }
  function renderNews() {
    if (!news) { SECTIONS.forEach(s => { const el = $("#sec-" + s); if (el) el.innerHTML = `<div class="empty">${esc(t("loading"))}</div>`; }); return; }
    const top = sec("top");
    const lw = $("#sec-top");
    if (!top.length) lw.innerHTML = `<div class="empty">${esc(t("newsEmpty"))}</div>`;
    else {
      const leadIdx = top.slice(0, 6).findIndex(i => i.img);
      const lead = top[leadIdx > 0 ? leadIdx : 0];
      const rest = top.filter(i => i !== lead).slice(0, 8);
      lw.innerHTML = `<article class="lead">${lead.img ? `<a href="${esc(safeUrl(lead.u))}" target="_blank" rel="noopener" class="img" tabindex="-1" aria-hidden="true">${imgTag(lead, "")}</a>` : ""}
        <h3><a href="${esc(safeUrl(lead.u))}" target="_blank" rel="noopener">${esc(lead.t)}</a></h3>${lead.s ? `<p>${esc(lead.s)}</p>` : ""}${metaHtml(lead)}</article>
        <ul class="nl compact">${rest.map(i => liHtml(i, false)).join("")}</ul>`;
    }
    ["local", "immigration", "uschina", "china", "business", "health"].forEach(s => {
      const { list, feat } = withFeature(sec(s).slice(0, 10), 6);
      const show = list.slice(0, 7);
      $("#sec-" + s).innerHTML = show.map((i, n) => n === 0 && feat ? liHtml(i, false, true).replace("<li", '<li data-feat') : liHtml(i, false)).join("");
      $("#sec-" + s).closest(".block").hidden = !show.length; // hide a section that has no stories right now
    });
    const e = withFeature(sec("ent").slice(0, 12), 6);
    const ent = e.list.slice(0, 10);
    $("#sec-ent").innerHTML = ent.map((i, n) => n < 2 && i.img ? liHtml(i, false, true) : liHtml(i, false)).join("");
    $("#sec-ent").closest(".block").hidden = !ent.length;
  }
  function renderNewsView() {
    if (route.view !== "news") return;
    $("#nTitle").textContent = t("sec_" + route.sec);
    $("#nNote").textContent = (news && news.updatedAt ? t("updated") + " " + ago(news.updatedAt) + " · " : "") + t("newsSrc");
    const list = sec(route.sec);
    $("#nList").innerHTML = list.length ? list.map(i => liHtml(i, true, true)).join("") : `<div class="empty">${esc(news ? t("newsEmpty") : t("loading"))}</div>`;
  }

  /* ---------- render: market ---------- */
  function renderMarket() {
    const r = market && market.rates && market.rates.rates;
    if (r) {
      const order = ["CNY", "HKD", "TWD", "EUR", "CAD", "GBP", "JPY", "KRW"].filter(c => r[c]);
      $("#fxTable").innerHTML = order.map(c => `<tr><td>${esc(t("rateNames")[c] || c)}<span class="cc">${c}</span></td><td>${Number(r[c]).toLocaleString("en-US", { maximumFractionDigits: r[c] > 100 ? 1 : 4 })}</td></tr>`).join("");
      $("#fxAsOf").textContent = t("fxAsOf");
      $("#fxBlock").hidden = false;
      const fx = $("#fxNow"); fx.hidden = !r.CNY; fx.innerHTML = `USD/CNY <b>${Number(r.CNY).toFixed(4)}</b>`;
    }
    const w = market && market.weather;
    if (w && w.now) {
      const name = c => t("wx_codes")[c] || "";
      const day = d => { const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { weekday: "short" }); };
      $("#wx").innerHTML = `<div class="big"><strong>${Math.round(w.now.temp)}°F</strong><span>${esc(name(w.now.code))}</span></div>` +
        (w.days || []).slice(0, 3).map((d, i) => `<div><b>${esc(i === 0 ? t("today") : day(d.d))}</b><span>${esc(name(d.code))}</span><span>${Math.round(d.hi)}° / ${Math.round(d.lo)}°</span></div>`).join("");
      $("#wxBlock").hidden = false;
      const wn = $("#wxNow"); wn.hidden = false; wn.innerHTML = `${lang === "zh" ? "纽约" : "NYC"} <b>${Math.round(w.now.temp)}°F</b> ${esc(name(w.now.code))}`;
    }
  }

  /* ---------- render: ads ---------- */
  function liveSlots(pos) {
    const today = new Date().toISOString().slice(0, 10);
    return (ads.slots || []).filter(s => (s.position || "top") === pos && (!s.until || s.until >= today));
  }
  function adCard(s, cls) {
    const contact = [s.phone && `<span class="ph">${esc(s.phone)}</span>`, s.wechat && `<span>${esc(t("wx"))} ${esc(s.wechat)}</span>`].filter(Boolean).join(" · ");
    const inner = `<span class="lab">${esc(t("adLabel"))}</span><h3>${esc(L(s.name))}</h3>${L(s.desc) ? `<p>${esc(L(s.desc))}</p>` : ""}${contact ? `<p>${contact}</p>` : ""}`;
    return s.url ? `<a class="spon paid ${cls || ""}" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener sponsored">${inner}</a>` : `<div class="spon paid ${cls || ""}">${inner}</div>`;
  }
  function emptyAd() {
    const c = CFG.adContact || {};
    const parts = [c.phone, c.wechat && (t("wx") + " " + c.wechat), c.email].filter(Boolean);
    return `<div class="spon empty"><span class="lab">${esc(t("sponsored"))}</span><h3>${esc(t("adEmptyH"))}</h3><p>${esc(t("adEmptyP"))}${parts.length ? "<br>" + esc(t("adContact") + parts.join(" · ")) : ""}</p></div>`;
  }
  function renderAds() {
    const top = liveSlots("top").slice(0, 3);
    $("#sponTop").innerHTML = top.map(s => adCard(s)).join("") + Array.from({ length: Math.max(0, 3 - top.length) }, emptyAd).join("");
    const rail = liveSlots("rail").slice(0, 6);
    $("#sponRail").innerHTML = rail.map(s => adCard(s)).join("") + (rail.length < 2 ? emptyAd() : "");
  }

  /* ---------- render: posts ---------- */
  function rowHtml(p, seal) {
    const b = boardById(p.board);
    return `<li><button type="button" class="row" data-pid="${p.id}">${seal ? `<span class="seal sm" title="${esc(bName(b))}">${esc(b ? b.glyph : "·")}</span>` : ""}<span class="rt">${p.area ? `[${esc(p.area)}] ` : ""}${esc(p.title)}</span><span class="rd">${esc(ago(p.ts))}</span></button></li>`;
  }
  function pitemHtml(p, showBoard) {
    const b = boardById(p.board);
    return `<li><button type="button" class="pitem" data-pid="${p.id}"><div class="pt">${p.area ? `[${esc(p.area)}] ` : ""}${esc(p.title)}</div><div class="pm">${showBoard ? `<span class="bd">${esc(bName(b))}</span>` : ""}<span>${esc(ago(p.ts))}</span>${p.contact ? `<span>${esc(p.contact)}</span>` : ""}${p.phone ? `<span>${esc(p.phone)}</span>` : ""}</div><div class="pb">${esc(p.body)}</div></button></li>`;
  }
  function renderPostsAll() {
    const latest = posts.slice(0, 12);
    $("#latest").innerHTML = !postsLoaded ? `<div class="empty">${esc(t("loading"))}</div>` : latest.length ? latest.map(p => rowHtml(p, true)).join("") : `<div class="empty">${esc(t("noLatest"))}</div>`;
    $("#bgrid").innerHTML = FEATURED.map(id => {
      const b = boardById(id); const list = posts.filter(p => p.board === id).slice(0, 6);
      return `<section class="board"><header><span class="seal sm">${esc(b.glyph)}</span><h3>${esc(bName(b))}</h3><a href="#b-${id}">${esc(t("more"))} ›</a></header>${list.length ? `<ul>${list.map(p => rowHtml(p, false)).join("")}</ul>` : `<div class="none">${esc(t("noPosts"))}<button type="button" class="linkbtn" data-postto="${id}">${esc(t("beFirst"))}</button></div>`}</section>`;
    }).join("");
    renderDir();
    if (route.view === "board") renderBoard();
    if (route.view === "search") renderSearch();
  }
  function renderBoard() {
    const b = boardById(route.board); if (!b) return;
    $("#bSeal").textContent = b.glyph; $("#bTitle").textContent = bName(b);
    const q = ($("#bFilter").value || "").trim().toLowerCase();
    const list = posts.filter(p => p.board === b.id && (!q || [p.title, p.area, p.body, p.contact].join(" ").toLowerCase().includes(q)));
    $("#bList").innerHTML = list.length ? list.map(p => pitemHtml(p, false)).join("") :
      `<li><div class="empty">${q ? esc(t("noMatch")) : esc(t("noPosts")) + `<button type="button" class="linkbtn" data-postto="${b.id}">${esc(t("beFirst"))}</button>`}</div></li>`;
  }
  function renderSearch() {
    const q = searchQ.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const list = words.length ? posts.filter(p => { const hay = [p.title, p.area, p.body, p.contact, bName(boardById(p.board))].join(" ").toLowerCase(); return words.every(w => hay.includes(w)); }) : [];
    $("#sTitle").textContent = `${t("searchFor")}${searchQ} · ${list.length} ${t("results")}`;
    $("#sList").innerHTML = list.length ? list.map(p => pitemHtml(p, true)).join("") : `<li><div class="empty">${esc(t("noMatch"))}</div></li>`;
  }

  /* ---------- routing ---------- */
  function go() {
    const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (h === "post") { try { history.replaceState(null, "", location.pathname); } catch (e) {} setTimeout(() => openForm(), 0); }
    if (h.startsWith("b-") && boardById(h.slice(2))) route = { view: "board", board: h.slice(2) };
    else if (h.startsWith("n-") && SECTIONS.includes(h.slice(2))) route = { view: "news", sec: h.slice(2) };
    else if (h === "search" && searchQ) route = { view: "search" };
    else route = { view: "home" };
    $("#vHome").hidden = route.view !== "home"; $("#vBoard").hidden = route.view !== "board";
    $("#vNews").hidden = route.view !== "news"; $("#vSearch").hidden = route.view !== "search";
    if (route.view === "board") { $("#bFilter").value = ""; renderBoard(); }
    if (route.view === "news") renderNewsView();
    if (route.view === "search") renderSearch();
    renderTabs();
    if (h === "classifieds") { const el = document.querySelector(".boards-sec"); if (el) el.scrollIntoView({ block: "start" }); }
    else if (route.view !== "home" || h === "") window.scrollTo(0, 0);
  }

  /* ---------- post detail ---------- */
  function openPost(id, opts) {
    opts = opts || {};
    const p = posts.find(x => String(x.id) === String(id)); if (!p) return;
    const b = boardById(p.board);
    const myKey = keys.get(p.id);
    const hits = HLC.scamHits(p.title + " " + p.body);
    const url = HLC.postUrl(p.id);
    const tel = (p.phone || "").replace(/[^\d+]/g, "");
    const hitText = lang === "zh" ? "“" + hits.map(h => h.zh).join("”“") + "”" : hits.map(h => h.en).join(", ");
    $("#viewBody").innerHTML = `<button type="button" class="x" data-close aria-label="Close">×</button>
      ${opts.justPosted ? `<div class="justposted">${esc(t("postedShare"))}</div>` : ""}
      <span class="tag">${esc(bName(b))}${p.area ? " · " + esc(p.area) : ""} · ${esc(new Date(p.ts).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US"))}</span>
      <h3>${esc(p.title)}</h3>
      <div class="detail-body">${esc(p.body)}</div>
      <div class="contact"><b>${esc(t("contact"))}</b>${p.contact ? `<span>${esc(p.contact)}</span>` : ""}
        ${p.phone ? `<span>${esc(t("phone"))} <span class="v" id="cpP">${esc(p.phone)}</span></span><button type="button" class="copy" data-copy="cpP">${esc(t("copy"))}</button>${tel.length >= 7 ? `<a class="copy call" href="tel:${esc(tel)}">${esc(t("call"))}</a>` : ""}` : ""}
        ${p.wechat ? `<span>${esc(t("wx"))} <span class="v" id="cpW">${esc(p.wechat)}</span></span><button type="button" class="copy" data-copy="cpW">${esc(t("copy"))}</button>` : ""}</div>
      ${hits.length ? `<div class="scam" role="note"><b>${esc(t("scamH"))}</b><p>${esc(t("scamP").replace("{x}", hitText))}</p></div>` : `<p class="warn">${esc(t("safety"))}</p>`}
      <div class="post-actions">
        <button type="button" class="btn" id="shareBtn">${esc(t("share"))}</button>
        <button type="button" class="btn ghost" id="repBtn">${esc(t("report"))}</button>
        ${myKey ? `<button type="button" class="btn ghost" id="delBtn">${esc(t("del"))}</button>` : ""}
      </div>
      <div class="manual" id="manualBox" hidden><span>${esc(t("shareManual"))}</span><input readonly value="${esc(url)}" aria-label="${esc(t("pageLink"))}"></div>
      <div class="reasons" id="repBox" hidden><b>${esc(t("reportH"))}</b>
        ${HLC.REPORT_REASONS.map(([k, zh, en], i) => `<label><input type="radio" name="rr" value="${k}" ${i === 0 ? "checked" : ""}> ${esc(lang === "zh" ? zh : en)}</label>`).join("")}
        <button type="button" class="btn" id="repSend">${esc(t("reportSend"))}</button></div>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
    $("#shareBtn").onclick = async () => {
      const r = await HLC.share(url, (p.area ? "[" + p.area + "] " : "") + p.title);
      if (r === "copied") toast(t("linkCopied"));
      else if (r === "manual") { const box = $("#manualBox"); box.hidden = false; const inp = box.querySelector("input"); inp.focus(); inp.select(); }
    };
    $("#repBtn").onclick = () => {
      if (HLC.reported.get(p.id)) { toast(t("alreadyReported")); return; }
      $("#repBox").hidden = !$("#repBox").hidden;
    };
    $("#repSend").onclick = async () => {
      const btn = $("#repSend"); btn.disabled = true;
      const picked = document.querySelector('#repBox input[name="rr"]:checked');
      try { await HLC.rpc("report_post", { p_id: p.id, p_reason: picked ? picked.value : "other" }); HLC.reported.set(p.id, 1); $("#repBox").hidden = true; toast(t("reported")); }
      catch (e) { btn.disabled = false; toast(t("reportFail")); }
    };
    const del = $("#delBtn");
    if (del) del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = t("delSure"); del.style.color = "var(--accent)"; return; }
      del.disabled = true;
      try {
        const ok = await rpc("delete_post", { p_id: p.id, p_key: myKey });
        if (ok === false) throw new Error("not found");
        keys.drop(p.id); posts = posts.filter(x => x.id !== p.id); renderPostsAll(); $("#viewDlg").close(); toast(t("deleted"));
      } catch (e) { del.disabled = false; toast(t("delFail")); }
    };
  }

  /* ---------- post form ---------- */
  function openForm(board) {
    $("#postForm").reset(); $("#fErr").textContent = "";
    $("#postOff").hidden = POSTS_ON; $("#postFields").hidden = !POSTS_ON;
    $("#fBoard").value = board || (route.view === "board" ? route.board : "jobs");
    $("#postDlg").showModal();
    if (POSTS_ON) setTimeout(() => $("#fTitle").focus(), 30);
  }
  async function submitForm(e) {
    e.preventDefault();
    if (!POSTS_ON) return;
    const v = id => $(id).value.trim();
    if (v("#fSite")) { $("#postDlg").close(); return; } // honeypot
    const d = { p_board: v("#fBoard"), p_title: v("#fTitle"), p_body: v("#fBody"), p_area: v("#fArea"), p_contact: v("#fName"), p_phone: v("#fPhone"), p_wechat: v("#fWx") };
    const err = d.p_title.length < 2 ? "eTitle" : d.p_body.length < 2 ? "eBody" : (!d.p_phone && !d.p_wechat) ? "eContact" : null;
    if (err) { $("#fErr").textContent = t(err); return; }
    const btn = $("#fSubmit"); btn.disabled = true; btn.textContent = t("posting");
    try {
      const res = await rpc("create_post", d);
      const row = Array.isArray(res) ? res[0] : res;
      if (row && row.id) keys.set(row.id, row.delete_key);
      $("#postDlg").close();
      await loadPosts();
      location.hash = "b-" + d.p_board;
      if (row && row.id) setTimeout(() => openPost(row.id, { justPosted: true }), 60); else toast(t("posted"));
    } catch (er) {
      const m = String(er.message || "") + String(er.raw || "");
      $("#fErr").textContent = t(/too_many_posts/.test(m) ? "eFlood" : /site_busy/.test(m) ? "eBusy" : "eSave");
    } finally { btn.disabled = false; btn.textContent = t("submit"); }
  }

  /* ---------- events ---------- */
  $("#lzh").onclick = () => setLang("zh");
  $("#len").onclick = () => setLang("en");
  window.addEventListener("hashchange", go);
  $("#postForm").addEventListener("submit", submitForm);
  $("#bFilter").addEventListener("input", renderBoard);
  $("#bPost").onclick = () => openForm(route.board);
  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); searchQ = $("#q").value.trim(); if (!searchQ) return; if (location.hash === "#search") go(); else location.hash = "search"; });
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-pid],[data-postto],[data-post],[data-home],[data-close],[data-copy]");
    if (!el) { if (e.target.tagName === "DIALOG") e.target.close(); return; }
    if (el.dataset.pid) openPost(el.dataset.pid);
    else if (el.dataset.postto) openForm(el.dataset.postto);
    else if (el.hasAttribute("data-post")) openForm();
    else if (el.hasAttribute("data-home")) { e.preventDefault(); if (location.hash) location.hash = ""; else go(); }
    else if (el.hasAttribute("data-close")) { const d = el.closest("dialog"); if (d) d.close(); }
    else if (el.dataset.copy) {
      const target = document.getElementById(el.dataset.copy); const txt = target.textContent;
      const sel = () => { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast(t("copied")), sel); else sel();
    }
  });

  applyLang();
  go();
  loadData();
  loadPosts();
  setInterval(loadData, 10 * 60 * 1000);
  setInterval(loadPosts, 3 * 60 * 1000);
})();
