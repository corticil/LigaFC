export const teams = [
  {
    id: "real-madrid",
    name: "Real Madrid",
    logoUrl: "/logos/real-madrid.svg"
  },
  {
    id: "barcelona",
    name: "FC Barcelona",
    logoUrl: "/logos/barcelona.svg"
  },
  {
    id: "psg",
    name: "Paris Saint-Germain",
    logoUrl: "/logos/psg.svg"
  },
  {
    id: "atletico-madrid",
    name: "Atlético de Madrid",
    logoUrl: "/logos/atletico-madrid.svg"
  },
  {
    id: "man-city",
    name: "Manchester City",
    logoUrl: "/logos/man-city.svg"
  },
  {
    id: "liverpool",
    name: "Liverpool FC",
    logoUrl: "/logos/liverpool.svg"
  },
  {
    id: "bayern-munich",
    name: "FC Bayern München",
    logoUrl: "/logos/bayern-munich.svg"
  },
  {
    id: "arsenal",
    name: "Arsenal FC",
    logoUrl: "/logos/arsenal.svg"
  },
  {
    id: "chelsea",
    name: "Chelsea FC",
    logoUrl: "/logos/chelsea.svg"
  },
  {
    id: "man-united",
    name: "Manchester United",
    logoUrl: "/logos/man-united.svg"
  },
  {
    id: "juventus",
    name: "Juventus FC",
    logoUrl: "/logos/juventus.svg"
  },
  {
    id: "ac-milan",
    name: "AC Milan",
    logoUrl: "/logos/ac-milan.svg"
  },
  {
    id: "inter-milan",
    name: "Inter de Milán",
    logoUrl: "/logos/inter-milan.svg"
  },
  {
    id: "borussia-dortmund",
    name: "Borussia Dortmund",
    logoUrl: "/logos/borussia-dortmund.svg"
  },
  {
    id: "bayer-leverkusen",
    name: "Bayer 04 Leverkusen",
    logoUrl: "/logos/bayer-leverkusen.svg"
  },
  {
    id: "tottenham",
    name: "Tottenham Hotspur",
    logoUrl: "/logos/tottenham.svg"
  }
];

export function prioritizeTeams(teamsList) {
  if (!Array.isArray(teamsList)) return [];

  const priorityMatchers = [
    // 1. Real Madrid
    t => t?.slug === 'real-madrid' || /real\s*madrid/i.test(t?.name || t?.nombre || ''),
    // 2. Barcelona
    t => t?.slug === 'barcelona' || /barcelona/i.test(t?.name || t?.nombre || ''),
    // 3. Paris Saint-Germain
    t => t?.slug === 'psg' || /paris|psg/i.test(t?.name || t?.nombre || ''),
    // 4. Atletico Madrid
    t => t?.slug === 'atletico-madrid' || /atl[eé]tico/i.test(t?.name || t?.nombre || ''),
  ];

  const matched = [];
  const usedIndices = new Set();

  for (const matcher of priorityMatchers) {
    const idx = teamsList.findIndex((t, i) => !usedIndices.has(i) && matcher(t));
    if (idx !== -1) {
      usedIndices.add(idx);
      matched.push(teamsList[idx]);
    }
  }

  const rest = teamsList.filter((_, i) => !usedIndices.has(i));
  return [...matched, ...rest];
}

export const getTeamById = (id) => teams.find(team => team.id === id) || null;
