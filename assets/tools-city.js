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
  const aspName = n => ASP_ZH[n] || n;
  const on = (list, d) => (list || []).filter(x => x.d === d);
  const weekend = d => [0, 6].includes(new Date(d + "T12:00:00").getDay());

  function aspHtml() {
    if (!CAL) return `<div class="skel"><i></i><i></i></div>`;
    const day = (d, label) => {
      const s = on(CAL.asp, d), sun = new Date(d + "T12:00:00").getDay() === 0;
      const off = s.length > 0, major = s.some(x => x.major);
      return `<div class="asp-day ${off || sun ? "ok" : "warn"}"><span>${esc(label)} · ${esc(zhDate(d))}</span>
        <b>${off ? "✅ 扫街暂停，不用挪车" : sun ? "✅ 周日没有扫街" : "⚠️ 扫街照常，记得看路牌挪车"}</b>
        ${off ? `<em>${esc(s.map(x => aspName(x.name)).join("、"))}${major ? " · 大节日：咪表也免费" : " · 咪表照常收费"}</em>` : ""}</div>`;
    };
    const today = nyToday(), next = (CAL.asp || []).filter(x => x.d > nyToday(1)).slice(0, 8);
    return `${day(today, "今天")}${day(nyToday(1), "明天")}
      <p class="tl-note">下雪、紧急情况时市政府也会临时暂停扫街，这里可能来不及显示。最准的是打 311，或订阅 Notify NYC 短信通知。</p>
      <h3 class="cal-h">接下来的暂停日</h3><ul class="cal-list">${next.map(x => `<li><b>${esc(zhDate(x.d))}</b><span>${esc(aspName(x.name))}${x.major ? "（咪表也免费）" : ""}</span></li>`).join("") || "<li>今年没有更多了</li>"}</ul>
      <p class="tl-note">资料来源：纽约市交通局（DOT）官方扫街暂停日历，每天自动更新。</p>`;
  }

  function holidayHtml() {
    if (!CAL) return `<div class="skel"><i></i><i></i></div>`;
    const row = d => {
      const sch = on(CAL.school, d), tr = on(CAL.trash, d), fed = on(CAL.federal, d), asp = on(CAL.asp, d), we = weekend(d), sun = new Date(d + "T12:00:00").getDay() === 0;
      const note = on(CAL.schoolNotes, d);
      const item = (icon, label, closed, why) => `<li class="${closed ? "off" : ""}"><i>${icon}</i><b>${label}</b><span>${closed ? "休息" : "正常"}${why ? "（" + esc(why) + "）" : ""}</span></li>`;
      return `<ul class="hol-grid">
        ${item("🏫", "公立学校", sch.length || we, sch.length ? sch[0].name : we ? "周末" : note.length ? note[0].name : "")}
        ${item("🗑️", "垃圾收集", tr.length || sun, tr.length ? tr[0].name : sun ? "周日" : "")}
        ${item("🏦", "银行 / 邮局", fed.length || sun, fed.length ? fed[0].name : sun ? "周日" : "")}
        ${item("🚗", "扫街停车", asp.length || sun, asp.length ? aspName(asp[0].name) : sun ? "周日" : "")}
      </ul>`;
    };
    const t = nyToday();
    const up = []; for (let i = 1; i <= 45 && up.length < 12; i++) { const d = nyToday(i); const tags = [on(CAL.school, d).length && "学校放假", on(CAL.trash, d).length && "不收垃圾", on(CAL.federal, d).length && "银行邮局休息", on(CAL.asp, d).length && "扫街暂停"].filter(Boolean);
      if (tags.length) up.push(`<li><b>${esc(zhDate(d))}</b><span>${esc(tags.join(" · "))}</span><em>${esc((on(CAL.federal, d)[0] || on(CAL.school, d)[0] || on(CAL.trash, d)[0] || { name: aspName((on(CAL.asp, d)[0] || {}).name || "") }).name)}</em></li>`); }
    return `<h3 class="cal-h">今天 ${esc(zhDate(t))}</h3>${row(t)}<h3 class="cal-h">明天 ${esc(zhDate(nyToday(1)))}</h3>${row(nyToday(1))}
      <h3 class="cal-h">接下来的假日</h3><ul class="cal-list">${up.join("") || "<li>近期没有</li>"}</ul>
      <p class="tl-note">学校日历来自纽约市教育局 2026-27 学年官方日历；垃圾收集按清洁局公告；扫街每天从交通局自动更新。下雪等临时停课、停收以官方通知为准。</p>`;
  }

  /* ---------- 查楼房记录 ---------- */
  const BORO = { 1: "MANHATTAN", 2: "BRONX", 3: "BROOKLYN", 4: "QUEENS", 5: "STATEN ISLAND" };
  const PROBLEMS = [["💧 漏水 / 水渍", /LEAK|WATER DAMAGE|WATER STAIN/i], ["🔥 没暖气 / 没热水", /HEAT|HOT WATER/i], ["🪳 蟑螂", /ROACH/i], ["🐭 老鼠", /MICE|RATS?\b|RODENT/i],
    ["🍄 发霉", /MOLD/i], ["🛏️ 臭虫", /BED ?BUG/i], ["🎨 铅漆", /LEAD/i], ["🚪 门窗锁坏", /DOOR|WINDOW|LOCK/i], ["⚡ 电路 / 燃气", /ELECTRIC|GAS\b|SMOKE DETECTOR|CARBON MONOXIDE/i]];
  const T311 = { "HEAT/HOT WATER": "暖气 / 热水", "PLUMBING": "水管", "UNSANITARY CONDITION": "卫生问题", "PAINT/PLASTER": "墙面 / 油漆", "WATER LEAK": "漏水", "Noise - Residential": "邻居噪音",
    "Illegal Parking": "违规停车", "Blocked Driveway": "车道被堵", "Noise - Street/Sidewalk": "街上噪音", "Rodent": "老鼠", "DOOR/WINDOW": "门窗", "ELECTRIC": "电路", "GENERAL": "一般问题",
    "ELEVATOR": "电梯", "FLOORING/STAIRS": "地板 / 楼梯", "APPLIANCE": "电器", "SAFETY": "安全", "Dirty Condition": "脏乱", "Building/Use": "违规用途", "Non-Residential Heat": "商业暖气" };
  let bState = { q: "", busy: false, html: "" };
  function buildingHtml() {
    return `<form class="tr-code b-form" data-bform><input name="q" value="${esc(bState.q)}" placeholder="输入地址，例如 41-60 Main St, Queens" aria-label="地址" autocomplete="street-address"><button class="btn" type="submit">查询</button></form>
      <p class="tl-note">资料全部来自纽约市政府公开数据（住房局 HPD 违规和投诉、311 投诉），只显示楼房的情况，不显示任何个人信息。</p>
      <div id="bOut">${bState.html}</div>`;
  }
  async function runBuilding(el, q) {
    const out = el.querySelector("#bOut"); bState.q = q; out.innerHTML = `<div class="skel"><i></i><i></i><i></i></div>`;
    try {
      const g = await getJSON("https://geosearch.planninglabs.nyc/v2/search?size=1&text=" + encodeURIComponent(q));
      const f = (g.features || [])[0], bbl = f && f.properties.addendum && f.properties.addendum.pad && f.properties.addendum.pad.bbl;
      if (!bbl) { out.innerHTML = `<p class="tl-note">找不到这个地址，请写完整：门牌号 + 街名 + 区（例如 133-35 Roosevelt Ave, Queens）。</p>`; return; }
      const label = f.properties.label.replace(/, USA$/, ""), boro = BORO[bbl[0]], block = String(+bbl.slice(1, 6)), lot = String(+bbl.slice(6));
      const since = ago(3);
      const [viol, comp, c311] = await Promise.all([
        getJSON(`${SOC}wvxf-dwi5.json?$limit=3000&$select=class,violationstatus,novdescription,inspectiondate&$where=${encodeURIComponent(`bbl='${bbl}' AND inspectiondate > '${since}'`)}`).catch(() => null),
        getJSON(`${SOC}ygpa-z7cr.json?$limit=1&$select=count(*)%20as%20n&$where=${encodeURIComponent(`borough='${boro}' AND block='${block}' AND lot='${lot}' AND received_date > '${since}'`)}`).catch(() => null),
        getJSON(`${SOC}erm2-nwe9.json?$select=complaint_type,count(*)%20as%20n&$group=complaint_type&$order=n%20DESC&$limit=8&$where=${encodeURIComponent(`bbl='${bbl}' AND created_date > '${since}'`)}`).catch(() => null)
      ]);
      const V = viol || [], open = V.filter(v => /open/i.test(v.violationstatus || "")), openC = open.filter(v => v.class === "C");
      const counts = PROBLEMS.map(([name, re]) => [name, V.filter(v => re.test(v.novdescription || "")).length, open.filter(v => re.test(v.novdescription || "")).length]).filter(x => x[1]);
      const nComp = comp && comp[0] ? +comp[0].n : null, n311 = (c311 || []).reduce((a, x) => a + +x.n, 0);
      const level = openC.length >= 5 || open.length >= 30 ? ["bad", "问题比较多，租之前一定要去看房、问清楚"] : open.length >= 8 || openC.length >= 1 ? ["mid", "有一些未解决的问题，看房时留意"] : ["good", "近三年记录比较少"];
      bState.html = `<section class="b-card ${level[0]}"><h3>${esc(label)}</h3><p class="b-level">${esc(level[1])}</p>
        <div class="b-stats"><div><b>${open.length}</b><span>未解决的住房违规</span></div><div><b>${openC.length}</b><span>其中危险级（C 级）</span></div>
        <div><b>${nComp == null ? "—" : nComp}</b><span>近 3 年住房局投诉</span></div><div><b>${c311 ? n311 : "—"}</b><span>近 3 年 311 投诉</span></div></div>
        ${counts.length ? `<h4>近 3 年发现的问题</h4><ul class="b-chips">${counts.map(([n, all, op]) => `<li>${esc(n)} <b>${all}</b>${op ? `<em>${op} 个未解决</em>` : ""}</li>`).join("")}</ul>` : `<p class="tl-note">近 3 年没有发现漏水、暖气、蟑螂、老鼠这类违规。</p>`}
        ${c311 && c311.length ? `<h4>311 投诉最多的是</h4><ul class="b-chips">${c311.slice(0, 6).map(x => `<li>${esc(T311[x.complaint_type] || x.complaint_type)} <b>${esc(x.n)}</b></li>`).join("")}</ul>` : ""}
        <p class="tl-note">C 级 = 立即危险（例如没暖气、铅漆、老鼠），B 级 = 危险，A 级 = 不危险。大楼户数越多，记录自然越多，请结合楼的大小来看。资料来源：NYC Open Data。</p></section>`;
      out.innerHTML = bState.html;
    } catch (e) { out.innerHTML = `<p class="tl-note">暂时查不到（${esc(e.message)}），请稍后再试。</p>`; }
  }

  /* ---------- 平价房抽签 ---------- */
  // HPD 2026 New York City AMI, 100% column, by household size 1–8 (nyc.gov/hpd → Area Median Income)
  const AMI100 = [118800, 135700, 152700, 169600, 183200, 196800, 210400, 223900];
  const BANDS = [["extremely_low", "极低收入", 0, 30], ["very_low", "很低收入", 31, 50], ["low", "低收入", 51, 80], ["moderate", "中等收入", 81, 120], ["middle", "中高收入", 121, 165]];
  const BORO2 = { BX: "布朗克斯", BK: "布鲁克林", MN: "曼哈顿", QN: "皇后区", SI: "史丹顿岛" };
  let LOT = null, lState = { size: 2, income: "" };
  function lotteryHtml() {
    const inc = parseFloat(String(lState.income).replace(/[$,\s]/g, "")), pct = inc > 0 ? Math.round(inc / AMI100[lState.size - 1] * 100) : null;
    const myBand = pct == null ? null : BANDS.find(b => pct <= b[3]) || null;
    const form = `<div class="tl-calc lot-calc"><label class="tl-f"><span>家里几口人</span><select data-lsize>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option${n === lState.size ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="tl-f"><span>全家一年税前总收入（美元）</span><input data-linc inputmode="numeric" value="${esc(lState.income)}" placeholder="例如 60000"></label>
      ${pct != null ? `<p class="lot-me">你的收入约是纽约「地区中位收入」的 <b>${pct}%</b>${myBand ? `，属于 <b>${esc(myBand[1])}</b>（${myBand[2]}–${myBand[3]}%）` : "，超过大部分抽签的上限"}。下面标绿的抽签有这个档次的房子。</p>` : `<p class="tl-note">填上收入，马上看哪些抽签适合你。</p>`}</div>`;
    if (!LOT) return form + `<div class="skel"><i></i><i></i><i></i></div>`;
    const rows = LOT.map(x => {
      const bands = BANDS.filter(b => +x["applied_income_ami_" + b[0]] > 0), fit = myBand && +x["applied_income_ami_" + myBand[0]] > 0;
      const beds = [["studio", "单间"], ["1bed", "1房"], ["2bed", "2房"], ["3bed", "3房"], ["4bed", "4房"]].filter(([k]) => +x["unit_distribution_" + k] > 0).map(([k, n]) => `${n} ${x["unit_distribution_" + k]}`).join(" · ");
      return `<li class="${fit ? "fit" : ""}"><div><b>${esc(x.lottery_name)}</b><span>${esc(BORO2[x.borough] || x.borough || "")}${x.postcode ? " " + esc(x.postcode) : ""} · ${x.development_type === "Sale" ? "出售" : "出租"} · ${esc(x.unit_count)} 套</span>
        <span>${esc(beds)}</span><span class="lot-bands">${bands.map(b => `<i>${esc(b[1])}</i>`).join("")}</span></div><em>截止<br>${esc(zhDate(x.lottery_end_date.slice(0, 10)))}</em></li>`;
    });
    return form + `<h3 class="cal-h">正在接受申请（${LOT.length} 个）</h3><ul class="lot-list">${rows.join("") || "<li>现在没有开放的抽签</li>"}</ul>
      <p><a class="btn" href="https://housingconnect.nyc.gov/" target="_blank" rel="noopener">去 Housing Connect 官网免费申请</a></p>
      <p class="tl-note">申请完全免费，有人收钱「保证抽中」都是骗子。每个抽签还有最低收入要求，具体以官网为准。收入标准用的是纽约市住房局 2026 年地区中位收入（AMI）表。资料来源：NYC Open Data，每天更新。</p>`;
  }

  /* ---------- 附近免费资源 ---------- */
  let FM = { map: null, layers: {}, pos: null, data: null, show: { wc: true, wifi: true, lib: true } };
  function freemapHtml() {
    return `<div class="fm-bar">${[["wc", "🚻 公共厕所"], ["wifi", "📶 免费 WiFi"], ["lib", "📚 图书馆"]].map(([k, n]) => `<label><input type="checkbox" data-fm="${k}"${FM.show[k] ? " checked" : ""}> ${n}</label>`).join("")}<button type="button" class="linkbtn" data-fmloc>📍 用我的位置</button></div>
      <div class="tr-map fm-map" id="fmMap"><span class="tr-map-load">地图加载中…</span></div>
      <p class="tl-note">免费 WiFi 是街上的 LinkNYC 亭子（也能免费打美国电话、手机充电）。图书馆可以免费上网、借书、上英文课。资料来源：NYC Open Data。</p>`;
  }
  let leafP = null;
  const leaflet = () => window.L && window.L.map ? Promise.resolve() : leafP || (leafP = new Promise((ok, no) => {
    const c = document.createElement("link"); c.rel = "stylesheet"; c.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c);
    const j = document.createElement("script"); j.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; j.onload = ok; j.onerror = no; document.head.appendChild(j); }));
  async function freemapInit(el) {
    const box = el.querySelector("#fmMap"); if (!box) return;
    try { await leaflet(); } catch (e) { box.innerHTML = `<span class="tr-map-load">地图暂时打不开</span>`; return; }
    const L = window.L, c = FM.pos || { lat: 40.7590, lon: -73.8300 };
    box.innerHTML = "";
    const m = L.map(box, { scrollWheelZoom: false }).setView([c.lat, c.lon], 15); FM.map = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    if (FM.pos) L.circleMarker([c.lat, c.lon], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f6fd6", fillOpacity: 1 }).addTo(m).bindTooltip("你在这里");
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
      wifi: x => L.marker([+x.latitude, +x.longitude], { icon: ico("📶", "wifi") }).bindPopup(`<b>免费 WiFi（LinkNYC）</b><br>${esc(x.street_address || "")}`),
      lib: x => L.marker([+x.latitude, +x.longitude], { icon: ico("📚", "lib") }).bindPopup(`<b>${esc(x.name)} 图书馆</b><br>${esc(x.address || "")}<br>${esc(x.phone || "")}`)
    };
    const draw = () => { const b = m.getBounds().pad(0.3);
      for (const k of ["wc", "wifi", "lib"]) { if (FM.layers[k]) m.removeLayer(FM.layers[k]); if (!FM.show[k]) continue;
        FM.layers[k] = L.layerGroup(FM.data[k].filter(x => b.contains([+x.latitude, +x.longitude])).slice(0, 300).map(mk[k])).addTo(m); } };
    m.on("moveend", draw); FM.draw = draw; draw();
  }

  /* ---------- 房东合法筛选租客 ---------- */
  function landlordHtml() {
    return `<div class="vb-guide">
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
  }

  /* ---------- entry ---------- */
  function render(id, el, lang) {
    const box = document.createElement("div"); box.className = "city-tool"; el.appendChild(box);
    const paint = () => { box.innerHTML = id === "asp" ? aspHtml() : id === "holiday" ? holidayHtml() : id === "building" ? buildingHtml() : id === "lottery" ? lotteryHtml() : id === "freemap" ? freemapHtml() : landlordHtml(); };
    paint();
    if (id === "asp" || id === "holiday") loadCal().then(paint).catch(() => { box.innerHTML = `<p class="tl-note">日历暂时打不开，请稍后再试。</p>`; });
    if (id === "lottery" && !LOT) getJSON(`${SOC}vy5i-a666.json?$limit=200&$order=lottery_end_date&$where=${encodeURIComponent(`lottery_status='Active' AND lottery_end_date >= '${nyToday()}'`)}`).then(d => { LOT = d; paint(); }).catch(() => { LOT = []; paint(); });
    if (id === "freemap") { FM.map = null; freemapInit(el); }
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
      aspOff: asp.length > 0 || sun, aspWhy: asp.length ? aspName(asp[0].name) : sun ? "周日" : "",
      aspTomorrow: asp1.length > 0, aspTomorrowWhy: asp1.length ? aspName(asp1[0].name) : "",
      schoolOff: sch.length > 0 || we, trashOff: tr.length > 0 || sun, bankOff: fed.length > 0 || sun,
      holiday: (fed[0] || sch[0] || tr[0] || {}).name || "" };
  }
  window.HLCity = { TOOLS, render, today };
})();
