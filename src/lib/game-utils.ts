// This map bridges the gap between data in the Supabase 'tournaments' table (which uses full names)
// and the UI/URL needs (which use short slugs and specific image paths).
// In a production app, this data would ideally be stored in the database itself.
export const gameUiDetailsMap: { [key: string]: { slug: string; imageUrl: string; title: string; } } = {
  'Dragon Ball FighterZ': { slug: 'dbfz', imageUrl: '/images/gameIcons/dbfz.webp', title: 'DB FighterZ' },
  'Street Fighter 6': { slug: 'sf6', imageUrl: '/images/gameIcons/sf6.webp', title: 'Street Fighter 6' },
  'Tekken 8': { slug: 'tk8', imageUrl: '/images/gameIcons/tk8.webp', title: 'Tekken 8' },
  'Guilty Gear Strive': { slug: 'ggst', imageUrl: '/images/gameIcons/ggst.webp', title: 'GG Strive' },
  'Mortal Kombat 1': { slug: 'mk1', imageUrl: '/images/gameIcons/mk1.webp', title: 'Mortal Kombat 1' },
  'Fatal Fury: City of the Wolves': { slug: 'ffcotw', imageUrl: '/images/gameIcons/ffcotw.webp', title: 'Fatal Fury: COTW' },
};
