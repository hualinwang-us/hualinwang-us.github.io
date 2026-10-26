/* 华脉 front end. Plain JS, no build step. */
(function () {
  "use strict";
  const HLC = window.HLC;
  const CFG = HLC.CFG, SB_URL = HLC.SB_URL, SB_KEY = HLC.SB_KEY, POSTS_ON = HLC.POSTS_ON;
  const { GROUPS, BOARDS, boardById } = HLC;
  const BASE_TITLE = document.title;
  // One consistent set of line icons (instead of emoji, which look different on every phone).
  const IC_GRID = '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>';
  const IC = {"chart": "<path d=\"M3 3v18h18\"/><path d=\"m7 15 4-4 3 3 6-6\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>", "phone": "<path d=\"M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2\"/>", "pin": "<path d=\"M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z\"/><circle cx=\"12\" cy=\"9\" r=\"2.5\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18\"/>", "camera": "<path d=\"M4 8h3l2-3h6l2 3h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/>", "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 7 9 6 9-6\"/>", "image": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"2\"/><path d=\"m21 16-5-5-9 9\"/>"};
  const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${n === "grid" ? IC_GRID : IC[n]}</svg>`;
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
      readHere: "阅读全文", rdNew: "显示空白？点这里新窗口打开", zhDetail: "看中文版详情", enOrig: "去商家页面（英文原页）", zhDetailNote: "中文版由 Google 翻译自动生成，仅供参考，价格和条件以商家英文原页为准。", mtNote: "以上中文为机器翻译，仅供参考。", irNote: "以下全文由 {src} 网站提供", irFull: "全屏阅读", openOrig: "在原网站打开", rdBack: "← 返回华脉", rdNote: "以下内容由原网站提供", readAt: "前往 {src} 阅读全文 →", artNoSum: "这家媒体不允许在其他网站内显示全文，请点下方按钮阅读。", artCopy: "新闻版权归 {src} 所有，华脉仅收录标题与摘要并链接原文。", moreNews: "更多{s}新闻", artGone: "这条新闻已经更新下架，看看其他新闻吧。", newsBack: "← 返回{s}",
      dealsTab: "本周优惠", dealsH: "本周优惠和免费", dealsNote: "每天自动汇集网购折扣、免费领取和纽约免费活动；本地华人商家也可以免费发布优惠。优惠可能随时结束，请以商家页面为准。", dl_local: "华人商家优惠", dl_biz: "华人商家优惠", sGuides: "相关福利指南", sNews: "相关新闻", sPosts: "分类信息", dl_zh: "华人社区免费和优惠", dl_free: "免费领取", dl_online: "网购折扣", dl_events: "纽约免费活动", dl_postCta: "商家免费发布优惠 →", dl_none: "暂时没有，过几个小时再来看看。", dl_en: "英文",
      ckShare: "把这个自测分享给亲友", ckShareTitle: "我能申请什么？华脉福利自测", ckShareText: "白卡、粮食券、公屋、老人福利……回答 6 个问题，看看你家可能申请哪些福利（免费、匿名）", shareSite: "分享本站", shareSiteText: "华脉：在美华人新闻、生活指南、本周优惠和免费分类信息",
      shareWx: "分享到微信", shareCheckWx: "把自测分享到微信", shareShort: "分享",
      newsTab: "新闻",
      login: "登录 / 注册", logout: "退出", loginH: "登录 / 注册华脉", loginWhy: "登录后可以发布更多信息，也能在任何设备上管理自己的信息。", loginNeed: "登录后可以不限次数发布，并随时管理自己的信息；也可以游客身份发布，每天一条。",
      lgGuest: "以游客身份发布", lgGuestNote: "不用注册，直接发布", eGuest: "发得太快了，请稍后再发。登录后可以随时管理自己的信息。", lgGoogle: "用 Google（Gmail）账号登录", lgWechat: "微信登录（即将开放）", lgOr: "或用电子邮箱", lgEmail: "电子邮箱", lgSend: "发送验证码", lgCode: "验证码（6 位数字）", lgTabIn: "登录", lgFgSent: "验证码已发送，请查收邮件（也看看垃圾邮件）。", lgTabUp: "注册新账号", lgPw: "密码", lgPwNew: "设置密码（至少 6 位）", lgName: "昵称", lgNamePh: "别人看到的名字，如：王先生", lgUpBtn: "注册，发验证码到邮箱", lgCodeBtn: "完成注册", lgResend: "没收到？重新发送", lgResent: "已重新发送，请查收邮件（也看看垃圾邮件）。", lgForgot: "忘记密码？", lgForgotHint: "输入注册时用的邮箱，我们会发一个验证码给你，用来设置新密码。", lgFgBtn: "设置新密码并登录", lgBackIn: "← 返回登录", lgCodeSent: "验证码已发到 {e}，请查收邮件（也看看垃圾邮件）。如果一直收不到，可能这个邮箱已经注册过，请直接登录或找回密码。", lgWrongPw: "邮箱或密码不对。忘记密码可以点下面“忘记密码？”。", lgNotConfirmed: "这个账号还没完成注册，验证码已重新发到你的邮箱。", lgShortPw: "密码至少 6 位。", lgNeedName: "请填一个昵称。", lgPwOk: "新密码已设置，已登录。", lgUpOk: "注册成功，已登录！", lgBack: "换个邮箱", lgVerify: "登录",
      lgSent: "验证码已发到 {e}，请查收邮件（也看看垃圾邮件箱）。邮件里的链接也可以直接点开登录。", lgAgree: "登录即表示同意本站", lgBadEmail: "请输入正确的电子邮箱。", lgBadCode: "验证码不对或已过期，请重新发送。", lgFail: "暂时无法登录，请稍后再试。", lgWait: "发送太频繁，请过一分钟再试。", lgOk: "登录成功", lgOut: "已退出", eLogin: "请先登录再发布。",
      gLoading: "指南载入中…", footLegal: "免责声明", footLegalP: "本站内容仅供参考，不构成法律或专业意见，与政府机构无关。", footLegalLink: "阅读完整免责声明 →",
      formAgree: "点击“发布”即表示你保证信息真实合法，并同意", ckDisc: "自测结果只是粗略估算，不代表你一定符合或不符合，也不是政府的决定。", discUpdated: "更新日期", postDisc: "本信息由用户发布，本站未核实其内容，也不参与交易。",
      tagline: "纽约华人 · 生活服务平台", searchPh: "搜索：白卡、绿卡、租房、法拉盛…", searchBtn: "搜索", postFree: "免费发布",
      directory: "分类目录", more: "更多", home: "首页", classifiedsTab: "分类信息",
      sec_top: "新闻速递", sec_local: "纽约本地", sec_immigration: "移民签证", sec_uschina: "中美关系", sec_china: "中国",
      sec_business: "财经", sec_health: "健康养生", sec_ent: "娱乐体育", sec_official: "政府公告", offNote: "美国联邦政府发布的内容属于公有领域，本站全文收录（英文原文，标题和摘要为机器翻译）。", offNoteZh: "美国联邦政府发布的内容属于公有领域，本站全文收录。中文为机器翻译，以英文原文为准。", showEn: "看英文原文", showZh: "看中文翻译", offLink: "查看官方原文", loadingFull: "全文载入中…",
      ctaH: "免费发布分类信息", ctaP: "招聘、租房、生意转让、二手买卖……无需注册，一分钟发布。", postNow: "立即发布",
      latest: "最新信息", fx: "货币兑换率", weather: "纽约天气", classifieds: "分类信息", classHint: "点击板块查看全部",
      back: "← 返回首页", postHere: "在本板块发布", filterPh: "在本板块中筛选",
      foot1: "新闻、天气、汇率和优惠每30分钟自动更新，汇集自各大中英文媒体。", footAds: "广告刊登", footAdsP: "首页及侧栏广告位招租，欢迎商家联系。",
      footSafe: "安全提示", foot2: "分类信息由用户自行发布，请自行核实；交易当面确认，切勿预付定金，谨防诈骗。",
      postH: "发布分类信息", postOff: "发布功能即将开放，敬请期待。", fBoard: "板块", fArea: "地区", areaPh: "如：法拉盛",
      fTitle: "标题", titlePh: "如：法拉盛餐馆请炒锅，包吃住", fBody: "详细内容", bodyPh: "薪资、要求、价格、时间等",
      fName: "联系人", namePh: "如：王先生", fPhone: "电话", fWx: "微信（选填）",
      formHint: "电话和微信至少填一项。信息公开显示，请勿填写证件号等隐私。", cancel: "取消", submit: "发布", posting: "发布中…",
      posted: "发布成功", eTitle: "标题至少2个字。", eBody: "请填写详细内容。", eContact: "请至少留下电话或微信。",
      eSave: "发布失败，请稍后再试。", eFlood: "发布太频繁，请10分钟后再试。", eBusy: "网站繁忙，请稍后再试。",
      loading: "载入中…", newsEmpty: "新闻正在更新，请稍后刷新。", noPosts: "还没有信息，", beFirst: "抢先发布",
      noLatest: "暂时没有新信息。", invH: "来发第一条吧", invP: "招聘、租房、转让、找服务……免费发布，邻居们都看得到。", invBtn: "免费发布", pgAll: "分类信息大全", eventsH: "线下活动", eventsNote: "纽约华人社区活动和全市免费活动，每天自动更新。办活动的社区组织和商家可以免费发布。", evComm: "华人社区活动", evFree: "纽约免费活动", evPost: "免费发布活动", evInvH: "还没有社区活动", evInvP: "教会、同乡会、社区中心、商家办活动，都可以在这里免费发布。",
      locAsk: "看你附近的招工、房屋和服务？", locTip: "看附近的信息？", ptAll: "全部分类", ptMore: "更多分类", ptLess: "收起", locBtn: "自动定位", locPick: "手动选择地区", locing: "正在定位…", locNo: "无法定位，请手动选择地区", locFar: "你不在纽约附近，先显示全纽约",
      ncH: "新移民必备", ncCheck: "福利自测", ncSub: "刚来纽约，先把这几件事弄清楚。都免费，大部分不问移民身份。", ncFine: "信息仅供参考，以政府官网为准。外部链接会打开官方网站。",
      ncItems: [["纽约市身份证 IDNYC", "免费，10 岁以上纽约市居民都能办，不论移民身份", "#g-idnyc"], ["免费移民法律咨询", "市政府热线 1-800-354-0365，免费保密，不论身份", "#g-legal-help"],
        ["没保险也能看病", "NYC Care 和白卡，按收入，很多人都能用", "#g-nyc-care"], ["孩子免费上学", "纽约市公立学校免费入学，不问移民身份", "https://www.schools.nyc.gov/enrollment"],
        ["免费学英文", "纽约三大公共图书馆都有免费英文班", "https://www.nypl.org/"], ["打工权益", "纽约市最低工资 2026 年每小时 $17，被欠薪可以向州劳工厅投诉", "https://dol.ny.gov/"],
        ["考驾照", "纽约州“绿灯法”：不论移民身份都可以申请驾照", "https://dmv.ny.gov/"], ["社安号 SSN", "有工作许可或绿卡后，向社安局申请", "https://www.ssa.gov/number-card"],
        ["被房东告：免费律师", "纽约市低收入租客可以有免费律师", "#g-tenant-help"], ["打 311 要中文", "任何市政问题打 311，可以要求中文翻译", "https://portal.311.nyc.gov/"],
        ["专骗华人的骗局", "假中国警察、假移民局、杀猪盘、假短信，一次看懂", "#t-scam"], ["免费报税和退税", "收入不高可以免费报税，还可能有退税", "#g-free-tax"]],
      cmH: "评论", cmPh: "说说你的看法…（请文明发言）", cmNamePh: "昵称（可不填）", cmSend: "发表评论", cmNone: "还没有评论，来说第一句吧。", cmOk: "评论已发表", cmFlood: "评论太频繁了，请稍后再试。", cmBanned: "评论含有不允许的内容。", cmFail: "发表失败，请稍后再试。", travelTab: "玩转美国", trAll: "全部攻略", trNear: "纽约周边", trUsa: "美国境内", cityCatTab: "同城分类", toolsTab: "实用工具", toolsAll: "全部工具", toolsSub: "贷款计算、入籍考试、驾照笔试、英语急救卡……免费使用，不用注册。", cityTab: "同城服务", datingTab: "同城交友", eventsTab: "线下活动", cityAll: "查看全部同城服务", cityAllYp: "全部商家", cityPost: "免费发布", checkTab: "福利自测", appTab: "App下载", cityIntro: "招聘、房屋、买卖、生活服务……纽约华人邻居都在这里，全部免费发布。", cityCtaH: "有工作要招、有房要租？", cityCtaP: "免费发布，邻居们都看得到。", cityNY: "纽约", rgH: "选择地区", rgCity: "城市", rgArea: "地区", rgAll: "全纽约", rgSet: "已切换到 {a}", pgAbout: "关于我们", pgContact: "联系我们", pgAds: "广告刊登", pgTerms: "用户协议", pgPrivacy: "隐私政策", cpName: "华脉", cpTag: "华脉一开，好事就来", pNews: "今日新闻 {n} 条", pDeals: "本周优惠 {n} 条", pPosts: "本周新信息 {n} 条", pUpd: "{t}更新 · 每30分钟自动刷新", noMatch: "没有找到相关信息。", searchFor: "搜索：", results: "条结果",
      contact: "联系方式", phone: "电话", wx: "微信", copy: "复制", copied: "已复制", del: "删除我的信息", delSure: "确认删除？",
      deleted: "已删除", delFail: "删除失败，请稍后再试。", safety: "请当面交易，切勿预付定金或转账给陌生人。",
      updated: "更新于", fxAsOf: "以 1 美元计", minAgo: "分钟前", hrAgo: "小时前", dayAgo: "天前", justNow: "刚刚",
      adLabel: "推荐商家", adEmptyH: "广告位招租", adEmptyP: "黄金位置，曝光给每一位访客", adContact: "联系：", adMore: "了解广告位 ›", adSms: "（未接请发短信）", houseLab: "华脉推荐", repLogin: "登录后才能举报，这样可以防止有人恶意举报。", imgLogin: "登录后可以上传图片", bnMe: "我的", meH: "我的华脉", meLogin: "登录后可以查看自己发过的帖子和回复。", meLoginBtn: "登录 / 注册", mePosts: "我发的帖子", meReplies: "我的回复", meNoPosts: "还没有发过帖子。", meNoReplies: "还没有回复过帖子。", mePostNow: "去发布", meOut: "退出登录", meShare: "分享华脉", meReplyTo: "回复了：", meGone: "（原帖已删除）",
      rpH: "回复", rpCount: "{n} 条回复", rpNone: "还没有人回复，第一个说点什么吧。", rpPh: "写下你的问题或想法……（请勿留身份证、银行卡等隐私）", rpSend: "回复", rpLogin: "登录后回复", rpOk: "已回复", rpFail: "回复失败，请稍后再试。", rpTooMany: "回复太频繁了，请稍等几分钟。", rpDel: "删除", rpOff: "回复功能即将开放。", rpDeleted: "已删除", fzLabel: "字号", fzNames: ["标准字号", "大字号", "特大字号"], ypTab: "商家黄页", ypH: "商家黄页", ypAdd: "免费登记商家", ypNote: "纽约华人常用的超市、餐馆、律师、医生、报税、装修等商家，一查就有电话和地址。", ypQph: "搜索商家名称、地址", ypAll: "全部", ypNone: "这个类别还没有商家，欢迎免费登记。", ypFeat: "推荐", ypMap: "地图", ypCall: "打电话", ypFormNote: "基础登记完全免费。想排在最前面、带“推荐”标记，可以联系我们做付费推荐。", yName: "商家名称", yCat: "类别", yAddr: "地址", yHours: "营业时间（选填）", yWeb: "网站（选填）", yDesc: "简介（选填）", yDescPh: "主营项目、特色、是否接受保险、会说的语言等", yErrName: "请填写商家名称。", yErrContact: "电话和微信至少填一项。", yErrArea: "请选择地区。", yOk: "登记成功，已显示在黄页里。", yFail: "登记失败，请稍后再试。", yOff: "黄页登记即将开放，也可以短信 {p} 让我们帮你登记。", ypPromo: "想让顾客更容易找到你？付费推荐排在本类最前面，带“推荐”标记：", ypCount: "{n} 家商家",
      ypCats: [["market", "超市食品"], ["food", "餐馆美食"], ["law", "律师移民"], ["tax", "会计报税"], ["med", "医生诊所"], ["tcm", "中医针灸"], ["dental", "牙医眼科"], ["beauty", "美容美甲"], ["reno", "装修维修"], ["move", "搬家物流"], ["car", "汽车服务"], ["realty", "地产贷款"], ["ins", "保险理财"], ["edu", "补习教育"], ["travel", "旅行社"], ["other", "其他"]], adsPrice: "广告位和价格", adsYp: "商家黄页推荐", adsYpP: "排在所在类别最前面，带“推荐”标记；基础登记免费", pinAfter: "之后置顶 {p} ›", adsColPos: "位置", adsColPrice: "价格", adsPin: "分类信息置顶", adsPinP: "你的信息排在所选板块最上面，带红色“置顶”标记", adsAsk: "面议", adsPriceNote: "价格为开站价，可组合投放、长期投放另有优惠。电话或短信联系即可安排。", adsOfferEn: "", bAllAreas: "全部地区", bToday: "只看今天", pstBtn: "生成分享图", pstMaking: "正在生成图片…", pstH: "分享图已生成", pstTip: "发到微信群和朋友圈，扫码就能看到你的信息。手机上可以长按图片保存。", pstSave: "保存图片", pstShare: "发送图片", pstFail: "图片生成失败，请稍后再试。", pstSaved: "已保存到相册", stkH: "美股行情", stkAll: "看全部行情 ›", stkNote: "指数、中概股、热门科技股和汇率黄金，打开页面自动更新。行情由 TradingView 提供，部分报价可能有延迟。", stkOverview: "走势图", stkQuotes: "实时报价", stkHot: "今日涨跌榜", stkChart: "查任何股票", stkChartNote: "点图表左上角的代码，可以搜索任何股票", stkDisc: "本页行情仅供参考，不构成任何投资建议。华脉不推荐买卖任何股票，投资有风险，请自行判断或咨询持牌理财顾问。", stkTab: "美股行情", stkIdx: "指数", stkCn: "中概股", stkTech: "科技股", stkFx: "汇率黄金", areaPick: "请选择地区", areaOther: "其他地区（自己填写）", areaOtherPh: "请填写地区", eArea: "请选择地区。", fImg: "图片（选填，最多4张）", fImgAdd: "加图片", imgUp: "正在上传图片…", imgFail: "信息已发布，但图片没传上去，请稍后再试。", recPosts: "最新分类信息", recSame: "{b}最新信息", recNews: "推荐阅读", datingRules: "同城交友须知：仅限18岁以上；禁止色情、有偿陪伴和任何商业服务，违者删除。警惕“杀猪盘”：网上认识的人劝你投资、炒币、转账，一律是骗局。第一次见面请选公共场所，并告诉亲友。", eBanned: "本站禁止色情和有偿陪伴类信息，请修改后再发布。", daifa: "不会打字？把广告拍照或文字发短信到 {p}，我们免费帮你发。", earlyPin: "开站优惠：前100位发帖免费置顶7天，发完短信告诉我们即可。", flyerLink: "打印招贴海报",
      flyerH: "免费发布招聘 · 租房 · 二手 · 商家优惠", flyerSub: "纽约华人自己的分类信息网站", flyerPts: ["不用注册，一分钟发好", "可转发到微信，亲友都能看到", "每天还有华人新闻、福利指南、本周免费和打折"], flyerScan: "手机扫码立即发布", flyerDai: "不会打字？拍照发短信到 {p}，我们免费帮你发", bnHome: "首页", bnCity: "同城服务", bnSale: "本周特价", bnTools: "实用工具", fabHome: "回首页", bnGuide: "福利指南", bnPost: "发布", bnDeals: "优惠", bnShare: "分享", appInstall: "安装App", appBarH: "把华脉装到手机桌面", appBarP: "像App一样一点就开，新闻和福利信息随时看。", appBarBtn: "安装", appLater: "以后再说",
      appIosH: "安装到 iPhone 桌面", appIosSteps: ["用 Safari 浏览器打开本站（微信里请先点右上角 ··· 选“在浏览器打开”）", "点屏幕下方的“分享”按钮（方框加向上箭头）", "往下滑，点“添加到主屏幕”", "点右上角“添加”，桌面上就有华脉的图标了"],
      appWxH: "请先在浏览器打开", appWxSteps: ["点右上角 ··· ", "选择“在浏览器打开”（安卓）或“在 Safari 中打开”（iPhone）", "打开后再点“安装App”"],
      appAndH: "安装到手机桌面", appAndSteps: ["点浏览器右上角的菜单（⋮）", "选择“安装应用”或“添加到主屏幕”", "点“安装”，桌面上就有华脉的图标了"], appDone: "知道了", apkBtn: "下载安卓App（APK）", apkNote: "下载后点开安装。第一次安装手机会问“允许安装未知来源应用”，选允许即可。", apkOr: "或者不用下载，直接装到桌面：", apkFoot: "安卓App下载", offTag: "官方", offFrom: "来源", offApply: "去官网免费申请", offJobHow: "打开官网后，在搜索框输入职位编号 {id} 即可找到这个职位并在线申请（免费）。", offUntil: "截止", offPay: "工资", offLoc: "地点", offOrg: "机构", offEnShow: "看英文原文", offNote: "官方信息每天自动更新，来自纽约市政府公开数据。申请永远免费，任何人向你收费都要小心。", pinned: "置顶", pinAsk: "想让你的信息排在本板块最上面？付费置顶请致电", moreBoards: "全部板块",
      house: [["#check", "我能申请什么？", "白卡、粮食券、公屋……回答几个问题马上知道"], ["#deals", "本周免费和打折", "每天自动更新，全部翻译成中文"], ["#b-deals", "商家免费发布优惠", "超市、餐馆、店铺每周特价，一分钟发好"], ["#guide", "纽约华人生活指南", "25 项福利，白话讲清楚怎么申请"], ["#post", "免费发布分类信息", "招聘、租房、二手买卖，一分钟发布"], ["#yp", "商家黄页", "超市、律师、医生、报税……电话地址一查就有"]],
      adsTitle: "在华脉投放广告", adsIntro: "华脉每天更新纽约华人关心的新闻、福利指南和本周优惠，读者都是在美华人家庭。以下广告位可以单独或组合投放，价格透明，新开张商家还有优惠。",
      adsPos: "广告位一览", adsHow: "怎么投放", adsHowP: "把店名、一句话介绍、电话/微信、想放的位置和时间发给我们，当天就能上线。到期自动下架，不用操心。", adsNoContact: "联系方式即将公布。也可以先在“商家优惠”免费发布优惠信息。",
      adsList: [["横幅广告", "首页最上方通栏，访客打开第一眼看到"], ["首页推荐（3个）", "首页顶部三张推荐卡片"], ["新闻中间（4个）", "首页新闻栏目之间，读新闻时自然看到"], ["侧栏（3个）", "首页右侧，电脑版全程可见"], ["分类板块页（可指定板块）", "例如只出现在“房屋出租”或“招聘”板块顶部"], ["信息流", "分类信息列表中每隔几条出现一次"], ["指南和文章页", "福利指南上下方、新闻文章正文下方和侧栏，读者停留时间最长"], ["新闻和优惠列表", "新闻栏目页、本周优惠页每隔6条出现一次"], ["分类信息详情", "每条分类信息打开后的底部"], ["福利自测结果页", "读者查看自己能申请哪些福利时看到"], ["首页底部（4个）", "首页分类信息下方一排"]],
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
      readHere: "Read full story", rdNew: "Blank? Open in a new window", zhDetail: "Read in Chinese", enOrig: "Open the store page", zhDetailNote: "The Chinese version is made by Google Translate; prices and terms on the store's page apply.", mtNote: "Machine translation, for reference only.", irNote: "Full story below is provided by {src}", irFull: "Full screen", openOrig: "Open original site", rdBack: "← Back to HuaMai", rdNote: "Content below is provided by the original site", readAt: "Read the full story at {src} →", artNoSum: "This publisher doesn't allow its stories to be shown inside other sites; use the button below to read it.", artCopy: "Copyright belongs to {src}. HuaMai shows the headline and summary and links to the original.", moreNews: "More {s}", artGone: "This story has rotated out. Here are the latest.", newsBack: "← Back to {s}",
      dealsTab: "Deals", dealsH: "Deals and freebies this week", dealsNote: "Online deals, freebies and free NYC events gathered daily; local businesses can post deals for free. Deals can end any time; check the store's page.", dl_local: "Local business deals", dl_biz: "Local business deals", sGuides: "Benefits guides", sNews: "News", sPosts: "Listings", dl_zh: "Community freebies & deals", dl_free: "Freebies", dl_online: "Online deals", dl_events: "Free NYC events", dl_postCta: "Businesses: post a deal for free →", dl_none: "Nothing right now; check back in a few hours.", dl_en: "EN",
      ckShare: "Share this check with family and friends", ckShareTitle: "What can I apply for? HuaMai benefits check", ckShareText: "Medicaid, SNAP, public housing, senior help: answer 6 questions to see what your family may qualify for (free, anonymous)", shareSite: "Share HuaMai", shareSiteText: "HuaMai: news, life guides, weekly deals and free listings for Chinese Americans",
      shareWx: "Share", shareCheckWx: "Share this check", shareShort: "Share",
      newsTab: "News",
      login: "Sign in", logout: "Sign out", loginH: "Sign in to HuaMai", loginWhy: "Sign in to post listings and manage them from any device. Your first sign-in creates your account.", loginNeed: "Sign in to post without limits and manage your listings, or post as a guest (one a day).",
      lgGuest: "Post as a guest", lgGuestNote: "No sign-up needed", eGuest: "You're posting too fast; please try again later. Sign in to manage your listings.", lgGoogle: "Continue with Google (Gmail)", lgWechat: "WeChat sign-in (coming soon)", lgOr: "or use email", lgEmail: "Email", lgSend: "Send code", lgCode: "Code (6 digits)", lgTabIn: "Sign in", lgFgSent: "Code sent. Check your inbox and spam folder.", lgTabUp: "Create account", lgPw: "Password", lgPwNew: "Choose a password (6+ characters)", lgName: "Nickname", lgNamePh: "Shown to others, e.g. Mr. Wang", lgUpBtn: "Sign up and email me a code", lgCodeBtn: "Finish sign-up", lgResend: "Didn't get it? Send again", lgResent: "Sent again. Check your inbox and spam folder.", lgForgot: "Forgot password?", lgForgotHint: "Enter the email you signed up with and we'll send a code to set a new password.", lgFgBtn: "Set new password and sign in", lgBackIn: "← Back to sign in", lgCodeSent: "We sent a code to {e}. Check your inbox and spam folder. If it never arrives, this email may already have an account: sign in or reset your password.", lgWrongPw: "Wrong email or password. Use Forgot password if needed.", lgNotConfirmed: "This account isn't finished yet. We sent a new code to your email.", lgShortPw: "Password must be at least 6 characters.", lgNeedName: "Please enter a nickname.", lgPwOk: "New password set. You're signed in.", lgUpOk: "Account created. You're signed in!", lgBack: "Use another email", lgVerify: "Sign in",
      lgSent: "We sent a code to {e}. Check your inbox (and spam). You can also tap the link in that email.", lgAgree: "By signing in you agree to our", lgBadEmail: "Enter a valid email address.", lgBadCode: "That code is wrong or expired. Send a new one.", lgFail: "Couldn't sign in right now. Please try again.", lgWait: "Too many requests. Wait a minute and try again.", lgOk: "Signed in", lgOut: "Signed out", eLogin: "Please sign in to post.",
      gLoading: "Loading guides…", footLegal: "Disclaimer", footLegalP: "Content is for general information, not legal or professional advice. Not affiliated with any government agency.", footLegalLink: "Read the full disclaimer →",
      formAgree: "By posting you confirm your listing is true and lawful, and you agree to the", ckDisc: "Results are a rough estimate, not a guarantee and not a government decision.", discUpdated: "Updated", postDisc: "Posted by a user. We haven't verified it and aren't part of any transaction.",
      tagline: "News & community listings for Chinese Americans", searchPh: "Search: Medicaid, rentals, Flushing…", searchBtn: "Search", postFree: "Post Free",
      directory: "Directory", more: "More", home: "Home", classifiedsTab: "Classifieds",
      sec_top: "Top Stories", sec_local: "New York", sec_immigration: "Immigration", sec_uschina: "US–China", sec_china: "China",
      sec_business: "Business", sec_health: "Health", sec_ent: "Entertainment & Sports", sec_official: "Official notices", offNote: "U.S. federal government works are in the public domain; shown here in full.", offNoteZh: "U.S. federal government works are in the public domain; shown here in full.", showEn: "Show English original", showZh: "Show Chinese translation", offLink: "View official source", loadingFull: "Loading full text…",
      ctaH: "Post a free listing", ctaP: "Jobs, rentals, businesses for sale, used items. No sign-up, done in a minute.", postNow: "Post now",
      latest: "Latest Listings", fx: "Exchange Rates", weather: "NYC Weather", classifieds: "Classifieds", classHint: "Open a board to see everything",
      back: "← Back to home", postHere: "Post in this board", filterPh: "Filter this board",
      foot1: "News, weather, exchange rates and deals update every 30 minutes from Chinese- and English-language outlets.",
      footAds: "Advertise", footAdsP: "Homepage and sidebar ad spaces are available.", footSafe: "Stay safe",
      foot2: "Listings are posted by users. Verify details, meet in person and never send deposits to strangers.",
      postH: "Post a Listing", postOff: "Posting opens soon.", fBoard: "Board", fArea: "Area", areaPh: "e.g. Flushing",
      fTitle: "Title", titlePh: "e.g. Wok chef wanted in Flushing, room & board", fBody: "Details", bodyPh: "Pay, requirements, price, schedule…",
      fName: "Contact name", namePh: "e.g. Mr. Wang", fPhone: "Phone", fWx: "WeChat (optional)",
      formHint: "Give a phone number or WeChat ID. Listings are public; don't include ID numbers or other private data.", cancel: "Cancel",
      submit: "Post", posting: "Posting…", posted: "Posted", eTitle: "Title needs at least 2 characters.", eBody: "Add the details.",
      eContact: "Add a phone number or WeChat ID.", eSave: "Couldn't post. Please try again.", eFlood: "Too many posts. Try again in 10 minutes.",
      eBusy: "The site is busy. Please try again shortly.", loading: "Loading…", newsEmpty: "News is updating. Refresh in a moment.",
      noPosts: "Nothing here yet. ", beFirst: "Post the first one", noLatest: "No new listings yet.", invH: "Be the first to post", invP: "Jobs, rentals, items for sale, services: free to post, seen by your neighbors.", invBtn: "Post for free", pgAll: "All classifieds", eventsH: "Events", eventsNote: "Chinese community events and free NYC events, updated daily. Organizations and businesses can post events free.", evComm: "Community events", evFree: "Free NYC events", evPost: "Post an event", evInvH: "No community events yet", evInvP: "Churches, associations, community centers and businesses can post events here for free.",
      locAsk: "See jobs, housing and services near you?", locTip: "See what's near you?", ptAll: "All", ptMore: "More categories", ptLess: "Show less", locBtn: "Locate me", locPick: "Choose area", locing: "Finding your location…", locNo: "Couldn't get your location; please choose an area", locFar: "You're not near New York; showing all of New York",
      ncH: "New to New York", ncCheck: "Benefits check", ncSub: "Just arrived? Start with these. All free, and most don't ask about immigration status.", ncFine: "For general reference; official websites govern. Outside links open official sites.",
      ncItems: [["IDNYC city ID", "Free for NYC residents 10+, regardless of immigration status", "#g-idnyc"], ["Free immigration legal help", "City hotline 1-800-354-0365, free and confidential", "#g-legal-help"],
        ["Health care without insurance", "NYC Care and Medicaid, based on income", "#g-nyc-care"], ["Free public school", "NYC public schools enroll every child; status isn't asked", "https://www.schools.nyc.gov/enrollment"],
        ["Free English classes", "All three NYC public library systems offer free English classes", "https://www.nypl.org/"], ["Worker rights", "NYC minimum wage is $17/hour in 2026; report unpaid wages to the state Labor Department", "https://dol.ny.gov/"],
        ["Driver's license", "New York's Green Light law: apply regardless of immigration status", "https://dmv.ny.gov/"], ["Social Security number", "Apply once you have work authorization or a green card", "https://www.ssa.gov/number-card"],
        ["Free lawyer in housing court", "Low-income NYC tenants can get a free lawyer", "#g-tenant-help"], ["Call 311 in Chinese", "Call 311 for any city question and ask for Chinese", "https://portal.311.nyc.gov/"],
        ["Avoid scams", "Immigration, Social Security and police never ask for wire transfers or gift cards by phone", "#g-legal-help"], ["Free tax filing", "Lower-income filers can file free and may get refunds", "#g-free-tax"]],
      cmH: "Comments", cmPh: "Share your thoughts… (please be civil)", cmNamePh: "Nickname (optional)", cmSend: "Post comment", cmNone: "No comments yet. Be the first.", cmOk: "Comment posted", cmFlood: "Too many comments; please wait a bit.", cmBanned: "Your comment contains content that isn't allowed.", cmFail: "Couldn't post; please try again.", travelTab: "Travel", trAll: "All guides", trNear: "Near NYC", trUsa: "Across the US", cityCatTab: "Categories", toolsTab: "Tools", toolsAll: "All tools", toolsSub: "Loan calculators, citizenship and driving test practice, English phrase cards. Free, no sign-up.", cityTab: "Local services", datingTab: "Meet locals", eventsTab: "Events", cityAll: "All local services", cityAllYp: "All businesses", cityPost: "Post free", checkTab: "Benefits check", appTab: "Get the app", cityIntro: "Jobs, housing, buy & sell, services: the New York Chinese community, all free to post.", cityCtaH: "Hiring or renting?", cityCtaP: "Post free and your neighbors will see it.", cityNY: "New York", rgH: "Choose your area", rgCity: "City", rgArea: "Area", rgAll: "All of New York", rgSet: "Switched to {a}", pgAbout: "About", pgContact: "Contact", pgAds: "Advertise", pgTerms: "Terms", pgPrivacy: "Privacy", cpName: "HuaMai", cpTag: "Open HuaMai, good things come", pNews: "{n} stories today", pDeals: "{n} deals this week", pPosts: "{n} new listings this week", pUpd: "Updated {t} · refreshes every 30 min", noMatch: "No matching listings.",
      searchFor: "Search: ", results: "results", contact: "Contact", phone: "Phone", wx: "WeChat", copy: "Copy", copied: "Copied",
      del: "Delete my listing", delSure: "Confirm delete?", deleted: "Deleted", delFail: "Couldn't delete. Please try again.",
      safety: "Meet in person. Never prepay or wire money to strangers.", updated: "Updated", fxAsOf: "per 1 US dollar",
      minAgo: "m ago", hrAgo: "h ago", dayAgo: "d ago", justNow: "just now", adLabel: "Featured", adEmptyH: "Ad space available",
      adEmptyP: "Prime placement seen by every visitor", adContact: "Contact: ", sponsored: "Ad", adMore: "About ad spaces ›", adSms: " (text if no answer)", houseLab: "From 华脉", repLogin: "Please sign in to report, so reports can't be abused.", imgLogin: "Sign in to add photos", bnMe: "Me", meH: "My HuaMai", meLogin: "Sign in to see your listings and replies.", meLoginBtn: "Sign in / Sign up", mePosts: "My listings", meReplies: "My replies", meNoPosts: "No listings yet.", meNoReplies: "No replies yet.", mePostNow: "Post one", meOut: "Sign out", meShare: "Share HuaMai", meReplyTo: "Replied: ", meGone: "(listing removed)",
      rpH: "Replies", rpCount: "{n} replies", rpNone: "No replies yet. Be the first.", rpPh: "Ask a question or share a thought… (never post ID or bank numbers)", rpSend: "Reply", rpLogin: "Sign in to reply", rpOk: "Replied", rpFail: "Couldn't reply. Please try again.", rpTooMany: "Too many replies. Please wait a few minutes.", rpDel: "Delete", rpOff: "Replies are coming soon.", rpDeleted: "Deleted", fzLabel: "Text size", fzNames: ["Normal text", "Large text", "Extra large text"], ypTab: "Directory", ypH: "Business directory", ypAdd: "List your business free", ypNote: "Supermarkets, restaurants, lawyers, doctors, tax preparers, contractors and more, with phone numbers and addresses.", ypQph: "Search name or address", ypAll: "All", ypNone: "No businesses in this category yet. List yours for free.", ypFeat: "Featured", ypMap: "Map", ypCall: "Call", ypFormNote: "A basic listing is free. To appear first with a Featured tag, contact us about a paid listing.", yName: "Business name", yCat: "Category", yAddr: "Address", yHours: "Hours (optional)", yWeb: "Website (optional)", yDesc: "About (optional)", yDescPh: "What you offer, insurance accepted, languages spoken…", yErrName: "Please enter the business name.", yErrContact: "Enter a phone number or WeChat.", yErrArea: "Please choose an area.", yOk: "Listed! It now shows in the directory.", yFail: "Couldn't save. Please try again.", yOff: "Listing opens soon. Text {p} and we'll add you.", ypPromo: "Want customers to find you first? Featured listings appear at the top of their category:", ypCount: "{n} businesses",
      ypCats: [["market", "Groceries"], ["food", "Restaurants"], ["law", "Lawyers"], ["tax", "Tax & accounting"], ["med", "Doctors"], ["tcm", "Chinese medicine"], ["dental", "Dentists & eye care"], ["beauty", "Beauty & nails"], ["reno", "Renovation & repair"], ["move", "Moving & shipping"], ["car", "Auto services"], ["realty", "Real estate & loans"], ["ins", "Insurance & finance"], ["edu", "Tutoring"], ["travel", "Travel agencies"], ["other", "Other"]], adsPrice: "Ad spaces & prices", adsYp: "Featured directory listing", adsYpP: "Top of its category with a Featured tag; basic listings are free", pinAfter: "After that: {p} ›", adsColPos: "Placement", adsColPrice: "Price", adsPin: "Pinned listing", adsPinP: "Your listing stays at the top of its board with a red Pinned tag", adsAsk: "Ask", adsPriceNote: "Launch prices. Bundles and long-term bookings get discounts. Call or text to book.", adsOfferEn: "Launch offer: half price on all ads for the first 3 months; the first 100 posters get 7 days pinned free.", bAllAreas: "All areas", bToday: "Today only", pstBtn: "Make share image", pstMaking: "Making the image…", pstH: "Your share image", pstTip: "Send it to WeChat groups and Moments; anyone can scan to see your listing. On a phone, press and hold the image to save it.", pstSave: "Save image", pstShare: "Send image", pstFail: "Couldn't make the image. Please try again.", pstSaved: "Saved to Photos", stkH: "US stocks", stkAll: "All quotes ›", stkNote: "Indexes, Chinese stocks, big tech, currencies and gold, updating live. Data by TradingView; some quotes may be delayed.", stkOverview: "Chart", stkQuotes: "Quotes", stkHot: "Top movers today", stkChart: "Look up any stock", stkChartNote: "Tap the symbol at the top left of the chart to search", stkDisc: "For information only, not investment advice. 华脉 does not recommend buying or selling any stock. Investing carries risk; consider a licensed adviser.", stkTab: "US stocks", stkIdx: "Indexes", stkCn: "China stocks", stkTech: "Tech", stkFx: "FX & gold", areaPick: "Choose an area", areaOther: "Other (type it in)", areaOtherPh: "Type the area", eArea: "Please choose an area.", fImg: "Photos (optional, up to 4)", fImgAdd: "Add photos", imgUp: "Uploading photos…", imgFail: "Posted, but the photos didn't upload. Please try again later.", recPosts: "Latest listings", recSame: "Latest in {b}", recNews: "Recommended", datingRules: "Meet Locals rules: 18+ only. No sexual content, paid companionship or commercial services; such posts are removed. Beware romance scams: anyone you met online who urges you to invest, buy crypto or send money is a scammer. Meet in a public place first and tell a friend.", eBanned: "Sexual or paid-companionship content isn't allowed. Please edit your post.", daifa: "Can't type it? Text a photo or the details to {p} and we'll post it for you free.", earlyPin: "Launch offer: the first 100 posters get 7 days pinned free. Just text us after posting.", flyerLink: "Print a flyer",
      flyerH: "Post jobs, rentals, buy & sell, deals: free", flyerSub: "Classifieds for Chinese New Yorkers", flyerPts: ["No sign-up, done in a minute", "Share to WeChat", "Daily news, benefits guides and deals too"], flyerScan: "Scan to post now", flyerDai: "Text a photo to {p} and we'll post it for you", bnHome: "Home", bnCity: "Services", bnSale: "Flyers", bnTools: "Tools", fabHome: "Home", bnGuide: "Guides", bnPost: "Post", bnDeals: "Deals", bnShare: "Share", appInstall: "Get the app", appBarH: "Add 华脉 to your home screen", appBarP: "Opens like an app, one tap away.", appBarBtn: "Install", appLater: "Not now",
      appIosH: "Add to iPhone home screen", appIosSteps: ["Open this site in Safari (in WeChat, tap ··· and choose Open in Safari)", "Tap the Share button at the bottom (square with an arrow)", "Scroll down and tap \"Add to Home Screen\"", "Tap \"Add\" at the top right"],
      appWxH: "Open in your browser first", appWxSteps: ["Tap ··· at the top right", "Choose Open in Browser / Open in Safari", "Then tap \"Get the app\""],
      appAndH: "Add to home screen", appAndSteps: ["Tap the browser menu (⋮)", "Choose \"Install app\" or \"Add to Home screen\"", "Tap Install"], appDone: "Got it", apkBtn: "Download Android app (APK)", apkNote: "Open the file to install. Allow installing from unknown sources if asked.", apkOr: "Or add it to your home screen without downloading:", apkFoot: "Android app", offTag: "Official", offFrom: "Source", offApply: "Apply free on the official site", offJobHow: "On the site, search for job ID {id} to find this posting and apply online (free).", offUntil: "Deadline", offPay: "Pay", offLoc: "Location", offOrg: "Agency", offEnShow: "Show original", offNote: "Official listings update daily from NYC Open Data. Applying is always free.", pinned: "Pinned", pinAsk: "Want your listing at the top of this board? For paid pinning call", moreBoards: "All boards",
      house: [["#check", "What can I apply for?", "Medicaid, SNAP, housing: answer a few questions"], ["#deals", "Free & on sale this week", "Updated daily"], ["#b-deals", "Businesses: post deals free", "Weekly specials in a minute"], ["#guide", "NY benefits guides", "25 programs in plain language"], ["#post", "Post a free listing", "Jobs, rentals, buy & sell"], ["#yp", "Business directory", "Phone numbers and addresses of local businesses"]],
      adsTitle: "Advertise on 华脉", adsIntro: "华脉 publishes daily news, benefits guides and weekly deals for Chinese families in New York. These spaces can be booked alone or together, with clear prices and discounts for newly opened businesses.",
      adsPos: "Ad spaces", adsHow: "How to book", adsHowP: "Send us your business name, a one-line description, phone/WeChat, and the space and dates you want. It can go live the same day and comes down automatically when it ends.", adsNoContact: "Contact details coming soon. Meanwhile, you can post deals for free in Local Deals.",
      adsList: [["Banner", "Full-width at the very top of the home page"], ["Home featured (3)", "Three featured cards at the top of the home page"], ["Between news (4)", "Between the home-page news sections"], ["Sidebar (3)", "Right side of the home page, always visible on desktop"], ["Board pages (choose boards)", "E.g. only at the top of Rentals or Jobs"], ["In-feed", "Every few listings inside classified lists"], ["Guide & article pages", "Above and below guides, below articles and in the sidebar"], ["News & deals lists", "Every 6 items on news and deals pages"], ["Listing details", "At the bottom of every opened listing"], ["Benefits check results", "Where readers see what they qualify for"], ["Home page bottom (4)", "A row under the classifieds"]],
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
  let news = null, market = null, ads = { slots: [] }, posts = [], postsLoaded = false, official = { jobs: [], housing: [] };
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
    const [n, m, a, gd, w, dl, ol] = await Promise.allSettled([getJSON("data/news.json"), getJSON("data/market.json"), getJSON("data/ads.json"), getJSON("data/guides.json"), getJSON("data/watch.json"), getJSON("data/deals.json"), Promise.resolve(null)]); // official listings turned off
    if (ol && ol.status === "fulfilled" && ol.value) official = ol.value;
    if (dl.status === "fulfilled" && dl.value && dl.value.sections) deals = dl.value;
    if (gd.status === "fulfilled" && gd.value && Array.isArray(gd.value.guides)) guides = gd.value;
    if (w.status === "fulfilled" && w.value) watch = w.value.pages || {};
    if (n.status === "fulfilled") news = n.value;
    if (m.status === "fulfilled") market = m.value;
    if (a.status === "fulfilled" && a.value && Array.isArray(a.value.slots)) ads = a.value;
    if (n.status !== "fulfilled" && !loadData.retried) { loadData.retried = true; setTimeout(() => loadData().catch(() => {}), 3000); } // phone network hiccup: try once more
    news = news || { sections: {} };
    // Each part renders on its own, so one problem can't blank out the rest of the page.
    [renderAppHome, renderNews, renderPulse, renderPortal, renderNewcomer, renderLocateBar, renderEvents, renderMarket, renderAds, renderNewsView, renderArticle, renderGuides, renderDeals, renderStocksHome].forEach(fn => { try { fn(); } catch (e) { console.error(fn.name, e); } });
    if (postsLoaded) { try { renderPostsAll(); } catch (e) { console.error(e); } }
  }

  function sbHeaders(extra) {
    const h = { apikey: SB_KEY, "Content-Type": "application/json" };
    if (!/^sb_publishable_/.test(SB_KEY)) h.Authorization = "Bearer " + SB_KEY;
    return Object.assign(h, extra || {});
  }
  async function loadPosts() {
    if (!POSTS_ON) { postsLoaded = true; renderPostsAll(); return; }
    try {
      const q = cols => fetch(SB_URL + "/rest/v1/posts?select=" + cols + "&order=created_at.desc&limit=600", { headers: sbHeaders() });
      let r = await q("id,created_at,board,title,body,area,contact,phone,wechat,pinned_until,images");
      if (!r.ok) r = await q("id,created_at,board,title,body,area,contact,phone,wechat,pinned_until"); // before 06-images.sql
      if (!r.ok) r = await q("id,created_at,board,title,body,area,contact,phone,wechat"); // before 04-pin.sql is run
      if (!r.ok) throw new Error(r.status);
      const now = Date.now();
      posts = (await r.json()).map(p => Object.assign(p, { ts: Date.parse(p.created_at), pin: p.pinned_until && Date.parse(p.pinned_until) > now }));
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
    $("#lzh").setAttribute("aria-pressed", String(lang === "zh" && script !== "t"));
    $("#lzt").setAttribute("aria-pressed", String(lang === "zh" && script === "t"));
    $("#len").setAttribute("aria-pressed", String(lang === "en"));
    document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => (el.placeholder = t(el.dataset.i18nPh)));
    $("#today").textContent = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "America/New_York" });
    $("#fBoard").innerHTML = GROUPS.map(g => `<optgroup label="${esc(lang === "zh" ? g.zh : g.en)}">${g.boards.map(b => `<option value="${b[0]}">${esc(lang === "zh" ? b[2] : b[3])}</option>`).join("")}</optgroup>`).join("");
    renderTabs(); renderDir(); try { renderAppHome(); renderRegionBtn(); renderPortal(); renderNewcomer(); renderLocateBar(); if (route.view === "events") renderEvents(); if (route.view === "tools") renderTools(); } catch (e) {} try { showAppUI(); } catch (e) {} if (route.view === "disc") renderDisc(); if (route.view === "ads") renderAdsPage(); if (route.view === "flyer") renderFlyer(); if (route.view === "stocks") renderStocks(); if (route.view === "yp") renderYP(); stkHomeKey = ""; renderStocksHome(); if (route.view === "article") renderArticle(); try { renderDeals(); } catch (e) {} renderGuides(); if (route.view === "check" && $("#ckOut").innerHTML) showCheck(); renderNews(); renderMarket(); renderAds(); renderPostsAll(); renderNewsView(); renderAdContact();
  }
  function setLang(l) { lang = l; try { localStorage.setItem("hl-lang", l); } catch (e) {} applyLang(); applyScript(); }

  /* ---------- 简体 / 繁體: the page is written in simplified; 繁 converts what's on screen, using OpenCC ---------- */
  let script = "s"; try { script = localStorage.getItem("hl-script") || "s"; } catch (e) {}
  let toTrad = null, convObs = null, convLib = null;
  function loadConv() {
    if (toTrad) return Promise.resolve();
    if (!convLib) convLib = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "assets/opencc-cn2t.js"; sc.onload = () => { try { toTrad = window.OpenCC.Converter({ from: "cn", to: "tw" }); res(); } catch (e) { rej(e); } }; sc.onerror = rej; document.head.appendChild(sc); });
    return convLib;
  }
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, NOSCRIPT: 1, IFRAME: 1 };
  function convNode(root) {
    if (!toTrad) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && !SKIP[n.parentElement.tagName] && /[\u4e00-\u9fff]/.test(n.nodeValue)) ? 1 : 2 });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) { const v = toTrad(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    (root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label],[title]") : []).forEach(el => ["placeholder", "aria-label", "title"].forEach(a => { const v = el.getAttribute(a); if (v && /[\u4e00-\u9fff]/.test(v)) { const c = toTrad(v); if (c !== v) el.setAttribute(a, c); } }));
  }
  async function applyScript() {
    const trad = script === "t" && lang === "zh";
    $("#lzh").setAttribute("aria-pressed", String(lang === "zh" && !trad));
    $("#lzt").setAttribute("aria-pressed", String(trad));
    if (!trad) { if (convObs) { convObs.disconnect(); convObs = null; location.reload(); } return; }
    try { await loadConv(); } catch (e) { toast("繁體轉換載入失敗"); return; }
    document.documentElement.lang = "zh-Hant";
    convNode(document.body); document.title = toTrad(document.title);
    if (!convObs) {
      let queue = new Set(), raf = 0;
      convObs = new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") queue.add(m.target.parentElement || document.body); else m.addedNodes.forEach(n => queue.add(n.nodeType === 3 ? n.parentElement || document.body : n)); } if (!raf) raf = requestAnimationFrame(() => { raf = 0; const q = [...queue]; queue = new Set(); q.forEach(n => n && n.isConnected && convNode(n)); }); });
      convObs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }
  function setScript(sv) { const was = script; script = sv; try { localStorage.setItem("hl-script", sv); } catch (e) {} if (lang !== "zh") { setLang("zh"); return; } if (was === "t" && sv === "s") { location.reload(); return; } applyScript(); }

  const IS_APP = /HuaLinApp/.test(navigator.userAgent) || window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  // The visitor's chosen area within New York ("" = all of New York). Filters boards and the local-services page.
  let curArea = ""; try { curArea = localStorage.getItem("hl-area") || ""; } catch (e) {}
  const areaPosts = () => curArea ? posts.filter(p => p.area === curArea) : posts;
  // Top menu: each item shows all of its sub-items when you hover (or tap on a phone).
  function menuItems() {
    const count = id => areaPosts().filter(p => p.board === id).length;
    const items = [
      { h: "", label: t("home") },
      { h: "check", label: t("checkTab"), menu: () => `<a class="mm-cta" href="#check">${esc(t("gCheckH"))} →</a>` + (guides ? `<div class="mm-cols">${guides.groups.map(gr => {
          const gs = guides.guides.filter(g => g.group === gr.id); if (!gs.length) return "";
          return `<div><b>${esc(HLG.L(gr, lang))}</b>${gs.map(g => `<a href="#g-${esc(g.id)}">${esc(HLG.L(g.title, lang))}</a>`).join("")}</div>`; }).join("")}</div>` : "") },
      { h: "deals", label: t("dealsTab"), menu: () => `<div class="mm-cols"><div><a href="#chaoshi"><b>🛒 华人超市特价单</b></a>${["local", "zh", "free", "online", "events"].map(k => `<a href="${k === "local" ? "#b-deals" : "#deals"}">${esc(t("dl_" + k))}</a>`).join("")}<button type="button" class="mm-cta linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></div></div>` },
      { h: "n-top", label: t("newsTab"), menu: () => `<div class="mm-cols"><div>${SECTIONS.slice(0, 5).map(x => `<a href="#n-${x}">${esc(t("sec_" + x))}</a>`).join("")}</div><div>${SECTIONS.slice(5).map(x => `<a href="#n-${x}">${esc(t("sec_" + x))}</a>`).join("")}<a href="#stocks">${esc(t("stkTab"))}</a></div></div>` }
    ];
    items.push({ h: "stocks", label: t("stkTab") });
    items.push({ h: "city", label: t("cityCatTab"), menu: () => `<div class="mm-cols mm-city">${GROUPS.map(g => `<div><b>${esc(lang === "zh" ? g.zh : g.en)}</b>${g.boards.map(bd => { const n = count(bd[0]); return `<a href="#b-${bd[0]}">${esc(lang === "zh" ? bd[2] : bd[3])}${n ? `<em>${n}</em>` : ""}</a>`; }).join("")}</div>`).join("")}<div><b>${esc(t("ypTab"))}</b>${t("ypCats").slice(0, 10).map(([k, n]) => `<a href="#yp-${k}">${esc(n)}</a>`).join("")}</div></div><a class="mm-cta" href="#city">${esc(t("cityAll"))} →</a>` });
    items.push({ h: "b-dating", label: t("datingTab") });
    items.push({ h: "travel", label: t("travelTab"), menu: () => window.HLTravel ? `<div class="mm-cols"><div><b>${esc(t("trNear"))}</b>${HLTravel.T.filter(x => x.area === "near").map(x => `<a href="#tr-${x.id}">${esc(x.name)}</a>`).join("")}</div><div><b>${esc(t("trUsa"))}</b>${HLTravel.T.filter(x => x.area === "usa").map(x => `<a href="#tr-${x.id}">${esc(x.name)}</a>`).join("")}</div></div><a class="mm-cta" href="#travel">${esc(t("trAll"))} →</a>` : null });
    items.push({ h: "tools", label: t("toolsTab"), menu: () => window.HLTools ? `<div class="mm-cols">${HLTools.CATS.map(c => `<div><b>${esc(lang === "zh" ? c.zh : c.en)}</b>${c.tools.map(id => `<a href="#t-${id}">${esc(HLTools.title(id, lang))}</a>`).join("")}</div>`).join("")}</div><a class="mm-cta" href="#tools">${esc(t("toolsAll"))} →</a>` : null });
    items.push({ h: "events", label: t("eventsTab") });
    // Top bar: home (all local services), app, meet locals, news, deals, offline events.
    // The app keeps its home screen to three things (benefits check, tools, supermarket flyers); everything else lives in the tabs.
    const ORDER = IS_APP ? ["", "city", "n-top", "stocks", "b-dating", "tools", "deals", "travel"] : ["", "tools", "city", "deals", "n-top", "stocks", "travel", "b-dating"];
    return items.filter(it => ORDER.includes(it.h)).sort((a, b) => ORDER.indexOf(a.h) - ORDER.indexOf(b.h));
  }
  function renderTabs() {
    const items = menuItems();
    const curBoard = route.view === "board" ? boardById(route.board) : null;
    const artDeal = route.view === "article" && deals && Object.values(deals.sections || {}).some(l => l.some(x => x.id === route.id));
    const cur = artDeal ? "deals" : (route.view === "news" || route.view === "article") ? "n-top" : route.view === "stocks" ? "stocks" : (route.view === "deals" || route.view === "chaoshi") ? "deals" : route.view === "events" ? "events" : route.view === "tools" ? "tools" : route.view === "travel" ? "travel" : (curBoard && curBoard.id === "dating") ? "b-dating" : route.view === "city" || (curBoard && curBoard.id !== "dating") || route.view === "yp" ? "city" : (route.view === "home" || route.view === "check" || route.view === "guide" || route.view === "guideOne") ? "" : null;
    $("#tabs").innerHTML = items.map((it, k) => `<a href="#${it.h}" data-mi="${k}" class="${it.h === cur ? "on" : ""}${it.menu ? " has-menu" : ""}" ${it.menu ? 'aria-haspopup="true"' : ""}>${esc(it.label)}${it.menu ? '<span class="caret" aria-hidden="true">▾</span>' : ""}</a>`).join("");
  }
  const mega = document.getElementById("mega");
  let megaTimer = null, megaIdx = -1;
  function openMega(a) {
    const it = menuItems()[Number(a.dataset.mi)]; if (!it || !it.menu) { closeMega(); return; }
    clearTimeout(megaTimer);
    megaIdx = Number(a.dataset.mi);
    mega.innerHTML = it.menu();
    mega.hidden = false; megaOpenedAt = Date.now();
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
  // Keyboard focus opens the menu on desktop. On phones a tap focuses the tab just before the click,
  // which used to open and then immediately close the menu, so focus is ignored there.
  $("#tabs").addEventListener("focusin", e => { const a = e.target.closest("a.has-menu"); if (a && canHover) openMega(a); });
  mega.addEventListener("click", e => { if (e.target.closest("a")) setTimeout(closeMega, 0); });
  document.addEventListener("click", e => { if (!mega.hidden && !e.target.closest("#mega,#tabs")) closeMega(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMega(); });
  let megaOpenedAt = 0;
  $("#tabs").addEventListener("scroll", () => { if (Date.now() - megaOpenedAt > 400) closeMega(); }, { passive: true });
  window.addEventListener("hashchange", closeMega);
  window.addEventListener("scroll", () => { if (!mega.hidden) { const nav = document.querySelector(".tabs").getBoundingClientRect(); mega.style.top = nav.bottom + "px"; } }, { passive: true });

  function renderDir() {
    if (!$("#dir")) return; // the home directory panel was removed: the hover menus in the top bar list every board
    const count = id => posts.filter(p => p.board === id).length;
    $("#dir").innerHTML = GROUPS.map(g => `<div class="dg"><h3>${esc(lang === "zh" ? g.zh : g.en)}</h3><ul>${g.boards.map(b => {
      const n = count(b[0]); return `<li><a href="#b-${b[0]}">${esc(lang === "zh" ? b[2] : b[3])}</a>${n ? `<span class="n">${n}</span>` : ""}</li>`;
    }).join("")}</ul></div>`).join("");
  }
  // 同城服务: every board on one page, grouped like a classifieds portal, with counts for the chosen area.
  const GROUP_COLORS = ["#d2453a", "#e08a1e", "#2f7fd8", "#1f9d6b", "#7a5bd6", "#d24f8a", "#0f9bb0", "#c0392b"];
  const HOT = ["jobs", "rent", "car", "sale", "clean", "repair", "parttime"];
  const GCOL = { work: "#d2453a", home: "#e08a1e", trade: "#2f7fd8", svc: "#1f9d6b", pro: "#7a5bd6", health: "#d24f8a", life: "#0f9bb0", social: "#c0392b" };
  let portalOpen = false;
  function renderPortal() {
    const el = $("#homePortal"); if (!el) return;
    const zh = lang === "zh", count = id => areaPosts().filter(p => p.board === id).length;
    const hot = HOT.map(boardById).filter(Boolean).map(b => `<a class="pt-hot" href="#b-${b.id}" style="--c:${GCOL[b.group] || "#d2453a"}"><span class="pt-ic" aria-hidden="true">${esc(b.glyph)}</span><b>${esc(zh ? b.zh : b.en)}</b></a>`).join("")
      + `<button type="button" class="pt-hot" data-ptmore style="--c:#5d6272"><span class="pt-ic pt-all" aria-hidden="true">${ic("grid")}</span><b>${esc(t("ptAll"))}</b></button>`;
    const card = g => `<section class="pt-card" style="--c:${GCOL[g.id] || "#d2453a"}"><h3><a href="#b-${g.boards[0][0]}">${esc(zh ? g.zh : g.en)}</a></h3><div class="pt-links">${g.boards.map(bd => { const n = count(bd[0]); return `<a href="#b-${bd[0]}">${esc(zh ? bd[2] : bd[3])}${n ? `<em>${n}</em>` : ""}</a>`; }).join("")}</div></section>`;
    const main = ["work", "home", "trade", "svc"], groups = GROUPS.filter(g => g.id !== "social");
    const yp = `<section class="pt-card" style="--c:#9c7536"><h3><a href="#yp">${esc(t("ypTab"))}</a></h3><div class="pt-links">${t("ypCats").slice(0, 10).map(([k, n]) => `<a href="#yp-${k}">${esc(n)}</a>`).join("")}</div></section>`;
    let located = false; try { located = !!localStorage.getItem("hl-located") || !!localStorage.getItem("hl-area"); } catch (e) {}
    el.innerHTML = `<div class="pt-head"><h2>${esc(t("cityTab"))}</h2><button type="button" class="region-pill pt-region" data-region>${ic("pin")}${esc(regionLabel())}<span aria-hidden="true">▾</span></button>
      ${located ? "" : `<span class="loc-tip">${esc(t("locTip"))}<button type="button" class="linkbtn" data-locate>${esc(t("locBtn"))}</button><button type="button" class="x" data-locx aria-label="Close">×</button></span>`}</div>
      <div class="pt-hots">${hot}</div>
      <div class="pt-grid">${groups.filter(g => main.includes(g.id)).map(card).join("")}</div>
      <div class="pt-grid pt-more"${portalOpen ? "" : " hidden"}>${groups.filter(g => !main.includes(g.id)).map(card).join("")}${yp}</div>
      <button type="button" class="pt-toggle" data-ptmore>${esc(portalOpen ? t("ptLess") : t("ptMore"))} <span aria-hidden="true">${portalOpen ? "▴" : "▾"}</span></button>`;
  }
  function renderCity() {
    const el = $("#cityBody"); if (!el) return;
    const zh = lang === "zh", count = id => areaPosts().filter(p => p.board === id).length;
    const sec = g => `<section class="cc-sec" style="--c:${GCOL[g.id] || "#B8312A"}"><div class="cc-h"><h2>${esc(zh ? g.zh : g.en)}</h2><button type="button" class="linkbtn" data-postto="${g.boards[0][0]}">${esc(t("cityPost"))}</button></div>
      <div class="cc-grid">${g.boards.map(bd => { const n = count(bd[0]); return `<a class="cc-it" href="#b-${bd[0]}"><span class="cc-ic" aria-hidden="true">${esc(bd[1])}</span><b>${esc(zh ? bd[2] : bd[3])}</b>${n ? `<em>${n}</em>` : ""}</a>`; }).join("")}</div></section>`;
    const yp = `<section class="cc-sec" style="--c:#9C7536"><div class="cc-h"><h2>${esc(t("ypTab"))}</h2><a class="linkbtn" href="#yp">${esc(t("cityAllYp"))} →</a></div><div class="cc-grid">${t("ypCats").map(([k, n]) => `<a class="cc-it" href="#yp-${k}"><span class="cc-ic" aria-hidden="true">${esc(n.slice(0, 1))}</span><b>${esc(n)}</b></a>`).join("")}</div></section>`;
    el.innerHTML = `<div class="cc-top"><div><h1>${esc(t("cityCatTab"))}</h1><p>${esc(t("cityIntro"))}</p></div><button type="button" class="region-pill" data-region>${ic("pin")}${esc(regionLabel())}<span aria-hidden="true">▾</span></button></div>
      ${GROUPS.map(sec).join("")}${yp}
      <div class="cc-cta"><div><b>${esc(t("cityCtaH"))}</b><span>${esc(t("cityCtaP"))}</span></div><button type="button" class="btn" data-post>${esc(t("postFree"))}</button></div>`;
  }

  function renderTravel() {
    if (!window.HLTravel || route.view !== "travel") return;
    const T = window.HLTravel, trip = route.trip && T.T.find(x => x.id === route.trip);
    $("#travelNav").innerHTML = [["", t("trAll")], ["near", t("trNear")], ["usa", t("trUsa")]].map(([k, n]) => `<a href="#travel${k ? "-" + k : ""}"${(trip ? trip.area : route.area) === k && !(trip && !k) ? ' class="on"' : ""}>${esc(n)}</a>`).join("");
    $("#travelBody").innerHTML = trip ? T.page(trip.id) : T.hub(route.area);
    document.title = (trip ? trip.name : t("travelTab")) + " - 华脉";
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-trshare]"); if (!b || !window.HLTravel) return; const n = HLTravel.title(b.dataset.trshare); HLShare.open({ url: HLC.siteBase() + "#tr-" + b.dataset.trshare, title: n + " 省钱攻略", text: n + " 省钱攻略 - 华脉" }); });
  const TOOL_COL = { go: "#2f6fd6", scam: "#c8302a", imm: "#7a4fd0", drive: "#1f9d74", loan: "#d98a1c", afford: "#b8562a", eng: "#2a8fb8", life: "#5d6272" };
  function renderAppHome() {
    const el = $("#appHome"); if (!el || !IS_APP) return;
    document.documentElement.classList.add("app-lite"); el.hidden = false;
    const T = window.HLTools, zh = lang === "zh";
    // The 8 tools people reach for most; the rest sit behind "全部工具".
    const TOP_TOOLS = ["transit", "scam", "civics", "permit", "visa", "mortgage", "phrases", "tip"];
    const catOf = id => (T.CATS.find(c => c.tools.includes(id)) || {}).id;
    const tools = T ? `<div class="ah-tools">${TOP_TOOLS.filter(id => T.TOOLS[id]).map(id => `<a href="#t-${esc(id)}"><span class="ah-ic" style="--c:${TOOL_COL[catOf(id)] || "#5d6272"}">${esc(T.TOOLS[id].g)}</span><b>${esc(T.title(id, lang))}</b></a>`).join("")}</div>` : "";
    // The 8 most used local-service boards; the rest behind "全部分类".
    const TOP_BOARDS = ["jobs", "rest", "rent", "share", "sale", "car", "reno", "clean"];
    const boards = `<div class="ah-tools">${TOP_BOARDS.map(boardById).filter(Boolean).map(b => `<a href="#b-${b.id}"><span class="ah-ic" style="--c:${GCOL[b.group] || "#d2453a"}">${esc(b.glyph)}</span><b>${esc(zh ? b.zh : b.en)}</b></a>`).join("")}</div>`;
    el.innerHTML = `
      <a class="ah-hero" href="#check"><span class="ah-lab">${esc(zh ? "福利自测" : "Benefits check")}</span><b>${esc(zh ? "白卡、粮食券、公屋……我能申请什么？" : "Medicaid, SNAP, housing: what can I get?")}</b><span>${esc(zh ? "回答几个问题，马上看到你可能符合的福利" : "Answer a few questions to see what you may qualify for")}</span><em>${esc(zh ? "开始自测 →" : "Start →")}</em></a>
      <a class="ah-cs" href="#chaoshi"><span class="ah-cs-ic">🛒</span><div><b>${esc(zh ? "华人超市特价单" : "Supermarket flyers")}</b><span>${esc(zh ? "法拉盛、华埠、布鲁克林本周特价，选超市直接看" : "This week's flyers from Chinese supermarkets")}</span></div><i>›</i></a>
      <section class="ah-tools-sec"><div class="bh"><h2>${esc(t("toolsTab"))}</h2><a class="ah-all" href="#tools">${esc(zh ? "全部工具" : "All tools")} ›</a></div>${tools}</section>
      <section class="ah-tools-sec"><div class="bh"><h2>${esc(zh ? "同城服务" : "Local services")}</h2><a class="ah-all" href="#city">${esc(zh ? "全部分类" : "All categories")} ›</a></div>${boards}</section>
      <section class="ah-tools-sec ah-news"><div class="bh"><h2>${esc(zh ? "推荐新闻" : "Top stories")}</h2><a class="ah-all" href="#n-top">${esc(zh ? "全部新闻" : "All news")} ›</a></div><div id="ahNews"><div class="skel"><i></i><i></i><i></i></div></div></section>`;
    renderAppNews();
  }
  // A handful of hand-picked-by-rule stories for the app home: the lead story, then the freshest
  // NYC-local and immigration stories, then more top stories; pictures preferred, at most 5.
  function renderAppNews() {
    const el = $("#ahNews"); if (!el || !IS_APP) return;
    if (!news) return;
    const fresh = i => Date.now() - (Date.parse(i.d) || 0) < 36 * 3600e3;
    const pick = [], seen = new Set();
    const take = (list, n, any) => { for (const i of list) { if (pick.length >= 5 || n <= 0) break; if (seen.has(i.id) || (!any && !fresh(i))) continue; seen.add(i.id); pick.push(i); n--; } };
    const withImgFirst = l => l.filter(i => i.img).concat(l.filter(i => !i.img));
    take(withImgFirst(sec("top").slice(0, 6)), 1); take(withImgFirst(sec("local").slice(0, 8)), 1); take(withImgFirst(sec("immigration").slice(0, 8)), 1); take(withImgFirst(sec("top").slice(0, 12)), 2);
    if (pick.length < 5) take(sec("top").concat(sec("local"), sec("immigration")), 5, true); // never leave the box empty
    if (!pick.length) { const raw = (news.sections && (news.sections[lang] || news.sections.zh)) || {}; take([].concat(raw.top || [], raw.local || [], raw.immigration || []), 5, true); }
    el.innerHTML = pick.length ? `<ul class="ah-nl">${pick.map(i => `<li><a ${nhref(i)}>${i.img ? `<span class="ah-th">${imgTag(i, "")}</span>` : ""}<span class="ah-nt"><b>${esc(disp(i))}</b><em>${esc(i.src || "")}</em></span></a></li>`).join("")}</ul>` : `<div class="empty">${esc(t("newsEmpty"))}</div>`;
  }
  function renderTools() {
    if (!window.HLTools || route.view !== "tools") return;
    const T = window.HLTools, zh = lang === "zh";
    $("#toolsNav").innerHTML = `<a href="#tools"${!route.tool && !route.cat ? ' class="on"' : ""}>${esc(t("toolsAll"))}</a>` + T.CATS.map(c => `<a href="#tools-${c.id}"${route.cat === c.id || (route.tool && c.tools.includes(route.tool)) ? ' class="on"' : ""}>${esc(zh ? c.zh : c.en)}</a>`).join("");
    if (route.tool && T.TOOLS[route.tool]) { T.render(route.tool, $("#toolsBody"), lang); document.title = T.title(route.tool, lang) + " - " + (zh ? "华脉" : "HuaMai"); }
    else { $("#toolsBody").innerHTML = `<h1 class="tl-h1">${esc(t("toolsTab"))}</h1><p class="tl-sub">${esc(t("toolsSub"))}</p>` + T.hub(lang, route.cat); document.title = t("toolsTab") + " - " + (zh ? "华脉" : "HuaMai"); }
  }
  function renderEvents() {
    const el = $("#eventsBody"); if (!el) return;
    const free = ((deals && deals.sections && deals.sections.events) || []).filter(zhOk);
    const comm = areaPosts().filter(p => p.board === "events").slice(0, 40);
    el.innerHTML = `<div class="ev-grid"><section class="block"><div class="bh"><h2>${esc(t("evComm"))}</h2><button type="button" class="linkbtn" data-postto="events">${esc(t("evPost"))}</button></div>
      ${!postsLoaded ? '<div class="skel"><i></i><i></i><i></i></div>' : comm.length ? `<ul class="rows">${comm.map(p => rowHtml(p, false)).join("")}</ul>` : `<div class="invite"><b>${esc(t("evInvH"))}</b><p>${esc(t("evInvP"))}</p><button type="button" class="btn sm" data-postto="events">${esc(t("evPost"))}</button></div>`}</section>
      <section class="block"><div class="bh"><h2>${esc(t("evFree"))}</h2></div>${free.length ? `<ul class="nl">${free.map(i => dealLi(i, true)).join("")}</ul>` : `<div class="skel"><i></i><i></i><i></i></div>`}</section></div>`;
  }
  // New immigrants: the first things to sort out, with official or our own guide links.
  function renderNewcomer() {
    const el = $("#newcomer"); if (!el) return;
    el.innerHTML = `<div class="bh"><h2>${esc(t("ncH"))}</h2><a href="#check">${esc(t("ncCheck"))} ›</a></div><p class="nc-sub">${esc(t("ncSub"))}</p>
      <div class="nc-grid">${t("ncItems").map(([h, p, u]) => `<a class="nc-it" href="${esc(u)}"${/^https:/.test(u) ? ' target="_blank" rel="noopener"' : ""}><b>${esc(h)}</b><span>${esc(p)}</span></a>`).join("")}</div>
      <p class="g-fine">${esc(t("ncFine"))}</p>`;
  }
  // Find the nearest area from the phone's location (asked only when the visitor taps "locate me").
  const AREA_PTS = { "法拉盛": [40.759, -73.830], "布鲁克林八大道 / 日落公园": [40.641, -74.011], "布鲁克林 86街 / 本森赫斯特": [40.604, -73.997], "曼哈顿华埠": [40.716, -73.997],
    "艾姆赫斯特": [40.736, -73.878], "布鲁克林 U大道 / 羊头湾": [40.599, -73.959], "贝赛 / 白石 / 大颈": [40.768, -73.790], "新鲜草原 / 佛洛帕兰": [40.735, -73.793],
    "森林小丘 / 雷哥公园": [40.720, -73.848], "可乐娜 / 杰克逊高地": [40.747, -73.870], "布鲁克林湾脊 / 戴克高地": [40.625, -74.025], "史泰登岛": [40.580, -74.150],
    "布朗克斯": [40.845, -73.865], "长岛": [40.760, -73.400], "新泽西": [40.760, -74.100], "威郡 / 纽约上州": [41.034, -73.763] };
  function nearestArea(lat, lng) {
    const km = (a, b) => { const r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos((a[0] + b[0]) / 2 * r), y = (b[0] - a[0]) * r; return Math.sqrt(x * x + y * y) * 6371; };
    let best = "", d = 1e9; for (const [k, p] of Object.entries(AREA_PTS)) { const x = km([lat, lng], p); if (x < d) { d = x; best = k; } }
    if (d > 80) return null; // not near New York
    if (d > 6 && !/史泰登|布朗克斯|长岛|新泽西|威郡/.test(best)) { // between neighborhoods: fall back to the borough
      if (lng > -73.96 && lat > 40.68) return "皇后区其他"; if (lat < 40.70 && lng > -74.05) return "布鲁克林其他"; return "曼哈顿其他"; }
    return best;
  }
  function setArea(a, quiet) {
    curArea = a; try { localStorage.setItem("hl-area", a); localStorage.setItem("hl-located", "1"); } catch (er) {}
    renderRegionBtn(); renderPortal();
    if (route.view === "city") renderCity(); if (route.view === "events") renderEvents();
    if (route.view === "board") { $("#bArea").value = curArea; renderBoard(); }
    if (!quiet) toast(t("rgSet").replace("{a}", regionLabel()));
  }
  function locateMe() {
    if (!navigator.geolocation) { toast(t("locNo")); openRegion(); return; }
    toast(t("locing"));
    navigator.geolocation.getCurrentPosition(p => { const a = nearestArea(p.coords.latitude, p.coords.longitude); if (a === null) { setArea("", true); toast(t("locFar")); } else setArea(a); },
      () => { toast(t("locNo")); openRegion(); }, { timeout: 10000, maximumAge: 600000 });
  }
  function renderLocateBar() {
    const lb = $("#locateBar"); if (!lb) return; // replaced by the small tip inside the services panel
    let done = false; try { done = !!localStorage.getItem("hl-located") || !!localStorage.getItem("hl-area"); } catch (e) {}
    if (done) { lb.hidden = true; return; }
    lb.innerHTML = `${ic("pin")}<span>${esc(t("locAsk"))}</span><button type="button" class="btn sm" data-locate>${esc(t("locBtn"))}</button><button type="button" class="linkbtn" data-region>${esc(t("locPick"))}</button><button type="button" class="x" data-locx aria-label="Close">×</button>`;
    lb.hidden = false;
  }
  // Area chips on board pages: tap a neighborhood to filter (also sets the site-wide area).
  const AREA_SHORT = { "布鲁克林八大道 / 日落公园": "日落公园", "布鲁克林 86街 / 本森赫斯特": "86街", "布鲁克林 U大道 / 羊头湾": "羊头湾", "贝赛 / 白石 / 大颈": "贝赛/大颈",
    "新鲜草原 / 佛洛帕兰": "新鲜草原", "森林小丘 / 雷哥公园": "森林小丘", "可乐娜 / 杰克逊高地": "可乐娜", "布鲁克林湾脊 / 戴克高地": "湾脊", "威郡 / 纽约上州": "威郡/上州" };
  function renderAreaChips() {
    const el = $("#bAreaChips"); if (!el || route.view !== "board") return;
    const zh = lang === "zh", cur = $("#bArea").value, list = posts.filter(p => p.board === route.board);
    const n = a => list.filter(p => p.area === a).length;
    el.innerHTML = `<button type="button" class="ac${cur ? "" : " on"}" data-bareaset="">${esc(t("rgAll"))}<em>${list.length || ""}</em></button>` +
      AREAS.filter(a => !/网上/.test(a[0])).map(([z, e]) => { const k = n(z); return `<button type="button" class="ac${cur === z ? " on" : ""}" data-bareaset="${esc(z)}">${esc(zh ? (AREA_SHORT[z] || z) : e)}${k ? `<em>${k}</em>` : ""}</button>`; }).join("");
  }
  function regionLabel() { const a = AREAS.find(x => x[0] === curArea); return t("cityNY") + (a ? " · " + (lang === "zh" ? a[0] : a[1]) : ""); }
  function renderRegionBtn() { const b = $("#regionTxt"); if (b) b.textContent = regionLabel(); }
  function openRegion() {
    const zh = lang === "zh";
    $("#viewBody").innerHTML = `<button type="button" class="x" data-close aria-label="Close">×</button><div class="rg"><h3>${esc(t("rgH"))}</h3><button type="button" class="btn sm rg-loc" data-locate>${ic("pin")}${esc(t("locBtn"))}</button>
      <p class="rg-l">${esc(t("rgCity"))}</p><div class="rg-row"><button type="button" class="rg-chip on">${esc(t("cityNY"))}</button></div>
      <p class="rg-l">${esc(t("rgArea"))}</p><div class="rg-row"><button type="button" class="rg-chip${curArea ? "" : " on"}" data-area="">${esc(t("rgAll"))}</button>${AREAS.filter(a => !/网上/.test(a[0])).map(([z, e]) => `<button type="button" class="rg-chip${curArea === z ? " on" : ""}" data-area="${esc(z)}">${esc(zh ? z : e)}</button>`).join("")}</div></div>`;
    const d = $("#viewDlg"); if (!d.open) d.showModal();
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-region]")) { e.preventDefault(); openRegion(); return; }
    const c = e.target.closest("[data-area]");
    if (c && c.closest(".rg")) {
      $("#viewDlg").close(); setArea(c.dataset.area); return;
    }
    if (e.target.closest("[data-appdl]")) { e.preventDefault(); installApp(); }
    const bc = e.target.closest("[data-bareaset]"); if (bc) { setArea(bc.dataset.bareaset, true); $("#bArea").value = bc.dataset.bareaset; renderBoard(); renderAreaChips(); }
    if (e.target.closest("[data-locate]")) { e.preventDefault(); const d = $("#viewDlg"); if (d.open) d.close(); locateMe(); }
    if (e.target.closest("[data-locx]")) { try { localStorage.setItem("hl-located", "1"); } catch (er) {} renderPortal(); }
    if (e.target.closest("[data-ptmore]")) { const fromIcon = e.target.closest(".pt-hot"); portalOpen = fromIcon ? true : !portalOpen; renderPortal(); if (fromIcon) { const m = document.querySelector(".pt-more"); if (m) m.scrollIntoView({ behavior: "smooth", block: "nearest" }); } }
    const ht = e.target.closest("[data-ht]"); if (ht) { $("#htabs").dataset.t = ht.dataset.ht; }
  });

  function renderAdContact() {
    const c = CFG.adContact || {};
    const parts = [c.phone && (t("phone") + " " + c.phone + t("adSms")), c.wechat && (t("wx") + " " + c.wechat), c.email].filter(Boolean);
    $("#adContact").textContent = t("footAdsP") + (parts.length ? " " + parts.join(" · ") : "");
  }

  /* ---------- render: news ---------- */
  // Only stories that can be read in full on our site (embeddable pages or official full text).
  const sec = s => ((news && news.sections && news.sections[lang] && news.sections[lang][s]) || []).filter(i => i.fr === 1 || i.full);
  function metaHtml(i) { const a = ago(i.d); return `<span class="meta">${i.src ? `<span class="src">${esc(i.src)}</span>` : ""}${a ? `<span>${esc(a)}</span>` : ""}</span>`; }
  const imgTag = (i, cls) => `<img class="${cls}" src="${esc(safeUrl(i.img))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('[data-hasimg]')&&this.closest('[data-hasimg]').removeAttribute('data-hasimg');this.remove()">`;
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
    try { renderAppNews(); } catch (e) {}
    if (!news) { SECTIONS.forEach(s => { const el = $("#sec-" + s); if (el) el.innerHTML = `<div class="empty">${esc(t("loading"))}</div>`; }); return; }
    const top = sec("top");
    const lw = $("#sec-top");
    if (!top.length) lw.innerHTML = `<div class="empty">${esc(t("newsEmpty"))}</div>`;
    else {
      const leadIdx = top.slice(0, 3).findIndex(i => i.img && (Date.parse(top[0].d) || 0) - (Date.parse(i.d) || 0) < 6 * 3600e3); // a picture story, but only if it is nearly as fresh as the newest
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
    $("#nList").innerHTML = list.length ? withAds(list.map(i => liHtml(i, true, true)), 6) : `<div class="empty">${esc(news ? t("newsEmpty") : t("loading"))}</div>`;
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
  let adN = 0;
  function emptyAd(sm) {
    const k = adN++;
    if (false) { const h = t("house")[(k >> 1) % t("house").length]; return `<a class="spon house ${sm ? "sm" : ""}" href="${h[0]}"><span class="lab">${esc(t("houseLab"))}</span><h3>${esc(h[1])} <span aria-hidden="true">→</span></h3><p>${esc(h[2])}</p></a>`; }
    const c = CFG.adContact || {};
    const parts = [c.phone && (c.phone + t("adSms")), c.wechat && (t("wx") + " " + c.wechat), c.email].filter(Boolean);
    return `<a class="spon empty ${sm ? "sm" : ""}" href="#advertise"><span class="lab">${esc(t("sponsored"))}</span><h3>${esc(t("adEmptyH"))}</h3><p>${sm ? "" : esc(t("adEmptyP")) + "<br>"}${parts.length ? esc(t("adContact") + parts.join(" · ")) : esc(t("adMore"))}</p></a>`;
  }
  // Fill a container with live ads for a position, topped up with "ad space available" cards.
  function fillAds(sel, pos, n, sm, filter) {
    const el = $(sel); if (!el) return;
    const live = liveSlots(pos).filter(filter || (() => true)).slice(0, n);
    el.innerHTML = live.map(s => adCard(s, sm ? "sm" : "")).join("") + Array.from({ length: Math.max(0, n - live.length) }, () => emptyAd(sm)).join("");
  }
  // Ad strip inside a list (news, deals): one card, rotating through "feed" ads or house promos.
  function listAd(i) { const live = liveSlots("feed"); const s = live.length ? live[i % live.length] : null; return `<li class="feed-ad">${s ? adCard(s, "sm") : emptyAd(true)}</li>`; }
  const withAds = (items, every) => items.map((h, i) => h + ((i + 1) % every === 0 && i < items.length - 1 ? listAd(i / every | 0) : "")).join("");
  function feedAd(i) {
    const live = liveSlots("feed"); const s = live.length ? live[i % live.length] : null;
    return `<li class="feed-ad">${s ? adCard(s, "sm") : emptyAd(true)}</li>`;
  }
  function renderAds() {
    adN = 0;
    fillAds("#sponBanner", "banner", 1, false);
    fillAds("#sponTop", "top", 3, false);
    fillAds("#sponMid1", "mid", 3, true, (s, i) => true);
    fillAds("#sponMid3", "mid", 3, true);
    const mids = liveSlots("mid");
    $("#sponMid2").innerHTML = mids.slice(3, 6).map(s => adCard(s, "sm")).join("") + Array.from({ length: Math.max(0, 3 - mids.slice(3, 6).length) }, () => emptyAd(true)).join("");
    fillAds("#sponRail", "rail", 6, false);
    fillAds("#sponGuide", "article", 3, true);
    fillAds("#sponGuideTop", "article", 3, true);
    fillAds("#sponFoot", "foot", 6, true);
    fillAds("#sponDeals", "mid", 3, true);
    document.querySelectorAll(".view-ad").forEach(el => { el.innerHTML = liveSlots("section").slice(0, 3).map(s => adCard(s, "sm")).join("") + Array.from({ length: Math.max(0, 3 - liveSlots("section").slice(0, 3).length) }, () => emptyAd(true)).join(""); });
    renderBoardAds();
  }
  function renderBoardAds() {
    if (route.view !== "board") return;
    fillAds("#sponBoard", "board", 3, true, s => !s.boards || !s.boards.length || s.boards.includes(route.board));
  }
  /* ---------- business directory (商家黄页) ---------- */
  let bizSeed = null, bizLive = [], bizLoaded = false;
  async function loadBiz() {
    if (!bizSeed) { try { bizSeed = (await getJSON("data/directory.json")).items || []; } catch (e) { bizSeed = []; } renderYP(); }
    if (bizLoaded || !POSTS_ON) return; bizLoaded = true;
    try {
      const r = await fetch(SB_URL + "/rest/v1/businesses?select=id,created_at,name,cat,area,address,phone,wechat,hours,website,descr,featured_until&order=created_at.desc&limit=1000", { headers: sbHeaders() });
      if (r.ok) { bizLive = await r.json(); renderYP(); }
    } catch (e) {}
  }
  const bizAll = () => (bizLive || []).map(b => Object.assign({}, b, { id: "b" + b.id, feat: b.featured_until && Date.parse(b.featured_until) > Date.now() })).concat(bizSeed || []);
  const catName = k => (t("ypCats").find(c => c[0] === k) || [k, k])[1];
  function renderYP() {
    if ($("#vYP").hidden) return;
    const cat = route.cat || "", q = ($("#ypQ").value || "").trim().toLowerCase(), area = $("#ypArea").value;
    if (!$("#ypArea").options.length || $("#ypArea").dataset.l !== lang) { const cur = area; $("#ypArea").innerHTML = `<option value="">${esc(t("bAllAreas"))}</option>` + AREAS.map(([z, e]) => `<option value="${esc(z)}">${esc(lang === "zh" ? z : e)}</option>`).join(""); $("#ypArea").value = cur; $("#ypArea").dataset.l = lang; }
    const all = bizAll(), count = k => all.filter(b => b.cat === k).length;
    $("#ypCats").innerHTML = `<a href="#yp" class="${cat ? "" : "on"}">${esc(t("ypAll"))} <em>${all.length}</em></a>` + t("ypCats").map(([k, n]) => `<a href="#yp-${k}" class="${cat === k ? "on" : ""}">${esc(n)}${count(k) ? ` <em>${count(k)}</em>` : ""}</a>`).join("");
    const list = all.filter(b => (!cat || b.cat === cat) && (!area || b.area === area) && (!q || [b.name, b.address, b.descr, b.area].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => (b.feat ? 1 : 0) - (a.feat ? 1 : 0));
    const c = CFG.adContact || {};
    const promo = c.phone ? `<div class="yp-promo">${esc(t("ypPromo"))} <a href="#advertise">${esc(CFG.ypPrice || "")}</a> · <a href="sms:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a></div>` : "";
    $("#ypList").innerHTML = promo + (list.length ? list.map(bizCard).join("") : `<div class="empty">${esc(t("ypNone"))} <button type="button" class="linkbtn" data-ypadd>${esc(t("ypAdd"))}</button></div>`);
  }
  function bizCard(b) {
    const tel = (b.phone || "").replace(/[^\d+]/g, "");
    const map = b.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(b.address) : "";
    return `<article class="yp-card${b.feat ? " feat" : ""}">
      <div class="yp-top"><span class="seal sm" aria-hidden="true">${esc((catName(b.cat) || "商").slice(0, 1))}</span><div><h3>${b.feat ? `<span class="pin">${esc(t("ypFeat"))}</span>` : ""}${esc(b.name)}</h3><p class="yp-meta">${esc(catName(b.cat))}${b.area ? " · " + esc(lang === "zh" ? b.area : ((AREAS.find(a => a[0] === b.area) || [0, b.area])[1])) : ""}</p></div></div>
      ${b.address ? `<p class="yp-addr">${esc(b.address)}</p>` : ""}${b.hours ? `<p class="yp-line">${ic("clock")}${esc(b.hours)}</p>` : ""}${b.descr ? `<p class="yp-desc">${esc(b.descr)}</p>` : ""}
      <div class="yp-act">${tel.length >= 7 ? `<a class="btn sm" href="tel:${esc(tel)}">${ic("phone")}${esc(b.phone)}</a>` : ""}${b.wechat ? `<span class="yp-wx">${esc(t("wx"))} ${esc(b.wechat)}</span>` : ""}${map ? `<a class="btn ghost sm" href="${esc(map)}" target="_blank" rel="noopener">${ic("pin")}${esc(t("ypMap"))}</a>` : ""}${b.website ? `<a class="btn ghost sm" href="${esc(safeUrl(/^https?:/.test(b.website) ? b.website : "https://" + b.website))}" target="_blank" rel="noopener" aria-label="website">${ic("globe")}</a>` : ""}</div>
    </article>`;
  }
  function openBizForm() {
    const c = CFG.adContact || {};
    if (!POSTS_ON) { toast(t("yOff").replace("{p}", c.phone || "")); return; }
    $("#ypForm").reset(); $("#yErr").textContent = "";
    $("#yCat").innerHTML = t("ypCats").map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
    if (route.cat) $("#yCat").value = route.cat;
    $("#yArea").innerHTML = `<option value="">${esc(t("areaPick"))}</option>` + AREAS.map(([z, e]) => `<option value="${esc(z)}">${esc(lang === "zh" ? z : e)}</option>`).join("");
    $("#ypDlg").showModal();
  }
  $("#ypAdd").onclick = openBizForm;
  document.addEventListener("click", e => { if (e.target.closest("[data-ypadd]")) { closeMega(); openBizForm(); } });
  $("#ypQ").addEventListener("input", renderYP);
  $("#ypArea").addEventListener("change", renderYP);
  $("#ypForm").addEventListener("submit", async e => {
    e.preventDefault();
    const v = id => $(id).value.trim();
    const err = v("#yName").length < 2 ? "yErrName" : !v("#yArea") ? "yErrArea" : (!v("#yPhone") && !v("#yWx")) ? "yErrContact" : HLC.BANNED.test(v("#yName") + " " + v("#yDesc")) ? "eBanned" : null;
    if (err) { $("#yErr").textContent = t(err); return; }
    const btn = $("#ySubmit"); btn.disabled = true;
    try {
      await rpc("create_business", { p_name: v("#yName"), p_cat: v("#yCat"), p_area: v("#yArea"), p_address: v("#yAddr"), p_phone: v("#yPhone"), p_wechat: v("#yWx"), p_hours: v("#yHours"), p_website: v("#yWeb"), p_descr: v("#yDesc") });
      $("#ypDlg").close(); toast(t("yOk")); bizLoaded = false; await loadBiz();
    } catch (er) { $("#yErr").textContent = t("yFail"); }
    finally { btn.disabled = false; }
  });
  $("#ypDlg").addEventListener("click", e => { if (e.target.closest("[data-close]") || e.target === $("#ypDlg")) $("#ypDlg").close(); });

  /* ---------- US stocks page: free TradingView widgets that load in the reader's browser ---------- */
  let stkLang = "";
  function tvWidget(box, script, cfg) {
    const el = $(box); if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
    const sc = document.createElement("script");
    sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-" + script + ".js"; sc.async = true;
    sc.textContent = JSON.stringify(cfg);
    el.firstChild.appendChild(sc);
  }
  function renderStocks() {
    const key = lang + (window.matchMedia("(prefers-color-scheme: dark)").matches ? "d" : "l");
    if (stkLang === key) return; stkLang = key;
    const theme = key.endsWith("d") ? "dark" : "light", locale = lang === "zh" ? "zh_CN" : "en";
    const cn = [["NYSE:BABA", "阿里巴巴"], ["NASDAQ:PDD", "拼多多"], ["NASDAQ:JD", "京东"], ["NASDAQ:BIDU", "百度"], ["NYSE:NIO", "蔚来"], ["NASDAQ:LI", "理想汽车"], ["NYSE:XPEV", "小鹏汽车"], ["NASDAQ:NTES", "网易"], ["NYSE:TCOM", "携程"], ["NYSE:BEKE", "贝壳"]];
    const tech = [["NASDAQ:NVDA", "英伟达"], ["NASDAQ:AAPL", "苹果"], ["NASDAQ:MSFT", "微软"], ["NASDAQ:GOOGL", "谷歌"], ["NASDAQ:AMZN", "亚马逊"], ["NASDAQ:META", "Meta"], ["NASDAQ:TSLA", "特斯拉"], ["NYSE:TSM", "台积电"]];
    const idx = [["FOREXCOM:SPXUSD", "标普500"], ["FOREXCOM:NSXUSD", "纳斯达克100"], ["FOREXCOM:DJI", "道琼斯"], ["CAPITALCOM:VIX", "恐慌指数"]];
    const fx = [["FX_IDC:USDCNY", "美元/人民币"], ["FX_IDC:USDHKD", "美元/港币"], ["OANDA:XAUUSD", "黄金"], ["BITSTAMP:BTCUSD", "比特币"]];
    const sym = list => list.map(([s, z]) => ({ s, d: lang === "zh" ? z : "" }));
    tvWidget("#stkTape", "ticker-tape", { symbols: idx.concat(cn.slice(0, 4), tech.slice(0, 4), fx.slice(0, 3)).map(([s, z]) => ({ proName: s, title: lang === "zh" ? z : "" })), showSymbolLogo: true, isTransparent: true, displayMode: "adaptive", colorTheme: theme, locale });
    // Big chart with a price scale on the right; tap a name above the chart to switch.
    const chartSyms = idx.slice(0, 3).concat(cn.slice(0, 3), tech.slice(0, 3), fx.slice(0, 2));
    tvWidget("#stkOverview", "symbol-overview", { symbols: chartSyms.map(([s, z]) => [lang === "zh" ? z : s.split(":")[1], s + "|1D"]), chartOnly: false, width: "100%", height: "100%", locale, colorTheme: theme,
      autosize: true, showVolume: false, showMA: false, hideDateRanges: false, hideMarketStatus: false, hideSymbolLogo: false, scalePosition: "right", scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "12", noTimeScale: false, valuesTracking: "1", changeMode: "price-and-percent", chartType: "area", lineWidth: 2, lineType: 0, dateRanges: ["1d|5", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"], isTransparent: true });
    // Price table: every symbol with its price and today's change.
    tvWidget("#stkQuotes", "market-quotes", { width: "100%", height: "100%", locale, colorTheme: theme, isTransparent: true, showSymbolLogo: true,
      symbolsGroups: [{ name: t("stkIdx"), symbols: idx.map(([s, z]) => ({ name: s, displayName: lang === "zh" ? z : "" })) }, { name: t("stkCn"), symbols: cn.map(([s, z]) => ({ name: s, displayName: lang === "zh" ? z : "" })) },
                      { name: t("stkTech"), symbols: tech.map(([s, z]) => ({ name: s, displayName: lang === "zh" ? z : "" })) }, { name: t("stkFx"), symbols: fx.map(([s, z]) => ({ name: s, displayName: lang === "zh" ? z : "" })) }] });
    tvWidget("#stkHot", "hotlists", { colorTheme: theme, dateRange: "1D", exchange: "US", showChart: true, locale, width: "100%", height: "100%", isTransparent: true, showSymbolLogo: true, showFloatingTooltip: true });
    tvWidget("#stkChart", "advanced-chart", { autosize: true, symbol: "NYSE:BABA", interval: "D", timezone: "America/New_York", theme, style: "1", locale, allow_symbol_change: true, hide_side_toolbar: true, calendar: false, support_host: "https://www.tradingview.com" });
  }
  let stkHomeKey = "";
  function renderStocksHome() {
    const box = $("#stkHome"); if (!box) return;
    const key = lang + (window.matchMedia("(prefers-color-scheme: dark)").matches ? "d" : "l");
    if (stkHomeKey === key) return;
    const go = () => {
      stkHomeKey = key;
      const zh = lang === "zh", sy = (s, z) => ({ s, d: zh ? z : "" });
      tvWidget("#stkHome", "market-overview", { colorTheme: key.endsWith("d") ? "dark" : "light", dateRange: "1D", showChart: false, locale: zh ? "zh_CN" : "en", width: "100%", height: "100%", isTransparent: true, showSymbolLogo: true,
        tabs: [{ title: t("stkIdx"), symbols: [sy("FOREXCOM:SPXUSD", "标普500"), sy("FOREXCOM:NSXUSD", "纳斯达克100"), sy("FOREXCOM:DJI", "道琼斯"), sy("FX_IDC:USDCNY", "美元/人民币"), sy("OANDA:XAUUSD", "黄金")] },
               { title: t("stkCn"), symbols: [sy("NYSE:BABA", "阿里巴巴"), sy("NASDAQ:PDD", "拼多多"), sy("NASDAQ:JD", "京东"), sy("NASDAQ:BIDU", "百度"), sy("NYSE:NIO", "蔚来")] },
               { title: t("stkTech"), symbols: [sy("NASDAQ:NVDA", "英伟达"), sy("NASDAQ:AAPL", "苹果"), sy("NASDAQ:MSFT", "微软"), sy("NASDAQ:TSLA", "特斯拉"), sy("NYSE:TSM", "台积电")] }] });
    };
    if ("IntersectionObserver" in window && !stkHomeKey) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "300px" }); io.observe(box); }
    else go();
  }
  function renderFlyer() {
    const c = CFG.adContact || {}, url = HLC.siteBase() + "#post";
    $("#flyerBody").innerHTML = `<div class="fly-sheet"><div class="fly-top"><span class="seal md" aria-hidden="true">脉</span><div><b>华脉</b><span>${esc(t("flyerSub"))}</span></div></div>
      <h1>${esc(t("flyerH"))}</h1><ul>${t("flyerPts").map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="fly-qr"><div id="flyQr"></div><p>${esc(t("flyerScan"))}</p><small>${esc(HLC.siteBase().replace(/^https?:\/\//, ""))}</small></div>
      ${c.phone ? `<p class="fly-dai">${esc(t("flyerDai").replace("{p}", c.phone))}</p>` : ""}</div>
      <p class="fly-actions"><button type="button" class="btn" onclick="window.print()">${lang === "zh" ? "打印" : "Print"}</button></p>`;
    const draw = () => { const box = $("#flyQr"); if (box && !box.firstChild && window.QRCode) new window.QRCode(box, { text: url, width: 220, height: 220, correctLevel: window.QRCode.CorrectLevel.M }); };
    if (window.QRCode) draw(); else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = draw; document.head.appendChild(sc); }
  }
  function renderAdsPage() {
    const c = CFG.adContact || {};
    const parts = [c.phone && (t("phone") + " " + c.phone + t("adSms")), c.wechat && (t("wx") + " " + c.wechat), c.email].filter(Boolean);
    $("#adsBody").innerHTML = `<div class="g-head"><span class="seal md" aria-hidden="true">${lang === "zh" ? "广" : "Ad"}</span><div><h1>${esc(t("adsTitle"))}</h1><p class="g-sum">${esc(t("adsIntro"))}</p></div></div>
      ${CFG.launchOffer ? `<p class="ads-offer">${esc(lang === "zh" ? CFG.launchOffer : t("adsOfferEn"))}</p>` : ""}
      <section><h2>${esc(t("adsPrice"))}</h2><table class="ads-table"><thead><tr><th>${esc(t("adsColPos"))}</th><th>${esc(t("adsColPrice"))}</th></tr></thead><tbody>
        ${CFG.ypPrice ? `<tr><td><b>${esc(t("adsYp"))}</b><br><span>${esc(t("adsYpP"))}</span></td><td class="pr">${esc(CFG.ypPrice)}</td></tr>` : ""}
        ${CFG.pinPrice ? `<tr><td><b>${esc(t("adsPin"))}</b><br><span>${esc(t("adsPinP"))}</span></td><td class="pr">${esc(CFG.pinPrice)}</td></tr>` : ""}
        ${t("adsList").map(([h, p], i) => `<tr><td><b>${esc(h)}</b><br><span>${esc(p)}</span></td><td class="pr">${esc((CFG.adPrices || [])[i] || t("adsAsk"))}</td></tr>`).join("")}
      </tbody></table><p class="g-fine">${esc(t("adsPriceNote"))}</p></section>
      <section><h2>${esc(t("adsHow"))}</h2><p>${esc(t("adsHowP"))}</p><p><b>${parts.length ? esc(t("adContact") + parts.join(" · ")) : esc(t("adsNoContact"))}</b></p>${c.phone ? `<p><a class="btn" href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${esc(t("phone"))} ${esc(c.phone)}</a> <a class="btn ghost" href="sms:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${lang === "zh" ? "发短信" : "Text"}</a></p>` : ""}</section>`;
  }

  /* ---------- render: posts ---------- */
  // "Recommended" under a news story: picture stories from other sections, then the latest listings.
  function recNewsHtml(i, sname) {
    const seen = new Set([i.id]);
    const pick = [];
    for (const s of ["top", "local", "immigration", "uschina", "china", "business", "health", "ent"]) {
      if (s === sname) continue;
      for (const x of sec(s)) { if (!seen.has(x.id) && x.img) { pick.push(x); seen.add(x.id); break; } }
    }
    const lp = posts.slice(0, 4);
    return `<section class="rec rec-news"><h4>${esc(t("recNews"))}</h4><ul class="nl">${pick.slice(0, 6).map(x => liHtml(x, false, true)).join("")}</ul>
      ${lp.length ? `<h4>${esc(t("recPosts"))}</h4><ul class="rows">${lp.map(x => rowHtml(x, true)).join("")}</ul>` : ""}</section>`;
  }
  /* ---------- official listings (NYC jobs, housing lotteries) ---------- */
  const offAll = () => (official.jobs || []).concat(official.housing || []);
  const offFor = board => offAll().filter(o => o.board === board);
  const offTitle = o => lang === "zh" ? o.t : (o.te + (o.pay ? " · " + o.pay.en : ""));
  const offArea = o => lang === "zh" ? o.area : o.area_en;
  function offRow(o) {
    return `<li><button type="button" class="row" data-oid="${esc(o.id)}"><span class="rt"><span class="pin off">${esc(t("offTag"))}</span>${o.area && !offTitle(o).includes(offArea(o)) ? `[${esc(offArea(o))}] ` : ""}${esc(offTitle(o))}</span><span class="rd">${o.until ? esc(t("offUntil") + " " + o.until.slice(5)) : ""}</span></button></li>`;
  }
  function offItem(o) {
    const sum = lang === "zh" ? (o.kind === "job" ? [o.az, o.ft && o.ft[0], o.dz].filter(Boolean).join(" · ") : (o.bz || "").split("\n").slice(0, 2).join(" · ")) : (o.kind === "job" ? [o.ae, o.ft && o.ft[1], o.be].filter(Boolean).join(" · ") : (o.be || "").split("\n").slice(0, 2).join(" · "));
    return `<li><button type="button" class="pitem" data-oid="${esc(o.id)}"><div class="pt"><span class="pin off">${esc(t("offTag"))}</span>${o.area && !offTitle(o).includes(offArea(o)) ? `[${esc(offArea(o))}] ` : ""}${esc(offTitle(o))}</div><div class="pm"><span>${esc(o.src)}</span>${o.until ? `<span>${esc(t("offUntil"))} ${esc(o.until)}</span>` : ""}</div><div class="pb">${esc(sum)}</div></button></li>`;
  }
  function openOfficial(id) {
    const o = offAll().find(x => x.id === id); if (!o) return;
    const zh = lang === "zh";
    let rows = "";
    if (o.kind === "job") {
      rows = [[t("offOrg"), zh ? (o.az || o.ae) : o.ae], [t("offPay"), o.pay && (zh ? o.pay.zh : o.pay.en)], [t("offLoc"), o.loc], ["", zh ? o.ft[0] : o.ft[1]], [t("offUntil"), o.until]].filter(x => x[1]).map(([k, v]) => `<span>${k ? `<b>${esc(k)}</b> ` : ""}${esc(v)}</span>`).join("");
    }
    const body = o.kind === "job" ? (zh && o.dz ? o.dz + "…" : o.be) : (zh ? o.bz : o.be);
    const how = o.kind === "job" ? `<p class="off-how">${esc(t("offJobHow").replace("{id}", o.jobId))}</p>` : "";
    $("#viewBody").innerHTML = `<button type="button" class="x" data-close aria-label="Close">×</button>
      <span class="tag"><span class="pin off">${esc(t("offTag"))}</span>${esc(bName(boardById(o.board)))}${o.area ? " · " + esc(offArea(o)) : ""}</span>
      <h3>${esc(offTitle(o))}</h3>
      ${rows ? `<div class="off-facts">${rows}</div>` : ""}
      <div class="detail-body">${esc(body || "")}</div>
      ${zh && o.kind === "job" && o.be ? `<details class="off-en"><summary>${esc(t("offEnShow"))}</summary><div class="detail-body">${esc(o.be)}</div></details>` : ""}
      ${how}
      <div class="post-actions"><a class="btn" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener">${esc(t("offApply"))}</a><button type="button" class="btn ghost" id="offShare">${esc(t("share"))}</button></div>
      <p class="warn">${esc(t("offFrom"))}：${esc(o.src)}。${esc(t("offNote"))}</p>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
    $("#offShare").onclick = () => HLShare.open({ url: HLC.siteBase() + "#b-" + o.board, title: offTitle(o), text: offTitle(o) + " - 华脉" });
  }
  function rowHtml(p, seal) {
    const b = boardById(p.board);
    return `<li><button type="button" class="row" data-pid="${p.id}">${seal ? `<span class="seal sm" title="${esc(bName(b))}">${esc(b ? b.glyph : "·")}</span>` : ""}<span class="rt">${p.pin ? `<span class="pin">${esc(t("pinned"))}</span>` : ""}${p.area ? `[${esc(p.area)}] ` : ""}${esc(p.title)}${(p.images || []).length ? ` <span class="hasimg" aria-label="photo">${ic("camera")}</span>` : ""}</span><span class="rd">${esc(ago(p.ts))}</span></button></li>`;
  }
  function pitemHtml(p, showBoard) {
    const b = boardById(p.board);
    const im = (p.images || [])[0];
    return `<li><button type="button" class="pitem${im ? " has-img" : ""}" data-pid="${p.id}">${im ? `<img class="pthumb" src="${esc(im)}" alt="" loading="lazy">` : ""}<div class="pt">${p.pin ? `<span class="pin">${esc(t("pinned"))}</span>` : ""}${p.area ? `[${esc(p.area)}] ` : ""}${esc(p.title)}</div><div class="pm">${showBoard ? `<span class="bd">${esc(bName(b))}</span>` : ""}<span>${esc(ago(p.ts))}</span>${p.contact ? `<span>${esc(p.contact)}</span>` : ""}${p.phone ? `<span>${esc(p.phone)}</span>` : ""}</div><div class="pb">${esc(p.body)}</div></button></li>`;
  }
  // A one-line, real-numbers summary of what's new (all counted from the site's own data).
  function renderPulse() {
    const el = $("#pulse"); if (!el || !news || !news.sections) return;
    const now = Date.now(), ids = new Set();
    for (const list of Object.values(news.sections[lang] || {})) for (const i of list) if (now - (Date.parse(i.d) || 0) < 86400e3) ids.add(i.id || i.u);
    const nDeals = Object.values((deals && deals.sections) || {}).reduce((a, v) => a + (v || []).filter(zhOk).length, 0);
    const upd = Date.parse(news.updatedAt);
    const parts = [ids.size && t("pNews").replace("{n}", `<b>${ids.size}</b>`), nDeals && t("pDeals").replace("{n}", `<b>${nDeals}</b>`)].filter(Boolean);
    if (!ids.size) { el.hidden = true; return; } // only show the line once the news has loaded
    const mini = $("#pulseMini");
    if (mini) { mini.innerHTML = `<span class="pl-dot" aria-hidden="true"></span>${parts.join(" · ")}`; mini.hidden = false; }
    el.hidden = true;
  }
  function renderPostsAll() {
    try { renderAreaChips(); renderPulse(); renderPortal(); if (route.view === "events") renderEvents(); if (route.view === "city") renderCity(); } catch (e) {}
    const latest = posts.slice(0, 12);
    $("#latest").innerHTML = !postsLoaded ? `<div class="skel" aria-label="${esc(t("loading"))}"><i></i><i></i><i></i><i></i></div>` : latest.length ? latest.map(p => rowHtml(p, true)).join("") : `<div class="invite"><b>${esc(t("invH"))}</b><p>${esc(t("invP"))}</p><button type="button" class="btn sm" data-post>${esc(t("invBtn"))}</button></div>`;
    const withPosts = HLC.BOARDS.filter(b => posts.some(p => p.board === b.id) || offFor(b.id).length);
    const order = FEATURED.map(boardById).filter(b => withPosts.includes(b)).concat(withPosts.filter(b => !FEATURED.includes(b.id)));
    const cards = order.slice(0, 11).map(b => {
      const list = posts.filter(p => p.board === b.id).sort((a, c) => (c.pin ? 1 : 0) - (a.pin ? 1 : 0)).slice(0, 6);
      const offs = offFor(b.id).slice(0, Math.max(0, 6 - list.length));
      return `<section class="board"><header><span class="seal sm">${esc(b.glyph)}</span><h3>${esc(bName(b))}</h3><a href="#b-${b.id}">${esc(t("more"))} ›</a></header><ul>${list.map(p => rowHtml(p, false)).join("")}${offs.map(offRow).join("")}</ul></section>`;
    });
    if (cards.length) cards.splice(Math.min(3, cards.length), 0, `<div class="board board-ad">${liveSlots("board").filter(x => !x.boards || !x.boards.length)[0] ? adCard(liveSlots("board")[0]) : emptyAd()}</div>`);
    const rest = HLC.BOARDS.filter(b => !order.slice(0, 11).includes(b));
    $("#bgrid").innerHTML = cards.join("") + (rest.length ? `<nav class="bchips" aria-label="${esc(t("moreBoards"))}"><b>${esc(t("moreBoards"))}</b>${rest.map(b => `<a href="#b-${b.id}"><span class="seal sm" aria-hidden="true">${esc(b.glyph)}</span>${esc(bName(b))}</a>`).join("")}</nav>` : "");
    renderDir(); try { renderDeals(); } catch (e) {}
    if (route.view === "board") renderBoard();
    if (route.view === "search") renderSearch();
  }
  function renderBoard() {
    const b = boardById(route.board); if (!b) return;
    $("#bSeal").textContent = b.glyph; $("#bTitle").textContent = bName(b);
    const q = ($("#bFilter").value || "").trim().toLowerCase();
    const areaF = $("#bArea").value, todayF = $("#bToday").checked, dayAgo = Date.now() - 864e5;
    const list = posts.filter(p => p.board === b.id && (!q || [p.title, p.area, p.body, p.contact].join(" ").toLowerCase().includes(q)) && (!areaF || p.area === areaF) && (!todayF || p.ts > dayAgo)).sort((a, c) => (c.pin ? 1 : 0) - (a.pin ? 1 : 0));
    renderBoardAds();
    const c = CFG.adContact || {};
    const tel = c.phone ? c.phone.replace(/[^0-9+]/g, "") : "";
    $("#bRules").hidden = b.id !== "dating"; $("#bRules").textContent = b.id === "dating" ? t("datingRules") : "";
    $("#bPin").innerHTML = c.phone ? `<a class="daifa" href="sms:${esc(tel)}">${ic("mail")}${esc(t("daifa").replace("{p}", c.phone))}</a>` : "";
    const offs = offFor(b.id).filter(o => !q || [o.t, o.te, o.area, o.bz, o.be, o.az].join(" ").toLowerCase().includes(q));
    const items = list.map(p => pitemHtml(p, false)).concat(offs.map(offItem));
    $("#bList").innerHTML = items.length ? items.map((h, i) => h + ((i + 1) % 6 === 0 ? feedAd(i / 6 | 0) : "")).join("") + (items.length < 6 ? feedAd(0) : "") :
      `<li><div class="empty">${q ? esc(t("noMatch")) : esc(t("noPosts")) + `<button type="button" class="linkbtn" data-postto="${b.id}">${esc(t("beFirst"))}</button>`}</div></li>`;
  }
  function renderSearch() {
    const q = searchQ.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const hit = hay => words.length && words.every(w => hay.toLowerCase().includes(w));
    const list = words.length ? posts.filter(p => hit([p.title, p.area, p.body, p.contact, bName(boardById(p.board))].join(" "))) : [];
    // Also search the benefits guides and today's news, so "白卡" or "绿卡" finds something useful.
    const gl = (guides && guides.guides || []).filter(g => hit([HLG.L(g.title, lang), HLG.L(g.short, lang), HLG.L(g.summary, lang), g.id].join(" "))).slice(0, 6);
    const seen = new Set();
    const nl = SECTIONS.flatMap(s => sec(s)).filter(i => { const k = i.id || i.u; if (seen.has(k)) return false; seen.add(k); return hit([disp(i), dsum(i)].join(" ")); }).slice(0, 10);
    const ol = words.length ? offAll().filter(o => hit([o.t, o.te, o.area, o.az, o.ae, o.bz].join(" "))).slice(0, 20) : [];
    const total = list.length + gl.length + nl.length + ol.length;
    $("#sTitle").textContent = `${t("searchFor")}${searchQ} · ${total} ${t("results")}`;
    $("#sList").innerHTML =
      (gl.length ? `<li class="s-sec"><h2>${esc(t("sGuides"))}</h2><div class="g-home-r">${gl.map(g => `<a class="g-chip" href="#g-${esc(g.id)}"><span class="seal sm" aria-hidden="true">${esc(g.glyph || "指")}</span>${esc(HLG.L(g.title, lang))}</a>`).join("")}</div></li>` : "") +
      (nl.length ? `<li class="s-sec"><h2>${esc(t("sNews"))}</h2><ul class="nl">${nl.map(x => liHtml(x, false)).join("")}</ul></li>` : "") +
      (list.length || ol.length ? `<li class="s-sec"><h2>${esc(t("sPosts"))}</h2></li>` + list.map(p => pitemHtml(p, true)).join("") + ol.map(offItem).join("") : "") +
      (total ? "" : `<li><div class="empty">${esc(t("noMatch"))}</div></li>`);
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
      if (g) document.title = HLG.L(g.title, lang) + " - 华脉";
    }
    if (route.view === "check") restoreCheck();
  }
  $("#gShareTop").onclick = () => $("#gShare").click();
  $("#gShare").onclick = () => {
    const g = guides && guides.guides.find(x => x.id === route.id); if (!g) return;
    HLShare.open({ url: HLC.siteBase() + "g/" + g.id + "/", title: HLG.L(g.title, lang) + " - 华脉", text: HLG.L(g.title, lang) + " - 华脉生活指南" });
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
    $("#ckOut").innerHTML = `<div class="spons mid">${liveSlots("section").slice(0, 2).map(x => adCard(x, "sm")).join("") || emptyAd(true) + emptyAd(true)}</div><section class="ck-res">${head}${rows ? `<h2>${esc(t("ckHeads"))}</h2><ul>${rows}</ul>` : `<p>${esc(t("ckNone"))}</p>`}<p class="g-fine">${esc(t("ckFoot"))}</p><button type="button" class="btn" id="ckShare">${esc(t("ckShare"))}</button></section>`;
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
    const ds = Object.fromEntries(Object.entries((deals && deals.sections) || {}).map(([k, v]) => [k, (v || []).filter(zhOk)]));
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
      ${zhView ? `<div class="post-actions"><a class="btn" href="${esc(readUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("zhDetail"))}</a><a class="btn ghost" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("enOrig"))}</a></div><p class="g-fine">${esc(t("zhDetailNote"))}</p>` : ""}
      ${i.fr && !i.full && !zhView ? `<div class="inline-read"><div class="ir-bar"><span>${esc(t("irNote").replace("{src}", src))}</span><button type="button" class="linkbtn" id="aRead">${esc(t("irFull"))}</button></div><iframe class="ir-frame" src="${esc(safeUrl(i.u))}" title="${esc(i.t)}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin"></iframe></div>` : ""}
      <div class="post-actions"${zhView ? " hidden" : ""}>${i.full ? `<a class="btn ghost" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("offLink"))}</a>` : i.fr ? `<a class="btn ghost" href="${esc(safeUrl(i.u))}" data-reader="${esc(safeUrl(i.u))}" data-src="${esc(src)}">${esc(t("irFull"))}</a>` : `<a class="btn" href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer">${esc(t("readAt").replace("{src}", src))}</a>`}<button type="button" class="btn ghost" id="aShare">${esc(t("share"))}</button></div>
      <p class="g-fine">${esc(t("artCopy").replace("{src}", src))}</p>
      ${recNewsHtml(i, sname)}
      <div class="spons mid art-ad">${liveSlots("article").slice(1, 3).map(x => adCard(x, "sm")).join("") || emptyAd(true) + emptyAd(true)}</div>`;
    document.title = i.t + " - 华脉";
    const others = (news.sections[hit.lg][sname] || []).filter(x => x !== i).slice(0, 10);
    $("#aSide").innerHTML = `<div class="spon-rail">${liveSlots("article").slice(0, 1).map(x => adCard(x)).join("") || emptyAd()}</div><section class="block"><div class="bh"><h2>${esc(t("moreNews").replace("{s}", secName(sname)))}</h2></div><ul class="nl">${others.map(x => liHtml(x, false, !!x.img)).join("")}</ul></section>
      <a class="g-check-cta" href="#check"><b>${esc(t("gCheckH"))}</b><span>${esc(t("gCheckP"))}</span></a>`;
    const rd = $("#aRead"); if (rd) rd.onclick = () => openReader(i, src);
    if (i.full) getJSON("data/full/" + i.id + ".json").then(f => {
      const box = $("#aFull"); if (!box || route.id !== i.id) return;
      const useZh = lang === "zh" && f.body_zh && !box.dataset.en;
      const body = useZh ? f.body_zh : (f.body || []);
      box.innerHTML = (useZh || f.body_zh ? `<p><button type="button" class="linkbtn" id="aLangSw">${esc(useZh ? t("showEn") : t("showZh"))}</button></p>` : "") + body.map(b => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : b.startsWith("• ") ? `<p class="li">${esc(b)}</p>` : `<p>${esc(b)}</p>`).join("");
      const sw = $("#aLangSw"); if (sw) sw.onclick = () => { if (box.dataset.en) delete box.dataset.en; else box.dataset.en = "1"; renderArticle(); };
    }).catch(() => { const box = $("#aFull"); if (box) box.innerHTML = ""; });
    $("#aShare").onclick = () => HLShare.open({ url: HLC.siteBase() + "n/" + i.id + "/", title: i.t, text: i.t + " - 华脉" });
    renderComments(i.id);
  }
  // Comments under news stories: anyone can read and post (guests too), with a nickname.
  async function renderComments(id) {
    if (!POSTS_ON) return;
    let box = $("#aCm");
    if (!box) { $("#aBody").insertAdjacentHTML("beforeend", `<section class="cm" id="aCm"></section>`); box = $("#aCm"); }
    box.dataset.id = id;
    const signed = A && A.user();
    box.innerHTML = `<h2>${esc(t("cmH"))}</h2><form class="cm-form" id="cmForm">${signed ? "" : `<input id="cmName" maxlength="20" placeholder="${esc(t("cmNamePh"))}" autocomplete="nickname">`}<textarea id="cmBody" maxlength="500" rows="3" placeholder="${esc(t("cmPh"))}" required></textarea><div class="cm-row"><span class="cm-err" id="cmErr" role="alert"></span><button class="btn sm" type="submit">${esc(t("cmSend"))}</button></div></form><ul class="cm-list" id="cmList"><li class="muted">${esc(t("loading"))}</li></ul>`;
    try { const nm = localStorage.getItem("hl-cmname"); if (nm && $("#cmName")) $("#cmName").value = nm; } catch (e) {}
    const load = async () => {
      try {
        const r = await fetch(SB_URL + "/rest/v1/news_comments?select=id,author,body,created_at&news_id=eq." + encodeURIComponent(id) + "&order=created_at.desc&limit=100", { headers: sbHeaders() });
        const list = r.ok ? await r.json() : [];
        if (box.dataset.id !== id) return;
        $("#cmList").innerHTML = list.length ? list.map(c => `<li><div class="cm-meta"><b>${esc(c.author)}</b><span>${esc(ago(c.created_at))}</span></div><p>${esc(c.body)}</p></li>`).join("") : `<li class="muted">${esc(t("cmNone"))}</li>`;
      } catch (e) { $("#cmList").innerHTML = ""; }
    };
    load();
    $("#cmForm").onsubmit = async e => {
      e.preventDefault();
      const body = $("#cmBody").value.trim(), name = $("#cmName") ? $("#cmName").value.trim() : "";
      if (!body) return;
      const btn = e.target.querySelector("button"); btn.disabled = true; $("#cmErr").textContent = "";
      try {
        await HLC.rpc("add_news_comment", { p_news: id, p_body: body, p_name: name });
        try { if (name) localStorage.setItem("hl-cmname", name); } catch (er) {}
        $("#cmBody").value = ""; toast(t("cmOk")); load();
      } catch (er) { const m = String(er.message || ""); $("#cmErr").textContent = t(/too_many/.test(m) ? "cmFlood" : /banned/.test(m) ? "cmBanned" : "cmFail"); }
      btn.disabled = false;
    };
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
  // In the Chinese version, only show deals that have a Chinese title (English-only ones wait until they're translated).
  function zhOk(i) { return lang !== "zh" || !!i.tz || /[\u4e00-\u9fff]/.test(i.t || ""); }
  function dealLi(i, en) {
    const title = lang === "zh" && i.tz ? i.tz : i.t;
    const showEn = en && !(lang === "zh" && i.tz) && lang === "zh";
    const link = i.id ? `href="#a-${esc(i.id)}"` : `href="${esc(safeUrl(i.u))}" target="_blank" rel="noopener noreferrer"`;
    return `<li><a class="t" ${link}>${showEn ? `<span class="en-tag">${esc(t("dl_en"))}</span>` : ""}${esc(title)}</a>${metaHtml(i)}</li>`;
  }
  function localDeals() { return posts.filter(p => p.board === "deals"); }
  function renderDeals() {
    const box = $("#dealsHome"); if (!box) return;
    const ds = Object.fromEntries(Object.entries((deals && deals.sections) || {}).map(([k, v]) => [k, (v || []).filter(zhOk)]));
    const local = localDeals().slice(0, 5);
    const zhIds = new Set((ds.zh || []).map(i => i.u));
    const biz = (ds.biz || []).filter(i => !zhIds.has(i.u)).slice(0, Math.max(0, 5 - local.length));
    const cols = [];
    cols.push(`<section class="block dcol"><div class="bh"><h2>${esc(t("dl_local"))}</h2><a href="#deals">${esc(t("more"))}</a></div>${local.length ? `<ul class="rows">${local.map(p => rowHtml(p, false)).join("")}</ul>` : ""}${biz.length ? `<ul class="nl">${biz.map(i => dealLi(i, false)).join("")}</ul>` : ""}<button type="button" class="linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></section>`);
    for (const k of DEAL_SECS) {
      const list = (ds[k] || []).slice(0, 5);
      if (!list.length) continue;
      cols.push(`<section class="block dcol"><div class="bh"><h2>${esc(t("dl_" + k))}</h2><a href="#deals">${esc(t("more"))}</a></div><ul class="nl">${list.map(i => dealLi(i, k !== "zh")).join("")}</ul></section>`);
    }
    $("#dealsGrid").innerHTML = cols.join("");
    box.hidden = false;
    if (route.view === "deals") {
      const all = localDeals();
      const bizAll = ds.biz || [];
      $("#dealsFull").innerHTML = `<section class="block"><div class="bh"><h2>${esc(t("dl_local"))}</h2><button type="button" class="linkbtn" data-postto="deals">${esc(t("dl_postCta"))}</button></div>${all.length ? `<ul class="plist">${all.map(p => pitemHtml(p, false)).join("")}</ul>` : ""}${bizAll.length ? `<ul class="nl full">${bizAll.map(i => dealLi(i, false)).join("")}</ul>` : ""}${!all.length && !bizAll.length ? `<p class="empty">${esc(t("dl_none"))}</p>` : ""}</section>` +
        DEAL_SECS.map(k => `<section class="block"><div class="bh"><h2>${esc(t("dl_" + k))}</h2></div>${(ds[k] || []).length ? `<ul class="nl full">${withAds(ds[k].map(i => dealLi(i, k !== "zh")), 6)}</ul>` : `<p class="empty">${esc(t("dl_none"))}</p>`}</section>`).join("");
    }
  }

  function renderDisc() {
    const rich = v => esc(v).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const pg = route.page && HLC.PAGES && HLC.PAGES[route.page];
    if (pg) {
      const x = pg[lang] || pg.zh, c = CFG.adContact || {};
      const fill = v => v.replace(/\{phone\}/g, c.phone ? c.phone + (lang === "zh" ? "" : "") : "—").replace(/\{email\}/g, CFG.contactEmail || "—");
      document.title = x.title + " - " + (lang === "zh" ? "华脉" : "HuaMai");
      $("#discBody").innerHTML = `<div class="g-head"><span class="seal md" aria-hidden="true">${esc(pg.seal[lang] || pg.seal.zh)}</span><div><h1>${esc(x.title)}</h1><p class="g-sum">${esc(fill(x.intro))}</p></div></div>` +
        x.items.map(([h, p]) => `<section><h2>${esc(h)}</h2>${fill(p).split("\n").map(l => `<p>${rich(l)}</p>`).join("")}</section>`).join("") +
        `<p class="g-fine">${esc(t("discUpdated"))} ${esc(HLC.PAGES_UPDATED)}</p>`;
      return;
    }
    const d = HLC.DISCLAIMER, x = d[lang] || d.zh;
    $("#discBody").innerHTML = `<div class="g-head"><span class="seal md" aria-hidden="true">${lang === "zh" ? "责" : "!"}</span><div><h1>${esc(x.title)}</h1><p class="g-sum">${esc(x.intro)}</p></div></div>` +
      x.items.map(([h, p], i) => `<section><h2>${i + 1}. ${esc(h)}</h2><p>${rich(p)}</p></section>`).join("") +
      `<p class="g-fine">${esc(t("discUpdated"))} ${esc(d.updated)}</p>`;
  }

  document.querySelectorAll("main.view").forEach(m => {
    if (["vBoard", "vGuideOne", "vArticle", "vMe"].includes(m.id)) return;
    const vh = m.querySelector(".vh"); if (!vh) return;
    const sec = document.createElement("section"); sec.className = "spons mid view-ad"; sec.setAttribute("aria-label", "Sponsors");
    vh.after(sec);
  });
  /* ---------- comfort: text size (3 steps, remembered) and a tuck-away search box on phones ---------- */
  const FZ = [1, 1.12, 1.25];
  let fz = 0; try { fz = Math.min(2, Number(localStorage.getItem("hl-fz")) || 0); } catch (e) {}
  function applyFz() { document.documentElement.style.setProperty("--fz", FZ[fz]); document.documentElement.dataset.fz = fz; $("#fzBtn").setAttribute("aria-label", t("fzNames")[fz]); }
  $("#fzBtn").onclick = () => { fz = (fz + 1) % FZ.length; try { localStorage.setItem("hl-fz", fz); } catch (e) {} applyFz(); toast(t("fzNames")[fz]); };
  applyFz();
  $("#searchTg").onclick = () => { const m = document.querySelector(".mast"); const open = !m.classList.contains("search-open"); m.classList.toggle("search-open", open); $("#searchTg").setAttribute("aria-expanded", String(open)); if (open) setTimeout(() => $("#q").focus(), 30); };

  /* ---------- launch screen: remove it after it fades so it never blocks taps ---------- */
  if (document.documentElement.classList.contains("hl-launch")) {
    setTimeout(() => { document.documentElement.classList.remove("hl-launch"); const sp = $("#splash"); if (sp) sp.remove(); }, document.documentElement.classList.contains("hl-quick") ? 2400 : 5000);
    $("#splash").addEventListener("click", () => { document.documentElement.classList.remove("hl-launch"); });
  }
  /* ---------- app install (PWA) ---------- */
  const isApp = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true || /HuaLinApp/.test(navigator.userAgent);
  const APK = "https://github.com/hualinwang-us/hualinwang-us.github.io/releases/latest/download/hualin.apk";
  const isAndroid = /Android/i.test(navigator.userAgent);
  const UA = navigator.userAgent, isIOS = /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1), isWx = /MicroMessenger/i.test(UA), isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || isIOS;
  let installEvt = null;
  if ("serviceWorker" in navigator && location.protocol === "https:") { window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); }); }
  function showAppUI() {
    const can = !isApp && (installEvt || isMobile);
    $("#appBtn").hidden = !can;
    let off = false; try { off = localStorage.getItem("hl-appbar") === "off"; } catch (e) {}
    const bar = $("#appBar");
    if (bar) bar.hidden = true; // install banner removed; the download page is linked from the top "安装App" button and the footer
  }
  function appSteps(h, steps, apk) {
    $("#viewBody").innerHTML = `<button type="button" class="x" data-close aria-label="Close">×</button><div class="app-help"><img src="icons/icon-192.png" alt="" width="56" height="56"><h3>${esc(h)}</h3>${apk ? `<a class="btn" href="${APK}">${esc(t("apkBtn"))}</a><p class="g-fine">${esc(t("apkNote"))}</p><p class="app-or">${esc(t("apkOr"))}</p>` : ""}<ol>${steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol><button type="button" class="btn ghost" data-close>${esc(t("appDone"))}</button></div>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
  }
  /* ---------- App 下载 page: Android APK + iPhone home-screen app ---------- */
  let apkVer = "";
  function renderAppDl() {
    const el = $("#appDlBody"); if (!el) return;
    document.title = "华脉 App 下载 - 安卓 / iPhone";
    const and = `<section class="ad-card${isIOS ? "" : " mine"}"><div class="ad-top"><span class="ad-os">🤖</span><div><h2>安卓手机</h2><p>APK 直接安装${apkVer ? ` · 最新版本 ${esc(apkVer)}` : ""}</p></div></div>
      <a class="btn ad-btn" href="${APK}">⬇ 下载安卓 App（APK）</a>
      <ol class="ad-steps"><li>点上面的按钮下载</li><li>下载完点开文件，选「安装」</li><li>手机问「允许安装未知应用」，选允许</li><li>如果出现 Google Play 保护提示，点「扫描应用」或「仍然安装」</li><li>桌面出现华脉图标，就装好了</li></ol></section>`;
    const ios = `<section class="ad-card${isIOS ? " mine" : ""}"><div class="ad-top"><span class="ad-os">🍎</span><div><h2>苹果 iPhone</h2><p>添加到主屏幕 · 免费 · 不用下载</p></div></div>
      ${isIOS && !isWx ? `<button type="button" class="btn ad-btn" data-ios-help>📲 一步步教我装</button>` : `<p class="ad-hint">${isWx ? "请先点右上角 ··· 选「在浏览器打开」，用 Safari 打开 huamai88.com" : "请用 iPhone 的 Safari 浏览器打开 huamai88.com"}</p>`}
      <ol class="ad-steps"><li>用 <b>Safari</b> 打开 huamai88.com（微信里先点右上角 ··· 选「在浏览器打开」）</li><li>点屏幕最下方的 <b>分享按钮</b> <svg class="ad-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v9h14v-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>（方框加向上箭头）</li><li>往下滑，点 <b>「添加到主屏幕」</b></li><li>点右上角 <b>「添加」</b></li><li>桌面出现华脉图标，以后从图标打开就是 App</li></ol></section>`;
    el.innerHTML = `<div class="ad-grid">${isIOS ? ios + and : and + ios}</div>
      <p class="tl-note">分享给亲友：把 huamai88.com/#app 发到微信群，他们点开就能看到怎么装。</p>`;
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-ios-help]")) appSteps(t("appIosH"), t("appIosSteps")); });
  async function installApp() {
    if (location.hash !== "#app") { location.hash = "#app"; return; }
    if (isAndroid && !isWx) return appSteps(t("appAndH"), t("appAndSteps"), true);
    if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; showAppUI(); return; }
    if (isWx) return appSteps(t("appWxH"), t("appWxSteps"));
    if (isIOS) return appSteps(t("appIosH"), t("appIosSteps"));
    appSteps(t("appAndH"), t("appAndSteps"));
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; showAppUI(); });
  window.addEventListener("appinstalled", () => { installEvt = null; $("#appBtn").hidden = true; const b = $("#appBar"); if (b) b.hidden = true; });
  $("#appBtn").onclick = installApp;
  document.addEventListener("click", e => {
    if (e.target.closest("[data-app-install]")) installApp();
    if (e.target.closest("[data-app-later]")) { try { localStorage.setItem("hl-appbar", "off"); } catch (er) {} $("#appBar").hidden = true; }
  });
  showAppUI();

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
    else if (HLC.PAGES && HLC.PAGES[h]) route = { view: "disc", page: h };
    else if (h === "advertise") route = { view: "ads" };
    else if (h === "flyer") route = { view: "flyer" };
    else if (h === "stocks") route = { view: "stocks" };
    else if (h === "me") route = { view: "me" };
    else if (h === "yp" || h.startsWith("yp-")) route = { view: "yp", cat: h.slice(3) };
    else if (h === "deals") route = { view: "deals" };
    else if (h === "app") route = { view: "appdl" };
    else if (h === "chaoshi" || h.startsWith("cs-")) route = { view: "chaoshi", store: h.startsWith("cs-") ? h.slice(3) : "" };
    else if (h === "city") route = { view: "city" };
    else if (h === "events") route = { view: "events" };
    else if (h === "travel" || h === "travel-near" || h === "travel-usa" || h.startsWith("tr-")) route = { view: "travel", area: h.startsWith("travel-") ? h.slice(7) : "", trip: h.startsWith("tr-") ? h.slice(3) : "" };
    else if (h === "tools" || h.startsWith("tools-") || h.startsWith("t-")) route = { view: "tools", cat: h.startsWith("tools-") ? h.slice(6) : "", tool: h.startsWith("t-") ? h.slice(2) : "" };
    else if (h.startsWith("a-")) route = { view: "article", id: h.slice(2) };
    else route = { view: "home" };
    document.title = BASE_TITLE;
    $("#vHome").hidden = route.view !== "home"; $("#vBoard").hidden = route.view !== "board";
    $("#vNews").hidden = route.view !== "news"; $("#vSearch").hidden = route.view !== "search";
    $("#vArticle").hidden = route.view !== "article"; if (route.view === "article") renderArticle();
    $("#vDeals").hidden = route.view !== "deals"; if (route.view === "deals") renderDeals();
    $("#vAppDl").hidden = route.view !== "appdl"; if (route.view === "appdl") renderAppDl();
    $("#vChaoshi").hidden = route.view !== "chaoshi"; if (route.view === "chaoshi" && window.HLChaoshi) { HLChaoshi.render($("#csBody"), route.store); document.title = "华人超市特价单 - 纽约华人超市本周 flyer｜华脉"; }
    $("#vCity").hidden = route.view !== "city"; if (route.view === "city") renderCity();
    $("#vEvents").hidden = route.view !== "events"; if (route.view === "events") renderEvents();
    $("#vTools").hidden = route.view !== "tools"; if (route.view === "tools") renderTools();
    $("#vTravel").hidden = route.view !== "travel"; if (route.view === "travel") renderTravel();
    $("#vDisc").hidden = route.view !== "disc"; if (route.view === "disc") renderDisc();
    $("#vAds").hidden = route.view !== "ads"; if (route.view === "ads") renderAdsPage();
    $("#vFlyer").hidden = route.view !== "flyer"; if (route.view === "flyer") renderFlyer();
    $("#vMe").hidden = route.view !== "me"; if (route.view === "me") renderMe();
    $("#vStocks").hidden = route.view !== "stocks"; if (route.view === "stocks") renderStocks();
    $("#vYP").hidden = route.view !== "yp"; if (route.view === "yp") { $("#ypQ").value = ""; renderYP(); loadBiz(); }
    $("#vGuide").hidden = route.view !== "guide"; $("#vGuideOne").hidden = route.view !== "guideOne"; $("#vCheck").hidden = route.view !== "check";
    if (route.view === "guide" || route.view === "guideOne" || route.view === "check") renderGuides();
    if (route.view === "board") { $("#bFilter").value = ""; $("#bArea").innerHTML = `<option value="">${esc(t("bAllAreas"))}</option>` + AREAS.map(([z, e]) => `<option value="${esc(z)}">${esc(lang === "zh" ? z : e)}</option>`).join(""); $("#bToday").checked = false; if (curArea && AREAS.some(a => a[0] === curArea)) $("#bArea").value = curArea; renderBoard(); renderAreaChips(); }
    if (route.view === "news") renderNewsView();
    if (route.view === "search") renderSearch();
    renderTabs();
    countView();
    const bn = route.view === "home" ? "home" : (route.view === "city" || route.view === "board" || route.view === "yp") ? "city" : (route.view === "chaoshi" || route.view === "deals") ? "sale" : route.view === "tools" ? "tools" : ["guide", "guideOne", "check"].includes(route.view) ? "guide" : (route.view === "deals" || route.view === "chaoshi") ? "deals" : route.view === "me" ? "me" : "";
    document.querySelectorAll("#bnav [data-bn]").forEach(a => a.classList.toggle("on", a.dataset.bn === bn));
    const fh = $("#fabHome"); if (fh) fh.hidden = route.view === "home";
    if (h === "classifieds") { const el = document.querySelector(".boards-sec"); if (el) el.scrollIntoView({ block: "start" }); }
    else if (route.view !== "home" || h === "") window.scrollTo(0, 0);
  }

  /* ---------- anonymous page-view count (which page, app or web; nothing personal) ---------- */
  let lastHit = "";
  function countView() {
    const r = route, id = r.board || r.tool || r.store || r.sec || r.cat || r.trip || "";
    const path = (r.view === "home" ? "home" : r.view + (id ? "-" + id : "")).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (!POSTS_ON || path === lastHit || /[?&]nohit/.test(location.search)) return;
    lastHit = path;
    setTimeout(() => { try { HLC.rpc("hit", { p_path: path, p_app: IS_APP }).catch(() => {}); } catch (e) {} }, 400);
  }

  /* ---------- post detail ---------- */
  /* ---------- share image for a listing ---------- */
  async function openPoster(p, url) {
    const b = boardById(p.board), btn = $("#posterBtn");
    if (btn) { btn.disabled = true; btn.textContent = t("pstMaking"); }
    let canvas;
    try { canvas = await window.HLPoster.make(p, { url, board: bName(b) }); }
    catch (e) { toast(t("pstFail")); if (btn) { btn.disabled = false; btn.innerHTML = ic("image") + esc(t("pstBtn")); } return; }
    let data = ""; try { data = canvas.toDataURL("image/jpeg", 0.9); } catch (e) { toast(t("pstFail")); return; }
    const name = "hualin-" + p.id + ".jpg";
    $("#viewBody").innerHTML = `<button type="button" class="x" data-close aria-label="Close">×</button>
      <h3>${esc(t("pstH"))}</h3><p class="warn">${esc(t("pstTip"))}</p>
      <img class="pst-img" src="${data}" alt="${esc(p.title)}">
      <div class="post-actions"><button type="button" class="btn wx-btn" id="pstShare"><span aria-hidden="true">微</span> ${esc(t("pstShare"))}</button><a class="btn ghost" id="pstSave" href="${data}" download="${name}">${esc(t("pstSave"))}</a><button type="button" class="btn ghost" data-pid="${p.id}">← ${esc(p.title.slice(0, 10))}</button></div>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
    const app = window.HuaLinApp;
    $("#pstSave").onclick = e => { if (app && app.saveImage) { e.preventDefault(); try { app.saveImage(data, name, window.__hlt || ""); toast(t("pstSaved")); } catch (er) {} } };
    $("#pstShare").onclick = async () => {
      if (app && app.shareImage) { try { app.shareImage(data, name, p.title + " " + url, window.__hlt || ""); return; } catch (er) {} }
      try {
        const blob = await (await fetch(data)).blob(); const file = new File([blob], name, { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: p.title + " " + url }); return; }
      } catch (er) { if (er && er.name === "AbortError") return; }
      $("#pstSave").click();
    };
  }
  /* ---------- replies under a listing ---------- */
  async function loadReplies(p) {
    const list = $("#rpList"), form = $("#rpForm"); if (!list) return;
    const signed = A && A.user();
    form.innerHTML = !POSTS_ON ? "" : signed
      ? `<textarea id="rpText" maxlength="1000" rows="3" placeholder="${esc(t("rpPh"))}"></textarea><button type="button" class="btn" id="rpSend">${esc(t("rpSend"))}</button>`
      : `<button type="button" class="btn ghost" id="rpLogin">${esc(t("rpLogin"))}</button>`;
    if (!signed && $("#rpLogin")) $("#rpLogin").onclick = () => { afterLogin = () => openPost(p.id); $("#viewDlg").close(); openLogin(t("rpLogin")); };
    let rows = [], mine = new Set();
    try {
      const r = await fetch(SB_URL + "/rest/v1/post_replies?select=id,created_at,author,body&post_id=eq." + encodeURIComponent(p.id) + "&order=created_at.asc&limit=300", { headers: sbHeaders() });
      if (!r.ok) throw new Error(r.status);
      rows = await r.json();
      if (signed && rows.length) { try { (await HLC.rpc("my_reply_ids", { p_post: p.id }) || []).forEach(x => mine.add(typeof x === "object" ? Object.values(x)[0] : x)); } catch (e) {} }
    } catch (e) { list.innerHTML = `<p class="muted">${esc(t("rpOff"))}</p>`; form.innerHTML = ""; return; }
    if (!$("#rpList")) return;
    $("#rpN").textContent = rows.length ? "· " + t("rpCount").replace("{n}", rows.length) : "";
    list.innerHTML = rows.length ? rows.map(r => `<div class="rp"><div class="rp-h"><b>${esc(r.author)}</b><span>${esc(ago(r.created_at))}</span>${mine.has(r.id) ? `<button type="button" class="linkbtn rp-del" data-rpdel="${r.id}">${esc(t("rpDel"))}</button>` : ""}</div><p>${esc(r.body)}</p></div>`).join("") : `<p class="muted">${esc(t("rpNone"))}</p>`;
    list.querySelectorAll("[data-rpdel]").forEach(b => b.onclick = async () => { b.disabled = true; try { await HLC.rpc("delete_my_reply", { p_id: Number(b.dataset.rpdel) }); toast(t("rpDeleted")); loadReplies(p); } catch (e) { b.disabled = false; } });
    const send = $("#rpSend");
    if (send) send.onclick = async () => {
      const body = $("#rpText").value.trim(); if (!body) return;
      if (HLC.BANNED.test(body)) { toast(t("eBanned")); return; }
      send.disabled = true;
      try { await HLC.rpc("add_reply", { p_post: p.id, p_body: body }); toast(t("rpOk")); loadReplies(p); }
      catch (e) { send.disabled = false; toast(/too_many/.test(String(e.message) + String(e.raw || "")) ? t("rpTooMany") : t("rpFail")); }
    };
  }
  /* ---------- my page: my listings and my replies ---------- */
  async function renderMe() {
    const box = $("#meBody"); const u = A && A.user();
    if (!u) { box.innerHTML = `<section class="block me-empty"><h1>${esc(t("meH"))}</h1><p>${esc(t("meLogin"))}</p><button type="button" class="btn" id="meLoginBtn">${esc(t("meLoginBtn"))}</button></section>`; $("#meLoginBtn").onclick = () => { afterLogin = () => { location.hash = "me"; renderMe(); }; openLogin(); }; return; }
    await loadMine();
    const mineP = posts.filter(p => myIds.has(p.id) || myIds.has(String(p.id)) || keys.get(p.id));
    box.innerHTML = `<section class="block me-head"><span class="me-av" aria-hidden="true">${esc((u.name || u.email || "我").slice(0, 1).toUpperCase())}</span><div><h1>${esc(u.name || u.email.split("@")[0])}</h1><p>${esc(u.email)}</p></div>
        <div class="me-acts"><button type="button" class="btn ghost sm" id="meShare">${esc(t("meShare"))}</button><button type="button" class="btn ghost sm" id="meOut">${esc(t("meOut"))}</button></div></section>
      <section class="block"><div class="bh"><h2>${esc(t("mePosts"))} <small>${mineP.length || ""}</small></h2><button type="button" class="linkbtn" data-post>${esc(t("mePostNow"))}</button></div>
        ${mineP.length ? `<ul class="plist">${mineP.map(p => pitemHtml(p, true)).join("")}</ul>` : `<p class="muted">${esc(t("meNoPosts"))}</p>`}</section>
      <section class="block"><div class="bh"><h2>${esc(t("meReplies"))}</h2></div><div id="meReplies"><p class="muted">${esc(t("loading"))}</p></div></section>`;
    $("#meOut").onclick = async () => { await A.signOut(); toast(t("lgOut")); renderMe(); };
    $("#meShare").onclick = shareCurrent;
    try {
      const rs = await HLC.rpc("my_replies", {});
      $("#meReplies").innerHTML = (rs || []).length ? `<ul class="me-rp">${rs.map(r => { const p = posts.find(x => String(x.id) === String(r.post_id)); return `<li>${p ? `<button type="button" class="linkbtn" data-pid="${p.id}">${esc(p.title)}</button>` : `<span class="muted">${esc(t("meGone"))}</span>`}<p>${esc(t("meReplyTo"))}${esc(r.body)}</p><span class="muted">${esc(ago(r.created_at))}</span></li>`; }).join("")}</ul>` : `<p class="muted">${esc(t("meNoReplies"))}</p>`;
    } catch (e) { $("#meReplies").innerHTML = `<p class="muted">${esc(t("meNoReplies"))}</p>`; }
  }
  // "More listings" under a listing: same board first, then the newest anywhere.
  function recPostsHtml(p) {
    const same = posts.filter(x => x.board === p.board && x.id !== p.id).slice(0, 4);
    const rest = posts.filter(x => x.id !== p.id && !same.includes(x)).slice(0, 6 - same.length);
    if (!same.length && !rest.length) return "";
    const b = boardById(p.board);
    return `<section class="rec"><h4>${esc(same.length ? t("recSame").replace("{b}", bName(b)) : t("recPosts"))}</h4><ul class="rows">${same.concat(rest).map(x => rowHtml(x, true)).join("")}</ul></section>`;
  }
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
      ${(p.images || []).length ? `<div class="gallery">${p.images.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join("")}</div>` : ""}
      <div class="contact"><b>${esc(t("contact"))}</b>${p.contact ? `<span>${esc(p.contact)}</span>` : ""}
        ${p.phone ? `<span>${esc(t("phone"))} <span class="v" id="cpP">${esc(p.phone)}</span></span><button type="button" class="copy" data-copy="cpP">${esc(t("copy"))}</button>${tel.length >= 7 ? `<a class="copy call" href="tel:${esc(tel)}">${esc(t("call"))}</a>` : ""}` : ""}
        ${p.wechat ? `<span>${esc(t("wx"))} <span class="v" id="cpW">${esc(p.wechat)}</span></span><button type="button" class="copy" data-copy="cpW">${esc(t("copy"))}</button>` : ""}</div>
      ${p.board === "dating" ? `<div class="scam" role="note"><p>${esc(t("datingRules"))}</p></div>` : ""}
      ${hits.length ? `<div class="scam" role="note"><b>${esc(t("scamH"))}</b><p>${esc(t("scamP").replace("{x}", hitText))}</p></div>` : `<p class="warn">${esc(t("safety"))}</p>`}
      <p class="warn">${esc(t("postDisc"))} <a class="flink" href="#disclaimer" data-close>${esc(t("footLegal"))}</a></p>
      <div class="post-actions">
        <button type="button" class="btn" id="shareBtn">${esc(t("share"))}</button>
        <button type="button" class="btn pst-btn" id="posterBtn">${ic("image")}${esc(t("pstBtn"))}</button>
        <button type="button" class="btn ghost" id="repBtn">${esc(t("report"))}</button>
        ${myKey || mineAcct ? `<button type="button" class="btn ghost" id="delBtn">${esc(t("del"))}</button>` : ""}
      </div>
      <div class="manual" id="manualBox" hidden><span>${esc(t("shareManual"))}</span><input readonly value="${esc(url)}" aria-label="${esc(t("pageLink"))}"></div>
      <section class="replies" id="rpBox"><h4>${esc(t("rpH"))} <span id="rpN"></span></h4><div id="rpList"><p class="muted">${esc(t("loading"))}</p></div>
        <div class="rp-form" id="rpForm"></div></section>
      ${recPostsHtml(p)}
      <div class="dlg-ad">${liveSlots("feed").slice(0, 1).map(x => adCard(x, "sm")).join("") || emptyAd(true)}</div>
      <div class="reasons" id="repBox" hidden><b>${esc(t("reportH"))}</b>
        ${HLC.REPORT_REASONS.map(([k, zh, en], i) => `<label><input type="radio" name="rr" value="${k}" ${i === 0 ? "checked" : ""}> ${esc(lang === "zh" ? zh : en)}</label>`).join("")}
        <button type="button" class="btn" id="repSend">${esc(t("reportSend"))}</button></div>`;
    const dlg = $("#viewDlg"); if (!dlg.open) dlg.showModal();
    loadReplies(p);
    $("#posterBtn").onclick = () => openPoster(p, url);
    if (opts.justPosted) setTimeout(() => { const b = $("#posterBtn"); if (b) b.classList.add("pulse"); }, 300);
    $("#shareBtn").onclick = () => HLShare.open({ url, title: (p.area ? "[" + p.area + "] " : "") + p.title, text: (p.area ? "[" + p.area + "] " : "") + p.title + " - 华脉" });
    $("#repBtn").onclick = () => {
      if (HLC.reported.get(p.id)) { toast(t("alreadyReported")); return; }
      if (A && LOGIN_ON && !A.user()) { afterLogin = () => openPost(p.id); $("#viewDlg").close(); openLogin(t("repLogin")); return; }
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
    if (u) $("#userName").textContent = u.name || u.email;
  }
  async function loadMine() {
    myIds = new Set();
    if (!A || !A.user() || !POSTS_ON) return;
    try { const ids = await HLC.rpc("my_post_ids", {}); (ids || []).forEach(x => myIds.add(typeof x === "object" ? Object.values(x)[0] : x)); } catch (e) {}
  }
  let guestOk = false;
  function lgMode(m) {
    document.querySelectorAll("#loginDlg [data-pane]").forEach(p => (p.hidden = !CFG.loginEmail || p.dataset.pane !== m));
    document.querySelectorAll("#lgTabs [data-lgmode]").forEach(b => b.classList.toggle("on", b.dataset.lgmode === m));
    $("#lgTabs").hidden = !CFG.loginEmail || m === "code" || m === "forgot";
    $("#lgErr").textContent = "";
  }
  function openLogin(why, offerGuest) {
    lgMode("in"); $("#lgFgStep2").hidden = true;
    $("#lgGuest").hidden = !offerGuest;
    $("#loginWhy").textContent = why || t("loginWhy");
    $("#loginDlg").showModal();
  }
  function lgDone(msg) { $("#loginDlg").close(); toast(msg || t("lgOk")); if (afterLogin) { const f = afterLogin; afterLogin = null; f(); } }
  if (A) {
    A.onChange(() => { renderUser(); loadMine(); });
    $("#loginBtn").onclick = () => { afterLogin = null; openLogin(); };
    $("#lgGuest").onclick = () => { guestOk = true; const f = afterLogin; afterLogin = null; $("#loginDlg").close(); if (f) f(); };
    $("#logoutBtn").onclick = async () => { await A.signOut(); toast(t("lgOut")); };
    $("#lgGoogle").onclick = () => { try { sessionStorage.setItem("hl-after-login", afterLogin ? "post" : ""); } catch (e) {} A.google(); };
    $("#loginDlg").addEventListener("click", e => { const m = e.target.closest("[data-lgmode]"); if (m) lgMode(m.dataset.lgmode); });
    const okEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
    const busy = async (btn, fn) => { btn.disabled = true; $("#lgErr").textContent = ""; try { await fn(); } finally { btn.disabled = false; } };
    let codeEmail = "";
    const toCode = e => { codeEmail = e; $("#lgCodeHint").textContent = t("lgCodeSent").replace("{e}", e); $("#lgCode").value = ""; lgMode("code"); setTimeout(() => $("#lgCode").focus(), 30); };
    $("#lgInBtn").onclick = () => busy($("#lgInBtn"), async () => {
      const e = $("#lgInEmail").value.trim(), p = $("#lgInPw").value;
      if (!okEmail(e)) { $("#lgErr").textContent = t("lgBadEmail"); return; }
      try { await A.signIn(e, p); lgDone(); }
      catch (err) {
        if (/not.?confirmed/i.test(err.code + " " + err.message)) { try { await A.resendSignup(e); } catch (x) {} toCode(e); $("#lgErr").textContent = t("lgNotConfirmed"); }
        else $("#lgErr").textContent = err.status === 429 ? t("lgWait") : t("lgWrongPw");
      }
    });
    $("#lgInPw").addEventListener("keydown", e => { if (e.key === "Enter") $("#lgInBtn").click(); });
    $("#lgUpBtn").onclick = () => busy($("#lgUpBtn"), async () => {
      const n = $("#lgUpName").value.trim(), e = $("#lgUpEmail").value.trim(), p = $("#lgUpPw").value;
      if (!n) { $("#lgErr").textContent = t("lgNeedName"); return; }
      if (!okEmail(e)) { $("#lgErr").textContent = t("lgBadEmail"); return; }
      if (p.length < 6) { $("#lgErr").textContent = t("lgShortPw"); return; }
      try { const d = await A.signUp(e, p, n); if (A.user()) lgDone(t("lgUpOk")); else toCode(e); }
      catch (err) { $("#lgErr").textContent = err.status === 429 ? t("lgWait") : /registered|exists/i.test(err.message) ? t("lgWrongPw") : t("lgFail"); }
    });
    $("#lgCodeBtn").onclick = () => busy($("#lgCodeBtn"), async () => {
      const c = $("#lgCode").value.replace(/\D/g, "");
      try { await A.verifySignup(codeEmail, c); lgDone(t("lgUpOk")); } catch (err) { $("#lgErr").textContent = t("lgBadCode"); }
    });
    $("#lgResend").onclick = () => busy($("#lgResend"), async () => { try { await A.resendSignup(codeEmail); $("#lgErr").textContent = t("lgResent"); } catch (err) { $("#lgErr").textContent = err.status === 429 ? t("lgWait") : t("lgFail"); } });
    $("#lgFgSend").onclick = () => busy($("#lgFgSend"), async () => {
      const e = $("#lgFgEmail").value.trim();
      if (!okEmail(e)) { $("#lgErr").textContent = t("lgBadEmail"); return; }
      try { await A.sendReset(e); $("#lgFgStep2").hidden = false; $("#lgErr").textContent = t("lgFgSent"); setTimeout(() => $("#lgFgCode").focus(), 30); }
      catch (err) { $("#lgErr").textContent = err.status === 429 ? t("lgWait") : t("lgFail"); }
    });
    $("#lgFgBtn").onclick = () => busy($("#lgFgBtn"), async () => {
      const e = $("#lgFgEmail").value.trim(), c = $("#lgFgCode").value.replace(/\D/g, ""), p = $("#lgFgPw").value;
      if (p.length < 6) { $("#lgErr").textContent = t("lgShortPw"); return; }
      try { await A.resetWithCode(e, c, p); lgDone(t("lgPwOk")); } catch (err) { $("#lgErr").textContent = t("lgBadCode"); }
    });
  }

  function openForm(board) {
    if (A && POSTS_ON && LOGIN_ON && !A.user() && !guestOk) { afterLogin = () => openForm(board); openLogin(t("loginNeed"), true); return; }
    $("#postForm").reset(); $("#fErr").textContent = "";
    $("#postOff").hidden = POSTS_ON; $("#postFields").hidden = !POSTS_ON;
    $("#fBoard").value = board || (route.view === "board" ? route.board : "jobs");
    renderAreaSel(); $("#fArea").hidden = true; boardExamples();
    const canImg = !A || !LOGIN_ON || !!A.user();
    document.querySelector(".img-pick").hidden = !canImg; $("#fImgNote").hidden = canImg;
    $("#postDlg").showModal();
    if (POSTS_ON) setTimeout(() => $("#fTitle").focus(), 30);
  }
  /* ---------- post form: area list and examples that fit each board ---------- */
  // Areas ordered roughly by size of the Chinese community, largest first.
  const AREAS = [
    ["法拉盛", "Flushing"], ["布鲁克林八大道 / 日落公园", "Brooklyn Sunset Park / 8th Ave"], ["布鲁克林 86街 / 本森赫斯特", "Brooklyn 86th St / Bensonhurst"],
    ["曼哈顿华埠", "Manhattan Chinatown"], ["艾姆赫斯特", "Elmhurst"], ["布鲁克林 U大道 / 羊头湾", "Brooklyn Ave U / Sheepshead Bay"],
    ["贝赛 / 白石 / 大颈", "Bayside / Whitestone / Great Neck"], ["新鲜草原 / 佛洛帕兰", "Fresh Meadows / Flushing south"],
    ["森林小丘 / 雷哥公园", "Forest Hills / Rego Park"], ["可乐娜 / 杰克逊高地", "Corona / Jackson Heights"], ["布鲁克林湾脊 / 戴克高地", "Bay Ridge / Dyker Heights"],
    ["皇后区其他", "Queens (other)"], ["布鲁克林其他", "Brooklyn (other)"], ["曼哈顿其他", "Manhattan (other)"], ["史泰登岛", "Staten Island"], ["布朗克斯", "Bronx"],
    ["长岛", "Long Island"], ["新泽西", "New Jersey"], ["威郡 / 纽约上州", "Westchester / Upstate"], ["网上 / 不限地区", "Online / anywhere"]
  ];
  const EX = {
    jobs: ["如：法拉盛日料店请寿司师傅，包吃住", "工资、工作时间、要求、是否包吃住、联系时间"],
    rest: ["如：布鲁克林外卖店请炒锅、打杂，周薪面议", "职位、周薪、上班天数、是否包住、有无车接送"],
    salon: ["如：长岛美甲店请熟手，底薪加提成", "职位、底薪/提成、要不要牌照、上班天数、接送"],
    seek: ["如：女，45岁，找保姆或住家工作，有经验", "年龄、经验、会的技能、可工作时间、希望地区"],
    rent: ["如：法拉盛 Main St 附近一房一厅出租，$1,800", "租金、几房几厅、包不包水电、入住时间、近哪个车站"],
    share: ["如：艾姆赫斯特近地铁单人房出租，限女生", "房间大小、租金、合租几人、要求（性别/不抽烟等）、入住时间"],
    house: ["如：贝赛独立屋出售，三房两卫带车库", "价格、房型、面积、年份、学区、看房时间"],
    shop: ["如：八大道临街店面出租，适合餐馆", "面积、租金、适合行业、租约年限、看铺时间"],
    biz: ["如：法拉盛奶茶店转让，生意稳定", "转让价、月营业额、房租、租约剩余、转让原因"],
    sale: ["如：九成新沙发低价出售，$150，自取", "物品、新旧程度、价格、取货地点"],
    car: ["如：2019 丰田凯美瑞，4万英里，$18,000", "年份、里程、车况、价格、看车地点"],
    furn: ["如：搬家出售餐桌、床架、冰箱", "物品清单、价格、新旧程度、取货时间"],
    deals: ["如：法拉盛XX超市本周特价，猪肉 $1.99/磅", "特价商品和价格、活动时间、店铺地址"],
    move: ["如：搬家、长途搬运，价格公道，有保险", "服务范围、价格、车辆大小、可预约时间"],
    reno: ["如：装修厨房浴室、油漆、铺地板，持牌", "服务项目、是否持牌、报价方式、服务地区"],
    repair: ["如：冰箱洗衣机空调维修，当天上门", "维修项目、上门地区、收费方式、联系时间"],
    recycle: ["如：高价回收旧家电、旧家具、电脑手机", "回收物品、是否上门、付款方式、服务地区"],
    clean: ["如：家庭清洁、开荒清洁，按小时收费", "服务内容、价格、可预约时间、服务地区"],
    nanny: ["如：月嫂，有证书，经验丰富", "经验、证书、服务内容、价格、可上户时间"],
    law: ["如：移民律师，绿卡、入籍、庇护咨询", "专业领域、收费方式、办公地址、语言"],
    tax: ["如：报税、会计记账、公司注册", "服务项目、收费、办公地址、营业时间"],
    edu: ["如：小学数学一对一补习，周末上课", "科目、年级、上课方式、收费、上课时间"],
    kids: ["如：家庭托儿，有执照，接送上下学", "年龄范围、时间、收费、地点、是否有执照"],
    events: ["如：本周六法拉盛图书馆免费健康讲座", "时间、地点、内容、是否收费、如何报名"],
    dating: ["如：35岁男，在纽约工作，想认识聊得来的朋友", "简单介绍自己、兴趣爱好、希望认识什么样的人（不要写身份证、住址等隐私）"],
    ship: ["如：中美快递、海运，上门取件", "服务路线、价格、时效、取件方式"],
    factory: ["如：皇后区仓库请打包工，时薪 $18", "工作内容、时薪、班次、地点、要不要身份"],
    driver: ["如：外卖公司请送餐司机，自备车", "车型要求、薪水、工作时间、送货范围"],
    parttime: ["如：周末请临时帮工，日结 $150", "做什么、时间、报酬、地点"],
    short: ["如：法拉盛近地铁短租，一晚 $80", "价格（按天/周）、可住日期、房型、有无厨房"],
    pet: ["如：英短猫找新家，免费领养", "品种、年龄、是否打针绝育、领养要求"],
    ride: ["如：周五法拉盛去波士顿，可带2人", "出发地、目的地、日期时间、空位、分摊费用"],
    translate: ["如：中英翻译、表格代填、预约办事", "服务内容、语言、收费、地址"],
    ask: ["如：法拉盛哪里可以免费学英文？", "把问题写清楚，热心邻居会帮你解答"],
    sign: ["如：印刷名片、招牌制作，当天取货", "服务项目、价格、交货时间、地址"],
    loan: ["如：房屋贷款、汽车保险，中文服务", "产品类型、服务地区、是否持牌、联系方式"],
    realtor: ["如：持牌地产经纪，买房卖房免费咨询", "服务地区、专长、执照号码、联系时间"],
    drive: ["如：驾校教车，中文教练，包考路考", "课程、价格、上课地点、可约时间"],
    clinic: ["如：家庭医生诊所，接受白卡和医保", "科别、接受哪些保险、地址、营业时间"],
    tcm: ["如：中医针灸推拿，接受保险", "服务项目、收费、是否接受保险、地址"],
    beauty: ["如：美发店剪发烫染，新客八折", "服务项目、价格、优惠、地址、营业时间"],
    other: ["如：请写清楚你要发布的内容", "详细说明、价格或要求、联系时间"],
    travel: ["如：12月回国机票，纽约—上海，往返 $1,200", "行程、日期、价格、包含内容"]
  };
  function renderAreaSel() {
    const zh = lang === "zh";
    $("#fAreaSel").innerHTML = `<option value="">${esc(t("areaPick"))}</option>` + AREAS.map(([z, e]) => `<option value="${esc(z)}">${esc(zh ? z : e)}</option>`).join("") + `<option value="__other">${esc(t("areaOther"))}</option>`;
    if (curArea && AREAS.some(a => a[0] === curArea)) $("#fAreaSel").value = curArea;
  }
  function boardExamples() {
    const ex = EX[$("#fBoard").value];
    $("#fTitle").placeholder = ex ? (lang === "zh" ? ex[0] : t("titlePh")) : t("titlePh");
    $("#fBody").placeholder = ex ? (lang === "zh" ? ex[1] : t("bodyPh")) : t("bodyPh");
  }
  $("#fBoard").addEventListener("change", boardExamples);
  $("#fAreaSel").addEventListener("change", () => { const o = $("#fAreaSel").value === "__other"; $("#fArea").hidden = !o; if (o) $("#fArea").focus(); });
  /* ---------- listing photos: shrunk in the browser, uploaded to Supabase Storage ---------- */
  let picked = [];
  function showPicked() {
    $("#fImgPrev").innerHTML = picked.map((f, i) => `<span class="ip"><img src="${f.url}" alt=""><button type="button" data-unpick="${i}" aria-label="remove">×</button></span>`).join("");
    document.querySelector(".img-add").hidden = picked.length >= 4;
  }
  $("#fImg").addEventListener("change", e => {
    for (const f of [...e.target.files]) { if (picked.length >= 4) break; if (/^image\//.test(f.type) || /\.(heic|jpe?g|png|webp)$/i.test(f.name)) picked.push({ file: f, url: URL.createObjectURL(f) }); }
    e.target.value = ""; showPicked();
  });
  $("#fImgPrev").addEventListener("click", e => { const b = e.target.closest("[data-unpick]"); if (!b) return; picked.splice(Number(b.dataset.unpick), 1); showPicked(); });
  function shrink(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const max = 1280, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => b ? res(b) : rej(new Error("encode")), "image/jpeg", 0.82);
      };
      img.onerror = () => rej(new Error("decode"));
      img.src = URL.createObjectURL(file);
    });
  }
  async function uploadPicked() {
    const urls = [];
    for (const f of picked) {
      const blob = await shrink(f.file);
      const name = "p/" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + ".jpg";
      const h = { apikey: SB_KEY, "Content-Type": "image/jpeg", "x-upsert": "false" };
      const tok = A && A.user() ? await A.token() : null; if (tok) h.Authorization = "Bearer " + tok;
      const r = await fetch(SB_URL + "/storage/v1/object/post-images/" + name, { method: "POST", headers: h, body: blob });
      if (!r.ok) throw new Error("upload " + r.status);
      urls.push(SB_URL + "/storage/v1/object/public/post-images/" + name);
    }
    return urls;
  }
  async function submitForm(e) {
    e.preventDefault();
    if (!POSTS_ON) return;
    const v = id => $(id).value.trim();
    if (v("#fSite")) { $("#postDlg").close(); return; } // honeypot
    const areaSel = $("#fAreaSel").value;
    if (!areaSel || (areaSel === "__other" && !v("#fArea"))) { $("#fErr").textContent = t("eArea"); return; }
    const d = { p_board: v("#fBoard"), p_title: v("#fTitle"), p_body: v("#fBody"), p_area: areaSel === "__other" ? v("#fArea") : areaSel, p_contact: v("#fName"), p_phone: v("#fPhone"), p_wechat: v("#fWx") };
    const err = d.p_title.length < 2 ? "eTitle" : d.p_body.length < 2 ? "eBody" : (!d.p_phone && !d.p_wechat) ? "eContact" : HLC.BANNED.test(d.p_title + " " + d.p_body) ? "eBanned" : null;
    if (err) { $("#fErr").textContent = t(err); return; }
    const btn = $("#fSubmit"); btn.disabled = true; btn.textContent = t("posting");
    try {
      let urls = [], imgErr = false;
      if (picked.length && A && A.user()) { btn.textContent = t("imgUp"); try { urls = await uploadPicked(); } catch (ue) { imgErr = true; } btn.textContent = t("posting"); }
      const res = await HLC.rpc("create_post", d);
      const row = Array.isArray(res) ? res[0] : res;
      if (row && row.id) keys.set(row.id, row.delete_key);
      if (row && row.id && urls.length) { try { await HLC.rpc("set_post_images", { p_id: row.id, p_key: row.delete_key, p_images: urls }); } catch (se) { imgErr = true; } }
      picked = []; showPicked();
      if (imgErr) setTimeout(() => toast(t("imgFail")), 400);
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
    if (route.view === "article") { const h = findStory(route.id); if (h) return HLShare.open({ url: base + "n/" + h.i.id + "/", title: h.i.t, text: h.i.t + " - 华脉" }); }
    if (route.view === "guideOne" && guides) { const g = guides.guides.find(x => x.id === route.id); if (g) return HLShare.open({ url: base + "g/" + g.id + "/", title: HLG.L(g.title, lang), text: HLG.L(g.title, lang) + " - 华脉生活指南" }); }
    if (route.view === "check") return HLShare.open({ url: base + "#check", title: t("ckShareTitle"), text: t("ckShareText") });
    if (route.view === "deals") return HLShare.open({ url: base + "#deals", title: t("dealsH") + " - 华脉", text: t("dealsH") + " - 华脉" });
    return HLShare.open({ url: base, title: "华脉 HuaMai", text: t("shareSiteText") });
  }
  $("#fabShare").onclick = shareCurrent;
  document.addEventListener("click", e => { if (e.target.closest("[data-share-check]")) HLShare.open({ url: HLC.siteBase() + "#check", title: t("ckShareTitle"), text: t("ckShareText") }); });
  $("#siteShare").onclick = () => HLShare.open({ url: HLC.siteBase(), title: "华脉 HuaMai", text: t("shareSiteText") });
  const fs2 = $("#footShare"); if (fs2) fs2.onclick = () => HLShare.open({ url: HLC.siteBase(), title: "华脉 HuaMai", text: t("shareSiteText") });
  $("#lzh").onclick = () => setScript("s");
  $("#lzt").onclick = () => setScript("t");
  $("#len").onclick = () => setLang("en");
  window.addEventListener("hashchange", go);
  $("#postForm").addEventListener("submit", submitForm);
  $("#bFilter").addEventListener("input", renderBoard);
  $("#bArea").addEventListener("change", () => { renderBoard(); renderAreaChips(); });
  $("#bToday").addEventListener("change", renderBoard);
  $("#bPost").onclick = () => openForm(route.board);
  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); searchQ = $("#q").value.trim(); if (!searchQ) return; if (location.hash === "#search") go(); else location.hash = "search"; });
  document.addEventListener("click", e => {
    const rdl = e.target.closest("[data-reader]");
    if (rdl) { e.preventDefault(); openReaderUrl(rdl.dataset.reader, rdl.dataset.src); return; }
    const oe = e.target.closest("[data-oid]"); if (oe) { openOfficial(oe.dataset.oid); return; }
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

  /* ---------- version line at the very bottom (app version + website build) ---------- */
  (function showVersion() {
    const el = $("#footVer"); if (!el) return;
    const meta = n => (document.querySelector(`meta[name="${n}"]`) || {}).content || "";
    const web = meta("hl-date") === "dev" ? "开发版" : meta("hl-date"), sha = meta("hl-build");
    let app = "";
    try { if (window.HuaLinApp && HuaLinApp.version) app = "安卓 App 版本 " + HuaLinApp.version(); } catch (e) {}
    if (!app && IS_APP && isIOS) app = "iPhone 版";
    else if (!app && IS_APP) app = "App 版";
    el.textContent = (app ? app + " · " : "") + "网页版本 " + web + (sha && sha !== "dev" ? " (" + sha.slice(0, 7) + ")" : "");
  })();

  // If the phone shows a cached older page, reload once to get the newest version.
  (function checkVersion() {
    const mine = (document.querySelector('meta[name="hl-build"]') || {}).content;
    if (!mine || mine === "dev") return;
    fetch("data/version.json?t=" + Date.now(), { cache: "no-store" }).then(r => r.json()).then(v => {
      if (v && v.v && v.v !== mine) {
        let tried = ""; try { tried = sessionStorage.getItem("hl-reload") || ""; } catch (e) {}
        if (tried === v.v) return;
        try { sessionStorage.setItem("hl-reload", v.v); } catch (e) {}
        // Reloading during the opening animation: play it again on the fresh page instead of cutting it off.
        if (document.documentElement.classList.contains("hl-launch")) { try { sessionStorage.setItem("hl-splash-replay", "1"); } catch (e) {} }
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
  if (script === "t" && lang === "zh") applyScript();
  loadData();
  loadPosts();
  setInterval(loadData, 10 * 60 * 1000);
  setInterval(loadPosts, 3 * 60 * 1000);
  try { const y = document.getElementById("cpYear"); if (y) y.textContent = new Date().getFullYear(); } catch (e) {}
})();
