/* 华邻网 front end. Plain JS, no build step. */
(function () {
  "use strict";
  const HLC = window.HLC;
  const CFG = HLC.CFG, SB_URL = HLC.SB_URL, SB_KEY = HLC.SB_KEY, POSTS_ON = HLC.POSTS_ON;
  const { GROUPS, BOARDS, boardById } = HLC;
  const FEATURED = ["jobs", "rest", "seek", "rent", "share", "house", "biz", "sale", "car", "move", "reno", "law"];

  const SECTIONS = ["top", "local", "immigration", "uschina", "china", "business", "health", "ent", "official"];

  /* ---------- text ---------- */
  const T = {
    zh: {
      gHomeLab: "纽约华人生活指南", gHomeH: "白卡、粮食券、公屋、绿卡……我能申请什么？", gHomeP: "用中文讲清楚谁能申请、要什么材料、去哪里办。回答几个问题，马上看到你可能符合的福利。",
      gCheckBtn: "开始自测", gAllBtn: "浏览全部指南", gIndexH: "纽约华人生活指南", gIndexP: "福利申请和办事流程，用中文讲清楚。规定经常变化，每篇都附官方链接和核实日期。",
      gCheckH: "我能申请什么？", gCheckP: "回答 6 个问题，看看你家可能符合哪些福利 →", gBack: "← 返回指南目录", guideTab: "生活指南",
      ckNote: "答案只保存在你的手机上，不会上传。结果只是初步参考，最终以政府审核为准。", ckWhere: "1. 你住在哪里？", ckNyc: "纽约市五大区", ckNys: "纽约州其他地方",
      ckAge: "2. 你的年龄", ckSize: "3. 家里一共几口人（一起住、一起报税或一起开伙）", ckIncome: "4. 全家每月税前总收入（美元）",
      ckIncomeHint: "包括工资、生意收入、社安金、退休金等；没有收入填 0", ckStatus: "5. 你的身份", st_citizen: "美国公民", st_lpr5: "绿卡满 5 年",
      st_lpr: "绿卡未满 5 年", st_refugee: "难民 / 庇护已批准", st_other: "其他合法身份（工作签、学生签、申请中等）", st_none: "暂时没有合法身份",
      ckFlags: "6. 家里有以下情况吗？（可多选）", fl_preg: "孕妇或 5 岁以下孩子", fl_kids: "18 岁以下孩子", fl_dis: "有人残障", fl_rent: "租房住",
      fl_reg: "住在租金稳定（rent-stabilized）公寓", ckGo: "看结果", ckLikely: "很可能符合", ckMaybe: "可能符合，要看具体情况", ckInfo: "建议了解",
      ckSum: "你家年收入约 ${y}，约为联邦贫困线的 {p}%。", ckNone: "根据你的回答，暂时没有找到明显符合的项目。可以浏览全部指南，或拨打 311 询问。",
      ckFoot: "这只是初步估算：实际资格还要看资产、开支、具体身份和家庭情况。很多项目即使超出一点也值得申请试试。", ckOpen: "看指南", ckHeads: "你可能可以申请：",
      readHere: "阅读全文", rdNew: "显示空白？点这里新窗口打开", zhDetail: "看中文版详情", enOrig: "去商家页面（英文原页）", zhDetailNote: "中文版由 Google 翻译自动生成，仅供参考，价格和条件以商家英文原页为准。", mtNote: "以上中文为机器翻译，仅供参考。", irNote: "以下全文由 {src} 网站提供", irFull: "全屏阅读", openOrig: "在原网站打开", rdBack: "← 返回华邻网", rdNote: "以下内容由原网站提供", readAt: "前往 {src} 阅读全文 →", artNoSum: "这家媒体不允许在其他网站内显示全文，请点下方按钮阅读。", artCopy: "新闻版权归 {src} 所有，华邻网仅收录标题与摘要并链接原文。", moreNews: "更多{s}新闻", artGone: "这条新闻已经更新下架，看看其他新闻吧。", newsBack: "← 返回{s}",
      dealsTab: "本周优惠", dealsH: "本周优惠和免费", dealsNote: "每天自动汇集网购折扣、免费领取和纽约免费活动；本地华人商家也可以免费发布优惠。优惠可能随时结束，请以商家页面为准。", dl_local: "华人商家优惠", dl_zh: "华人社区免费和优惠", dl_free: "免费领取", dl_online: "网购折扣", dl_events: "纽约免费活动", dl_postCta: "商家免费发布优惠 →", dl_none: "暂时没有，过几个小时再来看看。", dl_en: "英文",
      ckShare: "把这个自测分享给亲友", ckShareTitle: "我能申请什么？华邻网福利自测", ckShareText: "白卡、粮食券、公屋、老人福利……回答 6 个问题，看看你家可能申请哪些福利（免费、匿名）", shareSite: "分享本站", shareSiteText: "华邻网：在美华人新闻、生活指南、本周优惠和免费分类信息",
      shareWx: "分享到微信", shareCheckWx: "把自测分享到微信", shareShort: "分享",
      newsTab: "新闻",
      login: "登录 / 注册", logout: "退出", loginH: "登录 / 注册华邻网", loginWhy: "登录后才能发布信息，也能在任何设备上管理自己的信息。第一次登录会自动注册。", loginNeed: "登录后可以不限次数发布，并随时管理自己的信息；也可以游客身份发布，每天一条。",
      lgGuest: "以游客身份发布", lgGuestNote: "不用注册，每天限发一条", eGuest: "游客每天只能发一条。登录后可以发更多，也能随时管理自己的信息。", lgGoogle: "用 Google（Gmail）账号登录", lgWechat: "微信登录（即将开放）", lgOr: "或用电子邮箱", lgEmail: "电子邮箱", lgSend: "发送验证码", lgCode: "验证码（6 位数字）", lgBack: "换个邮箱", lgVerify: "登录",
      lgSent: "验证码已发到 {e}，请查收邮件（也看看垃圾邮件箱）。邮件里的链接也可以直接点开登录。", lgAgree: "登录即表示同意本站", lgBadEmail: "请输入正确的电子邮箱。", lgBadCode: "验证码不对或已过期，请重新发送。", lgFail: "暂时无法登录，请稍后再试。", lgWait: "发送太频繁，请过一分钟再试。", lgOk: "登录成功", lgOut: "已退出", eLogin: "请先登录再发布。",
      gLoading: "指南载入中…", footLegal: "免责声明", footLegalP: "本站内容仅供参考，不构成法律或专业意见，与政府机构无关。", footLegalLink: "阅读完整免责声明 →",
      formAgree: "点击“发布”即表示你保证信息真实合法，并同意", ckDisc: "自测结果只是粗略估算，不代表你一定符合或不符合，也不是政府的决定。", discUpdated: "更新日期", postDisc: "本信息由用户发布，本站未核实其内容，也不参与交易。",
      tagline: "在美华人 · 新闻与生活信息", searchPh: "搜索分类信息：工作、房屋、地区…", searchBtn: "搜索", postFree: "免费发布",
      directory: "分类目录", more: "更多", home: "首页", classifiedsTab: "分类信息",
      sec_top: "新闻速递", sec_local: "纽约本地", sec_immigration: "移民签证", sec_uschina: "中美关系", sec_china: "中国",
      sec_business: "财经", sec_health: "健康养生", sec_ent: "娱乐体育", sec_official: "政府公告", offNote: "美国联邦政府发布的内容属于公有领域，本站全文收录（英文原文，标题和摘要为机器翻译）。", offNoteZh: "美国联邦政府发布的内容属于公有领域，本站全文收录。中文为机器翻译，以英文原文为准。", showEn: "看英文原文", showZh: "看中文翻译", offLink: "查看官方原文", loadingFull: "全文载入中…",
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
      gHomeLab: "NYC Life Guides", gHomeH: "Medicaid, SNAP, public housing, green cards: what can I get?", gHomeP: "Plain-language guides on who qualifies, what to bring and where to apply. Answer a few questions to see what you may qualify for.",
      gCheckBtn: "Start the check", gAllBtn: "Browse all guides", gIndexH: "NYC Life Guides", gIndexP: "Benefits and paperwork explained. Rules change often, so every guide links to the official source and shows when it was checked.",
      gCheckH: "What can I apply for?", gCheckP: "Answer 6 questions to see which benefits your family may qualify for →", gBack: "← Back to guides", guideTab: "Life Guides",
      ckNote: "Your answers stay on your phone and are never uploaded. Results are a first estimate; the agency makes the final decision.", ckWhere: "1. Where do you live?", ckNyc: "New York City (5 boroughs)", ckNys: "Elsewhere in New York State",
      ckAge: "2. Your age", ckSize: "3. People in your household (living, filing taxes or buying food together)", ckIncome: "4. Household monthly income before tax (USD)",
      ckIncomeHint: "Wages, business income, Social Security, pensions, etc. Enter 0 if none.", ckStatus: "5. Your immigration status", st_citizen: "U.S. citizen", st_lpr5: "Green card, 5+ years",
      st_lpr: "Green card, under 5 years", st_refugee: "Refugee / asylum granted", st_other: "Other lawful status (work or student visa, pending case, etc.)", st_none: "No lawful status right now",
      ckFlags: "6. Does your household include… (check all that apply)", fl_preg: "Someone pregnant or a child under 5", fl_kids: "Children under 18", fl_dis: "Someone with a disability", fl_rent: "We rent our home",
      fl_reg: "We live in a rent-stabilized apartment", ckGo: "See results", ckLikely: "Likely eligible", ckMaybe: "Possibly, depends on details", ckInfo: "Worth reading",
      ckSum: "Your household earns about ${y} a year, about {p}% of the federal poverty line.", ckNone: "Nothing clearly matched your answers. Browse all guides, or call 311 for help.",
      ckFoot: "This is a rough estimate: assets, expenses and status details also matter. If you're close to a limit, it's often still worth applying.", ckOpen: "Read guide", ckHeads: "You may be able to get:",
      readHere: "Read full story", rdNew: "Blank? Open in a new window", zhDetail: "Read in Chinese", enOrig: "Open the store page", zhDetailNote: "The Chinese version is made by Google Translate; prices and terms on the store's page apply.", mtNote: "Machine translation, for reference only.", irNote: "Full story below is provided by {src}", irFull: "Full screen", openOrig: "Open original site", rdBack: "← Back to HuaLin", rdNote: "Content below is provided by the original site", readAt: "Read the full story at {src} →", artNoSum: "This publisher doesn't allow its stories to be shown inside other sites; use the button below to read it.", artCopy: "Copyright belongs to {src}. HuaLin shows the headline and summary and links to the original.", moreNews: "More {s}", artGone: "This story has rotated out. Here are the latest.", newsBack: "← Back to {s}",
      dealsTab: "Deals", dealsH: "Deals and freebies this week", dealsNote: "Online deals, freebies and free NYC events gathered daily; local businesses can post deals for free. Deals can end any time; check the store's page.", dl_local: "Local business deals", dl_zh: "Community freebies & deals", dl_free: "Freebies", dl_online: "Online deals", dl_events: "Free NYC events", dl_postCta: "Businesses: post a deal for free →", dl_none: "Nothing right now; check back in a few hours.", dl_en: "EN",
      ckShare: "Share this check with family and friends", ckShareTitle: "What can I apply for? HuaLin benefits check", ckShareText: "Medicaid, SNAP, public housing, senior help: answer 6 questions to see what your family may qualify for (free, anonymous)", shareSite: "Share HuaLin", shareSiteText: "HuaLin: news, life guides, weekly deals and free listings for Chinese Americans",
      shareWx: "Share", shareCheckWx: "Share this check", shareShort: "Share",
      newsTab: "News",
      login: "Sign in", logout: "Sign out", loginH: "Sign in to HuaLin", loginWhy: "Sign in to post listings and manage them from any device. Your first sign-in creates your account.", loginNeed: "Sign in to post without limits and manage your listings, or post as a guest (one a day).",
      lgGuest: "Post as a guest", lgGuestNote: "No sign-up, one listing per day", eGuest: "Guests can post one listing a day. Sign in to post more and manage your listings.", lgGoogle: "Continue with Google (Gmail)", lgWechat: "WeChat sign-in (coming soon)", lgOr: "or use email", lgEmail: "Email", lgSend: "Send code", lgCode: "Code (6 digits)", lgBack: "Use another email", lgVerify: "Sign in",
      lgSent: "We sent a code to {e}. Check your inbox (and spam). You can also tap the link in that email.", lgAgree: "By signing in you agree to our", lgBadEmail: "Enter a valid email address.", lgBadCode: "That code is wrong or expired. Send a new one.", lgFail: "Couldn't sign in right now. Please try again.", lgWait: "Too many requests. Wait a minute and try again.", lgOk: "Signed in", lgOut: "Signed out", eLogin: "Please sign in to post.",
      gLoading: "Loading guides…", footLegal: "Disclaimer", footLegalP: "Content is for general information, not legal or professional advice. Not affiliated with any government agency.", footLegalLink: "Read the full disclaimer →",
      formAgree: "By posting you confirm your listing is true and lawful, and you agree to the", ckDisc: "Results are a rough estimate, not a guarantee and not a government decision.", discUpdated: "Updated", postDisc: "Posted by a user. We haven't verified it and aren't part of any transaction.",
      tagline: "News & community listings for Chinese Americans", searchPh: "Search listings: jobs, rentals, areas…", searchBtn: "Search", postFree: "Post Free",
      directory: "Directory", more: "More", home: "Home", classifiedsTab: "Classifieds",
      sec_top: "Top Stories", sec_local: "New York", sec_immigration: "Immigration", sec_uschina: "US–China", sec_china: "China",
      sec_business: "Business", sec_health: "Health", sec_ent: "Entertainment & Sports", sec_official: "Official notices", offNote: "U.S. federal government works are in the public domain; shown here in full.", offNoteZh: "U.S. federal government works are in the public domain; shown here in full.", showEn: "Show English original", showZh: "Show Chinese translation", offLink: "View official source", loadingFull: "Loading full text…",
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
  let guides = null, watch = {}, deals = null;
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
    const [n, m, a, gd, w, dl] = await Promise.allSettled([getJSON("data/news.json"), getJSON("data/market.json"), getJSON("data/ads.json"), getJSON("data/guides.json"), getJSON("data/watch.json"), getJSON("data/deals.json")]);
    if (dl.status === "fulfilled" && dl.value && dl.value.sections) deals = dl.value;
    if (gd.status === "fulfilled" && gd.value && Array.isArray(gd.value.guides)) guides = gd.value;
    if (w.status === "fulfilled" && w.value) watch = w.value.pages || {};
    if (n.status === "fulfilled") news = n.value;
    if (m.status === "fulfilled") market = m.value;
    if (a.status === "fulfilled" && a.value && Array.isArray(a.value.slots)) ads = a.value;
    news = news || { sections: {} };
    // Each part renders on its own, so one problem can't blank out the rest of the page.
    [renderNews, renderMarket, renderAds, renderNewsView, renderArticle, renderGuides, renderDeals].forEach(fn => { try { fn(); } catch (e) { console.error(fn.name, e); } });
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
    renderTabs(); renderDir(); if (route.view === "disc") renderDisc(); if (route.view === "article") renderArticle(); try { renderDeals(); } catch (e) {} renderGuides(); if (route.view === "check" && $("#ckOut").innerHTML) showCheck(); renderNews(); renderMarket(); renderAds(); renderPostsAll(); renderNewsView(); renderAdContact();
  }
  function setLang(l) { lang = l; try { localStorage.setItem("hl-lang", l); } catch (e) {} applyLang(); }

  // Top menu: each item shows all of its sub-items when you hover (or tap on a phone).
  function menuItems() {
    const count = id => posts.filter(p => p.board === id).length;
    const items = [
      { h: "", label: t("home") },
      { h: "guide", label: t("guideTab"), menu: () => `<a class="mm-cta" href="#check">${esc(t("gCheckH"))} →</a>` + (guides ? `<div class="mm-cols">${guides.groups.map(gr => {
          const gs = guides.guides.filter(g => g.group === gr.id); if (!gs.length) return "";
          return `<div><b>${esc(HLG.L(gr, lang))}</b>${gs.map(g => `<a href="#g-${esc(g.id)}">${esc(HLG.L(g.title, lang))}</a>`).join("")}</div>`; }).join("")}</div>` : "") },
      { h: "deals", label: t("dealsTab"), menu: () => `<div class="mm-cols"><div>${["local", "zh", "free", "online", "events"].map(k => `<a href="${k === "local" ? "#b-deals" : "#deals"}">${esc(t("dl_" + k))}</a>`).join("")}<button type="button" class="mm-cta linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></div></div>` },
      { h: "n-top", label: t("newsTab"), menu: () => `<div class="mm-cols"><div>${SECTIONS.slice(0, 5).map(x => `<a href="#n-${x}">${esc(t("sec_" + x))}</a>`).join("")}</div><div>${SECTIONS.slice(5).map(x => `<a href="#n-${x}">${esc(t("sec_" + x))}</a>`).join("")}</div></div>` }
    ];
    for (const g of GROUPS) items.push({ h: "b-" + g.boards[0][0], label: lang === "zh" ? g.zh : g.en, group: g.id,
      menu: () => `<div class="mm-cols"><div>${g.boards.map(bd => { const n = count(bd[0]); return `<a href="#b-${bd[0]}"><span class="seal sm" aria-hidden="true">${esc(bd[1])}</span>${esc(lang === "zh" ? bd[2] : bd[3])}${n ? `<em>${n}</em>` : ""}</a>`; }).join("")}<button type="button" class="mm-cta linkbtn" data-postto="${g.boards[0][0]}">${esc(t("postFree"))} →</button></div></div>` });
    return items;
  }
  function renderTabs() {
    const items = menuItems();
    const curBoard = route.view === "board" ? boardById(route.board) : null;
    const artDeal = route.view === "article" && deals && Object.values(deals.sections || {}).some(l => l.some(x => x.id === route.id));
    const cur = artDeal ? "deals" : route.view === "news" || route.view === "article" ? "n-top" : (route.view === "guide" || route.view === "guideOne" || route.view === "check") ? "guide" : route.view === "deals" ? "deals" : curBoard ? "grp:" + curBoard.group : route.view === "home" ? "" : null;
    $("#tabs").innerHTML = items.map((it, k) => `<a href="#${it.h}" data-mi="${k}" class="${(it.group ? "grp:" + it.group : it.h) === cur ? "on" : ""}${it.menu ? " has-menu" : ""}" ${it.menu ? 'aria-haspopup="true"' : ""}>${esc(it.label)}${it.menu ? '<span class="caret" aria-hidden="true">▾</span>' : ""}</a>`).join("");
  }
  const mega = document.getElementById("mega");
  let megaTimer = null, megaIdx = -1;
  function openMega(a) {
    const it = menuItems()[Number(a.dataset.mi)]; if (!it || !it.menu) { closeMega(); return; }
    clearTimeout(megaTimer);
    megaIdx = Number(a.dataset.mi);
    mega.innerHTML = it.menu();
    mega.hidden = false;
    const nav = document.querySelector(".tabs").getBoundingClientRect(), r = a.getBoundingClientRect();
    const w = Math.min(mega.offsetWidth, window.innerWidth - 32);
    mega.style.left = Math.max(16, Math.min(r.left, window.innerWidth - w - 16)) + "px";
    mega.style.top = (nav.bottom) + "px";
    document.querySelectorAll("#tabs a.open").forEach(x => x.classList.remove("open")); a.classList.add("open");
  }
  function closeMega() { mega.hidden = true; megaIdx = -1; document.querySelectorAll("#tabs a.open").forEach(x => x.classList.remove("open")); }
  const canHover = window.matchMedia("(hover: hover)").matches;
  $("#tabs").addEventListener("mouseover", e => { const a = e.target.closest("a[data-mi]"); if (a && canHover) openMega(a); });
  $("#tabs").addEventListener("mouseleave", () => { if (canHover) megaTimer = setTimeout(closeMega, 220); });
  mega.addEventListener("mouseenter", () => clearTimeout(megaTimer));
  mega.addEventListener("mouseleave", () => { if (canHover) megaTimer = setTimeout(closeMega, 220); });
  $("#tabs").addEventListener("click", e => {
    const a = e.target.closest("a.has-menu"); if (!a) return;
    if (!canHover) { e.preventDefault(); if (megaIdx === Number(a.dataset.mi)) closeMega(); else openMega(a); }
  });
  $("#tabs").addEventListener("focusin", e => { const a = e.target.closest("a.has-menu"); if (a) openMega(a); });
  mega.addEventListener("click", e => { if (e.target.closest("a")) setTimeout(closeMega, 0); });
  document.addEventListener("click", e => { if (!mega.hidden && !e.target.closest("#mega,#tabs")) closeMega(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMega(); });
  $("#tabs").addEventListener("scroll", closeMega, { passive: true });
  window.addEventListener("hashchange", closeMega);
  window.addEventListener("scroll", () => { if (!mega.hidden) { const nav = document.querySelector(".tabs").getBoundingClientRect(); mega.style.top = nav.bottom + "px"; } }, { passive: true });

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
  // In Chinese mode, show the Chinese translation when we have one.
  const disp = i => (lang === "zh" && i.tz) ? i.tz : i.t;
  const dsum = i => (lang === "zh" && i.sz) ? i.sz : i.s;
  // Stories open on our own article page (#a-<id>); the article page links out to the full story.
  const nhref = i => i.id ? `href="#a-${esc(i.id)}"` : `href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer"`;
  function liHtml(i, withSummary, withThumb) {
    const thumb = withThumb && i.img;
    return `<li${thumb ? ' class="thumbed" data-hasimg' : ""}>${thumb ? `<a class="th-link" ${nhref(i)} tabindex="-1" aria-hidden="true">${imgTag(i, "th")}</a>` : ""}<div class="tx"><a class="t" ${nhref(i)}>${esc(disp(i))}</a>${withSummary && dsum(i) ? `<span class="s">${esc(dsum(i))}</span>` : ""}${metaHtml(i)}</div></li>`;
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
      lw.innerHTML = `<article class="lead">${lead.img ? `<a ${nhref(lead)} class="img" tabindex="-1" aria-hidden="true">${imgTag(lead, "")}</a>` : ""}
        <h3><a ${nhref(lead)}>${esc(disp(lead))}</a></h3>${dsum(lead) ? `<p>${esc(dsum(lead))}</p>` : ""}${metaHtml(lead)}</article>
        <ul class="nl compact">${rest.map(i => liHtml(i, false)).join("")}</ul>`;
    }
    ["local", "immigration", "uschina", "china", "business", "health"].forEach(s => {
      const { list, feat } = withFeature(sec(s).slice(0, 10), 6);
      const show = list.slice(0, 7);
      $("#sec-" + s).innerHTML = show.map((i, n) => n === 0 && feat ? liHtml(i, false, true).replace("<li", '<li data-feat') : liHtml(i, false)).join("");
      $("#sec-" + s).closest(".block").hidden = !show.length; // hide a section that has no stories right now
    });
    const off = sec("official").slice(0, 6), offEl = $("#sec-official");
    if (offEl) { offEl.innerHTML = off.map(i => liHtml(i, false)).join(""); offEl.closest(".block").hidden = !off.length; }
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
    renderDir(); try { renderDeals(); } catch (e) {}
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

  /* ---------- guides ---------- */
  const HLG = window.HLG;
  const POPULAR = ["medicaid", "snap", "nycha", "naturalization", "public-charge", "scrie", "fair-fares", "nyc-care"];
  function renderGuides() {
    const ready = guides && guides.guides && guides.guides.length;
    $("#gHome").hidden = !ready;
    if (!ready) { $("#gIndex").innerHTML = `<div class="empty">${esc(t("gLoading"))}</div>`; return; }
    const byId = id => guides.guides.find(g => g.id === id);
    const pop = POPULAR.map(byId).filter(Boolean).concat(guides.guides).filter((g, i, a) => a.indexOf(g) === i).slice(0, 8);
    $("#gHomeList").innerHTML = pop.map(g => `<a class="g-chip" href="#g-${esc(g.id)}"><span class="seal sm" aria-hidden="true">${esc(g.glyph || "指")}</span>${esc(HLG.L(g.title, lang))}</a>`).join("");
    if (route.view === "guide") $("#gIndex").innerHTML = HLG.renderIndex(guides, lang, g => "#g-" + g.id);
    if (route.view === "guideOne") {
      const g = byId(route.id);
      $("#gOne").innerHTML = g ? HLG.renderGuide(g, lang, { watch }) : `<div class="empty">${esc(t("noMatch"))}</div>`;
      if (g) document.title = HLG.L(g.title, lang) + " - 华邻网";
    }
    if (route.view === "check") restoreCheck();
  }
  $("#gShareTop").onclick = () => $("#gShare").click();
  $("#gShare").onclick = () => {
    const g = guides && guides.guides.find(x => x.id === route.id); if (!g) return;
    HLShare.open({ url: HLC.siteBase() + "g/" + g.id + "/", title: HLG.L(g.title, lang) + " - 华邻网", text: HLG.L(g.title, lang) + " - 华邻网生活指南" });
  };

  function readCheck() {
    return {
      nyc: (document.querySelector('input[name="ckNyc"]:checked') || {}).value !== "0",
      age: Number($("#ckAge").value) || 0, size: Number($("#ckSize").value) || 1,
      monthly: Math.max(0, Number($("#ckIncome").value) || 0), status: $("#ckStatus").value,
      flags: { preg: $("#fPreg").checked, kids: $("#fKids").checked || $("#fPreg").checked, disabled: $("#fDis").checked, renter: $("#fRent").checked || $("#fReg").checked, regulated: $("#fReg").checked }
    };
  }
  function restoreCheck() {
    if (restoreCheck.done) return; restoreCheck.done = true;
    let a = null; try { a = JSON.parse(localStorage.getItem("hl-check") || "null"); } catch (e) {}
    if (!a) return;
    const r = document.querySelector(`input[name="ckNyc"][value="${a.nyc ? 1 : 0}"]`); if (r) r.checked = true;
    $("#ckAge").value = a.age; $("#ckSize").value = a.size; $("#ckIncome").value = a.monthly; $("#ckStatus").value = a.status;
    $("#fPreg").checked = !!a.flags.preg; $("#fKids").checked = !!a.flags.kids; $("#fDis").checked = !!a.flags.disabled; $("#fRent").checked = !!a.flags.renter; $("#fReg").checked = !!a.flags.regulated;
  }
  function showCheck() {
    if (!guides) return;
    const a = readCheck();
    try { localStorage.setItem("hl-check", JSON.stringify(a)); } catch (e) {}
    const r = HLG.evaluate(guides, a);
    const money = Math.round(r.yearly).toLocaleString("en-US");
    const head = r.pct != null ? `<p class="ck-sum">${esc(t("ckSum").replace("{y}", money).replace("{p}", r.pct))}</p>` : "";
    const rows = r.results.map(x => `<li><a href="#g-${esc(x.g.id)}"><span class="seal sm" aria-hidden="true">${esc(x.g.glyph || "指")}</span><span><b>${esc(HLG.L(x.g.title, lang))}</b><small>${esc(HLG.L(x.g.short || x.g.summary, lang))}</small></span><em class="lv ${x.level}">${esc(t(x.level === "likely" ? "ckLikely" : x.level === "maybe" ? "ckMaybe" : "ckInfo"))}</em></a></li>`).join("");
    $("#ckOut").innerHTML = `<section class="ck-res">${head}${rows ? `<h2>${esc(t("ckHeads"))}</h2><ul>${rows}</ul>` : `<p>${esc(t("ckNone"))}</p>`}<p class="g-fine">${esc(t("ckFoot"))}</p><button type="button" class="btn" id="ckShare">${esc(t("ckShare"))}</button></section>`;
    $("#ckShare").onclick = () => HLShare.open({ url: HLC.siteBase() + "#check", title: t("ckShareTitle"), text: t("ckShareText") });
    $("#ckOut").scrollIntoView({ block: "start", behavior: "smooth" });
  }
  $("#ckForm").addEventListener("submit", e => { e.preventDefault(); showCheck(); });

  // Google's own page-translation service: shows any English page in Chinese.
  function gtrans(u) {
    try {
      const x = new URL(u);
      x.hostname = x.hostname.replace(/-/g, "--").replace(/\./g, "-") + ".translate.goog";
      x.searchParams.set("_x_tr_sl", "auto"); x.searchParams.set("_x_tr_tl", "zh-CN"); x.searchParams.set("_x_tr_hl", "zh-CN"); x.searchParams.set("_x_tr_pto", "wapp");
      return x.href;
    } catch (e) { return u; }
  }
  const isEnglish = i => !/[\u3400-\u9fff]/.test(i.t || "");
  function findStory(id) {
    const ds = (deals && deals.sections) || {};
    for (const [k, list] of Object.entries(ds)) { const i = list.find(x => x.id === id); if (i) return { i, sname: "deal_" + k, lg: "zh", deal: true }; }
    for (const lg of [lang, lang === "zh" ? "en" : "zh"]) {
      const secs = (news && news.sections && news.sections[lg]) || {};
      for (const [sname, list] of Object.entries(secs)) { const i = list.find(x => x.id === id); if (i) return { i, sname, lg }; }
    }
    return null;
  }
  function renderArticle() {
    if (route.view !== "article") return;
    const hit = news ? findStory(route.id) : null;
    const secName = s => t("sec_" + s);
    if (!hit) {
      $("#aBack").textContent = t("back"); $("#aBack").setAttribute("href", "#");
      $("#aBody").innerHTML = `<p class="empty">${esc(news ? t("artGone") : t("loading"))}</p>`;
      $("#aSide").innerHTML = news ? `<section class="block"><ul class="nl">${sec("top").slice(0, 8).map(x => liHtml(x, false)).join("")}</ul></section>` : "";
      return;
    }
    const { i, sname } = hit;
    const secLabel = hit.deal ? t("dl_" + sname.slice(5)) : secName(sname);
    $("#aBack").textContent = t("newsBack").replace("{s}", hit.deal ? t("dealsTab") : secName(sname)); $("#aBack").setAttribute("href", hit.deal ? "#deals" : "#n-" + sname);
    const zhView = lang === "zh" && isEnglish(i) && !i.full;   // English page, Chinese reader: show it through Google Translate
    const readUrl = zhView ? gtrans(i.u) : i.u;
    const src = i.src || (lang === "zh" ? "原网站" : "the publisher");
    $("#aBody").innerHTML = `<span class="tag">${esc(secLabel)}</span>
      <h1>${esc(disp(i))}</h1>
      ${lang === "zh" && i.tz ? `<p class="orig-t">${esc(i.t)}</p>` : ""}
      ${metaHtml(i)}
      ${i.img ? `<div class="art-img" data-hasimg>${imgTag(i, "")}</div>` : ""}
      ${i.full ? `${lang === "zh" && i.sz ? `<p class="art-sum">${esc(i.sz)}</p>` : ""}<p class="g-notice">${esc(lang === "zh" && i.fullzh ? t("offNoteZh") : t("offNote"))}</p><div class="art-full" id="aFull"><p class="muted">${esc(t("loadingFull"))}</p></div>` : dsum(i) ? `<p class="art-sum">${esc(dsum(i))}</p>${zhView ? `<p class="g-notice">${esc(t("mtNote"))}</p>` : ""}` : i.fr ? "" : `<p class="art-sum muted">${esc(t("artNoSum"))}</p>`}
      ${zhView ? `<div class="post-actions"><button type="button" class="btn" data-reader="${esc(readUrl)}" data-src="${esc(src)}">${esc(t("zhDetail"))}</button><a class="btn ghost" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("enOrig"))}</a></div><p class="g-fine">${esc(t("zhDetailNote"))}</p>` : ""}
      ${i.fr && !i.full && !zhView ? `<div class="inline-read"><div class="ir-bar"><span>${esc(t("irNote").replace("{src}", src))}</span><button type="button" class="linkbtn" id="aRead">${esc(t("irFull"))}</button></div><iframe class="ir-frame" src="${esc(safeUrl(i.u))}" title="${esc(i.t)}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>` : ""}
      <div class="post-actions"${zhView ? " hidden" : ""}>${i.full ? `<a class="btn ghost" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("offLink"))}</a>` : i.fr ? `<a class="btn ghost" href="${esc(safeUrl(i.u))}" data-reader="${esc(safeUrl(i.u))}" data-src="${esc(src)}">${esc(t("irFull"))}</a>` : `<a class="btn" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("readAt").replace("{src}", src))}</a>`}<button type="button" class="btn ghost" id="aShare">${esc(t("share"))}</button></div>
      <p class="g-fine">${esc(t("artCopy").replace("{src}", src))}</p>`;
    document.title = i.t + " - 华邻网";
    const others = (news.sections[hit.lg][sname] || []).filter(x => x !== i).slice(0, 10);
    $("#aSide").innerHTML = `<section class="block"><div class="bh"><h2>${esc(t("moreNews").replace("{s}", secName(sname)))}</h2></div><ul class="nl">${others.map(x => liHtml(x, false, !!x.img)).join("")}</ul></section>
      <a class="g-check-cta" href="#check"><b>${esc(t("gCheckH"))}</b><span>${esc(t("gCheckP"))}</span></a>`;
    const rd = $("#aRead"); if (rd) rd.onclick = () => openReader(i, src);
    if (i.full) getJSON("data/full/" + i.id + ".json").then(f => {
      const box = $("#aFull"); if (!box || route.id !== i.id) return;
      const useZh = lang === "zh" && f.body_zh && !box.dataset.en;
      const body = useZh ? f.body_zh : (f.body || []);
      box.innerHTML = (useZh || f.body_zh ? `<p><button type="button" class="linkbtn" id="aLangSw">${esc(useZh ? t("showEn") : t("showZh"))}</button></p>` : "") + body.map(b => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : b.startsWith("• ") ? `<p class="li">${esc(b)}</p>` : `<p>${esc(b)}</p>`).join("");
      const sw = $("#aLangSw"); if (sw) sw.onclick = () => { if (box.dataset.en) delete box.dataset.en; else box.dataset.en = "1"; renderArticle(); };
    }).catch(() => { const box = $("#aFull"); if (box) box.innerHTML = ""; });
    $("#aShare").onclick = () => HLShare.open({ url: HLC.siteBase() + "n/" + i.id + "/", title: i.t, text: i.t + " - 华邻网" });
  }
  // Reader: shows the publisher's own page inside our site (only for sites that allow being embedded).
  function openReader(i, src) { openReaderUrl(i.u, src); }
  function openReaderUrl(u, src) {
    const r = $("#reader");
    $("#rdSrc").textContent = src || "";
    $("#rdOrig").setAttribute("href", safeUrl(u));
    $("#rdFrame").setAttribute("src", safeUrl(u));
    r.hidden = false; document.body.classList.add("noscroll");
    $("#rdClose").focus();
  }
  function closeReader() {
    $("#reader").hidden = true; document.body.classList.remove("noscroll");
    $("#rdFrame").setAttribute("src", "about:blank");
  }
  $("#rdClose").onclick = closeReader;
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#reader").hidden) closeReader(); });
  window.addEventListener("hashchange", () => { if (!$("#reader").hidden) closeReader(); });

  /* ---------- deals ---------- */
  const DEAL_SECS = ["zh", "free", "online", "events"];
  function dealLi(i, en) {
    const title = lang === "zh" && i.tz ? i.tz : i.t;
    const showEn = en && !(lang === "zh" && i.tz) && lang === "zh";
    const link = i.id ? `href="#a-${esc(i.id)}"` : `href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer"`;
    return `<li><a class="t" ${link}>${showEn ? `<span class="en-tag">${esc(t("dl_en"))}</span>` : ""}${esc(title)}</a>${metaHtml(i)}</li>`;
  }
  function localDeals() { return posts.filter(p => p.board === "deals"); }
  function renderDeals() {
    const box = $("#dealsHome"); if (!box) return;
    const ds = (deals && deals.sections) || {};
    const local = localDeals().slice(0, 5);
    const cols = [];
    cols.push(`<section class="block dcol"><div class="bh"><h2>${esc(t("dl_local"))}</h2><a href="#b-deals">${esc(t("more"))}</a></div>${local.length ? `<ul class="rows">${local.map(p => rowHtml(p, false)).join("")}</ul>` : ""}<button type="button" class="linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></section>`);
    for (const k of DEAL_SECS) {
      const list = (ds[k] || []).slice(0, 5);
      if (!list.length) continue;
      cols.push(`<section class="block dcol"><div class="bh"><h2>${esc(t("dl_" + k))}</h2><a href="#deals">${esc(t("more"))}</a></div><ul class="nl">${list.map(i => dealLi(i, k !== "zh")).join("")}</ul></section>`);
    }
    $("#dealsGrid").innerHTML = cols.join("");
    box.hidden = false;
    if (route.view === "deals") {
      const all = localDeals();
      $("#dealsFull").innerHTML = `<section class="block"><div class="bh"><h2>${esc(t("dl_local"))}</h2><button type="button" class="linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></div>${all.length ? `<ul class="plist">${all.map(p => pitemHtml(p, false)).join("")}</ul>` : `<p class="empty">${esc(t("dl_none"))}</p>`}</section>` +
        DEAL_SECS.map(k => `<section class="block"><div class="bh"><h2>${esc(t("dl_" + k))}</h2></div>${(ds[k] || []).length ? `<ul class="nl full">${ds[k].map(i => dealLi(i, k !== "zh")).join("")}</ul>` : `<p class="empty">${esc(t("dl_none"))}</p>`}</section>`).join("");
    }
  }

  function renderDisc() {
    const d = HLC.DISCLAIMER, x = d[lang] || d.zh;
    const rich = v => esc(v).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    $("#discBody").innerHTML = `<div class="g-head"><span class="seal md" aria-hidden="true">${lang === "zh" ? "责" : "!"}</span><div><h1>${esc(x.title)}</h1><p class="g-sum">${esc(x.intro)}</p></div></div>` +
      x.items.map(([h, p], i) => `<section><h2>${i + 1}. ${esc(h)}</h2><p>${rich(p)}</p></section>`).join("") +
      `<p class="g-fine">${esc(t("discUpdated"))} ${esc(d.updated)}</p>`;
  }

  /* ---------- routing ---------- */
  function go() {
    const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (h === "post") { try { history.replaceState(null, "", location.pathname); } catch (e) {} setTimeout(() => openForm(), 0); }
    if (h.startsWith("b-") && boardById(h.slice(2))) route = { view: "board", board: h.slice(2) };
    else if (h.startsWith("n-") && SECTIONS.includes(h.slice(2))) route = { view: "news", sec: h.slice(2) };
    else if (h === "search" && searchQ) route = { view: "search" };
    else if (h === "guide") route = { view: "guide" };
    else if (h === "check") route = { view: "check" };
    else if (h.startsWith("g-")) route = { view: "guideOne", id: h.slice(2) };
    else if (h === "disclaimer") route = { view: "disc" };
    else if (h === "deals") route = { view: "deals" };
    else if (h.startsWith("a-")) route = { view: "article", id: h.slice(2) };
    else route = { view: "home" };
    $("#vHome").hidden = route.view !== "home"; $("#vBoard").hidden = route.view !== "board";
    $("#vNews").hidden = route.view !== "news"; $("#vSearch").hidden = route.view !== "search";
    $("#vArticle").hidden = route.view !== "article"; if (route.view === "article") renderArticle();
    $("#vDeals").hidden = route.view !== "deals"; if (route.view === "deals") renderDeals();
    $("#vDisc").hidden = route.view !== "disc"; if (route.view === "disc") renderDisc();
    $("#vGuide").hidden = route.view !== "guide"; $("#vGuideOne").hidden = route.view !== "guideOne"; $("#vCheck").hidden = route.view !== "check";
    if (route.view === "guide" || route.view === "guideOne" || route.view === "check") renderGuides();
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
    const mineAcct = myIds.has(p.id) || myIds.has(String(p.id));
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
      <p class="warn">${esc(t("postDisc"))} <a class="flink" href="#disclaimer" data-close>${esc(t("footLegal"))}</a></p>
      <div class="post-actions">
        <button type="button" class="btn" id="shareBtn">${esc(t("share"))}</button>
        <button type="button" class="btn ghost" id="repBtn">${esc(t("report"))}</button>
        ${myKey || mineAcct ? `<button type="button" class="btn ghost" id="delBtn">${esc(t("del"))}</button>` : ""}
      </div>
      <div class="manual" id="manualBox" hidden><span>${esc(t("shareManual"))}</span><input readonly value="${esc(url)}" aria-label="${esc(t("pageLink"))}"></div>
      <div class="reasons" id="repBox" hidden><b>${esc(t("reportH"))}</b>
        ${HLC.REPORT_REASONS.map(([k, zh, en], i) => `<label><input type="radio" name="rr" value="${k}" ${i === 0 ? "checked" : ""}> ${esc(lang === "zh" ? zh : en)}</label>`).join("")}
        <button type="button" class="btn" id="repSend">${esc(t("reportSend"))}</button></div>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
    $("#shareBtn").onclick = () => HLShare.open({ url, title: (p.area ? "[" + p.area + "] " : "") + p.title, text: (p.area ? "[" + p.area + "] " : "") + p.title + " - 华邻网" });
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
        const ok = mineAcct ? await HLC.rpc("delete_my_post", { p_id: p.id }) : await rpc("delete_post", { p_id: p.id, p_key: myKey });
        if (ok === false) throw new Error("not found");
        keys.drop(p.id); posts = posts.filter(x => x.id !== p.id); renderPostsAll(); $("#viewDlg").close(); toast(t("deleted"));
      } catch (e) { del.disabled = false; toast(t("delFail")); }
    };
  }

  /* ---------- post form ---------- */
  /* ---------- sign-in ---------- */
  let afterLogin = null, myIds = new Set();
  const A = window.HLAuth;
  const LOGIN_ON = !!(CFG.loginEmail || CFG.loginGoogle);
  function renderUser() {
    const u = A && A.user();
    $("#loginBtn").hidden = !!u || !LOGIN_ON; $("#userBox").hidden = !u;
    $("#lgGoogle").hidden = !CFG.loginGoogle;
    document.querySelector(".login-sep").hidden = !(CFG.loginEmail && CFG.loginGoogle);
    $("#lgStep1").dataset.off = CFG.loginEmail ? "" : "1";
    if (u) $("#userName").textContent = u.name || u.email;
  }
  async function loadMine() {
    myIds = new Set();
    if (!A || !A.user() || !POSTS_ON) return;
    try { const ids = await HLC.rpc("my_post_ids", {}); (ids || []).forEach(x => myIds.add(typeof x === "object" ? Object.values(x)[0] : x)); } catch (e) {}
  }
  let guestOk = false;
  function openLogin(why, offerGuest) {
    $("#lgErr").textContent = ""; $("#lgStep1").hidden = !CFG.loginEmail; $("#lgStep2").hidden = true;
    $("#lgGuest").hidden = !offerGuest;
    $("#loginWhy").textContent = why || t("loginWhy");
    $("#loginDlg").showModal();
  }
  if (A) {
    A.onChange(() => { renderUser(); loadMine(); });
    $("#loginBtn").onclick = () => { afterLogin = null; openLogin(); };
    $("#lgGuest").onclick = () => { guestOk = true; const f = afterLogin; afterLogin = null; $("#loginDlg").close(); if (f) f(); };
    $("#logoutBtn").onclick = async () => { await A.signOut(); toast(t("lgOut")); };
    $("#lgGoogle").onclick = () => { try { sessionStorage.setItem("hl-after-login", afterLogin ? "post" : ""); } catch (e) {} A.google(); };
    let lgEmail = "";
    $("#lgSend").onclick = async () => {
      const e = $("#lgEmail").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { $("#lgErr").textContent = t("lgBadEmail"); return; }
      const b = $("#lgSend"); b.disabled = true; $("#lgErr").textContent = "";
      try { await A.sendCode(e); lgEmail = e; $("#lgSent").textContent = t("lgSent").replace("{e}", e); $("#lgStep1").hidden = true; $("#lgStep2").hidden = false; $("#lgCode").focus(); }
      catch (err) { $("#lgErr").textContent = err.status === 429 ? t("lgWait") : t("lgFail"); }
      finally { b.disabled = false; }
    };
    $("#lgBack").onclick = () => { $("#lgStep1").hidden = false; $("#lgStep2").hidden = true; };
    $("#lgVerify").onclick = async () => {
      const c = $("#lgCode").value.replace(/\D/g, "");
      const b = $("#lgVerify"); b.disabled = true; $("#lgErr").textContent = "";
      try { await A.verifyCode(lgEmail, c); $("#loginDlg").close(); toast(t("lgOk")); if (afterLogin) { const f = afterLogin; afterLogin = null; f(); } }
      catch (err) { $("#lgErr").textContent = t("lgBadCode"); }
      finally { b.disabled = false; }
    };
  }

  function openForm(board) {
    if (A && POSTS_ON && LOGIN_ON && !A.user() && !guestOk) { afterLogin = () => openForm(board); openLogin(t("loginNeed"), true); return; }
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
      const res = await HLC.rpc("create_post", d);
      const row = Array.isArray(res) ? res[0] : res;
      if (row && row.id) keys.set(row.id, row.delete_key);
      $("#postDlg").close();
      await loadPosts();
      location.hash = "b-" + d.p_board;
      if (row && row.id) setTimeout(() => openPost(row.id, { justPosted: true }), 60); else toast(t("posted"));
    } catch (er) {
      const m = String(er.message || "") + String(er.raw || "");
      if (/guest_limit/.test(m)) { $("#fErr").textContent = t("eGuest"); guestOk = false; return; }
      if (/login_required|permission denied|JWT/i.test(m)) { $("#postDlg").close(); afterLogin = () => openForm(d.p_board); openLogin(t("loginNeed")); return; }
      $("#fErr").textContent = t(/too_many_posts/.test(m) ? "eFlood" : /site_busy/.test(m) ? "eBusy" : "eSave");
    } finally { btn.disabled = false; btn.textContent = t("submit"); }
  }

  /* ---------- events ---------- */
  // The floating button shares whatever the reader is looking at.
  function shareCurrent() {
    const base = HLC.siteBase();
    if (route.view === "article") { const h = findStory(route.id); if (h) return HLShare.open({ url: base + "n/" + h.i.id + "/", title: h.i.t, text: h.i.t + " - 华邻网" }); }
    if (route.view === "guideOne" && guides) { const g = guides.guides.find(x => x.id === route.id); if (g) return HLShare.open({ url: base + "g/" + g.id + "/", title: HLG.L(g.title, lang), text: HLG.L(g.title, lang) + " - 华邻网生活指南" }); }
    if (route.view === "check") return HLShare.open({ url: base + "#check", title: t("ckShareTitle"), text: t("ckShareText") });
    if (route.view === "deals") return HLShare.open({ url: base + "#deals", title: t("dealsH") + " - 华邻网", text: t("dealsH") + " - 华邻网" });
    return HLShare.open({ url: base, title: "华邻网 HuaLin", text: t("shareSiteText") });
  }
  $("#fabShare").onclick = shareCurrent;
  document.addEventListener("click", e => { if (e.target.closest("[data-share-check]")) HLShare.open({ url: HLC.siteBase() + "#check", title: t("ckShareTitle"), text: t("ckShareText") }); });
  $("#siteShare").onclick = () => HLShare.open({ url: HLC.siteBase(), title: "华邻网 HuaLin", text: t("shareSiteText") });
  const fs2 = $("#footShare"); if (fs2) fs2.onclick = () => HLShare.open({ url: HLC.siteBase(), title: "华邻网 HuaLin", text: t("shareSiteText") });
  $("#lzh").onclick = () => setLang("zh");
  $("#len").onclick = () => setLang("en");
  window.addEventListener("hashchange", go);
  $("#postForm").addEventListener("submit", submitForm);
  $("#bFilter").addEventListener("input", renderBoard);
  $("#bPost").onclick = () => openForm(route.board);
  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); searchQ = $("#q").value.trim(); if (!searchQ) return; if (location.hash === "#search") go(); else location.hash = "search"; });
  document.addEventListener("click", e => {
    const rdl = e.target.closest("[data-reader]");
    if (rdl) { e.preventDefault(); openReaderUrl(rdl.dataset.reader, rdl.dataset.src); return; }
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

  // If the phone shows a cached older page, reload once to get the newest version.
  (function checkVersion() {
    const mine = (document.querySelector('meta[name="hl-build"]') || {}).content;
    if (!mine || mine === "dev") return;
    fetch("data/version.json?t=" + Date.now(), { cache: "no-store" }).then(r => r.json()).then(v => {
      if (v && v.v && v.v !== mine) {
        let tried = ""; try { tried = sessionStorage.getItem("hl-reload") || ""; } catch (e) {}
        if (tried === v.v) return;
        try { sessionStorage.setItem("hl-reload", v.v); } catch (e) {}
        location.reload();
      }
    }).catch(() => {});
  })();

  if (A) {
    const back = A.takeTokensFromUrl();
    if (back) setTimeout(() => { if (A.user() || A.token) toast(t("lgOk")); let w = ""; try { w = sessionStorage.getItem("hl-after-login") || ""; sessionStorage.removeItem("hl-after-login"); } catch (e) {} if (w === "post") setTimeout(() => openForm(), 600); }, 800);
    renderUser(); loadMine();
  }
  applyLang();
  go();
  loadData();
  loadPosts();
  setInterval(loadData, 10 * 60 * 1000);
  setInterval(loadPosts, 3 * 60 * 1000);
})();
