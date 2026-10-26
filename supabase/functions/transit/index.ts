// 华脉 实时到站: a small relay between the website and MTA's free real-time data.
// - Rail (LIRR / Metro-North): GTFS-realtime feeds, no key needed; decoded here because browsers can't read them directly.
// - Bus: MTA Bus Time, needs the free key stored as the secret MTA_BUSTIME_KEY (never sent to browsers).
import GtfsRealtimeBindings from "npm:gtfs-realtime-bindings@1.1.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200, maxAge = 15) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` } });

const FEEDS: Record<string, string> = {
  lirr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr",
  mnr: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr",
};
const cache = new Map<string, { t: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v as T;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
}
const num = (x: unknown) => (x == null ? 0 : typeof x === "object" && "toNumber" in (x as any) ? (x as any).toNumber() : Number(x));

async function railFeed(sys: string) {
  return cached("rail:" + sys, 20000, async () => {
    const r = await fetch(FEEDS[sys]);
    if (!r.ok) throw new Error("feed HTTP " + r.status);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(await r.arrayBuffer()));
    return feed.entity.filter((e: any) => e.tripUpdate).map((e: any) => {
      const tu = e.tripUpdate;
      const stus = (tu.stopTimeUpdate || []).map((s: any) => ({
        id: String(s.stopId), t: num(s.departure?.time) || num(s.arrival?.time), d: num(s.departure?.delay ?? s.arrival?.delay),
      }));
      return { trip: tu.trip?.tripId || "", route: tu.trip?.routeId || "", dest: stus.length ? stus[stus.length - 1].id : "", stus };
    });
  });
}

async function busTime(path: string, params: Record<string, string>) {
  const key = Deno.env.get("MTA_BUSTIME_KEY");
  if (!key) throw new Error("bus key missing");
  const u = new URL("https://bustime.mta.info" + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("key", key);
  const r = await fetch(u);
  if (!r.ok) throw new Error("bustime HTTP " + r.status);
  return r.json();
}
const first = (x: any) => (Array.isArray(x) ? x[0] : x);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const q = new URL(req.url).searchParams, op = q.get("op");
  try {
    if (op === "rail") {
      const sys = q.get("sys") || "", stop = q.get("stop") || "";
      if (!FEEDS[sys] || !/^[\w-]{1,12}$/.test(stop)) return json({ error: "bad request" }, 400);
      const now = Date.now() / 1000;
      const trips = await railFeed(sys);
      const out = [];
      for (const tr of trips) {
        const i = tr.stus.findIndex((s: any) => s.id === stop);
        if (i < 0 || i === tr.stus.length - 1) continue; // not stopping here, or this is the last stop
        const s = tr.stus[i];
        if (!s.t || s.t < now - 60) continue;
        out.push({ t: s.t, delay: s.d || 0, dest: tr.dest, route: tr.route, trip: tr.trip });
      }
      out.sort((a, b) => a.t - b.t);
      return json({ now: Math.round(now), list: out.slice(0, 15) });
    }
    if (op === "stops") {
      const lat = Number(q.get("lat")), lon = Number(q.get("lon"));
      if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat - 40.7) > 1.5 || Math.abs(lon + 73.9) > 1.5) return json({ error: "outside NYC" }, 400);
      const d: any = await cached(`stops:${lat.toFixed(3)},${lon.toFixed(3)}`, 6 * 3600e3, () =>
        busTime("/api/where/stops-for-location.json", { lat: String(lat), lon: String(lon), latSpan: "0.006", lonSpan: "0.008" }));
      const stops = (d?.data?.stops || []).map((s: any) => ({ id: s.id, name: s.name, dir: s.direction || "", lat: s.lat, lon: s.lon, routes: (s.routes || []).map((r: any) => r.shortName).filter(Boolean) }));
      return json({ stops }, 200, 3600);
    }
    if (op === "bus") {
      const stop = (q.get("stop") || "").replace(/^MTA_/, "");
      if (!/^\d{3,8}$/.test(stop)) return json({ error: "bad stop" }, 400);
      const d: any = await cached("bus:" + stop, 20000, () => busTime("/api/siri/stop-monitoring.json", { version: "2", OperatorRef: "MTA", MonitoringRef: stop, MaximumStopVisits: "12" }));
      const del = first(d?.Siri?.ServiceDelivery?.StopMonitoringDelivery);
      const visits = (del?.MonitoredStopVisit || []).map((v: any) => {
        const j = v.MonitoredVehicleJourney || {}, c = j.MonitoredCall || {};
        const loc = j.VehicleLocation || {};
        return { route: first(j.PublishedLineName) || "", dest: first(j.DestinationName) || "", eta: c.ExpectedArrivalTime || c.AimedArrivalTime || "",
          away: c.Extensions?.Distances?.PresentableDistance || first(c.ArrivalProximityText) || "", stops: c.Extensions?.Distances?.StopsFromCall ?? null,
          vid: String(j.VehicleRef || "").replace(/^MTA[ _]?NYCT_/, ""), lat: Number(loc.Latitude) || null, lon: Number(loc.Longitude) || null, bearing: Number(j.Bearing) || 0,
          meters: c.Extensions?.Distances?.DistanceFromCall ?? null };
      });
      const err = first(del?.ErrorCondition?.Description) || "";
      // the stop's own position (for the map), cached for a day
      let at = null;
      try { const sd: any = await cached("stop:" + stop, 86400e3, () => busTime(`/api/where/stop/MTA_${stop}.json`, {}));
        const e = sd?.data?.entry || sd?.data; if (e && e.lat) at = { lat: e.lat, lon: e.lon, name: e.name || "", dir: e.direction || "" }; } catch { /* map just centers on the buses */ }
      return json({ list: visits, note: err, stop: at });
    }
    if (op === "visa") {
      // Visa Bulletin pages (public, State Dept). Only these two page shapes are allowed.
      const path = q.get("path") || "";
      if (!/^\/content\/travel\/en\/legal\/visa-law0\/visa-bulletin(\.html|\/\d{4}\/visa-bulletin-for-[a-z]+-\d{4}\.html)$/.test(path)) return json({ error: "bad path" }, 400);
      const html = await cached("visa:" + path, 6 * 3600e3, async () => {
        const r = await fetch("https://travel.state.gov" + path, { headers: { "user-agent": "Mozilla/5.0 (compatible; HuaMaiBot/1.0; +https://huamai88.com/)", "accept": "text/html" } });
        if (!r.ok) throw new Error("state.gov HTTP " + r.status);
        return r.text();
      });
      return new Response(html, { headers: { ...CORS, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    }
    return json({ error: "unknown op" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e).slice(0, 200) }, 502, 0);
  }
});
