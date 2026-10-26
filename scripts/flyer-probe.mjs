// one-off: find official weekly-flyer pages for more NY Asian supermarkets
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { status: r.status, url: r.url, text: await r.text() }; };
const imgsOf = t => [...new Set([...t.matchAll(/https?:\/\/[^"'\s)\\<>]+?\.(?:jpe?g|png|webp|pdf)/gi)].map(m => m[0].replace(/%7E/gi, "~")))].filter(u => !/favicon|logo|icon|dummy|cropped-|parastorage|placeholder|-\d+x\d+\./i.test(u));
const C = ["https://www.hmart.com/", "https://www.hmart.com/weekly-sale", "https://www.ifreshmarket.com/", "https://www.kammanfood.com/", "https://www.kammannyc.com/", "https://hksupermarket.com/", "https://www.hongkongsupermarket.com/", "https://www.hkfoodmarket.com/",
 "https://www.feilongmarket.com/", "https://feilongsupermarket.com/", "https://www.asianfoodmarkets.com/", "https://www.newyorkmart.com/", "https://www.nymart.com/", "https://www.foodbazaar.com/", "https://www.skyfoods.com/", "http://skyfoods.com/", "https://www.amart-ny.com/", "https://littlenecksupermarket.com/", "https://littlenecksupermarket.com/weekly-specials/", "https://www.walfoodmarket.com/weekly-specials", "https://www.walfoodmarket.com/weekly-special", "https://newagemarket.net/pages/weekly-specials", "https://newagemarket.net/pages/weekly-ad",
 "https://www.99ranch.com/weekly-specials", "https://www.99ranch.com/stores", "https://www.hanyangmart.com/", "https://www.goldenmangonyc.com/", "https://www.patelbros.com/", "https://www.ktownnyc.com/", "https://www.greatwallsupermarket.com/", "https://www.newworldmallnyc.com/", "https://www.tanyiumarket.com/", "https://www.uskingmart.com/", "https://www.cfoodmarket.com/", "https://www.sunsetparkfoodmart.com/", "https://www.hkmarketnyc.com/", "https://www.jmartnyc.com/", "https://www.greatchinasupermarket.com/", "https://www.gwfoodmarket.com/", "https://www.lucky-supermarket.com/", "https://www.popularsupermarket.com/", "https://www.mjsupermarket.com/", "https://www.newsunsupermarket.com/", "https://www.qmart.net/"];
for (const u of C) {
  try {
    const r = await get(u);
    const title = ((r.text.match(/<title[^>]*>([^<]*)/) || [])[1] || "").trim().slice(0, 80);
    const links = [...new Set([...r.text.matchAll(/href="([^"#]+)"/g)].map(m => { try { return new URL(m[1], r.url).href; } catch { return ""; } }).filter(h => /week|special|flyer|circular|weekly-?ad|sale|promo|deal|特价|优惠/i.test(h) && !/facebook|instagram|twitter|wixapps|cdn\.shopify|wp-json|\.css|\.js/i.test(h)))].slice(0, 10);
    const im = imgsOf(r.text).slice(0, 8);
    console.log(`\n=== ${u} -> ${r.url} [${r.status}] "${title}" len=${r.text.length}\nLINKS ${links.join(" ")}\nIMGS ${im.join(" ")}`);
  } catch (e) { console.log(`\n=== ${u} ERROR ${e.message} ${e.cause ? (e.cause.code || e.cause.message) : ""}`); }
}
