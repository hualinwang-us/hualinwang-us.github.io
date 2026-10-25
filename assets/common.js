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
      ["car", "车", "汽车买卖", "Cars"], ["furn", "家", "家具家电", "Furniture & Appliances"],
      ["deals", "惠", "商家优惠", "Local Deals"]] },
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
      ["other", "杂", "其他", "Other"]] },
    { id: "social", zh: "同城交友", en: "Meet Locals", boards: [
      ["dating", "友", "同城交友", "Meet Locals"]] }
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
    { re: /日赚|日入|月入\s*\d+\s*万|轻松月入|躺赚|无需经验.{0,6}高薪/, zh: "高薪轻松", en: "easy high pay" },
    { re: /投资|炒币|虚拟货币|加密货币|usdt|比特币|带你赚钱|理财平台|内幕消息|稳赚/i, zh: "投资理财（杀猪盘常见话术）", en: "investment or crypto (a common romance-scam line)" }
  ];
  const scamHits = text => SCAM.filter(s => s.re.test(text || ""));
  /* Sexual services and paid companionship are not allowed anywhere on the site. Posts matching these are refused. */
  const BANNED = /上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup/i;

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
  const POST_COLS_IMG = POST_COLS + ",images";
  async function rpc(fn, body) {
    const h = sbHeaders();
    const tk = root.HLAuth ? await root.HLAuth.token() : null;
    if (tk) h.Authorization = "Bearer " + tk;
    const r = await fetch(SB_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: h, body: JSON.stringify(body || {}) });
    const txt = await r.text();
    let data = null; try { data = JSON.parse(txt); } catch (e) {}
    if (!r.ok) { const err = new Error((data && (data.message || data.hint)) || ("HTTP " + r.status)); err.raw = txt; throw err; }
    return data;
  }
  async function getPost(id) {
    let r = await fetch(SB_URL + "/rest/v1/posts?select=" + POST_COLS_IMG + "&id=eq." + encodeURIComponent(id), { headers: sbHeaders() });
    if (!r.ok) r = await fetch(SB_URL + "/rest/v1/posts?select=" + POST_COLS + "&id=eq." + encodeURIComponent(id), { headers: sbHeaders() });
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


  /* Site disclaimer (shown at #disclaimer and linked from every page footer). */
  const DISCLAIMER = {
    updated: "2026-10-24",
    zh: { title: "免责声明", intro: "使用华邻网（以下称“本站”）即表示你理解并同意以下内容。",
      items: [
        ["仅供一般参考", "本站的新闻、生活指南、“我能申请什么”自测结果及其他内容，只供一般参考，**不构成法律、移民、税务、医疗、财务或其他专业意见**，也不会因此建立律师与客户或任何专业服务关系。遇到具体问题，请咨询持牌律师或相关专业人士。"],
        ["以官方为准", "我们尽力根据官方资料编写并标注核实日期，但政府规定经常变化，内容可能有延误、遗漏或错误。**一切以政府机构的官方网站、正式文件和工作人员的说明为准**。申请任何福利或递交移民文件前，请先向官方或专业人士确认。"],
        ["自测结果不代表资格", "自测只按你提供的少量资料做粗略估算，**不保证你符合或不符合任何项目**，也不代表政府的决定。实际资格由主管机构审核决定。"],
        ["与政府机构无关", "本站是独立的社区网站，**与任何政府机构没有关联**，不代表任何机构发言，也不代办任何申请。"],
        ["新闻内容", "新闻由程序自动从第三方媒体汇集标题和摘要，版权归原媒体所有，内容和观点不代表本站立场，本站不对其准确性负责。"],
        ["分类信息和广告", "分类信息和广告由用户或商家自行发布，**本站不核实其真实性、合法性或质量，也不参与任何交易**。因信息或交易产生的纠纷和损失，由交易双方自行负责。请当面交易，切勿预付定金或向陌生人转账。发现可疑信息请点“举报”，本站有权不经通知删除任何内容。"],
        ["发布者责任", "发布信息即表示你保证内容真实合法、不侵犯他人权利，并对内容自行负责。请勿发布证件号码、银行账号等敏感个人资料。"],
        ["外部链接", "本站包含指向政府网站、媒体和其他第三方网站的链接，本站不对这些网站的内容、隐私做法或可用性负责。"],
        ["隐私", "自测答案只保存在你自己的手机或电脑上，不会上传。你发布的分类信息（包括联系方式）会公开显示给所有访客。"],
        ["责任限制", "在法律允许的最大范围内，本站及其运营者不对因使用或依赖本站内容而造成的任何直接或间接损失承担责任。"],
        ["更正", "如发现内容有误，欢迎联系站长，我们会尽快核实更正。"]
      ] },
    en: { title: "Disclaimer", intro: "By using HuaLin (\"this site\") you understand and agree to the following.",
      items: [
        ["General information only", "News, life guides, \"What can I apply for?\" results and other content are for general information only and are **not legal, immigration, tax, medical, financial or other professional advice**. No attorney-client or other professional relationship is created. For your specific situation, consult a licensed attorney or qualified professional."],
        ["Official sources control", "We write from official sources and show when each guide was checked, but rules change often and content may be delayed, incomplete or wrong. **Government agencies' official websites, documents and staff are the final word.** Confirm with the agency or a professional before applying for benefits or filing immigration papers."],
        ["Check results are not eligibility decisions", "The check is a rough estimate from a few answers. **It does not guarantee you do or don't qualify** and is not a government decision. Agencies decide eligibility."],
        ["Not a government site", "This is an independent community site, **not affiliated with any government agency**. It does not speak for any agency or file applications for you."],
        ["News", "Headlines and summaries are gathered automatically from third-party outlets, which own the copyright. Their content and views are not ours, and we are not responsible for their accuracy."],
        ["Listings and ads", "Listings and ads are posted by users and businesses. **We don't verify their truth, legality or quality and are not part of any transaction.** Disputes and losses are between the parties. Meet in person and never prepay or send money to strangers. Report suspicious listings; we may remove any content without notice."],
        ["Your responsibility when posting", "By posting you confirm your listing is true, lawful and doesn't infringe others' rights, and you are responsible for it. Don't post ID numbers, bank details or other sensitive data."],
        ["External links", "We link to government sites, news outlets and other third parties and are not responsible for their content, privacy practices or availability."],
        ["Privacy", "Your check answers stay on your own device and are never uploaded. Listings you post, including contact details, are public."],
        ["Limitation of liability", "To the fullest extent permitted by law, this site and its operator are not liable for any direct or indirect loss from using or relying on its content."],
        ["Corrections", "If you spot an error, please contact the site owner and we'll check and correct it."]
      ] }
  };

  root.HLC = { DISCLAIMER, CFG, SB_URL, SB_KEY, POSTS_ON, GROUPS, BOARDS, boardById, SCAM, scamHits, BANNED, REPORT_REASONS,
    sbHeaders, rpc, getPost, POST_COLS, POST_COLS_IMG, siteBase, postUrl, share, keys: store("hl-keys"), reported: store("hl-reported") };
})(typeof window !== "undefined" ? window : globalThis);
