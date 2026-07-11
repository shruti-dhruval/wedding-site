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
  brideLabel: "Daughter of Rajendra & Meeta Patel",
  groomLabel: "Son of Jigish & Vaibhavi Shah",
  // Countdown target: Wedding, Hasta Melap
  countdownTarget: "2027-01-01T17:30:00+05:30",
  rsvpContacts: [
    { name: "Meeta Patel", phone: "+17323746989" },
    { name: "Rajendra Patel", phone: "+17326554680" },
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
    "Shruti and Dhruval's journey began with a chance introduction in May 2024. What started as a simple friendship soon blossomed into a love neither of them expected, but one they are endlessly grateful for.",
    "Through countless conversations, shared laughter, memorable trips, and dreams of the future, they discovered in each other a true partner for life. Together, they learned that the most beautiful love stories aren't always planned—they simply unfold, one beautiful moment at a time.",
    "Now, as they begin this new chapter together and promise each other a lifetime of love, laughter, adventures, and cherished memories, they would be honored to have you join them in celebrating the beginning of their forever.",
  ],
};

// Each event: id, name, subtitle, date (ISO), day label, city, venue, address,
// schedule (list of {time,label}), icon key, mapQuery for Google Maps link.
const EVENTS = [
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
      { time: "5:00 PM onwards", label: "Dinner" },
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
          { time: "11:30 AM onwards", label: "Lunch" },
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
      { time: "7:30 PM onwards", label: "Dinner" },
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
      { time: "7:00 PM onwards", label: "Dinner" },
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
      { time: "5:30 PM", label: "Sangeet" },
      { time: "7:30 PM onwards", label: "Dinner" },
    ],
    icon: "reception",
  },
];

// Family photos shown in the "Our Family" section, each with its own label.
const FAMILY = [
  { src: "assets/img/family-shruti-parents.jpg", label: "Shruti's Parents<br>(Meeta & Rajendra)" },
  { src: "assets/img/family-shruti-grandparents-1.jpg", label: "Shruti's Paternal Grandparents<br> (Sushilaben & Bhagubhai)" },
  { src: "assets/img/family-shruti-grandparents-2.jpg", label: "Shruti's Maternal Grandparents<br> (Kalavatiben & Ravjibhai)" },
  { src: "assets/img/family-shruti-brother.jpg", label: "Shruti's Brother (Ved)" },
  { src: "assets/img/family-dhruval-parents.jpg", label: "Dhruval's Parents<br>(Vaibhavi & Jigish)" },
  { src: "assets/img/family-dhruval-grandparents-1.jpg", label: "Dhruval's Paternal Grandparents<br>(Padmaben & Sureshbhai)" },
  { src: "assets/img/family-dhruval-grandparents-2.jpg", label: "Dhruval's Maternal Grandparents<br> (Hansaben & Pravinchandra)" },
  { src: "assets/img/family-dhruval-brother-sil.jpg", label: "Dhruval's Brother & Sister-in-Law<br> (Dakshal & Himadri)" },
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

