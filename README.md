# Shruti & Dhruval — Wedding RSVP Site

A single-page wedding site with an animated envelope intro, event schedule for
all five celebrations, photo gallery placeholder, and an RSVP form that saves
responses to a Google Sheet.

## Structure

```
index.html            Page markup
css/style.css          Styling (maroon & gold theme, envelope animation)
js/data.js              Couple info, event details, story text — edit this to update content
js/icons.js             Inline SVG icon set
js/main.js              Envelope animation, countdown, rendering, RSVP submission
apps-script/Code.gs      Google Apps Script backend (paste into your Google Sheet)
```

## 1. Connect the RSVP form to a Google Sheet

1. Create a new Google Sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions > Apps Script**. Delete the placeholder code and paste
   in the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Click **Deploy > New deployment**, choose type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, authorize the script with your Google account, and copy
   the **Web app URL**.
5. Open [`js/main.js`](js/main.js) and paste the URL into:
   ```js
   const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
6. Submit a test RSVP on the site, then check the Sheet — a new
   **RSVP Responses** tab should appear with your test entry.

Note: the form posts with `mode: "no-cors"`, so the browser can't read the
script's response (this avoids Apps Script's CORS/preflight limitations). The
site shows a success message as soon as the request is sent without a network
error — always verify against the Sheet after your first real test.

If you ever change the event list in `js/data.js` (names, or add/remove an
event) **after** RSVPs have started coming in, the Sheet's header row won't
auto-update (it's only written once, on the first response). New event
columns will simply append to the row without a matching header — either
manually add the header cell, or clear the sheet before responses start.

## 2. Edit content

All wedding details live in [`js/data.js`](js/data.js):

- `WEDDING` — couple names, parents, RSVP contact numbers, countdown target,
  family blessings text.
- `OUR_STORY` — heading + paragraphs (currently placeholder text — replace
  with your own).
- `EVENTS` — the five celebrations (Mehndi, Manglik Prasango, Musical Mehfil,
  Wedding, Reception), each with date, schedule, venue, and address.
  Map links and "Add to Calendar" links are generated automatically from this
  data.

## 3. Add photos later

For now, the gallery section shows placeholder tiles and there's a themed
illustration in the "Our Story" section instead of a couple photo.

When you have photos:

- Drop image files into `assets/img/gallery/`.
- In `js/data.js`, replace `GALLERY_PLACEHOLDER_COUNT` with a `GALLERY` array
  of `{ src, alt }` objects.
- In `js/main.js`, update `renderGallery()` to render `<img>` tags from that
  array instead of placeholder tiles.
- Optionally replace the SVG in `.story-art` (in `renderStory()`) with a real
  `<img>`.

## 4. Preview locally

Simplest option: just double-click `index.html` — it opens directly in your
browser (no server needed, no dependencies).

If you'd rather serve it (e.g. to test on your phone over the same Wi-Fi),
any static file server works. With Node.js installed:

```bash
npx serve .
```

Then open the printed local URL in your browser.

## 5. Deploy

This is a plain static site (no build step), so it deploys to any static
host:

**Vercel**
```bash
npm i -g vercel
vercel
```
When prompted, accept the defaults (Framework Preset: "Other", no build
command, output directory: root).

**Netlify / GitHub Pages** also work — just point them at this folder.

## Colors & fonts

The maroon & gold theme is defined as CSS variables at the top of
[`css/style.css`](css/style.css) (`--maroon-*`, `--gold-*`). Fonts are loaded
from Google Fonts in `index.html` (Playfair Display for headings, Great
Vibes for the script names, Poppins for body text).
