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
    id: "psg",
    name: "Paris Saint-Germain",
    logoUrl: "/logos/psg.svg"
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
    id: "atletico-madrid",
    name: "Atlético de Madrid",
    logoUrl: "/logos/atletico-madrid.svg"
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

export const getTeamById = (id) => teams.find(team => team.id === id) || null;
