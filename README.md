# GuruAgasthiya web

The GuruAgasthiya Android app (v10.5) as a plain website.

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
separate files too. The app code is unchanged, apart from two lines that now read the city and land data from
`window.GA_CITY` and `window.GA_LAND` instead of inline JSON. There is no web app manifest and no service
worker: the site is not installable and needs a connection, like any website.

## Revamp layer

`revamp/` holds the new interface. `npm run import` copies it into `public/revamp/` and loads it after the
original styles and scripts. It only moves and restyles existing elements, so every element ID and
every calculation in the v10.5 engine stays as it was.

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
  ayanamsa. When the browser cannot give a position, the dialog says why and offers the nearest listed city
  to where the network connection appears to be (a lookup at ipwho.is, or geojs.io), marked approximate. You can run it again from Settings, with **Set up home place**. The engine's shared place
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
  - The long help paragraphs (How It Works, rule notes and warnings, the About page, fixed notes under
    results) are translated whole, with their bold and italic kept (`revamp/i18n-ta.js`). Names, book titles
    and city names stay as written.
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

Edit files in `revamp/`, then run `npm run build` (the same as `npm run import`) to rebuild `public/`.
`npm run dev` rebuilds and then serves it.

## Tests

```bash
npm test                 # import check + engine results (fast)
npm run test:pages       # every page in Chrome, desktop and phone: loads, main button works, no script errors
npm run test:all         # both
npm test -- --update     # accept the current engine results as the new reference
node scripts/style-diff.mjs --save   # record every element's style (before a CSS refactor)
node scripts/style-diff.mjs          # compare after it: lists every style value that changed
```

- **Import check** (`scripts/check-contract.mjs`): the redesign works on about 50 of the engine's own
  elements, found by id. After each `npm run import` it lists any id a new APK renamed or removed.
- **Engine results** (`scripts/test-engine.mjs`): loads the real app headless (jsdom) and runs:
  - **Lagna Timings** for Chennai, 15 Jan 2026, from 00:00 and from 22:00 (across midnight).
  - **A Birth Chart** for Chennai, 15 Jun 1990, 10:30.
  - **Three time-zone edge cases:**
    - New York, 14 Mar 2021, 02:30 (a time that doesn't exist).
    - New York, 7 Nov 2021, 01:30 (a time that happens twice).
    - Chennai, 1 Sep 1942 (India's wartime UTC+6:30).

  Any change in a time, a lord or a planet position is shown line by line.
- **Pages** (`scripts/test-pages.mjs`): opens all 24 pages by their address in the Chrome installed on
  this computer (playwright-core). Each page is checked at 1440×900 and 390×844, its main button is
  pressed, and the run fails on missing content, a wrong address or highlight, a page wider than the
  screen, no result, or any script error.

Run `npm run test:all` after importing a new APK, and before publishing.

The unchanged v7.7 port is kept read-only in `../guruagasthiya-v7.7-original/`.

### How the code is organised

- `revamp/revamp.js`: the shell. Layout, sidebar and search, routes (`#/…`), settings, the phone tab bar,
  the shared page watcher, and the problem notice.
- `revamp/features.js`: added features. Sharing, calendar, question log, setup, the working state on main
  buttons, and the problem log.
- `revamp/i18n.js`: translations.
- `revamp/i18n-ta.js`: Tamil for the long help paragraphs.
- `revamp/place.js`: the one-line place picker.
- `revamp/text.js`: tidying engine text. Read more, page icons, date chips, and the daily disclaimer.
- `revamp/revamp.css`: all styles. The engine's styles are in a lower cascade layer (`@layer engine`), so
  revamp rules win without `!important`. The few left override inline styles the engine sets.
- `revamp.js` loads first, then the others in name order, then routes start once every script has run.

### Problems and the problem log

A script error shows one short notice ("Something went wrong on this page") with a Reload button. The last
20 errors are kept on the device. **Settings → Problem log** can copy them to send to the developer.

## Use

```bash
npm run build           # rebuild public/ from ../GuruAgasthiya-10.5.apk and revamp/
npm start               # http://localhost:4173
npm run dev             # build, then start
npm run import -- ../GuruAgasthiya-7.8.apk   # regenerate public/ from a newer APK
```

### Updates and caching

A normal refresh always shows the latest build. You never need to clear the cache.

- Every file the page loads has a content hash in its address (`?v=…`), so a changed file is a new address.
- `npm start` sends `no-store` for the page and `no-cache` with ETags for everything else. On another host,
  give `index.html` the header `Cache-Control: no-store` (or `no-cache`).
- Earlier builds installed a service worker for offline use. The page now removes it, and its stored
  files, from any browser that still has one.

### Publishing

Upload `public/` to any static host with HTTPS. Location and notifications need it.

- **Cloudflare Pages or Netlify:** the build writes `public/_headers`, so the caching above works with no
  extra setup. With Cloudflare:

  ```bash
  npx wrangler pages deploy public --project-name guruagasthiya
  ```

  It asks you to sign in to your Cloudflare account the first time.
- **Vercel:** `vercel.json` skips the install and build steps (the APK is not in the repository; `public/`
  is) and sets the same headers. Import the project from GitHub and deploy; nothing else to configure.
- **nginx and others:** set `Cache-Control: no-store` for `/` and `/index.html`. Hosts compress files themselves; `npm start` uses Brotli too, so the city list
  downloads as about 2.3 MB.

## Differences from the APK

- Alarms ring only while the app is open in a tab. Android's `AlarmManager` could ring with the app closed. **Add to Calendar** (ICS) remains the reliable way to get alerts when the app is closed.
- The site needs a connection; the APK worked offline. The 160k-city list is part of the site, so the place
  search works without the online (open-meteo) lookup.
