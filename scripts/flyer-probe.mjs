const j = async (u, o = {}) => { try { const r = await fetch(u, { ...o, signal: AbortSignal.timeout(40000) }); const t = await r.text(); return [r.status, t]; } catch (e) { return [0, "ERR " + e.message]; } };
const show = async (k, u, n = 900, o) => { const [s, t] = await j(u, o); console.log(`\n=== ${k} [${s}]\n${t.slice(0, n).replace(/\s+/g, " ")}`); return t; };
for (const f of ["nyct%2Fgtfs", "nyct%2Fgtfs-7", "nyct/gtfs-7", "nyct%2Fgtfs-ace", "nyct%2Fgtfs-nqrw"]) { const [s, t] = await j("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/" + f); console.log(`=== feed ${f} [${s}] len=${t.length} ${t.slice(0, 80).replace(/\s+/g, " ")}`); }
const asp = (await j("https://www.nyc.gov/html/dot/html/motorist/alternate-side-parking.shtml"))[1];
for (const k of ["suspend", "in effect", "Suspended", "calendar", "2026"]) { let i = -1, n = 0; while ((i = asp.indexOf(k, i + 1)) > 0 && n++ < 3) console.log(`ASP[${k}] ${asp.slice(Math.max(0, i - 200), i + 250).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`); }
await show("hpd viol sample", "https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=1&boroid=4", 1500);
await show("hc lottery sample", "https://data.cityofnewyork.us/resource/vy5i-a666.json?$limit=2&$order=lottery_end_date%20DESC", 2000);
await show("hc by building", "https://data.cityofnewyork.us/resource/nibs-na6y.json?$limit=1", 1200);
await show("restroom", "https://data.cityofnewyork.us/resource/i7jb-7jku.json?$limit=1", 800);
await show("restroom op", "https://data.cityofnewyork.us/resource/vzrx-zg6z.json?$limit=1", 800);
await show("linknyc", "https://data.cityofnewyork.us/resource/s4kf-3yrf.json?$limit=1", 800);
await show("queens lib", "https://data.cityofnewyork.us/resource/kh3d-xhq7.json?$limit=1", 800);
await show("bpl", "https://data.cityofnewyork.us/resource/xmzf-uf2w.json?$limit=1", 800);
await show("geosearch full", "https://geosearch.planninglabs.nyc/v2/search?text=" + encodeURIComponent("41-60 Main St Queens") + "&size=1", 2500);
