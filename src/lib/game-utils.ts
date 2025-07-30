// This map bridges the gap between data in the Supabase 'tournaments' table (which uses full names)
// and the UI/URL needs (which use short slugs and specific image paths).
// In a production app, this data would ideally be stored in the database itself.
export const gameUiDetailsMap: { [key: string]: { slug: string; imageUrl: string; title: string; topBracketPhase: string; } } = {
  'Dragon Ball FighterZ': { slug: 'dbfz', imageUrl: '/images/gameIcons/dbfz.webp', title: 'DB FighterZ', topBracketPhase: 'TOP 24' },
  'Street Fighter 6': { slug: 'sf6', imageUrl: '/images/gameIcons/sf6.webp', title: 'Street Fighter 6', topBracketPhase: 'TOP 24' },
  'Tekken 8': { slug: 'tk8', imageUrl: '/images/gameIcons/tk8.webp', title: 'Tekken 8', topBracketPhase: 'TOP 24' },
  'Guilty Gear Strive': { slug: 'ggst', imageUrl: '/images/gameIcons/ggst.webp', title: 'GG Strive', topBracketPhase: 'TOP 24' },
  'Mortal Kombat 1': { slug: 'mk1', imageUrl: '/images/gameIcons/mk1.webp', title: 'Mortal Kombat 1', topBracketPhase: 'TOP 24' },
  'Fatal Fury: City of the Wolves': { slug: 'ffcotw', imageUrl: '/images/gameIcons/ffcotw.webp', title: 'Fatal Fury: COTW', topBracketPhase: 'TOP 24' },
  'Under Night In Birth II': { slug: 'unib', imageUrl: '/images/gameIcons/unib.webp', title: 'UNIB II', topBracketPhase: 'TOP 24' },
  'THE KING OF FIGHTERS XV': { slug: 'kof15', imageUrl: '/images/gameIcons/kf15.webp', title: 'KOF XV', topBracketPhase: 'TOP 32' },
  'Samurai Shodown': { slug: 'sash', imageUrl: '/images/gameIcons/SaSh.webp', title: 'Samurai Shodown', topBracketPhase: 'TOP 32' },
};
