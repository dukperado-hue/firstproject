# Web VOR · LINE OA — น้องสำลี

Reporter intake page (LINE-bot style chat UI) for CAAT's Voluntary
Occurrence Report system, plus a small Express server so reports
submitted by outside reporters are stored centrally instead of only
in each browser's localStorage.

## Run locally

```
npm install
npm start
```

Then open http://localhost:3000 (default port, override with `PORT`).

## What's here

- `public/` — the static frontend (unpacked from the Claude design
  export: React + Babel-standalone, all assets as plain files).
- `server/index.js` — Express app: serves `public/` and exposes the
  report storage API.
- `server/store.js` — file-backed storage at `server/data/reports.json`
  (override the directory with `VOR_DATA_DIR`). Swap this module for a
  real database (Postgres, etc.) without touching the frontend.

## API

```
GET    /api/vor          list all reports
GET    /api/vor/:ref      single report
POST   /api/vor           create a report
PATCH  /api/vor/:ref      partial update
```

## Deploying to a server

Any host that can run a Node process works (a VPS, Render, Railway,
Fly.io, etc.):

1. Copy this project to the server (or `git clone` it there).
2. `npm install`
3. Set `PORT` if needed, then run `npm start` (or put it behind a
   process manager like `pm2`/`systemd`).
4. Put a reverse proxy (nginx/Caddy) in front for HTTPS if exposing it
   publicly.
5. Point the LINE Official Account's webhook / rich menu link at the
   server's public URL.

`server/data/` holds the submitted reports — back it up, and mount it
on persistent storage if your host uses ephemeral filesystems
(containers redeploy = lost data unless this directory is a volume).
