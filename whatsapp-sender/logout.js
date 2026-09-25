#!/usr/bin/env node
/**
 * Safely logs out the linked WhatsApp device: sends a real unlink signal to
 * WhatsApp (so it disappears from Settings > Linked Devices on its own),
 * then clears the local .wwebjs_auth session cache.
 *
 * Run:
 *   npm run logout
 */

const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 600000,
  },
});

client.on("auth_failure", (msg) => {
  console.error("Already logged out or no valid session found:", msg);
  process.exit(1);
});

client.on("ready", async () => {
  console.log("Logging out...");
  await client.logout();
  console.log("Logged out. The device has been removed from WhatsApp > Linked Devices.");
  process.exit(0);
});

client.initialize().catch((err) => {
  console.error("Could not start a session to log out (it may already be logged out):", err.message || err);
  console.error("If it's still showing as linked, remove it manually from your phone:");
  console.error("WhatsApp > Settings > Linked Devices > tap the device > Log Out.");
  process.exit(1);
});
