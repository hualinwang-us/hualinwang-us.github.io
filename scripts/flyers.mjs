// 华人超市每周特价单: collects each supermarket's OWN weekly flyer images from its official website.
// Runs in GitHub Actions (Fridays). Writes data/flyers.json. Images are linked (not copied) with a link to the official page.
import fs from "node:fs/promises";
// A few store sites have broken HTTPS certificates; we only read their public flyer images.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); };
const imgsOf = t => [...new Set([...t.matchAll(/https?:\/\/[^"'\s)\\<>]+?\.(?:jpe?g|png|webp)/gi)].map(m => m[0].replace(/%7E/gi, "~")))]
  .filter(u => !/favicon|logo|icon|dummy|cropped-|parastorage|placeholder|-\d+x\d+\.|\/v1\/(fill|fit|crop)\//i.test(u));
// area keys: fl 法拉盛, el 艾姆赫斯特, co 可乐娜, ln 小颈/湾边, mh 曼哈顿华埠, bk 布鲁克林, si 史丹顿岛, li 长岛
const STORES = [
  { id: "jmart", name: "新世界超市 J-Mart", en: "J-Mart", areas: ["fl", "ln", "bk"], locs: ["法拉盛 New World Mall 136-20 Roosevelt Ave", "小颈 Little Neck", "布鲁克林 Bensonhurst"],
    page: "https://www.newworldmallnyc.com/jmart-weekly-special", home: "https://www.newworldmallnyc.com/", keep: u => /wixstatic\.com\/media\/1dffbd_/.test(u) },
  { id: "hualian", name: "华联超市（法拉盛店）", en: "Hua Lian", areas: ["fl"], locs: ["法拉盛"],
    page: "https://www.hualiansupermarket.com/weeklysales", home: "https://www.hualiansupermarket.com/", keep: u => /wixstatic\.com\/media\/fd78f3_/.test(u) },
  { id: "hualian-n", name: "华联超市（北方大道店）", en: "Hua Lian Northern", areas: ["fl"], locs: ["法拉盛 北方大道"],
    page: "https://www.hualiansupermarket.com/feature-items", home: "https://www.hualiansupermarket.com/", keep: u => /wixstatic\.com\/media\/fd78f3_/.test(u) },
  { id: "seasonfresh", name: "双福超市 SeasonFresh", en: "SeasonFresh", areas: ["fl", "el"], locs: ["法拉盛", "艾姆赫斯特 Elmhurst"],
    page: "https://www.sf-supermarket.com/weeklyad", home: "https://www.sf-supermarket.com/", keep: u => /wixstatic\.com\/media\/3ef6f0_/.test(u) },
  { id: "yongfa", name: "新中美超市", en: "Yongfa", areas: ["fl"], locs: ["法拉盛"],
    page: "https://yongfasupermarket.com/index.php/weeklydeal/", home: "https://yongfasupermarket.com/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  { id: "gofresh-eb", name: "Go新鲜超市（东百老汇店）", en: "Go Fresh East Broadway", areas: ["mh"], locs: ["曼哈顿华埠 East Broadway"],
    page: "https://gofresh365.com/new-york-east-broadway-special-offers/", home: "https://gofresh365.com/weekly-special-offers/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  { id: "gofresh-mott", name: "Go新鲜超市（勿街店）", en: "Go Fresh Mott St", areas: ["mh"], locs: ["曼哈顿华埠 Mott St"],
    page: "https://gofresh365.com/new-york-mott-st-special-offers/", home: "https://gofresh365.com/weekly-special-offers/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  { id: "gofresh-bk", name: "Go新鲜超市（布鲁克林八大道店）", en: "Go Fresh Brooklyn 8 Av", areas: ["bk"], locs: ["布鲁克林 8 Av"],
    page: "https://gofresh365.com/new-york-brooklyn-8-av-special-offers/", home: "https://gofresh365.com/weekly-special-offers/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  // 大中华: the flyer images are bundled into the site's script (new file names every week); take the New York (FLU) ones.
  { id: "gw", name: "大中华超市 GW", en: "GW Supermarket", areas: ["fl", "co"], locs: ["法拉盛 41-79 Main St", "法拉盛 144-50 Northern Blvd", "可乐娜 59-16 99th St"], page: "https://www.gw-supermarket.com/weekly-deals",
    custom: async () => { const h = await get("https://www.gw-supermarket.com/"); const js = [...h.matchAll(/src="(\/assets\/index-[^"]+\.js)"/g)].map(m => m[1]); let out = [];
      for (const p of js) { const t = await get("https://www.gw-supermarket.com" + p); out = out.concat([...t.matchAll(/\/assets\/GW-AD-FLU[^`"']*?-lg\.jpe?g[^`"']*?\.jpe?g/g)].map(m => "https://www.gw-supermarket.com" + m[0])); }
      return [...new Set(out)]; } },
  // 大华兴: site certificate is broken, so browsers can't load its images directly; we keep a copy.
  { id: "amart", name: "大华兴超市 A Mart", en: "A Mart", areas: ["li"], locs: ["长岛 Hicksville"], page: "https://www.amart-ny.com/index.php/weekly-special/", home: "https://www.amart-ny.com/index.php/about/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u), rehost: true },
  { id: "littleneck", name: "好邻居超市", en: "Little Neck Supermarket", areas: ["ln"], locs: ["小颈 Little Neck"], page: "https://littlenecksupermarket.com/", home: "https://littlenecksupermarket.com/en/weekly-specials/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  { id: "walfood", name: "万华超市 WalFood", en: "WalFood", areas: ["ln"], locs: ["湾边 Bayside"], page: "https://www.walfoodmarket.com/", home: "https://www.walfoodmarket.com/about", keep: u => /wixstatic\.com\/media\/c55d0c_/.test(u), max: 1 }, // first picture on the page is the flyer; the rest are QR codes / store photos
  { id: "99ranch", name: "99大华超市", en: "99 Ranch", areas: ["fl", "li"], locs: ["法拉盛", "长岛 Westbury"], link: "https://www.99ranch.com/" },
  // 昌发: site often blocks automated visits (429); tried every run, shown when it works.
  { id: "skyfoods", name: "昌发超市 Sky Foods", en: "Sky Foods", areas: ["fl", "el"], locs: ["法拉盛", "艾姆赫斯特"], page: "https://skyfoods.com/", home: "https://skyfoods.com/about-us/", keep: u => /\/wp-content\/uploads\/20\d\d\//.test(u) },
  { id: "newage", name: "兴旺超市 New Age", en: "New Age Market", areas: ["fl"], locs: ["法拉盛"], link: "https://newagemarket.net/" },
  { id: "superfl", name: "新飞龙超市", en: "Super FL Mart", areas: ["li"], locs: ["长岛 Mineola"], link: "https://super-fl-mart.com/" },
];
let prev = {}; try { prev = Object.fromEntries((JSON.parse(await fs.readFile("data/flyers.json", "utf8")).stores || []).map(s => [s.id, s])); } catch {}
const homeCache = {};
const out = [];
for (const s of STORES) {
  const o = { id: s.id, name: s.name, en: s.en, areas: s.areas, locs: s.locs, page: s.page || s.link, imgs: [] };
  if (s.page) {
    try {
      let imgs;
      if (s.custom) imgs = await s.custom();
      else {
        try { homeCache[s.home] ||= new Set(imgsOf(await get(s.home))); } catch { homeCache[s.home] = new Set(); }
        imgs = imgsOf(await get(s.page)).filter(u => s.keep(u) && !homeCache[s.home].has(u));
      }
      // WordPress sites keep old uploads on the page; prefer images uploaded in the last ~6 weeks.
      const ym = u => { const m = u.match(/\/uploads\/(20\d\d)\/(\d\d)\//); return m ? new Date(+m[1], +m[2] - 1, 1).getTime() : null; };
      const fresh = imgs.filter(u => { const t = ym(u); return t == null || Date.now() - t < 45 * 864e5; });
      if (fresh.length) imgs.splice(0, imgs.length, ...fresh);
      o.imgs = imgs.slice(0, s.max || 12).map(u => /wixstatic\.com\/media\//.test(u) ? u.replace(/(\/media\/([^\/]+))$/, "$1/v1/fit/w_1400,h_6000,q_85/$2") : u);
      if (!o.imgs.length) throw new Error("no images found");
      if (s.rehost) { // save a copy in the site (data/flyer-img/) and point to it
        await fs.mkdir("data/flyer-img", { recursive: true });
        const local = [];
        for (const [i, u] of o.imgs.slice(0, 6).entries()) { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(60000) }); if (!r.ok) continue; const f = `data/flyer-img/${s.id}-${i + 1}.jpg`; await fs.writeFile(f, Buffer.from(await r.arrayBuffer())); local.push(f + "?v=" + Date.now().toString(36)); }
        if (!local.length) throw new Error("could not copy images"); o.imgs = local;
      }
      o.got = new Date().toISOString();
      console.log(`::notice title=${s.id}::${o.imgs.length} images`);
    } catch (e) {
      console.log(`::warning title=${s.id}::${e.message}`);
      if (prev[s.id] && prev[s.id].imgs && prev[s.id].imgs.length) { o.imgs = prev[s.id].imgs; o.got = prev[s.id].got; o.stale = true; }
    }
  }
  out.push(o);
}
await fs.writeFile("data/flyers.json", JSON.stringify({ updated: new Date().toISOString(), stores: out }));
