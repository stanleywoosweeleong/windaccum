风的累积 · Wind Accumulation — PWA bundle

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

UPDATING
  Edit the app and push. There is no version number to bump any more.
  GitHub Pages takes a minute or two to publish. After that, each installed copy
  notices the change the next time it is opened or brought back to the front, and
  shows a "new version is ready" bar with a Refresh button. If the bar is dismissed,
  the new version simply appears on the next launch.
  Check a change before pushing:  node --check sw.js

WHAT CHANGED (text sized for phones)
  - Body text is 16px and nearly everything else is about 1px larger; the smallest
    notes went from 11px to 12.5px and long notes use the normal face, not monospace.
  - Every text box (lat/lon, place search, WhatsApp text) is 16px, so iPhone no
    longer zooms the page when one is tapped.
  - Weight: the heaviest weight is kept for the big reading, the verdict and
    headings; pills, badges and small labels dropped one step so small text is
    crisper.
  - Long Malay chip labels wrap to the next row instead of spilling off the card.

WHAT CHANGED (light and dark mode)
  The app follows the phone's light / dark setting, and a button beside 🌐 overrides
  it: 🌓 auto (follow the phone) -> ☀️ light -> 🌙 dark. The choice is remembered.
  - The map switches between Esri's Dark and Light Gray Canvas; wind arrows, isobars
    and their labels switch ink to stay readable on either.
  - Storm colours (the yellow / orange / red ramp and blue for dispersal) are the same
    in both modes, so a colour means the same thing whichever mode you are in. Where
    those colours are used as TEXT they are darkened in light mode.
  - All colours live in the two variable blocks at the top of the stylesheet
    (:root = dark, :root[data-theme="light"] = light).

WHAT CHANGED (review fixes: clock, ensemble, offline)
  An outside review of main found that four fixes this README described under -91
  and -92 were NOT in index.html (the README had been uploaded from a newer bundle
  than the code). They are implemented now:
  1. One clock, Malaysia Time. All three forecast/ensemble requests ask for
     Asia/Kuala_Lumpur and the stamps are never parsed in the device zone, so "now",
     the 48 h window, "today", the morning window and the IR alignment are the same
     on any device. Times are tagged MYT. Check with:  node audit_time.js
  2. Ensemble confidence is matched to the selected hour by TIMESTAMP, not by array
     position. An hour the ensemble does not cover says so.
  3. Every ensemble member is read (keys are enumerated from the response).
  4. Offline fallback moves the whole view (pin, lat/lon fields, map) to the cached
     place and the banner names that place and how old the cache is. The spot you
     asked for stays saved and is retried on the next launch.
  The cache key changed wa_cache -> wa_cache2; the first open refetches.
  The other -91 items (3, 5, 6, 7) followed straight after and are in too - see -91.
  The isobar layer (-90) followed after that, so everything described below is now
  in the code.

WHAT CHANGED (Bahasa Melayu)
  The app now speaks three languages: 中文, English and Bahasa Melayu. The first-launch
  picker offers all three, and the 🌐 button cycles 中文 -> EN -> BM. Every label,
  warning, legend, the explanation panel and the WhatsApp / morning texts are
  translated. Place and group names in the Places list are shown as saved.
  The Malay text was machine-written - have a native speaker read it, the safety
  warnings especially. All strings live in one place: the `ms` block of I18N plus
  the third argument of each T(zh, en, ms) call in index.html.

WHAT CHANGED (self-updating + language picker)
  1. No more manual version bump. sw.js keeps ONE fixed cache (windaccum-shell).
     The page asks the worker to re-check the shell files on launch and on every
     return to the foreground; the worker compares index.html byte-for-byte and, if
     it differs, the page shows the update bar. Old versioned caches
     (windaccum-2026...) are removed automatically; caches belonging to other apps
     on the same github.io origin are never touched.
     BEHAVIOUR CHANGE: the app used to reload itself when a new worker took over.
     Now it always opens the saved copy instantly and offers the update a moment
     later (one tap). Installs still on the old worker migrate by themselves over a
     launch or two; the bar first appears on the deploy AFTER that.
  2. First-launch language picker. With no saved language the app opens on a
     full-screen 中文 / English choice, remembers it, and never asks again. The 🌐
     button still switches and saves through the same path. Anyone who never
     pressed 🌐 before has nothing saved and will see the picker once.
     The location request now waits until the language is chosen.

WHAT CHANGED BEFORE THAT (locate on launch, was -93)
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

WHAT CHANGED IN -92 (Malaysia Standard Time)  [implemented in the review fixes above]
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

WHAT CHANGED IN -91 (bug fixes found auditing the pre-isobar code)
  [all seven items are implemented]
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
     promised instant-offline paint now actually happens: the last forecast is
     painted at launch when it is for the same spot and under 3 hours old. An older
     cache, or one for another place, is only shown by the offline path, with its
     banner.
  6. function toast() was declared twice; the later one hoisted over the first, so
     #wtoast was never created and its CSS was dead. One implementation now.
  7. Terrain elevation was awaited BEFORE the first render, blocking every location
     change on a second round-trip for an optional layer. It now loads after the
     first paint and re-renders when it lands.

WHAT CHANGED IN -90  [implemented; written fresh for this app, not ported]
  Isobars. New 〰 button next to the IR / 地点 buttons.
  - Marching squares over the ECMWF mean-sea-level pressure field. Draws the field
    and nothing else: no low is named, no circulation classified, no centre marked.
  - Uses its OWN grid: 13x13 at 0.5deg = a 6deg (~660 km) box, NOT the 1.6deg
    convergence grid. Across 180 km the tropical MSLP field varies by well under
    1 hPa, so contouring the convergence grid would draw nothing on most days.
  - Contour interval anchors on 1 hPa and moves only when
    forced: finer (0.5 / 0.25) on a slack field, coarser (2 / 4 / 5 / 10) if the
    range would produce more than 14 lines. The chosen interval is always printed
    in the legend.
  - Costs no extra API traffic unless the layer is switched on.
  - Also adds sea-level pressure + the model's own 24h tendency to the readout row
    (pressure now minus the model's value 24 h earlier; the main request asks for
    one past day to have it). This part rides on the main request, always.
  - The grid is snapped to the model's 0.25deg pressure grid, the hour is matched to
    the forecast by timestamp, and switching the layer on opens the map out to the
    6deg box (off returns to the convergence grid). Lines are corner-smoothed for
    display. If the pressure request fails the legend says so and the forecast is
    unaffected; pressing 〰 again retries.
  - Cache key changed wa_cache -> wa_cache2 (old caches lack the timezone offset
    the two time axes are matched on). First open after updating refetches.

NOTES
  - Data: ECMWF IFS via Open-Meteo (winds 0.25deg; CAPE/rain 9km HRES). Indicative.
  - Leaflet loads from unpkg CDN on first load (cached after by the service worker).
  - Isobars use pressure_msl from the same ECMWF endpoint, sampled with
    cell_selection=nearest so sea grid-cells are not snapped to land.
  - Storm/rain/wind thresholds are provisional — calibrate against field observations.
