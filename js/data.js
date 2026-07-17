// ---------------------------------------------------------------------------
// Wedding data. Edit this file to update event details, couple info, etc.
// ---------------------------------------------------------------------------

const WEDDING = {
  bride: "Shruti",
  groom: "Dhruval",
  brideFull: "Shruti Patel",
  groomFull: "Dhruval Shah",
  brideParents: "Mr. Rajendra Patel & Mrs. Meeta Patel",
  groomParents: "Mr. Jigish Shah & Mrs. Vaibhavi Shah",
  brideLabel: "(Daughter of Meeta & Rajendra Patel)",
  groomLabel: "(Son of Vaibhavi & Jigish Shah)",
  // Countdown target: Wedding, Hasta Melap
  countdownTarget: "2027-01-01T17:30:00+05:30",
  // Function date range shown in the hero and on the envelope card — the
  // groom's side starts a day later since there's no Mehndi Ceremony for them.
  dateRange: "December 30, 2026 – January 2, 2027",
  dateRangeGroom: "December 31, 2026 – January 2, 2027",
  dateRangeShort: "Dec 30, 2026 – Jan 2, 2027",
  dateRangeShortGroom: "Dec 31, 2026 – Jan 2, 2027",
  // Wedding Events section eyebrow — a separate label from dateRange above
  // so it can be edited independently even though the values currently match.
  eventsEyebrow: "CELEBRATE WITH US",
  eventsEyebrowGroom: "CELEBRATE WITH US",
  rsvpContacts: [
    { name: "Meeta Patel", phone: "+17323746989" },
    { name: "Rajendra Patel", phone: "+17326554680" },
  ],
  rsvpContactsGroom: [
    { name: "Vaibhavi Shah", phone: "+919898637980" },
    { name: "Jigish Shah", phone: "+919898137323" },
  ],
  blessings: {
    with_blessings: [
      "Late Bhagubhai Patel & Sushilaben Patel",
      "Late Ravjibhai Patel & Kalavatiben Patel",
    ],
    with_best_wishes: "Ved Patel, Pranav Patel, Anuj Patel, Janak Jethva",
  },
};

// EDIT ME: Replace with your own story once you're ready.
const OUR_STORY = {
  heading: "Our Story",
  paragraphs: [
    "Shruti and Dhruval's journey began with a chance introduction in May 2024 through a matrimonial group. What started as a simple friendship soon blossomed into a love neither of them expected, but one they are endlessly grateful for.",
    "Through countless conversations, shared laughter, memorable trips, and dreams of the future, they discovered in each other a true partner for life. Along the way, they discovered that the strongest relationships are built not through grand gestures, but through life's simplest moments—gentle smiles, whispered jokes, quiet understanding, thoughtful acts of kindness, and the everyday joys that make life truly meaningful.",
    "Sometimes, the right person arrives when you least expect it, turning ordinary moments into a lifetime of extraordinary memories.",
    "Now, as they begin this new chapter together and promise each other a lifetime of love, laughter, and adventures, they would be honored to have you join them in celebrating the beginning of their forever.",
  ],
};

// Each event: id, name, subtitle, date (ISO), day label, city, venue, address,
// schedule (list of {time,label}), icon key, mapQuery for Google Maps link.
// EVENTS_BRIDE is shown to guests who enter with the bride-side password.
const EVENTS_BRIDE = [
  {
    id: "mehndi",
    name: "Mehndi Ceremony",
    subtitle: "An afternoon of henna, happiness, and heartfelt moments",
    date: "2026-12-30",
    day: "Wednesday",
    dateLabel: "December 30, 2026",
    city: "Gandhinagar",
    venue: "Plot No. 691, Vastunirman Society",
    address: "Sector 21, Gandhinagar, Gujarat 382021",
    schedule: [
      { time: "2:00 PM", label: "Mehndi" },
      { time: "5:00 PM", label: "Dinner" },
    ],
    icon: "henna",
  },
  {
    id: "manglik-prasango",
    name: "Manglik Prasango",
    subtitle: "A sacred beginning filled with prayers, blessings, and cherished traditions",
    date: "2026-12-31",
    day: "Thursday",
    dateLabel: "December 31, 2026",
    city: "Gandhinagar",
    icon: "om",
    // This event spans two venues: rituals through Haldi happen at 691
    // Vastunirman Society, then the celebration moves to The Grand Vinayak.
    venues: [
      {
        venue: "Plot No. 691, Vastunirman Society",
        address: "Sector 21, Gandhinagar, Gujarat 382021",
        schedule: [
          { time: "8:00 AM", label: "Ganesh Sthapana" },
          { time: "9:00 AM", label: "Mandap Muhurat" },
          { time: "9:30 AM", label: "Varadh" },
        ],
      },
      {
        venue: "The Grand Vinayak",
        address: "Sector 21, Maharashtra Samaj Bhavan, Gandhinagar, Gujarat 382021",
        schedule: [
          { time: "10:30 AM", label: "Haldi" },
          { time: "11:30 AM", label: "Lunch" },
          { time: "1:00 PM", label: "Grah Shanti" },
          { time: "2:00 PM", label: "Mameru" },
        ],
      },
    ],
  },
  {
    id: "musical-mehfil",
    name: "Musical Mehfil",
    subtitle: "A lively night of music, dance, and garba",
    date: "2026-12-31",
    day: "Thursday",
    dateLabel: "December 31, 2026",
    city: "Gandhinagar",
    venue: "The Grand Vinayak",
    address: "Sector 21, Maharashtra Samaj Bhavan, Gandhinagar, Gujarat 382021",
    schedule: [
      { time: "6:30 PM", label: "Sangeet" },
      { time: "7:30 PM", label: "Dinner" },
    ],
    icon: "music",
  },
  {
    id: "wedding",
    name: "Wedding",
    subtitle: "A royal celebration of love, vows, and new beginnings",
    date: "2027-01-01",
    day: "Friday",
    dateLabel: "January 1, 2027",
    city: "Gandhinagar",
    venue: "Hotel Pathikashram Nilaya",
    address: "Sector 11, Opposite Civil Hospital, Gandhinagar, Gujarat 382010",
    schedule: [
      { time: "3:00 PM", label: "Jaan Aagman" },
      { time: "5:30 PM", label: "Hasta Melap" },
      { time: "7:00 PM", label: "Dinner" },
      { time: "9:00 PM", label: "Kanya Viday" },
    ],
    icon: "rings",
  },
  {
    id: "reception",
    name: "Reception",
    subtitle: "A grand evening of dance, celebration, and togetherness",
    date: "2027-01-02",
    day: "Saturday",
    dateLabel: "January 2, 2027",
    city: "Ahmedabad",
    venue: "Bel Avenir Banquet",
    address: "Sardar Patel Ring Rd, Near Club Babylon, Near Science City, Sola, Bhadaj, Ahmedabad, Gujarat 382722",
    schedule: [
      { time: "5:00 PM", label: "Sangeet" },
      { time: "7:30 PM", label: "Dinner" },
    ],
    icon: "reception",
  },
];

// EVENTS_GROOM is shown to guests who enter with the groom-side password.
// Manglik Prasango is the groom's own separate ceremony; Wedding and
// Reception are the same shared celebrations as the bride's side.
const EVENTS_GROOM = [
  {
    id: "manglik-prasango",
    name: "Manglik Prasango",
    subtitle: "A sacred beginning filled with prayers, blessings, and cherished traditions",
    date: "2026-12-31",
    day: "Thursday",
    dateLabel: "December 31, 2026",
    city: "Ahmedabad",
    icon: "om",
    // This event spans two venues: rituals through Haldi happen at 1E
    // Vishwakarma Colony, then lunch moves to the banquet hall.
    venues: [
      {
        venue: "1E Vishwakarma Colony",
        address: "Opposite Vaibhav Laxmi Temple, Kankaria, Maninagar, Gujarat 380028",
        schedule: [
          { time: "8:00 AM", label: "Mandap Muhurat" },
          { time: "8:30 AM", label: "Ganesh Sthapana" },
          { time: "9:15 AM", label: "Gotardo" },
        ],
      },
      {
        // EDIT ME: banquet hall name + address weren't filled in on the
        // source document yet — update once confirmed.
        venue: "Banquet Hall",
        address: "Address to be confirmed",
        schedule: [
          { time: "10:15 AM", label: "Mosalu" },
          { time: "11:00 AM", label: "Haldi" },
          { time: "12:00 PM", label: "Lunch" },
        ],
      },
    ],
  },
  {
    id: "wedding",
    name: "Wedding",
    subtitle: "A royal celebration of love, vows, and new beginnings",
    date: "2027-01-01",
    day: "Friday",
    dateLabel: "January 1, 2027",
    city: "Gandhinagar",
    venue: "Hotel Pathikashram Nilaya",
    address: "Sector 11, Opposite Civil Hospital, Gandhinagar, Gujarat 382010",
    schedule: [
      { time: "2:00 PM", label: "Jaan Prasthan" },
      { time: "3:00 PM", label: "Baraat" },
      { time: "5:30 PM", label: "Hasta Melap" },
      { time: "7:00 PM", label: "Dinner" },
      { time: "9:00 PM", label: "Kanya Viday" },
    ],
    icon: "rings",
  },
  {
    id: "reception",
    name: "Reception",
    subtitle: "A grand evening of dance, celebration, and togetherness",
    date: "2027-01-02",
    day: "Saturday",
    dateLabel: "January 2, 2027",
    city: "Ahmedabad",
    venue: "Bel Avenir Banquet",
    address: "Sardar Patel Ring Rd, Near Club Babylon, Near Science City, Sola, Bhadaj, Ahmedabad, Gujarat 382722",
    schedule: [
      { time: "5:00 PM", label: "Sangeet" },
      { time: "7:30 PM", label: "Dinner" },
    ],
    icon: "reception",
  },
];

// Family photos shown in the "Our Family" section, each with its own label.
// "side" controls row order: bride-side visitors see Shruti's family first,
// groom-side visitors see Dhruval's family first.
const FAMILY = [
  { src: "assets/img/family-shruti-parents.jpg", label: "Shruti's Parents<br>(Meeta & Rajendra)", side: "bride" },
  { src: "assets/img/family-shruti-grandparents-1.jpg", label: "Shruti's Paternal Grandparents<br> (Sushilaben & Bhagubhai)", side: "bride" },
  { src: "assets/img/family-shruti-grandparents-2.jpg", label: "Shruti's Maternal Grandparents<br> (Kalavatiben & Ravjibhai)", side: "bride" },
  { src: "assets/img/family-shruti-brother.jpg", label: "Shruti's Brother<br>(Ved)", side: "bride" },
  { src: "assets/img/family-dhruval-parents.jpg", label: "Dhruval's Parents<br>(Vaibhavi & Jigish)", side: "groom" },
  { src: "assets/img/family-dhruval-grandparents-1.jpg", label: "Dhruval's Paternal Grandparents<br>(Padmaben & Sureshbhai)", side: "groom" },
  { src: "assets/img/family-dhruval-grandparents-2.jpg", label: "Dhruval's Maternal Grandparents<br> (Hansaben & Pravinchandra)", side: "groom" },
  { src: "assets/img/family-dhruval-brother-sil.jpg", label: "Dhruval's Brother & Sister-in-Law<br> (Dakshal & Himadri)", side: "groom" },
];

// EDIT ME: Add more real photos here as you get them — each renders at the
// end of the gallery grid, after the "coming soon" placeholders.
const GALLERY = [
  { src: "assets/img/gallery-1.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-2.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-3.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-4.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-5.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-6.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-7.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-8.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-9.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-10.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-11.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-12.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-13.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-14.jpg", alt: "Shruti & Dhruval" },
  { src: "assets/img/gallery-15.jpg", alt: "Shruti & Dhruval" },
];

// Number of "coming soon" placeholder tiles to show alongside GALLERY photos.
const GALLERY_PLACEHOLDER_COUNT = 0;

