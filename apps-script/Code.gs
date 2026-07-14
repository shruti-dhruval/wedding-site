/**
 * Google Apps Script backend for the Shruti & Dhruval RSVP form.
 *
 * Setup:
 * 1. Create a new Google Sheet (this will store your RSVP responses).
 * 2. Extensions > Apps Script. Delete any starter code and paste this file's contents.
 * 3. Deploy > New deployment > Type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment's Web app URL.
 * 5. Paste that URL into GOOGLE_SCRIPT_URL in js/main.js.
 * 6. Submit a test RSVP on the site, then check this Sheet for a new
 *    "RSVP Responses" tab with the response.
 */

function doPost(e) {
  var sheet = getSheet_();
  var data = JSON.parse(e.postData.contents);
  var headers = ensureHeaders_(sheet, data);
  sheet.appendRow(buildRow_(headers, data));
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("Shruti & Dhruval RSVP endpoint is live.");
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("RSVP Responses");
  if (!sheet) sheet = ss.insertSheet("RSVP Responses");
  return sheet;
}

function baseHeaders_() {
  return ["Timestamp", "Side", "Guest Name", "Family/Group", "Email", "Phone", "Meal Preference", "Total Guests", "Message"];
}

// Bride-side and groom-side submissions carry different event lists (e.g.
// bride has Mehndi + Musical Mehfil, groom doesn't), so the header row is
// grown dynamically and every row is written by column NAME lookup rather
// than position — this keeps both sides' columns aligned correctly no
// matter which side's response happens to arrive first.
function ensureHeaders_(sheet, data) {
  var eventCols = [];
  (data.events || []).forEach(function (ev) {
    eventCols.push(ev.name + " - Attending");
    eventCols.push(ev.name + " - Guests");
  });

  if (sheet.getLastRow() === 0) {
    var headers = baseHeaders_().concat(eventCols);
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

function buildRow_(headers, data) {
  var values = {
    "Timestamp": new Date(),
    "Side": data.side === "groom" ? "Groom's Side" : "Bride's Side",
    "Guest Name": data.guestName || "",
    "Family/Group": data.familyName || "",
    "Email": data.email || "",
    "Phone": data.phone || "",
    "Meal Preference": data.mealPreference || "",
    "Total Guests": data.totalGuests || "",
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
