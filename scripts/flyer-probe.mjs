const j = async u => { const r = await fetch(u, { signal: AbortSignal.timeout(40000) }); const t = await r.text(); try { return JSON.parse(t); } catch { return { status: r.status, t: t.slice(0, 300) }; } };
const show = (k, v) => console.log(`\n=== ${k}\n${JSON.stringify(v).slice(0, 1200)}`);
for (const id of ["nsde-gcv2", "b7jj-bh4g", "y3u4-jbgh", "eqw2-r5nb"]) show(id, await j(`https://data.ny.gov/resource/${id}.json?$limit=2&$q=FLUSHING`));
show("dcwp reno", await j("https://data.cityofnewyork.us/resource/w7w3-xahh.json?$limit=3&business_category=Home%20Improvement%20Contractor&license_status=Active&address_zip=11354"));
