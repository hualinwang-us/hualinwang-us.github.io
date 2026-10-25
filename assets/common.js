/* 华邻网 shared pieces: boards, Supabase calls, share, report, scam check.
   Loaded by the home page, the per-listing pages, and the page builder (Node). */
(function (root) {
  "use strict";
  const CFG = root.HL_CONFIG || {};
  const SB_URL = (CFG.supabaseUrl || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const SB_KEY = CFG.supabaseKey || "";
  const POSTS_ON = !!(SB_URL && SB_KEY);

  const GROUPS = [
    { id: "work", zh: "工作", en: "Jobs", boards: [
      ["jobs", "聘", "招聘请人", "Help Wanted"], ["rest", "餐", "餐馆请人", "Restaurant Jobs"],
      ["salon", "甲", "美甲美容请人", "Salon Jobs"], ["seek", "职", "求职", "Jobs Wanted"]] },
    { id: "home", zh: "房屋", en: "Housing", boards: [
      ["rent", "租", "房屋出租", "Rentals"], ["share", "合", "室友合租", "Roommates"],
      ["house", "房", "房屋买卖", "Homes for Sale"], ["shop", "铺", "店面写字楼", "Commercial Space"]] },
    { id: "trade", zh: "买卖", en: "Buy & Sell", boards: [
      ["biz", "商", "生意转让", "Businesses for Sale"], ["sale", "物", "二手买卖", "Buy & Sell"],
      ["car", "车", "汽车买卖", "Cars"], ["furn", "家", "家具家电", "Furniture & Appliances"]] },
    { id: "svc", zh: "生活服务", en: "Services", boards: [
      ["move", "搬", "搬家运输", "Moving"], ["reno", "修", "装修维修", "Renovation & Repair"],
      ["clean", "洁", "家政清洁", "Cleaning"], ["nanny", "护", "保姆月嫂", "Nannies & Caregivers"],
      ["ship", "递", "快递货运", "Shipping"], ["sign", "印", "印刷招牌", "Printing & Signs"]] },
    { id: "pro", zh: "专业服务", en: "Professional", boards: [
      ["law", "律", "律师移民", "Lawyers & Immigration"], ["tax", "税", "会计报税", "Tax & Accounting"],
      ["loan", "贷", "贷款保险", "Loans & Insurance"], ["realtor", "经", "地产经纪", "Realtors"],
      ["drive", "驾", "驾校考牌", "Driving Schools"]] },
    { id: "health", zh: "健康美容", en: "Health & Beauty", boards: [
      ["clinic", "医", "医疗诊所", "Clinics"], ["tcm", "针", "中医针灸", "Chinese Medicine"],
      ["beauty", "美", "美容美发", "Beauty & Hair"]] },
    { id: "life", zh: "教育社区", en: "Education & Community", boards: [
      ["edu", "教", "补习培训", "Tutoring & Classes"], ["kids", "托", "托儿老人", "Childcare & Seniors"],
      ["events", "会", "社区活动", "Community Events"], ["travel", "旅", "旅游机票", "Travel"],
      ["other", "杂", "其他", "Other"]] }
  ];
  const BOARDS = [];
  GROUPS.forEach(g => g.boards.forEach(([id, glyph, zh, en]) => BOARDS.push({ id, glyph, zh, en, group: g.id })));
  const boardById = id => BOARDS.find(b => b.id === id);

  /* Words that often show up in scams aimed at new immigrants. Matching shows a warning; it never blocks. */
  const SCAM = [
    { re: /定金|订金|押金|保证金/, zh: "定金/押金", en: "a deposit" },
    { re: /先(付|转|汇|交)|预付|提前(付|转|汇)/, zh: "先付款", en: "paying first" },
    { re: /zelle|venmo|cash ?app|paypal|支付宝|微信转账|转账|汇款|电汇/i, zh: "转账汇款", en: "money transfers" },
    { re: /礼品卡|gift ?card|充值卡|点卡/i, zh: "礼品卡", en: "gift cards" },
    { re: /培训费|服装费|报名费|中介费|手续费/, zh: "收取费用", en: "upfront fees" },
    { re: /身份证号|社安号|社会安全号|ssn|银行卡号|银行账号|护照号/i, zh: "索要证件或银行信息", en: "ID or bank details" },
    { re: /人在(外地|国外|中国|外州)|(不方便|无法)(看房|见面)|钥匙.{0,6}(寄|邮)/, zh: "无法见面", en: "can't meet in person" },
    { re: /日赚|日入|月入\s*\d+\s*万|轻松月入|躺赚|无需经验.{0,6}高薪/, zh: "高薪轻松", en: "easy high pay" }
  ];
  const scamHits = text => SCAM.filter(s => s.re.test(text || ""));

  const REPORT_REASONS = [
    ["scam", "诈骗或虚假信息", "Scam or fake"],
    ["illegal", "违法或不良内容", "Illegal or offensive"],
    ["spam", "重复刷屏", "Spam or duplicate"],
    ["expired", "信息已失效", "No longer available"],
    ["other", "其他问题", "Something else"]
  ];

  function sbHeaders() {
    const h = { apikey: SB_KEY, "Content-Type": "application/json" };
    if (!/^sb_publishable_/.test(SB_KEY)) h.Authorization = "Bearer " + SB_KEY;
    return h;
  }
  const POST_COLS = "id,created_at,board,title,body,area,contact,phone,wechat";
  async function rpc(fn, body) {
    const r = await fetch(SB_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: sbHeaders(), body: JSON.stringify(body) });
    const txt = await r.text();
    let data = null; try { data = JSON.parse(txt); } catch (e) {}
    if (!r.ok) { const err = new Error((data && (data.message || data.hint)) || ("HTTP " + r.status)); err.raw = txt; throw err; }
    return data;
  }
  async function getPost(id) {
    const r = await fetch(SB_URL + "/rest/v1/posts?select=" + POST_COLS + "&id=eq." + encodeURIComponent(id), { headers: sbHeaders() });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json();
    return rows[0] || null;
  }

  function siteBase() {
    if (CFG.siteUrl) return CFG.siteUrl.replace(/\/?$/, "/");
    const m = location.pathname.match(/^(.*?\/)p\/\d+\/?/);
    return location.origin + (m ? m[1] : location.pathname.replace(/[^/]*$/, ""));
  }
  const postUrl = id => siteBase() + "p/" + id + "/";

  /* Share: the phone's share sheet where there is one; otherwise copy the link (WeChat's browser has no share sheet). */
  async function share(url, title) {
    if (navigator.share && !/MicroMessenger/i.test(navigator.userAgent)) {
      try { await navigator.share({ title, text: title, url }); return "shared"; }
      catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
    }
    try { await navigator.clipboard.writeText(title + "\n" + url); return "copied"; }
    catch (e) { return "manual"; }
  }

  function store(name) {
    return {
      all() { try { return JSON.parse(localStorage.getItem(name) || "{}"); } catch (e) { return {}; } },
      get(id) { return this.all()[id]; },
      set(id, v) { const a = this.all(); a[id] = v; try { localStorage.setItem(name, JSON.stringify(a)); } catch (e) {} },
      drop(id) { const a = this.all(); delete a[id]; try { localStorage.setItem(name, JSON.stringify(a)); } catch (e) {} }
    };
  }

  root.HLC = { CFG, SB_URL, SB_KEY, POSTS_ON, GROUPS, BOARDS, boardById, SCAM, scamHits, REPORT_REASONS,
    sbHeaders, rpc, getPost, POST_COLS, siteBase, postUrl, share, keys: store("hl-keys"), reported: store("hl-reported") };
})(typeof window !== "undefined" ? window : globalThis);
