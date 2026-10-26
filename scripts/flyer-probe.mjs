process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { status: r.status, url: r.url, text: await r.text() }; };
const imgsOf = t => [...new Set([...t.matchAll(/https?:\/\/[^"'\s)\\<>]+?\.(?:jpe?g|png|webp|pdf)/gi)].map(m => m[0].replace(/%7E/gi, "~")))].filter(u => !/favicon|logo|icon|dummy|cropped-|parastorage|placeholder|-\d+x\d+\./i.test(u));
async function diff(home, page) {
  try { const a = new Set(imgsOf((await get(home)).text)); const r = await get(page); const b = imgsOf(r.text).filter(u => !a.has(u));
  console.log(`\n=== DIFF ${page} [${r.status}] len=${r.text.length}\n${b.slice(0, 15).join("\n")}`); } catch (e) { console.log(`\n=== DIFF ${page} ERR ${e.message}`); }
}
await diff("https://www.hmart.com/", "https://www.hmart.com/weekly-ads");
await diff("https://www.asianfoodmarkets.com/", "https://www.asianfoodmarkets.com/special-offers/");
await diff("https://www.hanyangmart.com/", "https://www.hanyangmart.com/pages/weekly-ads");
await diff("https://www.amart-ny.com/index.php/about/", "https://www.amart-ny.com/index.php/weekly-special/");
await diff("https://www.amart-ny.com/index.php/weekly-special/", "https://www.amart-ny.com/");
await diff("https://littlenecksupermarket.com/en/", "https://littlenecksupermarket.com/");
await diff("https://www.walfoodmarket.com/about", "https://www.walfoodmarket.com/");
// H Mart weekly-ads: look for per-store / region structures
try { const r = await get("https://www.hmart.com/weekly-ads"); const t = r.text;
  for (const k of ["New York", "Flushing", "Bayside", "NY", "weekly-ad", "flyer"]) { const i = t.indexOf(k); if (i > 0) console.log(`\n-- hmart '${k}' @${i}: ${t.slice(Math.max(0, i - 200), i + 300).replace(/\s+/g, " ")}`); } } catch (e) {}
// GW: every jpg asset in the bundle + the weekly-deals component
try { const js = (await get("https://www.gw-supermarket.com/assets/index-CDwUzGlo.js")).text;
  console.log("\nGW ASSETS " + [...new Set([...js.matchAll(/\/assets\/[^`"']+\.(?:jpe?g|png|webp)/g)].map(m => m[0]))].join(" "));
  const i = js.indexOf("function cr("); console.log("\nGW cr " + js.slice(i, i + 1500)); } catch (e) { console.log("gw err " + e.message); }
