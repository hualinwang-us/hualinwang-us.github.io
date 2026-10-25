// Security self-test: acts like a stranger with only the public key, and tries things that must be refused.
// Run from GitHub Actions (workflow "Security self-test"). Prints PASS/FAIL per check. Writes nothing that sticks.
import fs from "node:fs/promises";
const cfg = await fs.readFile("config.js", "utf8");
const URL0 = cfg.match(/supabaseUrl:\s*"([^"]+)"/)[1], KEY = cfg.match(/supabaseKey:\s*"([^"]+)"/)[1];
const H = { apikey: KEY, "Content-Type": "application/json" };
const out = [];
async function req(method, path, body, extra) {
  const r = await fetch(URL0 + path, { method, headers: { ...H, ...(extra || {}) }, body: body == null ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  return { s: r.status, t: t.slice(0, 160), j };
}
const refused = r => r.s >= 400 || (Array.isArray(r.j) && r.j.length === 0) || r.j === false;
function check(name, ok, r, note) { out.push({ name, ok, status: r && r.s, detail: r ? r.t : note || "" }); }

// pick a real visible post id for update/delete attempts (they must not work)
const vis = await req("GET", "/rest/v1/posts?select=id&limit=1");
const pid = Array.isArray(vis.j) && vis.j[0] ? vis.j[0].id : 1;
check("Can read public posts (expected)", vis.s === 200, vis);

let r;
r = await req("GET", "/rest/v1/posts?select=delete_key&limit=1"); check("Secret delete_key is hidden", r.s >= 400, r);
r = await req("GET", "/rest/v1/posts?select=guest_tag&limit=1"); check("Guest tracking tag is hidden", r.s >= 400, r);
r = await req("GET", "/rest/v1/posts?select=user_id&limit=1"); check("Poster account id is hidden", r.s >= 400, r);
r = await req("GET", "/rest/v1/posts?select=id&hidden=eq.true&limit=5"); check("Hidden (reported) posts can't be read", refused(r), r);
r = await req("POST", "/rest/v1/posts", { board: "other", title: "QA test ignore", body: "QA test ignore" }, { Prefer: "return=minimal" }); check("Direct insert into posts is blocked", r.s >= 400, r);
r = await req("PATCH", `/rest/v1/posts?id=eq.${pid}`, { title: "hacked" }, { Prefer: "return=representation" }); check("Editing someone's post is blocked", refused(r), r);
r = await req("PATCH", `/rest/v1/posts?id=eq.${pid}`, { pinned_until: "2099-01-01" }, { Prefer: "return=representation" }); check("Pinning a post yourself is blocked", refused(r), r);
r = await req("DELETE", `/rest/v1/posts?id=eq.${pid}`, null, { Prefer: "return=representation" }); check("Deleting someone's post is blocked", refused(r), r);
r = await req("POST", "/rest/v1/rpc/delete_post", { p_id: pid, p_key: "00000000-0000-0000-0000-000000000000" }); check("Delete with a wrong key does nothing", r.j === false || r.s >= 400, r);
r = await req("POST", "/rest/v1/rpc/delete_my_post", { p_id: pid }); check("Account delete needs sign-in", r.s >= 400 || r.j === false, r);
r = await req("POST", "/rest/v1/rpc/set_post_images", { p_id: pid, p_key: "00000000-0000-0000-0000-000000000000", p_images: ["https://evil.example/x.png"] }); check("Can't attach outside images to a post", r.s >= 400 || r.j === false, r);
r = await req("GET", "/rest/v1/reports?select=*&limit=1"); check("Reports list is private", refused(r), r);
r = await req("POST", "/rest/v1/reports", { post_id: pid, reason: "spam" }, { Prefer: "return=minimal" }); check("Direct insert into reports is blocked", r.s >= 400, r);
r = await req("GET", "/rest/v1/post_replies?select=user_id&limit=1"); check("Reply author account id is hidden", r.s >= 400, r);
r = await req("POST", "/rest/v1/post_replies", { post_id: pid, user_id: "00000000-0000-0000-0000-000000000000", author: "x", body: "QA" }, { Prefer: "return=minimal" }); check("Direct insert into replies is blocked", r.s >= 400, r);
r = await req("POST", "/rest/v1/rpc/add_reply", { p_post: pid, p_body: "QA test" }); check("Replying needs sign-in", r.s >= 400, r);
r = await req("POST", "/rest/v1/rpc/my_replies", {}); check("My replies needs sign-in", r.s >= 400 || (Array.isArray(r.j) && !r.j.length), r);
r = await req("POST", "/rest/v1/rpc/my_post_ids", {}); check("My posts needs sign-in", r.s >= 400 || (Array.isArray(r.j) && !r.j.length), r);
r = await req("GET", "/rest/v1/businesses?select=delete_key,guest_tag&limit=1"); check("Business secret columns hidden", r.s >= 400, r);
r = await req("POST", "/rest/v1/businesses", { name: "QA test", cat: "other", featured_until: "2099-01-01" }, { Prefer: "return=minimal" }); check("Direct insert into businesses (self-featuring) blocked", r.s >= 400, r);
r = await req("PATCH", "/rest/v1/businesses?id=gt.0", { featured_until: "2099-01-01" }, { Prefer: "return=representation" }); check("Can't feature a business yourself", refused(r), r);
r = await req("GET", "/auth/v1/admin/users"); check("User list (emails) is private", r.s >= 400, r);
r = await req("POST", "/storage/v1/object/post-images/evil/x.html", "<script>alert(1)</script>", { "Content-Type": "text/html" }); check("Can't upload web pages to photo storage", r.s >= 400, r);
r = await req("POST", "/storage/v1/object/post-images/../x.png", "x", { "Content-Type": "image/png" }); check("Can't upload outside the photos folder", r.s >= 400, r);
r = await req("DELETE", "/storage/v1/object/post-images/p/anything.jpg"); check("Can't delete others' photos", r.s >= 400 || r.t.includes("[]") , r);
r = await req("GET", "/rest/v1/posts?select=*&limit=1"); check("select=* doesn't leak secret columns", r.s >= 400 || (Array.isArray(r.j) && !(r.j[0] && ("delete_key" in r.j[0]))), r);

// site checks
for (const u of ["https://hualin88.com/", "https://www.hualin88.com/", "https://hualinwang-us.github.io/"]) {
  try { const s = await fetch(u, { redirect: "manual" }); out.push({ name: "Site answers: " + u, ok: s.status < 400, status: s.status, detail: s.headers.get("location") || "" }); }
  catch (e) { out.push({ name: "Site answers: " + u, ok: false, status: 0, detail: String(e.message).slice(0, 120) }); }
}
let fails = 0;
for (const c of out) { const line = `${c.ok ? "PASS" : "FAIL"} | ${c.name} | HTTP ${c.status} | ${String(c.detail).replace(/\s+/g, " ").slice(0, 140)}`; console.log(line); console.log((c.ok ? "::notice::" : "::warning::") + line); if (!c.ok) fails++; }
console.log(`::notice::SUMMARY ${out.length - fails}/${out.length} passed`);
