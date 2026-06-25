/* ============================================================
   vor-api.js  —  Pluggable data access layer for VOR records
   ============================================================

   PURPOSE
   -------
   Every read/write of a VOR report goes through this module.
   Backed by the server's /api/vor endpoints (see server/index.js)
   so reports survive across browsers/devices instead of living
   only in one reporter's localStorage.

   A local cache mirrors the server so synchronous reads (used by
   the chat simulation's "track status" lookup) can render without
   a spinner. The cache is seeded by an initial GET on load and
   kept in sync by every create/update.

   ENDPOINTS
   ---------
     GET    /api/vor              → list all reports
     GET    /api/vor/:ref         → single report
     POST   /api/vor              → create
     PATCH  /api/vor/:ref         → partial update

   Set window.__VOR_API_BASE before this script loads to point at
   a different host (defaults to same-origin).

   EVENTS
   ------
   Whenever data changes, this module dispatches
       window.dispatchEvent(new CustomEvent("vor:updated", { detail }))
   so any open list/detail view re-renders without polling.

   ============================================================ */

(function () {
  const BASE = window.__VOR_API_BASE || "";

  let _cache = [];
  let _ready = false;
  const _readyPromise = fetch(BASE + "/api/vor")
    .then((r) => (r.ok ? r.json() : []))
    .then((all) => { _cache = Array.isArray(all) ? all : []; _ready = true; window.dispatchEvent(new CustomEvent("vor:updated")); })
    .catch(() => { _ready = true; });

  function _upsertCache(rec) {
    const i = _cache.findIndex((r) => r.ref === rec.ref);
    if (i === -1) _cache.unshift(rec);
    else _cache[i] = rec;
  }

  async function _listImpl() {
    const res = await fetch(BASE + "/api/vor");
    _cache = res.ok ? await res.json() : _cache;
    return _cache;
  }

  async function _getImpl(ref) {
    const res = await fetch(BASE + "/api/vor/" + encodeURIComponent(ref));
    if (!res.ok) return null;
    return res.json();
  }

  async function _createImpl(rec) {
    _upsertCache(rec); // optimistic, so the chat can read it back immediately
    window.dispatchEvent(new CustomEvent("vor:updated"));
    const res = await fetch(BASE + "/api/vor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    const saved = res.ok ? await res.json() : rec;
    _upsertCache(saved);
    window.dispatchEvent(new CustomEvent("vor:updated"));
    return saved;
  }

  async function _updateImpl(ref, patch) {
    const i = _cache.findIndex((r) => r.ref === ref);
    if (i !== -1) { _cache[i] = { ..._cache[i], ...patch }; window.dispatchEvent(new CustomEvent("vor:updated")); }
    const res = await fetch(BASE + "/api/vor/" + encodeURIComponent(ref), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return i !== -1 ? _cache[i] : null;
    const saved = await res.json();
    _upsertCache(saved);
    window.dispatchEvent(new CustomEvent("vor:updated"));
    return saved;
  }

  /* ------------------------- public API -------------------------- */

  const vorApi = {
    list:   _listImpl,
    get:    _getImpl,
    create: _createImpl,
    update: _updateImpl,
    ready:  () => _readyPromise,
  };

  /* --------------------- synchronous helpers --------------------- */
  /* For code paths that need to render immediately (no spinner).   */
  /* Read from the in-memory cache, which is seeded on load and     */
  /* kept current by create/update.                                 */

  const vorApiSync = {
    list:   () => _cache,
    get:    (ref) => _cache.find((r) => r.ref === ref) || null,
    isReady: () => _ready,
  };

  /* -------------------- reference number ------------------------- */
  /* Format: VOR-<Buddhist year>-<MM>-<NNNN>                         */

  function newReference() {
    const now = new Date();
    const by = now.getFullYear() + 543;
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const monthly = _cache.filter((r) => (r.ref || "").startsWith(`VOR-${by}-${mm}-`));
    const seq = String(monthly.length + 184).padStart(4, "0");
    return `VOR-${by}-${mm}-${seq}`;
  }

  Object.assign(window, { vorApi, vorApiSync, newReference });
})();
