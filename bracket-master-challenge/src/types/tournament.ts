export interface Player {
  id: string;
  name: string;
  seed: number;
  avatarUrl?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
  players?: Player[];
}

export const tournaments: Tournament[] = [
  {
    id: 'dragon-ball-fighterz',
    name: 'Dragon Ball FighterZ',
    description: 'The ultimate Dragon Ball fighting game experience',
    imageUrl: '/images/gameIcons/dragon-ball-fighterz.webp',
    active: true,
    players: [
      { id: 'p1', name: 'Player 1', seed: 1 },
      { id: 'p2', name: 'Player 2', seed: 2 },
      { id: 'p3', name: 'Player 3', seed: 3 },
      { id: 'p4', name: 'Player 4', seed: 4 },
    ]
  },
  {
    id: 'street-fighter-6',
    name: 'Street Fighter 6',
    description: 'The latest in the legendary fighting game series',
    imageUrl: '/images/gameIcons/street-fighter-6.webp',
    active: true,
    players: [
      { id: 'p5', name: 'Player 5', seed: 1 },
      { id: 'p6', name: 'Player 6', seed: 2 },
      { id: 'p7', name: 'Player 7', seed: 3 },
      { id: 'p8', name: 'Player 8', seed: 4 },
    ]
  },
  {
    id: 'tekken-8',
    name: 'Tekken 8',
    description: 'The next chapter in the legendary fighting game franchise',
    imageUrl: '/images/gameIcons/tekken-8.webp',
    active: true,
    players: [
      { id: 'p9', name: 'Player 9', seed: 1 },
      { id: 'p10', name: 'Player 10', seed: 2 },
      { id: 'p11', name: 'Player 11', seed: 3 },
      { id: 'p12', name: 'Player 12', seed: 4 },
    ]
  },
  {
    id: 'guilty-gear-strive',
    name: 'Guilty Gear Strive',
    description: 'The latest in the Guilty Gear series',
    imageUrl: '/images/gameIcons/guilty-gear-strive.webp',
    active: false
  },
  {
    id: 'mortal-kombat-1',
    name: 'Mortal Kombat 1',
    description: 'The reboot of the legendary fighting game series',
    imageUrl: '/images/gameIcons/mortal-kombat-1.webp',
    active: false
  },
  {
    id: 'fatal-fury-city-of-the-wolves',
    name: 'Fatal Fury: City of the Wolves',
    description: 'The long-awaited return of the Fatal Fury series',
    imageUrl: '/images/gameIcons/fatal-fury-city-of-the-wolves.webp',
    active: false
  }
];

export function getTournamentById(id: string): Tournament | undefined {
  return tournaments.find(tournament => tournament.id === id);
}
