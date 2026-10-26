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
async function csw(slug) {
  const t = await get("https://www.chaoshiweekly.com/store/" + slug);
  const files = [...new Set([...t.matchAll(/%2Fflyers%2F([^&"]+?\.(?:jpe?g|png|webp))/gi)].map(m => decodeURIComponent(m[1])))];
  return files.map(f => "https://www.chaoshiweekly.com/flyers/" + f);
}
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

  // Stores with no flyer on their own website: flyer photo as published on chaoshiweekly.com (菜网), credited on the page.
  { id: "skyfoods-flushing", name: "昌发超市（法拉盛）", en: "Sky Foods Flushing", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/skyfoods-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("skyfoods-flushing") },
  { id: "skyfoods-main-flushing", name: "昌发超市（缅街）", en: "Sky Foods Main St", areas: ["fl"], locs: ["法拉盛 缅街"], page: "https://www.chaoshiweekly.com/store/skyfoods-main-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("skyfoods-main-flushing") },
  { id: "chungfat-flushing", name: "昌发超市（Chung Fat）", en: "Chung Fat", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/chungfat-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("chungfat-flushing") },
  { id: "skyfoods-elmhurst", name: "昌发超市（艾姆赫斯特）", en: "Sky Foods Elmhurst", areas: ["el"], locs: ["艾姆赫斯特 Elmhurst"], page: "https://www.chaoshiweekly.com/store/skyfoods-elmhurst", src: "菜网 chaoshiweekly.com", custom: () => csw("skyfoods-elmhurst") },
  { id: "golden-city-flushing", name: "金城发超市", en: "Golden City", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/golden-city-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("golden-city-flushing") },
  { id: "us1-flushing", name: "新龙兴超市", en: "US 1", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/us1-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("us1-flushing") },
  { id: "feilong-flushing", name: "飞龙超市（法拉盛）", en: "Fei Long Flushing", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/feilong-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("feilong-flushing") },
  { id: "feilong-brooklyn", name: "飞龙超市（布鲁克林）", en: "Fei Long Brooklyn", areas: ["bk"], locs: ["布鲁克林"], page: "https://www.chaoshiweekly.com/store/feilong-brooklyn", src: "菜网 chaoshiweekly.com", custom: () => csw("feilong-brooklyn") },
  { id: "ac-flushing", name: "中美超市", en: "AC", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/ac-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("ac-flushing") },
  { id: "newage-flushing", name: "兴旺超市 New Age", en: "New Age", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/newage-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("newage-flushing") },
  { id: "99ranch-flushing", name: "99大华超市（法拉盛）", en: "99 Ranch Flushing", areas: ["fl"], locs: ["法拉盛"], page: "https://www.chaoshiweekly.com/store/99ranch-flushing", src: "菜网 chaoshiweekly.com", custom: () => csw("99ranch-flushing") },
  { id: "99ranch-westbury", name: "99大华超市（长岛）", en: "99 Ranch Westbury", areas: ["li"], locs: ["长岛 Westbury"], page: "https://www.chaoshiweekly.com/store/99ranch-westbury", src: "菜网 chaoshiweekly.com", custom: () => csw("99ranch-westbury") },
  { id: "hl-brooklyn", name: "华乐超市（布鲁克林）", en: "HL Brooklyn", areas: ["bk"], locs: ["布鲁克林"], page: "https://www.chaoshiweekly.com/store/hl-brooklyn", src: "菜网 chaoshiweekly.com", custom: () => csw("hl-brooklyn") },
  { id: "huale-statenisland", name: "华乐超市（史丹顿岛）", en: "Hua Le Staten Island", areas: ["si"], locs: ["史丹顿岛"], page: "https://www.chaoshiweekly.com/store/huale-statenisland", src: "菜网 chaoshiweekly.com", custom: () => csw("huale-statenisland") },
  { id: "ezfresh-brooklyn-65th", name: "甌江超级市场", en: "EZ Fresh", areas: ["bk"], locs: ["布鲁克林 65街"], page: "https://www.chaoshiweekly.com/store/ezfresh-brooklyn-65th", src: "菜网 chaoshiweekly.com", custom: () => csw("ezfresh-brooklyn-65th") },
  { id: "superflmart-mineola", name: "新飞龙超市", en: "Super FL Mart", areas: ["li"], locs: ["长岛 Mineola"], page: "https://www.chaoshiweekly.com/store/superflmart-mineola", src: "菜网 chaoshiweekly.com", custom: () => csw("superflmart-mineola") },
];
let prev = {}; try { prev = Object.fromEntries((JSON.parse(await fs.readFile("data/flyers.json", "utf8")).stores || []).map(s => [s.id, s])); } catch {}
const homeCache = {};
const out = [];
for (const s of STORES) {
  const o = { id: s.id, name: s.name, en: s.en, areas: s.areas, locs: s.locs, page: s.page || s.link, imgs: [] };
  if (s.src) o.src = s.src;
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
