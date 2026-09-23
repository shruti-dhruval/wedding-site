# Shruti & Dhruval — Wedding RSVP Site

A single-page wedding site with an animated envelope intro, event schedule for
all five celebrations, photo gallery, and a phone-number-based RSVP system:
guests type their phone number, see their family's invitation pop up, and
mark which events they're attending. A separate admin panel manages the
guest list (uploaded from Excel), reviews RSVPs, and queues bulk WhatsApp
invite messages that a local script sends out.

## Structure

```
index.html                 Page markup (site) + admin.html (admin panel)
css/style.css               Styling (maroon & gold theme, envelope animation)
js/data.js                  Couple info, event details, story text — edit this to update content
js/icons.js                 Inline SVG icon set
js/main.js                  Envelope animation, countdown, rendering, RSVP + phone lookup
admin/admin.js, admin.css   Admin panel: guest upload, RSVP dashboard, message queue
apps-script/Code.gs          Google Apps Script backend (paste into your Google Sheet)
whatsapp-sender/             Local Node script that sends queued messages via WhatsApp Web
```

## 1. Set up the Google Sheet backend

1. Create a new Google Sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions > Apps Script**. Delete the placeholder code and paste
   in the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Set an admin token: click the gear icon (**Project Settings**) in the
   left sidebar, scroll to **Script Properties**, and add a property named
   `ADMIN_TOKEN` with a long random value you make up (e.g. a passphrase).
   This is what protects the admin panel and guest list — anyone with this
   token can read/edit your guest list, so keep it private the way you'd
   keep a password private.
4. Click **Deploy > New deployment**, choose type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the script with your Google account, and copy
   the **Web app URL**.
6. Open [`js/main.js`](js/main.js) and paste the URL into:
   ```js
   const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
7. Submit a test RSVP on the site, then check the Sheet — a new
   **RSVP Responses** tab should appear with your test entry.

Whenever you edit `apps-script/Code.gs` again later, go to **Deploy > Manage
deployments**, click the pencil icon on the existing deployment, and choose
**New version** — otherwise the live URL keeps running the old code.

The RSVP form posts with `mode: "no-cors"`, so the browser can't read the
script's response for that one call (this sidesteps Apps Script's CORS
limitations for guest-facing submissions). The site shows a success message
as soon as the request is sent without a network error — always verify
against the Sheet after your first real test. The admin panel and lookup
calls, unlike the RSVP submission, do read the response directly, relying on
Apps Script's normal CORS headers for GET/simple-POST requests — if you ever
see a CORS error in the browser console there, redeploy a new version as
described above.

If you ever change the event list in `js/data.js` (names, or add/remove an
event) **after** RSVPs have started coming in, the Sheet's header row won't
auto-update (it's only written once, on the first response). New event
columns will simply append to the row without a matching header — either
manually add the header cell, or clear the sheet before responses start.

## 2. Upload your guest list & manage RSVPs (admin panel)

Open `admin.html` (locally, or at `yoursite.com/admin.html` once deployed —
it's not linked from the main nav, but it isn't otherwise hidden, so treat
the URL itself as semi-private and rely on the admin token for real
protection).

1. On first visit, paste in your **Apps Script Web App URL** (same one from
   step 1) and your **Admin Token** (the `ADMIN_TOKEN` value you set). These
   are saved in your browser's local storage so you won't need to re-enter
   them each visit — click **Lock** to clear them on a shared computer.
2. **Guests tab** — upload an Excel or CSV file with your guest list. Any
   columns work; the panel tries to auto-detect which column is the phone
   number, first name, last name, spouse's name, children's names, and
   guest count, and shows dropdowns to fix the mapping if it guesses wrong.
   Preview the first 10 rows, then click **Upload** — guests are matched by
   phone number, so re-uploading the same file (or an updated version)
   safely updates existing rows instead of duplicating them.

   [`guest-list-template.csv`](guest-list-template.csv) is a starting point
   — open it in Excel (double-click, or File > Open), delete the two
   example rows, and fill in your own. A few notes:
   - **Phone Number** is the only required column — it's the key guests
     look themselves up with, so include the country code (`+91...`,
     `+1...`) to avoid ambiguity between numbers that happen to share
     their last 10 digits.
   - **Children Names** — list more than one child in the same cell,
     separated by commas (Excel will quote the cell for you automatically
     when you save).
   - **Side** is optional — leave it blank if unsure. The family label shown
     in messages and the admin dashboard is always auto-generated as
     `"<Last Name> Family"`.
   - Save as `.xlsx` or keep it as `.csv` — the upload accepts either.
3. **RSVPs tab** — see per-event headcounts and every response, plus a
   separate **Unregistered Walk-ins** table for phone numbers that RSVP'd
   but weren't on your uploaded guest list (they still get to RSVP, just
   land in their own section for you to review).
4. **Messages tab** — write your invite message once, using `{firstName}`,
   `{lastName}`, `{familyName}`, and `{link}` as placeholders, pick a site
   link, select recipients from the guest list (with quick filters for
   "not yet responded"), and click **Queue Messages**. This writes the
   personalized messages to the sheet's `MessageLog` tab — it does **not**
   send anything by itself. Actually sending is a separate, deliberate step:
   see below.

## 3. Send the WhatsApp invites

Queued messages sit in the sheet until you run the local sender script,
which logs into WhatsApp via a QR code scan (like WhatsApp Web) and sends
them from your own WhatsApp account. See
[`whatsapp-sender/README.md`](whatsapp-sender/README.md) for setup — in
short:

```bash
cd whatsapp-sender
npm install
copy config.example.json config.json   # then edit it with your URL + token
npm run dry-run                         # preview without sending
npm start                               # scan the QR code once, then sends
```

## 4. Edit content

All wedding details live in [`js/data.js`](js/data.js):

- `WEDDING` — couple names, parents, RSVP contact numbers, countdown target,
  family blessings text.
- `OUR_STORY` — heading + paragraphs (currently placeholder text — replace
  with your own).
- `EVENTS` — the five celebrations (Mehendi, Manglik Prasango, Musical Mehfil,
  Wedding, Reception), each with date, schedule, venue, and address.
  Map links and "Add to Calendar" links are generated automatically from this
  data.

## 5. Add photos later

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

## 6. Preview locally

Simplest option: just double-click `index.html` — it opens directly in your
browser (no server needed, no dependencies).

If you'd rather serve it (e.g. to test on your phone over the same Wi-Fi),
any static file server works. With Node.js installed:

```bash
npx serve .
```

Then open the printed local URL in your browser.

## 7. Deploy

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

`admin.html` deploys automatically along with everything else — it's just
another static page, protected only by the admin token gate, not by the
host. The `whatsapp-sender/` folder is never deployed; it only ever runs
locally on your own computer.

## Colors & fonts

The maroon & gold theme is defined as CSS variables at the top of
[`css/style.css`](css/style.css) (`--maroon-*`, `--gold-*`). Fonts are loaded
from Google Fonts in `index.html` (Playfair Display for headings, Great
Vibes for the script names, Poppins for body text).
