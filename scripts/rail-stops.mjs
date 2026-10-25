// Builds data/rail-stops.json (LIRR + Metro-North station names and locations) from MTA static GTFS,
// and checks the real-time feeds decode. Runs in GitHub Actions (weekly / on demand).
import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
const STATIC = { lirr: ["https://rrgtfsfeeds.s3.amazonaws.com/gtfslirr.zip", "http://web.mta.info/developers/data/lirr/google_transit.zip"],
                 mnr: ["https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip", "http://web.mta.info/developers/data/mnr/google_transit.zip"] };
const RT = { lirr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr", mnr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr" };
const csv = txt => { const lines = txt.replace(/\r/g, "").split("\n").filter(Boolean); const head = lines[0].replace(/^\uFEFF/, "").split(",").map(h => h.replace(/"/g, "").trim()); return lines.slice(1).map(l => { const v = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { v.push(cur); cur = ""; } else cur += ch; } v.push(cur); return Object.fromEntries(head.map((h, i) => [h, v[i]])); }); };
const out = {};
// Timetable fallback: departures per station for the next 3 service days (used when the live feed is stale).
const nyDate = off => { const d = new Date(Date.now() + off * 864e5); const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d).map(x => [x.type, x.value])); return { ymd: p.year + p.month + p.day, wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) }; };
async function readCsv(sys, name) { try { return csv(await fs.readFile(`/tmp/${sys}/${name}`, "utf8")).map(o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.trim(), (v || "").trim()]))); } catch { return []; } }
async function buildSched(sys) {
  const cal = await readCsv(sys, "calendar.txt"), cd = await readCsv(sys, "calendar_dates.txt"), trips = await readCsv(sys, "trips.txt"), st = await readCsv(sys, "stop_times.txt");
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const byTrip = new Map();
  for (const r of st) { if (!byTrip.has(r.trip_id)) byTrip.set(r.trip_id, []); byTrip.get(r.trip_id).push(r); }
  for (const a of byTrip.values()) a.sort((x, y) => +x.stop_sequence - +y.stop_sequence);
  const res = { dates: {} };
  for (const off of [-1, 0, 1, 2]) {
    const { ymd, wd } = nyDate(off), svc = new Set();
    for (const c of cal) if (c[days[wd]] === "1" && c.start_date <= ymd && c.end_date >= ymd) svc.add(c.service_id);
    for (const c of cd) if (c.date === ymd) { if (c.exception_type === "1") svc.add(c.service_id); else svc.delete(c.service_id); }
    const map = {};
    for (const t of trips) {
      if (!svc.has(t.service_id)) continue;
      const a = byTrip.get(t.trip_id); if (!a || a.length < 2) continue;
      const dest = a[a.length - 1].stop_id;
      for (let i = 0; i < a.length - 1; i++) {
        const [h, m] = (a[i].departure_time || a[i].arrival_time || "").split(":").map(Number); if (isNaN(h)) continue;
        (map[a[i].stop_id] ||= []).push(h * 60 + m, dest);
      }
    }
    for (const k in map) { const p = []; for (let i = 0; i < map[k].length; i += 2) p.push([map[k][i], map[k][i + 1]]); p.sort((x, y) => x[0] - y[0]); map[k] = p.flat(); }
    res.dates[ymd] = map;
    console.log(`::notice title=${sys} sched ${ymd}::services=${svc.size} stations=${Object.keys(map).length}`);
  }
  await fs.writeFile(`data/sched-${sys}.json`, JSON.stringify(res));
}
for (const sys of ["lirr", "mnr"]) {
  let ok = false;
  for (const u of STATIC[sys]) {
    try {
      const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status);
      await fs.writeFile(`/tmp/${sys}.zip`, Buffer.from(await r.arrayBuffer()));
      execSync(`rm -rf /tmp/${sys} && mkdir -p /tmp/${sys} && unzip -o -q /tmp/${sys}.zip -d /tmp/${sys}`);
      const raw = await fs.readFile(`/tmp/${sys}/stops.txt`, "utf8");
      console.log(`::notice title=${sys} head::${JSON.stringify(raw.slice(0, 300))}`);
      const stops = csv(raw).map(o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.trim(), (v || "").trim()])));
      out[sys] = stops.filter(s => !s.location_type || s.location_type === "0" || s.location_type === "1").map(s => ({ id: s.stop_id, n: s.stop_name, lat: +(+s.stop_lat).toFixed(5), lon: +(+s.stop_lon).toFixed(5) })).filter(s => s.lat);
      console.log(`::notice title=${sys} static::${u} stops=${out[sys].length} sample=${JSON.stringify(out[sys].slice(0, 3))}`);
      try { await buildSched(sys); } catch (e) { console.log(`::warning title=${sys} sched::${e.message}`); }
      ok = true; break;
    } catch (e) { console.log(`::warning title=${sys} static::${u} ${e.message}`); }
  }
  try {
    const r = await fetch(RT[sys]); if (!r.ok) throw new Error("HTTP " + r.status);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(await r.arrayBuffer()));
    const tu = feed.entity.filter(e => e.tripUpdate);
    const s = tu[0] && tu[0].tripUpdate;
    console.log(`::notice title=${sys} realtime::entities=${feed.entity.length} trips=${tu.length} sample=${JSON.stringify(s ? { trip: s.trip, n: s.stopTimeUpdate.length, first: s.stopTimeUpdate[0], last: s.stopTimeUpdate[s.stopTimeUpdate.length - 1] } : null).slice(0, 900)}`);
  } catch (e) { console.log(`::warning title=${sys} realtime::${e.message}`); }
}
if (out.lirr || out.mnr) await fs.writeFile("data/rail-stops.json", JSON.stringify(out));
