# WhatsApp Sender

A small local script that sends the bulk WhatsApp messages you queue from
the admin panel's **Messages** tab. It runs on your own computer (not
hosted anywhere) and logs into WhatsApp the same way WhatsApp Web does — by
scanning a QR code with your phone.

It does **not** talk to the admin panel directly. Both sides talk through
the same Google Sheet: the admin panel writes rows with status `pending` to
the `MessageLog` tab, and this script reads those rows, sends them, and
marks each one `sent` or `failed`.

## Setup (one-time)

1. Install [Node.js](https://nodejs.org) 18 or later if you don't have it.
2. Open a terminal in this folder and install dependencies:
   ```
   cd whatsapp-sender
   npm install
   ```
3. Copy the example config and fill it in:
   ```
   copy config.example.json config.json
   ```
   (On macOS/Linux: `cp config.example.json config.json`)
4. Edit `config.json`:
   - `scriptUrl` — the same Apps Script Web App URL used in `js/main.js` and
     the admin panel.
   - `adminToken` — the same `ADMIN_TOKEN` value you set in the Apps
     Script project's Script Properties.
   - `minDelayMs` / `maxDelayMs` — random delay range between messages, in
     milliseconds. Defaults (4–9 seconds) are a reasonable, human-ish pace;
     don't set this too low — sending too fast is the main way WhatsApp
     numbers get temporarily restricted.
   - `defaultCountryCode` — only used as a fallback when a guest's phone
     number in your Excel sheet has no country code (exactly 10 digits).
     Set it to `"91"` for India, `"1"` for the US, etc. Numbers already
     entered with a country code (e.g. `+919898637980`) are unaffected.

`config.json` is gitignored — it holds a secret token, never commit it.

## Usage

**Preview first, without sending anything:**
```
npm run dry-run
```
This prints every pending message and who it would go to, with no
WhatsApp connection at all. Always do this once before a real send.

**Send for real:**
```
npm start
```
The first time, a QR code appears in the terminal. Open WhatsApp on your
phone → **Settings → Linked Devices → Link a Device**, and scan it. Keep
your phone connected to the internet. Your session is then cached in
`.wwebjs_auth/` (gitignored) so you won't need to scan again next time,
unless you log out from your phone or delete that folder.

The script then sends every message currently marked `pending` in the
sheet, waiting a randomized delay between each one, and prints progress as
it goes. Leave your computer on and connected until it finishes — it's
driving a real (headless) browser session, not a hosted service.

You can safely re-run `npm start` any time — it only ever sends messages
still marked `pending`, so it won't double-send anything the admin panel
has already queued once it's marked `sent`.

## PDF Invitations

Each invite code (e.g. `MILAN`, `LOVE`, `SD`) can have a matching PDF
invitation that gets sent as a WhatsApp document alongside the text
message.

**Setup:**
1. Place your PDFs in the `pdfs/` folder, named exactly after the invite
   code in uppercase:
   ```
   pdfs/MILAN.pdf
   pdfs/LOVE.pdf
   pdfs/DIL.pdf
   pdfs/SD.pdf
   pdfs/ONE.pdf
   pdfs/MIL.pdf
   pdfs/OM.pdf
   pdfs/DHRUSHRU.pdf
   ```
2. The invite code comes from the **Family Label** column in your guest
   list Excel sheet — the admin panel stores it alongside each queued
   message automatically.

**How it works:**
- When a message is sent, the script looks up the recipient's invite code
  (Family Label) and checks for a matching `pdfs/<CODE>.pdf`.
- If found, the PDF is sent as a document with a **personalized filename**:
  `Firstname_Lastname_Invitation.pdf` (e.g. `Bharat_Patel_Invitation.pdf`).
- If no matching PDF exists, the text message is still sent — just without
  an attachment. A warning is logged so you can add the missing PDF and
  re-queue if needed.
- `npm run dry-run` shows which PDF would be attached for each recipient.

## A few honest caveats

- This uses [whatsapp-web.js](https://wwebjs.dev/), an **unofficial**
  library that automates the WhatsApp Web interface. It is not WhatsApp's
  official Business API. It's widely used for exactly this kind of
  personal/event use case, but WhatsApp's terms of service don't sanction
  third-party automation, and in rare cases an account sending a lot of
  messages quickly can get temporarily rate-limited. Sending a few hundred
  messages at a human-ish pace (the defaults above) to guests who mostly
  already have your number saved is low-risk, but it is not zero-risk —
  use an account you're comfortable with.
- If a guest's number isn't a real WhatsApp account (typo in the Excel
  sheet, landline, etc.), that row is marked `failed` with a reason instead
  of stopping the whole run — check the **Message Log** in the admin panel
  afterward for any failures and fix/re-queue them.
- If you re-scan the QR code on a new computer or after logging out, that's
  a completely normal new login — nothing else needs to change.
