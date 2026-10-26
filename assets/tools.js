/* 华脉 实用工具: calculators, practice tests and phrase cards. Everything runs in the browser. */
(function () {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => isFinite(n) ? "$" + Math.round(n).toLocaleString("en-US") : "—";
  const money2 = n => isFinite(n) ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const num = (el, sel) => { const v = parseFloat(String((el.querySelector(sel) || {}).value || "").replace(/[$,\s]/g, "")); return isFinite(v) ? v : 0; };
  const pmt = (principal, ratePct, months) => { if (principal <= 0 || months <= 0) return 0; const r = ratePct / 100 / 12; return r ? principal * r / (1 - Math.pow(1 + r, -months)) : principal / months; };
  const L = (zh, en) => ({ zh, en });

  const CATS = [
    { id: "go", zh: "出行交通", en: "Getting around", tools: ["transit", "asp"] },
    { id: "scam", zh: "防诈骗宝典", en: "Scam alerts", tools: ["scam"] },
    { id: "imm", zh: "移民入籍", en: "Immigration", tools: ["civics", "natdate", "visa"] },
    { id: "drive", zh: "驾照考试", en: "Driver's license", tools: ["permit"] },
    { id: "home", zh: "租房买房", en: "Housing", tools: ["building", "lottery", "landlord"] },
    { id: "loan", zh: "贷款计算器", en: "Loan calculators", tools: ["mortgage", "carloan"] },
    { id: "afford", zh: "可负担计算", en: "Affordability", tools: ["rent40", "homeafford"] },
    { id: "eng", zh: "英语学习", en: "English", tools: ["phrases"] },
    { id: "life", zh: "生活工具", en: "Everyday", tools: ["holiday", "freemap", "units", "sizes", "tip"] }
  ];
  const TOOLS = Object.assign({
    transit: { g: "车", t: L("实时到站", "Real-time arrivals"), d: L("附近公交车、地铁、长岛铁路、北方铁路，实时更新", "Nearby buses, subway, LIRR, Metro-North, live") },
    scam: { g: "防", t: L("专骗华人的 14 种骗局", "Scams targeting Chinese"), d: L("骗子怎么说、怎么骗、怎么识破，转给爸妈看", "14 common scams and how to spot them") },
    civics: { g: "问", t: L("入籍考试练习", "Citizenship test practice"), d: L("2025 新版 128 题，中英对照，模拟考试", "2025 test, 128 questions, bilingual") },
    natdate: { g: "籍", t: L("入籍时间计算", "Naturalization date"), d: L("拿绿卡几年后可以申请入籍", "When you can file N-400") },
    visa: { g: "排", t: L("移民排期查询", "Visa bulletin"), d: L("中国出生怎么查、怎么看排期表", "China-born, updated monthly") },
    permit: { g: "驾", t: L("纽约驾照笔试练习", "NY permit test practice"), d: L("中文题目，交通标志和规则", "Signs and rules, in Chinese") },
    mortgage: { g: "房", t: L("房贷月供计算器", "Mortgage calculator"), d: L("含房产税、保险、物业费", "With tax, insurance, HOA") },
    carloan: { g: "车", t: L("车贷月供计算器", "Car loan calculator"), d: L("含纽约销售税", "With NYC sales tax") },
    rent40: { g: "租", t: L("租房收入要求", "Rent income check"), d: L("纽约房东常用的 40 倍规则", "NYC 40x rent rule") },
    homeafford: { g: "买", t: L("买得起多少钱的房子", "How much house can I afford"), d: L("按收入和负债估算", "Based on income and debts") },
    phrases: { g: "英", t: L("常用英语急救卡", "English phrase cards"), d: L("看病、报警、租房、上班，可朗读", "Doctor, police, rent, work, read aloud") },
    units: { g: "换", t: L("单位换算", "Unit converter"), d: L("温度、斤磅、尺寸、加仑", "Temperature, weight, length, volume") },
    sizes: { g: "码", t: L("中美尺码换算", "US–China sizes"), d: L("衣服、鞋子", "Clothes and shoes") },
    tip: { g: "费", t: L("小费计算", "Tip calculator"), d: L("一键算小费，多人平分", "Tip and split the bill") }
  }, (window.HLCity && window.HLCity.TOOLS) || {});
  const tl = (o, lang) => o[lang] || o.zh;

  /* ---------- hub ---------- */
  function hub(lang, cat) {
    const cats = CATS.filter(c => !cat || c.id === cat);
    return `<div class="tl-hub">${cats.map(c => `<section class="tl-cat"><h2>${esc(tl(c, lang))}</h2><div class="tl-grid">${c.tools.map(id => {
      const x = TOOLS[id]; return `<a class="tl-card" href="#t-${id}"><span class="tl-ic" aria-hidden="true">${esc(x.g)}</span><b>${esc(tl(x.t, lang))}</b><span>${esc(tl(x.d, lang))}</span></a>`;
    }).join("")}</div></section>`).join("")}</div>`;
  }

  /* ---------- field helpers ---------- */
  const field = (id, label, val, pre, suf, step) => `<label class="tl-f"><span>${label}</span><span class="tl-in">${pre ? `<i>${pre}</i>` : ""}<input id="${id}" type="number" inputmode="decimal" value="${val}" step="${step || "any"}" min="0">${suf ? `<i>${suf}</i>` : ""}</span></label>`;
  const out = rows => `<div class="tl-out">${rows.map(([k, v, big]) => `<div class="${big ? "big" : ""}"><span>${k}</span><b>${v}</b></div>`).join("")}</div>`;

  /* ---------- calculators ---------- */
  const CALC = {
    mortgage: {
      form: z => `<div class="tl-form">${field("m_price", z ? "房价" : "Home price", 650000, "$")}${field("m_down", z ? "首付比例" : "Down payment", 20, "", "%")}${field("m_rate", z ? "年利率" : "Interest rate", 6.5, "", "%", "0.01")}${field("m_years", z ? "贷款年数" : "Loan term", 30, "", z ? "年" : "yrs")}${field("m_tax", z ? "房产税（每年）" : "Property tax / yr", 6500, "$")}${field("m_ins", z ? "房屋保险（每年）" : "Insurance / yr", 1500, "$")}${field("m_hoa", z ? "物业费 HOA / 公寓管理费（每月）" : "HOA / common charges / mo", 0, "$")}</div>`,
      calc(el, z) {
        const price = num(el, "#m_price"), downPct = num(el, "#m_down"), rate = num(el, "#m_rate"), yrs = num(el, "#m_years");
        const down = price * downPct / 100, loan = Math.max(0, price - down), pi = pmt(loan, rate, yrs * 12);
        const pmi = downPct < 20 && loan > 0 ? loan * 0.005 / 12 : 0; // rough private mortgage insurance estimate
        const tax = num(el, "#m_tax") / 12, ins = num(el, "#m_ins") / 12, hoa = num(el, "#m_hoa"), total = pi + tax + ins + hoa + pmi;
        return out([[z ? "每月总支出（估算）" : "Total monthly (est.)", money(total), 1], [z ? "本金+利息" : "Principal & interest", money(pi)], [z ? "房产税" : "Property tax", money(tax)], [z ? "保险" : "Insurance", money(ins)], [z ? "物业费" : "HOA", money(hoa)]]
          .concat(pmi ? [[z ? "贷款保险 PMI（首付不足 20%，估算）" : "PMI (under 20% down, est.)", money(pmi)]] : [])
          .concat([[z ? "首付" : "Down payment", money(down)], [z ? "贷款金额" : "Loan amount", money(loan)], [z ? "总利息" : "Total interest", money(pi * yrs * 12 - loan)]]));
      },
      note: L("房产税因地区差别很大，纽约市独立屋一般按房价约 0.8%–1.2% 估算，以税单为准；公寓（Co-op/Condo）的管理费可能包含部分房产税。贷款保险 PMI 按贷款额每年约 0.5% 粗估。结果仅供参考，实际以银行报价为准。", "Property tax varies by location; check the actual tax bill. PMI is a rough 0.5%/yr estimate. For reference only; lenders' quotes govern.")
    },
    carloan: {
      form: z => `<div class="tl-form">${field("c_price", z ? "车价" : "Car price", 32000, "$")}${field("c_down", z ? "首付" : "Down payment", 4000, "$")}${field("c_trade", z ? "旧车抵价" : "Trade-in", 0, "$")}${field("c_tax", z ? "销售税" : "Sales tax", 8.875, "", "%", "0.001")}${field("c_fees", z ? "上牌和其他费用" : "Fees", 600, "$")}${field("c_rate", z ? "年利率 APR" : "APR", 7, "", "%", "0.01")}${field("c_months", z ? "贷款月数" : "Term", 60, "", z ? "个月" : "months")}</div>`,
      calc(el, z) {
        const price = num(el, "#c_price"), trade = num(el, "#c_trade"), tax = Math.max(0, price - trade) * num(el, "#c_tax") / 100;
        const loan = Math.max(0, price - trade + tax + num(el, "#c_fees") - num(el, "#c_down")), m = num(el, "#c_months"), pay = pmt(loan, num(el, "#c_rate"), m);
        return out([[z ? "每月还款" : "Monthly payment", money2(pay), 1], [z ? "销售税" : "Sales tax", money(tax)], [z ? "贷款金额" : "Amount financed", money(loan)], [z ? "总利息" : "Total interest", money(pay * m - loan)], [z ? "总共要还" : "Total of payments", money(pay * m)]]);
      },
      note: L("纽约市销售税为 8.875%（纽约州其他地区不同）。在纽约州，用旧车抵价时一般只按差价交销售税。结果仅供参考，以车行和贷款机构的合同为准。", "NYC sales tax is 8.875%. In New York, a trade-in usually reduces the taxable price. For reference only.")
    },
    rent40: {
      form: z => `<div class="tl-form">${field("r_rent", z ? "月租" : "Monthly rent", 2400, "$")}${field("r_income", z ? "或者：你的年收入（税前）" : "Or: your annual income (pre-tax)", 85000, "$")}</div>`,
      calc(el, z) {
        const rent = num(el, "#r_rent"), inc = num(el, "#r_income");
        return out([[z ? "租这个房子需要的年收入（40 倍）" : "Income needed (40x rent)", money(rent * 40), 1], [z ? "担保人需要的年收入（常见 80 倍）" : "Guarantor income (often 80x)", money(rent * 80)],
          [z ? "按你的收入，最多租得起（每月）" : "With your income, max rent", money(inc / 40), 1], [z ? "也就是收入的" : "Share of income", inc ? Math.round(rent * 12 / inc * 100) + "%" : "—"]]);
      },
      note: L("纽约很多房东和中介要求租客年收入至少是月租的 40 倍，担保人至少 80 倍。这是行业习惯，不是法律，各家要求不同。收入不够时可以找担保人、多付押金（纽约法律规定押金最多一个月租金）或找室友合租。", "Many NYC landlords want annual income of 40x the rent, guarantors 80x. This is common practice, not law.")
    },
    homeafford: {
      form: z => `<div class="tl-form">${field("h_income", z ? "家庭年收入（税前）" : "Household income (pre-tax)", 120000, "$")}${field("h_debt", z ? "每月其他还款（车贷、卡债、学贷）" : "Other monthly debts", 400, "$")}${field("h_down", z ? "首付存款" : "Savings for down payment", 100000, "$")}${field("h_rate", z ? "年利率" : "Interest rate", 6.5, "", "%", "0.01")}${field("h_years", z ? "贷款年数" : "Loan term", 30, "", z ? "年" : "yrs")}${field("h_cost", z ? "房产税+保险（房价的每年百分比）" : "Tax + insurance (% of price / yr)", 1.3, "", "%", "0.1")}</div>`,
      calc(el, z) {
        const mInc = num(el, "#h_income") / 12, debt = num(el, "#h_debt"), down = num(el, "#h_down"), r = num(el, "#h_rate") / 100 / 12, n = num(el, "#h_years") * 12, costPct = num(el, "#h_cost") / 100 / 12;
        const budget = Math.max(0, Math.min(mInc * 0.28, mInc * 0.36 - debt)); // classic 28/36 rule
        const factor = r ? r / (1 - Math.pow(1 + r, -n)) : 1 / n; // monthly P&I per $1 borrowed
        // price P: (P - down) * factor + P * costPct = budget
        const price = Math.max(down, (budget + down * factor) / (factor + costPct));
        const loan = Math.max(0, price - down);
        return out([[z ? "大约买得起的房价" : "Home price you can afford (est.)", money(price), 1], [z ? "每月住房支出上限" : "Monthly housing budget", money(budget)], [z ? "贷款金额" : "Loan amount", money(loan)], [z ? "首付占比" : "Down payment share", price ? Math.round(down / price * 100) + "%" : "—"]]);
      },
      note: L("用银行常见的 28/36 原则估算：每月住房支出（月供+房产税+保险）不超过税前月收入的 28%，加上其他负债不超过 36%。实际能批多少要看信用分数、工作年限和银行政策，请找贷款经纪人预批（pre-approval）。", "Uses the 28/36 rule. Actual approval depends on credit, job history and the lender; get a pre-approval.")
    },
    natdate: {
      form: z => `<div class="tl-form"><label class="tl-f"><span>${z ? "绿卡上的“Resident Since”日期" : "Green card \"Resident Since\" date"}</span><span class="tl-in"><input id="n_date" type="date" value="2022-03-15"></span></label><label class="tl-chk"><input id="n_married" type="checkbox"> <span>${z ? "跟美国公民结婚并同住，且对方当了 3 年以上公民" : "Married to and living with a U.S. citizen (citizen for 3+ years)"}</span></label></div>`,
      calc(el, z) {
        const v = (el.querySelector("#n_date") || {}).value; if (!v) return "";
        const yrs = el.querySelector("#n_married").checked ? 3 : 5;
        const d = new Date(v + "T12:00:00"); const full = new Date(d); full.setFullYear(d.getFullYear() + yrs);
        const early = new Date(full); early.setDate(early.getDate() - 90);
        const f = x => x.toLocaleDateString(z ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" });
        const now = new Date(), days = Math.ceil((early - now) / 864e5);
        return out([[z ? "最早可以递交 N-400 的日期" : "Earliest N-400 filing date", f(early), 1], [z ? `满 ${yrs} 年的日期` : `${yrs}-year date`, f(full)], [z ? "距离今天" : "From today", days > 0 ? (z ? `还有 ${days} 天` : `${days} days`) : (z ? "现在就可以递交" : "You can file now")]]);
      },
      note: L("一般绿卡满 5 年可申请入籍；跟美国公民结婚并同住满 3 年的可以 3 年申请。可以在满期前 90 天递交。另外要满足：在美国实际居住满一半时间、在本州或本区住满 3 个月、品行良好等。长期出境（超过 6 个月）可能打断连续居住。具体请咨询移民律师或免费法律援助。", "Usually 5 years (3 if married to a citizen); you may file 90 days early. Other requirements apply (physical presence, residence, good moral character).")
    },
    tip: {
      form: z => `<div class="tl-form">${field("t_bill", z ? "账单金额（税前）" : "Bill (before tax)", 80, "$")}${field("t_pct", z ? "小费比例" : "Tip", 18, "", "%")}${field("t_people", z ? "几个人分" : "Split between", 2, "", z ? "人" : "")}${field("t_tax", z ? "销售税" : "Sales tax", 8.875, "", "%", "0.001")}</div><div class="tl-pills">${[15, 18, 20, 22].map(p => `<button type="button" class="tl-pill" data-tip="${p}">${p}%</button>`).join("")}</div>`,
      calc(el, z) {
        const bill = num(el, "#t_bill"), tip = bill * num(el, "#t_pct") / 100, tax = bill * num(el, "#t_tax") / 100, ppl = Math.max(1, num(el, "#t_people")), total = bill + tip + tax;
        return out([[z ? "每人要付" : "Each person pays", money2(total / ppl), 1], [z ? "小费" : "Tip", money2(tip)], [z ? "税" : "Tax", money2(tax)], [z ? "总共" : "Total", money2(total)]]);
      },
      note: L("在美国餐馆，小费一般按税前金额的 15%–20% 给，服务好可以多给。外卖自取一般不强制给小费。有些餐馆账单已经自动加了服务费（service charge / gratuity），看清楚再给。", "Restaurant tips are usually 15–20% of the pre-tax bill. Check if a service charge is already included.")
    }
  };

  /* ---------- unit and size converters ---------- */
  const UNITS = [
    { k: "temp", zh: "温度", en: "Temperature", a: ["°F", "°F"], b: ["°C", "°C"], ab: v => (v - 32) * 5 / 9, ba: v => v * 9 / 5 + 32, v: 75 },
    { k: "lb", zh: "重量：磅 ↔ 公斤", en: "Pounds ↔ kg", a: ["磅 lb", "lb"], b: ["公斤 kg", "kg"], ab: v => v * 0.45359237, ba: v => v / 0.45359237, v: 150 },
    { k: "jin", zh: "重量：磅 ↔ 斤", en: "Pounds ↔ jin", a: ["磅 lb", "lb"], b: ["斤", "jin"], ab: v => v * 0.45359237 * 2, ba: v => v / 2 / 0.45359237, v: 1 },
    { k: "oz", zh: "重量：盎司 ↔ 克", en: "Ounces ↔ grams", a: ["盎司 oz", "oz"], b: ["克 g", "g"], ab: v => v * 28.349523, ba: v => v / 28.349523, v: 16 },
    { k: "ft", zh: "长度：英尺 ↔ 米", en: "Feet ↔ meters", a: ["英尺 ft", "ft"], b: ["米 m", "m"], ab: v => v * 0.3048, ba: v => v / 0.3048, v: 10 },
    { k: "in", zh: "长度：英寸 ↔ 厘米", en: "Inches ↔ cm", a: ["英寸 in", "in"], b: ["厘米 cm", "cm"], ab: v => v * 2.54, ba: v => v / 2.54, v: 12 },
    { k: "mi", zh: "距离：英里 ↔ 公里", en: "Miles ↔ km", a: ["英里 mi", "mi"], b: ["公里 km", "km"], ab: v => v * 1.609344, ba: v => v / 1.609344, v: 5 },
    { k: "sqft", zh: "面积：平方英尺 ↔ 平方米", en: "Sq ft ↔ m²", a: ["平方英尺", "sq ft"], b: ["平方米", "m²"], ab: v => v * 0.09290304, ba: v => v / 0.09290304, v: 800 },
    { k: "gal", zh: "容量：加仑 ↔ 升", en: "Gallons ↔ liters", a: ["加仑 gal", "gal"], b: ["升 L", "L"], ab: v => v * 3.785411784, ba: v => v / 3.785411784, v: 10 },
    { k: "mpg", zh: "油耗：英里/加仑 ↔ 升/百公里", en: "MPG ↔ L/100km", a: ["MPG", "MPG"], b: ["升/百公里", "L/100km"], ab: v => v ? 235.214583 / v : 0, ba: v => v ? 235.214583 / v : 0, v: 30 }
  ];
  const fmt = v => isFinite(v) ? (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, "") : "";
  function unitsHtml(lang) {
    const z = lang === "zh";
    return `<div class="tl-units">${UNITS.map(u => `<div class="tl-unit" data-u="${u.k}"><h3>${esc(z ? u.zh : u.en)}</h3><div class="tl-pair"><label class="tl-in"><input type="number" inputmode="decimal" data-side="a" value="${u.v}"><i>${esc(z ? u.a[0] : u.a[1])}</i></label><span aria-hidden="true">=</span><label class="tl-in"><input type="number" inputmode="decimal" data-side="b" value="${fmt(u.ab(u.v))}"><i>${esc(z ? u.b[0] : u.b[1])}</i></label></div></div>`).join("")}</div>`;
  }
  const SIZES = {
    women: { zh: "女装（上衣/连衣裙）", en: "Women's clothing", head: ["US", "中国 China", "国际 Intl"], rows: [["2", "155/80A", "XS"], ["4", "160/84A", "S"], ["6", "165/88A", "M"], ["8", "170/92A", "L"], ["10", "175/96A", "XL"], ["12", "180/100A", "XXL"]] },
    men: { zh: "男装（上衣）", en: "Men's tops", head: ["US", "中国 China", "胸围 Chest (in)"], rows: [["S", "165/88A", "34–36"], ["M", "170/92A", "38–40"], ["L", "175/96A", "42–44"], ["XL", "180/100A", "46–48"], ["XXL", "185/104A", "50–52"]] },
    wshoe: { zh: "女鞋", en: "Women's shoes", head: ["US", "中国 China", "脚长 cm"], rows: [["5", "35", "22.5"], ["6", "36", "23"], ["6.5", "37", "23.5"], ["7.5", "38", "24"], ["8.5", "39", "24.5"], ["9", "40", "25"], ["10", "41", "25.5"]] },
    mshoe: { zh: "男鞋", en: "Men's shoes", head: ["US", "中国 China", "脚长 cm"], rows: [["7", "40", "25"], ["8", "41", "25.5"], ["8.5", "42", "26"], ["9.5", "43", "26.5"], ["10.5", "44", "27"], ["11", "45", "27.5"], ["12", "46", "28.5"]] },
    kids: { zh: "童装（按身高）", en: "Kids' clothing", head: ["US", "中国身高 cm", "年龄 Age"], rows: [["2T", "90", "2"], ["3T", "100", "3"], ["4T", "110", "4"], ["5", "110–115", "5"], ["6", "120", "6"], ["7", "125", "7"], ["8", "130", "8"], ["10", "140", "9–10"], ["12", "150", "11–12"]] }
  };
  function sizesHtml(lang) {
    const z = lang === "zh";
    return Object.values(SIZES).map(s => `<section class="tl-size"><h3>${esc(z ? s.zh : s.en)}</h3><div class="tl-tbl"><table><thead><tr>${s.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`).join("");
  }

  /* ---------- English phrase cards ---------- */
  const PHRASES = [
    ["看病", "At the doctor", [["我需要看医生。", "I need to see a doctor."], ["我不会说英语，请给我中文翻译。", "I don't speak English. I need a Chinese interpreter, please."], ["我这里疼。", "It hurts here."], ["我发烧了，咳嗽。", "I have a fever and a cough."], ["我对青霉素过敏。", "I'm allergic to penicillin."], ["我有高血压 / 糖尿病。", "I have high blood pressure / diabetes."], ["这个药一天吃几次？", "How many times a day should I take this medicine?"], ["我有保险 / 我没有保险。", "I have insurance. / I don't have insurance."]]],
    ["紧急求助", "Emergency", [["请帮我叫救护车！", "Please call an ambulance!"], ["救命！", "Help!"], ["我需要报警。", "I need to call the police."], ["有人受伤了。", "Someone is hurt."], ["我的东西被偷了。", "My things were stolen."], ["我迷路了，这是哪里？", "I'm lost. Where am I?"], ["我需要中文翻译。", "I need a Chinese interpreter."]]],
    ["租房", "Renting", [["这个房子还在出租吗？", "Is this apartment still available?"], ["每个月房租多少钱？包水电吗？", "How much is the rent? Are utilities included?"], ["押金是多少？", "How much is the security deposit?"], ["我什么时候可以看房？", "When can I see the apartment?"], ["暖气坏了，请尽快修理。", "The heat is not working. Please fix it as soon as possible."], ["请给我一份租约的副本。", "Please give me a copy of the lease."]]],
    ["找工作", "At work", [["你们在招人吗？", "Are you hiring?"], ["我可以做全职 / 兼职。", "I can work full-time / part-time."], ["每小时工资多少？", "What is the hourly pay?"], ["几点上班，几点下班？", "What are the working hours?"], ["加班有加班费吗？", "Do you pay overtime?"], ["我什么时候可以开始上班？", "When can I start?"]]],
    ["购物和日常", "Everyday", [["多少钱？", "How much is it?"], ["可以刷卡吗？", "Can I pay by card?"], ["我可以退货吗？", "Can I return this?"], ["请说慢一点。", "Please speak slowly."], ["请再说一遍。", "Could you say that again, please?"], ["请帮我写下来。", "Could you write it down for me?"], ["洗手间在哪里？", "Where is the restroom?"]]],
    ["交通", "Getting around", [["这辆车去法拉盛吗？", "Does this bus go to Flushing?"], ["地铁站在哪里？", "Where is the subway station?"], ["我要在这一站下车。", "I want to get off at this stop."], ["请带我去这个地址。", "Please take me to this address."], ["开到这里多少钱？", "How much to go here?"]]]
  ];
  function phrasesHtml(lang) {
    const z = lang === "zh";
    return `<p class="tl-note">${esc(z ? "点喇叭按钮，手机会用英语读出来，可以直接给对方听。" : "Tap the speaker to hear the English read aloud.")}</p>` + PHRASES.map(([zh, en, list]) => `<section class="tl-ph"><h3>${esc(z ? zh : en)}</h3>${list.map(([c, e]) => `<div class="tl-phr"><div><b>${esc(e)}</b><span>${esc(c)}</span></div><button type="button" class="tl-say" data-say="${esc(e)}" aria-label="Read aloud"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></button></div>`).join("")}</section>`).join("");
  }

  /* ---------- NY permit test practice (original questions based on New York traffic rules) ---------- */
  const SIGN = {
    stop: '<svg viewBox="0 0 100 100"><polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="#c8302a" stroke="#fff" stroke-width="4"/><text x="50" y="60" font-size="26" font-weight="800" fill="#fff" text-anchor="middle" font-family="Arial">STOP</text></svg>',
    yield: '<svg viewBox="0 0 100 100"><polygon points="4,8 96,8 50,92" fill="#fff" stroke="#c8302a" stroke-width="10"/><text x="50" y="40" font-size="15" font-weight="800" fill="#c8302a" text-anchor="middle" font-family="Arial">YIELD</text></svg>',
    school: '<svg viewBox="0 0 100 100"><polygon points="50,4 94,40 94,96 6,96 6,40" fill="#cddc39" stroke="#222" stroke-width="3"/><circle cx="40" cy="48" r="6" fill="#222"/><rect x="34" y="56" width="12" height="22" fill="#222"/><circle cx="62" cy="52" r="5" fill="#222"/><rect x="57" y="59" width="10" height="19" fill="#222"/></svg>',
    rr: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#ffd200" stroke="#222" stroke-width="3"/><path d="M20 20 L80 80 M80 20 L20 80" stroke="#222" stroke-width="7"/><text x="22" y="58" font-size="16" font-weight="800" fill="#222" font-family="Arial">R</text><text x="68" y="58" font-size="16" font-weight="800" fill="#222" font-family="Arial">R</text></svg>',
    warn: '<svg viewBox="0 0 100 100"><polygon points="50,4 96,50 50,96 4,50" fill="#ffd200" stroke="#222" stroke-width="3"/><path d="M40 70 V45 L60 30 M60 30 L52 31 M60 30 L59 38" stroke="#222" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
    work: '<svg viewBox="0 0 100 100"><polygon points="50,4 96,50 50,96 4,50" fill="#f57c00" stroke="#222" stroke-width="3"/><circle cx="50" cy="34" r="6" fill="#222"/><path d="M50 42 L46 62 L38 74 M46 62 L56 74 M48 48 L62 56" stroke="#222" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
    noentry: '<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="#c8302a"/><rect x="18" y="42" width="64" height="16" fill="#fff"/></svg>',
    noturn: '<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="#fff" stroke="#222" stroke-width="2"/><path d="M40 82 V45 Q40 30 55 30 H66" stroke="#222" stroke-width="8" fill="none"/><path d="M62 18 L76 30 L62 42 Z" fill="#222"/><circle cx="50" cy="50" r="38" fill="none" stroke="#c8302a" stroke-width="8"/><path d="M23 77 L77 23" stroke="#c8302a" stroke-width="8"/></svg>'
  };
  // [题目, Question, [[选项, option]...], 正确答案序号, 解释, sign]
  const PERMIT = [
    ["这个标志是什么意思？", "What does this sign mean?", [["完全停车", "Come to a full stop"], ["减速慢行", "Slow down"], ["让行", "Yield"], ["禁止进入", "Do not enter"]], 0, "八角形红色标志是“停车”标志，必须在停车线前完全停下，确认安全再走。", "stop"],
    ["这个倒三角形标志表示：", "This upside-down triangle means:", [["必须停车", "Stop"], ["减速，必要时停车，让其他车辆和行人先行", "Slow down and yield; stop if needed"], ["前方学校", "School ahead"], ["单行道", "One way"]], 1, "倒三角形是“让行”标志。", "yield"],
    ["五边形的标志代表：", "A five-sided (pentagon) sign means:", [["前方施工", "Work zone"], ["学校区域或学童过马路", "School zone or school crossing"], ["铁路道口", "Railroad crossing"], ["医院", "Hospital"]], 1, "五边形标志专门用于学校区域和学童过街。", "school"],
    ["圆形黄色、画着 X 和 RR 的标志表示：", "A round yellow sign with an X and RR means:", [["前方有铁路道口", "Railroad crossing ahead"], ["禁止右转", "No right turn"], ["休息区", "Rest area"], ["道路封闭", "Road closed"]], 0, "圆形标志是铁路道口预告标志，要减速、注意看听有没有火车。", "rr"],
    ["菱形黄色标志一般表示：", "A yellow diamond-shaped sign usually is a:", [["警告标志，提醒前方路况", "Warning about road conditions ahead"], ["限速标志", "Speed limit"], ["方向指示", "Direction guide"], ["停车位", "Parking"]], 0, "黄色菱形是警告标志，例如弯道、交叉口、路滑。", "warn"],
    ["橙色菱形标志表示：", "An orange diamond sign means:", [["施工区，要减速注意工人", "Work zone ahead"], ["学校", "School"], ["休闲景点", "Recreation area"], ["医院", "Hospital"]], 0, "橙色是施工区专用颜色，施工区超速罚款加倍。", "work"],
    ["这个标志表示：", "This sign means:", [["禁止进入（不能从这边开进去）", "Do not enter"], ["停车场", "Parking"], ["前方道路变窄", "Road narrows"], ["让行", "Yield"]], 0, "红圆中间一条白杠是“禁止进入”，通常是单行道逆向入口。", "noentry"],
    ["这个标志表示：", "This sign means:", [["禁止右转", "No right turn"], ["只准右转", "Right turn only"], ["前方右弯", "Curve right"], ["可以掉头", "U-turn allowed"]], 0, "红圈加斜杠表示禁止，画的是右转箭头。", "noturn"],
    ["除非有标志另行规定，纽约市内的一般限速是：", "Unless posted otherwise, the speed limit in New York City is:", [["每小时 25 英里", "25 mph"], ["每小时 30 英里", "30 mph"], ["每小时 35 英里", "35 mph"], ["每小时 40 英里", "40 mph"]], 0, "纽约市默认限速是 25 英里/小时。"],
    ["在纽约州，21 岁以上司机血液酒精浓度达到多少即构成醉驾（DWI）？", "For drivers 21 and over, DWI is a blood alcohol content of:", [["0.08% 或以上", "0.08% or more"], ["0.05%", "0.05%"], ["0.10%", "0.10%"], ["0.15%", "0.15%"]], 0, "0.08% 或以上是醉驾；0.05% 以上也可能被控酒后驾驶能力受损（DWAI）。"],
    ["21 岁以下的司机，血液酒精浓度多少就会受到“零容忍”法处罚？", "Drivers under 21 face the Zero Tolerance law at a BAC of:", [["0.02% 至 0.07%", "0.02% to 0.07%"], ["只有 0.08% 以上", "Only 0.08% or more"], ["0.10%", "0.10%"], ["不适用", "It does not apply"]], 0, "未满 21 岁，0.02%–0.07% 就会被吊销驾照。"],
    ["校车停下并闪红灯时，你应该：", "When a school bus stops with red lights flashing, you must:", [["无论哪个方向都要停车，直到红灯熄灭", "Stop, from either direction, until the lights stop flashing"], ["只有在校车后面才需要停", "Stop only if behind the bus"], ["减速慢慢通过", "Pass slowly"], ["按喇叭后通过", "Honk and pass"]], 0, "在纽约，不论对向还是同向、多车道还是有中间分隔的公路，都要停下。"],
    ["在纽约市，红灯时可以右转吗？", "In New York City, can you turn right on red?", [["不可以，除非有标志允许", "No, unless a sign permits it"], ["可以，停车确认安全后就行", "Yes, after a full stop"], ["只有晚上可以", "Only at night"], ["只有出租车可以", "Only taxis"]], 0, "纽约州其他地方停稳后可以红灯右转（有禁止标志除外），但纽约市内默认禁止。"],
    ["红灯闪烁时，你应该：", "At a flashing red light, you must:", [["当作停车标志：完全停下，确认安全再走", "Treat it as a stop sign"], ["减速通过", "Slow down and go"], ["直接通过", "Go through"], ["等它变绿", "Wait for green"]], 0, "闪红灯等于停车标志；闪黄灯是减速小心通过。"],
    ["黄灯闪烁表示：", "A flashing yellow light means:", [["减速，小心通过", "Slow down and proceed with caution"], ["必须停车", "Stop"], ["加速通过", "Speed up"], ["禁止通行", "Do not go"]], 0, "闪黄灯提醒小心，不必停车。"],
    ["转弯或变道前，至少要提前多远打方向灯？", "How far ahead must you signal before turning?", [["100 英尺", "100 feet"], ["20 英尺", "20 feet"], ["50 英尺", "50 feet"], ["不需要", "No need"]], 0, "纽约规定至少提前 100 英尺打灯。"],
    ["四向停车路口，两辆车同时到达，应该：", "At a four-way stop, two cars arrive at the same time. Who goes first?", [["左边的车让右边的车先走", "The driver on the left yields to the driver on the right"], ["大车先走", "The larger vehicle"], ["右边的车让左边先走", "The driver on the right yields"], ["谁快谁走", "Whoever is faster"]], 0, "同时到达时让右边的车先走；先到先走。"],
    ["左转时遇到对面直行车，应该：", "When turning left, you must yield to:", [["让对面直行和右转的车先走", "Oncoming traffic going straight or turning right"], ["你有优先权", "No one; you have the right of way"], ["按喇叭让对方停", "Honk so they stop"], ["加速抢先转", "Speed up and turn first"]], 0, "左转车要让对面来车和行人。"],
    ["听到救护车、消防车警笛靠近，你应该：", "When an ambulance or fire truck with a siren approaches, you should:", [["靠右边停车，等它通过", "Pull over to the right and stop"], ["加速让开", "Speed up"], ["原地停在路中间", "Stop in your lane"], ["跟在后面开", "Follow it"]], 0, "靠右停车让行，但不要停在路口中间。"],
    ["路边停着闪灯的警车、救护车或拖车时（“让道法 Move Over Law”），你应该：", "Under the Move Over Law, when you see a stopped emergency vehicle with lights flashing, you should:", [["减速，安全的话换到远离它的车道", "Slow down and, if safe, move over a lane"], ["保持原速", "Keep your speed"], ["停在它后面", "Stop behind it"], ["按喇叭", "Honk"]], 0, "纽约让道法要求减速并在安全时换道远离。"],
    ["在纽约州开车时用手拿手机通话或打字：", "Using a hand-held phone while driving in New York is:", [["违法", "Illegal"], ["红灯时可以", "Allowed at red lights"], ["速度慢时可以", "Allowed at low speed"], ["只有打字违法", "Only texting is illegal"]], 0, "开车时手持电话通话、发短信、看手机都违法，等红灯也不行。"],
    ["关于安全带，纽约州的规定是：", "New York's seat belt law requires:", [["司机和所有乘客都要系，包括后座", "Driver and all passengers, including the back seat"], ["只有司机", "Only the driver"], ["只有前座", "Only front seats"], ["只有小孩", "Only children"]], 0, "纽约要求车内所有人系安全带；年幼儿童要用合适的儿童安全座椅。"],
    ["什么时候必须开大灯？", "When must you turn on your headlights?", [["日落到日出、能见度低于 1000 英尺、下雨开雨刷时", "Sunset to sunrise, visibility under 1,000 feet, and when wipers are on for weather"], ["只有晚上 10 点以后", "Only after 10 p.m."], ["只在高速公路上", "Only on highways"], ["想开就开", "Whenever you like"]], 0, "因天气开雨刷时也必须开大灯。"],
    ["对面有车开来，距离多少以内要把远光灯换成近光灯？", "Dim your high beams when an oncoming vehicle is within:", [["500 英尺", "500 feet"], ["100 英尺", "100 feet"], ["50 英尺", "50 feet"], ["不用换", "Never"]], 0, "对向来车 500 英尺内、跟车 200 英尺内要用近光灯。"],
    ["停车时，离消防栓至少要多远？", "You may not park within how many feet of a fire hydrant?", [["15 英尺", "15 feet"], ["5 英尺", "5 feet"], ["10 英尺", "10 feet"], ["30 英尺", "30 feet"]], 0, "消防栓 15 英尺内禁止停车。"],
    ["停车时，离路口的人行横道至少要多远？", "You may not park within how many feet of a crosswalk at an intersection?", [["20 英尺", "20 feet"], ["5 英尺", "5 feet"], ["10 英尺", "10 feet"], ["50 英尺", "50 feet"]], 0, "路口人行横道 20 英尺内禁止停车。"],
    ["跟车距离，一般建议至少保持：", "A safe following distance is at least:", [["前车后面 2 秒以上的距离，路况差时更多", "2 seconds or more behind the car ahead"], ["1 辆车长", "One car length"], ["越近越好", "As close as possible"], ["半秒", "Half a second"]], 0, "用“2 秒规则”，下雨下雪时要拉得更长。"],
    ["下雨路面积水，车开始打滑（水漂）时，你应该：", "If your car starts to hydroplane, you should:", [["松开油门，不要猛踩刹车，稳住方向", "Ease off the gas, don't brake hard, steer straight"], ["猛踩刹车", "Brake hard"], ["加速", "Speed up"], ["猛打方向盘", "Turn sharply"]], 0, "轻放油门让车速降下来，避免猛刹。"],
    ["车子后轮打滑时，你应该把方向盘：", "If your rear wheels skid, steer:", [["往你希望车头去的方向打", "In the direction you want the front of the car to go"], ["往反方向猛打", "Hard the other way"], ["不动方向盘", "Don't steer"], ["猛踩刹车", "Brake hard"]], 0, "朝想去的方向轻柔修正，不要过度。"],
    ["高速公路上一般应该开在：", "On a multi-lane highway, you should usually drive in:", [["右边车道，超车时才用左边车道", "The right lane, using the left lane to pass"], ["最左边车道", "The far left lane"], ["路肩", "The shoulder"], ["随便", "Any lane"]], 0, "靠右行驶，左道用来超车。"],
    ["路中间的黄色实线在你这一侧，表示：", "A solid yellow line on your side of the center means:", [["禁止超车", "No passing"], ["可以超车", "You may pass"], ["停车线", "Stop here"], ["自行车道", "Bike lane"]], 0, "你这一侧是实线就不能越线超车。"],
    ["学车证（learner permit）上路练车时，副驾驶必须是：", "With a learner permit, you must be supervised by:", [["21 岁以上、持有效驾照的人", "A licensed driver age 21 or older"], ["任何成年人", "Any adult"], ["18 岁以上朋友", "Any friend 18+"], ["不需要人陪", "No one"]], 0, "陪练者须 21 岁以上并持有该车型的有效驾照。"],
    ["行人在人行横道上过马路时，你应该：", "When a pedestrian is in a crosswalk, you must:", [["停车让行人先走", "Yield and let them cross"], ["按喇叭催他快走", "Honk"], ["从他身后绕过去", "Drive around"], ["加速通过", "Speed up"]], 0, "人行横道上的行人有优先权。"],
    ["从私人车道或停车场开上马路时，你应该：", "When entering a road from a driveway or parking lot, you must:", [["让路上所有车辆和行人先走", "Yield to all traffic and pedestrians"], ["直接开出去", "Pull out right away"], ["按喇叭", "Honk"], ["打双闪", "Use hazard lights"]], 0, "从非公路处进入马路要让所有人先行。"],
    ["警察要求你做酒精测试，你拒绝，后果是：", "If you refuse a chemical (alcohol) test, your license:", [["会被吊销，并有罚款", "Will be revoked, with a civil penalty"], ["没有影响", "Is not affected"], ["只会被警告", "Gets a warning"], ["只有罚款", "Only a fine"]], 0, "纽约有“默示同意法”，拒绝测试会被吊销驾照。"],
    ["发生车祸，有人受伤或财产损失超过 1000 美元，要在几天内向 DMV 报告？", "After a crash with injury or over $1,000 damage, report it to DMV within:", [["10 天", "10 days"], ["30 天", "30 days"], ["24 小时", "24 hours"], ["不用报", "No need"]], 0, "要在 10 天内交 MV-104 车祸报告。"]
  ];

  /* ---------- quiz engine ---------- */
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const Q = { kind: "", list: [], i: 0, right: 0, done: false, picked: -1, mode: "" };
  function civicsItems(onlyStar) {
    const all = window.HL_CIVICS || [];
    const pool = onlyStar ? all.filter(x => x[4]) : all;
    return pool.map(x => {
      const idx = all.indexOf(x);
      const others = shuffle(all.filter((y, k) => k !== idx && y[1] !== x[1])).slice(0, 3);
      const opts = shuffle([x, ...others]);
      return { q: x[2], qe: x[0], opts: opts.map(o => [o[3], o[1]]), ok: opts.indexOf(x), why: "", num: idx + 1 };
    });
  }
  function permitItems() { return PERMIT.map(p => { const order = shuffle(p[2].map((o, k) => k)); return { q: p[0], qe: p[1], opts: order.map(k => p[2][k]), ok: order.indexOf(p[3]), why: p[4], sign: p[5] }; }); }
  function startQuiz(kind, mode) {
    Q.kind = kind; Q.mode = mode; Q.i = 0; Q.right = 0; Q.done = false; Q.picked = -1;
    if (kind === "civics") Q.list = mode === "all" ? civicsItems(false) : mode === "6520" ? shuffle(civicsItems(true)).slice(0, 10) : shuffle(civicsItems(false)).slice(0, 20);
    else Q.list = shuffle(permitItems()).slice(0, 20);
  }
  function quizHtml(lang) {
    const z = lang === "zh";
    if (!Q.list.length) return "";
    const pass = Q.kind === "permit" ? 14 : (Q.mode === "6520" ? 6 : 12);
    if (Q.done) {
      const ok = Q.right >= pass;
      return `<div class="tl-res ${ok ? "ok" : "no"}"><b>${Q.right} / ${Q.list.length}</b><p>${esc(ok ? (z ? "及格了！继续保持。" : "Passed! Keep it up.") : (z ? `还差一点，及格要答对 ${pass} 题，再练一次吧。` : `Not yet: you need ${pass} correct. Try again.`))}</p><button type="button" class="btn" data-qrestart>${esc(z ? "再练一次" : "Try again")}</button></div>`;
    }
    const it = Q.list[Q.i];
    return `<div class="tl-quiz"><div class="tl-qtop"><span>${Q.i + 1} / ${Q.list.length}</span><span>${esc(z ? "答对" : "Correct")} ${Q.right}</span></div>
      ${it.sign ? `<div class="tl-sign">${SIGN[it.sign]}</div>` : ""}
      <h3>${esc(it.q)}</h3><p class="tl-qe">${esc(it.qe)}</p>
      <div class="tl-opts">${it.opts.map((o, k) => { const st = Q.picked < 0 ? "" : k === it.ok ? " right" : k === Q.picked ? " wrong" : ""; return `<button type="button" class="tl-opt${st}" data-opt="${k}"${Q.picked >= 0 ? " disabled" : ""}><b>${esc(o[0])}</b><span>${esc(o[1])}</span></button>`; }).join("")}</div>
      ${Q.picked >= 0 ? `<div class="tl-why ${Q.picked === it.ok ? "ok" : "no"}"><b>${esc(Q.picked === it.ok ? (z ? "答对了" : "Correct") : (z ? "答错了" : "Not quite"))}</b>${it.why ? `<p>${esc(it.why)}</p>` : ""}${it.num ? `<p class="tl-qe">${esc(z ? "官方题号" : "Official #")} ${it.num}</p>` : ""}<button type="button" class="btn" data-qnext>${esc(Q.i + 1 < Q.list.length ? (z ? "下一题" : "Next") : (z ? "看成绩" : "See score"))}</button></div>` : ""}</div>`;
  }
  // Study mode for the permit test: key facts to memorize, the sign shapes, then every question with its answer and reason.
  const PERMIT_FACTS = [
    ["限速", "纽约市默认 25 英里/小时；施工区和学校区要特别减速，施工区超速罚款加倍。"],
    ["酒驾", "21 岁以上血液酒精 0.08% 以上是醉驾（DWI）；21 岁以下 0.02% 起就受“零容忍”处罚。拒绝酒精测试会被吊销驾照。"],
    ["校车", "校车停下闪红灯，不论同向对向都要停车，等红灯熄灭再走。"],
    ["红灯右转", "纽约市内默认不可以红灯右转，除非有标志允许；纽约州其他地方停稳确认安全后可以。"],
    ["信号灯", "闪红灯 = 停车标志；闪黄灯 = 减速小心通过。"],
    ["打灯", "转弯或变道前至少提前 100 英尺打方向灯。"],
    ["让行", "四向停车同时到达，让右边的车先走；左转让对面直行车和行人；从车道或停车场开上马路，让所有车和行人。"],
    ["紧急车辆", "听到警笛靠右停车让行；路边停着闪灯的警车、救护车、拖车，要减速并在安全时换到远离它的车道（让道法）。"],
    ["手机", "开车时手持手机通话、发短信、看手机都违法，等红灯也不行。"],
    ["安全带", "车内所有人都要系安全带，包括后座；小孩要用合适的安全座椅。"],
    ["大灯", "日落到日出、能见度低于 1000 英尺、因天气开雨刷时都要开大灯；对向来车 500 英尺内换近光灯。"],
    ["停车距离", "消防栓 15 英尺内、路口人行横道 20 英尺内禁止停车。"],
    ["跟车", "至少保持 2 秒距离，下雨下雪要更远。"],
    ["打滑", "水漂打滑时松油门、别猛刹；后轮打滑时往你想让车头去的方向轻打方向盘。"],
    ["学车证", "练车时副驾驶必须是 21 岁以上、持有效驾照的人。"],
    ["车祸报告", "有人受伤或损失超过 1000 美元，10 天内向 DMV 交车祸报告（MV-104）。"]
  ];
  const SIGN_SHAPES = [["stop", "八角形 = 停车"], ["yield", "倒三角 = 让行"], ["school", "五边形 = 学校区"], ["rr", "圆形 = 铁路道口预告"], ["warn", "黄色菱形 = 警告"], ["work", "橙色菱形 = 施工区"], ["noentry", "禁止进入"], ["noturn", "红圈斜杠 = 禁止"]];
  function permitStudy(lang) {
    return `<section class="tl-learn"><h2>① 要点速记</h2><ul class="tl-facts">${PERMIT_FACTS.map(([h, p]) => `<li><b>${esc(h)}</b><span>${esc(p)}</span></li>`).join("")}</ul></section>
      <section class="tl-learn"><h2>② 看形状认标志</h2><p class="tl-note">标志的形状和颜色就能告诉你意思，考试一定会考。</p><div class="tl-signs">${SIGN_SHAPES.map(([k, n]) => `<figure><div class="tl-sign">${SIGN[k]}</div><figcaption>${esc(n)}</figcaption></figure>`).join("")}</div>
      <p class="tl-note">颜色规律：红色 = 停止或禁止；黄色 = 警告；橙色 = 施工；绿色 = 方向指示；蓝色 = 服务设施；棕色 = 景点休闲。</p></section>
      <section class="tl-learn"><h2>③ 全部题目和答案</h2><ol class="tl-allq">${PERMIT.map(p => `<li>${p[5] ? `<div class="tl-sign sm">${SIGN[p[5]]}</div>` : ""}<div><b>${esc(p[0])}</b><em>✓ ${esc(p[2][p[3]][0])}</em><span>${esc(p[4])}</span></div></li>`).join("")}</ol></section>`;
  }
  function civicsStudy(lang) {
    const z = lang === "zh", all = window.HL_CIVICS || [];
    return `<details class="tl-study"><summary>${esc(z ? "查看全部 128 题和答案" : "All 128 questions and answers")}</summary><ol>${all.map(x => `<li${x[4] ? ' class="star"' : ""}><b>${esc(x[2])}</b><span>${esc(x[0])}</span><em>${esc(x[3])} · ${esc(x[1])}</em><button type="button" class="tl-say sm" data-say="${esc(x[0] + " " + x[1])}" aria-label="Read aloud"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></button></li>`).join("")}</ol></details>`;
  }

  /* ---------- visa bulletin ---------- */
  let visa = null, visaTried = false;
  function visaHtml(lang) {
    const z = lang === "zh";
    if (!visa) { if (!visaTried) return `<p class="tl-note">${esc(z ? "载入中…" : "Loading…")}</p>`;
      const OFF = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html";
      return z ? `<div class="vb-guide">
        <p class="tl-note">美国国务院的网站不让程序自动读取，所以这里没办法直接显示数字。点下面按钮打开官方排期表，按下面的方法看，一分钟就能看懂。</p>
        <p><a class="btn" href="${OFF}" target="_blank" rel="noopener">打开本月官方排期表</a></p>
        <h3>怎么看排期表（中国大陆出生）</h3>
        <ol class="ad-steps">
          <li>打开后点最新月份，例如「Visa Bulletin For November 2026」。</li>
          <li><b>亲属移民</b>：找「FAMILY-SPONSORED」表格；<b>职业移民</b>：找「EMPLOYMENT-BASED」表格。</li>
          <li>每个表都有两张：<b>A. FINAL ACTION DATES</b>（排到了，可以批准）和 <b>B. DATES FOR FILING</b>（可以先递交材料）。</li>
          <li>看「<b>CHINA-mainland born</b>」那一列，找到你的类别那一行。</li>
          <li>那一格的日期比你的优先日（I-130 / I-140 收据上的 Priority Date）<b>晚</b>，就说明排到了；写「C」表示不用排。</li>
        </ol>
        <h3>常见类别</h3>
        <ul class="vb-cats">
          <li><b>F1</b> 公民的未婚成年子女</li><li><b>F2A</b> 绿卡持有人的配偶和未成年子女</li><li><b>F2B</b> 绿卡持有人的未婚成年子女</li>
          <li><b>F3</b> 公民的已婚子女</li><li><b>F4</b> 公民的兄弟姐妹</li>
          <li><b>EB-1</b> 杰出人才、跨国高管</li><li><b>EB-2</b> 高学历、NIW</li><li><b>EB-3</b> 技术工人、专业人员</li><li><b>EB-5</b> 投资移民</li>
        </ul>
        <p class="tl-note">在美国境内办身份调整的，用 A 表还是 B 表，要看 USCIS 每月公布的说明。拿不准请问移民律师，华脉黄页「律师移民」有很多。</p>
      </div>` : `<p class="tl-note">The State Department site can't be read automatically. Open the official bulletin:</p><p><a class="btn" href="${OFF}" target="_blank" rel="noopener">Open this month's Visa Bulletin</a></p>`; }
    const NAMES = { F1: "F1 公民的未婚成年子女", F2A: "F2A 绿卡持有人的配偶和未成年子女", F2B: "F2B 绿卡持有人的未婚成年子女", F3: "F3 公民的已婚子女", F4: "F4 公民的兄弟姐妹",
      "1st": "EB-1 杰出人才", "2nd": "EB-2 高学历/特殊能力", "3rd": "EB-3 专业/技术工人", "Other Workers": "EB-3 其他工人", "4th": "EB-4 特殊移民", "5th": "EB-5 投资移民（非预留）" };
    const tbl = (rows, title) => rows && rows.length ? `<section class="tl-visa"><h3>${esc(title)}</h3><div class="tl-tbl"><table><thead><tr><th>${esc(z ? "类别" : "Category")}</th><th>${esc(z ? "排期（批准日）" : "Final action")}</th><th>${esc(z ? "递件日" : "Dates for filing")}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(z ? (NAMES[r.c] || r.c) : r.c)}</td><td>${esc(r.fa || "—")}</td><td>${esc(r.df || "—")}</td></tr>`).join("")}</tbody></table></div></section>` : "";
    return `<p class="tl-note">${esc(z ? `${visa.month} 排期表 · 中国大陆出生 · “C”表示无需排期（Current）。每月中旬官方公布下个月的排期，本页每天自动检查更新。` : `${visa.month} bulletin · China mainland-born · "C" means current.`)}</p>
      ${tbl(visa.family, z ? "亲属移民" : "Family-sponsored")}${tbl(visa.employment, z ? "职业移民" : "Employment-based")}
      <p class="tl-note">${esc(z ? "递件时用哪张表（批准日或递件日），以移民局每月公告为准。" : "USCIS says each month which chart to use for filing.")} <a href="${esc(visa.url)}" target="_blank" rel="noopener">${esc(z ? "官方原文" : "Official bulletin")}</a></p>`;
  }

  /* ---------- 防诈骗 ---------- */
  // [名称, 骗子通常怎么说, 怎么识破, 遇到了怎么办, 是否高发]
  const SCAMS = [
    ["假中国使领馆、假中国警察", "打电话说中文，自称“中国领事馆”“国内公安局”，说你有包裹被扣、护照出问题、涉嫌洗钱或犯罪，要“配合调查”，把你转给“警官”，再要你把钱转到“安全账户”，还叫你不要告诉家人。", "中国使领馆和中国警察不会打电话让你转账，更不会跨国电话办案。只要提到“安全账户”“保密”“不要告诉家人”，一定是骗子。", "马上挂断，不要按任何键。可以打使领馆官网上的电话自己核实。告诉家人，尤其是家里老人。", 1],
    ["假移民局、假社安局、假国税局", "自称移民局（USCIS）、社安局（SSA）、国税局（IRS）或法院，说你的身份有问题、社安号被冻结、欠税要被逮捕或驱逐，要你马上用礼品卡、比特币、Zelle 或现金付款。", "美国政府部门不会打电话威胁逮捕，也绝不会要你用礼品卡、比特币或 Zelle 付款。来电显示的号码可以被伪造。", "挂断，自己上政府官网找电话核实。不要说出社安号、银行账号。", 1],
    ["“杀猪盘”网恋投资骗局", "在微信、交友软件、WhatsApp 上“加错人”或主动搭讪，长期聊天培养感情，然后带你一起“投资”加密货币、外汇、黄金，开始让你小赚，等你投大钱就提不出来，还要交“税”“保证金”。", "从没见过面的网友带你投资，就是骗局。“稳赚不赔”“内部消息”“老师带单”都是套路。投资网站和 App 是骗子自己做的。", "立即停止转钱，不要再交任何“解冻费”。保留聊天记录和转账记录，报警，并向 FBI 网络犯罪中心 ic3.gov 举报。", 1],
    ["假收费短信（过路费、快递、罚单）", "收到短信说“你有未付的过路费（E-ZPass/Toll）”“包裹地址有误无法派送”“停车罚单逾期”，附一个链接，点进去要你填信用卡。", "官方很少用短信催款并附陌生链接。网址拼写怪、域名奇怪（比如 .xyz、.top），或者催你“今天不付就加罚款”，都是骗局。", "不要点链接。自己打开官方网站或 App 查看。可以把骗子短信转发到 7726（SPAM）举报，然后删除。", 1],
    ["假银行、假 Zelle 电话", "自称你的银行防诈部门，说你账户有可疑交易，要你把钱“转到安全账户”，或者要你念出手机收到的验证码。", "银行不会叫你把钱转走来“保护”账户，也绝不会问你要验证码。Zelle 转出去的钱基本追不回来。", "挂断，打你银行卡背面的电话自己联系银行。", 1],
    ["“爷爷奶奶”骗局（假孙子出事）", "打给老人，说“奶奶，是我”，或者假装警察、律师，说孙子孙女出车祸、被捕了，急需保释金，叫老人不要告诉父母，有时还派人上门来拿现金。", "声音可能用 AI 模仿。骗子会制造紧急、要保密、要现金或礼品卡。", "先挂断，直接打电话给孙子孙女或他们的父母核实。家里可以约定一个只有家人知道的“暗号”。", 1],
    ["租房骗局", "网上房子又便宜又好，“房东”说人在外地不能带看，先付押金和第一个月房租就寄钥匙；或者用别人的房子照片来骗押金。", "价格比同区便宜很多、不能看房、催你马上付钱、只收 Zelle 或现金，都很可疑。", "一定要亲自看房、核实房东身份再付钱。押金按纽约法律最多一个月租金。", 1],
    ["假工作、在家赚钱", "招人“在家打字”“帮忙收包裹转寄”“刷单赚佣金”，或者先寄给你一张支票，让你存进去再把一部分转回去。", "正规工作不会叫你先交培训费、押金，也不会叫你帮忙收钱转钱。假支票过几天会被退回，钱要你自己赔。", "不要交钱，不要帮陌生人收转钱款或包裹，你可能在帮骗子洗钱。", 0],
    ["假福利、假补助", "说你可以领“政府补助”“刺激支票”“免费手机”“白卡加钱”，只要先交手续费或给出社安号、银行信息。", "政府福利申请不收手续费，也不会打电话推销。", "只在政府官网或社区机构申请福利。网站上的“生活指南”有正规申请方法。", 0],
    ["假移民律师、假代办（Notario）", "自称能“包办绿卡”“快速拿身份”“有内部关系”，收很多钱，用错误材料帮你申请，甚至让你签空白表格。", "只有持牌律师和政府认可的代表可以提供移民法律服务。保证结果、有内部关系，都是骗人。", "可以打市政府免费移民法律热线 1-800-354-0365 核实，或看网站上的“免费移民法律帮助”指南。", 0],
    ["电脑中病毒、假技术支持", "电脑或手机突然弹出警告，说“你中毒了，请打这个电话”，对方要求远程控制你的电脑，再要你付费或登录网上银行。", "正规公司不会用弹窗叫你打电话。不要让陌生人远程控制电脑。", "关掉浏览器或重启。如果已经让对方连上了，马上断网，改银行密码，找可信的人帮你检查。", 0],
    ["网购和二手交易骗局", "卖家只收 Zelle、礼品卡；买家“多付了钱”要你退差价；或者假冒的网店超低价卖名牌。", "要求不安全的付款方式、价格好得不正常、催你马上交易，都要小心。", "用信用卡或有买家保护的平台付款。二手交易尽量当面交货。", 0],
    ["中奖、抽奖、遗产", "说你中了大奖、抽中了汽车，或者有一笔海外遗产，只要先付税金、手续费就能领。", "真正的中奖不用先交钱。你没参加过的抽奖，不可能中奖。", "不理会，不交钱，不给个人资料。", 0],
    ["假慈善、假募捐", "灾难发生后冒充慈善机构募捐，或者在街上、网上用感人故事要钱。", "催你马上捐、只收现金或礼品卡，都很可疑。", "直接去慈善机构官网捐款。", 0]
  ];
  function scamHtml(lang) {
    const rules = ["政府部门、银行、使领馆不会打电话威胁你，也不会叫你转账到“安全账户”。", "任何人要你用礼品卡、比特币、Zelle、现金快递付款，一定是骗子。", "绝不把验证码、社安号、银行密码告诉任何人。", "要你“保密”“不要告诉家人”“马上付”的，先停下来，挂电话，问家人。", "不点陌生短信和邮件里的链接，自己打开官网查。", "网上认识的人带你投资，一定是骗局。"];
    return `<div class="sc-rules"><h2>六条保命原则</h2><ol>${rules.map(r => `<li>${esc(r)}</li>`).join("")}</ol><p>记住一句话：<b>先挂电话，再自己核实。</b></p></div>
      <h2 class="sc-h">华人最常遇到的骗局</h2><div class="sc-list">${SCAMS.map(([n, how, spot, act, hot]) => `<details class="sc"${hot ? " open" : ""}><summary>${hot ? '<span class="sc-hot">高发</span>' : ""}<b>${esc(n)}</b></summary>
        <div class="sc-b"><p><em>骗子怎么说</em>${esc(how)}</p><p><em>怎么识破</em>${esc(spot)}</p><p><em>怎么办</em>${esc(act)}</p></div></details>`).join("")}</div>
      <div class="sc-help"><h2>被骗了怎么办</h2><ol>
        <li><b>马上联系银行</b>：打卡背面的电话，要求冻结、拦截或追回转账，越快越好。</li>
        <li><b>报警</b>：有危险打 911；一般情况可以到住处附近的警察分局报案，拿到报案号。</li>
        <li><b>向联邦政府举报</b>：联邦贸易委员会 reportfraud.ftc.gov；网络诈骗和杀猪盘向 FBI 网络犯罪中心 ic3.gov 举报。</li>
        <li><b>保留证据</b>：聊天记录、短信、来电号码、转账记录都截图保存。</li>
        <li><b>小心“二次诈骗”</b>：被骗后，有人自称能帮你“追回损失”并先收费，也是骗子。</li>
        <li><b>不要自责</b>：骗子是专业团伙，受骗不是你的错。跟家人说，大家一起想办法。</li></ol>
        <p class="tl-note">这里列的是常见套路，骗子会不断换说法。拿不准的时候，先挂断，再问家人、社区服务中心，或打 311 求助。</p></div>
      <div class="sc-share"><button type="button" class="btn wx-btn" data-scamshare>分享给家人，特别是长辈</button></div>`;
  }

  /* ---------- 实时到站 (via our Supabase relay) ---------- */
  const TR = { mode: "bus", stops: null, stopSel: null, rail: null, railSys: "lirr", railStop: "", timer: 0, pos: null };
  const fnUrl = () => (window.HLC && window.HLC.SB_URL ? window.HLC.SB_URL : "") + "/functions/v1/transit";
  async function fnGet(params) {
    const key = window.HLC && window.HLC.SB_KEY, h = key ? { apikey: key } : {};
    if (key && !/^sb_publishable_/.test(key)) h.Authorization = "Bearer " + key;
    const r = await fetch(fnUrl() + "?" + new URLSearchParams(params), { headers: h });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ("HTTP " + r.status));
    return d;
  }
  const RAIL_POP = { lirr: ["56", "237", "349", "102", "1"], mnr: ["1", "4"] };
  const dist = (a, b) => { const x = (b.lon - a.lon) * Math.cos(a.lat * Math.PI / 180), y = b.lat - a.lat; return Math.sqrt(x * x + y * y) * 111; };
  const minsTo = t => Math.round((t * 1000 - Date.now()) / 60000);
  const hm = t => new Date(t * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" });
  const SCHED = {};
  const nyParts = ms => Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  async function schedFor(sys, stop) {
    if (!SCHED[sys]) { try { SCHED[sys] = await (await fetch("data/sched-" + sys + ".json")).json(); } catch (e) { SCHED[sys] = { dates: {} }; } }
    const now = Date.now(), out = [];
    for (const off of [-1, 0, 1]) {
      const p = nyParts(now + off * 864e5), ymd = p.year + p.month + p.day, arr = (SCHED[sys].dates[ymd] || {})[stop]; if (!arr) continue;
      const np = nyParts(now), nowMin = +np.hour * 60 + +np.minute, base = now - nowMin * 60000 + off * 864e5; // NY midnight of that service day (approx.)
      for (let i = 0; i < arr.length; i += 2) { const t = Math.round((base + arr[i] * 60000) / 60000) * 60; if (t * 1000 > now - 60000 && t * 1000 < now + 4 * 3600e3) out.push({ t, dest: arr[i + 1] }); }
    }
    const seen = new Set(); return out.sort((a, b) => a.t - b.t).filter(v => { const k = v.t + v.dest; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 15);
  }
  const stamp = () => `<div class="tr-stamp"><span>🕒 更新于 <b>${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/New_York" })}</b> · ${TR.mode === "bus" ? "每 20 秒" : "每 30 秒"}自动刷新</span><button type="button" class="linkbtn" data-trrefresh>立即刷新</button></div>`;
  /* live bus map: the stop, you, and the buses on their way (they glide to each new position) */
  let leafletP = null;
  function loadLeaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    return leafletP || (leafletP = new Promise((ok, no) => {
      const c = document.createElement("link"); c.rel = "stylesheet"; c.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c);
      const j = document.createElement("script"); j.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; j.onload = ok; j.onerror = no; document.head.appendChild(j);
    }));
  }
  function glide(mk, to, ms) {
    const from = mk.getLatLng(), t0 = performance.now();
    if (from.distanceTo(to) > 3000) { mk.setLatLng(to); return; }
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      mk.setLatLng([from.lat + (to[0] - from.lat) * e, from.lng + (to[1] - from.lng) * e]); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  async function busMap(el, s, d) {
    const box = el.querySelector("#trMap"); if (!box) return;
    try { await loadLeaflet(); } catch (e) { box.innerHTML = `<span class="tr-map-load">地图暂时打不开</span>`; return; }
    const L = window.L, stop = d.stop || (s.lat ? { lat: s.lat, lon: s.lon } : null);
    const buses = (d.list || []).filter(v => v.lat && v.lon);
    if (!TR.map || TR.mapBox !== box) {
      box.innerHTML = "";
      const m = L.map(box, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
      TR.map = m; TR.mapBox = box; TR.buses = {};
      if (stop) { TR.stopMk = L.marker([stop.lat, stop.lon], { icon: L.divIcon({ className: "tr-stop-ic", html: "<span>站</span>", iconSize: [34, 34], iconAnchor: [17, 17] }), zIndexOffset: 1000 }).addTo(m).bindTooltip(esc(s.name), { direction: "top", offset: [0, -16] }); }
      if (TR.pos) L.circleMarker([TR.pos.lat, TR.pos.lon], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f6fd6", fillOpacity: 1 }).addTo(m).bindTooltip("你在这里");
      const pts = [stop && [stop.lat, stop.lon], ...buses.slice(0, 3).map(v => [v.lat, v.lon])].filter(Boolean);
      if (pts.length > 1) m.fitBounds(pts, { padding: [36, 36], maxZoom: 16 }); else if (pts.length) m.setView(pts[0], 16); else m.setView([40.7128, -74.006], 12);
    }
    const m = TR.map, seen = new Set();
    buses.forEach(v => {
      const key = v.vid || (v.route + v.eta); seen.add(key);
      const mins = v.eta ? Math.max(0, Math.round((Date.parse(v.eta) - Date.now()) / 60000)) : null;
      const html = `<div class="tr-bus"><i style="transform:rotate(${-(v.bearing || 0)}deg)">➤</i><b>${esc(v.route)}</b>${mins != null ? `<em>${mins ? mins + "分" : "到"}</em>` : ""}</div>`;
      const icon = L.divIcon({ className: "tr-bus-ic", html, iconSize: [72, 30], iconAnchor: [36, 15] });
      if (TR.buses[key]) { TR.buses[key].setIcon(icon); glide(TR.buses[key], [v.lat, v.lon], 2500); }
      else TR.buses[key] = L.marker([v.lat, v.lon], { icon }).addTo(m);
    });
    Object.keys(TR.buses).forEach(k => { if (!seen.has(k)) { m.removeLayer(TR.buses[k]); delete TR.buses[k]; } });
    if (!buses.length && !stop) box.innerHTML = `<span class="tr-map-load">暂时没有车辆位置</span>`;
  }
  function transitHtml() {
    return `<div class="tl-tabs" role="tablist">${[["bus", "公交车"], ["subway", "地铁"], ["lirr", "长岛铁路"], ["mnr", "北方铁路"]].map(([k, n]) => `<button type="button" data-trmode="${k}"${TR.mode === k ? ' class="on"' : ""}>${esc(n)}</button>`).join("")}</div><div id="trBox"></div>
      <p class="tl-note">数据来自纽约大都会运输署（MTA）实时数据，每 30 秒自动刷新。实际以车站显示和广播为准。定位只用来找附近车站，不会保存。</p>`;
  }
  function locate() {
    return new Promise((ok, no) => { if (!navigator.geolocation) return no(new Error("no geo")); navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude }), no, { timeout: 10000, maximumAge: 300000 }); });
  }
  async function paintTransit(el) {
    clearInterval(TR.timer);
    const box = el.querySelector("#trBox"); if (!box) return;
    if (TR.mode === "bus") {
      if (!TR.stopSel) {
        box.innerHTML = `<div class="tr-find"><button type="button" class="btn" data-trlocate>${esc("📍 定位，找附近的公交站")}</button><form class="tr-code" data-trcode><input inputmode="numeric" maxlength="6" placeholder="或输入站牌上的 6 位站号" aria-label="站号"><button class="btn ghost" type="submit">查询</button></form></div>
          ${TR.stops ? (TR.stops.length ? `<ul class="tr-stops">${TR.stops.map((s, k) => `<li><button type="button" data-trstop="${k}"><b>${esc(s.name)}</b><span>${esc(s.dir ? "往 " + s.dir + " · " : "")}${esc(s.routes.join("、"))}</span><em>${s.km != null ? Math.round(s.km * 1000) + " 米" : ""}</em></button></li>`).join("")}</ul>` : `<p class="tl-note">附近没找到公交站。</p>`) : ""}`;
        return;
      }
      const s = TR.stopSel;
      box.innerHTML = `<div class="tr-head"><button type="button" class="linkbtn" data-trback>← 换一个站</button><h3>${esc(s.name)}</h3><span>${esc(s.routes ? s.routes.join("、") : "")}</span></div><div class="tr-map" id="trMap"><span class="tr-map-load">地图加载中…</span></div><div id="trList"><div class="skel"><i></i><i></i><i></i></div></div>`;
      const load = async () => {
        try {
          const d = await fnGet({ op: "bus", stop: s.id });
          busMap(el, s, d);
          const L = el.querySelector("#trList"); if (!L) return;
          L.innerHTML = stamp() + (d.list.length ? `<ul class="tr-arr">${d.list.map(v => { const m = v.eta ? Math.round((Date.parse(v.eta) - Date.now()) / 60000) : null; return `<li><span class="tr-rt">${esc(v.route)}</span><div><b>往 ${esc(v.dest)}</b><span>${esc(/at stop/i.test(v.away || "") ? "已到站" : /approaching/i.test(v.away || "") ? "马上进站" : v.stops != null ? "还有 " + v.stops + " 站" : (v.away || "").replace(/miles? away/i, "英里外"))}</span></div><em>${m == null ? "—" : m <= 0 ? "到站" : m + " 分钟"}${m != null && m > 0 ? `<small>约 ${new Date(Date.parse(v.eta)).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" })} 到</small>` : ""}</em></li>`; }).join("")}</ul>` : `<p class="tl-note">${esc(d.note || "现在没有即将到站的车。")}</p>`);
        } catch (e) { const L = el.querySelector("#trList"); if (L) L.innerHTML = `<p class="tl-note">暂时拿不到数据（${esc(e.message)}），请稍后再试。</p>`; }
      };
      TR.map = null; TR.reload = load; load(); TR.timer = setInterval(() => { if (!document.body.contains(box)) return clearInterval(TR.timer); load(); }, 20000);
      return;
    }
    if (TR.mode === "subway") {
      if (!TR.sub) { try { TR.sub = await (await fetch("data/subway-stops.json")).json(); } catch (e) { TR.sub = []; } }
      const list = TR.sub.slice().sort((a, b) => a.n.localeCompare(b.n));
      if (!TR.subStop || !list.some(x => x.id === TR.subStop)) TR.subStop = (list.find(x => x.id === "701") || list[0] || {}).id;
      const cur = list.find(x => x.id === TR.subStop) || { r: [], n: "" };
      box.innerHTML = `<div class="tr-find"><label class="tl-f"><span>地铁站</span><select data-trsub>${list.map(x => `<option value="${esc(x.id)}"${x.id === TR.subStop ? " selected" : ""}>${esc(x.n)}（${esc(x.r.join(" "))}）</option>`).join("")}</select></label><button type="button" class="btn ghost" data-trsubnear>📍 最近的地铁站</button></div><div id="trList"><div class="skel"><i></i><i></i><i></i></div></div>`;
      const load = async () => {
        const L = el.querySelector("#trList"); if (!L) return;
        try {
          const d = await fnGet({ op: "subway", stop: TR.subStop, routes: cur.r.join(",") });
          const col = dir => { const a = (d.list || []).filter(v => v.dir === dir).slice(0, 8); return a.length ? `<ul class="tr-arr">${a.map(v => { const m = Math.round((v.t * 1000 - Date.now()) / 60000); return `<li><span class="tr-rt">${esc(v.route)}</span><div><b>${(() => { const n = ((TR.sub || []).find(x => x.id === String(v.dest || "").replace(/[NS]$/, "")) || {}).n; return n ? "往 " + esc(n) : ""; })()}</b><span>${dir === "N" ? "上城 / 往北" : "下城 / 往南"}</span></div><em>${m <= 0 ? "进站" : m + " 分钟"}</em></li>`; }).join("")}</ul>` : `<p class="tl-note">暂时没有车。</p>`; };
          L.innerHTML = stamp() + `<h3 class="cal-h">⬆️ 上城方向（Uptown / 往北）</h3>${col("N")}<h3 class="cal-h">⬇️ 下城方向（Downtown / 往南）</h3>${col("S")}<p class="tl-note">7 号线「上城方向」是开往法拉盛 Main St。数据来自 MTA 官方实时系统。</p>`;
        } catch (e) { L.innerHTML = `<p class="tl-note">地铁实时数据马上上线，请稍后再试。</p>`; }
      };
      TR.reload = load; load(); TR.timer = setInterval(() => { if (!document.body.contains(box)) return clearInterval(TR.timer); load(); }, 30000);
      return;
    }
    // rail
    if (!TR.rail) { try { TR.rail = await (await fetch("data/rail-stops.json")).json(); } catch (e) { TR.rail = {}; } }
    const list = (TR.rail[TR.mode] || []).slice().sort((a, b) => a.n.localeCompare(b.n));
    if (!TR.railStop || !list.some(x => x.id === TR.railStop)) TR.railStop = RAIL_POP[TR.mode][0];
    const names = Object.fromEntries((TR.rail[TR.mode] || []).map(x => [x.id, x.n]));
    box.innerHTML = `<div class="tr-find"><label class="tl-f"><span>出发车站</span><select data-trrail>${list.map(x => `<option value="${esc(x.id)}"${x.id === TR.railStop ? " selected" : ""}>${esc(x.n)}</option>`).join("")}</select></label><button type="button" class="btn ghost" data-trnear>📍 最近的车站</button></div><div id="trList"><div class="skel"><i></i><i></i><i></i></div></div>`;
    const load = async () => {
      try {
        let d = { list: [] }; try { d = await fnGet({ op: "rail", sys: TR.mode, stop: TR.railStop }); } catch (er) {}
        const L = el.querySelector("#trList"); if (!L) return;
        if (!d.list.length) { const sc = await schedFor(TR.mode, TR.railStop); if (sc.length) { L.innerHTML = stamp() + `<p class="tl-note">实时数据暂时没有更新，下面是官方时刻表的班次（不含临时晚点）。</p><ul class="tr-arr">${sc.map(v => { const m = minsTo(v.t); return `<li><span class="tr-rt tr-tm">${hm(v.t)}</span><div><b>开往 ${esc(names[v.dest] || v.dest)}</b><span>时刻表</span></div><em>${m <= 0 ? "即将发车" : m + " 分钟"}</em></li>`; }).join("")}</ul>`; return; } }
        L.innerHTML = stamp() + (d.list.length ? `<ul class="tr-arr">${d.list.map(v => { const m = minsTo(v.t), late = Math.round((v.delay || 0) / 60); return `<li><span class="tr-rt tr-tm">${hm(v.t)}</span><div><b>开往 ${esc(names[v.dest] || v.dest)}</b><span>${late > 1 ? `<i class="tr-late">晚点 ${late} 分钟</i>` : "准点"}</span></div><em>${m <= 0 ? "即将发车" : m + " 分钟"}</em></li>`; }).join("")}</ul>` : `<p class="tl-note">接下来一段时间这个站没有列车。</p>`);
      } catch (e) { const L = el.querySelector("#trList"); if (L) L.innerHTML = `<p class="tl-note">暂时拿不到数据（${esc(e.message)}），请稍后再试。</p>`; }
    };
    TR.reload = load; load(); TR.timer = setInterval(() => { if (!document.body.contains(box)) return clearInterval(TR.timer); load(); }, 30000);
  }
  async function transitClick(e, el) {
    const md = e.target.closest("[data-trmode]"); if (md) { TR.mode = md.dataset.trmode; el.querySelectorAll("[data-trmode]").forEach(b => b.classList.toggle("on", b === md)); paintTransit(el); return true; }
    if (e.target.closest("[data-trlocate]")) {
      const b = e.target.closest("[data-trlocate]"); b.disabled = true; b.textContent = "正在定位…";
      try { const p = await locate(); TR.pos = p; const d = await fnGet({ op: "stops", lat: p.lat.toFixed(5), lon: p.lon.toFixed(5) }); TR.stops = d.stops.map(s => ({ ...s, km: dist(p, s) })).sort((a, b) => a.km - b.km).slice(0, 12); }
      catch (er) { TR.stops = null; b.disabled = false; b.textContent = "定位失败，请允许位置权限后再试"; return true; }
      paintTransit(el); return true;
    }
    const st = e.target.closest("[data-trstop]"); if (st) { TR.stopSel = TR.stops[Number(st.dataset.trstop)]; paintTransit(el); return true; }
    if (e.target.closest("[data-trrefresh]")) { const b = e.target.closest("[data-trrefresh]"); b.textContent = "刷新中…"; if (TR.reload) TR.reload(); return true; }
    if (e.target.closest("[data-trback]")) { TR.stopSel = null; if (TR.map) { TR.map.remove(); TR.map = null; } paintTransit(el); return true; }
    if (e.target.closest("[data-trsubnear]")) {
      try { const p = await locate(); let best = null, bd = 1e9; for (const s of (TR.sub || [])) { const d = dist(p, s); if (d < bd) { bd = d; best = s; } } if (best) { TR.subStop = best.id; paintTransit(el); } } catch (er) {}
      return true;
    }
    if (e.target.closest("[data-trnear]")) {
      try { const p = await locate(); const L = (TR.rail[TR.mode] || []); let best = null, bd = 1e9; for (const s of L) { const d = dist(p, s); if (d < bd) { bd = d; best = s; } } if (best) { TR.railStop = best.id; paintTransit(el); } } catch (er) {}
      return true;
    }
    return false;
  }

  /* read English aloud: Android app → phone's own voice; browsers → Web Speech */
  function sayEn(text, btn) {
    const note = msg => { const host = btn.closest("li") || btn.parentNode; let n = host.querySelector(".say-note"); if (!n) { n = document.createElement("small"); n.className = "say-note"; host.appendChild(n); } n.textContent = msg; };
    try { if (window.HuaLinApp && HuaLinApp.speak) { if (!HuaLinApp.speak(text)) note("再按一次试试。"); return; } } catch (e) {}
    const ss = window.speechSynthesis;
    if (!ss || !window.SpeechSynthesisUtterance) { note("这个浏览器不支持朗读，请用 Chrome 或 Safari 打开。"); return; }
    try {
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.85; u.volume = 1;
      const vs = ss.getVoices(); const v = vs.find(x => /en[-_]US/i.test(x.lang)) || vs.find(x => /^en/i.test(x.lang)); if (v) u.voice = v;
      let started = false; u.onstart = () => { started = true; };
      ss.speak(u);
      setTimeout(() => { if (!started && !ss.speaking) note("没有声音？请把手机音量调大，iPhone 请关掉静音键。"); }, 1500);
    } catch (e) { note("朗读失败，请稍后再试。"); }
  }
  if (window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) {} }

  /* ---------- render a tool page ---------- */
  function render(id, el, lang) {
    const z = lang === "zh", x = TOOLS[id];
    if (!x) { el.innerHTML = hub(lang); return; }
    const head = `<div class="tl-head"><span class="tl-ic" aria-hidden="true">${esc(x.g)}</span><div><h1>${esc(tl(x.t, lang))}</h1><p>${esc(tl(x.d, lang))}</p></div></div>`;
    let body = "";
    if (id === "transit") body = transitHtml();
    else if (id === "scam") body = scamHtml(lang);
    else if (CALC[id]) body = `<div class="tl-calc" data-calc="${id}">${CALC[id].form(z)}<div class="tl-result"></div><p class="tl-note">${esc(tl(CALC[id].note, lang))}</p></div>`;
    else if (id === "units") body = unitsHtml(lang);
    else if (id === "sizes") body = `<p class="tl-note">${esc(z ? "不同品牌尺码有差别，以商家尺码表为准。" : "Sizes vary by brand.")}</p>` + sizesHtml(lang);
    else if (id === "phrases") body = phrasesHtml(lang);
    else if (id === "visa") { body = `<div id="tlVisa">${visaHtml(lang)}</div>`; if (!visa && !visaTried) fetch("data/visa.json?v=" + Math.floor(Date.now() / 3600e3)).then(r => r.ok ? r.json() : null).then(v => { visaTried = true; visa = v && v.month ? v : null; const b = document.getElementById("tlVisa"); if (b) b.innerHTML = visaHtml(lang); }).catch(() => { visaTried = true; const b = document.getElementById("tlVisa"); if (b) b.innerHTML = visaHtml(lang); }); }
    else if (id === "civics") body = `<p class="tl-note">${esc(z ? "2025 年 10 月 20 日或之后递交入籍申请（N-400）的人考新版：题库 128 题，面试时最多问 20 题，答对 12 题及格。65 岁以上且拿绿卡满 20 年的人，只从标星号的 20 题里考 10 题，答对 6 题及格。之前递交的人考旧版 100 题。每题官方有多个可接受答案，这里列出其中一个；现任官员的名字会变，考前请到移民局官网核对。" : "For N-400s filed on or after Oct 20, 2025: 128 questions, up to 20 asked, 12 correct to pass. 65/20 applicants: 10 of the 20 starred questions, 6 to pass.")}</p>
      <div class="tl-pills"><button type="button" class="btn" data-qstart="civics:20">${esc(z ? "模拟考试（20 题）" : "Practice test (20)")}</button><button type="button" class="btn ghost" data-qstart="civics:6520">${esc(z ? "65/20 简化版（10 题）" : "65/20 version (10)")}</button><button type="button" class="btn ghost" data-qstart="civics:all">${esc(z ? "按顺序练全部 128 题" : "All 128 in order")}</button></div><div id="tlQuiz"></div>${civicsStudy(lang)}`;
    else if (id === "permit") body = `<p class="tl-note">${esc(z ? "纽约州 DMV 笔试可以选中文。正式考试 20 题，要答对 14 题，其中 4 道交通标志题至少答对 2 道。下面是我们根据纽约驾驶手册内容编写的练习题，正式规定以纽约州 DMV 驾驶手册为准。" : "The NY written test is 20 questions; you need 14 correct, including at least 2 of the 4 road-sign questions. Practice questions written from the NY Driver's Manual.")}</p>
      <div class="tl-tabs" role="tablist"><button type="button" class="on" data-ptab="learn">学习</button><button type="button" data-ptab="quiz">练习考试</button></div>
      <div id="ptLearn">${permitStudy(lang)}<p class="tl-pills"><button type="button" class="btn" data-ptab="quiz">学完了，去练习 →</button></p></div>
      <div id="ptQuiz" hidden><div class="tl-pills"><button type="button" class="btn" data-qstart="permit:20">${esc(z ? "开始练习（随机 20 题）" : "Start (20 random)")}</button></div><div id="tlQuiz"></div></div>
      <p class="tl-note">完整规则请看纽约州 DMV 中文版驾驶手册（Driver's Manual），DMV 官网可以免费下载。</p>`;
    el.innerHTML = head + body;
    const calcEl = el.querySelector("[data-calc]");
    if (calcEl) { const run = () => { calcEl.querySelector(".tl-result").innerHTML = CALC[id].calc(calcEl, z); }; calcEl.addEventListener("input", run); calcEl.addEventListener("change", run); run();
      calcEl.addEventListener("click", e => { const b = e.target.closest("[data-tip]"); if (b) { calcEl.querySelector("#t_pct").value = b.dataset.tip; run(); } }); }
    el.oninput = id !== "units" ? null : e => { const inp = e.target.closest("[data-side]"); if (!inp) return; const box = inp.closest("[data-u]"), u = UNITS.find(v => v.k === box.dataset.u), v = parseFloat(inp.value);
      const other = box.querySelector(`[data-side="${inp.dataset.side === "a" ? "b" : "a"}"]`); other.value = isFinite(v) ? fmt(inp.dataset.side === "a" ? u.ab(v) : u.ba(v)) : ""; };
    el.onclick = e => {
      if (id === "transit") { transitClick(e, el); }
      if (e.target.closest("[data-scamshare]")) { if (window.HLShare) window.HLShare.open({ url: location.origin + "/#t-scam", title: "专骗华人的 14 种骗局，转给爸妈看", text: "防诈骗提醒：华人最常遇到的 14 种骗局，骗子怎么说、怎么识破 - 华脉" }); return; }
      const s = e.target.closest("[data-say]"); if (s) { sayEn(s.dataset.say, s); return; }
      const pt = e.target.closest("[data-ptab]"); if (pt) { const q = pt.dataset.ptab === "quiz"; el.querySelector("#ptLearn").hidden = q; el.querySelector("#ptQuiz").hidden = !q; el.querySelectorAll(".tl-tabs [data-ptab]").forEach(b => b.classList.toggle("on", b.dataset.ptab === pt.dataset.ptab)); el.querySelector(".tl-tabs").scrollIntoView({ behavior: "smooth", block: "start" }); if (q && !Q.list.length) { startQuiz("permit", "20"); paint(); } return; }
      const st = e.target.closest("[data-qstart]"); if (st) { const [k, m] = st.dataset.qstart.split(":"); startQuiz(k, m); paint(); el.querySelector("#tlQuiz").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      const o = e.target.closest("[data-opt]"); if (o && Q.picked < 0) { Q.picked = Number(o.dataset.opt); if (Q.picked === Q.list[Q.i].ok) Q.right++; paint(); return; }
      if (e.target.closest("[data-qnext]")) { Q.i++; Q.picked = -1; if (Q.i >= Q.list.length) Q.done = true; paint(); return; }
      if (e.target.closest("[data-qrestart]")) { startQuiz(Q.kind, Q.mode); paint(); }
    };
    if (id === "transit") {
      el.onchange = e => { const ss = e.target.closest("[data-trsub]"); if (ss) { TR.subStop = ss.value; paintTransit(el); return; } const sel = e.target.closest("[data-trrail]"); if (sel) { TR.railStop = sel.value; paintTransit(el); } };
      el.onsubmit = e => { const f = e.target.closest("[data-trcode]"); if (!f) return; e.preventDefault(); const v = f.querySelector("input").value.trim(); if (/^\d{6}$/.test(v)) { TR.stopSel = { id: v, name: "站号 " + v, routes: [] }; paintTransit(el); } };
      paintTransit(el);
    } else { el.onchange = null; el.onsubmit = null; clearInterval(TR.timer); }
    if (window.HLCity && window.HLCity.TOOLS[id]) window.HLCity.render(id, el, lang);
    function paint() { const q = el.querySelector("#tlQuiz"); if (q) q.innerHTML = quizHtml(lang); }
    if ((id === "civics" || id === "permit") && Q.kind === id && Q.list.length) paint(); else { Q.list = []; Q.kind = ""; }
  }

  window.HLTools = { CATS, TOOLS, hub, render, title: (id, lang) => TOOLS[id] ? tl(TOOLS[id].t, lang) : "" };
})();
