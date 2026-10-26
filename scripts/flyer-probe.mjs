const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" };
for (const u of ["https://www.dealmoon.com/robots.txt", "https://www.dealmoon.com/rss", "https://www.dealmoon.com/rss.xml", "https://www.dealmoon.com/cn/rss", "https://www.dealmoon.com/feed", "https://www.dealmoon.com/rss/deals", "https://www.dealmoon.com/terms"]) {
  try { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) }); const t = await r.text();
    console.log(`\n=== ${u} -> ${r.url} [${r.status}] ${r.headers.get("content-type")}\n${t.replace(/\s+/g, " ").slice(0, u.includes("robots") ? 2500 : 700)}`);
    if (u.includes("terms")) { for (const k of ["scrap", "crawl", "robot", "automated", "reproduce", "copy"]) { const i = t.toLowerCase().indexOf(k); if (i > 0) console.log(`  [${k}] ${t.slice(Math.max(0, i - 200), i + 300).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`); } }
  } catch (e) { console.log(`\n=== ${u} ERR ${e.message}`); }
}
