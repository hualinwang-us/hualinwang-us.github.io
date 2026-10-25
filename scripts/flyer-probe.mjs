// One-off reconnaissance: find each NY Chinese supermarket's OFFICIAL website and whether it publishes a weekly flyer.
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36" };
const get = async u => { const r = await fetch(u, { headers: UA, redirect: "follow" }); return { ok: r.ok, status: r.status, url: r.url, text: await r.text() }; };
const home = await get("https://www.chaoshiweekly.com/");
const slugs = [...new Set([...home.text.matchAll(/href="\/store\/([a-z0-9-]+)"/g)].map(m => m[1]))];
console.log(`::notice title=slugs::${slugs.length} ${slugs.join(",")}`);
const sites = {};
for (const s of slugs) {
  try {
    const p = await get("https://www.chaoshiweekly.com/store/" + s);
    const ext = [...p.text.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]).filter(u => !/chaoshiweekly|google\.com|googleapis|gstatic|schema\.org/.test(u));
    const name = (p.text.match(/<h1[^>]*>([^<]+)/) || [])[1] || "";
    sites[s] = { name: name.trim(), ext: [...new Set(ext)].slice(0, 4) };
    console.log(`::notice title=${s}::${sites[s].name} | ${sites[s].ext.join(" ")}`);
  } catch (e) { console.log(`::warning title=${s}::${e.message}`); }
}
const official = [...new Set(Object.values(sites).flatMap(v => v.ext).filter(u => !/facebook|instagram|yelp|wechat|weixin|twitter|x\.com|apple\.com|play\.google/.test(u)).map(u => new URL(u).origin))];
for (const o of official) {
  try {
    const r = await get(o);
    const links = [...r.text.matchAll(/(?:href|src|data-src)="([^"]+)"/g)].map(m => m[1]).filter(u => /flyer|weekly|special|ad[s_-]|promo|circular|sale|特价|优惠|deal/i.test(u)).slice(0, 12);
    const imgs = [...r.text.matchAll(/(?:src|href)="([^"]+\.(?:jpe?g|png|webp|pdf))"/gi)].map(m => m[1]).slice(0, 6);
    console.log(`::notice title=${o}::status=${r.status} links=${links.join(" ")} || imgs=${imgs.join(" ")}`.slice(0, 1500));
  } catch (e) { console.log(`::warning title=${o}::${e.message}`); }
}
