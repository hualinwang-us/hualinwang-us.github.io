const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow" }); return { status: r.status, url: r.url, text: await r.text() }; };
const imgsOf = t => [...new Set([...t.matchAll(/https?:\/\/[^"'\s)\\]+?\.(?:jpe?g|png|webp|pdf)/gi)].map(m => m[0].replace(/%7E/gi, "~")))].filter(u => !/favicon|logo|icon|dummy|cropped-|parastorage|-\d+x\d+\./i.test(u));
async function diff(home, page) {
  const a = new Set(imgsOf((await get(home)).text)); const r = await get(page); const b = imgsOf(r.text).filter(u => !a.has(u));
  const out = [];
  for (const u of b.slice(0, 20)) { try { const h = await fetch(u, { method: "HEAD", headers: UA }); out.push(`${u} [${h.headers.get("content-length")}]`); } catch (e) { out.push(u + " [err]"); } }
  console.log(`\n=== DIFF ${page} (${r.status})\n${out.join("\n")}`);
}
await diff("https://www.newworldmallnyc.com/", "https://www.newworldmallnyc.com/jmart-weekly-special");
await diff("https://www.hualiansupermarket.com/", "https://www.hualiansupermarket.com/weeklysales");
await diff("https://www.hualiansupermarket.com/", "https://www.hualiansupermarket.com/feature-items");
await diff("https://www.sf-supermarket.com/", "https://www.sf-supermarket.com/weeklyad");
await diff("https://yongfasupermarket.com/index.php/about/", "https://yongfasupermarket.com/index.php/weeklydeal/");
for (const p of ["new-york-east-broadway-special-offers", "new-york-mott-st-special-offers"]) await diff("https://gofresh365.com/weekly-special-offers/", "https://gofresh365.com/" + p + "/");
const gf = await get("https://gofresh365.com/weekly-special-offers/");
console.log("\nGOFRESH links " + [...new Set([...gf.text.matchAll(/href="(https:\/\/gofresh365\.com\/[^"]*special[^"]*)"/g)].map(m => m[1]))].join(" "));
for (const sm of ["https://www.walfoodmarket.com/sitemap.xml", "https://www.walfoodmarket.com/pages-sitemap.xml"]) { try { const r = await get(sm); console.log(`\nSITEMAP ${sm} ${r.status} ${[...r.text.matchAll(/<loc>([^<]+)/g)].map(m => m[1]).join(" ").slice(0, 1500)}`); } catch (e) {} }
// GW SPA: find bundle + api strings
const gw = await get("https://www.gw-supermarket.com/"); console.log("\nGW HTML " + gw.text.slice(0, 495));
for (const m of gw.text.matchAll(/src="([^"]+\.js)"/g)) { try { const js = await get(new URL(m[1], "https://www.gw-supermarket.com/").href); console.log(`GW JS ${m[1]} len=${js.text.length} urls=${[...new Set([...js.text.matchAll(/["'`](https?:\/\/[^"'`]{6,120}|\/api\/[^"'`]{1,80})["'`]/g)].map(x => x[1]))].slice(0, 40).join(" ")} kw=${[...new Set([...js.text.matchAll(/[a-zA-Z_/]*(?:flyer|weekly|special|promo)[a-zA-Z_/]*/gi)].map(x => x[0]))].slice(0, 30).join(" ")}`); } catch (e) { console.log("GW JS err " + e.message); } }
// 99 Ranch
const nr = await get("https://www.99ranch.com/"); 
for (const m of [...nr.text.matchAll(/src="([^"]+\.js)"/g)].slice(0, 8)) { try { const js = await get(new URL(m[1], "https://www.99ranch.com/").href); const k = [...new Set([...js.text.matchAll(/["'`]([^"'`]*(?:flyer|weekly|circular|ad-list|weeklyAd|weekly-ad)[^"'`]*)["'`]/gi)].map(x => x[1]))].slice(0, 15); if (k.length) console.log(`\n99 JS ${m[1]} ${k.join(" | ").slice(0, 1200)}`); } catch (e) {} }
for (const u of ["https://www.99ranch.com/weekly-ad", "https://www.99ranch.com/weekly-ads", "https://www.99ranch.com/flyer"]) { try { const r = await get(u); console.log(`99 ${u} ${r.status} ${r.url} len=${r.text.length}`); } catch (e) {} }
