import { Team } from '../types';

// Helper to generate a clean, sophisticated premium circle badge
const getLogo = (initials: string, c1: string, c2: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="glow-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
        <radialGradient id="lux-${initials}" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
        </radialGradient>
      </defs>
      
      <!-- Outer premium ring -->
      <circle cx="200" cy="200" r="190" fill="url(#glow-${initials})" />
      <circle cx="200" cy="200" r="190" fill="url(#lux-${initials})" />
      
      <!-- Inner dark well -->
      <circle cx="200" cy="200" r="165" fill="#0B132B" />
      <circle cx="200" cy="200" r="165" fill="url(#glow-${initials})" opacity="0.25" />
      
      <!-- Crisp accent rings -->
      <circle cx="200" cy="200" r="150" fill="none" stroke="url(#glow-${initials})" stroke-width="3" opacity="0.6" />
      <circle cx="200" cy="200" r="140" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.25" />

      <!-- Monogram text -->
      <g transform="translate(200, 215)" text-anchor="middle" dominant-baseline="middle" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif">
        <text x="0" y="0" font-size="${initials.length > 2 ? 110 : 130}" font-weight="900" font-style="italic" fill="url(#glow-${initials})" letter-spacing="${initials.length > 2 ? 0 : 5}">${initials}</text>
        <text x="-4" y="-4" font-size="${initials.length > 2 ? 110 : 130}" font-weight="900" font-style="italic" fill="#ffffff" letter-spacing="${initials.length > 2 ? 0 : 5}">${initials}</text>
      </g>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
};

export const teams: Team[] = [
  {
    id: "hari",
    name: "Hari",
    shortName: "HK",
    colors: { primary: "#FFB75E", secondary: "#ED8F03" }, // Gold & Amber
    logoUrl: getLogo("HK", "#FFB75E", "#ED8F03"),
    championships: "1",
    captain: "Hari",
    coach: "Hari",
    owner: "Hari",
    venue: "HK Arena",
    rank: 7,
    points: 3135.6,
    pointsChange: 106,
    rankChange: 0,
    players: [
      { id: "h1", name: "Sanju Samson", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=sanju", isCaptain: true, isOverseas: false, points: 351.6 },
      { id: "h2", name: "Jasprit Bumrah", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=bumrah", isCaptain: false, isOverseas: false, points: 71 },
      { id: "h3", name: "Noor Ahmad", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=noor", isCaptain: false, isOverseas: true, points: 166 },
      { id: "h4", name: "Romario Shepherd", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=romario", isCaptain: false, isOverseas: true, points: 157 },
      { id: "h5", name: "Cameron Green", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=camgreen", isCaptain: false, isOverseas: true, points: 285 },
      { id: "h6", name: "Mukesh Kumar", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=mukesh", isCaptain: false, isOverseas: false, points: 185 },
      { id: "h7", name: "Ryan Rickelton", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=ryan", isCaptain: false, isOverseas: true, points: 220 },
      { id: "h8", name: "Ajinkya Rahane", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=rahane", isCaptain: false, isOverseas: false, points: 240 },
    ],
  },
  {
    id: "pa",
    name: "Paul x Ashmitha",
    shortName: "PA",
    colors: { primary: "#FF416C", secondary: "#FF4B2B" }, // Crimson / Pink
    logoUrl: getLogo("PA", "#FF416C", "#FF4B2B"),
    championships: "1",
    captain: "Paul",
    coach: "Ashmitha",
    owner: "TBD",
    venue: "Royal Stadium",
    rank: 6,
    points: 3362.2,
    pointsChange: 0,
    rankChange: -3,
    players: [
      { id: "pa1", name: "Yashasvi Jaiswal", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=jaiswal", isCaptain: true, isOverseas: false, points: 415.2 },
      { id: "pa2", name: "Ruturaj Gaikwad", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=ruturaj", isCaptain: false, isOverseas: false, points: 414 },
      { id: "pa3", name: "Aiden Markram", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=markram", isCaptain: false, isOverseas: true, points: 279 },
      { id: "pa4", name: "Hardik Pandya", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=hardik", isCaptain: false, isOverseas: false, points: 233 },
      { id: "pa5", name: "Shubman Gill", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=gill", isCaptain: false, isOverseas: false, points: 355 },
      { id: "pa6", name: "Priyansh Arya", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=priyansh", isCaptain: false, isOverseas: false, points: 323 },
      { id: "pa7", name: "Rohit Sharma", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=rohit", isCaptain: false, isOverseas: false, points: 204 },
      { id: "pa8", name: "Tilak Varma", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=tilak", isCaptain: false, isOverseas: false, points: 270 },
    ],
  },
  {
    id: "kp",
    name: "Kushal & Parthiv",
    shortName: "KP",
    colors: { primary: "#0575E6", secondary: "#021B79" }, // Deep Ocean
    logoUrl: getLogo("KP", "#0575E6", "#021B79"),
    championships: "2",
    captain: "Kushal",
    coach: "Parthiv",
    owner: "Unknown",
    venue: "Titans Ground",
    rank: 2,
    points: 3656.6,
    pointsChange: 91.4,
    rankChange: 0,
    players: [
      { id: "kp1", name: "Axar Patel", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=axar", isCaptain: true, isOverseas: false, points: 273.6 },
      { id: "kp2", name: "Vaibhav Sooryavanshi", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=vaibhav", isCaptain: false, isOverseas: false, points: 388 },
      { id: "kp3", name: "Ayush Mhatre", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=ayush", isCaptain: false, isOverseas: false, points: 311 },
      { id: "kp4", name: "Ramandeep Singh", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=ramandeep", isCaptain: false, isOverseas: false, points: 175 },
      { id: "kp5", name: "Mohammed Siraj", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=siraj", isCaptain: false, isOverseas: false, points: 198 },
      { id: "kp6", name: "Ayush Badoni", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=badoni", isCaptain: false, isOverseas: false, points: 224 },
      { id: "kp7", name: "Cooper Connolly", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=cooper", isCaptain: false, isOverseas: true, points: 348 },
      { id: "kp8", name: "Heinrich Klaasen", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=klaasen", isCaptain: false, isOverseas: true, points: 498 },
    ],
  },
  {
    id: "apr",
    name: "Aiyappan & Reshma",
    shortName: "APR",
    colors: { primary: "#11998E", secondary: "#38EF7D" }, // Mint Green
    logoUrl: getLogo("APR", "#38EF7D", "#11998E"), 
    championships: "0",
    captain: "Aiyappan",
    coach: "Reshma",
    owner: "TBD",
    venue: "Emerald Park",
    rank: 5,
    points: 3411.6,
    pointsChange: 93,
    rankChange: -1,
    players: [
      { id: "apr1", name: "Suryakumar Yadav", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=surya", isCaptain: true, isOverseas: false, points: 231.6 },
      { id: "apr2", name: "Rajat Patidar", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=rajat", isCaptain: false, isOverseas: false, points: 394 },
      { id: "apr3", name: "Ravindra Jadeja", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=jadeja", isCaptain: false, isOverseas: false, points: 280 },
      { id: "apr4", name: "Jamie Overton", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=jamie", isCaptain: false, isOverseas: true, points: 387 },
      { id: "apr5", name: "Washington Sundar", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=sundar", isCaptain: false, isOverseas: false, points: 247 },
      { id: "apr6", name: "Travis Head", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=travis", isCaptain: false, isOverseas: true, points: 268 },
      { id: "apr7", name: "Tristan Stubbs", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=stubbs", isCaptain: false, isOverseas: true, points: 306 },
      { id: "apr8", name: "Rovman Powell", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=rovman", isCaptain: false, isOverseas: true, points: 195 },
    ],
  },
  {
    id: "tr",
    name: "Tej & Rixith",
    shortName: "TR",
    colors: { primary: "#8E2DE2", secondary: "#4A00E0" }, // Deep Purple
    logoUrl: getLogo("TR", "#8E2DE2", "#4A00E0"),
    championships: "1",
    captain: "Tej",
    coach: "Rixith",
    owner: "TBD",
    venue: "Thunder Dome",
    rank: 3,
    points: 3559.6,
    pointsChange: 466.8,
    rankChange: 3,
    players: [
      { id: "tv1", name: "Ishan Kishan", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=ishan", isCaptain: true, isOverseas: false, points: 489.6 },
      { id: "tv2", name: "Abhishek Sharma", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=abhishek", isCaptain: false, isOverseas: false, points: 510 },
      { id: "tv3", name: "Rinku Singh", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=rinku", isCaptain: false, isOverseas: false, points: 241 },
      { id: "tv4", name: "Harsh Dubey", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=harsh", isCaptain: false, isOverseas: false, points: 265 },
      { id: "tv5", name: "Prasidh Krishna", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=prasidh", isCaptain: false, isOverseas: false, points: 336 },
      { id: "tv6", name: "Shreyas Iyer", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=shreyasiyer", isCaptain: false, isOverseas: false, points: 336 },
      { id: "tv7", name: "Sameer Rizvi", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=sameer", isCaptain: false, isOverseas: false, points: 310 },
      { id: "tv8", name: "Vaibhav Arora", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=arora", isCaptain: false, isOverseas: false, points: 210 },
    ],
  },
  {
    id: "ab",
    name: "Anjith & Basil",
    shortName: "AB",
    colors: { primary: "#FF8008", secondary: "#FFC837" }, // Orange Blaze
    logoUrl: getLogo("AB", "#FFC837", "#FF8008"),
    championships: "0",
    captain: "Anjith",
    coach: "Basil",
    owner: "TBD",
    venue: "Sun Stadium",
    rank: 1,
    points: 3877.6,
    pointsChange: 2,
    rankChange: 0,
    players: [
      { id: "ab1", name: "Quinton de Kock", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=quinton", isCaptain: true, isOverseas: true, points: 249.6 },
      { id: "ab2", name: "Varun Chakaravarthy", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=varun", isCaptain: false, isOverseas: false, points: 167 },
      { id: "ab3", name: "Dewald Brevis", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=brevis", isCaptain: false, isOverseas: true, points: 117 },
      { id: "ab4", name: "Shashank Singh", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=shashank", isCaptain: false, isOverseas: false, points: 170 },
      { id: "ab5", name: "Angkrish Raghuvanshi", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=angkrish", isCaptain: false, isOverseas: false, points: 313 },
      { id: "ab6", name: "Mohammad Shami", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=shami", isCaptain: false, isOverseas: false, points: 182 },
      { id: "ab7", name: "Lungi Ngidi", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=ngidi", isCaptain: false, isOverseas: true, points: 226 },
      { id: "ab8", name: "Krunal Pandya", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=krunal", isCaptain: false, isOverseas: false, points: 247 },
    ],
  },
  {
    id: "ds",
    name: "Deepthi & Sanjana",
    shortName: "DS",
    colors: { primary: "#ec008c", secondary: "#fc6767" }, // Pinkish
    logoUrl: getLogo("DS", "#fc6767", "#ec008c"),
    championships: "1",
    captain: "Deepthi",
    coach: "Sanjana",
    owner: "TBD",
    venue: "Pink Panther Arena",
    rank: 8,
    points: 2930.6,
    pointsChange: 8,
    rankChange: 0,
    players: [
      { id: "ds1", name: "Rishabh Pant", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=pant", isCaptain: true, isOverseas: false, points: 315.6 },
      { id: "ds2", name: "Jos Buttler", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=buttler", isCaptain: false, isOverseas: true, points: 399 },
      { id: "ds3", name: "Sunil Narine", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=narine", isCaptain: false, isOverseas: true, points: 246 },
      { id: "ds4", name: "Rashid Khan", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=rashid", isCaptain: false, isOverseas: true, points: 229 },
      { id: "ds5", name: "Ravi Bishnoi", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=bishnoi", isCaptain: false, isOverseas: false, points: 312 },
      { id: "ds6", name: "Nitish Kumar Reddy", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=nitishkr", isCaptain: false, isOverseas: false, points: 359 },
      { id: "ds7", name: "Jacob Duffy", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=duffy", isCaptain: false, isOverseas: true, points: 166 },
      { id: "ds8", name: "Shivam Dube", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=dube", isCaptain: false, isOverseas: false, points: 229 },
    ],
  },
  {
    id: "ar2",
    name: "Ani & Rakshith",
    shortName: "AR",
    colors: { primary: "#3a7bd5", secondary: "#3a6073" }, // Steel / Slate
    logoUrl: getLogo("AR", "#3a7bd5", "#3a6073"),
    championships: "0",
    captain: "Ani",
    coach: "Rakshith",
    owner: "TBD",
    venue: "Slate Ground",
    rank: 4,
    points: 3467.6,
    pointsChange: 198,
    rankChange: 1,
    players: [
      { id: "ar21", name: "Virat Kohli", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=kohli", isCaptain: true, isOverseas: false, points: 471.6 },
      { id: "ar22", name: "Sai Sudharsan", role: "Batter", imageUrl: "https://i.pravatar.cc/300?u=saisud", isCaptain: false, isOverseas: false, points: 218 },
      { id: "ar23", name: "KL Rahul", role: "WK-Batter", imageUrl: "https://i.pravatar.cc/300?u=klrahul", isCaptain: false, isOverseas: false, points: 329 },
      { id: "ar24", name: "Arshdeep Singh", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=arshdeep", isCaptain: false, isOverseas: false, points: 202 },
      { id: "ar25", name: "Kagiso Rabada", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=rabada", isCaptain: false, isOverseas: true, points: 360 },
      { id: "ar26", name: "Prince Yadav", role: "All-Rounder", imageUrl: "https://i.pravatar.cc/300?u=prince", isCaptain: false, isOverseas: false, points: 341 },
      { id: "ar27", name: "Eshan Malinga", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=eshan", isCaptain: false, isOverseas: true, points: 362 },
      { id: "ar28", name: "Bhuvneshwar Kumar", role: "Bowler", imageUrl: "https://i.pravatar.cc/300?u=bhuvi", isCaptain: false, isOverseas: false, points: 325 },
    ],
  }
];

export const chartData = [
  { day: 1, name: "Match 1", "Anjith & Basil": 2800, "Kushal & Parthiv": 2900, "Tej & Rixith": 2200, "Ani & Rakshith": 2600, "Aiyappan & Reshma": 2700, "Paul x Ashmitha": 2750, "Hari": 2100, "Deepthi & Sanjana": 2250 },
  { day: 2, name: "Match 2", "Anjith & Basil": 3000, "Kushal & Parthiv": 3100, "Tej & Rixith": 2400, "Ani & Rakshith": 2700, "Aiyappan & Reshma": 2800, "Paul x Ashmitha": 2850, "Hari": 2200, "Deepthi & Sanjana": 2400 },
  { day: 3, name: "Match 3", "Anjith & Basil": 3200, "Kushal & Parthiv": 3150, "Tej & Rixith": 2550, "Ani & Rakshith": 3000, "Aiyappan & Reshma": 3050, "Paul x Ashmitha": 2950, "Hari": 2400, "Deepthi & Sanjana": 2600 },
  { day: 4, name: "Match 4", "Anjith & Basil": 3400, "Kushal & Parthiv": 3300, "Tej & Rixith": 2900, "Ani & Rakshith": 3150, "Aiyappan & Reshma": 3200, "Paul x Ashmitha": 3100, "Hari": 2600, "Deepthi & Sanjana": 2750 },
  { day: 5, name: "Match 5", "Anjith & Basil": 3600, "Kushal & Parthiv": 3500, "Tej & Rixith": 3100, "Ani & Rakshith": 3300, "Aiyappan & Reshma": 3350, "Paul x Ashmitha": 3250, "Hari": 2900, "Deepthi & Sanjana": 2850 },
  { day: 6, name: "Current", "Anjith & Basil": 3877.6, "Kushal & Parthiv": 3656.6, "Tej & Rixith": 3559.6, "Ani & Rakshith": 3467.6, "Aiyappan & Reshma": 3411.6, "Paul x Ashmitha": 3362.2, "Hari": 3135.6, "Deepthi & Sanjana": 2930.6 },
];

export const topPerformers = [
  { name: "Abhishek Sharma", points: 207, team: "Tej & Rixith" },
  { name: "Eshan Malinga", points: 120, team: "Ani & Rakshith" },
  { name: "Nitish Rana", points: 94, team: "Hari" },
  { name: "Harsh Dubey", points: 85, team: "Tej & Rixith" },
  { name: "Sameer Rizvi", points: 65, team: "Tej & Rixith" },
  { name: "Heinrich Klaasen", points: 60, team: "Kushal & Parthiv" },
  { name: "KL Rahul", points: 56, team: "Ani & Rakshith" },
  { name: "Travis Head", points: 53, team: "Aiyappan & Reshma" },
];
