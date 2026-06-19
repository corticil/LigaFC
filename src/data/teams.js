export const teams = [
  {
    id: "real-madrid",
    name: "Real Madrid",
    logoUrl: "https://crests.football-data.org/86.svg"
  },
  {
    id: "barcelona",
    name: "FC Barcelona",
    logoUrl: "https://crests.football-data.org/81.svg"
  },
  {
    id: "man-city",
    name: "Manchester City",
    logoUrl: "https://crests.football-data.org/65.svg"
  },
  {
    id: "liverpool",
    name: "Liverpool FC",
    logoUrl: "https://crests.football-data.org/64.svg"
  },
  {
    id: "psg",
    name: "Paris Saint-Germain",
    logoUrl: "https://crests.football-data.org/524.svg"
  },
  {
    id: "bayern-munich",
    name: "FC Bayern München",
    logoUrl: "https://crests.football-data.org/5.svg"
  },
  {
    id: "arsenal",
    name: "Arsenal FC",
    logoUrl: "https://crests.football-data.org/57.svg"
  },
  {
    id: "chelsea",
    name: "Chelsea FC",
    logoUrl: "https://crests.football-data.org/61.svg"
  },
  {
    id: "man-united",
    name: "Manchester United",
    logoUrl: "https://crests.football-data.org/66.svg"
  },
  {
    id: "atletico-madrid",
    name: "Atlético de Madrid",
    logoUrl: "https://crests.football-data.org/78.svg"
  },
  {
    id: "juventus",
    name: "Juventus FC",
    logoUrl: "https://crests.football-data.org/109.svg"
  },
  {
    id: "ac-milan",
    name: "AC Milan",
    logoUrl: "https://crests.football-data.org/98.svg"
  },
  {
    id: "inter-milan",
    name: "Inter de Milán",
    logoUrl: "https://crests.football-data.org/108.svg"
  },
  {
    id: "borussia-dortmund",
    name: "Borussia Dortmund",
    logoUrl: "https://crests.football-data.org/4.svg"
  },
  {
    id: "bayer-leverkusen",
    name: "Bayer 04 Leverkusen",
    logoUrl: "https://crests.football-data.org/3.svg"
  },
  {
    id: "tottenham",
    name: "Tottenham Hotspur",
    logoUrl: "https://crests.football-data.org/73.svg"
  }
];

export const getTeamById = (id) => teams.find(team => team.id === id) || null;
