/**
 * Google Apps Script backend for the Shruti & Dhruval wedding site.
 *
 * Handles:
 *  - Guest list storage (uploaded from Excel via the admin panel)
 *  - Phone-number lookup so a guest's family pops up on the RSVP form
 *  - RSVP submissions (matched guests + unregistered walk-ins)
 *  - A WhatsApp message queue that the local whatsapp-sender script sends
 *
 * Setup:
 * 1. Create a new Google Sheet (or reuse your existing RSVP one).
 * 2. Extensions > Apps Script. Delete any starter code and paste this file's contents.
 * 3. Project Settings (gear icon) > Script Properties > Add property:
 *      Name:  ADMIN_TOKEN
 *      Value: <a long random passphrase you make up>
 *    This token gates every admin/mutating action. Keep it secret — it's the
 *    only thing standing between a stranger and your guest list.
 * 4. Deploy > New deployment > Type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment's Web app URL.
 * 6. Paste that URL into GOOGLE_SCRIPT_URL in js/main.js AND admin/admin.js
 *    AND whatsapp-sender/config.json.
 * 7. Whenever you edit this file again, use Deploy > Manage deployments >
 *    edit (pencil) > New version, otherwise the live URL keeps running the
 *    old code.
 */

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doGet(e) {
  var action = (e.parameter.action || "").toLowerCase();

  if (action === "lookup") {
    return jsonOut_(lookupGuest_(e.parameter.phone || ""));
  }
  if (action === "guests") {
    if (!isAuthorized_(e.parameter.token)) return jsonOut_(unauthorized_());
    return jsonOut_({ status: "ok", guests: listGuests_() });
  }
  if (action === "rsvps") {
    if (!isAuthorized_(e.parameter.token)) return jsonOut_(unauthorized_());
    return jsonOut_({ status: "ok", rsvps: listRsvps_(), unregistered: listUnregistered_() });
  }
  if (action === "messages") {
    if (!isAuthorized_(e.parameter.token)) return jsonOut_(unauthorized_());
    return jsonOut_({ status: "ok", messages: listMessages_() });
  }
  if (action === "pendingmessages") {
    if (!isAuthorized_(e.parameter.token)) return jsonOut_(unauthorized_());
    return jsonOut_({ status: "ok", messages: listMessages_().filter(function (m) { return m.status === "pending"; }) });
  }

  return ContentService.createTextOutput("Shruti & Dhruval wedding site endpoint is live.");
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ status: "error", message: "Invalid JSON body." });
  }

  var action = (data.action || "rsvp").toLowerCase();

  if (action === "rsvp") {
    return jsonOut_(submitRsvp_(data));
  }
  if (action === "uploadguests") {
    if (!isAuthorized_(data.token)) return jsonOut_(unauthorized_());
    return jsonOut_(uploadGuests_(data.guests || []));
  }
  if (action === "queuemessages") {
    if (!isAuthorized_(data.token)) return jsonOut_(unauthorized_());
    return jsonOut_(queueMessages_(data.recipients || []));
  }
  if (action === "marksent") {
    if (!isAuthorized_(data.token)) return jsonOut_(unauthorized_());
    return jsonOut_(markMessageStatus_(data.id, data.status || "sent", data.error || ""));
  }
  if (action === "deleteguest") {
    if (!isAuthorized_(data.token)) return jsonOut_(unauthorized_());
    return jsonOut_(deleteGuest_(data.phone || ""));
  }

  return jsonOut_({ status: "error", message: "Unknown action: " + action });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function unauthorized_() {
  return { status: "error", message: "Unauthorized. Missing or incorrect admin token." };
}

function isAuthorized_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
  return !!expected && !!token && token === expected;
}

// ---------------------------------------------------------------------------
// Phone normalization — matches loosely so guests can type their number any
// way they like (spaces, dashes, +, leading 0, with/without country code).
// We match on the last 10 digits.
// ---------------------------------------------------------------------------

function normalizePhone_(phone) {
  var digits = String(phone || "").replace(/\D/g, "");
  // Drop a leading trunk "0" some local formats use before the 10-digit number.
  if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.substring(1);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  var sheet = ss_().getSheetByName(name);
  if (!sheet) {
    sheet = ss_().insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// IMPORTANT: several functions below (submitRsvp_, uploadGuests_) write to
// specific column NUMBERS in the Guests sheet, not column names — they
// assume this exact header order. If you manually reorder or insert columns
// in the "Guests" tab in Google Sheets, those writes will land in the wrong
// column. Safe to rename headers' text, not their left-to-right order.
var GUESTS_HEADERS = [
  "Phone", "First Name", "Last Name", "Spouse Name", "Children Names",
  "Total Guests", "Side", "Family Label", "RSVP Status", "RSVP Summary", "Last RSVP At"
];

function getGuestsSheet_() {
  return getOrCreateSheet_("Guests", GUESTS_HEADERS);
}

// Same column-order caveat as GUESTS_HEADERS above — markMessageStatus_
// writes to fixed column numbers in this sheet.
var MESSAGELOG_HEADERS = ["ID", "Phone", "Name", "Message", "Status", "Queued At", "Sent At", "Error"];

function getMessageLogSheet_() {
  return getOrCreateSheet_("MessageLog", MESSAGELOG_HEADERS);
}

function getUnregisteredSheet_(data) {
  var eventCols = [];
  (data.events || []).forEach(function (ev) {
    eventCols.push(ev.name + " - Attending");
    eventCols.push(ev.name + " - Guests");
  });
  var sheet = ss_().getSheetByName("Unregistered RSVPs");
  if (!sheet) {
    var headers = ["Timestamp", "Side", "Guest Name", "Email", "Phone", "Meal Preference", "Message"].concat(eventCols);
    sheet = ss_().insertSheet("Unregistered RSVPs");
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return sheet;
  }
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = eventCols.filter(function (c) { return headers.indexOf(c) === -1; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, 1, 1, headers.length + missing.length).setFontWeight("bold");
  }
  return sheet;
}

// ---------------------------------------------------------------------------
// Guests: read
// ---------------------------------------------------------------------------

function guestsAsObjects_() {
  var sheet = getGuestsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map(function (row, i) {
    var obj = {};
    headers.forEach(function (h, j) { obj[h] = row[j]; });
    obj._row = i + 2; // 1-indexed sheet row, for updates
    return obj;
  });
}

function lookupGuest_(phoneRaw) {
  var norm = normalizePhone_(phoneRaw);
  if (!norm) return { found: false, message: "Please enter a valid phone number." };

  var guests = guestsAsObjects_();
  var match = guests.find(function (g) { return normalizePhone_(g["Phone"]) === norm; });
  if (!match) return { found: false };

  var children = String(match["Children Names"] || "")
    .split(",")
    .map(function (c) { return c.trim(); })
    .filter(Boolean);

  return {
    found: true,
    phone: String(match["Phone"] || ""),
    firstName: match["First Name"] || "",
    lastName: match["Last Name"] || "",
    spouseName: match["Spouse Name"] || "",
    children: children,
    totalGuests: match["Total Guests"] || "",
    side: match["Side"] || "",
    familyLabel: match["Family Label"] || (String(match["Last Name"] || "").trim() ? (match["Last Name"] + " Family") : ""),
    rsvpStatus: match["RSVP Status"] || "Not Responded",
    rsvpSummary: match["RSVP Summary"] || "",
  };
}

function listGuests_() {
  return guestsAsObjects_().map(function (g) {
    return {
      phone: g["Phone"], firstName: g["First Name"], lastName: g["Last Name"],
      spouseName: g["Spouse Name"], childrenNames: g["Children Names"],
      totalGuests: g["Total Guests"], side: g["Side"], familyLabel: g["Family Label"],
      rsvpStatus: g["RSVP Status"], rsvpSummary: g["RSVP Summary"], lastRsvpAt: g["Last RSVP At"],
    };
  });
}

// ---------------------------------------------------------------------------
// Guests: upload (upsert by phone) from the admin panel's Excel import
// ---------------------------------------------------------------------------

function uploadGuests_(guests) {
  if (!guests.length) return { status: "error", message: "No guest rows received." };

  var sheet = getGuestsSheet_();
  var existing = guestsAsObjects_();
  var byPhone = {};
  existing.forEach(function (g) { byPhone[normalizePhone_(g["Phone"])] = g; });

  var added = 0, updated = 0, skipped = 0;

  guests.forEach(function (g) {
    var norm = normalizePhone_(g.phone);
    if (!norm) { skipped++; return; }

    var familyLabel = g.familyLabel || (g.lastName ? (g.lastName + " Family") : "");
    var rowValues = [
      g.phone, g.firstName || "", g.lastName || "", g.spouseName || "",
      g.childrenNames || "", g.totalGuests || "", g.side || "", familyLabel,
      "Not Responded", "", "",
    ];

    var match = byPhone[norm];
    if (match) {
      // Preserve existing RSVP status columns on update.
      rowValues[8] = match["RSVP Status"] || "Not Responded";
      rowValues[9] = match["RSVP Summary"] || "";
      rowValues[10] = match["Last RSVP At"] || "";
      sheet.getRange(match._row, 1, 1, GUESTS_HEADERS.length).setValues([rowValues]);
      updated++;
    } else {
      sheet.appendRow(rowValues);
      added++;
    }
  });

  return { status: "ok", added: added, updated: updated, skipped: skipped };
}

function deleteGuest_(phone) {
  var norm = normalizePhone_(phone);
  if (!norm) return { status: "error", message: "No phone given." };
  var sheet = getGuestsSheet_();
  var existing = guestsAsObjects_();
  var match = existing.find(function (g) { return normalizePhone_(g["Phone"]) === norm; });
  if (!match) return { status: "error", message: "Guest not found." };
  sheet.deleteRow(match._row);
  return { status: "ok" };
}

// ---------------------------------------------------------------------------
// RSVP submission
// ---------------------------------------------------------------------------

function baseRsvpHeaders_() {
  return ["Timestamp", "Side", "Guest Name", "Family/Group", "Email", "Phone", "Meal Preference", "Message"];
}

function getRsvpSheet_() {
  var sheet = ss_().getSheetByName("RSVP Responses");
  if (!sheet) sheet = ss_().insertSheet("RSVP Responses");
  return sheet;
}

function ensureRsvpHeaders_(sheet, data) {
  var eventCols = [];
  (data.events || []).forEach(function (ev) {
    eventCols.push(ev.name + " - Attending");
    eventCols.push(ev.name + " - Guests");
  });

  if (sheet.getLastRow() === 0) {
    var headers = baseRsvpHeaders_().concat(eventCols);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return headers;
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = eventCols.filter(function (c) { return headers.indexOf(c) === -1; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, 1, 1, headers.length + missing.length).setFontWeight("bold");
    headers = headers.concat(missing);
  }
  return headers;
}

function buildRsvpRow_(headers, data, familyLabel) {
  var values = {
    "Timestamp": new Date(),
    "Side": data.side === "groom" ? "Groom's Side" : "Bride's Side",
    "Guest Name": data.guestName || "",
    "Family/Group": familyLabel || data.familyName || "",
    "Email": data.email || "",
    "Phone": data.phone || "",
    "Meal Preference": data.mealPreference || "",
    "Message": data.message || "",
  };
  (data.events || []).forEach(function (ev) {
    values[ev.name + " - Attending"] = ev.attending ? "Yes" : "No";
    values[ev.name + " - Guests"] = ev.attending ? (ev.guests || "") : "";
  });
  return headers.map(function (h) {
    return values.hasOwnProperty(h) ? values[h] : "";
  });
}

function submitRsvp_(data) {
  var norm = normalizePhone_(data.phone);
  var guests = norm ? guestsAsObjects_() : [];
  var match = norm ? guests.find(function (g) { return normalizePhone_(g["Phone"]) === norm; }) : null;

  var attendingSummary = (data.events || [])
    .filter(function (ev) { return ev.attending; })
    .map(function (ev) { return ev.name + " (" + (ev.guests || 1) + ")"; })
    .join(", ") || "Not attending any events";

  if (match) {
    var rsvpSheet = getRsvpSheet_();
    var headers = ensureRsvpHeaders_(rsvpSheet, data);
    rsvpSheet.appendRow(buildRsvpRow_(headers, data, match["Family Label"]));

    var guestsSheet = getGuestsSheet_();
    guestsSheet.getRange(match._row, 9).setValue("Responded"); // RSVP Status
    guestsSheet.getRange(match._row, 10).setValue(attendingSummary); // RSVP Summary
    guestsSheet.getRange(match._row, 11).setValue(new Date()); // Last RSVP At

    return { status: "ok", matched: true };
  }

  var unregSheet = getUnregisteredSheet_(data);
  var unregHeaders = unregSheet.getRange(1, 1, 1, unregSheet.getLastColumn()).getValues()[0];
  var values = {
    "Timestamp": new Date(),
    "Side": data.side === "groom" ? "Groom's Side" : "Bride's Side",
    "Guest Name": data.guestName || "",
    "Email": data.email || "",
    "Phone": data.phone || "",
    "Meal Preference": data.mealPreference || "",
    "Message": data.message || "",
  };
  (data.events || []).forEach(function (ev) {
    values[ev.name + " - Attending"] = ev.attending ? "Yes" : "No";
    values[ev.name + " - Guests"] = ev.attending ? (ev.guests || "") : "";
  });
  unregSheet.appendRow(unregHeaders.map(function (h) { return values.hasOwnProperty(h) ? values[h] : ""; }));

  return { status: "ok", matched: false };
}

function listRsvps_() {
  var sheet = getRsvpSheet_();
  return sheetToObjects_(sheet);
}

function listUnregistered_() {
  var sheet = ss_().getSheetByName("Unregistered RSVPs");
  if (!sheet) return [];
  return sheetToObjects_(sheet);
}

function sheetToObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map(function (row) {
    var obj = {};
    headers.forEach(function (h, j) { obj[h] = row[j]; });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// WhatsApp message queue — the admin panel writes "pending" rows here, and
// the local whatsapp-sender Node script reads + sends + marks them "sent".
// ---------------------------------------------------------------------------

function queueMessages_(recipients) {
  if (!recipients.length) return { status: "error", message: "No recipients given." };
  var sheet = getMessageLogSheet_();
  var now = new Date();
  var rows = recipients.map(function (r) {
    var id = Utilities.getUuid();
    return [id, r.phone || "", r.name || "", r.message || "", "pending", now, "", ""];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, MESSAGELOG_HEADERS.length).setValues(rows);
  return { status: "ok", queued: rows.length };
}

function listMessages_() {
  var sheet = getMessageLogSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, MESSAGELOG_HEADERS.length).getValues();
  return rows.map(function (row, i) {
    return {
      id: row[0], phone: row[1], name: row[2], message: row[3],
      status: row[4], queuedAt: row[5], sentAt: row[6], error: row[7],
      _row: i + 2,
    };
  });
}

function markMessageStatus_(id, status, error) {
  if (!id) return { status: "error", message: "No message id given." };
  var messages = listMessages_();
  var match = messages.find(function (m) { return m.id === id; });
  if (!match) return { status: "error", message: "Message id not found." };
  var sheet = getMessageLogSheet_();
  sheet.getRange(match._row, 5).setValue(status); // Status
  if (status === "sent") sheet.getRange(match._row, 7).setValue(new Date()); // Sent At
  if (error) sheet.getRange(match._row, 8).setValue(error); // Error
  return { status: "ok" };
}
