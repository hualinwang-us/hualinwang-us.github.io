/* 华脉 sign-in (Supabase Auth over plain HTTPS, no library).
   Email: 6-digit code sent by email (or the magic link in the same email). Google: Supabase-hosted OAuth.
   Session kept in this browser (localStorage) and refreshed automatically. */
(function () {
  "use strict";
  const HLC = window.HLC;
  const URL0 = HLC.SB_URL, KEY = HLC.SB_KEY;
  const STORE = "hl-session";
  let session = null;
  const listeners = [];

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } };
  const save = s => { session = s; try { s ? localStorage.setItem(STORE, JSON.stringify(s)) : localStorage.removeItem(STORE); } catch (e) {} listeners.forEach(fn => { try { fn(user()); } catch (e) {} }); };
  const user = () => (session && session.user) ? { id: session.user.id, email: session.user.email || "", name: (session.user.user_metadata && (session.user.user_metadata.full_name || session.user.user_metadata.name)) || "" } : null;

  async function call(path, body, token) {
    const h = { apikey: KEY, "Content-Type": "application/json" };
    if (token) h.Authorization = "Bearer " + token;
    const r = await fetch(URL0 + "/auth/v1/" + path, { method: "POST", headers: h, body: JSON.stringify(body || {}) });
    const txt = await r.text(); let data = null; try { data = JSON.parse(txt); } catch (e) {}
    if (!r.ok) { const err = new Error((data && (data.msg || data.error_description || data.message || data.error)) || ("HTTP " + r.status)); err.status = r.status; err.code = data && (data.error_code || data.code); throw err; }
    return data;
  }
  function fromTokenResponse(d) {
    return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: d.user };
  }
  async function refresh() {
    if (!session || !session.refresh_token) return null;
    try { save(fromTokenResponse(await call("token?grant_type=refresh_token", { refresh_token: session.refresh_token }))); }
    catch (e) { if (e.status === 400 || e.status === 401) save(null); }
    return session;
  }
  // A valid access token, refreshed if it expires within a minute.
  async function token() {
    if (!session) return null;
    if (session.expires_at - 60 < Date.now() / 1000) await refresh();
    return session ? session.access_token : null;
  }

  // Returning from Google or an email link: tokens arrive in the URL fragment.
  function takeTokensFromUrl() {
    const h = location.hash.replace(/^#/, "");
    if (!/access_token=|error_description=/.test(h)) return false;
    // Only accept tokens we asked for (a crafted link could otherwise sign you into someone else's account).
    let asked = false; try { asked = sessionStorage.getItem("hl-oauth") === "1"; sessionStorage.removeItem("hl-oauth"); } catch (e) {}
    if (!asked) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; } return false; }
    const p = new URLSearchParams(h);
    if (p.get("access_token")) {
      const s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_at: Number(p.get("expires_at")) || Math.floor(Date.now() / 1000) + Number(p.get("expires_in") || 3600), user: null };
      session = s;
      fetch(URL0 + "/auth/v1/user", { headers: { apikey: KEY, Authorization: "Bearer " + s.access_token } }).then(r => r.json()).then(u => { s.user = u; save(s); }).catch(() => save(s));
    } else if (p.get("error_description")) {
      HLAuth.lastError = p.get("error_description");
    }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
    return true;
  }

  const HLAuth = {
    lastError: "",
    user, token,
    onChange(fn) { listeners.push(fn); },
    async sendCode(email) { await call("otp", { email, create_user: true }); },
    async verifyCode(email, code) { save(fromTokenResponse(await call("verify", { type: "email", email, token: code }))); return user(); },
    // Email + password
    async signIn(email, password) { save(fromTokenResponse(await call("token?grant_type=password", { email, password }))); return user(); },
    // Sign up: Supabase emails a 6-digit code (Confirm signup template); a session comes back only after the code is entered.
    async signUp(email, password, name) { const d = await call("signup", { email, password, data: { full_name: name || "" } }); if (d && d.access_token) save(fromTokenResponse(d)); return d; },
    async verifySignup(email, code) {
      try { save(fromTokenResponse(await call("verify", { type: "signup", email, token: code }))); }
      catch (e) { save(fromTokenResponse(await call("verify", { type: "email", email, token: code }))); }
      return user();
    },
    async resendSignup(email) { await call("resend", { type: "signup", email }); },
    // Forgot password: code by email (Reset password template), then a new password
    async sendReset(email) { await call("recover", { email }); },
    async resetWithCode(email, code, password) {
      save(fromTokenResponse(await call("verify", { type: "recovery", email, token: code })));
      const t = await token();
      const r = await fetch(URL0 + "/auth/v1/user", { method: "PUT", headers: { apikey: KEY, "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ password }) });
      if (!r.ok) { const e = new Error("password update failed"); e.status = r.status; throw e; }
      return user();
    },
    google() {
      const back = HLC.siteBase();
      try { sessionStorage.setItem("hl-oauth", "1"); } catch (e) {}
      location.href = URL0 + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(back);
    },
    async signOut() { const t = session && session.access_token; save(null); if (t) { try { await call("logout", {}, t); } catch (e) {} } },
    takeTokensFromUrl
  };
  session = load();
  window.HLAuth = HLAuth;
  if (session && session.expires_at - 60 < Date.now() / 1000) refresh();
})();
