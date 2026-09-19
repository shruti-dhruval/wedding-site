#!/usr/bin/env node
/**
 * Sends every "pending" message queued in the MessageLog sheet (from the
 * admin panel's Messages tab) over WhatsApp Web, then marks each one
 * "sent" or "failed" back in the sheet.
 *
 * Setup:
 *   cd whatsapp-sender
 *   npm install
 *   cp config.example.json config.json   (Windows: copy config.example.json config.json)
 *   # then edit config.json with your Apps Script Web App URL + ADMIN_TOKEN
 *
 * Run:
 *   npm start            Sends all pending messages. First run shows a QR
 *                         code in this terminal — scan it with WhatsApp on
 *                         your phone (Settings > Linked Devices > Link a
 *                         Device). The session is cached in .wwebjs_auth/ so
 *                         you won't need to scan again on future runs.
 *   npm run dry-run       Prints what would be sent without sending or
 *                         touching WhatsApp at all. Good for a sanity check.
 *
 * Keep your laptop on, unlocked, and connected to the internet until it
 * finishes — this drives a real (headless) browser logged into WhatsApp Web,
 * it isn't a cloud service.
 */

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(
      "\nMissing config.json.\n" +
      "Run: copy config.example.json config.json   (or `cp` on macOS/Linux)\n" +
      "Then edit config.json with your Apps Script Web App URL and ADMIN_TOKEN.\n"
    );
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  if (!config.scriptUrl || config.scriptUrl.includes("PASTE_YOUR")) {
    console.error("\nconfig.json is missing a valid scriptUrl.\n");
    process.exit(1);
  }
  if (!config.adminToken || config.adminToken.includes("paste-the-same")) {
    console.error("\nconfig.json is missing a valid adminToken.\n");
    process.exit(1);
  }
  config.minDelayMs = config.minDelayMs || 4000;
  config.maxDelayMs = config.maxDelayMs || 9000;
  return config;
}

// Turns a phone number into the digits-only, country-coded form WhatsApp
// Web needs (e.g. "919898637980"). Numbers already typed with a country
// code (11+ digits) pass through as-is; a bare 10-digit number falls back
// to config.defaultCountryCode, since we can't otherwise tell +91 from +1.
function toWhatsAppId(phone, defaultCountryCode) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 && defaultCountryCode) {
    digits = defaultCountryCode + digits;
  } else if (digits.length === 11 && digits.charAt(0) === "0" && defaultCountryCode) {
    digits = defaultCountryCode + digits.slice(1);
  }
  return `${digits}@c.us`;
}

async function fetchPending(config) {
  const url = new URL(config.scriptUrl);
  url.searchParams.set("action", "pendingMessages");
  url.searchParams.set("token", config.adminToken);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== "ok") {
    throw new Error(data.message || "Failed to fetch pending messages — check your scriptUrl/adminToken.");
  }
  return data.messages || [];
}

async function markStatus(config, id, status, errorMessage) {
  const res = await fetch(config.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "markSent", token: config.adminToken, id, status, error: errorMessage || "" }),
  });
  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

async function main() {
  const config = loadConfig();
  const dryRun = process.argv.includes("--dry-run");

  console.log(dryRun ? "DRY RUN — nothing will actually be sent.\n" : "Live run — messages WILL be sent over WhatsApp.\n");

  const pending = await fetchPending(config);
  if (!pending.length) {
    console.log("No pending messages in the queue. Nothing to do.");
    return;
  }
  console.log(`Found ${pending.length} pending message(s).`);

  if (dryRun) {
    pending.forEach((m) => {
      console.log(`\n→ ${m.name} (${toWhatsAppId(m.phone, config.defaultCountryCode)}):\n${m.message}`);
    });
    console.log(`\nDry run complete. ${pending.length} message(s) would be sent.`);
    return;
  }

  // Only load whatsapp-web.js (and launch a browser) once we know we have
  // something to actually send.
  const { Client, LocalAuth } = require("whatsapp-web.js");
  const qrcode = require("qrcode-terminal");

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
    puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  });

  client.on("qr", (qr) => {
    console.log("\nScan this QR code with WhatsApp on your phone (Settings > Linked Devices > Link a Device):\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("auth_failure", (msg) => {
    console.error("WhatsApp authentication failed:", msg);
    process.exit(1);
  });

  client.on("ready", async () => {
    console.log("\nWhatsApp connected. Sending messages...\n");
    let sent = 0, failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const m = pending[i];
      const chatId = toWhatsAppId(m.phone, config.defaultCountryCode);
      try {
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) throw new Error("Number is not on WhatsApp.");

        await client.sendMessage(chatId, m.message);
        await markStatus(config, m.id, "sent");
        sent++;
        console.log(`[${i + 1}/${pending.length}] Sent to ${m.name} (${m.phone})`);
      } catch (err) {
        failed++;
        await markStatus(config, m.id, "failed", err.message || String(err));
        console.error(`[${i + 1}/${pending.length}] FAILED for ${m.name} (${m.phone}): ${err.message || err}`);
      }

      if (i < pending.length - 1) {
        const delay = randomDelay(config.minDelayMs, config.maxDelayMs);
        await sleep(delay);
      }
    }

    console.log(`\nDone. Sent ${sent}, failed ${failed}.`);
    await client.destroy();
    process.exit(0);
  });

  await client.initialize();
}

main().catch((err) => {
  console.error("\nFatal error:", err.message || err);
  process.exit(1);
});
