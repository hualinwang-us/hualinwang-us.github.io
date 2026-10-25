const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" };
const get = async u => { const r = await fetch(u, { headers: UA }); return { status: r.status, text: await r.text() }; };
const js = (await get("https://www.gw-supermarket.com/assets/index-CDwUzGlo.js")).text;
for (const k of ["nav_weeklydeal", "/weekly", "/assets/weekly", "weeklydealslider"]) { let i = -1, n = 0; while ((i = js.indexOf(k, i + 1)) >= 0 && n++ < 3) console.log(`\n--- ${k} @${i}\n${js.slice(Math.max(0, i - 400), i + 500)}`); }
console.log("\nFETCH/axios:", [...new Set([...js.matchAll(/fetch\(([^)]{0,120})\)/g)].map(m => m[1]))].slice(0, 10).join(" || "));
