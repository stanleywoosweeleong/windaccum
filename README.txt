风的累积 · Wind Accumulation — PWA bundle
Version: windaccum-20260719-87

CONTENTS (deploy ALL 7 files to the same folder, e.g. your GitHub Pages repo root):
  index.html            the whole app (single file)
  manifest.json         PWA manifest
  sw.js                 service worker (offline shell + auto-update)
  icon-192.png          PWA icon
  icon-512.png          PWA icon (any + maskable)
  apple-touch-icon.png  iOS home-screen icon (180x180)
  favicon-32.png        browser tab icon

DEPLOY
  1. Put all 7 files in the repo root (same directory).
  2. Serve over HTTPS (GitHub Pages works). Service worker + install need HTTPS.
  3. Open the URL; "Add to Home Screen" installs it as a standalone app.

UPDATING (single place)
  Edit the app, then bump `const CACHE` in sw.js (e.g. -87 -> -88), and redeploy.
  Clients auto-update to the new version on next open.

NOTES
  - Data: ECMWF IFS via Open-Meteo (winds 0.25deg; CAPE/rain 9km HRES). Indicative.
  - Leaflet loads from unpkg CDN on first load (cached after by the service worker).
  - Storm/rain/wind thresholds are provisional — calibrate against field observations.
