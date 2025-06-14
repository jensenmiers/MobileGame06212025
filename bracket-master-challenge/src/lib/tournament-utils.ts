import { Tournament, tournaments } from '@/types/tournament';

export function getActiveTournaments(): Tournament[] {
  return tournaments.filter((t: Tournament) => t.active);
}

export function getInactiveTournaments(): Tournament[] {
  return tournaments.filter((t: Tournament) => !t.active);
}

export { getTournamentById } from '@/types/tournament';

export { tournaments };
