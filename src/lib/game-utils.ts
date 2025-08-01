// This map bridges the gap between data in the Supabase 'tournaments' table (which uses full names)
// and the UI/URL needs (which use short slugs and specific image paths).
// In a production app, this data would ideally be stored in the database itself.
export const gameUiDetailsMap: { [key: string]: { slug: string; imageUrl: string; title: string; topBracketPhase: string; estimatedTopBracketTime: string; topBracketStartTime: string; } } = {
  'Dragon Ball FighterZ': { slug: 'dbfz', imageUrl: '/images/gameIcons/dbfz.webp', title: 'DB FighterZ', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'TBD', topBracketStartTime: 'TBD' },
  'Street Fighter 6': { slug: 'sf6', imageUrl: '/images/gameIcons/sf6.webp', title: 'Street Fighter 6', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Saturday 7pm', topBracketStartTime: 'Sunday 7:30pm' },
  'Tekken 8': { slug: 'tk8', imageUrl: '/images/gameIcons/tk8.webp', title: 'Tekken 8', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Saturday 7pm', topBracketStartTime: 'Sunday 4pm' },
  'Guilty Gear Strive': { slug: 'ggst', imageUrl: '/images/gameIcons/ggst.webp', title: 'GG Strive', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Saturday 5pm', topBracketStartTime: 'Sunday 10am' },
  'Mortal Kombat 1': { slug: 'mk1', imageUrl: '/images/gameIcons/mk1.webp', title: 'Mortal Kombat 1', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Friday 2pm', topBracketStartTime: 'Saturday 10am' },
  'Fatal Fury: City of the Wolves': { slug: 'ffcotw', imageUrl: '/images/gameIcons/ffcotw.webp', title: 'Fatal Fury: COTW', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Saturday 7pm', topBracketStartTime: 'Sunday 1pm' },
  'Under Night In Birth II': { slug: 'unib', imageUrl: '/images/gameIcons/unib.webp', title: 'UNIB II', topBracketPhase: 'TOP 24', estimatedTopBracketTime: 'Friday 6pm', topBracketStartTime: 'Saturday 2pm' },
  'THE KING OF FIGHTERS XV': { slug: 'kof15', imageUrl: '/images/gameIcons/kf15.webp', title: 'KOF XV', topBracketPhase: 'TOP 32', estimatedTopBracketTime: 'Friday 4pm', topBracketStartTime: 'Sunday 4pm' },
  'Samurai Shodown': { slug: 'sash', imageUrl: '/images/gameIcons/SaSh.webp', title: 'Samurai Shodown', topBracketPhase: 'TOP 32', estimatedTopBracketTime: 'Friday 8pm', topBracketStartTime: 'Saturday 5pm' },
};

/**
 * Priority map for custom game tile sorting on the home page.
 * Lower numbers = higher priority (displayed first).
 * 
 * Priority Order:
 * 1. Street Fighter 6
 * 2. Tekken 8  
 * 3. Fatal Fury: City of the Wolves
 * 4. Guilty Gear Strive
 * 5. Under Night In Birth II
 * 6. Mortal Kombat 1
 * 7. THE KING OF FIGHTERS XV
 * 8. Samurai Shodown
 */
export const gamePriorityMap: { [key: string]: number } = {
  'Street Fighter 6': 1,
  'Tekken 8': 2,
  'Fatal Fury: City of the Wolves': 3,
  'Guilty Gear Strive': 4,
  'Under Night In Birth II': 5,
  'Mortal Kombat 1': 6,
  'THE KING OF FIGHTERS XV': 7,
  'Samurai Shodown': 8,
  // Dragon Ball FighterZ intentionally not included - will use fallback priority
};

/**
 * Gets the display priority for a tournament based on its name.
 * Lower numbers = higher priority (displayed first).
 * 
 * @param tournamentName - The full name of the tournament/game
 * @returns Priority number (1-8 for mapped games, 999 for unmapped games)
 * 
 * @example
 * getGamePriority('Street Fighter 6') // returns 1
 * getGamePriority('Tekken 8') // returns 2
 * getGamePriority('Dragon Ball FighterZ') // returns 999 (fallback)
 */
export function getGamePriority(tournamentName: string): number {
  if (!tournamentName || typeof tournamentName !== 'string') {
    return 999; // Fallback for invalid input
  }
  
  return gamePriorityMap[tournamentName] ?? 999; // Use nullish coalescing for fallback
}
