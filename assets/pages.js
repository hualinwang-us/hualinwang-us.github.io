/* 华脉: About, Contact, Terms and Privacy pages. {phone} and {email} are filled in from config.js. */
(function () {
  const HLC = window.HLC || (window.HLC = {});
  HLC.PAGES = {
    about: {
      seal: { zh: "脉", en: "脉" },
      zh: {
        title: "关于华脉",
        intro: "华脉一开，好事就来。华脉是给纽约华人用的生活信息网站：新闻、福利指南、优惠、商家黄页和分类信息，都用中文讲清楚。",
        items: [
          ["我们做什么", "**生活指南**：白卡、粮食券、公屋、入籍等福利，用中文讲清楚谁能申请、要什么材料、去哪里办。\n**新闻和行情**：每 30 分钟自动汇集各大中英文媒体的新闻，以及天气、汇率和美股行情。\n**本周优惠**：网购折扣、免费领取和纽约免费活动。\n**分类信息和商家黄页**：招聘、租房、买卖、服务，邻居之间免费发布。"],
          ["我们的原则", "**免费、中文、实用。** 新闻注明来源并链接原文；指南只引用政府和官方机构的公开资料；分类信息由用户自行发布，我们会删除诈骗、违法和色情内容。"],
          ["与政府无关", "华脉是独立的民间网站，**与任何政府机构都没有关系**。福利申请请以官方网站和工作人员的答复为准。"],
          ["联系我们", "有建议、发现错误或想合作，请看「联系我们」页面。"]
        ]
      },
      en: {
        title: "About HuaMai",
        intro: "Open HuaMai, good things come. HuaMai (华脉) is a local information site for the Chinese community in New York: news, benefit guides, deals, a business directory and classifieds, explained in plain Chinese.",
        items: [
          ["What we do", "**Guides** to Medicaid, SNAP, public housing, citizenship and more: who qualifies, what to bring and where to go.\n**News and markets**, gathered automatically every 30 minutes from Chinese and English outlets, plus weather, exchange rates and US stocks.\n**Deals**: online discounts, freebies and free NYC events.\n**Classifieds and directory**: jobs, rentals, items and services, free to post."],
          ["Our principles", "**Free, in Chinese, and useful.** News always names and links its source; guides use public government information; listings are posted by users, and we remove scams, illegal and sexual content."],
          ["Not a government site", "HuaMai is independent and **not affiliated with any government agency**. For benefits, the official agency's answer is the one that counts."],
          ["Contact", "Suggestions, corrections or partnerships: see the Contact page."]
        ]
      }
    },
    contact: {
      seal: { zh: "联", en: "@" },
      zh: {
        title: "联系我们",
        intro: "欢迎联系我们：广告合作、置顶、举报问题信息、内容纠错或任何建议。",
        items: [
          ["电话 / 短信", "**{phone}**\n电话没接请发短信，我们会尽快回复。"],
          ["电子邮件", "**{email}**"],
          ["广告和置顶", "首页、侧栏、各板块和文章页都有广告位，每个板块的信息也可以付费置顶。价格见「广告刊登」页面。"],
          ["举报和删除", "看到诈骗、违法或侵权的信息，请点信息里的「举报」，或直接联系我们，我们会尽快处理。想删除自己的账号和全部资料，也请联系我们。"]
        ]
      },
      en: {
        title: "Contact us",
        intro: "Advertising, pinned listings, reporting a problem, corrections or suggestions: we'd like to hear from you.",
        items: [
          ["Phone / text", "**{phone}**\nIf we miss your call, please send a text."],
          ["Email", "**{email}**"],
          ["Ads and pinned listings", "Ad spaces are available on the home page, side columns, boards and article pages, and any listing can be pinned. See the Advertise page for prices."],
          ["Reports and deletion", "If you see a scam, illegal or infringing listing, tap Report on it or contact us. To delete your account and all your data, contact us too."]
        ]
      }
    },
    terms: {
      seal: { zh: "约", en: "§" },
      zh: {
        title: "用户协议",
        intro: "使用华脉（huamai88.com 及华脉 App）即表示你同意以下条款。",
        items: [
          ["发布内容", "你对自己发布的信息、回复和图片负责，必须真实、合法，并且你有权发布。**禁止**：诈骗、虚假信息、色情或性服务、违法商品和服务、歧视和骚扰、侵犯他人版权或隐私、冒充他人或本站。"],
          ["我们的处理权", "我们可以不经通知删除违反本协议或收到举报的内容，并限制或停用相关账号。被多人举报的信息会自动隐藏，等待审核。"],
          ["交易安全", "分类信息由用户自行发布，**我们不核实、不担保**任何信息或交易。请当面看货、确认身份，**切勿预付定金或转账给陌生人**。"],
          ["新闻和外部链接", "新闻标题和导语来自各媒体，版权归原媒体所有，我们只做摘要并链接原文。外部网站的内容和安全由其自行负责。"],
          ["不是专业意见", "生活指南和福利信息仅供参考，不构成法律、移民、税务或医疗意见。具体情况请咨询官方机构或持牌专业人士。"],
          ["免责和变更", "本站按现状提供，不保证不中断、无错误。我们可能修改本协议，修改后继续使用即表示同意新的条款。"]
        ]
      },
      en: {
        title: "Terms of use",
        intro: "By using HuaMai (huamai88.com and the HuaMai app) you agree to these terms.",
        items: [
          ["What you post", "You are responsible for your listings, replies and photos. They must be true, lawful and yours to post. **Not allowed**: scams, false information, sexual content or services, illegal goods and services, discrimination or harassment, infringing others' copyright or privacy, or impersonating others or this site."],
          ["Our right to remove", "We may remove content that breaks these terms or is reported, and limit or close the related accounts. Listings reported by several people are hidden automatically pending review."],
          ["Safe dealing", "Listings are posted by users; **we do not verify or guarantee** any listing or transaction. Meet in person, confirm identities, and **never pay deposits or send money to strangers**."],
          ["News and outside links", "News headlines and leads belong to their publishers; we show a short summary and link the original. Outside sites are responsible for their own content and safety."],
          ["Not professional advice", "Guides and benefit information are for general reference, not legal, immigration, tax or medical advice. Check with the official agency or a licensed professional."],
          ["Disclaimer and changes", "The site is provided as is, without a promise of being uninterrupted or error-free. We may update these terms; continuing to use the site means you accept the update."]
        ]
      }
    },
    privacy: {
      seal: { zh: "私", en: "P" },
      zh: {
        title: "隐私政策",
        intro: "我们只收集网站运作所必需的资料，不卖、不出租你的个人信息，也不放追踪你的第三方广告。",
        items: [
          ["我们收集什么", "**注册账号**：你的电子邮件和密码（密码经过加密保存，我们看不到）。\n**你发布的内容**：信息、回复、图片，以及你自己填写的联系人、电话、微信，这些会**公开显示**给所有访客。\n**防止滥发**：游客发布和商家登记时，我们保存一个由网络地址生成的加密代码，用来限制每天的发布次数，不直接保存你的网络地址。\n**举报记录**：谁举报了哪条信息，只用于审核。"],
          ["保存在你手机里的设置", "语言、字号、简繁体等偏好保存在你自己的浏览器或 App 里，不会上传。"],
          ["用到的第三方服务", "**Supabase**：保存账号、信息和图片的数据库。\n**GitHub Pages**：网站托管。\n**Gmail**：发送注册和重设密码的验证码邮件。\n**Google Fonts、TradingView**：网页字体和股票行情图，打开页面时会从它们的服务器加载。\n**新闻原网站**：在站内阅读原文时，原网站的页面会加载，适用它们自己的隐私政策。"],
          ["保存多久，怎么删除", "你可以随时删除自己发布的信息。要删除账号和全部资料，请通过「联系我们」告诉我们，我们会在 30 天内处理。"],
          ["未成年人", "本站面向成年人，不针对 13 岁以下儿童收集资料。"],
          ["联系和变更", "有隐私方面的问题请联系 {email}。政策更新会在本页公布。"]
        ]
      },
      en: {
        title: "Privacy policy",
        intro: "We collect only what the site needs to work. We don't sell or rent your personal information, and we don't run third-party ads that track you.",
        items: [
          ["What we collect", "**Accounts**: your email and password (the password is stored encrypted; we can't see it).\n**What you post**: listings, replies, photos and any contact name, phone or WeChat you enter, which are **shown publicly**.\n**Spam limits**: for guest posts and directory listings we keep a scrambled code made from your network address to limit daily posting; we don't store the address itself.\n**Reports**: who reported which listing, used only for review."],
          ["Settings on your phone", "Language, text size and script preferences stay in your own browser or app and are not uploaded."],
          ["Services we use", "**Supabase**: database for accounts, listings and photos.\n**GitHub Pages**: website hosting.\n**Gmail**: sends sign-up and password-reset codes.\n**Google Fonts, TradingView**: fonts and stock charts, loaded from their servers when you open a page.\n**News publishers**: when you read an article inside our site, the publisher's page loads under its own privacy policy."],
          ["Keeping and deleting", "You can delete your listings at any time. To delete your account and all your data, contact us and we'll do it within 30 days."],
          ["Children", "The site is for adults and does not knowingly collect information from children under 13."],
          ["Questions and changes", "Privacy questions: {email}. Updates will be posted on this page."]
        ]
      }
    }
  };
  HLC.PAGES_UPDATED = "2026-10-25";
})();
