const r = await fetch("https://www.gw-supermarket.com/assets/index-CDwUzGlo.js"); const js = await r.text();
const i = js.indexOf("weekly-ad-slider-container"); console.log(js.slice(i, i + 2500));
const j = js.indexOf("weekly-deals`,element"); console.log("\nROUTE " + js.slice(Math.max(0,j-300), j + 300));
