// ---------------------------------------------------------------------------
// Shruti & Dhruval — Wedding site behavior
// ---------------------------------------------------------------------------

// EDIT ME: paste your deployed Google Apps Script Web App URL here.
// See apps-script/Code.gs and README.md for setup instructions.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxV4StTA_P1TAEQInAIv0uym-jkHKVe6fe1UrFEIJPfJhZbzy5bg4JxL9mjNuP8fVpO6A/exec";

// Which household's events/contacts to show, and which events they're
// invited to — resolved from the invite code entered at the gate.
let CURRENT_CODE = null;
let CURRENT_SIDE = null;
let CURRENT_EVENT_IDS = null;
let EVENTS = null;

const CODE_STORAGE_KEY = "wedding-code";

document.addEventListener("DOMContentLoaded", () => {
  const storedCode = localStorage.getItem(CODE_STORAGE_KEY);
  const entry = storedCode && INVITE_CODES[storedCode];
  if (entry) {
    CURRENT_CODE = storedCode;
    CURRENT_SIDE = entry.side;
    CURRENT_EVENT_IDS = entry.events;
    startSite();
  } else {
    if (storedCode) localStorage.removeItem(CODE_STORAGE_KEY);
    initSideGate();
  }
});

function initSideGate() {
  const gate = document.getElementById("gate-screen");
  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-password");
  const error = document.getElementById("gate-error");

  gate.classList.add("active");
  input.focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    const entry = INVITE_CODES[code];

    if (!entry) {
      error.textContent = "Incorrect code. Please try again.";
      input.value = "";
      input.focus();
      return;
    }

    CURRENT_CODE = code;
    CURRENT_SIDE = entry.side;
    CURRENT_EVENT_IDS = entry.events;
    localStorage.setItem(CODE_STORAGE_KEY, code);
    gate.classList.add("hidden");
    setTimeout(() => { gate.style.display = "none"; }, 650);
    startSite();
  });
}

function startSite() {
  const sourceEvents = CURRENT_SIDE === "groom" ? EVENTS_GROOM : EVENTS_BRIDE;
  EVENTS = CURRENT_EVENT_IDS
    .map((id) => sourceEvents.find((ev) => ev.id === id) || EVENTS_BRIDE.find((ev) => ev.id === id))
    .filter(Boolean);
  if (CURRENT_SIDE === "groom") document.body.classList.add("side-groom");

  renderLogos();
  renderEnvelope();
  renderHero();
  renderStory();
  renderTimeline();
  renderFamily();
  renderGallery();
  renderRsvpEvents();
  renderFooter();
  initEnvelope();
  initCountdown();
  initNav();
  initRsvpForm();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderLogos() {
  document.querySelectorAll(".site-logo").forEach((el) => {
    el.innerHTML = iconMarkup(el.classList.contains("footer-monogram") ? "logo-gold" : "logo");
  });
}

function renderHero() {
  document.getElementById("hero-icon").innerHTML = iconMarkup("ganesh");
  document.getElementById("hero-name-bride").textContent = WEDDING.brideFull;
  document.getElementById("hero-name-groom").textContent = WEDDING.groomFull;
  document.getElementById("hero-parent-bride").textContent = WEDDING.brideLabel;
  document.getElementById("hero-parent-groom").textContent = WEDDING.groomLabel;
  document.getElementById("hero-dates").textContent =
    CURRENT_SIDE === "groom" ? WEDDING.dateRangeGroom : WEDDING.dateRange;
}

function renderEnvelope() {
  document.getElementById("seal-btn-text").textContent = CURRENT_SIDE === "groom" ? "D&S" : "S&D";
  document.getElementById("card-monogram").textContent = CURRENT_SIDE === "groom" ? "D & S" : "S & D";
  document.getElementById("card-date").textContent =
    CURRENT_SIDE === "groom" ? WEDDING.dateRangeShortGroom : WEDDING.dateRangeShort;
  document.getElementById("envelope-names").textContent =
    CURRENT_SIDE === "groom" ? `${WEDDING.groom} & ${WEDDING.bride}` : `${WEDDING.bride} & ${WEDDING.groom}`;
}

function renderStory() {
  const headingEl = document.getElementById("story-heading");
  if (headingEl) headingEl.textContent = OUR_STORY.heading;

  // Only fill story-art with the placeholder icon if no real photo has been
  // dropped in there yet (i.e. it has no <img> child).
  const artEl = document.getElementById("story-art");
  if (artEl && !artEl.querySelector("img")) {
    artEl.innerHTML = iconMarkup("rings");
  }

  const textEl = document.getElementById("story-text");
  if (textEl) {
    const namesLine = CURRENT_SIDE === "groom"
      ? `${WEDDING.groom} &amp; ${WEDDING.bride}`
      : `${WEDDING.bride} &amp; ${WEDDING.groom}`;
    textEl.innerHTML =
      `<div class="story-names">${namesLine}</div>` +
      OUR_STORY.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  const grid = document.querySelector(".story-grid");
  if (grid && !textEl) grid.classList.add("story-grid--image-only");
}

function getEventCardSide(eventId) {
  // For LOVE and DIL (or bride codes where Mehndi is not included),
  // Vidhi (Manglik Prasango) and Sangeet (Musical Mehfil) appear on the left
  // since they are on the same day (Dec 31).
  if (CURRENT_CODE === "LOVE" || CURRENT_CODE === "DIL" || (CURRENT_SIDE === "bride" && !CURRENT_EVENT_IDS.includes("mehndi"))) {
    if (eventId === "manglik-prasango" || eventId === "musical-mehfil") return "left";
    if (eventId === "wedding") return "right";
    if (eventId === "reception") return "left";
  }

  // For MILAN (bride side with Mehndi):
  // Mehndi (Dec 30) is on the left; Vidhi & Sangeet (Dec 31) are on the right.
  // Wedding is on the left, Reception is on the right.
  if (CURRENT_SIDE === "bride") {
    if (eventId === "mehndi") return "left";
    if (eventId === "manglik-prasango" || eventId === "musical-mehfil") return "right";
    if (eventId === "wedding") return "left";
    if (eventId === "reception") return "right";
  }

  // For Groom's side (MIL, OM, ISHQ):
  // Vidhi & Sangeet (Dec 31) on the right; Wedding is on the left, Reception is on the right.
  if (eventId === "manglik-prasango" || eventId === "musical-mehfil") return "right";
  if (eventId === "wedding") return "left";
  if (eventId === "reception") return "right";

  return "left";
}

function renderTimeline() {
  document.getElementById("events-eyebrow").textContent =
    CURRENT_SIDE === "groom" ? WEDDING.eventsEyebrowGroom : WEDDING.eventsEyebrow;

  const timeline = document.getElementById("timeline");
  timeline.innerHTML = EVENTS.map((ev) => {
    const sideClass = getEventCardSide(ev.id) === "right" ? " event-card-row--right" : " event-card-row--left";
    return `
    ${ev.id === "wedding" ? `
    <div class="timeline-divider">
      <span class="timeline-divider-label">The Big Day</span>
      <span class="timeline-divider-monogram">${CURRENT_SIDE === "groom" ? "D &amp; S" : "S &amp; D"}</span>
    </div>` : ""}
    <div class="event-card-row${sideClass}" data-event-id="${ev.id}">
      <div class="event-card">
        <div class="event-day">${ev.day}, ${ev.dateLabel}</div>
        <h3 class="event-name">${ev.name}</h3>
        <p class="event-subtitle">${ev.subtitle}</p>
        ${ev.venues ? renderVenueBlocks(ev) : renderSingleVenue(ev)}
      </div>
      <div class="event-icon">${iconMarkup(ev.icon)}</div>
      <div class="event-spacer"></div>
    </div>
  `;
  }).join("");
}

function renderSingleVenue(ev) {
  return `
    <ul class="event-schedule">
      ${ev.schedule.map((s) => `<li><span class="time">${s.time}</span><span>${s.label}</span></li>`).join("")}
    </ul>
    <p class="event-venue"><strong>${ev.venue}</strong>${ev.address}</p>
    <div class="event-links">
      <a href="${ev.mapLink || mapUrl(ev.address)}" target="_blank" rel="noopener">View Map</a>
      <a href="${calendarUrl(ev)}" target="_blank" rel="noopener">Add to Calendar</a>
    </div>
  `;
}

function renderVenueBlocks(ev) {
  return ev.venues.map((v, i) => `
    ${i > 0 ? '<hr class="venue-divider" />' : ""}
    <ul class="event-schedule">
      ${v.schedule.map((s) => `<li><span class="time">${s.time}</span><span>${s.label}</span></li>`).join("")}
    </ul>
    <p class="event-venue"><strong>${v.venue}</strong>${v.address}</p>
    <div class="event-links">
      <a href="${v.mapLink || mapUrl(`${v.venue}, ${v.address}`)}" target="_blank" rel="noopener">View Map</a>
      <a href="${calendarUrl({ ...ev, address: v.address, schedule: v.schedule })}" target="_blank" rel="noopener">Add to Calendar</a>
    </div>
  `).join("");
}

function renderFamily() {
  const grid = document.getElementById("family-grid");
  const sideOrder = CURRENT_SIDE === "groom" ? ["groom", "bride"] : ["bride", "groom"];
  const family = (typeof FAMILY !== "undefined" ? FAMILY : [])
    .slice()
    .sort((a, b) => sideOrder.indexOf(a.side) - sideOrder.indexOf(b.side));
  grid.innerHTML = family
    .map((f) => `
      <div class="family-tile">
        <img src="${f.src}" alt="${f.label}" loading="lazy" />
        <span class="family-label">${f.label}</span>
      </div>
    `).join("");
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  const placeholders = Array.from({ length: GALLERY_PLACEHOLDER_COUNT })
    .map(() => `<div class="gallery-tile">${iconMarkup("camera")}</div>`)
    .join("");
  const photos = (typeof GALLERY !== "undefined" ? GALLERY : [])
    .map((g) => `<div class="gallery-tile gallery-tile--photo"><img src="${g.src}" alt="${g.alt || ""}" loading="lazy" /></div>`)
    .join("");
  grid.innerHTML = placeholders + photos;
}

function renderRsvpEvents() {
  const wrap = document.getElementById("rsvp-events");
  wrap.innerHTML = EVENTS.map((ev) => `
    <div class="event-choice" data-event-id="${ev.id}">
      <div class="event-choice-head">
        <div>
          <div class="name">${ev.name}</div>
          <div class="meta">${ev.day}, ${ev.dateLabel} </div>
        </div>
        <div class="rsvp-toggle-group">
          <label class="rsvp-toggle-btn">
            <input type="radio" name="attend_${ev.id}" value="yes" required />
            <span>Accept</span>
          </label>
          <label class="rsvp-toggle-btn">
            <input type="radio" name="attend_${ev.id}" value="no" required />
            <span>Decline</span>
          </label>
        </div>
      </div>
      <div class="event-choice-guests">
        <label for="guests_${ev.id}">Guests attending</label>
        <input type="number" id="guests_${ev.id}" name="guests_${ev.id}" min="1" value="1" />
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("input[type='radio']").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const choiceEl = e.target.closest(".event-choice");
      const attending = choiceEl.querySelector("input[value='yes']").checked;
      choiceEl.classList.toggle("is-attending", attending);
    });
  });
}

function renderFooter() {
  const blessingsEl = document.getElementById("footer-blessings");
  if (blessingsEl) {
    blessingsEl.innerHTML =
      "<strong>With Blessings,</strong>" +
      WEDDING.blessings.with_blessings.join("<br>") +
      "<strong>With Best Wishes,</strong>" +
      WEDDING.blessings.with_best_wishes;
  }

  const contacts = CURRENT_SIDE === "groom" ? WEDDING.rsvpContactsGroom : WEDDING.rsvpContacts;
  const contactsHtml = contacts.map((c) => `
    <a href="${whatsappUrl(c)}" target="_blank" rel="noopener">${iconMarkup("whatsapp")} ${c.name}<br>${formatPhone(c.phone)}</a>
  `).join("");
  document.getElementById("footer-contacts").innerHTML = contactsHtml;
}

function whatsappUrl(contact) {
  const digitsOnly = contact.phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(`Hi ${contact.name}, I have a question about Shruti & Dhruval's wedding!`);
  return `https://wa.me/${digitsOnly}?text=${text}`;
}

function formatPhone(phone) {
  // +17323746989 -> +1 (732) 374-6989
  const us = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (us) return `+1 (${us[1]}) ${us[2]}-${us[3]}`;
  // +919898637980 -> +91 98986 37980
  const india = phone.match(/^\+91(\d{5})(\d{5})$/);
  if (india) return `+91 ${india[1]} ${india[2]}`;
  return phone;
}

// ---------------------------------------------------------------------------
// Envelope intro
// ---------------------------------------------------------------------------

function initEnvelope() {
  const btn = document.getElementById("open-envelope-btn");
  const wrap = document.getElementById("envelope-wrap");
  const screen = document.getElementById("envelope-screen");
  const site = document.getElementById("site");

  btn.addEventListener("click", () => {
    if (wrap.classList.contains("is-opening")) return;
    spawnSparkles(wrap);
    wrap.classList.add("is-opening");
    screen.classList.add("is-opening");

    // Flap transition is 3s (see .envelope-flap) — wait for it to fully
    // finish, plus a brief settle pause, before the card starts rising.
    setTimeout(() => wrap.classList.add("card-rising"), 3200);

    // Card's rise transition is 3.2s (see .card), ending at 6400ms.
    setTimeout(() => wrap.classList.add("card-settle"), 6400);

    // Let the card stay visible for exactly 2 seconds (ending at 8400ms)
    // before fading out the intro screen.
    setTimeout(() => {
      screen.classList.add("hidden");
      document.body.classList.remove("no-scroll");
      site.style.display = "block";
      requestAnimationFrame(() => site.classList.add("visible"));
    }, 5400);
  });
}

function spawnSparkles(wrap) {
  for (let i = 0; i < 10; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.left = `${20 + Math.random() * 60}%`;
    s.style.top = `${30 + Math.random() * 40}%`;
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 2000);
  }
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

function initCountdown() {
  const target = new Date(WEDDING.countdownTarget).getTime();
  const days = document.getElementById("cd-days");
  const hours = document.getElementById("cd-hours");
  const mins = document.getElementById("cd-mins");
  const secs = document.getElementById("cd-secs");

  function tick() {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    days.textContent = pad(d);
    hours.textContent = pad(h);
    mins.textContent = pad(m);
    secs.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
}

function pad(n) { return String(n).padStart(2, "0"); }

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

function initNav() {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("nav-toggle");
  toggle.addEventListener("click", () => navbar.classList.toggle("menu-open"));
  navbar.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => navbar.classList.remove("menu-open"))
  );
}

// ---------------------------------------------------------------------------
// RSVP: phone lookup
// ---------------------------------------------------------------------------

// Set once a phone lookup succeeds — just used to prefill the form; the
// server independently re-checks the submitted phone against the Guests
// sheet, so nothing here needs to be trusted at submit time.
let MATCHED_GUEST = null;
// Bound to the lookup form's internal reset function once initRsvpLookup()
// runs, so initRsvpForm's submit handler can fully reset the lookup step
// after a successful RSVP without reaching into initRsvpLookup's closure.
let resetRsvpLookup = null;

function initRsvpLookup() {
  const phoneInput = document.getElementById("guest-phone");
  const lookupBtn = document.getElementById("rsvp-lookup-btn");
  const lookupStatus = document.getElementById("rsvp-lookup-status");
  const familyCard = document.getElementById("rsvp-family-card");
  const formBody = document.getElementById("rsvp-form-body");
  const nameInput = document.getElementById("guest-name");

  // The button does double duty (Find My Invite / Change Number). A single
  // flag routes its one click listener to the right handler, rather than
  // juggling addEventListener + onclick reassignment (which would both fire).
  let isLookedUp = false;

  lookupBtn.addEventListener("click", () => { isLookedUp ? resetLookup() : runLookup(); });
  phoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (!isLookedUp) runLookup(); }
  });

  async function runLookup() {
    const phone = phoneInput.value.trim();
    if (!phone) {
      lookupStatus.textContent = "Please enter your phone number.";
      lookupStatus.className = "rsvp-lookup-status show error";
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
      lookupStatus.textContent = "RSVP backend isn't connected yet. See README.md to set it up.";
      lookupStatus.className = "rsvp-lookup-status show error";
      return;
    }

    lookupBtn.disabled = true;
    lookupBtn.textContent = "Searching...";
    lookupStatus.className = "rsvp-lookup-status";
    familyCard.hidden = true;

    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=lookup&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (data.found) {
        MATCHED_GUEST = data;
        showFamilyCard(data);
        nameInput.value = [data.firstName, data.lastName].filter(Boolean).join(" ");
        lookupStatus.textContent = "";
        lookupStatus.className = "rsvp-lookup-status";
      } else {
        MATCHED_GUEST = null;
        familyCard.hidden = true;
        lookupStatus.textContent = "We couldn't find that number on our guest list — no worries, just fill in your details below and we'll add you.";
        lookupStatus.className = "rsvp-lookup-status show info";
      }
      formBody.hidden = false;
      phoneInput.readOnly = true;
      lookupBtn.textContent = "Change Number";
      lookupBtn.disabled = false;
      isLookedUp = true;
      formBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      lookupStatus.textContent = "Something went wrong looking up your number. Please try again, or just fill in the form below.";
      lookupStatus.className = "rsvp-lookup-status show error";
      formBody.hidden = false;
      lookupBtn.disabled = false;
      lookupBtn.textContent = "Find My Invite";
    }
  }

  function resetLookup() {
    MATCHED_GUEST = null;
    isLookedUp = false;
    phoneInput.value = "";
    phoneInput.readOnly = false;
    familyCard.hidden = true;
    formBody.hidden = true;
    lookupStatus.textContent = "";
    lookupStatus.className = "rsvp-lookup-status";
    lookupBtn.textContent = "Find My Invite";
    lookupBtn.disabled = false;
  }
  resetRsvpLookup = resetLookup;

  function showFamilyCard(data) {
    const members = [`${data.firstName} ${data.lastName}`.trim()];
    if (data.spouseName) members.push(data.spouseName);
    (data.children || []).forEach((c) => members.push(c));

    familyCard.innerHTML = `
      <p class="rsvp-family-eyebrow">We found your invitation</p>
      <h4 class="rsvp-family-name">${escapeHtml(data.familyLabel || "Your Family")}</h4>
      <ul class="rsvp-family-members">
        ${members.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
      </ul>
      ${data.rsvpStatus === "Responded"
        ? `<p class="rsvp-family-note">You've already responded${data.rsvpSummary ? `: ${escapeHtml(data.rsvpSummary)}` : ""}. Submitting again will update your response.</p>`
        : ""}
    `;
    familyCard.hidden = false;
  }
}

// ---------------------------------------------------------------------------
// RSVP form submission
// ---------------------------------------------------------------------------

function initRsvpForm() {
  initRsvpLookup();

  const form = document.getElementById("rsvp-form");
  const statusEl = document.getElementById("rsvp-status");
  const submitBtn = document.getElementById("rsvp-submit-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
      showStatus(statusEl, "error",
        "RSVP backend isn't connected yet. See apps-script/Code.gs and README.md to set up the Google Sheet, then paste the Web App URL into js/main.js.");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      action: "rsvp",
      side: CURRENT_SIDE,
      guestName: formData.get("guestName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      mealPreference: formData.get("mealPreference"),
      message: formData.get("message"),
      submittedAt: new Date().toISOString(),
      events: EVENTS.map((ev) => {
        const attending = formData.get(`attend_${ev.id}`) === "yes";
        return {
          id: ev.id,
          name: ev.name,
          attending: attending,
          guests: attending ? (formData.get(`guests_${ev.id}`) || "1") : "0",
        };
      }),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      showStatus(statusEl, "success", `Thank you, ${payload.guestName || "friend"}! Your RSVP has been received. We can't wait to celebrate with you.`);
      form.reset();
      document.querySelectorAll(".event-choice.is-attending").forEach((el) => el.classList.remove("is-attending"));
      if (resetRsvpLookup) resetRsvpLookup();
    } catch (err) {
      showStatus(statusEl, "error", "Something went wrong sending your RSVP. Please try again, or call us directly — see contact numbers below.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send RSVP";
    }
  });
}

function showStatus(el, type, message) {
  el.textContent = message;
  el.className = `rsvp-status show ${type}`;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Helpers: maps + calendar links
// ---------------------------------------------------------------------------

function mapUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function parseISTDateTime(dateStr, timeStr) {
  const clean = timeStr.replace(/onwards/i, "").trim();
  const m = clean.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const [y, mo, d] = dateStr.split("-").map(Number);
  let hour = 0, minute = 0;
  if (m) {
    hour = parseInt(m[1], 10) % 12;
    minute = parseInt(m[2], 10);
    if (/PM/i.test(m[3])) hour += 12;
  }
  const utcAsIst = new Date(Date.UTC(y, mo - 1, d, hour, minute));
  return new Date(utcAsIst.getTime() - (5 * 60 + 30) * 60000);
}

function formatCalDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function calendarUrl(ev) {
  const start = parseISTDateTime(ev.date, ev.schedule[0].time);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const text = encodeURIComponent(`${ev.name} — ${WEDDING.bride} & ${WEDDING.groom}'s Wedding`);
  const details = encodeURIComponent(ev.schedule.map((s) => `${s.time}: ${s.label}`).join("\n"));
  const location = encodeURIComponent(ev.address);
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${details}&location=${location}`;
}
