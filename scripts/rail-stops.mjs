// Builds data/rail-stops.json (LIRR + Metro-North station names and locations) from MTA static GTFS,
// and checks the real-time feeds decode. Runs in GitHub Actions (weekly / on demand).
import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
const STATIC = { lirr: ["https://rrgtfsfeeds.s3.amazonaws.com/gtfslirr.zip", "http://web.mta.info/developers/data/lirr/google_transit.zip"],
                 mnr: ["https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip", "http://web.mta.info/developers/data/mnr/google_transit.zip"] };
const RT = { lirr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr", mnr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr" };
const csv = txt => { const lines = txt.replace(/\r/g, "").split("\n").filter(Boolean); const head = lines[0].replace(/^﻿/, "").split(","); return lines.slice(1).map(l => { const v = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { v.push(cur); cur = ""; } else cur += ch; } v.push(cur); return Object.fromEntries(head.map((h, i) => [h, v[i]])); }); };
const out = {};
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
