// ---------------------------------------------------------------------------
// Admin panel — talks to the same Apps Script web app as the main site
// (apps-script/Code.gs). Everything here requires the ADMIN_TOKEN you set in
// the script's Project Settings > Script Properties.
// ---------------------------------------------------------------------------

const STORAGE_URL_KEY = "wedding-admin-script-url";
const STORAGE_TOKEN_KEY = "wedding-admin-token";
const STORAGE_LINK_KEY = "wedding-admin-message-link";

let SCRIPT_URL = localStorage.getItem(STORAGE_URL_KEY) || "";
let ADMIN_TOKEN = localStorage.getItem(STORAGE_TOKEN_KEY) || "";

let guestsCache = [];
let rsvpsLoaded = false;
let messagesLoaded = false;
let mappedGuestRows = []; // full parsed+mapped rows from the last Excel upload

document.addEventListener("DOMContentLoaded", () => {
  initGate();
  initTabs();
  initGuestUpload();
  initGuestsTable();
  initRsvpsTab();
  initMessagesTab();

  if (SCRIPT_URL && ADMIN_TOKEN) {
    attemptUnlock(SCRIPT_URL, ADMIN_TOKEN).then((result) => {
      if (!result.ok) document.getElementById("admin-gate-error").textContent = result.message;
    });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCell(value) {
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleString();
  }
  return value == null ? "" : String(value);
}

async function apiGet(action, params) {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("token", ADMIN_TOKEN);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(action, data) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: ADMIN_TOKEN, ...data }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

function initGate() {
  const form = document.getElementById("admin-gate-form");
  const urlInput = document.getElementById("admin-script-url");
  const tokenInput = document.getElementById("admin-token-input");
  const error = document.getElementById("admin-gate-error");

  if (SCRIPT_URL) urlInput.value = SCRIPT_URL;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";
    const url = urlInput.value.trim();
    const token = tokenInput.value.trim();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking...";
    const result = await attemptUnlock(url, token);
    submitBtn.disabled = false;
    submitBtn.textContent = "Unlock Admin Panel";
    if (!result.ok) error.textContent = result.message;
  });

  document.getElementById("admin-lock-btn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    ADMIN_TOKEN = "";
    document.getElementById("admin-panel").hidden = true;
    document.getElementById("admin-gate").hidden = false;
    tokenInput.value = "";
    tokenInput.focus();
  });
}

// Returns { ok: boolean, message?: string } — message is only set on
// failure, and is the real underlying reason (network error, bad JSON,
// wrong token, etc.) so failures are actually debuggable instead of a
// generic "didn't work".
async function attemptUnlock(url, token) {
  if (!url || !token) return { ok: false, message: "Enter both the Web App URL and the admin token." };
  SCRIPT_URL = url;
  ADMIN_TOKEN = token;
  try {
    const res = await apiGet("guests");
    if (res.status !== "ok") {
      return { ok: false, message: res.message || "The script rejected the request (no error message given)." };
    }
    localStorage.setItem(STORAGE_URL_KEY, url);
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    document.getElementById("admin-gate").hidden = true;
    document.getElementById("admin-panel").hidden = false;
    guestsCache = res.guests || [];
    renderGuestsTable();
    return { ok: true };
  } catch (err) {
    console.error("Admin unlock failed:", err);
    return { ok: false, message: `Couldn't reach the script (${err.message || err}). Check the URL is correct and ends in /exec.` };
  }
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function initTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      panels.forEach((p) => p.classList.toggle("is-active", p.id === `tab-${name}`));

      if (name === "rsvps" && !rsvpsLoaded) loadRsvps();
      if (name === "messages") {
        if (!messagesLoaded) loadMessages();
        renderRecipientsTable();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Guests: Excel upload
// ---------------------------------------------------------------------------

const GUEST_FIELDS = [
  { key: "phone", label: "Phone Number", required: true, keywords: ["phone", "mobile", "contact", "cell", "whatsapp"] },
  { key: "firstName", label: "First Name", required: false, keywords: ["first name", "firstname", "given name", "first"] },
  { key: "lastName", label: "Last Name", required: false, keywords: ["last name", "lastname", "surname", "family name", "last"] },
  { key: "spouseName", label: "Spouse Name", required: false, keywords: ["spouse", "wife", "husband"] },
  { key: "childrenNames", label: "Children Names", required: false, keywords: ["children", "child", "kids"] },
  { key: "totalGuests", label: "Number of Guests", required: false, keywords: ["number of guest", "total guest", "party size", "headcount", "guest"] },
  { key: "side", label: "Side (bride/groom)", required: false, keywords: ["side"] },
];

// Columns are tracked by INDEX rather than header text, so blank or
// duplicate header cells (common in hand-edited Excel files) can't cause
// two fields to silently collide on the same mapped column.
let uploadHeaders = []; // header label per column index (may contain "")
let uploadRawRows = []; // array of row arrays, row[i] aligned to uploadHeaders[i]
let uploadMapping = {}; // field key -> column index, or -1 for "none"

function initGuestUpload() {
  const fileInput = document.getElementById("guest-file-input");
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (!raw.length) {
      alert("That file appears to be empty.");
      return;
    }

    uploadHeaders = raw[0].map((h) => String(h || "").trim());
    uploadRawRows = raw.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));

    uploadMapping = {};
    GUEST_FIELDS.forEach((f) => { uploadMapping[f.key] = guessColumn(uploadHeaders, f.keywords); });

    renderMappingUI();
    recomputeAndPreview();
  });
}

function guessColumn(headers, keywords) {
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

function renderMappingUI() {
  const wrap = document.getElementById("guest-mapping");
  wrap.innerHTML = GUEST_FIELDS.map((f) => `
    <div class="form-field">
      <label for="map-${f.key}">${f.label}${f.required ? " *" : ""}</label>
      <select id="map-${f.key}" data-field="${f.key}">
        <option value="-1">-- none --</option>
        ${uploadHeaders.map((h, i) => `<option value="${i}" ${uploadMapping[f.key] === i ? "selected" : ""}>${escapeHtml(h || `Column ${i + 1}`)}</option>`).join("")}
      </select>
    </div>
  `).join("");
  wrap.hidden = false;

  wrap.querySelectorAll("select").forEach((sel) => {
    sel.addEventListener("change", () => {
      uploadMapping[sel.dataset.field] = Number(sel.value);
      recomputeAndPreview();
    });
  });
}

function recomputeAndPreview() {
  mappedGuestRows = uploadRawRows.map((row) => {
    const mapped = {};
    GUEST_FIELDS.forEach((f) => {
      const idx = uploadMapping[f.key];
      mapped[f.key] = idx >= 0 ? String(row[idx] ?? "").trim() : "";
    });
    return mapped;
  }).filter((g) => g.phone);

  const previewWrap = document.getElementById("guest-preview-wrap");
  const table = document.getElementById("guest-preview-table");
  const missingPhoneCount = uploadRawRows.length - mappedGuestRows.length;

  if (uploadMapping.phone < 0) {
    table.innerHTML = `<tbody><tr class="admin-empty-row"><td>Select a Phone Number column above to preview.</td></tr></tbody>`;
    previewWrap.hidden = false;
    document.getElementById("guest-upload-btn").disabled = true;
    return;
  }

  const cols = GUEST_FIELDS.map((f) => f.label);
  const rowsToShow = mappedGuestRows.slice(0, 10);
  table.innerHTML = `
    <thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rowsToShow.map((g) => `<tr>${GUEST_FIELDS.map((f) => `<td>${escapeHtml(g[f.key])}</td>`).join("")}</tr>`).join("")}
    </tbody>
  `;
  previewWrap.hidden = false;
  document.getElementById("guest-upload-btn").disabled = mappedGuestRows.length === 0;

  const btn = document.getElementById("guest-upload-btn");
  btn.textContent = `Upload ${mappedGuestRows.length} Guest${mappedGuestRows.length === 1 ? "" : "s"} to Sheet`;
  document.getElementById("guest-upload-result").textContent =
    missingPhoneCount > 0 ? `Showing first 10 of ${mappedGuestRows.length} rows. ${missingPhoneCount} row(s) skipped — no phone number.` : `Showing first 10 of ${mappedGuestRows.length} rows.`;
  document.getElementById("guest-upload-result").className = "admin-inline-status";

  document.getElementById("guest-upload-btn").onclick = uploadMappedGuests;
}

async function uploadMappedGuests() {
  const btn = document.getElementById("guest-upload-btn");
  const resultEl = document.getElementById("guest-upload-result");
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Uploading...";
  try {
    const res = await apiPost("uploadGuests", { guests: mappedGuestRows });
    if (res.status === "ok") {
      resultEl.textContent = `Added ${res.added}, updated ${res.updated}${res.skipped ? `, skipped ${res.skipped}` : ""}.`;
      resultEl.className = "admin-inline-status success";
      await loadGuests();
    } else {
      resultEl.textContent = res.message || "Upload failed.";
      resultEl.className = "admin-inline-status error";
    }
  } catch (err) {
    resultEl.textContent = "Network error while uploading.";
    resultEl.className = "admin-inline-status error";
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ---------------------------------------------------------------------------
// Guests: table
// ---------------------------------------------------------------------------

function initGuestsTable() {
  document.getElementById("guest-refresh-btn").addEventListener("click", loadGuests);
  document.getElementById("guest-search").addEventListener("input", () => renderGuestsTable());
}

async function loadGuests() {
  const res = await apiGet("guests");
  if (res.status === "ok") {
    guestsCache = res.guests || [];
    renderGuestsTable();
  }
  return guestsCache;
}

function renderGuestsTable() {
  const table = document.getElementById("guests-table");
  const search = document.getElementById("guest-search").value.trim().toLowerCase();

  const rows = guestsCache.filter((g) => {
    if (!search) return true;
    const haystack = `${g.firstName} ${g.lastName} ${g.familyLabel} ${g.phone}`.toLowerCase();
    return haystack.includes(search);
  });

  document.getElementById("guest-count-badge").textContent = guestsCache.length;

  if (!rows.length) {
    table.innerHTML = `<tbody><tr class="admin-empty-row"><td>No guests uploaded yet.</td></tr></tbody>`;
    return;
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Phone</th><th>Name</th><th>Family</th><th>Spouse</th><th>Children</th>
        <th>Guests</th><th>Side</th><th>RSVP</th><th>Summary</th><th></th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((g) => `
        <tr>
          <td>${escapeHtml(g.phone)}</td>
          <td>${escapeHtml([g.firstName, g.lastName].filter(Boolean).join(" "))}</td>
          <td>${escapeHtml(g.familyLabel)}</td>
          <td>${escapeHtml(g.spouseName)}</td>
          <td>${escapeHtml(g.childrenNames)}</td>
          <td>${escapeHtml(g.totalGuests)}</td>
          <td>${escapeHtml(g.side)}</td>
          <td><span class="admin-status-pill ${g.rsvpStatus === "Responded" ? "responded" : "not-responded"}">${escapeHtml(g.rsvpStatus || "Not Responded")}</span></td>
          <td>${escapeHtml(g.rsvpSummary)}</td>
          <td><button class="admin-row-delete" data-phone="${escapeHtml(g.phone)}">Remove</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;

  table.querySelectorAll(".admin-row-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Remove ${btn.dataset.phone} from the guest list?`)) return;
      btn.disabled = true;
      await apiPost("deleteGuest", { phone: btn.dataset.phone });
      await loadGuests();
    });
  });
}

// ---------------------------------------------------------------------------
// RSVPs tab
// ---------------------------------------------------------------------------

function initRsvpsTab() {
  document.getElementById("rsvp-refresh-btn").addEventListener("click", loadRsvps);
}

async function loadRsvps() {
  rsvpsLoaded = true;
  const res = await apiGet("rsvps");
  if (res.status !== "ok") return;

  const rsvps = res.rsvps || [];
  const unregistered = res.unregistered || [];

  document.getElementById("rsvp-count-badge").textContent = rsvps.length;
  document.getElementById("unreg-count-badge").textContent = unregistered.length;

  renderRsvpSummary(rsvps.concat(unregistered));
  renderDynamicTable(document.getElementById("rsvps-table"), rsvps);
  renderDynamicTable(document.getElementById("unregistered-table"), unregistered);
}

function renderRsvpSummary(allRows) {
  const eventTotals = {}; // eventName -> { attending: 0, guests: 0 }
  allRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const m = key.match(/^(.*) - Attending$/);
      if (!m) return;
      const eventName = m[1];
      if (!eventTotals[eventName]) eventTotals[eventName] = { attending: 0, guests: 0 };
      if (row[key] === "Yes") {
        eventTotals[eventName].attending += 1;
        eventTotals[eventName].guests += parseInt(row[`${eventName} - Guests`], 10) || 0;
      }
    });
  });

  const cardsEl = document.getElementById("rsvp-summary-cards");
  const cards = [`
    <div class="admin-summary-card"><span class="num">${allRows.length}</span><span class="label">Responses</span></div>
  `];
  Object.entries(eventTotals).forEach(([name, totals]) => {
    cards.push(`
      <div class="admin-summary-card"><span class="num">${totals.guests}</span><span class="label">${escapeHtml(name)}</span></div>
    `);
  });
  cardsEl.innerHTML = cards.join("");
}

function renderDynamicTable(tableEl, rows) {
  if (!rows.length) {
    tableEl.innerHTML = `<tbody><tr class="admin-empty-row"><td>No data yet.</td></tr></tbody>`;
    return;
  }
  const columns = Object.keys(rows[0]);
  tableEl.innerHTML = `
    <thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(formatCell(row[c]))}</td>`).join("")}</tr>`).join("")}
    </tbody>
  `;
}

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

function initMessagesTab() {
  const linkInput = document.getElementById("message-link");
  linkInput.value = localStorage.getItem(STORAGE_LINK_KEY) || "";
  linkInput.addEventListener("input", () => {
    localStorage.setItem(STORAGE_LINK_KEY, linkInput.value.trim());
    updateMessagePreview();
  });
  document.getElementById("message-template").addEventListener("input", updateMessagePreview);

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => applyRecipientFilter(btn.dataset.filter));
  });
  document.getElementById("recipients-refresh-btn").addEventListener("click", async () => {
    await loadGuests();
    renderRecipientsTable();
  });
  document.getElementById("queue-messages-btn").addEventListener("click", queueSelectedMessages);
  document.getElementById("log-refresh-btn").addEventListener("click", loadMessages);
}

function applyTemplate(template, guest) {
  const link = document.getElementById("message-link").value.trim();
  const familyLabel = guest.familyLabel || (guest.lastName ? `${guest.lastName} Family` : "");
  return template
    .replace(/\{firstName\}/g, guest.firstName || "")
    .replace(/\{lastName\}/g, guest.lastName || "")
    .replace(/\{familyName\}/g, familyLabel)
    .replace(/\{link\}/g, link);
}

function updateMessagePreview() {
  const template = document.getElementById("message-template").value;
  const preview = document.getElementById("message-preview");
  if (!template.trim()) { preview.textContent = ""; return; }

  const sampleGuest = getCheckedRecipients()[0] || guestsCache[0] || {
    firstName: "Guest", lastName: "Name", familyLabel: "The Family",
  };
  preview.textContent = applyTemplate(template, sampleGuest);
}

function renderRecipientsTable() {
  const table = document.getElementById("recipients-table");
  if (!guestsCache.length) {
    table.innerHTML = `<tbody><tr class="admin-empty-row"><td>No guests uploaded yet — upload a guest list first.</td></tr></tbody>`;
    document.getElementById("recipient-count-badge").textContent = "0";
    return;
  }

  table.innerHTML = `
    <thead><tr><th></th><th>Name</th><th>Phone</th><th>Family</th><th>RSVP</th></tr></thead>
    <tbody>
      ${guestsCache.map((g, i) => `
        <tr>
          <td><input type="checkbox" class="recipients-table-checkbox" data-index="${i}" /></td>
          <td>${escapeHtml([g.firstName, g.lastName].filter(Boolean).join(" "))}</td>
          <td>${escapeHtml(g.phone)}</td>
          <td>${escapeHtml(g.familyLabel)}</td>
          <td><span class="admin-status-pill ${g.rsvpStatus === "Responded" ? "responded" : "not-responded"}">${escapeHtml(g.rsvpStatus || "Not Responded")}</span></td>
        </tr>
      `).join("")}
    </tbody>
  `;

  table.querySelectorAll(".recipients-table-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => { updateRecipientCount(); updateMessagePreview(); });
  });
  updateRecipientCount();
}

function getCheckedRecipients() {
  const checked = Array.from(document.querySelectorAll(".recipients-table-checkbox:checked"));
  return checked.map((cb) => guestsCache[Number(cb.dataset.index)]);
}

function updateRecipientCount() {
  document.getElementById("recipient-count-badge").textContent = getCheckedRecipients().length;
}

function applyRecipientFilter(filter) {
  document.querySelectorAll(".recipients-table-checkbox").forEach((cb) => {
    const guest = guestsCache[Number(cb.dataset.index)];
    if (filter === "all") cb.checked = true;
    else if (filter === "none") cb.checked = false;
    else if (filter === "not-responded") cb.checked = (guest.rsvpStatus || "Not Responded") !== "Responded";
    else if (filter === "responded") cb.checked = guest.rsvpStatus === "Responded";
  });
  updateRecipientCount();
  updateMessagePreview();
}

async function queueSelectedMessages() {
  const template = document.getElementById("message-template").value.trim();
  const resultEl = document.getElementById("queue-result");
  const recipients = getCheckedRecipients();

  if (!template) { resultEl.textContent = "Write a message first."; resultEl.className = "admin-inline-status error"; return; }
  if (!recipients.length) { resultEl.textContent = "Select at least one recipient."; resultEl.className = "admin-inline-status error"; return; }
  if (!recipients.every((r) => r.phone)) { resultEl.textContent = "Some selected recipients have no phone number."; resultEl.className = "admin-inline-status error"; return; }

  if (!confirm(`Queue this message for ${recipients.length} recipient(s)? This doesn't send anything yet — you'll still need to run whatsapp-sender to actually send.`)) return;

  const btn = document.getElementById("queue-messages-btn");
  btn.disabled = true;
  btn.textContent = "Queuing...";
  try {
    const payload = recipients.map((g) => ({
      phone: g.phone,
      name: [g.firstName, g.lastName].filter(Boolean).join(" ") || g.phone,
      message: applyTemplate(template, g),
    }));
    const res = await apiPost("queueMessages", { recipients: payload });
    if (res.status === "ok") {
      resultEl.textContent = `Queued ${res.queued} message(s). Run whatsapp-sender to send them.`;
      resultEl.className = "admin-inline-status success";
      await loadMessages();
    } else {
      resultEl.textContent = res.message || "Failed to queue messages.";
      resultEl.className = "admin-inline-status error";
    }
  } catch (err) {
    resultEl.textContent = "Network error while queuing messages.";
    resultEl.className = "admin-inline-status error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Queue Messages for Selected Recipients";
  }
}

async function loadMessages() {
  messagesLoaded = true;
  const res = await apiGet("messages");
  if (res.status !== "ok") return;
  const messages = res.messages || [];

  const counts = { pending: 0, sent: 0, failed: 0 };
  messages.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });

  document.getElementById("message-summary-cards").innerHTML = `
    <div class="admin-summary-card"><span class="num">${messages.length}</span><span class="label">Total</span></div>
    <div class="admin-summary-card"><span class="num">${counts.pending || 0}</span><span class="label">Pending</span></div>
    <div class="admin-summary-card"><span class="num">${counts.sent || 0}</span><span class="label">Sent</span></div>
    <div class="admin-summary-card"><span class="num">${counts.failed || 0}</span><span class="label">Failed</span></div>
  `;

  const table = document.getElementById("message-log-table");
  if (!messages.length) {
    table.innerHTML = `<tbody><tr class="admin-empty-row"><td>No messages queued yet.</td></tr></tbody>`;
    return;
  }
  const sorted = messages.slice().reverse();
  table.innerHTML = `
    <thead><tr><th>Phone</th><th>Name</th><th>Message</th><th>Status</th><th>Queued</th><th>Sent</th><th>Error</th></tr></thead>
    <tbody>
      ${sorted.map((m) => `
        <tr>
          <td>${escapeHtml(m.phone)}</td>
          <td>${escapeHtml(m.name)}</td>
          <td title="${escapeHtml(m.message)}">${escapeHtml(String(m.message || "").slice(0, 60))}${String(m.message || "").length > 60 ? "…" : ""}</td>
          <td><span class="admin-status-pill ${escapeHtml(m.status)}">${escapeHtml(m.status)}</span></td>
          <td>${escapeHtml(formatCell(m.queuedAt))}</td>
          <td>${escapeHtml(formatCell(m.sentAt))}</td>
          <td>${escapeHtml(m.error)}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}
