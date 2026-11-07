# GuruAgasthiya web

The GuruAgasthiya Android app (v7.7) as an installable web app that also works offline.

## How it was made

The APK is a thin native shell, a WebView loading a single 9 MB `assets/index.html`. That page already
detects the native `GuruApp` bridge and falls back to browser APIs when it is missing:

| Android bridge (`GuruApp.*`)        | Web fallback already in the app code              |
| ----------------------------------- | ------------------------------------------------- |
| `setAlarm` / `cancelAlarm` / `alarmIds` | localStorage + in-page timer, chime, `Notification` |
| `copyText` / `copyHtml`             | Clipboard API                                     |
| `shareText`                         | file download / text view                         |
| `printHtml`                         | `window.print()` in a report window               |
| `openSettings`                      | hidden on the web                                 |

`scripts/import-apk.mjs` splits that file into normal assets. Every style and script block becomes a file
in `public/css` or `public/js`, in its original order. The fonts, images and the city and land data become
separate files too. The script then adds a web app manifest, icons and a service worker that precaches
everything. The app code is unchanged, apart from two lines that now read the city and land data from
`window.GA_CITY` and `window.GA_LAND` instead of inline JSON.

## Revamp layer

`revamp/` holds the new interface. `npm run import` copies it into `public/revamp/` and loads it after the
original styles and scripts. It only moves and restyles existing elements, so every element ID and
every calculation in the v7.7 engine stays as it was.

- **Design:** "panchangam ink and turmeric". Indigo ink carries text and actions, and turmeric marks only the
  sign rising now. Text is set in IBM Plex Sans, with Mukta Malar for Tamil. Light and dark themes are both
  included, with a choice under Settings.
- **Settings popup:** opens from **Settings** in the sidebar, or under the app name on phones. It has Appearance
  (Match device, Light, Dark), Language and Chart colour, and closes with ✕, Done, Esc or a click outside.
  On phones it rises from the bottom.
- **Navigation:** the 22 tools are grouped (Timings, Charts, Questions, Money and markets, Sport, Research,
  More) and searchable. Press `/` or `Ctrl/⌘ K` to search.
- **Desktop:** two columns, the sidebar and one workspace that shows a single page at a time:
  - **Now** (the home page): Rising now across the top, then the transit chart beside the next six timings.
    Click a timing to jump to it in Lagna Timings.
  - **Lagna Timings:** the full list on its own; the transit chart lives on the Now page. Tapping a row slides
    the chart in from the right, set to that time (close it with ✕ or Esc).
  - **Every other tool is its own page** with its own address, such as `#/birth-chart`, `#/gmp-prasnam` or
    `#/money-manifestation`. Back, forward, reload and bookmarks all work. ✕ or Esc returns to Now or
    Lagna Timings. The page header stays at the top while you scroll, and the buttons follow the form, so
    nothing is pinned over the content.
  - The timing-detail chart (tapping a timing row) is still a panel over the page.
  - The engine's live muhurtham alert sits in the corner as a one-line chip. Tap it for the details, or ✕ to
    dismiss it.
  - On phones narrower than 480px, every form field takes its own row.
  - The sidebar narrows to icons with the button next to the app name, and the app remembers that choice and
    the last page.
- **Phone:** a bottom tab bar (Now, Timings, Chart, Tools). Tools open from a bottom sheet.
- **Rising now** is the first thing on the page.
- **Long explanations** fold to two lines, with a "Read more" button.
- **Inside every tool:**
  - Forms are cards, with labels above clearly outlined fields.
  - The place picker (search, country, state, city, coordinates) folds to one line with a **Change** button.
  - The main button stays pinned to the bottom of the drawer, and each header shows the tool's icon.
- **Results:**
  - Timing rows share one layout: times, lords and tags, details, and an alarm bell. Repeated date chips are removed.
  - In narrow lists, rows switch to a stacked layout.
  - Question tools (GMP, Horary, Lost and Found) show a verdict card with a status colour.
  - Tables, tags and the chart toolbar follow the same design.

- **Disclaimer:** shown the first time a tool is opened each day. After it is accepted, it doesn't appear again
  until the next calendar day on that device. The original app showed it before every tool.

### Added features (`revamp/features.js`)

- **First-run setup:** on a first visit, choose a home place (search or current location), language and
  ayanamsa. You can run it again from Settings, with **Set up home place**. The engine's shared place
  (added in v7.2) then carries that place to every tool.
- **Birth Chart** opens on today's date instead of 1 January 2100.
- **Timings list:**
  - **Jump to now** scrolls to the timing running now, or the next one.
  - **Tagged timings only** hides rows without a muhurtham or money tag.
- **Every result** (all tools and the main list) gets **Copy**, **Print**, **Share** (or **Save as text** where
  sharing isn't available) and, for timing lists:
  - **Add to calendar:** a `.ics` file with an alert at each start. Past timings are skipped, and above 60
    timings only the tagged ones are included.
  - **Jump to now.**
- **Saved people:** Fortuna's birth details can be filled from the people saved in Birth Chart.
- **Question log:** GMP Prasnam, Horary and Lost and Found save each answer on the device. Mark later whether it
  happened; the log counts how many readings came true.
- **Alarms:** the alarm panel explains that alarms ring while the app is open and that calendar alerts work
  when it's closed. It also has an **Allow notifications** button.
- **Accessibility:**
  - Timing rows can be reached with Tab and opened with Enter, and each one has a spoken label.
  - The lightest grey text was darkened to about 5:1 contrast.
- **Lighter start-up:** the world map outline (0.5 MB) loads after the page, and `npm start` compresses files
  the way real hosts do. The city list goes over the network as 2.8 MB instead of 6.9 MB.

### Translations (`revamp/i18n.js`)

The engine translates 109 labels into 44 languages. The revamp follows the same language setting:

- **English + தமிழ்** and **English only:** unchanged.
- **தமிழ்:**
  - Every text the revamp adds is translated, including messages that carry values, such as toasts, the
    clock-change warning and the question-log counts.
  - The engine's short labels are translated too: fields, buttons, options, planets, signs and the 27 stars.
  - So are dates, lord chains (சனி/ராகு/செவ்வாய்), the Rising now line and timing-row details.
  - Where the engine prints an English paragraph with a Tamil copy beside it, the Tamil copy is shown instead.
- **The other 43 languages:** the main revamp labels are translated: sidebar groups, Now, Next timings,
  Settings, search, and the Copy, Print, Share and calendar buttons. Long help text stays in English, as it
  does in the engine.

Text is matched whole, so a word inside a sentence is never changed. The original text comes back when the
language changes.

### Buttons

One system across the app, with one corner radius:

| Kind | Height | Used for |
| ---- | ------ | -------- |
| Primary | 48 px, filled | the main action of a page (Calculate, Find …) |
| Secondary | 44 px, tinted | other page actions (Use My Location, Save This Chart, Tick all) |
| Small | 36 px, tinted | toolbars and list or result actions (Edit, Copy, Jump to now, Play Lagna Movement) |
| Segmented | 40 px | choices on one track (timing modes, Analog / Digital, 3 11 tabs, Appearance) |

### Forms

- On desktop, each tool's form and results sit in one centred column: 1040 px, or 1180 px for chart tools.
  The header and the pinned button bar run the full width.
- Every field is 40 px tall. In a row of fields, the boxes line up at the bottom even when one label has a
  longer hint.
- Switches and tick boxes sit on one line with their label, across the card.
- Option tiles have even sizes: Fortuna purposes and lottery places.

Edit files in `revamp/`, then run `npm run import` to rebuild `public/`.

## Tests

```bash
npm test                 # compare the engine's results with tests/snapshots.json
npm test -- --update     # accept the current results as the new reference
```

`scripts/test-engine.mjs` loads the real app headless (jsdom) and runs:

- **Lagna Timings** for Chennai, 15 Jan 2026, from 00:00 and from 22:00 (across midnight).
- **A Birth Chart** for Chennai, 15 Jun 1990, 10:30.
- **Three time-zone edge cases:**
  - New York, 14 Mar 2021, 02:30 (a time that doesn't exist).
  - New York, 7 Nov 2021, 01:30 (a time that happens twice).
  - Chennai, 1 Sep 1942 (India's wartime UTC+6:30).

Run it after importing a new APK. Any change in a time, a lord or a planet position is shown line by line.

The unchanged v7.7 port is kept read-only in `../guruagasthiya-v7.7-original/`.

## Use

```bash
npm start               # http://localhost:4173
npm run import -- ../GuruAgasthiya-7.8.apk   # regenerate public/ from a newer APK
```

### Updates and caching

A normal refresh always shows the latest build. You never need to clear the cache.

- Every file the page loads has a content hash in its address (`?v=…`), so a changed file is a new address.
- The service worker fetches the page and `version.json` fresh every time. Versioned files come from its
  store. Other files are checked with the server. The store answers only when there is no connection.
- On each load, `pwa.js` compares its build id with `version.json`. If the server has a newer build, it
  clears the offline copy and reloads once.
- `npm start` sends `no-store` for the page, `version.json`, `sw.js` and `pwa.js`, and `no-cache` with ETags
  for everything else. On another host, give `index.html`, `version.json`, `sw.js` and `pwa.js` the
  header `Cache-Control: no-store` (or `no-cache`).

To deploy, upload `public/` to any static host (Cloudflare Pages, Netlify, Vercel, nginx). It needs HTTPS
for the service worker, install prompt, geolocation and notifications.

## Differences from the APK

- Alarms ring only while the app is open in a tab or installed window. Android's `AlarmManager` could ring
  with the app closed. **Add to Calendar** (ICS) remains the reliable way to get alerts when the app is closed.
- The online place search (open-meteo geocoding) needs a network connection. The 160k-city list works offline.
