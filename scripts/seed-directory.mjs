// One-off: fill empty 商家黄页 categories with real Flushing businesses from official public registries
// (NYC Open Data, NY State Open Data, federal NPI registry). Marked seed:true with their source.
import fs from "node:fs/promises";
const j = async u => { const r = await fetch(u, { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
const tc = s => String(s || "").toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()).replace(/\b(Llc|Inc|Pc|Pllc|Ny|Dds|Md|Corp)\b/g, w => w.toUpperCase()).replace(/\s+/g, " ").trim();
const ph = s => { const d = String(s || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : ""; };
const addr = s => tc(s).replace(/^(\d+)(\d{2}) /, (m, a, b) => `${a}-${b} `);
const dir = JSON.parse(await fs.readFile("data/directory.json", "utf8"));
const have = new Set(dir.items.map(i => (i.name || "").toLowerCase()));
const out = {}; let n = 0;
function add(cat, name, address, phone, src) {
  name = tc(name); if (!name || have.has(name.toLowerCase())) return; (out[cat] ||= []);
  if (out[cat].length >= 10) return; have.add(name.toLowerCase());
  out[cat].push({ id: `o${cat}${String(++n).padStart(3, "0")}`, name, cat, area: "法拉盛", address: address ? address + ", Flushing" : "", phone: ph(phone), seed: true, src });
}
const ZIP = "('11354','11355')";
const safe = async (label, fn) => { try { await fn(); console.log(`::notice title=${label}::ok`); } catch (e) { console.log(`::warning title=${label}::${e.message}`); } };
await safe("food", async () => {
  const rows = await j("https://data.cityofnewyork.us/resource/43nn-pn8j.json?$select=dba,building,street,phone,max(inspection_date)%20as%20d&$group=dba,building,street,phone&$order=d%20desc&$limit=200&$where=" + encodeURIComponent(`cuisine_description='Chinese' AND zipcode in${ZIP} AND inspection_date > '2025-06-01' AND phone IS NOT NULL`));
  for (const r of rows) add("food", r.dba, addr(`${r.building} ${r.street}`), r.phone, "纽约市卫生局餐馆登记");
});
const npi = async (cat, tax) => { const d = await j(`https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&taxonomy_description=${encodeURIComponent(tax)}&city=FLUSHING&state=NY&limit=60`);
  for (const r of (d.results || []).sort((a, b) => (b.basic.last_updated || "").localeCompare(a.basic.last_updated || ""))) { const loc = r.addresses.find(a => a.address_purpose === "LOCATION") || r.addresses[0]; if (!/^1135[45]/.test(loc.postal_code || "")) continue; const dba = (r.other_names || []).find(o => o.organization_name); add(cat, dba ? dba.organization_name : r.basic.organization_name, addr(loc.address_1), loc.telephone_number, "美国联邦医疗服务登记 NPI"); } };
await safe("med", async () => { await npi("med", "Family Medicine"); await npi("med", "Internal Medicine"); await npi("med", "Pediatrics"); });
await safe("dental", async () => { await npi("dental", "Dentist"); await npi("dental", "Optometrist"); });
await safe("tcm", async () => { await npi("tcm", "Acupuncturist"); });
const dcwp = async (cat, cats) => { const rows = await j("https://data.cityofnewyork.us/resource/w7w3-xahh.json?$limit=300&$where=" + encodeURIComponent(`business_category in(${cats.map(c => `'${c}'`).join(",")}) AND license_status='Active' AND address_zip in${ZIP} AND contact_phone IS NOT NULL`));
  for (const r of rows.sort((a, b) => (b.license_creation_date || "").localeCompare(a.license_creation_date || ""))) add(cat, r.business_name, addr(`${r.address_building || ""} ${r.address_street_name || ""}`), r.contact_phone, "纽约市消费者保护局执照"); };
await safe("reno", () => dcwp("reno", ["Home Improvement Contractor"]));
await safe("car", () => dcwp("car", ["Secondhand Dealer - Auto", "Tow Truck Company", "Car Wash", "Garage & Parking Lot"]));
await safe("law", async () => { const rows = await j("https://data.ny.gov/resource/eqw2-r5nb.json?$limit=400&$where=" + encodeURIComponent(`city='FLUSHING' AND zip in${ZIP} AND status='Currently registered' AND company_name IS NOT NULL AND phone_number IS NOT NULL`));
  for (const r of rows) add("law", r.company_name, addr(r.street_1), r.phone_number, "纽约州律师登记"); });
await safe("beauty", async () => { const rows = await j("https://data.ny.gov/resource/y3u4-jbgh.json?$limit=300&$where=" + encodeURIComponent(`upper(business_city)='FLUSHING' AND business_zip in${ZIP} AND license_type='DOSAEBUSINESS'`));
  for (const r of rows.sort((a, b) => (b.license_cur_effective_term || "").localeCompare(a.license_cur_effective_term || ""))) add("beauty", r.business_name, addr(r.business_address_1), "", "纽约州美容美甲执照"); });
await safe("realty", async () => { const rows = await j("https://data.ny.gov/resource/nsde-gcv2.json?$limit=300&$where=" + encodeURIComponent(`business_city='FLUSHING' AND business_zip in${ZIP}`));
  for (const r of rows) add("realty", r.business_name, addr(r.business_address_1), "", "纽约州地产经纪执照"); });
for (const [k, v] of Object.entries(out)) { dir.items.push(...v); console.log(`::notice title=${k}::${v.length} added, e.g. ${v.slice(0, 2).map(x => x.name + " / " + x.address + " / " + x.phone).join(" ; ")}`); }
await fs.writeFile("data/directory.json", JSON.stringify(dir, null, 1));
