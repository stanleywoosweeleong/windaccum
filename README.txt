风的累积 · Wind Accumulation — PWA bundle
Version: windaccum-20261116-93

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

WHAT CHANGED IN -93 (locate on launch)
  The app now asks for the current location as soon as it opens. The last saved spot
  is drawn immediately (so nothing waits on GPS), then the pin and forecast move to
  where you are once the fix arrives. Details:
    - Launch uses a fast coarse fix (10 s timeout, a fix up to 5 min old is accepted);
      the "Current location" button still does the precise high-accuracy fix.
    - If the fix is within ~500 m of the spot already showing, the forecast is not
      refetched.
    - Tapping the map, a saved place, Go, or the location button while the launch fix
      is pending cancels it - a late fix never overrides a spot you chose.
    - Permission denied / no signal at launch is not an error: the app keeps the last
      spot and says so in a quiet line.

WHAT CHANGED IN -92 (Malaysia Standard Time)
  Every clock in the app now reads MYT (UTC+8), whatever the device is set to and
  wherever the pin has been dropped. Before this there were TWO clocks on one screen
  and neither was labelled:
    - Forecast rows came from timezone=auto, i.e. the FORECAST LOCATION's local time,
      then parsed by the browser as DEVICE-local. Click across the Strait to Sumatra
      or north into Thailand and the hours silently became UTC+7.
    - The IR satellite clock used toLocaleTimeString on a real instant, i.e. the
      DEVICE zone. The two agreed only when device zone = pin zone.
  Now: the API is asked for Asia/Kuala_Lumpur; naive stamps are read with getUTC*
  after appending "Z", so rendering never touches the device clock; the IR clock,
  "today", the 06-21 morning window and the WhatsApp date stamp are all Malaysian;
  and the MYT tag is printed on the readout line, the 48h strip, the IR clock, the
  explanation panel and inside the WhatsApp text itself.
  Malaysia has no daylight saving, so the fixed +8 offset is exact, not an
  approximation - the same reasoning TyphoonWatch's myt() helper uses.
  TO SHOW LOCATION-LOCAL TIME INSTEAD: set TZ back to 'auto' near the top of the
  script; the helpers keep working, the label would then need changing.

WHAT CHANGED IN -91 (bug fixes found auditing the pre-isobar code)
  1. Ensemble confidence read the WRONG HOUR. The panel indexed the ensemble arrays
     with the main grid's hour, but the main series is a 48-slot window opening ~2 h
     before now while the ensemble series always starts 00:00 today. At 3pm it was
     reading roughly the 01:00 members. Now matched on absolute time; hours the
     ensemble does not reach say so instead of being faked.
  2. Ensemble members were partly unread. Keys were rebuilt as '_member'+m, but
     Open-Meteo names them zero-padded from _member00 - so member00 and _member1..9
     never matched and only 41 of 51 members were counted. Keys are now ENUMERATED
     from the response.
  3. Ensemble measured 2 m RH while the deterministic gate uses 925 hPa RH, so the
     bar read optimistic. It now requests relative_humidity_925hPa (the ensemble API
     does serve pressure levels), falls back to 2 m only if that is absent, and the
     note says which one it used.
  4. Offline fallback silently swapped the LOCATION: it restored the cached place
     while pin and lat/lon fields still showed the requested one. The whole view now
     moves to the cached place and the banner names it AND the cache age.
  5. The boot line `const cached=loadCache()` was assigned and never used - the
     promised instant-offline paint now actually happens.
  6. function toast() was declared twice; the later one hoisted over the first, so
     #wtoast was never created and its CSS was dead. One implementation now.
  7. Terrain elevation was awaited BEFORE the first render, blocking every location
     change on a second round-trip for an optional layer. It now loads after the
     first paint and re-renders when it lands.

WHAT CHANGED IN -90
  Isobars, ported from 风眼 TyphoonWatch. New 〰 button next to the IR / 地点 buttons.
  - Marching squares over the ECMWF mean-sea-level pressure field. Draws the field
    and nothing else: no low is named, no circulation classified, no centre marked.
  - Uses its OWN grid: 13x13 at 0.5deg = a 6deg (~660 km) box, NOT the 1.6deg
    convergence grid. Across 180 km the tropical MSLP field varies by well under
    1 hPa, so contouring the convergence grid would draw nothing on most days.
  - Contour interval anchors on 1 hPa (TyphoonWatch's choice) and moves only when
    forced: finer (0.5 / 0.25) on a slack field, coarser (2 / 4 / 5 / 10) if the
    range would produce more than 14 lines. The chosen interval is always printed
    in the legend.
  - Costs no extra API traffic unless the layer is switched on.
  - Also adds sea-level pressure + the model's own 24h tendency to the readout row.
  - Cache key changed wa_cache -> wa_cache2 (old caches lack the timezone offset
    the two time axes are matched on). First open after updating refetches.

NOTES
  - Data: ECMWF IFS via Open-Meteo (winds 0.25deg; CAPE/rain 9km HRES). Indicative.
  - Isobars use pressure_msl from the same ECMWF endpoint, sampled with
    cell_selection=nearest so sea grid-cells are not snapped to land.
  - Leaflet loads from unpkg CDN on first load (cached after by the service worker).
  - Storm/rain/wind thresholds are provisional — calibrate against field observations.
