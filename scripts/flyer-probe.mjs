const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow" }); return { status: r.status, url: r.url, text: await r.text() }; };
const pages = ["https://www.newworldmallnyc.com/jmart-weekly-special", "https://www.hualiansupermarket.com/weeklysales", "https://www.hualiansupermarket.com/feature-items", "https://www.sf-supermarket.com/weeklyad",
  "https://yongfasupermarket.com/", "https://littlenecksupermarket.com/en/weekly-specials/", "https://gofresh365.com/weekly-special-offers/", "https://www.walfoodmarket.com/", "https://www.gw-supermarket.com/",
  "https://www.99ranch.com/", "https://www.skyfoods.com/", "http://www.skyfoods.com/", "https://skyfoods.com/", "https://www.amart-ny.com/", "http://amart-ny.com/", "https://super-fl-mart.com/", "https://newagemarket.net/"];
for (const p of pages) {
  try {
    const r = await get(p);
    const imgs = [...new Set([...r.text.matchAll(/https?:\/\/[^"'\s)\\]+?\.(?:jpe?g|png|webp|pdf)/gi)].map(m => m[0]))]
      .filter(u => !/favicon|logo|icon|dummy|cropped-|w_32|w_180|w_192/i.test(u));
    const wix = [...new Set([...r.text.matchAll(/static\.wixstatic\.com\/media\/([a-z0-9_]+~mv2[^"\/\s]*)/gi)].map(m => m[1]))];
    const hrefs = [...new Set([...r.text.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(u => /week|special|flyer|ad\b|sale|promo|deal|特价|优惠/i.test(u)))].slice(0, 10);
    const title = (r.text.match(/<title[^>]*>([^<]*)/) || [])[1];
    console.log(`\n=== ${p} status=${r.status} final=${r.url} title=${title} len=${r.text.length}\nHREFS ${hrefs.join(" ")}\nWIX ${wix.slice(0, 25).join(" ")}\nIMGS ${imgs.slice(0, 25).join(" ")}\nAPI ${[...new Set([...r.text.matchAll(/["'](\/api\/[^"']+|https?:\/\/[^"']*api[^"']*)["']/g)].map(m => m[1]))].slice(0, 10).join(" ")}`);
  } catch (e) { console.log(`\n=== ${p} ERROR ${e.message} ${e.cause ? e.cause.code || e.cause.message : ""}`); }
}
