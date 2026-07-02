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
  ensureHeader_(sheet, data);
  sheet.appendRow(buildRow_(data));
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
  return ["Timestamp", "Guest Name", "Family/Group", "Email", "Phone", "Meal Preference", "Total Guests", "Message"];
}

function ensureHeader_(sheet, data) {
  if (sheet.getLastRow() > 0) return;
  var headers = baseHeaders_();
  (data.events || []).forEach(function (ev) {
    headers.push(ev.name + " - Attending");
    headers.push(ev.name + " - Guests");
  });
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function buildRow_(data) {
  var row = [
    new Date(),
    data.guestName || "",
    data.familyName || "",
    data.email || "",
    data.phone || "",
    data.mealPreference || "",
    data.totalGuests || "",
    data.message || "",
  ];
  (data.events || []).forEach(function (ev) {
    row.push(ev.attending ? "Yes" : "No");
    row.push(ev.attending ? ev.guests || "" : "");
  });
  return row;
}
