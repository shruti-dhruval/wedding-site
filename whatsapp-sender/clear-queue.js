#!/usr/bin/env node
/**
 * Clears/cancels all pending WhatsApp messages from the Google Sheet queue
 * by marking their status as "cancelled".
 *
 * Run:
 *   npm run clear-queue
 */

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

if (!fs.existsSync(CONFIG_PATH)) {
  console.error("Missing config.json");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

async function clearQueue() {
  const url = new URL(config.scriptUrl);
  url.searchParams.set("action", "pendingMessages");
  url.searchParams.set("token", config.adminToken);

  console.log("Fetching pending messages...");
  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "ok") {
    console.error("Failed to fetch pending messages:", data.message);
    process.exit(1);
  }

  const messages = data.messages || [];
  if (messages.length === 0) {
    console.log("No pending messages found in queue. Queue is already empty.");
    return;
  }

  console.log(`Found ${messages.length} pending message(s). Cancelling...`);

  let count = 0;
  for (const m of messages) {
    const postRes = await fetch(config.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "markSent",
        token: config.adminToken,
        id: m.id,
        status: "cancelled",
        error: "Cleared from queue",
      }),
    });
    const result = await postRes.json();
    if (result.status === "ok") {
      count++;
      console.log(`[${count}/${messages.length}] Cancelled message for ${m.name || m.phone} (${m.id})`);
    } else {
      console.warn(`Failed to cancel message ${m.id}:`, result.message);
    }
  }

  console.log(`\nDone! Successfully cleared ${count} message(s) from the pending queue.`);
}

clearQueue().catch((err) => {
  console.error("Error clearing queue:", err);
  process.exit(1);
});
