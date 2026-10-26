const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" };
const t = await (await fetch("https://www.chaoshiweekly.com/store/golden-city-flushing", { headers: UA })).text();
const imgs = [...t.matchAll(/<img[^>]+>/g)].map(m => m[0]).slice(0, 15);
console.log(imgs.join("\n"));
const i = t.indexOf("优惠单"); console.log("\nCTX " + t.slice(Math.max(0, i - 800), i + 600));
console.log("\nVALID " + (t.match(/\d{1,2}\/\d{1,2}\s*[–-]\s*\d{1,2}\/\d{1,2}/g) || []).slice(0, 5));
console.log("\nROBOTS " + await (await fetch("https://www.chaoshiweekly.com/robots.txt", { headers: UA })).text());
