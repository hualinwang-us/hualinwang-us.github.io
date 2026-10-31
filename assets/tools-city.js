/* 华脉 城市工具: 今天要挪车吗、今天放假吗、查楼房记录、平价房抽签、附近免费资源、房东合法筛选租客.
   Data: NYC Open Data / NYC GeoSearch (read straight from the browser) and data/calendar.json (built daily). */
(function () {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = (zh, en) => ({ zh, en });
  const SOC = "https://data.cityofnewyork.us/resource/";
  const getJSON = async u => { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); };
  const nyToday = (off = 0) => new Date(Date.now() + off * 864e5).toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
  const zhDate = d => { const t = new Date(d + "T12:00:00"); return `${t.getMonth() + 1}月${t.getDate()}日（${"日一二三四五六"[t.getDay()]}）`; };
  let Z = true; // current language is Chinese
  const tx = (zh, en) => Z ? zh : en;
  const enDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dDate = d => Z ? zhDate(d) : enDate(d);
  const ago = n => new Date(Date.now() - n * 365 * 864e5).toISOString().slice(0, 10);

  const TOOLS = {
    asp: { g: "停", t: L("今天要挪车吗", "Alternate side parking"), d: L("扫街停车规则今天、明天是否暂停", "Is street cleaning suspended today?") },
    holiday: { g: "假", t: L("今天放假吗", "Holidays today"), d: L("学校、垃圾收集、银行邮局、扫街，一眼看清", "Schools, trash, banks, parking") },
    building: { g: "楼", t: L("查楼房记录", "Building check"), d: L("租房前查：漏水、暖气、蟑螂、老鼠、投诉", "Violations and complaints by address") },
    lottery: { g: "抽", t: L("平价房抽签", "Housing lotteries"), d: L("正在接受申请的抽签，算算你的收入够不够", "Open lotteries and income check") },
    freemap: { g: "免", t: L("附近免费资源", "Free places nearby"), d: L("公共厕所、免费 WiFi、图书馆地图", "Restrooms, Wi-Fi, libraries") },
    landlord: { g: "房", t: L("房东合法筛选租客", "Screening tenants legally"), d: L("哪些可以查、哪些不能问", "What landlords can and can't ask") }
  };

  /* ---------- calendar data (shared by 挪车 / 放假) ---------- */
  let CAL = null;
  const loadCal = () => CAL ? Promise.resolve(CAL) : getJSON("data/calendar.json?v=" + Math.floor(Date.now() / 3600e3)).then(d => (CAL = d));
  const ASP_ZH = { "New Year's Day": "元旦", "Three Kings' Day": "三王节", "Martin Luther King, Jr.'s Birthday": "马丁·路德·金纪念日", "Lincoln's Birthday": "林肯诞辰",
    "Washington's Birthday (Pres. Day)": "总统日", "Lunar New Year's Eve": "农历除夕", "Lunar New Year": "农历新年", "Ash Wednesday": "圣灰星期三", "Losar (Tibetan New Year)": "藏历新年",
    "Purim": "普林节", "Idul-Fitr (Eid Al-Fitr)": "开斋节", "Holy Thursday": "濯足节", "Passover": "逾越节", "Good Friday": "耶稣受难日", "Passover (7th Day)": "逾越节（第7天）",
    "Passover (8th Day)": "逾越节（第8天）", "Holy Thursday (Orthodox)": "东正教濯足节", "Good Friday (Orthodox)": "东正教受难日", "Solemnity of the Ascension": "耶稣升天节",
    "Shavuoth (1st Day)": "七七节", "Shavuoth (2nd Day)": "七七节", "Memorial Day": "阵亡将士纪念日", "Idul-Adha (Eid Al-Adha)": "宰牲节", "Juneteenth": "六月节",
    "Independence Day": "独立日", "Tisha B'Av": "圣殿被毁日", "Feast of the Assumption": "圣母升天节", "Labor Day": "劳动节", "Rosh Hashanah": "犹太新年", "Yom Kippur": "赎罪日",
    "Succoth (1st Day)": "住棚节", "Succoth (2nd Day)": "住棚节", "Shemini Atzereth": "圣会节", "Simchas Torah": "西赫托拉节", "Columbus Day": "哥伦布日", "All Saints' Day": "诸圣节",
    "Election Day": "选举日", "Diwali": "排灯节", "Veterans Day": "退伍军人节", "Thanksgiving Day": "感恩节", "Immaculate Conception": "圣母无染原罪节", "Christmas Day": "圣诞节" };
  const aspName = n => Z ? (ASP_ZH[n] || n) : n;
  const CAL_EN = { "元旦": "New Year's Day", "六月节": "Juneteenth", "六月节（补假）": "Juneteenth (observed)", "冬季假期": "Winter recess", "劳动节": "Labor Day", "哥伦布日": "Columbus Day",
    "圣诞节": "Christmas", "圣诞节（补假）": "Christmas (observed)", "宰牲节": "Eid al-Adha", "寒假": "Midwinter recess", "开学第一天": "First day of school", "开斋节": "Eid al-Fitr",
    "总统日": "Presidents' Day", "意大利传统日/原住民日": "Italian Heritage / Indigenous Peoples' Day", "感恩节": "Thanksgiving", "感恩节假期": "Thanksgiving recess",
    "教师会议日（学生不上学）": "Chancellor's conference day (no school for students)", "教师行政日（大部分学校停课）": "Clerical day (most schools closed)", "春假": "Spring recess",
    "最后一天上学": "Last day of school", "独立日": "Independence Day", "独立日（补假）": "Independence Day (observed)", "耶稣受难日": "Good Friday", "赎罪日 Yom Kippur": "Yom Kippur",
    "退伍军人节": "Veterans Day", "选举日：全体在家网课": "Election Day: remote learning", "阵亡将士纪念日": "Memorial Day", "马丁·路德·金纪念日": "Martin Luther King Jr. Day" };
  const calName = n => Z ? n : (CAL_EN[n] || n);
  const on = (list, d) => (list || []).filter(x => x.d === d);
  const weekend = d => [0, 6].includes(new Date(d + "T12:00:00").getDay());

  function aspHtml() {
    if (!CAL) return `<div class="skel"><i></i><i></i></div>`;
    const day = (d, label) => {
      const s = on(CAL.asp, d), sun = new Date(d + "T12:00:00").getDay() === 0;
      const off = s.length > 0, major = s.some(x => x.major);
      return `<div class="asp-day ${off || sun ? "ok" : "warn"}"><span>${esc(label)} · ${esc(dDate(d))}</span>
        <b>${off ? tx("✅ 扫街暂停，不用挪车", "✅ Suspended: no need to move your car") : sun ? tx("✅ 周日没有扫街", "✅ No street cleaning on Sundays") : tx("⚠️ 扫街照常，记得看路牌挪车", "⚠️ In effect: check the signs and move your car")}</b>
        ${off ? `<em>${esc(s.map(x => aspName(x.name)).join(tx("、", ", ")))}${major ? tx(" · 大节日：咪表也免费", " · Major holiday: meters free too") : tx(" · 咪表照常收费", " · Parking meters still in effect")}</em>` : ""}</div>`;
    };
    const today = nyToday(), next = (CAL.asp || []).filter(x => x.d > nyToday(1)).slice(0, 8);
    return `${day(today, tx("今天", "Today"))}${day(nyToday(1), tx("明天", "Tomorrow"))}
      <p class="tl-note">${tx("下雪、紧急情况时市政府也会临时暂停扫街，这里可能来不及显示。最准的是打 311，或订阅 Notify NYC 短信通知。", "The city can also suspend street cleaning for snow or emergencies, which may not show here in time. Call 311 or sign up for Notify NYC texts for the latest.")}</p>
      <h3 class="cal-h">${tx("接下来的暂停日", "Upcoming suspensions")}</h3><ul class="cal-list">${next.map(x => `<li><b>${esc(dDate(x.d))}</b><span>${esc(aspName(x.name))}${x.major ? tx("（咪表也免费）", " (meters free too)") : ""}</span></li>`).join("") || `<li>${tx("今年没有更多了", "No more this year")}</li>`}</ul>
      <p class="tl-note">${tx("资料来源：纽约市交通局（DOT）官方扫街暂停日历，每天自动更新。", "Source: NYC DOT alternate side parking calendar, updated daily.")}</p>`;
  }

  function holidayHtml() {
    if (!CAL) return `<div class="skel"><i></i><i></i></div>`;
    const row = d => {
      const sch = on(CAL.school, d), tr = on(CAL.trash, d), fed = on(CAL.federal, d), asp = on(CAL.asp, d), we = weekend(d), sun = new Date(d + "T12:00:00").getDay() === 0;
      const note = on(CAL.schoolNotes, d);
      const item = (icon, label, closed, why) => `<li class="${closed ? "off" : ""}"><i>${icon}</i><b>${label}</b><span>${closed ? tx("休息", "Closed") : tx("正常", "Normal")}${why ? tx("（", " (") + esc(why) + tx("）", ")") : ""}</span></li>`;
      return `<ul class="hol-grid">
        ${item("🏫", tx("公立学校", "Public schools"), sch.length || we, sch.length ? calName(sch[0].name) : we ? tx("周末", "weekend") : note.length ? calName(note[0].name) : "")}
        ${item("🗑️", tx("垃圾收集", "Trash pickup"), tr.length || sun, tr.length ? calName(tr[0].name) : sun ? tx("周日", "Sunday") : "")}
        ${item("🏦", tx("银行 / 邮局", "Banks / post office"), fed.length || sun, fed.length ? calName(fed[0].name) : sun ? tx("周日", "Sunday") : "")}
        ${item("🚗", tx("扫街停车", "Street cleaning"), asp.length || sun, asp.length ? aspName(asp[0].name) : sun ? tx("周日", "Sunday") : "")}
      </ul>`;
    };
    const t = nyToday();
    const up = []; for (let i = 1; i <= 45 && up.length < 12; i++) { const d = nyToday(i); const tags = [on(CAL.school, d).length && tx("学校放假", "No school"), on(CAL.trash, d).length && tx("不收垃圾", "No trash pickup"), on(CAL.federal, d).length && tx("银行邮局休息", "Banks & post office closed"), on(CAL.asp, d).length && tx("扫街暂停", "No street cleaning")].filter(Boolean);
      const hn = on(CAL.federal, d)[0] || on(CAL.school, d)[0] || on(CAL.trash, d)[0];
      if (tags.length) up.push(`<li><b>${esc(dDate(d))}</b><span>${esc(tags.join(" · "))}</span><em>${esc(hn ? calName(hn.name) : aspName((on(CAL.asp, d)[0] || {}).name || ""))}</em></li>`); }
    return `<h3 class="cal-h">${tx("今天", "Today,")} ${esc(dDate(t))}</h3>${row(t)}<h3 class="cal-h">${tx("明天", "Tomorrow,")} ${esc(dDate(nyToday(1)))}</h3>${row(nyToday(1))}
      <h3 class="cal-h">${tx("接下来的假日", "Coming up")}</h3><ul class="cal-list">${up.join("") || `<li>${tx("近期没有", "Nothing soon")}</li>`}</ul>
      <p class="tl-note">${tx("学校日历来自纽约市教育局 2026-27 学年官方日历；垃圾收集按清洁局公告；扫街每天从交通局自动更新。下雪等临时停课、停收以官方通知为准。", "School dates: NYC DOE 2026-27 calendar. Trash: DSNY holiday schedule. Street cleaning: NYC DOT, updated daily. Snow days and other last-minute changes follow official announcements.")}</p>`;
  }

  /* ---------- 查楼房记录 ---------- */
  const BORO = { 1: "MANHATTAN", 2: "BRONX", 3: "BROOKLYN", 4: "QUEENS", 5: "STATEN ISLAND" };
  const PROBLEMS = [[L("💧 漏水 / 水渍", "💧 Leaks / water damage"), /LEAK|WATER DAMAGE|WATER STAIN/i], [L("🔥 没暖气 / 没热水", "🔥 No heat / hot water"), /HEAT|HOT WATER/i], [L("🪳 蟑螂", "🪳 Roaches"), /ROACH/i], [L("🐭 老鼠", "🐭 Mice / rats"), /MICE|RATS?\b|RODENT/i],
    [L("🍄 发霉", "🍄 Mold"), /MOLD/i], [L("🛏️ 臭虫", "🛏️ Bedbugs"), /BED ?BUG/i], [L("🎨 铅漆", "🎨 Lead paint"), /LEAD/i], [L("🚪 门窗锁坏", "🚪 Doors, windows, locks"), /DOOR|WINDOW|LOCK/i], [L("⚡ 电路 / 燃气", "⚡ Electrical / gas"), /ELECTRIC|GAS\b|SMOKE DETECTOR|CARBON MONOXIDE/i]];
  const T311 = { "HEAT/HOT WATER": "暖气 / 热水", "PLUMBING": "水管", "UNSANITARY CONDITION": "卫生问题", "PAINT/PLASTER": "墙面 / 油漆", "WATER LEAK": "漏水", "Noise - Residential": "邻居噪音",
    "Illegal Parking": "违规停车", "Blocked Driveway": "车道被堵", "Noise - Street/Sidewalk": "街上噪音", "Rodent": "老鼠", "DOOR/WINDOW": "门窗", "ELECTRIC": "电路", "GENERAL": "一般问题",
    "ELEVATOR": "电梯", "FLOORING/STAIRS": "地板 / 楼梯", "APPLIANCE": "电器", "SAFETY": "安全", "Dirty Condition": "脏乱", "Building/Use": "违规用途", "Non-Residential Heat": "商业暖气" };
  let bState = { q: "", busy: false, html: "" };
  function buildingHtml() {
    return `<form class="tr-code b-form" data-bform><input name="q" value="${esc(bState.q)}" placeholder="${tx("输入地址，例如 41-60 Main St, Queens", "Address, e.g. 41-60 Main St, Queens")}" aria-label="${tx("地址", "Address")}" autocomplete="street-address"><button class="btn" type="submit">${tx("查询", "Search")}</button></form>
      <p class="tl-note">${tx("资料全部来自纽约市政府公开数据（住房局 HPD 违规和投诉、311 投诉），只显示楼房的情况，不显示任何个人信息。", "All data comes from NYC Open Data (HPD violations and complaints, 311 complaints). It shows the building only, never anyone's personal information.")}</p>
      <div id="bOut">${bState.html}</div>`;
  }
  async function runBuilding(el, q) {
    const out = el.querySelector("#bOut"); bState.q = q; out.innerHTML = `<div class="skel"><i></i><i></i><i></i></div>`;
    try {
      const g = await getJSON("https://geosearch.planninglabs.nyc/v2/search?size=1&text=" + encodeURIComponent(q));
      const f = (g.features || [])[0], bbl = f && f.properties.addendum && f.properties.addendum.pad && f.properties.addendum.pad.bbl;
      if (!bbl) { out.innerHTML = `<p class="tl-note">${tx("找不到这个地址，请写完整：门牌号 + 街名 + 区（例如 133-35 Roosevelt Ave, Queens）。", "Address not found. Please include number, street and borough (e.g. 133-35 Roosevelt Ave, Queens).")}</p>`; return; }
      const label = f.properties.label.replace(/, USA$/, ""), boro = BORO[bbl[0]], block = String(+bbl.slice(1, 6)), lot = String(+bbl.slice(6));
      const since = ago(3);
      const [viol, comp, c311] = await Promise.all([
        getJSON(`${SOC}wvxf-dwi5.json?$limit=3000&$select=class,violationstatus,novdescription,inspectiondate&$where=${encodeURIComponent(`bbl='${bbl}' AND inspectiondate > '${since}'`)}`).catch(() => null),
        getJSON(`${SOC}ygpa-z7cr.json?$limit=1&$select=count(*)%20as%20n&$where=${encodeURIComponent(`borough='${boro}' AND block='${block}' AND lot='${lot}' AND received_date > '${since}'`)}`).catch(() => null),
        getJSON(`${SOC}erm2-nwe9.json?$select=complaint_type,count(*)%20as%20n&$group=complaint_type&$order=n%20DESC&$limit=8&$where=${encodeURIComponent(`bbl='${bbl}' AND created_date > '${since}'`)}`).catch(() => null)
      ]);
      const V = viol || [], open = V.filter(v => /open/i.test(v.violationstatus || "")), openC = open.filter(v => v.class === "C");
      const counts = PROBLEMS.map(([name, re]) => [tx(name.zh, name.en), V.filter(v => re.test(v.novdescription || "")).length, open.filter(v => re.test(v.novdescription || "")).length]).filter(x => x[1]);
      const nComp = comp && comp[0] ? +comp[0].n : null, n311 = (c311 || []).reduce((a, x) => a + +x.n, 0);
      const level = openC.length >= 5 || open.length >= 30 ? ["bad", tx("问题比较多，租之前一定要去看房、问清楚", "Many problems: visit in person and ask questions before you rent")] : open.length >= 8 || openC.length >= 1 ? ["mid", tx("有一些未解决的问题，看房时留意", "Some open problems: look closely when you visit")] : ["good", tx("近三年记录比较少", "Few records in the last 3 years")];
      bState.html = `<section class="b-card ${level[0]}"><h3>${esc(label)}</h3><p class="b-level">${esc(level[1])}</p>
        <div class="b-stats"><div><b>${open.length}</b><span>${tx("未解决的住房违规", "Open HPD violations")}</span></div><div><b>${openC.length}</b><span>${tx("其中危险级（C 级）", "Immediately hazardous (Class C)")}</span></div>
        <div><b>${nComp == null ? "—" : nComp}</b><span>${tx("近 3 年住房局投诉", "HPD complaints, last 3 years")}</span></div><div><b>${c311 ? n311 : "—"}</b><span>${tx("近 3 年 311 投诉", "311 complaints, last 3 years")}</span></div></div>
        ${counts.length ? `<h4>${tx("近 3 年发现的问题", "Problems found in the last 3 years")}</h4><ul class="b-chips">${counts.map(([n, all, op]) => `<li>${esc(n)} <b>${all}</b>${op ? `<em>${op} ${tx("个未解决", "open")}</em>` : ""}</li>`).join("")}</ul>` : `<p class="tl-note">${tx("近 3 年没有发现漏水、暖气、蟑螂、老鼠这类违规。", "No leak, heat, roach or rodent violations in the last 3 years.")}</p>`}
        ${c311 && c311.length ? `<h4>${tx("311 投诉最多的是", "Top 311 complaints")}</h4><ul class="b-chips">${c311.slice(0, 6).map(x => `<li>${esc(Z ? (T311[x.complaint_type] || x.complaint_type) : x.complaint_type)} <b>${esc(x.n)}</b></li>`).join("")}</ul>` : ""}
        <p class="tl-note">${tx("C 级 = 立即危险（例如没暖气、铅漆、老鼠），B 级 = 危险，A 级 = 不危险。大楼户数越多，记录自然越多，请结合楼的大小来看。资料来源：NYC Open Data。", "Class C = immediately hazardous (e.g. no heat, lead paint, rodents), B = hazardous, A = non-hazardous. Bigger buildings naturally have more records, so consider the size. Source: NYC Open Data.")}</p></section>`;
      out.innerHTML = bState.html;
    } catch (e) { out.innerHTML = `<p class="tl-note">${tx("暂时查不到", "Couldn't load right now")} (${esc(e.message)})${tx("，请稍后再试。", ". Please try again later.")}</p>`; }
  }

  /* ---------- 平价房抽签 ---------- */
  // HPD 2026 New York City AMI, 100% column, by household size 1–8 (nyc.gov/hpd → Area Median Income)
  const AMI100 = [118800, 135700, 152700, 169600, 183200, 196800, 210400, 223900];
  const BANDS = [["extremely_low", L("极低收入", "Extremely low income"), 0, 30], ["very_low", L("很低收入", "Very low income"), 31, 50], ["low", L("低收入", "Low income"), 51, 80], ["moderate", L("中等收入", "Moderate income"), 81, 120], ["middle", L("中高收入", "Middle income"), 121, 165]];
  const BORO2 = { BX: L("布朗克斯", "Bronx"), BK: L("布鲁克林", "Brooklyn"), MN: L("曼哈顿", "Manhattan"), QN: L("皇后区", "Queens"), SI: L("史丹顿岛", "Staten Island") };
  const bn = b => tx(b[1].zh, b[1].en);
  let LOT = null, lState = { size: 2, income: "" };
  function lotteryHtml() {
    const inc = parseFloat(String(lState.income).replace(/[$,\s]/g, "")), pct = inc > 0 ? Math.round(inc / AMI100[lState.size - 1] * 100) : null;
    const myBand = pct == null ? null : BANDS.find(b => pct <= b[3]) || null;
    const form = `<div class="tl-calc lot-calc"><label class="tl-f"><span>${tx("家里几口人", "Household size")}</span><select data-lsize>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option${n === lState.size ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="tl-f"><span>${tx("全家一年税前总收入（美元）", "Total household income before tax, per year ($)")}</span><input data-linc inputmode="numeric" value="${esc(lState.income)}" placeholder="${tx("例如 60000", "e.g. 60000")}"></label>
      ${pct != null ? (Z ? `<p class="lot-me">你的收入约是纽约「地区中位收入」的 <b>${pct}%</b>${myBand ? `，属于 <b>${esc(bn(myBand))}</b>（${myBand[2]}–${myBand[3]}%）` : "，超过大部分抽签的上限"}。下面标绿的抽签有这个档次的房子。</p>`
        : `<p class="lot-me">Your income is about <b>${pct}%</b> of NYC's Area Median Income${myBand ? `: <b>${esc(bn(myBand))}</b> (${myBand[2]}–${myBand[3]}%)` : ", above most lottery limits"}. Lotteries marked green have units at this level.</p>`) : `<p class="tl-note">${tx("填上收入，马上看哪些抽签适合你。", "Enter your income to see which lotteries fit.")}</p>`}</div>`;
    if (!LOT) return form + `<div class="skel"><i></i><i></i><i></i></div>`;
    const rows = LOT.map(x => {
      const bands = BANDS.filter(b => +x["applied_income_ami_" + b[0]] > 0), fit = myBand && +x["applied_income_ami_" + myBand[0]] > 0;
      const beds = [["studio", tx("单间", "Studio")], ["1bed", tx("1房", "1BR")], ["2bed", tx("2房", "2BR")], ["3bed", tx("3房", "3BR")], ["4bed", tx("4房", "4BR")]].filter(([k]) => +x["unit_distribution_" + k] > 0).map(([k, n]) => `${n} ${x["unit_distribution_" + k]}`).join(" · ");
      return `<li class="${fit ? "fit" : ""}"><div><b>${esc(x.lottery_name)}</b><span>${esc(BORO2[x.borough] ? tx(BORO2[x.borough].zh, BORO2[x.borough].en) : x.borough || "")}${x.postcode ? " " + esc(x.postcode) : ""} · ${x.development_type === "Sale" ? tx("出售", "For sale") : tx("出租", "Rental")} · ${esc(x.unit_count)} ${tx("套", "units")}</span>
        <span>${esc(beds)}</span><span class="lot-bands">${bands.map(b => `<i>${esc(bn(b))}</i>`).join("")}</span></div><em>${tx("截止", "Deadline")}<br>${esc(dDate(x.lottery_end_date.slice(0, 10)))}</em></li>`;
    });
    return form + `<h3 class="cal-h">${tx(`正在接受申请（${LOT.length} 个）`, `Open now (${LOT.length})`)}</h3><ul class="lot-list">${rows.join("") || `<li>${tx("现在没有开放的抽签", "No lotteries open right now")}</li>`}</ul>
      <p><a class="btn" href="https://housingconnect.nyc.gov/" target="_blank" rel="noopener">${tx("去 Housing Connect 官网免费申请", "Apply free on Housing Connect")}</a></p>
      <p class="tl-note">${tx("申请完全免费，有人收钱「保证抽中」都是骗子。每个抽签还有最低收入要求，具体以官网为准。收入标准用的是纽约市住房局 2026 年地区中位收入（AMI）表。资料来源：NYC Open Data，每天更新。", "Applying is free. Anyone charging to \"guarantee\" a unit is a scammer. Each lottery also has a minimum income; check the official site. Income levels use HPD's 2026 AMI table. Source: NYC Open Data, updated daily.")}</p>`;
  }

  /* ---------- 附近免费资源 ---------- */
  let FM = { map: null, layers: {}, pos: null, data: null, show: { wc: true, wifi: true, lib: true } };
  function freemapHtml() {
    return `<div class="fm-bar">${[["wc", tx("🚻 公共厕所", "🚻 Restrooms")], ["wifi", tx("📶 免费 WiFi", "📶 Free Wi-Fi")], ["lib", tx("📚 图书馆", "📚 Libraries")]].map(([k, n]) => `<label><input type="checkbox" data-fm="${k}"${FM.show[k] ? " checked" : ""}> ${n}</label>`).join("")}<button type="button" class="linkbtn" data-fmloc>${tx("📍 用我的位置", "📍 Use my location")}</button></div>
      <div class="tr-map fm-map" id="fmMap"><span class="tr-map-load">${tx("地图加载中…", "Loading map…")}</span></div>
      <p class="tl-note">${tx("免费 WiFi 是街上的 LinkNYC 亭子（也能免费打美国电话、手机充电）。图书馆可以免费上网、借书、上英文课。资料来源：NYC Open Data。", "Free Wi-Fi comes from LinkNYC kiosks on the street (free US calls and phone charging too). Libraries offer free internet, books and English classes. Source: NYC Open Data.")}</p>`;
  }
  let leafP = null;
  const leaflet = () => window.L && window.L.map ? Promise.resolve() : leafP || (leafP = new Promise((ok, no) => {
    const c = document.createElement("link"); c.rel = "stylesheet"; c.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c);
    const j = document.createElement("script"); j.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; j.onload = ok; j.onerror = no; document.head.appendChild(j); }));
  async function freemapInit(el) {
    const box = el.querySelector("#fmMap"); if (!box) return;
    try { await leaflet(); } catch (e) { box.innerHTML = `<span class="tr-map-load">${tx("地图暂时打不开", "Map unavailable right now")}</span>`; return; }
    const L = window.L, c = FM.pos || { lat: 40.7590, lon: -73.8300 };
    box.innerHTML = "";
    const m = L.map(box, { scrollWheelZoom: false }).setView([c.lat, c.lon], 15); FM.map = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    if (FM.pos) L.circleMarker([c.lat, c.lon], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f6fd6", fillOpacity: 1 }).addTo(m).bindTooltip(tx("你在这里", "You are here"));
    if (!FM.data) {
      const [wc, wifi, lib] = await Promise.all([
        getJSON(`${SOC}i7jb-7jku.json?$limit=3000&$select=facility_name,location_type,status,latitude,longitude,hours_of_operation`).catch(() => getJSON(`${SOC}i7jb-7jku.json?$limit=3000`).catch(() => [])),
        getJSON(`${SOC}s4kf-3yrf.json?$limit=5000&$select=street_address,latitude,longitude&$where=${encodeURIComponent("link_installation_status='Live'")}`).catch(() => []),
        getJSON(`${SOC}kh3d-xhq7.json?$limit=200&$select=name,address,phone,latitude,longitude`).catch(() => [])
      ]);
      FM.data = { wc: wc.filter(x => x.latitude && !/not operational/i.test(x.status || "")), wifi: wifi.filter(x => x.latitude), lib: lib.filter(x => x.latitude) };
    }
    const ico = (t, cls) => L.divIcon({ className: "fm-ic " + cls, html: `<span>${t}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
    const mk = {
      wc: x => L.marker([+x.latitude, +x.longitude], { icon: ico("🚻", "wc") }).bindPopup(`<b>${esc(x.facility_name)}</b><br>${esc(x.location_type || "")}${x.hours_of_operation ? "<br>" + esc(x.hours_of_operation) : ""}`),
      wifi: x => L.marker([+x.latitude, +x.longitude], { icon: ico("📶", "wifi") }).bindPopup(`<b>${tx("免费 WiFi（LinkNYC）", "Free Wi-Fi (LinkNYC)")}</b><br>${esc(x.street_address || "")}`),
      lib: x => L.marker([+x.latitude, +x.longitude], { icon: ico("📚", "lib") }).bindPopup(`<b>${esc(x.name)} ${tx("图书馆", "Library")}</b><br>${esc(x.address || "")}<br>${esc(x.phone || "")}`)
    };
    const draw = () => { const b = m.getBounds().pad(0.3);
      for (const k of ["wc", "wifi", "lib"]) { if (FM.layers[k]) m.removeLayer(FM.layers[k]); if (!FM.show[k]) continue;
        FM.layers[k] = L.layerGroup(FM.data[k].filter(x => b.contains([+x.latitude, +x.longitude])).slice(0, 300).map(mk[k])).addTo(m); } };
    m.on("moveend", draw); FM.draw = draw; draw();
  }

  /* ---------- 房东合法筛选租客 ---------- */
  function landlordHtml() {
    if (Z) return `<div class="vb-guide">
      <p class="tl-note">纽约对出租房有很多保护租客的法律，房东问错问题、查错东西可能被罚款。下面是常见规则的整理，供参考，具体请问律师或纽约市人权委员会。</p>
      <h3>✅ 可以做的</h3><ul class="ad-steps">
        <li><b>查收入</b>：要求工资单、报税表、银行流水、工作证明。很多房东用「年收入是月租 40 倍」做参考。</li>
        <li><b>查信用</b>：经租客<b>书面同意</b>后查信用报告。纽约州法律规定，查信用和背景的费用<b>最多只能收 20 美元</b>，还要把报告给租客看。</li>
        <li><b>问前房东</b>：经同意后联系前房东，问交租是否准时、有没有损坏房子。</li>
        <li><b>收押金</b>：押金最多一个月房租，要存起来，退房后 14 天内退还或列出扣款明细。</li></ul>
      <h3>❌ 不能做的</h3><ul class="ad-steps">
        <li><b>查犯罪记录</b>：纽约市《公平机会住房法》（2025 年起）规定，大部分情况下房东不能在租房前查或问犯罪记录，也不能因此拒租。</li>
        <li><b>问身份</b>：不能因为移民身份、国籍、口音、语言拒租，也不能要求只租给有绿卡或公民身份的人。</li>
        <li><b>拒绝租房补助</b>：不能拒收 Section 8、CityFHEPS 等租房补助券（属于「收入来源歧视」，违法）。</li>
        <li><b>其他歧视</b>：不能因为种族、宗教、性别、年龄、家里有小孩、怀孕、残疾、性取向等拒租。</li>
        <li><b>查驱逐记录</b>：纽约州不允许因为租客以前打过租务官司就拒租。</li></ul>
      <h3>💡 怎么放心挑租客</h3><ul class="ad-steps">
        <li>所有申请人用<b>同一套标准</b>（同样的收入和信用要求），写下来，避免被认为歧视。</li>
        <li>签正式租约（中英文都可以），写清楚房租、押金、维修责任。</li>
        <li>收入不够的租客，可以请他找担保人（Guarantor）。</li></ul>
      <p class="tl-note">参考：纽约市人权委员会（NYC Commission on Human Rights）、纽约州 2019 年《住房稳定与租客保护法》。本页不是法律意见。</p></div>`;
    return `<div class="vb-guide">
      <p class="tl-note">New York has strong tenant-protection laws, and landlords can be fined for asking the wrong questions or running the wrong checks. Here is a summary of common rules for reference; ask a lawyer or the NYC Commission on Human Rights for your situation.</p>
      <h3>✅ What you can do</h3><ul class="ad-steps">
        <li><b>Check income</b>: ask for pay stubs, tax returns, bank statements or an employment letter. Many landlords use "annual income of 40× the monthly rent" as a guide.</li>
        <li><b>Check credit</b>: with the applicant's <b>written consent</b>. New York State caps the fee for credit and background checks at <b>$20</b>, and you must share the report with the applicant.</li>
        <li><b>Call past landlords</b>: with consent, ask whether rent was paid on time and whether the unit was damaged.</li>
        <li><b>Take a deposit</b>: at most one month's rent, held safely, returned (or itemized) within 14 days of move-out.</li></ul>
      <h3>❌ What you can't do</h3><ul class="ad-steps">
        <li><b>Criminal record checks</b>: under NYC's Fair Chance for Housing Act (from 2025), in most cases landlords can't ask about or check criminal history before renting, or reject someone because of it.</li>
        <li><b>Immigration status</b>: you can't reject applicants because of immigration status, national origin, accent or language, or rent only to green-card holders or citizens.</li>
        <li><b>Refusing rental assistance</b>: you can't refuse Section 8, CityFHEPS or other vouchers (illegal "source of income" discrimination).</li>
        <li><b>Other discrimination</b>: race, religion, gender, age, children, pregnancy, disability, sexual orientation and more are all protected.</li>
        <li><b>Housing court history</b>: New York State doesn't allow rejecting tenants because of past landlord-tenant cases.</li></ul>
      <h3>💡 Choosing tenants with confidence</h3><ul class="ad-steps">
        <li>Use <b>one written standard</b> for every applicant (same income and credit requirements) so you can't be accused of discrimination.</li>
        <li>Sign a proper lease (Chinese or English) covering rent, deposit and repairs.</li>
        <li>If an applicant's income is short, ask for a guarantor.</li></ul>
      <p class="tl-note">References: NYC Commission on Human Rights; NY State Housing Stability and Tenant Protection Act of 2019. This page is not legal advice.</p></div>`;
  }

  /* ---------- entry ---------- */
  function render(id, el, lang) {
    Z = lang !== "en";
    if (bState.lang !== Z) { bState.lang = Z; bState.html = ""; }
    const box = document.createElement("div"); box.className = "city-tool"; el.appendChild(box);
    const paint = () => { box.innerHTML = id === "asp" ? aspHtml() : id === "holiday" ? holidayHtml() : id === "building" ? buildingHtml() : id === "lottery" ? lotteryHtml() : id === "freemap" ? freemapHtml() : landlordHtml(); };
    paint();
    if (id === "asp" || id === "holiday") loadCal().then(paint).catch(() => { box.innerHTML = `<p class="tl-note">${tx("日历暂时打不开，请稍后再试。", "Calendar unavailable right now. Please try again later.")}</p>`; });
    if (id === "lottery" && !LOT) getJSON(`${SOC}vy5i-a666.json?$limit=200&$order=lottery_end_date&$where=${encodeURIComponent(`lottery_status='Active' AND lottery_end_date >= '${nyToday()}'`)}`).then(d => { LOT = d; paint(); }).catch(() => { LOT = []; paint(); });
    if (id === "freemap") { FM.map = null; freemapInit(el); }
    if (id === "building" && bState.q && !bState.html) runBuilding(box, bState.q);
    box.onsubmit = e => { const f = e.target.closest("[data-bform]"); if (!f) return; e.preventDefault(); const q = f.q.value.trim(); if (q.length >= 5) runBuilding(box, q); };
    box.oninput = e => { if (e.target.matches("[data-linc]")) { lState.income = e.target.value; const pos = e.target.selectionStart; paint(); const i = box.querySelector("[data-linc]"); i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) {} } };
    box.onchange = e => {
      if (e.target.matches("[data-lsize]")) { lState.size = +e.target.value; paint(); }
      if (e.target.matches("[data-fm]")) { FM.show[e.target.dataset.fm] = e.target.checked; if (FM.draw) FM.draw(); }
    };
    box.onclick = e => {
      if (e.target.closest("[data-fmloc]") && navigator.geolocation) navigator.geolocation.getCurrentPosition(p => { FM.pos = { lat: p.coords.latitude, lon: p.coords.longitude }; if (FM.map) { FM.map.remove(); FM.map = null; } freemapInit(box); }, () => {}, { timeout: 10000 });
    };
    if (id === "freemap" && navigator.geolocation && !FM.pos) navigator.geolocation.getCurrentPosition(p => { FM.pos = { lat: p.coords.latitude, lon: p.coords.longitude }; if (FM.map) { FM.map.setView([FM.pos.lat, FM.pos.lon], 15); window.L.circleMarker([FM.pos.lat, FM.pos.lon], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f6fd6", fillOpacity: 1 }).addTo(FM.map); } }, () => {}, { timeout: 10000, maximumAge: 600000 });
  }
  // One-line "today" summary for the home page.
  async function today() {
    await loadCal(); const d = nyToday(), dow = new Date(d + "T12:00:00").getDay(), sun = dow === 0, we = dow === 0 || dow === 6;
    const asp = on(CAL.asp, d), sch = on(CAL.school, d), tr = on(CAL.trash, d), fed = on(CAL.federal, d);
    const t1 = nyToday(1), asp1 = on(CAL.asp, t1);
    return { date: zhDate(d), dateEn: new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      aspWhyEn: asp.length ? asp[0].name : sun ? "Sunday" : "",
      aspOff: asp.length > 0 || sun, aspWhy: asp.length ? (ASP_ZH[asp[0].name] || asp[0].name) : sun ? "周日" : "",
      aspTomorrow: asp1.length > 0, aspTomorrowWhy: asp1.length ? (ASP_ZH[asp1[0].name] || asp1[0].name) : "",
      schoolOff: sch.length > 0 || we, trashOff: tr.length > 0 || sun, bankOff: fed.length > 0 || sun,
      holiday: (fed[0] || sch[0] || tr[0] || {}).name || "" };
  }
  window.HLCity = { TOOLS, render, today };
})();
