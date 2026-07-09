// ---------------------------------------------------------------------------
// Shruti & Dhruval — Wedding site behavior
// ---------------------------------------------------------------------------

// EDIT ME: paste your deployed Google Apps Script Web App URL here.
// See apps-script/Code.gs and README.md for setup instructions.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYrQqp3zFRLLWH_0CvlJc7gQp4TLqb75-uScrvF3hzWLFxJueubgnxUgFZ07Z3fkFRhw/exec";

document.addEventListener("DOMContentLoaded", () => {
  renderLogos();
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
});

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
  document.getElementById("hero-parent-bride").textContent = WEDDING.brideLabel;
  document.getElementById("hero-parent-groom").textContent = WEDDING.groomLabel;
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
    textEl.innerHTML =
      `<div class="story-names">${WEDDING.bride} &amp; ${WEDDING.groom}</div>` +
      OUR_STORY.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  const grid = document.querySelector(".story-grid");
  if (grid && !textEl) grid.classList.add("story-grid--image-only");
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = EVENTS.map((ev) => `
    ${ev.id === "wedding" ? `
    <div class="timeline-divider">
      <span class="timeline-divider-label">The Big Day</span>
      <span class="timeline-divider-monogram">S &amp; D</span>
    </div>` : ""}
    <div class="event-card-row${ev.id === "musical-mehfil" ? " event-card-row--right" : ""}" data-event-id="${ev.id}">
      <div class="event-card">
        <div class="event-day">${ev.day}, ${ev.dateLabel}</div>
        <h3 class="event-name">${ev.name}</h3>
        <p class="event-subtitle">${ev.subtitle}</p>
        ${ev.venues ? renderVenueBlocks(ev) : renderSingleVenue(ev)}
      </div>
      <div class="event-icon">${iconMarkup(ev.icon)}</div>
      <div class="event-spacer"></div>
    </div>
  `).join("");
}

function renderSingleVenue(ev) {
  return `
    <ul class="event-schedule">
      ${ev.schedule.map((s) => `<li><span class="time">${s.time}</span><span>${s.label}</span></li>`).join("")}
    </ul>
    <p class="event-venue"><strong>${ev.venue}</strong>${ev.address}</p>
    <div class="event-links">
      <a href="${mapUrl(ev.address)}" target="_blank" rel="noopener">View Map</a>
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
      <a href="${mapUrl(`${v.venue}, ${v.address}`)}" target="_blank" rel="noopener">View Map</a>
      <a href="${calendarUrl({ ...ev, address: v.address, schedule: v.schedule })}" target="_blank" rel="noopener">Add to Calendar</a>
    </div>
  `).join("");
}

function renderFamily() {
  const grid = document.getElementById("family-grid");
  grid.innerHTML = (typeof FAMILY !== "undefined" ? FAMILY : [])
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
        <label class="toggle">
          <input type="checkbox" class="event-attend-toggle" name="attend_${ev.id}" />
          <span class="track"></span>
          <span class="thumb"></span>
        </label>
      </div>
      <div class="event-choice-guests">
        <label for="guests_${ev.id}">Guests attending</label>
        <input type="number" id="guests_${ev.id}" name="guests_${ev.id}" min="1" value="1" />
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll(".event-attend-toggle").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      e.target.closest(".event-choice").classList.toggle("is-attending", e.target.checked);
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

  const contactsHtml = WEDDING.rsvpContacts.map((c) => `
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
  const m = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return phone;
  return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
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

    // Card's rise transition is 3.2s (see .card), ending at 6400ms — once
    // the envelope has faded away underneath it, let the card lift a little
    // further and ease back down to rest centered on screen.
    setTimeout(() => wrap.classList.add("card-settle"), 6400);

    setTimeout(() => {
      screen.classList.add("hidden");
      document.body.classList.remove("no-scroll");
      site.style.display = "block";
      requestAnimationFrame(() => site.classList.add("visible"));
    }, 8200);
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
// RSVP form submission
// ---------------------------------------------------------------------------

function initRsvpForm() {
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
      guestName: formData.get("guestName"),
      familyName: formData.get("familyName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      mealPreference: formData.get("mealPreference"),
      totalGuests: formData.get("totalGuests"),
      message: formData.get("message"),
      submittedAt: new Date().toISOString(),
      events: EVENTS.map((ev) => ({
        id: ev.id,
        name: ev.name,
        attending: formData.get(`attend_${ev.id}`) === "on",
        guests: formData.get(`guests_${ev.id}`) || "",
      })),
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
