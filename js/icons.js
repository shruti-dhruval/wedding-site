// ---------------------------------------------------------------------------
// Small line-art SVG icon set (stroke = currentColor) used across the site.
// ---------------------------------------------------------------------------

const ICONS = {
  logo: `<img src="assets/img/DS_logo_transparent.png" alt="Shruti and Dhruval" />`,
  "logo-gold": `<img src="assets/img/DS_logo_gold.png" alt="Shruti and Dhruval" />`,
  om: `<svg viewBox="0 0 64 64"><text x="32" y="46" text-anchor="middle" font-size="48" fill="currentColor">&#2384;</text></svg>`,
  henna: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 12c-6 6-6 14 0 18 6-4 6-12 0-18z"/><path d="M20 26c-6 2-9 9-6 15 6 1 12-4 12-10"/><path d="M44 26c6 2 9 9 6 15-6 1-12-4-12-10"/><path d="M26 40c-2 6 1 11 6 12 5-1 8-6 6-12"/><circle cx="32" cy="34" r="2" fill="currentColor" stroke="none"/></svg>`,
  ganesh: `<img src="assets/img/ganesh-icon.png" alt="Ganesh" />`,
  music: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 42V16l24-4v26"/><circle cx="20" cy="44" r="6"/><circle cx="44" cy="38" r="6"/></svg>`,
  rings: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="36" r="12"/><circle cx="40" cy="36" r="12"/><path d="M32 12l4 10h-8z"/></svg>`,
  reception: `<img src="assets/img/cheers-icon.png" alt="Reception" />`,
  camera: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="20" width="44" height="30" rx="4"/><path d="M24 20l4-6h8l4 6"/><circle cx="32" cy="35" r="9"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C7 3 3 6.4 3 10.6c0 2.3 1.2 4.4 3.1 5.8L5.5 20l3.8-1.4c.9.3 1.8.4 2.7.4 5 0 9-3.4 9-8S17 3 12 3z"/><circle cx="8.5" cy="10.6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="10.6" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="10.6" r="1" fill="currentColor" stroke="none"/></svg>`,
};

function iconMarkup(key) {
  return ICONS[key] || "";
}
